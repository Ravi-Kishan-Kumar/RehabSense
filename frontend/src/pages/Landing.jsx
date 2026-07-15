import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Landing() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const features = [
    { icon: '📷', title: 'Real-Time Pose Tracking', desc: 'MediaPipe-powered skeleton tracking detects 33 body landmarks at up to 30 FPS — all processed locally in your browser.' },
    { icon: '🔢', title: 'Intelligent Rep Counting', desc: 'Automatic rep detection with quality grading: Correct, Partial, or Incorrect — based on angle thresholds and ROM targets.' },
    { icon: '🤖', title: 'Gen AI Suggestions', desc: 'Google Gemini analyses your session and recommends the next exercise, optimal reps, and personalised form corrections.' },
    { icon: '📋', title: 'PDF Report Generation', desc: 'Download a professional clinical report for every session with rep logs, AI advice, and ROM progress.' },
    { icon: '🗺️', title: 'Interactive Body Map', desc: 'Click any joint on the 3D body map to instantly switch tracking targets and view joint-specific exercise plans.' },
    { icon: '🔐', title: 'Secure Patient Accounts', desc: 'Every session is saved securely to a database with JWT authentication. All camera data stays on your device.' },
  ]

  const steps = [
    { n: '1', title: 'Create Your Account', desc: 'Register with your name and email. Your data is stored securely and never shared.' },
    { n: '2', title: 'Select Joint & Exercise', desc: 'Choose the affected joint from the body map, then pick an exercise from your personalised plan.' },
    { n: '3', title: 'Start Tracking', desc: 'Enable camera and begin your session. Get real-time feedback, rep counts, and AI suggestions after each set.' },
  ]

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="logo">
          <div className="logo-mark">🦾</div>
          <span className="logo-name">Rehab<span>Sense</span></span>
        </div>
        <div className="landing-nav-actions">
          <button className="theme-toggle landing-theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Open Dashboard →</button>
          ) : (
            <>
              <Link to="/auth" style={{ color: 'var(--muted)', fontSize: '.88rem', fontWeight: 500 }}>Sign In</Link>
              <Link to="/auth"><button className="btn btn-primary">Get Started →</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" style={{ paddingTop: '5rem' }}>
        <h1>AI-Powered <span>Rehabilitation</span> Monitoring</h1>
        <p>Track joint angles, count reps with quality scoring, and receive personalised AI exercise suggestions — all in real-time using your camera.</p>
        <div className="hero-btns">
          <button className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }} onClick={() => navigate('/auth')}>
            Start Free →
          </button>
          <a href="#features"><button className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: '1rem' }}>See Features</button></a>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['13+', 'Joint Targets'], ['100%', 'Local Camera'], ['AI', 'Exercise Advisor'], ['PDF', 'Report Export']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.8rem', color: 'var(--accent)' }}>{v}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features" id="features">
        <div style={{ textAlign: 'center', marginBottom: '.5rem' }}>
          <div className="hero-badge" style={{ marginBottom: '.8rem' }}>Features</div>
          <div className="section-title">Everything you need for<br />effective rehabilitation</div>
          <p className="section-sub" style={{ marginTop: '.5rem' }}>Built for physiotherapists and patients alike</p>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="steps">
        <div className="hero-badge" style={{ marginBottom: '.8rem' }}>How It Works</div>
        <div className="section-title">Three steps to better recovery</div>
        <div className="step-grid" style={{ marginTop: '2.5rem' }}>
          {steps.map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div className="step-num">{s.n}</div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: '.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: '3rem', padding: '14px 40px', fontSize: '1rem' }} onClick={() => navigate('/auth')}>
          Start Your Rehabilitation →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--bdr)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="logo"><div className="logo-mark" style={{ width: 26, height: 26, fontSize: 12 }}>🦾</div><span className="logo-name" style={{ fontSize: '1rem' }}>Rehab<span>Sense</span></span></div>
        <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>For clinical use only — not a substitute for professional medical advice.</p>
      </footer>
    </div>
  )
}
