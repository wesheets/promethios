import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * User Preferences Context
 * 
 * Manages user preferences for enhanced features, allowing users to
 * skip or disable gamification, observer, and other enhancements.
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
    };
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('promethios_user_preferences');
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsedPreferences }));
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: UserPreferences) => {
    try {
      localStorage.setItem('promethios_user_preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
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
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export default UserPreferencesProvider;

