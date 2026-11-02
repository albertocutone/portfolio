import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, basename, resolve } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { center, dedup, flatten, getBounds, join, meshopt, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { BufferAttribute, BufferGeometry } from 'three';

const input = resolve(process.argv[2] ?? 'assets/colosseum_rome_italy.glb');
const output = resolve(process.argv[3] ?? 'public/assets/models/colosseum.glb');
const source = 'https://skfb.ly/orOMD';
const license = 'http://creativecommons.org/licenses/by/4.0/';
const credit = `"Colosseum, Rome, Italy" (${source}) by Brian Trepanier is licensed under Creative Commons Attribution (${license}).`;
const adaptations = 'Centered, uniformly scaled, simplified, vertex normals reconstructed, texture recompressed as WebP, and Meshopt-compressed for this scene.';
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const sourceBytes = await readFile(input);
const document = await io.read(input);
const root = document.getRoot();
document.createExtension(EXTTextureWebP).setRequired(true);
const scene = root.getDefaultScene() ?? root.listScenes()[0];
if (!scene || root.listAnimations().length || root.listSkins().length) throw new Error('Expected a static Colosseum scene.');
root.setDefaultScene(scene);
const triangles = () => {
  let total = 0;
  scene.traverse(node => {
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      if (primitive.getMode() !== 4) throw new Error('Expected triangle geometry.');
      total += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
    }
  });
  return total;
};
const sourceTriangles = triangles();
const bounds = getBounds(scene);
const longest = Math.max(...bounds.max.map((value, axis) => value - bounds.min[axis]));
if (!Number.isFinite(longest) || longest <= 0) throw new Error('Invalid Colosseum bounds.');
const scale = 6 / longest;
const wrapper = document.createNode('Colosseum display scale').setScale([scale, scale, scale]);
for (const child of scene.listChildren()) wrapper.addChild(child);
scene.addChild(wrapper);
const textures = [];
for (const texture of root.listTextures()) {
  const image = sharp(texture.getImage(), { limitInputPixels: false });
  const original = await image.metadata();
  const resized = await image.resize({ width: 8192, height: 8192, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 }).toBuffer();
  texture.setImage(new Uint8Array(resized)).setMimeType('image/webp');
  textures.push({ sourceSize: [original.width, original.height], outputSize: texture.getSize(), bytes: resized.length });
}
await document.transform(center(), flatten(), dedup(), join());
// The export duplicates vertices for flat face normals. Rebuild smooth normals
// after welding and simplification, keeping the scan's UV seams intact.
for (const mesh of root.listMeshes()) for (const primitive of mesh.listPrimitives()) primitive.setAttribute('NORMAL', null);
await document.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.4, error: 0.001 }));
for (const mesh of root.listMeshes()) for (const primitive of mesh.listPrimitives()) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(primitive.getAttribute('POSITION').getArray(), 3));
  geometry.setIndex(new BufferAttribute(primitive.getIndices().getArray(), 1));
  geometry.computeVertexNormals();
  primitive.setAttribute('NORMAL', document.createAccessor().setType('VEC3').setArray(geometry.getAttribute('normal').array));
  geometry.dispose();
}
await document.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 16, quantizeTexcoord: 14, quantizeNormal: 10 }));
root.getAsset().copyright = `${credit} ${adaptations}`;
scene.setName('Colosseum, Rome, Italy').setExtras({ source, license, attribution: credit, adaptations });
await mkdir(dirname(output), { recursive: true });
await io.write(output, document);
const bytes = await readFile(output);
const metadata = {
  name: 'Colosseum, Rome, Italy', author: 'Brian Trepanier', source, license: 'CC-BY-4.0', attribution: credit, adaptations,
  sourceFile: basename(input), sourceFileBytes: sourceBytes.length, sourceFileSha256: createHash('sha256').update(sourceBytes).digest('hex'),
  sourceTriangles, triangles: triangles(), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), bounds: getBounds(scene), textures,
  optimization: { ratio: 0.4, maximumRelativeError: 0.001, compression: 'EXT_meshopt_compression', quantizePosition: 16, textureMaxSize: 8192, textureQuality: 85, textureFormat: 'webp' },
};
await writeFile(output.replace(/\.glb$/, '.meta.json'), `${JSON.stringify(metadata, null, 2)}\n`);
await writeFile(output.replace(/\.glb$/, '.LICENSE.txt'), `${credit}\n\n${adaptations}\n`);
console.log(JSON.stringify(metadata, null, 2));
