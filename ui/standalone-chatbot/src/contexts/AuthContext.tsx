import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  async function signup(email: string, password: string) {
    console.log('Signup:', email, password);
    const mockUser: User = {
      uid: 'demo-user-id',
      email: email,
      displayName: email.split('@')[0]
    };
    setCurrentUser(mockUser);
  }

  async function login(email: string, password: string) {
    console.log('Login:', email, password);
    const mockUser: User = {
      uid: 'demo-user-id',
      email: email,
      displayName: email.split('@')[0]
    };
    setCurrentUser(mockUser);
  }

  async function logout() {
    console.log('Logout');
    setCurrentUser(null);
  }

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

