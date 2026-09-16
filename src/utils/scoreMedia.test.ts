import { extractLocalFrames, framePixels, rotateFrame } from './scoreMedia';

describe('local score media lifecycle', () => {
  let originalCreate: typeof document.createElement;
  let video: HTMLVideoElement;
  beforeEach(() => {
    originalCreate = document.createElement.bind(document);
    video = originalCreate('video');
    video.load = jest.fn();
    video.pause = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:local-only');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(document, 'createElement').mockImplementation(((tag: string) => tag === 'video' ? video : originalCreate(tag)) as typeof document.createElement);
  });
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

  test('rejects unsupported input before allocating an object URL', async () => {
    await expect(extractLocalFrames(new File(['x'], 'file.txt', { type: 'text/plain' }))).rejects.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  test('decode failure revokes the source and clears video', async () => {
    const pending = extractLocalFrames(new File(['x'], 'sample.mp4', { type: 'video/mp4' }));
    video.dispatchEvent(new Event('error'));
    await expect(pending).rejects.toThrow();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-only');
    expect(video.hasAttribute('src')).toBe(false);
  });
  test('cancellation while loading releases original media', async () => {
    const controller = new AbortController();
    const pending = extractLocalFrames(new File(['x'], 'sample.mp4', { type: 'video/mp4' }), controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(video.hasAttribute('src')).toBe(false);
  });
  test('a stalled decoder times out and releases original media', async () => {
    jest.useFakeTimers();
    const pending = extractLocalFrames(new File(['x'], 'sample.mp4', { type: 'video/mp4' }));
    jest.advanceTimersByTime(20000);
    await expect(pending).rejects.toThrow();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
  test('extracts five bounded frames and releases successful video', async () => {
    Object.defineProperties(video, {
      duration: { value: 10 }, videoWidth: { value: 3840 }, videoHeight: { value: 2160 },
      currentTime: { set: () => { queueMicrotask(() => video.dispatchEvent(new Event('seeked'))); } },
    });
    const drawImage = jest.fn();
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,preview');
    const pending = extractLocalFrames(new File(['x'], 'sample.mp4', { type: 'video/mp4' }));
    video.dispatchEvent(new Event('loadeddata'));
    const frames = await pending;
    expect(frames.map(frame => frame.time)).toEqual([1, 3, 5, 7, 9]);
    expect(frames.every(frame => frame.width === 1920 && frame.height === 1080)).toBe(true);
    expect(drawImage).toHaveBeenCalledTimes(5);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(video.hasAttribute('src')).toBe(false);
  });
  test('rejects remote frames without requesting them', async () => {
    await expect(framePixels({ url: 'https://example.com/photo.jpg', time: 0, width: 100, height: 100 })).rejects.toThrow('local frame');
  });
  test('rotateFrame rejects remote frames without requesting them', async () => {
    await expect(rotateFrame({ url: 'https://example.com/photo.jpg', time: 0, width: 100, height: 100 })).rejects.toThrow('local frame');
  });
  test('rotateFrame rotates canvas by 90 degrees and swaps dimensions', async () => {
    const drawImage = jest.fn();
    const translate = jest.fn();
    const rotate = jest.fn();
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage, translate, rotate,
    } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,rotated');

    const originalImage = window.Image;
    try {
      window.Image = class extends originalImage {
        constructor() {
          super();
          setTimeout(() => {
            Object.defineProperty(this, 'naturalWidth', { value: 640 });
            Object.defineProperty(this, 'naturalHeight', { value: 480 });
            this.dispatchEvent(new Event('load'));
          }, 0);
        }
      } as unknown as typeof Image;

      const rotated = await rotateFrame({ url: 'data:image/jpeg;base64,orig', time: 2.5, width: 640, height: 480 }, 90);
      expect(rotated.url).toBe('data:image/jpeg;base64,rotated');
      expect(rotated.width).toBe(480);
      expect(rotated.height).toBe(640);
      expect(rotated.time).toBe(2.5);
      expect(translate).toHaveBeenCalledWith(240, 320);
      expect(rotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(drawImage).toHaveBeenCalled();
    } finally {
      window.Image = originalImage;
    }
  });
});
