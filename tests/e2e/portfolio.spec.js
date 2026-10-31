import { test, expect } from '@playwright/test';

const names = ['Sensing', 'Instrumentation', 'Edge Intelligence', 'Architecture'];
const ids = ['sensor', 'instrumentation', 'edge', 'architecture'];

async function ready(page) {
  await page.goto('./');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
}

async function station(page, index) {
  await page.getByRole('button', { name: names[index], exact: true }).click();
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', ids[index]);
  await expect(page.locator('.station-card')).toHaveCSS('opacity', '1');
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeCloseTo([0, 0.2875, 0.5375, 0.7875][index], 3);
  const nativeOffset = await page.getByLabel('Portfolio flight scroll area').evaluate((element) => element.scrollTop / (element.scrollHeight - element.clientHeight));
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', nativeOffset.toFixed(5));
}

for (const [index, direction] of [[0, 'initial'], [1, 'forward'], [2, 'forward'], [3, 'forward'], [2, 'reverse'], [1, 'reverse'], [0, 'reverse']]) {
 test(`production WebGL renders station ${index} during ${direction} navigation without asset or runtime errors`, async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', (request) => errors.push(`${request.url()} ${request.failure()?.errorText}`));
  await ready(page);
  if (direction === 'reverse') await station(page, index + 1);
  else if (index > 0) await station(page, index - 1);
  {
    await station(page, index);
    await expect(page.getByRole('button', { name: 'View details' })).toBeVisible();
    if (index === 0) await expect(page.locator('h1')).toContainText('From photons');
    await page.screenshot({ path: testInfo.outputPath(`station-${index}.png`) });
  }
  // Capture the scene-only region without element scrolling/stability checks.
  const image = await page.screenshot({ clip: { x: 80, y: 180, width: 700, height: 380 } });
  expect(image.byteLength).toBeGreaterThan(20000);
  await expect(page.getByRole('link', { name: /CV|Contact/i })).toHaveCount(0);
  expect(errors).toEqual([]);
 });
}

test('wheel over scene and card, keyboard, and exact endpoints control the same flight', async ({ page }, testInfo) => {
  if (process.env.CI) test.setTimeout(1200000);
  await ready(page);
  await page.mouse.move(750, 400);
  await page.mouse.wheel(0, 1200);
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeGreaterThan(0.25);
  await station(page, 1);
  const before = Number(await page.locator('.experience').getAttribute('data-offset'));
  await page.locator('.station-card').hover();
  await page.evaluate(() => document.addEventListener('wheel', (event) => { window.__lastWheelReceipt = { deltaY: event.deltaY, mode: event.deltaMode }; }, { capture: true, once: true }));
  await page.mouse.wheel(0, 140);
  const receipt = await page.evaluate(() => ({ ...window.__lastWheelReceipt, dpr: devicePixelRatio }));
  await testInfo.attach('wheel-receipt', { body: JSON.stringify(receipt), contentType: 'application/json' });
  console.log('Wheel receipt:', JSON.stringify(receipt));
  const range = await page.getByLabel('Portfolio flight scroll area').evaluate((element) => element.scrollHeight - element.clientHeight);
  expect(receipt.deltaY).toBeGreaterThan(0);
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeCloseTo(before + receipt.deltaY / range, 3);
  await page.keyboard.press('End');
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeCloseTo(1, 3);
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'architecture');
  await page.keyboard.press('Home');
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeCloseTo(0, 3);
  await page.keyboard.press('PageDown');
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeGreaterThan(0.2);
  await page.keyboard.press('PageUp');
  await expect.poll(async () => Number(await page.locator('.experience').getAttribute('data-offset'))).toBeCloseTo(0, 3);
});

test('details isolate scrolling, retain station, close with Escape and restore focus', async ({ page }) => {
  await ready(page);
  await station(page, 2);
  const before = await page.locator('.experience').getAttribute('data-offset');
  const trigger = page.getByRole('button', { name: 'View details' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName('Edge Platforms & PetLog');
  await dialog.evaluate((element) => { element.style.maxHeight = '260px'; });
  await dialog.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('PageDown');
  expect(await page.locator('.experience').getAttribute('data-offset')).toBe(before);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'edge');
  await trigger.click();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(trigger).toBeFocused();
});

test('narrow viewport preserves readable controls and the full 3D scene', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await station(page, 3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.getByRole('button', { name: 'View details' })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('narrow.png') });
});

test('records steady-state animation-frame performance', async ({ page }, testInfo) => {
  if (process.env.CI) test.setTimeout(1200000);
  await ready(page);
  await station(page, 3);
  const softwareRenderer = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  const sampleCount = process.env.CI && /SwiftShader|llvmpipe|Software/i.test(softwareRenderer) ? 13 : 121;
  const metrics = await page.evaluate(async (sampleCount) => {
    const times = [];
    await new Promise((resolve) => {
      function frame(time) {
        times.push(time);
        if (times.length === sampleCount) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    const intervals = times.slice(1).map((time, index) => time - times[index]);
    const mean = intervals.reduce((sum, time) => sum + time, 0) / intervals.length;
    const gl = document.querySelector('canvas').getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return { fps: 1000 / mean, meanFrameMs: mean, p95FrameMs: intervals.toSorted((a, b) => a - b)[Math.floor(intervals.length * 0.95)], sampleCount, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight] };
  }, sampleCount);
  await testInfo.attach('frame-performance', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  console.log('Frame performance:', JSON.stringify(metrics));
  expect(metrics.fps).toBeGreaterThan(0);
});
