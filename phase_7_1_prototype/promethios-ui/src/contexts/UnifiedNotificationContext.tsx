/**
 * Unified Notification Context
 * 
 * Provides app-wide access to the unified notification system
 * and manages notification state across components
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useUserInteractions } from '../hooks/useUserInteractions';
import { UserInteraction, InteractionType } from '../services/UserInteractionRegistry';

interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  enableInApp: boolean;
  categories: {
    social: boolean;
    professional: boolean;
    marketplace: boolean;
    collaboration: boolean;
    chat: boolean;
  };
}

interface UnifiedNotificationContextType {
  // Notification data (from useUserInteractions)
  totalNotifications: number;
  socialNotifications: UserInteraction[];
  professionalNotifications: UserInteraction[];
  marketplaceNotifications: UserInteraction[];
  collaborationNotifications: UserInteraction[];
  chatNotifications: UserInteraction[];
  
  // UI state
  isNotificationCenterOpen: boolean;
  selectedCategory: string;
  
  // Settings
  settings: NotificationSettings;
  
  // Actions
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  toggleNotificationCenter: () => void;
  setSelectedCategory: (category: string) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Notification actions
  acceptInteraction: (interactionId: string) => Promise<boolean>;
  declineInteraction: (interactionId: string) => Promise<boolean>;
  markAsRead: (interactionId: string) => Promise<void>;
  markAllAsRead: (category?: string) => Promise<void>;
  
  // Utility functions
  getNotificationsByCategory: (category: string) => UserInteraction[];
  hasUnreadNotifications: (category?: string) => boolean;
  playNotificationSound: () => void;
  showDesktopNotification: (interaction: UserInteraction) => void;
}

const UnifiedNotificationContext = createContext<UnifiedNotificationContextType | undefined>(undefined);

const DEFAULT_SETTINGS: NotificationSettings = {
  enableSound: true,
  enableDesktop: true,
  enableInApp: true,
  categories: {
    social: true,
    professional: true,
    marketplace: true,
    collaboration: true,
    chat: true
  }
};

interface UnifiedNotificationProviderProps {
  children: ReactNode;
}

export const UnifiedNotificationProvider: React.FC<UnifiedNotificationProviderProps> = ({
  children
}) => {
  // UI State
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Get notification data from useUserInteractions hook
  const {
    pendingInteractions,
    socialNotifications,
    professionalNotifications,
    marketplaceNotifications,
    collaborationNotifications,
    chatNotifications,
    acceptInteraction: acceptInteractionHook,
    declineInteraction: declineInteractionHook
  } = useUserInteractions();

  const totalNotifications = pendingInteractions.length;

  // UI Actions
  const openNotificationCenter = useCallback(() => {
    setIsNotificationCenterOpen(true);
  }, []);

  const closeNotificationCenter = useCallback(() => {
    setIsNotificationCenterOpen(false);
  }, []);

  const toggleNotificationCenter = useCallback(() => {
    setIsNotificationCenterOpen(prev => !prev);
  }, []);

  // Settings Actions
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      categories: {
        ...prev.categories,
        ...(newSettings.categories || {})
      }
    }));
    
    // Save to localStorage
    localStorage.setItem('unifiedNotificationSettings', JSON.stringify({
      ...settings,
      ...newSettings
    }));
  }, [settings]);

  // Notification Actions
  const acceptInteraction = useCallback(async (interactionId: string): Promise<boolean> => {
    const result = await acceptInteractionHook(interactionId);
    
    if (result && settings.enableSound) {
      playNotificationSound();
    }
    
    return result;
  }, [acceptInteractionHook, settings.enableSound]);

  const declineInteraction = useCallback(async (interactionId: string): Promise<boolean> => {
    return await declineInteractionHook(interactionId);
  }, [declineInteractionHook]);

  const markAsRead = useCallback(async (interactionId: string): Promise<void> => {
    // TODO: Implement mark as read functionality in the registry
    console.log('Marking interaction as read:', interactionId);
  }, []);

  const markAllAsRead = useCallback(async (category?: string): Promise<void> => {
    // TODO: Implement mark all as read functionality
    console.log('Marking all as read for category:', category);
  }, []);

  // Utility Functions
  const getNotificationsByCategory = useCallback((category: string): UserInteraction[] => {
    switch (category) {
      case 'social':
        return socialNotifications;
      case 'professional':
        return professionalNotifications;
      case 'marketplace':
        return marketplaceNotifications;
      case 'collaboration':
        return collaborationNotifications;
      case 'chat':
        return chatNotifications;
      case 'all':
      default:
        return pendingInteractions;
    }
  }, [
    socialNotifications,
    professionalNotifications,
    marketplaceNotifications,
    collaborationNotifications,
    chatNotifications,
    pendingInteractions
  ]);

  const hasUnreadNotifications = useCallback((category?: string): boolean => {
    if (category) {
      return getNotificationsByCategory(category).length > 0;
    }
    return totalNotifications > 0;
  }, [getNotificationsByCategory, totalNotifications]);

  const playNotificationSound = useCallback(() => {
    if (!settings.enableSound) return;
    
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [settings.enableSound]);

  const showDesktopNotification = useCallback((interaction: UserInteraction) => {
    if (!settings.enableDesktop || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(
        `New ${interaction.type.replace('_', ' ')}`,
        {
          body: `${interaction.fromUserName} sent you a ${interaction.type.replace('_', ' ')}`,
          icon: interaction.fromUserPhoto || '/default-avatar.png',
          tag: interaction.id,
          requireInteraction: true
        }
      );
      
      notification.onclick = () => {
        window.focus();
        openNotificationCenter();
        notification.close();
      };
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showDesktopNotification(interaction);
        }
      });
    }
  }, [settings.enableDesktop, openNotificationCenter]);

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('unifiedNotificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Could not parse saved notification settings:', error);
      }
    }
  }, []);

  // Show desktop notifications for new interactions
  React.useEffect(() => {
    if (settings.enableDesktop && pendingInteractions.length > 0) {
      // Get the most recent interaction
      const latestInteraction = pendingInteractions[0];
      
      // Check if this is a new interaction (created within last 10 seconds)
      const now = new Date();
      const interactionTime = latestInteraction.createdAt?.toDate ? 
        latestInteraction.createdAt.toDate() : 
        new Date(latestInteraction.createdAt);
      
      const timeDiff = now.getTime() - interactionTime.getTime();
      
      if (timeDiff < 10000) { // 10 seconds
        showDesktopNotification(latestInteraction);
      }
    }
  }, [pendingInteractions.length, settings.enableDesktop, showDesktopNotification]);

  const contextValue: UnifiedNotificationContextType = {
    // Notification data
    totalNotifications,
    socialNotifications,
    professionalNotifications,
    marketplaceNotifications,
    collaborationNotifications,
    chatNotifications,
    
    // UI state
    isNotificationCenterOpen,
    selectedCategory,
    
    // Settings
    settings,
    
    // Actions
    openNotificationCenter,
    closeNotificationCenter,
    toggleNotificationCenter,
    setSelectedCategory,
    updateSettings,
    
    // Notification actions
    acceptInteraction,
    declineInteraction,
    markAsRead,
    markAllAsRead,
    
    // Utility functions
    getNotificationsByCategory,
    hasUnreadNotifications,
    playNotificationSound,
    showDesktopNotification
  };

  return (
    <UnifiedNotificationContext.Provider value={contextValue}>
      {children}
    </UnifiedNotificationContext.Provider>
  );
};

export const useUnifiedNotifications = (): UnifiedNotificationContextType => {
  const context = useContext(UnifiedNotificationContext);
  if (context === undefined) {
    throw new Error('useUnifiedNotifications must be used within a UnifiedNotificationProvider');
  }
  return context;
};

export default UnifiedNotificationContext;

