import { test, expect } from '@playwright/test';
import { ready, shot, shots } from './flight.helpers.js';
import { startRecording } from './recording.helpers.js';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

test.use({ video: process.env.CI ? { mode: 'on', size: { width: 1440, height: 900 } } : 'off' });
test.setTimeout(process.env.CI ? 1800000 : 60000);

const evidenceRoot = fileURLToPath(new URL(`../../.superpowers/artifacts/cinematic-${process.env.PLAYWRIGHT_BASE_URL ? 'live' : 'preview'}/`, import.meta.url));

for (const [direction, indices] of [['forward', shots.map((_, i) => i)], ['reverse', shots.map((_, i) => i).reverse()]]) {
 test(`record the six-station ${direction} macro tour`, async ({ page }, testInfo) => {
  await ready(page);
  const save = await startRecording(page);
  for (const index of indices) {
    await shot(page, index);
    // Station tests save full-resolution stills; video captures each composition here.
    // Composition holds are intentional timing in the motion evidence, not readiness waits.
    await page.evaluate(() => new Promise((resolve) => {
      const start = performance.now();
      function tick(time) { time - start >= 1000 ? resolve() : requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    }));
  }
  await save(join(evidenceRoot, `${testInfo.project.name}-${direction}-tour.webm`), testInfo, `${direction}-tour`);
 });
}

test('wheel reversals and dialog pause retain an in-progress scroll position', async ({ page }, testInfo) => {
  await ready(page);
  const save = await startRecording(page);
  await page.mouse.move(700, 220);
  await page.mouse.wheel(0, 2500);
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeGreaterThan(0.15);
  await page.mouse.wheel(0, -2000);
  await shot(page, 2);
  // Open the dialog on the first moving frame. Separate browser commands can
  // take longer than the whole flight on a software renderer.
  await page.evaluate(() => {
    const experience = document.querySelector('.experience');
    const area = document.querySelector('[aria-label="Portfolio flight scroll area"]');
    const button = document.querySelector('.details-button');
    const start = Number(experience.dataset.offset);
    function interrupt() {
      const target = area.scrollTop / (area.scrollHeight - area.clientHeight);
      const offset = Number(experience.dataset.offset);
      if (target > start + 0.05 && offset > start && offset < target) {
        experience.dataset.interruptionStart = String(start);
        experience.dataset.interruptionTarget = String(target);
        button.click();
        return;
      }
      requestAnimationFrame(interrupt);
    }
    requestAnimationFrame(interrupt);
  });
  await page.mouse.move(700, 220);
  await page.mouse.wheel(0, 1800);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const experience = page.locator('.experience');
  const start = Number(await experience.getAttribute('data-interruption-start'));
  const target = Number(await experience.getAttribute('data-interruption-target'));
  const frozen = Number(await experience.getAttribute('data-offset'));
  expect(frozen).toBeGreaterThan(start);
  expect(frozen).toBeLessThan(target);
  const nativeTop = await page.getByLabel('Portfolio flight scroll area').evaluate((element) => element.scrollTop);
  await dialog.evaluate((element) => { element.style.maxHeight = '260px'; });
  await dialog.hover();
  await page.mouse.wheel(0, 500);
  await page.keyboard.press('PageDown');
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.getByLabel('Portfolio flight scroll area').evaluate((element) => element.scrollTop)).toBe(nativeTop);
  expect(Number(await page.locator('.experience').getAttribute('data-offset'))).toBe(frozen);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'View details' })).toBeFocused();
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeCloseTo(frozen, 3);
  const { top, range } = await page.evaluate(() => {
    const area = document.querySelector('[aria-label="Portfolio flight scroll area"]');
    return { top: area.scrollTop, range: area.scrollHeight - area.clientHeight };
  });
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => page.evaluate(() => document.querySelector('[aria-label="Portfolio flight scroll area"]').scrollTop)).toBeCloseTo(top + range * 0.04, 0);
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeGreaterThan(frozen + 0.01);
  await save(join(evidenceRoot, `${testInfo.project.name}-interruption.webm`), testInfo, 'interruption');
});
