import { createDiagnosticSession, DiagnosticStageRecord } from './scoreDiagnostic';

describe('scoreDiagnostic', () => {
  it('creates a diagnostic session and records initial and failure frame samples', () => {
    const session = createDiagnosticSession('test_capture_001', {
      width: 1080,
      height: 1920,
      orientation: 'portrait',
      fps: 30,
    }, {
      x: 0,
      y: 480,
      width: 960,
      height: 480,
      scale: 0.5,
    }, 'amos_rexx3');

    const stages1: DiagnosticStageRecord[] = [
      { stage: 'frame_ready', timestampMs: 10, durationMs: 1, success: true },
      { stage: 'red_candidates', timestampMs: 11, durationMs: 2, redPixels: 450, success: true },
      { stage: 'digit_groups', timestampMs: 13, durationMs: 1, digitGroups: 3, success: false, notes: 'Missing 1 group' },
    ];

    session.recordFrame(0, 0.05, stages1);

    const stages2: DiagnosticStageRecord[] = [
      { stage: 'frame_ready', timestampMs: 40, durationMs: 1, success: true },
      { stage: 'red_candidates', timestampMs: 41, durationMs: 2, redPixels: 600, success: true },
      { stage: 'digit_groups', timestampMs: 43, durationMs: 1, digitGroups: 4, success: true },
      { stage: 'decoded', timestampMs: 44, durationMs: 2, decoded: ['250', '250', '250', '250'], success: true },
      { stage: 'score_validated', timestampMs: 46, durationMs: 1, sumValid: true, success: true },
    ];

    session.recordFrame(1, 0.15, stages2);

    const telemetry = session.finalize('consensus_achieved');

    expect(telemetry.captureId).toBe('test_capture_001');
    expect(telemetry.exitReason).toBe('consensus_achieved');
    expect(telemetry.camera.orientation).toBe('portrait');
    expect(telemetry.roi.height).toBe(480);
    expect(telemetry.totalFramesAnalyzed).toBe(2);
    expect(telemetry.initialFrame?.frameIndex).toBe(0);
    expect(telemetry.firstFailureFrame?.frameIndex).toBe(0);
    expect(telemetry.lastFrame?.frameIndex).toBe(1);
    expect(telemetry.lastFrame?.stages.length).toBe(5);
    // Crucial safety check: deviceId must never be present
    expect((telemetry as unknown as Record<string, unknown>).deviceId).toBeUndefined();
  });
});
