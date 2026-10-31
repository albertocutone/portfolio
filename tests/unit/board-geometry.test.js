import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { createBoardGeometry, createSensorFrame } from '../../src/components/3D/boardGeometry.js';

test('PCB holes are actual through-bores rather than dark circles painted on a box', () => {
  const drilled = [{ x: 2.02, z: 1.19, radius: 0.06 }, { x: 0.775, z: 0.8, radius: 0.04 }];
  const geometry = createBoardGeometry({ width: 32, depth: 24 }, drilled);
  const mesh = new Mesh(geometry.body, new MeshBasicMaterial({ side: DoubleSide }));
  mesh.updateMatrixWorld();
  for (const hole of drilled) {
    const ray = new Raycaster(new Vector3(hole.x, 1, hole.z), new Vector3(0, -1, 0));
    assert.equal(ray.intersectObject(mesh).length, 0);
  }
  assert.ok(new Raycaster(new Vector3(0, 1, 0), new Vector3(0, -1, 0)).intersectObject(mesh).length > 0);
  const box = new Box3().setFromBufferAttribute(geometry.body.attributes.position);
  assert.ok(Math.abs(box.min.y + 0.16) < 1e-6);
  assert.ok(Math.abs(box.max.y) < 1e-6);
  assert.ok(Math.abs(box.max.x - 16) < 1e-6);
  for (const part of [geometry.detail]) {
    assert.ok([...part.attributes.uv.array].every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  }
});

test('substrate has a single outer surface instead of overlapping fullscreen planes', () => {
  const geometry = createBoardGeometry({ width: 32, depth: 24 });
  assert.equal('mask' in geometry, false);
});

test('sensor frame respects its physical height and leaves the active die exposed', () => {
  const frame = createSensorFrame();
  const bounds = new Box3().setFromBufferAttribute(frame.attributes.position);
  assert.ok(Math.abs(bounds.getSize(new Vector3()).y - 0.018) < 1e-6);
  assert.ok(0.165 + bounds.max.y + 0.001 < 0.176);
});

test('resized substrates reuse the detailed surface and release only owned geometry', () => {
  const shared = createBoardGeometry({ width: 4.4, depth: 3.4 }).detail;
  const first = createBoardGeometry({ width: 32, depth: 24 }, [], shared);
  const second = createBoardGeometry({ width: 40, depth: 24 }, [], shared);
  assert.equal(first.detail, shared);
  assert.equal(second.detail, shared);
  assert.equal(typeof first.dispose, 'function');
  let bodies = 0;
  let details = 0;
  first.body.addEventListener('dispose', () => bodies++);
  second.body.addEventListener('dispose', () => bodies++);
  shared.addEventListener('dispose', () => details++);
  first.dispose(); second.dispose();
  assert.equal(bodies, 2);
  assert.equal(details, 0);
  shared.dispose();
  assert.equal(details, 1);
});
