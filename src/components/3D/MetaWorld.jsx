import { useGLTF } from '@react-three/drei';

export default function MetaWorld() {
  const logo = useGLTF(`${import.meta.env.BASE_URL}assets/models/meta-logo.glb`, false);
  const headset = useGLTF(`${import.meta.env.BASE_URL}assets/models/quest3.glb`, false);
  return <group>
    <primitive object={logo.scene} position={[0, 2.75, -0.3]} />
    <primitive object={headset.scene} position={[0, 1.15, 0]} rotation={[-0.1, -0.28, -0.12]} />
  </group>;
}
