import { JOINTS } from '../data/joints'

const TYPE_COLORS = {
  Strengthening:{bg:'rgba(16,185,129,.1)',bdr:'rgba(16,185,129,.35)',text:'var(--success)'},
  Mobility:{bg:'rgba(0,229,200,.08)',bdr:'rgba(0,229,200,.3)',text:'var(--accent)'},
  Activation:{bg:'rgba(109,40,217,.1)',bdr:'rgba(109,40,217,.35)',text:'#a78bfa'},
  Functional:{bg:'rgba(245,158,11,.1)',bdr:'rgba(245,158,11,.3)',text:'var(--warn)'},
  Stability:{bg:'rgba(6,182,212,.1)',bdr:'rgba(6,182,212,.3)',text:'#22d3ee'},
}
const REPS = [5,8,10,12,15,20]

export default function ExercisePlan({activeKey,selectedExerciseIdx,selectedRepTarget,exerciseConfirmed,onSelectExercise,onSelectReps,onConfirm}) {
  const j = JOINTS[activeKey]
  const ex = j.exercises[selectedExerciseIdx]

  return (
    <div className="card" id="exerciseCard">
      <div className="clabel">▸ Exercise Plan — <span style={{color:j.color}}>{j.label}</span></div>

      {j.exercises.map((e,i) => {
        const tc = TYPE_COLORS[e.type] || TYPE_COLORS.Mobility
        const active = i === selectedExerciseIdx
        return (
          <div key={e.name} className={`ex-item${active?' active':''}`} onClick={() => onSelectExercise(i)}>
            <div style={{width:28,height:28,borderRadius:7,background:j.color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.85rem',flexShrink:0}}>{j.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="ex-name">{e.name}</div>
              <div style={{fontSize:'.7rem',color:'var(--text2)',marginTop:2,lineHeight:1.45}}>{e.desc}</div>
              {/* Step-by-step instructions when selected */}
              {active && e.steps && (
                <ol className="ex-steps" style={{marginTop:'.5rem'}}>
                  {e.steps.map((s,si) => (
                    <li key={si} className="ex-step">{s}</li>
                  ))}
                </ol>
              )}
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',padding:'2px 7px',borderRadius:5,background:tc.bg,border:`1px solid ${tc.bdr}`,color:tc.text}}>{e.type}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'var(--muted)'}}>×{e.recs}</span>
            </div>
          </div>
        )
      })}

      {/* Rep selector */}
      <div style={{marginTop:'.75rem',padding:'.75rem',background:'var(--surf2)',border:'1px solid var(--bdr)',borderRadius:'var(--r-md)'}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'var(--muted)',marginBottom:'.45rem',textTransform:'uppercase',letterSpacing:1}}>Target Reps</div>
        <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap'}}>
          {REPS.map(n => (
            <button key={n} onClick={() => onSelectReps(n)} style={{
              padding:'5px 12px',borderRadius:7,border:'1px solid',
              fontFamily:"'DM Mono',monospace",fontSize:'.75rem',cursor:'pointer',transition:'all .2s',
              background:n===selectedRepTarget?'var(--accent)':'transparent',
              color:n===selectedRepTarget?'#050d18':'var(--muted)',
              borderColor:n===selectedRepTarget?'var(--accent)':'var(--bdr)',
            }}>{n}</button>
          ))}
        </div>
        <div style={{marginTop:'.5rem',fontSize:'.68rem',color:'var(--muted)'}}>
          Recommended: <span style={{color:'var(--accent)'}}>{ex?.recs} reps</span>
        </div>
      </div>

      {!exerciseConfirmed && (
        <button className="btn btn-primary" style={{width:'100%',padding:'.75rem',marginTop:'.6rem',fontSize:'.85rem'}} onClick={onConfirm}>
          ▶ Start This Exercise
        </button>
      )}
    </div>
  )
}
