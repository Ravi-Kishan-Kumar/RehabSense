// MediaPipe Pose landmark indices used by this app.
export const MP = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
}

export function computeAngle(A, B, C) {
  const rad =
    Math.atan2(C.y - B.y, C.x - B.x) -
    Math.atan2(A.y - B.y, A.x - B.x)
  let a = Math.abs((rad * 180) / Math.PI)
  if (a > 180) a = 360 - a
  return a
}

export function getInitials(name) {
  return (name || '?')
    .trim()
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getExerciseTracking(joint, exercise) {
  return {
    minAngle: joint.minAngle,
    maxAngle: joint.maxAngle,
    lowThreshold: joint.lowThreshold,
    highThreshold: joint.highThreshold,
    targetAngle: joint.targetAngle,
    targetLabel: joint.targetLabel || 'Target',
    goodRange: joint.goodRange,
    partialRange: joint.partialRange,
    scoreMetric: joint.scoreMetric || 'max',
    cycle: joint.cycle || 'low-to-high',
    minRepMs: 650,
    ...(exercise?.tracking || {}),
  }
}

const kneeExtension = side => ({
  name: 'Seated Knee Extension',
  type: 'Strengthening',
  recs: 10,
  desc: `Straighten your ${side} leg while seated, then lower slowly.`,
  steps: [
    'Sit upright with both feet flat on the floor.',
    `Lift and straighten your ${side} leg as far as comfortable.`,
    'Hold briefly at the top, then lower with control.',
    'Keep the thigh still and avoid leaning back.',
  ],
  tracking: {
    scoreMetric: 'max',
    lowThreshold: 132,
    highThreshold: 152,
    goodRange: [155, 180],
    partialRange: [140, 155],
    targetAngle: 162,
    targetLabel: 'Extension target',
  },
})

const heelSlide = side => ({
  name: 'Heel Slides',
  type: 'Mobility',
  recs: 10,
  desc: `Bend and straighten your ${side} knee in a smooth slide.`,
  steps: [
    'Lie on your back or sit with the leg supported.',
    `Slide your ${side} heel toward you until the knee bends comfortably.`,
    'Slide the heel away until the leg is mostly straight again.',
    'Use a pain-free range and keep the movement slow.',
  ],
  tracking: {
    scoreMetric: 'min',
    lowThreshold: 122,
    highThreshold: 150,
    goodRange: [75, 120],
    partialRange: [120, 140],
    targetAngle: 105,
    targetLabel: 'Flexion target',
  },
})

const elbowCurl = side => ({
  name: 'Elbow Flexion Curls',
  type: 'Mobility',
  recs: 10,
  desc: `Bend your ${side} elbow and bring the hand toward the shoulder.`,
  steps: [
    `Keep your ${side} upper arm close to your side.`,
    'Curl the forearm toward your shoulder without swinging.',
    'Pause briefly at the most comfortable bend.',
    'Lower slowly until the elbow is nearly straight.',
  ],
  tracking: {
    scoreMetric: 'min',
    lowThreshold: 108,
    highThreshold: 145,
    goodRange: [45, 95],
    partialRange: [95, 125],
    targetAngle: 80,
    targetLabel: 'Flexion target',
  },
})

const elbowExtension = side => ({
  name: 'Elbow Extension',
  type: 'Mobility',
  recs: 10,
  desc: `Straighten your ${side} elbow from a bent position.`,
  steps: [
    `Start with your ${side} elbow comfortably bent.`,
    'Slowly straighten the arm as far as comfortable.',
    'Pause briefly near the straight position.',
    'Bend back with control to start the next rep.',
  ],
  tracking: {
    scoreMetric: 'max',
    lowThreshold: 118,
    highThreshold: 150,
    goodRange: [150, 180],
    partialRange: [135, 150],
    targetAngle: 162,
    targetLabel: 'Extension target',
  },
})

const wristFlexExtend = side => ({
  name: 'Wrist Flexion and Extension',
  type: 'Mobility',
  recs: 10,
  desc: `Bend your ${side} wrist down and up through a gentle range.`,
  steps: [
    `Rest your ${side} forearm on a table with the wrist over the edge.`,
    'Bend the wrist down, then lift it up.',
    'Keep the forearm still so the wrist does the work.',
    'Use a small, comfortable range if the camera view is noisy.',
  ],
  tracking: {
    scoreMetric: 'span',
    lowThreshold: 148,
    highThreshold: 166,
    goodRange: [25, 80],
    partialRange: [15, 25],
    targetAngle: 30,
    targetLabel: 'Range target',
  },
})

const wristExtensionLift = side => ({
  name: 'Wrist Extension Lifts',
  type: 'Strengthening',
  recs: 8,
  desc: `Lift the back of your ${side} hand, then return to neutral.`,
  steps: [
    `Rest your ${side} forearm on a table, palm facing down.`,
    'Lift the hand upward from the wrist.',
    'Pause briefly at the top.',
    'Lower back to neutral without moving the elbow.',
  ],
  tracking: {
    scoreMetric: 'min',
    lowThreshold: 152,
    highThreshold: 166,
    goodRange: [120, 150],
    partialRange: [150, 165],
    targetAngle: 140,
    targetLabel: 'Lift target',
  },
})

const anklePumps = side => ({
  name: 'Ankle Pumps',
  type: 'Mobility',
  recs: 12,
  desc: `Move your ${side} ankle up and down for circulation and mobility.`,
  steps: [
    `Sit or lie with your ${side} leg supported.`,
    'Pull the toes toward your shin.',
    'Point the toes away from you.',
    'Keep the knee still and move only from the ankle.',
  ],
  tracking: {
    scoreMetric: 'span',
    lowThreshold: 98,
    highThreshold: 114,
    goodRange: [22, 70],
    partialRange: [14, 22],
    targetAngle: 25,
    targetLabel: 'Range target',
  },
})

const toeRaises = side => ({
  name: 'Toe Raises',
  type: 'Mobility',
  recs: 10,
  desc: `Pull your ${side} toes toward your shin, then relax.`,
  steps: [
    `Sit with your ${side} heel on the floor.`,
    'Lift the toes upward toward the shin.',
    'Pause briefly at the top.',
    'Lower the toes back down with control.',
  ],
  tracking: {
    scoreMetric: 'min',
    lowThreshold: 104,
    highThreshold: 118,
    goodRange: [82, 104],
    partialRange: [104, 118],
    targetAngle: 95,
    targetLabel: 'Toe lift target',
  },
})

export const JOINTS = {
  'l-knee': {
    label: 'Left Knee', color: '#ef4444', icon: 'K', region: 'Knee',
    keypoints: ['LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'],
    angLabel: 'Knee Angle', minAngle: 60, maxAngle: 180,
    lowThreshold: 132, highThreshold: 152,
    goodRange: [155, 180], partialRange: [140, 155], targetAngle: 162,
    exercises: [kneeExtension('left'), heelSlide('left')],
    feedback: {
      good: ['Good knee range and control.'],
      warn: ['Move a little farther while staying pain-free.'],
      bad: ['Reset your position and use a slower controlled range.'],
    },
  },

  'r-knee': {
    label: 'Right Knee', color: '#ef4444', icon: 'K', region: 'Knee',
    keypoints: ['RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'],
    angLabel: 'Knee Angle', minAngle: 60, maxAngle: 180,
    lowThreshold: 132, highThreshold: 152,
    goodRange: [155, 180], partialRange: [140, 155], targetAngle: 162,
    exercises: [kneeExtension('right'), heelSlide('right')],
    feedback: {
      good: ['Good knee range and control.'],
      warn: ['Move a little farther while staying pain-free.'],
      bad: ['Reset your position and use a slower controlled range.'],
    },
  },

  'l-elbow': {
    label: 'Left Elbow', color: '#7c3aed', icon: 'E', region: 'Elbow',
    keypoints: ['LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'],
    angLabel: 'Elbow Angle', minAngle: 30, maxAngle: 180,
    lowThreshold: 108, highThreshold: 145,
    goodRange: [45, 95], partialRange: [95, 125], targetAngle: 80,
    exercises: [elbowCurl('left'), elbowExtension('left')],
    feedback: {
      good: ['Good elbow range with controlled movement.'],
      warn: ['Try for a little more range without swinging the shoulder.'],
      bad: ['Keep the upper arm still and repeat more slowly.'],
    },
  },

  'r-elbow': {
    label: 'Right Elbow', color: '#7c3aed', icon: 'E', region: 'Elbow',
    keypoints: ['RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'],
    angLabel: 'Elbow Angle', minAngle: 30, maxAngle: 180,
    lowThreshold: 108, highThreshold: 145,
    goodRange: [45, 95], partialRange: [95, 125], targetAngle: 80,
    exercises: [elbowCurl('right'), elbowExtension('right')],
    feedback: {
      good: ['Good elbow range with controlled movement.'],
      warn: ['Try for a little more range without swinging the shoulder.'],
      bad: ['Keep the upper arm still and repeat more slowly.'],
    },
  },

  'l-wrist': {
    label: 'Left Wrist', color: '#38bdf8', icon: 'W', region: 'Wrist',
    keypoints: ['LEFT_ELBOW', 'LEFT_WRIST', 'LEFT_INDEX'],
    angLabel: 'Wrist Angle', minAngle: 90, maxAngle: 180,
    lowThreshold: 148, highThreshold: 166,
    goodRange: [25, 80], partialRange: [15, 25], targetAngle: 30,
    scoreMetric: 'span',
    exercises: [wristFlexExtend('left'), wristExtensionLift('left')],
    feedback: {
      good: ['Good wrist motion.'],
      warn: ['Increase range gently while keeping the forearm still.'],
      bad: ['Reduce speed and keep the wrist visible to the camera.'],
    },
  },

  'r-wrist': {
    label: 'Right Wrist', color: '#38bdf8', icon: 'W', region: 'Wrist',
    keypoints: ['RIGHT_ELBOW', 'RIGHT_WRIST', 'RIGHT_INDEX'],
    angLabel: 'Wrist Angle', minAngle: 90, maxAngle: 180,
    lowThreshold: 148, highThreshold: 166,
    goodRange: [25, 80], partialRange: [15, 25], targetAngle: 30,
    scoreMetric: 'span',
    exercises: [wristFlexExtend('right'), wristExtensionLift('right')],
    feedback: {
      good: ['Good wrist motion.'],
      warn: ['Increase range gently while keeping the forearm still.'],
      bad: ['Reduce speed and keep the wrist visible to the camera.'],
    },
  },

  'l-ankle': {
    label: 'Left Ankle', color: '#ec4899', icon: 'A', region: 'Ankle',
    keypoints: ['LEFT_KNEE', 'LEFT_ANKLE', 'LEFT_FOOT_INDEX'],
    angLabel: 'Ankle Angle', minAngle: 60, maxAngle: 150,
    lowThreshold: 98, highThreshold: 114,
    goodRange: [22, 70], partialRange: [14, 22], targetAngle: 25,
    scoreMetric: 'span',
    exercises: [anklePumps('left'), toeRaises('left')],
    feedback: {
      good: ['Good ankle range.'],
      warn: ['Use a little more ankle motion if comfortable.'],
      bad: ['Keep the knee still and move only the foot.'],
    },
  },

  'r-ankle': {
    label: 'Right Ankle', color: '#ec4899', icon: 'A', region: 'Ankle',
    keypoints: ['RIGHT_KNEE', 'RIGHT_ANKLE', 'RIGHT_FOOT_INDEX'],
    angLabel: 'Ankle Angle', minAngle: 60, maxAngle: 150,
    lowThreshold: 98, highThreshold: 114,
    goodRange: [22, 70], partialRange: [14, 22], targetAngle: 25,
    scoreMetric: 'span',
    exercises: [anklePumps('right'), toeRaises('right')],
    feedback: {
      good: ['Good ankle range.'],
      warn: ['Use a little more ankle motion if comfortable.'],
      bad: ['Keep the knee still and move only the foot.'],
    },
  },
}

export const JOINT_COLORS = Object.fromEntries(
  Object.entries(JOINTS).map(([k, v]) => [k, v.color])
)
