import React, { useEffect } from 'react';
import { useObserver } from '../components/observer/ObserverContext';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Firebase service for Observer data
export const ObserverFirebaseService = {
  // Save Observer preferences to Firebase
  saveObserverPreferences: async (
    userId: string, 
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced',
    guidanceMode: 'proactive' | 'reactive',
    isVisible: boolean
  ) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      // Get current user data
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update Observer preferences
        await updateDoc(userDocRef, {
          'observerPreferences.expertiseLevel': expertiseLevel,
          'observerPreferences.guidanceMode': guidanceMode,
          'observerPreferences.isVisible': isVisible
        });
      }
    } catch (error) {
      console.error('Error saving Observer preferences:', error);
      throw error;
    }
  },
  
  // Save Observer memory item to Firebase
  saveMemoryItem: async (userId: string, action: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const memoryItemsRef = doc(db, 'users', userId, 'observerMemory', 'items');
      
      // Get current memory items
      const memoryItemsDoc = await getDoc(memoryItemsRef);
      
      const newItem = {
        timestamp: Date.now(),
        action
      };
      
      if (memoryItemsDoc.exists()) {
        // Update memory items
        const items = memoryItemsDoc.data().items || [];
        await updateDoc(memoryItemsRef, {
          items: [...items, newItem]
        });
      } else {
        // Create memory items document
        await setDoc(memoryItemsRef, {
          items: [newItem]
        });
      }
    } catch (error) {
      console.error('Error saving memory item:', error);
      throw error;
    }
  },
  
  // Save explained concept to Firebase
  saveExplainedConcept: async (userId: string, concept: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const conceptsRef = doc(db, 'users', userId, 'observerMemory', 'concepts');
      
      // Get current concepts
      const conceptsDoc = await getDoc(conceptsRef);
      
      if (conceptsDoc.exists()) {
        // Update concepts
        const concepts = conceptsDoc.data().concepts || [];
        if (!concepts.includes(concept)) {
          await updateDoc(conceptsRef, {
            concepts: [...concepts, concept]
          });
        }
      } else {
        // Create concepts document
        await setDoc(conceptsRef, {
          concepts: [concept]
        });
      }
    } catch (error) {
      console.error('Error saving explained concept:', error);
      throw error;
    }
  },
  
  // Save Observer presence log to Firebase
  savePresenceLog: async (userId: string, page: string, active: boolean, reason?: string) => {
    try {
      const presenceLogRef = doc(db, 'users', userId, 'observerMemory', 'presenceLog');
      
      // Get current presence log
      const presenceLogDoc = await getDoc(presenceLogRef);
      
      const newLog = {
        timestamp: Date.now(),
        page,
        active,
        reason
      };
      
      if (presenceLogDoc.exists()) {
        // Update presence log
        const logs = presenceLogDoc.data().logs || [];
        await updateDoc(presenceLogRef, {
          logs: [...logs, newLog]
        });
      } else {
        // Create presence log document
        await setDoc(presenceLogRef, {
          logs: [newLog]
        });
      }
    } catch (error) {
      console.error('Error saving presence log:', error);
      throw error;
    }
  },
  
  // Load Observer data from Firebase
  loadObserverData: async (userId: string) => {
    try {
      // Get user document
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      // Get memory items
      const memoryItemsDoc = await getDoc(doc(db, 'users', userId, 'observerMemory', 'items'));
      
      // Get explained concepts
      const conceptsDoc = await getDoc(doc(db, 'users', userId, 'observerMemory', 'concepts'));
      
      // Get presence log
      const presenceLogDoc = await getDoc(doc(db, 'users', userId, 'observerMemory', 'presenceLog'));
      
      return {
        preferences: userDoc.exists() ? userDoc.data().observerPreferences : null,
        memory: memoryItemsDoc.exists() ? memoryItemsDoc.data().items : [],
        explainedConcepts: conceptsDoc.exists() ? conceptsDoc.data().concepts : [],
        presenceLog: presenceLogDoc.exists() ? presenceLogDoc.data().logs : []
      };
    } catch (error) {
      console.error('Error loading Observer data:', error);
      throw error;
    }
  }
};

// Hook to sync Observer with Firebase
export const useObserverFirebaseSync = () => {
  const { user } = useAuth();
  const { 
    expertiseLevel, 
    guidanceMode, 
    isVisible, 
    memory, 
    explainedConcepts,
    presenceLog,
    setExpertiseLevel,
    setGuidanceMode,
    setVisibility,
    setMemory,
    setExplainedConcepts,
    setPresenceLog
  } = useObserver();
  
  // Load Observer data from Firebase on mount
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const data = await ObserverFirebaseService.loadObserverData(user.uid);
          
          // Set Observer preferences
          if (data.preferences) {
            setExpertiseLevel(data.preferences.expertiseLevel || 'beginner');
            setGuidanceMode(data.preferences.guidanceMode || 'proactive');
            setVisibility(data.preferences.isVisible !== undefined ? data.preferences.isVisible : true);
          }
          
          // Set memory items
          if (data.memory) {
            setMemory(data.memory);
          }
          
          // Set explained concepts
          if (data.explainedConcepts) {
            setExplainedConcepts(data.explainedConcepts);
          }
          
          // Set presence log
          if (data.presenceLog) {
            setPresenceLog(data.presenceLog);
          }
        } catch (error) {
          console.error('Error loading Observer data:', error);
        }
      };
      
      loadData();
    }
  }, [user]);
  
  // Save Observer preferences to Firebase when they change
  useEffect(() => {
    if (user) {
      ObserverFirebaseService.saveObserverPreferences(
        user.uid,
        expertiseLevel,
        guidanceMode,
        isVisible
      );
    }
  }, [user, expertiseLevel, guidanceMode, isVisible]);
  
  // Return sync functions for manual syncing
  return {
    syncMemoryItem: (action: string) => {
      if (user) {
        ObserverFirebaseService.saveMemoryItem(user.uid, action);
      }
    },
    syncExplainedConcept: (concept: string) => {
      if (user) {
        ObserverFirebaseService.saveExplainedConcept(user.uid, concept);
      }
    },
    syncPresenceLog: (page: string, active: boolean, reason?: string) => {
      if (user) {
        ObserverFirebaseService.savePresenceLog(user.uid, page, active, reason);
      }
    }
  };
};

export default ObserverFirebaseService;
