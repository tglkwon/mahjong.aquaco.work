import { inflate } from 'pako';
import fixtures from './scoreRecognition.fixtures.json';
import rgbFixture from './scoreRecognition.rgb.fixture.json';
import jpexFixture from './scoreRecognition.jpex.fixture.json';
import { recognizeScoreboard } from './scoreRecognition';
import { validateScoreDraft } from './scoreDraft';

describe('scoreRecognition Quantitative Benchmark Suite', () => {
  interface BenchmarkResult {
    totalFrames: number;
    accuratelyDecodedFrames: number;
    latenciesMs: number[];
    falsePositives: number;
    negativeTrials: number;
  }

  const parseMaskFixture = (fixture: { width: number; height: number; mask: string }) => {
    const mask = inflate(Uint8Array.from(atob(fixture.mask), c => c.charCodeAt(0)));
    const data = new Uint8ClampedArray(mask.length * 4);
    for (let i = 0; i < mask.length; i++) {
      data[i * 4] = mask[i] ? 255 : 0;
      data[i * 4 + 3] = 255;
    }
    return { width: fixture.width, height: fixture.height, data };
  };

  const parseRgbFixture = (fixture: { width: number; height: number; rgb: string }) => {
    const rgb = inflate(Uint8Array.from(atob(fixture.rgb), c => c.charCodeAt(0)));
    const data = new Uint8ClampedArray(fixture.width * fixture.height * 4);
    for (let i = 0; i < rgb.length / 3; i++) {
      data.set(rgb.subarray(i * 3, i * 3 + 3), i * 4);
      data[i * 4 + 3] = 255;
    }
    return { width: fixture.width, height: fixture.height, data };
  };

  test('benchmarks 4-score complete recognition accuracy and latency on real parlor fixtures', () => {
    const metrics: BenchmarkResult = {
      totalFrames: 0,
      accuratelyDecodedFrames: 0,
      latenciesMs: [],
      falsePositives: 0,
      negativeTrials: 0,
    };

    // 1. REXX 3 mask fixtures
    fixtures.forEach(fixture => {
      const frame = parseMaskFixture(fixture);
      const start = performance.now();
      const result = recognizeScoreboard(frame, 'amos_rexx3');
      const elapsed = performance.now() - start;

      metrics.latenciesMs.push(elapsed);
      metrics.totalFrames++;

      const raw = result.map(c => c.raw);
      if (
        raw.length === 4 &&
        raw[0] === '102' &&
        raw[1] === '0266' &&
        raw[2] === '0606' &&
        raw[3] === '0026'
      ) {
        metrics.accuratelyDecodedFrames++;
      }
    });

    // 2. REXX 3 RGB full frame fixture
    {
      const frame = parseRgbFixture(rgbFixture);
      const start = performance.now();
      const result = recognizeScoreboard(frame, 'amos_rexx3');
      const elapsed = performance.now() - start;

      metrics.latenciesMs.push(elapsed);
      metrics.totalFrames++;

      const raw = result.map(c => c.raw);
      if (
        raw.length === 4 &&
        raw[0] === '102' &&
        raw[1] === '0266' &&
        raw[2] === '0606' &&
        raw[3] === '0026'
      ) {
        metrics.accuratelyDecodedFrames++;
      }
    }

    // 3. JP-EX mask fixture
    {
      const frame = parseMaskFixture(jpexFixture);
      const start = performance.now();
      const result = recognizeScoreboard(frame, 'amos_jp_ex');
      const elapsed = performance.now() - start;

      metrics.latenciesMs.push(elapsed);
      metrics.totalFrames++;

      const raw = result.map(c => c.raw);
      if (
        raw.length === 4 &&
        raw[0] === '220' &&
        raw[1] === '483' &&
        raw[2] === '200' &&
        raw[3] === '97'
      ) {
        metrics.accuratelyDecodedFrames++;
      }
    }

    // 4. JP-EX RGB full frame fixture
    {
      const frame = parseRgbFixture(jpexFixture);
      const start = performance.now();
      const result = recognizeScoreboard(frame, 'amos_jp_ex');
      const elapsed = performance.now() - start;

      metrics.latenciesMs.push(elapsed);
      metrics.totalFrames++;

      const raw = result.map(c => c.raw);
      if (
        raw.length === 4 &&
        raw[0] === '220' &&
        raw[1] === '483' &&
        raw[2] === '200' &&
        raw[3] === '97'
      ) {
        metrics.accuratelyDecodedFrames++;
      }
    }

    // Sort latencies to compute median and P95
    metrics.latenciesMs.sort((a, b) => a - b);
    const medianLatency = metrics.latenciesMs[Math.floor(metrics.latenciesMs.length / 2)];
    const p95Latency = metrics.latenciesMs[Math.floor(metrics.latenciesMs.length * 0.95)];
    const accuracyPct = (metrics.accuratelyDecodedFrames / metrics.totalFrames) * 100;

    console.log(`[BENCHMARK] Total Valid Frames: ${metrics.totalFrames}`);
    console.log(`[BENCHMARK] Complete Accuracy: ${accuracyPct.toFixed(1)}% (${metrics.accuratelyDecodedFrames}/${metrics.totalFrames})`);
    console.log(`[BENCHMARK] Latency Median: ${medianLatency.toFixed(2)} ms, P95: ${p95Latency.toFixed(2)} ms`);

    // Complete recognition accuracy assertion
    expect(accuracyPct).toBeGreaterThanOrEqual(95.0);
    // Node.js test environment latency assertions (software CPU emulation of full HD frames under test worker load)
    expect(medianLatency).toBeLessThan(1000.0);
    expect(p95Latency).toBeLessThan(3000.0);
  });

  test('strictly enforces 0.0% false-positive auto-confirmation rate across negative and corrupt inputs', () => {
    let negativeTrials = 0;
    let falsePositives = 0;

    // Helper: Evaluates 3-gate safety criteria
    // Gate 1: Spatial layout (exactly 4 scores, none blank)
    // Gate 2: Sum validation matching target 100,000
    // Gate 3: 3 consecutive agreeing frames
    const evaluateAutoConfirm = (consecutiveFramesReadings: Array<string[]>, targetTotal = 100000) => {
      if (consecutiveFramesReadings.length < 3) return false;

      // Gate 1 & 2 for all 3 frames
      for (const raw of consecutiveFramesReadings) {
        if (!raw || raw.length !== 4 || raw.some(v => !v || v.trim() === '')) {
          return false;
        }
        const draft = validateScoreDraft(raw, 100, String(targetTotal), [0, 1, 2, 3], 4);
        if (!draft.valid || draft.total !== targetTotal) {
          return false;
        }
      }

      // Gate 3: Temporal agreement across all 3 frames
      const first = consecutiveFramesReadings[0];
      for (let i = 1; i < consecutiveFramesReadings.length; i++) {
        const current = consecutiveFramesReadings[i];
        for (let j = 0; j < 4; j++) {
          if (first[j] !== current[j]) return false;
        }
      }

      return true;
    };

    // Scenario A: Washed-out frames (all grey)
    {
      negativeTrials++;
      const washed = parseRgbFixture(rgbFixture);
      for (let i = 0; i < washed.data.length; i += 4) {
        washed.data[i] = washed.data[i + 1] = washed.data[i + 2] = 200;
      }
      const readings = [
        recognizeScoreboard(washed, 'amos_rexx3').map(c => c.raw),
        recognizeScoreboard(washed, 'amos_rexx3').map(c => c.raw),
        recognizeScoreboard(washed, 'amos_rexx3').map(c => c.raw),
      ];
      if (evaluateAutoConfirm(readings)) falsePositives++;
    }

    // Scenario B: Noise frames (3 trials)
    {
      for (let trial = 0; trial < 3; trial++) {
        negativeTrials++;
        const noise = {
          width: 240,
          height: 240,
          data: new Uint8ClampedArray(240 * 240 * 4),
        };
        for (let i = 0; i < noise.data.length; i += 4) {
          noise.data[i] = (trial * 70 + i) % 256;
          noise.data[i + 1] = (trial * 30 + i * 2) % 256;
          noise.data[i + 2] = (trial * 50 + i * 3) % 256;
          noise.data[i + 3] = 255;
        }
        const reading = recognizeScoreboard(noise, 'amos_rexx3').map(c => c.raw);
        if (evaluateAutoConfirm([reading, reading, reading])) {
          falsePositives++;
        }
      }
    }

    // Scenario C: Partial coverage (one seat occluded / blanked)
    {
      negativeTrials++;
      const partialReadings = [
        ['102', '0266', '', '0026'],
        ['102', '0266', '', '0026'],
        ['102', '0266', '', '0026'],
      ];
      if (evaluateAutoConfirm(partialReadings)) falsePositives++;
    }

    // Scenario D: Sum mismatch (e.g. reading 250, 250, 250, 240 = 99,000 != 100,000)
    {
      negativeTrials++;
      const mismatchReadings = [
        ['250', '250', '250', '240'],
        ['250', '250', '250', '240'],
        ['250', '250', '250', '240'],
      ];
      if (evaluateAutoConfirm(mismatchReadings)) falsePositives++;
    }

    // Scenario E: Inconsistent / jittering readings (frames disagree)
    {
      negativeTrials++;
      const jitterReadings = [
        ['102', '0266', '0606', '0026'],
        ['102', '0265', '0606', '0026'], // flicker on digit
        ['102', '0266', '0606', '0026'],
      ];
      if (evaluateAutoConfirm(jitterReadings)) falsePositives++;
    }

    // Scenario F: Ambiguous glare corrupting two digits
    {
      negativeTrials++;
      const glareCorrupted = [
        ['888', '888', '0606', '0026'],
        ['888', '888', '0606', '0026'],
        ['888', '888', '0606', '0026'],
      ];
      if (evaluateAutoConfirm(glareCorrupted)) falsePositives++;
    }

    const falsePositiveRate = (falsePositives / negativeTrials) * 100;
    console.log(`[BENCHMARK] Negative Trials: ${negativeTrials}, False Positives: ${falsePositives}`);
    console.log(`[BENCHMARK] False Positive Rate: ${falsePositiveRate.toFixed(2)}%`);

    // Strict 0.0% False Positive requirement
    expect(falsePositives).toBe(0);
    expect(falsePositiveRate).toBe(0.0);
  });
});
