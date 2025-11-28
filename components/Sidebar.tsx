import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  FileText, 
  Factory, 
  Users, 
  Settings, 
  BarChart3,
  LogOut,
  Package,
  UserCircle2,
  ShieldCheck,
  HardHat,
  ClipboardList,
  ChevronUp,
  Crown
} from 'lucide-react';
import { UserRole, User } from '../types';
import { setUserContext } from '../services/apiService';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  userRole: UserRole;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, currentUser, onSwitchUser, allUsers, onLogout }) => {
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  
  // Define all possible items
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
    { id: 'work-orders', label: 'Work Orders', icon: Wrench, roles: ['Admin', 'Head Technician', 'Technician'] },
    { id: 'requests', label: 'Requests', icon: FileText, roles: ['Admin', 'Head Technician', 'Technician'] },
    // { id: 'assets', label: 'Assets & Hierarchy', icon: Factory, roles: ['Admin', 'Technician'] },
    { id: 'inventory', label: 'Inventory & Parts', icon: Package, roles: ['Admin', 'Head Technician', 'Technician'] },
    // { id: 'analytics', label: 'Analytics & OEE', icon: BarChart3, roles: ['Admin'] },
    { id: 'team', label: 'Team & Shifts', icon: Users, roles: ['Admin', 'Head Technician'] },
    // { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
  ];

  const filteredItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-stone-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-20 transition-all duration-300">
      <div className="p-6 border-b border-stone-700 flex items-center space-x-3">
        <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
          <Factory size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">Eureka CMMS</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-700">
        {/* Role Switcher */}
        <div className="relative mb-2">
          <button
            onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-stone-300 hover:bg-stone-800 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <UserCircle2 size={20} />
              <span className="font-medium text-sm">Role: {currentUser.userRole}</span>
            </div>
            <ChevronUp size={16} className={`transition-transform ${isRoleSwitcherOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isRoleSwitcherOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-stone-800 rounded-xl border border-stone-700 overflow-hidden shadow-xl">
              <div className="p-2 bg-stone-800/80 border-b border-stone-700 text-xs font-bold text-stone-400 uppercase px-3">
                Switch Role
              </div>
              <div className="p-1">
                {allUsers.map((u) => (
                  <button
                    key={u.userRole}
                    onClick={() => { 
                      onSwitchUser(u); 
                      setUserContext(u.userRole, u.name);
                      setIsRoleSwitcherOpen(false); 
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${currentUser.userRole === u.userRole ? 'bg-teal-600 text-white' : 'hover:bg-stone-700 text-stone-300'}`}
                  >
                    <div className={`p-2 rounded-full ${u.userRole === 'Admin' ? 'bg-purple-500/20 text-purple-400' : u.userRole === 'Head Technician' ? 'bg-amber-500/20 text-amber-400' : u.userRole === 'Technician' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {u.userRole === 'Admin' ? <ShieldCheck size={14} /> : u.userRole === 'Head Technician' ? <Crown size={14} /> : u.userRole === 'Technician' ? <HardHat size={14} /> : <ClipboardList size={14} />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{u.userRole}</div>
                      <div className="text-xs opacity-70">{u.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button onClick={onLogout} className="flex items-center space-x-3 text-stone-400 hover:text-red-400 hover:bg-stone-800 w-full px-4 py-3 rounded-xl transition-all duration-200">
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
        <div className="mt-4 px-4 text-xs text-stone-500 text-center">
          v2.5.0 • Tenant: Acme Corp
        </div>
      </div>
    </div>
  );
};

export default Sidebar;