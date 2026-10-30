import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { Vector3 } from 'three';
import { stations } from '../../config/stations.js';
import { resolveTimeline } from '../../scroll/timeline.js';
import PCBWorld from './PCBWorld.jsx';

function CameraRig({ store, depth }) {
  const { camera, size } = useThree();
  const [target] = useState(() => new Vector3());
  const [focus] = useState(() => new Vector3());
  useFrame(() => {
    const timeline = resolveTimeline(store.getSnapshot(), stations);
    camera.position.set(...timeline.position);
    target.set(...timeline.target);
    camera.lookAt(target);
    const shift = size.width >= 900 ? size.width * 0.17 : 0;
    camera.setViewOffset(size.width, size.height, shift, 0, size.width, size.height);
    focus.set(...timeline.focus);
    if (depth.current) {
      depth.current.target.copy(focus);
      depth.current.bokehScale = timeline.index === 3 ? 0.15 : 1.8 * (1 - timeline.transitionProgress * 0.4);
    }
  });
  return null;
}

export default function Scene({ store }) {
  const depth = useRef();
  const [initialFocus] = useState(() => new Vector3(...stations[0].anchor));
  return <>
    <color attach="background" args={['#071912']} />
    <ambientLight intensity={0.65} />
    <hemisphereLight args={['#cde9dc', '#0b2316', 1.2]} />
    <directionalLight position={[1.5, 3, 2]} color="#fff2c9" intensity={4.3} />
    <directionalLight position={[-3, 2, -2]} color="#6db8aa" intensity={2.2} />
    <PCBWorld />
    <CameraRig store={store} depth={depth} />
    <EffectComposer multisampling={0}>
      <DepthOfField ref={depth} target={initialFocus} focalLength={0.035} bokehScale={1.8} height={480} />
      <Bloom luminanceThreshold={1.4} intensity={0.18} mipmapBlur />
    </EffectComposer>
  </>;
}
