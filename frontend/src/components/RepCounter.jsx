export default function RepCounter({ reps, repScores }) {
  const accuracy = reps.total > 0 ? Math.round((reps.good / reps.total) * 100) : 0
  const accColor = accuracy >= 80 ? 'var(--success)' : accuracy >= 50 ? 'var(--warn)' : 'var(--danger)'

  return (
    <div className="card">
      <div className="clabel">▸ Rep Counter — Live Tracking</div>
      <div className="rep-grid">
        {[
          { n: reps.total, cls: 'a', label: 'Total Reps' },
          { n: reps.good,  cls: 'g', label: '✅ Correct' },
          { n: reps.warn,  cls: 'w', label: '⚠️ Partial' },
          { n: reps.bad,   cls: 'b', label: '❌ Incorrect' },
        ].map(({ n, cls, label }) => (
          <div key={label} className="rstat">
            <div className={`rstat-n ${cls}`}>{n}</div>
            <div className="rstat-l">{label}</div>
          </div>
        ))}
      </div>

      {/* Accuracy bar */}
      <div style={{ marginTop: '.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: '.6rem', color: 'var(--muted)', marginBottom: 4 }}>
          <span>ACCURACY</span>
          <span style={{ color: reps.total > 0 ? accColor : 'var(--muted)' }}>{reps.total > 0 ? accuracy + '%' : '—%'}</span>
        </div>
        <div style={{ height: 6, borderRadius: 100, background: 'var(--bdr)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 100, width: accuracy + '%', background: accColor, transition: 'width .5s ease, background .3s' }} />
        </div>
      </div>

      {/* Score ring + bar chart */}
      {repScores.length > 0 && (
        <div style={{ marginTop: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
            <ScoreRing score={repScores[repScores.length - 1]?.score ?? 50} />
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.88rem' }}>
                {(repScores[repScores.length - 1]?.score ?? 0) >= 80 ? 'Excellent Form' : (repScores[repScores.length - 1]?.score ?? 0) >= 60 ? 'Partial ROM' : 'Needs Work'}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 3 }}>
                Last rep score: {repScores[repScores.length - 1]?.score ?? '—'}
              </div>
            </div>
          </div>
          {/* Mini bar chart */}
          <div className="bars" style={{ marginTop: '.6rem' }}>
            {repScores.slice(-20).map((r, i) => {
              const mx = Math.max(...repScores.slice(-20).map(x => x.score), 1)
              const color = r.quality === 'good' ? 'var(--success)' : r.quality === 'warn' ? 'var(--warn)' : 'var(--danger)'
              return <div key={i} className="bar" style={{ height: `${(r.score / mx) * 100}%`, background: color, opacity: i === repScores.slice(-20).length - 1 ? 1 : .55 }} title={`Rep ${i+1}: ${r.score}`} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreRing({ score }) {
  const offset = 220 - (score / 100) * 220
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warn)' : 'var(--danger)'
  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 80 80"><circle className="rbg" cx="40" cy="40" r="35"/><circle className="rfill" cx="40" cy="40" r="35" style={{ stroke: color, strokeDashoffset: offset }} /></svg>
      <div className="rval" style={{ color }}>{score}</div>
    </div>
  )
}
