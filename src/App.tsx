import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainPage from './components/MainPage';
import ScorePage from './components/ScorePage';
import ScoreScanPage from './components/ScoreScanPage';
import AboutPage from './components/AboutPage';
import SeatCheckinPage from './components/SeatCheckinPage';
import QueuePage from './components/QueuePage';
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
        {/* 점수 스캔 및 기록 통합 페이지 (운영 및 테스트 겸용) */}
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
              <ScoreScanPage
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                getText={getText}
                translations={translations}
              />
            </Layout>
          }
        />
        {/* 테스트 라우트 및 구형 별칭 하위 호환 리다이렉트 (쿼리 파라미터 보존) */}
        <Route
          path="/scan_score_test"
          element={<LegacyPhotoRedirect />}
        />
        <Route
          path="/test_scan"
          element={<LegacyPhotoRedirect />}
        />
        <Route
          path="/set_score_photo"
          element={<LegacyPhotoRedirect />}
        />
        {/* 고정 QR 좌석 착석 라우트 */}
        <Route
          path="/seat"
          element={
            <Layout
              title="좌석 착석"
              showHomeButton={true}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <SeatCheckinPage />
            </Layout>
          }
        />
        {/* 대기열 및 4인 자리 추첨 라우트 */}
        <Route
          path="/queue"
          element={
            <Layout
              title="대기열 및 자리 추첨"
              showHomeButton={true}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              getText={getText}
            >
              <QueuePage />
            </Layout>
          }
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
                currentLanguage={currentLanguage}
              />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
