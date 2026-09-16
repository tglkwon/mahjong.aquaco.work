import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoUploadPanel from './PhotoUploadPanel';
import { extractLocalFrames, framePixels, rotateFrame } from '../utils/scoreMedia';
import { recognizeScoreboard } from '../utils/scoreRecognition';
import { startScoreCamera } from '../utils/scoreCamera';
import { checkDropStatus, uploadToMobileDrop } from '../utils/mobileDropClient';

jest.mock('../utils/scoreMedia', () => ({ extractLocalFrames: jest.fn(), framePixels: jest.fn(), rotateFrame: jest.fn() }));
jest.mock('../utils/scoreRecognition', () => ({ recognizeScoreboard: jest.fn() }));
jest.mock('../utils/scoreCamera', () => ({ startScoreCamera: jest.fn() }));
jest.mock('../utils/mobileDropClient', () => ({
  checkDropStatus: jest.fn(),
  uploadToMobileDrop: jest.fn(),
  cleanServerUrl: (url: string) => url,
}));
const extracted = extractLocalFrames as jest.Mock;
const recognized = recognizeScoreboard as jest.Mock;
const rotated = rotateFrame as jest.Mock;
const setup = (isTestMode = false, onScoresRecognized?: (scores: { east: string; south: string; west: string; north: string }) => void, targetTotalScore?: number) => {
  const append = jest.fn();
  render(
    <PhotoUploadPanel
      getText={key => key}
      playerNames={['A', 'B', 'C', 'D']}
      onConfirm={append}
      onScoresRecognized={onScoresRecognized}
      targetTotalScore={targetTotalScore}
      isTestMode={isTestMode}
    />
  );
  return { append, onScoresRecognized };
};

const triggerCapture = (scores = ['102', '0266', '0606', '0026']) => {
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const calls = (startScoreCamera as jest.Mock).mock.calls;
  const options = calls[calls.length - 1][1];
  const frame = { url: 'data:image/jpeg;base64,test', width: 960, height: 540, time: 2 };
  const reading = scores.map(raw => ({ raw, confidence: .9 }));
  act(() => options.onCapture(frame, reading));
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  (startScoreCamera as jest.Mock).mockReturnValue(jest.fn());
  extracted.mockResolvedValue([{ url: 'data:image/jpeg;base64,test', time: 1, width: 1920, height: 1080 }]);
  rotated.mockResolvedValue({ url: 'data:image/jpeg;base64,rotated', time: 1, width: 1080, height: 1920 });
  (framePixels as jest.Mock).mockResolvedValue({});
  recognized.mockReturnValue(['102', '0266', '0606', '0026'].map(raw => ({ raw, confidence: .9 })));
});

test('renders viewfinder guide card without manual photo capture button or redundant fieldset, and hides PC transfer mode by default', () => {
  setup(false);
  expect(screen.getByLabelText('촬영 가이드')).toBeInTheDocument();
  expect(screen.getByText('동가가 촬영하고 기록합니다.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '📷 점수판 촬영하기' })).toBeNull();
  expect(screen.queryByLabelText('점수판 촬영')).toBeNull();
  expect(screen.queryByRole('button', { name: 'PC 전송 모드 설정 열기' })).toBeNull();
  expect(screen.getByRole('button', { name: '실시간 스캔 시작' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '직접 입력' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '확정하고 기록에 추가' })).toBeNull();
  expect(screen.queryByText('점수 후보 확인')).toBeNull();
  expect(screen.queryByRole('button', { name: '점수 배정 한 자리 이동' })).toBeNull();
});

test('renders PC transfer mode button when isTestMode is true', () => {
  setup(true);
  expect(screen.getByRole('button', { name: 'PC 전송 모드 설정 열기' })).toBeInTheDocument();
});

test('invokes onScoresRecognized directly upon live capture without intermediate review', async () => {
  const onScoresRecognized = jest.fn();
  const { append } = setup(false, onScoresRecognized);
  triggerCapture();

  expect(onScoresRecognized).toHaveBeenCalledTimes(1);
  expect(onScoresRecognized).toHaveBeenCalledWith({
    east: '10200',
    south: '26600',
    west: '60600',
    north: '2600',
  });
  expect(append).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent(/우마·오카 점수 기록표에 즉시 반영되었습니다/);
});

test('falls back to onConfirm upon live capture when onScoresRecognized is not provided', async () => {
  const { append } = setup(false, undefined);
  triggerCapture();

  expect(append).toHaveBeenCalledTimes(1);
  expect(append).toHaveBeenCalledWith(['10200', '26600', '60600', '2600'], [0, 1, 2, 3]);
});

test('passes targetTotalScore prop dynamically to camera options', () => {
  setup(false, jest.fn(), 120000);
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const options = (startScoreCamera as jest.Mock).mock.calls[0][1];
  expect(options.expected).toBe('120000');
});

test('rotates the active frame and re-recognizes scores via onScoresRecognized', async () => {
  const onScoresRecognized = jest.fn();
  setup(false, onScoresRecognized);
  triggerCapture();

  expect(onScoresRecognized).toHaveBeenCalledWith({
    east: '10200',
    south: '26600',
    west: '60600',
    north: '2600',
  });

  recognized.mockReturnValue(['0250', '0250', '0250', '0250'].map(raw => ({ raw, confidence: .9 })));
  fireEvent.click(screen.getByRole('button', { name: '⟲ 90° 회전' }));

  await waitFor(() => {
    expect(rotated).toHaveBeenCalledTimes(1);
    expect(recognized).toHaveBeenCalledTimes(1);
    expect(onScoresRecognized).toHaveBeenCalledWith({
      east: '25000',
      south: '25000',
      west: '25000',
      north: '25000',
    });
  });
});

test('direct manual entry mode guides user to UmaOkaTable', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: '직접 입력' }));
  expect(screen.getByRole('status')).toHaveTextContent(/우마·오카 점수 기록표에서 직접 점수를 입력/);
});

test('stopping scan invalidates pending capture and aborts camera signal', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const options = (startScoreCamera as jest.Mock).mock.calls[0][1];
  fireEvent.click(screen.getByRole('button', { name: '스캔 중지' }));
  expect(options.signal.aborted).toBe(true);
});

test('hidden page cancels live scan and invalidates later readings', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const options = (startScoreCamera as jest.Mock).mock.calls[0][1];
  const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  hidden.mockRestore();
  expect(options.signal.aborted).toBe(true);
  expect(screen.getByRole('status')).toHaveTextContent('화면을 벗어나 스캔을 중지했습니다. 다시 스캔을 시작해 주세요.');
  expect(screen.getByRole('button', { name: '실시간 스캔 시작' })).toBeEnabled();
});

test('unmount cancels a pending scan', () => {
  const view = render(<PhotoUploadPanel getText={key => key} playerNames={['A', 'B', 'C', 'D']} onConfirm={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const options = (startScoreCamera as jest.Mock).mock.calls[0][1];
  view.unmount();
  expect(options.signal.aborted).toBe(true);
});

test('synchronous unsupported-camera error survives later visibility events', () => {
  (startScoreCamera as jest.Mock).mockImplementation((_video, options) => {
    options.onError(new Error('HTTPS에서 카메라를 사용할 수 없습니다.'));
    return jest.fn();
  });
  setup();
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  hidden.mockRestore();
  expect(screen.getByRole('status')).toHaveTextContent('HTTPS에서 카메라를 사용할 수 없습니다.');
});

test('opens PC drop bridge panel, verifies connection, and saves settings', async () => {
  (checkDropStatus as jest.Mock).mockResolvedValue({ ok: true, status: 'ready', message: '연결 성공' });
  setup(true);

  const toggleBtn = screen.getByRole('button', { name: 'PC 전송 모드 설정 열기' });
  fireEvent.click(toggleBtn);

  expect(screen.getByLabelText('PC 전송 모드 설정')).toBeInTheDocument();
  const enableCheckbox = screen.getByLabelText('PC 전송 브리지 사용 활성화');
  fireEvent.click(enableCheckbox);

  const urlInput = screen.getByPlaceholderText('https://xxx.trycloudflare.com');
  const pinInput = screen.getByPlaceholderText('123456');

  fireEvent.change(urlInput, { target: { value: 'https://my-tunnel.trycloudflare.com' } });
  fireEvent.change(pinInput, { target: { value: '654321' } });

  const testBtn = screen.getByRole('button', { name: '연결 확인' });
  fireEvent.click(testBtn);

  await waitFor(() => {
    expect(checkDropStatus).toHaveBeenCalledWith('https://my-tunnel.trycloudflare.com', '654321');
    expect(screen.getByText(/mobile-drop 세션에 정상 연결되었습니다/)).toBeInTheDocument();
  });

  const saved = JSON.parse(localStorage.getItem('mahjong_mobile_drop_config') || '{}');
  expect(saved.enabled).toBe(true);
  expect(saved.serverUrl).toBe('https://my-tunnel.trycloudflare.com');
  expect(saved.pin).toBe('654321');
});

test('triggers uploadToMobileDrop on video ready when PC Drop is enabled', async () => {
  (uploadToMobileDrop as jest.Mock).mockResolvedValue({ success: true, filename: 'test.webm' });
  localStorage.setItem('mahjong_mobile_drop_config', JSON.stringify({
    enabled: true,
    serverUrl: 'https://test-drop.trycloudflare.com',
    pin: '112233',
    autoUpload: true,
  }));

  setup(true);
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const options = (startScoreCamera as jest.Mock).mock.calls[0][1];

  const videoBlob = new Blob(['video-data'], { type: 'video/webm' });
  act(() => {
    options.onVideoReady(videoBlob, 'webm', 'success');
  });

  await waitFor(() => {
    expect(uploadToMobileDrop).toHaveBeenCalledWith(
      videoBlob,
      expect.stringContaining('rex3_scan_'),
      expect.objectContaining({
        serverUrl: 'https://test-drop.trycloudflare.com',
        pin: '112233',
        device: 'rex3',
      })
    );
  });
});

test('supports switching target device and forwarding to uploadToMobileDrop', async () => {
  (uploadToMobileDrop as jest.Mock).mockResolvedValue({
    success: true,
    filename: 'test.webm',
    targetDevice: 'jpex',
  });
  localStorage.setItem('mahjong_mobile_drop_config', JSON.stringify({
    enabled: true,
    serverUrl: 'https://test-drop.trycloudflare.com',
    pin: '112233',
    device: 'rex3',
    autoUpload: true,
  }));

  setup(true);

  const deviceSelect = screen.getByLabelText('테스트 대상 작탁 선택');
  expect(deviceSelect).toHaveValue('rex3');

  fireEvent.change(deviceSelect, { target: { value: 'jpex' } });
  expect(deviceSelect).toHaveValue('jpex');

  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const options = (startScoreCamera as jest.Mock).mock.calls[0][1];

  const videoBlob = new Blob(['jpex-video'], { type: 'video/webm' });
  act(() => {
    options.onVideoReady(videoBlob, 'webm', 'success');
  });

  await waitFor(() => {
    expect(uploadToMobileDrop).toHaveBeenCalledWith(
      videoBlob,
      expect.stringContaining('jpex_scan_'),
      expect.objectContaining({
        serverUrl: 'https://test-drop.trycloudflare.com',
        pin: '112233',
        device: 'jpex',
      })
    );
  });

  const saved = JSON.parse(localStorage.getItem('mahjong_mobile_drop_config') || '{}');
  expect(saved.device).toBe('jpex');
});

test('renders viewfinder HUD with Option A aiming window, 3-dot gauge, and targeted 100ms flash overlay', () => {
  jest.useFakeTimers();
  setup();
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));

  expect(screen.queryByTestId('viewfinder-scrim-top')).toBeNull();
  expect(screen.queryByTestId('viewfinder-scrim-bottom')).toBeNull();
  const roi = screen.getByTestId('viewfinder-roi');
  expect(roi).toBeInTheDocument();
  expect(screen.getByText('🎯 점수판 조준')).toBeInTheDocument();

  const gauge = screen.getByTestId('viewfinder-gauge');
  expect(gauge).toBeInTheDocument();

  const options = (startScoreCamera as jest.Mock).mock.calls[0][1];
  const reading = ['-020', '0350', '0350', '0320'].map(raw => ({ raw, confidence: .82 }));

  act(() => options.onReading(reading, 1));
  expect(gauge).toHaveTextContent('합의');
  expect(roi.querySelector('.border-blue-400')).toBeInTheDocument();

  act(() => options.onReading(reading, 2));
  expect(roi.querySelector('.border-emerald-400')).toBeInTheDocument();

  const frame = { url: 'data:image/jpeg;base64,scan', width: 960, height: 540, time: 2 };
  act(() => options.onCapture(frame, reading));
  const flash = screen.getByTestId('viewfinder-flash');
  expect(flash).toBeInTheDocument();
  expect(roi).toContainElement(flash);

  act(() => {
    jest.advanceTimersByTime(100);
  });
  expect(screen.queryByTestId('viewfinder-flash')).toBeNull();

  jest.useRealTimers();
});
