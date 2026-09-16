import { createScoreStabilityTracker } from './scoreStability';

const scores = ['25000', '25000', '25000', '25000'];

test('requires five matching fresh readings spanning one second', () => {
  const tracker = createScoreStabilityTracker();
  [0, 250, 500, 750].forEach((time, i) => {
    expect(tracker.observe(scores, time, true)).toEqual({ count: i + 1, ready: false });
  });
  expect(tracker.observe(scores, 1000, true)).toEqual({ count: 5, ready: true });
});

test('neither enough frames alone nor enough time alone can capture', () => {
  const tracker = createScoreStabilityTracker();
  [0, 100, 200, 300, 400].forEach(time => expect(tracker.observe(scores, time, true).ready).toBe(false));
  expect(tracker.observe(scores, 1000, true).ready).toBe(true);
  const slow = createScoreStabilityTracker();
  [0, 500, 1000].forEach(time => expect(slow.observe(scores, time, true).ready).toBe(false));
});

test('a changed ordered score array starts a new streak', () => {
  const tracker = createScoreStabilityTracker();
  const original = ['10000', '20000', '30000', '40000'];
  [0, 250, 500, 750].forEach(time => tracker.observe(original, time, true));
  expect(tracker.observe(['20000', '30000', '40000', '10000'], 1000, true)).toEqual({ count: 1, ready: false });
});

test('malformed timestamps reset the session, while non-temporal invalid readings do not wipe buffer', () => {
  [NaN, Infinity, -Infinity].forEach(time => {
    const tracker = createScoreStabilityTracker();
    tracker.observe(scores, 0, true);
    expect(tracker.observe(scores, time, true)).toEqual({ count: 0, ready: false });
    expect(tracker.observe(scores, 250, true)).toEqual({ count: 1, ready: false });
  });
  const tracker = createScoreStabilityTracker(5, 1000, 1500);
  [0, 250, 500, 750].forEach(time => tracker.observe(scores, time, true));
  // Invalid readings keep the top count in buffer
  expect(tracker.observe([], 900, false)).toEqual({ count: 4, ready: false });
  expect(tracker.observe(['25000'], 950, false)).toEqual({ count: 4, ready: false });
  // 5th matching reading arrives at 1000ms, triggering ready
  expect(tracker.observe(scores, 1000, true)).toEqual({ count: 5, ready: true });
});


test('duplicate or backwards timestamps cannot advance or alter a streak', () => {
  const tracker = createScoreStabilityTracker();
  tracker.observe(scores, 0, true);
  tracker.observe(scores, 250, true);
  expect(tracker.observe(scores, 250, true)).toEqual({ count: 2, ready: false });
  expect(tracker.observe([], 100, false)).toEqual({ count: 2, ready: false });
  [500, 750].forEach(time => expect(tracker.observe(scores, time, true).ready).toBe(false));
  expect(tracker.observe(scores, 1000, true).ready).toBe(true);
});

test('tolerates intermittent invalid or noise frames within sliding window TTL', () => {
  const tracker = createScoreStabilityTracker(2, 100, 1500);
  expect(tracker.observe(scores, 0, true)).toEqual({ count: 1, ready: false });
  // Intermittent noise frame: blurred/partial OCR
  expect(tracker.observe(['0'], 100, false)).toEqual({ count: 1, ready: false });
  // Second matching valid frame at 200ms (span 200ms >= 100ms) triggers ready
  expect(tracker.observe(scores, 200, true)).toEqual({ count: 2, ready: true });
});

test('expires observations older than sliding window TTL', () => {
  const tracker = createScoreStabilityTracker(2, 100, 1500);
  expect(tracker.observe(scores, 0, true)).toEqual({ count: 1, ready: false });
  // After 1600ms (exceeding TTL 1500ms), previous observation has expired
  expect(tracker.observe(scores, 1600, true)).toEqual({ count: 1, ready: false });
  // Second observation at 1750ms within the new window triggers ready
  expect(tracker.observe(scores, 1750, true)).toEqual({ count: 2, ready: true });
});

test('stores a copy so caller mutation cannot rewrite previous readings', () => {
  const tracker = createScoreStabilityTracker(2, 100, 1500);
  const mutable = [...scores];
  tracker.observe(mutable, 0, true);
  mutable[0] = '10000';
  expect(tracker.observe(mutable, 250, true)).toEqual({ count: 1, ready: false });
});

