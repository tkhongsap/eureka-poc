import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wrench,
  FileText,
  ClipboardList,
  Factory,
  Users,
  Settings,
  Settings2,
  UserCog,
  BarChart3,
  LogOut,
  Package,
  ChevronLeft,
  ChevronRight,
  Building2,
  HelpCircle,
  Calendar,
  Shield,
  Globe
} from 'lucide-react';
import { UserRole, User } from '../types';
import { useLanguage } from '../lib/i18n';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  userRole: UserRole;
  currentUser: User;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  userRole,
  currentUser,
  onLogout,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggle
}) => {
  const { t, language } = useLanguage();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalCollapsed ?? internalCollapsed;
  const toggleCollapse = externalToggle ?? (() => setInternalCollapsed(!internalCollapsed));

  // Define all possible items with translation keys
  const allMenuItems = [
    { id: 'dashboard', labelKey: 'nav.dashboard' as const, icon: LayoutDashboard, roles: ['Admin'] },
    { id: 'work-orders', labelKey: 'nav.workOrders' as const, icon: Wrench, roles: ['Admin', 'Head Technician', 'Technician'] },
    { id: 'my-work-orders', labelKey: 'nav.myWorkOrders' as const, icon: ClipboardList, roles: ['Requester'] },
    { id: 'requests', labelKey: 'nav.requests' as const, icon: FileText, roles: ['Admin', 'Head Technician', 'Technician', 'Requester'] },
    { id: 'assets', labelKey: 'nav.assets' as const, icon: Building2, roles: ['Admin', 'Head Technician', 'Technician'] },
    { id: 'inventory', labelKey: 'inventory.title' as const, icon: Package, roles: ['Admin', 'Head Technician', 'Technician'] },
    { id: 'preventive-maintenance', labelKey: 'nav.preventiveMaintenance' as const, icon: Calendar, roles: ['Admin', 'Head Technician'] },
    { id: 'team', labelKey: 'team.title' as const, icon: Users, roles: ['Admin', 'Head Technician'] },
    { id: 'eoc', labelKey: 'nav.eoc' as const, icon: Globe, roles: ['Admin'] },
    { id: 'spare-part-center', labelKey: 'nav.sparePartCenter' as const, icon: Package, roles: ['Admin'] },
    { id: 'safety', labelKey: 'nav.safety' as const, icon: Shield, roles: ['Admin', 'Head Technician'] },
    { id: 'reports', labelKey: 'nav.reports' as const, icon: BarChart3, roles: ['Admin'] },
    { id: 'user-management', labelKey: 'nav.userManagement' as const, icon: UserCog, roles: ['Admin'] },
  ];

  const filteredItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Overlay - only show when sidebar is expanded on mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={toggleCollapse}
        />
      )}
      
      <div className={`${
        isCollapsed 
          ? 'w-20 md:w-20' 
          : 'w-64 md:w-64'
      } bg-stone-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl transition-all duration-300 ${
        isCollapsed 
          ? '-translate-x-full md:translate-x-0 z-30' 
          : 'translate-x-0 z-30'
      }`}>
      {/* Header */}
      <div className={`p-4 border-b border-stone-700 ${isCollapsed ? 'flex flex-col items-center gap-3' : 'flex items-center justify-between'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} overflow-hidden`}>
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20 flex-shrink-0">
            <Factory size={20} className="text-white" />
          </div>
          {!isCollapsed && <span className="text-xl font-bold tracking-tight whitespace-nowrap">Eureka CMMS</span>}
        </div>
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={`w-7 h-7 bg-stone-800 hover:bg-stone-700 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0`}
          title={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              title={isCollapsed ? t(item.labelKey) : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className={`font-medium ${language === 'en' && item.id === 'preventive-maintenance' ? 'text-sm' : 'text-base'}`}>
                  {t(item.labelKey)}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-700 space-y-1">
        {/* Help Button */}
        <button
          onClick={() => onChangeView('help')}
          title={isCollapsed ? t('nav.help') : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${
            currentView === 'help'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-stone-400 hover:bg-stone-800 hover:text-white'
          }`}
        >
          <HelpCircle size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-base">{t('nav.help')}</span>}
        </button>
        {/* Settings Button */}
        <button
          onClick={() => onChangeView('settings')}
          title={isCollapsed ? t('nav.settings') : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${
            currentView === 'settings'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-stone-400 hover:bg-stone-800 hover:text-white'
          }`}
        >
          <Settings2 size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-base">{t('nav.settings')}</span>}
        </button>
        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          title={isCollapsed ? t('nav.logout') : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} text-stone-400 hover:text-red-400 hover:bg-stone-800 w-full px-4 py-3 rounded-xl transition-all duration-200`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-base">{t('nav.logout')}</span>}
        </button>
        {!isCollapsed && (
          <div className="mt-4 px-4 text-xs text-stone-500 text-center">
            {t('sidebar.version')} • {t('sidebar.tenant')}: Acme Corp
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
