import { calculateTieAwards } from './components/ScorePage';

describe('calculateTieAwards', () => {
  test('splits first-place uma and oka equally', () => {
    expect(calculateTieAwards({ 0: 50000, 1: 50000, 2: 0, 3: 0 }, '1-2', 20, 'split', { 0: 'east', 1: 'south', 2: 'west', 3: 'north' }))
      .toEqual({ 0: 25, 1: 25, 2: -15, 3: -15 });
  });

  test('splits the full tied rank range for three tied second-place players', () => {
    expect(calculateTieAwards({ 0: 50000, 1: 30000, 2: 30000, 3: 30000 }, '1-2', 0, 'split', { 0: 'east', 1: 'south', 2: 'west', 3: 'north' }))
      .toEqual({ 0: 20, 1: -20 / 3, 2: -20 / 3, 3: -20 / 3 });
  });

  test('keeps the existing seat-order result when selected', () => {
    expect(calculateTieAwards({ 0: 50000, 1: 50000, 2: 0, 3: 0 }, '1-2', 20, 'seatOrder', { 0: 'east', 1: 'south', 2: 'west', 3: 'north' }))
      .toEqual({ 0: 40, 1: 10, 2: -10, 3: -20 });
  });

  test('does not change results when there are no ties', () => {
    expect(calculateTieAwards({ 0: 50000, 1: 40000, 2: 30000, 3: 20000 }, '1-3', 20, 'split', { 0: 'east', 1: 'south', 2: 'west', 3: 'north' }))
      .toEqual({ 0: 50, 1: 10, 2: -10, 3: -30 });
  });
});
