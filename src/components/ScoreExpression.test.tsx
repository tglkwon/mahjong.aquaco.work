import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { parseShareStateFromHash } from '../utils/shareState';

jest.mock('../utils/scoreCamera', () => ({ startScoreCamera: jest.fn(() => jest.fn()) }));

const scoreInputs = () => screen.getAllByRole('textbox', { name: /경기 1 .* 점수/ });

test.each(['/set_score', '/set_score_umaoka', '/scan_score'])(
  '%s applies adjustment buttons to the calculated result', path => {
    window.history.pushState({}, '', path);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '시작 점수 100배로 전환' }));
    const input = scoreInputs()[0];
    fireEvent.change(input, { target: { value: '250-320' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Increment score' })[0]);
    expect(input).toHaveValue('930');
    fireEvent.change(input, { target: { value: '250+' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Decrement score' })[0]);
    expect(input).toHaveValue('250+');
  }
);

test.each(['/set_score', '/set_score_umaoka', '/scan_score'])(
  '%s records evaluated scores and shares numbers instead of expressions', async path => {
    window.history.pushState({}, '', path);
    render(<App />);
    const scan = path === '/scan_score';
    if (scan) fireEvent.click(screen.getByRole('button', { name: '시작 점수 100배로 전환' }));
    const inputs = scoreInputs();
    const values = scan ? ['25000+32000', '25000-32000', '25000', '25000'] : ['250+320', '250-320', '250', '250'];
    values.forEach((value, index) => fireEvent.change(inputs[index], { target: { value } }));
    expect(inputs[0]).toHaveValue(values[0]);
    const record = screen.getByRole('button', { name: '기록 추가하고 공유하기' });
    expect(record).toBeEnabled();
    fireEvent.click(record);
    await waitFor(() => expect(screen.getByText('총 1 경기')).toBeInTheDocument());
    await waitFor(() => {
      const hash = scan
        ? screen.getByRole('link', { name: '확정한 기록 공유 링크' }).getAttribute('href')!.split('#')[1]
        : window.location.hash;
      const state = parseShareStateFromHash(scan ? `#${hash}` : hash, path !== '/set_score')!;
      const scores = state.games[0].scores;
      expect(Array.isArray(scores) ? scores : Object.values(scores)).toEqual(scan ? ['57000', '-7000', '25000', '25000'] : ['570', '-70', '250', '250']);
    });
  }
);

test.each(['/set_score', '/set_score_umaoka', '/scan_score'])(
  '%s blocks malformed expressions even if other inputs match the total', path => {
    window.history.pushState({}, '', path);
    render(<App />);
    const inputs = scoreInputs();
    ['250-', '50000', '25000', '25000'].forEach((value, index) => fireEvent.change(inputs[index], { target: { value } }));
    expect(inputs[0]).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: '기록 추가하고 공유하기' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.keyDown(inputs[0], { key: 'Enter' });
    expect(screen.getByText('총 0 경기')).toBeInTheDocument();
  }
);
