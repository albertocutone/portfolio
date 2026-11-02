import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTimeline, clampOffset } from '../../src/scroll/timeline.js';
import { createScrollStore } from '../../src/scroll/store.js';
import { stationLanding } from '../../src/config/motion.js';

const stations = [0, 1, 2, 3].map((id) => ({
  id: String(id), scrollRange: [id / 4, (id + 1) / 4],
  camera: [id * 10, 2, 3], target: [id, 0, 0], anchor: [id, 0, 0],
  cameraControls: [[id * 10 + 10 / 3, 2, 3], [id * 10 + 20 / 3, 2, 3]],
  focusRange: id === 3 ? 3 : 0.3, bokehScale: id === 3 ? 0.15 : 0.7,
}));

test('invalid and out-of-range offsets are normalized', () => {
  for (const [value, expected] of [[-1, 0], [2, 1], [NaN, 0], [Infinity, 1], [-Infinity, 0], [undefined, 0]]) assert.equal(clampOffset(value), expected);
});

test('initial reading composition holds only during the first 35 percent', () => {
  assert.deepEqual(resolveTimeline(0, stations).position, [0, 2, 3]);
  assert.equal(resolveTimeline(0, stations).cardOpacity, 1);
  assert.deepEqual(resolveTimeline(0.0875, stations).position, [0, 2, 3]);
  assert.ok(resolveTimeline(0.12, stations).position[0] > 0);
});

test('extended travel has independently derived midpoint and focus', () => {
  const mid = resolveTimeline(0.16875, stations);
  assert.ok(Math.abs(mid.position[0] - 5) < 1e-7);
  assert.ok(Math.abs(mid.target[0] - 0.5) < 1e-7);
  assert.ok(Math.abs(mid.focus[0] - 0.5) < 1e-7);
  assert.equal(mid.cardOpacity, 0);
});

test('authored controls produce curved travel instead of a straight-line cut', () => {
  const curved = [{ ...stations[0], cameraControls: [[0, 2, 5], [10, 2, 5]] }, ...stations.slice(1)];
  const midpoint = resolveTimeline(0.16875, curved).position;
  assert.ok(Math.abs(midpoint[0] - 5) < 1e-6);
  assert.ok(Math.abs(midpoint[2] - 4.5) < 1e-6);
});

test('camera, focus, and optical values join continuously with zero endpoint velocity', () => {
  const epsilon = 1e-5;
  for (const boundary of [0.0875, 0.25, 0.3375, 0.5, 0.5875, 0.75]) {
    const before = resolveTimeline(boundary - epsilon, stations);
    const after = resolveTimeline(boundary + epsilon, stations);
    for (const key of ['position', 'target', 'focus']) {
      for (let i = 0; i < 3; i++) assert.ok(Math.abs(after[key][i] - before[key][i]) / (2 * epsilon) < 0.001);
    }
    assert.ok(Math.abs(after.focusRange - before.focusRange) < 1e-6);
    assert.ok(Math.abs(after.bokehScale - before.bokehScale) < 1e-6);
  }
});

test('station endpoints and navigation landings are readable and finite', () => {
  for (const [offset, id] of [[0.25, '1'], [0.5, '2'], [0.75, '3'], [1, '3']]) assert.equal(resolveTimeline(offset, stations).station.id, id);
  assert.equal(resolveTimeline(0.25, stations).cardOpacity, 0);
  assert.equal(resolveTimeline(1, stations).cardOpacity, 1);
  assert.deepEqual(resolveTimeline(1, stations).position, [30, 2, 3]);
  for (const [index, expected] of [[0, 0], [1, 0.2875], [2, 0.5375], [3, 0.7875]]) {
    const landing = stationLanding(stations, index);
    assert.equal(landing, expected);
    assert.equal(resolveTimeline(landing, stations).cardOpacity, 1);
  }
});

test('reverse traversal resolves identically with no history-dependent state', () => {
  const offsets = [0, 0.1, 0.16875, 0.23, 0.25, 0.29, 0.49, 0.5, 0.75, 1];
  const forward = offsets.map((value) => resolveTimeline(value, stations));
  assert.deepEqual([...offsets].reverse().map((value) => resolveTimeline(value, stations)).reverse(), forward);
});

test('scroll store notifies changes once, clamps seeks, and disconnects cleanly', () => {
  const store = createScrollStore();
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  store.publish(0.4); store.publish(0.4);
  assert.equal(store.getSnapshot(), 0.4); assert.equal(notifications, 1);
  const sought = [];
  const disconnect = store.connect((offset) => sought.push(offset));
  store.seek(5); store.seek(-2);
  assert.deepEqual(sought, [1, 0]);
  disconnect(); store.seek(0.7); assert.deepEqual(sought, [1, 0]);
  unsubscribe(); store.publish(0.8); assert.equal(notifications, 1);
});

test('navigation requested while scene assets load is delivered when scrolling connects', () => {
  const store = createScrollStore();
  store.seek(0.13);
  store.seek(0.25);
  const sought = [];
  store.connect(offset => sought.push(offset));
  assert.deepEqual(sought, [0.25]);
  store.seek(0.5);
  assert.deepEqual(sought, [0.25, 0.5]);
});
