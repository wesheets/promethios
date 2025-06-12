import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import logger from '../utils/debugLogger';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  loginWithEmail: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  logger.componentMount('AuthProvider');

  useEffect(() => {
    logger.debug('Auth', 'Setting up auth state listener');
    
    // Set up auth state listener with optimizations
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      logger.authStateChange(user ? 'authenticated' : 'unauthenticated', user);
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      logger.authError('Auth state change error', error);
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      logger.debug('Auth', 'Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    logger.debug('Auth', 'Attempting email login', { email });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      logger.info('Auth', 'Email login successful');
    } catch (error) {
      logger.authError('Email login failed', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    logger.debug('Auth', 'Attempting Google login');
    try {
      await signInWithPopup(auth, googleProvider);
      logger.info('Auth', 'Google login successful');
    } catch (error) {
      logger.authError('Google login failed', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    logger.debug('Auth', 'Attempting signup', { email });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      logger.info('Auth', 'Signup successful');
    } catch (error) {
      logger.authError('Signup failed', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    logger.debug('Auth', 'Attempting password reset', { email });
    try {
      await sendPasswordResetEmail(auth, email);
      logger.info('Auth', 'Password reset email sent');
    } catch (error) {
      logger.authError('Password reset failed', error);
      throw error;
    }
  };

  const logout = async () => {
    logger.debug('Auth', 'Attempting logout');
    try {
      await signOut(auth);
      logger.info('Auth', 'Logout successful');
    } catch (error) {
      logger.authError('Logout failed', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    loginWithEmail,
    loginWithGoogle,
    signup,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

