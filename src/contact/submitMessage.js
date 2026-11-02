export function validateContactEndpoint(value = '') {
  const endpoint = value.trim();
  if (!endpoint) return '';
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || /@|%40/i.test(endpoint) || url.username || url.password) throw new Error();
  } catch {
    throw new Error('Use an opaque HTTPS contact endpoint without recipient details.');
  }
  return endpoint;
}

export async function submitMessage(endpoint, values, { fetchImpl = globalThis.fetch, signal } = {}) {
  if (!validateContactEndpoint(endpoint)) throw new Error('Contact is not configured.');
  const response = await fetchImpl(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'omit', body: JSON.stringify(values), signal,
  });
  const result = await response.json();
  if (!response.ok || !(result?.ok === true || result?.success === true)) throw new Error('Submission failed.');
}
