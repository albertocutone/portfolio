// CV topics choose a visual pose. Camera geometry is independent of the story order.
export const stationPoses = Object.freeze({
  overview: { label: 'PCB overview', scene: 'pcb', anchor: [0, 0.05, -0.3], camera: [3.9, 5.35, 4.9], target: [0, 0.05, -0.3], focusRange: 3, bokehScale: 0.15 },
  colosseum: { label: 'Colosseum · Rome', scene: 'colosseum', anchor: [-0.2, 0.02, 0], camera: [1.4, 1.5, 2.4], target: [-0.2, 0.02, 0], focusRange: 8, bokehScale: 0 },
  atlas: { label: 'ATLAS detector', scene: 'atlas', anchor: [0, 1.6, 0], camera: [4, 5.7, 6], target: [0, 1.6, 0], focusRange: 8, bokehScale: 0 },
  meta: { label: 'Meta · Quest 3 · VR glasses', scene: 'meta', anchor: [0, 1.65, 0], camera: [2.8, 2.6, 6.6], target: [0, 1.65, 0], focusRange: 8, bokehScale: 0 },
  processor: { label: 'PCB processor', scene: 'pcb', anchor: [1.2, 0.15, -1.1], camera: [2.8, 3.2, 3.4], target: [1.2, 0.15, -1.1], focusRange: 0.7, bokehScale: 0.3 },
  edge: { label: 'Edge SoC', scene: 'pcb', anchor: [1.2, 0.15, -1.1], camera: [1.73, 1.45, 0.21], target: [1.2, 0.15, -1.1], focusRange: 0.36, bokehScale: 0.6 },
  controller: { label: 'PCB instrumentation', scene: 'pcb', anchor: [-1.15, 0.16, 0], camera: [-1.65, 1.05, 0.92], target: [-1.15, 0.11, 0], focusRange: 0.3, bokehScale: 0.65 },
  sensor: { label: 'Image sensor', scene: 'pcb', anchor: [0, 0.176, 0], camera: [0.64, 0.95, 1.1], target: [0, 0.15, 0], focusRange: 0.28, bokehScale: 0.65 },
  platform: { label: 'Embedded platform', scene: 'pcb', anchor: [1.2, 0.15, -1.1], camera: [2.7, 2.9, 2.2], target: [1.2, 0.15, -1.1], focusRange: 1, bokehScale: 0.2 },
});

export const stations = Object.freeze([
  {
    id: 'intro', kind: 'intro', pose: 'overview', label: 'Intro', badge: 'Alberto Cutone · Software Engineer', subject: 'HELLO / THE PITCH',
    title: 'Software for\nthe physical world.', role: 'Performance. Perception. Real systems.',
    tags: ['C++ & Python', 'Physical AI', 'Mixed reality'],
  },
  {
    id: 'education', kind: 'education', pose: 'colosseum', label: 'Education', badge: 'La Sapienza · Rome', subject: 'EDUCATION / ROME',
    title: 'Where curiosity\nbecame engineering.', role: 'Biomedical & electronic engineering',
    experienceIds: ['cardiac'], tags: ['Medical imaging', 'Electronics', 'C++'],
  },
  {
    id: 'cern', kind: 'experience', pose: 'atlas', label: 'CERN', badge: 'CERN · Geneva', subject: 'CERN / RESEARCH',
    title: 'Engineering for\nextreme conditions.', role: 'Cryogenic imaging & electronics',
    experienceIds: ['cern'], tags: ['Cryogenics', 'Robotics', 'PCB design'],
  },
  {
    id: 'hcl', kind: 'experience', pose: 'processor', label: 'HCL', badge: 'HCL Technologies · Rome', subject: 'HCL / ENTERPRISE SOFTWARE',
    title: 'Making complex\nsystems simpler.', role: 'Enterprise software & deployment',
    experienceIds: ['hcl'], tags: ['C++', 'BigFix', 'CI/CD'],
  },
  {
    id: 'xfarm', kind: 'experience', pose: 'edge', label: 'xFarm', badge: 'xFarm · Lugano', subject: 'XFARM / CONNECTED DEVICES',
    title: 'From the field\nto the cloud.', role: 'Embedded software & IoT',
    experienceIds: ['xfarm'], tags: ['C++ firmware', 'ARM', 'MQTT'],
  },
  {
    id: 'matica', kind: 'experience', pose: 'controller', label: 'Matica', badge: 'Matica Technologies · Lugano', subject: 'MATICA / HARDWARE INTEGRATION',
    title: 'Precision under\nreal constraints.', role: 'Printing systems & native drivers',
    experienceIds: ['matica'], tags: ['C++ / C#', 'Windows drivers', 'Reverse engineering'],
  },
  {
    id: 'meta', kind: 'experience', pose: 'meta', label: 'Meta', badge: 'Meta Reality Labs · Zurich', subject: 'META / MIXED REALITY',
    title: 'From photons\nto perception.', role: 'Sensor tools & perceptual evaluation',
    experienceIds: ['meta'], tags: ['Android / C++', 'Zero-copy IPC', 'Computer vision'],
  },
  {
    id: 'personal', kind: 'projects', pose: 'platform', label: 'Personal', badge: 'Personal projects', subject: 'PERSONAL / IDEAS INTO PRACTICE',
    title: 'Curiosity keeps\nbuilding.', role: 'Edge intelligence & everyday tools',
    tags: ['Raspberry Pi', 'Computer vision', 'React Native'],
  },
  {
    id: 'recap', kind: 'recap', pose: 'overview', label: 'Recap', badge: 'The journey, connected', subject: 'RECAP / THE BIG PICTURE',
    title: 'Hardware curious.\nSoftware driven.', role: 'From Rome to mixed reality in Zurich.',
    tags: ['Native performance', 'Embedded systems', 'Perception'],
    featuredProjectIds: ['cryo', 'insight', 'petlog'],
  },
].map((station, index, all) => {
  const pose = stationPoses[station.pose];
  if (!pose) throw new Error(`Unknown station pose: ${station.pose}`);
  const nextPose = stationPoses[all[Math.min(index + 1, all.length - 1)].pose];
  const clearance = Math.max(pose.camera[1], nextPose.camera[1]) + 0.8;
  // Lift the camera around the oblique Meta pose to clear the PCB horizon.
  const cameraControls = (pose.scene === 'pcb' && nextPose.scene === 'pcb') || pose.scene === 'meta' || nextPose.scene === 'meta' ? [
    [pose.camera[0], clearance, pose.camera[2]],
    [nextPose.camera[0], clearance, nextPose.camera[2]],
  ] : undefined;
  return Object.freeze({ ...pose, ...station, poseLabel: pose.label,
    cameraControls,
    scrollRange: [index / all.length, (index + 1) / all.length],
    eyebrow: `${String(index + 1).padStart(2, '0')} / ${station.subject}`,
  });
}));
