import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hovering Observer Context
 * 
 * Manages the global state of the intelligent hovering Observer,
 * including visibility, proactive suggestions, user progress tracking,
 * and Firebase persistence for conversation history and learning.
 */

interface ObserverMessage {
  id: string;
  type: 'user' | 'observer';
  content: string;
  timestamp: Date;
  context?: {
    page: string;
    userAction?: string;
    milestone?: string;
  };
}

interface ObserverLearning {
  userPreferences: {
    helpfulnessLevel: 'minimal' | 'moderate' | 'detailed';
    preferredTopics: string[];
    dismissedSuggestions: string[];
  };
  interactionHistory: {
    totalInteractions: number;
    lastInteraction: Date;
    averageSessionLength: number;
    mostHelpfulTopics: string[];
  };
  contextualKnowledge: {
    userExpertiseLevel: 'beginner' | 'intermediate' | 'expert';
    completedMilestones: string[];
    strugglingAreas: string[];
    preferredLearningStyle: 'visual' | 'textual' | 'interactive';
  };
}

interface HoveringObserverContextType {
  isVisible: boolean;
  showObserver: () => void;
  hideObserver: () => void;
  toggleObserver: () => void;
  triggerProactiveSuggestion: (suggestion: string) => void;
  markMilestone: (milestone: string) => void;
  sendMessage: (message: string) => Promise<string>;
  conversationHistory: ObserverMessage[];
  observerLearning: ObserverLearning;
  userProgress: {
    onboardingComplete: boolean;
    firstAgentCreated: boolean;
    firstTeamCreated: boolean;
    governanceToggled: boolean;
    deploymentGenerated: boolean;
  };
  isLoading: boolean;
}

const HoveringObserverContext = createContext<HoveringObserverContextType | undefined>(undefined);

export const useHoveringObserver = () => {
  const context = useContext(HoveringObserverContext);
  if (!context) {
    throw new Error('useHoveringObserver must be used within a HoveringObserverProvider');
  }
  return context;
};

interface HoveringObserverProviderProps {
  children: React.ReactNode;
}

export const HoveringObserverProvider: React.FC<HoveringObserverProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ObserverMessage[]>([]);
  const [observerLearning, setObserverLearning] = useState<ObserverLearning>({
    userPreferences: {
      helpfulnessLevel: 'moderate',
      preferredTopics: [],
      dismissedSuggestions: [],
    },
    interactionHistory: {
      totalInteractions: 0,
      lastInteraction: new Date(),
      averageSessionLength: 0,
      mostHelpfulTopics: [],
    },
    contextualKnowledge: {
      userExpertiseLevel: 'beginner',
      completedMilestones: [],
      strugglingAreas: [],
      preferredLearningStyle: 'interactive',
    },
  });
  const [userProgress, setUserProgress] = useState({
    onboardingComplete: false,
    firstAgentCreated: false,
    firstTeamCreated: false,
    governanceToggled: false,
    deploymentGenerated: false,
  });

  // Load observer data from Firebase when user logs in
  useEffect(() => {
    if (user?.uid) {
      loadObserverData();
    }
  }, [user?.uid]);

  const loadObserverData = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);

      // Load observer learning data
      const learningDoc = await getDoc(doc(db, 'observerLearning', user.uid));
      if (learningDoc.exists()) {
        setObserverLearning(learningDoc.data() as ObserverLearning);
      }

      // Load user progress
      const progressDoc = await getDoc(doc(db, 'userProgress', user.uid));
      if (progressDoc.exists()) {
        setUserProgress(progressDoc.data() as any);
      }

      // Load recent conversation history
      const conversationsQuery = query(
        collection(db, 'observerConversations', user.uid, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const messages = conversationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as ObserverMessage[];
      
      setConversationHistory(messages.reverse()); // Show oldest first
    } catch (error) {
      console.error('Failed to load observer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveObserverLearning = async (learning: ObserverLearning) => {
    if (!user?.uid) return;

    try {
      await setDoc(doc(db, 'observerLearning', user.uid), {
        ...learning,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save observer learning:', error);
    }
  };

  const saveUserProgress = async (progress: any) => {
    if (!user?.uid) return;

    try {
      await setDoc(doc(db, 'userProgress', user.uid), {
        ...progress,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save user progress:', error);
    }
  };

  const saveMessage = async (message: ObserverMessage) => {
    if (!user?.uid) return;

    try {
      await addDoc(collection(db, 'observerConversations', user.uid, 'messages'), {
        ...message,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const sendMessage = async (userMessage: string): Promise<string> => {
    if (!user?.uid) return "Please log in to chat with the Observer.";

    try {
      setIsLoading(true);

      // Add user message to history
      const userMsg: ObserverMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
        context: {
          page: window.location.pathname,
        },
      };
      
      setConversationHistory(prev => [...prev, userMsg]);
      await saveMessage(userMsg);

      // Generate Observer response (this would call your OpenAI API)
      const response = await generateObserverResponse(userMessage, observerLearning, userProgress);

      // Add Observer response to history
      const observerMsg: ObserverMessage = {
        id: (Date.now() + 1).toString(),
        type: 'observer',
        content: response,
        timestamp: new Date(),
        context: {
          page: window.location.pathname,
        },
      };

      setConversationHistory(prev => [...prev, observerMsg]);
      await saveMessage(observerMsg);

      // Update interaction history
      const updatedLearning = {
        ...observerLearning,
        interactionHistory: {
          ...observerLearning.interactionHistory,
          totalInteractions: observerLearning.interactionHistory.totalInteractions + 1,
          lastInteraction: new Date(),
        },
      };
      setObserverLearning(updatedLearning);
      await saveObserverLearning(updatedLearning);

      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      return "I'm having trouble responding right now. Please try again.";
    } finally {
      setIsLoading(false);
    }
  };

  const generateObserverResponse = async (
    userMessage: string, 
    learning: ObserverLearning, 
    progress: any
  ): Promise<string> => {
    // This would call your OpenAI API with context about the user's learning and progress
    // For now, return a contextual mock response
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('/dashboard')) {
      return "I can see you're on the dashboard! This shows your governance overview. Would you like me to explain any of the metrics you're seeing?";
    } else if (currentPage.includes('/agents')) {
      return "Great! You're exploring agent management. This is where you can create and manage your governed agents. Need help getting started?";
    } else if (currentPage.includes('/governance')) {
      return "You're in the governance section - the heart of Promethios! This is where you can test how governance affects your agents. Want to try the toggle feature?";
    } else {
      return `I understand you're asking about "${userMessage}". Based on your progress, I think you'd benefit from exploring the governance toggle feature. It really shows the power of AI governance!`;
    }
  };

  // Auto-show Observer during onboarding
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/onboarding') && !userProgress.onboardingComplete) {
      setIsVisible(true);
    }
  }, [userProgress.onboardingComplete]);

  const showObserver = () => setIsVisible(true);
  const hideObserver = () => setIsVisible(false);
  const toggleObserver = () => setIsVisible(!isVisible);

  const triggerProactiveSuggestion = (suggestion: string) => {
    // Add proactive suggestion to conversation
    const proactiveMsg: ObserverMessage = {
      id: Date.now().toString(),
      type: 'observer',
      content: suggestion,
      timestamp: new Date(),
      context: {
        page: window.location.pathname,
        userAction: 'proactive_suggestion',
      },
    };
    
    setConversationHistory(prev => [...prev, proactiveMsg]);
    if (user?.uid) {
      saveMessage(proactiveMsg);
    }
    showObserver();
  };

  const markMilestone = async (milestone: string) => {
    const updatedProgress = {
      ...userProgress,
      [milestone]: true
    };
    setUserProgress(updatedProgress);
    
    if (user?.uid) {
      await saveUserProgress(updatedProgress);
    }

    // Update learning data
    const updatedLearning = {
      ...observerLearning,
      contextualKnowledge: {
        ...observerLearning.contextualKnowledge,
        completedMilestones: [...observerLearning.contextualKnowledge.completedMilestones, milestone],
      },
    };
    setObserverLearning(updatedLearning);
    
    if (user?.uid) {
      await saveObserverLearning(updatedLearning);
    }
    
    // Trigger celebration or guidance based on milestone
    if (milestone === 'firstAgentCreated') {
      triggerProactiveSuggestion("🎉 Congratulations on creating your first governed agent! You've unlocked team management. Want to learn about creating multi-agent teams next?");
    } else if (milestone === 'governanceToggled') {
      triggerProactiveSuggestion("🛡️ Excellent! You just experienced the power of governance firsthand. You earned +5 Trust Insight points for seeing the difference. Ready to explore team governance?");
    } else if (milestone === 'firstTeamCreated') {
      triggerProactiveSuggestion("🚀 Amazing! Your first team is ready. Now you can test how governance affects multi-agent collaboration. Want to try a team workflow?");
    }
  };

  const value = {
    isVisible,
    showObserver,
    hideObserver,
    toggleObserver,
    triggerProactiveSuggestion,
    markMilestone,
    sendMessage,
    conversationHistory,
    observerLearning,
    userProgress,
    isLoading,
  };

  return (
    <HoveringObserverContext.Provider value={value}>
      {children}
    </HoveringObserverContext.Provider>
  );
};

export default HoveringObserverProvider;

