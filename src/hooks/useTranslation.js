import { useState } from 'react';

export const translations = {
  ko: {
    language: '언어',
    korean: '한국어',
    english: '영어',
    japanese: '일본어',
    home: '홈',
    menu: '메뉴',
    underConstruction: '공사 중',
    name: '이름',
    score: '점수',
    scoreTrackerTitle: '대탁 기록표',
    addRecord: '기록 추가',
    aaName: 'Aa 이름',
    total: '합계',
    game: '경기',
    delete: '삭제',
    totalGames: '총 {count} 경기',
    player: '플레이어',
    unitFormationDesc: '악곡을 선택하고, 하이 스코어를 낼 수 있는 유닛 편성을 조사한다.',
    cardManagement: '소지 카드 관리',
    cardManagementDesc: '카드의 소지 상태를 관리한다 (유닛 편성 기 (β)를 사용 할 때 필요).',
    scoreCalculatorDesc: '악곡과 유닛을 선택하고, 하이 스코어가 어느 정도의 확률로 나올지 조사한다.',
    settings: '설정',
    settingsDesc: '각 앱의 설정 (테마 컬러, 스코어 % 값 등)을 커스터마이즈한다.',
    goToScoreTracker: '점수 기록표로 이동',
  },
  en: {
    language: 'Language',
    korean: 'Korean',
    english: 'English',
    japanese: 'Japanese',
    home: 'Home',
    menu: 'Menu',
    underConstruction: 'Under Construction',
    name: 'Name',
    score: 'Score',
    scoreTrackerTitle: 'Mahjong Score Tracker',
    addRecord: 'Add Record',
    aaName: 'Aa Name',
    total: 'Total',
    game: 'Game',
    delete: 'Delete',
    totalGames: 'Total {count} Games',
    player: 'Player',
    unitFormationDesc: 'Search for unit formations that can achieve high scores by selecting songs.',
    cardManagement: 'Owned Card Management',
    cardManagementDesc: 'Manage card ownership (necessary when using Unit Formation Machine (β)).',
    scoreCalculatorDesc: 'Select songs and units to find out the probability of achieving a high score.',
    settings: 'Settings',
    settingsDesc: 'Customize settings for each app (theme color, score % value, etc.).',
    goToScoreTracker: 'Go to Score Tracker',
  },
  ja: {
    language: '言語',
    korean: '韓国語',
    english: '英語',
    japanese: '日本語',
    home: 'ホーム',
    menu: 'メニュー',
    underConstruction: '工事中',
    name: '名前',
    score: '点数',
    scoreTrackerTitle: '麻雀スコア記録表',
    addRecord: '記録追加',
    aaName: 'Aa 名前',
    total: '合計',
    game: '試合',
    delete: '削除',
    totalGames: '合計 {count} 試合',
    player: 'プレイヤー',
    unitFormationDesc: '楽曲を選んで、ハイスコアを出すことが可能なユニット編成を調べる。',
    cardManagement: '所持カード管理',
    cardManagementDesc: 'カードの所持状態を管理する (ユニット編成機 (β)を使用する際に必要)。',
    scoreCalculatorDesc: '楽曲とユニットを選んで、ハイスコアがどの程度の確率で出るかを調べる。',
    settings: '設定',
    settingsDesc: '各アプリの設定 (テーマカラー、スコア%値等) をカスタマイズする。',
    goToScoreTracker: 'スコア記録表へ移動',
  },
};

export const useTranslation = (initialLang = 'ko') => {
  const [currentLanguage, setCurrentLanguage] = useState(initialLang);

  const getText = (key, params = {}) => {
    let text = translations[currentLanguage]?.[key] || key;
    for (const param in params) {
      text = text.replace(`{${param}}`, params[param]);
    }
    return text;
  };

  return { currentLanguage, setCurrentLanguage, getText };
};