import React from 'react';
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
  ShieldCheck,
  HardHat,
  ClipboardList,
  Crown
} from 'lucide-react';
import { UserRole, User } from '../types';
import { useLanguage } from '../lib/i18n';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  userRole: UserRole;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, currentUser, onLogout }) => {
  const { t } = useLanguage();
  
  // Define all possible items with translation keys
  const allMenuItems = [
    { id: 'dashboard', labelKey: 'nav.dashboard' as const, icon: LayoutDashboard, roles: ['Admin'] },
    { id: 'work-orders', labelKey: 'nav.workOrders' as const, icon: Wrench, roles: ['Admin', 'Head Technician', 'Technician'] },
    { id: 'requests', labelKey: 'nav.requests' as const, icon: FileText, roles: ['Admin', 'Head Technician', 'Technician'] },
    { id: 'inventory', labelKey: 'inventory.title' as const, icon: Package, roles: ['Admin', 'Head Technician', 'Technician'] },
    { id: 'team', labelKey: 'team.title' as const, icon: Users, roles: ['Admin', 'Head Technician'] },
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
              <span className="font-medium text-sm">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-700">
        {/* Role Display */}
        <div className="mb-2 px-4 py-3 rounded-xl bg-stone-800/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${currentUser.userRole === 'Admin' ? 'bg-purple-500/20 text-purple-400' : currentUser.userRole === 'Head Technician' ? 'bg-amber-500/20 text-amber-400' : currentUser.userRole === 'Technician' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {currentUser.userRole === 'Admin' ? <ShieldCheck size={16} /> : currentUser.userRole === 'Head Technician' ? <Crown size={16} /> : currentUser.userRole === 'Technician' ? <HardHat size={16} /> : <ClipboardList size={16} />}
            </div>
            <div>
              <div className="text-xs text-stone-500">{t('sidebar.role')}</div>
              <div className="font-medium text-sm text-stone-200">{
                currentUser.userRole === 'Admin' ? t('login.admin') :
                currentUser.userRole === 'Head Technician' ? t('login.headTechnician') :
                currentUser.userRole === 'Technician' ? t('login.technician') :
                t('login.requester')
              }</div>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button onClick={onLogout} className="flex items-center space-x-3 text-stone-400 hover:text-red-400 hover:bg-stone-800 w-full px-4 py-3 rounded-xl transition-all duration-200">
          <LogOut size={20} />
          <span className="font-medium text-sm">{t('nav.logout')}</span>
        </button>
        <div className="mt-4 px-4 text-xs text-stone-500 text-center">
          {t('sidebar.version')} • {t('sidebar.tenant')}: Acme Corp
        </div>
      </div>
    </div>
  );
};

export default Sidebar;