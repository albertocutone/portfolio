import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submitMessage, validateContactEndpoint } from '../../src/contact/submitMessage.js';

test('contact configuration accepts an opaque HTTPS URL and rejects exposed recipient details', () => {
  assert.equal(validateContactEndpoint(''), '');
  assert.equal(validateContactEndpoint('https://formspree.io/f/example'), 'https://formspree.io/f/example');
  for (const endpoint of ['mailto:recipient@example.invalid', 'https://formsubmit.co/recipient@example.invalid', 'https://formsubmit.co/recipient%40example.invalid', 'http://example.invalid/form']) {
    assert.throws(() => validateContactEndpoint(endpoint), /opaque HTTPS/);
  }
});

test('contact submits only visitor data and accepts an explicit delivery confirmation', async () => {
  const values = { name: 'Visitor', email: 'visitor@example.invalid', message: 'Project inquiry' };
  let sent;
  await submitMessage('https://formspree.io/f/example', values, {
    fetchImpl: async (url, request) => {
      sent = { url, request };
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });
  assert.deepEqual(JSON.parse(sent.request.body), values);
  assert.equal(sent.request.method, 'POST');
  assert.equal(sent.request.credentials, 'omit');
});

test('contact never reports success for missing configuration, rejection, or an unconfirmed response', async () => {
  await assert.rejects(submitMessage('', {}), /not configured/);
  for (const response of [
    { ok: false, json: async () => ({ ok: false }) },
    { ok: true, json: async () => ({ errors: ['Rejected'] }) },
  ]) await assert.rejects(submitMessage('https://formspree.io/f/example', {}, { fetchImpl: async () => response }), /Submission failed/);
});
