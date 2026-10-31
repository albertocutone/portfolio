import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stations } from '../../src/config/stations.js';
import { motion, stationLanding } from '../../src/config/motion.js';
import { resolveTimeline } from '../../src/scroll/timeline.js';

test('ATLAS opens the tour and the original PCB stations follow in order', () => {
  assert.deepEqual(stations.map(station => station.id), ['atlas', 'sensor', 'instrumentation', 'edge', 'architecture']);
  for (const [index, station] of stations.entries()) {
    assert.equal(station.eyebrow.slice(0, 2), String(index + 1).padStart(2, '0'));
    assert.deepEqual(station.scrollRange, [index / 5, (index + 1) / 5]);
    const pose = resolveTimeline(stationLanding(stations, index), stations);
    assert.equal(pose.station, station);
    assert.equal(pose.cardOpacity, 1);
    assert.equal(pose.sceneOpacity, 1);
    assert.equal(pose.scene, index === 0 ? 'atlas' : 'pcb');
  }
});

test('ATLAS and PCB switch only at the fully faded midpoint and reverse identically', () => {
  const range = stations[0].scrollRange[1];
  const midpoint = range * (motion.dwellRatio + (1 - motion.dwellRatio) / 2);
  assert.ok(resolveTimeline(midpoint, stations).sceneOpacity < 1e-9);
  assert.equal(resolveTimeline(midpoint - 1e-6, stations).scene, 'atlas');
  assert.equal(resolveTimeline(midpoint + 1e-6, stations).scene, 'pcb');
  for (const offset of [0, midpoint, range, 0.4, 0.6, 0.8, 1]) {
    const pose = resolveTimeline(offset, stations);
    assert.ok(pose.sceneOpacity >= 0 && pose.sceneOpacity <= 1);
    for (const key of ['position', 'target', 'focus']) assert.ok(pose[key].every(Number.isFinite));
  }
  const points = Array.from({ length: 101 }, (_, i) => i / 100);
  const forward = points.map(offset => resolveTimeline(offset, stations));
  assert.deepEqual(points.reverse().map(offset => resolveTimeline(offset, stations)).reverse(), forward);
});
