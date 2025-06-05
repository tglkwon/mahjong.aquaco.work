import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Table from '../components/Table';
import ControlPanel from '../components/ControlPanel';
import MessageDisplay from '../components/MessageDisplay';
import useTranslation from '../hooks/useTranslation'; // For direct access to translations if needed

const PLAYER_COUNT = 4;

function ScoreTrackerPage({ currentLanguage, setCurrentLanguage, getText: parentGetText }) {
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

  const [games, setGames] = useState(() => {
    const loadedState = parseStateFromUrl();
    if (loadedState?.games && Array.isArray(loadedState.games)) {
      return loadedState.games;
    }
    return [{ id: 1, scores: Array(PLAYER_COUNT).fill(''), isEditable: true }];
  });

  const [targetSum, setTargetSum] = useState(() => {
    const loadedState = parseStateFromUrl();
    if (typeof loadedState?.targetSum === 'number') {
      return loadedState.targetSum;
    }
    return 1000;
  });

  const [showCopyMessage, setShowCopyMessage] = useState(false);

  useEffect(() => {
    const loadedState = parseStateFromUrl();
    if (loadedState?.language && loadedState.language !== currentLanguage) {
        setCurrentLanguage(loadedState.language);
    }
    // Clear hash after loading
    if (window.location.hash.startsWith('#data=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [parseStateFromUrl, setCurrentLanguage, currentLanguage]);


  useEffect(() => {
    // Update player names if they are default and language changes
    setPlayerNames(prevNames => prevNames.map((name, index) => {
      const defaultNamePattern = new RegExp(`^(?:${translations.ko.player}|${translations.en.player}|${translations.ja.player})${index + 1}$`);
      if (defaultNamePattern.test(name) || name === `Player${index + 1}` || name === `플레이어${index + 1}` || name === `プレイヤー${index + 1}`) {
        return `${getText('player')}${index + 1}`;
      }
      return name;
    }));
  }, [currentLanguage, getText, translations]);

  const currentTotal = useMemo(() => {
    if (games.length === 0) return 0;
    const lastGame = games[games.length - 1];
    if (!lastGame || !lastGame.scores) return 0;
    return lastGame.scores.reduce((sum, score) => sum + (score === '' || score === null || isNaN(parseInt(score)) ? 0 : parseInt(score)), 0);
  }, [games]);

  const handleAddGame = () => {
    setGames(prevGames => {
      const updatedGames = prevGames.map((game, index) =>
        index === prevGames.length - 1
          ? { ...game, isEditable: false }
          : game
      );
      const newGameId = updatedGames.length > 0 ? Math.max(...updatedGames.map(g => g.id)) + 1 : 1;
      return [...updatedGames, { id: newGameId, scores: Array(PLAYER_COUNT).fill(''), isEditable: true }];
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

  const totalScores = useMemo(() => {
    return Array(PLAYER_COUNT).fill(0).map((_, playerIndex) =>
      games.reduce((sum, game) => sum + (game.scores[playerIndex] === '' || game.scores[playerIndex] === null || isNaN(parseInt(game.scores[playerIndex])) ? 0 : parseInt(game.scores[playerIndex])), 0)
    );
  }, [games]);

  const handleDeleteGame = (gameIdToDelete) => {
    setGames(prevGames => prevGames.filter(game => game.id !== gameIdToDelete));
  };

  const isAddRecordButtonDisabled = useMemo(() => {
    return currentTotal !== targetSum;
  }, [currentTotal, targetSum]);

  const generateShareableUrl = useCallback(() => {
    const stateToSave = { playerNames, games, targetSum, language: currentLanguage };
    const jsonString = JSON.stringify(stateToSave);
    const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
    return `${window.location.origin}${window.location.pathname}#/set_score#data=${encodedData}`; // Ensure path matches router
  }, [playerNames, games, targetSum, currentLanguage]);

  const copyToClipboard = useCallback(() => {
    const url = generateShareableUrl();
    navigator.clipboard.writeText(url).then(() => {
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
    }).catch(err => {
      console.error('URL을 클립보드에 복사하는데 실패했습니다.', err);
    });
  }, [generateShareableUrl]);

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      <Header title={getText('scoreTrackerTitle')} currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} getText={getText} showHomeButton={true} />
      <div className="pt-[78.4px] w-full max-w-6xl flex flex-col items-center p-4">
        <Table playerNames={playerNames} games={games} totalScores={totalScores} getText={getText} handlePlayerNameChange={handlePlayerNameChange} handleScoreChange={handleScoreChange} handleDeleteGame={handleDeleteGame} />
        <ControlPanel targetSum={targetSum} setTargetSum={setTargetSum} currentTotal={currentTotal} handleAddGame={handleAddGame} isAddRecordButtonDisabled={isAddRecordButtonDisabled} copyToClipboard={copyToClipboard} getText={getText} />
        <MessageDisplay message={getText('copied')} isVisible={showCopyMessage} />
        <div className="mt-8 text-sm sm:text-base md:text-lg text-gray-600">
          <p>{getText('totalGames', { count: games.filter(g => !g.isEditable).length })}</p>
        </div>
      </div>
    </div>
  );
}

export default ScoreTrackerPage;