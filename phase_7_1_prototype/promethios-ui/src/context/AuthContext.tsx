import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { notificationService } from '../services/NotificationService';

// Simplified user profile interface
interface UserProfile {
  id: string;
  email: string;
  name: string;
  displayName: string;
  approvalStatus: 'approved';
  onboardingCompleted: true;
  profileCompleted: true;
  role: 'user';
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isApproved: boolean;
  approvalStatus: string;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<string>('pending');
  const [loading, setLoading] = useState<boolean>(true);

  // Simple auto-approval for any authenticated user
  const createApprovedProfile = (user: User): UserProfile => {
    return {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || 'User',
      displayName: user.displayName || 'User',
      approvalStatus: 'approved',
      onboardingCompleted: true,
      profileCompleted: true,
      role: 'user',
      createdAt: new Date().toISOString()
    };
  };

  const loginWithGoogle = async () => {
    try {
      console.log("AuthContext: Attempting Google login with popup");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("AuthContext: Popup login successful:", result.user.email);
    } catch (error) {
      console.error("AuthContext: Error during Google login:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsApproved(false);
      setApprovalStatus('pending');
      console.log("AuthContext: User logged out successfully");
    } catch (error) {
      console.error("AuthContext: Error during logout:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("AuthContext: Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AuthContext: Auth state changed. User object:", user ? 'UserImpl' : 'null');
      
      if (user) {
        console.log(`AuthContext: User detected. UID: ${user.uid} Email: ${user.email}`);
        
        // Auto-approve all authenticated users
        console.log("AuthContext: AUTO-APPROVING all authenticated users");
        const profile = createApprovedProfile(user);
        
        setCurrentUser(user);
        setUserProfile(profile);
        setIsApproved(true);
        setApprovalStatus('approved');
        
        // Initialize notification service with user ID
        notificationService.setUserId(user.uid);
        
        console.log("AuthContext: User auto-approved:", user.email);
      } else {
        console.log("AuthContext: No user detected (null).");
        setCurrentUser(null);
        setUserProfile(null);
        setIsApproved(false);
        setApprovalStatus('pending');
      }
      
      setLoading(false);
      console.log("AuthContext: currentUser set, loading is now false.");
    });

    return () => {
      console.log("AuthContext: Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    isApproved,
    approvalStatus,
    loading,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

