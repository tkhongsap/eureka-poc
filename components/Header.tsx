import React, { useState, useEffect } from 'react';
import { Bell, Search, Globe, ChevronDown, UserCircle, Sun, Moon, Menu } from 'lucide-react';
import { User, Notification } from '../types';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../lib/i18n';

interface HeaderProps {
  user: User;
  notifications?: Notification[];
  onNotificationsUpdate?: () => void;
  onNavigateToWorkOrder?: (workOrderId: string) => void;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, notifications = [], onNotificationsUpdate = () => { }, onNavigateToWorkOrder, onToggleSidebar }) => {
  const { t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 left-0 md:left-64 z-[9]">
      {/* Mobile Menu Button */}
      <button
        onClick={onToggleSidebar}
        className="p-2 md:hidden bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all duration-200"
        title="Toggle Menu"
      >
        <Menu size={20} className="text-stone-600" />
      </button>
      
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md mx-4 md:mx-0 md:w-96 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder={t('common.search') + '...'}
          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm md:text-base transition-all duration-200"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-1 md:space-x-3">
        {/* Site Switcher */}
        <div className="hidden lg:flex items-center space-x-2 text-base font-medium text-stone-600 hover:text-teal-600 cursor-pointer transition-all duration-200 bg-stone-50 px-4 py-2 rounded-xl border border-stone-200 hover:border-stone-300">
          <Globe size={18} />
          <span>Plant A - Assembly</span>
          <ChevronDown size={16} />
        </div>

        {/* Language Toggle */}
        <div className="hidden sm:block">
          <LanguageSwitcher variant="minimal" />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all duration-200"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Moon size={16} className="text-indigo-400" />
          ) : (
            <Sun size={16} className="text-amber-500" />
          )}
        </button>

        {/* Notifications */}
        <NotificationCenter
          notifications={notifications}
          onNotificationsUpdate={onNotificationsUpdate}
          onNavigateToWorkOrder={onNavigateToWorkOrder}
        />

        {/* User Profile */}
        <div className="flex items-center space-x-2 md:space-x-3 pl-2 md:pl-4 border-l border-stone-200/60">
          <div className="text-right hidden lg:block">
            <div className="text-base font-semibold text-stone-800">{user.name}</div>
            <div className="text-sm text-stone-500">{user.role}</div>
          </div>
          <div className="h-8 w-8 md:h-10 md:w-10 bg-stone-200 rounded-xl flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserCircle size={32} className="text-stone-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
