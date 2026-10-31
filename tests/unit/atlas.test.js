import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { GLTFLoader, MeshoptDecoder as BrowserMeshoptDecoder } from 'three-stdlib';

test('the pinned ATLAS GLB decodes as complete, centered detector geometry', async () => {
  const model = new URL('../../public/assets/models/atlas.glb', import.meta.url);
  const metadata = JSON.parse(readFileSync(new URL('../../public/assets/models/atlas.meta.json', import.meta.url)));
  const source = readFileSync(new URL('../../assets/cern_atlas_detector.zip', import.meta.url));
  const output = readFileSync(model);
  assert.equal(createHash('sha256').update(source).digest('hex'), metadata.sourceFileSha256);
  assert.equal(createHash('sha256').update(output).digest('hex'), metadata.sha256);
  assert.equal(output.length, metadata.bytes);
  assert.ok(output.length < 3 * 1024 * 1024);
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const document = await io.read(model.pathname);
  const root = document.getRoot();
  const scene = root.getDefaultScene();
  assert.ok(scene);
  assert.equal(scene.getExtras().license, 'https://creativecommons.org/licenses/by/4.0/');
  assert.match(root.getAsset().copyright, /physics\.atlas\.vr/);
  assert.ok(root.listExtensionsRequired().some(extension => extension.extensionName === 'EXT_meshopt_compression'));
  let triangles = 0;
  let draws = 0;
  scene.traverse(node => {
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      draws++;
      const positions = primitive.getAttribute('POSITION');
      assert.ok(positions.getCount() > 0);
      assert.ok(Array.from(positions.getArray()).every(Number.isFinite));
      const indices = primitive.getIndices();
      assert.ok(Array.from(indices.getArray()).every(index => index < positions.getCount()));
      triangles += indices.getCount() / 3;
    }
  });
  assert.equal(triangles, metadata.triangles);
  assert.ok(triangles > 10000 && triangles < metadata.sourceTriangles);
  assert.ok(draws <= 12);
  const { min, max } = getBounds(scene);
  assert.ok(Math.abs(Math.max(...max.map((value, axis) => value - min[axis])) - 4.6) < 0.01);
  for (let axis = 0; axis < 3; axis++) assert.ok(Math.abs(min[axis] + max[axis]) < 0.01);
});

test('the webpage loader and its bundled decoder load all ATLAS materials and triangles', async () => {
  const bytes = readFileSync(new URL('../../public/assets/models/atlas.glb', import.meta.url));
  const metadata = JSON.parse(readFileSync(new URL('../../public/assets/models/atlas.meta.json', import.meta.url)));
  const decoder = typeof BrowserMeshoptDecoder === 'function' ? BrowserMeshoptDecoder() : BrowserMeshoptDecoder;
  const loader = new GLTFLoader().setMeshoptDecoder(decoder);
  const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  let meshes = 0;
  let triangles = 0;
  gltf.scene.traverse(node => {
    if (!node.isMesh) return;
    meshes++;
    triangles += node.geometry.index.count / 3;
    assert.equal(node.material.type, 'MeshStandardMaterial');
    assert.equal(node.material.opacity, 1);
  });
  assert.equal(meshes, 12);
  assert.equal(triangles, metadata.triangles);
});
