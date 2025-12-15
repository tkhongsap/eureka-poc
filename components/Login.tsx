import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface LoginProps {
  onLogin: (username: string, role: 'Admin' | 'Technician' | 'Requester') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Mock users for demo
  const mockUsers = {
    'admin': { password: 'admin123', role: 'Admin' as const },
    'tech': { password: 'tech123', role: 'Technician' as const },
    'user': { password: 'user123', role: 'Requester' as const },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock authentication
    const user = mockUsers[username.toLowerCase() as keyof typeof mockUsers];
    
    if (!user) {
      setError(t('login.invalidCredentials'));
      return;
    }

    if (user.password !== password) {
      setError(t('login.invalidCredentials'));
      return;
    }

    // Successful login
    onLogin(username, user.role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-blue-50 to-purple-50 flex items-center justify-center p-3 sm:p-4">
      {/* Language Switcher */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <LanguageSwitcher variant="minimal" />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4 shadow-xl">
            E
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">{t('login.title')}</h1>
          <p className="text-sm sm:text-base text-slate-600">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 text-center">{t('login.welcomeBack')}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('login.username')}</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.enterUsername')}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.enterPassword')}
                  className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <LogIn size={20} />
              {t('login.signIn')}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-2 sm:mb-3 font-semibold">{t('login.demoCredentials')}:</p>
            <div className="space-y-1.5 sm:space-y-2 text-xs text-slate-600">
              <div className="bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex justify-between items-center">
                <span className="font-medium">{t('login.admin')}:</span>
                <span className="font-mono text-xs">admin / admin123</span>
              </div>
              <div className="bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex justify-between items-center">
                <span className="font-medium">{t('login.technician')}:</span>
                <span className="font-mono text-xs">tech / tech123</span>
              </div>
              <div className="bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex justify-between items-center">
                <span className="font-medium">{t('login.requester')}:</span>
                <span className="font-mono text-xs">user / user123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs sm:text-sm mt-4 sm:mt-6 px-4">
          {t('login.copyright')}
        </p>
      </div>
    </div>
  );
};

export default Login;
