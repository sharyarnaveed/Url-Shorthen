import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../auth/AuthContext'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Grid2x2,
  Link2,
  LogOut,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import './Dashboard.css'

const API_BASE_URL = import.meta.env.VITE_BACKENDURL || 'http://localhost:8080/api/'
const SHORT_URL_BASE = import.meta.env.VITE_SHORTURL || 'http://localhost:8080'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 2,
    period: 'month',
    features: ['100 URL shortenings / mo', 'Custom short links', 'Click analytics', 'Standard support'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited Plan',
    price: 5,
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

        // backend may return an array or object
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
      } catch (err) {
        /* ignore */
      }
    }

    fetchUserData()
    return () => {
      isMounted = false
    }
  }, [])

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

  // QR Code Modal state
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

    // Require paid plan
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

  // Handle Payment Status Update / Plan Subscription
  const handleUpdatePayment = (e) => {
    e.preventDefault()
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

  // Toggle plan payment state to simulate cancellation or payment requirement
  const handleTogglePaymentStatus = () => {
    const newStatus = user.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'
    setUser((prev) => ({
      ...prev,
      paymentStatus: newStatus,
    }))
    showToast(newStatus === 'Paid' ? 'success' : 'error', `Payment status changed to: ${newStatus}`)
  }

  // Filtered links
  const filteredLinks = links.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalClicks = links.reduce((acc, curr) => acc + curr.clicks, 0)
  const topLink = [...links].sort((a, b) => b.clicks - a.clicks)[0]

  return (
    <div className="dash-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`dash-toast dash-toast--${toast.type}`}>
          <span className="dash-toast-icon">
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            <Link to="/" className="dash-logo">
              <span className="dash-logo-mark">◆</span>
              ShortLink
            </Link>
            <span className="dash-badge-demo">Dashboard</span>
          </div>

          <div className="dash-user-nav">
            <div className="dash-plan-indicator">
              <span className={`dash-status-dot dash-status-dot--${user.paymentStatus === 'Paid' ? 'active' : 'inactive'}`} />
              <span className="dash-plan-name">
                {user.paymentStatus === 'Paid'
                  ? user.plan === 'unlimited'
                    ? 'Unlimited Plan ($5/mo)'
                    : 'Basic Plan ($2/mo)'
                  : 'Payment Unpaid'}
              </span>
              <button
                type="button"
                className="dash-plan-action-btn"
                onClick={() => setActiveTab('payment')}
              >
                {user.paymentStatus === 'Paid' ? 'Manage Plan' : 'Pay Now'}
              </button>
            </div>

            <div className="dash-profile">
              <div className="dash-avatar">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="dash-profile-info">
                <span className="dash-profile-name">
                  {user.firstName} {user.lastName}
                </span>
                <span className="dash-profile-email">{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="dash-logout-btn"
              onClick={handleLogout}
              title="Log Out"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dash-main">
        {/* Navigation Tabs */}
        <nav className="dash-tabs">
          <button
            type="button"
            className={`dash-tab ${activeTab === 'overview' ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Grid2x2 size={18} />
            Overview &amp; Shorten
          </button>

          <button
            type="button"
            className={`dash-tab ${activeTab === 'links' ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            My Short URLs ({links.length})
          </button>

          <button
            type="button"
            className={`dash-tab ${activeTab === 'payment' ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 10h18M7 15h2m4 0h4M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Subscription &amp; Payment
            {user.paymentStatus !== 'Paid' && <span className="dash-tab-alert">Unpaid</span>}
          </button>

          <button
            type="button"
            className={`dash-tab ${activeTab === 'settings' ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </svg>
            Settings
          </button>
        </nav>

        {/* Payment Warning Banner if Unpaid */}
        {user.paymentStatus !== 'Paid' && (
          <div className="dash-warning-banner">
            <div className="dash-warning-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="dash-warning-text">
              <strong>Action Required: Subscription Unpaid</strong>
              <p>Your account requires an active paid plan ($2/mo Basic or $5/mo Unlimited) to shorten new links.</p>
            </div>
            <button
              type="button"
              className="dash-warning-btn"
              onClick={() => setActiveTab('payment')}
            >
              Pay Now &amp; Activate
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW & SHORTENER */}
        {activeTab === 'overview' && (
          <div className="dash-tab-content">
            {/* Stats Metrics Cards */}
            <div className="dash-metrics-grid">
              <div className="dash-metric-card">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Total Links</span>
                  <span className="dash-metric-icon"><Link2 size={18} /></span>
                </div>
                <div className="dash-metric-value">{links.length}</div>
                <div className="dash-metric-sub">Active short URLs</div>
              </div>

              <div className="dash-metric-card">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Total Clicks</span>
                  <span className="dash-metric-icon"><BarChart3 size={18} /></span>
                </div>
                <div className="dash-metric-value">{totalClicks.toLocaleString()}</div>
                <div className="dash-metric-sub">+18% this month</div>
              </div>

              <div className="dash-metric-card">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Top Link</span>
                  <span className="dash-metric-icon"><Star size={18} /></span>
                </div>
                <div className="dash-metric-value dash-metric-value--sm">
                  {topLink ? topLink.title : 'None yet'}
                </div>
                <div className="dash-metric-sub">
                  {topLink ? `${topLink.clicks} clicks` : 'Shorten a link to start'}
                </div>
              </div>

              <div className="dash-metric-card">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Payment Status</span>
                  <span className="dash-metric-icon"><CreditCard size={18} /></span>
                </div>
                <div className="dash-metric-value dash-metric-value--sm">
                  <span className={`dash-status-pill dash-status-pill--${user.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                    {user.paymentStatus}
                  </span>
                </div>
                <div className="dash-metric-sub">
                  {user.paymentStatus === 'Paid' ? `${user.plan.toUpperCase()} Plan` : 'Action required'}
                </div>
              </div>
            </div>

            {/* Shortener Tool Box */}
            <section className="dash-card dash-shortener-card">
              <div className="dash-card-header">
                <h2>Shorten a New URL</h2>
                <p>Paste your long URL below to create a clean, tracked short link.</p>
              </div>

              <form onSubmit={handleShorten} className="dash-shorten-form">
                <div className="dash-form-row">
                  <div className="dash-field flex-grow">
                    <label htmlFor="longUrl">Original Destination URL *</label>
                    <div className="dash-input-icon-wrap">
                      <svg className="dash-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <input
                        id="longUrl"
                        type="url"
                        placeholder="https://example.com/my-long-page-url-address"
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="dash-field flex-grow-sm">
                    <label htmlFor="customTitle">Title / Alias *</label>
                    <input
                      id="customTitle"
                      type="text"
                      placeholder="eg. Campaign Link"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {shortenError && <p className="dash-form-error">{shortenError}</p>}

                <button type="submit" className="dash-submit-btn" disabled={isShortening}>
                  {isShortening ? (
                    'Generating Short Link...'
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Shorten URL
                    </>
                  )}
                </button>
              </form>

              {/* Newly Created Link Result Box */}
              {newShortLink && (
                <div className="dash-result-box">
                  <div className="dash-result-header">
                    <span className="dash-result-dot" />
                    <strong>Link Generated Successfully!</strong>
                  </div>
                  <div className="dash-result-body">
                    <div className="dash-result-details">
                      <span className="dash-result-title">{newShortLink.title}</span>
                      <a href={newShortLink.fullShortUrl} target="_blank" rel="noreferrer" className="dash-result-link">
                        {newShortLink.shortCode}
                      </a>
                    </div>
                    <div className="dash-result-actions">
                      <button
                        type="button"
                        className="dash-btn-secondary"
                        onClick={() => handleCopy(newShortLink.fullShortUrl)}
                      >
                        <Copy size={16} />
                        Copy Link
                      </button>
                      <button
                        type="button"
                        className="dash-btn-secondary"
                        onClick={() => setQrModalLink(newShortLink)}
                      >
                        <QrCode size={16} />
                        QR Code
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Quick Links Preview Table */}
            <section className="dash-card">
              <div className="dash-card-header dash-flex-between">
                <div>
                  <h2>Recent Short URLs</h2>
                  <p>Here are your most recently shortened links.</p>
                </div>
                <button
                  type="button"
                  className="dash-btn-text"
                  onClick={() => setActiveTab('links')}
                >
                  View All ({links.length})
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Title / Target URL</th>
                      <th>Short Link</th>
                      <th>Created</th>
                      <th>Clicks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.slice(0, 4).map((link) => (
                      <tr key={link.id}>
                        <td>
                          <div className="dash-link-title">{link.title}</div>
                          <div className="dash-link-orig" title={link.originalUrl}>
                            {link.originalUrl}
                          </div>
                        </td>
                        <td>
                          <a
                            href={link.fullShortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="dash-short-code-link"
                          >
                            {link.shortCode}
                          </a>
                        </td>
                        <td>{link.createdAt}</td>
                        <td>
                          <span className="dash-clicks-badge">{link.clicks}</span>
                        </td>
                        <td>
                          <div className="dash-action-buttons">
                            <button
                              type="button"
                              className="dash-icon-btn"
                              onClick={() => handleCopy(link.fullShortUrl)}
                              title="Copy Short Link"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              type="button"
                              className="dash-icon-btn"
                              onClick={() => setQrModalLink(link)}
                              title="View QR Code"
                            >
                              <QrCode size={16} />
                            </button>
                            <button
                              type="button"
                              className="dash-icon-btn dash-icon-btn--danger"
                              onClick={() => openDeleteConfirm(link)}
                              title="Delete Link"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: MY SHORT URLS LIST */}
        {activeTab === 'links' && (
          <div className="dash-tab-content">
            <section className="dash-card">
              <div className="dash-card-header dash-flex-between flex-wrap gap-12">
                <div>
                  <h2>My Shortened URLs</h2>
                  <p>Manage, track, and inspect all URLs created in your account.</p>
                </div>
                <div className="dash-search-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by title or URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredLinks.length === 0 ? (
                <div className="dash-empty-state">
                  <div className="dash-empty-icon"><Search size={28} /></div>
                  <h3>No shortened URLs found</h3>
                  <p>Try searching for a different keyword or shorten your first URL!</p>
                  <button
                    type="button"
                    className="dash-submit-btn"
                    style={{ width: 'auto', margin: '16px auto 0' }}
                    onClick={() => setActiveTab('overview')}
                  >
                    + Shorten a Link Now
                  </button>
                </div>
              ) : (
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Title &amp; Destination</th>
                        <th>Short Link</th>
                        <th>Date Created</th>
                        <th>Clicks</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLinks.map((link) => (
                        <tr key={link.id}>
                          <td>
                            <div className="dash-link-title">{link.title}</div>
                            <div className="dash-link-orig" title={link.originalUrl}>
                              {link.originalUrl}
                            </div>
                          </td>
                          <td>
                            <a
                              href={link.fullShortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="dash-short-code-link"
                            >
                              {link.shortCode}
                            </a>
                          </td>
                          <td>{link.createdAt}</td>
                          <td>
                            <span className="dash-clicks-badge">{link.clicks} clicks</span>
                          </td>
                          <td>
                            <span className="dash-status-tag">Active</span>
                          </td>
                          <td>
                            <div className="dash-action-buttons">
                              <button
                                type="button"
                                className="dash-icon-btn"
                                onClick={() => handleCopy(link.fullShortUrl)}
                                title="Copy Link"
                              >
                                <Copy size={14} />
                                Copy
                              </button>
                              <button
                                type="button"
                                className="dash-icon-btn"
                                onClick={() => setQrModalLink(link)}
                                title="QR Code"
                              >
                                <QrCode size={14} />
                                QR Code
                              </button>
                              <button
                                type="button"
                                className="dash-icon-btn dash-icon-btn--danger"
                                onClick={() => openDeleteConfirm(link)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 3: SUBSCRIPTION & PAYMENT STATUS */}
        {activeTab === 'payment' && (
          <div className="dash-tab-content">
            <div className="dash-grid-2col">
              {/* Current Status Card */}
              <section className="dash-card">
                <div className="dash-card-header">
                  <h2>Subscription &amp; Payment Status</h2>
                  <p>Manage your account subscription, payment method, and plan billing.</p>
                </div>

                <div className="dash-status-box">
                  <div className="dash-status-header">
                    <div>
                      <span className="dash-status-label">Current Status</span>
                      <h3 className="dash-status-heading">
                        {user.paymentStatus === 'Paid' ? 'Active Paid Subscription' : 'Payment Required'}
                      </h3>
                    </div>
                    <span className={`dash-status-pill dash-status-pill--${user.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                      {user.paymentStatus}
                    </span>
                  </div>

                  <div className="dash-status-details">
                    <div className="dash-detail-row">
                      <span>Plan:</span>
                      <strong>
                        {user.plan === 'unlimited'
                          ? 'Unlimited Plan ($5/month)'
                          : user.plan === 'basic'
                          ? 'Basic Plan ($2/month)'
                          : 'No Active Plan'}
                      </strong>
                    </div>
                    <div className="dash-detail-row">
                      <span>Payment Method:</span>
                      <strong>{user.paymentMethod}</strong>
                    </div>
                    <div className="dash-detail-row">
                      <span>Billing Cycle:</span>
                      <strong>Monthly Auto-Renewal</strong>
                    </div>
                  </div>

                  <div className="dash-status-toggle-wrap">
                    <button
                      type="button"
                      className="dash-btn-secondary"
                      onClick={handleTogglePaymentStatus}
                    >
                      Demo Toggle Status: ({user.paymentStatus === 'Paid' ? 'Set Unpaid' : 'Set Paid'})
                    </button>
                  </div>
                </div>

                {/* Plan Options Selector */}
                <div className="dash-plans-selector">
                  <h3>Select Plan</h3>
                  <div className="dash-plans-list">
                    {PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        className={`dash-plan-card ${selectedPlanForPayment === plan.id ? 'dash-plan-card--selected' : ''}`}
                        onClick={() => setSelectedPlanForPayment(plan.id)}
                      >
                        <div className="dash-plan-card-head">
                          <div>
                            <h4>{plan.name}</h4>
                            <span className="dash-plan-price">${plan.price} / month</span>
                          </div>
                          <input
                            type="radio"
                            name="selectedPlan"
                            checked={selectedPlanForPayment === plan.id}
                            onChange={() => setSelectedPlanForPayment(plan.id)}
                          />
                        </div>
                        <ul className="dash-plan-features-list">
                          {plan.features.map((feat) => (
                            <li key={feat}>
                            <Check size={14} />
                            {feat}
                          </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Payment Checkout Form */}
              <section className="dash-card">
                <div className="dash-card-header">
                  <h2>Update Payment Method</h2>
                  <p>Enter your payment details to confirm subscription and activate link shortening.</p>
                </div>

                <form onSubmit={handleUpdatePayment} className="dash-payment-form">
                  <div className="dash-field">
                    <label htmlFor="nameOnCard">Name on Card</label>
                    <input
                      id="nameOnCard"
                      type="text"
                      value={paymentForm.nameOnCard}
                      onChange={(e) => setPaymentForm({ ...paymentForm, nameOnCard: e.target.value })}
                      required
                    />
                  </div>

                  <div className="dash-field">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      id="cardNumber"
                      type="text"
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="dash-form-row">
                    <div className="dash-field flex-grow">
                      <label htmlFor="expiry">Expiry Date</label>
                      <input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={paymentForm.expiry}
                        onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                        required
                      />
                    </div>

                    <div className="dash-field flex-grow">
                      <label htmlFor="cvc">CVC / CVV</label>
                      <input
                        id="cvc"
                        type="text"
                        placeholder="123"
                        value={paymentForm.cvc}
                        onChange={(e) => setPaymentForm({ ...paymentForm, cvc: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="dash-payment-summary">
                    <span>Total Due Now:</span>
                    <strong>${selectedPlanForPayment === 'unlimited' ? '5.00' : '2.00'}</strong>
                  </div>

                  <button type="submit" className="dash-submit-btn" disabled={isUpdatingPayment}>
                    {isUpdatingPayment ? (
                      'Processing Payment...'
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        Confirm &amp; Activate Subscription
                      </>
                    )}
                  </button>

                  <p className="dash-secure-note">
                    <ShieldCheck size={14} />
                    256-Bit SSL Encrypted &amp; Secure Payment Processing
                  </p>
                </form>
              </section>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & CHANGE PASSWORD */}
        {activeTab === 'settings' && (
          <div className="dash-tab-content">
            <div className="dash-grid-2col">
              {/* Account Info Profile */}
              <section className="dash-card">
                <div className="dash-card-header">
                  <h2>Account Details</h2>
                  <p>Your basic profile information.</p>
                </div>

                <div className="dash-profile-card-body">
                  <div className="dash-info-group">
                    <label>First Name</label>
                    <div className="dash-info-value">{user.firstName}</div>
                  </div>
                  <div className="dash-info-group">
                    <label>Last Name</label>
                    <div className="dash-info-value">{user.lastName}</div>
                  </div>
                  <div className="dash-info-group">
                    <label>Email Address</label>
                    <div className="dash-info-value">{user.email}</div>
                  </div>
                  <div className="dash-info-group">
                    <label>Current Plan</label>
                    <div className="dash-info-value">
                      {user.plan === 'unlimited' ? 'Unlimited ($5/mo)' : 'Basic ($2/mo)'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Change Password Form */}
              <section className="dash-card">
                <div className="dash-card-header">
                  <h2>Change Password</h2>
                  <p>Update your account security password.</p>
                </div>

                <form onSubmit={handleChangePassword} className="dash-password-form">
                  <div className="dash-field">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="dash-field">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password (min 8 chars)"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="dash-field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      minLength={8}
                      required
                    />
                  </div>

                  {passwordError && <p className="dash-form-error">{passwordError}</p>}
                  {passwordSuccess && <p className="dash-form-success">{passwordSuccess}</p>}

                  <button type="submit" className="dash-submit-btn">
                    Update Password
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal Popup */}
      {qrModalLink && (
        <div className="dash-modal-backdrop" onClick={() => setQrModalLink(null)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3>QR Code Preview</h3>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setQrModalLink(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="dash-modal-body">
              <div className="dash-qr-preview">
                <QRCodeSVG
                  value={qrModalLink.fullShortUrl || ''}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  marginSize={2}
                />
              </div>
              <p className="dash-qr-title">{qrModalLink.title}</p>
              <code className="dash-qr-url">{qrModalLink.fullShortUrl}</code>

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="dash-submit-btn"
                  onClick={() => handleCopy(qrModalLink.fullShortUrl)}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmLink && (
        <div className="dash-modal-backdrop" onClick={cancelDeleteConfirm}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3>Delete Short Link?</h3>
              <button
                type="button"
                className="dash-modal-close"
                onClick={cancelDeleteConfirm}
              >
                <X size={18} />
              </button>
            </div>
            <div className="dash-modal-body">
              <p className="dash-delete-confirm-text">
                Are you sure you want to delete <strong>{deleteConfirmLink.title}</strong>?
                This action cannot be undone.
              </p>
              <code className="dash-qr-url">{deleteConfirmLink.fullShortUrl}</code>

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="dash-btn-secondary"
                  onClick={cancelDeleteConfirm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dash-submit-btn"
                  onClick={confirmDeleteLink}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
