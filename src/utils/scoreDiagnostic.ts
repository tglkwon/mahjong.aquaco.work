export type DiagnosticStage =
  | 'frame_ready'
  | 'red_candidates'
  | 'digit_groups'
  | 'decoded'
  | 'score_validated';

export interface DiagnosticStageRecord {
  stage: DiagnosticStage;
  timestampMs: number;
  durationMs: number;
  redPixels?: number;
  digitGroups?: number;
  decoded?: string[];
  sumValid?: boolean;
  success: boolean;
  notes?: string;
}

export interface DiagnosticFrameSample {
  frameIndex: number;
  timeSec: number;
  stages: DiagnosticStageRecord[];
}

export interface DiagnosticTelemetry {
  captureId: string;
  timestamp: string;
  camera: {
    width: number;
    height: number;
    fps?: number;
    orientation: 'portrait' | 'landscape';
  };
  roi: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  model: string;
  exitReason: 'consensus_achieved' | 'canceled' | 'timeout' | 'failed';
  userAgentModel?: string;
  initialFrame?: DiagnosticFrameSample;
  firstFailureFrame?: DiagnosticFrameSample;
  lastFrame?: DiagnosticFrameSample;
  totalFramesAnalyzed: number;
  totalDurationMs: number;
}

export interface DiagnosticSession {
  recordFrame: (frameIndex: number, timeSec: number, stages: DiagnosticStageRecord[]) => void;
  finalize: (exitReason: 'consensus_achieved' | 'canceled' | 'timeout' | 'failed') => DiagnosticTelemetry;
}

/**
 * Creates a bounded diagnostic session recorder for score recognition failure analysis.
 * Collects lightweight stage telemetry without storing deviceId or bloating memory.
 */
export function createDiagnosticSession(
  captureId: string,
  camera: { width: number; height: number; fps?: number; orientation: 'portrait' | 'landscape' },
  roi: { x: number; y: number; width: number; height: number; scale: number },
  model: string,
  userAgentModel?: string
): DiagnosticSession {
  const startTime = performance.now();
  let initialFrame: DiagnosticFrameSample | undefined;
  let firstFailureFrame: DiagnosticFrameSample | undefined;
  let lastFrame: DiagnosticFrameSample | undefined;
  let totalFramesAnalyzed = 0;

  return {
    recordFrame(frameIndex: number, timeSec: number, stages: DiagnosticStageRecord[]) {
      totalFramesAnalyzed++;
      const sample: DiagnosticFrameSample = {
        frameIndex,
        timeSec,
        stages: [...stages],
      };

      if (!initialFrame) {
        initialFrame = sample;
      }

      const hasFailure = stages.some(s => !s.success);
      if (hasFailure && !firstFailureFrame) {
        firstFailureFrame = sample;
      }

      lastFrame = sample;
    },

    finalize(exitReason: 'consensus_achieved' | 'canceled' | 'timeout' | 'failed'): DiagnosticTelemetry {
      const totalDurationMs = Math.round(performance.now() - startTime);
      return {
        captureId,
        timestamp: new Date().toISOString(),
        camera: { ...camera },
        roi: { ...roi },
        model,
        exitReason,
        userAgentModel,
        initialFrame,
        firstFailureFrame,
        lastFrame,
        totalFramesAnalyzed,
        totalDurationMs,
      };
    },
  };
}
