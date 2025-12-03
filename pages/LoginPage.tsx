import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, LogIn, ArrowLeft, Wrench, Chrome } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const mockUsers = {
    'admin': { password: 'admin123', role: 'Admin' as const },
    'headtech': { password: 'headtech123', role: 'Head Technician' as const },
    'tech': { password: 'tech123', role: 'Technician' as const },
    'user': { password: 'user123', role: 'Requester' as const },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = mockUsers[username.toLowerCase() as keyof typeof mockUsers];
    
    if (!user) {
      setError(t('login.invalidCredentials'));
      return;
    }

    if (user.password !== password) {
      setError(t('login.invalidCredentials'));
      return;
    }

    sessionStorage.setItem('loggedInUser', JSON.stringify({ username, role: user.role }));
    
    navigate('/dashboard');
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-emerald-100/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-tr from-amber-100/30 to-orange-50/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md border-b border-stone-200/60 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-stone-500 hover:text-teal-600 transition-all duration-200"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium hidden sm:inline">{t('common.backToHome')}</span>
          </Link>
          <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
              <Wrench size={18} className="text-white" />
            </div>
            <span className="font-semibold text-stone-900">Eureka <span className="text-teal-600">CMMS</span></span>
          </div>
        </div>
        <LanguageSwitcher variant="minimal" />
      </header>

      {/* Login Form */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-serif text-4xl mx-auto mb-5 shadow-xl shadow-teal-600/25">
              E
            </div>
            <h1 className="font-serif text-4xl text-stone-900 mb-2">Eureka CMMS</h1>
            <p className="text-stone-600">Maintenance Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200/60 p-8">
            <h2 className="font-serif text-2xl text-stone-900 mb-6 text-center">{t('login.welcomeBack')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-stone-700 mb-2">{t('login.username')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-stone-400" size={18} />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('login.enterUsername')}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">{t('login.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-stone-400" size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.enterPassword')}
                    className="w-full pl-10 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 transition-colors duration-200"
                    aria-label="Toggle password visibility"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-teal-600/25 transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/30"
              >
                <LogIn size={18} />
                {t('login.signIn')}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-stone-500">or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-stone-50 text-stone-700 font-semibold py-3.5 rounded-xl border border-stone-200 shadow-sm transition-all duration-200 flex items-center justify-center gap-3 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-stone-300 border-t-teal-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Sign in with Google
              </button>
            </form>

            {/* Demo Credentials - Hidden but kept for reference
            <div className="mt-6 pt-6 border-t border-stone-100">
              <p className="text-xs text-stone-500 text-center mb-3 font-semibold uppercase tracking-wide">{t('login.demoCredentials')}</p>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="bg-stone-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-stone-100">
                  <span className="font-medium text-stone-700">{t('login.admin')}:</span>
                  <span className="font-mono text-teal-600">admin / admin123</span>
                </div>
                <div className="bg-amber-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-amber-100">
                  <span className="font-medium text-amber-700">{t('login.headTechnician')}:</span>
                  <span className="font-mono text-amber-600">headtech / headtech123</span>
                </div>
                <div className="bg-stone-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-stone-100">
                  <span className="font-medium text-stone-700">{t('login.technician')}:</span>
                  <span className="font-mono text-teal-600">tech / tech123</span>
                </div>
                <div className="bg-stone-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-stone-100">
                  <span className="font-medium text-stone-700">{t('login.requester')}:</span>
                  <span className="font-mono text-teal-600">user / user123</span>
                </div>
              </div>
            </div>
            */}
          </div>

          {/* Footer */}
          <p className="text-center text-stone-500 text-sm mt-8">
            {t('login.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
