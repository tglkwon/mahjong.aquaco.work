import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PlayerManagementAndScores from './PlayerManagementAndScores';
import Table from './Table';
import PhotoUploadPanel from './PhotoUploadPanel';

const PLAYER_COUNT = 4;

/**
 * 점수 사진 입력 페이지 컴포넌트입니다.
 * 이 페이지는 '대탁 기록표 (우마/오카)'와 유사한 구조를 가지며,
 * 플레이어 관리, 점수 총계 표시, 그리고 향후 추가될 사진 입력 기능을 위한 UI를 포함합니다.
 */
function ScorePhotoInputPage({ currentLanguage, setCurrentLanguage, getText, translations }) {
  // URL에서 상태를 파싱하는 로직 (ScoreTrackerPage와 공유)
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

  // 플레이어 목록 상태
  const [playerPool, setPlayerPool] = useState(() => {
    const loadedState = parseStateFromUrl();
    if (loadedState?.playerPool && Array.isArray(loadedState.playerPool)) {
      return loadedState.playerPool;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `${getText('player')}${i + 1}`);
  });

  // 사진으로 인식된 게임 기록을 저장할 상태
  const [games, setGames] = useState(() => {
    const loadedState = parseStateFromUrl();
    return loadedState?.games || [];
  });

  // URL에서 언어 설정 불러오기
  useEffect(() => {
    const loadedState = parseStateFromUrl();
    if (loadedState?.language) {
      setCurrentLanguage(loadedState.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseStateFromUrl, setCurrentLanguage]);

  // 언어 변경 시 기본 플레이어 이름 업데이트
  useEffect(() => {
    if (!translations || !translations.ko || !translations.en || !translations.ja) return;
    const updateDefaultNames = (prevNames) => prevNames.map((name, index) => {
      const defaultNamePattern = new RegExp(`^(?:${translations.ko.player}|${translations.en.player}|${translations.ja.player})${index + 1}$`);
      if (defaultNamePattern.test(name) || name === `Player${index + 1}` || name === `플레이어${index + 1}` || name === `プレイヤー${index + 1}`) {
        return `${getText('player')}${index + 1}`;
      }
      return name;
    });
    setPlayerPool(updateDefaultNames);
  }, [currentLanguage, getText, translations]);

  // 총점 계산
  const totalScores = useMemo(() => {
    // playerPool의 각 플레이어에 대해 총점을 계산합니다.
    return playerPool.map((_, playerIndex) =>
      games.reduce((sum, game) => {
        // 편집이 완료된 게임의 점수만 합산합니다.
        if (!game.isEditable && game.scores && game.scores[playerIndex]) {
          return sum + (parseInt(game.scores[playerIndex], 10) || 0);
        }
        return sum;
      }, 0)
    );
  }, [playerPool, games]);

  // 플레이어 관리 핸들러
  const handleAddPlayerToPool = (name) => {
    if (name && !playerPool.includes(name)) {
      setPlayerPool(prev => [...prev, name]);
    }
  };

  const handleRemovePlayerFromPool = (indexToRemove) => {
    setPlayerPool(prev => prev.filter((_, index) => index !== indexToRemove));
    // TODO: 게임 기록에서 해당 플레이어 인덱스 조정 로직 추가
  };

  const handleUpdatePlayerInPool = (index, newName) => {
    setPlayerPool(prev => prev.map((name, i) => (i === index ? newName : name)));
  };

  const handleScoreChange = (gameId, playerIndex, newScore) => {
    setGames(currentGames => currentGames.map(game =>
      game.id === gameId
        ? {
            ...game,
            scores: game.scores.map((score, idx) => {
              if (idx === playerIndex) {
                const filteredScore = String(newScore).replace(/[^0-9-.]/g, '');
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

  const handleDeleteGame = (gameIdToDelete) => {
    setGames(prevGames => prevGames.filter(game => game.id !== gameIdToDelete));
  };

  // PhotoUploadPanel에서 호출될 함수 (향후 사진 인식 결과 처리)
  const handlePhotoUpload = useCallback((recognizedGames) => {
    // 기존 게임에 새로운 게임 기록을 추가합니다.
    setGames(prevGames => [...prevGames, ...recognizedGames]);
  }, []);

  return (
    <div className="w-full max-w-6xl flex flex-col items-center xs:p-0 px-2 py-4 sm:px-4">
      {/* 플레이어 관리 및 총점 표시 UI (우마/오카 페이지와 공유) */}
      <PlayerManagementAndScores
        playerPool={playerPool}
        onAddPlayer={handleAddPlayerToPool}
        onRemovePlayer={handleRemovePlayerFromPool}
        onUpdatePlayer={handleUpdatePlayerInPool}
        totalScores={totalScores}
        getText={getText}
      />

      {/* 이 페이지의 핵심 기능: 사진 업로드 패널 */}
      <PhotoUploadPanel getText={getText} onPhotoUpload={handlePhotoUpload} />

      {/* 게임 기록 표시 테이블 */}
      <Table
        playerNames={playerPool} // 플레이어 이름을 전달
        totalScores={totalScores} // 총점 전달
        games={games} // 게임 기록 데이터를 전달
        handlePlayerNameChange={handleUpdatePlayerInPool} // 플레이어 이름 변경 핸들러 전달
        handleScoreChange={handleScoreChange} // 점수 변경 핸들러 전달
        handleDeleteGame={handleDeleteGame}
        handleScoreInputKeyDown={() => {}} // Enter 키 이벤트 핸들러 (여기서는 비활성화)
        getText={getText}
        isUmaOkaPage={false} // ScorePhotoInputPage는 우마/오카 페이지가 아님
      />
    </div>
  );
}

export default ScorePhotoInputPage;