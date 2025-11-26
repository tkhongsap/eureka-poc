import React from 'react';
import { Bell, Search, Globe, ChevronDown, UserCircle } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">
      {/* Search */}
      <div className="flex items-center w-96 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search assets, WO #, or tags..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        {/* Site Switcher */}
        <div className="hidden md:flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-brand-600 cursor-pointer transition-colors bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
          <Globe size={16} />
          <span>Plant A - Assembly</span>
          <ChevronDown size={14} />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-slate-800">{user.name}</div>
            <div className="text-xs text-slate-500">{user.role}</div>
          </div>
          <div className="h-10 w-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
