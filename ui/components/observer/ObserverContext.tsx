import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Define types for Observer context
interface ObserverContextType {
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  guidanceMode: 'proactive' | 'reactive';
  isVisible: boolean;
  memory: ObserverMemoryItem[];
  explainedConcepts: string[];
  addMemoryItem: (action: string) => void;
  addExplainedConcept: (concept: string) => void;
  setExpertiseLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  setGuidanceMode: (mode: 'proactive' | 'reactive') => void;
  setVisibility: (visible: boolean) => void;
  presenceLog: ObserverPresenceLog[];
  logPresence: (page: string, active: boolean, reason?: string) => void;
}

interface ObserverMemoryItem {
  timestamp: number;
  action: string;
}

interface ObserverPresenceLog {
  timestamp: number;
  page: string;
  active: boolean;
  reason?: string;
}

// Create context with default values
const ObserverContext = createContext<ObserverContextType>({
  expertiseLevel: 'beginner',
  guidanceMode: 'proactive',
  isVisible: true,
  memory: [],
  explainedConcepts: [],
  addMemoryItem: () => {},
  addExplainedConcept: () => {},
  setExpertiseLevel: () => {},
  setGuidanceMode: () => {},
  setVisibility: () => {},
  presenceLog: [],
  logPresence: () => {},
});

// Custom hook to use Observer context
export const useObserver = () => useContext(ObserverContext);

// Observer Provider component
export const ObserverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // State for Observer settings
  const [expertiseLevel, setExpertiseLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [guidanceMode, setGuidanceMode] = useState<'proactive' | 'reactive'>('proactive');
  const [isVisible, setVisibility] = useState<boolean>(true);
  const [memory, setMemory] = useState<ObserverMemoryItem[]>([]);
  const [explainedConcepts, setExplainedConcepts] = useState<string[]>([]);
  const [presenceLog, setPresenceLog] = useState<ObserverPresenceLog[]>([]);
  
  // Load Observer settings from Firebase when user changes
  useEffect(() => {
    if (user) {
      // TODO: Load settings from Firebase
      // This will be implemented in the Firebase integration step
      console.log('Loading Observer settings for user:', user.uid);
    }
  }, [user]);
  
  // Add item to Observer memory
  const addMemoryItem = (action: string) => {
    const newItem = {
      timestamp: Date.now(),
      action,
    };
    
    setMemory(prevMemory => {
      const updatedMemory = [...prevMemory, newItem];
      
      // TODO: Save to Firebase in the integration step
      if (user) {
        console.log('Saving memory for user:', user.uid);
      }
      
      return updatedMemory;
    });
  };
  
  // Add concept to explained concepts
  const addExplainedConcept = (concept: string) => {
    setExplainedConcepts(prevConcepts => {
      if (prevConcepts.includes(concept)) return prevConcepts;
      
      const updatedConcepts = [...prevConcepts, concept];
      
      // TODO: Save to Firebase in the integration step
      if (user) {
        console.log('Saving explained concepts for user:', user.uid);
      }
      
      return updatedConcepts;
    });
  };
  
  // Log Observer presence/suppression
  const logPresence = (page: string, active: boolean, reason?: string) => {
    const newLog = {
      timestamp: Date.now(),
      page,
      active,
      reason,
    };
    
    setPresenceLog(prevLog => {
      const updatedLog = [...prevLog, newLog];
      
      // TODO: Save to Firebase in the integration step
      if (user) {
        console.log('Saving presence log for user:', user.uid);
      }
      
      return updatedLog;
    });
  };
  
  // Update expertise level and save to Firebase
  const handleSetExpertiseLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setExpertiseLevel(level);
    
    // TODO: Save to Firebase in the integration step
    if (user) {
      console.log('Saving expertise level for user:', user.uid);
    }
  };
  
  // Update guidance mode and save to Firebase
  const handleSetGuidanceMode = (mode: 'proactive' | 'reactive') => {
    setGuidanceMode(mode);
    
    // TODO: Save to Firebase in the integration step
    if (user) {
      console.log('Saving guidance mode for user:', user.uid);
    }
  };
  
  // Update visibility and save to Firebase
  const handleSetVisibility = (visible: boolean) => {
    setVisibility(visible);
    
    // TODO: Save to Firebase in the integration step
    if (user) {
      console.log('Saving visibility for user:', user.uid);
    }
  };
  
  // Context value
  const value = {
    expertiseLevel,
    guidanceMode,
    isVisible,
    memory,
    explainedConcepts,
    addMemoryItem,
    addExplainedConcept,
    setExpertiseLevel: handleSetExpertiseLevel,
    setGuidanceMode: handleSetGuidanceMode,
    setVisibility: handleSetVisibility,
    presenceLog,
    logPresence,
  };
  
  return (
    <ObserverContext.Provider value={value}>
      {children}
    </ObserverContext.Provider>
  );
};

export default ObserverContext;
