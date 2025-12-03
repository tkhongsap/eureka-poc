import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

const AuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to get user info');
        }
        
        const userData = await response.json();
        
        sessionStorage.setItem('loggedInUser', JSON.stringify({
          id: userData.id,
          username: userData.name,
          role: userData.user_role,
          email: userData.email,
          avatar_url: userData.avatar_url,
          name: userData.name,
        }));
        
        sessionStorage.setItem('authUser', JSON.stringify(userData));
        
        navigate('/dashboard');
      } catch (e) {
        console.error('Failed to fetch user data:', e);
        setError('Unable to complete sign-in. Please try again.');
        setTimeout(() => navigate('/login?error=auth_failed'), 3000);
      }
    };
    
    fetchUser();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-stone-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-stone-600">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
