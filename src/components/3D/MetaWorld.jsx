import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer } from 'three';
import { modelRotationPeriod } from '../../config/motion.js';

export default function MetaWorld({ active }) {
  const logo = useGLTF(`${import.meta.env.BASE_URL}assets/models/meta-logo.glb`, false);
  const headset = useGLTF(`${import.meta.env.BASE_URL}assets/models/quest3.glb`, false);
  const glasses = useGLTF(`${import.meta.env.BASE_URL}assets/models/meta-vr-glasses.glb`, false);
  const headsetTurn = useRef();
  const glassesTurn = useRef();
  const mixer = useMemo(() => new AnimationMixer(logo.scene), [logo.scene]);
  useEffect(() => {
    for (const clip of logo.animations) mixer.clipAction(clip).play();
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(logo.scene); };
  }, [mixer, logo.scene, logo.animations]);
  useFrame((_, delta) => {
    if (!active) return;
    const step = Math.min(delta, 0.1);
    mixer.update(step);
    const angle = (headsetTurn.current.rotation.y + delta * Math.PI * 2 / modelRotationPeriod) % (Math.PI * 2);
    headsetTurn.current.rotation.y = angle;
    glassesTurn.current.rotation.y = angle + Math.PI;
  });
  return <group>
    <primitive object={logo.scene} position={[0, 2.75, -0.3]} />
    <group ref={headsetTurn} position={[-0.55, 1.5, -0.4]} rotation={[0, -0.28, 0]}>
      <primitive object={headset.scene} rotation={[-0.1, 0, -0.12]} scale={0.82} />
    </group>
    <group ref={glassesTurn} position={[0.5, 0.35, 0.65]} rotation={[0, Math.PI - 0.28, 0]}>
      <primitive object={glasses.scene} rotation={[-0.12, 0, 0]} />
    </group>
  </group>;
}
