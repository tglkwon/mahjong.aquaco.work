import { validateScoreDraft } from './scoreDraft';

const check = (values: string[], unit = 100, total = '100000', players = [0, 1, 2, 3]) =>
  validateScoreDraft(values, unit, total, players, 4);

test('normalizes real sample display units without altering order', () => {
  expect(check(['0026', '0606', '0266', '102'])).toMatchObject({ valid: true, scores: ['2600', '60600', '26600', '10200'], total: 100000 });
});
test('does not infer missing scores or accept ambiguous text and fractional points', () => {
  for (const value of ['', '-', '2x', '2.5', '1e2', 'Infinity']) {
    expect(check([value, '250', '250', '250']).valid).toBe(false);
  }
  expect(check(['25001', '24999', '25000', '25000'], 1).valid).toBe(false);
});
test('checks selected unit, target total, count and distinct existing players', () => {
  expect(check(['250', '250', '250', '250'], 1).valid).toBe(false);
  expect(check(['250', '250', '250', '250'], 100, '99900').valid).toBe(false);
  expect(check(['250', '250', '250', '250'], 100, '').valid).toBe(false);
  expect(check(['250', '250', '250', '250'], 100, '100000', [0, 0, 2, 3]).valid).toBe(false);
  expect(check(['250', '250', '250', '250'], 100, '100000', [0, 1, 2, 4]).valid).toBe(false);
  expect(check(['250', '250', '500']).valid).toBe(false);
});
test('accepts negative scores, zero and explicit alternate target; rejects overflow', () => {
  expect(check(['-1000', '0', '41000', '60000'], 1).valid).toBe(true);
  expect(check(['300', '300', '300', '300'], 100, '120000').valid).toBe(true);
  expect(check(['999999999999999999', '0', '0', '0']).valid).toBe(false);
  expect(check(['50000000000000', '0', '0', '0'], 100, '5000000000000000').valid).toBe(false);
});
