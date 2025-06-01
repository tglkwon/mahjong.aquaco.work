import React, { useState } from 'react';
import { useTranslation } from './hooks/useTranslation';
import HomePage from './pages/HomePage';
import ScoreTrackerPage from './pages/ScoreTrackerPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { currentLanguage, setCurrentLanguage } = useTranslation('ko');

  const goToHome = () => setCurrentPage('home');
  const goToScoreTracker = () => setCurrentPage('scoreTracker');

  // Tailwind 및 폰트는 public/index.html에 넣는 것이 권장됩니다.
  return (
    <>
      {/* <script ...>와 <link ...>는 삭제 */}
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

export default App;