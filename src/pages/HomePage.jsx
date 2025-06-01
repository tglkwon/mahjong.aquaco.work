import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

function HomePage({ goToScoreTracker, currentLanguage, setCurrentLanguage }) {
  const { getText } = useTranslation(currentLanguage);

  const cards = [
    {
      title: getText('scoreTrackerTitle'),
      description: getText('unitFormationDesc'),
      icon: (
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 19H10v-1h4v1zm3-3H7V4c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v12zM9 8h6V6H9v2zm0 3h6V9H9v2zm0 3h6v-2H9v2z"/>
        </svg>
      ),
      action: goToScoreTracker,
    },
    {
      title: getText('underConstruction'),
      description: getText('cardManagementDesc'),
      icon: (
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 14h16v-2H4v2zm0 5h16v-2H4v2zm0-10h16V7H4v2zM4 4h16V2H4v2z"/>
        </svg>
      ),
      action: null,
    },
    {
      title: getText('underConstruction'),
      description: getText('scoreCalculatorDesc'),
      icon: (
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 2.24-9 5s4.03 5 9 5 9-2.24 9-5-4.03-5-9-5zm0 9c-4.97 0-9 2.24-9 5s4.03 5 9 5 9-2.24 9-5-4.03-5-9-5zm0-8c3.86 0 7 1.34 7 3s-3.14 3-7 3-7-1.34-7-3 3.14-3 7-3zm0 9c3.86 0 7 1.34 7 3s-3.14 3-7 3-7-1.34-7-3 3.14-3 7-3z" />
        </svg>
      ),
      action: null,
    },
    {
      title: getText('settings'),
      description: getText('settingsDesc'),
      icon: (
        <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.09-.73-1.71-.98l-.37-2.65c-.06-.25-.28-.42-.54-.42h-4c-.26 0-.48.17-.54.42l-.37 2.65c-.62.25-1.19.59-1.71.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.12.22-.07.49.12.64l2.11 1.65c-.04.32-.07-.64-.07-.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.39 1.09.73 1.71.98l.37 2.65c.06.25.28.42.54.42h4c.26 0 .48-.17.54.42l.37-2.65c.62-.25 1.19-.59 1.71-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
        </svg>
      ),
      action: null,
    },
  ];

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      <div className="fixed top-0 left-0 w-full bg-purple-400 h-14 flex items-center justify-between px-4 shadow-md z-50">
        <button
          className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={getText('menu')}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 px-3 pr-7 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-sm"
              aria-label={getText('language')}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>
      <div className="pt-[78.4px] w-full max-w-6xl flex flex-col items-center p-4">
        <div className="w-full text-left text-3xl font-bold text-gray-800 mb-8">
          MLTDAPP
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-6 flex items-start space-x-4 ${card.action ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'} transition-shadow duration-200`}
              onClick={card.action}
            >
              <div className="flex-shrink-0 mt-1">{card.icon}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h2>
                <p className="text-gray-600 text-base">{card.description}</p>
              </div>
              {card.action && (
                <div className="flex-shrink-0 ml-auto mt-1">
                  <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;