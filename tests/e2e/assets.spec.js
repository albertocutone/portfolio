import { test, expect } from '@playwright/test';

test('real component geometry and studio lighting load from the same deployed origin', async ({ page }) => {
  const models = new Set();
  let studio = false;
  let atlas = false;
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.endsWith('.wrl') && response.ok()) models.add(url.pathname);
    if (url.pathname.endsWith('/environment/studio.hdr') && response.ok()) studio = true;
    if (url.pathname.endsWith('/models/atlas.glb') && response.ok()) atlas = true;
  });
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => models.size).toBe(9);
  expect(studio).toBe(true);
  expect(atlas).toBe(true);
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('missing ATLAS geometry does not report a ready 3D scene', async ({ page }) => {
  await page.route('**/assets/models/atlas.glb', route => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('Scene assets could not be loaded');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'false');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('missing required geometry does not report a ready 3D scene', async ({ page }) => {
  await page.route('**/assets/models/lqfp.wrl', (route) => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('Scene assets could not be loaded');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'false');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('missing studio lighting does not leave a ready scene or loading status', async ({ page }) => {
  await page.route('**/assets/environment/studio.hdr', route => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('Scene assets could not be loaded');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'false');
  await expect(page.getByRole('status')).toHaveCount(0);
});
