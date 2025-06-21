/**
 * User Preferences Hook for Observer Agent
 * 
 * Manages user preferences including pulsing settings
 */

import { useState, useEffect } from 'react';

interface ObserverPreferences {
  pulsingEnabled: boolean;
  pulseIntensity: 'subtle' | 'normal' | 'strong';
  pulseFrequency: 'low' | 'normal' | 'high';
  autoExpand: boolean;
  contextualSuggestions: boolean;
}

const defaultPreferences: ObserverPreferences = {
  pulsingEnabled: true,
  pulseIntensity: 'normal',
  pulseFrequency: 'normal',
  autoExpand: false,
  contextualSuggestions: true
};

export const useObserverPreferences = () => {
  const [preferences, setPreferences] = useState<ObserverPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('observerPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Failed to parse observer preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('observerPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = <K extends keyof ObserverPreferences>(
    key: K,
    value: ObserverPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return {
    preferences,
    updatePreference,
    resetPreferences
  };
};

