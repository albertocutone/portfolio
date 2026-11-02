import { test, expect } from '@playwright/test';
import { stations } from '../../src/config/stations.js';
import { stationLanding } from '../../src/config/motion.js';

const stationIndex = id => stations.findIndex(station => station.id === id);
async function navigate(page, id) {
  await page.getByRole('navigation', { name: 'Station navigation' }).getByRole('button', { name: stations[stationIndex(id)].label, exact: true }).click();
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', id);
  await expect(page.locator('.station-card')).toHaveCSS('opacity', '1');
}

test('intro opens, education shows the Colosseum, CERN and Meta link their work, and recap closes the CV', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('./');
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'intro');
  await expect(page.locator('h1')).toContainText('Software for');
  await expect(page.getByRole('navigation', { name: 'Station navigation' }).getByRole('button')).toHaveCount(stations.length);
  await page.screenshot({ path: testInfo.outputPath('intro.png') });
  await page.getByRole('button', { name: 'Start my CV' }).click();
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'education');
  await expect(page.locator('.station-card')).toHaveCSS('opacity', '1');
  await expect(page.locator('.station-card')).toHaveAttribute('data-pose', 'colosseum');
  await expect(page.locator('.degree-preview')).toHaveCount(2);
  await expect(page.locator('.model-credit')).toContainText('Brian Trepanier');
  await expect(page.getByRole('link', { name: 'Creative Commons Attribution 4.0' })).toHaveAttribute('href', 'http://creativecommons.org/licenses/by/4.0/');
  await page.screenshot({ path: testInfo.outputPath('education-colosseum.png') });
  const details = page.getByRole('button', { name: 'View details' });
  await details.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName('Education');
  await expect(dialog).toContainText('Master in Electronic Engineering');
  await expect(dialog).toContainText('Bachelor in Biomedical Engineering');
  await expect(dialog).toContainText('Policlinico Umberto I');
  await expect(dialog).toContainText('Internship at CERN');
  await expect(dialog).toContainText('Brian Trepanier');
  await dialog.locator('.project').filter({ has: page.getByRole('heading', { name: 'Bachelor in Biomedical Engineering' }) }).getByRole('button', { name: 'Explore the thesis' }).click();
  await expect(dialog.getByRole('article', { name: 'Cardiac MRI Mapping project' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(details).toBeFocused();

  await navigate(page, 'cern');
  await expect(page.locator('.experience-preview')).toContainText('Mar 2018');
  await expect(page.locator('.station-projects')).toContainText('Cryo-Submarine');
  await expect(page.getByRole('link', { name: 'ATLAS model: physics.atlas.vr' })).toBeVisible();
  await page.locator('.station-projects').getByRole('button', { name: /Cryo-Submarine/ }).click();
  await expect(dialog.getByRole('article', { name: 'Cryo-Submarine project' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.screenshot({ path: testInfo.outputPath('cern.png') });

  const area = page.getByLabel('Portfolio flight scroll area');
  const targetOffset = stationLanding(stations, stationIndex('meta'));
  const scrollPixels = await area.evaluate((el, target) => (el.scrollHeight - el.clientHeight) * target - el.scrollTop, targetOffset);
  await page.locator('.station-card').dispatchEvent('wheel', { deltaY: scrollPixels, deltaMode: 0, bubbles: true, cancelable: true });
  const nativeOffset = await area.evaluate(el => el.scrollTop / (el.scrollHeight - el.clientHeight));
  expect(nativeOffset).toBeCloseTo(targetOffset, 3);
  await expect(page.locator('.experience')).toHaveAttribute('data-offset', nativeOffset.toFixed(5));
  await expect(page.locator('.station-card')).toHaveAttribute('data-station', 'meta');
  await expect(page.locator('.station-card')).toHaveCSS('opacity', '1');
  await expect(page.locator('.station-card')).toHaveAttribute('data-pose', 'meta');
  await expect(page.locator('.model-credit')).toContainText('Quest 3');
  await page.screenshot({ path: testInfo.outputPath('meta-quest3.png') });
  await expect(page.locator('.experience-preview')).toContainText('Qualitest');
  await expect(page.locator('.station-project')).toHaveCount(3);
  await expect(page.locator('.scene-transition')).toHaveCSS('opacity', '0');
  await navigate(page, 'recap');
  await expect(page.locator('.recap-facts')).toContainText('10');
  await expect(page.locator('.station-launchpad')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('recap.png') });
  expect(errors).toEqual([]);
});
