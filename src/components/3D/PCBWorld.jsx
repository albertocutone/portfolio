import { useLayoutEffect, useRef } from 'react';
import { BoxGeometry, MeshStandardMaterial, Object3D } from 'three';

const gold = new MeshStandardMaterial({ color: '#d3ad53', metalness: 0.82, roughness: 0.3 });
const ceramic = new MeshStandardMaterial({ color: '#6a776f', metalness: 0.55, roughness: 0.48 });
const packageMaterial = new MeshStandardMaterial({ color: '#121b19', metalness: 0.35, roughness: 0.32 });
const unitBox = new BoxGeometry(1, 1, 1);
const soldermask = new MeshStandardMaterial({ color: '#174d32', metalness: 0.35, roughness: 0.47 });
soldermask.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBoardPosition;');
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBoardPosition = position;');
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBoardPosition;');
  shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float grain = fract(sin(dot(vBoardPosition.xz, vec2(127.1, 311.7))) * 43758.5453);
    float weave = sin(vBoardPosition.x * 500.0) * sin(vBoardPosition.z * 500.0);
    diffuseColor.rgb *= 0.92 + grain * 0.12 + weave * 0.025;
  `);
};
soldermask.customProgramCacheKey = () => 'pcb-soldermask-v1';

function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function generateLayout() {
  const random = randomGenerator(42);
  const traces = [];
  const capacitors = [];
  const vias = [];
  const anchors = [[0, 0], [-1.2, 0], [1.2, -1.2]];
  for (const [x, z] of anchors) {
    for (let i = 0; i < 24; i++) {
      const side = i % 4;
      const lane = (Math.floor(i / 4) - 2.5) * 0.044;
      const start = [x + (side < 2 ? (side === 0 ? 0.36 : -0.36) : lane), z + (side >= 2 ? (side === 2 ? 0.36 : -0.36) : lane)];
      const end = [Math.max(-2, Math.min(2, x + (random() - 0.5) * 2.4)), Math.max(-1.9, Math.min(1.2, z + (random() - 0.5) * 2.4))];
      const corner = [end[0], start[1]];
      for (const [a, b] of [[start, corner], [corner, end]]) {
        traces.push({ position: [(a[0] + b[0]) / 2, 0.008, (a[1] + b[1]) / 2], scale: [Math.max(0.009, Math.abs(a[0] - b[0])), 0.006, Math.max(0.009, Math.abs(a[1] - b[1]))] });
      }
      vias.push({ position: [end[0], 0.012, end[1]], scale: [0.028, 0.01, 0.028] });
    }
  }
  for (let i = 0; i < 100; i++) {
    const x = (random() - 0.5) * 3.9;
    const z = (random() - 0.5) * 2.9 - 0.3;
    if (anchors.some(([ax, az]) => Math.abs(x - ax) < 0.46 && Math.abs(z - az) < 0.46)) continue;
    capacitors.push({ position: [x, 0.03, z], scale: [0.07, 0.055, 0.035] });
  }
  return { traces, capacitors, vias };
}
const layout = generateLayout();

function RepeatedParts({ parts, material }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const object = new Object3D();
    parts.forEach(({ position, scale }, index) => {
      object.position.set(...position);
      object.scale.set(...scale);
      object.updateMatrix();
      ref.current.setMatrixAt(index, object.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [parts]);
  return <instancedMesh ref={ref} args={[unitBox, material, parts.length]} />;
}

const chipPins = Array.from({ length: 48 }, (_, index) => {
  const side = Math.floor(index / 12);
  const lane = ((index % 12) - 5.5) * 0.044;
  return {
    position: [side < 2 ? (side === 0 ? 0.34 : -0.34) : lane, 0.037, side >= 2 ? (side === 2 ? 0.34 : -0.34) : lane],
    scale: side < 2 ? [0.14, 0.025, 0.021] : [0.021, 0.025, 0.14],
  };
});

function Chip({ position, sensor = false }) {
  return <group position={position}>
    <mesh position={[0, 0.07, 0]} material={packageMaterial}><boxGeometry args={[0.58, 0.14, 0.58]} /></mesh>
    <RepeatedParts parts={chipPins} material={gold} />
    {sensor ? <group position={[0, 0.144, 0]}>
      <mesh><boxGeometry args={[0.43, 0.007, 0.43]} /><meshStandardMaterial color="#596c86" metalness={0.88} roughness={0.2} /></mesh>
      {Array.from({ length: 16 }, (_, index) => <mesh key={index} position={[(index % 4 - 1.5) * 0.096, 0.006, (Math.floor(index / 4) - 1.5) * 0.096]}>
        <boxGeometry args={[0.082, 0.005, 0.082]} /><meshStandardMaterial color="#a9b8bd" metalness={0.93} roughness={0.22} />
      </mesh>)}
    </group> : <>
      <mesh position={[0, 0.144, 0]}><boxGeometry args={[0.47, 0.008, 0.47]} /><meshStandardMaterial color="#34433c" metalness={0.68} roughness={0.38} /></mesh>
      <mesh position={[-0.18, 0.151, 0.18]}><sphereGeometry args={[0.018, 12, 8]} /><meshBasicMaterial color="#83dfca" /></mesh>
      {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.151, -0.06 + i * 0.06]} material={ceramic}><boxGeometry args={[0.23 - i * 0.04, 0.003, 0.01]} /></mesh>)}
    </>}
  </group>;
}

export default function PCBWorld() {
  return <group>
    <mesh position={[0, -0.065, -0.3]} material={soldermask}><boxGeometry args={[4.4, 0.13, 3.4]} /></mesh>
    <mesh position={[0, -0.13, -0.3]}><boxGeometry args={[4.4, 0.012, 3.4]} /><meshStandardMaterial color="#93864a" roughness={0.7} /></mesh>
    <RepeatedParts parts={layout.traces} material={gold} />
    <RepeatedParts parts={layout.capacitors} material={ceramic} />
    <RepeatedParts parts={layout.vias} material={gold} />
    <Chip position={[0, 0, 0]} sensor />
    <Chip position={[-1.2, 0, 0]} />
    <Chip position={[1.2, 0, -1.2]} />
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <group key={`${x}-${z}`} position={[x * 2, 0.006, z * 1.45 - 0.3]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={gold}><ringGeometry args={[0.048, 0.09, 24]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.046, 24]} /><meshBasicMaterial color="#07110d" /></mesh>
    </group>))}
    <group position={[-1.2, 0, 0.85]}>
      <mesh position={[0, 0.075, 0]} material={packageMaterial}><boxGeometry args={[0.8, 0.15, 0.22]} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[(i - 5.5) * 0.059, 0.16, 0]} material={gold}><boxGeometry args={[0.022, 0.17, 0.022]} /></mesh>)}
    </group>
    <mesh position={[0.68, 0.02, -0.48]}><boxGeometry args={[0.55, 0.018, 0.009]} /><meshStandardMaterial color="#5cbba5" emissive="#277d70" emissiveIntensity={1.4} /></mesh>
    <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#06130f" roughness={0.94} /></mesh>
  </group>;
}
