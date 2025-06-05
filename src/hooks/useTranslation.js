import { useState, useCallback } from 'react';
import { translations } from '../i18n/translations';

const useTranslation = (initialLang = 'ko') => {
  const [currentLanguage, setCurrentLanguage] = useState(initialLang);

  const getText = useCallback((key, params = {}) => {
    let text = translations[currentLanguage]?.[key] || key;
    for (const param in params) {
      text = text.replace(`{${param}}`, params[param]);
    }
    return text;
  }, [currentLanguage]);

  return { currentLanguage, setCurrentLanguage, getText, translations };
};

export default useTranslation;