import React from 'react';
import { Bell, Search, Globe, ChevronDown, UserCircle } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">
      {/* Search */}
      <div className="flex items-center w-96 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder="Search assets, WO #, or tags..."
          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-all duration-200"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        {/* Site Switcher */}
        <div className="hidden md:flex items-center space-x-2 text-sm font-medium text-stone-600 hover:text-teal-600 cursor-pointer transition-all duration-200 bg-stone-50 px-4 py-2 rounded-xl border border-stone-200 hover:border-stone-300">
          <Globe size={16} />
          <span>Plant A - Assembly</span>
          <ChevronDown size={14} />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 text-stone-500 hover:bg-stone-100 rounded-xl transition-all duration-200">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-4 border-l border-stone-200/60">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-stone-800">{user.name}</div>
            <div className="text-xs text-stone-500">{user.role}</div>
          </div>
          <div className="h-10 w-10 bg-stone-200 rounded-xl overflow-hidden border-2 border-white shadow-md">
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
