import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Table from '../components/Table';
import PlayerManagementAndScores from '../components/PlayerManagementAndScores';
import ControlPanel from '../components/ControlPanel';
import MessageDisplay from '../components/MessageDisplay';
import useTranslation from '../hooks/useTranslation'; // For direct access to translations if needed

const PLAYER_COUNT = 4;
const INITIAL_PLAYER_POSITIONS = ['east', 'south', 'west', 'north'];

const getDefaultPlayerPositions = () => {
  // 매번 새로운 배열 인스턴스를 반환하여 의도치 않은 공유 참조를 방지
  // 실제로는 ['east', 'south', 'west', 'north'] 와 같은 문자열 키를 저장하고,
  // 화면에 표시할 때 getText('east') 등으로 변환하는 것이 좋습니다.
  return [...INITIAL_PLAYER_POSITIONS];
};

const getDefaultUmaOkaParticipants = () => {
  return { east: 0, south: 1, west: 2, north: 3 };
};

function ScoreTrackerPage({ currentLanguage, setCurrentLanguage, getText: parentGetText }) {
  const location = useLocation();
  const isUmaOkaPage = location.pathname === '/set_score_umaoka';

  // If ScoreTrackerPage needs its own translation instance or direct access to translations
  // const { translations, getText } = useTranslation(currentLanguage);
  // For now, assume getText is passed down and sufficient.
  // However, the original code uses `translations` directly for default player names.
  const { translations } = useTranslation(currentLanguage); // To get the translations object
  const getText = parentGetText; // Use the getText passed from App to ensure consistency

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
    // Use translations from the hook for initial default names
    return Array(PLAYER_COUNT).fill('').map((_, i) => `${translations[currentLanguage]?.player || 'Player'}${i + 1}`);
  });

  const [playerPool, setPlayerPool] = useState(() => {
    const loadedState = parseStateFromUrl();
    if (isUmaOkaPage && loadedState?.playerPool && Array.isArray(loadedState.playerPool)) {
      return loadedState.playerPool;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `${translations[currentLanguage]?.player || 'Player'}${i + 1}`);
  });

  const [games, setGames] = useState(() => {
    const loadedState = parseStateFromUrl();
    const loadedGames = loadedState?.games;
    if (Array.isArray(loadedGames)) {
      return loadedGames.map((game, index) => ({
        ...game,
        id: game.id || index + 1, // Ensure id exists
        isEditable: game.isEditable !== undefined ? game.isEditable : false,
        // Restore structure based on page type
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
    // Initial game state
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

  const [showCopyMessage, setShowCopyMessage] = useState(false);

  // 우마/오카 기능 상태
  const [activeUmaOka, setActiveUmaOka] = useState({ uma: null, oka: false });

  // Effect to set the language from the URL hash when the component mounts.
  // This runs once after the initial render because parseStateFromUrl (memoized) 
  // and setCurrentLanguage (from useState) are stable.
  // It ensures that if a language is specified in the shared URL, it is applied initially.
  // The URL hash itself is not cleared, preserving the shared URL.
  useEffect(() => {
    const loadedState = parseStateFromUrl();
    if (loadedState?.language) {
      // If the loaded state from URL specifies a language, set it.
      // This won't cause issues if called with the same language.
        setCurrentLanguage(loadedState.language);
    }
    // currentLanguage is intentionally omitted from the dependency array.
    // This ensures the effect only uses the initial currentLanguage implicitly (if needed for comparison, though removed for simplicity)
    // and does not re-run to revert language if the user changes it later via UI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseStateFromUrl, setCurrentLanguage]); 

  useEffect(() => {
    // Update player names if they are default and language changes
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
      // Check if the active element is one of our score inputs
      if (activeElement && activeElement.matches('input[type="number"].score-input-js')) {
        // Delay slightly to allow layout to settle after resize and keyboard animation
        setTimeout(() => {
          const inputRect = activeElement.getBoundingClientRect();
          const visualViewport = window.visualViewport;

          if (visualViewport) {
            const desiredViewportPadding = 20; // px, minimum space from top/bottom of viewport
            let scrollOffset = 0;

            // Check if input is obscured at the bottom
            if (inputRect.bottom > visualViewport.offsetTop + visualViewport.height - desiredViewportPadding) {
              scrollOffset = inputRect.bottom - (visualViewport.offsetTop + visualViewport.height - desiredViewportPadding);
            } 
            // Check if input is obscured at the top (e.g., by a fixed header after a previous scroll)
            else if (inputRect.top < visualViewport.offsetTop + desiredViewportPadding) {
              scrollOffset = inputRect.top - (visualViewport.offsetTop + desiredViewportPadding);
            }
            
            if (scrollOffset !== 0) {
              window.scrollBy({ top: scrollOffset, behavior: 'smooth' });
            }
          }
        }, 100); // Adjust delay if needed
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => {
        // Check if visualViewport still exists before trying to remove listener
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
        }
      };
    }
  }, []); // Empty dependency array, so this effect runs once on mount and cleans up on unmount.

  const currentTotal = useMemo(() => {
    if (!games || games.length === 0) return 0;
    const lastGame = games[games.length - 1];
    if (!lastGame || !lastGame.scores) return 0;

    if (isUmaOkaPage) {
      // For Uma/Oka page, scores is an object {east: score, ...}
      return Object.values(lastGame.scores).reduce((sum, score) => sum + (parseInt(score, 10) || 0), 0);
    } else {
      // For standard page, scores is an array
      return lastGame.scores.reduce((sum, score) => sum + (parseInt(score, 10) || 0), 0);
    }
  }, [games, isUmaOkaPage]);
  
  const handleAddGame = () => {
    setGames(prevGames => {
      const updatedGames = prevGames.map((game, index) => {
        if (index === prevGames.length - 1) {
          if (isUmaOkaPage) {
            // No change needed for object-based scores, just make it non-editable
            return { ...game, isEditable: false };
          } else {
            // 마지막 게임의 빈 점수를 '0'으로 변환
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
  };

  const handleScoreChange = (gameId, playerIndex, newScore) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? {
            ...game,
            scores: game.scores.map((score, idx) => {
              if (idx === playerIndex) {
                const filteredScore = newScore.replace(/[^0-9-]/g, '');
                // Allow empty string, or valid number.
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

  // --- Handlers for Player Pool (Uma/Oka Page) ---
  const handleAddPlayerToPool = (name) => {
    if (name && !playerPool.includes(name)) {
      setPlayerPool(prev => [...prev, name]);
    }
  };

  const handleRemovePlayerFromPool = (indexToRemove) => {
    setPlayerPool(prev => prev.filter((_, index) => index !== indexToRemove));

    // Adjust participant indices in games
    setGames(prevGames => prevGames.map(game => {
      if (!isUmaOkaPage || !game.participants) return game;

      const newParticipants = {};
      let changed = false;
      Object.entries(game.participants).forEach(([position, pIndex]) => {
        if (pIndex === indexToRemove) {
          changed = true; // Player removed, so we don't add this entry
        } else if (pIndex > indexToRemove) {
          newParticipants[position] = pIndex - 1; // Decrement index
          changed = true;
        } else {
          newParticipants[position] = pIndex; // Index is unchanged
        }
      });

      return changed ? { ...game, participants: newParticipants } : game;
    }));
  };

  const handleUpdatePlayerInPool = (index, newName) => {
    setPlayerPool(prev => prev.map((name, i) => (i === index ? newName : name)));
  };

  // --- Handlers for Game Data (Uma/Oka Page) ---
  const handleUmaOkaScoreChange = (gameId, position, newScore) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? { ...game, scores: { ...game.scores, [position]: newScore.replace(/[^0-9-]/g, '') } }
        : game
    ));
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

    // --- Logic for Uma/Oka Page ---
    const finalScores = Array(playerPool.length).fill(0);

    // 점수 정규화 함수: (점수 / 목표 점수 합계) * 100 - 25
    const normalizeScore = (rawScore) => {
      if (targetSum === 0) return -25; // 0으로 나누기 방지
      return (rawScore / targetSum) * 100 - 25;
    };

    // 각 게임별로 점수를 계산하여 합산합니다.
    games.forEach(game => {
      // 편집 중인 게임은 총점에 포함하지 않습니다.
      if (game.isEditable) {
        return;
      }

      // 게임에 4명의 참가자와 점수가 모두 있는지 확인합니다.
      if (game.participants && game.scores && Object.keys(game.participants).length === 4) {
        
        const playerRawScores = {};
        Object.entries(game.participants).forEach(([position, playerIndex]) => {
          const score = parseInt(game.scores[position], 10) || 0;
          playerRawScores[playerIndex] = score;
        });

        // 게임에 참가한 플레이어가 4명이 아니면 계산을 건너뜁니다.
        if (Object.keys(playerRawScores).length !== 4) return;

        // 순위 결정을 위한 정렬
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

        // 각 플레이어의 점수를 정규화하고 우마/오카를 적용합니다.
        rankedPlayers.forEach((playerData, rank) => {
          const { playerIndex } = playerData;
          let finalScore = normalizeScore(playerRawScores[playerIndex]);

          // 우마 적용
          if (uma === '1-2') {
            if (rank === 0) finalScore += 20; // 1등
            else if (rank === 1) finalScore += 10; // 2등
            else if (rank === 2) finalScore -= 10; // 3등
            else if (rank === 3) finalScore -= 20; // 4등
          } else if (uma === '1-3') {
            if (rank === 0) finalScore += 30; // 1등
            else if (rank === 1) finalScore += 10; // 2등
            else if (rank === 2) finalScore -= 10; // 3등
            else if (rank === 3) finalScore -= 30; // 4등
          }

          // 오카 적용 (1등에게만)
          if (oka && rank === 0) {
            finalScore += 20;
          }

          gameFinalScores[playerIndex] = finalScore;
        });
        
        // 현재 게임의 최종 점수를 전체 합산 점수에 더합니다.
        for (const playerIndex in gameFinalScores) {
          if (finalScores[playerIndex] !== undefined) {
            finalScores[playerIndex] += gameFinalScores[playerIndex];
          }
        }
      }
    });

    // 최종 점수를 소수점 첫째 자리까지 포맷합니다.
    return finalScores.map(score => score.toFixed(1));
  }, [games, isUmaOkaPage, playerPool, activeUmaOka, targetSum]);


  const handleDeleteGame = (gameIdToDelete) => {
    setGames(prevGames => prevGames.filter(game => game.id !== gameIdToDelete));
  };

  const handleUmaOkaToggle = useCallback((type) => {
    setActiveUmaOka(prev => {
      if (type === 'oka') {
        return { ...prev, oka: !prev.oka };
      } else { // '1-2' or '1-3'
        return { ...prev, uma: prev.uma === type ? null : type };
      }
    });
    console.log(`Uma/Oka type toggled: ${type}`);
  }, []);

  const isUmaOkaGlobalDisabled = useMemo(() => {
    // 우마/오카는 보통 10점 단위(실제 점수 10000점)이므로,
    // 목표 점수가 10의 배수가 아니면 비활성화합니다.
    return targetSum % 10 !== 0;
  }, [targetSum]);

  const isAddRecordButtonDisabled = useMemo(() => {
    return currentTotal !== targetSum;
  }, [currentTotal, targetSum]);

  const generateShareableUrl = useCallback(() => {
    const stateToSave = {
      games,
      targetSum,
      language: currentLanguage,
      ...(isUmaOkaPage ? { playerPool } : { playerNames })
    };
    const jsonString = JSON.stringify(stateToSave);
    const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
    // HTML5 history API를 사용하고 현재 경로가 /set_score라고 가정합니다.
    // URL은 https://<origin>/<pathname>#data=<encodedData> 형식이 되어야 합니다.
    return `${window.location.origin}${location.pathname}#data=${encodedData}`;
  }, [playerNames, playerPool, games, targetSum, currentLanguage, isUmaOkaPage, location.pathname]);

  const copyToClipboard = useCallback(() => {
    const url = generateShareableUrl();
    navigator.clipboard.writeText(url).then(() => {
      setShowCopyMessage(true);
      window.history.replaceState(null, '', url); // 주소창의 URL을 업데이트합니다.
      setTimeout(() => setShowCopyMessage(false), 2000);
    }).catch(err => {
      console.error('URL을 클립보드에 복사하는데 실패했습니다.', err);
    });
  }, [generateShareableUrl]);

  const handleScoreInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // 기본 Enter 동작 방지
      if (!isAddRecordButtonDisabled) {
        handleAddGame();
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      <Header 
        title={isUmaOkaPage ? getText('scoreTrackerUmaOkaTitle') : getText('scoreTrackerTitle')} 
        currentLanguage={currentLanguage} 
        setCurrentLanguage={setCurrentLanguage} 
        getText={getText} 
        showHomeButton={true} 
      />
      <div className="pt-[calc(48px+0.5rem)] sm:pt-[calc(56px+0.5rem)] w-full max-w-6xl flex flex-col items-center xs:p-0 px-2 py-4 sm:px-4">
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
        <Table 
          playerNames={isUmaOkaPage ? playerPool : playerNames} 
          games={games} 
          totalScores={totalScores} 
          getText={getText} 
          handlePlayerNameChange={handlePlayerNameChange} 
          handleScoreChange={handleScoreChange} 
          handleUmaOkaScoreChange={handleUmaOkaScoreChange}
          handleDeleteGame={handleDeleteGame} 
          handleScoreInputKeyDown={handleScoreInputKeyDown} 
          handlePositionChange={handlePositionChange}
          handlePlayerForPositionChange={handlePlayerForPositionChange}
          isUmaOkaPage={isUmaOkaPage}
        />
        <ControlPanel 
          targetSum={targetSum} setTargetSum={setTargetSum} 
          currentTotal={currentTotal} handleAddGame={handleAddGame} 
          isAddRecordButtonDisabled={isAddRecordButtonDisabled} 
          copyToClipboard={copyToClipboard} getText={getText}
          showUmaOkaControls={isUmaOkaPage}
          handleUmaOkaToggle={handleUmaOkaToggle}
          activeUmaOka={activeUmaOka}
          isUmaOkaGlobalDisabled={isUmaOkaGlobalDisabled} />
        <MessageDisplay message={getText('copied')} isVisible={showCopyMessage} />
        <div className="mt-6 sm:mt-8 text-xs sm:text-sm md:text-lg text-gray-600">
          <p>{getText('totalGames', { count: games.filter(g => !g.isEditable).length })}</p>
        </div>
      </div>
    </div>
  );
}

export default ScoreTrackerPage;