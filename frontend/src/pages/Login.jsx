import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './Auth.css'

const API_BASE_URL = import.meta.env.VITE_BACKENDURL || 'http://localhost:8080/api/'
const LOGIN_URL = `${API_BASE_URL.replace(/\/$/, '')}/login`

const FEATURES = [
  { num: 1, label: 'Shorten any long URL instantly' },
  { num: 2, label: 'Track clicks on every link' },
  { num: 3, label: 'Manage links from one dashboard' },
]

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { markAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState(null)

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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSubmitError('')
    setToast(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setToast(null)

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Invalid email or password.')
      }

      const data = await response.json()

      markAuthenticated()
      const redirectTo = location.state?.from?.pathname || '/dashboard'

      setToast({
        type: 'success',
        message: data.message || 'Login successful! Redirecting to Dashboard...',
      })

      setTimeout(() => {
        navigate(redirectTo, { replace: true })
      }, 1000)
    } catch (error) {
      const message = error.message.trim() || 'Invalid email or password.'
      setSubmitError(message)
      setToast({ type: 'error', message })
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
            <h1>Welcome back to ShortLink</h1>
            <p>
              Sign in to access your dashboard, manage short links, and view
              click analytics.
            </p>
          </div>

          <div className="auth-steps">
            {FEATURES.map((item) => (
              <div key={item.num} className="auth-step">
                <span className="auth-step-num">{item.num}</span>
                <span className="auth-step-label">{item.label}</span>
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
            <h2>Log in to your account</h2>
            <p>Enter your email and password to continue to your dashboard.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="eg. johnfrans@gmail.com"
                value={form.email}
                onChange={handleChange}
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
            </div>

            {submitError && <span className="auth-error">{submitError}</span>}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log In to Dashboard →'}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

