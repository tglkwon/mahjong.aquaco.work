export function validateScoreDraft(raw: string[], unit: number, expected: string, players: number[], playerCount: number) {
  let scores = raw.map(value => /^-?\d+$/.test(value.trim()) ? Number(value) * unit : NaN);
  let total = scores.reduce((sum, value) => sum + value, 0);
  const expectedNum = Number(expected);
  let error = '';

  if (![1, 100, 1000].includes(unit) || raw.length !== 4 || scores.some(value => !Number.isSafeInteger(value) || Math.abs(value) > Math.floor(Number.MAX_SAFE_INTEGER / 2) || value % 100 !== 0)) {
    error = '4개 점수를 정수로 입력하고, 환산 점수가 100점 단위인지 확인해 주세요.';
  } else if (!/^\d+$/.test(expected) || !Number.isSafeInteger(expectedNum) || expectedNum <= 0 || expectedNum % 100 !== 0) {
    error = '기준 합계를 양의 정수, 100점 단위로 입력해 주세요.';
  } else if (players.length !== 4 || new Set(players).size !== 4 || players.some(value => !Number.isInteger(value) || value < 0 || value >= playerCount)) {
    error = '서로 다른 플레이어 4명을 선택해 주세요.';
  } else if (!Number.isSafeInteger(total) || total !== expectedNum) {
    // 10만점/12만점 역추적 (Backtracking) 자동 보정:
    // 카메라 광학 번짐으로 '0'이 '8'로 오인식된 경우 (차이: 8 * unit * 10^k = 800, 8000 등)
    // 4개 점수 중 '8'이 포함된 위치를 '0'으로 변경했을 때 정확히 expectedNum과 일치하는 유일한 해가 있는지 검사
    const candidates: Array<{ playerIdx: number; newRaw: string; newScore: number }> = [];

    for (let i = 0; i < 4; i++) {
      const originalStr = raw[i].trim();
      for (let pos = 0; pos < originalStr.length; pos++) {
        if (originalStr[pos] === '8') {
          const replaced = originalStr.substring(0, pos) + '0' + originalStr.substring(pos + 1);
          const replacedScore = Number(replaced) * unit;
          const newTotal = total - scores[i] + replacedScore;
          if (newTotal === expectedNum) {
            candidates.push({ playerIdx: i, newRaw: replaced, newScore: replacedScore });
          }
        }
      }
    }

    if (candidates.length === 1) {
      const sol = candidates[0];
      scores[sol.playerIdx] = sol.newScore;
      total = expectedNum;
    } else {
      error = '합계가 기준과 다릅니다. 표시 단위와 숫자를 확인해 주세요.';
    }
  }

  return { valid: !error, error, scores: scores.map(String), total };
}
