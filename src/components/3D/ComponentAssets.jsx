import { useLayoutEffect, useRef, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { RetryingVRMLLoader } from './RetryingVRMLLoader.js';
import { Object3D } from 'three';
import { componentAssets } from '../../config/componentAssets.js';
import { placements } from '../../config/boardLayout.js';
import { prepareComponent } from './assetGeometry.js';

const urls = componentAssets.map((asset) => `${import.meta.env.BASE_URL}${asset.file}`);

function Instances({ geometry, material, parts }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const object = new Object3D();
    parts.forEach((part, index) => {
      object.position.set(part.x, 0.004, part.z);
      object.rotation.set(0, part.rotation, 0);
      object.updateMatrix();
      ref.current.setMatrixAt(index, object.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [parts]);
  return <instancedMesh ref={ref} args={[geometry, material, parts.length]} castShadow receiveShadow dispose={null} />;
}

export default function ComponentAssets() {
  const sources = useLoader(RetryingVRMLLoader, urls);
  const [models] = useState(() => componentAssets.map((asset, index) => ({
    id: asset.id,
    geometry: prepareComponent(sources[index], asset),
    placements: placements.filter((part) => part.type === asset.id),
  })));
  return <group dispose={null}>{models.map((model) => model.geometry.map((part, i) => <Instances key={`${model.id}-${i}`} geometry={part.geometry} material={part.material} parts={model.placements} />))}</group>;
}
