import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export interface UserPreferences {
  navigationCollapsed: boolean;
  theme: 'dark' | 'light';
  notifications: {
    email: boolean;
    push: boolean;
    governance: boolean;
    agents: boolean;
  };
  favoriteRoutes: string[];
  recentRoutes: string[];
  dashboardLayout?: object;
}

const defaultPreferences: UserPreferences = {
  navigationCollapsed: false,
  theme: 'dark',
  notifications: {
    email: true,
    push: true,
    governance: true,
    agents: true,
  },
  favoriteRoutes: [],
  recentRoutes: [],
};

export const useUserPreferences = () => {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from Firestore with localStorage fallback
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) {
        // For logged-out users, use localStorage
        const localNavCollapsed = localStorage.getItem("navCollapsed");
        setPreferences({
          ...defaultPreferences,
          navigationCollapsed: localNavCollapsed === "true",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("useUserPreferences: Current user before Firestore call:", currentUser);
        if (currentUser) {
          console.log("useUserPreferences: Current user UID before Firestore call:", currentUser.uid);
        }
        const userPrefsRef = doc(db, 'userPreferences', currentUser.uid);
        const docSnap = await getDoc(userPrefsRef);

        if (docSnap.exists()) {
          const firestorePrefs = docSnap.data() as UserPreferences;
          setPreferences(firestorePrefs);
        } else {
          // No Firestore document exists, check localStorage for migration
          const localNavCollapsed = localStorage.getItem('navCollapsed');
          const initialPrefs = {
            ...defaultPreferences,
            navigationCollapsed: localNavCollapsed === 'true',
          };
          
          // Create initial Firestore document
          await setDoc(userPrefsRef, initialPrefs);
          setPreferences(initialPrefs);
        }
      } catch (err) {
        console.error('Error loading user preferences:', err);
        setError('Failed to load preferences');
        
        // Fallback to localStorage
        const localNavCollapsed = localStorage.getItem('navCollapsed');
        setPreferences({
          ...defaultPreferences,
          navigationCollapsed: localNavCollapsed === 'true',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser]);

  // Update preferences in both Firestore and localStorage
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);

      // Always update localStorage for immediate response
      if ('navigationCollapsed' in updates) {
        localStorage.setItem('navCollapsed', String(updates.navigationCollapsed));
      }

      // Update Firestore if user is logged in
      if (currentUser) {
        const userPrefsRef = doc(db, 'userPreferences', currentUser.uid);
        await updateDoc(userPrefsRef, updates);
      }
    } catch (err) {
      console.error('Error updating user preferences:', err);
      setError('Failed to update preferences');
      
      // Revert local state on error
      setPreferences(preferences);
      throw err;
    }
  };

  // Convenience method for navigation state
  const updateNavigationState = async (collapsed: boolean) => {
    await updatePreferences({ navigationCollapsed: collapsed });
  };

  // Convenience method for theme
  const updateTheme = async (theme: 'dark' | 'light') => {
    await updatePreferences({ theme });
  };

  // Convenience method for notifications
  const updateNotifications = async (notifications: Partial<UserPreferences['notifications']>) => {
    await updatePreferences({ 
      notifications: { ...preferences.notifications, ...notifications } 
    });
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    updateNavigationState,
    updateTheme,
    updateNotifications,
  };
};


