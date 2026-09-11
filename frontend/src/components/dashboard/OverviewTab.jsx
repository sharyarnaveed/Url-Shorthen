import {
  ArrowRight,
  BarChart3,
  Copy,
  CreditCard,
  Link2,
  QrCode,
  Sparkles,
  Star,
} from 'lucide-react'
import LinksTable from './LinksTable'

export function OverviewTab({
  links,
  user,
  longUrl,
  setLongUrl,
  customTitle,
  setCustomTitle,
  handleShorten,
  isShortening,
  shortenError,
  newShortLink,
  handleCopy,
  setQrModalLink,
  openDeleteConfirm,
  setActiveTab,
}) {
  const totalClicks = links.reduce((acc, curr) => acc + curr.clicks, 0)
  const topLink = [...links].sort((a, b) => b.clicks - a.clicks)[0]
  const recentLinks = links.slice(0, 4)

  return (
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
            {user.paymentStatus === 'Paid' ? (user.planselected || 'Active Paid Plan') : 'Action required'}
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

        <LinksTable
          links={recentLinks}
          handleCopy={handleCopy}
          setQrModalLink={setQrModalLink}
          openDeleteConfirm={openDeleteConfirm}
          showStatus={false}
          showActionLabels={false}
        />
      </section>
    </div>
  )
}

export default OverviewTab
