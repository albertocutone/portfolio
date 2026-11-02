import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { modelRotationPeriod } from '../../config/motion.js';

export default function ColosseumWorld({ active }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}assets/models/colosseum.glb`, false);
  const turn = useRef();
  useFrame((_, delta) => {
    if (!active) return;
    turn.current.rotation.y = (turn.current.rotation.y + delta * Math.PI * 2 / modelRotationPeriod) % (Math.PI * 2);
  });
  return <group ref={turn}><primitive object={scene} /></group>;
}
