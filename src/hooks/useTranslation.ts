import { useState, useCallback } from 'react';
import { translations, Translation, Translations } from '../i18n/translations';

type Language = keyof Translations;
type TranslationKey = keyof Translation;

const useTranslation = (initialLang: Language = 'ko') => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLang);

  const getText = useCallback((key: TranslationKey, params: Record<string, string | number> = {}) => {
    let text = translations[currentLanguage]?.[key] || key;
    for (const param in params) {
      text = text.replace(`{${param}}`, String(params[param]));
    }
    return text;
  }, [currentLanguage]);

  return { currentLanguage, setCurrentLanguage, getText, translations };
};

export default useTranslation;