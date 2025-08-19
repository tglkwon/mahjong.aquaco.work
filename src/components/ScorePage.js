import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import pako from 'pako';
import Table from './Table';
import PlayerManagementAndScores from './PlayerManagementAndScores';
import ControlPanel from './ControlPanel';
import MessageDisplay from './MessageDisplay';
import UmaOkaTable from './UmaOkaTable';

const PLAYER_COUNT = 4;
const INITIAL_PLAYER_POSITIONS = ['east', 'south', 'west', 'north'];
const DATA_STRUCTURE_VERSION = 3; // v2: pako on optimized array, v3: added returnScore, isOkaEnabled

const getDefaultPlayerPositions = () => {
  return [...INITIAL_PLAYER_POSITIONS];
};

const getDefaultUmaOkaParticipants = () => {
  return { east: 0, south: 1, west: 2, north: 3 };
};

const getIncrementAmount = (score) => {
  const digits = String(score).length;
  return 10 ** (digits - 2);
};

// Helper to convert binary string to Uint8Array
const binaryStringToBytes = (binaryString) => {
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to convert Uint8Array to binary string
const bytesToBinaryString = (bytes) => {
  let binaryString = '';
  bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });
  return binaryString;
};


function ScoreTrackerPage({ currentLanguage, setCurrentLanguage, getText, translations }) {
  const location = useLocation();
  const isUmaOkaPage = location.pathname === '/set_score_umaoka';

  const parseStateFromUrl = useCallback((isUmaOka) => {
    const hash = window.location.hash;
    if (!hash.startsWith('#data=')) return null;

    const encodedData = hash.substring(hash.indexOf('=') + 1);

    try {
      const binaryString = atob(encodedData);
      const bytes = binaryStringToBytes(binaryString);
      const inflatedData = pako.inflate(bytes, { to: 'string' });
      const parsedData = JSON.parse(inflatedData);

      if (Array.isArray(parsedData)) { // New optimized array format
        const version = parsedData[0];
        if (version >= 2) { // Handle v2 and later
          const restoredGames = parsedData[3].map((gameData, index) => {
            if (isUmaOka) {
              return {
                id: index + 1,
                participants: { east: gameData[0], south: gameData[1], west: gameData[2], north: gameData[3] },
                scores: { east: gameData[4], south: gameData[5], west: gameData[6], north: gameData[7] },
                isEditable: false,
              };
            } else {
              return {
                id: index + 1,
                scores: gameData,
                isEditable: false,
                playerPositions: getDefaultPlayerPositions(),
                umaType: null
              };
            }
          });

          const result = {
            startingScore: parsedData[1],
            games: restoredGames,
            language: parsedData[4],
            activeUmaOka: isUmaOka && parsedData[5] ? { uma: parsedData[5][0], oka: parsedData[5][1] } : { uma: null, oka: false },
          };
          
          if (version === 3) {
            result.returnScore = parsedData[6];
            result.isOkaEnabled = parsedData[7];
          }

          if (isUmaOka) {
            result.playerPool = parsedData[2];
          } else {
            result.playerNames = parsedData[2];
          }
          return result;
        } else {
          throw new Error(`Unsupported data version: ${version}`);
        }
      } else if (typeof parsedData === 'object' && parsedData !== null) { // Old pako-on-json format
        return parsedData;
      } else {
        throw new Error('Invalid parsed data type');
      }
    } catch (pakoError) {
      try { // Fallback to legacy uncompressed format
        const decodedJsonString = decodeURIComponent(escape(atob(encodedData)));
        return JSON.parse(decodedJsonString);
      } catch (legacyError) {
        console.error('URL 해시에서 상태를 파싱하는데 오류가 발생했습니다 (모든 방식 실패): ', pakoError, legacyError);
        return null;
      }
    }
  }, []);

  const loadedState = useMemo(() => parseStateFromUrl(isUmaOkaPage), [parseStateFromUrl, isUmaOkaPage]);

  const [playerNames, setPlayerNames] = useState(() => {
    if (loadedState?.playerNames && Array.isArray(loadedState.playerNames)) {
      return loadedState.playerNames;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `Player${i + 1}`);
  });

  const [playerPool, setPlayerPool] = useState(() => {
    if (isUmaOkaPage && loadedState?.playerPool && Array.isArray(loadedState.playerPool)) {
      return loadedState.playerPool;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `Player${i + 1}`);
  });

  const [games, setGames] = useState(() => {
    const loadedGames = loadedState?.games;
    if (Array.isArray(loadedGames) && loadedGames.length > 0) {
      const newGameId = loadedGames.length > 0 ? Math.max(...loadedGames.map(g => g.id)) + 1 : 1;
      const newGame = isUmaOkaPage
        ? { id: newGameId, participants: getDefaultUmaOkaParticipants(), scores: {}, isEditable: true }
        : { id: newGameId, scores: Array(PLAYER_COUNT).fill(''), isEditable: true, playerPositions: getDefaultPlayerPositions(), umaType: null };
      return [...loadedGames, newGame];
    }
    // Default initial state if no data is loaded
    if (isUmaOkaPage) {
      return [{ id: 1, participants: getDefaultUmaOkaParticipants(), scores: {}, isEditable: true }];
    } else {
      return [{
        id: 1,
        scores: Array(PLAYER_COUNT).fill(''),
        isEditable: true,
        playerPositions: getDefaultPlayerPositions(),
        umaType: null
      }];
    }
  });

  const [startingScore, setStartingScore] = useState(() => {
    if (typeof loadedState?.startingScore === 'number') {
      return loadedState.startingScore;
    }
    return 25000;
  });

  const [isOkaEnabled, setIsOkaEnabled] = useState(loadedState?.isOkaEnabled || false);

  const [returnScore, setReturnScore] = useState(() => {
    if (typeof loadedState?.returnScore === 'number') {
      return loadedState.returnScore;
    }
    return isOkaEnabled ? 30000 : startingScore;
  });

  const [activeUmaOka, setActiveUmaOka] = useState(() => {
    return loadedState?.activeUmaOka || { uma: null, oka: false };
  });

  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [shouldSaveOnUpdate, setShouldSaveOnUpdate] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ show: false, text: '' });

  useEffect(() => {
    if (loadedState?.language) {
      setCurrentLanguage(loadedState.language);
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
    const updateDefaultNames = (prevNames) => prevNames.map((name, index) => {
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
      ...(isUmaOkaPage ? { playerPool, activeUmaOka, returnScore, isOkaEnabled } : { playerNames })
    };

    // New optimized array format
    const optimizedGames = stateToSave.games.map(game => {
      if (isUmaOkaPage) {
        return [
          game.participants.east, game.participants.south, game.participants.west, game.participants.north,
          game.scores.east, game.scores.south, game.scores.west, game.scores.north
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
    ];

    const jsonString = JSON.stringify(optimizedData);
    const compressedData = pako.deflate(jsonString);
    const binaryString = bytesToBinaryString(compressedData);
    const encodedData = btoa(binaryString);
    return `${window.location.origin}${location.pathname}#data=${encodedData}`;
  }, [games, startingScore, currentLanguage, isUmaOkaPage, playerPool, playerNames, activeUmaOka, location.pathname, returnScore, isOkaEnabled]);

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

    const lastGameScores = isUmaOkaPage ? Object.values(lastGame.scores) : lastGame.scores;
    return lastGameScores.reduce((sum, score) => sum + ((parseInt(score, 10) || 0) * scoreMultiplier), 0);
  }, [games, isUmaOkaPage, scoreMultiplier]);

  const handleAddGame = () => {
    setGames(prevGames => {
      const updatedGames = prevGames.map((game) => {
        if (game.isEditable) {
          if (isUmaOkaPage) {
            const newScores = { ...game.scores };
            INITIAL_PLAYER_POSITIONS.forEach(position => {
              if (newScores[position] == null || newScores[position] === '') {
                newScores[position] = '0';
              }
            });
            Object.keys(newScores).forEach(position => {
              newScores[position] = parseInt(newScores[position], 10);
            });
            return { ...game, scores: newScores, isEditable: false };
          } else {
            const newScores = game.scores.map(score => (score === '' || score === null ? '0' : String(score)));
            return { ...game, scores: newScores, isEditable: false };
          }
        }
        return game;
      });
      const newGameId = updatedGames.length > 0 ? Math.max(...updatedGames.map(g => g.id)) + 1 : 1;
      const newGame = isUmaOkaPage
        ? { id: newGameId, participants: getDefaultUmaOkaParticipants(), scores: {}, isEditable: true }
        : {
            id: newGameId,
            scores: Array(PLAYER_COUNT).fill(''),
            isEditable: true,
            playerPositions: getDefaultPlayerPositions(),
            umaType: null
          };
      return [...updatedGames, newGame];
    });
    setShouldSaveOnUpdate(true);
  };

  // ... (The rest of the handler functions remain the same)
  const handleScoreChange = (gameId, playerIndex, newScore) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? {
            ...game,
            scores: game.scores.map((score, idx) => {
              if (idx === playerIndex) {
                const filteredScore = newScore.replace(/[^0-9-.]/g, '');
                if (filteredScore === '' || filteredScore === '-') return filteredScore;
                const num = parseInt(filteredScore, 10);
                return isNaN(num) ? '' : num;
              }
              return score;
            }),
          }
        : game
    ));
  };

  const handleScoreButtonClick = (gameId, playerIndex, operation) => {
    const amount = getIncrementAmount(startingScore);
    setGames(currentGames =>
        currentGames.map(game => {
            if (game.id === gameId) {
                const currentScore = parseInt(game.scores[playerIndex], 10) || 0;
                const newScore = operation === 'increment' ? currentScore + amount : currentScore - amount;
                return {
                    ...game,
                    scores: game.scores.map((score, idx) => (idx === playerIndex ? newScore : score)),
                };
            }
            return game;
        })
    );
  };

  const handlePlayerNameChange = (index, newName) => {
    setPlayerNames(prevNames => prevNames.map((name, idx) => (idx === index ? newName : name)));
  };

  const handlePositionChange = (gameId, playerIndex, newPosition) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? {
            ...game,
            playerPositions: game.playerPositions.map((pos, idx) =>
              idx === playerIndex ? newPosition : pos
            ),
          }
        : game
    ));
  };

  const handleAddPlayerToPool = (name) => {
    if (name && !playerPool.includes(name)) {
      setPlayerPool(prev => [...prev, name]);
    }
  };

  const handleRemovePlayerFromPool = (indexToRemove) => {
    setPlayerPool(prev => prev.filter((_, index) => index !== indexToRemove));
    setGames(prevGames => prevGames.map(game => {
      if (!isUmaOkaPage || !game.participants) return game;
      const newParticipants = {};
      let changed = false;
      Object.entries(game.participants).forEach(([position, pIndex]) => {
        if (pIndex === indexToRemove) {
          changed = true;
        } else if (pIndex > indexToRemove) {
          newParticipants[position] = pIndex - 1;
          changed = true;
        } else {
          newParticipants[position] = pIndex;
        }
      });
      return changed ? { ...game, participants: newParticipants } : game;
    }));
  };

  const handleUpdatePlayerInPool = (index, newName) => {
    setPlayerPool(prev => prev.map((name, i) => (i === index ? newName : name)));
  };

  const handleUmaOkaScoreChange = (gameId, position, newScore) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? { ...game, scores: { ...game.scores, [position]: newScore.replace(/[^0-9-.]/g, '') } }
        : game
    ));
  };

  const handleUmaOkaScoreButtonClick = (gameId, position, operation) => {
    const amount = getIncrementAmount(startingScore);
    setGames(currentGames =>
        currentGames.map(game => {
            if (game.id === gameId) {
                const currentScore = parseInt(game.scores[position], 10) || 0;
                const newScore = operation === 'increment' ? currentScore + amount : currentScore - amount;
                return {
                    ...game,
                    scores: { ...game.scores, [position]: newScore },
                };
            }
            return game;
        })
    );
  };

  const handlePlayerForPositionChange = (gameId, position, playerIndex) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? { ...game, participants: { ...game.participants, [position]: parseInt(playerIndex, 10) } }
        : game
    ));
  };

  const totalScores = useMemo(() => {
    if (!isUmaOkaPage) {
      return Array(PLAYER_COUNT).fill(0).map((_, playerIndex) =>
        games.reduce((sum, game) => {
          const score = (parseInt(game.scores[playerIndex], 10) || 0) * scoreMultiplier;
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
        const playerRawScores = {};
        Object.entries(game.participants).forEach(([position, playerIndex]) => {
          const score = (parseInt(game.scores[position], 10) || 0) * scoreMultiplier;
          playerRawScores[playerIndex] = score;
        });
        if (Object.keys(playerRawScores).length !== 4) return;
        const positionOrder = { 'east': 1, 'south': 2, 'west': 3, 'north': 4 };
        const playerIndexToPosition = Object.fromEntries(
          Object.entries(game.participants).map(([pos, pIdx]) => [pIdx, pos])
        );
        const rankedPlayers = Object.keys(playerRawScores)
          .map(pIndex => ({ playerIndex: parseInt(pIndex, 10), score: playerRawScores[pIndex] }))
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const posA = playerIndexToPosition[a.playerIndex];
            const posB = playerIndexToPosition[b.playerIndex];
            return positionOrder[posA] - positionOrder[posB];
          });
        const gameFinalScores = {};
        const { uma } = activeUmaOka;
        rankedPlayers.forEach((playerData, rank) => {
          const { playerIndex } = playerData;
          let finalScore = (playerRawScores[playerIndex] - scaledReturnScore) / 1000;

          if (uma === '1-2') {
            if (rank === 0) finalScore += 20;
            else if (rank === 1) finalScore += 10;
            else if (rank === 2) finalScore -= 10;
            else if (rank === 3) finalScore -= 20;
          } else if (uma === '1-3') {
            if (rank === 0) finalScore += 30;
            else if (rank === 1) finalScore += 10;
            else if (rank === 2) finalScore -= 10;
            else if (rank === 3) finalScore -= 30;
          }
          if (isOkaEnabled && rank === 0) {
            finalScore += okaAmount;
          }
          gameFinalScores[playerIndex] = finalScore;
        });
        Object.entries(gameFinalScores).forEach(([playerIndexStr, score]) => {
          const playerIndex = parseInt(playerIndexStr, 10);
          if (finalScores[playerIndex] !== undefined) {
            finalScores[playerIndex] += score;
          }
        });
      }
    });
    return finalScores.map(score => score.toFixed(1));
  }, [games, isUmaOkaPage, playerPool, activeUmaOka, isOkaEnabled, scoreMultiplier, scaledStartingScore, scaledReturnScore]);

  const handleDeleteGame = (gameIdToDelete) => {
    setGames(prevGames => prevGames.filter(game => game.id !== gameIdToDelete));
  };

  const handleUmaOkaToggle = useCallback((type) => {
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
    setIsOkaEnabled(prev => !prev);
  }, []);

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
      let messageKey = '';
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
      setPopupMessage({ show: true, text: getText(messageKey) });
      setTimeout(() => setPopupMessage({ show: false, text: '' }), 2000);
    }
  };

  const handleScoreInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleRecordButtonPress();
    }
  };

  return (
    <div className="w-full max-w-6xl flex flex-col items-center xs:p-0 px-2 py-4 sm:px-4">
      {isUmaOkaPage && (
        <PlayerManagementAndScores
          playerPool={playerPool}
          onAddPlayer={handleAddPlayerToPool}
          onRemovePlayer={handleRemovePlayerFromPool}
          onUpdatePlayer={handleUpdatePlayerInPool}
          totalScores={totalScores}
          getText={getText}
        />
      )}
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
        isUmaOkaGlobalDisabled={isUmaOkaGlobalDisabled}
      />
      <MessageDisplay message={getText('copied')} isVisible={showCopyMessage} />
      <MessageDisplay message={popupMessage.text} isVisible={popupMessage.show} />
      <div className="mt-6 sm:mt-8 text-xs sm:text-sm md:text-lg text-gray-600">
        <p>{getText('totalGames', { count: games.filter(g => !g.isEditable).length })}</p>
      </div>
    </div>
  );
}

export default ScoreTrackerPage;