import { useGLTF } from '@react-three/drei';

export default function AtlasWorld() {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}assets/models/atlas.glb`, false);
  return <primitive object={scene} position={[0, 1.6, 0]} />;
}
