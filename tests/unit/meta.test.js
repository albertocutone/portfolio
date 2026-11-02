import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

test('downloaded Meta models decode with preserved attribution, textures, and display bounds', async () => {
  const metadata = JSON.parse(readFileSync(new URL('../../public/assets/models/meta.meta.json', import.meta.url)));
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  for (const asset of metadata.models) {
    const source = readFileSync(new URL(`../../assets/${asset.sourceFile}`, import.meta.url));
    assert.equal(createHash('sha256').update(source).digest('hex'), asset.sourceFileSha256);
    const bytes = readFileSync(new URL(`../../public/assets/models/${asset.file}`, import.meta.url));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.ok(bytes.length < 2 * 1024 * 1024);
    const document = await io.readBinary(bytes);
    const root = document.getRoot();
    const scene = root.getDefaultScene();
    assert.equal(root.listAnimations().length, 0);
    const { min, max } = getBounds(scene);
    for (let axis = 0; axis < 3; axis++) assert.ok(Math.abs(min[axis] + max[axis]) < 0.001);
    assert.ok(Math.abs(Math.max(...max.map((value, axis) => value - min[axis])) - (asset.file === 'meta-logo.glb' ? 3 : 2.4)) < 0.001);
    let count = 0;
    scene.traverse(node => {
      for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
        count++;
        assert.ok(Array.from(primitive.getAttribute('POSITION').getArray()).every(Number.isFinite));
      }
    });
    assert.ok(count > 0);
    if (asset.file === 'meta-logo.glb') {
      assert.match(root.getAsset().extras.author, /Elin/);
      assert.match(root.getAsset().extras.license, /CC-BY-4.0/);
    } else {
      assert.equal(root.listTextures().length, 3);
      const material = root.listMaterials()[0];
      assert.ok(material.getBaseColorTexture());
      assert.ok(material.getNormalTexture());
      assert.ok(material.getMetallicRoughnessTexture());
    }
  }
});
