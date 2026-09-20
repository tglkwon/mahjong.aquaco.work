import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SeatCheckinPage from './SeatCheckinPage';
import * as clientIdUtil from '../utils/clientId';

describe('SeatCheckinPage component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('renders input form on first visit without stored nickname', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        table_id: 1,
        session_id: 1,
        session_status: 'waiting_players',
        seats: { east: null, south: null, west: null, north: null },
      }),
    } as any);

    render(
      <MemoryRouter initialEntries={['/seat?table=1&seat=east']}>
        <Routes>
          <Route path="/seat" element={<SeatCheckinPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/테이블 1 - \[동\(East\)\] 착석/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 마작왕')).toBeInTheDocument();
    expect(screen.getByText('착석하기')).toBeInTheDocument();
  });

  test('renders 1-second check-in button when nickname is already stored', async () => {
    localStorage.setItem('mahjong_nickname', '김타짜');
    localStorage.setItem('mahjong_client_id', 'test_uuid_123');

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        table_id: 1,
        session_id: 1,
        session_status: 'waiting_players',
        seats: { east: null, south: null, west: null, north: null },
      }),
    } as any);

    render(
      <MemoryRouter initialEntries={['/seat?table=1&seat=east']}>
        <Routes>
          <Route path="/seat" element={<SeatCheckinPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/⚡ 김타짜\(으\)로 1초 착석/)).toBeInTheDocument();
  });

  test('clicking checkin calls /api/seat/join and transitions to seated view', async () => {
    localStorage.setItem('mahjong_nickname', '박리치');
    localStorage.setItem('mahjong_client_id', 'client_richi');

    const fetchMock = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          table_id: 1,
          session_id: 1,
          session_status: 'waiting_players',
          seats: { east: null, south: null, west: null, north: null },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          table_id: 1,
          session_id: 1,
          seats: { east: { client_id: 'client_richi', nickname: '박리치', joined_at: 'now' } },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          table_id: 1,
          session_id: 1,
          session_status: 'waiting_players',
          seats: { east: { client_id: 'client_richi', nickname: '박리치', joined_at: 'now' } },
        }),
      } as any);

    render(
      <MemoryRouter initialEntries={['/seat?table=1&seat=east']}>
        <Routes>
          <Route path="/seat" element={<SeatCheckinPage />} />
        </Routes>
      </MemoryRouter>
    );

    const btn = screen.getByText(/⚡ 박리치\(으\)로 1초 착석/);
    fireEvent.click(btn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/seat/join', expect.objectContaining({
        method: 'POST',
      }));
      expect(screen.getByText(/\[동\(East\)\] 착석 완료!/)).toBeInTheDocument();
    });
  });

  test('device reset clears storage and redirects', async () => {
    localStorage.setItem('mahjong_nickname', '탈퇴자');
    localStorage.setItem('mahjong_client_id', 'client_del');

    window.confirm = jest.fn().mockReturnValue(true);

    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          table_id: 1,
          session_id: 1,
          seats: {},
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as any);

    render(
      <MemoryRouter initialEntries={['/seat?table=1&seat=east']}>
        <Routes>
          <Route path="/seat" element={<SeatCheckinPage />} />
          <Route path="/" element={<div>홈 화면</div>} />
        </Routes>
      </MemoryRouter>
    );

    const resetBtn = screen.getByText('[기기 등록 정보 초기화]');
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByText('홈 화면')).toBeInTheDocument();
      expect(localStorage.getItem('mahjong_client_id')).toBeNull();
      expect(localStorage.getItem('mahjong_nickname')).toBeNull();
    });
  });

  test('when 4 players are seated, clicking navigation button routes to /scan_score', async () => {
    localStorage.setItem('mahjong_client_id', 'e');
    localStorage.setItem('mahjong_nickname', '동');

    jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/api/tables/1/status')) {
        return {
          ok: true,
          json: async () => ({
            table_id: 1,
            session_id: 1,
            session_status: 'active',
            occupied_count: 4,
            seats: {
              east: { client_id: 'e', nickname: '동', joined_at: 'now' },
              south: { client_id: 's', nickname: '남', joined_at: 'now' },
              west: { client_id: 'w', nickname: '서', joined_at: 'now' },
              north: { client_id: 'n', nickname: '북', joined_at: 'now' },
            },
          }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    render(
      <MemoryRouter initialEntries={['/seat?table=1&seat=east']}>
        <Routes>
          <Route path="/seat" element={<SeatCheckinPage />} />
          <Route path="/scan_score" element={<div>Scan Score Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/4명 모두 착석 완료!/)).toBeInTheDocument();
    });

    const moveBtn = screen.getByText(/점수 입력\/인식 페이지로 바로 이동/);
    fireEvent.click(moveBtn);

    expect(screen.getByText('Scan Score Page')).toBeInTheDocument();
  });
});
