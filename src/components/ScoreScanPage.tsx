import { Link, useLocation } from 'react-router-dom';
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
import { getClientId } from '../utils/clientId';

type Language = keyof Translations;
type TranslationKey = keyof Translation;

interface ScoreScanPageProps {
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

function ScoreScanPage({ currentLanguage, setCurrentLanguage, getText, translations, isTestMode = false }: ScoreScanPageProps) {
  const location = useLocation();
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

  // 라우터 state(QueuePage의 drawnSeats)를 통한 0ms 즉시 하이드레이션
  useEffect(() => {
    const state = location.state as { drawnSeats?: Array<{ seat: string; nickname: string }> } | undefined;
    if (state?.drawnSeats && Array.isArray(state.drawnSeats) && state.drawnSeats.length === 4) {
      const windOrder = ['east', 'south', 'west', 'north'];
      const ordered = windOrder.map(s => {
        const item = state.drawnSeats?.find(d => d.seat === s);
        return item ? item.nickname : '';
      });
      if (ordered.every(Boolean)) {
        setPlayerPool(prev => [...ordered, ...prev.slice(4)]);
      }
    }
  }, [location.state]);

  // 테이블 1 실시간 연동 상태
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [tableLiveSeats, setTableLiveSeats] = useState<{
    east: { nickname: string; client_id: string } | null;
    south: { nickname: string; client_id: string } | null;
    west: { nickname: string; client_id: string } | null;
    north: { nickname: string; client_id: string } | null;
  } | null>(null);
  const [sessionTimingText, setSessionTimingText] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // effectiveTestMode: isTestMode prop 또는 URL 쿼리 파라미터(?testMode=true) 판별
  const effectiveTestMode = useMemo(() => {
    if (isTestMode) return true;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashQuery = window.location.hash.includes('?')
        ? new URLSearchParams(window.location.hash.split('?')[1])
        : new URLSearchParams();
      return searchParams.get('testMode') === 'true' || hashQuery.get('testMode') === 'true';
    } catch {
      return false;
    }
  }, [isTestMode]);

  // 테이블 1 좌석 2초 주기 폴링 훅 (프로덕션/테스트 상시 실행)
  useEffect(() => {
    let isMounted = true;
    const pollTableStatus = async () => {
      try {
        const res = await fetch('/api/tables/1/status');
        if (res.ok && isMounted) {
          const data = await res.json();
          setActiveSessionId(data.session_id);
          setTableLiveSeats(data.seats);

          // 4인 착석 시 playerPool 자동 주입
          if (data.seats && data.seats.east && data.seats.south && data.seats.west && data.seats.north) {
            const liveNames = [
              data.seats.east.nickname,
              data.seats.south.nickname,
              data.seats.west.nickname,
              data.seats.north.nickname,
            ];
            setPlayerPool(prev => {
              if (prev[0] === liveNames[0] && prev[1] === liveNames[1] && prev[2] === liveNames[2] && prev[3] === liveNames[3]) {
                return prev;
              }
              const rest = prev.slice(4);
              return [...liveNames, ...rest];
            });
          }

          if (data.submissions_count > 0) {
            if (data.submissions_count >= 2) {
              setVerificationStatus(`🟢 ${data.submissions_count}개 기종 교차 검증 통과`);
            } else if (data.submissions && data.submissions[0]) {
              const firstSub = data.submissions[0];
              const confPct = Math.round((firstSub.confidence || 0.82) * 100);
              setVerificationStatus(`📱 ${firstSub.seat?.toUpperCase() || ''} 1차 인식 (신뢰도 ${confPct}%)`);
            }
          }

          if (data.started_at) {
            const start = new Date(data.started_at);
            const now = new Date();
            const elapsedMins = Math.floor((now.getTime() - start.getTime()) / 60000);
            setSessionTimingText(`⏱️ 경기 진행 중 (${elapsedMins}분 경과)`);
          } else {
            setSessionTimingText('대기 중 (4인 착석 대기)');
          }
        }
      } catch {
        // 네트워크 에러 시 로컬 상태 유지
      }
    };

    pollTableStatus();
    const interval = setInterval(pollTableStatus, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  // 실시간 스캔에서 점수 인식 시 UmaOkaTable 편집 행에 자동 주입 및 다기종 교차 검증 전송
  const handleScoresRecognized = useCallback((recognizedScores: { east: string; south: string; west: string; north: string }, confidence = 0.82) => {
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

    // 백엔드로 다기종 점수 제출 (교차 검증 및 기종 데이터 누적)
    if (activeSessionId) {
      const cid = getClientId() || 'anonymous';
      const devName = navigator.userAgent.includes('iPhone') ? 'iPhone'
        : navigator.userAgent.includes('Android') ? 'Android' : 'Desktop/Other';
      fetch(`/api/sessions/${activeSessionId}/submit-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: cid,
          device_name: devName,
          scores: {
            east: parseInt(recognizedScores.east, 10),
            south: parseInt(recognizedScores.south, 10),
            west: parseInt(recognizedScores.west, 10),
            north: parseInt(recognizedScores.north, 10),
          },
          confidence,
        }),
      }).catch(() => {});
    }
  }, [activeSessionId]);

  // 테스트 모드용 점수 자동 채우기 (동: 35000, 남: 28000, 서: 22000, 북: 15000 = 합계 100,000점)
  const handleFillTestScores = () => {
    handleScoresRecognized({
      east: '35000',
      south: '28000',
      west: '22000',
      north: '15000',
    });
  };

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

  const handleRecordButtonPress = async () => {
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

    // 백엔드 세션 종료 및 소요 시간 영구 기록 (프로덕션/테스트 상시 실행)
    if (activeSessionId) {
      try {
        const finishRes = await fetch(`/api/sessions/${activeSessionId}/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_id: 1,
            scores: {
              east: parseInt(s.east, 10),
              south: parseInt(s.south, 10),
              west: parseInt(s.west, 10),
              north: parseInt(s.north, 10),
            },
            participants: {
              east: tableLiveSeats?.east?.client_id || playerPool[playersArr[0]],
              south: tableLiveSeats?.south?.client_id || playerPool[playersArr[1]],
              west: tableLiveSeats?.west?.client_id || playerPool[playersArr[2]],
              north: tableLiveSeats?.north?.client_id || playerPool[playersArr[3]],
            },
            raw_payload: {
              source: 'scan_score_test',
              targetTotalScore,
            },
          }),
        });

        if (finishRes.ok) {
          const finishData = await finishRes.json();
          const dur = finishData.duration_seconds || 0;
          const mins = Math.floor(dur / 60);
          const secs = dur % 60;
          setPopupMessage({
            show: true,
            text: `경기 기록 저장 완료! (소요 시간: ${mins}분 ${secs}초, Table 1 리셋)`,
          });
          setTimeout(() => setPopupMessage({ show: false, text: '' }), 3500);
        }
      } catch {
        // 백엔드 단절 시에도 로컬 점수 저장은 계속 진행
      }
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
        {effectiveTestMode && (
          <Link
            to="/scan_score"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors shrink-0"
          >
            <span>📹 일반 서비스 화면 이동</span>
          </Link>
        )}
      </div>

      {/* 테이블 1 실시간 연동 및 다기종 검증 인디케이터 */}
      {(effectiveTestMode || tableLiveSeats) && (
        <div className="w-full max-w-6xl mb-4 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sky-400">테이블 1 실시간 연동 중</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300">
              동: <strong className="text-emerald-400">{tableLiveSeats?.east?.nickname || '대기'}</strong> /
              남: <strong className="text-emerald-400">{tableLiveSeats?.south?.nickname || '대기'}</strong> /
              서: <strong className="text-emerald-400">{tableLiveSeats?.west?.nickname || '대기'}</strong> /
              북: <strong className="text-emerald-400">{tableLiveSeats?.north?.nickname || '대기'}</strong>
            </span>
            {verificationStatus && (
              <span className="ml-1 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-600 text-sky-300 text-xs font-semibold">
                {verificationStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {sessionTimingText && (
              <div className="text-emerald-400 font-semibold shrink-0">
                {sessionTimingText}
              </div>
            )}
            {effectiveTestMode && (
              <button
                type="button"
                onClick={handleFillTestScores}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
                title="테스트용 점수(35000, 28000, 22000, 15000 = 10만점) 자동 채우기"
              >
                🎲 테스트 점수 채우기 (10만점)
              </button>
            )}
          </div>
        </div>
      )}

      {/* 플레이어 총점 랭킹 */}
      <PlayerTotals playerPool={playerPool} totalScores={totalScores} getText={getText} />

      {/* 실시간 점수 스캔 패널 */}
      <PhotoUploadPanel
        getText={getText}
        playerNames={playerPool}
        targetTotalScore={targetTotalScore}
        onScoresRecognized={handleScoresRecognized}
        isTestMode={effectiveTestMode}
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

export default ScoreScanPage;
