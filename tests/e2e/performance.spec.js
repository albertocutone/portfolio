import { test, expect } from '@playwright/test';
import { ready, shot, readFrames } from './flight.helpers.js';

test('profile three warmed camera moves at the actual rendering resolution', async ({ page }, testInfo) => {
  if (process.env.CI) test.setTimeout(1200000);
  await ready(page);
  const capabilities = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return { renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), hostDpr: devicePixelRatio, canvasSize: [canvas.width, canvas.height] };
  });
  const expectedDpr = Math.min(capabilities.hostDpr, 1.5);
  expect(capabilities.canvasSize).toEqual([1440 * expectedDpr, 900 * expectedDpr]);
  if (process.env.CI && /SwiftShader|llvmpipe|Software/i.test(capabilities.renderer)) {
    await testInfo.attach('hardware-performance-unavailable', { body: JSON.stringify(capabilities), contentType: 'application/json' });
    test.skip(true, 'The three warmed 20 ms measurements require a hardware GPU; Pages uses software WebGL.');
  }
  await shot(page, 1);
  await shot(page, 0);
  const runs = [];
  for (const index of [3, 0, 3]) {
    const times = await readFrames(page, () => shot(page, index));
    const intervals = times.slice(1).map((time, i) => time - times[i]).sort((a, b) => a - b);
    expect(intervals.every((interval) => interval > 0), 'each animation frame must be sampled exactly once').toBe(true);
    const mean = intervals.reduce((sum, time) => sum + time, 0) / intervals.length;
    runs.push({ fps: 1000 / mean, p95Ms: intervals[Math.floor(intervals.length * 0.95)], framesOver50Ms: intervals.filter((time) => time > 50).length });
  }
  const renderer = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return { renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), hostDpr: devicePixelRatio, canvasSize: [canvas.width, canvas.height] };
  });
  const dpr = Math.min(renderer.hostDpr, 1.5);
  expect(renderer.canvasSize).toEqual([1440 * dpr, 900 * dpr]);
  const metrics = { ...renderer, runs };
  await testInfo.attach('moving-camera-performance', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  console.log('Moving-camera performance:', JSON.stringify(metrics));
  expect(runs.every((run) => run.p95Ms <= 20)).toBe(true);
});
