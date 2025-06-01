import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// ============================================================================
// 다국어 지원을 위한 텍스트 번역 객체
// ============================================================================
const translations = {
  ko: {
    // 공통
    language: '언어',
    korean: '한국어',
    english: '영어',
    japanese: '일본어',
    home: '홈',
    menu: '메뉴',
    underConstruction: '공사 중', // 새롭게 추가된 번역 키
    name: '이름', // 1. 추가된 번역 키
    score: '점수', // 1. 추가된 번역 키

    // 대탁 기록표 페이지
    scoreTrackerTitle: '대탁 기록표',
    addRecord: '기록 추가',
    total: '합계',
    game: '경기',
    delete: '삭제',
    totalGames: '총 {count} 경기',
    player: '플레이어',

    // 홈페이지 (3. unitFormationMachine, scoreCalculator 키 제거됨)
    unitFormationDesc: '악곡을 선택하고, 하이 스코어를 낼 수 있는 유닛 편성을 조사한다.',
    cardManagement: '소지 카드 관리',
    cardManagementDesc: '카드의 소지 상태를 관리한다 (유닛 편성 기 (β)를 사용 할 때 필요).',
    scoreCalculatorDesc: '악곡과 유닛을 선택하고, 하이 스코어가 어느 정도의 확률로 나올지 조사한다.',
    settings: '설정',
    settingsDesc: '각 앱의 설정 (테마 컬러, 스코어 % 값 등)을 커스터마이즈한다.',
    goToScoreTracker: '점수 기록표로 이동',
  },
  en: {
    // Common
    language: 'Language',
    korean: 'Korean',
    english: 'English',
    japanese: 'Japanese',
    home: 'Home',
    menu: 'Menu',
    underConstruction: 'Under Construction',
    name: 'Name', // 1. Added translation key
    score: 'Score', // 1. Added translation key

    // Score Tracker Page
    scoreTrackerTitle: 'Mahjong Score Tracker',
    addRecord: 'Add Record',
    total: 'Total',
    game: 'Game',
    delete: 'Delete',
    totalGames: 'Total {count} Games',
    player: 'Player',

    // Homepage (3. unitFormationMachine, scoreCalculator keys removed)
    unitFormationDesc: 'Search for unit formations that can achieve high scores by selecting songs.',
    cardManagement: 'Owned Card Management',
    cardManagementDesc: 'Manage card ownership (necessary when using Unit Formation Machine (β)).',
    scoreCalculatorDesc: 'Select songs and units to find out the probability of achieving a high score.',
    settings: 'Settings',
    settingsDesc: 'Customize settings for each app (theme color, score % value, etc.).',
    goToScoreTracker: 'Go to Score Tracker',
  },
  ja: {
    // 共通
    language: '言語',
    korean: '韓国語',
    english: '英語',
    japanese: '日本語',
    home: 'ホーム',
    menu: 'メニュー',
    underConstruction: '工事中',
    name: '名前', // 1. 追加された翻訳キー
    score: '点数', // 1. 追加された翻訳キー

    // 麻雀スコア記録表ページ
    scoreTrackerTitle: '麻雀スコア記録表',
    addRecord: '記録追加',
    total: '合計',
    game: '試合',
    delete: '削除',
    totalGames: '合計 {count} 試合',
    player: 'プレイヤー',

    // ホームページ (3. unitFormationMachine, scoreCalculator キー削除)
    unitFormationDesc: '楽曲を選んで、ハイスコアを出すことが可能なユニット編成を調べる。',
    cardManagement: '所持カード管理',
    cardManagementDesc: 'カードの所持状態を管理する (ユニット編成機 (β)を使用する際に必要)。',
    scoreCalculatorDesc: '楽曲とユニットを選んで、ハイスコアがどの程度の確率で出るかを調べる。',
    settings: '設定',
    settingsDesc: '各アプリの設定 (テーマカラー、スコア%値等) をカスタマイズする。',
    goToScoreTracker: 'スコア記録表へ移動',
  },
};

// ============================================================================
// 공통 텍스트 가져오기 헬퍼 함수
// ============================================================================
const useTranslation = (initialLang = 'ko') => {
  const [currentLanguage, setCurrentLanguage] = useState(initialLang);

  const getText = (key, params = {}) => {
    let text = translations[currentLanguage]?.[key] || key; // Optional chaining for safety
    for (const param in params) {
      text = text.replace(`{${param}}`, params[param]);
    }
    return text;
  };

  return { currentLanguage, setCurrentLanguage, getText };
};

// ============================================================================
// ScoreTrackerPage 컴포넌트 (기존 대탁 기록표)
// ============================================================================
const VALID_GAME_TOTAL = 1000; // 6. 하드코딩된 값 상수화

function ScoreTrackerPage({ goToHome, currentLanguage, setCurrentLanguage }) {
  // 6. 초기 플레이어 이름: 특정 언어에 종속되지 않도록 변경, useEffect에서 언어에 맞게 설정됨
  const initialPlayerNames = Array(4).fill('');
  const initialGames = [{ id: 1, scores: Array(4).fill('') }];

  const [playerNames, setPlayerNames] = useState(initialPlayerNames);
  const [games, setGames] = useState(initialGames);

  const { getText } = useTranslation(currentLanguage);

  // 4. useEffect 의존성 배열 수정: initialPlayerNames 제거
  useEffect(() => {
    setPlayerNames(initialPlayerNames.map((_, i) => `${getText('player')} ${i + 1}`));
  }, [currentLanguage, getText]); // initialPlayerNames는 상수로 간주되어 제거

  // 5. 새로운 게임 ID 생성 로직: 기존 로직이 `games.length > 0` 체크로 안전하므로 유지
  const handleAddGame = () => {
    const newGameId = games.length > 0 ? Math.max(...games.map(g => g.id)) + 1 : 1;
    setGames([...games, { id: newGameId, scores: Array(playerNames.length).fill('') }]);
  };

  const handleScoreChange = (gameId, playerIndex, newScore) => {
    setGames(games.map(game =>
      game.id === gameId
        ? {
            ...game,
            scores: game.scores.map((score, idx) =>
              idx === playerIndex ? (newScore === '' ? '' : parseInt(newScore, 10) || 0) : score
            ),
          }
        : game
    ));
  };

  const handlePlayerNameChange = (index, newName) => {
    setPlayerNames(playerNames.map((name, idx) => (idx === index ? newName : name)));
  };

  const totalScores = useMemo(() => {
    return playerNames.map((_, playerIndex) =>
      games.reduce((sum, game) => sum + (game.scores[playerIndex] === '' ? 0 : game.scores[playerIndex] || 0), 0)
    );
  }, [games, playerNames]);

  const handleDeleteGame = (gameIdToDelete) => {
    setGames(games.filter(game => game.id !== gameIdToDelete));
  };

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      {/* 상단 연보라색 바 */}
      <div className="fixed top-0 left-0 w-full bg-purple-400 h-14 flex items-center justify-between px-4 shadow-md z-50">
        {/* 왼쪽: 숨어있는 메뉴 토글 버튼 (햄버거 아이콘) */}
        <button
          className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={getText('menu')}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* 바 중앙 - 타이틀 */}
        <h1 className="text-xl font-bold text-white mx-auto">{getText('scoreTrackerTitle')}</h1>

        {/* 오른쪽 섹션: 언어 선택 드롭다운과 홈 버튼 */}
        <div className="flex items-center space-x-2">
          {/* 언어 선택 드롭다운 */}
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 px-3 pr-7 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-sm"
              aria-label={getText('language')}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          {/* 홈 버튼 */}
          <button
            onClick={goToHome} // 홈으로 이동하는 기능 연결
            className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={getText('home')}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* 기존 콘텐츠: 상단 바의 높이(h-14 = 56px) + 추가 마진(22.4px) = 78.4px 만큼 패딩 추가 */}
      {/* 6. pt-[78.4px] 주석으로 설명 추가 */}
      <div className="pt-[78.4px] w-full max-w-6xl flex flex-col items-center p-4">
        {/* 점수 기록 테이블 컨테이너 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-6xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* 9. 빈 span 태그 제거 */}
                <th className="px-6 py-3 text-center text-xl font-medium text-gray-500 uppercase tracking-wider">
                </th>
                {playerNames.map((name, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-center text-xl font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center text-gray-700 font-medium text-xl"
                      // 1. getText('name') 사용
                      aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
                    />
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xl font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-blue-50 font-bold text-blue-800">
                <td className="px-6 py-4 whitespace-nowrap text-center text-xl">
                  {getText('total')}
                </td>
                {totalScores.map((total, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-center text-xl">
                    {total}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-center text-xl"></td>
              </tr>
              {games.map(game => {
                const gameTotal = game.scores.reduce((sum, score) => sum + (score === '' ? 0 : score), 0);
                // 6. VALID_GAME_TOTAL 상수 사용
                const isValid = gameTotal === VALID_GAME_TOTAL;
                return (
                  <tr key={game.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-medium text-gray-900">
                      {game.id} {getText('game')}
                    </td>
                    {playerNames.map((_, playerIndex) => (
                      <td key={playerIndex} className="px-6 py-2 whitespace-nowrap text-center text-xl text-gray-900">
                        <input
                          type="number"
                          value={game.scores[playerIndex]}
                          onChange={(e) => handleScoreChange(game.id, playerIndex, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xl"
                          // 1. getText('score') 사용
                          aria-label={`${game.id} ${getText('game')} ${playerNames[playerIndex]} ${getText('score')}`}
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`text-xl font-bold ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                          {isValid ? 'O' : ''}
                        </span>
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="text-red-600 hover:text-red-900 text-xl font-semibold p-1 rounded-full hover:bg-red-100 transition-colors duration-200"
                          aria-label={`${game.id} ${getText('game')} ${getText('delete')}`}
                          title={`${game.id} ${getText('game')} ${getText('delete')}`}
                        >
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleAddGame}
          className="mt-8 ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xl"
          aria-label={getText('addRecord')}
        >
          {getText('addRecord')}
        </button>

        <div className="mt-8 text-gray-600 text-xl">
          <p>{getText('totalGames', { count: games.length })}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HomePage 컴포넌트 (스크린샷 기반)
// ============================================================================
function HomePage({ goToScoreTracker, currentLanguage, setCurrentLanguage }) {
  const { getText } = useTranslation(currentLanguage);

  // 카드 데이터
  const cards = [
    {
      title: getText('scoreTrackerTitle'),
      description: getText('unitFormationDesc'), // 설명은 기존 유지 (만약 이 설명이 '대탁 기록표'와 맞지 않다면, 적절한 키로 변경 필요)
      icon: ( 
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 19H10v-1h4v1zm3-3H7V4c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v12zM9 8h6V6H9v2zm0 3h6V9H9v2zm0 3h6v-2H9v2z"/>
        </svg>
      ),
      action: goToScoreTracker, 
    },
    {
      title: getText('underConstruction'), 
      description: getText('cardManagementDesc'),
      icon: ( 
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 14h16v-2H4v2zm0 5h16v-2H4v2zm0-10h16V7H4v2zM4 4h16V2H4v2z"/>
        </svg>
      ),
      action: null, 
    },
    {
      title: getText('underConstruction'), 
      description: getText('scoreCalculatorDesc'),
      icon: ( 
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 2.24-9 5s4.03 5 9 5 9-2.24 9-5-4.03-5-9-5zm0 9c-4.97 0-9 2.24-9 5s4.03 5 9 5 9-2.24 9-5-4.03-5-9-5zm0-8c3.86 0 7 1.34 7 3s-3.14 3-7 3-7-1.34-7-3 3.14-3 7-3zm0 9c3.86 0 7 1.34 7 3s-3.14 3-7 3-7-1.34-7-3 3.14-3 7-3z" />
        </svg>
      ),
      action: null, 
    },
    {
      title: getText('settings'),
      description: getText('settingsDesc'),
      icon: (
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.09-.73-1.71-.98l-.37-2.65c-.06-.25-.28-.42-.54-.42h-4c-.26 0-.48.17-.54.42l-.37 2.65c-.62.25-1.19.59-1.71.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.12.22-.07.49.12.64l2.11 1.65c.04.32.07-.64.07-.98s-.03.66-.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.39 1.09.73 1.71.98l.37 2.65c.06.25.28.42.54.42h4c.26 0 .48-.17.54.42l.37-2.65c.62-.25 1.19-.59 1.71-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
        </svg>
      ),
      action: null, 
    },
  ];

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      {/* 상단 연보라색 바 */}
      <div className="fixed top-0 left-0 w-full bg-purple-400 h-14 flex items-center justify-between px-4 shadow-md z-50">
        {/* 왼쪽: 숨어있는 메뉴 토글 버튼 (햄버거 아이콘) */}
        <button
          className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={getText('menu')}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* 바 중앙 - 타이틀 (홈페이지는 타이틀 없음) */}
        {/* <h1 className="text-xl font-bold text-white mx-auto">MLTDAPP</h1> */}

        {/* 오른쪽 섹션: 언어 선택 드롭다운과 홈 버튼 (홈페이지에서는 홈 버튼이 필요 없음) */}
        <div className="flex items-center space-x-2">
          {/* 언어 선택 드롭다운 */}
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 px-3 pr-7 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-sm"
              aria-label={getText('language')}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          {/* 홈 버튼 (홈페이지에서는 홈 버튼이 필요 없으므로 제거) */}
        </div>
      </div>

      {/* 홈페이지 콘텐츠 */}
      {/* pt-[78.4px]는 상단 바 높이(h-14 = 56px) + 추가 마진(22.4px)을 고려한 값 */}
      <div className="pt-[78.4px] w-full max-w-6xl flex flex-col items-center p-4">
        {/* MLTDAPP 로고/타이틀 (스크린샷 참조) */}
        <div className="w-full text-left text-3xl font-bold text-gray-800 mb-8">
          MLTDAPP
        </div>

        {/* 카드 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-6 flex items-start space-x-4 ${card.action ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'} transition-shadow duration-200`}
              onClick={card.action} // 카드 클릭 시 액션 실행 (action이 null이면 클릭 효과 없음)
            >
              <div className="flex-shrink-0 mt-1">{card.icon}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h2>
                <p className="text-gray-600 text-base">{card.description}</p>
              </div>
              {card.action && ( // action이 있을 때만 화살표 아이콘 표시
                <div className="flex-shrink-0 ml-auto mt-1">
                  <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 메인 App 컴포넌트 (라우팅 관리)
// ============================================================================
function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' 또는 'scoreTracker'
  const { currentLanguage, setCurrentLanguage } = useTranslation('ko'); // App에서 언어 상태 관리

  const goToHome = () => {
    setCurrentPage('home');
  };

  const goToScoreTracker = () => {
    setCurrentPage('scoreTracker');
  };

  // Tailwind CSS 및 폰트 로드는 public/index.html의 <head>에 위치하는 것이 일반적입니다.
  // React 컴포넌트 내부에 <script>, <link> 태그를 두는 것은 권장되지 않습니다.
  // 여기서는 제공된 코드 구조를 유지합니다.
  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script> 
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {currentPage === 'home' ? (
        <HomePage
          goToScoreTracker={goToScoreTracker}
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
        />
      ) : (
        <ScoreTrackerPage
          goToHome={goToHome}
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
        />
      )}
    </>
  );
}

const root = document.getElementById('root');
ReactDOM.createRoot(root).render(<App />);