import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userEncoded = searchParams.get('user');
    
    if (userEncoded) {
      try {
        const userJson = atob(userEncoded);
        const userData = JSON.parse(userJson);
        
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
        console.error('Failed to parse user data:', e);
        navigate('/login?error=parse_error');
      }
    } else {
      navigate('/login?error=no_user');
    }
  }, [searchParams, navigate]);

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
