import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { notificationService } from '../../services/NotificationService';

// Mock user data for testing
const MOCK_USERS = [
  {
    uid: 'mock_user_1',
    email: 'alice.test@example.com',
    displayName: 'Alice Test User',
    photoURL: null,
    emailVerified: true
  },
  {
    uid: 'mock_user_2', 
    email: 'bob.test@example.com',
    displayName: 'Bob Test User',
    photoURL: null,
    emailVerified: true
  }
];

interface MockAuthContextType {
  currentUser: User | null;
  userProfile: any;
  isApproved: boolean;
  approvalStatus: string;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  availableUsers: typeof MOCK_USERS;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

interface MockAuthProviderProps {
  children: ReactNode;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const createMockUser = (mockData: typeof MOCK_USERS[0]): User => {
    return {
      uid: mockData.uid,
      email: mockData.email,
      displayName: mockData.displayName,
      photoURL: mockData.photoURL,
      emailVerified: mockData.emailVerified,
      // Add other required User properties with mock values
      isAnonymous: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [],
      refreshToken: 'mock_refresh_token',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'mock_id_token',
      getIdTokenResult: async () => ({
        token: 'mock_id_token',
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        signInProvider: 'google.com',
        signInSecondFactor: null,
        claims: {}
      }),
      reload: async () => {},
      toJSON: () => ({})
    } as User;
  };

  const createApprovedProfile = (user: User) => {
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
    console.log('🧪 [MockAuth] Simulating Google login...');
    const mockUserData = MOCK_USERS[0]; // Default to first user
    const mockUser = createMockUser(mockUserData);
    const profile = createApprovedProfile(mockUser);
    
    setCurrentUser(mockUser);
    setUserProfile(profile);
    
    // Initialize notification service with mock user ID
    notificationService.setUserId(mockUser.uid);
    
    console.log('✅ [MockAuth] Mock user logged in:', mockUser.email);
  };

  const logout = async () => {
    console.log('🧪 [MockAuth] Logging out mock user...');
    setCurrentUser(null);
    setUserProfile(null);
  };

  const switchUser = (userId: string) => {
    const mockUserData = MOCK_USERS.find(u => u.uid === userId);
    if (mockUserData) {
      const mockUser = createMockUser(mockUserData);
      const profile = createApprovedProfile(mockUser);
      
      setCurrentUser(mockUser);
      setUserProfile(profile);
      
      // Initialize notification service with new user ID
      notificationService.setUserId(mockUser.uid);
      
      console.log('🔄 [MockAuth] Switched to user:', mockUser.email);
    }
  };

  // Auto-login with first user on mount
  useEffect(() => {
    console.log('🧪 [MockAuth] Auto-logging in with mock user...');
    loginWithGoogle();
  }, []);

  const value: MockAuthContextType = {
    currentUser,
    userProfile,
    isApproved: true,
    approvalStatus: 'approved',
    loading,
    loginWithGoogle,
    logout,
    switchUser,
    availableUsers: MOCK_USERS
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

export default MockAuthProvider;

