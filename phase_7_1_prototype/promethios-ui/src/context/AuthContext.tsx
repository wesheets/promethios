import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  supabase, 
  signIn, 
  signUp, 
  signOut, 
  resetPassword, 
  getCurrentUser, 
  onAuthStateChange 
} from '../supabase/config';

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>; // Alias for loginWithEmail
  signup: (email: string, password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  logout: () => Promise<any>;
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
    // Get current user on mount
    const fetchUser = async () => {
      try {
        const { user, error } = await getCurrentUser();
        if (error) throw error;
        setUser(user);
      } catch (error: any) {
        console.error('Error fetching user:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: authListener } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Helper function to handle authentication errors
  const handleAuthError = (error: any) => {
    console.error("Authentication error:", error);
    
    // Map Supabase error messages to user-friendly messages
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password.',
      'Email not confirmed': 'Please confirm your email address.',
      'User already registered': 'An account with this email already exists.',
      'Password should be at least 6 characters': 'Password is too weak. Use at least 6 characters.',
    };

    const errorMessage = errorMap[error.message] || error.message || 'An unknown error occurred during authentication.';
    
    setError(errorMessage);
    setLoading(false);
  };

  // Sign in with email and password
  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    clearError();
    
    try {
      const { success, data, error } = await signIn(email, password);
      if (!success) throw error;
      return { success, data };
    } catch (error: any) {
      handleAuthError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Alias for loginWithEmail for compatibility
  const login = loginWithEmail;

  // Sign up with email and password
  const signup = async (email: string, password: string) => {
    setLoading(true);
    clearError();
    
    try {
      const { success, data, error } = await signUp(email, password);
      if (!success) throw error;
      return { success, data };
    } catch (error: any) {
      handleAuthError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPasswordFunc = async (email: string) => {
    setLoading(true);
    clearError();
    
    try {
      const { success, data, error } = await resetPassword(email);
      if (!success) throw error;
      return { success, data };
    } catch (error: any) {
      handleAuthError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setLoading(true);
    clearError();
    
    try {
      const { success, error } = await signOut();
      if (!success) throw error;
      return { success };
    } catch (error: any) {
      handleAuthError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    loginWithEmail,
    login, // Alias for compatibility
    signup,
    resetPassword: resetPasswordFunc,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
