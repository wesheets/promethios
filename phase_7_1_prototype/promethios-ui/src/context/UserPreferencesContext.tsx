import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useAuth } from './AuthContext';

/**
 * User Preferences Context
 * 
 * Manages user preferences for enhanced features, allowing users to
 * skip or disable gamification, observer, and other enhancements.
 * Now with cross-device synchronization via Firestore.
 */
interface UserPreferences {
  // Feature toggles
  enableGamification: boolean;
  enableHoveringObserver: boolean;
  enableOnboardingGuide: boolean;
  enableAchievements: boolean;
  enableTrustRewards: boolean;
  
  // Experience level
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  hasSkippedOnboarding: boolean;
  
  // UI preferences
  showProgressIndicator: boolean;
  showTooltips: boolean;
  autoShowObserver: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetToDefaults: () => void;
  skipOnboarding: () => void;
  enableMinimalMode: () => void;
  enableFullExperience: () => void;
  isLoading: boolean;
}

const defaultPreferences: UserPreferences = {
  enableGamification: true,
  enableHoveringObserver: true,
  enableOnboardingGuide: true,
  enableAchievements: true,
  enableTrustRewards: true,
  experienceLevel: 'beginner',
  hasCompletedOnboarding: false,
  hasSkippedOnboarding: false,
  showProgressIndicator: true,
  showTooltips: true,
  autoShowObserver: true,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    // Backward compatible fallback
    return {
      preferences: defaultPreferences,
      updatePreference: () => {},
      resetToDefaults: () => {},
      skipOnboarding: () => {},
      enableMinimalMode: () => {},
      enableFullExperience: () => {},
      isLoading: false,
    };
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);

  // Load preferences from both localStorage and Firestore
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        // First try localStorage for immediate UI response
        const saved = localStorage.getItem('promethios_user_preferences');
        if (saved) {
          const parsedPreferences = JSON.parse(saved);
          setPreferences(prev => ({ ...prev, ...parsedPreferences }));
        }
        
        // Then try Firestore for cross-device sync if user is logged in
        if (user?.uid) {
          const userPrefsDoc = await getDoc(doc(firestore, 'userPreferences', user.uid));
          if (userPrefsDoc.exists()) {
            const firestorePrefs = userPrefsDoc.data() as UserPreferences;
            setPreferences(prev => ({ ...prev, ...firestorePrefs }));
            
            // Update localStorage with the latest from Firestore
            localStorage.setItem('promethios_user_preferences', JSON.stringify(firestorePrefs));
            console.log('Loaded user preferences from Firestore');
          } else {
            // If no Firestore preferences exist yet, save the current ones
            await saveToFirestore(preferences);
          }
        }
      } catch (error) {
        console.warn('Failed to load user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, [user?.uid]);

  // Save preferences to localStorage
  const saveToLocalStorage = (newPreferences: UserPreferences) => {
    try {
      localStorage.setItem('promethios_user_preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Failed to save user preferences to localStorage:', error);
    }
  };

  // Save preferences to Firestore
  const saveToFirestore = async (newPreferences: UserPreferences) => {
    if (!user?.uid) return;
    
    try {
      await setDoc(doc(firestore, 'userPreferences', user.uid), {
        ...newPreferences,
        lastUpdated: new Date()
      });
      console.log('Saved user preferences to Firestore');
    } catch (error) {
      console.warn('Failed to save user preferences to Firestore:', error);
    }
  };

  // Save preferences to both localStorage and Firestore
  const savePreferences = async (newPreferences: UserPreferences) => {
    // Always save to localStorage for immediate access
    saveToLocalStorage(newPreferences);
    
    // Save to Firestore if user is logged in
    if (user?.uid) {
      await saveToFirestore(newPreferences);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    savePreferences(defaultPreferences);
  };

  const skipOnboarding = () => {
    const newPreferences = {
      ...preferences,
      hasSkippedOnboarding: true,
      hasCompletedOnboarding: true,
      experienceLevel: 'intermediate' as const,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const enableMinimalMode = () => {
    const newPreferences = {
      ...preferences,
      enableGamification: false,
      enableHoveringObserver: false,
      enableAchievements: false,
      enableTrustRewards: false,
      showProgressIndicator: false,
      showTooltips: false,
      autoShowObserver: false,
      experienceLevel: 'expert' as const,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const enableFullExperience = () => {
    const newPreferences = {
      ...preferences,
      enableGamification: true,
      enableHoveringObserver: true,
      enableAchievements: true,
      enableTrustRewards: true,
      showProgressIndicator: true,
      showTooltips: true,
      autoShowObserver: true,
      experienceLevel: 'beginner' as const,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const value = {
    preferences,
    updatePreference,
    resetToDefaults,
    skipOnboarding,
    enableMinimalMode,
    enableFullExperience,
    isLoading,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export default UserPreferencesProvider;
