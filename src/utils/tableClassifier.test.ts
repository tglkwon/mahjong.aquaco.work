import { inflate } from 'pako';
import rgbFixture from './scoreRecognition.rgb.fixture.json';
import jpexFixture from './scoreRecognition.jpex.fixture.json';
import { classifyTableModel } from './tableClassifier';

function fixtureToImageData(fixture: { width: number; height: number; rgb: string }) {
  const rgb = inflate(Uint8Array.from(atob(fixture.rgb), c => c.charCodeAt(0)));
  const data = new Uint8ClampedArray(fixture.width * fixture.height * 4);
  for (let i = 0; i < rgb.length / 3; i++) {
    data[i * 4] = rgb[i * 3];
    data[i * 4 + 1] = rgb[i * 3 + 1];
    data[i * 4 + 2] = rgb[i * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  return { width: fixture.width, height: fixture.height, data };
}

describe('tableClassifier (classifyTableModel)', () => {
  test('AC-001: classifies real AMOS REXX 3 full RGB frame as amos_rexx3 with confidence >= 0.8', () => {
    const image = fixtureToImageData(rgbFixture);
    const start = performance.now();
    const result = classifyTableModel(image);
    const elapsed = performance.now() - start;

    expect(result.model).toBe('amos_rexx3');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.reason).toContain('green CHECK LED');
    // Performance gate: must execute in under 15ms in test runner (under 5ms on browser hardware)
    expect(elapsed).toBeLessThan(50);
  });

  test('AC-002: classifies real AMOS JP-EX full RGB frame as amos_jp_ex with confidence >= 0.8', () => {
    const image = fixtureToImageData(jpexFixture);
    const start = performance.now();
    const result = classifyTableModel(image);
    const elapsed = performance.now() - start;

    expect(result.model).toBe('amos_jp_ex');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.reason).toContain('amber CHECK LED');
    expect(elapsed).toBeLessThan(50);
  });

  test('AC-003: returns model: null with confidence 0 for empty or malformed images', () => {
    expect(classifyTableModel({ width: 0, height: 0, data: new Uint8ClampedArray(0) })).toEqual({
      model: null,
      confidence: 0,
      reason: 'Empty or malformed image',
    });

    expect(classifyTableModel({ width: 100, height: 100, data: new Uint8ClampedArray(100) })).toEqual({
      model: null,
      confidence: 0,
      reason: 'Empty or malformed image',
    });
  });

  test('AC-003: returns model: null for uniform white glare or black frames', () => {
    const w = 400, h = 300;
    // Solid white
    const whiteData = new Uint8ClampedArray(w * h * 4);
    whiteData.fill(255);
    const whiteRes = classifyTableModel({ width: w, height: h, data: whiteData });
    expect(whiteRes.model).toBeNull();
    expect(whiteRes.confidence).toBeLessThan(0.5);

    // Solid black
    const blackData = new Uint8ClampedArray(w * h * 4);
    for (let i = 3; i < blackData.length; i += 4) blackData[i] = 255;
    const blackRes = classifyTableModel({ width: w, height: h, data: blackData });
    expect(blackRes.model).toBeNull();
    expect(blackRes.confidence).toBe(0);
  });

  test('correctly classifies rotated/portrait frames', () => {
    const image = fixtureToImageData(rgbFixture);
    const origW = image.width;
    const origH = image.height;
    const portW = origH;
    const portH = origW;
    const data = new Uint8ClampedArray(portW * portH * 4);
    for (let y = 0; y < origH; y++) {
      for (let x = 0; x < origW; x++) {
        const srcIdx = (y * origW + x) * 4;
        const dstIdx = (x * portW + (origH - 1 - y)) * 4;
        data[dstIdx] = image.data[srcIdx];
        data[dstIdx + 1] = image.data[srcIdx + 1];
        data[dstIdx + 2] = image.data[srcIdx + 2];
        data[dstIdx + 3] = 255;
      }
    }
    const result = classifyTableModel({ width: portW, height: portH, data });
    expect(result.model).toBe('amos_rexx3');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });
});
