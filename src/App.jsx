import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import ScoreTrackerPage from './pages/ScoreTrackerPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  // 언어 상태를 App에서 직접 관리
  const [currentLanguage, setCurrentLanguage] = useState('ko');

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <HomePage
            currentLanguage={currentLanguage}
            setCurrentLanguage={setCurrentLanguage}
          />
        } />
        <Route path="/score" element={
          <ScoreTrackerPage
            currentLanguage={currentLanguage}
            setCurrentLanguage={setCurrentLanguage}
          />
        } />
      </Routes>
    </Router>
  );
}

export default App;