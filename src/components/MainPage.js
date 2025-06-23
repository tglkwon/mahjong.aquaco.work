import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage({ currentLanguage, setCurrentLanguage, getText }) { // Component name is HomePage, but file is MainPage.js. Let's stick with HomePage.
  const navigate = useNavigate();
  // isSidebarOpen 상태는 Layout 컴포넌트에서 관리합니다.

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
      title: getText('about'),
      description: getText('aboutCardDesc'),
      icon: ( // Icon size adjusted below
        <svg className="h-6 w-6 sm:h-7 md:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        </svg>
      ),
      action: () => navigate('/about'),
      path: '/about',
    },
  ];

  return (
    // Layout 컴포넌트가 이미 최상위 div와 패딩을 제공하므로, 여기서는 콘텐츠만 렌더링합니다.
    // 기존의 "relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800"
    // 및 "pt-[78.4px]" 클래스는 Layout 컴포넌트로 이동했습니다.
    <div className="w-full max-w-6xl flex flex-col items-center p-4">
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
  );
}

export default HomePage;