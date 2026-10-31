import { expect } from '@playwright/test';

export const shots = [['Sensing', '0.00000'], ['Instrumentation', '0.28750'], ['Edge Intelligence', '0.53750'], ['Architecture', '0.78750']];

export async function ready(page) {
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
}

export async function shot(page, index) {
  await page.getByRole('button', { name: shots[index][0], exact: true }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', shots[index][1]);
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
