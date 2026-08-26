import { useEffect } from 'react'

const FEATURES = [
  { icon: '💬', title: 'AI Chat Widget', desc: 'Embed on any website with one line of code. Collects leads, answers questions, takes bookings 24/7.' },
  { icon: '📄', title: 'Standalone Page', desc: 'Get a hosted page (yoursite.com/your-business) you can share on social media, Google Business, or anywhere.' },
  { icon: '💳', title: 'Accept Payments', desc: 'Collect deposits and full payments via Paystack directly in the chat. No checkout page needed.' },
  { icon: '📅', title: 'Book Appointments', desc: 'Clients book services, select time slots, and get confirmations — all through conversation.' },
  { icon: '📊', title: 'Lead Dashboard', desc: 'See every enquiry, filter by status, export to CSV. Never miss a potential client again.' },
  { icon: '📱', title: 'WhatsApp Ready', desc: 'Connect your WhatsApp Business API. Same chatbot, same flows, now on the world\'s #1 messaging app.' },
]

const STEPS = [
  { title: 'Create your account', desc: 'Sign up and set up your business profile in under 2 minutes.' },
  { title: 'Configure your chatbot', desc: 'Add your services, pricing, FAQ, payment links, and business hours.' },
  { title: 'Share everywhere', desc: 'Copy the embed code for your site, or share your standalone page link on social media.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'Forever',
    features: ['1 chatbot', '100 conversations/month', 'Lead capture', 'Email notifications', 'Standalone page'],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: ['Unlimited chatbots', 'Unlimited conversations', 'Payment collection', 'WhatsApp integration', 'Custom branding', 'Priority support'],
    featured: true,
  },
  {
    name: 'Business',
    price: '$49',
    period: '/month',
    features: ['Everything in Pro', 'Multi-agent support', 'API access', 'White-label option', 'Dedicated account manager', 'SLA guarantee'],
  },
]

export default function Landing() {
  useEffect(() => {
    const onScroll = () => {
      document.querySelector('.nav')?.classList.toggle('scrolled', window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <a href="/" className="nav-logo">
            <span className="nav-logo-icon">CB</span>
            ChatBot Pro
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#/admin" className="btn btn-primary btn-sm">Get Started</a>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
        </div>
        <div className="container hero-content">
          <span className="hero-badge">✨ No website required</span>
          <h1 className="hero-title">
            Your AI assistant<br />for <span className="grad-text">any business</span>
          </h1>
          <p className="hero-sub">
            Deploy a smart chatbot in minutes that collects leads, takes bookings, accepts payments, and answers questions — on your website, WhatsApp, or a standalone page.
          </p>
          <div className="hero-cta">
            <a href="#/admin" className="btn btn-primary">Start Free →</a>
            <a href="#features" className="btn btn-ghost">See Features</a>
          </div>
          <div className="hero-proof">
            <div className="hero-proof-item">
              <div className="hero-proof-num">2,400+</div>
              <div className="hero-proof-label">Businesses</div>
            </div>
            <div className="hero-proof-item">
              <div className="hero-proof-num">1.2M</div>
              <div className="hero-proof-label">Conversations</div>
            </div>
            <div className="hero-proof-item">
              <div className="hero-proof-num">98%</div>
              <div className="hero-proof-label">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <span className="hero-badge">Features</span>
          <h2 className="section-title">Everything you need to<br /><span className="grad-text">automate client engagement</span></h2>
          <p className="section-sub">No coding. No website. Just configure and deploy.</p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="section" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <span className="hero-badge">How It Works</span>
          <h2 className="section-title">Up and running in <span className="grad-text">3 steps</span></h2>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.title}>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="container">
          <span className="hero-badge">Pricing</span>
          <h2 className="section-title">Start free. <span className="grad-text">Scale when ready.</span></h2>
          <p className="section-sub">No credit card required for the free plan.</p>
          <div className="pricing-grid">
            {PLANS.map((p) => (
              <div className={`price-card ${p.featured ? 'featured' : ''}`} key={p.name}>
                <h3 className="price-name">{p.name}</h3>
                <div className="price-amount">{p.price}</div>
                <div className="price-period">{p.period}</div>
                <ul className="price-features">
                  {p.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <a href="#/admin" className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`} style={{ width: '100%', justifyContent: 'center' }}>
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to automate your business?</h2>
            <p>Join 2,400+ businesses already using ChatBot Pro to capture leads and accept payments 24/7.</p>
            <button className="cta-btn" onClick={() => window.location.hash = '#/admin'}>Create Free Account →</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>ChatBot Pro — AI assistants for businesses that don't need a website.</p>
        </div>
      </footer>
    </>
  )
}
