/**
 * Internationalization (i18n) System
 * 
 * Provides multi-language support for the application.
 * Currently supports English (en) and German (de).
 */

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { en } from './translations/en';
import { de } from './translations/de';

// Supported languages
export type Language = 'en' | 'de';

export const LANGUAGES: Record<Language, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  de: { name: 'German', nativeName: 'Deutsch' },
};

// Use a more flexible type for translations
export type Translations = typeof en;

// Translation map - use type assertion since de has same structure
const translations: Record<Language, Translations> = {
  en,
  de: de as unknown as Translations,
};

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'gacha-sim-language';

// Get initial language from storage or browser preference
function getInitialLanguage(): Language {
  // Check localStorage first
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'de')) {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  
  // Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'de') {
      return 'de';
    }
  }
  
  return 'en';
}

// Context type
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

// Create context
const I18nContext = createContext<I18nContextType | null>(null);

// Provider props
interface I18nProviderProps {
  children: ReactNode;
}

/**
 * I18n Provider component
 * Wraps the app to provide language context
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // localStorage not available
    }
  }, []);

  // Update document lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access translations
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * Hook to get just the translation object
 */
export function useTranslation(): Translations {
  const { t } = useI18n();
  return t;
}

// Re-export types and translations for direct access if needed
export { en, de };
