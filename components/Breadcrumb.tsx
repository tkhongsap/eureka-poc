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
    <nav className="flex items-center space-x-1 text-xs md:text-sm text-stone-500 px-3 md:px-6 py-2 md:py-3 bg-white/50 dark:bg-transparent border-b border-stone-100 dark:border-stone-800 overflow-x-auto scrollbar-hide">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isClickable = !isLast;

        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight size={12} className="text-stone-400 dark:text-stone-500 flex-shrink-0 md:w-3.5 md:h-3.5" />
            )}
            <button
              onClick={() => isClickable && onNavigate(item.id)}
              disabled={!isClickable}
              className={`
                flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-1 rounded-md transition-colors flex-shrink-0
                ${isClickable 
                  ? 'hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer' 
                  : 'text-stone-800 dark:text-stone-200 font-medium cursor-default'
                }
              `}
            >
              {item.icon}
              <span className="truncate max-w-[100px] md:max-w-[150px] whitespace-nowrap">{item.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
