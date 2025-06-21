import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

// Simple demo authentication hook
// In production, this would integrate with your real auth system
export const useAuth = (): AuthState & {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
} => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    isLoading: true
  });

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = () => {
      const storedUser = localStorage.getItem('promethios_demo_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setAuthState({
            user,
            isLoggedIn: true,
            isLoading: false
          });
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('promethios_demo_user');
          setAuthState({
            user: null,
            isLoggedIn: false,
            isLoading: false
          });
        }
      } else {
        setAuthState({
          user: null,
          isLoggedIn: false,
          isLoading: false
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo login - in production, this would call your auth API
    // For demo purposes, accept any email/password combination
    if (email && password) {
      const demoUser: User = {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: email.split('@')[0] // Use email prefix as name
      };

      localStorage.setItem('promethios_demo_user', JSON.stringify(demoUser));
      setAuthState({
        user: demoUser,
        isLoggedIn: true,
        isLoading: false
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('promethios_demo_user');
    setAuthState({
      user: null,
      isLoggedIn: false,
      isLoading: false
    });
  };

  return {
    ...authState,
    login,
    logout
  };
};

