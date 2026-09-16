export interface DropUploadOptions {
  serverUrl: string;
  pin: string;
  device?: string;
  chunkSize?: number;
  onProgress?: (progress: {
    loaded: number;
    total: number;
    percent: number;
    chunkIndex: number;
    totalChunks: number;
  }) => void;
  signal?: AbortSignal;
}

export interface DropUploadResult {
  success: boolean;
  filename: string;
  totalSize: number;
  uploadId: string;
  targetDevice?: string;
  serverMessage?: string;
}

export const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB

export function cleanServerUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned) return '';
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned.replace(/\/+$/, '');
}

/**
 * Checks connectivity to the mobile-drop receiver server.
 */
export async function checkDropStatus(
  serverUrl: string,
  pin: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; status?: string; message?: string }> {
  const base = cleanServerUrl(serverUrl);
  if (!base) {
    return { ok: false, message: '서버 URL을 입력해 주세요.' };
  }
  if (!pin || pin.trim().length !== 6) {
    return { ok: false, message: '6자리 보안 PIN 코드를 입력해 주세요.' };
  }

  try {
    const res = await fetch(`${base}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal,
    });

    if (!res.ok) {
      return { ok: false, message: `서버 오류 (HTTP ${res.status})` };
    }

    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      status: data.status || 'ready',
      message: 'mobile-drop 서버에 연결되었습니다.',
    };
  } catch (err: unknown) {
    if (signal?.aborted) {
      return { ok: false, message: '연결 확인이 취소되었습니다.' };
    }
    const msg = err instanceof Error ? err.message : '연결 실패';
    return { ok: false, message: `연결할 수 없습니다: ${msg}` };
  }
}

/**
 * Uploads a file or Blob in 8MB chunks matching mobile-drop's protocol.
 */
export async function uploadToMobileDrop(
  data: Blob | File,
  filename: string,
  options: DropUploadOptions
): Promise<DropUploadResult> {
  const base = cleanServerUrl(options.serverUrl);
  const pin = options.pin.trim();

  if (!base) throw new Error('mobile-drop 서버 URL이 유효하지 않습니다.');
  if (!pin) throw new Error('6자리 보안 PIN이 필요합니다.');
  if (options.signal?.aborted) throw new DOMException('Upload aborted', 'AbortError');

  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const totalSize = data.size;
  const totalChunks = Math.max(1, Math.ceil(totalSize / chunkSize));
  const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let loaded = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (options.signal?.aborted) throw new DOMException('Upload aborted', 'AbortError');

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const chunkBlob = totalSize === 0 ? new Blob([]) : data.slice(start, end);

    const chunkHeaders: Record<string, string> = {
      'X-Session-Token': pin,
      'X-Upload-Id': uploadId,
      'X-Chunk-Index': String(chunkIndex),
      'X-Total-Chunks': String(totalChunks),
      'X-File-Name': encodeURIComponent(filename),
      'X-Total-Size': String(totalSize),
    };
    if (options.device) {
      chunkHeaders['X-Target-Device'] = options.device;
    }

    const chunkResponse = await fetch(`${base}/upload/chunk`, {
      method: 'POST',
      headers: chunkHeaders,
      body: chunkBlob,
      signal: options.signal,
    });

    if (!chunkResponse.ok) {
      const errJson = await chunkResponse.json().catch(() => ({}));
      const errorMsg = errJson.error || `청크 ${chunkIndex + 1} 업로드 실패 (HTTP ${chunkResponse.status})`;
      throw new Error(errorMsg);
    }

    loaded += (end - start);
    const percent = totalSize === 0 ? 100 : Math.min(100, Math.round((loaded / totalSize) * 100));
    options.onProgress?.({
      loaded,
      total: totalSize,
      percent,
      chunkIndex: chunkIndex + 1,
      totalChunks,
    });
  }

  if (options.signal?.aborted) throw new DOMException('Upload aborted', 'AbortError');

  // Send completion notification to assemble file
  const completeHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Token': pin,
  };
  if (options.device) {
    completeHeaders['X-Target-Device'] = options.device;
  }

  const completeResponse = await fetch(`${base}/upload/complete`, {
    method: 'POST',
    headers: completeHeaders,
    body: JSON.stringify({
      upload_id: uploadId,
      file_name: filename,
      total_size: totalSize,
      device: options.device,
    }),
    signal: options.signal,
  });

  if (!completeResponse.ok) {
    const errJson = await completeResponse.json().catch(() => ({}));
    const errorMsg = errJson.error || `최종 파일 병합 실패 (HTTP ${completeResponse.status})`;
    throw new Error(errorMsg);
  }

  const completeData = await completeResponse.json().catch(() => ({}));

  return {
    success: true,
    filename,
    totalSize,
    uploadId,
    targetDevice: completeData.target_device || options.device,
    serverMessage: completeData.message || '전송 완료',
  };
}
