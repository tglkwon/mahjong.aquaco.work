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

test('testMode automatically polls Table 1 status and populates player names', async () => {
  const tableStatusMock = {
    table_id: 1,
    session_id: 42,
    session_status: 'active',
    started_at: new Date(Date.now() - 120000).toISOString(),
    seats: {
      east: { client_id: 'c1', nickname: '동마스터', joined_at: 'now' },
      south: { client_id: 'c2', nickname: '남마스터', joined_at: 'now' },
      west: { client_id: 'c3', nickname: '서마스터', joined_at: 'now' },
      north: { client_id: 'c4', nickname: '북마스터', joined_at: 'now' },
    },
  };

  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => tableStatusMock,
  } as any);

  window.history.pushState({}, '', '/scan_score_test');
  render(<App />);

  // 테이블 1 실시간 연동 배너 및 4인 닉네임 표시 확인
  expect(await screen.findByText('테이블 1 실시간 연동 중')).toBeInTheDocument();
  expect((await screen.findAllByText(/동마스터/)).length).toBeGreaterThanOrEqual(1);
  expect((await screen.findAllByText(/남마스터/)).length).toBeGreaterThanOrEqual(1);
  expect((await screen.findAllByText(/서마스터/)).length).toBeGreaterThanOrEqual(1);
  expect((await screen.findAllByText(/북마스터/)).length).toBeGreaterThanOrEqual(1);
});

test('testMode clicking record button calls /api/sessions/:id/finish', async () => {
  const tableStatusMock = {
    table_id: 1,
    session_id: 88,
    session_status: 'active',
    started_at: new Date(Date.now() - 300000).toISOString(),
    seats: {
      east: { client_id: 'e1', nickname: '이스트', joined_at: 'now' },
      south: { client_id: 's1', nickname: '사우스', joined_at: 'now' },
      west: { client_id: 'w1', nickname: '웨스트', joined_at: 'now' },
      north: { client_id: 'n1', nickname: '노스', joined_at: 'now' },
    },
  };

  const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
    if (String(url).includes('/api/tables/1/status')) {
      return { ok: true, json: async () => tableStatusMock } as any;
    }
    if (String(url).includes('/api/sessions/88/finish')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          record_id: 99,
          duration_seconds: 300,
        }),
      } as any;
    }
    return { ok: true, json: async () => ({}) } as any;
  });

  window.history.pushState({}, '', '/scan_score_test');
  render(<App />);

  await screen.findByText('테이블 1 실시간 연동 중');

  // 점수 25000점씩 입력
  fireEvent.change(screen.getByLabelText('경기 1 동 점수'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('경기 1 남 점수'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('경기 1 서 점수'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('경기 1 북 점수'), { target: { value: '25000' } });

  const addBtn = screen.getByRole('button', { name: '기록 추가하고 공유하기' });
  fireEvent.click(addBtn);

  expect(fetchSpy).toHaveBeenCalledWith(
    '/api/sessions/88/finish',
    expect.objectContaining({ method: 'POST' })
  );
});

test('hides test lab transition tab on /scan_score and shows return link on test mode', () => {
  // 1. Production route: /scan_score
  window.history.pushState({}, '', '/scan_score');
  const { unmount } = render(<App />);

  expect(screen.queryByText(/PC 전송 테스트 Lab 이동/i)).not.toBeInTheDocument();
  unmount();

  // 2. Test mode route: /scan_score_test
  window.history.pushState({}, '', '/scan_score_test');
  const { unmount: unmountTest } = render(<App />);

  expect(screen.getByText(/일반 서비스 화면 이동/i)).toBeInTheDocument();
  unmountTest();

  // 3. Query param test mode: /scan_score?testMode=true
  window.history.pushState({}, '', '/scan_score?testMode=true');
  render(<App />);

  expect(screen.getByText(/일반 서비스 화면 이동/i)).toBeInTheDocument();
});
