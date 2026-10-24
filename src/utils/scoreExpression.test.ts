import { evaluateScoreExpression } from './scoreExpression';

describe('evaluateScoreExpression', () => {
  test.each([
    ['250+320', 570], ['250-320', -70], ['-70', -70],
    ['250 + 320 - 100', 470], ['+250-320+70', 0], ['000250', 250],
    ['25000+32000', 57000], ['25000-32000', -7000],
  ])('evaluates %s as %s', (input, expected) => {
    expect(evaluateScoreExpression(input)).toBe(expected);
  });

  test.each(['', ' ', '-', '250-', '250+', '250++320', '250--320',
    '250*320', '250/0', '1.5', '1e3', '250abc', '2 50', '(250)',
    'alert(1)', '9007199254740992', '9007199254740991+1'])('rejects %s', input => {
    expect(evaluateScoreExpression(input)).toBeNull();
  });
});
