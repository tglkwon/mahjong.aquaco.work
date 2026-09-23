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

function recognizeUpright(
  image: { width: number; height: number; data: Uint8ClampedArray },
  model: TableModel = 'amos_rexx3',
  adaptiveGlare = false
): ScoreCandidate[] {
  if (!image.width || !image.height || image.data.length !== image.width * image.height * 4) return empty();
  const scale = Math.min(1, 960 / image.width, 960 / image.height);
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);
  const mask = new Uint8Array(width * height), joined = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = (Math.min(image.height - 1, Math.floor(y / scale)) * image.width + Math.min(image.width - 1, Math.floor(x / scale))) * 4;
    const r = image.data[p], g = image.data[p + 1], b = image.data[p + 2];
    const isRed = adaptiveGlare
      ? (r > 160 && r > g * 1.4 && r > b * 1.2)
      : (r > 180 && r > g * 1.6 && r > b * 1.35);
    if (isRed) mask[y * width + x] = 1;
  }
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
  if (runs.length !== 4) return empty();
  const center = (g: Box[]) => ({ x: (g[0].x + g[g.length - 1].x + g[g.length - 1].w) / 2, y: g.reduce((n, b) => n + b.y + b.h / 2, 0) / g.length });

  // Layout 1: AMOS REXX 3 T-shape front panel partitioned by X-axis
  // In tilt/roll situations up to ±15°, X ordering is invariant:
  // runsByX[0]: left (상가/북), runsByX[3]: right (하가/남), middle 2: center (대가/서 top, 내자리/동 bottom)
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
    // T-Shape front panel: [bottom (내자리/동), right (하가/남), top (대가/서), left (상가/북)]
    orderedRuns = [bottomCenter, right, topCenter, left];
  } else {
    // Layout 2: Diamond / Cross central layout (1 top, 2 sides, 1 bottom)
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

      // Seven segment centers: top, upper-left, upper-right, middle,
      // lower-left, lower-right, bottom.
      // Middle bar (zIndex 3) uses centered coordinates (.48, .50) with relative contrast.
      const zones = [[.5,.08],[.18,.27],[.82,.25],[.48,.50],[.14,.64],[.78,.73],[.30,.93]];
      const densities = zones.map(([cx, cy], zIndex) => {
        const dx = zIndex === 3 ? .06 : (zIndex === 6 ? .08 : .14);
        const dy = zIndex === 3 ? .06 : (zIndex === 4 ? .05 : (zIndex === 6 ? .06 : .09));
        let count = 0, total = 0;
        for (let yy = Math.max(0, Math.floor((cy - dy) * box.h)); yy <= Math.min(box.h - 1, Math.ceil((cy + dy) * box.h)); yy++)
          for (let xx = Math.max(0, Math.floor((cx - dx) * box.w)); xx <= Math.min(box.w - 1, Math.ceil((cx + dx) * box.w)); xx++) { count += mask[(box.y + yy) * width + box.x + xx]; total++; }
        return total > 0 ? count / total : 0;
      });

      // Outer active segments average (top, upper-left, upper-right, lower-left, lower-right, bottom)
      const outerIndices = [0, 1, 2, 4, 5, 6];
      const outerAvg = outerIndices.reduce((sum, idx) => sum + densities[idx], 0) / outerIndices.length;

      const bits = zones.map((_, zIndex) => {
        const density = densities[zIndex];
        if (zIndex === 3) {
          // Middle bar (Segment G): Relative contrast against outer segments to eliminate LED flare/bloom
          // In digit 0, outerAvg is high (>=0.45) but middle bar light is only bleeding flare.
          // Require middle bar to have at least 70% of outer average AND >= 0.45 density.
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

/** Local, conservative recognizer for red seven-segment displays.
 * Positions are ordered counter-clockwise from the user's seat (Mahjong turn order):
 * 0: bottom (내 자리 / 동가), 1: right (하가 / 남가), 2: top (대가 / 서가), 3: left (상가 / 북가).
 * For AMOS REXX 3, the bottom display's first digit is rank; only its final three digits are score.
 * Automatically handles portrait (세로 모드) and landscape device orientations.
 */
export function recognizeScoreboard(
  image: { width: number; height: number; data: Uint8ClampedArray },
  model: TableModel = 'amos_rexx3'
): ScoreCandidate[] {
  if (!image.width || !image.height || image.data.length !== image.width * image.height * 4) return empty();
  const orientations = [
    image,
    rotate90CCW(image),
    rotate90CW(image),
  ];

  // Pass 1: standard strict red threshold
  for (const img of orientations) {
    const res = recognizeUpright(img, model, false);
    if (isComplete(res)) return res;
  }

  // Pass 2: adaptive glare-tolerant threshold for washed-out ceiling glare
  for (const img of orientations) {
    const res = recognizeUpright(img, model, true);
    if (isComplete(res)) return res;
  }

  return empty();
}




