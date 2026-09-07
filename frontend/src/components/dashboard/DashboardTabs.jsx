import { Grid2x2, Link2, CreditCard, Settings } from 'lucide-react'

export function DashboardTabs({ activeTab, setActiveTab, linksCount, paymentStatus }) {
  return (
    <nav className="dash-tabs" aria-label="Dashboard Navigation Tabs">
      <button
        type="button"
        className={`dash-tab ${activeTab === 'overview' ? 'dash-tab--active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        <Grid2x2 size={18} className="dash-tab-icon" />
        <span className="dash-tab-text">Overview &amp; Shorten</span>
      </button>

      <button
        type="button"
        className={`dash-tab ${activeTab === 'links' ? 'dash-tab--active' : ''}`}
        onClick={() => setActiveTab('links')}
      >
        <Link2 size={18} className="dash-tab-icon" />
        <span className="dash-tab-text">My Short URLs</span>
        <span className="dash-tab-badge">{linksCount}</span>
      </button>

      <button
        type="button"
        className={`dash-tab ${activeTab === 'payment' ? 'dash-tab--active' : ''}`}
        onClick={() => setActiveTab('payment')}
      >
        <CreditCard size={18} className="dash-tab-icon" />
        <span className="dash-tab-text">Subscription</span>
        {paymentStatus !== 'Paid' && <span className="dash-tab-alert">Unpaid</span>}
      </button>

      <button
        type="button"
        className={`dash-tab ${activeTab === 'settings' ? 'dash-tab--active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        <Settings size={18} className="dash-tab-icon" />
        <span className="dash-tab-text">Settings</span>
      </button>
    </nav>
  )
}

export default DashboardTabs
