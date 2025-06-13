import { useContext } from 'react';
import { User } from 'firebase/auth';

// Mock auth context for development
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Mock useAuth hook for development
export const useAuth = (): AuthContextType => {
  return {
    user: {
      uid: 'mock-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    } as User,
    loading: false,
    signIn: async (email: string, password: string) => {
      console.log('Mock sign in:', email);
    },
    signOut: async () => {
      console.log('Mock sign out');
    },
  };
};

