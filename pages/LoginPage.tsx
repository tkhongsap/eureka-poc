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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-brand-600 transition"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 text-white p-1.5 rounded-lg">
              <Wrench size={20} />
            </div>
            <span className="font-bold text-slate-800">Eureka <span className="text-brand-600">CMMS</span></span>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-xl">
              E
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Eureka CMMS</h1>
            <p className="text-slate-600">Maintenance Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Welcome Back</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Toggle password visibility"
                    title={showPassword ? 'Hide password' : 'Show password'}
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
                Sign In
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center mb-3 font-semibold">Demo Credentials:</p>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="bg-slate-50 px-3 py-2 rounded-lg flex justify-between">
                  <span className="font-medium">Admin:</span>
                  <span className="font-mono">admin / admin123</span>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-lg flex justify-between">
                  <span className="font-medium">Technician:</span>
                  <span className="font-mono">tech / tech123</span>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-lg flex justify-between">
                  <span className="font-medium">Requester:</span>
                  <span className="font-mono">user / user123</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-6">
            © 2025 Eureka CMMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
