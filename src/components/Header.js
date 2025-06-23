import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header({ title, currentLanguage, setCurrentLanguage, getText, showHomeButton, onMenuClick }) {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-purple-400 h-12 sm:h-14 flex items-center justify-between px-2 sm:px-4 shadow-md z-50">
      <button
        onClick={onMenuClick}
        className="p-1 sm:p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label={getText('menu')}
      >
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mx-auto" style={{ fontFamily: "'KyoboHandwriting2021sjy', sans-serif" }}>
        {title}
      </h1>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative">
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="appearance-none bg-white border border-gray-300 text-gray-700 py-0.5 px-2 pr-3 sm:py-1 sm:px-3 sm:pr-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-xs sm:text-sm"
            aria-label={getText('language')}
          >
            <option value="ko">{getText('korean')}</option>
            <option value="en">{getText('english')}</option>
            <option value="ja">{getText('japanese')}</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-0.5 sm:px-1 text-gray-700">
            <svg className="fill-current h-2.5 w-2.5 sm:h-3 sm:w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
        {showHomeButton && (
          <button
            onClick={handleGoToHome} //
            className="p-1 sm:p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={getText('home')}
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default Header;