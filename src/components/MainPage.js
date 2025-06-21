import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

function HomePage({ currentLanguage, setCurrentLanguage, getText }) {
  const navigate = useNavigate();

  const cards = [
    {
      title: getText('scoreTrackerTitle'),
      description: getText('unitFormationDesc'),
      icon: ( // Icon size adjusted below
        <svg className="h-6 w-6 sm:h-7 md:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 19H10v-1h4v1zm3-3H7V4c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v12zM9 8h6V6H9v2zm0 3h6V9H9v2zm0 3h6v-2H9v2z"/>
        </svg>
      ),
      action: () => navigate('/set_score'),
      path: '/set_score',
    },
    {
      title: getText('scoreTrackerUmaOkaTitle'),
      description: getText('scoreTrackerUmaOkaDesc'),
      icon: ( // Icon size adjusted below
        <svg className="h-6 w-6 sm:h-7 md:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 19H10v-1h4v1zm3-3H7V4c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v12zM9 8h6V6H9v2zm0 3h6V9H9v2zm0 3h6v-2H9v2z"/>
        </svg>
      ),
      action: () => navigate('/set_score_umaoka'),
      path: '/set_score_umaoka',
    },
    {
      title: getText('underConstruction'),
      description: getText('scoreCalculatorDesc'), // Icon size adjusted below
      icon: '🚧', // Emoji icon
      action: null,
    },
    {
      title: getText('settings'),
      description: getText('settingsDesc'),
      icon: ( // Icon size adjusted below
        <svg className="h-6 w-6 sm:h-7 md:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.09-.73-1.71-.98l-.37-2.65c-.06-.25-.28-.42-.54-.42h-4c-.26 0-.48.17-.54.42l-.37 2.65c-.62.25-1.19.59-1.71-.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.12.22-.07.49.12.64l2.11 1.65c-.04.32-.07-.64-.07-.98s.03.66.07.98l-2.11 1.65c-.19-.15-.24-.42-.12-.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.39 1.09.73 1.71.98l.37 2.65c.06.25.28.42.54.42h4c.26 0 .48-.17.54.42l.37-2.65c.62-.25 1.19-.59 1.71-.98l2.49 1c.22-.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
        </svg>
      ),
      action: null,
    },
  ];

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      <Header
        title={getText('mahjongWorldTitle')}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        getText={getText}
        showHomeButton={false}
      />

      <div className="pt-[78.4px] w-full max-w-6xl flex flex-col items-center p-4">
        <div className="w-full text-left text-3xl font-bold text-gray-800 mb-8">
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-6 flex items-start space-x-4 hover:shadow-xl transition-shadow duration-200 ${card.action ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={card.action}
            >
              <div className="flex-shrink-0 mt-1">
                {typeof card.icon === 'string' ? ( // Emoji icon
                  <span className="text-2xl sm:text-[1.75rem] md:text-[2rem]">{card.icon}</span> // Adjusted to match SVG icon responsive sizes
                ) : ( // SVG icon
                  card.icon
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2">{card.title}</h2>
                <p className="text-sm sm:text-base text-gray-600">{card.description}</p>
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