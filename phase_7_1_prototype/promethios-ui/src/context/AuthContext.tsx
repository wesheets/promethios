import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

import app, { auth, googleProvider, db } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  db: Firestore | null; // Add db to the context type
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<any>;
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  db: null, // Initialize db as null
  loginWithEmail: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
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
  const [dbInstance, setDbInstance] = useState<Firestore | null>(db); // Use db from config directly

  useEffect(() => {
    console.log("AuthContext: Setting up auth state listener");
    
    // Check for redirect result first
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("AuthContext: Redirect result received:", result.user?.email);
      }
    }).catch((error) => {
      console.error("AuthContext: Redirect result error:", error);
    });
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AuthContext: Auth state changed. User object:", user);
      if (user) {
        console.log("AuthContext: User detected. UID:", user.uid, "Email:", user.email);
      } else {
        console.log("AuthContext: No user detected (null).");
        setDbInstance(null); // Clear Firestore instance if no user
      }
      setCurrentUser(user);
      setLoading(false);
      console.log("AuthContext: currentUser set, loading is now false.");
    }, (error) => {
      console.error("AuthContext: Auth state change error:", error);
      setLoading(false);
      setDbInstance(null);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      // First try popup method
      console.log("AuthContext: Attempting Google login with popup");
      return await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.log("AuthContext: Popup failed, trying redirect fallback", error.code);
      
      // If popup fails due to Cross-Origin-Opener-Policy or other popup issues, use redirect
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request' ||
          error.message?.includes('Cross-Origin-Opener-Policy')) {
        
        console.log("AuthContext: Using redirect method as fallback");
        // Use redirect method as fallback
        await signInWithRedirect(auth, googleProvider);
        // The redirect will handle the rest, no return value needed
        return null;
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

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    db: dbInstance, // Provide the Firestore instance
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


