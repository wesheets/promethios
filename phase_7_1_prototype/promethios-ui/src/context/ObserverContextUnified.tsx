import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useObserverStorage } from '../context/StorageContext';
import { useStorageValue, useStorageList } from '../hooks/useStorageHooks';

// Define the Observer context types
interface ObserverMemoryItem {
  id: string;
  content: string;
  timestamp: number;
  context?: string;
  type: 'user_action' | 'system_event' | 'conversation' | 'insight';
}

interface ObserverNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'governance_alert';
  timestamp: number;
  read: boolean;
  action?: {
    type: string;
    params: Record<string, any>;
  };
}

interface ObserverSession {
  id: string;
  startTime: number;
  endTime?: number;
  pageViews: string[];
  interactions: number;
  insights: string[];
  governanceEvents: number;
}

interface ObserverContextType {
  // Memory management
  addMemoryItem: (content: string, type?: ObserverMemoryItem['type'], context?: string) => Promise<void>;
  getMemoryItems: () => ObserverMemoryItem[];
  clearMemory: () => Promise<void>;
  
  // Notifications
  showNotification: (message: string, type: ObserverNotification['type'], action?: ObserverNotification['action']) => Promise<void>;
  getNotifications: () => ObserverNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  
  // Session management
  currentSession: ObserverSession | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  addPageView: (page: string) => Promise<void>;
  recordInteraction: () => Promise<void>;
  
  // Preferences
  guidanceLevel: string;
  setGuidanceLevel: (level: string) => Promise<void>;
  
  // State
  isActive: boolean;
  setIsActive: (active: boolean) => Promise<void>;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

// Create the context
const ObserverContext = createContext<ObserverContextType | undefined>(undefined);

// Provider component
export const ObserverProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const observerStorage = useObserverStorage();
  
  // Storage hooks for different data types
  const [guidanceLevel, setGuidanceLevelState, guidanceLoading] = useStorageValue(
    'observer.preferences.guidanceLevel', 
    'Standard'
  );
  
  const [isActive, setIsActiveState, activeLoading] = useStorageValue(
    'observer.state.isActive', 
    true
  );
  
  const [currentSession, setCurrentSession, sessionLoading] = useStorageValue<ObserverSession | null>(
    'observer.session.current', 
    null
  );
  
  const {
    items: memoryItems,
    addItem: addMemoryToStorage,
    clearItems: clearMemoryStorage,
    loading: memoryLoading
  } = useStorageList<ObserverMemoryItem>('observer.memory.items', []);
  
  const {
    items: notifications,
    addItem: addNotificationToStorage,
    updateItem: updateNotificationInStorage,
    clearItems: clearNotificationsStorage,
    loading: notificationsLoading
  } = useStorageList<ObserverNotification>('observer.notifications.items', []);
  
  const [error, setError] = useState<string | null>(null);
  
  // Derived loading state
  const loading = guidanceLoading || activeLoading || sessionLoading || memoryLoading || notificationsLoading;
  
  // Memory management functions
  const addMemoryItem = async (
    content: string, 
    type: ObserverMemoryItem['type'] = 'user_action', 
    context?: string
  ) => {
    try {
      const memoryItem: ObserverMemoryItem = {
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        timestamp: Date.now(),
        context,
        type
      };
      
      await addMemoryToStorage(memoryItem);
      
      // Keep only the most recent 100 items
      if (memoryItems.length >= 100) {
        const sortedItems = [...memoryItems, memoryItem].sort((a, b) => b.timestamp - a.timestamp);
        const recentItems = sortedItems.slice(0, 100);
        
        // Update storage with trimmed list
        await observerStorage.set?.('memory.items', recentItems);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add memory item';
      setError(errorMessage);
      console.error('Observer: Error adding memory item:', err);
    }
  };
  
  const getMemoryItems = () => {
    return memoryItems.sort((a, b) => b.timestamp - a.timestamp);
  };
  
  const clearMemory = async () => {
    try {
      await clearMemoryStorage();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear memory';
      setError(errorMessage);
      console.error('Observer: Error clearing memory:', err);
    }
  };
  
  // Notification management functions
  const showNotification = async (
    message: string, 
    type: ObserverNotification['type'], 
    action?: ObserverNotification['action']
  ) => {
    try {
      const notification: ObserverNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message,
        type,
        timestamp: Date.now(),
        read: false,
        action
      };
      
      await addNotificationToStorage(notification);
      
      // Auto-remove old notifications (keep last 50)
      if (notifications.length >= 50) {
        const sortedNotifications = [...notifications, notification].sort((a, b) => b.timestamp - a.timestamp);
        const recentNotifications = sortedNotifications.slice(0, 50);
        
        await observerStorage.set?.('notifications.items', recentNotifications);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show notification';
      setError(errorMessage);
      console.error('Observer: Error showing notification:', err);
    }
  };
  
  const getNotifications = () => {
    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  };
  
  const markNotificationRead = async (id: string) => {
    try {
      const index = notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        const updatedNotification = { ...notifications[index], read: true };
        await updateNotificationInStorage(index, updatedNotification);
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      console.error('Observer: Error marking notification as read:', err);
    }
  };
  
  const clearNotifications = async () => {
    try {
      await clearNotificationsStorage();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear notifications';
      setError(errorMessage);
      console.error('Observer: Error clearing notifications:', err);
    }
  };
  
  // Session management functions
  const startSession = async () => {
    try {
      const session: ObserverSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        pageViews: [],
        interactions: 0,
        insights: [],
        governanceEvents: 0
      };
      
      await setCurrentSession(session);
      
      // Add session start to memory
      await addMemoryItem(
        'Observer session started',
        'system_event',
        'session_management'
      );
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      console.error('Observer: Error starting session:', err);
    }
  };
  
  const endSession = async () => {
    try {
      if (currentSession) {
        const endedSession = {
          ...currentSession,
          endTime: Date.now()
        };
        
        // Store completed session in history
        await observerStorage.set?.(`session.history.${endedSession.id}`, endedSession);
        
        // Clear current session
        await setCurrentSession(null);
        
        // Add session end to memory
        await addMemoryItem(
          `Observer session ended. Duration: ${Math.round((Date.now() - currentSession.startTime) / 1000 / 60)} minutes`,
          'system_event',
          'session_management'
        );
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      console.error('Observer: Error ending session:', err);
    }
  };
  
  const addPageView = async (page: string) => {
    try {
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          pageViews: [...currentSession.pageViews, page]
        };
        
        await setCurrentSession(updatedSession);
        
        // Add page view to memory
        await addMemoryItem(
          `Navigated to ${page}`,
          'user_action',
          'navigation'
        );
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record page view';
      setError(errorMessage);
      console.error('Observer: Error recording page view:', err);
    }
  };
  
  const recordInteraction = async () => {
    try {
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          interactions: currentSession.interactions + 1
        };
        
        await setCurrentSession(updatedSession);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record interaction';
      setError(errorMessage);
      console.error('Observer: Error recording interaction:', err);
    }
  };
  
  // Preference management
  const setGuidanceLevel = async (level: string) => {
    try {
      await setGuidanceLevelState(level);
      
      // Add preference change to memory
      await addMemoryItem(
        `Guidance level changed to ${level}`,
        'user_action',
        'preferences'
      );
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set guidance level';
      setError(errorMessage);
      console.error('Observer: Error setting guidance level:', err);
    }
  };
  
  const setIsActive = async (active: boolean) => {
    try {
      await setIsActiveState(active);
      
      // Add state change to memory
      await addMemoryItem(
        `Observer ${active ? 'activated' : 'deactivated'}`,
        'user_action',
        'state_management'
      );
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set active state';
      setError(errorMessage);
      console.error('Observer: Error setting active state:', err);
    }
  };
  
  // Auto-start session on mount if not already active
  useEffect(() => {
    if (!loading && isActive && !currentSession) {
      startSession();
    }
  }, [loading, isActive, currentSession]);
  
  // Auto-end session when component unmounts
  useEffect(() => {
    return () => {
      if (currentSession) {
        endSession();
      }
    };
  }, []);
  
  const contextValue: ObserverContextType = {
    // Memory management
    addMemoryItem,
    getMemoryItems,
    clearMemory,
    
    // Notifications
    showNotification,
    getNotifications,
    markNotificationRead,
    clearNotifications,
    
    // Session management
    currentSession,
    startSession,
    endSession,
    addPageView,
    recordInteraction,
    
    // Preferences
    guidanceLevel,
    setGuidanceLevel,
    
    // State
    isActive,
    setIsActive,
    
    // Loading states
    loading,
    error
  };

  return (
    <ObserverContext.Provider value={contextValue}>
      {children}
    </ObserverContext.Provider>
  );
};

// Hook to use the Observer context
export const useObserver = (): ObserverContextType => {
  const context = useContext(ObserverContext);
  if (context === undefined) {
    throw new Error('useObserver must be used within an ObserverProvider');
  }
  return context;
};

// Export types for use in other components
export type { 
  ObserverMemoryItem, 
  ObserverNotification, 
  ObserverSession, 
  ObserverContextType 
};

