import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNotification, scheduleBatches, MAX_BATCH_SIZE } from '../../src/notification.mjs';

const INELIGIBLE = { eligible: false, body: '' };

test('gate: requires both reviewed and released to be strictly true', () => {
  assert.deepEqual(buildNotification({ reviewed: false, released: true, testName: 'glucose', value: '7.2' }), INELIGIBLE);
  assert.deepEqual(buildNotification({ reviewed: true, released: false }), INELIGIBLE);
  assert.deepEqual(buildNotification({ reviewed: false, released: false }), INELIGIBLE);
  assert.deepEqual(buildNotification({ reviewed: true }), INELIGIBLE);
  assert.deepEqual(buildNotification({ released: true }), INELIGIBLE);
  assert.deepEqual(buildNotification({ reviewed: 'true', released: 'true' }), INELIGIBLE);
  assert.deepEqual(buildNotification({ reviewed: 1, released: 1 }), INELIGIBLE);
  assert.deepEqual(buildNotification({ reviewed: {}, released: [] }), INELIGIBLE);
  assert.deepEqual(buildNotification({}), INELIGIBLE);
  assert.deepEqual(buildNotification(undefined), INELIGIBLE);
  assert.deepEqual(buildNotification(null), INELIGIBLE);
});

test('eligible message is neutral and leaks no clinical data', () => {
  const r = buildNotification({ reviewed: true, released: true, testName: 'glucose', value: '7.2' });
  assert.equal(r.eligible, true);
  assert.equal(typeof r.body, 'string');
  assert.ok(r.body.length > 0);
  assert.ok(!r.body.toLowerCase().includes('glucose'));
  assert.ok(!r.body.includes('7.2'));
  const r2 = buildNotification({ reviewed: true, released: true, testName: 'HbA1c', value: 'HIGH 9.9 mmol' });
  assert.equal(r2.body, r.body);
  assert.deepEqual(Object.keys(r).sort(), ['body', 'eligible']);
});

test('batches fill to max, keep order, do not mutate input', () => {
  assert.equal(MAX_BATCH_SIZE, 20);
  assert.deepEqual(scheduleBatches([]), []);
  assert.deepEqual(scheduleBatches([1]), [[1]]);
  const twenty = Array.from({ length: 20 }, (_, i) => i);
  assert.deepEqual(scheduleBatches(twenty).map(b => b.length), [20]);
  assert.deepEqual(scheduleBatches(Array.from({ length: 21 }, (_, i) => i)).map(b => b.length), [20, 1]);
  const items = Array.from({ length: 45 }, (_, i) => i);
  const copy = [...items];
  const batches = scheduleBatches(items);
  assert.deepEqual(batches.map(b => b.length), [20, 20, 5]);
  assert.deepEqual(batches.flat(), copy);
  assert.deepEqual(items, copy);
  assert.ok(batches.every(b => b !== items));
});

test('functions are synchronous', () => {
  const r = buildNotification({ reviewed: true, released: true });
  assert.ok(!(r instanceof Promise));
  assert.ok(Array.isArray(scheduleBatches([1, 2])));
});
