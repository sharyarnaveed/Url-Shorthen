import { Check, ShieldCheck, ExternalLink, Sparkles, CreditCard } from 'lucide-react'

export function SubscriptionTab({
  user,
  handleTogglePaymentStatus,
  selectedPlanForPayment,
  handleSelectPlan,
  plans,
}) {
  return (
    <div className="dash-tab-content">
      {/* Current Subscription & Billing Card */}
      <section className="dash-card dash-subscription-header-card">
        <div className="dash-card-header dash-flex-between flex-wrap gap-4">
          <div>
            <h2>Subscription &amp; Billing</h2>
            <p>Manage your account subscription plan and payment status.</p>
          </div>
          <button
            type="button"
            className="dash-btn-secondary dash-demo-toggle-btn"
            onClick={handleTogglePaymentStatus}
          >
            Demo Toggle Status: ({user.paymentStatus === 'Paid' ? 'Set Unpaid' : 'Set Paid'})
          </button>
        </div>

        <div className="dash-status-box-clean">
          <div className="dash-status-item">
            <span className="dash-status-label">Current Status</span>
            <div className="dash-status-value-wrap">
              <span className={`dash-status-pill dash-status-pill--${user.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                {user.paymentStatus === 'Paid' ? 'Active Paid' : 'Payment Required'}
              </span>
            </div>
          </div>

          <div className="dash-status-divider" />

          <div className="dash-status-item">
            <span className="dash-status-label">Active Plan</span>
            <div className="dash-status-value">
              {user.plan === 'pro' || user.plan === 'unlimited'
                ? 'Pro Plan ($7/month)'
                : user.plan === 'basic'
                ? 'Basic Plan ($3/month)'
                : 'No Active Plan'}
            </div>
          </div>

          <div className="dash-status-divider" />

          <div className="dash-status-item">
            <span className="dash-status-label">Payment Method</span>
            <div className="dash-status-value">
              <CreditCard size={15} className="inline-icon" /> Hosted Checkout Page
            </div>
          </div>

          <div className="dash-status-divider" />

          <div className="dash-status-item">
            <span className="dash-status-label">Billing Cycle</span>
            <div className="dash-status-value">Monthly Auto-Renewal</div>
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
            const isCurrentPlan =
              user.paymentStatus === 'Paid' &&
              (user.plan === plan.id || (user.plan === 'unlimited' && plan.id === 'pro'))

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
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check size={16} />
                      Current Active Plan
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
