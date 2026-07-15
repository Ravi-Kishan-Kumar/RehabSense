import { JOINTS } from '../data/joints'

// Only joints we have (no hip/shoulder)
const JOINT_POSITIONS = {
  'l-elbow':  [42, 148], 'r-elbow':  [158,148],
  'l-wrist':  [22, 212], 'r-wrist':  [178,212],
  'l-knee':   [74, 292], 'r-knee':   [126,292],
  'l-ankle':  [70, 402], 'r-ankle':  [130,402],
}
const LABEL_OFFSET = {
  'l-elbow':[-30,-14], 'r-elbow':[30,-14],
  'l-wrist':[-28,-12], 'r-wrist':[28,-12],
  'l-knee':[-30,-16], 'r-knee':[30,-16],
  'l-ankle':[-30,-14], 'r-ankle':[30,-14],
}
const LABEL_TEXT = {
  'l-elbow':'L.Elbow','r-elbow':'R.Elbow',
  'l-wrist':'L.Wrist','r-wrist':'R.Wrist',
  'l-knee':'L.Knee','r-knee':'R.Knee',
  'l-ankle':'L.Ankle','r-ankle':'R.Ankle',
}

export default function BodyMap({ activeKey, onSelectJoint }) {
  return (
    <svg viewBox="0 0 200 480" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:210}}>
      {/* Body skeleton outline */}
      <circle cx="100" cy="30" r="22" fill="none" stroke="var(--bdr2)" strokeWidth="2"/>
      <line x1="100" y1="52" x2="100" y2="70" stroke="var(--bdr2)" strokeWidth="5" strokeLinecap="round"/>
      <path d="M68,70 L132,70 L128,182 L72,182 Z" fill="none" stroke="var(--bdr2)" strokeWidth="2"/>
      {/* Arms */}
      <line x1="68" y1="78" x2="42" y2="148" stroke="var(--bdr2)" strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="42" y1="148" x2="22" y2="212" stroke="var(--bdr2)" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="132" y1="78" x2="158" y2="148" stroke="var(--bdr2)" strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="158" y1="148" x2="178" y2="212" stroke="var(--bdr2)" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Legs */}
      <line x1="82" y1="182" x2="74" y2="292" stroke="var(--bdr2)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="74" y1="292" x2="70" y2="402" stroke="var(--bdr2)" strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="118" y1="182" x2="126" y2="292" stroke="var(--bdr2)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="126" y1="292" x2="130" y2="402" stroke="var(--bdr2)" strokeWidth="4.5" strokeLinecap="round"/>
      {/* Feet */}
      <path d="M70,402 Q60,418 52,422 L76,422 Q82,416 70,402" fill="var(--bdr2)" opacity=".5"/>
      <path d="M130,402 Q140,418 148,422 L124,422 Q118,416 130,402" fill="var(--bdr2)" opacity=".5"/>
      {/* Spine dot */}
      <circle cx="100" cy="132" r="4" fill="var(--bdr2)" opacity=".6"/>

      {/* Joint hotspots */}
      {Object.entries(JOINT_POSITIONS).map(([key,[cx,cy]]) => {
        const j = JOINTS[key]
        if (!j) return null
        const active = key === activeKey
        const [lx,ly] = LABEL_OFFSET[key] || [0,-14]
        return (
          <g key={key} className={`joint-hotspot${active?' active':''}`}
            id={`hs-${key}`} onClick={() => onSelectJoint(key)} transform={`translate(${cx},${cy})`}>
            <circle className="outer" cx="0" cy="0" r="18" stroke={j.color} strokeWidth={active ? 3 : 0} fill={j.color} fillOpacity={active ? .18 : 0}/>
            <circle className="inner" cx="0" cy="0" r={active?10:7} fill={j.color} opacity={active?1:.75}/>
            {active && <circle cx="0" cy="0" r="16" fill="none" stroke={j.color} strokeWidth="1.5" opacity=".4"/>}
            <text className="joint-label" x={lx} y={ly} textAnchor="middle" style={{fontSize:'8.5px',fontWeight:active?700:400}}>
              {LABEL_TEXT[key]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
