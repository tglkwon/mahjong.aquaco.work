export function validateScoreDraft(raw: string[], unit: number, expected: string, players: number[], playerCount: number) {
  const scores = raw.map(value => /^-?\d+$/.test(value.trim()) ? Number(value) * unit : NaN);
  const total = scores.reduce((sum, value) => sum + value, 0);
  let error = '';
  if (![1, 100, 1000].includes(unit) || raw.length !== 4 || scores.some(value => !Number.isSafeInteger(value) || Math.abs(value) > Math.floor(Number.MAX_SAFE_INTEGER / 2) || value % 100 !== 0)) {
    error = '4개 점수를 정수로 입력하고, 환산 점수가 100점 단위인지 확인해 주세요.';
  } else if (!/^\d+$/.test(expected) || !Number.isSafeInteger(Number(expected)) || Number(expected) <= 0 || Number(expected) % 100 !== 0) {
    error = '기준 합계를 양의 정수, 100점 단위로 입력해 주세요.';
  } else if (players.length !== 4 || new Set(players).size !== 4 || players.some(value => !Number.isInteger(value) || value < 0 || value >= playerCount)) {
    error = '서로 다른 플레이어 4명을 선택해 주세요.';
  } else if (!Number.isSafeInteger(total) || total !== Number(expected)) {
    error = '합계가 기준과 다릅니다. 표시 단위와 숫자를 확인해 주세요.';
  }
  return { valid: !error, error, scores: scores.map(String), total };
}
