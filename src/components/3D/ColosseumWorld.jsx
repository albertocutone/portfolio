import { useGLTF } from '@react-three/drei';

export default function ColosseumWorld() {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}assets/models/colosseum.glb`, false);
  return <primitive object={scene} />;
}
