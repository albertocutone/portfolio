import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { center, dedup, flatten, meshopt, metalRough, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
});
const models = [];
for (const [archive, entry, file, size] of [
  ['meta_logo.zip', 'scene.gltf', 'meta-logo.glb', 3],
  ['meta-quest-3.zip', 'source/Quest3.glb', 'quest3.glb', 2.4],
  ['meta_vr_glasses.glb', null, 'meta-vr-glasses.glb', 1.7],
]) {
  const source = await readFile(new URL(`../assets/${archive}`, import.meta.url));
  const contents = entry ? unzipSync(source) : {};
  const document = !entry ? await io.readBinary(source) : entry.endsWith('.glb') ? await io.readBinary(contents[entry])
    : await io.readJSON({ json: JSON.parse(new TextDecoder().decode(contents[entry])), resources: contents });
  const root = document.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  if (!scene || root.listSkins().length) throw new Error(`Expected unskinned geometry: ${archive}`);
  root.setDefaultScene(scene);
  const { min, max } = getBounds(scene);
  console.log(`${archive} source bounds:`, { min, max });
  const scale = size / Math.max(...max.map((value, axis) => value - min[axis]));
  if (!Number.isFinite(scale) || scale <= 0) throw new Error(`Invalid bounds: ${archive}`);
  const wrapper = document.createNode('Display scale').setScale([scale, scale, scale]);
  for (const child of scene.listChildren()) wrapper.addChild(child);
  scene.addChild(wrapper);
  if (root.listTextures().length) document.createExtension(EXTTextureWebP).setRequired(true);
  for (const texture of root.listTextures()) {
    const image = await sharp(texture.getImage()).resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 }).toBuffer();
    texture.setImage(new Uint8Array(image)).setMimeType('image/webp');
  }
  // Convert legacy specular/glossiness materials for the current Three.js loader.
  // Preserve animated hierarchies and their original tracks.
  await document.transform(metalRough(), center(), ...(root.listAnimations().length ? [] : [flatten()]), dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  const bytes = await io.writeBinary(document);
  await writeFile(new URL(`../public/assets/models/${file}`, import.meta.url), bytes);
  const attribution = root.getAsset().extras ?? null;
  const credit = contents['license.txt'] ? new TextDecoder().decode(contents['license.txt'])
    : attribution?.license ? `"${attribution.title}" (${attribution.source}) by ${attribution.author}, licensed under ${attribution.license}.\nAdapted for display in this scene.\n` : null;
  if (credit) await writeFile(new URL(`../public/assets/models/${file.replace('.glb', '.LICENSE.txt')}`, import.meta.url), credit);
  models.push({ file, sourceFile: archive, sourceFileSha256: hash(source), bytes: bytes.length, sha256: hash(bytes),
    bounds: getBounds(scene), attribution,
    licenseNote: credit ? `Attribution retained in ${file.replace('.glb', '.LICENSE.txt')}.` : 'User-supplied model has no source attribution or license record.' });
  console.log(`${file}: ${bytes.length} bytes`);
}
await writeFile(new URL('../public/assets/models/meta.meta.json', import.meta.url), `${JSON.stringify({
  provenance: 'Models converted from the downloaded files in assets/.',
  adaptations: 'Original animation tracks preserved, centered, uniformly scaled, static models flattened, legacy materials converted to metallic/roughness, geometry Meshopt-compressed, and textures recompressed as WebP up to 2048px.',
  models,
}, null, 2)}\n`);
