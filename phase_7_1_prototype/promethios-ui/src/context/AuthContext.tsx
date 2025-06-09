import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  useEffect(() => {
    // Check for redirect result on app load
    const checkRedirectResult = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google Auth redirect successful:', result.user);
          // User will be set by onAuthStateChanged
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    checkRedirectResult();

    // Set up auth state listener with optimizations
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error: any) {
      // If popup fails due to CORS or other issues, try redirect
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.message?.includes('cross-origin') ||
          error.message?.includes('CORS')) {
        
        console.log('Popup failed, trying redirect method...');
        
        // Import redirect methods dynamically
        const { signInWithRedirect, getRedirectResult } = await import('firebase/auth');
        
        // Check if we're returning from a redirect
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult) {
          return redirectResult;
        }
        
        // Start redirect flow
        await signInWithRedirect(auth, googleProvider);
        return; // Redirect will handle the rest
      }
      
      // Re-throw other errors
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    loginWithEmail,
    loginWithGoogle,
    signup,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

