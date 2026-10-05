export interface Translation {
  language: string;
  korean: string;
  english: string;
  japanese: string;
  home: string;
  menu: string;
  underConstruction: string;
  sumDifference: string;
  currentTargetTotal: string;
  recordNeeded: string;
  recordReady: string;
  umaOkaGuide: string;
  noRecordedScores: string;
  shareWarning: string;
  startingScore: string;
  returnScore: string;
  mahjongWorldTitle: string;
  share: string;
  copied: string;
  scoreTrackerTitle: string;
  addRecord: string;
  total: string;
  game: string;
  totalGames: string;
  player: string;
  name: string;
  score: string;
  unitFormationMachine: string;
  unitFormationDesc: string;
  scoreTrackerUmaOkaTitle: string;
  scoreTrackerUmaOkaDesc: string;
  cardManagement: string;
  cardManagementDesc: string;
  scoreCalculator: string;
  scoreCalculatorDesc: string;
  settings: string;
  settingsDesc: string;
  goToScoreTracker: string;
  east: string;
  south: string;
  west: string;
  north: string;
  position: string;
  uma1_2: string;
  uma1_3: string;
  umaNone: string;
  okaOn: string;
  okaOff: string;
  umaOkaSettings: string;
  expandUmaOkaSettings: string;
  collapseUmaOkaSettings: string;
  oka: string;
  tieSplit: string;
  tieSeatOrder: string;
  tieHandling: string;
  playerPoolTitle: string;
  addPlayer: string;
  addPlayerPlaceholder: string;
  remove: string;
  totalScoresTitle: string;
  recordedScoresTitle: string;
  scoreInputTitle: string;
  closeMenu: string;
  playerActions: string;
  addChombo: string;
  undoChombo: string;
  about: string;
  aboutServiceTitle: string;
  aboutServiceDesc: string;
  contactTitle: string;
  contactDesc: string;
  privacyPolicyTitle: string;
  privacyPolicyDesc: string;
  termsOfServiceTitle: string;
  termsOfServiceDesc: string;
  versionHistoryTitle: string;
  aboutCardDesc: string;
  scorePhotoInputTitle: string;
  scorePhotoInputDesc: string;
  scoreScanTitle: string;
  scoreScanDesc: string;
  scoreScanTestTitle: string;
  scoreScanTestDesc: string;
  queueTitle: string;
  loading: string;
  versionHistoryError: string;
  popup_total_mismatch: string;
  popup_not_enough_players: string;
  popup_duplicate_players: string;
  popup_generic_error: string;
  delete: string;
  currentGameTotal?: string; // Optional because only en/ja have it in snippet? Checked below.
  // Actually looking at 'ko' there is NO currentGameTotal.
  // We should make interfaces consistent or optional.
}

// Checking consistency:
// 'ko' misses: currentGameTotal
// 'en' has: currentGameTotal
// 'ja' has: currentGameTotal

export interface Translations {
  ko: Translation;
  en: Translation;
  ja: Translation;
}

export const translations: Translations = {
  ko: {
    language: '언어',
    korean: '한국어',
    english: '영어',
    japanese: '일본어',
    home: '홈',
    menu: '메뉴',
    underConstruction: '공사 중',
    sumDifference: '합계 오차',
    currentTargetTotal: '현재 합계 / 목표 합계',
    recordNeeded: '합계를 맞춘 뒤 기록하세요.',
    recordReady: '기록 가능',
    umaOkaGuide: '플레이어를 설정하고 점수를 입력한 뒤, 합계를 맞추면 기록할 수 있습니다.',
    noRecordedScores: '아직 기록된 점수가 없습니다.',
    shareWarning: '기록은 공유 링크에 포함됩니다. 링크를 잃어버리면 복구할 수 없습니다.',
    startingScore: '시작 점수',
    returnScore: '반환 점수',
    mahjongWorldTitle: '아쿠아컴퍼니의 마작 월드',
    share: '공유하기',
    copied: 'URL이 복사되었습니다!',
    scoreTrackerTitle: '대탁 기록표',
    addRecord: '기록 추가하고 공유하기',
    total: '합계',
    game: '경기',
    totalGames: '총 {count} 경기',
    player: '플레이어',
    name: '이름',
    score: '점수',
    unitFormationMachine: '대탁 기록표',
    unitFormationDesc: '대탁할 때 편하게 기록하세요. 여기는 서버에 저장되지 않는 페이지입니다.',
    scoreTrackerUmaOkaTitle: '대탁 기록표 (우마/오카)',
    scoreTrackerUmaOkaDesc: '우마/오카 기능이 포함된 대탁 기록표입니다. 현재 베타 테스트 중입니다.',
    cardManagement: '소지 카드 관리',
    cardManagementDesc: '현재 공사 중인 페이지입니다.',
    scoreCalculator: '스코어 계산 기',
    scoreCalculatorDesc: '현재 공사 중인 페이지입니다.',
    settings: '설정',
    settingsDesc: '설정 페이지도 공사 중입니다.',
    goToScoreTracker: '점수 기록표로 이동',
    east: '동',
    south: '남',
    west: '서',
    north: '북',
    position: '자리',
    uma1_2: '1-2 우마',
    uma1_3: '1-3 우마',
    umaNone: '우마 미적용',
    okaOn: '오카 적용',
    okaOff: '오카 꺼짐',
    umaOkaSettings: '우마·오카 설정',
    expandUmaOkaSettings: '우마·오카 설정 펼치기',
    collapseUmaOkaSettings: '우마·오카 설정 접기',
    oka: '오카',
    tieSplit: '동점 균등 분배',
    tieSeatOrder: '자리순',
    tieHandling: '동점 처리',
    playerPoolTitle: '플레이어 목록',
    addPlayer: '플레이어 추가',
    addPlayerPlaceholder: '새 플레이어 이름 입력',
    remove: '삭제',
    totalScoresTitle: '플레이어별 총점',
    recordedScoresTitle: '기록된 점수',
    scoreInputTitle: '점수 기록',
    closeMenu: '메뉴 닫기',
    playerActions: '플레이어 관리',
    addChombo: '촌보 추가',
    undoChombo: '촌보 취소 가능: {count}회',
    about: '서비스 정보',
    aboutServiceTitle: '서비스에 대하여',
    aboutServiceDesc: '아쿠아컴퍼니의 마작 월드는 마작 점수 기록·공유, 점수판 인식과 자리 배정을 지원하는 개인 프로젝트입니다. 일반 기록표는 URL에 저장되며, 서버 연동 기능과 개발용 자료 전송은 별도의 저장을 수반합니다. 아래에서 현재 처리 안내와 시행 전 개정안을 확인해 주세요.',
    contactTitle: '개발자 및 문의',
    contactDesc: '피드백이나 문의사항은 아래 이메일로 보내주세요:',
    privacyPolicyTitle: '개인정보 처리방침',
    privacyPolicyDesc: '일반 대탁 기록표는 브라우저 URL 해시에, 언어와 기능 설정은 브라우저 저장소에 저장됩니다. 서버 연동 기능은 닉네임·기기 식별자·참여 상태·게임 및 점수 제출 정보를 서버에 저장합니다. 개발용 전송을 설정한 경우 사진·영상과 진단 자료가 설정된 수신 환경으로 전송되어 운영자의 개인 PC에 보관될 수 있습니다. 문의·삭제 요청: tglkwon@gmail.com. 아래 개정안의 기간별 삭제와 학습 동의 절차는 추후 개발 예정이며, 외부 AI 업체와 시행일은 미정입니다. 개정안 게시는 학습 또는 외부 제공 동의를 대신하지 않습니다.',
    termsOfServiceTitle: '서비스 이용약관',
    termsOfServiceDesc: 'URL을 분실하면 일반 기록표를 다시 불러오지 못할 수 있고, 공유받은 사람은 기록을 확인할 수 있습니다. 중요한 기록은 별도로 보관하고 인식된 점수는 확정 전에 확인해 주세요. 서비스와 인식 결과의 오류 가능성이 있으며 운영자의 책임은 관계 법령에 따릅니다. 아래의 새 이용약관은 시행 전 개정안으로, 시행일과 필요한 동의 절차는 별도로 안내합니다.',
    versionHistoryTitle: '업데이트 내역',
    aboutCardDesc: '서비스 정보, 개인정보 처리방침, 업데이트 내역 등을 확인합니다.',
    scorePhotoInputTitle: '대탁 기록표 - 점수 사진 입력 베타',
    scorePhotoInputDesc: '동가가 점수표시 작탁의 사진을 찍어 올리시면 점수가 자동입력 됩니다.',
    scoreScanTitle: '대탁 기록표 (우마/오카 실시간 스캔)',
    scoreScanDesc: '스마트폰 카메라로 점수판을 실시간 스캔하여 우마/오카 점수를 자동으로 계산하고 기록합니다.',
    scoreScanTestTitle: '점수 스캔 테스트 랩 (Lab)',
    scoreScanTestDesc: '작탁 기종별(Rexx 3, JP-EX, JP-Color) 데이터 수집 및 PC 실시간 전송 테스트를 진행합니다.',
    queueTitle: '대기열 & 자리 추첨',
    loading: '로딩 중',
    versionHistoryError: '버전 정보를 불러오는 데 실패했습니다.',
    popup_total_mismatch: '점수 합계가 목표 점수와 일치하지 않습니다.',
    popup_not_enough_players: '4명의 플레이어를 모두 선택해야 합니다.',
    popup_duplicate_players: '중복된 플레이어가 있습니다. 각기 다른 플레이어를 선택해주세요.',
    popup_generic_error: '알 수 없는 오류로 기록할 수 없습니다.',
    delete: '삭제', // Added missing key
    currentGameTotal: '현재 점수 합계', // Added missing key for consistency
  },
  en: {
    language: 'Language',
    korean: 'Korean',
    english: 'English',
    japanese: 'Japanese',
    home: 'Home',
    menu: 'Menu',
    underConstruction: 'Under Construction',
    currentGameTotal: 'Current Score Total',
    sumDifference: 'Sum Difference',
    currentTargetTotal: 'Current total / Target total',
    recordNeeded: 'Match the total before recording.',
    recordReady: 'Ready to record',
    umaOkaGuide: 'Set the players and enter the scores. You can record once the total matches.',
    noRecordedScores: 'No scores have been recorded yet.',
    shareWarning: 'Records are included in the share link. If you lose the link, they cannot be recovered.',
    startingScore: 'Starting Score',
    returnScore: 'Return Score',
    mahjongWorldTitle: "Aquaco's Mahjong World",
    share: 'Share',
    copied: 'URL copied!',
    scoreTrackerTitle: 'Mahjong Score Record',
    addRecord: 'Add Record & Share',
    total: 'Total',
    game: 'Game',
    totalGames: 'Total {count} Games',
    player: 'Player',
    name: 'Name',
    score: 'Score',
    unitFormationMachine: 'Mahjong Score Record',
    unitFormationDesc: 'Easily record your mahjong games. This page is not saved to the server.',
    scoreTrackerUmaOkaTitle: 'Score Tracker (Uma/Oka)',
    scoreTrackerUmaOkaDesc: 'A version of the score tracker with Uma/Oka functions. Currently in beta.',
    cardManagement: 'Owned Card Management',
    cardManagementDesc: 'This page is currently under construction.',
    scoreCalculator: 'Score Calculator',
    scoreCalculatorDesc: 'This page is currently under construction.',
    settings: 'Settings',
    settingsDesc: 'The settings page is also under construction.',
    goToScoreTracker: 'Go to Score Tracker',
    east: 'East',
    south: 'South',
    west: 'West',
    north: 'North',
    position: 'Position',
    uma1_2: '1-2 Uma',
    uma1_3: '1-3 Uma',
    umaNone: 'Uma off',
    okaOn: 'Oka on',
    okaOff: 'Oka off',
    umaOkaSettings: 'Uma/Oka settings',
    expandUmaOkaSettings: 'Expand Uma/Oka settings',
    collapseUmaOkaSettings: 'Collapse Uma/Oka settings',
    oka: 'Oka',
    tieSplit: 'Split Ties',
    tieSeatOrder: 'Seat Order',
    tieHandling: 'Tie Handling',
    playerPoolTitle: 'Player List',
    addPlayer: 'Add Player',
    addPlayerPlaceholder: 'Enter new player name',
    remove: 'Remove',
    totalScoresTitle: 'Total Scores by Player',
    recordedScoresTitle: 'Recorded Scores',
    scoreInputTitle: 'Score Entry',
    closeMenu: 'Close Menu',
    playerActions: 'Player Actions',
    addChombo: 'Add Chombo',
    undoChombo: 'Chombo available to undo: {count}',
    about: 'About',
    aboutServiceTitle: 'About This Service',
    aboutServiceDesc: 'Aquaco’s Mahjong World is a personal project for score recording, sharing, recognition and seat allocation. Standard score sheets use the URL; server-connected features and development-data transfers involve separate storage. See the current processing notice and the proposed policies below.',
    contactTitle: 'Developer & Contact',
    contactDesc: 'For feedback or inquiries, please send an email to:',
    privacyPolicyTitle: 'Privacy Policy',
    privacyPolicyDesc: 'Standard score sheets use the browser URL hash; language and feature settings use browser storage. Server-connected features store nicknames, device identifiers, participation, game and score-submission information on the server. Configured development transfers can send photos, videos and diagnostics to the selected receiver for storage on the operator’s personal PC. Contact/deletion requests: tglkwon@gmail.com. Timed deletion and training consent described in the draft will be developed later. The external AI provider and effective date are undecided. Publishing the draft does not replace consent to training or external disclosure.',
    termsOfServiceTitle: 'Terms of Service',
    termsOfServiceDesc: 'Losing the URL may prevent recovery of a standard score sheet; anyone receiving it can view the record. Keep important records separately and check recognized scores before confirming them. Service and recognition errors are possible; the operator’s liability follows applicable law. The new terms below are a proposal, with the effective date and required consent procedures to be announced separately.',
    versionHistoryTitle: 'Version History',
    aboutCardDesc: 'Check service information, privacy policy, update history, and more.',
    scorePhotoInputTitle: 'Score Tracker - Photo Input (Beta)',
    scorePhotoInputDesc: 'If the East player uploads a photo of the mahjong table with score display, scores will be entered automatically.',
    scoreScanTitle: 'Score Tracker (Live Uma/Oka Scan)',
    scoreScanDesc: 'Scan scoreboard in real time with smartphone camera to automatically calculate and record Uma/Oka scores.',
    scoreScanTestTitle: 'Score Scan Test Lab',
    scoreScanTestDesc: 'Collect scoreboard datasets across table models (Rexx 3, JP-EX, JP-Color) and test real-time PC drop.',
    queueTitle: 'Queue & Seat Draw',
    loading: 'Loading',
    versionHistoryError: 'Failed to load version history.',
    popup_total_mismatch: 'The total score does not match the target sum.',
    popup_not_enough_players: 'All 4 players must be selected.',
    popup_duplicate_players: 'There are duplicate players. Please select different players.',
    popup_generic_error: 'Cannot record due to an unknown error.',
    delete: 'Delete',
  },
  ja: {
    language: '言語',
    korean: '韓国語',
    english: '英語',
    japanese: '日本語',
    home: 'ホーム',
    menu: 'メニュー',
    underConstruction: '工事中',
    currentGameTotal: '現在の点数合計',
    sumDifference: '合計誤差',
    currentTargetTotal: '現在の合計 / 目標合計',
    recordNeeded: '合計を合わせてから記録してください。',
    recordReady: '記録できます',
    umaOkaGuide: 'プレイヤーを設定して点数を入力し、合計を合わせると記録できます。',
    noRecordedScores: 'まだ記録された点数はありません。',
    shareWarning: '記録は共有リンクに含まれます。リンクを失うと復元できません。',
    startingScore: '開始点',
    returnScore: '返し点',
    mahjongWorldTitle: 'アクアカンパニーの麻雀ワールド',
    share: '共有',
    copied: 'URLがコピーされました！',
    scoreTrackerTitle: '麻雀スコア記録表',
    addRecord: '記録追加して共有',
    total: '合計',
    game: '試合',
    totalGames: '合計 {count} 試合',
    player: 'プレイヤー',
    name: '名前',
    score: '点数',
    unitFormationMachine: '麻雀スコア記録表',
    unitFormationDesc: '麻雀を打つ際に楽に記録できます。このページはサーバーに保存されません。',
    scoreTrackerUmaOkaTitle: 'スコア記録表 (ウマ/オカ)',
    scoreTrackerUmaOkaDesc: 'ウマ/オカ機能が含まれているスコア記録表です。現在ベータテスト中です。',
    cardManagement: '所持カード管理',
    cardManagementDesc: '現在工事中のページです。',
    scoreCalculator: 'スコア計算機',
    scoreCalculatorDesc: '現在工事中のページです。',
    settings: '設定',
    settingsDesc: '設定ページも工事中です。',
    goToScoreTracker: 'スコア記録表へ移動',
    east: '東',
    south: '南',
    west: '西',
    north: '北',
    position: '席',
    uma1_2: '1-2 ウマ',
    uma1_3: '1-3 ウマ',
    umaNone: 'ウマなし',
    okaOn: 'オカ適用',
    okaOff: 'オカなし',
    umaOkaSettings: 'ウマ・オカ設定',
    expandUmaOkaSettings: 'ウマ・オカ設定を開く',
    collapseUmaOkaSettings: 'ウマ・オカ設定を閉じる',
    oka: 'オカ',
    tieSplit: '同点均等分配',
    tieSeatOrder: '席順',
    tieHandling: '同点処理',
    playerPoolTitle: 'プレイヤーリスト',
    addPlayer: 'プレイヤー追加',
    addPlayerPlaceholder: '新しいプレイヤー名を入力',
    remove: '削除',
    totalScoresTitle: 'プレイヤー別合計点',
    recordedScoresTitle: '記録済み点数',
    scoreInputTitle: '点数記録',
    closeMenu: 'メニューを閉じる',
    playerActions: 'プレイヤー管理',
    addChombo: 'チョンボ追加',
    undoChombo: '取り消し可能なチョンボ: {count}回',
    about: 'サービス情報',
    aboutServiceTitle: 'サービスについて',
    aboutServiceDesc: 'アクアカンパニーの麻雀ワールドは点数記録・共有、点数認識、座席割当を支援する個人プロジェクトです。通常記録表はURLを使用し、サーバー連携や開発資料送信は別の保存を伴います。以下の現在の処理案内と施行前改定案をご確認ください。',
    contactTitle: '開発者およびお問い合わせ',
    contactDesc: 'フィードバックやお問い合わせは、以下のメールアドレスまでお送りください：',
    privacyPolicyTitle: 'プライバシーポリシー',
    privacyPolicyDesc: '通常記録表はブラウザのURLハッシュ、言語・機能設定はブラウザ保存領域を使用します。サーバー連携はニックネーム・端末識別子・参加状態・対局・点数提出情報を保存します。開発用送信を設定した場合、写真・動画・診断を指定受信先へ送り運営者の個人PCで保管することがあります。お問い合わせ・削除請求：tglkwon@gmail.com。改定案の期間別削除・学習同意手続きは今後開発予定で、外部AI事業者・施行日は未定です。案の掲載は学習・外部提供への同意に代わりません。',
    termsOfServiceTitle: '利用規約',
    termsOfServiceDesc: 'URL紛失で通常記録表を復元できない場合があり、共有先は記録を閲覧できます。重要な記録は別途保存し、認識点数を確定前に確認してください。サービス・認識に誤りが生じることがあり、責任は適用法令に従います。以下の新規約は施行前の案で、施行日と必要な同意手続きを別途案内します。',
    versionHistoryTitle: '更新履歴',
    aboutCardDesc: 'サービス情報、プライバシーポリシー、更新履歴などを確認します。',
    scorePhotoInputTitle: 'スコア記録表 - 点数写真入力 (ベータ)',
    scorePhotoInputDesc: '東家が点数表示卓の写真を撮ってアップロードすると、点数が自動で入力されます。',
    scoreScanTitle: '対局記録表 (ウマ・オカ リアルタイムスキャン)',
    scoreScanDesc: 'スマホカメラで点数表示をリアルタイムスキャンし、ウマ・オカ点数を自動計算・記録します。',
    scoreScanTestTitle: '点数スキャン テストラボ',
    scoreScanTestDesc: '卓機種別(Rexx 3, JP-EX, JP-Color)のデータ収集およびPCリアルタイム転送テストを行います。',
    queueTitle: '待機列＆席抽選',
    loading: '読み込み中',
    versionHistoryError: 'バージョン情報の読み込みに失敗しました。',
    popup_total_mismatch: '点数合計が目標点数と一致しません。',
    popup_not_enough_players: '4人のプレイヤーをすべて選択する必要があります。',
    popup_duplicate_players: '重複したプレイヤーがいます。それぞれ異なるプレイヤーを選択してください。',
    popup_generic_error: '不明なエラーのため記録できません。',
    delete: '削除',
  }
};
