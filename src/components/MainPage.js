import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage({ currentLanguage, setCurrentLanguage, getText }) { // Component name is HomePage, but file is MainPage.js. Let's stick with HomePage.
  const navigate = useNavigate();
  // isSidebarOpen 상태는 Layout 컴포넌트에서 관리합니다.

  const cards = [
    {
      title: getText('scoreTrackerTitle'),
      description: getText('unitFormationDesc'),
      icon: ( // List icon for general score tracker
        <svg className="h-6 w-6 sm:h-7 md:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-8h14V7H7v2z"/>
        </svg>
      ),
      action: () => navigate('/set_score'),
      path: '/set_score',
    },
    {
      title: getText('scoreTrackerUmaOkaTitle'),
      description: getText('unitFormationDesc'), // Reuse existing description
      icon: ( // Trophy icon for Uma/Oka
        <svg className="h-6 w-6 sm:h-7 md:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 3.22V19H7v2h10v-2h-6v-2.64c1.62-.58 2.97-1.72 3.61-3.22C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zm-2 3c0 2.21-1.79 4-4 4s-4-1.79-4-4V7h8v1z"/>
        </svg>
      ),
      action: () => navigate('/set_score_umaoka'),
      path: '/set_score_umaoka',
    },
    // {
    //   title: getText('scorePhotoInputTitle'),
    //   description: getText('scorePhotoInputDesc'),
    //   icon: (
    //     <svg className="h-6 w-6 sm:h-7 md:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
    //       <circle cx="12" cy="12" r="3.2"/>
    //       <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    //     </svg>
    //   ),
    //   action: () => navigate('/set_score_photo'),
    //   path: '/set_score_photo',
    // },
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