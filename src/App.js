import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import ScorePage from './components/ScorePage';
import useTranslation from './hooks/useTranslation';
import './App.css'; // Assuming you have global styles here
// import './index.css'; // If Tailwind is processed via PostCSS and imported here

function App() {
  const { currentLanguage, setCurrentLanguage, getText } = useTranslation('ko');

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<MainPage currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} getText={getText} />} 
        />
        <Route 
          path="/set_score"
          element={<ScorePage currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} getText={getText} />} 
        />
        <Route 
          path="/set_score_umaoka"
          element={<ScorePage currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} getText={getText} />} 
        />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;