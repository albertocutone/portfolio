import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

test('the bundled Colosseum preserves texture, detailed geometry, and Brian Trepanier attribution', async () => {
  const path = new URL('../../public/assets/models/colosseum.glb', import.meta.url);
  const bytes = readFileSync(path);
  const metadata = JSON.parse(readFileSync(new URL('../../public/assets/models/colosseum.meta.json', import.meta.url)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), metadata.sha256);
  assert.ok(bytes.length < 80 * 1024 * 1024);
  await MeshoptDecoder.ready;
  const document = await new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder }).read(path.pathname);
  const root = document.getRoot();
  assert.ok(root.listExtensionsRequired().some(extension => extension.extensionName === 'EXT_texture_webp'));
  const scene = root.getDefaultScene();
  assert.equal(scene.getExtras().attribution, metadata.attribution);
  assert.match(root.getAsset().copyright, /Brian Trepanier/);
  assert.equal(scene.getExtras().source, 'https://skfb.ly/orOMD');
  assert.equal(scene.getExtras().license, 'http://creativecommons.org/licenses/by/4.0/');
  assert.equal(root.listTextures().length, 1);
  assert.deepEqual(root.listTextures()[0].getSize(), [8192, 8192]);
  assert.equal(root.listTextures()[0].getMimeType(), 'image/webp');
  let triangles = 0;
  scene.traverse(node => {
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      const positions = primitive.getAttribute('POSITION');
      assert.ok(primitive.getAttribute('TEXCOORD_0'));
      assert.ok(primitive.getAttribute('NORMAL'));
      assert.ok(Array.from(positions.getArray()).every(Number.isFinite));
      assert.ok(Array.from(primitive.getIndices().getArray()).every(index => index < positions.getCount()));
      triangles += primitive.getIndices().getCount() / 3;
    }
  });
  assert.equal(triangles, metadata.triangles);
  assert.ok(triangles >= 500000 && triangles < metadata.sourceTriangles);
  const { min, max } = getBounds(scene);
  assert.ok(Math.abs(Math.max(...max.map((value, axis) => value - min[axis])) - 6) < 0.01);
});
