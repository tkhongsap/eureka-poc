import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, LogIn, ArrowLeft, Wrench } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Mock users for demo
  const mockUsers = {
    'admin': { password: 'admin123', role: 'Admin' as const },
    'headtech': { password: 'headtech123', role: 'Head Technician' as const },
    'tech': { password: 'tech123', role: 'Technician' as const },
    'user': { password: 'user123', role: 'Requester' as const },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock authentication
    const user = mockUsers[username.toLowerCase() as keyof typeof mockUsers];
    
    if (!user) {
      setError('Invalid username or password');
      return;
    }

    if (user.password !== password) {
      setError('Invalid username or password');
      return;
    }

    // Store login info in sessionStorage for App to read
    sessionStorage.setItem('loggedInUser', JSON.stringify({ username, role: user.role }));
    
    // Navigate to dashboard
    navigate('/dashboard');
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
            <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
          </Link>
          <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
              <Wrench size={18} className="text-white" />
            </div>
            <span className="font-semibold text-stone-900">Eureka <span className="text-teal-600">CMMS</span></span>
          </div>
        </div>
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
            <h2 className="font-serif text-2xl text-stone-900 mb-6 text-center">Welcome Back</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-stone-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-stone-400" size={18} />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-stone-400" size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
                Sign In
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-stone-100">
              <p className="text-xs text-stone-500 text-center mb-3 font-semibold uppercase tracking-wide">Demo Credentials</p>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="bg-stone-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-stone-100">
                  <span className="font-medium text-stone-700">Admin:</span>
                  <span className="font-mono text-teal-600">admin / admin123</span>
                </div>
                <div className="bg-amber-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-amber-100">
                  <span className="font-medium text-amber-700">Head Technician:</span>
                  <span className="font-mono text-amber-600">headtech / headtech123</span>
                </div>
                <div className="bg-stone-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-stone-100">
                  <span className="font-medium text-stone-700">Technician:</span>
                  <span className="font-mono text-teal-600">tech / tech123</span>
                </div>
                <div className="bg-stone-50 px-4 py-2.5 rounded-xl flex justify-between items-center border border-stone-100">
                  <span className="font-medium text-stone-700">Requester:</span>
                  <span className="font-mono text-teal-600">user / user123</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-stone-500 text-sm mt-8">
            © 2025 Eureka CMMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
