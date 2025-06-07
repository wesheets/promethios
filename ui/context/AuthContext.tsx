import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Define types for Auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: string | null;
  hasCompletedOnboarding: boolean;
  hasSkippedOnboarding: boolean;
  setOnboardingStatus: (completed: boolean, skipped: boolean) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  userRole: null,
  hasCompletedOnboarding: false,
  hasSkippedOnboarding: false,
  setOnboardingStatus: async () => {},
});

// Custom hook to use Auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);
  
  // Initialize auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Get user role and onboarding status from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'developer');
            
            // Get onboarding status
            if (userData.onboarding) {
              setHasCompletedOnboarding(userData.onboarding.completedOnboarding || false);
              setHasSkippedOnboarding(userData.onboarding.hasSkippedOnboarding || false);
            } else {
              setHasCompletedOnboarding(false);
              setHasSkippedOnboarding(false);
            }
          } else {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: 'developer',
              onboarding: {
                completedOnboarding: false,
                hasSkippedOnboarding: false,
                completedSteps: [],
                lastActiveStep: 0
              },
              observerPreferences: {
                expertiseLevel: 'beginner',
                guidanceMode: 'proactive'
              },
              createdAt: new Date()
            });
            
            setUserRole('developer');
            setHasCompletedOnboarding(false);
            setHasSkippedOnboarding(false);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          setUserRole('developer'); // Default role
          setHasCompletedOnboarding(false);
          setHasSkippedOnboarding(false);
        }
      } else {
        setUserRole(null);
        setHasCompletedOnboarding(false);
        setHasSkippedOnboarding(false);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        role: 'developer',
        onboarding: {
          completedOnboarding: false,
          hasSkippedOnboarding: false,
          completedSteps: [],
          lastActiveStep: 0
        },
        observerPreferences: {
          expertiseLevel: 'beginner',
          guidanceMode: 'proactive'
        },
        createdAt: new Date()
      });
      
      setUserRole('developer');
      setHasCompletedOnboarding(false);
      setHasSkippedOnboarding(false);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Set onboarding status
  const setOnboardingStatus = async (completed: boolean, skipped: boolean) => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Get current user data
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update onboarding status
        await setDoc(userDocRef, {
          ...userData,
          onboarding: {
            ...userData.onboarding,
            completedOnboarding: completed,
            hasSkippedOnboarding: skipped
          }
        }, { merge: true });
        
        setHasCompletedOnboarding(completed);
        setHasSkippedOnboarding(skipped);
      }
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      throw error;
    }
  };
  
  // Context value
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    userRole,
    hasCompletedOnboarding,
    hasSkippedOnboarding,
    setOnboardingStatus
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
