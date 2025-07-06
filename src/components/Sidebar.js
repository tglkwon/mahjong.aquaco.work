import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar({ isOpen, onClose, getText }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
    onClose(); // 네비게이션 후 사이드바 닫기
  };

  const navItems = [
    { path: '/', text: getText('home'), icon: '🏠' },
    { path: '/set_score', text: getText('scoreTrackerTitle'), icon: '📊' },
    { path: '/set_score_umaoka', text: getText('scoreTrackerUmaOkaTitle'), icon: '🎲' },
    // { path: '/set_score_photo', text: getText('scorePhotoInputTitle'), icon: '📷' },
    { path: '/about', text: getText('about'), icon: 'ℹ️' },
    // { path: '/settings', text: getText('settings'), icon: '⚙️' }, // 다른 페이지 예시
  ];

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[55] transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* 사이드바 패널 */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 sm:w-72 bg-white shadow-xl z-[60] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="sidebar-title" className="text-lg font-bold text-purple-600" style={{ fontFamily: "'KyoboHandwriting2021sjy', sans-serif" }}>
            {getText('menu')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={getText('closeMenu')}
          >
            <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-2 mt-2">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center p-3 my-1 text-left rounded-lg transition-colors duration-200 ${location.pathname === item.path ? 'bg-purple-100 text-purple-800 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="mr-4 text-xl">{item.icon}</span>
                  <span className="text-base">{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;