import { Matrix4, MeshStandardMaterial, Quaternion, Vector3, Euler } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const materials = new Map();

function surfaceMaterial(color, kind) {
  const hex = color.getHexString();
  const key = `${kind}:${hex}`;
  if (materials.has(key)) return materials.get(key);
  let tint = color.clone();
  let metalness = 0;
  let roughness = 0.48;
  if (hex === 'd2d1c7') { tint.set('#c4c9c8'); metalness = 0.94; roughness = kind === 'crystal' ? 0.36 : 0.25; }
  else if (hex === 'dbbc7e') { tint.set('#c7aa65'); metalness = 0.9; roughness = 0.24; }
  else if (hex === '262525' || hex === '151618') { tint.set('#161b1b'); roughness = 0.48; }
  else if (hex === '2367b9') { tint.set('#163949'); roughness = 0.34; }
  else if (hex === 'b34515') { tint.set('#9c633e'); metalness = 0.85; roughness = 0.32; }
  else if (hex === '464646') { tint.set('#292e2b'); roughness = 0.7; }
  const material = new MeshStandardMaterial({ color: tint, metalness, roughness, envMapIntensity: 0.9 });
  material.name = key;
  if (metalness < 0.4) {
    // CAD meshes have no UVs; subtle molded surface grain uses object-space coordinates.
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrainPosition;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrainPosition = position;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrainPosition;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float grain = fract(sin(dot(vGrainPosition, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        roughnessFactor = clamp(roughnessFactor + (grain - 0.5) * 0.055, 0.0, 1.0);
      `);
    };
    material.customProgramCacheKey = () => 'molded-grain-v1';
  }
  materials.set(key, material);
  return material;
}

export function prepareComponent(scene, spec) {
  scene.updateMatrixWorld(true);
  const scale = spec.unitMm / 10;
  const [cx, cy] = spec.centerMm ?? [0, 0];
  const transform = new Matrix4().compose(
    new Vector3(-cx / 10, (spec.seatOffsetMm ?? 0) / 10, cy / 10),
    new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)),
    new Vector3(scale, scale, scale),
  );
  const groups = new Map();
  scene.traverse((node) => {
    if (!node.isMesh) return;
    const material = surfaceMaterial(node.material.color, spec.kind);
    const geometry = node.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(transform, node.matrixWorld));
    const vertices = geometry.index ? geometry.toNonIndexed() : geometry;
    if (geometry !== vertices) geometry.dispose();
    if (!groups.has(material)) groups.set(material, []);
    groups.get(material).push(vertices);
  });
  return [...groups].map(([material, geometries]) => {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((part) => part.dispose());
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return { geometry, material };
  });
}
