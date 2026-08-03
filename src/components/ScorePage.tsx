import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { deflate, inflate } from 'pako';
import Table from './Table';
import PlayerManagementAndScores from './PlayerManagementAndScores';
import PlayerTotals from './PlayerTotals';
import ControlPanel from './ControlPanel';
import MessageDisplay from './MessageDisplay';
import UmaOkaTable from './UmaOkaTable';
import { Translation, Translations } from '../i18n/translations';
import { Game, UmaOkaParticipants, UmaOkaScores } from '../types';

type Language = keyof Translations;
type TranslationKey = keyof Translation;
export type TieHandlingMode = 'split' | 'seatOrder';

interface ScoreTrackerPageProps {
  currentLanguage: string;
  setCurrentLanguage: (lang: Language) => void;
  getText: (key: TranslationKey, params?: Record<string, string | number>) => string;
  translations: Translations;
}

const PLAYER_COUNT = 4;
const INITIAL_PLAYER_POSITIONS = ['east', 'south', 'west', 'north'];
const DATA_STRUCTURE_VERSION = 5; // v2: pako on optimized array, v3: added returnScore, isOkaEnabled, v4: added tie handling

const getDefaultPlayerPositions = (): string[] => {
  return [...INITIAL_PLAYER_POSITIONS];
};

const getDefaultUmaOkaParticipants = (): UmaOkaParticipants => {
  return { east: 0, south: 1, west: 2, north: 3 };
};

const getIncrementAmount = (score: number) => {
  const digits = String(score).length;
  // Prevent excessive power if score is 0 or low
  if (digits <= 2) return 1;
  return 10 ** (digits - 2);
};

// Helper to convert binary string to Uint8Array
const binaryStringToBytes = (binaryString: string) => {
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to convert Uint8Array to binary string
const bytesToBinaryString = (bytes: Uint8Array) => {
  let binaryString = '';
  bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });
  return binaryString;
};


const UMA_VALUES: Record<string, number[]> = {
  '1-2': [20, 10, -10, -20],
  '1-3': [30, 10, -10, -30],
};

export const calculateTieAwards = (rawScores: Record<number, number>, uma: string | null, okaAmount: number, tieHandlingMode: TieHandlingMode, positionByPlayer: Record<number, string> = {}): Record<number, number> => {
  const positionOrder: Record<string, number> = { east: 1, south: 2, west: 3, north: 4 };
  const players = Object.entries(rawScores).map(([playerIndex, score]) => ({ playerIndex: Number(playerIndex), score })).sort((x, y) => y.score - x.score || (positionOrder[positionByPlayer[x.playerIndex]] || 0) - (positionOrder[positionByPlayer[y.playerIndex]] || 0));
  const umaValues = UMA_VALUES[uma || ''] || [0, 0, 0, 0];
  const awards: Record<number, number> = {};
  if (tieHandlingMode === 'seatOrder') { players.forEach((player, rank) => { awards[player.playerIndex] = umaValues[rank] + (rank === 0 ? okaAmount : 0); }); return awards; }
  let groupStart = 0;
  while (groupStart < players.length) {
    let groupEnd = groupStart + 1;
    while (groupEnd < players.length && players[groupEnd].score === players[groupStart].score) groupEnd += 1;
    const groupSize = groupEnd - groupStart;
    let groupAward = 0;
    for (let rank = groupStart; rank < groupEnd; rank += 1) groupAward += umaValues[rank] || 0;
    if (groupStart === 0) groupAward += okaAmount;
    for (let index = groupStart; index < groupEnd; index += 1) awards[players[index].playerIndex] = groupAward / groupSize;
    groupStart = groupEnd;
  }
  return awards;
};

type SavedGameData =
  | string[] // Normal mode: scores only
  | [number, number, number, number, string, string, string, string]; // UmaOka mode: participants + scores

type OptimizedStateArray = [
  number, // version
  number, // startingScore
  string[], // playerNames or playerPool
  SavedGameData[], // games
  string, // language
  [string | null, boolean] | null, // activeUmaOka
  number | null, // returnScore
  boolean | null, // isOkaEnabled
  TieHandlingMode?, // tie handling mode
  number[]? // per-player chombo counts
];

interface ParsedState {
  startingScore: number;
  games: Game[];
  language?: string;
  activeUmaOka: { uma: string | null; oka: boolean };
  returnScore?: number;
  isOkaEnabled?: boolean;
  tieHandlingMode?: TieHandlingMode;
  playerPool?: string[];
  playerNames?: string[];
  chomboCounts?: number[];
}

function ScoreTrackerPage({ currentLanguage, setCurrentLanguage, getText, translations }: ScoreTrackerPageProps) {
  const location = useLocation();
  const isUmaOkaPage = location.pathname === '/set_score_umaoka';

  const parseStateFromUrl = useCallback((isUmaOka: boolean): ParsedState | null => {
    const hash = window.location.hash;
    if (!hash.startsWith('#data=')) return null;

    const encodedData = hash.substring(hash.indexOf('=') + 1);

    try {
      const binaryString = atob(encodedData);
      const bytes = binaryStringToBytes(binaryString);
      const inflatedData = inflate(bytes, { to: 'string' });
      const parsedData = JSON.parse(inflatedData);

      if (Array.isArray(parsedData)) { // New optimized array format
        const data = parsedData as OptimizedStateArray;
        const version = data[0];
        if (version >= 2) { // Handle v2 and later
          const restoredGames = data[3].map((gameData: SavedGameData, index: number) => {
            if (isUmaOka) {
              const gData = gameData as [number, number, number, number, string, string, string, string];
              return {
                id: index + 1,
                participants: { east: gData[0], south: gData[1], west: gData[2], north: gData[3] },
                scores: { east: gData[4], south: gData[5], west: gData[6], north: gData[7] },
                isEditable: false,
              } as Game;
            } else {
              const gData = gameData as string[];
              return {
                id: index + 1,
                scores: gData,
                isEditable: false,
                playerPositions: getDefaultPlayerPositions(),
                umaType: null
              } as Game;
            }
          });

          const result: ParsedState = {
            startingScore: data[1],
            games: restoredGames,
            language: data[4],
            activeUmaOka: isUmaOka && data[5] ? { uma: data[5][0], oka: data[5][1] } : { uma: null, oka: false },
            tieHandlingMode: data[8] === 'seatOrder' ? 'seatOrder' : 'split',
            chomboCounts: Array.isArray(data[9]) ? data[9] : undefined,
          };

          if (version >= 3) {
            result.returnScore = data[6] ?? undefined;
            result.isOkaEnabled = data[7] ?? undefined;
          }

          if (isUmaOka) {
            result.playerPool = data[2];
          } else {
            result.playerNames = data[2];
          }
          return result;
        } else {
          throw new Error(`Unsupported data version: ${version}`);
        }
      } else if (typeof parsedData === 'object' && parsedData !== null) { // Old pako-on-json format
        return parsedData as ParsedState;
      } else {
        throw new Error('Invalid parsed data type');
      }
    } catch (pakoError) {
      try { // Fallback to legacy uncompressed format
        const decodedJsonString = decodeURIComponent(escape(atob(encodedData)));
        return JSON.parse(decodedJsonString) as ParsedState;
      } catch (legacyError) {
        console.error('URL 해시에서 상태를 파싱하는데 오류가 발생했습니다 (모든 방식 실패): ', pakoError, legacyError);
        return null;
      }
    }
  }, []);

  const loadedState = useMemo(() => parseStateFromUrl(isUmaOkaPage), [parseStateFromUrl, isUmaOkaPage]);

  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    if (loadedState?.playerNames && Array.isArray(loadedState.playerNames)) {
      return loadedState.playerNames;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `Player${i + 1}`);
  });

  const [playerPool, setPlayerPool] = useState<string[]>(() => {
    if (isUmaOkaPage && loadedState?.playerPool && Array.isArray(loadedState.playerPool)) {
      return loadedState.playerPool;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `Player${i + 1}`);
  });

  const [chomboCounts, setChomboCounts] = useState<number[]>(() => {
    if (isUmaOkaPage && loadedState?.chomboCounts && Array.isArray(loadedState.chomboCounts)) {
      return loadedState.chomboCounts;
    }
    return Array(PLAYER_COUNT).fill(0);
  });

  const getInitialGames = useCallback((isUmaOka: boolean, state: ParsedState | null): Game[] => {
    const loadedGames = state?.games;
    if (Array.isArray(loadedGames) && loadedGames.length > 0) {
      const maxId = loadedGames.length > 0 ? Math.max(...loadedGames.map(g => g.id)) : 0;
      const newGameId = maxId + 1;

      let newGame: Game;
      if (isUmaOka) {
        newGame = { id: newGameId, participants: getDefaultUmaOkaParticipants(), scores: { east: '', south: '', west: '', north: '' }, isEditable: true };
      } else {
        newGame = { id: newGameId, scores: Array(PLAYER_COUNT).fill(''), isEditable: true, playerPositions: getDefaultPlayerPositions(), umaType: null };
      }
      return [...loadedGames, newGame];
    }
    // Default initial state if no data is loaded
    if (isUmaOka) {
      return [{ id: 1, participants: getDefaultUmaOkaParticipants(), scores: { east: '', south: '', west: '', north: '' }, isEditable: true }];
    } else {
      return [{
        id: 1,
        scores: Array(PLAYER_COUNT).fill(''),
        isEditable: true,
        playerPositions: getDefaultPlayerPositions(),
        umaType: null
      }];
    }
  }, []);

  const [games, setGames] = useState<Game[]>(() => getInitialGames(isUmaOkaPage, loadedState));

  useEffect(() => {
    setGames(getInitialGames(isUmaOkaPage, loadedState));
  }, [isUmaOkaPage, loadedState, getInitialGames]);

  const [startingScore, setStartingScore] = useState<number>(() => {
    if (typeof loadedState?.startingScore === 'number') {
      return loadedState.startingScore;
    }
    return 25000;
  });

  const [isOkaEnabled, setIsOkaEnabled] = useState<boolean>(loadedState?.isOkaEnabled || false);
  const [tieHandlingMode, setTieHandlingMode] = useState<TieHandlingMode>(loadedState?.tieHandlingMode || 'split');

  const [returnScore, setReturnScore] = useState<number>(() => {
    if (typeof loadedState?.returnScore === 'number') {
      return loadedState.returnScore;
    }
    return isOkaEnabled ? startingScore + 5000 : startingScore;
  });

  const [activeUmaOka, setActiveUmaOka] = useState<{ uma: string | null; oka: boolean }>(() => {
    return loadedState?.activeUmaOka || { uma: null, oka: false };
  });

  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [shouldSaveOnUpdate, setShouldSaveOnUpdate] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ show: false, text: '' });

  useEffect(() => {
    if (loadedState?.language) {
      setCurrentLanguage(loadedState.language as Language);
    }
  }, [loadedState, setCurrentLanguage]);

  useEffect(() => {
    if (!isOkaEnabled) {
      setReturnScore(startingScore);
    }
  }, [isOkaEnabled, startingScore]);

  useEffect(() => {
    if (!translations || !translations.ko || !translations.en || !translations.ja) {
      return;
    }
    const updateDefaultNames = (prevNames: string[]) => prevNames.map((name, index) => {
      const defaultNamePattern = new RegExp(`^(?:${translations.ko.player}|${translations.en.player}|${translations.ja.player})${index + 1}$`);
      if (defaultNamePattern.test(name) || name === `Player${index + 1}` || name === `플레이어${index + 1}` || name === `プレイヤー${index + 1}`) {
        return `${getText('player')}${index + 1}`;
      }
      return name;
    });
    setPlayerNames(updateDefaultNames);
    setPlayerPool(updateDefaultNames);
  }, [currentLanguage, getText, translations]);

  const scoreMultiplier = useMemo(() => {
    const len = String(startingScore).length;
    if (len >= 5) return 1;
    if (len <= 0) return 1;
    return 10 ** (5 - len);
  }, [startingScore]);

  const scaledStartingScore = useMemo(() => startingScore * scoreMultiplier, [startingScore, scoreMultiplier]);
  const scaledReturnScore = useMemo(() => returnScore * scoreMultiplier, [returnScore, scoreMultiplier]);

  const totalTargetScore = useMemo(() => scaledStartingScore * 4, [scaledStartingScore]);

  const generateShareableUrl = useCallback(() => {
    const stateToSave = {
      games: games.filter(g => !g.isEditable), // Only save completed games
      startingScore,
      language: currentLanguage,
      ...(isUmaOkaPage ? { playerPool, activeUmaOka, returnScore, isOkaEnabled, tieHandlingMode } : { playerNames })
    };

    // New optimized array format
    const optimizedGames = stateToSave.games.map(game => {
      if (isUmaOkaPage) {
        // Ensure participants exist before accessing properties
        if (!game.participants) {
          console.error("Game participants missing for game:", game);
          // Return a default or handle error appropriately. 
          // Returning dummy data to prevent crash, but this case should ideally be prevented upstream.
          return [0, 1, 2, 3, "0", "0", "0", "0"];
        }
        const parts = game.participants;
        const scores = game.scores as UmaOkaScores;
        return [
          parts.east, parts.south, parts.west, parts.north,
          scores.east, scores.south, scores.west, scores.north
        ];
      }
      return game.scores;
    });

    const optimizedData = [
      DATA_STRUCTURE_VERSION,
      startingScore,
      isUmaOkaPage ? playerPool : playerNames,
      optimizedGames,
      currentLanguage,
      isUmaOkaPage ? [activeUmaOka.uma, activeUmaOka.oka] : null,
      isUmaOkaPage ? returnScore : null,
      isUmaOkaPage ? isOkaEnabled : null,
      isUmaOkaPage ? tieHandlingMode : undefined,
      isUmaOkaPage ? chomboCounts : undefined,
    ];

    const jsonString = JSON.stringify(optimizedData);
    const compressedData = deflate(jsonString);
    const binaryString = bytesToBinaryString(compressedData);
    const encodedData = btoa(binaryString);
    return `${window.location.origin}${location.pathname}#data=${encodedData}`;
  }, [games, startingScore, currentLanguage, isUmaOkaPage, playerPool, playerNames, activeUmaOka, location.pathname, returnScore, isOkaEnabled, tieHandlingMode, chomboCounts]);

  const copyToClipboard = useCallback(() => {
    const url = generateShareableUrl();
    navigator.clipboard.writeText(url).then(() => {
      setShowCopyMessage(true);
      window.history.replaceState(null, '', url);
      setTimeout(() => setShowCopyMessage(false), 2000);
    }).catch(err => {
      console.error('URL을 클립보드에 복사하는데 실패했습니다.', err);
    });
  }, [generateShareableUrl]);

  useEffect(() => {
    if (shouldSaveOnUpdate) {
      copyToClipboard();
      setShouldSaveOnUpdate(false);
    }
  }, [shouldSaveOnUpdate, copyToClipboard]);

  const currentTotal = useMemo(() => {
    if (!games || games.length === 0) return 0;
    const lastGame = games[games.length - 1];
    if (!lastGame || !lastGame.scores) return 0;

    const lastGameScores = isUmaOkaPage ? Object.values(lastGame.scores as UmaOkaScores) : lastGame.scores as string[];
    // Cast strict logic: in umaoka scores is obj, normal is array
    return (lastGameScores as string[]).reduce((sum, score) => sum + ((parseInt(score, 10) || 0) * scoreMultiplier), 0);
  }, [games, isUmaOkaPage, scoreMultiplier]);

  const handleAddGame = () => {
    setGames(prevGames => {
      const updatedGames = prevGames.map((game) => {
        if (game.isEditable) {
          if (isUmaOkaPage) {
            const newScores: UmaOkaScores = { ...(game.scores as UmaOkaScores) };
            INITIAL_PLAYER_POSITIONS.forEach(position => {
              if (newScores[position] == null || newScores[position] === '') {
                newScores[position] = '0';
              }
            });
            Object.keys(newScores).forEach(position => {
              newScores[position] = String(parseInt(newScores[position], 10));
            });
            return { ...game, scores: newScores, isEditable: false };
          } else {
            const newScores = (game.scores as string[]).map(score => (score === '' || score === null ? '0' : String(score)));
            return { ...game, scores: newScores, isEditable: false };
          }
        }
        return game;
      });
      const maxId = updatedGames.length > 0 ? Math.max(...updatedGames.map(g => g.id)) : 0;
      const newGameId = maxId + 1;

      let newGame: Game;
      if (isUmaOkaPage) {
        newGame = { id: newGameId, participants: getDefaultUmaOkaParticipants(), scores: { east: '', south: '', west: '', north: '' }, isEditable: true };
      } else {
        newGame = {
          id: newGameId,
          scores: Array(PLAYER_COUNT).fill(''),
          isEditable: true,
          playerPositions: getDefaultPlayerPositions(),
          umaType: null
        };
      }
      return [...updatedGames, newGame];
    });
    setShouldSaveOnUpdate(true);
  };

  const handleScoreChange = (gameId: number, playerIndex: number, newScore: string) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? {
          ...game,
          scores: (game.scores as string[]).map((score, idx) => {
            if (idx === playerIndex) {
              const filteredScore = newScore.replace(/[^0-9-.]/g, '');
              if (filteredScore === '' || filteredScore === '-') return filteredScore;
              const num = parseInt(filteredScore, 10);
              return isNaN(num) ? '' : String(num); // Ensure string
            }
            return score;
          }),
        }
        : game
    ));
  };

  const handleScoreButtonClick = (gameId: number, playerIndex: number, operation: 'increment' | 'decrement') => {
    const amount = getIncrementAmount(startingScore);
    setGames(currentGames =>
      currentGames.map(game => {
        if (game.id === gameId) {
          const currentScore = parseInt((game.scores as string[])[playerIndex], 10) || 0;
          const newScore = operation === 'increment' ? currentScore + amount : currentScore - amount;
          return {
            ...game,
            scores: (game.scores as string[]).map((score, idx) => (idx === playerIndex ? String(newScore) : score)),
          };
        }
        return game;
      })
    );
  };

  // Type for update function
  const handlePlayerNameChange = (index: number, newName: string) => {
    setPlayerNames(prevNames => prevNames.map((name, idx) => (idx === index ? newName : name)));
  };

  const handlePositionChange = (gameId: number, playerIndex: number, newPosition: string) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? {
          ...game,
          playerPositions: game.playerPositions!.map((pos, idx) =>
            idx === playerIndex ? newPosition : pos
          ),
        }
        : game
    ));
  };

  const handleAddPlayerToPool = (name: string) => {
    if (name && !playerPool.includes(name)) {
      setPlayerPool(prev => [...prev, name]);
      setChomboCounts(prev => [...prev, 0]);
    }
  };

  const handleAddChombo = (index: number) => {
    setChomboCounts(prev => prev.map((count, playerIndex) => playerIndex === index ? count + 1 : count));
  };

  const handleUndoChombo = (index: number) => {
    setChomboCounts(prev => prev.map((count, playerIndex) => playerIndex === index ? Math.max(0, count - 1) : count));
  };

  const handleRemovePlayerFromPool = (indexToRemove: number) => {
    setPlayerPool(prev => prev.filter((_, index) => index !== indexToRemove));
    setChomboCounts(prev => prev.filter((_, index) => index !== indexToRemove));
    setGames(prevGames => prevGames.map(game => {
      if (!isUmaOkaPage || !game.participants) return game;
      const newParticipants: UmaOkaParticipants = { ...game.participants! }; // Use non-null assertion as checked above
      let changed = false;
      const positions = ['east', 'south', 'west', 'north'] as const;
      positions.forEach(position => {
        const pIndex = game.participants![position];
        if (pIndex === indexToRemove) {
          changed = true;
          // Logic: originally seemingly skipped or kept? Use -1 for removed?
          // Previous logic relied on not adding it to newParticipants if logic fell through?
          // But `newParticipants` keys must be full for strict type.
          // Setting to -1 to indicate removed player slot
          newParticipants[position] = -1;
        } else if (pIndex > indexToRemove) {
          newParticipants[position] = pIndex - 1;
          changed = true;
        }
      });
      return changed ? { ...game, participants: newParticipants } : game;
    }));
  };

  const handleUpdatePlayerInPool = (index: number, newName: string) => {
    setPlayerPool(prev => prev.map((name, i) => (i === index ? newName : name)));
  };

  const handleUmaOkaScoreChange = (gameId: number, position: string, newScore: string) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        // Type assertion needed for nested object update in TS
        ? { ...game, scores: { ...(game.scores as UmaOkaScores), [position]: newScore.replace(/[^0-9-.]/g, '') } }
        : game
    ));
  };

  const handleUmaOkaScoreButtonClick = (gameId: number, position: string, operation: 'increment' | 'decrement') => {
    const amount = getIncrementAmount(startingScore);
    setGames(currentGames =>
      currentGames.map(game => {
        if (game.id === gameId) {
          const currentScore = parseInt((game.scores as UmaOkaScores)[position], 10) || 0;
          const newScore = operation === 'increment' ? currentScore + amount : currentScore - amount;
          return {
            ...game,
            scores: { ...(game.scores as UmaOkaScores), [position]: String(newScore) },
          };
        }
        return game;
      })
    );
  };

  const handlePlayerForPositionChange = (gameId: number, position: string, playerIndex: string) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? { ...game, participants: { ...game.participants!, [position]: parseInt(playerIndex, 10) } }
        : game
    ));
  };

  const totalScores = useMemo(() => {
    if (!isUmaOkaPage) {
      return Array(PLAYER_COUNT).fill(0).map((_, playerIndex) =>
        games.reduce((sum, game) => {
          const score = (parseInt((game.scores as string[])[playerIndex], 10) || 0) * scoreMultiplier;
          return sum + score;
        }, 0)
      );
    }
    const finalScores = Array(playerPool.length).fill(0);
    const okaAmount = isOkaEnabled ? (scaledReturnScore - scaledStartingScore) * 4 / 1000 : 0;

    games.forEach(game => {
      if (game.isEditable) {
        return;
      }
      if (game.participants && game.scores && Object.keys(game.participants).length === 4) {
        const playerRawScores: Record<number, number> = {};
        const gameScores = game.scores as UmaOkaScores;
        Object.entries(game.participants).forEach(([position, playerIndex]) => {
          const score = (parseInt(gameScores[position], 10) || 0) * scoreMultiplier;
          playerRawScores[playerIndex] = score;
        });
        if (Object.keys(playerRawScores).length !== 4) return;

        const gameFinalScores: Record<number, number> = {};
        const { uma } = activeUmaOka;
        const tieAwards = calculateTieAwards(playerRawScores, uma, isOkaEnabled ? okaAmount : 0, tieHandlingMode, Object.fromEntries(Object.entries(game.participants).map(([pos, pIdx]) => [pIdx, pos])));
        Object.keys(playerRawScores).forEach(playerIndexStr => {
          const playerIndex = Number(playerIndexStr);
          gameFinalScores[playerIndex] = (playerRawScores[playerIndex] - scaledReturnScore) / 1000 + tieAwards[playerIndex];
        });
        Object.entries(gameFinalScores).forEach(([playerIndexStr, score]) => {
          const playerIndex = parseInt(playerIndexStr, 10);
          if (finalScores[playerIndex] !== undefined) {
            finalScores[playerIndex] += score;
          }
        });
      }
    });
    return finalScores.map((score, index) => (score - (chomboCounts[index] || 0) * 20).toFixed(1));
  }, [games, isUmaOkaPage, playerPool, activeUmaOka, isOkaEnabled, scoreMultiplier, scaledStartingScore, scaledReturnScore, tieHandlingMode, chomboCounts]);

  const handleDeleteGame = (gameIdToDelete: number) => {
    setGames(prevGames => prevGames.filter(game => game.id !== gameIdToDelete));
  };

  const handleUmaOkaToggle = useCallback((type: string) => {
    setActiveUmaOka(prev => {
      if (type === 'oka') {
        // This button is now a display element, logic is handled by onOkaToggle
        return prev;
      } else {
        return { ...prev, uma: prev.uma === type ? null : type };
      }
    });
  }, []);

  const onOkaToggle = useCallback(() => {
    if (!isOkaEnabled) {
      // Oka is 5,000 actual points above the starting score.
      // Convert that offset back to the user's input unit (e.g. 250 -> 300).
      setReturnScore(startingScore + 5000 / scoreMultiplier);
    }
    setIsOkaEnabled(prev => !prev);
  }, [isOkaEnabled, setReturnScore, startingScore, scoreMultiplier]);

  const isUmaOkaGlobalDisabled = useMemo(() => {
    return startingScore % 10 !== 0 || (isOkaEnabled && returnScore % 10 !== 0);
  }, [startingScore, returnScore, isOkaEnabled]);

  const addRecordButtonStatus = useMemo(() => {
    if (isUmaOkaPage) {
      const lastGame = games[games.length - 1];
      if (!lastGame || !lastGame.participants) return 'no_participants';

      const participantIndices = Object.values(lastGame.participants);
      if (participantIndices.length !== 4) return 'not_enough_players';

      const uniqueParticipantIndices = new Set(participantIndices);
      if (uniqueParticipantIndices.size !== 4) return 'duplicate_players';
    }
    if (currentTotal !== totalTargetScore) return 'total_mismatch';
    return null; // All conditions met
  }, [currentTotal, totalTargetScore, games, isUmaOkaPage]);

  const handleRecordButtonPress = () => {
    const status = addRecordButtonStatus;
    if (status === null) {
      handleAddGame();
    } else {
      let messageKey: TranslationKey | '' = '';
      switch (status) {
        case 'total_mismatch':
          messageKey = 'popup_total_mismatch';
          break;
        case 'not_enough_players':
          messageKey = 'popup_not_enough_players';
          break;
        case 'duplicate_players':
          messageKey = 'popup_duplicate_players';
          break;
        default:
          messageKey = 'popup_generic_error';
      }
      setPopupMessage({ show: true, text: getText(messageKey as TranslationKey) });
      setTimeout(() => setPopupMessage({ show: false, text: '' }), 2000);
    }
  };

  const handleScoreInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleRecordButtonPress();
    }
  };

  return (
    <div className="w-full max-w-6xl flex flex-col items-center xs:p-0 px-2 py-4 sm:px-4">
      {isUmaOkaPage && (
        <p className="w-full max-w-6xl mb-4 text-sm sm:text-base text-gray-600">
          {getText('umaOkaGuide')}
        </p>
      )}
      {isUmaOkaPage && (<PlayerTotals playerPool={playerPool} totalScores={totalScores} getText={getText} />)}


      {isUmaOkaPage ? (
        <UmaOkaTable
          playerNames={playerPool}
          games={games}
          getText={getText}
          handleDeleteGame={handleDeleteGame}
          handleScoreInputKeyDown={handleScoreInputKeyDown}
          handleUmaOkaScoreChange={handleUmaOkaScoreChange}
          handlePlayerForPositionChange={handlePlayerForPositionChange}
          handleUmaOkaScoreButtonClick={handleUmaOkaScoreButtonClick}
        />
      ) : (
        <Table
          playerNames={playerNames}
          games={games}
          totalScores={totalScores}
          getText={getText}
          handlePlayerNameChange={handlePlayerNameChange}
          handleScoreChange={handleScoreChange}
          handleDeleteGame={handleDeleteGame}
          handleScoreInputKeyDown={handleScoreInputKeyDown}
          handlePositionChange={handlePositionChange}
          isUmaOkaPage={isUmaOkaPage}
          handleScoreButtonClick={handleScoreButtonClick}
        />
      )}
      <ControlPanel
        startingScore={startingScore}
        setStartingScore={setStartingScore}
        returnScore={returnScore}
        setReturnScore={setReturnScore}
        isOkaEnabled={isOkaEnabled}
        onOkaToggle={onOkaToggle}
        totalTargetScore={totalTargetScore}
        currentTotal={currentTotal}
        onRecordButtonPress={handleRecordButtonPress}
        isAddRecordButtonDisabled={addRecordButtonStatus !== null}
        copyToClipboard={copyToClipboard}
        getText={getText}
        showUmaOkaControls={isUmaOkaPage}
        handleUmaOkaToggle={handleUmaOkaToggle}
        activeUmaOka={activeUmaOka}
        tieHandlingMode={tieHandlingMode}
        setTieHandlingMode={setTieHandlingMode}
        isUmaOkaGlobalDisabled={isUmaOkaGlobalDisabled}
        showShareWarning={isUmaOkaPage}
      />
      <MessageDisplay message={getText('copied')} isVisible={showCopyMessage} />
      <MessageDisplay message={popupMessage.text} isVisible={popupMessage.show} />
      <div className="mt-6 sm:mt-8 text-xs sm:text-sm md:text-lg text-gray-600">
        <p>{getText('totalGames', { count: games.filter(g => !g.isEditable).length })}</p>
      </div>      {isUmaOkaPage && (
        <PlayerManagementAndScores
          playerPool={playerPool}
          onAddPlayer={handleAddPlayerToPool}
          onRemovePlayer={handleRemovePlayerFromPool}
          onUpdatePlayer={handleUpdatePlayerInPool}
          getText={getText}
          chomboCounts={chomboCounts}
          onAddChombo={handleAddChombo}
          onUndoChombo={handleUndoChombo}
        />
      )}
    </div>
  );
}

export default ScoreTrackerPage;
