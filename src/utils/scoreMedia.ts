/** Media stays in browser memory; no original or derived frames are uploaded. */
export interface LocalFrame { url: string; time: number; width: number; height: number }

const MAX_BYTES = 150 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const DECODE_TIMEOUT = 20000;
const abortError = () => new DOMException('Media processing cancelled', 'AbortError');

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}

function waitFor(target: EventTarget, event: string, start: () => void, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    const clean = () => {
      clearTimeout(timer);
      target.removeEventListener(event, ready);
      target.removeEventListener('error', failed);
      signal?.removeEventListener('abort', aborted);
    };
    const ready = () => { clean(); resolve(); };
    const failed = () => { clean(); reject(new Error('Cannot decode this media. Please enter scores manually.')); };
    const aborted = () => { clean(); reject(abortError()); };
    target.addEventListener(event, ready, { once: true });
    target.addEventListener('error', failed, { once: true });
    signal?.addEventListener('abort', aborted, { once: true });
    timer = setTimeout(failed, DECODE_TIMEOUT);
    if (signal?.aborted) { aborted(); return; }
    try { start(); } catch (error) { clean(); reject(error); }
  });
}

function capture(source: CanvasImageSource, width: number, height: number, time: number): LocalFrame {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 64 || height < 64 || width * height > 100000000) {
    throw new Error('Unsupported image dimensions. Please enter scores manually.');
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/jpeg', 0.92);
    if (!url.startsWith('data:image/')) throw new Error('Cannot extract this frame.');
    return { url, time, width: canvas.width, height: canvas.height };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function extractLocalFrames(file: File, signal?: AbortSignal): Promise<LocalFrame[]> {
  checkAbort(signal);
  if (!file.size || file.size > MAX_BYTES) throw new Error('Choose a photo or video smaller than 150 MB.');
  const isVideo = file.type.startsWith('video/');
  if (!isVideo && !file.type.startsWith('image/')) throw new Error('Choose a supported photo or video.');
  const url = URL.createObjectURL(file);
  let video: HTMLVideoElement | undefined;
  let photo: HTMLImageElement | undefined;
  try {
    if (!isVideo) {
      photo = new Image();
      await waitFor(photo, 'load', () => { photo!.src = url; }, signal);
      checkAbort(signal);
      return [capture(photo, photo.naturalWidth, photo.naturalHeight, 0)];
    }
    video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    await waitFor(video, 'loadeddata', () => { video!.src = url; video!.load(); }, signal);
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error('Cannot determine video duration.');
    const frames: LocalFrame[] = [];
    // Interior timestamps avoid blank opening/closing frames and seeking exactly to EOF.
    for (const ratio of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      checkAbort(signal);
      const time = video.duration * ratio;
      await waitFor(video, 'seeked', () => { video!.currentTime = time; }, signal);
      checkAbort(signal);
      frames.push(capture(video, video.videoWidth, video.videoHeight, time));
    }
    return frames;
  } finally {
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    if (photo) photo.removeAttribute('src');
    URL.revokeObjectURL(url);
  }
}

export async function framePixels(frame: LocalFrame): Promise<ImageData> {
  // Only our in-memory previews are accepted; never load a caller-supplied remote URL.
  if (!frame.url.startsWith('data:image/')) throw new Error('Expected a local frame.');
  const photo = new Image();
  const canvas = document.createElement('canvas');
  try {
    await waitFor(photo, 'load', () => { photo.src = frame.url; });
    if (photo.naturalWidth > MAX_DIMENSION || photo.naturalHeight > MAX_DIMENSION || photo.naturalWidth < 1 || photo.naturalHeight < 1) {
      throw new Error('Invalid frame size.');
    }
    canvas.width = photo.naturalWidth;
    canvas.height = photo.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    context.drawImage(photo, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    photo.removeAttribute('src');
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function rotateFrame(frame: LocalFrame, degrees: number = 90): Promise<LocalFrame> {
  if (!frame.url.startsWith('data:image/')) throw new Error('Expected a local frame.');
  const photo = new Image();
  const canvas = document.createElement('canvas');
  try {
    await waitFor(photo, 'load', () => { photo.src = frame.url; });
    const rad = ((degrees % 360 + 360) % 360) * (Math.PI / 180);
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const newWidth = Math.round(photo.naturalWidth * cos + photo.naturalHeight * sin);
    const newHeight = Math.round(photo.naturalWidth * sin + photo.naturalHeight * cos);
    if (newWidth > MAX_DIMENSION || newHeight > MAX_DIMENSION || newWidth < 1 || newHeight < 1) {
      throw new Error('Invalid frame size.');
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    context.translate(newWidth / 2, newHeight / 2);
    context.rotate(rad);
    context.drawImage(photo, -photo.naturalWidth / 2, -photo.naturalHeight / 2);
    const url = canvas.toDataURL('image/jpeg', 0.92);
    if (!url.startsWith('data:image/')) throw new Error('Cannot rotate this frame.');
    return { url, time: frame.time, width: newWidth, height: newHeight };
  } finally {
    photo.removeAttribute('src');
    canvas.width = 0;
    canvas.height = 0;
  }
}
