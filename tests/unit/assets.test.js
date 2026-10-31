import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Box3, BoxGeometry, Group, Mesh, MeshPhongMaterial, Vector3 } from 'three';
import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';
import { componentAssets } from '../../src/config/componentAssets.js';
import { prepareComponent } from '../../src/components/3D/assetGeometry.js';

test('asset preparation preserves hierarchy transforms and applies millimeter scale and up-axis', () => {
  const scene = new Group();
  const parent = new Group();
  parent.position.set(1, 2, 3);
  const mesh = new Mesh(new BoxGeometry(7, 7, 1), new MeshPhongMaterial({ color: '#202020' }));
  parent.add(mesh);
  scene.add(parent);
  const parts = prepareComponent(scene, { id: 'fixture', unitMm: 1, seatOffsetMm: 0, kind: 'package' });
  assert.equal(parts.length, 1);
  const bounds = new Box3().setFromBufferAttribute(parts[0].geometry.attributes.position);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  for (const [actual, expected] of size.toArray().map((n, i) => [n, [0.7, 0.1, 0.7][i]])) assert.ok(Math.abs(actual - expected) < 1e-6);
  for (const [actual, expected] of center.toArray().map((n, i) => [n, [0.1, 0.3, -0.2][i]])) assert.ok(Math.abs(actual - expected) < 1e-6);
  assert.equal(parts[0].material.isMeshStandardMaterial, true);
  assert.ok(parts[0].material.metalness < 0.1);
  assert.equal(mesh.geometry.attributes.position.getX(0), 3.5);
});

test('all required real component families load from bundled licensed assets', () => {
  for (const id of ['lqfp', 'soic', 'capacitor', 'ceramic', 'resistor', 'inductor', 'crystal', 'usb', 'header']) {
    const spec = componentAssets.find((asset) => asset.id === id);
    assert.ok(spec, `missing required component ${id}`);
    const text = readFileSync(new URL(`../../public/${spec.file}`, import.meta.url), 'utf8');
    const source = new VRMLLoader().parse(text);
    const parts = prepareComponent(source, spec);
    assert.ok(parts.length > 0);
    assert.ok(parts.every((part) => part.geometry.attributes.position.count > 0));
    assert.ok(parts.every((part) => part.material.isMeshStandardMaterial));
    assert.ok(spec.source.includes('b8b3cfdfad88ba66f21002b3de51dc6f7d55ba5a'));
    assert.equal(createHash('sha256').update(text).digest('hex'), spec.sha256);
    assert.equal(spec.license, 'CC-BY-SA-4.0');
    const bounds = parts.reduce((box, part) => box.union(part.geometry.boundingBox), new Box3());
    if (id === 'lqfp') assert.ok(Math.abs(bounds.getSize(new Vector3()).x - 0.9) < 0.005);
    if (id === 'capacitor') {
      assert.ok(Math.abs(bounds.max.y - 1.1) < 0.005);
      assert.ok(bounds.min.y < -0.19, 'through-hole leads must penetrate the board');
      assert.ok(Math.abs(bounds.getCenter(new Vector3()).x) < 0.005);
    }
  }
});
