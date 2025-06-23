import React, { useState, useEffect } from 'react';

const AccordionItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 hover:bg-gray-50"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <svg
          className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="p-4 pt-0 text-gray-600">
          {children}
        </div>
      </div>
    </div>
  );
};

function AboutPage({ currentLanguage, setCurrentLanguage, getText }) {
  // isSidebarOpen 상태 및 Header/Sidebar 임포트는 Layout 컴포넌트에서 관리합니다.
  const [versionHistory, setVersionHistory] = useState('');

  useEffect(() => {
    // public 폴더의 README.md 파일을 가져옵니다.
    fetch('/README.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        return response.text();
      })
      .then(text => {
        // '###'로 시작하는 라인(버전 정보)만 추출하고, 접두사를 제거합니다.
        const historyLines = text
          .split('\n')
          .filter(line => line.startsWith('### '))
          .map(line => line.substring(4)) // '### ' 제거
          .join('\n');
        setVersionHistory(historyLines);
      })
      .catch(error => {
        console.error('Error fetching or parsing README.md:', error);
        setVersionHistory(getText('versionHistoryError'));
      });
  }, [getText]); // 언어 변경 시 에러 메시지 재번역을 위해 getText를 의존성 배열에 추가

  return (
    // Layout 컴포넌트가 이미 최상위 div와 메인 태그, 패딩을 제공하므로, 여기서는 콘텐츠만 렌더링합니다.
    <div className="w-full max-w-4xl flex flex-col items-center p-4">
        <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 서비스 소개 */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-purple-700 mb-3">{getText('aboutServiceTitle')}</h2>
            <p className="text-gray-600">
              {getText('aboutServiceDesc')}
            </p>
          </div>

          {/* 개발자 정보 */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-purple-700 mb-3">{getText('contactTitle')}</h2>
            <p className="text-gray-600">
              {getText('contactDesc')} <a href="mailto:tglkwon@gmail.com" className="text-blue-600 hover:underline">tglkwon@gmail.com</a>
            </p>
          </div>

          {/* 정책 및 약관 (아코디언) */}
          <AccordionItem title={getText('privacyPolicyTitle')}>
            <p>{getText('privacyPolicyDesc')}</p>
          </AccordionItem>

          <AccordionItem title={getText('termsOfServiceTitle')}>
            <p>{getText('termsOfServiceDesc')}</p>
          </AccordionItem>

          {/* 버전 정보 */}
          <AccordionItem title={getText('versionHistoryTitle')}>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {versionHistory || `${getText('loading')}...`}
            </pre>
          </AccordionItem>
        </div>
      </div>
  );
}

export default AboutPage;