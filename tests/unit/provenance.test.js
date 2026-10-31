import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('crystal provenance explicitly identifies absent source attribution records', () => {
  const credits = readFileSync(new URL('../../public/assets/ASSET_CREDITS.md', import.meta.url), 'utf8');
  assert.match(credits, /crystal[^\n]*no embedded copyright or license header/i);
  assert.match(credits, /no upstream credit record/i);
  assert.match(credits, /repository license/i);
});
