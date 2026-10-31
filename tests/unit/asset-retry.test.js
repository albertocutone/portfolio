import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RetryingVRMLLoader } from '../../src/components/3D/RetryingVRMLLoader.js';

function respond(text, status) {
  const response = new Response(text, { status });
  // Node has no browser ProgressEvent. Exercise FileLoader's non-streaming path.
  Object.defineProperty(response, 'body', { value: undefined });
  return response;
}

test('a temporary HTTP 503 recovers and parses the actual VRML model', async (t) => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => ++requests === 1
    ? respond('Unavailable', 503)
    : respond('#VRML V2.0 utf8\nGroup { children [] }', 200));
  const model = await new RetryingVRMLLoader().loadAsync('https://example.test/recover.wrl');
  assert.equal(model.isObject3D, true);
  assert.equal(requests, 2);
});

test('persistent server failures stop after two retries and retain the HTTP error', async (t) => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return respond('Unavailable', 503); });
  await assert.rejects(new RetryingVRMLLoader().loadAsync('https://example.test/unavailable.wrl'), error => error.response.status === 503);
  assert.equal(requests, 3);
});

test('a missing model fails immediately without retrying its HTTP 404', async (t) => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return respond('Missing', 404); });
  await assert.rejects(new RetryingVRMLLoader().loadAsync('https://example.test/missing.wrl'), error => error.response.status === 404);
  assert.equal(requests, 1);
});
