import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useDashboard } from '../context/DashboardContext'
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
import AnalyticsModal from '../components/dashboard/AnalyticsModal'

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

  // Shared context — data persists across route changes
  const { user, setUser, links, setLinks, isLoadingUser, isLoadingLinks, refreshLinks } = useDashboard()

  // Navigation tab: 'overview' | 'links' | 'payment' | 'settings'
  const [activeTab, setActiveTab] = useState('overview')

  // URL Shortening State
  const [longUrl, setLongUrl] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [isShortening, setIsShortening] = useState(false)
  const [newShortLink, setNewShortLink] = useState(null)
  const [shortenError, setShortenError] = useState('')

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Toast notification
  const [toast, setToast] = useState(null)

  // Modal states
  const [qrModalLink, setQrModalLink] = useState(null)
  const [deleteConfirmLink, setDeleteConfirmLink] = useState(null)
  const [analyticsModalLink, setAnalyticsModalLink] = useState(null)

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

  // Toast auto dismiss
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  // Handle URL Shorten
  const handleShorten = useCallback(async (e) => {
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

      await refreshLinks()
    } catch (err) {
      const msg = err.message || 'Failed to shorten URL.'
      setShortenError(msg)
      showToast('error', msg)
    } finally {
      setIsShortening(false)
    }
  }, [longUrl, customTitle, user.paymentStatus, showToast, setLinks, refreshLinks])

  // Copy to clipboard helper
  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', 'Copied short link to clipboard!')
    } catch {
      showToast('error', 'Could not copy link.')
    }
  }, [showToast])

  // Delete Link
  const handleDeleteLink = useCallback(async (id) => {
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
      await refreshLinks()
      return
    } catch (err) {
      showToast('error', err?.message || 'Failed to delete link.')
    }
  }, [showToast, refreshLinks])

  const openDeleteConfirm = useCallback((link) => {
    setDeleteConfirmLink(link)
  }, [])

  const cancelDeleteConfirm = useCallback(() => {
    setDeleteConfirmLink(null)
  }, [])

  const confirmDeleteLink = useCallback(async () => {
    if (!deleteConfirmLink) return
    const linkToDelete = deleteConfirmLink
    setDeleteConfirmLink(null)
    await handleDeleteLink(linkToDelete.id)
  }, [deleteConfirmLink, handleDeleteLink])

  // Handle Change Password
  const handleChangePassword = useCallback((e) => {
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
  }, [passwordForm, showToast])

  // Navigate to Analytics Detail Page
  const handleOpenAnalytics = useCallback((link) => {
    const code = link.rawShortCode || (link.shortCode ? link.shortCode.split('/').pop() : link.id)
    navigate(`/analytics/${code}`, { state: { link } })
  }, [navigate])

  // Handle Plan Selection
  const handleSelectPlan = useCallback(async (plan) => {
    let priceId = ''
    if (plan.id === 'basic') {
      priceId = import.meta.env.VITE_BASIC_PRICE_PADDLE
    } else if (plan.id === 'pro') {
      priceId = import.meta.env.VITE_PRO_PRICE_PADDLE
    } else {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/getuserid`, {
        credentials: 'include',
      })
      const userId = await res.json()
      await openCheckout(priceId, userId)
    } catch (error) {
      console.error("Failed to open Paddle checkout:", error);
    }

    setSelectedPlanForPayment(plan.id)
    console.log(`[Plan Selected] Name: ${plan.name}, Price: $${plan.price}/mo, ID: ${plan.id}`)
  }, [])

  // Handle Payment Status Update / Plan Subscription
  const handleUpdatePayment = useCallback((e) => {
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
  }, [selectedPlanForPayment, paymentForm, setUser, showToast])

  // Toggle plan payment state
  const handleTogglePaymentStatus = useCallback(() => {
    const newStatus = user.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'
    console.log('[Demo Toggle Status] Button clicked. Changing status to:', newStatus)
    setUser((prev) => ({
      ...prev,
      paymentStatus: newStatus,
    }))
    showToast(newStatus === 'Paid' ? 'success' : 'error', `Payment status changed to: ${newStatus}`)
  }, [user.paymentStatus, setUser, showToast])

  // Filtered links for Links tab — memoized to avoid recalculation on every render
  const filteredLinks = useMemo(() =>
    links.filter(
      (l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [links, searchQuery]
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
            onOpenAnalytics={handleOpenAnalytics}
            setActiveTab={setActiveTab}
            isLoading={isLoadingLinks}
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
            onOpenAnalytics={handleOpenAnalytics}
            setActiveTab={setActiveTab}
            isLoading={isLoadingLinks}
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
