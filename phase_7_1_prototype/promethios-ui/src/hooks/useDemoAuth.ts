import { useState, useEffect } from 'react';

// Demo user for testing without Firebase
const DEMO_USER = {
  uid: 'demo-user-123',
  email: 'demo@promethios.ai',
  displayName: 'Demo User',
  emailVerified: true,
};

/**
 * Demo authentication hook for testing without Firebase
 * This provides a consistent user ID for storage testing
 */
export const useDemoAuth = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth loading
    const timer = setTimeout(() => {
      setCurrentUser(DEMO_USER);
      setLoading(false);
      console.log('Demo auth: User logged in as', DEMO_USER.email);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const loginWithDemo = async () => {
    setCurrentUser(DEMO_USER);
    console.log('Demo login successful');
  };

  const logout = async () => {
    setCurrentUser(null);
    console.log('Demo logout successful');
  };

  return {
    currentUser,
    loading,
    loginWithDemo,
    logout,
  };
};

