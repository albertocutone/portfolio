export const stations = Object.freeze([
  {
    id: 'atlas', scene: 'atlas', anchor: [0, 1.6, 0],
    camera: [4, 5.7, 6], target: [0, 1.6, 0],
    cameraControls: [[0, 5.3, 5.8], [0.35, 2.5, 1.2]],
    focusRange: 8, bokehScale: 0,
    label: 'ATLAS', badge: 'CERN', subject: 'ATLAS DETECTOR / CERN',
    title: 'Making the invisible\nmeasurable.', role: 'Imaging & instrumentation',
    description: 'From particle detectors to physical imaging systems. A journey through instrumentation, sensing, and the software that connects them.',
    tags: ['Particle detection', 'Instrumentation', 'Imaging'],
    projects: [
      { title: 'ATLAS at CERN', body: 'ATLAS is one of the experiments at the Large Hadron Collider. Its layered detector is the opening visual for this journey across hardware, software, and perception.', link: 'https://atlas.cern/' },
      { title: 'Model attribution', body: 'CERN ATLAS Detector by physics.atlas.vr, licensed under Creative Commons Attribution 4.0. Adapted and optimized for this scene.', link: 'https://sketchfab.com/3d-models/cern-atlas-detector-c3761776d4f94b3eb77336896da2a3bd' },
    ],
  },
  {
    id: 'sensor', anchor: [0, 0.176, 0],
    camera: [0.64, 0.95, 1.1], target: [0, 0.15, 0],
    cameraControls: [[0.35, 1.8, 1.2], [-1.42, 1.75, 1.18]],
    focusRange: 0.28, bokehScale: 0.65,
    label: 'Sensing', badge: 'Meta Reality Labs', subject: 'THE SENSOR DIE',
    title: 'From photons\nto perception.', role: 'Mixed reality evaluation & sensing',
    description: 'Making the invisible measurable. Bridging native sensor systems and the experiences they enable.',
    tags: ['Android / C++', 'Zero-copy IPC', 'Sensor visualization'],
    projects: [
      { title: 'MR evaluation strategy', body: 'Evaluation strategy for mixed reality systems, connecting sensor observations with perceptual behavior.' },
      { title: 'Native sensor systems', body: 'Native Android and C++ development, zero-copy inter-process communication, and sensor visualization.' },
    ],
  },
  {
    id: 'instrumentation', anchor: [-1.15, 0.16, 0],
    camera: [-1.65, 1.05, 0.92], target: [-1.15, 0.11, 0],
    cameraControls: [[-1.3, 1.6, 1.05], [0.65, 2.25, 0.65]],
    focusRange: 0.3, bokehScale: 0.65,
    label: 'Instrumentation', badge: 'CERN & Matica', subject: 'THE CRYOGENIC BUS',
    title: 'Precision under\nreal constraints.', role: 'Imaging & robotic integration',
    description: 'Where physical systems meet dependable software. Cryogenic imaging, robotic integration, and high-performance image processing.',
    tags: ['Cryogenic imaging', 'Robotics', 'C++ drivers'],
    projects: [
      { title: 'Imaging & integration', body: 'Cryogenic imaging and robotic integration at the boundary between instrumentation and software.' },
      { title: 'Image-processing drivers', body: 'High-performance C++ image-processing drivers for physical imaging systems.' },
    ],
  },
  {
    id: 'edge', anchor: [1.2, 0.15, -1.1],
    camera: [1.73, 1.45, 0.21], target: [1.2, 0.15, -1.1],
    cameraControls: [[2, 2.3, 1.1], [2.7, 4, 3.2]],
    focusRange: 0.36, bokehScale: 0.6,
    label: 'Edge Intelligence', badge: 'Edge Platforms & PetLog', subject: 'THE EDGE SoC',
    title: 'Intelligence.\nClose to the source.', role: 'Embedded systems & perceptual ML',
    description: 'From manufacturing firmware to video understanding. Bringing perception onto the devices that see the world.',
    tags: ['Raspberry Pi', 'OpenCV / YOLO', 'VLM tracking'],
    projects: [
      { title: 'Edge platforms', body: 'Manufacturing firmware and Raspberry Pi video pipelines, bringing capture and processing together on embedded devices.' },
      { title: 'PetLog', body: 'Video tracking with OpenCV, YOLO, and vision-language models.' },
    ],
  },
  {
    id: 'architecture', anchor: [0, 0.05, -0.3],
    camera: [3.9, 5.35, 4.9], target: [0, 0.05, -0.3],
    focusRange: 3, bokehScale: 0.15,
    label: 'Architecture', badge: 'The complete system', subject: 'THE BIG PICTURE',
    title: 'One system.\nEvery layer.', role: 'Electronic engineering meets perceptual ML',
    description: 'From photons to edge intelligence. An electronic engineering foundation, connecting hardware constraints with perceptual machine learning.',
    tags: ['Hardware', 'Software', 'Perception'],
    projects: [
      { title: 'Systems perspective', body: 'An electronic engineering background informs the integration of hardware constraints with perceptual machine learning.' },
      { title: 'Across the stack', body: 'Sensing, instrumentation, native software, and edge inference are connected parts of the same system.' },
    ],
  },
].map((station, index, all) => Object.freeze({
  ...station,
  scene: station.scene ?? 'pcb',
  scrollRange: [index / all.length, (index + 1) / all.length],
  eyebrow: `${String(index + 1).padStart(2, '0')} / ${station.subject}`,
})));

export const profile = Object.freeze({ name: 'Alberto Cutone', cv: null, contact: null });
