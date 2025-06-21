/**
 * Observer Preferences Hook - Unified Storage Version
 * 
 * Manages user preferences for Observer Agent using the unified storage system
 * Provides automatic persistence across sessions with Firebase sync
 */

import { useCallback } from 'react';
import { useStorageValue } from './useStorageHooks';
import { StoragePolicy } from '../services/storage/types';

interface ObserverPreferences {
  // Visual preferences
  pulsingEnabled: boolean;
  pulseIntensity: 'subtle' | 'normal' | 'strong';
  pulseFrequency: 'low' | 'normal' | 'high';
  
  // Behavior preferences
  autoExpand: boolean;
  contextualSuggestions: boolean;
  proactiveInsights: boolean;
  
  // Notification preferences
  notificationSound: boolean;
  notificationPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  notificationDuration: number; // in seconds
  
  // Privacy preferences
  memoryRetention: 'session' | '7days' | '30days' | '90days' | 'forever';
  shareInsights: boolean;
  anonymizeData: boolean;
  
  // Advanced preferences
  governanceAlerts: boolean;
  trustMetricsVisible: boolean;
  debugMode: boolean;
  
  // Interaction preferences
  chatStyle: 'formal' | 'casual' | 'technical';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
  suggestionFrequency: 'minimal' | 'normal' | 'frequent';
}

const defaultPreferences: ObserverPreferences = {
  // Visual preferences
  pulsingEnabled: true,
  pulseIntensity: 'normal',
  pulseFrequency: 'normal',
  
  // Behavior preferences
  autoExpand: false,
  contextualSuggestions: true,
  proactiveInsights: true,
  
  // Notification preferences
  notificationSound: true,
  notificationPosition: 'top-right',
  notificationDuration: 5,
  
  // Privacy preferences
  memoryRetention: '30days',
  shareInsights: false,
  anonymizeData: true,
  
  // Advanced preferences
  governanceAlerts: true,
  trustMetricsVisible: true,
  debugMode: false,
  
  // Interaction preferences
  chatStyle: 'casual',
  responseLength: 'detailed',
  suggestionFrequency: 'normal'
};

// Storage policy for observer preferences
const preferencesPolicy: StoragePolicy = {
  allowedProviders: ['firebase', 'localStorage'],
  syncStrategy: 'immediate',
  conflictResolution: 'client-wins', // User preferences should override server
  encryption: 'at-rest',
  gdprCategory: 'functional'
};

export const useObserverPreferences = () => {
  const [preferences, setPreferences, loading, error] = useStorageValue<ObserverPreferences>(
    'observer.preferences.settings',
    defaultPreferences,
    preferencesPolicy
  );

  // Update a specific preference
  const updatePreference = useCallback(async <K extends keyof ObserverPreferences>(
    key: K,
    value: ObserverPreferences[K]
  ) => {
    try {
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      
      await setPreferences(updatedPreferences);
      
      // Log preference change for analytics (if enabled)
      if (!preferences.anonymizeData) {
        console.log(`Observer preference updated: ${key} = ${value}`);
      }
    } catch (err) {
      console.error(`Failed to update observer preference ${key}:`, err);
      throw err;
    }
  }, [preferences, setPreferences]);

  // Update multiple preferences at once
  const updatePreferences = useCallback(async (updates: Partial<ObserverPreferences>) => {
    try {
      const updatedPreferences = {
        ...preferences,
        ...updates
      };
      
      await setPreferences(updatedPreferences);
      
      // Log bulk preference change
      if (!preferences.anonymizeData) {
        console.log('Observer preferences bulk update:', Object.keys(updates));
      }
    } catch (err) {
      console.error('Failed to update observer preferences:', err);
      throw err;
    }
  }, [preferences, setPreferences]);

  // Reset preferences to defaults
  const resetPreferences = useCallback(async () => {
    try {
      await setPreferences(defaultPreferences);
      
      console.log('Observer preferences reset to defaults');
    } catch (err) {
      console.error('Failed to reset observer preferences:', err);
      throw err;
    }
  }, [setPreferences]);

  // Export preferences for backup
  const exportPreferences = useCallback(() => {
    return {
      preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }, [preferences]);

  // Import preferences from backup
  const importPreferences = useCallback(async (importData: {
    preferences: ObserverPreferences;
    exportedAt: string;
    version: string;
  }) => {
    try {
      // Validate import data
      if (!importData.preferences || typeof importData.preferences !== 'object') {
        throw new Error('Invalid preferences data');
      }

      // Merge with defaults to ensure all required fields exist
      const mergedPreferences = {
        ...defaultPreferences,
        ...importData.preferences
      };

      await setPreferences(mergedPreferences);
      
      console.log('Observer preferences imported successfully');
    } catch (err) {
      console.error('Failed to import observer preferences:', err);
      throw err;
    }
  }, [setPreferences]);

  // Get preference categories for UI organization
  const getPreferenceCategories = useCallback(() => {
    return {
      visual: {
        title: 'Visual Settings',
        preferences: ['pulsingEnabled', 'pulseIntensity', 'pulseFrequency'] as (keyof ObserverPreferences)[]
      },
      behavior: {
        title: 'Behavior Settings',
        preferences: ['autoExpand', 'contextualSuggestions', 'proactiveInsights'] as (keyof ObserverPreferences)[]
      },
      notifications: {
        title: 'Notification Settings',
        preferences: ['notificationSound', 'notificationPosition', 'notificationDuration'] as (keyof ObserverPreferences)[]
      },
      privacy: {
        title: 'Privacy Settings',
        preferences: ['memoryRetention', 'shareInsights', 'anonymizeData'] as (keyof ObserverPreferences)[]
      },
      advanced: {
        title: 'Advanced Settings',
        preferences: ['governanceAlerts', 'trustMetricsVisible', 'debugMode'] as (keyof ObserverPreferences)[]
      },
      interaction: {
        title: 'Interaction Settings',
        preferences: ['chatStyle', 'responseLength', 'suggestionFrequency'] as (keyof ObserverPreferences)[]
      }
    };
  }, []);

  // Get memory retention in milliseconds
  const getMemoryRetentionMs = useCallback(() => {
    const retentionMap = {
      'session': 0, // Session only
      '7days': 7 * 24 * 60 * 60 * 1000,
      '30days': 30 * 24 * 60 * 60 * 1000,
      '90days': 90 * 24 * 60 * 60 * 1000,
      'forever': Infinity
    };
    
    return retentionMap[preferences.memoryRetention] || retentionMap['30days'];
  }, [preferences.memoryRetention]);

  // Check if a feature is enabled based on preferences
  const isFeatureEnabled = useCallback((feature: keyof ObserverPreferences) => {
    return Boolean(preferences[feature]);
  }, [preferences]);

  // Get notification duration in milliseconds
  const getNotificationDurationMs = useCallback(() => {
    return preferences.notificationDuration * 1000;
  }, [preferences.notificationDuration]);

  return {
    // Current preferences
    preferences,
    
    // Loading and error states
    loading,
    error,
    
    // Update functions
    updatePreference,
    updatePreferences,
    resetPreferences,
    
    // Import/export functions
    exportPreferences,
    importPreferences,
    
    // Utility functions
    getPreferenceCategories,
    getMemoryRetentionMs,
    isFeatureEnabled,
    getNotificationDurationMs,
    
    // Default preferences for reference
    defaultPreferences
  };
};

// Export types for use in other components
export type { ObserverPreferences };
export { defaultPreferences };

