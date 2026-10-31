import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three';
import { placements, routes, surroundingRoutes } from '../../config/boardLayout.js';
import ComponentAssets from './ComponentAssets.jsx';
import { boardExtent } from './boardExtent.js';
import { createBoardDetail, createBoardGeometry, createSensorFrame } from './boardGeometry.js';

const gold = new MeshStandardMaterial({ color: '#bd9d59', metalness: 0.92, roughness: 0.27 });
const solder = new MeshStandardMaterial({ color: '#b6bdb9', metalness: 0.94, roughness: 0.3 });
const substrate = new MeshStandardMaterial({ color: '#b1aa80', roughness: 0.8 });
const maskedCopper = new MeshPhysicalMaterial({ color: '#427456', metalness: 0.15, roughness: 0.29, clearcoat: 0.35, clearcoatRoughness: 0.37, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -1 });
const surroundingTraces = surroundingRoutes.flatMap((path) => path.slice(1).map((end, index) => {
  const start = path[index];
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  return { x: (start[0] + end[0]) / 2, z: (start[1] + end[1]) / 2, y: 0.0006, rotation: -Math.atan2(dz, dx), scale: [Math.hypot(dx, dz), 0.0002, 0.018] };
}));

function boardSurface() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1536;
  const context = canvas.getContext('2d');
  context.fillStyle = '#18432e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const pixel = ([x, z]) => [(x + 2.2) / 4.4 * canvas.width, (z + 2) / 3.4 * canvas.height];
  // Copper under solder mask has a tonal/specular outline, not exposed gold everywhere.
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (const route of routes) {
    context.beginPath();
    route.forEach((point, index) => { const [x, y] = pixel(point); index ? context.lineTo(x, y) : context.moveTo(x, y); });
    context.lineWidth = 10;
    context.strokeStyle = '#092f20';
    context.stroke();
    context.lineWidth = 5;
    context.strokeStyle = '#427456';
    context.stroke();
  }
  context.strokeStyle = '#bed0b44a';
  context.lineWidth = 2;
  for (const part of placements) {
    if (!['lqfp', 'soic', 'inductor', 'crystal'].includes(part.type)) continue;
    const width = part.type === 'lqfp' ? 0.96 : part.type === 'soic' ? 0.66 : 0.44;
    const height = part.type === 'soic' ? 1.04 : width;
    const [x, y] = pixel([part.x - width / 2, part.z - height / 2]);
    context.strokeRect(x, y, width / 4.4 * canvas.width, height / 3.4 * canvas.height);
  }
  function label(text, x, z, size = 25) {
    const position = pixel([x, z]);
    context.fillStyle = '#d7dece';
    context.font = `500 ${size}px monospace`;
    context.fillText(text, ...position);
  }
  label('AC / SYSTEM EXPLORER', -1.9, -1.82, 30);
  label('SENSOR', -0.3, 0.78);
  label('AFE', -1.38, -0.69);
  label('EDGE', 0.94, -0.48);
  label('PWR', 1.56, 1.17);
  label('J1', -1.02, 1.22);
  label('3V3  GND  SWD  CLK', -1.95, -0.94, 19);
  for (let i = 0; i < placements.length; i++) {
    const part = placements[i];
    if (part.type === 'resistor' || part.type === 'ceramic') label(`${part.type === 'resistor' ? 'R' : 'C'}${i}`, part.x - 0.06, part.z + 0.12, 13);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  const material = new MeshPhysicalMaterial({ color: '#ffffff', map: texture, roughness: 0.34, metalness: 0.12, clearcoat: 0.35, clearcoatRoughness: 0.37, envMapIntensity: 0.8, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2, depthWrite: false });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBoardPosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBoardPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBoardPosition;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      float grain = fract(sin(dot(vBoardPosition.xz, vec2(127.1, 311.7))) * 43758.5453);
      roughnessFactor += (grain - 0.5) * 0.045;
    `);
  };
  material.customProgramCacheKey = () => 'solder-mask-v2';
  return material;
}

function PadInstances({ pads, material, shape = 'box' }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const object = new Object3D();
    pads.forEach((pad, index) => {
      object.position.set(pad.x, pad.y ?? 0.0025, pad.z);
      object.rotation.set(shape === 'ring' ? -Math.PI / 2 : 0, pad.rotation ?? 0, 0);
      object.scale.set(...(pad.scale ?? [1, 1, 1]));
      object.updateMatrix();
      ref.current.setMatrixAt(index, object.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [pads, shape]);
  return <instancedMesh ref={ref} args={[undefined, material, pads.length]} receiveShadow>
    {shape === 'ring' ? <ringGeometry args={[0.018, 0.035, 20]} /> : <boxGeometry args={[1, 1, 1]} />}
  </instancedMesh>;
}

function createPads() {
  const pads = [];
  for (const part of placements) {
    if (part.type === 'resistor' || part.type === 'ceramic') {
      for (const side of [-1, 1]) pads.push({ x: part.x + Math.cos(part.rotation) * side * 0.067, z: part.z - Math.sin(part.rotation) * side * 0.067, rotation: part.rotation, scale: [0.07, 0.004, 0.09] });
    }
    if (part.type === 'lqfp') {
      for (let i = 0; i < 12; i++) for (let side = 0; side < 4; side++) {
        const lane = (i - 5.5) * 0.05;
        pads.push({ x: part.x + (side < 2 ? (side === 0 ? -0.414 : 0.414) : lane), z: part.z + (side >= 2 ? (side === 2 ? -0.414 : 0.414) : lane), scale: side < 2 ? [0.14, 0.004, 0.026] : [0.026, 0.004, 0.14] });
      }
    }
    if (part.type === 'soic') for (let i = 0; i < 8; i++) for (const side of [-1, 1]) pads.push({ x: part.x + side * 0.272, z: part.z + (i - 3.5) * 0.127, scale: [0.12, 0.004, 0.062] });
  }
  return pads;
}
const padLayout = createPads();
const viaLayout = routes.filter((_, i) => i % 3 === 0).map((route) => ({ x: route.at(-1)[0], z: route.at(-1)[1] }));
const leadHoles = placements.filter((part) => part.type === 'capacitor').flatMap((part) => [-1, 1].map((side) => ({ x: part.x + side * 0.125, z: part.z, scale: [2.22, 2.22, 2.22] })));
const mountingHoles = [-1, 1].flatMap((x) => [-1, 1].map((z) => ({ x: x * 2.02, z: z * 1.49 - 0.3, radius: 0.06 })));
const headerHoles = [-0.381, -0.127, 0.127, 0.381].map((offset) => ({ x: -1.62 + offset, z: -1.25, radius: 0.04 }));
const drills = [...viaLayout.map((hole) => ({ ...hole, radius: 0.018 })), ...leadHoles.map((hole) => ({ ...hole, radius: 0.04 })), ...mountingHoles, ...headerHoles];

function sensorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  context.fillStyle = '#526f83'; context.fillRect(0, 0, 512, 512);
  for (let y = 16; y < 496; y += 6) for (let x = 16; x < 496; x += 6) {
    context.fillStyle = (Math.floor(x / 6) + Math.floor(y / 6)) % 3 === 0 ? '#718b9b' : '#345c72';
    context.fillRect(x, y, 4, 4);
  }
  const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 8;
  return map;
}

export default function PCBWorld() {
  const [mask] = useState(boardSurface);
  const [die] = useState(sensorTexture);
  const [detail] = useState(() => createBoardDetail(drills));
  const [frame] = useState(createSensorFrame);
  const { width, height } = useThree((state) => state.size);
  const extent = useMemo(() => boardExtent(width, height), [width, height]);
  const geometry = useMemo(() => createBoardGeometry(extent, drills, detail), [extent.width, extent.depth, detail]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  const [surroundingMask] = useState(() => {
    const material = mask.clone();
    material.map = null;
    material.color.set('#18432e');
    material.polygonOffset = false;
    material.depthWrite = true;
    material.onBeforeCompile = mask.onBeforeCompile;
    material.customProgramCacheKey = mask.customProgramCacheKey;
    return material;
  });
  useLayoutEffect(() => () => { detail.dispose(); frame.dispose(); mask.map.dispose(); mask.dispose(); die.dispose(); surroundingMask.dispose(); }, [detail, frame, mask, die, surroundingMask]);
  return <group>
    <mesh geometry={geometry.body} material={[surroundingMask, substrate]} receiveShadow />
    <mesh position={[0, 0.001, -0.3]} rotation={[-Math.PI / 2, 0, 0]} geometry={geometry.detail} material={mask} renderOrder={1} receiveShadow />
    <ComponentAssets />
    <PadInstances pads={surroundingTraces} material={maskedCopper} />
    <PadInstances pads={padLayout} material={gold} />
    <PadInstances pads={padLayout.map((pad) => ({ ...pad, y: 0.005, scale: [pad.scale[0] * 0.78, 0.004, pad.scale[2] * 0.82] }))} material={solder} />
    <PadInstances pads={[...viaLayout, ...leadHoles]} material={gold} shape="ring" />
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <group key={`${x}${z}`} position={[x * 2.02, 0.002, z * 1.49 - 0.3]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={gold}><ringGeometry args={[0.06, 0.115, 32]} /></mesh>
    </group>))}
    <mesh geometry={frame} position={[0, 0.165, 0]} castShadow><meshStandardMaterial color="#909ca0" metalness={0.9} roughness={0.2} /></mesh>
    <mesh position={[0, 0.176, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.435, 0.435]} /><meshPhysicalMaterial map={die} metalness={0.2} roughness={0.23} clearcoat={0.45} clearcoatRoughness={0.15} envMapIntensity={0.35} /></mesh>
    <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#111714" roughness={0.9} /></mesh>
  </group>;
}
