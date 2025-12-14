const positionOrder = { 'east': 1, 'south': 2, 'west': 3, 'north': 4 };

// Mock participants: East=0, South=1, West=2, North=3
const participants = { 'east': 0, 'south': 1, 'west': 2, 'north': 3 };
// Mock scores: East and South tied at 30000. West and North tied at 20000.
// This tests primary tie (1st/2nd) and secondary tie (3rd/4th).
const playerRawScores = { 0: 30000, 1: 30000, 2: 20000, 3: 20000 };

const playerIndexToPosition = Object.fromEntries(
  Object.entries(participants).map(([pos, pIdx]) => [String(pIdx), pos])
);

console.log("Player Index to Position Map:", playerIndexToPosition);

const rankedPlayers = Object.keys(playerRawScores)
  .map(pIndex => ({ playerIndex: parseInt(pIndex, 10), score: playerRawScores[parseInt(pIndex, 10)] }))
  .sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tiebreaker logic from ScorePage.tsx
    const posA = playerIndexToPosition[String(a.playerIndex)];
    const posB = playerIndexToPosition[String(b.playerIndex)];
    console.log(`Comparing ${a.playerIndex} (${posA}) vs ${b.playerIndex} (${posB})`);
    return positionOrder[posA] - positionOrder[posB];
  });

console.log("Ranked Players result:");
rankedPlayers.forEach((p, i) => {
  console.log(`Rank ${i}: Player ${p.playerIndex} (Score: ${p.score})`);
});
