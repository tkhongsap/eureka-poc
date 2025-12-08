import React from 'react';
import { Bell, Search, Globe, ChevronDown, UserCircle } from 'lucide-react';
import { User, Notification } from '../types';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../lib/i18n';

interface HeaderProps {
  user: User;
  notifications?: Notification[];
  onNotificationsUpdate?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, notifications = [], onNotificationsUpdate = () => {} }) => {
  const { t } = useLanguage();
  
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-[9]">
      {/* Search */}
      <div className="flex items-center w-96 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder={t('common.search') + '...'}
          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-all duration-200"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Language Switcher */}
        <LanguageSwitcher variant="minimal" />

        {/* Site Switcher */}
        <div className="hidden md:flex items-center space-x-2 text-sm font-medium text-stone-600 hover:text-teal-600 cursor-pointer transition-all duration-200 bg-stone-50 px-4 py-2 rounded-xl border border-stone-200 hover:border-stone-300">
          <Globe size={16} />
          <span>Plant A - Assembly</span>
          <ChevronDown size={14} />
        </div>

        {/* Notifications */}
        <NotificationCenter 
          notifications={notifications}
          onNotificationsUpdate={onNotificationsUpdate}
        />

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-4 border-l border-stone-200/60">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-stone-800">{user.name}</div>
            <div className="text-xs text-stone-500">{user.role}</div>
          </div>
          <div className="h-10 w-10 bg-stone-200 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
            <UserCircle size={40} className="text-stone-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
