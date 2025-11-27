import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-emerald-800' : 'text-red-800';
  const iconColor = type === 'success' ? 'text-emerald-600' : 'text-red-600';
  const Icon = type === 'success' ? CheckCircle2 : XCircle;

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
      <div className={`flex items-center gap-3 ${bgColor} ${textColor} px-4 py-3 rounded-xl border shadow-lg min-w-[300px] max-w-md`}>
        <Icon size={20} className={iconColor} />
        <span className="flex-1 font-medium text-sm">{message}</span>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
