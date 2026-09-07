import { Search } from 'lucide-react'
import LinksTable from './LinksTable'

export function LinksTab({
  searchQuery,
  setSearchQuery,
  filteredLinks,
  handleCopy,
  setQrModalLink,
  openDeleteConfirm,
  setActiveTab,
}) {
  return (
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
          <LinksTable
            links={filteredLinks}
            handleCopy={handleCopy}
            setQrModalLink={setQrModalLink}
            openDeleteConfirm={openDeleteConfirm}
            showStatus={true}
            showActionLabels={true}
          />
        )}
      </section>
    </div>
  )
}

export default LinksTab
