import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QueuePage from './QueuePage';

describe('QueuePage component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('renders empty queue and join input', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 0, queue: [] }),
    } as any);

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/🀄 대기열 & 자리 추첨/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('닉네임 입력 (예: 마작왕)')).toBeInTheDocument();
    expect(screen.getByText('현재 대기 중인 인원이 없습니다.')).toBeInTheDocument();
  });

  test('shows draw button when 4 players are queued, and renders 3D wind tiles on click', async () => {
    const queueData = [
      { client_id: 'q1', nickname: '플레이어1', status: 'waiting', enqueued_at: '2026-09-18T10:00:00Z' },
      { client_id: 'q2', nickname: '플레이어2', status: 'waiting', enqueued_at: '2026-09-18T10:01:00Z' },
      { client_id: 'q3', nickname: '플레이어3', status: 'waiting', enqueued_at: '2026-09-18T10:02:00Z' },
      { client_id: 'q4', nickname: '플레이어4', status: 'waiting', enqueued_at: '2026-09-18T10:03:00Z' },
    ];

    const drawData = [
      { seat: 'east', wind_char: '東', seat_label: '동가 (East)', client_id: 'q1', nickname: '플레이어1' },
      { seat: 'south', wind_char: '南', seat_label: '남가 (South)', client_id: 'q2', nickname: '플레이어2' },
      { seat: 'west', wind_char: '西', seat_label: '서가 (West)', client_id: 'q3', nickname: '플레이어3' },
      { seat: 'north', wind_char: '北', seat_label: '북가 (North)', client_id: 'q4', nickname: '플레이어4' },
    ];

    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 4, queue: queueData }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, draw: drawData }),
      } as any);

    render(
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/자리 추첨 가능/)).toBeInTheDocument();
    });

    const drawBtn = screen.getByText(/🀄 4인 마작패 자리 추첨/);
    fireEvent.click(drawBtn);

    await waitFor(() => {
      expect(screen.getByText('東')).toBeInTheDocument();
      expect(screen.getByText('南')).toBeInTheDocument();
      expect(screen.getByText('西')).toBeInTheDocument();
      expect(screen.getByText('北')).toBeInTheDocument();
      expect(screen.getByText('동가 (East)')).toBeInTheDocument();
      expect(screen.getAllByText(/플레이어1/).length).toBeGreaterThanOrEqual(1);
    });
  });

  test('clicking score scan buttons navigates to /scan_score (not /scan_score_test)', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 0, queue: [] }),
    } as any);

    render(
      <MemoryRouter initialEntries={['/queue']}>
        <Routes>
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/scan_score" element={<div>Scan Score Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const scanBtn = screen.getByText(/점수 입력\/인식 페이지/);
    fireEvent.click(scanBtn);
    expect(screen.getByText('Scan Score Page')).toBeInTheDocument();
  });
});
