import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

// Define the Observer context types
interface ObserverContextType {
  addMemoryItem: (item: string) => void;
  showNotification: (message: string, type: 'info' | 'warning' | 'success') => void;
  memoryItems: string[];
  guidanceLevel: string;
  setGuidanceLevel: (level: string) => void;
}

// Create the context
const ObserverContext = createContext<ObserverContextType | undefined>(undefined);

// Provider component
export const ObserverProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { currentUser } = useAuth();
  const [memoryItems, setMemoryItems] = useState<string[]>([]);
  const [guidanceLevel, setGuidanceLevel] = useState('Standard');
  const [notifications, setNotifications] = useState<{id: number, message: string, type: 'info' | 'warning' | 'success'}[]>([]);
  
  // Add item to memory
  const addMemoryItem = (item: string) => {
    setMemoryItems(prev => {
      const newMemory = [item, ...prev];
      // Keep only the most recent 50 items
      return newMemory.slice(0, 50);
    });
    
    // Store in localStorage for persistence
    try {
      const storedMemory = JSON.parse(localStorage.getItem('observerMemory') || '[]');
      const updatedMemory = [item, ...storedMemory].slice(0, 50);
      localStorage.setItem('observerMemory', JSON.stringify(updatedMemory));
    } catch (error) {
      console.error('Error storing memory in localStorage:', error);
    }
  };
  
  // Show notification
  const showNotification = (message: string, type: 'info' | 'warning' | 'success') => {
    const notification = {
      id: Date.now(),
      message,
      type
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 5));
    
    // Also add to memory
    addMemoryItem(`Notification: ${message}`);
  };
  
  // Load memory from localStorage on mount
  useEffect(() => {
    try {
      const storedMemory = JSON.parse(localStorage.getItem('observerMemory') || '[]');
      if (Array.isArray(storedMemory) && storedMemory.length > 0) {
        setMemoryItems(storedMemory);
      }
      
      const storedGuidance = localStorage.getItem('observerGuidanceLevel');
      if (storedGuidance) {
        setGuidanceLevel(storedGuidance);
      }
    } catch (error) {
      console.error('Error loading memory from localStorage:', error);
    }
  }, []);
  
  // Update localStorage when guidance level changes
  useEffect(() => {
    localStorage.setItem('observerGuidanceLevel', guidanceLevel);
  }, [guidanceLevel]);
  
  // Context value
  const value = {
    addMemoryItem,
    showNotification,
    memoryItems,
    guidanceLevel,
    setGuidanceLevel
  };
  
  return (
    <ObserverContext.Provider value={value}>
      {children}
    </ObserverContext.Provider>
  );
};

// Hook to use the Observer context
export const useObserver = () => {
  const context = useContext(ObserverContext);
  if (context === undefined) {
    throw new Error('useObserver must be used within an ObserverProvider');
  }
  return context;
};
