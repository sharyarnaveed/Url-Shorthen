import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Copy,
  ExternalLink,
  Globe,
  Layers,
  MousePointerClick,
  RefreshCw,
  Search,
  Users,
  Zap,
} from 'lucide-react'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import ToastNotification from '../components/dashboard/ToastNotification'
import { SkeletonMetricsGrid, SkeletonBarChart, SkeletonTable } from '../components/dashboard/SkeletonLoaders'
import IPMap from '../components/dashboard/IPMap'
import { useAuth } from '../auth/AuthContext'
import { useDashboard } from '../context/DashboardContext'
import './Dashboard.css'

export function AnalyticsPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  
  // Use shared dashboard context
  const { user, links, isLoadingLinks } = useDashboard()

  const [linkData, setLinkData] = useState(location.state?.link || null)
  const [error, setError] = useState('')
  const [ipSearchQuery, setIpSearchQuery] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  // Toast auto dismiss
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  // Extract link data from context if not available in location state
  useEffect(() => {
    if (!code) {
      setError('No short code provided.')
      return
    }

    if (!location.state?.link && !isLoadingLinks) {
      const match = links.find(
        (item) =>
          item.rawShortCode === code ||
          item.shortCode === code ||
          item.shortCode === decodeURIComponent(code) ||
          String(item.id) === code
      )
      
      if (match) {
        setLinkData(match)
        setError('')
      } else {
        setError(`No shortened URL found for code "${code}".`)
      }
    }
  }, [code, location.state, links, isLoadingLinks])

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', 'Copied short link to clipboard!')
    } catch {
      showToast('error', 'Could not copy link.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Aggregate analytics data by IP address
  const rawAnalytics = linkData && Array.isArray(linkData.analytics) ? linkData.analytics : []
  const ipMap = {}
  let computedTotalClicks = 0

  rawAnalytics.forEach((item) => {
    const ip = item.IPAddress || item.ipaddress || item.ipAddress || 'Direct / Local IP'
    const clicks = Number(item.Clicks ?? item.clicks ?? item.ClicksCount ?? 1)
    const timestamp = item.Timestamp || item.timestamp || ''

    computedTotalClicks += clicks

    if (!ipMap[ip]) {
      ipMap[ip] = {
        ip,
        clicks: 0,
        timestamps: [],
      }
    }
    ipMap[ip].clicks += clicks
    if (timestamp) ipMap[ip].timestamps.push(timestamp)
  })

  const ipList = Object.values(ipMap).sort((a, b) => b.clicks - a.clicks)
  const totalClicks = computedTotalClicks > 0 ? computedTotalClicks : linkData?.clicks || 0
  const uniqueIPs = ipList.length
  const topIP = ipList[0] ? ipList[0].ip : 'No Data'
  const topIPClicks = ipList[0] ? ipList[0].clicks : 0
  const avgClicksPerIP = uniqueIPs > 0 ? (totalClicks / uniqueIPs).toFixed(1) : '0'

  const filteredIpList = ipList.filter((item) =>
    item.ip.toLowerCase().includes(ipSearchQuery.toLowerCase())
  )

  const chartColors = [
    'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)',
    'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
    'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
    'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
    'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
  ]

  return (
    <div className="dash-container">
      <ToastNotification toast={toast} />

      {/* Header Bar */}
      <DashboardHeader
        user={user}
        handleLogout={handleLogout}
        setActiveTab={() => navigate('/dashboard')}
      />

      {/* Main Content Page */}
      <main className="dash-main dash-analytics-page-main">
        {/* Navigation & Back Button */}
        <div className="dash-analytics-nav-bar">
          <button
            type="button"
            className="dash-btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <span className="dash-analytics-route-badge">
            Route: <code>/analytics/{code || linkData?.rawShortCode}</code>
          </span>
        </div>

        {isLoadingLinks && !linkData ? (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 24 }}>
               <div className="dash-skeleton-line" style={{ width: '300px', height: '32px', marginBottom: 12 }} />
               <div className="dash-skeleton-line" style={{ width: '400px', height: '16px' }} />
            </div>
            <SkeletonMetricsGrid count={4} />
            <div className="dash-analytics-body" style={{ marginTop: 24 }}>
              <SkeletonBarChart />
              <SkeletonTable rows={4} columns={4} />
            </div>
          </div>
        ) : error ? (
          <div className="dash-card dash-analytics-error-card">
            <div className="dash-analytics-empty-icon">
              <BarChart3 size={36} />
            </div>
            <h3>Unable to load Analytics</h3>
            <p>{error}</p>
            <button
              type="button"
              className="dash-submit-btn"
              style={{ width: 'auto', margin: '16px auto 0' }}
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        ) : linkData ? (
          <>
            {/* Page Header */}
            <div className="dash-analytics-page-header">
              <div className="dash-analytics-title-group">
                <div className="dash-analytics-icon-badge">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h2>Analytics & Performance Detail Page</h2>
                  <p className="dash-analytics-subtitle">
                    Real-time click statistics and traffic distribution for short code:{' '}
                    <span className="dash-analytics-code-highlight">
                      {linkData.rawShortCode || linkData.shortCode}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Link Overview Banner */}
            <div className="dash-analytics-link-banner">
              <div className="dash-analytics-link-meta">
                <h3 className="dash-analytics-link-title">{linkData.title}</h3>
                <div className="dash-analytics-urls flex-wrap">
                  <span className="dash-analytics-short-url">
                    <strong>Short Link:</strong> {linkData.fullShortUrl}
                  </span>
                  <span className="dash-analytics-orig-url">
                    <strong>Target Destination:</strong> {linkData.originalUrl}
                  </span>
                </div>
              </div>
              <div className="dash-analytics-banner-actions">
                <button
                  type="button"
                  className="dash-btn-secondary"
                  onClick={() => handleCopy(linkData.fullShortUrl)}
                >
                  <Copy size={16} /> Copy Short Link
                </button>
                <a
                  href={linkData.fullShortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-btn-secondary"
                >
                  <ExternalLink size={16} /> Visit Link
                </a>
              </div>
            </div>

            {/* Overview Metric Grid */}
            <div className="dash-metrics-grid dash-analytics-metrics">
              <div className="dash-metric-card dash-metric-card--analytics">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Total Clicks</span>
                  <span className="dash-metric-icon dash-icon--teal">
                    <MousePointerClick size={18} />
                  </span>
                </div>
                <div className="dash-metric-value">
                  {totalClicks.toLocaleString()}
                </div>
                <div className="dash-metric-sub">Recorded redirects</div>
              </div>

              <div className="dash-metric-card dash-metric-card--analytics">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Unique IPs</span>
                  <span className="dash-metric-icon dash-icon--blue">
                    <Users size={18} />
                  </span>
                </div>
                <div className="dash-metric-value">
                  {uniqueIPs.toLocaleString()}
                </div>
                <div className="dash-metric-sub">Distinct client addresses</div>
              </div>

              <div className="dash-metric-card dash-metric-card--analytics">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Top Traffic IP</span>
                  <span className="dash-metric-icon dash-icon--amber">
                    <Globe size={18} />
                  </span>
                </div>
                <div
                  className="dash-metric-value dash-metric-value--sm"
                  title={topIP}
                >
                  {topIP}
                </div>
                <div className="dash-metric-sub">
                  {topIPClicks} clicks (
                  {totalClicks > 0
                    ? Math.round((topIPClicks / totalClicks) * 100)
                    : 0}
                  % of traffic)
                </div>
              </div>

              <div className="dash-metric-card dash-metric-card--analytics">
                <div className="dash-metric-header">
                  <span className="dash-metric-title">Avg Clicks / IP</span>
                  <span className="dash-metric-icon dash-icon--purple">
                    <Zap size={18} />
                  </span>
                </div>
                <div className="dash-metric-value">{avgClicksPerIP}</div>
                <div className="dash-metric-sub">Frequency ratio</div>
              </div>
            </div>

            {/* Analytics Visual Graphs Section */}
            {ipList.length > 0 ? (
              <div className="dash-analytics-body">
                <IPMap ipList={ipList} />
                {/* Graph 1: IP Clicks Bar Chart */}
                <div className="dash-analytics-card">
                  <div className="dash-analytics-card-header">
                    <div>
                      <h4>
                        <BarChart3 size={18} /> IP Address Traffic Breakdown (Bar Chart)
                      </h4>
                      <p>Visual clicks comparison across visitor IP addresses</p>
                    </div>
                  </div>

                  {/* Stacked Traffic Share Visual Bar */}
                  <div className="dash-stacked-chart-wrap">
                    <div className="dash-stacked-chart-label">
                      Traffic Share Distribution Graph
                    </div>
                    <div className="dash-stacked-chart-bar">
                      {ipList.slice(0, 5).map((item, index) => {
                        const pct =
                          totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0
                        return (
                          <div
                            key={item.ip}
                            className="dash-stacked-segment"
                            style={{
                              width: `${pct}%`,
                              background: chartColors[index % chartColors.length],
                            }}
                            title={`${item.ip}: ${item.clicks} clicks (${pct.toFixed(
                              1
                            )}%)`}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Horizontal Bar Chart Items */}
                  <div className="dash-barchart-list">
                    {ipList.slice(0, 7).map((item, index) => {
                      const pct =
                        totalClicks > 0
                          ? Math.round((item.clicks / totalClicks) * 100)
                          : 0
                      const barColor = chartColors[index % chartColors.length]

                      return (
                        <div key={item.ip} className="dash-barchart-row">
                          <div className="dash-barchart-info">
                            <span className="dash-barchart-ip">
                              <span
                                className="dash-ip-indicator-dot"
                                style={{ background: barColor }}
                              />
                              {item.ip}
                            </span>
                            <span className="dash-barchart-count">
                              <strong>{item.clicks}</strong>{' '}
                              {item.clicks === 1 ? 'click' : 'clicks'} ({pct}%)
                            </span>
                          </div>
                          <div className="dash-barchart-track">
                            <div
                              className="dash-barchart-fill"
                              style={{
                                width: `${pct}%`,
                                background: barColor,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* IP Detailed Data Table */}
                <div className="dash-analytics-card">
                  <div className="dash-analytics-card-header dash-flex-between flex-wrap gap-12">
                    <div>
                      <h4>
                        <Layers size={18} /> Visitor IP Logs & Details
                      </h4>
                      <p>Individual click counts and timestamps by client IP</p>
                    </div>
                    <div className="dash-search-box dash-search-box--sm">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Filter by IP..."
                        value={ipSearchQuery}
                        onChange={(e) => setIpSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="dash-table-wrap">
                    <table className="dash-table dash-analytics-table">
                      <thead>
                        <tr>
                          <th>Client IP Address</th>
                          <th>Total Clicks</th>
                          <th>Traffic Share</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIpList.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="dash-table-empty">
                              No matching IP address found.
                            </td>
                          </tr>
                        ) : (
                          filteredIpList.map((item, idx) => {
                            const pct =
                              totalClicks > 0
                                ? ((item.clicks / totalClicks) * 100).toFixed(1)
                                : 0
                            return (
                              <tr key={item.ip + idx}>
                                <td>
                                  <div className="dash-ip-badge">
                                    <Globe size={14} />
                                    <span>{item.ip}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="dash-clicks-badge">
                                    {item.clicks}{' '}
                                    {item.clicks === 1 ? 'click' : 'clicks'}
                                  </span>
                                </td>
                                <td>
                                  <div className="dash-share-cell">
                                    <div className="dash-share-bar-bg">
                                      <div
                                        className="dash-share-bar-fill"
                                        style={{
                                          width: `${pct}%`,
                                          background:
                                            chartColors[idx % chartColors.length],
                                        }}
                                      />
                                    </div>
                                    <span className="dash-share-text">{pct}%</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="dash-status-tag dash-status-tag--active">
                                    Active Tracked
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Analytics State */
              <div className="dash-analytics-empty">
                <div className="dash-analytics-empty-icon">
                  <BarChart3 size={40} />
                </div>
                <h3>No Analytics Data Recorded Yet</h3>
                <p>
                  This short URL hasn't received any clicks yet. Share your short
                  link with users to start capturing detailed click analytics and
                  graphs!
                </p>
                <div className="dash-analytics-empty-actions">
                  <button
                    type="button"
                    className="dash-submit-btn"
                    onClick={() => handleCopy(linkData.fullShortUrl)}
                  >
                    <Copy size={16} /> Copy Short Link & Share
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}

export default AnalyticsPage
