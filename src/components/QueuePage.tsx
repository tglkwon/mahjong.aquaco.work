import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getClientId,
  ensureClientId,
  getStoredNickname,
  setStoredNickname,
} from '../utils/clientId';

interface QueueItem {
  client_id: string;
  nickname: string;
  status: string;
  enqueued_at: string;
}

interface TileDrawResult {
  seat: 'east' | 'south' | 'west' | 'north';
  wind_char: string;
  seat_label: string;
  client_id: string;
  nickname: string;
}

const WIND_COLORS: Record<string, string> = {
  east: '#1e3a8a', // 東 청색
  south: '#dc2626', // 南 적색
  west: '#1e293b', // 西 흑색
  north: '#15803d', // 北 녹색
};

export const QueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [storedNick, setStoredNick] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isEnqueued, setIsEnqueued] = useState(false);
  const [drawResult, setDrawResult] = useState<TileDrawResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentClientId = getClientId();

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
        if (currentClientId) {
          const inQueue = (data.queue || []).some(
            (item: QueueItem) => item.client_id === currentClientId
          );
          setIsEnqueued(inQueue);
        }

        // 4인 자리 추첨 실시간 동기화
        if (data.latest_draw && Array.isArray(data.latest_draw.draw) && data.latest_draw.draw.length === 4) {
          const isParticipant = currentClientId && data.latest_draw.draw.some(
            (d: TileDrawResult) => d.client_id === currentClientId
          );
          if (isParticipant || !drawResult) {
            setDrawResult(data.latest_draw.draw);
          }
        }
      }
    } catch {
      // ignore network errors during poll
    }
  }, [currentClientId, drawResult]);

  useEffect(() => {
    const nick = getStoredNickname();
    setStoredNick(nick);
    setNicknameInput(nick);
    fetchQueue();

    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleJoinQueue = async () => {
    const nameToUse = (storedNick || nicknameInput).trim();
    if (!nameToUse) {
      setErrorMsg('닉네임을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const cid = ensureClientId();
      setStoredNickname(nameToUse);
      setStoredNick(nameToUse);

      const res = await fetch('/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: cid, nickname: nameToUse }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '대기열 등록에 실패했습니다.');
      }

      setIsEnqueued(true);
      await fetchQueue();
    } catch (err: any) {
      setErrorMsg(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!currentClientId) return;
    setLoading(true);
    try {
      await fetch('/api/queue/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: currentClientId }),
      });
      setIsEnqueued(false);
      await fetchQueue();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDrawSeats = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/queue/draw-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: 1 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '자리 추첨에 실패했습니다.');
      }

      const data = await res.json();
      setDrawResult(data.draw);
    } catch (err: any) {
      setErrorMsg(err.message || '자리 추첨 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px', color: '#f8fafc' }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              padding: '6px 12px',
              background: '#334155',
              color: '#cbd5e1',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🏠 홈
          </button>
          <button
            type="button"
            onClick={() => navigate('/scan_score')}
            style={{
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
            }}
          >
            📊 점수 입력/인식 페이지 ➔
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            🀄 대기열 &amp; 자리 추첨
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            온라인 대기 명단 관리 및 4인 마작패(바람패) 디지털 자리 추첨
          </p>
        </div>
      </header>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: 12, borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      {/* 대기 등록 카드 */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        {isEnqueued ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#4ade80', fontWeight: 700, marginBottom: 8 }}>
              ✓ 대기열에 등록되어 있습니다 ({storedNick})
            </div>
            <button
              type="button"
              onClick={handleLeaveQueue}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              대기 취소
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="닉네임 입력 (예: 마작왕)"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={handleJoinQueue}
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {loading ? '등록 중...' : '대기 등록'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4인 모였을 때 자리 추첨 버튼 (추첨 완료 시 숨김) */}
      {queue.length >= 4 && !drawResult && (
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={handleDrawSeats}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 16,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
            }}
          >
            🀄 4인 마작패 자리 추첨 (바람패 타일 뽑기)
          </button>
        </div>
      )}

      {/* 3D 마작패 자리 추첨 결과 */}
      {drawResult && (
        <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: 16, padding: 18, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8' }}>
              🀄 4인 자리 추첨 결과
            </h3>
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>
              추첨 완료
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {drawResult.map((item) => {
              const isMe = currentClientId && item.client_id === currentClientId;
              return (
                <div
                  key={item.seat}
                  style={{
                    background: 'linear-gradient(180deg, #fffdf8 0%, #f4eee1 100%)',
                    border: isMe ? '2px solid #38bdf8' : '1px solid #d4cbb8',
                    borderBottom: '5px solid #166534',
                    borderRadius: 12,
                    padding: '12px 8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: isMe
                      ? '0 0 0 2px #38bdf8, 0 6px 12px rgba(56, 189, 248, 0.35)'
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Songti SC", "SimSun", "Noto Serif CJK KR", "Batang", serif',
                      fontSize: 34,
                      fontWeight: 900,
                      lineHeight: 1,
                      color: WIND_COLORS[item.seat] || '#0f172a',
                      marginBottom: 4,
                      textShadow: '1px 1px 0px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {item.wind_char}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                    {item.seat_label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isMe ? '#ffffff' : '#0f172a',
                      background: isMe ? '#0284c7' : '#e2e8f0',
                      padding: '2px 8px',
                      borderRadius: 6,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.nickname} {isMe && '(나)'}
                  </div>

                  {isMe && (
                    <button
                      type="button"
                      onClick={() => navigate(`/seat?table=1&seat=${item.seat}`)}
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '4px 8px',
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ 내 좌석 바로 착석
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => navigate('/scan_score?table=1', { state: { drawnSeats: drawResult } })}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
              }}
            >
              📊 자리 배정 완료 후 점수 입력/인식 페이지로 이동 ➔
            </button>
          </div>
        </div>
      )}

      {/* 현재 대기 명단 목록 */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
            현재 대기 명단 ({queue.length}명)
          </h2>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {queue.length >= 4 ? '자리 추첨 가능' : `${4 - queue.length}명 더 필요`}
          </span>
        </div>

        {queue.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '16px 0' }}>
            현재 대기 중인 인원이 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map((item, idx) => {
              const isMe = currentClientId && item.client_id === currentClientId;
              return (
                <div
                  key={item.client_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: isMe ? 'rgba(56, 189, 248, 0.12)' : '#0f172a',
                    border: `1px solid ${isMe ? '#38bdf8' : '#334155'}`,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: isMe ? 800 : 500, color: isMe ? '#38bdf8' : '#e2e8f0' }}>
                      {item.nickname} {isMe && '(나)'}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {new Date(item.enqueued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueuePage;
