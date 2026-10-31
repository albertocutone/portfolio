import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { componentAssets, environmentAsset } from '../../src/config/componentAssets.js';

test('published component assets and studio environment match their qualified sources', async ({ request }) => {
  for (const asset of componentAssets) {
    const response = await request.get(asset.file);
    expect(response.ok(), asset.file).toBe(true);
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(asset.sha256);
  }
  const environment = await request.get(environmentAsset.file);
  expect(environment.ok()).toBe(true);
  expect(createHash('md5').update(await environment.body()).digest('hex')).toBe(environmentAsset.md5);
  for (const file of ['assets/ASSET_CREDITS.md', 'assets/models/LICENSE.md']) {
    expect((await request.get(file)).ok(), file).toBe(true);
  }
  if (process.env.EXPECTED_COMMIT_SHA) {
    const revision = await request.get('revision.json');
    expect(revision.ok()).toBe(true);
    expect((await revision.json()).commit).toBe(process.env.EXPECTED_COMMIT_SHA);
  }
});
