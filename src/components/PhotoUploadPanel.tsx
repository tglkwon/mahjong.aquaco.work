import React, { useEffect, useRef, useState } from 'react';
import { Translation } from '../i18n/translations';
import { framePixels, LocalFrame, rotateFrame } from '../utils/scoreMedia';
import { recognizeScoreboard, ScoreCandidate, TableModel } from '../utils/scoreRecognition';
import { startScoreCamera } from '../utils/scoreCamera';
import { checkDropStatus, uploadToMobileDrop } from '../utils/mobileDropClient';

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(parts[1]);
  const u8arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    u8arr[i] = binary.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

interface PhotoUploadPanelProps {
  getText: (key: keyof Translation, params?: Record<string, string | number>) => string;
  playerNames: string[];
  initialTotal?: number;
  targetTotalScore?: number;
  onConfirm?: (scores: string[], players: number[]) => void;
  onScoresRecognized?: (scores: { east: string; south: string; west: string; north: string }) => void;
  isTestMode?: boolean;
  defaultTableModel?: TableModel;
}
const blank = () => ['', '', '', ''];
const button = 'border rounded px-4 py-2 bg-blue-50 text-blue-900 disabled:opacity-50';

function PhotoUploadPanel({
  getText,
  playerNames,
  onConfirm,
  initialTotal = 100000,
  targetTotalScore,
  onScoresRecognized,
  isTestMode = false,
  defaultTableModel,
}: PhotoUploadPanelProps) {
  const [tableModel, setTableModel] = useState<TableModel>(() => {
    try {
      const saved = localStorage.getItem('mahjong_table_model');
      if (saved === 'amos_jp_ex' || saved === 'amos_rexx3') return saved;
    } catch {}
    return defaultTableModel || 'amos_rexx3';
  });
  const [detectedModel, setDetectedModel] = useState<TableModel | null>(null);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  const handleModelChange = (newModel: TableModel) => {
    setIsManualOverride(true);
    setDetectedModel(null);
    setTableModel(newModel);
    try {
      localStorage.setItem('mahjong_table_model', newModel);
    } catch {}
  };
  const [frames, setFrames] = useState<LocalFrame[]>([]);
  const [results, setResults] = useState<ScoreCandidate[][]>([]);
  const [selected, setSelected] = useState(0);
  const [raw, setRaw] = useState<string[]>(blank);
  const [players] = useState([0, 1, 2, 3]);
  const unit = 100;
  const effectiveExpected = String(targetTotalScore ?? initialTotal);
  const [expected, setExpected] = useState(effectiveExpected);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('스마트폰을 세로로 든 상태에서 실시간 스캔을 시작해 주세요. 직접 입력도 가능합니다.');
  const [consensusCount, setConsensusCount] = useState(0);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    setExpected(effectiveExpected);
  }, [effectiveExpected]);

  // mobile-drop developer test bridge
  const [dropConfig, setDropConfig] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashQuery = window.location.hash.includes('?')
        ? new URLSearchParams(window.location.hash.split('?')[1])
        : new URLSearchParams();
      const urlParam = searchParams.get('dropUrl') || hashQuery.get('dropUrl') || '';
      const pinParam = searchParams.get('dropPin') || hashQuery.get('dropPin') || '';
      const deviceParam = searchParams.get('device') || hashQuery.get('device') || '';
      const saved = localStorage.getItem('mahjong_mobile_drop_config');
      const parsed = saved ? JSON.parse(saved) : {};
      const serverUrl = urlParam || parsed.serverUrl || '';
      const pin = pinParam || parsed.pin || '';
      const device = deviceParam || parsed.device || 'rex3';
      const enabled = Boolean(urlParam || pinParam || parsed.enabled);
      const autoUpload = parsed.autoUpload ?? true;
      return { enabled, serverUrl, pin, device, autoUpload, expanded: enabled };
    } catch {
      return { enabled: false, serverUrl: '', pin: '', device: 'rex3', autoUpload: true, expanded: false };
    }
  });

  const [uploadState, setUploadState] = useState<{
    uploading: boolean;
    progress: number;
    message: string;
    status: 'idle' | 'connected' | 'success' | 'error';
  }>({
    uploading: false,
    progress: 0,
    message: '',
    status: 'idle',
  });

  const [currentFile] = useState<File | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('mahjong_mobile_drop_config', JSON.stringify({
        enabled: dropConfig.enabled,
        serverUrl: dropConfig.serverUrl,
        pin: dropConfig.pin,
        device: dropConfig.device,
        autoUpload: dropConfig.autoUpload,
      }));
    } catch {}
  }, [dropConfig]);

  const performDropUpload = async (data: Blob | File, filename: string) => {
    if (!dropConfig.enabled || !dropConfig.serverUrl || !dropConfig.pin) return;
    setUploadState(prev => ({
      ...prev,
      uploading: true,
      progress: 0,
      status: 'idle',
      message: `PC로 전송 중... (${filename})`,
    }));

    try {
      const res = await uploadToMobileDrop(data, filename, {
        serverUrl: dropConfig.serverUrl,
        pin: dropConfig.pin,
        device: dropConfig.device,
        onProgress: p => {
          setUploadState(prev => ({
            ...prev,
            progress: p.percent,
            message: `전송 중... ${p.percent}% (${(p.loaded / (1024 * 1024)).toFixed(1)}MB / ${(p.total / (1024 * 1024)).toFixed(1)}MB)`,
          }));
        },
      });

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        status: 'success',
        message: `✅ PC 저장소(${res.targetDevice || dropConfig.device}) 전송 완료: ${filename}`,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '전송 실패';
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        status: 'error',
        message: `⚠️ PC 전송 실패: ${msg}`,
      }));
    }
  };

  const handleTestConnection = async () => {
    setUploadState(prev => ({ ...prev, message: '서버 연결 확인 중...', status: 'idle' }));
    const result = await checkDropStatus(dropConfig.serverUrl, dropConfig.pin);
    if (result.ok) {
      setUploadState(prev => ({ ...prev, status: 'connected', message: '✅ mobile-drop 세션에 정상 연결되었습니다.' }));
    } else {
      setUploadState(prev => ({ ...prev, status: 'error', message: `⚠️ ${result.message}` }));
    }
  };

  const handleManualDrop = () => {
    if (currentFile) {
      void performDropUpload(currentFile, `rexx3_input_${Date.now()}_${currentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    } else if (frames.length > 0 && frames[selected]) {
      const blob = dataUrlToBlob(frames[selected].url);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      void performDropUpload(blob, `rexx3_frame_${timestamp}.jpg`);
    }
  };

  const job = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopCamera = useRef<(() => void) | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const hidden = () => {
      if (!document.hidden || !stopCamera.current) return;
      job.current += 1; controller.current?.abort(); stopCamera.current(); stopCamera.current = null;
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setFlashing(false); setConsensusCount(0);
      setBusy(false); setScanning(false);
      setStatus('화면을 벗어나 스캔을 중지했습니다. 다시 스캔을 시작해 주세요.');
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      job.current += 1; controller.current?.abort(); stopCamera.current?.();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);
  const playerSignature = JSON.stringify(playerNames);
  useEffect(() => {
    if (stopCamera.current) {
      job.current += 1; controller.current?.abort(); stopCamera.current(); stopCamera.current = null;
      setBusy(false); setScanning(false);
      setStatus('플레이어가 변경되어 스캔을 중지했습니다. 배정을 확인하고 다시 시작해 주세요.');
    }
  }, [playerSignature]);

  const manual = () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashing(false); setConsensusCount(0);
    job.current += 1; controller.current?.abort(); stopCamera.current?.(); stopCamera.current = null;
    setBusy(false); setScanning(false);
    setStatus('직접 입력 모드: 아래 우마·오카 점수 기록표에서 직접 점수를 입력하거나 수정해 주세요.');
  };
  const beginScan = () => {
    if (busy || !videoRef.current) return;
    const token = ++job.current;
    controller.current?.abort(); stopCamera.current?.();
    const abort = new AbortController(); controller.current = abort;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashing(false); setConsensusCount(0);
    setFrames([]); setResults([]); setRaw(blank()); setSelected(0);
    setBusy(true); setScanning(true);
    setStatus('카메라를 여는 중입니다. 스마트폰을 세로로 들고 점수판을 비춰 주세요.');
    const cancel = startScoreCamera(videoRef.current, {
      signal: abort.signal, unit, expected, players: [...players], playerCount: playerNames.length,
      model: tableModel,
      onModelDetected: (detected: TableModel) => {
        if (token !== job.current) return;
        if (!isManualOverride) {
          setTableModel(detected);
          setDetectedModel(detected);
          try {
            localStorage.setItem('mahjong_table_model', detected);
          } catch {}
        }
      },
      onReading: (reading, count) => {
        if (token !== job.current) return;
        setConsensusCount(Math.min(3, Math.max(0, count)));
        setRaw(reading.map(value => value.raw));
        setStatus(count > 0 ? `점수 확인 중 (${count}/3회). 잠시 유지해 주세요.` : '네 점수와 기준 합계가 맞는지 읽고 있습니다. 세로로 든 상태에서 점수판 전체를 비춰 주세요.');
      },
      onCapture: (frame, reading) => {
        if (token !== job.current) return;
        job.current += 1; abort.abort(); stopCamera.current?.(); stopCamera.current = null;
        setConsensusCount(3);
        setFrames([frame]); setResults([reading]); setSelected(0); setRaw(reading.map(value => value.raw));
        setFlashing(true);
        setBusy(false); setScanning(false);
        setStatus('점수를 확인해 자동 캡처했습니다. 아래 우마·오카 점수 기록표에 즉시 반영되었습니다.');
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          setFlashing(false);
        }, 100);

        const converted = reading.map(value => String(Number(value.raw.trim()) * unit));
        const recognizedScores = {
          east: converted[0] || '0',
          south: converted[1] || '0',
          west: converted[2] || '0',
          north: converted[3] || '0',
        };
        if (onScoresRecognized) {
          onScoresRecognized(recognizedScores);
        } else if (onConfirm) {
          onConfirm(converted, players);
        }
      },
      onVideoReady: (videoBlob, ext, status) => {
        if (dropConfig.enabled && dropConfig.autoUpload && dropConfig.serverUrl && dropConfig.pin) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const prefix = dropConfig.device || 'rex3';
          const filename = status === 'success'
            ? `${prefix}_scan_${timestamp}.${ext}`
            : `${prefix}_fail_${timestamp}.${ext}`;
          void performDropUpload(videoBlob, filename);
        }
      },
      onError: error => {
        if (token !== job.current) return;
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        setFlashing(false); setConsensusCount(0);
        job.current += 1; stopCamera.current = null;
        setBusy(false); setScanning(false); setStatus(error.message);
      },
    });
    // Unsupported APIs may fail synchronously before the scanner returns its disposer.
    if (token === job.current) stopCamera.current = cancel;
    else cancel();
  };

  const handleRotate = async () => {
    if (!frames.length || busy) return;
    const currentFrame = frames[selected];
    const token = ++job.current;
    setBusy(true);
    setStatus('이미지를 90도 회전하고 점수를 다시 읽고 있습니다…');
    try {
      const rotated = await rotateFrame(currentFrame, 90);
      if (token !== job.current) return;
      const pixels = await framePixels(rotated);
      if (token !== job.current) return;
      const reading = recognizeScoreboard(pixels, tableModel);
      const newFrames = [...frames];
      newFrames[selected] = rotated;
      const newResults = [...results];
      newResults[selected] = reading;
      setFrames(newFrames);
      setResults(newResults);
      setRaw(reading.map(value => value.raw));
      const complete = reading.every(value => value.raw && value.confidence >= .75);
      setStatus(complete ? '회전된 이미지에서 판독한 점수입니다. 우마·오카 점수 기록표에 반영되었습니다.' : '회전 후에도 인식이 불확실합니다. 90도 더 회전하거나 직접 입력해 주세요.');
      if (complete) {
        const converted = reading.map(value => String(Number(value.raw.trim()) * unit));
        const recognizedScores = {
          east: converted[0] || '0',
          south: converted[1] || '0',
          west: converted[2] || '0',
          north: converted[3] || '0',
        };
        if (onScoresRecognized) {
          onScoresRecognized(recognizedScores);
        } else if (onConfirm) {
          onConfirm(converted, players);
        }
      }
    } catch {
      if (token !== job.current) return;
      setStatus('이미지 회전 또는 재인식에 실패했습니다. 직접 입력해 주세요.');
    } finally {
      if (token === job.current) setBusy(false);
    }
  };
  const chooseFrame = (index: number) => {
    setSelected(index); setRaw(results[index].map(value => value.raw));
    setStatus('선택한 프레임의 점수입니다. 우마·오카 점수 기록표에서 확인해 주세요.');
    const reading = results[index];
    if (reading && reading.every(value => value.raw)) {
      const converted = reading.map(value => String(Number(value.raw.trim()) * unit));
      const recognizedScores = {
        east: converted[0] || '0',
        south: converted[1] || '0',
        west: converted[2] || '0',
        north: converted[3] || '0',
      };
      if (onScoresRecognized) {
        onScoresRecognized(recognizedScores);
      } else if (onConfirm) {
        onConfirm(converted, players);
      }
    }
  };
  return <section className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-4 sm:p-6 my-4 space-y-4" aria-label="점수판 인식">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">{getText('scorePhotoInputTitle')}</h3>
        <p className="text-sm text-gray-600">카메라 영상은 이 기기에서만 처리하며 서버에 전송하지 않습니다. 스마트폰을 세로로 들고 점수판 전체를 비추면 같은 네 점수와 기준 합계가 확인될 때 자동 캡처합니다. 기록 전 점수와 플레이어를 확인해 주세요.</p>
      </div>
      {isTestMode && (
        <button
          type="button"
          aria-label="PC 전송 모드 설정 열기"
          className="self-start sm:self-center border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5 whitespace-nowrap"
          onClick={() => setDropConfig(c => ({ ...c, expanded: !c.expanded }))}
        >
          <span>🧪 PC 전송 모드</span>
          <span className={`w-2 h-2 rounded-full ${dropConfig.enabled && dropConfig.serverUrl ? (uploadState.status === 'connected' ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-gray-400'}`} />
          <span>{dropConfig.expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </div>

    {/* PC 전송 모드 (mobile-drop) 개발자 브리지 패널 */}
    {isTestMode && dropConfig.expanded && (
      <div className="border-2 border-emerald-300 bg-emerald-50/70 rounded-xl p-4 text-xs space-y-3" aria-label="PC 전송 모드 설정">
        <div className="flex items-center justify-between font-semibold text-emerald-950">
          <div className="flex items-center gap-2">
            <span>🧪 PC 전송 모드 (mobile-drop 연동)</span>
            {dropConfig.enabled && dropConfig.serverUrl ? (
              <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-bold">
                {uploadState.status === 'connected' ? '🟢 연결됨' : '연동 활성'}
              </span>
            ) : (
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[11px]">비활성</span>
            )}
          </div>
        </div>
        <p className="text-gray-600">
          모바일 현장 테스트 중 화면 스크린샷이나 수동 파일 이동 없이, 점수 인식과 동시에 촬영 영상/스냅샷을 PC 워크스페이스(<code>research-data/</code>)로 즉시 전송합니다.
        </p>

        <label className="flex items-center gap-2 font-semibold text-gray-800">
          <input
            type="checkbox"
            checked={dropConfig.enabled}
            onChange={e => setDropConfig(c => ({ ...c, enabled: e.target.checked }))}
          />
          PC 전송 브리지 사용 활성화
        </label>

        {dropConfig.enabled && (
          <div className="space-y-3 pt-2 border-t border-emerald-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Tunnel URL</label>
                <input
                  type="text"
                  placeholder="https://xxx.trycloudflare.com"
                  className="w-full border border-gray-300 rounded p-2 font-mono text-xs bg-white"
                  value={dropConfig.serverUrl}
                  onChange={e => setDropConfig(c => ({ ...c, serverUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">보안 PIN (6자리)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="w-full border border-gray-300 rounded p-2 font-mono text-center text-xs bg-white"
                    value={dropConfig.pin}
                    onChange={e => setDropConfig(c => ({ ...c, pin: e.target.value.replace(/[^0-9]/g, '') }))}
                  />
                  <button
                    type="button"
                    className="border border-emerald-600 bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-emerald-700 whitespace-nowrap"
                    onClick={handleTestConnection}
                  >
                    연결 확인
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">테스트 대상 작탁</label>
                <select
                  aria-label="테스트 대상 작탁 선택"
                  className="w-full border border-gray-300 rounded p-2 text-xs bg-white font-medium"
                  value={dropConfig.device}
                  onChange={e => setDropConfig(c => ({ ...c, device: e.target.value }))}
                >
                  <option value="rex3">AMOS REX 3 (research-data/rex 3)</option>
                  <option value="jpex">JP-EX (research-data/jp-ex)</option>
                  <option value="jpcolor">JP-Color (research-data/jp-color)</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={dropConfig.autoUpload}
                onChange={e => setDropConfig(c => ({ ...c, autoUpload: e.target.checked }))}
              />
              사진/영상 선택 또는 실시간 스캔 자동 캡처 시 PC로 자동 전송 (Auto-drop)
            </label>
          </div>
        )}

        {uploadState.uploading && (
          <div className="space-y-1.5 pt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 transition-all duration-150"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}

        {uploadState.message && (
          <div className={`p-2 rounded font-medium text-xs ${uploadState.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : uploadState.status === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold' : 'bg-blue-50 text-blue-900 border border-blue-200'}`}>
            {uploadState.message}
          </div>
        )}
      </div>
    )}

    {frames.length === 0 && !scanning && (
      <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-4 text-center space-y-3" aria-label="촬영 가이드">
        <div className="flex items-center justify-center gap-1.5 text-blue-800 font-semibold text-sm">
          <span>📐 실시간 스캔 가이드 (내 앞쪽 점수판 근접 촬영)</span>
        </div>
        <div className="mx-auto max-w-sm bg-white border border-blue-200 rounded-lg p-3 shadow-inner space-y-2">
          <div className="flex justify-between items-center px-1 text-[10px] font-mono gap-1.5">
            <div className="flex-1 h-5 border border-red-300 bg-red-50 text-red-700 flex items-center justify-center rounded">4.좌(상가) 250</div>
            <div className="flex-1 h-5 border border-red-300 bg-red-50 text-red-700 flex items-center justify-center rounded">3.중(대가) 250</div>
            <div className="flex-1 h-5 border border-red-300 bg-red-50 text-red-700 flex items-center justify-center rounded">2.우(하가) 250</div>
          </div>
          <div className="flex justify-center pt-1">
            <div className="w-36 h-6 border-2 border-red-400 bg-red-100/70 text-red-800 text-xs font-mono font-bold flex items-center justify-center rounded">1.하단(내자리) 250</div>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">AMOS REXX 3 전면 점수판 구조</p>
        </div>
        <p className="text-xs text-blue-900 font-medium leading-relaxed">
          <strong>동가가 촬영하고 기록합니다.</strong> 작탁 중앙(주사위통)이 아닌, <strong>내 바로 앞의 검은색 점수판</strong>을 비춰주세요.<br />
          (4개 점수가 카메라 화면에 모두 들어오는 편안한 거리에서 비추시면 됩니다.)<br />
          기본 배정: <strong>하단→P1 · 오른쪽→P2 · 중앙→P3 · 왼쪽→P4</strong><br />
          현재 동가가 P1이 아니면 점수 배정을 한 자리씩 이동해 맞춰 주세요.
        </p>
      </div>
    )}

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 font-semibold text-base shadow-sm disabled:opacity-50" onClick={beginScan} disabled={busy}>실시간 스캔 시작</button>
        {scanning && <button type="button" className="border rounded-lg px-4 py-2 bg-red-50 text-red-700 border-red-200 font-medium" onClick={manual}>스캔 중지</button>}
        <button type="button" className={button} onClick={manual}>직접 입력</button>
        {isTestMode && dropConfig.enabled && (frames.length > 0 || currentFile) && (
          <button
            type="button"
            className="border rounded px-4 py-2 bg-emerald-50 text-emerald-900 border-emerald-300 font-medium hover:bg-emerald-100 disabled:opacity-50"
            onClick={handleManualDrop}
            disabled={busy || uploadState.uploading}
          >
            📤 PC로 전송
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="table-model-select" className="text-xs font-semibold text-gray-700">작탁 기종:</label>
        <select
          id="table-model-select"
          aria-label="작탁 기종 선택"
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium text-gray-800"
          value={tableModel}
          onChange={e => handleModelChange(e.target.value as TableModel)}
          disabled={busy || scanning}
        >
          <option value="amos_rexx3">AMOS REXX 3 (4자리 / 순위 내장)</option>
          <option value="amos_jp_ex">AMOS JP-EX (2~3자리 / 다이아몬드)</option>
        </select>
        {detectedModel && !isManualOverride && (
          <span
            data-testid="auto-detected-badge"
            className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold border border-emerald-300 animate-pulse"
          >
            ✨ 자동 감지됨
          </span>
        )}
      </div>
    </div>

    <p role="status" aria-live="polite" className="text-sm text-gray-700 font-medium">{status}</p>
    <div hidden={!scanning && !flashing} className="space-y-2">
      <div className={`relative w-full h-52 sm:h-60 rounded-xl overflow-hidden border-2 transition-colors duration-200 ${
        consensusCount >= 2 ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' :
        consensusCount === 1 ? 'border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.3)]' :
        'border-blue-500/40'
      } bg-black shadow-inner`}>
        <video ref={videoRef} muted playsInline aria-label="실시간 점수판 영상" className="w-full h-full object-cover object-center block" />

        {/* 옵션 A: 클리어 윈도우 & 마스크 딤 조준 가이드 */}
        <div data-testid="viewfinder-roi" className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <div
            className={`relative w-[94%] sm:w-[96%] h-[78%] sm:h-[82%] rounded-xl border-2 transition-all duration-200 ${
              consensusCount >= 2
                ? 'border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.52),0_0_16px_rgba(52,211,153,0.6)]'
                : consensusCount === 1
                ? 'border-blue-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.52),0_0_12px_rgba(96,165,250,0.5)]'
                : 'border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.52)]'
            }`}
          >
            {/* 조준 가이드 상단 뱃지 */}
            <span
              className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors duration-200 shadow-sm ${
                consensusCount >= 2
                  ? 'bg-gray-900/90 border-emerald-400 text-emerald-300'
                  : consensusCount === 1
                  ? 'bg-gray-900/90 border-blue-400 text-blue-300'
                  : 'bg-gray-900/90 border-white/40 text-gray-200'
              }`}
            >
              🎯 점수판 조준
            </span>

            {/* 100ms 화이트 셔터 플래시 (조준 윈도우 내부 타겟 플래시) */}
            {flashing && (
              <div
                data-testid="viewfinder-flash"
                className="absolute inset-0 bg-white/95 rounded-lg transition-opacity duration-100 pointer-events-none z-50 animate-pulse"
              />
            )}
          </div>
        </div>

        {/* 뱃지: 좌상단 실시간 감지 */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 pointer-events-none border border-emerald-500/30 z-30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>실시간 감지 중</span>
        </div>

        {/* 뱃지: 우상단 3-dot 합의 게이지 */}
        <div data-testid="viewfinder-gauge" className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 pointer-events-none border border-white/20 z-30">
          <span className="text-[11px] text-gray-300 mr-0.5">합의</span>
          <span className={`w-2 h-2 rounded-full transition-all duration-200 ${consensusCount >= 1 ? (consensusCount >= 2 ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-blue-400 shadow-[0_0_6px_#60a5fa]') : 'bg-gray-500'}`} />
          <span className={`w-2 h-2 rounded-full transition-all duration-200 ${consensusCount >= 2 ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-gray-500'}`} />
          <span className={`w-2 h-2 rounded-full transition-all duration-200 ${consensusCount >= 3 ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-gray-500'}`} />
        </div>
      </div>
      {/* Live reading HUD */}
      <div className="grid grid-cols-4 gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono text-xs">
        <div className="p-1 rounded bg-white border">
          <div className="text-[10px] text-gray-500">내자리(동)</div>
          <div className="font-bold text-gray-800">{raw[0] ? raw[0] : '—'}</div>
        </div>
        <div className="p-1 rounded bg-white border">
          <div className="text-[10px] text-gray-500">하가(남)</div>
          <div className="font-bold text-gray-800">{raw[1] ? raw[1] : '—'}</div>
        </div>
        <div className="p-1 rounded bg-white border">
          <div className="text-[10px] text-gray-500">대가(서)</div>
          <div className="font-bold text-gray-800">{raw[2] ? raw[2] : '—'}</div>
        </div>
        <div className="p-1 rounded bg-white border">
          <div className="text-[10px] text-gray-500">상가(북)</div>
          <div className="font-bold text-gray-800">{raw[3] ? raw[3] : '—'}</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">
        💡 위/아래 불필요한 영역을 자동으로 접어둔 슬롯 뷰포트입니다. 점수판 전체(4개 점수)를 슬롯 안에 비춰주세요.
      </p>
    </div>

    {frames.length > 0 && <div>
      <img src={frames[selected].url} alt={`선택한 점수판 프레임 ${selected + 1}`} className="w-full rounded border" />
      <div className="flex flex-wrap items-center gap-2 my-2">
        <button type="button" className={button} onClick={handleRotate} disabled={busy}>⟲ 90° 회전</button>
        {frames.length > 1 && <div className="flex flex-wrap gap-2" aria-label="추출 프레임">
          {frames.map((frame, index) => <button key={index} type="button" className={button} disabled={busy} aria-pressed={selected === index} onClick={() => chooseFrame(index)}>프레임 {index + 1} · {frame.time.toFixed(2)}초</button>)}
        </div>}
      </div>
      <p className="text-sm text-gray-600">
        {tableModel === 'amos_jp_ex'
          ? 'AMOS JP-EX: 전 좌석 3자리(100점 단위) 다이아몬드 배치입니다. 10,000점 미만은 2자리로 표기됩니다.'
          : 'AMOS REXX 3: 아래쪽 큰 표시의 맨 왼쪽 순위 숫자는 점수에서 제외합니다. 위치별 플레이어를 확인해 주세요.'}
      </p>
    </div>}
  </section>;
}
export default PhotoUploadPanel;
