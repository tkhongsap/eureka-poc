import React from 'react';
import { Globe, Palette, Bell, User, Shield, Info } from 'lucide-react';
import { useLanguage, Language } from '../lib/i18n';

interface SettingsProps {
  // Future: add props for user preferences
}

const Settings: React.FC<SettingsProps> = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; flag: string; fullName: string }[] = [
    { code: 'en', label: 'EN', flag: '🇺🇸', fullName: 'English' },
    { code: 'th', label: 'TH', flag: '🇹🇭', fullName: 'ไทย' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">{t('nav.settings')}</h1>
        <p className="text-stone-500 mt-1">{t('settings.description')}</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Language Settings */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Globe className="text-teal-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.language')}</h2>
              <p className="text-sm text-stone-500">{t('settings.languageDescription')}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 min-w-[140px] ${
                    language === lang.code
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold">{lang.fullName}</div>
                    <div className="text-xs text-stone-500">{lang.label}</div>
                  </div>
                  {language === lang.code && (
                    <span className="ml-auto text-teal-500 text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings - Placeholder */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden opacity-60">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Bell className="text-orange-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.notifications')}</h2>
              <p className="text-sm text-stone-500">{t('settings.notificationsDescription')}</p>
            </div>
            <span className="ml-auto text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
              {t('common.comingSoon')}
            </span>
          </div>
          <div className="p-6 text-stone-400 text-sm">
            {t('settings.notificationsPlaceholder')}
          </div>
        </div>

        {/* Theme Settings - Placeholder */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden opacity-60">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Palette className="text-violet-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.theme')}</h2>
              <p className="text-sm text-stone-500">{t('settings.themeDescription')}</p>
            </div>
            <span className="ml-auto text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
              {t('common.comingSoon')}
            </span>
          </div>
          <div className="p-6 text-stone-400 text-sm">
            {t('settings.themePlaceholder')}
          </div>
        </div>

        {/* Profile Settings - Placeholder */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden opacity-60">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.profile')}</h2>
              <p className="text-sm text-stone-500">{t('settings.profileDescription')}</p>
            </div>
            <span className="ml-auto text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
              {t('common.comingSoon')}
            </span>
          </div>
          <div className="p-6 text-stone-400 text-sm">
            {t('settings.profilePlaceholder')}
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
              <Info className="text-stone-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.about')}</h2>
              <p className="text-sm text-stone-500">{t('settings.aboutDescription')}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-500">{t('settings.version')}:</span>
                <span className="ml-2 font-medium text-stone-900">1.0.0-beta</span>
              </div>
              <div>
                <span className="text-stone-500">{t('settings.tenant')}:</span>
                <span className="ml-2 font-medium text-stone-900">Acme Corp</span>
              </div>
              <div>
                <span className="text-stone-500">{t('settings.environment')}:</span>
                <span className="ml-2 font-medium text-stone-900">Development</span>
              </div>
              <div>
                <span className="text-stone-500">{t('settings.lastUpdated')}:</span>
                <span className="ml-2 font-medium text-stone-900">2025-12-09</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
