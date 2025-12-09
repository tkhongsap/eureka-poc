import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentView, onNavigate, userRole }) => {
  const { t } = useLanguage();

  // Map view IDs to their breadcrumb configuration
  const viewConfig: Record<string, { labelKey: string; parent?: string }> = {
    'dashboard': { labelKey: 'nav.dashboard' },
    'work-orders': { labelKey: 'nav.workOrders' },
    'my-work-orders': { labelKey: 'nav.myWorkOrders' },
    'requests': { labelKey: 'nav.requests' },
    'assets': { labelKey: 'nav.assets' },
    'inventory': { labelKey: 'inventory.title' },
    'team': { labelKey: 'team.title' },
    'reports': { labelKey: 'nav.reports' },
    'user-management': { labelKey: 'nav.userManagement' },
    'settings': { labelKey: 'nav.settings' },
    'help': { labelKey: 'nav.help' },
  };

  // Build breadcrumb path
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    
    // Home/Dashboard - based on role
    const homeView = userRole === 'Requester' ? 'requests' : 
                     userRole === 'Technician' || userRole === 'Head Technician' ? 'work-orders' : 
                     'dashboard';
    
    // Always add home first
    const homeLabel = userRole === 'Admin' ? t('nav.dashboard') : 
                      userRole === 'Requester' ? t('nav.requests') :
                      t('nav.workOrders');
    items.push({
      id: homeView,
      label: homeLabel,
      icon: <Home size={14} />,
    });

    // Add current page if different from home
    if (currentView !== homeView) {
      const config = viewConfig[currentView];
      if (config) {
        items.push({
          id: currentView,
          label: t(config.labelKey as any),
        });
      } else {
        // Fallback for unknown views
        items.push({
          id: currentView,
          label: currentView.charAt(0).toUpperCase() + currentView.slice(1).replace(/-/g, ' '),
        });
      }
    }

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm text-stone-500 px-6 py-3 bg-white/50 border-b border-stone-100">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isClickable = !isLast;

        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight size={14} className="text-stone-400 flex-shrink-0" />
            )}
            <button
              onClick={() => isClickable && onNavigate(item.id)}
              disabled={!isClickable}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors
                ${isClickable 
                  ? 'hover:bg-stone-100 hover:text-stone-700 cursor-pointer' 
                  : 'text-stone-800 font-medium cursor-default'
                }
              `}
            >
              {item.icon}
              <span className="truncate max-w-[150px]">{item.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
