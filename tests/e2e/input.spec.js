import { test, expect } from '@playwright/test';
import { ready, shot } from './flight.helpers.js';

test('rapid retargeting reaches the last requested station', async ({ page }) => {
  await ready(page);
  for (const name of ['Architecture', 'Edge Intelligence', 'Instrumentation']) {
    await page.getByRole('button', { name, exact: true }).click();
  }
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', '0.43000');
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'instrumentation');
});

test('repeated dialog dismissal resumes native keyboard commands and effective progress', async ({ page }) => {
  await ready(page);
  for (let repeat = 0; repeat < 3; repeat++) {
    await page.getByRole('button', { name: 'View details' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    if (repeat % 2) await page.getByRole('button', { name: 'Close details' }).click();
    else await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'View details' })).toBeFocused();
    const { before, range } = await page.evaluate(() => {
      const area = document.querySelector('[aria-label="Portfolio flight scroll area"]');
      return { before: area.scrollTop, range: area.scrollHeight - area.clientHeight };
    });
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => page.evaluate(() => document.querySelector('[aria-label="Portfolio flight scroll area"]').scrollTop)).toBeCloseTo(before + range * 0.04, 0);
    await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeGreaterThan(0.01);
    await page.keyboard.press('Home');
    await expect(page.locator('.experience')).toHaveAttribute('data-offset', '0.00000');
  }
});

test('line and page wheel units, zoom preservation, and resize retain native scroll ownership', async ({ page }) => {
  await ready(page);
  await shot(page, 1);
  const area = page.getByLabel('Portfolio flight scroll area');
  const card = page.locator('.station-card');
  const before = await area.evaluate(el => el.scrollTop);
  await card.dispatchEvent('wheel', { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true });
  await expect.poll(() => area.evaluate(el => el.scrollTop)).toBe(before + 48);
  const pageHeight = await area.evaluate(el => el.clientHeight);
  await card.dispatchEvent('wheel', { deltaY: 1, deltaMode: 2, bubbles: true, cancelable: true });
  await expect.poll(() => area.evaluate(el => el.scrollTop)).toBe(before + 48 + pageHeight);
  const zoom = await card.evaluate(el => {
    const event = new WheelEvent('wheel', { deltaY: 100, ctrlKey: true, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(zoom).toBe(false);
  expect(await area.evaluate(el => el.scrollTop)).toBe(before + 48 + pageHeight);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press('Home');
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', '0.00000');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
