import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getPaddle, openCheckout } from '../lib/Paddle'

import ToastNotification from '../components/dashboard/ToastNotification'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import UnpaidWarningBanner from '../components/dashboard/UnpaidWarningBanner'
import OverviewTab from '../components/dashboard/OverviewTab'
import LinksTab from '../components/dashboard/LinksTab'
import SubscriptionTab from '../components/dashboard/SubscriptionTab'
import SettingsTab from '../components/dashboard/SettingsTab'
import QrCodeModal from '../components/dashboard/QrCodeModal'
import DeleteConfirmModal from '../components/dashboard/DeleteConfirmModal'

import './Dashboard.css'

const API_BASE_URL = import.meta.env.VITE_BACKENDURL || 'http://localhost:8080/api/'
const SHORT_URL_BASE = import.meta.env.VITE_SHORTURL || 'http://localhost:8080'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 3,
    period: 'month',
    features: ['100 URL shortenings / mo', 'Custom short links', 'Click analytics', 'Standard support'],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 7,
    period: 'month',
    popular: true,
    features: ['Unlimited URL shortenings', 'Custom short links', 'Advanced click analytics', 'Priority 24/7 support'],
  },
]


function Dashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  // Navigation tab: 'overview' | 'links' | 'payment' | 'settings'
  const [activeTab, setActiveTab] = useState('overview')

  // User state
  const [user, setUser] = useState({
    firstName: 'User',
    lastName: 'Account',
    email: 'Signed in',
    plan: 'basic',
    paymentStatus: 'Unpaid',
    paymentMethod: 'Not Added Yet',
  })

  // URL Shortening State
  const [longUrl, setLongUrl] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [isShortening, setIsShortening] = useState(false)
  const [newShortLink, setNewShortLink] = useState(null)
  const [shortenError, setShortenError] = useState('')

  // Links List (loaded from DB via GET /api/geturls)
  const [links, setLinks] = useState([])

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Toast notification
  const [toast, setToast] = useState(null)

  // Modal states
  const [qrModalLink, setQrModalLink] = useState(null)
  const [deleteConfirmLink, setDeleteConfirmLink] = useState(null)

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Payment status modal / update state
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(user.plan === 'none' ? 'basic' : user.plan)
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '4242 •••• •••• 4242',
    expiry: '12/28',
    cvc: '•••',
    nameOnCard: 'John Francisco',
  })
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

  // Fetch user profile on mount
  useEffect(() => {
    let isMounted = true
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

        if (isMounted) {
          setUser((prev) => ({
            ...prev,
            firstName: u.firstname || u.firstName || prev.firstName,
            lastName: u.lastname || u.lastName || prev.lastName,
            email: u.email || prev.email,
            plan: u.plan || prev.plan,
            paymentStatus: u.paymentStatus || prev.paymentStatus,
            paymentMethod: u.paymentMethod || prev.paymentMethod,
          }))
        }
      } catch {
        /* ignore */
      }
    }

    fetchUserData()
    return () => {
      isMounted = false
    }
  }, [])



  // Toast auto dismiss
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Helper to fetch user specific URLs from GET /api/geturls
  const loadUserUrls = async () => {
    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/geturls`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!res.ok) return null

      const data = await res.json()
      const rawList = Array.isArray(data) ? data : (data === null ? [] : null)
      if (rawList !== null) {
        const shortUrlBase = SHORT_URL_BASE.replace(/\/$/, '')
        return rawList.map((item) => {
          const fullShortUrl = `${shortUrlBase}/${item.short_code}`
          return {
            id: item.id,
            originalUrl: item.original_url,
            shortCode: fullShortUrl,
            fullShortUrl: fullShortUrl,
            title: item.title || item.original_url.replace(/^https?:\/\//, '').split('/')[0] || 'Short Link',
            createdAt: new Date().toISOString().split('T')[0],
            clicks: 0,
            status: 'Active',
          }
        })
      }
    } catch {
      /* ignore fetch error */
    }
    return null
  }

  // Fetch user URLs on mount
  useEffect(() => {
    let isMounted = true
    loadUserUrls().then((formatted) => {
      if (isMounted && formatted !== null) {
        setLinks(formatted)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Handle URL Shorten
  const handleShorten = async (e) => {
    e.preventDefault()
    const trimmedUrl = longUrl.trim()
    const trimmedTitle = customTitle.trim()
    if (!trimmedUrl || !trimmedTitle) return

    if (user.paymentStatus !== 'Paid') {
      showToast('error', 'Active subscription required! Please update your payment status to shorten links.')
      setActiveTab('payment')
      return
    }

    setIsShortening(true)
    setShortenError('')
    setNewShortLink(null)

    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: trimmedUrl, title: trimmedTitle }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in to shorten URLs.')
        }
        throw new Error(errorText || 'Failed to shorten URL.')
      }

      const data = await res.json()
      if (!data.shortCode) {
        throw new Error('Invalid response from server.')
      }

      const generatedCode = data.shortCode
      const shortUrlBase = SHORT_URL_BASE.replace(/\/$/, '')
      const fullUrl = `${shortUrlBase}/${generatedCode}`

      const newLinkObj = {
        id: `link-${Date.now()}`,
        originalUrl: trimmedUrl,
        shortCode: fullUrl,
        fullShortUrl: fullUrl,
        title: trimmedTitle,
        createdAt: new Date().toISOString().split('T')[0],
        clicks: 0,
        status: 'Active',
      }

      setLinks((prev) => [newLinkObj, ...prev])
      setNewShortLink(newLinkObj)
      setLongUrl('')
      setCustomTitle('')
      showToast('success', 'URL shortened successfully!')

      const refreshed = await loadUserUrls()
      if (refreshed) {
        setLinks(refreshed)
      }
    } catch (err) {
      const msg = err.message || 'Failed to shorten URL.'
      setShortenError(msg)
      showToast('error', msg)
    } finally {
      setIsShortening(false)
    }
  }

  // Copy to clipboard helper
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', 'Copied short link to clipboard!')
    } catch {
      showToast('error', 'Could not copy link.')
    }
  }

  // Delete Link
  const handleDeleteLink = async (id) => {
    const numericId = Number(id)
    if (Number.isNaN(numericId)) {
      showToast('error', 'Invalid link id.')
      return
    }

    const baseUrl = API_BASE_URL.replace(/\/$/, '')
    try {
      const res = await fetch(`${baseUrl}/deleteurl`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: numericId }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to delete link.')
      }

      showToast('success', 'Short link deleted.')

      const refreshed = await loadUserUrls()
      if (refreshed !== null) {
        setLinks(refreshed)
      }
      return
    } catch (err) {
      showToast('error', err?.message || 'Failed to delete link.')
    }
  }

  const openDeleteConfirm = (link) => {
    setDeleteConfirmLink(link)
  }

  const cancelDeleteConfirm = () => {
    setDeleteConfirmLink(null)
  }

  const confirmDeleteLink = async () => {
    if (!deleteConfirmLink) return
    const linkToDelete = deleteConfirmLink
    setDeleteConfirmLink(null)
    await handleDeleteLink(linkToDelete.id)
  }

  // Handle Change Password
  const handleChangePassword = (e) => {
    e.preventDefault()
    setPasswordSuccess('')
    setPasswordError('')

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordSuccess('Password updated successfully!')
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    showToast('success', 'Your password has been changed.')
  }

  // Handle Plan Selection
  const handleSelectPlan = async(plan) => {
    if(plan.id=="basic"){
      try {
        await openCheckout(import.meta.env.VITE_BASIC_PRICE_PADDLE)
      } catch (error) {
            console.error("Failed to open Paddle checkout:", error);
      }
    }else if (plan.id=="pro")
    {
      try {
        await openCheckout(import.meta.env.VITE_PRO_PRICE_PADDLE)
      } catch (error) {
            console.error("Failed to open Paddle checkout:", error);
      }
    }
    else{
      return
    }
    setSelectedPlanForPayment(plan.id)
    console.log(`[Plan Selected] Name: ${plan.name}, Price: $${plan.price}/mo, ID: ${plan.id}`)
  }

  // Handle Payment Status Update / Plan Subscription
  const handleUpdatePayment = (e) => {
    e.preventDefault()
    console.log('[Confirm & Activate Subscription] Button clicked!')
    console.log('[Payment Details Submitted]:', {
      selectedPlan: selectedPlanForPayment,
      totalDue: selectedPlanForPayment === 'unlimited' ? '$5.00' : '$2.00',
      nameOnCard: paymentForm.nameOnCard,
      cardNumber: paymentForm.cardNumber,
      expiry: paymentForm.expiry,
      cvc: paymentForm.cvc,
    })

    setIsUpdatingPayment(true)

    setTimeout(() => {
      setUser((prev) => ({
        ...prev,
        plan: selectedPlanForPayment,
        paymentStatus: 'Paid',
        paymentMethod: `Visa ending in ${paymentForm.cardNumber.slice(-4) || '4242'}`,
      }))
      setIsUpdatingPayment(false)
      showToast('success', `Payment confirmed! Activated ${selectedPlanForPayment === 'unlimited' ? 'Unlimited Plan ($5/mo)' : 'Basic Plan ($2/mo)'}.`)
    }, 800)
  }

  // Toggle plan payment state
  const handleTogglePaymentStatus = () => {
    const newStatus = user.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'
    console.log('[Demo Toggle Status] Button clicked. Changing status to:', newStatus)
    setUser((prev) => ({
      ...prev,
      paymentStatus: newStatus,
    }))
    showToast(newStatus === 'Paid' ? 'success' : 'error', `Payment status changed to: ${newStatus}`)
  }

  // Filtered links for Links tab
  const filteredLinks = links.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="dash-container">
      {/* Toast Notification */}
      <ToastNotification toast={toast} />

      {/* Header Bar */}
      <DashboardHeader
        user={user}
        handleLogout={handleLogout}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="dash-main">
        {/* Navigation Tabs */}
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          linksCount={links.length}
          paymentStatus={user.paymentStatus}
        />

        {/* Payment Warning Banner if Unpaid */}
        {user.paymentStatus !== 'Paid' && (
          <UnpaidWarningBanner setActiveTab={setActiveTab} />
        )}

        {/* TAB 1: OVERVIEW & SHORTENER */}
        {activeTab === 'overview' && (
          <OverviewTab
            links={links}
            user={user}
            longUrl={longUrl}
            setLongUrl={setLongUrl}
            customTitle={customTitle}
            setCustomTitle={setCustomTitle}
            handleShorten={handleShorten}
            isShortening={isShortening}
            shortenError={shortenError}
            newShortLink={newShortLink}
            handleCopy={handleCopy}
            setQrModalLink={setQrModalLink}
            openDeleteConfirm={openDeleteConfirm}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 2: MY SHORT URLs LIST */}
        {activeTab === 'links' && (
          <LinksTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredLinks={filteredLinks}
            handleCopy={handleCopy}
            setQrModalLink={setQrModalLink}
            openDeleteConfirm={openDeleteConfirm}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 3: SUBSCRIPTION & PAYMENT STATUS */}
        {activeTab === 'payment' && (
          <SubscriptionTab
            user={user}
            handleTogglePaymentStatus={handleTogglePaymentStatus}
            selectedPlanForPayment={selectedPlanForPayment}
            handleSelectPlan={handleSelectPlan}
            plans={PLANS}
          />
        )}

        {/* TAB 4: SETTINGS & CHANGE PASSWORD */}
        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            handleChangePassword={handleChangePassword}
            passwordError={passwordError}
            passwordSuccess={passwordSuccess}
          />
        )}
      </main>

      {/* QR Code Modal */}
      <QrCodeModal
        qrModalLink={qrModalLink}
        onClose={() => setQrModalLink(null)}
        handleCopy={handleCopy}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        deleteConfirmLink={deleteConfirmLink}
        onCancel={cancelDeleteConfirm}
        onConfirm={confirmDeleteLink}
      />
    </div>
  )
}

export default Dashboard
