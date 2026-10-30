import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { createScrollStore } from './scroll/store.js';
import ScrollBridge from './scroll/ScrollBridge.jsx';
import Scene from './components/3D/Scene.jsx';
import Overlay from './components/2D/Overlay.jsx';

export default function App() {
  const [store] = useState(createScrollStore);
  const [paused, setPaused] = useState(false);
  const [isReady, setReady] = useState(false);
  const shell = useRef();
  useEffect(() => store.subscribe(() => {
    shell.current.dataset.offset = store.getSnapshot().toFixed(5);
  }), [store]);
  function ready() { setReady(true); }
  return <div ref={shell} className="experience" data-offset="0.00000" data-ready={isReady}>
    <div className="canvas-layer" aria-label="A cinematic flight across a procedural printed circuit board">
      <Canvas dpr={[1, 1.5]} camera={{ fov: 40, near: 0.01, far: 100 }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <ScrollControls pages={4} damping={0.15} enabled={!paused} style={{ scrollbarWidth: 'none' }}>
          <ScrollBridge store={store} paused={paused} onReady={ready} />
          <Scene store={store} />
        </ScrollControls>
      </Canvas>
    </div>
    <div className="scene-shade" aria-hidden="true" />
    <Overlay store={store} onModalChange={setPaused} />
  </div>;
}
