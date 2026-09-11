import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'

export function DashboardHeader({ user, handleLogout, setActiveTab }) {
  return (
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
                ? user.planselected || 'Active Paid Plan'
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
              {user.firstName ? user.firstName[0] : 'U'}
              {user.lastName ? user.lastName[0] : 'A'}
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
  )
}

export default DashboardHeader
