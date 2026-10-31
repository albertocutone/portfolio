import { PerspectiveCamera, Vector3 } from 'three';
import { stations } from '../../config/stations.js';
import { cameraProjection } from '../../config/motion.js';
import { resolveTimeline } from '../../scroll/timeline.js';

export function boardExtent(width, height) {
  const camera = new PerspectiveCamera(cameraProjection.fov, width / height, cameraProjection.near, cameraProjection.far);
  camera.setViewOffset(width, height, width >= 900 ? width * cameraProjection.desktopOffset : 0, 0, width, height);
  const ray = new Vector3();
  const target = new Vector3();
  let halfWidth = 16;
  let halfDepth = 12;
  // Bound the full authored tour, not just the current pose, so the PCB never expands mid-flight.
  for (let step = 0; step <= 1024; step++) {
    const pose = resolveTimeline(step / 1024, stations);
    camera.position.set(...pose.position);
    target.set(...pose.target);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      ray.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
      if (ray.y >= 0) throw new Error('PCB camera must look below the horizon');
      const distance = -camera.position.y / ray.y;
      halfWidth = Math.max(halfWidth, Math.abs(camera.position.x + ray.x * distance) + 1);
      halfDepth = Math.max(halfDepth, Math.abs(camera.position.z + ray.z * distance + 0.3) + 1);
    }
  }
  return { width: halfWidth * 2, depth: halfDepth * 2 };
}
