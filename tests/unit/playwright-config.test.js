import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

function readConfig(baseURL) {
  const env = { ...process.env };
  delete env.PLAYWRIGHT_BASE_URL;
  if (baseURL) env.PLAYWRIGHT_BASE_URL = baseURL;
  const configURL = new URL('../../playwright.config.js', import.meta.url).href;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
    const { default: config } = await import(${JSON.stringify(configURL)});
    console.log(JSON.stringify({ baseURL: config.use.baseURL, webServer: config.webServer ?? null }));
  `], { env, encoding: 'utf8' });
  return JSON.parse(output);
}

test('public-site validation uses the requested URL without starting a local server', () => {
  const config = readConfig('https://example.test/portfolio/');
  assert.equal(config.baseURL, 'https://example.test/portfolio/');
  assert.equal(config.webServer, null);
});

test('local validation retains the production preview server', () => {
  const config = readConfig();
  assert.equal(config.baseURL, 'http://127.0.0.1:4173/portfolio/');
  assert.equal(config.webServer.command, 'npm run preview');
});
