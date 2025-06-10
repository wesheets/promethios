import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import FirebaseErrorBoundary from '../components/common/FirebaseErrorBoundary';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<User>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear any authentication errors
  const clearError = () => setError(null);

  // Handle Firebase authentication state changes
  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('AuthContext: Auth state changed', user ? `User: ${user.uid}` : 'No user');
        setCurrentUser(user);
        setLoading(false);
      }, (error) => {
        console.error('AuthContext: Auth state change error', error);
        setError(`Authentication error: ${error.message}`);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => {
        console.log('AuthContext: Cleaning up auth state listener');
        unsubscribe();
      };
    } catch (err: any) {
      console.error('AuthContext: Error setting up auth state listener', err);
      setError(`Authentication setup error: ${err.message}`);
      setLoading(false);
      return () => {}; // Empty cleanup function
    }
  }, []);

  // Sign in with email and password
  const login = async (email: string, password: string): Promise<User> => {
    try {
      clearError();
      console.log('AuthContext: Attempting login');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: Login successful');
      return result.user;
    } catch (err: any) {
      console.error('AuthContext: Login error', err);
      setError(`Login failed: ${err.message}`);
      throw err;
    }
  };

  // Create a new user with email and password
  const signup = async (email: string, password: string): Promise<User> => {
    try {
      clearError();
      console.log('AuthContext: Attempting signup');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: Signup successful');
      return result.user;
    } catch (err: any) {
      console.error('AuthContext: Signup error', err);
      setError(`Signup failed: ${err.message}`);
      throw err;
    }
  };

  // Sign out the current user
  const logout = async (): Promise<void> => {
    try {
      clearError();
      console.log('AuthContext: Attempting logout');
      await signOut(auth);
      console.log('AuthContext: Logout successful');
    } catch (err: any) {
      console.error('AuthContext: Logout error', err);
      setError(`Logout failed: ${err.message}`);
      throw err;
    }
  };

  // Send a password reset email
  const resetPassword = async (email: string): Promise<void> => {
    try {
      clearError();
      console.log('AuthContext: Attempting password reset');
      await sendPasswordResetEmail(auth, email);
      console.log('AuthContext: Password reset email sent');
    } catch (err: any) {
      console.error('AuthContext: Password reset error', err);
      setError(`Password reset failed: ${err.message}`);
      throw err;
    }
  };

  // Sign in with Google
  const googleSignIn = async (): Promise<User> => {
    try {
      clearError();
      console.log('AuthContext: Attempting Google sign in');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('AuthContext: Google sign in successful');
      return result.user;
    } catch (err: any) {
      console.error('AuthContext: Google sign in error', err);
      setError(`Google sign in failed: ${err.message}`);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    googleSignIn,
    clearError
  };

  return (
    <FirebaseErrorBoundary 
      serviceName="Authentication" 
      onError={(error) => setError(`Authentication service error: ${error.message}`)}
    >
      <AuthContext.Provider value={value}>
        {!loading && children}
        {loading && (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Initializing authentication...</p>
            </div>
          </div>
        )}
      </AuthContext.Provider>
    </FirebaseErrorBoundary>
  );
};

export default AuthContext;
