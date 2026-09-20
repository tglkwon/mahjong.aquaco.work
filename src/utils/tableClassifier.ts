import { TableModel } from './scoreRecognition';

export interface TableClassificationResult {
  model: TableModel | null;
  confidence: number;
  reason?: string;
}

interface LEDCluster {
  count: number;
  compW: number;
  compH: number;
  aspect: number;
  cx: number;
  cy: number;
}

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

function classifyUpright(image: { width: number; height: number; data: Uint8ClampedArray }): TableClassificationResult {
  const { width: w, height: h, data } = image;
  if (!w || !h || data.length < w * h * 4) {
    return { model: null, confidence: 0, reason: 'Empty or malformed image' };
  }

  // Downsampling / stride 2 for mobile sub-5ms performance
  const step = 2;
  const sw = Math.floor(w / step);
  const sh = Math.floor(h / step);

  const greenMask = new Uint8Array(sw * sh);
  const amberMask = new Uint8Array(sw * sh);

  for (let sy = 0; sy < sh; sy++) {
    const y = sy * step;
    for (let sx = 0; sx < sw; sx++) {
      const x = sx * step;
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      // Green LED: left side of scoreboard (x < w * 0.45)
      // Pure saturated emissive green (g >= 130, g > r * 1.4, g > b * 1.4, (r + b) < g * 1.2)
      if (x < w * 0.45) {
        if (g >= 130 && g > r * 1.4 && g > b * 1.4 && (r + b) < g * 1.2) {
          greenMask[sy * sw + sx] = 1;
        }
      }

      // Amber/Yellow LED: upper-right quadrant of scoreboard (x > w * 0.55, y < h * 0.60)
      // Bright yellow/amber emission (r >= 180, g >= 140, b <= 130, r >= g * 0.85, (r + g) > b * 2.2)
      if (x > w * 0.55 && y < h * 0.60) {
        if (r >= 180 && g >= 140 && b <= 130 && r >= g * 0.85 && (r + g) > b * 2.2) {
          amberMask[sy * sw + sx] = 1;
        }
      }
    }
  }

  function findLEDClusters(mask: Uint8Array): LEDCluster[] {
    const visited = new Uint8Array(sw * sh);
    const clusters: LEDCluster[] = [];
    for (let sy = 0; sy < sh; sy++) {
      for (let sx = 0; sx < sw; sx++) {
        const start = sy * sw + sx;
        if (!mask[start] || visited[start]) continue;
        let count = 0, minX = sx, maxX = sx, minY = sy, maxY = sy;
        const queue = [start];
        visited[start] = 1;
        while (queue.length > 0) {
          const cur = queue.pop()!;
          const cx = cur % sw;
          const cy = Math.floor(cur / sw);
          count++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-neighbors
          const neighbors = [cur - 1, cur + 1, cur - sw, cur + sw];
          for (let i = 0; i < 4; i++) {
            const n = neighbors[i];
            if (n >= 0 && n < sw * sh && mask[n] && !visited[n]) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }
        const compW = (maxX - minX + 1) * step;
        const compH = (maxY - minY + 1) * step;
        const aspect = Math.max(compW, compH) / Math.max(1, Math.min(compW, compH));
        // Compact LED check: 4 <= count <= 150, compW <= 35, compH <= 35, aspect <= 3.5
        // Rejects large table borders, green felt cloth, or tile reflections
        if (count >= 4 && count <= 150 && compW <= 35 && compH <= 35 && aspect <= 3.5) {
          clusters.push({
            count,
            compW,
            compH,
            aspect,
            cx: ((minX + maxX) / 2) * step,
            cy: ((minY + maxY) / 2) * step,
          });
        }
      }
    }
    return clusters;
  }

  const greenClusters = findLEDClusters(greenMask);
  const amberClusters = findLEDClusters(amberMask);

  const hasGreenLED = greenClusters.length > 0;
  const hasAmberLED = amberClusters.length > 0;

  if (hasGreenLED && !hasAmberLED) {
    const best = greenClusters.reduce((a, b) => (a.count > b.count ? a : b));
    const conf = Math.min(0.98, 0.82 + best.count * 0.003);
    return {
      model: 'amos_rexx3',
      confidence: conf,
      reason: `Detected AMOS REXX 3 green CHECK LED cluster at (${Math.round(best.cx)}, ${Math.round(best.cy)})`,
    };
  }

  if (hasAmberLED && !hasGreenLED) {
    const best = amberClusters.reduce((a, b) => (a.count > b.count ? a : b));
    const conf = Math.min(0.98, 0.82 + best.count * 0.003);
    return {
      model: 'amos_jp_ex',
      confidence: conf,
      reason: `Detected AMOS JP-EX amber CHECK LED cluster at (${Math.round(best.cx)}, ${Math.round(best.cy)})`,
    };
  }

  if (hasGreenLED && hasAmberLED) {
    const bestGreen = greenClusters.reduce((a, b) => (a.count > b.count ? a : b));
    const bestAmber = amberClusters.reduce((a, b) => (a.count > b.count ? a : b));
    if (bestGreen.count > bestAmber.count * 2) {
      return { model: 'amos_rexx3', confidence: 0.85, reason: 'Dominant green LED cluster' };
    }
    if (bestAmber.count > bestGreen.count * 2) {
      return { model: 'amos_jp_ex', confidence: 0.85, reason: 'Dominant amber LED cluster' };
    }
    return { model: null, confidence: 0.3, reason: 'Ambiguous LED clusters detected' };
  }

  return { model: null, confidence: 0, reason: 'No characteristic hardware LED detected' };
}

/**
 * Automatically classifies whether a camera frame shows an AMOS REXX 3 or AMOS JP-EX table
 * by detecting hardware CHECK LED markers (green on top-left for REXX 3, amber on top-right for JP-EX).
 */
export function classifyTableModel(image: {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}): TableClassificationResult {
  if (!image.width || !image.height || image.data.length < image.width * image.height * 4) {
    return { model: null, confidence: 0, reason: 'Empty or malformed image' };
  }

  // Pass 1: Upright orientation
  const upright = classifyUpright(image);
  if (upright.model !== null && upright.confidence >= 0.8) {
    return upright;
  }

  // Pass 2: Rotated orientations if in portrait mode or not detected upright
  if (image.width < image.height || upright.model === null) {
    const ccw = classifyUpright(rotate90CCW(image));
    if (ccw.model !== null && ccw.confidence >= 0.8) return ccw;

    const cw = classifyUpright(rotate90CW(image));
    if (cw.model !== null && cw.confidence >= 0.8) return cw;
  }

  return upright;
}
