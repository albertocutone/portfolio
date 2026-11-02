import { useGLTF } from '@react-three/drei';

export default function MetaWorld() {
  const logo = useGLTF(`${import.meta.env.BASE_URL}assets/models/meta-logo.glb`, false);
  const headset = useGLTF(`${import.meta.env.BASE_URL}assets/models/quest3.glb`, false);
  const glasses = useGLTF(`${import.meta.env.BASE_URL}assets/models/meta-vr-glasses.glb`, false);
  return <group>
    <primitive object={logo.scene} position={[0, 2.75, -0.3]} />
    <primitive object={headset.scene} position={[-0.55, 1.4, -0.4]} rotation={[-0.1, -0.28, -0.12]} scale={0.82} />
    <primitive object={glasses.scene} position={[0.5, 0.35, 0.65]} rotation={[-0.12, -0.22, 0]} />
  </group>;
}
