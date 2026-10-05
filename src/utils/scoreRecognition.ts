export interface ScoreCandidate { raw: string; confidence: number }
interface Box { x: number; y: number; w: number; h: number; area: number; isMinus?: boolean }
const empty = (): ScoreCandidate[] => Array.from({ length: 4 }, () => ({ raw: '', confidence: 0 }));
const patterns = ['1110111', '0010010', '1011101', '1011011', '0111010', '1101011', '1101111', '1010010', '1111111', '1111011'];

export type TableModel = 'amos_rexx3' | 'amos_jp_ex' | 'amos_jp_color';

function rotate90CCW(img: { width: number; height: number; data: Uint8ClampedArray }) {
  const { width: w, height: h, data } = img;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = ((w - 1 - x) * h + y) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
    }
  }
  return { width: h, height: w, data: out };
}

function rotate90CW(img: { width: number; height: number; data: Uint8ClampedArray }) {
  const { width: w, height: h, data } = img;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = (x * h + (h - 1 - y)) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
    }
  }
  return { width: h, height: w, data: out };
}

function isComplete(candidates: ScoreCandidate[]): boolean {
  return candidates.length === 4 && candidates.every(c => c.raw.length > 0 && c.confidence > 0);
}

export interface LuminanceStats {
  bgDominance: number;
  fgDominance: number;
  bgRed: number;
  fgRed: number;
  rangeDominance: number;
  rangeRed: number;
}

export interface RecognitionMetrics {
  redPixelCount: number;
  digitGroupCount: number;
  modeUsed?: 'adaptive' | 'strict' | 'glare' | 'otsu';
  otsuThreshold?: number;
  globalStats?: LuminanceStats;
}

export function estimateLuminanceStats(
  image: { width: number; height: number; data: Uint8ClampedArray },
  step = 3
): LuminanceStats {
  const { width, height, data } = image;
  if (!width || !height || data.length < width * height * 4) {
    return { bgDominance: 0, fgDominance: 0, bgRed: 0, fgRed: 0, rangeDominance: 0, rangeRed: 0 };
  }

  const histD = new Int32Array(256);
  const histR = new Int32Array(256);
  let totalCount = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const d = Math.max(0, r - Math.max(g, b));
      histD[d]++;
      histR[r]++;
      totalCount++;
    }
  }

  if (totalCount === 0) {
    return { bgDominance: 0, fgDominance: 0, bgRed: 0, fgRed: 0, rangeDominance: 0, rangeRed: 0 };
  }

  let accum = 0;
  let bgDominance = 0;
  for (let i = 0; i < 256; i++) {
    accum += histD[i];
    if (accum >= totalCount * 0.40) {
      bgDominance = i;
      break;
    }
  }

  accum = 0;
  let bgRed = 0;
  for (let i = 0; i < 256; i++) {
    accum += histR[i];
    if (accum >= totalCount * 0.40) {
      bgRed = i;
      break;
    }
  }

  accum = 0;
  let fgDominance = 0;
  for (let i = 255; i >= 0; i--) {
    accum += histD[i];
    if (accum >= totalCount * 0.015 || i === 0) {
      fgDominance = i;
      break;
    }
  }

  accum = 0;
  let fgRed = 0;
  for (let i = 255; i >= 0; i--) {
    accum += histR[i];
    if (accum >= totalCount * 0.015 || i === 0) {
      fgRed = i;
      break;
    }
  }

  return {
    bgDominance,
    fgDominance,
    bgRed,
    fgRed,
    rangeDominance: Math.max(0, fgDominance - bgDominance),
    rangeRed: Math.max(0, fgRed - bgRed),
  };
}

export function computeOtsuRedThreshold(
  image: { width: number; height: number; data: Uint8ClampedArray },
  minBound = 35,
  maxBound = 120
): number {
  const { width, height, data } = image;
  if (!width || !height || data.length < width * height * 4) return minBound;

  const histogram = new Int32Array(256);
  let totalCount = 0;
  const step = 2;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 60 && r > g && r > b) {
        const diff = Math.min(255, Math.max(0, r - Math.max(g, b)));
        if (diff > 10) {
          histogram[diff]++;
          totalCount++;
        }
      }
    }
  }

  if (totalCount < 50) return minBound;

  let sumAll = 0;
  for (let i = 0; i < 256; i++) {
    sumAll += i * histogram[i];
  }

  let sumBack = 0;
  let weightBack = 0;
  let maxVariance = 0;
  let optimalThreshold = minBound;

  for (let t = 1; t < 255; t++) {
    weightBack += histogram[t];
    if (weightBack === 0) continue;
    const weightFore = totalCount - weightBack;
    if (weightFore === 0) break;

    sumBack += t * histogram[t];
    const meanBack = sumBack / weightBack;
    const meanFore = (sumAll - sumBack) / weightFore;
    const variance = weightBack * weightFore * (meanBack - meanFore) * (meanBack - meanFore);

    if (variance > maxVariance) {
      maxVariance = variance;
      optimalThreshold = t;
    }
  }

  return Math.max(minBound, Math.min(maxBound, optimalThreshold));
}

export function recognizeUprightAdaptive(
  image: { width: number; height: number; data: Uint8ClampedArray },
  model: TableModel = 'amos_rexx3',
  metrics?: RecognitionMetrics
): ScoreCandidate[] {
  if (!image.width || !image.height || image.data.length !== image.width * image.height * 4) return empty();
  const scale = Math.min(1, 960 / image.width, 960 / image.height);
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);

  const stats = estimateLuminanceStats(image, 3);
  if (metrics) metrics.globalStats = stats;

  // Reject completely flat or non-red frames (e.g. washed out white or pitch black)
  if (stats.rangeDominance < 15 || stats.fgDominance < 20) {
    return empty();
  }

  const mask = new Uint8Array(width * height);
  const joined = new Uint8Array(width * height);
  let redCount = 0;

  // Adaptive candidate mask thresholds
  const threshDom = Math.max(16, Math.round(stats.bgDominance + stats.rangeDominance * 0.22));
  const threshRed = Math.max(38, Math.round(stats.bgRed + stats.rangeRed * 0.18));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (Math.min(image.height - 1, Math.floor(y / scale)) * image.width + Math.min(image.width - 1, Math.floor(x / scale))) * 4;
      const r = image.data[p], g = image.data[p + 1], b = image.data[p + 2];
      const dom = r - Math.max(g, b);

      if (dom >= threshDom && r >= threshRed && r > g * 1.10 && r > b * 1.10) {
        mask[y * width + x] = 1;
        redCount++;
      }
    }
  }

  if (metrics) metrics.redPixelCount = Math.max(metrics.redPixelCount || 0, redCount);
  if (redCount < 40) return empty();

  // Dilate 1px to bridge segment gaps
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!mask[y * width + x]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          joined[(y + dy) * width + x + dx] = 1;
        }
      }
    }
  }

  // Connected component labeling to extract bounding boxes
  const boxes: Box[] = [];
  const queue = new Int32Array(width * height);

  for (let start = 0; start < joined.length; start++) {
    if (!joined[start]) continue;
    let head = 0, tail = 1;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    queue[0] = start;
    joined[start] = 0;

    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const y = Math.floor(p / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (const next of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (next >= 0 && next < joined.length && joined[next]) {
          joined[next] = 0;
          queue[tail++] = next;
        }
      }
    }

    const box: Box = { x: minX + 1, y: minY + 1, w: maxX - minX - 1, h: maxY - minY - 1, area: tail };
    const isDigit = box.h >= 12 && box.h < height * 0.25 && box.w > 2 && box.w < box.h && tail > 25;
    const isMinus = box.w >= 6 && box.w <= 28 && box.h >= 2 && box.h <= 12 && box.w >= box.h * 1.3 && tail >= 12;

    if (isDigit) {
      boxes.push(box);
    } else if (isMinus) {
      boxes.push({ ...box, isMinus: true });
    }
  }

  // Group into horizontal runs
  const groups: Box[][] = [];
  for (const box of boxes.sort((a, b) => a.x - b.x)) {
    const group = groups.find(g => {
      const last = g[g.length - 1];
      if (box.isMinus) return false;
      if (last.isMinus) {
        return box.x - last.x - last.w < Math.max(last.h, box.h) * 1.3
          && box.x > last.x
          && Math.abs(box.y + box.h / 2 - last.y - last.h / 2) < box.h * 0.4
          && last.h < box.h;
      }
      return box.x - last.x - last.w < Math.max(last.h, box.h) * 1.3
        && box.x > last.x
        && Math.abs(box.y + box.h / 2 - last.y - last.h / 2) < Math.min(box.h, last.h) * 0.55
        && box.h / last.h > 0.6
        && box.h / last.h < 1.7;
    });
    if (group) group.push(box); else groups.push([box]);
  }

  const runs = groups.filter(g => g.length >= 2 && g.length <= 4);
  if (metrics) metrics.digitGroupCount = Math.max(metrics.digitGroupCount || 0, runs.length);
  if (runs.length !== 4) return empty();

  const center = (g: Box[]) => ({
    x: (g[0].x + g[g.length - 1].x + g[g.length - 1].w) / 2,
    y: g.reduce((n, b) => n + b.y + b.h / 2, 0) / g.length,
  });

  // Layout 1: AMOS REXX 3 T-shape front panel partitioned by X-axis
  const runsByX = [...runs].sort((a, b) => center(a).x - center(b).x);
  const left = runsByX[0];
  const right = runsByX[3];
  const middleTwo = [runsByX[1], runsByX[2]].sort((a, b) => center(a).y - center(b).y);
  const topCenter = middleTwo[0];
  const bottomCenter = middleTwo[1];

  const isTLayout = (
    center(bottomCenter).y > center(topCenter).y &&
    center(left).x < center(topCenter).x && center(topCenter).x < center(right).x &&
    center(left).x < center(bottomCenter).x && center(bottomCenter).x < center(right).x
  );

  let orderedRuns: Box[][];
  if (isTLayout) {
    orderedRuns = [bottomCenter, right, topCenter, left];
  } else {
    // Layout 2: Diamond / Cross central layout
    const runsByY = [...runs].sort((a, b) => center(a).y - center(b).y);
    const top = runsByY[0], bottom = runsByY[3];
    const sides = [runsByY[1], runsByY[2]].sort((a, b) => center(a).x - center(b).x);
    const minSidesY = Math.min(center(sides[0]).y, center(sides[1]).y);
    const maxSidesY = Math.max(center(sides[0]).y, center(sides[1]).y);

    if (center(top).y >= minSidesY || center(bottom).y <= maxSidesY) return empty();
    if (center(sides[0]).x >= Math.max(center(top).x, center(bottom).x)) return empty();
    if (center(sides[1]).x <= Math.min(center(top).x, center(bottom).x)) return empty();
    if (Math.abs(center(top).x - center(bottom).x) > (top[top.length - 1].x - top[0].x) * 1.6) return empty();

    orderedRuns = [bottom, sides[1], top, sides[0]];
  }

  // 2nd Stage: Decode each score cluster with local baseline re-calibration
  return orderedRuns.map((group, index) => {
    const shouldSliceRank = model === 'amos_rexx3' && index === 0 && group.length === 4 && !group[0].isMinus;

    // Local bounding box for this score display
    const groupMinX = Math.min(...group.map(b => b.x));
    const groupMaxX = Math.max(...group.map(b => b.x + b.w));
    const groupMinY = Math.min(...group.map(b => b.y));
    const groupMaxY = Math.max(...group.map(b => b.y + b.h));

    const padX = Math.round(group[0].h * 0.15);
    const padY = Math.round(group[0].h * 0.15);
    const x0 = Math.max(0, groupMinX - padX);
    const x1 = Math.min(width - 1, groupMaxX + padX);
    const y0 = Math.max(0, groupMinY - padY);
    const y1 = Math.min(height - 1, groupMaxY + padY);

    let localBgSum = 0, localBgCount = 0;
    let localFgSum = 0, localFgCount = 0;

    for (let gy = y0; gy <= y1; gy += 2) {
      for (let gx = x0; gx <= x1; gx += 2) {
        const srcX = Math.min(image.width - 1, Math.floor(gx / scale));
        const srcY = Math.min(image.height - 1, Math.floor(gy / scale));
        const p = (srcY * image.width + srcX) * 4;
        const r = image.data[p], g = image.data[p + 1], b = image.data[p + 2];
        const dom = Math.max(0, r - Math.max(g, b));
        if (mask[gy * width + gx]) {
          localFgSum += dom;
          localFgCount++;
        } else {
          localBgSum += dom;
          localBgCount++;
        }
      }
    }

    const localBg = localBgCount > 0 ? localBgSum / localBgCount : stats.bgDominance;
    const localFg = localFgCount > 0 ? localFgSum / localFgCount : stats.fgDominance;
    const localDelta = Math.max(1, localFg - localBg);

    let digitConfidences: number[] = [];
    const digits = (shouldSliceRank ? group.slice(1) : group).map((box, digitIndex) => {
      if (box.isMinus) return digitIndex === 0 ? '-' : '';
      if (box.w / box.h < 0.33) {
        digitConfidences.push(0.95);
        return '1';
      }

      // Sample raw pixels inside a probe zone within the box
      const sampleZone = (cx: number, cy: number, dx: number, dy: number) => {
        let sumDom = 0, maskCount = 0, total = 0;
        const startY = Math.max(0, Math.floor((cy - dy) * box.h));
        const endY = Math.min(box.h - 1, Math.ceil((cy + dy) * box.h));
        const startX = Math.max(0, Math.floor((cx - dx) * box.w));
        const endX = Math.min(box.w - 1, Math.ceil((cx + dx) * box.w));

        for (let yy = startY; yy <= endY; yy++) {
          for (let xx = startX; xx <= endX; xx++) {
            const imgX = box.x + xx;
            const imgY = box.y + yy;
            const srcX = Math.min(image.width - 1, Math.floor(imgX / scale));
            const srcY = Math.min(image.height - 1, Math.floor(imgY / scale));
            const p = (srcY * image.width + srcX) * 4;
            const r = image.data[p], g = image.data[p + 1], b = image.data[p + 2];
            const dom = Math.max(0, r - Math.max(g, b));
            sumDom += dom;
            if (mask[imgY * width + imgX]) maskCount++;
            total++;
          }
        }
        return {
          avgDom: total > 0 ? sumDom / total : 0,
          density: total > 0 ? maskCount / total : 0,
        };
      };

      // Seven segment zones:
      // 0: top, 1: upper-left, 2: upper-right, 3: middle, 4: lower-left, 5: lower-right, 6: bottom
      const zones = [[.5,.08],[.18,.27],[.82,.25],[.48,.50],[.14,.64],[.78,.73],[.30,.93]];
      const probes = zones.map(([cx, cy], zIndex) => {
        const dx = zIndex === 3 ? 0.06 : (zIndex === 6 ? 0.08 : 0.14);
        const dy = zIndex === 3 ? 0.06 : (zIndex === 4 ? 0.05 : (zIndex === 6 ? 0.06 : 0.09));
        return sampleZone(cx, cy, dx, dy);
      });

      // Sample upper cavity and lower cavity inside the digit
      const upperCavity = sampleZone(0.48, 0.28, 0.08, 0.05);
      const lowerCavity = sampleZone(0.48, 0.72, 0.08, 0.05);
      const cavityAvg = (upperCavity.avgDom + lowerCavity.avgDom) / 2;

      // Outer segments evaluation: [0, 1, 2, 4, 5, 6]
      const outerIndices = [0, 1, 2, 4, 5, 6];
      const isOuterActive = (z: number) => {
        const p = probes[z];
        const contrast = (p.avgDom - localBg) / localDelta;
        const thresh = z === 4 ? 0.38 : (z === 6 ? 0.30 : 0.25);
        return contrast >= thresh || (p.density > thresh && p.avgDom > localBg);
      };

      const outerActiveStates = outerIndices.map(z => isOuterActive(z));
      const activeOuterCount = outerActiveStates.filter(Boolean).length;
      const activeOuterDomSum = outerIndices.reduce((sum, z, i) => sum + (outerActiveStates[i] ? probes[z].avgDom : 0), 0);
      const outerActiveAvg = activeOuterCount > 0 ? activeOuterDomSum / activeOuterCount : 0;

      const bits = zones.map((_, zIndex) => {
        if (zIndex === 3) {
          // Middle bar (Segment G)
          const midProbe = probes[3];
          const midContrast = (midProbe.avgDom - localBg) / localDelta;
          const peakAboveCavity = midProbe.avgDom - cavityAvg;
          const peakContrast = peakAboveCavity / localDelta;

          // If 5 or 6 outer segments are active (digit 0 or 8 or 6 or 9 candidate):
          if (activeOuterCount >= 5) {
            // Optical flare rejection: in digit 0, light bleeds uniformly into middle and cavity.
            // A genuine middle bar requires a sharp contrast peak above surrounding cavities.
            const isLitInLoop = (
              peakContrast >= 0.12 &&
              midProbe.avgDom >= outerActiveAvg * 0.65 &&
              midProbe.density >= 0.35
            );
            return isLitInLoop ? '1' : '0';
          }

          // Otherwise (e.g. digit 4, 2, 3, 5):
          return (midContrast >= 0.30 || midProbe.density >= 0.35) ? '1' : '0';
        }

        return isOuterActive(zIndex) ? '1' : '0';
      }).join('');

      let digit = patterns.indexOf(bits);
      if (digit < 0) {
        if (bits === '1110010' || bits === '1010000' || bits === '1010001' || bits === '1010011' || bits === '1011010') digit = 7;
        else if (bits === '0101111') digit = 6;
        else if (bits === '1111010') digit = 9;
        else if (bits === '0010111' || bits === '0110111') digit = 0;
        else if (bits === '1101010') digit = 5;
      }

      const conf = Math.max(0.70, Math.min(0.98, 0.75 + (outerActiveAvg / Math.max(1, localFg)) * 0.22));
      digitConfidences.push(conf);
      return digit < 0 ? '' : String(digit);
    });

    const avgConf = digitConfidences.length > 0
      ? digitConfidences.reduce((a, b) => a + b, 0) / digitConfidences.length
      : 0.82;
    const roundedConf = Math.round(avgConf * 100) / 100;

    return digits.every(Boolean) ? { raw: digits.join(''), confidence: roundedConf } : { raw: '', confidence: 0 };
  });
}

type ThresholdMode = 'strict' | 'glare' | 'otsu';

export function recognizeUprightLegacy(
  image: { width: number; height: number; data: Uint8ClampedArray },
  model: TableModel = 'amos_rexx3',
  mode: ThresholdMode = 'strict',
  otsuThresh = 45,
  metrics?: RecognitionMetrics
): ScoreCandidate[] {
  if (!image.width || !image.height || image.data.length !== image.width * image.height * 4) return empty();
  const scale = Math.min(1, 960 / image.width, 960 / image.height);
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);
  const mask = new Uint8Array(width * height), joined = new Uint8Array(width * height);
  let redCount = 0;

  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = (Math.min(image.height - 1, Math.floor(y / scale)) * image.width + Math.min(image.width - 1, Math.floor(x / scale))) * 4;
    const r = image.data[p], g = image.data[p + 1], b = image.data[p + 2];
    let isRed = false;
    if (mode === 'strict') {
      isRed = r > 180 && r > g * 1.6 && r > b * 1.35;
    } else if (mode === 'glare') {
      isRed = r > 160 && r > g * 1.4 && r > b * 1.2;
    } else if (mode === 'otsu') {
      isRed = r > 100 && (r - Math.max(g, b)) >= otsuThresh && r > g * 1.15 && r > b * 1.15;
    }
    if (isRed) {
      mask[y * width + x] = 1;
      redCount++;
    }
  }
  if (metrics) metrics.redPixelCount = Math.max(metrics.redPixelCount || 0, redCount);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    if (!mask[y * width + x]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) joined[(y + dy) * width + x + dx] = 1;
  }
  const boxes: Box[] = [], queue = new Int32Array(width * height);
  for (let start = 0; start < joined.length; start++) {
    if (!joined[start]) continue;
    let head = 0, tail = 1, minX = width, maxX = 0, minY = height, maxY = 0;
    queue[0] = start; joined[start] = 0;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (const next of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (next >= 0 && next < joined.length && joined[next]) { joined[next] = 0; queue[tail++] = next; }
      }
    }
    const box: Box = { x: minX + 1, y: minY + 1, w: maxX - minX - 1, h: maxY - minY - 1, area: tail };
    const isDigit = box.h >= 12 && box.h < height * .25 && box.w > 2 && box.w < box.h && tail > 25;
    const isMinus = box.w >= 6 && box.w <= 28 && box.h >= 2 && box.h <= 12 && box.w >= box.h * 1.3 && tail >= 12;
    if (isDigit) {
      boxes.push(box);
    } else if (isMinus) {
      boxes.push({ ...box, isMinus: true });
    }
  }
  // Build horizontal runs. Gaps between separate score displays exceed digit spacing.
  const groups: Box[][] = [];
  for (const box of boxes.sort((a, b) => a.x - b.x)) {
    const group = groups.find(g => {
      const last = g[g.length - 1];
      if (box.isMinus) return false;
      if (last.isMinus) {
        return box.x - last.x - last.w < Math.max(last.h, box.h) * 1.3
          && box.x > last.x
          && Math.abs(box.y + box.h / 2 - last.y - last.h / 2) < box.h * 0.4
          && last.h < box.h;
      }
      return box.x - last.x - last.w < Math.max(last.h, box.h) * 1.3
        && box.x > last.x
        && Math.abs(box.y + box.h / 2 - last.y - last.h / 2) < Math.min(box.h, last.h) * 0.55
        && box.h / last.h > 0.6
        && box.h / last.h < 1.7;
    });
    if (group) group.push(box); else groups.push([box]);
  }
  const runs = groups.filter(g => g.length >= 2 && g.length <= 4);
  if (metrics) metrics.digitGroupCount = Math.max(metrics.digitGroupCount || 0, runs.length);
  if (runs.length !== 4) return empty();
  const center = (g: Box[]) => ({ x: (g[0].x + g[g.length - 1].x + g[g.length - 1].w) / 2, y: g.reduce((n, b) => n + b.y + b.h / 2, 0) / g.length });

  // Layout 1: AMOS REXX 3 T-shape front panel partitioned by X-axis
  const runsByX = [...runs].sort((a, b) => center(a).x - center(b).x);
  const left = runsByX[0];
  const right = runsByX[3];
  const middleTwo = [runsByX[1], runsByX[2]].sort((a, b) => center(a).y - center(b).y);
  const topCenter = middleTwo[0];
  const bottomCenter = middleTwo[1];

  const isTLayout = (
    center(bottomCenter).y > center(topCenter).y &&
    center(left).x < center(topCenter).x && center(topCenter).x < center(right).x &&
    center(left).x < center(bottomCenter).x && center(bottomCenter).x < center(right).x
  );

  let orderedRuns: Box[][];
  if (isTLayout) {
    orderedRuns = [bottomCenter, right, topCenter, left];
  } else {
    // Layout 2: Diamond / Cross central layout
    const runsByY = [...runs].sort((a, b) => center(a).y - center(b).y);
    const top = runsByY[0], bottom = runsByY[3];
    const sides = [runsByY[1], runsByY[2]].sort((a, b) => center(a).x - center(b).x);
    const minSidesY = Math.min(center(sides[0]).y, center(sides[1]).y);
    const maxSidesY = Math.max(center(sides[0]).y, center(sides[1]).y);

    if (center(top).y >= minSidesY || center(bottom).y <= maxSidesY) return empty();
    if (center(sides[0]).x >= Math.max(center(top).x, center(bottom).x)) return empty();
    if (center(sides[1]).x <= Math.min(center(top).x, center(bottom).x)) return empty();
    if (Math.abs(center(top).x - center(bottom).x) > (top[top.length - 1].x - top[0].x) * 1.6) return empty();

    orderedRuns = [bottom, sides[1], top, sides[0]];
  }
  return orderedRuns.map((group, index) => {
    const shouldSliceRank = model === 'amos_rexx3' && index === 0 && group.length === 4 && !group[0].isMinus;
    let digitConfidences: number[] = [];
    const digits = (shouldSliceRank ? group.slice(1) : group).map((box, digitIndex) => {
      if (box.isMinus) return digitIndex === 0 ? '-' : '';
      if (box.w / box.h < .33) {
        digitConfidences.push(0.95);
        return '1';
      }

      const zones = [[.5,.08],[.18,.27],[.82,.25],[.48,.50],[.14,.64],[.78,.73],[.30,.93]];
      const densities = zones.map(([cx, cy], zIndex) => {
        const dx = zIndex === 3 ? .06 : (zIndex === 6 ? .08 : .14);
        const dy = zIndex === 3 ? .06 : (zIndex === 4 ? .05 : (zIndex === 6 ? .06 : .09));
        let count = 0, total = 0;
        for (let yy = Math.max(0, Math.floor((cy - dy) * box.h)); yy <= Math.min(box.h - 1, Math.ceil((cy + dy) * box.h)); yy++)
          for (let xx = Math.max(0, Math.floor((cx - dx) * box.w)); xx <= Math.min(box.w - 1, Math.ceil((cx + dx) * box.w)); xx++) { count += mask[(box.y + yy) * width + box.x + xx]; total++; }
        return total > 0 ? count / total : 0;
      });

      const outerIndices = [0, 1, 2, 4, 5, 6];
      const outerAvg = outerIndices.reduce((sum, idx) => sum + densities[idx], 0) / outerIndices.length;

      const bits = zones.map((_, zIndex) => {
        const density = densities[zIndex];
        if (zIndex === 3) {
          if (outerAvg >= 0.45) {
            return density >= Math.max(0.45, outerAvg * 0.70) ? '1' : '0';
          }
          return density > 0.40 ? '1' : '0';
        }
        const threshold = zIndex === 4 ? .38 : (zIndex === 6 ? .30 : .25);
        return density > threshold ? '1' : '0';
      }).join('');

      let digit = patterns.indexOf(bits);
      if (digit < 0) {
        if (bits === '1110010' || bits === '1010000' || bits === '1010001' || bits === '1010011' || bits === '1011010') digit = 7;
        else if (bits === '0101111') digit = 6;
        else if (bits === '1111010') digit = 9;
        else if (bits === '0010111' || bits === '0110111') digit = 0;
        else if (bits === '1101010') digit = 5;
      }

      const conf = Math.max(0.70, Math.min(0.98, 0.75 + outerAvg * 0.22));
      digitConfidences.push(conf);
      return digit < 0 ? '' : String(digit);
    });

    const avgConf = digitConfidences.length > 0
      ? digitConfidences.reduce((a, b) => a + b, 0) / digitConfidences.length
      : 0.82;
    const roundedConf = Math.round(avgConf * 100) / 100;

    return digits.every(Boolean) ? { raw: digits.join(''), confidence: roundedConf } : { raw: '', confidence: 0 };
  });
}

/** Legacy multi-pass recognizer preserved for comparative benchmarking. */
export function recognizeScoreboardLegacy(
  image: { width: number; height: number; data: Uint8ClampedArray },
  model: TableModel = 'amos_rexx3',
  metrics?: RecognitionMetrics
): ScoreCandidate[] {
  if (!image.width || !image.height || image.data.length !== image.width * image.height * 4) return empty();
  const orientations = [
    image,
    rotate90CCW(image),
    rotate90CW(image),
  ];

  // Pass 1: standard strict red threshold
  for (const img of orientations) {
    const res = recognizeUprightLegacy(img, model, 'strict', 0, metrics);
    if (isComplete(res)) {
      if (metrics) metrics.modeUsed = 'strict';
      return res;
    }
  }

  // Pass 2: adaptive glare-tolerant threshold
  for (const img of orientations) {
    const res = recognizeUprightLegacy(img, model, 'glare', 0, metrics);
    if (isComplete(res)) {
      if (metrics) metrics.modeUsed = 'glare';
      return res;
    }
  }

  // Pass 3: Otsu threshold fallback
  const otsuThreshold = computeOtsuRedThreshold(image, 35, 120);
  if (metrics) metrics.otsuThreshold = otsuThreshold;
  for (const img of orientations) {
    const res = recognizeUprightLegacy(img, model, 'otsu', otsuThreshold, metrics);
    if (isComplete(res)) {
      if (metrics) metrics.modeUsed = 'otsu';
      return res;
    }
  }

  return empty();
}

/** Adaptive score recognizer using two-stage brightness/contrast normalization and raw pixel relative contrast. */
export function recognizeScoreboardAdaptive(
  image: { width: number; height: number; data: Uint8ClampedArray },
  model: TableModel = 'amos_rexx3',
  metrics?: RecognitionMetrics
): ScoreCandidate[] {
  if (!image.width || !image.height || image.data.length !== image.width * image.height * 4) return empty();
  const orientations = [
    image,
    rotate90CCW(image),
    rotate90CW(image),
  ];

  for (const img of orientations) {
    const res = recognizeUprightAdaptive(img, model, metrics);
    if (isComplete(res)) {
      if (metrics) metrics.modeUsed = 'adaptive';
      return res;
    }
  }

  return empty();
}

/** Local, conservative recognizer for red seven-segment displays.
 * Primary path uses adaptive brightness and raw pixel relative contrast.
 * Falls back to legacy multi-pass engine if adaptive is incomplete.
 */
export function recognizeScoreboard(
  image: { width: number; height: number; data: Uint8ClampedArray },
  model: TableModel = 'amos_rexx3',
  metrics?: RecognitionMetrics
): ScoreCandidate[] {
  if (!image.width || !image.height || image.data.length !== image.width * image.height * 4) return empty();

  const adaptiveResult = recognizeScoreboardAdaptive(image, model, metrics);
  if (isComplete(adaptiveResult)) {
    return adaptiveResult;
  }

  // Graceful fallback to legacy cascade
  const legacyResult = recognizeScoreboardLegacy(image, model, metrics);
  if (isComplete(legacyResult)) {
    return legacyResult;
  }

  return empty();
}
