import React, { createContext, useContext, useState } from 'react';

interface SimpleAuthContextType {
  user: any;
  loading: boolean;
  logout: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType>({
  user: null,
  loading: false,
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setUser(null);
  };

  const value: SimpleAuthContextType = {
    user,
    loading,
    logout,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

