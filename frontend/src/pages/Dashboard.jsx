import { useState, useRef, useCallback, useEffect } from 'react'
import ExerciseChat from '../components/ExerciseChat'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import CameraPanel from '../components/CameraPanel'
import BodyMap from '../components/BodyMap'
import RepCounter from '../components/RepCounter'
import AIAdvicePanel from '../components/AIAdvicePanel'
import FixPanel from '../components/FixPanel'
import ExercisePlan from '../components/ExercisePlan'
import JointInfoPanel from '../components/JointInfoPanel'
import { JOINTS, getInitials, getExerciseTracking } from '../data/joints'
import client from '../api/client'

// ── Toast helper ─────────────────────────────────────────────
let toastId = 0
function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, accent = false) => {
    const id = ++toastId
    setToasts(t => [...t, { id, msg, accent }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])
  return { toasts, push }
}

// ── Speech helper ─────────────────────────────────────────────
function speak(text, rate = 0.92, pitch = 1.05) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate; u.pitch = pitch
  window.speechSynthesis.speak(u)
}

export default function Dashboard() {
  const { user } = useAuth()
  const { toasts, push: toast } = useToasts()

  // ── Core state ──────────────────────────────────────────────
  const [activeKey, setActiveKey] = useState('l-knee')
  const [reps, setReps] = useState({ total: 0, good: 0, warn: 0, bad: 0 })
  const [repScores, setRepScores] = useState([])
  const [repLog, setRepLog] = useState([])
  const [currentAngle, setCurrentAngle] = useState(0)
  const [landmarks, setLandmarks] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)

  // Exercise selection
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState(0)
  const [selectedRepTarget, setSelectedRepTarget] = useState(12)
  const [exerciseConfirmed, setExerciseConfirmed] = useState(false)

  // Session / timer
  const [sessionActive, setSessionActive] = useState(false)
  const sessionActiveRef = useRef(false)          // ref for stale-closure-free access
  const [timerSec, setTimerSec] = useState(0)
  const timerRef = useRef(null)
  const currentSessionIdRef = useRef(null)
  const repLogRef = useRef([])                    // ref copy of repLog for finishExercise
  const repScoresRef = useRef([])                 // ref copy for avgScore calc

  // AI
  const [aiAdvice, setAiAdvice] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const guidanceRef = useRef(null)   // periodic guidance interval

  // ── Derived ─────────────────────────────────────────────────
  const j = JOINTS[activeKey]
  const ex = j.exercises[selectedExerciseIdx] || j.exercises[0]
  const tracking = getExerciseTracking(j, ex)

  // ── Joint switch ─────────────────────────────────────────────
  function switchJoint(key) {
    setActiveKey(key)
    setExerciseConfirmed(false)
    setSelectedExerciseIdx(0)
    setSelectedRepTarget(JOINTS[key].exercises[0].recs)
    resetReps()
    setAiAdvice(null)
    toast(`📍 Switched to ${JOINTS[key].label}`, true)
  }

  function resetReps() {
    setReps({ total: 0, good: 0, warn: 0, bad: 0 })
    setRepScores([])
    setRepLog([])
    repScoresRef.current = []
    repLogRef.current = []
  }

  // ── Exercise confirm + guidance speech ──────────────────────
  async function confirmExercise() {
    setExerciseConfirmed(true)
    resetReps()
    setAiAdvice(null)

    // Speak exercise name + first two steps
    const steps = ex.steps || []
    const intro = `Starting ${ex.name} for ${j.label}. ${steps[0] || ''} ${steps[1] || ''}`
    setTimeout(() => speak(intro, 0.88, 1.0), 400)

    // Create session in backend
    try {
      const { data } = await client.post('/sessions', {
        joint_key: activeKey,
        joint_label: j.label,
        exercise_name: ex.name,
        exercise_type: ex.type,
        target_reps: selectedRepTarget,
      })
      currentSessionIdRef.current = data.id
    } catch (e) {
      console.warn('Session create failed (offline?)', e)
    }
    toast(`✅ Exercise set: ${ex.name} × ${selectedRepTarget} reps`, true)
  }

  // ── Timer + guidance speech ───────────────────────────────────
  function toggleSession() {
    if (!exerciseConfirmed) { toast('⚠️ Confirm an exercise first'); return }
    if (sessionActiveRef.current) {
      clearInterval(timerRef.current)
      clearInterval(guidanceRef.current)
      setSessionActive(false); sessionActiveRef.current = false
      speak('Session paused. Great work so far.')
      toast('⏸ Session paused')
    } else {
      setSessionActive(true); sessionActiveRef.current = true
      timerRef.current = setInterval(() => setTimerSec(t => t + 1), 1000)
      speak(`Starting ${ex.name}. Get into position and begin when ready.`, 0.9, 1.05)
      toast(`🏃 Session started — ${ex.name}`, true)
      // Periodic guidance every 30 s
      guidanceRef.current = setInterval(() => {
        if (!sessionActiveRef.current) return
        const cues = [
          'Keep breathing steadily through each rep.',
          'Control the movement — slow and smooth.',
          'Focus on your form and full range of motion.',
          'You are doing great — stay consistent.',
        ]
        speak(cues[Math.floor(Math.random() * cues.length)], 0.88, 1.0)
      }, 30000)
    }
  }

  function resetSession() {
    clearInterval(timerRef.current)
    clearInterval(guidanceRef.current)
    setSessionActive(false); sessionActiveRef.current = false
    setTimerSec(0)
    setExerciseConfirmed(false)
    resetReps()
    setAiAdvice(null)
    currentSessionIdRef.current = null
    window.speechSynthesis?.cancel()
    toast('↺ Session reset')
  }

  // ── Angle update from camera ─────────────────────────────────
  const handleAngleUpdate = useCallback((angle, lms) => {
    setCurrentAngle(angle)
    setLandmarks(lms)
    setCameraOn(true)
  }, [])

  // ── Rep complete from camera — uses ref so never stale ──────
  const handleRepComplete = useCallback(({ quality, score, angle, issues }) => {
    const label = quality === 'good' ? '✅ Correct' : quality === 'warn' ? '⚠️ Partial' : '❌ Incorrect'
    const issueStr = issues?.length ? ` — ${issues[0].name}` : ''

    setReps(r => {
      const next = {
        total: r.total + 1,
        good:  r.good + (quality === 'good' ? 1 : 0),
        warn:  r.warn + (quality === 'warn' ? 1 : 0),
        bad:   r.bad  + (quality === 'bad'  ? 1 : 0),
      }
      toast(`${label} Rep ${next.total} · ${angle}°${issueStr}`, quality === 'good')
      // Guided voice per rep quality
      if (quality === 'good') speak(`Good rep. ${next.good} correct.`, 0.95, 1.1)
      else if (quality === 'warn') speak('Partial rep. Try to move a little farther with control.', 0.9, 1.0)
      else speak('Check your form and try again.', 0.88, 0.95)
      if (next.total >= selectedRepTarget) setTimeout(() => finishExercise(next), 700)
      return next
    })

    setRepScores(prev => { const n = [...prev.slice(-19), { score, quality }]; repScoresRef.current = n; return n })
    setRepLog(prev => { const n = [...prev, { rep: prev.length + 1, quality, score, angle, issues }]; repLogRef.current = n; return n })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepTarget])

  // ── Finish exercise ──────────────────────────────────────────
  async function finishExercise(finalReps) {
    clearInterval(timerRef.current)
    clearInterval(guidanceRef.current)
    setSessionActive(false)
    sessionActiveRef.current = false

    const acc = finalReps.total > 0 ? Math.round((finalReps.good / finalReps.total) * 100) : 0
    const scores = repScoresRef.current
    const logs = repLogRef.current
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : 0

    toast(`🏁 Done! ${finalReps.total} reps · ${acc}% accuracy`, true)
    speak(`Exercise complete. ${finalReps.good} correct out of ${finalReps.total} reps.`)

    const sessionId = currentSessionIdRef.current
    if (sessionId) {
      try {
        // Update session stats
        await client.put(`/sessions/${sessionId}`, {
          total_reps: finalReps.total, good_reps: finalReps.good,
          warn_reps: finalReps.warn, bad_reps: finalReps.bad,
          accuracy: acc, avg_score: avgScore, duration_seconds: timerSec,
        })
        // Save rep logs
        const logItems = logs.map((r, i) => ({ rep_number: i + 1, quality: r.quality, score: r.score, angle: r.angle, issues: r.issues?.map(x => x.name) || [] }))
        if (logItems.length) await client.post('/sessions/reps/batch', { session_id: sessionId, reps: logItems })

        // Get AI suggestion
        setAiLoading(true)
        try {
          const { data: advice } = await client.post('/ai/suggest', {
            session_id: sessionId, joint_key: activeKey, joint_label: j.label,
            exercise_name: ex.name, total_reps: finalReps.total,
            good_reps: finalReps.good, warn_reps: finalReps.warn, bad_reps: finalReps.bad,
            accuracy: acc, avg_score: avgScore,
            rep_log: logs.map(r => ({ quality: r.quality, score: r.score, angle: r.angle })),
          })
          setAiAdvice(advice)
        } catch (e) { console.warn('AI suggest failed', e) }
        finally { setAiLoading(false) }
      } catch (e) { console.warn('Session update failed', e) }
    }

    setExerciseConfirmed(false)
  }

  // ── Timer display ────────────────────────────────────────────
  const mm = String(Math.floor(timerSec / 60)).padStart(2, '0')
  const ss = String(timerSec % 60).padStart(2, '0')

  // ── Feedback based on last rep ────────────────────────────────
  const lastQ = repScores[repScores.length - 1]?.quality
  const FB = {
    good: { cls: 'good', icon: '✅', title: 'Excellent Form', sub: 'Full ROM achieved — keep this up' },
    warn: { cls: 'warn', icon: '⚠️', title: 'Partial Range', sub: 'Push further for full therapeutic benefit' },
    bad:  { cls: 'bad',  icon: '❌', title: 'Form Correction Needed', sub: 'Stop, reset, and check positioning' },
  }
  const fb = FB[lastQ] || FB.warn

  const initials = user ? getInitials(user.full_name) : 'RS'

  return (
    <>
      <Header />
      <ExerciseChat />
      <main className="dashboard-main">

        {/* ── LEFT: Camera ── */}
        <div className="cam-panel" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>

          {/* Camera feed */}
          <CameraPanel
            activeKey={activeKey}
            exercise={ex}
            sessionActive={sessionActive}
            exerciseConfirmed={exerciseConfirmed}
            onAngleUpdate={handleAngleUpdate}
            onRepComplete={handleRepComplete}
            onLandmarks={lms => setLandmarks(lms)}
          />

          {/* Angle display */}
          <div className="card">
            <div className="clabel">▸ Live Joint Angles</div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {[
                { val: currentAngle ? currentAngle + '°' : '—', unit: 'degrees', name: j.angLabel, color: j.color },
                { val: `${tracking.goodRange[0]}–${tracking.goodRange[1]}°`, unit: tracking.scoreMetric === 'span' ? 'movement range' : 'target range', name: tracking.targetLabel, color: 'var(--success)' },
                { val: currentAngle ? tracking.scoreMetric === 'span' ? tracking.targetAngle + '° range' : tracking.targetAngle + '°' : '—', unit: 'exercise goal', name: 'Rep Metric', color: 'var(--warn)' },
              ].map(({ val, unit, name, color }) => (
                <div key={name} style={{ flex: 1, background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '.7rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '1.5rem', fontWeight: 500, color }}>{val}</div>
                  <div style={{ fontSize: '.6rem', color: 'var(--muted)' }}>{unit}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.7px', marginTop: 3 }}>{name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Combined: Patient info + Rep Counter + Timer ── */}
          <div className="card" id="repTimerCard">
            {/* Patient row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.7rem' }}>
              <div className="avatar">{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.9rem' }}>{user?.full_name}</div>
                <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 1 }}>{j.label} · {ex.name}</div>
              </div>
              {/* Guide speech button */}
              <button
                title="Speak exercise guide"
                onClick={() => speak((ex.steps || []).join('. '), 0.85, 1.0)}
                style={{ background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', fontSize: '.9rem' }}
              >🔊</button>
            </div>

            {/* Timer */}
            <div className="timer-big">{mm}:{ss}</div>
            <div style={{ fontSize: '.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: '.75rem' }}>Session Duration</div>

            {/* Rep stats */}
            <div className="clabel">▸ Rep Counter — Live Tracking</div>
            <div className="rep-grid">
              {[
                { n: reps.total, label: 'TOTAL REPS',  cls: 'a' },
                { n: reps.good,  label: '✅ CORRECT',   cls: 'g' },
                { n: reps.warn,  label: '⚠ PARTIAL',   cls: 'w' },
                { n: reps.bad,   label: '❌ INCORRECT', cls: 'b' },
              ].map(({ n, label, cls }) => (
                <div key={label} className="rstat">
                  <div className={`rstat-n ${cls}`}>{n}</div>
                  <div className="rstat-l">{label}</div>
                </div>
              ))}
            </div>

            {/* Accuracy bar */}
            {reps.total > 0 && (
              <div style={{ marginTop: '.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: '.6rem', color: 'var(--muted)', marginBottom: 3 }}>
                  <span>ACCURACY</span>
                  <span style={{ color: reps.total > 0 && reps.good / reps.total >= 0.8 ? 'var(--success)' : 'var(--warn)' }}>
                    {reps.total > 0 ? Math.round((reps.good / reps.total) * 100) : 0}%
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--bdr)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${reps.total > 0 ? (reps.good / reps.total) * 100 : 0}%`, background: 'var(--success)', borderRadius: 3, transition: 'width .5s' }} />
                </div>
              </div>
            )}

            {/* Session controls */}
            <div style={{ display: 'flex', gap: '.4rem', marginTop: '.7rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: 8, fontSize: '.78rem' }} onClick={toggleSession}>
                {sessionActive ? '⏸ Pause' : '▶ Start'}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: 8, fontSize: '.78rem' }} onClick={resetSession}>↺ Reset</button>
            </div>
          </div>
        </div>

        {/* ── MIDDLE ── */}
        <div className="mid-col" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>



          {/* AI Feedback banner */}
          {repScores.length > 0 && (
            <div className="card">
              <div className="sec-title">🔊 Session Feedback</div>
              <div className={`fb ${fb.cls}`}>
                <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{fb.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '.88rem' }}>{fb.title}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 2 }}>{fb.sub}</div>
                </div>
                <button onClick={() => speak(fb.title + '. ' + fb.sub)} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '4px 8px', color: 'var(--muted)', fontSize: '.85rem', cursor: 'pointer' }}>🔈</button>
              </div>
            </div>
          )}

          {/* AI Advice panel */}
          {(aiAdvice || aiLoading) && <AIAdvicePanel advice={aiAdvice} loading={aiLoading} />}

          {/* Rep log */}
          {repLog.length > 0 && (
            <div className="card">
              <div className="sec-title">📋 Rep-by-Rep Log</div>
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {repLog.map(r => {
                  const color = r.quality === 'good' ? 'var(--success)' : r.quality === 'warn' ? 'var(--warn)' : 'var(--danger)'
                  const label = r.quality === 'good' ? '✅ Correct' : r.quality === 'warn' ? '⚠️ Partial' : '❌ Incorrect'
                  return (
                    <div key={r.rep} style={{ padding: '.5rem .7rem', borderRadius: 8, border: `1px solid ${color}33`, background: `${color}0d`, fontSize: '.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)', fontFamily: "'DM Mono',monospace", fontSize: '.65rem' }}>REP {r.rep}</span>
                        <span style={{ color, fontWeight: 700 }}>{label}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.68rem', color }}>{r.angle}° · {r.score}</span>
                      </div>
                      {r.issues?.length > 0 && r.issues.map((issue, i) => (
                        <div key={i} style={{ fontSize: '.67rem', color: 'var(--muted)', marginTop: 2 }}>
                          {issue.icon} <b style={{ color: 'var(--warn)' }}>{issue.name}:</b> {issue.fix}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <FixPanel activeKey={activeKey} exercise={ex} currentAngle={currentAngle} cameraOn={cameraOn} sessionActive={sessionActive} landmarks={landmarks} />

          <ExercisePlan
            activeKey={activeKey}
            selectedExerciseIdx={selectedExerciseIdx}
            selectedRepTarget={selectedRepTarget}
            exerciseConfirmed={exerciseConfirmed}
            onSelectExercise={i => { setSelectedExerciseIdx(i); setSelectedRepTarget(j.exercises[i].recs) }}
            onSelectReps={setSelectedRepTarget}
            onConfirm={confirmExercise}
          />
        </div>

        {/* ── RIGHT: Body map ── */}
        <div className="right-col" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div className="card">
            <div className="clabel">▸ Body Map — Click Joint to Monitor</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '.5rem' }}>
              <BodyMap activeKey={activeKey} onSelectJoint={switchJoint} />
            </div>
            <JointInfoPanel activeKey={activeKey} exercise={ex} currentAngle={currentAngle} />
          </div>
        </div>

      </main>

      {/* Toasts */}
      <div className="toast-area">
        {toasts.map(t => (
          <div key={t.id} className={`toast${t.accent ? ' accent' : ''}`}>{t.msg}</div>
        ))}
      </div>
    </>
  )
}
