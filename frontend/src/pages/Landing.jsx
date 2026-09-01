import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const FEATURES = [
  {
    num: '01',
    title: 'Instant Shortening',
    desc: 'Paste any long URL and get a clean, shareable link in seconds.',
  },
  {
    num: '02',
    title: 'Analytics Ready',
    desc: 'Track clicks and monitor performance on every link you create.',
  },
  {
    num: '03',
    title: 'Secure & Reliable',
    desc: 'Enterprise-grade infrastructure keeps your links fast and safe.',
  },
]

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2,
    period: 'month',
    highlight: false,
    features: [
      '100 URL shortenings per month',
      'Custom short links',
      'Click analytics',
      'Dashboard access',
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 5,
    period: 'month',
    highlight: true,
    features: [
      'Unlimited URL shortenings',
      'Custom short links',
      'Advanced click analytics',
      'Priority support',
      'Dashboard access',
    ],
  },
]

function Landing() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const shortenUrl = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setShortUrl('')
    setCopied(false)

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) throw new Error('Failed to shorten URL. Please try again.')

      const data = await res.json()
      setShortUrl(`${window.location.origin.replace(':5173', ':8080')}/${data.shortCode}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = async () => {
    if (!shortUrl) return
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="page">
      <header className="header">
        <nav className="nav-left">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <Link to="/" className="logo">
          <span className="logo-mark">◆</span>
          ShortLink
        </Link>
        <Link to="/signup" className="btn btn-dark btn-sm">
          Get Started
        </Link>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>
            <span className="hero-line">Shorten your links</span>
            <span className="hero-line">
              <em>with confidence</em>
            </span>
          </h1>
          <p className="hero-sub">
            Transform long, messy URLs into clean, shareable links. Fast,
            reliable, and built for everyone.
          </p>

          <form className="shorten-form" onSubmit={shortenUrl}>
            <div className="input-wrap">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your long URL here..."
                required
              />
            </div>
            <button type="submit" className="btn btn-dark" disabled={loading}>
              {loading ? (
                <span className="btn-loading">Shortening...</span>
              ) : (
                <>
                  Shorten
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {error && <p className="form-error">{error}</p>}

          {shortUrl && (
            <div className="result-box">
              <div className="result-header">
                <span className="result-dot" />
                <span className="result-label">Your short link is ready</span>
              </div>
              <div className="result-row">
                <a href={shortUrl} target="_blank" rel="noreferrer" className="result-link">
                  {shortUrl}
                </a>
                <button type="button" className="btn-copy" onClick={copyUrl}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <div className="hero-trust">
            <span>Trusted by 10,000+ creators</span>
            <span className="trust-divider" />
            <span>99.9% uptime</span>
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <span className="section-tag">Who we are</span>
        <h2>
          Every link deserves to be{' '}
          <em>short, secure, and shareable</em>
        </h2>
        <p>
          Our platform gives you the tools to manage URLs effortlessly — whether
          you&apos;re sharing on social media, running campaigns, or building
          your brand online.
        </p>
        <a href="#features" className="btn btn-dark">
          Learn more
        </a>
      </section>

      <section id="features" className="features">
        <span className="section-tag">Features</span>
        <h2 className="features-heading">Built for speed &amp; simplicity</h2>
        <div className="feature-list">
          {FEATURES.map((f, i) => (
            <div key={f.num} className="feature-item" style={{ '--i': i }}>
              <span className="feature-num">{f.num}</span>
              <div className="feature-text">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
              <svg className="feature-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="pricing">
        <span className="section-tag">Pricing</span>
        <h2 className="pricing-heading">Choose your plan</h2>
        <p className="pricing-sub">
          Select a subscription plan to shorten links and access premium dashboard features.
        </p>

        <div className="pricing-cards">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card${plan.highlight ? ' pricing-card--featured' : ''}`}
            >
              {plan.highlight && <span className="badge">Most popular</span>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="price-currency">$</span>
                <span className="price-amount">{plan.price}</span>
                <span className="price-period">/ {plan.period}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((feat) => (
                  <li key={feat}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5l3.5 3.5 6.5-7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`btn ${plan.highlight ? 'btn-dark' : 'btn-outline-dark'} btn-full`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to shorten your first link?</h2>
          <p>Sign up, choose your plan, and access your dashboard today.</p>
          <Link to="/signup" className="btn btn-light">
            Get Started Now
          </Link>
        </div>
      </section>

      <footer className="footer">
        <span className="footer-brand">ShortLink</span>
        <nav className="footer-nav">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <p className="footer-copy">&copy; 2026 ShortLink. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Landing
