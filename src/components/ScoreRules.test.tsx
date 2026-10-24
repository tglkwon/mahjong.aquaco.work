import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';
import { encodeShareState, parseShareStateFromHash } from '../utils/shareState';

jest.mock('../utils/scoreCamera', () => ({ startScoreCamera: jest.fn(() => jest.fn()) }));

const readTotals = () => {
  const section = screen.getByRole('heading', { name: '플레이어별 총점' }).closest('section')!;
  return ['A', 'B', 'C', 'D'].map(name => Number(within(section).getByText(name, { exact: true }).parentElement!.lastElementChild!.textContent));
};

const cases = [
  { start: 250, returned: 300, scores: ['350', '150', '250', '250'] },
  { start: 300, returned: 350, scores: ['400', '200', '300', '300'] },
  { start: 25000, returned: 30000, scores: ['35000', '15000', '25000', '25000'] },
  { start: 30000, returned: 35000, scores: ['40000', '20000', '30000', '30000'] },
];

test.each(['/set_score', '/set_score_umaoka', '/scan_score'])('%s defaults to 250 and switches both common starting scores in either direction', path => {
  window.history.pushState({}, '', path);
  render(<App />);
  const input = screen.getByLabelText('시작 점수');
  expect(input).toHaveValue(250);
  fireEvent.click(screen.getByRole('button', { name: '시작 점수 100배로 전환' }));
  expect(input).toHaveValue(25000);
  fireEvent.click(screen.getByRole('button', { name: '시작 점수 100분의 1로 전환' }));
  expect(input).toHaveValue(250);
  fireEvent.change(input, { target: { value: '300' } });
  fireEvent.click(screen.getByRole('button', { name: '시작 점수 100배로 전환' }));
  expect(input).toHaveValue(30000);
  fireEvent.click(screen.getByRole('button', { name: '시작 점수 100분의 1로 전환' }));
  expect(input).toHaveValue(300);
});

describe.each(['/set_score_umaoka', '/scan_score'])('%s score rules', path => {
  test('keeps the same actual return score when switching from 25000 to 250 units', () => {
    const encoded = encodeShareState({
      startingScore: 25000, returnScore: 30000, isOkaEnabled: true,
      activeUmaOka: { uma: null, oka: true }, playerPool: ['A', 'B', 'C', 'D'], games: [],
    }, true);
    window.history.pushState({}, '', `${path}#d=${encoded}`);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '시작 점수 100분의 1로 전환' }));
    fireEvent.click(screen.getByRole('button', { name: '우마·오카 설정 펼치기' }));
    expect(screen.getByLabelText('반환 점수')).toHaveValue(300);
    fireEvent.click(screen.getByRole('button', { name: '시작 점수 100배로 전환' }));
    expect(screen.getByLabelText('반환 점수')).toHaveValue(30000);
  });

  test('restores legacy scan links carrying only the active oka flag', () => {
    const encoded = encodeShareState({
      startingScore: 250, activeUmaOka: { uma: null, oka: true }, playerPool: ['A', 'B', 'C', 'D'],
      games: [{ id: 1, isEditable: false, participants: { east: 0, south: 1, west: 2, north: 3 },
        scores: { east: '350', south: '150', west: '250', north: '250' } }],
    }, true);
    window.history.pushState({}, '', `${path}#d=${encoded}`);
    render(<App />);
    expect(readTotals()).toEqual([25, -15, -5, -5]);
  });

  test.each([false, true])('records abbreviated expressions and restores oka=%s', async enabled => {
    const encoded = encodeShareState({
      startingScore: 250, returnScore: 300, isOkaEnabled: enabled,
      activeUmaOka: { uma: null, oka: enabled }, playerPool: ['A', 'B', 'C', 'D'], games: [],
    }, true);
    window.history.pushState({}, '', `${path}#d=${encoded}`);
    const view = render(<App />);
    const inputs = screen.getAllByRole('textbox', { name: /경기 1 .* 점수/ });
    ['250+320', '250-320', '250', '250'].forEach((value, index) => fireEvent.change(inputs[index], { target: { value } }));
    fireEvent.click(screen.getByRole('button', { name: '기록 추가하고 공유하기' }));
    const expected = enabled ? [47, -37, -5, -5] : [32, -32, 0, 0];
    expect(readTotals()).toEqual(expected);
    const share = path === '/scan_score'
      ? screen.getByRole('link', { name: '확정한 기록 공유 링크' }).getAttribute('href')!
      : await screen.findByText('URL이 복사되었습니다!').then(() => window.location.href);
    const hash = `#${share.split('#')[1]}`;
    const state = parseShareStateFromHash(hash, true)!;
    expect(state.isOkaEnabled).toBe(enabled);
    expect(state.activeUmaOka?.oka).toBe(enabled);
    if (enabled) expect(state.returnScore).toBe(300);
    view.unmount();
    window.history.pushState({}, '', `${path}${hash}`);
    render(<App />);
    expect(readTotals()).toEqual(expected);
  });

  test.each(cases)('uses the selected starting score $start with oka off', ({ start, returned, scores }) => {
    const encoded = encodeShareState({
      startingScore: start, returnScore: returned, isOkaEnabled: false,
      activeUmaOka: { uma: null, oka: false }, playerPool: ['A', 'B', 'C', 'D'],
      games: [{ id: 1, isEditable: false, participants: { east: 0, south: 1, west: 2, north: 3 },
        scores: { east: scores[0], south: scores[1], west: scores[2], north: scores[3] } }],
    }, true);
    window.history.pushState({}, '', `${path}#d=${encoded}`);
    render(<App />);
    expect(readTotals()).toEqual([10, -10, 0, 0]);
    expect(readTotals().reduce((sum, value) => sum + value, 0)).toBe(0);
  });

  test.each(cases)('preserves oka and its return score at starting score $start', ({ start, returned, scores }) => {
    const encoded = encodeShareState({
      startingScore: start, returnScore: returned, isOkaEnabled: true,
      activeUmaOka: { uma: null, oka: true }, playerPool: ['A', 'B', 'C', 'D'],
      games: [{ id: 1, isEditable: false, participants: { east: 0, south: 1, west: 2, north: 3 },
        scores: { east: scores[0], south: scores[1], west: scores[2], north: scores[3] } }],
    }, true);
    window.history.pushState({}, '', `${path}#d=${encoded}`);
    render(<App />);
    expect(readTotals()).toEqual([25, -15, -5, -5]);
    fireEvent.click(screen.getByRole('button', { name: '우마·오카 설정 펼치기' }));
    fireEvent.click(screen.getByRole('button', { name: '오카' }));
    expect(readTotals()).toEqual([10, -10, 0, 0]);
  });
});
