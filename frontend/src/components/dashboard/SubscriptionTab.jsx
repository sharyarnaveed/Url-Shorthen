import { Check, ShieldCheck, ExternalLink, Sparkles, CreditCard } from 'lucide-react'

export function SubscriptionTab({
  user,
  handleTogglePaymentStatus,
  selectedPlanForPayment,
  handleSelectPlan,
  plans,
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const isPaidUser = user.paymentStatus === 'Paid'

  const checkIsCurrentPlan = (plan) => {
    if (!isPaidUser) return false
    const selected = (user.planselected || '').toLowerCase().trim()
    const pId = (plan.id || '').toLowerCase().trim()
    const pName = (plan.name || '').toLowerCase().trim()
    const userPlan = (user.plan || '').toLowerCase().trim()

    if (selected) {
      if (selected === pId || selected === pName || selected.includes(pId) || pName.includes(selected)) {
        return true
      }
    }
    if (userPlan) {
      if (userPlan === pId || userPlan.includes(pId) || pId.includes(userPlan)) {
        return true
      }
    }
    return isPaidUser
  }

  return (
    <div className="dash-tab-content">
      {/* Current Subscription & Billing Card */}
      <section className="dash-card dash-subscription-header-card">
        <div className="dash-card-header">
          <h2>Subscription &amp; Billing</h2>
          <p>Manage your account subscription plan and payment status.</p>
        </div>

        <div className="dash-status-box-clean">
          <div className="dash-status-item">
            <span className="dash-status-label">Current Status</span>
            <div className="dash-status-value-wrap">
              <span className={`dash-status-pill dash-status-pill--${isPaidUser ? 'paid' : 'unpaid'}`}>
                {isPaidUser ? 'Active Paid' : 'Payment Required'}
              </span>
            </div>
          </div>

          <div className="dash-status-divider" />

          <div className="dash-status-item">
            <span className="dash-status-label">Active Plan</span>
            <div className="dash-status-value">
              {user.planselected || (isPaidUser ? 'Active Plan' : 'No Active Plan')}
            </div>
          </div>

          <div className="dash-status-divider" />

          <div className="dash-status-item">
            <span className="dash-status-label">Amount Paid</span>
            <div className="dash-status-value">
              {user.amount ? `$${user.amount}` : 'N/A'}
            </div>
          </div>

          <div className="dash-status-divider" />

          <div className="dash-status-item">
            <span className="dash-status-label">Payment Date</span>
            <div className="dash-status-value">
              {formatDate(user.paymentDate)}
            </div>
          </div>

          <div className="dash-status-divider" />

          <div className="dash-status-item">
            <span className="dash-status-label">Expires On</span>
            <div className="dash-status-value">
              {formatDate(user.paymentExpire)}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="dash-card">
        <div className="dash-card-header">
          <h2>Choose a Subscription Plan</h2>
          <p>Select a plan below to proceed directly to our secure checkout page.</p>
        </div>

        <div className="dash-plans-grid">
          {plans.map((plan) => {
            const isCurrentPlan = checkIsCurrentPlan(plan)

            return (
              <div
                key={plan.id}
                className={`dash-clean-plan-card ${plan.popular ? 'dash-clean-plan-card--popular' : ''} ${
                  isCurrentPlan ? 'dash-clean-plan-card--active' : ''
                }`}
              >
                {plan.popular && (
                  <span className="dash-plan-popular-badge">
                    <Sparkles size={13} /> Most Popular
                  </span>
                )}

                <div className="dash-clean-plan-header">
                  <h3 className="dash-clean-plan-title">{plan.name}</h3>
                  <div className="dash-clean-plan-price">
                    <span className="dash-plan-amount">${plan.price}</span>
                    <span className="dash-plan-period">/ month</span>
                  </div>
                </div>

                <ul className="dash-clean-plan-features">
                  {plan.features.map((feat) => (
                    <li key={feat}>
                      <Check size={16} className="dash-check-icon" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`dash-clean-plan-btn ${
                    isCurrentPlan ? 'dash-clean-plan-btn--current' : 'dash-clean-plan-btn--checkout'
                  }`}
                  disabled={isCurrentPlan}
                  onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check size={16} />
                      Paid
                    </>
                  ) : (
                    <>
                      <ExternalLink size={16} />
                      Proceed to Checkout
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="dash-checkout-note">
          <ShieldCheck size={18} className="dash-shield-icon" />
          <span>
            <strong>100% Secure External Checkout:</strong> All transactions are processed safely through our secure checkout page. We never ask for or store credit card details on our website.
          </span>
        </div>
      </section>
    </div>
  )
}

export default SubscriptionTab
