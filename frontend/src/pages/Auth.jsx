import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  // Login form state
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')

  // Register form state
  const [rName, setRName] = useState('')
  const [rUsername, setRUsername] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  const [rPass2, setRPass2] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(lEmail, lPass)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (rPass !== rPass2) { setError('Passwords do not match'); return }
    if (rPass.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setLoading(true)
    try {
      await register(rUsername, rEmail, rName, rPass)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {/* ── Left brand panel ── */}
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="logo-mark" style={{ width: 52, height: 52, fontSize: 26 }}>🦾</div>
            <span className="logo-name" style={{ fontSize: '1.8rem' }}>Rehab<span>Sense</span></span>
          </div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem' }}>
            Your AI Rehabilitation Partner
          </h2>
          <p className="auth-left-copy" style={{ lineHeight: 1.7, fontSize: '.92rem', marginBottom: '2.5rem' }}>
            Real-time pose tracking, intelligent rep counting, and personalised AI exercise advice — all in your browser.
          </p>

          {/* Feature pills */}
          {['📷 Camera-based tracking — no wearables', '🤖 Gemini AI exercise suggestions', '📋 Downloadable PDF reports', '🔒 Secure & private — camera stays local'].map(f => (
            <div className="auth-feature-pill" key={f} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.7rem', borderRadius: 10, padding: '.65rem 1rem', textAlign: 'left' }}>
              <span style={{ fontSize: '.85rem' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-box">
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.6rem', marginBottom: '.3rem' }}>
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>
              {tab === 'login' ? 'Sign in to your RehabSense account' : 'Start your rehabilitation journey today'}
            </p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Sign In</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Register</button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 9, padding: '.65rem .9rem', color: 'var(--danger)', fontSize: '.82rem', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="login-email" className="form-input" type="email" placeholder="you@example.com" value={lEmail} onChange={e => setLEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input id="login-password" className="form-input" type="password" placeholder="••••••••" value={lPass} onChange={e => setLPass(e.target.value)} required />
              </div>
              <button id="login-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '.85rem', fontSize: '1rem', marginTop: '.5rem' }}>
                {loading ? 'Signing in…' : '▶ Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="reg-name" className="form-input" type="text" placeholder="e.g. Priya Krishnan" value={rName} onChange={e => setRName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input id="reg-username" className="form-input" type="text" placeholder="e.g. priyak" value={rUsername} onChange={e => setRUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="reg-email" className="form-input" type="email" placeholder="you@example.com" value={rEmail} onChange={e => setREmail(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password</label>
                  <input id="reg-password" className="form-input" type="password" placeholder="••••••••" value={rPass} onChange={e => setRPass(e.target.value)} required minLength={6} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirm</label>
                  <input id="reg-password2" className="form-input" type="password" placeholder="••••••••" value={rPass2} onChange={e => setRPass2(e.target.value)} required />
                </div>
              </div>
              <button id="reg-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '.85rem', fontSize: '1rem', marginTop: '1.2rem' }}>
                {loading ? 'Creating account…' : '✦ Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.78rem', color: 'var(--muted)' }}>
            {tab === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '.78rem' }}>
              {tab === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
