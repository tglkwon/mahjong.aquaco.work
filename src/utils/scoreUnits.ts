/** Score inputs use the starting score's unit (250, 2500 and 25000 are equivalent). */
export const getScoreMultiplier = (startingScore: number): number =>
  10 ** Math.max(0, 5 - String(startingScore).length);

export const getDefaultReturnScore = (startingScore: number, okaEnabled: boolean): number =>
  startingScore + (okaEnabled ? 5000 / getScoreMultiplier(startingScore) : 0);

export const getScoreBasis = (startingScore: number, returnScore: number, okaEnabled: boolean) => {
  const scoreMultiplier = getScoreMultiplier(startingScore);
  const scaledStartingScore = startingScore * scoreMultiplier;
  const scaledReturnScore = (okaEnabled ? returnScore : startingScore) * scoreMultiplier;
  return {
    scoreMultiplier,
    scaledStartingScore,
    scaledReturnScore,
    okaAmount: okaEnabled ? (scaledReturnScore - scaledStartingScore) * 4 / 1000 : 0,
  };
};
