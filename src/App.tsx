import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainPage from './components/MainPage';
import ScorePage from './components/ScorePage';
import ScorePhotoInputPage from './components/ScorePhotoInputPage';
import AboutPage from './components/AboutPage';
import Layout from './components/Layout'; // Layout 컴포넌트 임포트
import useTranslation from './hooks/useTranslation'; // 다국어 상태 관리를 위해 훅을 임포트합니다.
import './App.css'; // Assuming you have global styles here

function LegacyPhotoRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: '/scan_score', search: location.search, hash: location.hash }} replace />;
}

function App() {
  // 최상위 컴포넌트에서 useTranslation 훅을 호출하여 상태를 중앙에서 관리합니다.
  const { currentLanguage, setCurrentLanguage, getText, translations } = useTranslation();

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout
              title={getText('mahjongWorldTitle')}
              showHomeButton={false}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <MainPage
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                getText={getText}
              />
            </Layout>
          }
        />
        <Route
          path="/set_score"
          element={
            <Layout
              title={getText('scoreTrackerTitle')}
              showHomeButton={true}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <ScorePage
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                getText={getText}
                translations={translations}
              />
            </Layout>
          }
        />
        <Route
          path="/set_score_umaoka"
          element={
            <Layout
              title={getText('scoreTrackerUmaOkaTitle')}
              showHomeButton={true}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <ScorePage
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                getText={getText}
                translations={translations}
              />
            </Layout>
          }
        />
        {/* 서비스 운영 페이지: 우마/오카 실시간 점수 스캔 */}
        <Route
          path="/scan_score"
          element={
            <Layout
              title={getText('scoreScanTitle')}
              showHomeButton={true}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <ScorePhotoInputPage
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                getText={getText}
                translations={translations}
                isTestMode={false}
              />
            </Layout>
          }
        />
        {/* 개발 및 현장 테스트 페이지: 다기종 데이터 수집 및 PC 전송 모드 탑재 */}
        <Route
          path="/scan_score_test"
          element={
            <Layout
              title={getText('scoreScanTestTitle')}
              showHomeButton={true}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <ScorePhotoInputPage
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                getText={getText}
                translations={translations}
                isTestMode={true}
              />
            </Layout>
          }
        />
        {/* 테스트 라우트 별칭 호환 */}
        <Route
          path="/test_scan"
          element={<Navigate to="/scan_score_test" replace />}
        />
        {/* 구형 라우트 하위 호환 리다이렉트 */}
        <Route
          path="/set_score_photo"
          element={<LegacyPhotoRedirect />}
        />
        {/* 서비스 정보 페이지 라우트 */}
        <Route
          path="/about"
          element={
            <Layout
              title={getText('aboutServiceTitle')}
              showHomeButton={true}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <AboutPage
                getText={getText}
              />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;