import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { stations } from '../../src/config/stations.js';
import { resolveTimeline } from '../../src/scroll/timeline.js';
import { boardExtent } from '../../src/components/3D/boardExtent.js';

// A finite small board or a fit-to-board overview would expose an edge in these views.
for (const [width, height] of [[1440, 900], [2560, 1080], [390, 844]]) {
  test(`PCB extends beyond every camera-frustum corner at ${width}x${height}`, () => {
    const extent = boardExtent(width, height);
    assert.ok(extent.width >= 32 && extent.depth >= 24);
    const camera = new PerspectiveCamera(35, width / height, 0.01, 200);
    camera.setViewOffset(width, height, width >= 900 ? width * 0.17 : 0, 0, width, height);
    for (let step = 0; step <= 400; step++) {
      const pose = resolveTimeline(step / 400, stations);
      if (pose.scene !== 'pcb') continue;
      camera.position.set(...pose.position);
      camera.lookAt(new Vector3(...pose.target));
      camera.updateMatrixWorld();
      for (const x of [-1, 1]) for (const y of [-1, 1]) {
        const ray = new Vector3(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
        assert.ok(ray.y < 0);
        const point = camera.position.clone().addScaledVector(ray, -camera.position.y / ray.y);
        assert.ok(Math.abs(point.x) < extent.width / 2 - 0.5, `board X edge at offset ${step / 400}`);
        assert.ok(Math.abs(point.z + 0.3) < extent.depth / 2 - 0.5, `board Z edge at offset ${step / 400}`);
      }
    }
  });
}
