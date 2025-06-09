import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  loginWithGoogle: () => Promise<void>; // Alias for signInWithGoogle for compatibility
  loginWithEmail: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>; // Alias for loginWithEmail
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component that wraps your app and makes auth object available
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = () => setError(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result on initial load
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in error:", error);
        handleAuthError(error);
      });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Helper function to handle authentication errors
  const handleAuthError = (error: any) => {
    console.error("Authentication error:", error);
    
    // Map Firebase error codes to user-friendly messages
    const errorMap: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address format.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Sign-in popup was blocked by your browser.',
      'auth/cancelled-popup-request': 'The sign-in process was cancelled.',
      'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
      'auth/network-request-failed': 'A network error occurred. Please check your connection.',
      'auth/timeout': 'The operation has timed out.',
      'auth/api-key-not-valid': 'Firebase API key is invalid. Please check your configuration.',
    };

    const errorCode = error.code || 'unknown-error';
    const errorMessage = errorMap[errorCode] || error.message || 'An unknown error occurred during authentication.';
    
    // Add detailed logging for API key issues
    if (error.code === 'auth/api-key-not-valid') {
      console.error('API Key Invalid Error Details:', {
        errorCode: error.code,
        errorMessage: error.message,
        currentDomain: window.location.hostname,
        currentOrigin: window.location.origin
      });
    }
    
    setError(errorMessage);
    setLoading(false);
  };

  // Sign in with Google using popup
  const signInWithGoogle = async (): Promise<void> => {
    setLoading(true);
    clearError();
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Try popup first
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.log("Popup sign-in failed, trying redirect:", popupError);
        
        // If popup fails (common on mobile), fall back to redirect
        if (
          popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.code === 'auth/api-key-not-valid'
        ) {
          await signInWithRedirect(auth, provider);
          // Note: Redirect will navigate away, so we won't reach the code below
          // The redirect result will be handled in the useEffect
        } else {
          // For other errors, propagate them
          throw popupError;
        }
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  // Alias for signInWithGoogle for compatibility with existing code
  const loginWithGoogle = signInWithGoogle;

  // Sign in with email and password
  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    clearError();
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  // Alias for loginWithEmail for compatibility
  const login = loginWithEmail;

  // Sign up with email and password
  const signup = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    clearError();
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    setLoading(true);
    clearError();
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async (): Promise<void> => {
    setLoading(true);
    clearError();
    
    try {
      await signOut(auth);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    loginWithGoogle, // Alias for compatibility
    loginWithEmail,
    login, // Alias for compatibility
    signup,
    resetPassword,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
