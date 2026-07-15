import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Header() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate('/')}>
        <div className="logo-mark">🦾</div>
        <div>
          <span className="logo-name">Rehab<span>Sense</span></span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',color:'var(--muted)',letterSpacing:'1.2px',marginLeft:7}}>CAMERA AI</span>
        </div>
      </div>

      <div className="header-right">
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',color:'var(--muted)',padding:'4px 10px',background:'var(--surf2)',border:'1px solid var(--bdr)',borderRadius:7}}>
          🔒 Local · No upload
        </div>

        {user && (
          <button className="btn btn-ghost" style={{fontSize:'.72rem',padding:'5px 12px'}} onClick={() => navigate('/report')}>
            📋 Reports
          </button>
        )}

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user && (
          <>
            <div style={{display:'flex',alignItems:'center',gap:'.4rem',fontFamily:"'DM Mono',monospace",fontSize:'.63rem',padding:'4px 11px',borderRadius:'100px',background:'rgba(109,40,217,.12)',border:'1px solid rgba(109,40,217,.3)',color:'#a78bfa'}}>
              👤 {user.full_name.split(' ')[0]}
            </div>
            <button className="btn btn-ghost" style={{fontSize:'.72rem',padding:'5px 12px'}} onClick={() => { logout(); navigate('/') }}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  )
}
