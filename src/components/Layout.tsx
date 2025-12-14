import React, { useState, ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Translations, Translation } from '../i18n/translations';

type Language = keyof Translations;
type TranslationKey = keyof Translation;

interface LayoutProps {
  children: ReactNode;
  title: string;
  showHomeButton?: boolean;
  currentLanguage: string;
  setCurrentLanguage: (lang: Language) => void;
  getText: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

/**
 * 모든 페이지에 공통적으로 적용되는 레이아웃 컴포넌트입니다.
 * Header와 Sidebar를 포함하며, 페이지 콘텐츠를 children으로 렌더링합니다.
 */
function Layout({ children, title, showHomeButton, currentLanguage, setCurrentLanguage, getText }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      <Header
        title={title}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        getText={getText}
        showHomeButton={showHomeButton}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} getText={getText} />
      {/* 메인 콘텐츠 영역: 고정된 헤더 높이를 고려하여 상단 패딩을 추가합니다. */}
      <main className="pt-[calc(48px+0.5rem)] sm:pt-[calc(56px+0.5rem)] w-full max-w-6xl flex flex-col items-center xs:p-0 px-2 py-4 sm:px-4">
        {children}
      </main>
    </div>
  );
}

export default Layout;