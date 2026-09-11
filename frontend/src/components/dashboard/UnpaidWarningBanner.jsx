import { AlertTriangle } from 'lucide-react'

export function UnpaidWarningBanner({ setActiveTab }) {
  return (
    <div className="dash-warning-banner">
      <div className="dash-warning-icon">
        <AlertTriangle size={18} />
      </div>
      <div className="dash-warning-text">
        <strong>Action Required: Subscription Unpaid</strong>
        <p>Your account requires an active paid subscription plan to shorten new links.</p>
      </div>
      <button
        type="button"
        className="dash-warning-btn"
        onClick={() => setActiveTab('payment')}
      >
        Pay Now &amp; Activate
      </button>
    </div>
  )
}

export default UnpaidWarningBanner
