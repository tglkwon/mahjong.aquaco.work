import { startScoreCamera } from './scoreCamera';
import { recognizeScoreboard } from './scoreRecognition';
import { classifyTableModel } from './tableClassifier';

jest.mock('./scoreRecognition', () => ({ recognizeScoreboard: jest.fn() }));
jest.mock('./tableClassifier', () => ({ classifyTableModel: jest.fn() }));

const recognized = recognizeScoreboard as jest.Mock;
let getUserMedia: jest.Mock;
let stop: jest.Mock;
let video: HTMLVideoElement;
let abort: AbortController;
let capture: jest.Mock;
let error: jest.Mock;
let track: EventTarget & { stop: jest.Mock };
const start = (overrides: Partial<Parameters<typeof startScoreCamera>[1]> = {}) => startScoreCamera(video, {
  signal: abort.signal, unit: 100, expected: '100000', players: [0, 1, 2, 3], playerCount: 4,
  onReading: jest.fn(), onCapture: capture, onError: error, ...overrides,
});
const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
const tick = async (time: number) => {
  Object.defineProperty(video, 'currentTime', { configurable: true, value: time / 1000 });
  jest.advanceTimersByTime(200);
  await settle();
};

beforeEach(() => {
  jest.useFakeTimers();
  stop = jest.fn(); capture = jest.fn(); error = jest.fn(); abort = new AbortController();
  track = Object.assign(new EventTarget(), { stop });
  getUserMedia = jest.fn().mockResolvedValue({ getTracks: () => [track], getVideoTracks: () => [track] });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  video = document.createElement('video');
  Object.defineProperties(video, { videoWidth: { value: 960 }, videoHeight: { value: 540 }, readyState: { value: 4 } });
  jest.spyOn(video, 'play').mockResolvedValue();
  jest.spyOn(video, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: jest.fn(), getImageData: jest.fn().mockReturnValue({ width: 960, height: 540, data: new Uint8ClampedArray(0) }),
  } as unknown as CanvasRenderingContext2D);
  jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,capture');
  recognized.mockReturnValue(['102', '0266', '0606', '0026'].map(raw => ({ raw, confidence: .82 })));
  ((classifyTableModel as unknown) as jest.Mock).mockReturnValue({ model: null, confidence: 0 });
});
afterEach(() => { abort.abort(); jest.restoreAllMocks(); jest.clearAllMocks(); jest.useRealTimers(); });

test('captures stable fresh frames once and releases the camera without recording', async () => {
  start(); await settle();
  expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false, video: expect.objectContaining({ facingMode: { ideal: 'environment' } }) }));
  await tick(200);
  expect(capture).not.toHaveBeenCalled();
  await tick(400);
  expect(capture).not.toHaveBeenCalled();
  await tick(600);
  expect(capture).toHaveBeenCalledTimes(1);
  expect(capture.mock.calls[0][0].url).toBe('data:image/jpeg;base64,capture');
  expect(stop).toHaveBeenCalledTimes(1);
  expect(video.srcObject).toBeNull();
  expect(error).not.toHaveBeenCalled();
});

test('repeated polling of one frozen frame never auto captures', async () => {
  start(); await settle();
  for (let i = 0; i < 12; i++) await tick(200);
  expect(capture).not.toHaveBeenCalled();
});

test('wrong total never captures and a stopped session cannot emit a result', async () => {
  recognized.mockReturnValue(['250', '250', '250', '249'].map(raw => ({ raw, confidence: .82 })));
  const cancel = start(); await settle();
  for (let i = 1; i <= 8; i++) await tick(i * 200);
  cancel();
  expect(capture).not.toHaveBeenCalled();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(video.srcObject).toBeNull();
});

test('cancellation during permission request stops the late stream', async () => {
  let resolve!: (stream: unknown) => void;
  getUserMedia.mockImplementation(() => new Promise(done => { resolve = done; }));
  start(); abort.abort();
  resolve({ getTracks: () => [{ stop }] }); await settle();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(video.play).not.toHaveBeenCalled();
  expect(capture).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
});

test('camera permission denial reports recovery and leaves no polling work', async () => {
  getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
  start(); await settle();
  expect(error).toHaveBeenCalledTimes(1);
  expect(capture).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('uses the configured total rather than hard-coding 100000', async () => {
  recognized.mockReturnValue(['300', '300', '300', '300'].map(raw => ({ raw, confidence: .82 })));
  start({ expected: '120000' }); await settle();
  for (let i = 1; i <= 8; i++) await tick(i * 200);
  expect(capture).toHaveBeenCalledTimes(1);
});

test.each([{ players: [0, 0, 2, 3] }, { unit: 7 }])('invalid settings block capture: %j', async settings => {
  start(settings); await settle();
  for (let i = 1; i <= 8; i++) await tick(i * 200);
  expect(capture).not.toHaveBeenCalled();
});

test('interrupted camera stops and reports a recoverable error', async () => {
  start(); await settle();
  track.dispatchEvent(new Event('mute'));
  expect(error).toHaveBeenCalledTimes(1);
  expect(stop).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('a permission request that never resolves times out, and stops a late stream', async () => {
  let resolve!: (stream: unknown) => void;
  getUserMedia.mockImplementation(() => new Promise(done => { resolve = done; }));
  start();
  jest.advanceTimersByTime(21000);
  expect(error).toHaveBeenCalledTimes(1);
  resolve({ getTracks: () => [track] }); await settle();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(video.play).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('cancelling while playback is pending cannot restart frame processing', async () => {
  let resolve!: () => void;
  (video.play as jest.Mock).mockImplementation(() => new Promise<void>(done => { resolve = done; }));
  start(); await settle(); abort.abort(); resolve(); await settle();
  jest.advanceTimersByTime(3000);
  expect(stop).toHaveBeenCalledTimes(1);
  expect(recognized).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('video-frame callbacks sample fresh frames at bounded rate and cancel after one capture', async () => {
  const request = jest.fn().mockReturnValue(9);
  const cancel = jest.fn();
  Object.defineProperties(video, {
    requestVideoFrameCallback: { value: request }, cancelVideoFrameCallback: { value: cancel },
  });
  start(); await settle();
  const deliver = (mediaTime: number) => request.mock.calls[request.mock.calls.length - 1][0](performance.now(), { mediaTime });
  expect(error).not.toHaveBeenCalled();
  expect(request).toHaveBeenCalled();
  deliver(.1);
  for (let i = 0; i < 5; i++) { jest.advanceTimersByTime(200); deliver(.1); }
  expect(recognized).toHaveBeenCalledTimes(1);
  // A new streak is required after the stale frame gap.
  for (let i = 1; i <= 40; i++) { jest.advanceTimersByTime(50); deliver(.1 + i * .05); }
  expect(capture).toHaveBeenCalledTimes(1);
  expect(recognized.mock.calls.length).toBeLessThanOrEqual(12);
  expect(cancel).toHaveBeenCalledWith(9);
  const calls = recognized.mock.calls.length;
  deliver(100);
  expect(recognized).toHaveBeenCalledTimes(calls);
  expect(capture).toHaveBeenCalledTimes(1);
});

test('initializes MediaRecorder and emits onVideoReady on successful capture', async () => {
  const onVideoReady = jest.fn();
  let recorderInstance: any;
  class FakeRecorder {
    static isTypeSupported = jest.fn((type: string) => type === 'video/mp4');
    state = 'inactive';
    stream: any;
    options: any;
    ondataavailable: ((e: any) => void) | null = null;
    onstop: (() => void) | null = null;
    constructor(stream: any, options: any) {
      this.stream = stream;
      this.options = options;
      recorderInstance = this;
    }
    start = jest.fn(() => { this.state = 'recording'; });
    stop = jest.fn(() => {
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob(['fake_video_data'], { type: 'video/mp4' }) });
      this.onstop?.();
    });
  }
  (window as any).MediaRecorder = FakeRecorder;

  start({ onVideoReady });
  await settle();
  expect(recorderInstance.start).toHaveBeenCalledWith(250);

  await tick(200);
  await tick(400);
  await tick(600);

  expect(capture).toHaveBeenCalledTimes(1);
  expect(onVideoReady).toHaveBeenCalledTimes(1);
  expect(onVideoReady).toHaveBeenCalledWith(expect.any(Blob), 'mp4', 'success');
  delete (window as any).MediaRecorder;
});

test('emits onVideoReady with canceled status when user aborts', async () => {
  const onVideoReady = jest.fn();
  let recorderInstance: any;
  class FakeRecorder {
    static isTypeSupported = jest.fn(() => true);
    state = 'inactive';
    ondataavailable: ((e: any) => void) | null = null;
    onstop: (() => void) | null = null;
    constructor() { recorderInstance = this; }
    start = jest.fn(() => { this.state = 'recording'; });
    stop = jest.fn(() => {
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob(['data'], { type: 'video/mp4' }) });
      this.onstop?.();
    });
  }
  (window as any).MediaRecorder = FakeRecorder;

  const cancel = start({ onVideoReady });
  await settle();
  cancel();

  expect(onVideoReady).toHaveBeenCalledTimes(1);
  expect(onVideoReady).toHaveBeenCalledWith(expect.any(Blob), 'mp4', 'canceled');
  delete (window as any).MediaRecorder;
});

test('passes specified table model to recognizeScoreboard', async () => {
  start({ model: 'amos_jp_ex' }); await settle();
  await tick(200);
  expect(recognized).toHaveBeenCalledWith(expect.anything(), 'amos_jp_ex');
});

test('invokes onModelDetected and updates recognition model when a table model is classified', async () => {
  const onModelDetected = jest.fn();
  ((classifyTableModel as unknown) as jest.Mock).mockReturnValue({ model: 'amos_jp_ex', confidence: 0.95 });
  start({ onModelDetected, model: 'amos_rexx3' }); await settle();
  await tick(200);
  expect(onModelDetected).toHaveBeenCalledTimes(1);
  expect(onModelDetected).toHaveBeenCalledWith('amos_jp_ex');
  expect(recognized).toHaveBeenCalledWith(expect.anything(), 'amos_jp_ex');
});

test('does not invoke onModelDetected when confidence is below 0.8', async () => {
  const onModelDetected = jest.fn();
  ((classifyTableModel as unknown) as jest.Mock).mockReturnValue({ model: 'amos_jp_ex', confidence: 0.75 });
  start({ onModelDetected, model: 'amos_rexx3' }); await settle();
  await tick(200);
  expect(onModelDetected).not.toHaveBeenCalled();
  expect(recognized).toHaveBeenCalledWith(expect.anything(), 'amos_rexx3');
});


