import { test, expect } from '@playwright/test';

test('ATLAS opens the scene, scroll reaches the PCB, and navigation reaches architecture', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toBeVisible();
  const rendering = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return { renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), hostDpr: devicePixelRatio, canvasSize: [canvas.width, canvas.height] };
  });
  await testInfo.attach('rendering-context', { body: JSON.stringify(rendering), contentType: 'application/json' });
  console.log('Published rendering context:', JSON.stringify(rendering));
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'atlas');
  await expect(page.getByRole('link', { name: /ATLAS model: physics.atlas.vr/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('atlas.png') });
  const scrollPixels = await page.getByLabel('Portfolio flight scroll area').evaluate(el => (el.scrollHeight - el.clientHeight) * 0.23);
  await page.locator('.station-card').dispatchEvent('wheel', { deltaY: scrollPixels, deltaMode: 0, bubbles: true, cancelable: true });
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', '0.23000');
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'sensor');
  await expect(page.locator('.station-card')).toHaveCSS('opacity', '1');
  await expect(page.locator('.scene-transition')).toHaveCSS('opacity', '0');
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
