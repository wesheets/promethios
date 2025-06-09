import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Define the shape of our context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  loginWithGoogle: () => Promise<void>; // Alias for compatibility
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  // Enhanced Google Sign In with fallback to redirect method
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Log environment information for debugging
      console.log('🔍 Attempting Google Sign In');
      console.log('🌐 Current domain:', window.location.hostname);
      console.log('🌐 Current origin:', window.location.origin);
      
      const provider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configure provider settings
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      try {
        // First try popup method
        console.log('🔍 Attempting signInWithPopup method');
        const result = await signInWithPopup(auth, provider);
        
        if (result.user) {
          console.log('✅ User signed in successfully with popup:', result.user.email);
        }
      } catch (popupError: any) {
        console.error('❌ Popup sign in error:', popupError);
        
        // If popup fails, try redirect method
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.code === 'auth/api-key-not-valid') {
          
          console.log('🔍 Popup failed, attempting signInWithRedirect method');
          
          try {
            // Try redirect method as fallback
            await signInWithRedirect(auth, provider);
            // Note: This won't return as the page will redirect
          } catch (redirectError: any) {
            console.error('❌ Redirect sign in error:', redirectError);
            throw redirectError;
          }
        } else {
          // For other errors, rethrow
          throw popupError;
        }
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        
        // Enhanced error handling with more specific messages
        switch (authError.code) {
          case 'auth/api-key-not-valid':
            errorMessage = 'Invalid API key. Please check Firebase configuration.';
            console.error('🔑 API Key Error Details:', {
              'API Key Length': auth.app.options.apiKey?.length || 'Unknown',
              'Auth Domain': auth.app.options.authDomain || 'Unknown',
              'Project ID': auth.app.options.projectId || 'Unknown'
            });
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = 'Sign in was cancelled';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Sign in popup was blocked by the browser';
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign in popup was closed before completing the sign in';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = 'This domain is not authorized for OAuth operations';
            console.error('🔒 Domain Authorization Error:', {
              'Current Domain': window.location.hostname,
              'Auth Domain': auth.app.options.authDomain
            });
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
  
  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('✅ User signed in successfully with redirect:', result.user.email);
        }
      } catch (error) {
        console.error('❌ Redirect result error:', error);
        
        if (error instanceof Error) {
          const authError = error as AuthError;
          let errorMessage = 'Failed to complete sign in';
          
          if (authError.code === 'auth/api-key-not-valid') {
            errorMessage = 'Invalid API key. Please check Firebase configuration.';
          }
          
          setError(errorMessage);
        }
      }
    };
    
    checkRedirectResult();
  }, []);
  
  // Alias for compatibility with existing code
  const loginWithGoogle = signInWithGoogle;
  
  // Email and password sign in
  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        console.log('User signed in with email successfully:', result.user.email);
      }
    } catch (error) {
      console.error('Email sign in error:', error);
      
      let errorMessage = 'Failed to sign in';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        
        switch (authError.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
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
  
  // Sign up with email and password
  const signup = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        console.log('User signed up successfully:', result.user.email);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      
      let errorMessage = 'Failed to create account';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        
        switch (authError.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support';
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
  
  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        
        switch (authError.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please try again later';
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
    loginWithGoogle, // Alias for compatibility
    loginWithEmail,
    signup,
    resetPassword,
    logout,
    clearError
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
