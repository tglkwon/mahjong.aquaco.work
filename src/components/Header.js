import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header({ title, currentLanguage, setCurrentLanguage, getText, showHomeButton }) {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-purple-400 h-14 flex items-center justify-between px-4 shadow-md z-50">
      <button
        className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label={getText('menu')}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      <h1 className={`${showHomeButton ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-bold text-white mx-auto`} style={{ fontFamily: "'KyoboHandwriting2021sjy', sans-serif" }}>
        {title}
      </h1>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 px-3 pr-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-sm"
            aria-label={getText('language')}
          >
            <option value="ko">{getText('korean')}</option>
            <option value="en">{getText('english')}</option>
            <option value="ja">{getText('japanese')}</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700">
            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
        {showHomeButton && (
          <button
            onClick={handleGoToHome}
            className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={getText('home')}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default Header;