import { useEffect, useRef, useState } from 'react'
import { JOINTS, MP, computeAngle, getExerciseTracking } from '../data/joints'

function getScoreValue(tracking, cycle, endAngle) {
  if (tracking.scoreMetric === 'min') return Math.round(cycle.minAngle)
  if (tracking.scoreMetric === 'span') return Math.round(cycle.maxAngle - cycle.minAngle)
  return Math.round(Math.max(cycle.maxAngle, endAngle))
}

function gradeMetric(tracking, value) {
  if (tracking.scoreMetric === 'min') {
    if (value <= tracking.goodRange[1]) return 'good'
    if (value <= tracking.partialRange[1]) return 'warn'
    return 'bad'
  }
  if (tracking.scoreMetric === 'span') {
    if (value >= tracking.goodRange[0]) return 'good'
    if (value >= tracking.partialRange[0]) return 'warn'
    return 'bad'
  }
  if (value >= tracking.goodRange[0]) return 'good'
  if (value >= tracking.partialRange[0]) return 'warn'
  return 'bad'
}

function scoreForQuality(quality, tracking, value) {
  if (quality === 'good') return 92
  if (quality === 'warn') return 70
  return 40
}

function buildIssue(tracking, value, quality) {
  if (quality === 'good') return []
  if (tracking.scoreMetric === 'min') {
    const gap = Math.max(1, Math.round(value - tracking.goodRange[1]))
    return [{
      name: 'Incomplete Flexion',
      fix: `Bend about ${gap}° more at the deepest point, then return slowly.`,
      icon: '📐',
    }]
  }
  if (tracking.scoreMetric === 'span') {
    const gap = Math.max(1, Math.round(tracking.goodRange[0] - value))
    return [{
      name: 'Limited Range',
      fix: `Move through about ${gap}° more total range before returning.`,
      icon: '📐',
    }]
  }
  const gap = Math.max(1, Math.round(tracking.goodRange[0] - value))
  return [{
    name: 'Incomplete Extension',
    fix: `Straighten about ${gap}° more at the extension point, then return slowly.`,
    icon: '📐',
  }]
}

export default function CameraPanel({
  activeKey, exercise, sessionActive, exerciseConfirmed,
  onAngleUpdate, onRepComplete, onLandmarks,
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const poseRef = useRef(null)
  const rafRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [latency, setLatency] = useState('--')

  // ── STALE-CLOSURE FIX: keep all volatile values in refs ──────────
  const activeKeyRef = useRef(activeKey)
  const exerciseRef = useRef(exercise)
  const sessionActiveRef = useRef(sessionActive)
  const exerciseConfirmedRef = useRef(exerciseConfirmed)
  const onRepCompleteRef = useRef(onRepComplete)
  const onAngleUpdateRef = useRef(onAngleUpdate)
  const onLandmarksRef = useRef(onLandmarks)

  useEffect(() => { activeKeyRef.current = activeKey }, [activeKey])
  useEffect(() => { exerciseRef.current = exercise }, [exercise])
  useEffect(() => { sessionActiveRef.current = sessionActive }, [sessionActive])
  useEffect(() => { exerciseConfirmedRef.current = exerciseConfirmed }, [exerciseConfirmed])
  useEffect(() => { onRepCompleteRef.current = onRepComplete }, [onRepComplete])
  useEffect(() => { onAngleUpdateRef.current = onAngleUpdate }, [onAngleUpdate])
  useEffect(() => { onLandmarksRef.current = onLandmarks }, [onLandmarks])

  // ── HUD state ─────────────────────────────────────────────────────
  const [hudJoint, setHudJoint] = useState('📍 Select a joint')
  const [hudPhase, setHudPhase] = useState('Phase: Waiting…')
  const [hudForm, setHudForm] = useState({ cls: 'warn', text: 'Form: —' })
  const [hudAngle, setHudAngle] = useState('∠ —°')
  const [hudError, setHudError] = useState(null)

  // Phase persists across frames via ref
  const phaseRef = useRef('high')
  const cycleRef = useRef({ minAngle: 999, maxAngle: -999, lastCountAt: 0 })
  // Reset phase when joint or exercise changes
  useEffect(() => {
    phaseRef.current = 'high'
    cycleRef.current = { minAngle: 999, maxAngle: -999, lastCountAt: 0 }
  }, [activeKey, exercise, exerciseConfirmed])

  // ── Process frames ────────────────────────────────────────────────
  async function processFrame(video, canvas) {
    if (!poseRef.current || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => processFrame(video, canvas))
      return
    }
    const t0 = performance.now()
    await poseRef.current.send({ image: video })
    setLatency(Math.round(performance.now() - t0))
    rafRef.current = requestAnimationFrame(() => processFrame(video, canvas))
  }

  // ── Start camera ──────────────────────────────────────────────────
  async function startCamera() {
    const video = videoRef.current
    const canvas = canvasRef.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      video.srcObject = stream
      video.style.display = 'block'
      setCameraOn(true)

      const PoseCtor = window.Pose
      poseRef.current = new PoseCtor({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
      })
      poseRef.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      })
      // The callback reads from refs — never stale
      poseRef.current.onResults(results => handlePoseResults(results, canvas))

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        processFrame(video, canvas)
      })
    } catch (err) {
      console.error('Camera error:', err)
      alert('Camera access denied: ' + err.message)
    }
  }

  // ── Pose result handler — reads ONLY from refs ────────────────────
  function handlePoseResults(results, canvas) {
    const ctx = canvas.getContext('2d')
    canvas.width = results.image.width
    canvas.height = results.image.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
    if (!results.poseLandmarks) return

    const lms = results.poseLandmarks
    onLandmarksRef.current(lms)

    // Draw skeleton
    if (window.drawConnectors) {
      window.drawConnectors(ctx, lms, window.POSE_CONNECTIONS, {
        color: 'rgba(0,229,200,0.18)', lineWidth: 2,
      })
    }

    // Read current joint from ref (never stale)
    const key = activeKeyRef.current
    const j = JOINTS[key]
    if (!j) return
    const tracking = getExerciseTracking(j, exerciseRef.current)

    const [kA, kB, kC] = j.keypoints
    const idxA = MP[kA], idxB = MP[kB], idxC = MP[kC]
    if (idxA === undefined || idxB === undefined || idxC === undefined) return
    const lmA = lms[idxA], lmB = lms[idxB], lmC = lms[idxC]
    if (!lmA || !lmB || !lmC ||
        lmA.visibility < 0.35 || lmB.visibility < 0.35 || lmC.visibility < 0.35) {
      setHudForm({ cls: 'warn', text: '⚠ Move into frame' })
      return
    }

    // Draw joint dots
    [[idxA, 7], [idxB, 11], [idxC, 7]].forEach(([idx, r], i) => {
      const lm = lms[idx]
      ctx.beginPath()
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, r, 0, Math.PI * 2)
      ctx.fillStyle = i === 1 ? j.color : 'rgba(255,255,255,.85)'
      ctx.fill()
      ctx.strokeStyle = '#050d18'; ctx.lineWidth = 2; ctx.stroke()
    })

    // Compute angle
    const angle = Math.round(computeAngle(
      { x: lmA.x, y: lmA.y },
      { x: lmB.x, y: lmB.y },
      { x: lmC.x, y: lmC.y }
    ))
    const bx = lmB.x * canvas.width
    const by = lmB.y * canvas.height

    // Draw angle arc
    const vecAB = { x: lmA.x - lmB.x, y: lmA.y - lmB.y }
    const vecCB = { x: lmC.x - lmB.x, y: lmC.y - lmB.y }
    ctx.beginPath()
    ctx.arc(bx, by, 26, Math.atan2(vecAB.y, vecAB.x), Math.atan2(vecCB.y, vecCB.x))
    ctx.strokeStyle = j.color + '77'; ctx.lineWidth = 3; ctx.stroke()

    // Angle label on canvas
    ctx.save()
    ctx.font = 'bold 14px DM Mono,monospace'
    ctx.fillStyle = j.color
    ctx.fillText(angle + '°', bx + 12, by - 6)
    ctx.restore()

    const cycle = cycleRef.current
    cycle.minAngle = Math.min(cycle.minAngle, angle)
    cycle.maxAngle = Math.max(cycle.maxAngle, angle)

    // Update HUD
    setHudAngle(`∠ ${angle}°`)
    setHudJoint(`📍 ${j.label}`)
    const liveSpan = cycle.maxAngle > -999 && cycle.minAngle < 999 ? Math.round(cycle.maxAngle - cycle.minAngle) : 0
    let liveQuality
    let targetText
    if (tracking.scoreMetric === 'min') {
      liveQuality = angle <= tracking.goodRange[1] ? 'good' : angle <= tracking.partialRange[1] ? 'warn' : 'bad'
      const gap = Math.round(angle - tracking.targetAngle)
      targetText = gap <= 5 ? '✓ Flexion target' : `${Math.max(0, gap)}° to flexion target`
    } else if (tracking.scoreMetric === 'span') {
      liveQuality = liveSpan >= tracking.goodRange[0] ? 'good' : liveSpan >= tracking.partialRange[0] ? 'warn' : 'warn'
      const gap = Math.round(tracking.targetAngle - liveSpan)
      targetText = gap <= 0 ? '✓ Range reached' : `${gap}° more range`
    } else {
      liveQuality = angle >= tracking.goodRange[0] ? 'good' : angle >= tracking.partialRange[0] ? 'warn' : 'bad'
      const gap = Math.round(tracking.targetAngle - angle)
      targetText = gap <= 5 ? '✓ Extension target' : `${Math.max(0, gap)}° to extension target`
    }
    setHudError({
      cls: liveQuality === 'good' ? 'good' : liveQuality === 'warn' ? 'warn' : 'danger',
      text: targetText,
    })

    const inGood = liveQuality === 'good'
    const inPart = liveQuality === 'warn'
    setHudForm(
      inGood ? { cls: 'good', text: '✅ Form: Good' }
      : inPart ? { cls: 'warn', text: '⚠ Partial ROM' }
      : { cls: 'bad', text: '❌ Check form' }
    )

    // ── Rep counting — reads session state from refs ──────────────
    const downThresh = tracking.lowThreshold
    const upThresh = tracking.highThreshold

    if (angle <= downThresh) {
      setHudPhase('Phase: FLEXION ↓')
      if (phaseRef.current === 'high') {
        phaseRef.current = 'low'
        cycleRef.current = { minAngle: angle, maxAngle: angle, lastCountAt: cycleRef.current.lastCountAt }
      }
    } else if (angle >= upThresh && phaseRef.current === 'low') {
      phaseRef.current = 'high'
      setHudPhase('Phase: EXTENSION ↑')

      // Only count if session is active — read from ref (not stale)
      if (sessionActiveRef.current && exerciseConfirmedRef.current) {
        const now = performance.now()
        if (now - cycleRef.current.lastCountAt >= tracking.minRepMs) {
          const metricValue = getScoreValue(tracking, cycleRef.current, angle)
          const quality = gradeMetric(tracking, metricValue)
          const score = scoreForQuality(quality, tracking, metricValue)
          const issues = buildIssue(tracking, metricValue, quality)

          cycleRef.current.lastCountAt = now
          onRepCompleteRef.current({ quality, score, angle: metricValue, issues })
        }
      }
      cycleRef.current = { minAngle: angle, maxAngle: angle, lastCountAt: cycleRef.current.lastCountAt }
    } else {
      const mid = (downThresh + upThresh) / 2
      setHudPhase(angle < mid ? 'Phase: ↓ Going down' : 'Phase: ↑ Going up')
    }

    onAngleUpdateRef.current(angle, lms)
  }

  useEffect(() => () => { rafRef.current && cancelAnimationFrame(rafRef.current) }, [])

  return (
    <div className="cam-card" id="camCard">
      <video ref={videoRef} id="inputVideo" autoPlay muted playsInline style={{ display: 'none' }} />
      <canvas ref={canvasRef} id="poseCanvas" />

      <div className="cam-hud">
        <div className="hud-tl">
          <div className="hud-badge active">
            <span className="dot" /> {hudJoint}
          </div>
          <div className="hud-badge info">{hudPhase}</div>
          {hudError && <div className={`hud-badge ${hudError.cls}`}>{hudError.text}</div>}
        </div>
        <div className="hud-tr">
          <div className={`hud-badge ${hudForm.cls}`}>{hudForm.text}</div>
          {cameraOn && (
            <div className="hud-badge info" style={{ fontSize: '.58rem' }}>
              {latency}ms latency
            </div>
          )}
        </div>
        <div className="hud-bl">
          <div className="angle-badge">{hudAngle}</div>
        </div>
      </div>

      {!cameraOn && (
        <div className="cam-placeholder">
          <div style={{ fontSize: '3rem', opacity: 0.35 }}>📷</div>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1.05rem', opacity: 0.7 }}>
            Camera Required
          </h3>
          <p style={{ fontSize: '.78rem', color: 'var(--muted)', textAlign: 'center', maxWidth: 240, lineHeight: 1.65 }}>
            RehabSense tracks your pose in real-time using MediaPipe. No video is recorded or uploaded.
          </p>
          <button className="btn btn-primary" onClick={startCamera} style={{ padding: '10px 24px' }}>
            Enable Camera &amp; Track
          </button>
        </div>
      )}
    </div>
  )
}
