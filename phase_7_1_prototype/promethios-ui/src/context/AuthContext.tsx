import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Set persistence when the component mounts
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        // Set persistence to LOCAL (persists even when browser is closed)
        await setPersistence(auth, browserLocalPersistence);
        console.log('Firebase persistence set to browserLocalPersistence');
      } catch (error) {
        console.error('Error setting persistence:', error);
      }
    };
    
    setupPersistence();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        console.log('User is signed in:', user.email);
        // Store minimal user info in localStorage as a fallback
        localStorage.setItem('authUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      } else {
        console.log('No user is signed in');
        localStorage.removeItem('authUser');
      }
    });

    return unsubscribe;
  }, []);

  // Sign in with email and password
  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    try {
      // Persistence is already set, so this login will be persistent
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  // Sign in with Google
  const loginWithGoogle = async (): Promise<User> => {
    try {
      // Persistence is already set, so this login will be persistent
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signup = async (email: string, password: string): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendVerificationEmail();
      return result.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Sign out
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      localStorage.removeItem('authUser'); // Clear backup auth data
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Send email verification
  const sendVerificationEmail = async (): Promise<void> => {
    if (!currentUser) throw new Error('No user logged in');
    try {
      await sendEmailVerification(currentUser);
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    loginWithEmail,
    loginWithGoogle,
    signup,
    logout,
    sendVerificationEmail,
    resetPassword,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
