import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motion } from '../../src/config/motion.js';

test('station travel is limited to a slow cinematic pace with gentle scroll damping', () => {
  assert.ok(motion.maxSpeed <= 0.1);
  assert.ok(motion.damping >= 0.3 && motion.damping <= 0.5);
});
