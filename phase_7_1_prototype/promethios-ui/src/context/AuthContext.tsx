// Fixed Authentication Context with comprehensive error handling
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Google sign in
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configure provider settings
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        console.log('User signed in successfully:', result.user.email);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        
        switch (authError.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign in was cancelled';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked by browser. Please allow popups and try again';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Google sign in is not enabled. Please contact support';
            break;
          default:
            errorMessage = authError.message || 'An unexpected error occurred';
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to sign out';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auth state listener
  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        if (mounted) {
          setUser(user);
          setLoading(false);
          
          if (user) {
            console.log('User authenticated:', user.email);
          } else {
            console.log('User not authenticated');
          }
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        
        if (mounted) {
          setError('Authentication error occurred');
          setLoading(false);
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

