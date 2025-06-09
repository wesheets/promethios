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
    // Check for redirect result on app load with timeout
    const checkRedirectResult = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        
        // Add timeout to prevent hanging
        const result = await Promise.race([
          getRedirectResult(auth),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redirect check timeout')), 5000))
        ]);
        
        if (result) {
          console.log('Google Auth redirect successful:', result.user);
          // User will be set by onAuthStateChanged
        }
      } catch (error) {
        console.log('No redirect result or timeout:', error);
        // Don't throw error, just continue with normal flow
      }
    };

    checkRedirectResult();

    // Set up auth state listener with optimizations
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
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
      console.log('Starting Google Auth...');
      setLoading(true);
      
      // For production environments, use redirect flow with timeout
      if (window.location.hostname !== 'localhost') {
        console.log('Production environment detected, using redirect flow...');
        
        // Import redirect methods
        const { signInWithRedirect, getRedirectResult } = await import('firebase/auth');
        
        // Check if we're returning from a redirect first
        try {
          const redirectResult = await Promise.race([
            getRedirectResult(auth),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Redirect result timeout')), 5000))
          ]);
          
          if (redirectResult) {
            console.log('Redirect result found:', redirectResult.user);
            setLoading(false);
            return redirectResult;
          }
        } catch (redirectError) {
          console.log('No redirect result or timeout:', redirectError);
        }
        
        // Start redirect flow with timeout protection
        console.log('Starting redirect to Google...');
        try {
          await Promise.race([
            signInWithRedirect(auth, googleProvider),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Redirect timeout')), 10000))
          ]);
          // Don't set loading to false here as redirect will handle it
          return;
        } catch (redirectError) {
          console.error('Redirect failed:', redirectError);
          setLoading(false);
          throw new Error('Google sign-in redirect failed. Please try again.');
        }
      }
      
      // For localhost, try popup with timeout
      console.log('Local environment, trying popup...');
      const result = await Promise.race([
        signInWithPopup(auth, googleProvider),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Popup timeout')), 30000))
      ]);
      
      console.log('Popup successful:', result.user);
      setLoading(false);
      return result;
      
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      setLoading(false);
      
      // Handle specific error cases
      if (error.message?.includes('timeout')) {
        throw new Error('Google sign-in timed out. Please try again.');
      }
      
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in popup was blocked or closed. Please try again.');
      }
      
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Re-throw with user-friendly message
      throw new Error('Google sign-in failed. Please try again.');
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

