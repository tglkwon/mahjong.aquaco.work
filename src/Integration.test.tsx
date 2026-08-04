import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

jest.setTimeout(30000);

const enterScoresAndAddRecord = async () => {
  const inputs = screen.getAllByRole('spinbutton').slice(0, 4);
  const scores = ['40000', '30000', '20000', '10000'];
  for (let i = 0; i < 4; i += 1) {
    userEvent.clear(inputs[i]);
    userEvent.type(inputs[i], scores[i]);
  }
  const recordButton = screen.getByRole('button', { name: /기록 추가하고 공유하기|Add Record/i });
  fireEvent.click(recordButton);
};

describe('Integration Tests', () => {
  test('Score Page: enter scores and add a record', async () => {
    window.history.pushState({}, '', '/set_score');
    render(<App />);
    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(4);
    await enterScoresAndAddRecord();
    await waitFor(() => {
      expect(screen.getAllByText(/2/i, { selector: 'td' }).length).toBeGreaterThan(0);
    });
  });

  test('UmaOka Page: enter scores and add a record', async () => {
    window.history.pushState({}, '', '/set_score_umaoka');
    render(<App />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    await enterScoresAndAddRecord();
    await waitFor(() => {
      const cells = screen.getAllByRole('cell');
      expect(cells.find(cell => cell.textContent === '2')).toBeInTheDocument();
    });
  });
  test('Score Page: does not show UmaOka settings', () => {
    window.history.pushState({}, '', '/set_score');
    render(<App />);

    expect(screen.queryByTestId('uma-oka-settings-summary')).not.toBeInTheDocument();
  });

  test('UmaOka Page: settings are collapsed by default and preserve the selected summary', () => {
    window.history.pushState({}, '', '/set_score_umaoka');
    render(<App />);

    const toggle = screen.getByRole('button', { name: '우마·오카 설정 펼치기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: '1-2 우마' })).not.toBeInTheDocument();
    expect(screen.getByTestId('uma-oka-settings-summary')).toHaveTextContent('우마 미적용 · 오카 꺼짐 · 동점 균등 분배');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: '1-2 우마' }));
    fireEvent.click(screen.getByRole('button', { name: '오카' }));
    fireEvent.click(screen.getByRole('button', { name: '우마·오카 설정 접기' }));

    expect(screen.getByTestId('uma-oka-settings-summary')).toHaveTextContent('1-2 우마 · 오카 적용 · 동점 균등 분배');
    expect(screen.queryByRole('button', { name: '1-2 우마' })).not.toBeInTheDocument();
  });
});
