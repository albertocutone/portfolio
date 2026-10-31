import { test, expect } from '@playwright/test';

test('published 3D scene loads and navigation reaches a readable architecture shot', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('sensor.png') });
  await page.getByRole('button', { name: 'Architecture', exact: true }).click();
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'architecture');
  await expect(page.locator('.station-card')).toHaveCSS('opacity', '1');
  const area = page.getByLabel('Portfolio flight scroll area');
  const target = await area.evaluate(el => el.scrollTop / (el.scrollHeight - el.clientHeight));
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', target.toFixed(5));
  await expect(page.getByRole('button', { name: 'View details' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('architecture.png') });
  expect(errors).toEqual([]);
});
