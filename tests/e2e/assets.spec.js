import { test, expect } from '@playwright/test';

test('real component geometry and studio lighting load from the same deployed origin', async ({ page }) => {
  const models = new Set();
  let studio = false;
  let atlas = false;
  let colosseum = false;
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.endsWith('.wrl') && response.ok()) models.add(url.pathname);
    if (url.pathname.endsWith('/environment/studio.hdr') && response.ok()) studio = true;
    if (url.pathname.endsWith('/models/atlas.glb') && response.ok()) atlas = true;
    if (url.pathname.endsWith('/models/colosseum.glb') && response.ok()) colosseum = true;
  });
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => models.size).toBe(9);
  expect(studio).toBe(true);
  expect(atlas).toBe(true);
  expect(colosseum).toBe(true);
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('missing Colosseum geometry does not report a ready 3D scene', async ({ page }) => {
  await page.route('**/assets/models/colosseum.glb', route => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('Scene assets could not be loaded');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'false');
});

test('missing ATLAS geometry does not report a ready 3D scene', async ({ page }) => {
  await page.route('**/assets/models/atlas.glb', route => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('Scene assets could not be loaded');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'false');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('a temporary component HTTP 503 recovers before scene readiness', async ({ page }) => {
  let attempts = 0;
  await page.route('**/assets/models/ceramic.wrl', route => ++attempts === 1
    ? route.fulfill({ status: 503, body: 'Temporarily unavailable' })
    : route.continue());
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
  expect(attempts).toBe(2);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('the scene retry control remains usable above the narrow-screen narrative', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/assets/models/lqfp.wrl', route => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Retry scene' });
  await expect(retry).toBeInViewport();
  await retry.click({ trial: true });
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
