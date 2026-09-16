import {
  checkDropStatus,
  cleanServerUrl,
  uploadToMobileDrop,
  DEFAULT_CHUNK_SIZE
} from './mobileDropClient';

describe('mobileDropClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('cleanServerUrl', () => {
    it('prepends https:// if scheme is missing and removes trailing slash', () => {
      expect(cleanServerUrl('example.trycloudflare.com/')).toBe('https://example.trycloudflare.com');
      expect(cleanServerUrl('http://localhost:8899/')).toBe('http://localhost:8899');
      expect(cleanServerUrl('  https://custom.site/path/  ')).toBe('https://custom.site/path');
      expect(cleanServerUrl('')).toBe('');
    });
  });

  describe('checkDropStatus', () => {
    it('returns error if URL or PIN is invalid', async () => {
      const res1 = await checkDropStatus('', '123456');
      expect(res1.ok).toBe(false);

      const res2 = await checkDropStatus('https://example.com', '123');
      expect(res2.ok).toBe(false);
    });

    it('returns ok: true when /status responds with 200', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ready', completed_file: null }),
      } as Response);

      const res = await checkDropStatus('https://drop.example.com', '123456');
      expect(res.ok).toBe(true);
      expect(res.status).toBe('ready');
      expect(global.fetch).toHaveBeenCalledWith('https://drop.example.com/status', expect.anything());
    });

    it('handles network failure gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      const res = await checkDropStatus('https://drop.example.com', '123456');
      expect(res.ok).toBe(false);
      expect(res.message).toContain('Connection refused');
    });
  });

  describe('uploadToMobileDrop', () => {
    it('throws error when serverUrl or pin is missing', async () => {
      const blob = new Blob(['test']);
      await expect(uploadToMobileDrop(blob, 'test.jpg', { serverUrl: '', pin: '123456' })).rejects.toThrow();
      await expect(uploadToMobileDrop(blob, 'test.jpg', { serverUrl: 'https://ex.com', pin: '' })).rejects.toThrow();
    });

    it('uploads a single small chunk and completes successfully', async () => {
      const mockFetch = jest.fn()
        // Chunk upload response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, chunk_index: 0 }),
        } as Response)
        // Complete upload response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, file_path: '/uploads/sample.jpg' }),
        } as Response);

      global.fetch = mockFetch;

      const progressMock = jest.fn();
      const content = new Uint8Array([1, 2, 3, 4, 5]);
      const blob = new Blob([content], { type: 'image/jpeg' });

      const result = await uploadToMobileDrop(blob, 'sample.jpg', {
        serverUrl: 'https://drop.example.com',
        pin: '654321',
        onProgress: progressMock,
      });

      expect(result.success).toBe(true);
      expect(result.filename).toBe('sample.jpg');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify chunk request headers
      const chunkCall = mockFetch.mock.calls[0];
      expect(chunkCall[0]).toBe('https://drop.example.com/upload/chunk');
      expect(chunkCall[1].headers['X-Session-Token']).toBe('654321');
      expect(chunkCall[1].headers['X-Chunk-Index']).toBe('0');
      expect(chunkCall[1].headers['X-Total-Chunks']).toBe('1');
      expect(chunkCall[1].headers['X-File-Name']).toBe('sample.jpg');

      // Verify complete request body
      const completeCall = mockFetch.mock.calls[1];
      expect(completeCall[0]).toBe('https://drop.example.com/upload/complete');
      expect(completeCall[1].headers['X-Session-Token']).toBe('654321');
      const completeBody = JSON.parse(completeCall[1].body);
      expect(completeBody.file_name).toBe('sample.jpg');

      expect(progressMock).toHaveBeenCalledWith(expect.objectContaining({
        percent: 100,
        chunkIndex: 1,
        totalChunks: 1,
      }));
    });

    it('splits large payload into multiple chunks according to chunkSize', async () => {
      const mockFetch = jest.fn()
        // Chunk 0
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, chunk_index: 0 }),
        } as Response)
        // Chunk 1
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, chunk_index: 1 }),
        } as Response)
        // Complete
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      global.fetch = mockFetch;

      const data = new Uint8Array(150);
      const blob = new Blob([data]);

      const result = await uploadToMobileDrop(blob, 'bigfile.mp4', {
        serverUrl: 'https://drop.example.com',
        pin: '112233',
        chunkSize: 100, // force 2 chunks
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 chunks + 1 complete

      const chunk0 = mockFetch.mock.calls[0][1];
      expect(chunk0.headers['X-Chunk-Index']).toBe('0');
      expect(chunk0.headers['X-Total-Chunks']).toBe('2');

      const chunk1 = mockFetch.mock.calls[1][1];
      expect(chunk1.headers['X-Chunk-Index']).toBe('1');
      expect(chunk1.headers['X-Total-Chunks']).toBe('2');
    });

    it('throws error if a chunk upload fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: '유효하지 않거나 만료된 세션 토큰입니다.' }),
      } as Response);

      const blob = new Blob(['data']);
      await expect(
        uploadToMobileDrop(blob, 'fail.jpg', {
          serverUrl: 'https://drop.example.com',
          pin: '999999',
        })
      ).rejects.toThrow('유효하지 않거나 만료된 세션 토큰입니다.');
    });

    it('attaches X-Target-Device header and device in complete payload when device is provided', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, chunk_index: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            target_device: 'jp-ex',
            message: '파일이 PC jp-ex 디렉터리에 안전하게 저장되었습니다.',
          }),
        } as Response);

      global.fetch = mockFetch;

      const blob = new Blob(['test sample']);
      const res = await uploadToMobileDrop(blob, 'jpex_sample.mp4', {
        serverUrl: 'https://drop.example.com',
        pin: '123456',
        device: 'jpex',
      });

      expect(res.success).toBe(true);
      expect(res.targetDevice).toBe('jp-ex');

      const chunkCall = mockFetch.mock.calls[0];
      expect(chunkCall[1].headers['X-Target-Device']).toBe('jpex');

      const completeCall = mockFetch.mock.calls[1];
      expect(completeCall[1].headers['X-Target-Device']).toBe('jpex');
      const completeBody = JSON.parse(completeCall[1].body);
      expect(completeBody.device).toBe('jpex');
    });
  });
});
