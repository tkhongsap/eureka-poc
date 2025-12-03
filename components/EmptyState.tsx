import React from 'react';
import { LucideIcon, Package, AlertCircle, CheckCircle, FileX } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'default' | 'info' | 'success' | 'warning';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  type = 'default',
}) => {
  const Icon = icon || FileX;
  
  const typeStyles = {
    default: {
      bg: 'bg-stone-50',
      border: 'border-stone-200',
      icon: 'text-stone-400',
      text: 'text-stone-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-400',
      text: 'text-blue-600',
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-400',
      text: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-400',
      text: 'text-amber-600',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className={`${styles.bg} ${styles.border} border-2 border-dashed rounded-2xl p-8 max-w-md w-full text-center animate-fade-in`}>
        <div className={`mx-auto w-16 h-16 ${styles.bg} rounded-full flex items-center justify-center mb-4 border ${styles.border}`}>
          <Icon size={32} className={styles.icon} />
        </div>
        
        <h3 className="text-lg font-semibold text-stone-800 mb-2">
          {title}
        </h3>
        
        {description && (
          <p className={`text-sm ${styles.text} mb-4`}>
            {description}
          </p>
        )}
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md inline-flex items-center gap-2"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
