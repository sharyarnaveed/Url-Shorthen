import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

const API_BASE_URL = import.meta.env.VITE_BACKENDURL || 'http://localhost:8080/api/'
const SHORT_URL_BASE = import.meta.env.VITE_SHORTURL || 'http://localhost:8080'

const DashboardContext = createContext(null)

export function DashboardProvider({ children }) {
  const [user, setUser] = useState({
    firstName: 'User',
    lastName: 'Account',
    email: 'Signed in',
    plan: 'basic',
    planselected: '',
    amount: '',
    paymentDate: '',
    paymentExpire: '',
    paymentStatus: 'Unpaid',
    paymentMethod: 'Not Added Yet',
  })

  const [links, setLinks] = useState([])
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingLinks, setIsLoadingLinks] = useState(true)

  // Track whether we've already fetched so we don't re-fetch on re-mount
  const hasFetchedUser = useRef(false)
  const hasFetchedLinks = useRef(false)

  // Fetch user profile — only once across all mounts
  useEffect(() => {
    let active = true

    const fetchUserData = async () => {
      try {
        const base = API_BASE_URL.replace(/\/$/, '')
        const res = await fetch(`${base}/getuserdata`, {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) return
        const data = await res.json()
        const u = Array.isArray(data) ? data[0] : data
        if (!u) return

        if (active) {
          const rawStatus = (u.status || u.paymentStatus || '').toString().trim().toLowerCase()
          const isPaid = rawStatus === 'paid'
          const planName = u.planselected || u.plan || 'basic'

          setUser((prev) => ({
            ...prev,
            firstName: u.firstname || u.firstName || prev.firstName,
            lastName: u.lastname || u.lastName || prev.lastName,
            email: u.email || prev.email,
            plan: planName,
            planselected: u.planselected || prev.planselected,
            amount: u.amount || prev.amount,
            paymentDate: u.payment_date || u.paymentDate || prev.paymentDate,
            paymentExpire: u.payment_expire || u.paymentExpire || prev.paymentExpire,
            paymentStatus: isPaid ? 'Paid' : (u.paymentStatus || prev.paymentStatus),
            status: u.status || prev.status,
            paymentMethod: isPaid ? 'Paddle Checkout (Active)' : prev.paymentMethod,
          }))
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setIsLoadingUser(false)
      }
    }

    fetchUserData()
    return () => { active = false }
  }, [])

  // Helper to format raw URL data
  const formatUrls = useCallback((rawList) => {
    const shortUrlBase = SHORT_URL_BASE.replace(/\/$/, '')
    return rawList.map((item) => {
      const fullShortUrl = `${shortUrlBase}/${item.short_code}`
      const analyticsList = Array.isArray(item.analytics)
        ? item.analytics
        : (Array.isArray(item.Analytics) ? item.Analytics : [])

      const totalClicks = analyticsList.reduce((acc, curr) => {
        const count = curr.Clicks ?? curr.clicks ?? curr.ClicksCount ?? 0
        return acc + Number(count)
      }, 0)

      return {
        id: item.id,
        originalUrl: item.original_url,
        shortCode: item.short_code || fullShortUrl,
        rawShortCode: item.short_code,
        fullShortUrl: fullShortUrl,
        title: item.title || item.original_url.replace(/^https?:\/\//, '').split('/')[0] || 'Short Link',
        createdAt: new Date().toISOString().split('T')[0],
        clicks: totalClicks,
        analytics: analyticsList,
        status: 'Active',
      }
    })
  }, [])

  // Load user URLs — only once across all mounts
  const loadUserUrls = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/geturls`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!res.ok) return null

      const data = await res.json()
      const rawList = Array.isArray(data) ? data : (data === null ? [] : null)
      if (rawList !== null) {
        return formatUrls(rawList)
      }
    } catch {
      /* ignore fetch error */
    }
    return null
  }, [formatUrls])

  useEffect(() => {
    let active = true

    loadUserUrls().then((formatted) => {
      if (active && formatted !== null) {
        setLinks(formatted)
      }
    }).finally(() => {
      if (active) setIsLoadingLinks(false)
    })

    return () => { active = false }
  }, [loadUserUrls])

  // Refresh links (for after shorten/delete operations)
  const refreshLinks = useCallback(async () => {
    const refreshed = await loadUserUrls()
    if (refreshed !== null) {
      setLinks(refreshed)
    }
    return refreshed
  }, [loadUserUrls])

  const value = useMemo(() => ({
    user,
    setUser,
    links,
    setLinks,
    isLoadingUser,
    isLoadingLinks,
    loadUserUrls,
    refreshLinks,
    formatUrls,
  }), [user, links, isLoadingUser, isLoadingLinks, loadUserUrls, refreshLinks, formatUrls])

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

export default DashboardContext
