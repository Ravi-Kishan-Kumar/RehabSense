import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

// ── Mini SVG line chart ──────────────────────────────────────────────────────
function LineChart({ sessions }) {
  if (!sessions || sessions.length < 2) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '.8rem' }}>
      Complete at least 2 sessions to see your accuracy trend.
    </div>
  )
  const pts = sessions.slice(-12).reverse()
  const W = 460, H = 120, PAD = 12
  const accs = pts.map(s => s.accuracy)
  const min = Math.max(0, Math.min(...accs) - 10)
  const max = Math.min(100, Math.max(...accs) + 10)
  const xStep = (W - PAD * 2) / (pts.length - 1)
  const yScale = v => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2)
  const coords = pts.map((s, i) => ({ x: PAD + i * xStep, y: yScale(s.accuracy), v: s.accuracy }))
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const fill = path + ` L ${coords[coords.length - 1].x} ${H} L ${coords[0].x} ${H} Z`
  const color = 'var(--accent)'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => {
        if (v < min || v > max) return null
        const y = yScale(v)
        return (
          <g key={v}>
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--bdr)" strokeWidth="0.8" strokeDasharray="4 4" />
            <text x={PAD - 4} y={y + 3} fontSize="8" fill="var(--muted)" textAnchor="end">{v}%</text>
          </g>
        )
      })}
      {/* Fill area */}
      <path d={fill} fill="url(#accGrad)" />
      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points + labels */}
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="4" fill={color} stroke="var(--surf)" strokeWidth="2" />
          <text x={c.x} y={H - 1} fontSize="7.5" fill="var(--muted)" textAnchor="middle">
            {pts[i].exercise_name?.split(' ')[0]}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Rep quality stacked bar chart ────────────────────────────────────────────
function QualityBars({ sessions }) {
  const pts = sessions.slice(-8).reverse()
  if (!pts.length) return null
  const maxReps = Math.max(...pts.map(s => s.total_reps), 1)

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: 80 }}>
      {pts.map((s, i) => {
        const total = s.total_reps || 1
        const gPct = (s.good_reps / total) * 100
        const wPct = (s.warn_reps / total) * 100
        const bPct = (s.bad_reps / total) * 100
        const barH = (total / maxReps) * 68
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', height: barH, display: 'flex', flexDirection: 'column', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
              <div style={{ height: gPct + '%', background: 'var(--success)', opacity: .85 }} title={`Good: ${s.good_reps}`} />
              <div style={{ height: wPct + '%', background: 'var(--warn)', opacity: .85 }} title={`Warn: ${s.warn_reps}`} />
              <div style={{ height: bPct + '%', background: 'var(--danger)', opacity: .85 }} title={`Bad: ${s.bad_reps}`} />
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '7px', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>
              {s.exercise_name?.split(' ')[0]}<br />{total}r
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ good, warn, bad }) {
  const total = good + warn + bad || 1
  const R = 36, C = 2 * Math.PI * R
  const gPct = good / total, wPct = warn / total, bPct = bad / total
  const gDash = gPct * C, wDash = wPct * C, bDash = bPct * C
  const gOff = 0, wOff = -gDash, bOff = -(gDash + wDash)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={R} fill="none" stroke="var(--bdr)" strokeWidth="10" />
        {good > 0 && <circle cx="44" cy="44" r={R} fill="none" stroke="var(--success)" strokeWidth="10"
          strokeDasharray={`${gDash} ${C - gDash}`} strokeDashoffset={C * 0.25} strokeLinecap="butt" />}
        {warn > 0 && <circle cx="44" cy="44" r={R} fill="none" stroke="var(--warn)" strokeWidth="10"
          strokeDasharray={`${wDash} ${C - wDash}`} strokeDashoffset={C * 0.25 - gDash} strokeLinecap="butt" />}
        {bad > 0 && <circle cx="44" cy="44" r={R} fill="none" stroke="var(--danger)" strokeWidth="10"
          strokeDasharray={`${bDash} ${C - bDash}`} strokeDashoffset={C * 0.25 - gDash - wDash} strokeLinecap="butt" />}
        <text x="44" y="41" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--text)" fontFamily="Syne,sans-serif">
          {Math.round((good / total) * 100)}%
        </text>
        <text x="44" y="53" textAnchor="middle" fontSize="7.5" fill="var(--muted)" fontFamily="DM Mono,monospace">CORRECT</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
        {[['var(--success)', `${good} Correct`, good], ['var(--warn)', `${warn} Partial`, warn], ['var(--danger)', `${bad} Incorrect`, bad]].map(([c, l, v]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />
            <span style={{ color: 'var(--text2)' }}>{l}</span>
            <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", color: c }}>{Math.round((v / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Report() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [s, r] = await Promise.all([client.get('/sessions'), client.get('/report/summary')])
        setSessions(s.data)
        setSummary(r.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function downloadPDF(id) {
    setDownloading(id)
    try {
      const res = await client.get(`/report/pdf/${id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `rehabsense_session_${id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('PDF generation failed.') }
    finally { setDownloading(null) }
  }

  const fmtDur = s => `${Math.floor(s / 60)}m ${s % 60}s`
  const totalGood = sessions.reduce((a, s) => a + s.good_reps, 0)
  const totalWarn = sessions.reduce((a, s) => a + s.warn_reps, 0)
  const totalBad = sessions.reduce((a, s) => a + s.bad_reps, 0)

  return (
    <>
      <Header />
      <div className="report-page">
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.55rem' }}>📋 Session Reports</h1>
            <p style={{ color: 'var(--text2)', fontSize: '.82rem', marginTop: '.2rem' }}>{user?.full_name} · All sessions</p>
          </div>
          <button className="btn btn-primary" style={{ fontSize: '.82rem' }} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        </div>

        {/* Summary stats */}
        {summary && (
          <div className="stat-grid">
            {[
              { val: summary.total_sessions, label: 'Sessions', color: 'var(--accent)' },
              { val: summary.total_reps, label: 'Total Reps', color: 'var(--text)' },
              { val: summary.total_good_reps, label: 'Correct ✅', color: 'var(--success)' },
              { val: summary.avg_accuracy.toFixed(1) + '%', label: 'Avg Accuracy', color: summary.avg_accuracy >= 80 ? 'var(--success)' : summary.avg_accuracy >= 50 ? 'var(--warn)' : 'var(--danger)' },
              { val: fmtDur(summary.total_duration_seconds), label: 'Total Time', color: 'var(--text2)' },
              { val: summary.joints_trained.length, label: 'Joints', color: '#a78bfa' },
            ].map(({ val, label, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-val" style={{ color }}>{val}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {sessions.length >= 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '.85rem', marginBottom: '1.25rem' }}>
            <div className="chart-wrap">
              <div className="chart-title">Accuracy Trend — Last 12 Sessions</div>
              <LineChart sessions={sessions} />
            </div>
            <div className="chart-wrap">
              <div className="chart-title">Overall Rep Quality</div>
              <DonutChart good={totalGood} warn={totalWarn} bad={totalBad} />
              <div style={{ marginTop: '1rem' }}>
                <div className="chart-title">Per-Session Quality</div>
                <QualityBars sessions={sessions} />
                <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                  {[['var(--success)', 'Good'], ['var(--warn)', 'Partial'], ['var(--danger)', 'Bad']].map(([c, l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.65rem', color: 'var(--muted)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏃</div>
            <p style={{ color: 'var(--muted)' }}>No sessions yet. Start your first session!</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/dashboard')}>Start Now →</button>
          </div>
        ) : (
          sessions.map(s => {
            const acc = s.accuracy
            const accColor = acc >= 80 ? 'var(--success)' : acc >= 50 ? 'var(--warn)' : 'var(--danger)'
            const isOpen = expanded === s.id
            return (
              <div key={s.id} className="session-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.92rem' }}>{s.exercise_name}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--text2)', marginTop: 2 }}>
                      {s.joint_label} · {s.exercise_type} · {new Date(s.started_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { v: s.total_reps, l: 'Reps', c: 'var(--text)' },
                      { v: s.good_reps + '✅', l: 'Good', c: 'var(--success)' },
                      { v: s.warn_reps + '⚠️', l: 'Partial', c: 'var(--warn)' },
                      { v: s.bad_reps + '❌', l: 'Bad', c: 'var(--danger)' },
                      { v: acc.toFixed(1) + '%', l: 'Accuracy', c: accColor },
                      { v: fmtDur(s.duration_seconds), l: 'Duration', c: 'var(--muted)' },
                    ].map(({ v, l, c }) => (
                      <div key={l} style={{ textAlign: 'center', minWidth: 44 }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.82rem', fontWeight: 700, color: c }}>{v}</div>
                        <div style={{ fontSize: '.58rem', color: 'var(--muted)' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '.7rem', padding: '5px 11px' }} onClick={() => setExpanded(isOpen ? null : s.id)}>
                      {isOpen ? '▲' : '▼'} Reps
                    </button>
                    <button className="btn btn-primary" style={{ fontSize: '.7rem', padding: '5px 13px' }} onClick={() => downloadPDF(s.id)} disabled={downloading === s.id}>
                      {downloading === s.id ? '…' : '⬇ PDF'}
                    </button>
                  </div>
                </div>

                {isOpen && s.rep_logs?.length > 0 && (
                  <div style={{ marginTop: '.85rem', borderTop: '1px solid var(--bdr)', paddingTop: '.75rem' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', color: 'var(--muted)', marginBottom: '.5rem', textTransform: 'uppercase' }}>Rep Log</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: '.35rem' }}>
                      {s.rep_logs.map(r => {
                        const c = r.quality === 'good' ? 'var(--success)' : r.quality === 'warn' ? 'var(--warn)' : 'var(--danger)'
                        const lbl = r.quality === 'good' ? '✅' : r.quality === 'warn' ? '⚠️' : '❌'
                        return (
                          <div key={r.id} style={{ padding: '.42rem .62rem', borderRadius: 7, border: `1px solid ${c}33`, background: `${c}0d`, fontSize: '.73rem' }}>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.62rem', color: 'var(--muted)' }}>#{r.rep_number} </span>
                            <span style={{ color: c, fontWeight: 700 }}>{lbl}</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.62rem', color: 'var(--muted)', float: 'right' }}>{r.angle.toFixed(1)}°</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
