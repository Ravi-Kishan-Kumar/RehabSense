export default function AIAdvicePanel({ advice, loading }) {
  if (loading) return (
    <div className="ai-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '1.1rem' }}>🤖</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.9rem' }}>Gemini AI — Analysing…</span>
        <div className="dot" style={{ marginLeft: 'auto', color: '#a78bfa' }} />
      </div>
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '.82rem' }}>
        Generating personalised recommendations…
      </div>
    </div>
  )

  if (!advice) return null

  const adjColor = advice.difficulty_adjustment === 'increase' ? 'var(--success)' : advice.difficulty_adjustment === 'decrease' ? 'var(--danger)' : 'var(--warn)'
  const adjIcon = advice.difficulty_adjustment === 'increase' ? '↑' : advice.difficulty_adjustment === 'decrease' ? '↓' : '→'

  return (
    <div className="ai-panel fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '1.1rem' }}>🤖</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.9rem', color: '#a78bfa' }}>Gemini AI Analysis</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.58rem', padding: '2px 8px', borderRadius: 5, background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.3)', color: '#a78bfa', marginLeft: 'auto' }}>gemini-flash</span>
      </div>

      {/* Form feedback */}
      <div style={{ fontSize: '.8rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: '.75rem', padding: '.65rem .8rem', background: 'rgba(0,0,0,.2)', borderRadius: 8, borderLeft: '3px solid #a78bfa' }}>
        {advice.form_feedback}
      </div>

      {/* Tips */}
      {advice.tips?.length > 0 && (
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', color: 'var(--muted)', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Improvement Tips</div>
          {advice.tips.map((tip, i) => (
            <div key={i} className="ai-tip">
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next exercise */}
      <div style={{ background: 'rgba(0,255,224,.05)', border: '1px solid rgba(0,255,224,.15)', borderRadius: 10, padding: '.7rem .9rem' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', color: 'var(--muted)', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Recommended Next</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.92rem', marginBottom: '.25rem' }}>{advice.next_exercise}</div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.68rem', padding: '2px 9px', borderRadius: 6, background: 'rgba(0,255,224,.08)', border: '1px solid rgba(0,255,224,.2)', color: 'var(--accent)' }}>
            {advice.next_reps} reps × {advice.next_sets} sets
          </span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.68rem', padding: '2px 9px', borderRadius: 6, background: `${adjColor}18`, border: `1px solid ${adjColor}44`, color: adjColor }}>
            {adjIcon} {advice.difficulty_adjustment}
          </span>
        </div>
      </div>
    </div>
  )
}
