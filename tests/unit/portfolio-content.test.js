import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseMarkdown, readPortfolio } from '../../src/content/readPortfolio.js';
import { stations } from '../../src/config/stations.js';

const cv = readFileSync(new URL('../../src/content/cv.md', import.meta.url), 'utf8');
const notes = readFileSync(new URL('../../src/content/experiences-and-projects.md', import.meta.url), 'utf8');

test('the converted documents supply complete projects, career, education, and station introductions', () => {
  const content = readPortfolio(cv, notes);
  assert.equal(content.projects.length, 10);
  assert.equal(content.experiences.length, 6);
  assert.equal(content.skills.length, 6);
  assert.equal(content.education.length, 2);
  for (const station of stations) assert.ok(content.stationDescriptions[station.id]);
  for (const project of content.projects) assert.ok(stations.some(station => station.id === project.station));
  assert.equal(content.profile.contact, 'mailto:alberto.cutone@gmail.com');
  assert.equal(content.profile.telephone, 'tel:+41782622106');
  assert.equal(content.profile.github, 'https://github.com/albertocutone');
  assert.equal(content.profile.leetcode, 'https://leetcode.com/u/alcut1/');
  assert.equal(content.publicProjects.length, 6);
  for (const project of content.publicProjects) {
    assert.ok(project.github.startsWith('https://github.com/albertocutone/'));
    assert.ok(project.description);
    if (project.demo) assert.ok(project.demo.startsWith('https://albertocutone.github.io/'));
  }
  assert.equal(content.publicProjects.find(project => project.id === 'secondsight').status, 'Architecture & planning');
  assert.match(content.experiences[0].note, /Qualitest/);
  assert.match(content.projects.find(project => project.id === 'mr-quality').built.join(' '), /100\+/);
  assert.match(content.projects.find(project => project.id === 'edisecure').built.join(' '), /\$1M\+/);
  assert.match(content.projects.find(project => project.id === 'budget').outcome, /plans to include/);
  const cryo = content.projects.find(project => project.id === 'cryo');
  assert.equal(cryo.video, 'https://www.youtube.com/watch?v=nv13DswIKr8');
  assert.match(cryo.overview, /robot intended.*DUNE/);
  assert.match(cryo.overview, /PCB.*outside the cryostat.*level inside/);
});

test('editing Markdown updates profile, education, and referenced project details without editing JavaScript', () => {
  const editedCV = cv.replace('alberto.cutone@gmail.com', 'alberto@example.com')
    .replace('La Sapienza', 'Updated university')
    .replace('Unblocked a $1M+ commercial contract', 'Updated commercial outcome');
  const editedNotes = notes.replace('### Budget Tracker', '### My new budget app')
    .replace('Implemented MQTT-based communication', 'Implemented updated telemetry');
  const content = readPortfolio(editedCV, editedNotes);
  assert.equal(content.profile.contact, 'mailto:alberto@example.com');
  assert.equal(content.education[0].school, 'Updated university');
  assert.equal(content.projects.find(project => project.id === 'budget').title, 'My new budget app');
  assert.match(content.projects.find(project => project.id === 'edisecure').built.join(' '), /Updated commercial outcome/);
  assert.match(content.projects.find(project => project.id === 'xfarm').built.join(' '), /updated telemetry/);
});

test('Markdown reader preserves wrapped paragraphs, multiline bullets, punctuation, and Windows newlines', () => {
  const source = '# Document\r\n\r\n## Projects\r\n### Example\r\n- id: example\r\n#### Overview\r\nA C++ project\r\nwith C# and $1M+.\r\n\r\n#### What I built\r\n- First action\r\n  continued here.\r\n\r\n- Second action\r\n';
  const record = parseMarkdown(source).get('Projects')[1];
  assert.equal(record.fields.id, 'example');
  assert.deepEqual(record.sections.Overview.paragraphs, ['A C++ project with C# and $1M+.']);
  assert.deepEqual(record.sections['What I built'].items, ['First action continued here.', 'Second action']);
});

test('invalid authoring metadata and broken references fail with actionable errors', () => {
  assert.throws(() => readPortfolio(cv, notes.replace('- experience: meta', '- experience: missing')), /Unknown experience: missing/);
  assert.throws(() => readPortfolio(cv, notes.replace('- cv: matica', '- cv: missing')), /Unknown CV experience: missing/);
  assert.throws(() => readPortfolio(cv.replace('- projects: bigfix', '- projects: missing'), notes), /Unknown linked project: missing/);
  assert.throws(() => readPortfolio(cv, notes.replace('- category: Work', '- category: Other')), /Invalid category/);
  assert.throws(() => readPortfolio(cv, notes.replace('- id: insight', '- id: petlog')), /Duplicate project ID: petlog/);
  assert.throws(() => readPortfolio(cv, notes.replace('https://www.youtube.com/watch?v=nv13DswIKr8', 'javascript:alert(1)')), /Invalid YouTube video: cryo/);
  assert.throws(() => parseMarkdown('## Profile\n- name: A\n- name: B'), /Duplicate field/);
});
