import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { unzipSync } from 'fflate';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { center, dedup, flatten, getBounds, join, meshopt, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const input = process.argv[2];
if (!input) throw new Error('Usage: npm run optimize:atlas -- assets/cern_atlas_detector.zip [output.glb]');
const output = resolve(process.argv[3] ?? 'public/assets/models/atlas.glb');
if (!output.endsWith('.glb')) throw new Error('The output must have a .glb extension.');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const sourceBytes = await readFile(input);
let inputPath = resolve(input);
let extractedBytes = sourceBytes.length;
let temp;
if (input.toLowerCase().endsWith('.zip')) {
  temp = await mkdtemp(resolve(tmpdir(), 'portfolio-atlas-'));
  const files = unzipSync(sourceBytes);
  extractedBytes = Object.values(files).reduce((sum, bytes) => sum + bytes.length, 0);
  const gltfFiles = Object.keys(files).filter(name => name.endsWith('.gltf') || name.endsWith('.glb'));
  if (gltfFiles.length !== 1) throw new Error('Expected one glTF or GLB in the source archive.');
  for (const [name, bytes] of Object.entries(files)) {
    const target = resolve(temp, name);
    if (relative(temp, target).startsWith('..') || name.startsWith('/')) throw new Error('Invalid archive path.');
    if (name.endsWith('/')) continue;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  inputPath = resolve(temp, gltfFiles[0]);
}
let document;
try { document = await io.read(inputPath); }
finally { if (temp) await rm(temp, { recursive: true, force: true }); }
const root = document.getRoot();
if (root.listAnimations().length || root.listSkins().length) throw new Error('Expected the static ATLAS detector model.');
const scene = root.getDefaultScene() ?? root.listScenes()[0];
if (!scene) throw new Error('The model has no scene.');
root.setDefaultScene(scene);

function triangleCount() {
  let count = 0;
  scene.traverse(node => {
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      if (primitive.getMode() !== 4) throw new Error('Expected triangle geometry.');
      count += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
    }
  });
  return count;
}

const sourceTriangles = triangleCount();
const sourceBounds = getBounds(scene);
const longest = Math.max(...sourceBounds.max.map((value, axis) => value - sourceBounds.min[axis]));
if (!Number.isFinite(longest) || longest <= 0) throw new Error('Invalid ATLAS bounds.');
const scale = 4.6 / longest;
const wrapper = document.createNode('ATLAS display scale').setScale([scale, scale, scale]);
for (const child of scene.listChildren()) wrapper.addChild(child);
scene.addChild(wrapper);
await document.transform(
  center(), flatten(), dedup(), join(), weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.25, error: 0.001 }),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 14, quantizeNormal: 10 }),
);
const attribution = 'CERN ATLAS Detector by physics.atlas.vr; CC BY 4.0. Adapted, simplified, centered, and Meshopt-compressed.';
root.getAsset().copyright = attribution;
scene.setName('CERN ATLAS Detector');
scene.setExtras({ source: 'https://sketchfab.com/3d-models/cern-atlas-detector-c3761776d4f94b3eb77336896da2a3bd', license: 'https://creativecommons.org/licenses/by/4.0/', attribution });
await mkdir(dirname(output), { recursive: true });
await io.write(output, document);
const bytes = await readFile(output);
const metadata = {
  name: 'CERN ATLAS Detector', author: 'physics.atlas.vr',
  source: scene.getExtras().source, license: 'CC-BY-4.0',
  sourceFile: input.split(/[\\/]/).at(-1),
  sourceFileSha256: createHash('sha256').update(sourceBytes).digest('hex'),
  sourceFileBytes: sourceBytes.length, extractedBytes,
  sourceTriangles, triangles: triangleCount(),
  bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  bounds: getBounds(scene),
  optimization: { ratio: 0.25, maximumRelativeError: 0.001, compression: 'EXT_meshopt_compression', quantizePosition: 14 },
};
await writeFile(output.replace(/\.glb$/, '.meta.json'), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(JSON.stringify(metadata, null, 2));
