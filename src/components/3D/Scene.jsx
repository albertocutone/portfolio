import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, useEnvironment } from '@react-three/drei';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { Vector3 } from 'three';
import { stations } from '../../config/stations.js';
import { environmentAsset } from '../../config/componentAssets.js';
import { cameraProjection } from '../../config/motion.js';
import { resolveTimeline } from '../../scroll/timeline.js';
import PCBWorld from './PCBWorld.jsx';
import AtlasWorld from './AtlasWorld.jsx';
import ColosseumWorld from './ColosseumWorld.jsx';
import MetaWorld from './MetaWorld.jsx';

function CameraRig({ store, depth, activeScene }) {
  const { camera, size } = useThree();
  const [target] = useState(() => new Vector3());
  const [focus] = useState(() => new Vector3());
  useLayoutEffect(() => {
    const shift = size.width >= 900 ? size.width * cameraProjection.desktopOffset : 0;
    const verticalShift = size.width < 900 && activeScene !== 'pcb' ? size.height * 0.18 : 0;
    camera.setViewOffset(size.width, size.height, shift, verticalShift, size.width, size.height);
    return () => camera.clearViewOffset();
  }, [camera, size.width, size.height, activeScene]);
  useFrame(() => {
    const timeline = resolveTimeline(store.getSnapshot(), stations);
    camera.position.set(...timeline.position);
    target.set(...timeline.target);
    if (activeScene !== 'pcb' && size.width < 900) {
      camera.position.sub(target).multiplyScalar(Math.max(1, 0.9 * size.height / size.width)).add(target);
    }
    camera.lookAt(target);
    focus.set(...timeline.focus);
    if (depth.current) {
      depth.current.target.copy(focus);
      depth.current.bokehScale = timeline.bokehScale ?? 0.75;
      depth.current.circleOfConfusionMaterial.focusRange = timeline.focusRange ?? 0.32;
    }
  });
  return null;
}

export default function Scene({ store }) {
  const depth = useRef();
  const getScene = useCallback(() => resolveTimeline(store.getSnapshot(), stations).scene, [store]);
  const activeScene = useSyncExternalStore(store.subscribe, getScene);
  const [initialFocus] = useState(() => new Vector3(...stations[0].anchor));
  const environment = useEnvironment({ files: `${import.meta.env.BASE_URL}${environmentAsset.file}` });
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    const autoUpdate = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = autoUpdate; };
  }, [gl]);
  useLayoutEffect(() => { gl.shadowMap.needsUpdate = true; }, [gl, activeScene]);
  return <>
    <color attach="background" args={['#101714']} />
    <Environment map={environment} environmentIntensity={0.75} />
    <ambientLight intensity={0.18} />
    <directionalLight position={[-2, 4, 2.5]} color="#fff9ef" intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0001} />
    <directionalLight position={[3, 2, -3]} color="#d4e2e1" intensity={0.8} />
    <group visible={activeScene === 'colosseum'}><ColosseumWorld /></group>
    <group visible={activeScene === 'atlas'}><AtlasWorld active={activeScene === 'atlas'} /></group>
    <group visible={activeScene === 'meta'}><MetaWorld active={activeScene === 'meta'} /></group>
    <group visible={activeScene === 'pcb'}>
      <PCBWorld />
      {activeScene === 'pcb' && <ContactShadows frames={1} position={[0, 0.006, -0.3]} scale={8} opacity={0.42} blur={1.3} far={1.6} resolution={1024} />}
    </group>
    <CameraRig store={store} depth={depth} activeScene={activeScene} />
    <EffectComposer multisampling={4}>
      <DepthOfField ref={depth} target={initialFocus} focusRange={0.32} bokehScale={0.75} resolutionScale={0.5} />
      <Bloom luminanceThreshold={1.8} intensity={0.09} mipmapBlur />
    </EffectComposer>
  </>;
}
