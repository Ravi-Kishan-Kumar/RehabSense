import { JOINTS, getExerciseTracking } from '../data/joints'

export default function JointInfoPanel({ activeKey, exercise, currentAngle }) {
  const j = JOINTS[activeKey]
  const tracking = getExerciseTracking(j, exercise)
  const range = tracking.maxAngle - tracking.minAngle
  const goodL = tracking.scoreMetric === 'span' ? (tracking.goodRange[0] / range) * 100 : ((tracking.goodRange[0] - tracking.minAngle) / range) * 100
  const goodW = tracking.scoreMetric === 'span' ? ((tracking.goodRange[1] - tracking.goodRange[0]) / range) * 100 : ((tracking.goodRange[1] - tracking.goodRange[0]) / range) * 100
  const pct = currentAngle > 0 ? Math.min(Math.max(((currentAngle - tracking.minAngle) / range) * 100, 0), 100) : 0

  return (
    <div style={{ background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 11, padding: '.75rem', marginTop: '.5rem' }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        {j.icon} {j.label}
      </div>
      <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
        Tracking: {j.keypoints.join(' → ')}
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '1.4rem', fontWeight: 500, margin: '.4rem 0 .2rem', color: j.color }}>
        {currentAngle > 0 ? currentAngle + '°' : '—°'}
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.58rem', color: 'var(--muted)' }}>
        {tracking.targetLabel}: <span>{tracking.goodRange[0]}–{tracking.goodRange[1]}°</span>
      </div>

      {/* Range bar */}
      <div style={{ height: 6, borderRadius: 100, background: 'var(--bdr)', margin: '.5rem 0 .2rem', position: 'relative', overflow: 'visible' }}>
        <div style={{ height: '100%', borderRadius: 100, position: 'absolute', top: 0, left: goodL + '%', width: goodW + '%', background: 'var(--success)' }} />
        {currentAngle > 0 && (
          <div style={{ width: 3, height: 14, borderRadius: 2, position: 'absolute', top: -4, left: pct + '%', transform: 'translateX(-50%)', background: '#fff', transition: 'left .3s' }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: '.55rem', color: 'var(--muted)' }}>
        <span>{tracking.scoreMetric === 'span' ? '0°' : tracking.minAngle + '°'}</span>
        <span style={{ color: 'var(--success)' }}>✓ Good Zone</span>
        <span>{tracking.scoreMetric === 'span' ? Math.round(range) + '°' : tracking.maxAngle + '°'}</span>
      </div>
    </div>
  )
}
