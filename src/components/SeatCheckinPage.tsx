import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getClientId,
  ensureClientId,
  getStoredNickname,
  setStoredNickname,
  clearClientStorage,
} from '../utils/clientId';

interface SeatInfo {
  client_id: string;
  nickname: string;
  joined_at: string;
}

interface TableStatus {
  table_id: number;
  session_id: number;
  session_status: string;
  started_at: string | null;
  occupied_count?: number;
  seats: {
    east: SeatInfo | null;
    south: SeatInfo | null;
    west: SeatInfo | null;
    north: SeatInfo | null;
  };
}

const SEAT_LABELS: Record<string, string> = {
  east: '동(East)',
  south: '남(South)',
  west: '서(West)',
  north: '북(North)',
};

export const SeatCheckinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tableParam = searchParams.get('table') || '1';
  const seatParam = (searchParams.get('seat') || 'east').toLowerCase();

  const [nicknameInput, setNicknameInput] = useState('');
  const [storedNick, setStoredNick] = useState('');
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null);
  const [isSeated, setIsSeated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tables/${tableParam}/status`);
      if (res.ok) {
        const data: TableStatus = await res.json();
        setTableStatus(data);
        const currentId = getClientId();
        if (currentId && data.seats[seatParam as keyof typeof data.seats]?.client_id === currentId) {
          setIsSeated(true);
        }
      }
    } catch {
      // ignore poll error
    }
  }, [tableParam, seatParam]);

  useEffect(() => {
    const nick = getStoredNickname();
    setStoredNick(nick);
    setNicknameInput(nick);
    fetchStatus();

    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  useEffect(() => {
    if (tableStatus?.occupied_count === 4 || tableStatus?.session_status === 'active') {
      if (redirectCountdown === null) {
        setRedirectCountdown(3);
      }
    }
  }, [tableStatus, redirectCountdown]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate('/scan_score');
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  const handleCheckin = async (customNick?: string) => {
    const nameToUse = (customNick || nicknameInput).trim();
    if (!nameToUse) {
      setErrorMsg('닉네임을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const clientId = ensureClientId();
      setStoredNickname(nameToUse);
      setStoredNick(nameToUse);

      const res = await fetch('/api/seat/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: parseInt(tableParam, 10),
          seat: seatParam,
          client_id: clientId,
          nickname: nameToUse,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '착석 처리에 실패했습니다.');
      }

      setIsSeated(true);
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDevice = async () => {
    if (!window.confirm('기기 등록 정보를 초기화하시겠습니까?\n모든 닉네임과 좌석 배정이 해제되며 홈으로 이동합니다.')) {
      return;
    }

    const currentId = getClientId();
    if (currentId) {
      try {
        await fetch('/api/client/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: currentId }),
        });
      } catch {
        // continue even if server call fails
      }
    }

    clearClientStorage();
    setStoredNick('');
    setIsSeated(false);
    navigate('/');
  };

  const seatLabel = SEAT_LABELS[seatParam] || seatParam;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px', color: '#f8fafc' }}>
      <header style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          테이블 {tableParam} - [{seatLabel}] 착석
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          QR 스캔 1초 착석 시스템
        </p>
      </header>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: 12, borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      {isSeated ? (
        <div style={{ background: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ade80', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <h2 style={{ fontSize: 18, color: '#4ade80', fontWeight: 800, marginBottom: 6 }}>
            [{seatLabel}] 착석 완료!
          </h2>
          <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 12 }}>
            <strong>{storedNick}</strong>님, 모든 플레이어가 착석하면 경기가 시작됩니다.
          </p>

          {(tableStatus?.occupied_count === 4 || tableStatus?.session_status === 'active') && (
            <div style={{
              marginTop: 14,
              padding: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              borderRadius: 10,
            }}>
              <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: 14, marginBottom: 4 }}>
                🎉 4명 모두 착석 완료!
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                {redirectCountdown !== null && redirectCountdown > 0
                  ? `${redirectCountdown}초 후 점수 입력/인식 페이지로 자동 이동합니다...`
                  : '점수 입력 페이지로 이동 중...'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/scan_score')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(2, 132, 199, 0.4)',
                }}
              >
                📊 점수 입력/인식 페이지로 바로 이동
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          {storedNick ? (
            <div>
              <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 12, textAlign: 'center' }}>
                기존 등록 정보: <strong>{storedNick}</strong>
              </p>
              <button
                type="button"
                onClick={() => handleCheckin(storedNick)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 16,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                }}
              >
                {loading ? '착석 중...' : `⚡ ${storedNick}(으)로 1초 착석`}
              </button>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <span
                  onClick={() => setStoredNick('')}
                  style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  다른 닉네임으로 변경하기
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                닉네임 입력
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="예: 마작왕"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  marginBottom: 12,
                }}
              />
              <button
                type="button"
                onClick={() => handleCheckin()}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {loading ? '착석 중...' : '착석하기'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 테이블 현황 카드 */}
      <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 700 }}>
          현재 테이블 착석 현황
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {(['east', 'south', 'west', 'north'] as const).map((s) => {
            const occ = tableStatus?.seats?.[s];
            const isTargetSeat = s === seatParam;
            return (
              <div
                key={s}
                style={{
                  background: occ ? 'rgba(74, 222, 128, 0.1)' : '#1e293b',
                  border: `1px solid ${isTargetSeat ? '#38bdf8' : occ ? '#4ade80' : '#334155'}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {SEAT_LABELS[s]} {isTargetSeat && '(스캔 좌석)'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: occ ? '#4ade80' : '#64748b' }}>
                  {occ ? occ.nickname : '공석'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 기기 초기화 버튼 */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          type="button"
          onClick={handleResetDevice}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: 12,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          [기기 등록 정보 초기화]
        </button>
      </div>
    </div>
  );
};

export default SeatCheckinPage;
