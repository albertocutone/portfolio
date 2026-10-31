import { test, expect } from '@playwright/test';
import { motion } from '../../src/config/motion.js';
import { ready } from './flight.helpers.js';

test('navigation motion is slow and bounded without jumping between shots', async ({ page }, testInfo) => {
  await ready(page);
  await page.evaluate(() => {
    const capture = { running: true, frames: [] };
    window.__motionCapture = capture;
    function frame(time) {
      if (!capture.running) return;
      capture.frames.push([time, Number(document.querySelector('.experience').dataset.offset)]);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  await page.getByRole('button', { name: 'Architecture', exact: true }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', '0.78750');
  const frames = await page.evaluate(() => { window.__motionCapture.running = false; return window.__motionCapture.frames; });
  const windows = [];
  for (let i = 1; i < frames.length; i++) {
    const dt = (frames[i][0] - frames[i - 1][0]) / 1000;
    const change = Math.abs(frames[i][1] - frames[i - 1][1]);
    expect(dt).toBeGreaterThan(0);
    // DOM observations and R3F clock updates can straddle a display frame.
    expect(change).toBeLessThanOrEqual(motion.maxSpeed * (dt + 1 / 60) + 0.00002);
    let start = i - 1;
    while (start > 0 && frames[i][0] - frames[start][0] < 200) start--;
    const span = (frames[i][0] - frames[start][0]) / 1000;
    if (span >= 0.2) windows.push(Math.abs(frames[i][1] - frames[start][1]) / span);
  }
  await testInfo.attach('navigation-timing', { body: JSON.stringify({ frames, maxWindowSpeed: Math.max(...windows) }), contentType: 'application/json' });
  expect(windows.length).toBeGreaterThan(0);
  expect(Math.max(...windows)).toBeLessThanOrEqual(motion.maxSpeed * 1.15);
  expect(frames.at(-1)[0] - frames[0][0]).toBeGreaterThan(7000);
});
