import { useState } from 'react';
import { useI18n, Language, LANGUAGES } from '../../../infrastructure/i18n';
import { Icon } from './Icon';

/**
 * Language selector dropdown component
 */
export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        title={t.settings.selectLanguage}
      >
        <Icon name="flag" size="sm" />
        <span className="text-sm font-medium">{LANGUAGES[language].nativeName}</span>
        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size="xs" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                  language === lang
                    ? 'bg-gacha-purple text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>{LANGUAGES[lang].nativeName}</span>
                {language === lang && <Icon name="check" size="sm" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
