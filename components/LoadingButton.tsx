import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

interface LoadingButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  children,
  className = '',
  icon: Icon,
  type = 'button',
  variant = 'primary',
}) => {
  const baseStyles = 'px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
};

export default LoadingButton;
