import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders mahjong world title', () => {
  render(<App />);
  // "mahjongWorldTitle" might appear in the Header and potentially elsewhere (e.g. metadata or footer?).
  // We use getAllByText to allow multiple occurrences.
  const titleElements = screen.getAllByText(/아쿠아컴퍼니|Aquaco/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
