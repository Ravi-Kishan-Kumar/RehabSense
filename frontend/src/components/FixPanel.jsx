import { JOINTS, getExerciseTracking } from '../data/joints'

export default function FixPanel({ activeKey, exercise, currentAngle, cameraOn, sessionActive }) {
  const j = JOINTS[activeKey]
  const tracking = getExerciseTracking(j, exercise)

  const issues = []
  if (cameraOn && currentAngle > 0 && sessionActive) {
    if (tracking.scoreMetric === 'min' && currentAngle > tracking.goodRange[1] && currentAngle <= tracking.partialRange[1]) {
      issues.push({
        name: 'Incomplete Flexion',
        fix: 'At the deepest bend, bring the limb a little closer before returning.',
        icon: '📐',
      })
    }
    if (tracking.scoreMetric === 'max' && currentAngle < tracking.goodRange[0] && currentAngle >= tracking.partialRange[0]) {
      issues.push({
        name: 'Incomplete Extension',
        fix: 'At the straightest point, extend a little farther before returning.',
        icon: '📐',
      })
    }
  }

  const targetSummary =
    tracking.scoreMetric === 'span'
      ? `Rep score uses total movement range. Goal: ${tracking.targetAngle}° or more.`
      : tracking.scoreMetric === 'min'
      ? `Rep score uses the deepest flexion angle. Target: about ${tracking.targetAngle}°.`
      : `Rep score uses the straightest extension angle. Target: about ${tracking.targetAngle}°.`

  const targetReached =
    tracking.scoreMetric === 'span'
      ? false
      : tracking.scoreMetric === 'min'
      ? currentAngle > 0 && currentAngle <= tracking.goodRange[1]
      : currentAngle > 0 && currentAngle >= tracking.goodRange[0]

  return (
    <div className="card" id="fixPanel">
      <div className="sec-title">⚠️ What's Wrong &amp; How to Fix</div>

      {!cameraOn ? (
        <div className="fix-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
            <span>📷</span><span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.78rem' }}>Enable Camera</span>
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Enable camera to see real-time angle analysis and form corrections.</div>
        </div>
      ) : (
        <>
          {/* Angle vs target */}
          {currentAngle > 0 && (
            <div className="fix-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                <span>📐</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.78rem' }}>{tracking.targetLabel}</span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                Current live angle: <b style={{ color: j.color }}>{currentAngle}°</b>
              </div>
              <span className={`fix-degrees ${targetReached ? 'ok' : 'warn'}`}>
                {targetReached ? '✓ Target zone reached' : targetSummary}
              </span>
            </div>
          )}

          {issues.length === 0 && currentAngle > 0 ? (
            <div className="fix-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                <span>{targetReached ? '✅' : '↔'}</span><span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.78rem' }}>{targetReached ? 'Form Looks Good' : 'Move Through the Rep'}</span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{targetReached ? 'No major form issues detected. Maintain control through the return.' : 'This exercise is evaluated at the key point of the movement, not at every live angle.'}</div>
              <span className={`fix-degrees ${targetReached ? 'ok' : 'warn'}`}>{targetReached ? '✓ Good posture' : 'Keep moving smoothly'}</span>
            </div>
          ) : (
            issues.map((issue, i) => (
              <div key={i} className="fix-item fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                  <span>{issue.icon}</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.78rem' }}>{issue.name}</span>
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>{issue.fix}</div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
