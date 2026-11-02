import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { unzipSync } from 'fflate';
import { AnimationMixer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

test('downloaded Meta models decode with preserved attribution, textures, and display bounds', async () => {
  const metadata = JSON.parse(readFileSync(new URL('../../public/assets/models/meta.meta.json', import.meta.url)));
  assert.deepEqual(metadata.models.map(asset => asset.file), ['meta-logo.glb', 'quest3.glb', 'meta-vr-glasses.glb']);
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
    assert.equal(root.listAnimations().length, asset.file === 'meta-logo.glb' ? 1 : 0);
    const { min, max } = getBounds(scene);
    for (let axis = 0; axis < 3; axis++) assert.ok(Math.abs(min[axis] + max[axis]) < 0.001);
    const size = { 'meta-logo.glb': 3, 'quest3.glb': 2.4, 'meta-vr-glasses.glb': 1.7 }[asset.file];
    assert.ok(Math.abs(Math.max(...max.map((value, axis) => value - min[axis])) - size) < 0.001);
    assert.ok(!root.listExtensionsRequired().some(extension => extension.extensionName === 'KHR_materials_pbrSpecularGlossiness'));
    let count = 0;
    scene.traverse(node => {
      for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
        count++;
        assert.ok(Array.from(primitive.getAttribute('POSITION').getArray()).every(Number.isFinite));
      }
    });
    assert.ok(count > 0);
    if (asset.file === 'meta-logo.glb') {
      const archive = unzipSync(source);
      const original = await io.readJSON({ json: JSON.parse(new TextDecoder().decode(archive['scene.gltf'])), resources: archive });
      const originalChannels = original.getRoot().listAnimations()[0].listChannels();
      const channels = root.listAnimations()[0].listChannels();
      assert.equal(channels.length, originalChannels.length);
      for (const [index, channel] of channels.entries()) {
        assert.equal(channel.getTargetNode().getName(), originalChannels[index].getTargetNode().getName());
        assert.equal(channel.getTargetPath(), originalChannels[index].getTargetPath());
        for (const accessor of ['getInput', 'getOutput']) {
          const actual = channel.getSampler()[accessor]();
          const expected = originalChannels[index].getSampler()[accessor]();
          assert.equal(actual.getCount(), expected.getCount());
          for (let element = 0; element < actual.getCount(); element++) {
            const a = actual.getElement(element, []);
            const b = expected.getElement(element, []);
            // q and -q describe the same rotation; compression aligns quaternion signs.
            const sign = accessor === 'getOutput' && channel.getTargetPath() === 'rotation'
              && a.reduce((dot, value, component) => dot + value * b[component], 0) < 0 ? -1 : 1;
            assert.ok(a.every((value, component) => Math.abs(value - sign * b[component]) < 0.0001));
          }
        }
      }
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
        .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
      const mixer = new AnimationMixer(gltf.scene);
      mixer.clipAction(gltf.animations[0]).play();
      mixer.setTime(0);
      gltf.scene.updateMatrixWorld(true);
      const logoMesh = gltf.scene.getObjectByName('Object_7');
      const startMatrix = [...logoMesh.matrixWorld.elements];
      mixer.setTime(gltf.animations[0].duration * 0.37);
      gltf.scene.updateMatrixWorld(true);
      assert.ok(logoMesh.matrixWorld.elements.some((value, axis) => Math.abs(value - startMatrix[axis]) > 0.001));
      mixer.stopAllAction();
      assert.match(root.getAsset().extras.author, /Elin/);
      assert.match(root.getAsset().extras.license, /CC-BY-4.0/);
    } else if (asset.file === 'quest3.glb') {
      assert.equal(root.listTextures().length, 3);
      const material = root.listMaterials()[0];
      assert.ok(material.getBaseColorTexture());
      assert.ok(material.getNormalTexture());
      assert.ok(material.getMetallicRoughnessTexture());
    } else {
      assert.match(root.getAsset().extras.author, /rogeressig/);
      assert.match(root.getAsset().extras.license, /CC-BY-4.0/);
    }
  }
});
