import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PlayerManagementAndScores from './PlayerManagementAndScores';
import PlayerTotals from './PlayerTotals';
import UmaOkaTable from './UmaOkaTable';
import ControlPanel from './ControlPanel';
import MessageDisplay from './MessageDisplay';
import PhotoUploadPanel from './PhotoUploadPanel';
import { Translation, Translations } from '../i18n/translations';
import { Game, UmaOkaParticipants, UmaOkaScores } from '../types';
import { calculateTieAwards, TieHandlingMode } from './ScorePage';
import { encodeShareState, parseShareStateFromHash } from '../utils/shareState';

type Language = keyof Translations;
type TranslationKey = keyof Translation;

interface ScorePhotoInputPageProps {
  currentLanguage: string;
  setCurrentLanguage: (lang: Language) => void;
  getText: (key: TranslationKey, params?: Record<string, string | number>) => string;
  translations: Translations;
  isTestMode?: boolean;
}

const PLAYER_COUNT = 4;
const INITIAL_PLAYER_POSITIONS = ['east', 'south', 'west', 'north'];

const getDefaultPlayerPositions = (): string[] => [...INITIAL_PLAYER_POSITIONS];
const getDefaultUmaOkaParticipants = (): UmaOkaParticipants => ({ east: 0, south: 1, west: 2, north: 3 });

function ScorePhotoInputPage({ currentLanguage, setCurrentLanguage, getText, translations, isTestMode = false }: ScorePhotoInputPageProps) {
  const parseStateFromUrl = useCallback(() => parseShareStateFromHash(window.location.hash, true), []);
  const loadedState = useMemo(() => parseStateFromUrl(), [parseStateFromUrl]);

  const [startingScore, setStartingScore] = useState<number>(() => loadedState?.startingScore ?? 25000);
  const [returnScore, setReturnScore] = useState<number>(() => loadedState?.returnScore ?? 30000);
  const [isOkaEnabled, setIsOkaEnabled] = useState<boolean>(() => loadedState?.activeUmaOka?.oka ?? true);
  const [activeUmaOka, setActiveUmaOka] = useState<{ uma: string | null; oka: boolean }>(() => (
    loadedState?.activeUmaOka || { uma: '1-2', oka: true }
  ));
  const [tieHandlingMode, setTieHandlingMode] = useState<TieHandlingMode>(() => loadedState?.tieHandlingMode || 'split');

  const [playerPool, setPlayerPool] = useState<string[]>(() => {
    const pool = loadedState?.playerPool || loadedState?.playerNames;
    if (Array.isArray(pool) && pool.length >= PLAYER_COUNT) {
      return pool;
    }
    return Array(PLAYER_COUNT).fill('').map((_, i) => `${getText('player')}${i + 1}`);
  });

  const [chomboCounts, setChomboCounts] = useState<number[]>(() => {
    if (loadedState?.chomboCounts && Array.isArray(loadedState.chomboCounts)) {
      return loadedState.chomboCounts;
    }
    return Array(playerPool.length).fill(0);
  });

  // URL에서 언어 설정 불러오기
  useEffect(() => {
    if (loadedState?.language) {
      setCurrentLanguage(loadedState.language as Language);
    }
  }, [loadedState, setCurrentLanguage]);

  // 언어 변경 시 기본 플레이어 이름 업데이트
  useEffect(() => {
    if (!translations || !translations.ko || !translations.en || !translations.ja) return;
    const updateDefaultNames = (prevNames: string[]) => prevNames.map((name, index) => {
      const defaultNamePattern = new RegExp(`^(?:${translations.ko.player}|${translations.en.player}|${translations.ja.player})${index + 1}$`);
      if (defaultNamePattern.test(name) || name === `Player${index + 1}` || name === `플레이어${index + 1}` || name === `プレイヤー${index + 1}`) {
        return `${getText('player')}${index + 1}`;
      }
      return name;
    });
    setPlayerPool(updateDefaultNames);
  }, [currentLanguage, getText, translations]);

  // 게임 목록 상태
  const [games, setGames] = useState<Game[]>(() => {
    const rawGames = loadedState?.games;
    if (Array.isArray(rawGames) && rawGames.length > 0) {
      const maxId = Math.max(...rawGames.map(g => g.id), 0);
      const normalized = rawGames.map(g => {
        if (!Array.isArray(g.scores) && typeof g.scores === 'object') {
          return g;
        }
        // 하위 호환: 배열 점수를 UmaOkaScores 형태로 변환
        const arr = Array.isArray(g.scores) ? g.scores : [];
        return {
          ...g,
          scores: {
            east: arr[0] || '',
            south: arr[1] || '',
            west: arr[2] || '',
            north: arr[3] || '',
          },
          participants: g.participants || getDefaultUmaOkaParticipants(),
        };
      });
      return [
        ...normalized,
        {
          id: maxId + 1,
          scores: { east: '', south: '', west: '', north: '' },
          participants: getDefaultUmaOkaParticipants(),
          isEditable: true,
        },
      ];
    }
    return [{
      id: 1,
      scores: { east: '', south: '', west: '', north: '' },
      participants: getDefaultUmaOkaParticipants(),
      isEditable: true,
    }];
  });

  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [popupMessage, setPopupMessage] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  // 우마/오카 점수 계산
  const calculatedGames = useMemo(() => {
    const positions = getDefaultPlayerPositions();
    const okaAmount = isOkaEnabled ? (returnScore - startingScore) * 4 / 1000 : 0;

    return games.map(game => {
      if (game.isEditable) return { ...game, finalScores: undefined as Record<number, number> | undefined };
      const gameScores = game.scores as UmaOkaScores;
      const gameParticipants = game.participants || getDefaultUmaOkaParticipants();

      const rawScores: Record<number, number> = {};
      const positionByPlayer: Record<number, string> = {};

      positions.forEach(pos => {
        const pIdx = gameParticipants[pos as keyof UmaOkaParticipants];
        const val = parseInt(gameScores[pos as keyof UmaOkaScores] || '0', 10);
        rawScores[pIdx] = val;
        positionByPlayer[pIdx] = pos;
      });

      const awards = calculateTieAwards(rawScores, activeUmaOka.uma, okaAmount, tieHandlingMode, positionByPlayer);
      const finalScores: Record<number, number> = {};

      Object.entries(rawScores).forEach(([pIdxStr, score]) => {
        const pIdx = Number(pIdxStr);
        const base = (score - returnScore) / 1000;
        const award = awards[pIdx] || 0;
        finalScores[pIdx] = parseFloat((base + award).toFixed(1));
      });

      return {
        ...game,
        finalScores,
      };
    });
  }, [games, isOkaEnabled, returnScore, startingScore, activeUmaOka.uma, tieHandlingMode]);

  // 플레이어별 총점 계산
  const totalScores = useMemo(() => {
    return playerPool.map((_, pIdx) => {
      let total = 0;
      calculatedGames.forEach((game: Game & { finalScores?: Record<number, number> }) => {
        if (!game.isEditable && game.finalScores && game.finalScores[pIdx] !== undefined) {
          total += game.finalScores[pIdx];
        }
      });
      const chomboPenalty = (chomboCounts[pIdx] || 0) * -20;
      return parseFloat((total + chomboPenalty).toFixed(1));
    });
  }, [playerPool, calculatedGames, chomboCounts]);

  // 플레이어 관리 핸들러
  const handleAddPlayerToPool = (name: string) => {
    if (name && !playerPool.includes(name)) {
      setPlayerPool(prev => [...prev, name]);
      setChomboCounts(prev => [...prev, 0]);
    }
  };

  const handleRemovePlayerFromPool = (indexToRemove: number) => {
    if (playerPool.length <= PLAYER_COUNT) return;
    setPlayerPool(prev => prev.filter((_, index) => index !== indexToRemove));
    setChomboCounts(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdatePlayerInPool = (index: number, newName: string) => {
    setPlayerPool(prev => prev.map((name, i) => (i === index ? newName : name)));
  };

  const handleAddChombo = (playerIndex: number) => {
    setChomboCounts(prev => prev.map((cnt, i) => (i === playerIndex ? cnt + 1 : cnt)));
  };

  const handleUndoChombo = (playerIndex: number) => {
    setChomboCounts(prev => prev.map((cnt, i) => (i === playerIndex ? Math.max(0, cnt - 1) : cnt)));
  };

  // 점수 입력 및 라운드 관리 핸들러
  const handleUmaOkaScoreChange = (gameId: number, position: string, newScore: string) => {
    const filtered = newScore.replace(/[^0-9-.]/g, '');
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      return {
        ...g,
        scores: {
          ...(g.scores as UmaOkaScores),
          [position]: filtered,
        },
      };
    }));
  };

  const handlePlayerForPositionChange = (gameId: number, position: string, playerIndex: string) => {
    const idx = parseInt(playerIndex, 10);
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      return {
        ...g,
        participants: {
          ...(g.participants || getDefaultUmaOkaParticipants()),
          [position]: isNaN(idx) ? 0 : idx,
        },
      };
    }));
  };

  const handleDeleteGame = (gameIdToDelete: number) => {
    setGames(prev => prev.filter(g => g.id !== gameIdToDelete));
  };

  const onOkaToggle = () => {
    setIsOkaEnabled(prev => !prev);
    setActiveUmaOka(prev => ({ ...prev, oka: !prev.oka }));
  };

  const handleUmaOkaToggle = (type: string) => {
    if (type === 'oka') {
      onOkaToggle();
    } else {
      setActiveUmaOka(prev => ({ ...prev, uma: prev.uma === type ? null : type }));
    }
  };

  // 실시간 스캔에서 점수 인식 시 UmaOkaTable 편집 행에 자동 주입
  const handleScoresRecognized = useCallback((recognizedScores: { east: string; south: string; west: string; north: string }) => {
    setGames(prev => {
      return prev.map(game => {
        if (!game.isEditable) return game;
        return {
          ...game,
          scores: {
            east: recognizedScores.east,
            south: recognizedScores.south,
            west: recognizedScores.west,
            north: recognizedScores.north,
          },
        };
      });
    });
  }, []);

  // 실시간 스캔에서 점수 확정 시 우마·오카 게임 기록으로 추가
  const handlePhotoConfirm = (scores: string[], players: number[]) => {
    const newScores: UmaOkaScores = {
      east: scores[0] || '0',
      south: scores[1] || '0',
      west: scores[2] || '0',
      north: scores[3] || '0',
    };
    const newParticipants: UmaOkaParticipants = {
      east: players[0] ?? 0,
      south: players[1] ?? 1,
      west: players[2] ?? 2,
      north: players[3] ?? 3,
    };

    setGames(prev => {
      const editableGame = prev.find(g => g.isEditable);
      const confirmedId = editableGame ? editableGame.id : prev.reduce((max, g) => Math.max(max, g.id), 0) + 1;
      const nextId = confirmedId + 1;

      const confirmedGame: Game = {
        id: confirmedId,
        scores: newScores,
        participants: newParticipants,
        isEditable: false,
      };

      const remainingHistory = prev.filter(g => !g.isEditable);
      return [
        ...remainingHistory,
        confirmedGame,
        {
          id: nextId,
          scores: { east: '', south: '', west: '', north: '' },
          participants: newParticipants,
          isEditable: true,
        },
      ];
    });
  };

  // 현재 입력 중인 라운드의 합계 및 유효성 검사
  const currentEditableGame = useMemo(() => games.find(g => g.isEditable), [games]);
  const currentTotal = useMemo(() => {
    if (!currentEditableGame) return 0;
    const s = currentEditableGame.scores as UmaOkaScores;
    return ['east', 'south', 'west', 'north'].reduce((sum, pos) => {
      const val = parseInt(s[pos as keyof UmaOkaScores] || '0', 10);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [currentEditableGame]);

  const targetTotalScore = startingScore * 4;

  const handleRecordButtonPress = () => {
    if (!currentEditableGame) return;
    const s = currentEditableGame.scores as UmaOkaScores;
    const p = currentEditableGame.participants || getDefaultUmaOkaParticipants();

    const scoresArr = [s.east, s.south, s.west, s.north];
    const playersArr = [p.east, p.south, p.west, p.north];

    if (scoresArr.some(score => score === '' || isNaN(parseInt(score, 10)))) {
      setPopupMessage({ show: true, text: getText('popup_generic_error') });
      setTimeout(() => setPopupMessage({ show: false, text: '' }), 2000);
      return;
    }

    if (currentTotal !== targetTotalScore) {
      setPopupMessage({ show: true, text: getText('popup_total_mismatch') });
      setTimeout(() => setPopupMessage({ show: false, text: '' }), 2000);
      return;
    }

    const uniquePlayers = new Set(playersArr);
    if (uniquePlayers.size < 4) {
      setPopupMessage({ show: true, text: getText('popup_duplicate_players') });
      setTimeout(() => setPopupMessage({ show: false, text: '' }), 2000);
      return;
    }

    handlePhotoConfirm(scoresArr, playersArr);
  };

  const handleScoreInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleRecordButtonPress();
    }
  };

  const handleUmaOkaScoreButtonClick = (gameId: number, position: string, operation: 'increment' | 'decrement') => {
    const targetGame = games.find(g => g.id === gameId);
    if (!targetGame) return;
    const currentVal = parseInt((targetGame.scores as UmaOkaScores)[position as keyof UmaOkaScores] || '0', 10);
    const step = 1000;
    const increment = operation === 'increment' ? step : -step;
    const newVal = String(isNaN(currentVal) ? increment : currentVal + increment);
    handleUmaOkaScoreChange(gameId, position, newVal);
  };

  // 압축 공유 URL 생성
  const shareUrl = useMemo(() => {
    const hash = encodeShareState({
      startingScore,
      returnScore,
      games: games.filter(g => !g.isEditable),
      playerPool,
      playerNames: playerPool,
      activeUmaOka,
      tieHandlingMode,
      chomboCounts,
      language: currentLanguage,
    }, true);
    return `${window.location.pathname}#d=${hash}`;
  }, [startingScore, returnScore, games, playerPool, activeUmaOka, tieHandlingMode, chomboCounts, currentLanguage]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`).then(() => {
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
    });
  };

  const confirmedGamesCount = games.filter(g => !g.isEditable).length;

  return (
    <div className="w-full max-w-6xl flex flex-col items-center xs:p-0 px-2 py-4 sm:px-4">
      <div className="w-full max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <p className="text-sm sm:text-base text-gray-600">
          {getText('umaOkaGuide')}
        </p>
        {!isTestMode ? (
          <Link
            to="/scan_score_test"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors shrink-0"
          >
            <span>🧪 PC 전송 테스트 Lab 이동</span>
          </Link>
        ) : (
          <Link
            to="/scan_score"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors shrink-0"
          >
            <span>📹 일반 서비스 화면 이동</span>
          </Link>
        )}
      </div>

      {/* 플레이어 총점 랭킹 */}
      <PlayerTotals playerPool={playerPool} totalScores={totalScores} getText={getText} />

      {/* 실시간 점수 스캔 패널 */}
      <PhotoUploadPanel
        getText={getText}
        playerNames={playerPool}
        targetTotalScore={targetTotalScore}
        onScoresRecognized={handleScoresRecognized}
        isTestMode={isTestMode}
      />

      {confirmedGamesCount > 0 && (
        <a className="my-3 text-blue-700 underline font-semibold text-sm sm:text-base" href={shareUrl}>
          확정한 기록 공유 링크
        </a>
      )}

      {/* 우마·오카 점수 기록 테이블 */}
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

      {/* 제어 및 룰 설정 패널 */}
      <ControlPanel
        startingScore={startingScore}
        setStartingScore={setStartingScore}
        returnScore={returnScore}
        setReturnScore={setReturnScore}
        isOkaEnabled={isOkaEnabled}
        onOkaToggle={onOkaToggle}
        totalTargetScore={targetTotalScore}
        currentTotal={currentTotal}
        onRecordButtonPress={handleRecordButtonPress}
        isAddRecordButtonDisabled={currentTotal !== targetTotalScore}
        copyToClipboard={copyToClipboard}
        getText={getText}
        showUmaOkaControls={true}
        handleUmaOkaToggle={handleUmaOkaToggle}
        activeUmaOka={activeUmaOka}
        tieHandlingMode={tieHandlingMode}
        setTieHandlingMode={setTieHandlingMode}
        isUmaOkaGlobalDisabled={false}
        showShareWarning={true}
      />

      <MessageDisplay message={getText('copied')} isVisible={showCopyMessage} />
      <MessageDisplay message={popupMessage.text} isVisible={popupMessage.show} />

      <div className="mt-6 sm:mt-8 text-xs sm:text-sm md:text-lg text-gray-600">
        <p>{getText('totalGames', { count: confirmedGamesCount })}</p>
      </div>

      {/* 플레이어 및 촌보 관리 */}
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
    </div>
  );
}

export default ScorePhotoInputPage;
