import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placements, routes, surroundingRoutes } from '../../src/config/boardLayout.js';

test('board population uses differentiated real assets within the substrate footprint', () => {
  for (const type of ['lqfp', 'soic', 'capacitor', 'ceramic', 'resistor', 'inductor', 'crystal', 'usb', 'header']) {
    assert.ok(placements.some((item) => item.type === type), `missing ${type} from the physical board`);
  }
  for (const item of placements) {
    assert.ok(item.x >= -16 && item.x <= 16);
    assert.ok(item.z >= -12.3 && item.z <= 11.7);
    assert.ok(Number.isFinite(item.rotation));
  }
});

test('visible copper routing stays on the board and includes diagonal transitions', () => {
  assert.ok(routes.length > 10);
  let diagonal = false;
  for (const points of routes) {
    for (const [x, z] of points) assert.ok(x >= -16 && x <= 16 && z >= -12.3 && z <= 11.7);
    for (let i = 1; i < points.length; i++) {
      if (points[i][0] !== points[i - 1][0] && points[i][1] !== points[i - 1][1]) diagonal = true;
    }
  }
  assert.equal(diagonal, true);
});

test('surrounding circuitry extends well beyond the original hero board without scaling components', () => {
  const outside = placements.filter((item) => Math.abs(item.x) > 3 || Math.abs(item.z) > 3);
  assert.ok(outside.length > 80);
  assert.ok(new Set(outside.map((item) => item.type)).size >= 4);
  assert.ok(placements.some((item) => item.type === 'lqfp' && item.x === 0 && item.z === 0));
  assert.ok(placements.some((item) => item.type === 'lqfp' && item.x === 1.2 && item.z === -1.1));
});

test('surrounding signal traces terminate on real passive-component contacts', () => {
  const contacts = placements.filter((part) => ['resistor', 'ceramic'].includes(part.type)).flatMap((part) => [-1, 1].map((side) => [part.x + Math.cos(part.rotation) * side * 0.067, part.z - Math.sin(part.rotation) * side * 0.067]));
  const connected = surroundingRoutes.filter((path) => contacts.some((contact) => Math.hypot(path.at(-1)[0] - contact[0], path.at(-1)[1] - contact[1]) < 1e-6));
  assert.ok(connected.length >= 64);
});
