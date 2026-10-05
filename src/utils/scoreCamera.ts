import { LocalFrame } from './scoreMedia';
import { recognizeScoreboard, ScoreCandidate, TableModel, RecognitionMetrics } from './scoreRecognition';
import { classifyTableModel } from './tableClassifier';
import { validateScoreDraft } from './scoreDraft';
import { createScoreStabilityTracker } from './scoreStability';
import { createDiagnosticSession, DiagnosticSession, DiagnosticStageRecord, DiagnosticTelemetry } from './scoreDiagnostic';

export interface ScanOptions {
  signal: AbortSignal;
  unit: number;
  expected: string;
  players: number[];
  playerCount: number;
  model?: TableModel;
  autoDetectModel?: boolean;
  onModelDetected?: (model: TableModel) => void;
  stabilityThreshold?: { count?: number; spanMs?: number };
  onReading: (reading: ScoreCandidate[], count: number) => void;
  onCapture: (frame: LocalFrame, reading: ScoreCandidate[]) => void;
  onVideoReady?: (blob: Blob, ext: string, status: 'success' | 'canceled' | 'failed', diagnostic?: DiagnosticTelemetry) => void;
  onDiagnosticReady?: (diagnostic: DiagnosticTelemetry) => void;
  onError: (error: Error) => void;
  viewfinderElement?: HTMLElement | null;
  getViewfinderElement?: () => HTMLElement | null;
}
type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number, metadata: { mediaTime: number }) => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

export interface CropRect {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

export function computeViewfinderCrop(
  video: HTMLVideoElement,
  viewfinderEl?: HTMLElement | null
): CropRect {
  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;
  if (!vWidth || !vHeight) {
    return { sx: 0, sy: 0, sWidth: 1, sHeight: 1 };
  }

  const isPortrait = vHeight > vWidth;

  if (viewfinderEl && typeof video.getBoundingClientRect === 'function' && typeof viewfinderEl.getBoundingClientRect === 'function') {
    const videoRect = video.getBoundingClientRect();
    const vfRect = viewfinderEl.getBoundingClientRect();

    if (videoRect.width > 0 && videoRect.height > 0 && vfRect.width > 0 && vfRect.height > 0) {
      const scale = Math.max(videoRect.width / vWidth, videoRect.height / vHeight);
      const renderedW = vWidth * scale;
      const renderedH = vHeight * scale;
      const offsetX = (videoRect.width - renderedW) / 2;
      const offsetY = (videoRect.height - renderedH) / 2;

      const vfLeftRel = vfRect.left - videoRect.left;
      const vfTopRel = vfRect.top - videoRect.top;

      let cropX = Math.round((vfLeftRel - offsetX) / scale);
      let cropY = Math.round((vfTopRel - offsetY) / scale);
      let cropW = Math.round(vfRect.width / scale);
      let cropH = Math.round(vfRect.height / scale);

      cropX = Math.max(0, Math.min(vWidth - 1, cropX));
      cropY = Math.max(0, Math.min(vHeight - 1, cropY));
      cropW = Math.max(1, Math.min(vWidth - cropX, cropW));
      cropH = Math.max(1, Math.min(vHeight - cropY, cropH));

      return { sx: cropX, sy: cropY, sWidth: cropW, sHeight: cropH };
    }
  }

  // Graceful fallback for non-DOM/test/headless environments
  if (isPortrait) {
    const sWidth = Math.round(vWidth * 0.94);
    const sx = Math.round((vWidth - sWidth) / 2);
    const sHeight = Math.round(vHeight * 0.50);
    const sy = Math.round((vHeight - sHeight) / 2);
    return { sx, sy, sWidth, sHeight };
  } else {
    const sWidth = Math.round(vWidth * 0.94);
    const sx = Math.round((vWidth - sWidth) / 2);
    const sHeight = Math.round(vHeight * 0.80);
    const sy = Math.round((vHeight - sHeight) / 2);
    return { sx, sy, sWidth, sHeight };
  }
}

/** One local scan session. The returned cancel function also covers a pending permission prompt. */
export function startScoreCamera(video: HTMLVideoElement, options: ScanOptions): () => void {
  const source = video as FrameVideo;
  const canvas = document.createElement('canvas');
  const countThreshold = options.stabilityThreshold?.count ?? 1;
  const spanMsThreshold = options.stabilityThreshold?.spanMs ?? 0;
  const tracker = createScoreStabilityTracker(countThreshold, spanMsThreshold, 1500);
  let currentModel: TableModel = options.model ?? 'amos_rexx3';
  let modelDetected = false;
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  let recordedChunks: Blob[] = [];
  let recordedExt = 'mp4';
  let stopReason: 'success' | 'canceled' | 'failed' = 'canceled';
  let stopped = false;
  let callbackId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setInterval> | undefined;
  let lastAnalysis = -Infinity;
  let lastMediaTime = -Infinity;
  let lastFresh = performance.now();

  const captureId = `${currentModel}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let diagnosticSession: DiagnosticSession | undefined;
  let lastDiagnostic: DiagnosticTelemetry | undefined;
  let frameIndex = 0;

  const stop = (reason: 'success' | 'canceled' | 'failed' = 'canceled') => {
    if (stopped) return;
    stopped = true;
    stopReason = reason;
    options.signal.removeEventListener('abort', onAbort);
    if (callbackId !== undefined) source.cancelVideoFrameCallback?.(callbackId);
    clearTimeout(timer); clearInterval(watchdog);
    if (diagnosticSession) {
      try {
        const exitReason = reason === 'success' ? 'consensus_achieved' : reason;
        lastDiagnostic = diagnosticSession.finalize(exitReason);
        options.onDiagnosticReady?.(lastDiagnostic);
      } catch { /* ignore */ }
    }
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { /* ignore */ }
    }
    stream?.getTracks().forEach(track => {
      track.removeEventListener('ended', interrupted);
      track.removeEventListener('mute', interrupted);
      track.stop();
    });
    video.pause(); video.srcObject = null;
    canvas.width = canvas.height = 0;
  };
  const onAbort = () => stop('canceled');
  const fail = (error: Error) => {
    if (stopped) return;
    stop('failed'); options.onError(error);
  };
  const interrupted = () => fail(new Error('카메라 영상이 중단되었습니다. 다시 스캔하거나 직접 입력해 주세요.'));
  const schedule = () => {
    if (stopped) return;
    if (typeof source.requestVideoFrameCallback === 'function' && typeof source.cancelVideoFrameCallback === 'function') {
      callbackId = source.requestVideoFrameCallback((_now, metadata) => analyze(metadata.mediaTime));
    } else {
      timer = setTimeout(() => analyze(video.currentTime), 50);
    }
  };
  const analyze = (mediaTime: number) => {
    if (stopped) return;
    const now = performance.now();
    if (video.readyState < 2 || !Number.isFinite(mediaTime) || mediaTime <= lastMediaTime || now - lastAnalysis < 100) {
      schedule(); return;
    }
    lastMediaTime = mediaTime; lastFresh = now; lastAnalysis = now;

    try {
      if (!video.videoWidth || !video.videoHeight) { schedule(); return; }
      const isPortrait = video.videoHeight > video.videoWidth;
      const vfEl = options.getViewfinderElement ? options.getViewfinderElement() : options.viewfinderElement;
      const { sx, sy, sWidth, sHeight } = computeViewfinderCrop(video, vfEl);
      const scale = Math.min(1, 960 / Math.max(sWidth, sHeight));
      const width = Math.max(1, Math.round(sWidth * scale));
      const height = Math.max(1, Math.round(sHeight * scale));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('이 브라우저에서 영상 처리를 사용할 수 없습니다.');
      context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);

      // Auto-classification: ONLY allowed if manual override is NOT active
      const allowAutoDetect = options.autoDetectModel ?? true;
      if (allowAutoDetect && options.onModelDetected && !modelDetected) {
        const detected = classifyTableModel(imageData);
        if (detected.model && detected.confidence >= 0.8) {
          modelDetected = true;
          currentModel = detected.model;
          options.onModelDetected(detected.model);
        }
      }

      if (!diagnosticSession) {
        diagnosticSession = createDiagnosticSession(
          captureId,
          { width: video.videoWidth, height: video.videoHeight, orientation: isPortrait ? 'portrait' : 'landscape' },
          { x: sx, y: sy, width, height, scale },
          currentModel
        );
      }

      const stages: DiagnosticStageRecord[] = [
        { stage: 'frame_ready', timestampMs: now, durationMs: 0, success: true },
      ];

      const t0 = performance.now();
      const metrics: RecognitionMetrics = { redPixelCount: 0, digitGroupCount: 0 };
      const reading = recognizeScoreboard(imageData, currentModel, metrics);
      const tRecog = performance.now() - t0;

      stages.push({
        stage: 'red_candidates',
        timestampMs: now,
        durationMs: Math.round(tRecog * 0.4),
        redPixels: metrics.redPixelCount,
        success: metrics.redPixelCount > 30,
      });

      stages.push({
        stage: 'digit_groups',
        timestampMs: now,
        durationMs: Math.round(tRecog * 0.3),
        digitGroups: metrics.digitGroupCount,
        success: metrics.digitGroupCount === 4,
      });

      const decodedScores = reading.map(value => value.raw);
      const allDecoded = reading.length === 4 && reading.every(value => value.raw !== '' && value.confidence > 0);
      stages.push({
        stage: 'decoded',
        timestampMs: now,
        durationMs: Math.round(tRecog * 0.3),
        decoded: decodedScores,
        success: allDecoded,
      });

      const t1 = performance.now();
      const draft = validateScoreDraft(decodedScores, options.unit, options.expected, options.players, options.playerCount);
      stages.push({
        stage: 'score_validated',
        timestampMs: now,
        durationMs: Math.round(performance.now() - t1),
        sumValid: draft.valid,
        success: draft.valid && allDecoded,
      });

      diagnosticSession.recordFrame(frameIndex++, mediaTime, stages);

      // Strict 3-gate auto-confirmation: layout + sum verification + temporal consensus
      const stable = tracker.observe(draft.scores, now, draft.valid && allDecoded);
      options.onReading(reading, stable.count);
      if (stopped) return;
      if (stable.ready) {
        const url = canvas.toDataURL('image/jpeg', .92);
        if (!url.startsWith('data:image/')) throw new Error('인식한 화면을 보관하지 못했습니다.');
        const frame = { url, time: mediaTime, width, height };
        stop('success'); options.onCapture(frame, reading); return;
      }
    } catch (error) {
      fail(error instanceof Error ? error : new Error('영상 인식에 실패했습니다.')); return;
    }
    schedule();
  };
  options.signal.addEventListener('abort', onAbort, { once: true });
  if (options.signal.aborted) { stop('canceled'); return () => stop('canceled'); }
  watchdog = setInterval(() => {
    if (performance.now() - lastFresh > 20000) fail(new Error('카메라 응답을 기다리는 시간이 길어졌습니다. 다시 스캔하거나 직접 입력해 주세요.'));
  }, 1000);
  void (async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('카메라를 사용할 수 없습니다. HTTPS 주소를 Safari 또는 Chrome에서 열어 주세요.');
      const opened = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      if (stopped) { opened.getTracks().forEach(track => track.stop()); return; }
      stream = opened;
      if (typeof MediaRecorder !== 'undefined') {
        try {
          let mimeType = '';
          if (typeof MediaRecorder.isTypeSupported === 'function') {
            if (MediaRecorder.isTypeSupported('video/mp4')) {
              mimeType = 'video/mp4';
              recordedExt = 'mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
              mimeType = 'video/webm;codecs=vp9';
              recordedExt = 'webm';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
              mimeType = 'video/webm';
              recordedExt = 'webm';
            }
          }
          recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          recorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
              recordedChunks.push(event.data);
            }
          };
            recorder.onstop = () => {
              if (recordedChunks.length > 0 && options.onVideoReady) {
                const mime = recorder?.mimeType || (recordedExt === 'mp4' ? 'video/mp4' : 'video/webm');
                const finalBlob = new Blob(recordedChunks, { type: mime });
                options.onVideoReady(finalBlob, recordedExt, stopReason);
              }
            };
          recorder.start(250);
        } catch {
          recorder = undefined;
        }
      }
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', interrupted);
        track.addEventListener('mute', interrupted);
      });
      video.muted = true; video.playsInline = true; video.srcObject = stream;
      await video.play();
      if (stopped) return;
      lastFresh = performance.now(); schedule();
    } catch (error) {
      const denied = error instanceof DOMException && error.name === 'NotAllowedError';
      fail(new Error(denied ? '카메라 권한을 허용한 뒤 다시 스캔해 주세요. 사진 촬영이나 직접 입력도 가능합니다.' :
        error instanceof Error ? error.message : '카메라를 시작하지 못했습니다.'));
    }
  })();
  return () => stop('canceled');
}
