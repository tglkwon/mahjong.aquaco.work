import { inflate } from 'pako';
import fixtures from './scoreRecognition.fixtures.json';
import rgbFixture from './scoreRecognition.rgb.fixture.json';
import jpexFixture from './scoreRecognition.jpex.fixture.json';
import { recognizeScoreboard, recognizeScoreboardLegacy, recognizeScoreboardAdaptive, computeOtsuRedThreshold, RecognitionMetrics } from './scoreRecognition';
import { validateScoreDraft } from './scoreDraft';
import { computeViewfinderCrop } from './scoreCamera';

describe('actual PXL_20260902_054136311.mp4 red-pixel fixtures', () => {
  test.each(fixtures)('reads four scores in [bottom, right, top, left] order without treating rank as score on AMOS REXX 3', fixture => {
    const mask = inflate(Uint8Array.from(atob(fixture.mask), c => c.charCodeAt(0)));
    const data = new Uint8ClampedArray(mask.length * 4);
    mask.forEach((value, i) => { data[i * 4] = value ? 255 : 0; data[i * 4 + 3] = 255; });
    expect(recognizeScoreboard({ ...fixture, data }, 'amos_rexx3').map(c => c.raw)).toEqual(['102', '0266', '0606', '0026']);
  });
});

describe('actual Yeokgok AMOS JP-EX parlor photo fixture', () => {
  test('reads four scores in [bottom, right, top, left] order including 2-digit score (<10,000) on AMOS JP-EX mask', () => {
    const mask = inflate(Uint8Array.from(atob(jpexFixture.mask), c => c.charCodeAt(0)));
    const data = new Uint8ClampedArray(mask.length * 4);
    mask.forEach((value, i) => { data[i * 4] = value ? 255 : 0; data[i * 4 + 3] = 255; });
    const result = recognizeScoreboard({ width: jpexFixture.width, height: jpexFixture.height, data }, 'amos_jp_ex');
    const rawScores = result.map(c => c.raw);
    expect(rawScores).toEqual(['220', '483', '200', '97']);

    // Validates 100,000 target total with 100-point units
    const draft = validateScoreDraft(rawScores, 100, '100000', [0, 1, 2, 3], 4);
    expect(draft.valid).toBe(true);
    expect(draft.total).toBe(100000);
    expect(draft.scores).toEqual(['22000', '48300', '20000', '9700']);
  });

  test('classifies actual full RGB frame for AMOS JP-EX photo (KakaoTalk_20230528_2.jpg)', () => {
    const rgb = inflate(Uint8Array.from(atob(jpexFixture.rgb), c => c.charCodeAt(0)));
    const data = new Uint8ClampedArray(jpexFixture.width * jpexFixture.height * 4);
    for (let i = 0; i < rgb.length / 3; i++) {
      data.set(rgb.subarray(i * 3, i * 3 + 3), i * 4);
      data[i * 4 + 3] = 255;
    }
    const result = recognizeScoreboard({ width: jpexFixture.width, height: jpexFixture.height, data }, 'amos_jp_ex');
    expect(result.map(c => c.raw)).toEqual(['220', '483', '200', '97']);
  });
});

test('returns editable blanks for empty or malformed images', () => {
  expect(recognizeScoreboard({ width: 100, height: 100, data: new Uint8ClampedArray(40000) })).toEqual(Array(4).fill({ raw: '', confidence: 0 }));
  expect(recognizeScoreboard({ width: 100, height: 100, data: new Uint8ClampedArray(0) })).toEqual(Array(4).fill({ raw: '', confidence: 0 }));
});

test('classifies actual full RGB frame before reading segments', () => {
  const rgb = inflate(Uint8Array.from(atob(rgbFixture.rgb), c => c.charCodeAt(0)));
  const data = new Uint8ClampedArray(rgbFixture.width * rgbFixture.height * 4);
  for (let i = 0; i < rgb.length / 3; i++) { data.set(rgb.subarray(i * 3, i * 3 + 3), i * 4); data[i * 4 + 3] = 255; }
  expect(recognizeScoreboard({ ...rgbFixture, data }).map(c => c.raw)).toEqual(['102', '0266', '0606', '0026']);
  // A washed-out frame must not produce confident invented scores.
  for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 200;
  expect(recognizeScoreboard({ ...rgbFixture, data }).every(c => c.raw === '' && c.confidence === 0)).toBe(true);
});

test('partial board cannot be mistaken for all four player scores', () => {
  const fixture = fixtures[2];
  const mask = inflate(Uint8Array.from(atob(fixture.mask), c => c.charCodeAt(0)));
  const data = new Uint8ClampedArray(mask.length * 4);
  mask.forEach((value, i) => { data[i * 4] = i % fixture.width < 450 && value ? 255 : 0; });
  expect(recognizeScoreboard({ ...fixture, data }).every(c => c.raw === '')).toBe(true);
});

test('automatically recognizes scoreboard in portrait orientation (세로 모드)', () => {
  const rgb = inflate(Uint8Array.from(atob(rgbFixture.rgb), c => c.charCodeAt(0)));
  const origW = rgbFixture.width;
  const origH = rgbFixture.height;
  const portW = origH;
  const portH = origW;
  const data = new Uint8ClampedArray(portW * portH * 4);
  for (let y = 0; y < origH; y++) {
    for (let x = 0; x < origW; x++) {
      const srcIdx = (y * origW + x) * 3;
      const dstIdx = (x * portW + (origH - 1 - y)) * 4;
      data[dstIdx] = rgb[srcIdx];
      data[dstIdx + 1] = rgb[srcIdx + 1];
      data[dstIdx + 2] = rgb[srcIdx + 2];
      data[dstIdx + 3] = 255;
    }
  }
  expect(portW < portH).toBe(true);
  const result = recognizeScoreboard({ width: portW, height: portH, data });
  expect(result.map(c => c.raw)).toEqual(['102', '0266', '0606', '0026']);
});

test('recognizes AMOS REXX 3 T-shaped front panel layout (3 top, 1 bottom)', () => {
  const imgW = 280, imgH = 90;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  const bitPatterns: Record<string, number[]> = {
    '0': [1, 1, 1, 0, 1, 1, 1],
    '1': [0, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 1, 1, 0, 1],
    '3': [1, 0, 1, 1, 0, 1, 1],
    '4': [0, 1, 1, 1, 0, 1, 0],
    '5': [1, 1, 0, 1, 0, 1, 1],
    '6': [1, 1, 0, 1, 1, 1, 1],
    '7': [1, 0, 1, 0, 0, 1, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
  };

  const drawDigit = (bx: number, by: number, digit: string) => {
    const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
    const fillRect = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const idx = ((by + y) * imgW + (bx + x)) * 4;
          data[idx] = 255;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
    };
    if (bits[0]) fillRect(2, 1, 9, 2);
    if (bits[1]) fillRect(1, 2, 3, 9);
    if (bits[2]) fillRect(8, 2, 10, 9);
    if (bits[3]) fillRect(2, 8, 9, 10);
    if (bits[4]) fillRect(1, 9, 3, 16);
    if (bits[5]) fillRect(8, 9, 10, 16);
    if (bits[6]) fillRect(2, 15, 9, 17);
  };

  const drawNumber = (startX: number, startY: number, numStr: string) => {
    for (let i = 0; i < numStr.length; i++) {
      drawDigit(startX + i * 15, startY, numStr[i]);
    }
  };

  // Top row: Left (상가: 0192), Center (대가: 0300), Right (하가: 0251)
  drawNumber(15, 15, '0192');
  drawNumber(105, 15, '0300');
  drawNumber(195, 15, '0251');
  // Bottom row: Center (내자리: 0347)
  drawNumber(105, 52, '0347');

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  // Order must be [bottom, right, center, left] = [내자리, 하가, 대가, 상가]
  // With amos_rexx3, bottom's first digit (rank) is sliced -> '347'
  expect(result.map(c => c.raw)).toEqual(['347', '0251', '0300', '0192']);
});

test('recognizes AMOS REXX 3 with 3-digit score (leading zero omitted, e.g. 301)', () => {
  const imgW = 280;
  const imgH = 80;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  const bitPatterns: Record<string, number[]> = {
    '0': [1, 1, 1, 0, 1, 1, 1],
    '1': [0, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 1, 1, 0, 1],
    '3': [1, 0, 1, 1, 0, 1, 1],
    '5': [1, 1, 0, 1, 0, 1, 1],
    '7': [1, 0, 1, 0, 0, 1, 0],
    '9': [1, 1, 1, 1, 0, 1, 1],
  };

  const drawDigit = (bx: number, by: number, digit: string) => {
    const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
    const fillRect = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const idx = ((by + y) * imgW + (bx + x)) * 4;
          data[idx] = 255;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
    };
    if (bits[0]) fillRect(2, 1, 9, 2);
    if (bits[1]) fillRect(1, 2, 3, 9);
    if (bits[2]) fillRect(8, 2, 10, 9);
    if (bits[3]) fillRect(2, 8, 9, 10);
    if (bits[4]) fillRect(1, 9, 3, 16);
    if (bits[5]) fillRect(8, 9, 10, 16);
    if (bits[6]) fillRect(2, 15, 9, 17);
  };

  const drawNumber = (startX: number, startY: number, numStr: string) => {
    for (let i = 0; i < numStr.length; i++) {
      drawDigit(startX + i * 15, startY, numStr[i]);
    }
  };

  // Top row: Left (상가: 301 - 3 digits), Center (대가: 0250), Right (하가: 0351)
  drawNumber(15, 15, '301');
  drawNumber(105, 15, '0250');
  drawNumber(195, 15, '0351');
  // Bottom row: Center (내자리: 0097 - rank 0 + 097)
  drawNumber(105, 52, '0097');

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  expect(result.map(c => c.raw)).toEqual(['097', '0351', '0250', '301']);
});

test('accurately recognizes North 0097 with diagonal stem 7 (differentiating 7 from 3)', () => {
  const imgW = 280;
  const imgH = 85;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  const bitPatterns: Record<string, number[]> = {
    '0': [1, 1, 1, 0, 1, 1, 1],
    '1': [0, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 1, 1, 0, 1],
    '3': [1, 0, 1, 1, 0, 1, 1],
    '5': [1, 1, 0, 1, 0, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
  };

  const drawDigit = (bx: number, by: number, digit: string) => {
    const fillRect = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const idx = ((by + y) * imgW + (bx + x)) * 4;
          data[idx] = 255;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
    };

    if (digit === '7') {
      fillRect(2, 1, 9, 2);   // top horizontal
      fillRect(8, 2, 10, 9);  // upper right vertical
      fillRect(6, 8, 8, 16);  // diagonal stem passing near center (x: 6-8, y: 8-16)
      return;
    }

    const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
    if (bits[0]) fillRect(2, 1, 9, 2);
    if (bits[1]) fillRect(1, 2, 3, 9);
    if (bits[2]) fillRect(8, 2, 10, 9);
    if (bits[3]) fillRect(2, 8, 9, 10);
    if (bits[4]) fillRect(1, 9, 3, 16);
    if (bits[5]) fillRect(8, 9, 10, 16);
    if (bits[6]) fillRect(2, 15, 9, 17);
  };

  const drawNumber = (startX: number, startY: number, numStr: string) => {
    for (let i = 0; i < numStr.length; i++) {
      drawDigit(startX + i * 15, startY, numStr[i]);
    }
  };

  // Top row:
  // Left (상가/북가: 0097 - 4 digits with diagonal 7)
  // Center (대가/서가: 301 - 3 digits)
  // Right (하가/남가: 0250 - 4 digits)
  drawNumber(15, 15, '0097');
  drawNumber(105, 15, '301');
  drawNumber(195, 15, '0250');
  // Bottom row:
  // Center (내자리/동가: 0352 - rank 0 + 352)
  drawNumber(105, 52, '0352');

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  expect(result.map(c => c.raw)).toEqual(['352', '0250', '301', '0097']);
});

test('accurately separates 9 from 8 in 0097 under bottom bar bleed', () => {
  const imgW = 280;
  const imgH = 85;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  const bitPatterns: Record<string, number[]> = {
    '0': [1, 1, 1, 0, 1, 1, 1],
    '1': [0, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 1, 1, 0, 1],
    '3': [1, 0, 1, 1, 0, 1, 1],
    '5': [1, 1, 0, 1, 0, 1, 1],
    '7': [1, 0, 1, 0, 0, 1, 0],
  };

  const drawDigit = (bx: number, by: number, digit: string) => {
    const fillRect = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const idx = ((by + y) * imgW + (bx + x)) * 4;
          data[idx] = 255;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
    };

    if (digit === '9') {
      // 9 has top(0), upper-left(1), upper-right(2), middle(3), lower-right(5), bottom(6)
      // and NO lower-left(4). Bottom bar is thick (y: 14 to 17).
      fillRect(2, 1, 9, 2);
      fillRect(1, 2, 3, 9);
      fillRect(8, 2, 10, 9);
      fillRect(2, 8, 9, 10);
      fillRect(8, 9, 10, 16);
      fillRect(2, 14, 9, 17); // Thick bottom bar
      return;
    }

    const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
    if (bits[0]) fillRect(2, 1, 9, 2);
    if (bits[1]) fillRect(1, 2, 3, 9);
    if (bits[2]) fillRect(8, 2, 10, 9);
    if (bits[3]) fillRect(2, 8, 9, 10);
    if (bits[4]) fillRect(1, 9, 3, 16);
    if (bits[5]) fillRect(8, 9, 10, 16);
    if (bits[6]) fillRect(2, 15, 9, 17);
  };

  const drawNumber = (startX: number, startY: number, numStr: string) => {
    for (let i = 0; i < numStr.length; i++) drawDigit(startX + i * 15, startY, numStr[i]);
  };

  drawNumber(15, 15, '0097');
  drawNumber(105, 15, '301');
  drawNumber(195, 15, '0250');
  drawNumber(105, 52, '0352');

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  // Must NOT read 0087 (99,000 pts) instead of 0097
  expect(result.map(c => c.raw)).toEqual(['352', '0250', '301', '0097']);
});

test('recognizes tilted T-shaped layout under smartphone roll (±15 degrees)', () => {
  const imgW = 320;
  const imgH = 110;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  const drawBox = (bx: number, by: number) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 10; x++) {
        const idx = ((by + y) * imgW + (bx + x)) * 4;
        data[idx] = 255;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
  };

  const drawNumber = (startX: number, startY: number, count: number) => {
    for (let i = 0; i < count; i++) drawBox(startX + i * 14, startY);
  };

  // Smartphone is rolled/tilted clockwise: Left display (상가) is tilted UP, Right display (하가) is tilted DOWN
  // Left (상가/북): x=20, y=10
  // Top-center (대가/서): x=120, y=25
  // Right (하가/남): x=230, y=45 (notice y=45 is lower than top-center!)
  // Bottom-center (내자리/동): x=120, y=70 (clearly lowest in the center)
  drawNumber(20, 10, 4);
  drawNumber(120, 25, 3);
  drawNumber(230, 45, 4);
  drawNumber(120, 70, 4);

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  // Order must still be [bottom (동), right (남), top (서), left (북)]
  expect(result.length).toBe(4);
  // Bottom display sliced rank -> 3 digits
  expect(result[0].raw.length).toBe(3);
  // Right display -> 4 digits
  expect(result[1].raw.length).toBe(4);
  // Top display -> 3 digits
  expect(result[2].raw.length).toBe(3);
  // Left display -> 4 digits
  expect(result[3].raw.length).toBe(4);
});

test('recovers washed-out digits under heavy glare using adaptive red threshold fallback', () => {
  const imgW = 280;
  const imgH = 85;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  // Use washed-out glare red color: r=172, g=110, b=100
  // (Fails strict r > 180, but passes adaptive r > 160 && r > g * 1.4 && r > b * 1.2)
  const drawBox = (bx: number, by: number) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 10; x++) {
        const idx = ((by + y) * imgW + (bx + x)) * 4;
        data[idx] = 172;
        data[idx + 1] = 110;
        data[idx + 2] = 100;
        data[idx + 3] = 255;
      }
    }
  };

  const drawNumber = (startX: number, startY: number, count: number) => {
    for (let i = 0; i < count; i++) drawBox(startX + i * 14, startY);
  };

  drawNumber(15, 15, 4);
  drawNumber(105, 15, 3);
  drawNumber(195, 15, 4);
  drawNumber(105, 52, 4);

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  expect(result.every(c => c.confidence > 0)).toBe(true);
});

test('recognizes negative score (hakoten) with horizontal minus bar on AMOS REXX 3', () => {
  const imgW = 280;
  const imgH = 90;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  const bitPatterns: Record<string, number[]> = {
    '0': [1, 1, 1, 0, 1, 1, 1],
    '1': [0, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 1, 1, 0, 1],
    '3': [1, 0, 1, 1, 0, 1, 1],
    '5': [1, 1, 0, 1, 0, 1, 1],
  };

  const fillRect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const idx = (y * imgW + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
  };

  const drawDigit = (bx: number, by: number, digit: string) => {
    const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
    if (bits[0]) fillRect(bx + 2, by + 1, bx + 9, by + 2);
    if (bits[1]) fillRect(bx + 1, by + 2, bx + 3, by + 9);
    if (bits[2]) fillRect(bx + 8, by + 2, bx + 10, by + 9);
    if (bits[3]) fillRect(bx + 2, by + 8, bx + 9, by + 10);
    if (bits[4]) fillRect(bx + 1, by + 9, bx + 3, by + 16);
    if (bits[5]) fillRect(bx + 8, by + 9, bx + 10, by + 16);
    if (bits[6]) fillRect(bx + 2, by + 15, bx + 9, by + 17);
  };

  const drawMinus = (bx: number, by: number) => {
    // Horizontal minus bar: w=10 (bx+1 to bx+10), h=3 (by+8 to by+10)
    // tail area = 30 >= 12
    fillRect(bx + 1, by + 8, bx + 10, by + 10);
  };

  const drawNumber = (startX: number, startY: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '-') {
        drawMinus(startX + i * 15, startY);
      } else {
        drawDigit(startX + i * 15, startY, str[i]);
      }
    }
  };

  // Top row:
  // Left (상가/북가): 0320 (32,000 pts)
  // Center (대가/서가): 0350 (35,000 pts)
  // Right (하가/남가): 0350 (35,000 pts)
  drawNumber(15, 15, '0320');
  drawNumber(105, 15, '0350');
  drawNumber(195, 15, '0350');
  // Bottom row:
  // Center (내자리/동가): -020 (-2,000 pts)
  drawNumber(105, 52, '-020');

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  // Expected order: [bottom (내자리), right (하가), top (대가), left (상가)]
  expect(result.map(c => c.raw)).toEqual(['-020', '0350', '0350', '0320']);

  const draft = validateScoreDraft(result.map(c => c.raw), 100, '100000', [0, 1, 2, 3], 4);
  expect(draft.valid).toBe(true);
  expect(draft.total).toBe(100000);
  expect(draft.scores).toEqual(['-2000', '35000', '35000', '32000']);
});

test('distinguishes digit 0 from 8 under severe optical bloom and light bleeding', () => {
  const imgW = 280, imgH = 90;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  const bitPatterns: Record<string, number[]> = {
    '0': [1, 1, 1, 0, 1, 1, 1],
    '1': [0, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 1, 1, 0, 1],
    '3': [1, 0, 1, 1, 0, 1, 1],
    '4': [0, 1, 1, 1, 0, 1, 0],
    '5': [1, 1, 0, 1, 0, 1, 1],
    '6': [1, 1, 0, 1, 1, 1, 1],
    '7': [1, 0, 1, 0, 0, 1, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
  };

  const fillRect = (bx: number, by: number, x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const idx = ((by + y) * imgW + (bx + x)) * 4;
        data[idx] = 255;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
  };

  const drawDigit = (bx: number, by: number, digit: string, hasMiddleBloom = false) => {
    const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
    if (bits[0]) fillRect(bx, by, 2, 1, 9, 2);
    if (bits[1]) fillRect(bx, by, 1, 2, 3, 9);
    if (bits[2]) fillRect(bx, by, 8, 2, 10, 9);
    if (bits[3]) fillRect(bx, by, 2, 8, 9, 10);
    if (bits[4]) fillRect(bx, by, 1, 9, 3, 16);
    if (bits[5]) fillRect(bx, by, 8, 9, 10, 16);
    if (bits[6]) fillRect(bx, by, 2, 15, 9, 17);

    // If bloom is present in digit '0', simulate light bleed into middle bar
    if (hasMiddleBloom && !bits[3]) {
      fillRect(bx, by, 3, 8, 6, 9);
    }
  };

  const drawNumber = (startX: number, startY: number, numStr: string, bloomIndex = -1) => {
    for (let i = 0; i < numStr.length; i++) {
      drawDigit(startX + i * 15, startY, numStr[i], i === bloomIndex);
    }
  };

  // Top row: Left (0320), Center (0350), Right (0350)
  drawNumber(15, 15, '0320');
  drawNumber(105, 15, '0350');
  drawNumber(195, 15, '0350');
  // Bottom row: Center (0250 with blooming 0 at index 3)
  drawNumber(105, 52, '0250', 3);

  const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
  // Bottom score must be accurately recognized as '250', NOT '258'!
  expect(result[0].raw).toBe('250');
  expect(result.every(c => c.confidence >= 0.75)).toBe(true);
});

describe('adaptive Otsu red thresholding fallback', () => {
  test('computeOtsuRedThreshold clamps within [minBound, maxBound]', () => {
    // Empty image returns minBound
    const emptyImg = { width: 50, height: 50, data: new Uint8ClampedArray(50 * 50 * 4) };
    expect(computeOtsuRedThreshold(emptyImg, 35, 120)).toBe(35);

    // Image with distinct foreground red dominance
    const imgW = 100, imgH = 100;
    const data = new Uint8ClampedArray(imgW * imgH * 4);
    // Background: dark gray (R=30, G=30, B=30)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 30; data[i + 1] = 30; data[i + 2] = 30; data[i + 3] = 255;
    }
    // Foreground: 200 red pixels with R=150, G=50, B=50 (diff = 100)
    for (let i = 0; i < 200 * 4; i += 4) {
      data[i] = 150; data[i + 1] = 50; data[i + 2] = 50; data[i + 3] = 255;
    }
    const thresh = computeOtsuRedThreshold({ width: imgW, height: imgH, data }, 35, 120);
    expect(thresh).toBeGreaterThanOrEqual(35);
    expect(thresh).toBeLessThanOrEqual(120);
  });

  test('recognizes low-contrast red display via adaptive Otsu fallback where strict pass fails', () => {
    // Create an image where red digits have lower saturation:
    // R = 150, G = 80, B = 80 -> fails strict (R <= 180, R/G = 1.875)
    // and fails glare (R <= 160)
    // but diff R - max(G,B) = 70 > Otsu threshold
    const imgW = 260, imgH = 80;
    const data = new Uint8ClampedArray(imgW * imgH * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 20; data[i + 1] = 20; data[i + 2] = 20; data[i + 3] = 255;
    }

    const bitPatterns: Record<string, number[]> = {
      '0': [1, 1, 1, 0, 1, 1, 1],
      '2': [1, 0, 1, 1, 1, 0, 1],
      '3': [1, 0, 1, 1, 0, 1, 1],
      '5': [1, 1, 0, 1, 0, 1, 1],
    };

    const fillRect = (bx: number, by: number, x1: number, y1: number, x2: number, y2: number) => {
      for (let y = by + y1; y <= by + y2; y++) {
        for (let x = bx + x1; x <= bx + x2; x++) {
          const idx = (y * imgW + x) * 4;
          data[idx] = 150;     // R
          data[idx + 1] = 80;  // G
          data[idx + 2] = 80;  // B
          data[idx + 3] = 255;
        }
      }
    };

    const drawDigit = (bx: number, by: number, digit: string) => {
      const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
      if (bits[0]) fillRect(bx, by, 2, 1, 9, 2);
      if (bits[1]) fillRect(bx, by, 1, 2, 3, 9);
      if (bits[2]) fillRect(bx, by, 8, 2, 10, 9);
      if (bits[3]) fillRect(bx, by, 2, 8, 9, 10);
      if (bits[4]) fillRect(bx, by, 1, 9, 3, 16);
      if (bits[5]) fillRect(bx, by, 8, 9, 10, 16);
      if (bits[6]) fillRect(bx, by, 2, 15, 9, 17);
    };

    const drawNumber = (startX: number, startY: number, numStr: string) => {
      for (let i = 0; i < numStr.length; i++) {
        drawDigit(startX + i * 15, startY, numStr[i]);
      }
    };

    // Draw REXX 3 layout with low-contrast red
    drawNumber(15, 15, '0320');
    drawNumber(105, 15, '0350');
    drawNumber(195, 15, '0350');
    drawNumber(105, 52, '0250');

    const metrics: RecognitionMetrics = { redPixelCount: 0, digitGroupCount: 0 };
    const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3', metrics);

    expect(result.map(c => c.raw)).toEqual(['250', '0350', '0350', '0320']);
    expect(metrics.modeUsed).toBe('adaptive');

    const legacyMetrics: RecognitionMetrics = { redPixelCount: 0, digitGroupCount: 0 };
    const legacyResult = recognizeScoreboardLegacy({ width: imgW, height: imgH, data }, 'amos_rexx3', legacyMetrics);
    expect(legacyMetrics.modeUsed).toBe('otsu');
    expect(legacyResult.map(c => c.raw)).toEqual(['250', '0350', '0350', '0320']);
  });
});

describe('Viewfinder ROI crop mapping (TASK-001)', () => {
  test('computes exact video pixel coordinates from DOM viewfinder rect with object-cover scaling', () => {
    // 1080x1920 video rendered in 400x240 container
    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', { value: 1080, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 1920, configurable: true });
    video.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 400, bottom: 240, width: 400, height: 240, x: 0, y: 0, toJSON: () => {},
    });

    // Viewfinder box centered inside container: width 376 (94%), height 192 (80%)
    const vf = document.createElement('div');
    vf.getBoundingClientRect = () => ({
      left: 12, top: 24, right: 388, bottom: 216, width: 376, height: 192, x: 12, y: 24, toJSON: () => {},
    });

    const crop = computeViewfinderCrop(video, vf);
    // Object-cover scale = max(400/1080, 240/1920) = max(0.37037, 0.125) = 0.37037
    // Rendered size: 1080 * (400/1080) = 400, 1920 * (400/1080) = 711.11
    // Offset Y: (240 - 711.11) / 2 = -235.55
    // cropW should be round(376 / 0.37037) = 1015 (near 94% of 1080)
    expect(crop.sWidth).toBeGreaterThan(950);
    expect(crop.sWidth).toBeLessThanOrEqual(1080);
    expect(crop.sHeight).toBeGreaterThan(450);
    expect(crop.sHeight).toBeLessThan(650);
    expect(crop.sx).toBeGreaterThanOrEqual(0);
    expect(crop.sy).toBeGreaterThan(0);
  });

  test('falls back gracefully to centered 94% crop when DOM elements lack bounding rects', () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', { value: 1080, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 1920, configurable: true });

    const crop = computeViewfinderCrop(video, null);
    expect(crop.sWidth).toBe(Math.round(1080 * 0.94));
    expect(crop.sHeight).toBe(Math.round(1920 * 0.50));
    expect(crop.sx).toBe(Math.round((1080 - crop.sWidth) / 2));
    expect(crop.sy).toBe(Math.round((1920 - crop.sHeight) / 2));
  });
});

describe('Digit 0 Optical Flare Rejection (TASK-003)', () => {
  test('rejects optical bloom in digit 0 center to prevent misreading as 8', () => {
    const imgW = 280, imgH = 90;
    const data = new Uint8ClampedArray(imgW * imgH * 4);

    const drawDigitWithBloom = (startX: number, startY: number, digit: string, bloomMiddle = false) => {
      const bitPatterns: Record<string, number[]> = {
        '0': [1, 1, 1, 0, 1, 1, 1],
        '2': [1, 0, 1, 1, 1, 0, 1],
        '5': [1, 1, 0, 1, 0, 1, 1],
        '6': [1, 1, 0, 1, 1, 1, 1],
      };

      const fillRect = (x0: number, y0: number, x1: number, y1: number, rVal = 255) => {
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const idx = ((startY + y) * imgW + (startX + x)) * 4;
            data[idx] = rVal;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
            data[idx + 3] = 255;
          }
        }
      };

      const bits = bitPatterns[digit] || [0, 0, 0, 0, 0, 0, 0];
      if (bits[0]) fillRect(2, 1, 9, 2);
      if (bits[1]) fillRect(1, 2, 3, 9);
      if (bits[2]) fillRect(8, 2, 10, 9);
      if (bits[3]) fillRect(2, 8, 9, 10);
      if (bits[4]) fillRect(1, 9, 3, 16);
      if (bits[5]) fillRect(8, 9, 10, 16);
      if (bits[6]) fillRect(2, 15, 9, 17);

      // Optical bloom: scattered red light spilling into upper cavity, center, and lower cavity
      if (bloomMiddle && digit === '0') {
        fillRect(3, 4, 8, 14, 120); // semi-bright diffuse flare across cavities and middle bar
      }
    };

    const drawNumber = (startX: number, startY: number, numStr: string, bloom = false) => {
      for (let i = 0; i < numStr.length; i++) {
        drawDigitWithBloom(startX + i * 15, startY, numStr[i], bloom);
      }
    };

    // Draw REXX 3 layout where digit '0' has optical flare in middle
    drawNumber(15, 15, '0066', true);
    drawNumber(105, 15, '0250', true);
    drawNumber(195, 15, '0250', true);
    drawNumber(105, 52, '0250', true);

    const result = recognizeScoreboard({ width: imgW, height: imgH, data }, 'amos_rexx3');
    const raw = result.map(c => c.raw);
    // Even with optical bloom, '0' MUST NOT turn into '8'
    expect(raw).toEqual(['250', '0250', '0250', '0066']);
    expect(raw[0]).not.toContain('8');
    expect(raw[3]).not.toContain('8');
  });
});



