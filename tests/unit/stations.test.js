import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stations } from '../../src/config/stations.js';
import { motion, stationLanding } from '../../src/config/motion.js';
import { resolveTimeline } from '../../src/scroll/timeline.js';

test('Rome opens the tour and the original PCB stations follow in order', () => {
  assert.deepEqual(stations.map(station => station.id), ['rome', 'atlas', 'sensor', 'instrumentation', 'edge', 'architecture']);
  for (const [index, station] of stations.entries()) {
    assert.equal(station.eyebrow.slice(0, 2), String(index + 1).padStart(2, '0'));
    assert.deepEqual(station.scrollRange, [index / stations.length, (index + 1) / stations.length]);
    const pose = resolveTimeline(stationLanding(stations, index), stations);
    assert.equal(pose.station, station);
    assert.equal(pose.cardOpacity, 1);
    assert.equal(pose.sceneOpacity, 1);
    assert.equal(pose.scene, station.scene);
  }
});

test('separate worlds switch only at fully faded midpoints and reverse identically', () => {
  for (const index of [0, 1]) {
    const station = stations[index];
    const [start, end] = station.scrollRange;
    const midpoint = start + (end - start) * (motion.dwellRatio + (1 - motion.dwellRatio) / 2);
    assert.ok(resolveTimeline(midpoint, stations).sceneOpacity < 1e-9);
    assert.equal(resolveTimeline(midpoint - 1e-6, stations).scene, station.scene);
    assert.equal(resolveTimeline(midpoint + 1e-6, stations).scene, stations[index + 1].scene);
  }
  for (const offset of [0, 1 / 6, 1 / 3, 0.4, 0.6, 0.8, 1]) {
    const pose = resolveTimeline(offset, stations);
    assert.ok(pose.sceneOpacity >= 0 && pose.sceneOpacity <= 1);
    for (const key of ['position', 'target', 'focus']) assert.ok(pose[key].every(Number.isFinite));
  }
  const points = Array.from({ length: 101 }, (_, i) => i / 100);
  const forward = points.map(offset => resolveTimeline(offset, stations));
  assert.deepEqual(points.reverse().map(offset => resolveTimeline(offset, stations)).reverse(), forward);
});
