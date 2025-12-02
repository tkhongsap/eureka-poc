import React from 'react';
import { useLanguage, Language } from '../lib/i18n';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'minimal';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'toggle',
  className = '' 
}) => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'th', label: 'TH', flag: '🇹🇭' },
  ];

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors min-w-[70px] justify-center ${className}`}
        title={t('settings.language')}
      >
        <Globe size={16} />
        <span className="font-medium w-6 text-center">{language.toUpperCase()}</span>
      </button>
    );
  }

  if (variant === 'toggle') {
    return (
      <div className={`flex items-center gap-1 bg-stone-100 p-1 rounded-xl ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 min-w-[60px] justify-center ${
              language === lang.code
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative group ${className}`}>
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors min-w-[80px] justify-center"
      >
        <Globe size={18} />
        <span>{languages.find(l => l.code === language)?.flag}</span>
        <span>{language.toUpperCase()}</span>
      </button>
      
      <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-stone-50 transition-colors ${
              language === lang.code ? 'text-teal-600 font-medium' : 'text-stone-700'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-teal-500">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
