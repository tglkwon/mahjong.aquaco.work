import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App routing and navigation', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('renders mahjong world title on home route', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const titleElements = screen.getAllByText(/아쿠아컴퍼니|Aquaco/i);
    expect(titleElements.length).toBeGreaterThan(0);
  });

  test('renders production score scan page on /scan_score route', () => {
    window.history.pushState({}, '', '/scan_score');
    render(<App />);
    const titleElements = screen.getAllByText((c) => c.includes('우마/오카 실시간 스캔'));
    expect(titleElements.length).toBeGreaterThan(0);
    // In production mode, PC transfer bridge button should not be rendered
    expect(screen.queryByText(/PC 전송 모드/i)).not.toBeInTheDocument();
  });

  test('renders test lab scan page on /scan_score_test route with PC transfer bridge', () => {
    window.history.pushState({}, '', '/scan_score_test');
    render(<App />);
    const titleElements = screen.getAllByText((c) => c.includes('점수 스캔 테스트 랩'));
    expect(titleElements.length).toBeGreaterThan(0);
    // In test mode, PC transfer bridge button should be present
    expect(screen.getByText(/PC 전송 모드/i)).toBeInTheDocument();
  });

  test('redirects legacy /set_score_photo to /scan_score', () => {
    window.history.pushState({}, '', '/set_score_photo');
    render(<App />);
    expect(window.location.pathname).toBe('/scan_score');
    const titleElements = screen.getAllByText((c) => c.includes('우마/오카 실시간 스캔'));
    expect(titleElements.length).toBeGreaterThan(0);
  });
  test('redirects legacy /test_scan to /scan_score_test', () => {
    window.history.pushState({}, '', '/test_scan');
    render(<App />);
    expect(window.location.pathname).toBe('/scan_score_test');
    const titleElements = screen.getAllByText((c) => c.includes('점수 스캔 테스트 랩'));
    expect(titleElements.length).toBeGreaterThan(0);
  });

  test('renders test mode on /scan_score when ?testMode=true query parameter is present', () => {
    window.history.pushState({}, '', '/scan_score?testMode=true');
    render(<App />);
    // In test mode via query param, PC transfer bridge button and test banner should be present
    expect(screen.getByText(/PC 전송 모드/i)).toBeInTheDocument();
    expect(screen.getByText(/테이블 1 실시간 연동 중/i)).toBeInTheDocument();
  });

  test('sidebar navigation contains /queue and does not contain /scan_score_test or /seat', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    // Click menu button in Header to open Sidebar
    const menuBtn = screen.getByRole('button', { name: '메뉴' });
    menuBtn.click();

    // Verify /queue is present
    expect(screen.getByText(/대기열 & 자리 추첨/i)).toBeInTheDocument();

    // Verify /scan_score_test and /seat are not present
    expect(screen.queryByText(/테스트 스캔/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/좌석 착석/i)).not.toBeInTheDocument();
  });
});