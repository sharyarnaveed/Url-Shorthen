import { useState } from 'react'
import {
  BarChart3,
  Copy,
  ExternalLink,
  Globe,
  Layers,
  MousePointerClick,
  Search,
  Users,
  X,
  Zap,
} from 'lucide-react'

export function AnalyticsModal({ link, onClose, handleCopy }) {
  const [ipSearchQuery, setIpSearchQuery] = useState('')

  if (!link) return null

  // Ensure analytics array exists
  const rawAnalytics = Array.isArray(link.analytics) ? link.analytics : []

  // Aggregate analytics data by IP address
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

  // Final list of aggregated IP analytics, sorted by highest clicks
  const ipList = Object.values(ipMap).sort((a, b) => b.clicks - a.clicks)

  // Calculate summary metrics
  const totalClicks = computedTotalClicks > 0 ? computedTotalClicks : link.clicks || 0
  const uniqueIPs = ipList.length
  const topIP = ipList[0] ? ipList[0].ip : 'No Data'
  const topIPClicks = ipList[0] ? ipList[0].clicks : 0
  const avgClicksPerIP = uniqueIPs > 0 ? (totalClicks / uniqueIPs).toFixed(1) : '0'

  // Filtered IP list based on user search query
  const filteredIpList = ipList.filter((item) =>
    item.ip.toLowerCase().includes(ipSearchQuery.toLowerCase())
  )

  // Palette of vibrant gradient colors for graphs
  const chartColors = [
    'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)',
    'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
    'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
    'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
    'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
  ]

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div
        className="dash-modal-content dash-analytics-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="dash-modal-header dash-analytics-header">
          <div className="dash-analytics-title-group">
            <div className="dash-analytics-icon-badge">
              <BarChart3 size={22} />
            </div>
            <div>
              <h2>Analytics & Performance Detail</h2>
              <p className="dash-analytics-subtitle">
                Detailed click statistics and traffic distribution for short code:{' '}
                <span className="dash-analytics-code-highlight">{link.shortCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="dash-modal-close"
            onClick={onClose}
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Link Overview Banner */}
        <div className="dash-analytics-link-banner">
          <div className="dash-analytics-link-meta">
            <h3 className="dash-analytics-link-title">{link.title}</h3>
            <div className="dash-analytics-urls flex-wrap">
              <span className="dash-analytics-short-url">
                <strong>Short Link:</strong> {link.fullShortUrl || link.shortCode}
              </span>
              <span className="dash-analytics-orig-url">
                <strong>Target:</strong> {link.originalUrl}
              </span>
            </div>
          </div>
          <div className="dash-analytics-banner-actions">
            <button
              type="button"
              className="dash-btn-secondary dash-btn-sm"
              onClick={() => handleCopy(link.fullShortUrl || link.shortCode)}
            >
              <Copy size={14} /> Copy
            </button>
            <a
              href={link.fullShortUrl || link.shortCode}
              target="_blank"
              rel="noreferrer"
              className="dash-btn-secondary dash-btn-sm"
            >
              <ExternalLink size={14} /> Visit
            </a>
          </div>
        </div>

        {/* Overview Metric Grid */}
        <div className="dash-metrics-grid dash-analytics-metrics">
          <div className="dash-metric-card dash-metric-card--analytics">
            <div className="dash-metric-header">
              <span className="dash-metric-title">Total Clicks</span>
              <span className="dash-metric-icon dash-icon--teal"><MousePointerClick size={18} /></span>
            </div>
            <div className="dash-metric-value">{totalClicks.toLocaleString()}</div>
            <div className="dash-metric-sub">Recorded redirects</div>
          </div>

          <div className="dash-metric-card dash-metric-card--analytics">
            <div className="dash-metric-header">
              <span className="dash-metric-title">Unique IPs</span>
              <span className="dash-metric-icon dash-icon--blue"><Users size={18} /></span>
            </div>
            <div className="dash-metric-value">{uniqueIPs.toLocaleString()}</div>
            <div className="dash-metric-sub">Distinct client addresses</div>
          </div>

          <div className="dash-metric-card dash-metric-card--analytics">
            <div className="dash-metric-header">
              <span className="dash-metric-title">Top Traffic IP</span>
              <span className="dash-metric-icon dash-icon--amber"><Globe size={18} /></span>
            </div>
            <div className="dash-metric-value dash-metric-value--sm" title={topIP}>
              {topIP}
            </div>
            <div className="dash-metric-sub">
              {topIPClicks} clicks ({totalClicks > 0 ? Math.round((topIPClicks / totalClicks) * 100) : 0}% of traffic)
            </div>
          </div>

          <div className="dash-metric-card dash-metric-card--analytics">
            <div className="dash-metric-header">
              <span className="dash-metric-title">Avg Clicks / IP</span>
              <span className="dash-metric-icon dash-icon--purple"><Zap size={18} /></span>
            </div>
            <div className="dash-metric-value">{avgClicksPerIP}</div>
            <div className="dash-metric-sub">Frequency ratio</div>
          </div>
        </div>

        {/* Analytics Visual Graphs Section */}
        {ipList.length > 0 ? (
          <div className="dash-analytics-body">
            {/* Graph 1: IP Clicks Bar Chart */}
            <div className="dash-analytics-card">
              <div className="dash-analytics-card-header">
                <div>
                  <h4><BarChart3 size={18} /> IP Address Traffic Breakdown (Bar Chart)</h4>
                  <p>Clicks visual comparison across different IP addresses</p>
                </div>
              </div>

              {/* Stacked Traffic Share Visual Bar */}
              <div className="dash-stacked-chart-wrap">
                <div className="dash-stacked-chart-label">Traffic Share Distribution</div>
                <div className="dash-stacked-chart-bar">
                  {ipList.slice(0, 5).map((item, index) => {
                    const pct = totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0
                    return (
                      <div
                        key={item.ip}
                        className="dash-stacked-segment"
                        style={{
                          width: `${pct}%`,
                          background: chartColors[index % chartColors.length],
                        }}
                        title={`${item.ip}: ${item.clicks} clicks (${pct.toFixed(1)}%)`}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Horizontal Bar Chart Items */}
              <div className="dash-barchart-list">
                {ipList.slice(0, 7).map((item, index) => {
                  const pct = totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100) : 0
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
                          <strong>{item.clicks}</strong> {item.clicks === 1 ? 'click' : 'clicks'} ({pct}%)
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
                  <h4><Layers size={18} /> Visitor IP Logs & Details</h4>
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
                        const pct = totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(1) : 0
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
                                {item.clicks} {item.clicks === 1 ? 'click' : 'clicks'}
                              </span>
                            </td>
                            <td>
                              <div className="dash-share-cell">
                                <div className="dash-share-bar-bg">
                                  <div
                                    className="dash-share-bar-fill"
                                    style={{
                                      width: `${pct}%`,
                                      background: chartColors[idx % chartColors.length],
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
              This short URL hasn't received any clicks yet. Share your short link with users to start capturing detailed click analytics and graphs!
            </p>
            <div className="dash-analytics-empty-actions">
              <button
                type="button"
                className="dash-submit-btn"
                onClick={() => handleCopy(link.fullShortUrl || link.shortCode)}
              >
                <Copy size={16} /> Copy Short Link & Share
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="dash-modal-footer">
          <button type="button" className="dash-btn-secondary" onClick={onClose}>
            Close Detail Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsModal
