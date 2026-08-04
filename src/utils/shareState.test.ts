import { decodeBinaryShareState, encodeShareState, ShareState } from './shareState';

const game = (id: number, participants: { east: number; south: number; west: number; north: number }, scores: { east: string; south: string; west: string; north: string }) => ({
  id,
  participants,
  scores,
  isEditable: false,
});

test('round-trips player-based deltas when seats change', () => {
  const state: ShareState = {
    startingScore: 25000,
    language: 'ko',
    playerPool: ['A', 'B', 'C', 'D', 'E'],
    activeUmaOka: { uma: '1-2', oka: true },
    returnScore: 30000,
    isOkaEnabled: true,
    tieHandlingMode: 'seatOrder',
    chomboCounts: [1, 0, 2, 0, 0],
    games: [
      game(1, { east: 0, south: 1, west: 2, north: 3 }, { east: '25000', south: '24000', west: '26000', north: '25000' }),
      game(2, { east: 2, south: 0, west: 3, north: 4 }, { east: '27000', south: '23000', west: '25000', north: '25000' }),
    ],
  };

  const decoded = decodeBinaryShareState(encodeShareState(state, true));
  expect(decoded.playerPool).toEqual(state.playerPool);
  expect(decoded.activeUmaOka).toEqual(state.activeUmaOka);
  expect(decoded.returnScore).toBe(state.returnScore);
  expect(decoded.tieHandlingMode).toBe('seatOrder');
  expect(decoded.chomboCounts).toEqual(state.chomboCounts);
  expect(decoded.games).toEqual(state.games);
});

test('round-trips normal mode without uma/oka fields', () => {
  const state: ShareState = {
    startingScore: 25000,
    language: 'en',
    playerNames: ['A', 'B', 'C', 'D'],
    activeUmaOka: { uma: null, oka: false },
    games: [{ id: 1, scores: ['25000', '25000', '25000', '25000'], isEditable: false }],
  };

  const decoded = decodeBinaryShareState(encodeShareState(state, false));
  expect(decoded.playerNames).toEqual(state.playerNames);
  expect(decoded.games[0].scores).toEqual(state.games[0].scores);
  expect(decoded.activeUmaOka).toEqual({ uma: null, oka: false });
});
