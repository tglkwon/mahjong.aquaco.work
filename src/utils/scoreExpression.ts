/** Integer scores and addition/subtraction only; never execute user input as code. */
export function evaluateScoreExpression(input: string): number | null {
  const expression = input.trim();
  if (!/^[+-]?\d+(?:\s*[+-]\s*\d+)*$/.test(expression)) return null;

  const terms = expression.replace(/\s/g, '').match(/[+-]?\d+/g)!;
  let result = 0;
  for (const term of terms) {
    const value = Number(term);
    if (!Number.isSafeInteger(value)) return null;
    result += value;
    if (!Number.isSafeInteger(result)) return null;
  }
  return result;
}
