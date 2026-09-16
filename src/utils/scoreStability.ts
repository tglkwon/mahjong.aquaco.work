export interface ScoreStability {
  count: number;
  ready: boolean;
}

interface FrameObservation {
  scores: string[];
  timeMs: number;
  key: string;
}

/** A session-local sliding-window frequency consensus tracker over validated video frames. */
export function createScoreStabilityTracker(
  requiredCount = 5,
  requiredSpanMs = 1000,
  windowTtlMs = 1500
) {
  let entries: FrameObservation[] = [];
  let lastTime: number | undefined;
  let captured = false;

  const getCurrentTopCount = (): number => {
    if (entries.length === 0) return 0;
    const counts: Record<string, number> = {};
    let max = 0;
    for (const entry of entries) {
      counts[entry.key] = (counts[entry.key] || 0) + 1;
      if (counts[entry.key] > max) max = counts[entry.key];
    }
    return max;
  };

  return {
    observe(scores: string[], timeMs: number, valid: boolean): ScoreStability {
      if (!Number.isFinite(timeMs)) {
        entries = [];
        lastTime = undefined;
        return { count: 0, ready: false };
      }
      // Reprocessing a frame (or receiving one out of order) is not new evidence.
      if (lastTime !== undefined && timeMs <= lastTime) {
        return { count: getCurrentTopCount(), ready: false };
      }
      lastTime = timeMs;

      // Expire readings older than sliding window TTL
      entries = entries.filter(e => timeMs - e.timeMs <= windowTtlMs);

      if (!valid || scores.length !== 4) {
        return { count: getCurrentTopCount(), ready: false };
      }

      const key = scores.join(',');
      entries.push({ scores: [...scores], timeMs, key });
      const matching = entries.filter(e => e.key === key);
      const count = matching.length;
      const span = timeMs - matching[0].timeMs;

      const ready = !captured && count >= requiredCount && span >= requiredSpanMs;
      if (ready) captured = true;
      return { count, ready };
    },
  };
}

