import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { encodeShareState, parseShareStateFromHash } from '../utils/shareState';
import { startScoreCamera } from '../utils/scoreCamera';

jest.mock('../utils/scoreCamera', () => ({
  startScoreCamera: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.history.pushState({}, '', '/scan_score');
  (startScoreCamera as jest.Mock).mockReturnValue(jest.fn());
});

test('real-time scan consensus automatically injects scores into UmaOkaTable and commits via ControlPanel', () => {
  const encoded = encodeShareState({
    startingScore: 25000,
    returnScore: 30000,
    playerPool: ['A', 'B', 'C', 'D'],
    playerNames: ['A', 'B', 'C', 'D'],
    activeUmaOka: { uma: '1-2', oka: true },
    tieHandlingMode: 'split',
    chomboCounts: [0, 0, 0, 0],
    games: [{
      id: 90,
      isEditable: false,
      scores: { east: '35000', south: '25000', west: '25000', north: '15000' },
      participants: { east: 0, south: 1, west: 2, north: 3 },
    }],
  }, true);

  window.history.pushState({}, '', `/scan_score#d=${encoded}`);
  render(<App />);

  // 우마·오카 가이드 및 플레이어 총점 랭킹 확인
  expect(screen.getByText(/플레이어를 설정하고 점수를 입력한 뒤/)).toBeInTheDocument();
  expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(2);

  // 실시간 스캔 시작 및 캡처 트리거
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const calls = (startScoreCamera as jest.Mock).mock.calls;
  const options = calls[calls.length - 1][1];
  expect(options.expected).toBe('100000');

  const frame = { url: 'data:image/jpeg;base64,test', width: 960, height: 540, time: 2 };
  const reading = ['300', '300', '200', '200'].map(raw => ({ raw, confidence: .9 }));
  act(() => options.onCapture(frame, reading));

  // UmaOkaTable 편집 행에 4자리 변환 점수가 즉시 주입되었는지 확인
  expect(screen.getByLabelText('경기 2 동 점수')).toHaveValue(30000);
  expect(screen.getByLabelText('경기 2 남 점수')).toHaveValue(30000);
  expect(screen.getByLabelText('경기 2 서 점수')).toHaveValue(20000);
  expect(screen.getByLabelText('경기 2 북 점수')).toHaveValue(20000);

  // ControlPanel의 기록 추가 및 공유 버튼으로 확정
  const addRecordButton = screen.getByRole('button', { name: '기록 추가하고 공유하기' });
  expect(addRecordButton).not.toBeDisabled();
  fireEvent.click(addRecordButton);

  // 확정 공유 링크 확인
  const link = screen.getByRole('link', { name: '확정한 기록 공유 링크' }).getAttribute('href')!;
  const state = parseShareStateFromHash(link.slice(link.indexOf('#')), true)!;
  expect(state.playerPool).toEqual(['A', 'B', 'C', 'D']);
  expect(state.games).toHaveLength(2);

  // 총 게임 수 확인
  expect(screen.getByText(/총 2 경기/)).toBeInTheDocument();
});

test('preserves non-default starting score when opening and sharing existing records and dynamically binds target total', () => {
  const encoded = encodeShareState({
    startingScore: 30000,
    returnScore: 30000,
    playerPool: ['A', 'B', 'C', 'D'],
    playerNames: ['A', 'B', 'C', 'D'],
    activeUmaOka: { uma: '1-2', oka: false },
    tieHandlingMode: 'split',
    chomboCounts: [0, 0, 0, 0],
    games: [{
      id: 1,
      isEditable: false,
      scores: { east: '30000', south: '30000', west: '30000', north: '30000' },
      participants: { east: 0, south: 1, west: 2, north: 3 },
    }],
  }, true);

  window.history.pushState({}, '', `/scan_score#d=${encoded}`);
  render(<App />);

  // 시작 점수 30,000 및 동적 목표 합계 120,000 확인
  expect(screen.getByLabelText('시작 점수')).toHaveValue(30000);
  expect(screen.getByText(/120,000/)).toBeInTheDocument();

  // 스캔 시작 시 카메라에 동적 목표 합계 120000 전달 확인
  fireEvent.click(screen.getByRole('button', { name: '실시간 스캔 시작' }));
  const calls = (startScoreCamera as jest.Mock).mock.calls;
  const options = calls[calls.length - 1][1];
  expect(options.expected).toBe('120000');

  const link = screen.getByRole('link', { name: '확정한 기록 공유 링크' }).getAttribute('href')!;
  expect(parseShareStateFromHash(link.slice(link.indexOf('#')), true)?.startingScore).toBe(30000);
});

test('changing starting score dynamically updates total target in ControlPanel and enables record button only at new sum', () => {
  window.history.pushState({}, '', '/scan_score');
  render(<App />);

  const startingScoreInput = screen.getByLabelText('시작 점수');
  expect(startingScoreInput).toHaveValue(25000);
  expect(screen.getByText(/100,000/)).toBeInTheDocument();

  // 시작 점수를 30,000점으로 변경
  fireEvent.change(startingScoreInput, { target: { value: '30000' } });
  expect(screen.getByText(/120,000/)).toBeInTheDocument();

  // 점수를 25,000점씩 입력 (합계 100,000점 -> 목표 120,000점과 불일치)
  fireEvent.change(screen.getByLabelText('경기 1 동 점수'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('경기 1 남 점수'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('경기 1 서 점수'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('경기 1 북 점수'), { target: { value: '25000' } });

  // 120,000점 불일치 상태에서 클릭 시 총 점수 불일치 팝업 알림 확인
  const addRecordBtn = screen.getByRole('button', { name: '기록 추가하고 공유하기' });
  fireEvent.click(addRecordBtn);
  expect(screen.getByText(/점수 합계가 목표 점수와 일치하지 않습니다/)).toBeInTheDocument();

  // UmaOkaTable 편집 행에 120,000점 분배 입력 (동 30,000, 남 30,000, 서 30,000, 북 30,000)
  fireEvent.change(screen.getByLabelText('경기 1 동 점수'), { target: { value: '30000' } });
  fireEvent.change(screen.getByLabelText('경기 1 남 점수'), { target: { value: '30000' } });
  fireEvent.change(screen.getByLabelText('경기 1 서 점수'), { target: { value: '30000' } });
  fireEvent.change(screen.getByLabelText('경기 1 북 점수'), { target: { value: '30000' } });

  // 합계 일치로 기록 추가 성공
  fireEvent.click(addRecordBtn);
  expect(screen.getByText(/총 1 경기/)).toBeInTheDocument();
});
