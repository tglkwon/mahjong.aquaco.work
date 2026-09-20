import { LocalFrame } from './scoreMedia';
import { recognizeScoreboard, ScoreCandidate, TableModel } from './scoreRecognition';
import { classifyTableModel } from './tableClassifier';
import { validateScoreDraft } from './scoreDraft';
import { createScoreStabilityTracker } from './scoreStability';

interface ScanOptions {
  signal: AbortSignal;
  unit: number;
  expected: string;
  players: number[];
  playerCount: number;
  model?: TableModel;
  onModelDetected?: (model: TableModel) => void;
  stabilityThreshold?: { count?: number; spanMs?: number };
  onReading: (reading: ScoreCandidate[], count: number) => void;
  onCapture: (frame: LocalFrame, reading: ScoreCandidate[]) => void;
  onVideoReady?: (blob: Blob, ext: string, status: 'success' | 'canceled' | 'failed') => void;
  onError: (error: Error) => void;
}
type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number, metadata: { mediaTime: number }) => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

/** One local scan session. The returned cancel function also covers a pending permission prompt. */
export function startScoreCamera(video: HTMLVideoElement, options: ScanOptions): () => void {
  const source = video as FrameVideo;
  const canvas = document.createElement('canvas');
  const countThreshold = options.stabilityThreshold?.count ?? 3;
  const spanMsThreshold = options.stabilityThreshold?.spanMs ?? 200;
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
  const stop = (reason: 'success' | 'canceled' | 'failed' = 'canceled') => {
    if (stopped) return;
    stopped = true;
    stopReason = reason;
    options.signal.removeEventListener('abort', onAbort);
    if (callbackId !== undefined) source.cancelVideoFrameCallback?.(callbackId);
    clearTimeout(timer); clearInterval(watchdog);
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
      const sy = isPortrait ? Math.round(video.videoHeight * 0.25) : 0;
      const sHeight = isPortrait ? Math.round(video.videoHeight * 0.50) : video.videoHeight;
      const scale = Math.min(1, 960 / Math.max(video.videoWidth, sHeight));
      const width = Math.max(1, Math.round(video.videoWidth * scale));
      const height = Math.max(1, Math.round(sHeight * scale));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('이 브라우저에서 영상 처리를 사용할 수 없습니다.');
      context.drawImage(video, 0, sy, video.videoWidth, sHeight, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      if (options.onModelDetected && !modelDetected) {
        const detected = classifyTableModel(imageData);
        if (detected.model && detected.confidence >= 0.8) {
          modelDetected = true;
          currentModel = detected.model;
          options.onModelDetected(detected.model);
        }
      }
      const reading = recognizeScoreboard(imageData, currentModel);
      const draft = validateScoreDraft(reading.map(value => value.raw), options.unit, options.expected, options.players, options.playerCount);
      // Confidence is a fixed recognizer flag, not a calibrated probability. Require temporal agreement too.
      const stable = tracker.observe(draft.scores, now, draft.valid && reading.every(value => value.raw !== ''));
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
