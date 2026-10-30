import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTimeline, clampOffset } from '../../src/scroll/timeline.js';
import { createScrollStore } from '../../src/scroll/store.js';

const stations = [0, 1, 2, 3].map((id) => ({
  id: String(id), scrollRange: [id / 4, (id + 1) / 4],
  camera: [id * 10, 2, 3], target: [id, 0, 0], anchor: [id, 0, 0],
}));

test('invalid and out-of-range offsets are normalized', () => {
  for (const [value, expected] of [[-1, 0], [2, 1], [NaN, 0], [Infinity, 1], [-Infinity, 0]]) {
    assert.equal(clampOffset(value), expected);
  }
});

test('holds first waypoint and starts with readable card', () => {
  assert.deepEqual(resolveTimeline(0, stations).position, [0, 2, 3]);
  assert.equal(resolveTimeline(0, stations).cardOpacity, 1);
  assert.deepEqual(resolveTimeline(0.175, stations).position, [0, 2, 3]);
});

test('smoothstep travel reaches the next waypoint continuously', () => {
  const mid = resolveTimeline(0.2125, stations);
  assert.ok(Math.abs(mid.position[0] - 5) < 1e-8);
  assert.ok(Math.abs(mid.target[0] - 0.5) < 1e-8);
  assert.ok(Math.abs(mid.focus[0] - 0.5) < 1e-8);
  assert.equal(mid.cardOpacity, 0);
  assert.ok(Math.abs(resolveTimeline(0.25 - 1e-9, stations).position[0] - 10) < 1e-7);
});

test('station boundaries fade arrivals and final offset holds overview', () => {
  for (const [offset, id] of [[0.25, '1'], [0.5, '2'], [0.75, '3'], [1, '3']]) {
    assert.equal(resolveTimeline(offset, stations).station.id, id);
  }
  assert.equal(resolveTimeline(0.25, stations).cardOpacity, 0);
  assert.ok(Math.abs(resolveTimeline(0.26, stations).cardOpacity - 0.5) < 1e-8);
  assert.equal(resolveTimeline(1, stations).cardOpacity, 1);
  assert.deepEqual(resolveTimeline(1, stations).position, [30, 2, 3]);
});

test('reverse traversal resolves identically with no history-dependent state', () => {
  const offsets = [0, 0.18, 0.23, 0.25, 0.27, 0.49, 0.5, 0.75, 1];
  const forward = offsets.map((value) => resolveTimeline(value, stations));
  const reverse = [...offsets].reverse().map((value) => resolveTimeline(value, stations)).reverse();
  assert.deepEqual(reverse, forward);
});

test('scroll store notifies changes once, clamps seeks, and disconnects cleanly', () => {
  const store = createScrollStore();
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  store.publish(0.4);
  store.publish(0.4);
  assert.equal(store.getSnapshot(), 0.4);
  assert.equal(notifications, 1);
  const sought = [];
  const disconnect = store.connect((offset) => sought.push(offset));
  store.seek(5);
  store.seek(-2);
  assert.deepEqual(sought, [1, 0]);
  disconnect();
  store.seek(0.7);
  assert.deepEqual(sought, [1, 0]);
  unsubscribe();
  store.publish(0.8);
  assert.equal(notifications, 1);
});
