import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Table from './Table';
import PlayerManagementAndScores from './PlayerManagementAndScores';
import ControlPanel from './ControlPanel';
import MessageDisplay from './MessageDisplay';
import UmaOkaTable from './UmaOkaTable';

const PLAYER_COUNT = 4;
const INITIAL_PLAYER_POSITIONS = ['east', 'south', 'west', 'north'];

const getDefaultPlayerPositions = () => {
  return [...INITIAL_PLAYER_POSITIONS];
};

const getDefaultUmaOkaParticipants = () => {
  return { east: 0, south: 1, west: 2, north: 3 };
};

const getIncrementAmount = (targetSum) => {
  const digits = String(targetSum).length;
  return 10 ** (digits - 2);
};

function ScoreTrackerPage({ currentLanguage, setCurrentLanguage, getText, translations }) {
  const location = useLocation();
  const isUmaOkaPage = location.pathname === '/set_score_umaoka';

  const parseStateFromUrl = useCallback(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#data=')) {
      try {
        const encodedData = hash.substring(hash.indexOf('=') + 1);
        const decodedJsonString = decodeURIComponent(escape(atob(encodedData)));
        return JSON.parse(decodedJsonString);
      } catch (error) {
        console.error('URL 해시에서 상태를 파싱하는데 오류가 발생했습니다:', error);
      }
    }
    return null;
  }, []);

  const [playerNames, setPlayerNames] = useState(() => {
    const loadedState = parseStateFromUrl();
    if (loadedState?.playerNames && Array.isArray(loadedState.playerNames)) {
      return loadedState.playerNames;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `Player${i + 1}`);
  });

  const [playerPool, setPlayerPool] = useState(() => {
    const loadedState = parseStateFromUrl();
    if (isUmaOkaPage && loadedState?.playerPool && Array.isArray(loadedState.playerPool)) {
      return loadedState.playerPool;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `Player${i + 1}`);
  });

  const [games, setGames] = useState(() => {
    const loadedState = parseStateFromUrl();
    const loadedGames = loadedState?.games;
    if (Array.isArray(loadedGames)) {
      return loadedGames.map((game, index) => ({
        ...game,
        id: game.id || index + 1,
        isEditable: game.isEditable !== undefined ? game.isEditable : false,
        ...(isUmaOkaPage
          ? {
              participants: game.participants || {},
              scores: game.scores || {},
            }
          : {
              scores: game.scores && game.scores.length === PLAYER_COUNT ? game.scores : Array(PLAYER_COUNT).fill(''),
              playerPositions: game.playerPositions && game.playerPositions.length === PLAYER_COUNT ? game.playerPositions : getDefaultPlayerPositions(),
            }
        ),
      }));
    }
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

  const [targetSum, setTargetSum] = useState(() => {
    const loadedState = parseStateFromUrl();
    if (typeof loadedState?.targetSum === 'number') {
      return loadedState.targetSum;
    }
    return 1000;
  });

  const [activeUmaOka, setActiveUmaOka] = useState({ uma: null, oka: false });
  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [shouldSaveOnUpdate, setShouldSaveOnUpdate] = useState(false);

  useEffect(() => {
    const loadedState = parseStateFromUrl();
    if (loadedState?.language) {
      setCurrentLanguage(loadedState.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseStateFromUrl, setCurrentLanguage]);

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

  useEffect(() => {
    const handleViewportResize = () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.matches('input[type="number"].score-input-js')) {
        setTimeout(() => {
          const inputRect = activeElement.getBoundingClientRect();
          const visualViewport = window.visualViewport;
          if (visualViewport) {
            const desiredViewportPadding = 20;
            let scrollOffset = 0;
            if (inputRect.bottom > visualViewport.offsetTop + visualViewport.height - desiredViewportPadding) {
              scrollOffset = inputRect.bottom - (visualViewport.offsetTop + visualViewport.height - desiredViewportPadding);
            }
            else if (inputRect.top < visualViewport.offsetTop + desiredViewportPadding) {
              scrollOffset = inputRect.top - (visualViewport.offsetTop + desiredViewportPadding);
            }
            if (scrollOffset !== 0) {
              window.scrollBy({ top: scrollOffset, behavior: 'smooth' });
            }
          }
        }, 100);
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
        }
      };
    }
  }, []);

  const generateShareableUrl = useCallback(() => {
    const stateToSave = {
      games,
      targetSum,
      language: currentLanguage,
      ...(isUmaOkaPage ? { playerPool } : { playerNames })
    };
    const jsonString = JSON.stringify(stateToSave);
    const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
    return `${window.location.origin}${location.pathname}#data=${encodedData}`;
  }, [playerNames, playerPool, games, targetSum, currentLanguage, isUmaOkaPage, location.pathname]);

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
    if (isUmaOkaPage) {
      return Object.values(lastGame.scores).reduce((sum, score) => sum + (parseInt(score, 10) || 0), 0);
    } else {
      return lastGame.scores.reduce((sum, score) => sum + (parseInt(score, 10) || 0), 0);
    }
  }, [games, isUmaOkaPage]);

  const handleAddGame = () => {
    setGames(prevGames => {
      const updatedGames = prevGames.map((game, index) => {
        if (index === prevGames.length - 1) {
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
    const amount = getIncrementAmount(targetSum);
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
    const amount = getIncrementAmount(targetSum);
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
        games.reduce((sum, game) => sum + (parseInt(game.scores[playerIndex], 10) || 0), 0)
      );
    }
    const finalScores = Array(playerPool.length).fill(0);
    const normalizeScore = (rawScore) => {
      if (targetSum === 0) return -25;
      return (rawScore / targetSum) * 100 - 25;
    };
    games.forEach(game => {
      if (game.isEditable) {
        return;
      }
      if (game.participants && game.scores && Object.keys(game.participants).length === 4) {
        const playerRawScores = {};
        Object.entries(game.participants).forEach(([position, playerIndex]) => {
          const score = parseInt(game.scores[position], 10) || 0;
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
        const { uma, oka } = activeUmaOka;
        rankedPlayers.forEach((playerData, rank) => {
          const { playerIndex } = playerData;
          let finalScore = normalizeScore(playerRawScores[playerIndex]);
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
          if (oka && rank === 0) {
            finalScore += 20;
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
  }, [games, isUmaOkaPage, playerPool, activeUmaOka, targetSum]);

  const handleDeleteGame = (gameIdToDelete) => {
    setGames(prevGames => prevGames.filter(game => game.id !== gameIdToDelete));
  };

  const handleUmaOkaToggle = useCallback((type) => {
    setActiveUmaOka(prev => {
      if (type === 'oka') {
        return { ...prev, oka: !prev.oka };
      } else {
        return { ...prev, uma: prev.uma === type ? null : type };
      }
    });
    console.log(`Uma/Oka type toggled: ${type}`);
  }, []);

  const isUmaOkaGlobalDisabled = useMemo(() => {
    return targetSum % 10 !== 0;
  }, [targetSum]);

  const isAddRecordButtonDisabled = useMemo(() => {
    return currentTotal !== targetSum;
  }, [currentTotal, targetSum]);

  const handleScoreInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!isAddRecordButtonDisabled) {
        handleAddGame();
      }
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
        targetSum={targetSum} setTargetSum={setTargetSum}
        currentTotal={currentTotal} handleAddGame={handleAddGame}
        isAddRecordButtonDisabled={isAddRecordButtonDisabled}
        copyToClipboard={copyToClipboard} getText={getText}
        showUmaOkaControls={isUmaOkaPage}
        handleUmaOkaToggle={handleUmaOkaToggle}
        activeUmaOka={activeUmaOka}
        isUmaOkaGlobalDisabled={isUmaOkaGlobalDisabled}
      />
      <MessageDisplay message={getText('copied')} isVisible={showCopyMessage} />
      <div className="mt-6 sm:mt-8 text-xs sm:text-sm md:text-lg text-gray-600">
        <p>{getText('totalGames', { count: games.filter(g => !g.isEditable).length })}</p>
      </div>
    </div>
  );
}

export default ScoreTrackerPage;