import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Vector3 } from 'three';
import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';
import { prepareComponent } from '../../src/components/3D/assetGeometry.js';
import { componentAssets } from '../../src/config/componentAssets.js';
import { placements } from '../../src/config/boardLayout.js';
import { cameraProjection } from '../../src/config/motion.js';
import { stations } from '../../src/config/stations.js';
import { resolveTimeline } from '../../src/scroll/timeline.js';

test('the whole camera tour clears actual component envelopes and the board near plane', () => {
  const models = new Map(componentAssets.map(asset => {
    const source = new VRMLLoader().parse(readFileSync(new URL(`../../public/${asset.file}`, import.meta.url), 'utf8'));
    const parts = prepareComponent(source, asset);
    return [asset.id, parts.reduce((bounds, part) => bounds.union(part.geometry.boundingBox), new Box3())];
  }));
  const envelopes = placements.map(part => {
    const transform = new Matrix4().makeRotationY(part.rotation).setPosition(part.x, 0.004, part.z);
    return models.get(part.type).clone().applyMatrix4(transform);
  });
  envelopes.push(new Box3(new Vector3(-0.245, 0.156, -0.245), new Vector3(0.245, 0.176, 0.245)));
  for (let step = 0; step <= 1000; step++) {
    const pose = resolveTimeline(step / 1000, stations);
    const camera = new Vector3(...pose.position);
    assert.ok(camera.y > cameraProjection.near + 0.01, `board clearance at ${step / 1000}`);
    for (const bounds of envelopes) assert.ok(bounds.distanceToPoint(camera) > cameraProjection.near + 0.01, `component clearance at ${step / 1000}`);
    for (const key of ['position', 'target', 'focus']) assert.ok(pose[key].every(Number.isFinite));
    assert.ok(camera.distanceTo(new Vector3(...pose.target)) > cameraProjection.near);
  }
});
