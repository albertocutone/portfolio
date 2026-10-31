import { expect } from '@playwright/test';
import { stations } from '../../src/config/stations.js';
import { stationLanding } from '../../src/config/motion.js';

export const shots = stations.map((station, index) => [station.label, stationLanding(stations, index).toFixed(5)]);

export async function ready(page) {
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
}

export async function shot(page, index) {
  await page.getByRole('button', { name: shots[index][0], exact: true }).click();
  // Drei settles at 1e-5; the published offset rounds to five decimal places.
  await page.waitForFunction((target) => Math.abs(Number(document.querySelector('.experience').dataset.offset) - target) <= 0.000015, Number(shots[index][1]), { polling: 'raf', timeout: process.env.CI ? 600000 : 15000 });
  await expect(page.locator('.station-card')).toHaveCSS('opacity', '1');
}

export async function readFrames(page, action) {
  await page.evaluate(() => {
    const capture = { running: true, times: [] };
    window.__filmFrames = capture;
    function tick(time) {
      if (!capture.running) return;
      capture.times.push(time);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  try { await action(); }
  finally { await page.evaluate(() => { window.__filmFrames.running = false; }); }
  return page.evaluate(() => window.__filmFrames.times);
}
