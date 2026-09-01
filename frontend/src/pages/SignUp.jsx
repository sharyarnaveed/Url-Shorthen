import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

const API_BASE_URL = import.meta.env.VITE_BACKENDURL || 'http://localhost:8080/api/'
const CREATE_ACCOUNT_URL = `${API_BASE_URL.replace(/\/$/, '')}/createaccount`

const STEPS = [
  { num: 1, label: 'Create your account', active: true },
  { num: 2, label: 'Access your dashboard', active: false },
]

function SignUp() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState(null)
  const [accountCreated, setAccountCreated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!toast || toast.type === 'success') {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setToast(null)
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [toast])

  const handleChange = (e) => {
    if (accountCreated) {
      return
    }

    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('')
    }
    setSubmitError('')
    setToast(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (accountCreated) {
      navigate('/dashboard')
      return
    }

    if (form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match.')
      setToast({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setToast(null)

    try {
      const response = await fetch(CREATE_ACCOUNT_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: form.firstName,
          lastname: form.lastName,
          email: form.email,
          password: form.password,
          repassword: form.confirmPassword,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Unable to create account.')
      }

      const data = await response.json()

      // Save user details for Dashboard
      localStorage.setItem(
        'shortlink_user',
        JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          plan: 'basic',
          paymentStatus: 'Unpaid',
          paymentMethod: 'Not Added Yet',
        })
      )

      setToast({
        type: 'success',
        message: data.message || 'Account created successfully! Redirecting to Dashboard...',
      })
      setAccountCreated(true)

      // Direct user to Dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (error) {
      const message = error.message.trim() || 'Unable to create account.'
      setSubmitError(message)
      setToast({ type: 'error', message })
      setAccountCreated(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      {toast && (
        <div
          className={`auth-toast auth-toast--${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
          <span className="auth-toast-icon">
            {toast.type === 'error' ? '!' : 'OK'}
          </span>
          <span className="auth-toast-message">{toast.message}</span>
        </div>
      )}

      <div className="auth-panel auth-panel--left">
        <div className="auth-panel-inner">
          <Link to="/" className="auth-back">
            ← Back
          </Link>

          <Link to="/" className="auth-brand">
            <span className="auth-brand-mark">◆</span>
            ShortLink
          </Link>

          <div className="auth-intro">
            <h1>Create your ShortLink account</h1>
            <p>
              Sign up to get instant access to your link management dashboard.
            </p>
          </div>

          <div className="auth-steps">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className={`auth-step${
                  step.num === (accountCreated ? 2 : 1) ? ' auth-step--active' : ''
                }`}
              >
                <span className="auth-step-num">{step.num}</span>
                <span className="auth-step-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel--right">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-form-logo">
            <span className="auth-form-logo-mark">◆</span>
            ShortLink
          </Link>

          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Enter your details below to create your account.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="eg. John"
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={accountCreated}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="eg. Francisco"
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={accountCreated}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="eg. johnfrans@gmail.com"
                value={form.email}
                onChange={handleChange}
                disabled={accountCreated}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  disabled={accountCreated}
                  required
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 18a2 2 0 0 0 1.42-.58M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-1.02 2.84-2.88 5.12-5.18 6.45M6.61 6.61C4.08 8.03 2.23 10.23 1 13c1.73 4.89 6 8 11 8 1.05 0 2.06-.14 3-.4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
              <span className="auth-hint">Must be at least 8 characters.</span>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth-password-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  minLength={8}
                  disabled={accountCreated}
                  required
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 18a2 2 0 0 0 1.42-.58M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-1.02 2.84-2.88 5.12-5.18 6.45M6.61 6.61C4.08 8.03 2.23 10.23 1 13c1.73 4.89 6 8 11 8 1.05 0 2.06-.14 3-.4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <span className="auth-error">{passwordError}</span>}
            </div>

            {submitError && <span className="auth-error">{submitError}</span>}

            {accountCreated ? (
              <button
                type="button"
                className="auth-submit"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard →
              </button>
            ) : (
              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            )}
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
