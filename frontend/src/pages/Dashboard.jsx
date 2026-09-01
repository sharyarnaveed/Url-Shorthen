import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'

const API_BASE_URL = import.meta.env.VITE_BACKENDURL || 'http://localhost:8080/api/'

const INITIAL_LINKS = [
  {
    id: 'link-1',
    originalUrl: 'https://github.com/sharyarnaveed/Url-Shorthen',
    shortCode: 'short.link/gh-repo',
    fullShortUrl: 'http://localhost:8080/gh-repo',
    title: 'GitHub Repository',
    createdAt: '2026-08-28',
    clicks: 342,
    status: 'Active',
  },
  {
    id: 'link-2',
    originalUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    shortCode: 'short.link/js-docs',
    fullShortUrl: 'http://localhost:8080/js-docs',
    title: 'MDN JavaScript Docs',
    createdAt: '2026-08-30',
    clicks: 189,
    status: 'Active',
  },
  {
    id: 'link-3',
    originalUrl: 'https://react.dev/reference/react/useState',
    shortCode: 'short.link/react-hooks',
    fullShortUrl: 'http://localhost:8080/react-hooks',
    title: 'React Hooks Reference',
    createdAt: '2026-09-01',
    clicks: 95,
    status: 'Active',
  },
]

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

  // Navigation tab: 'overview' | 'links' | 'payment' | 'settings'
  const [activeTab, setActiveTab] = useState('overview')

  // User state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shortlink_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        /* empty */
      }
    }
    return {
      firstName: 'John',
      lastName: 'Francisco',
      email: 'johnfrans@gmail.com',
      plan: 'basic',
      paymentStatus: 'Unpaid',
      paymentMethod: 'Not Added Yet',
    }
  })

  // URL Shortening State
  const [longUrl, setLongUrl] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [isShortening, setIsShortening] = useState(false)
  const [newShortLink, setNewShortLink] = useState(null)
  const [shortenError, setShortenError] = useState('')

  // Links List
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem('shortlink_user_links')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        /* empty */
      }
    }
    return INITIAL_LINKS
  })

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Toast notification
  const [toast, setToast] = useState(null)

  // QR Code Modal state
  const [qrModalLink, setQrModalLink] = useState(null)

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

  // Persist user and links to localStorage
  useEffect(() => {
    localStorage.setItem('shortlink_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    localStorage.setItem('shortlink_user_links', JSON.stringify(links))
  }, [links])

  // Toast auto dismiss
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  // Handle URL Shorten
  const handleShorten = async (e) => {
    e.preventDefault()
    if (!longUrl.trim()) return

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
      let generatedCode = ''
      let fullUrl = ''

      // Attempt to hit backend endpoint if available
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/shorten`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: longUrl }),
        })
        if (res.ok) {
          const data = await res.json()
          generatedCode = data.shortCode
          fullUrl = `${window.location.origin.replace(':5173', ':8080')}/${generatedCode}`
        }
      } catch {
        /* Backend unreachable, fallback to client code generation */
      }

      if (!generatedCode) {
        generatedCode = Math.random().toString(36).substring(2, 8)
        fullUrl = `http://localhost:8080/${generatedCode}`
      }

      const newLinkObj = {
        id: `link-${Date.now()}`,
        originalUrl: longUrl,
        shortCode: `short.link/${generatedCode}`,
        fullShortUrl: fullUrl,
        title: customTitle.trim() || longUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Short Link',
        createdAt: new Date().toISOString().split('T')[0],
        clicks: 0,
        status: 'Active',
      }

      setLinks((prev) => [newLinkObj, ...prev])
      setNewShortLink(newLinkObj)
      setLongUrl('')
      setCustomTitle('')
      showToast('success', 'URL shortened successfully!')
    } catch (err) {
      setShortenError(err.message || 'Failed to shorten URL.')
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
  const handleDeleteLink = (id) => {
    setLinks((prev) => prev.filter((item) => item.id !== id))
    showToast('success', 'Short link deleted.')
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
          <span className="dash-toast-icon">{toast.type === 'error' ? '⚠️' : '✓'}</span>
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
              onClick={() => navigate('/login')}
              title="Log Out"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M16 17l5-5-5-5M21 12H9M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
            <div className="dash-warning-icon">⚠️</div>
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
                  <span className="dash-metric-icon">🔗</span>
                </div>
                <div className="dash-metric-value">{links.length}</div>
                <div className="dash-metric-sub">Active short URLs</div>
              </div>

              <div className="dash-metric-card">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Total Clicks</span>
                  <span className="dash-metric-icon">📈</span>
                </div>
                <div className="dash-metric-value">{totalClicks.toLocaleString()}</div>
                <div className="dash-metric-sub">+18% this month</div>
              </div>

              <div className="dash-metric-card">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Top Link</span>
                  <span className="dash-metric-icon">⭐</span>
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
                  <span className="dash-metric-icon">💳</span>
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
                    <label htmlFor="customTitle">Title / Alias (Optional)</label>
                    <input
                      id="customTitle"
                      type="text"
                      placeholder="eg. Campaign Link"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>
                </div>

                {shortenError && <p className="dash-form-error">{shortenError}</p>}

                <button type="submit" className="dash-submit-btn" disabled={isShortening}>
                  {isShortening ? 'Generating Short Link...' : 'Shorten URL ✨'}
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
                        📋 Copy Link
                      </button>
                      <button
                        type="button"
                        className="dash-btn-secondary"
                        onClick={() => setQrModalLink(newShortLink)}
                      >
                        📱 QR Code
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
                  View All ({links.length}) →
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
                              📋
                            </button>
                            <button
                              type="button"
                              className="dash-icon-btn"
                              onClick={() => setQrModalLink(link)}
                              title="View QR Code"
                            >
                              📱
                            </button>
                            <button
                              type="button"
                              className="dash-icon-btn dash-icon-btn--danger"
                              onClick={() => handleDeleteLink(link.id)}
                              title="Delete Link"
                            >
                              🗑️
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
                  <div className="dash-empty-icon">🔍</div>
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
                                📋 Copy
                              </button>
                              <button
                                type="button"
                                className="dash-icon-btn"
                                onClick={() => setQrModalLink(link)}
                                title="QR Code"
                              >
                                📱 QR Code
                              </button>
                              <button
                                type="button"
                                className="dash-icon-btn dash-icon-btn--danger"
                                onClick={() => handleDeleteLink(link.id)}
                                title="Delete"
                              >
                                🗑️
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
                            <li key={feat}>✓ {feat}</li>
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
                    {isUpdatingPayment ? 'Processing Payment...' : 'Confirm & Activate Subscription 🔒'}
                  </button>

                  <p className="dash-secure-note">
                    🔒 256-Bit SSL Encrypted &amp; Secure Payment Processing
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
                ✕
              </button>
            </div>
            <div className="dash-modal-body">
              <div className="dash-qr-preview">
                {/* SVG mock QR Code */}
                <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="200" height="200" fill="white" rx="16" />
                  <rect x="20" y="20" width="50" height="50" fill="#0d9488" rx="8" />
                  <rect x="30" y="30" width="30" height="30" fill="white" rx="4" />
                  <rect x="38" y="38" width="14" height="14" fill="#0d9488" rx="2" />
                  
                  <rect x="130" y="20" width="50" height="50" fill="#0d9488" rx="8" />
                  <rect x="140" y="30" width="30" height="30" fill="white" rx="4" />
                  <rect x="148" y="38" width="14" height="14" fill="#0d9488" rx="2" />

                  <rect x="20" y="130" width="50" height="50" fill="#0d9488" rx="8" />
                  <rect x="30" y="140" width="30" height="30" fill="white" rx="4" />
                  <rect x="38" y="148" width="14" height="14" fill="#0d9488" rx="2" />

                  <rect x="85" y="20" width="30" height="15" fill="#111827" rx="3" />
                  <rect x="85" y="45" width="15" height="25" fill="#111827" rx="3" />
                  <rect x="110" y="85" width="25" height="15" fill="#111827" rx="3" />
                  <rect x="85" y="110" width="30" height="20" fill="#111827" rx="3" />
                  <rect x="140" y="110" width="40" height="20" fill="#111827" rx="3" />
                  <rect x="130" y="140" width="20" height="40" fill="#111827" rx="3" />
                  <rect x="160" y="160" width="20" height="20" fill="#0d9488" rx="3" />
                  <rect x="90" y="150" width="25" height="30" fill="#111827" rx="3" />
                </svg>
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
    </div>
  )
}

export default Dashboard
