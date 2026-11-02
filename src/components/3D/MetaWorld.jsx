import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer } from 'three';

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
    headsetTurn.current.rotation.y = (headsetTurn.current.rotation.y + step * 0.1) % (Math.PI * 2);
    glassesTurn.current.rotation.y = (glassesTurn.current.rotation.y + step * 0.1) % (Math.PI * 2);
  });
  return <group>
    <primitive object={logo.scene} position={[0, 2.75, -0.3]} />
    <group ref={headsetTurn} position={[-0.55, 1.5, -0.4]}>
      <primitive object={headset.scene} rotation={[-0.1, -0.28, -0.12]} scale={0.82} />
    </group>
    <group ref={glassesTurn} position={[0.5, 0.35, 0.65]}>
      <primitive object={glasses.scene} rotation={[-0.12, -0.22, 0]} />
    </group>
  </group>;
}
