import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'
import './ChoosePlan.css'

const STEPS = [
  { num: 1, label: 'Create your account', active: false },
  { num: 2, label: 'Choose your plan', active: true },
  { num: 3, label: 'Shorten links in dashboard', active: false },
]

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2,
    period: 'month',
    description: 'Perfect for personal use and small projects.',
    features: [
      '100 URL shortenings per month',
      'Custom short links',
      'Click analytics',
      'Dashboard access',
    ],
    badge: null,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 5,
    period: 'month',
    description: 'For power users and teams who need no limits.',
    features: [
      'Unlimited URL shortenings',
      'Custom short links',
      'Advanced click analytics',
      'Priority 24/7 support',
      'Dashboard access',
    ],
    badge: 'Most popular',
  },
]

function ChoosePlan() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('basic')

  const handleContinue = () => {
    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-panel auth-panel--left">
        <div className="auth-panel-inner">
          <Link to="/signup" className="auth-back">
            ← Back
          </Link>

          <Link to="/" className="auth-brand">
            <span className="auth-brand-mark">◆</span>
            ShortLink
          </Link>

          <div className="auth-intro">
            <h1>Pick the plan that fits you</h1>
            <p>
              Select a paid plan to unlock full URL shortening features and management tools in your dashboard.
            </p>
          </div>

          <div className="auth-steps">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className={`auth-step${step.active ? ' auth-step--active' : ''}`}
              >
                <span className="auth-step-num">{step.num}</span>
                <span className="auth-step-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel--right auth-panel--plans">
        <div className="plan-wrap">
          <Link to="/" className="auth-form-logo">
            <span className="auth-form-logo-mark">◆</span>
            ShortLink
          </Link>

          <div className="plan-header">
            <h2>Choose your plan</h2>
            <p>Select a subscription plan to continue to your dashboard.</p>
          </div>

          <div className="plan-options">
            {PLANS.map((plan) => (
              <label
                key={plan.id}
                className={`plan-option${selected === plan.id ? ' plan-option--selected' : ''}${
                  plan.badge ? ' plan-option--featured' : ''
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selected === plan.id}
                  onChange={() => setSelected(plan.id)}
                />
                <span className="plan-radio" />

                <div className="plan-option-body">
                  <div className="plan-option-top">
                    <div>
                      <h3>{plan.name}</h3>
                      <p className="plan-option-desc">{plan.description}</p>
                    </div>
                    <div className="plan-option-price">
                      <span className="plan-price-amount">${plan.price}</span>
                      <span className="plan-price-period">/ {plan.period}</span>
                    </div>
                  </div>

                  <ul className="plan-option-features">
                    {plan.features.map((feat) => (
                      <li key={feat}>{feat}</li>
                    ))}
                  </ul>
                </div>

                {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              </label>
            ))}
          </div>

          <button type="button" className="auth-submit" onClick={handleContinue}>
            Continue to Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChoosePlan
