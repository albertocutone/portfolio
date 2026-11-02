import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stations, stationPoses } from '../../src/config/stations.js';
import { motion, stationLanding } from '../../src/config/motion.js';
import { resolveTimeline } from '../../src/scroll/timeline.js';
import { readPortfolio } from '../../src/content/readPortfolio.js';
import { getStationContent } from '../../src/content/stationContent.js';

const content = readPortfolio(readFileSync(new URL('../../src/content/cv.md', import.meta.url), 'utf8'), readFileSync(new URL('../../src/content/experiences-and-projects.md', import.meta.url), 'utf8'));

test('intro opens, education and career follow the CV order, and recap closes the tour', () => {
  assert.deepEqual(stations.map(station => station.id), ['intro', 'education', 'cern', 'hcl', 'xfarm', 'matica', 'meta', 'personal', 'recap']);
  assert.equal(stations.find(station => station.id === 'education').pose, 'colosseum');
  assert.equal(stations.find(station => station.id === 'cern').pose, 'atlas');
  for (const [index, station] of stations.entries()) {
    assert.equal(station.eyebrow.slice(0, 2), String(index + 1).padStart(2, '0'));
    assert.deepEqual(station.scrollRange, [index / stations.length, (index + 1) / stations.length]);
    assert.deepEqual(station.camera, stationPoses[station.pose].camera);
    const pose = resolveTimeline(stationLanding(stations, index), stations);
    assert.equal(pose.station, station);
    assert.equal(pose.cardOpacity, 1);
    assert.equal(pose.sceneOpacity, 1);
    assert.equal(pose.scene, station.scene);
  }
});

test('separate worlds switch only at fully faded midpoints and reverse identically', () => {
  for (let index = 0; index < stations.length - 1; index++) {
    const station = stations[index];
    if (station.scene === stations[index + 1].scene) continue;
    const [start, end] = station.scrollRange;
    const midpoint = start + (end - start) * (motion.dwellRatio + (1 - motion.dwellRatio) / 2);
    assert.ok(resolveTimeline(midpoint, stations).sceneOpacity < 1e-9);
    assert.equal(resolveTimeline(midpoint - 1e-6, stations).scene, station.scene);
    assert.equal(resolveTimeline(midpoint + 1e-6, stations).scene, stations[index + 1].scene);
  }
  const points = Array.from({ length: 201 }, (_, i) => i / 200);
  const forward = points.map(offset => resolveTimeline(offset, stations));
  for (const pose of forward) {
    assert.ok(pose.sceneOpacity >= 0 && pose.sceneOpacity <= 1);
    for (const key of ['position', 'target', 'focus']) assert.ok(pose[key].every(Number.isFinite));
  }
  assert.deepEqual(points.reverse().map(offset => resolveTimeline(offset, stations)).reverse(), forward);
});

test('every CV station resolves its own education, experience, and projects from authored content', () => {
  const expected = {
    intro: [], education: ['cardiac', 'cryo'], cern: ['cryo'], hcl: ['bigfix'], xfarm: ['xfarm'], matica: ['edisecure'],
    meta: ['insight', 'mr-quality', 'spatial-gt'], personal: ['budget', 'petlog'],
  };
  for (const station of stations) {
    const resolved = getStationContent(station, content);
    if (station.kind === 'recap') {
      assert.equal(resolved.projects.length, content.projects.length);
      assert.equal(resolved.experiences.length, content.experiences.length);
    } else assert.deepEqual(resolved.projects.map(project => project.id).sort(), expected[station.id].sort());
    if (station.kind === 'experience') assert.deepEqual(resolved.experiences.map(item => item.id), [station.id]);
  }
  const education = getStationContent(stations[1], content);
  assert.equal(education.education.length, 2);
  assert.equal(education.experiences[0].company, 'Policlinico Umberto I');
  assert.match(getStationContent(stations.find(station => station.id === 'meta'), content).experiences[0].note, /Qualitest/);
  assert.throws(() => getStationContent({ id: 'example', experienceIds: ['missing'] }, content), /Unknown station experience/);
});
