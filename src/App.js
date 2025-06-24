import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import ScorePage from './components/ScorePage';
import ScorePhotoInputPage from './components/ScorePhotoInputPage';
import AboutPage from './components/AboutPage';
import Layout from './components/Layout'; // Layout 컴포넌트 임포트
import useTranslation from './hooks/useTranslation'; // 다국어 상태 관리를 위해 훅을 임포트합니다.
import './App.css'; // Assuming you have global styles here
// import './index.css'; // If Tailwind is processed via PostCSS and imported here

function App() {
  // 최상위 컴포넌트에서 useTranslation 훅을 호출하여 상태를 중앙에서 관리합니다.
  const { currentLanguage, setCurrentLanguage, getText, translations } = useTranslation();

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            // Layout에 titleKey를 전달하여 Layout 내부에서 getText로 제목을 가져오도록 합니다.
            // 이제 App에서 직접 제목을 생성하고, 필요한 모든 props를 Layout과 MainPage에 전달합니다.
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
        <Route 
          path="/set_score_photo"
          element={
            <Layout 
              title={getText('scorePhotoInputTitle')} 
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
              />
            </Layout>
          }
        />
        {/* 서비스 정보 페이지 라우트 추가 */}
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