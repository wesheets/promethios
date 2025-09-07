/**
 * Chat Mode Detector
 * Automatically detects chat context and provides appropriate UI mode
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useModernChatFeature } from '../../config/modernChatConfig';

export type ChatMode = 'single-chat' | 'multi-agent' | 'shared-conversation';

export interface Participant {
  id: string;
  name: string;
  type: 'human' | 'ai';
  isActive: boolean;
  role?: string;
  color?: string;
}

export interface ChatModeContextValue {
  mode: ChatMode;
  participants: Participant[];
  features: {
    threading: boolean;
    dragDropInjection: boolean;
    participantManagement: boolean;
    conversationOrchestration: boolean;
    realTimeIndicators: boolean;
    governanceUI: boolean;
    insightsPanel: boolean;
  };
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
}

const ChatModeContext = createContext<ChatModeContextValue | null>(null);

interface ChatModeDetectorProps {
  children: React.ReactNode;
  initialParticipants?: Participant[];
  onModeChange?: (mode: ChatMode) => void;
}

export const ChatModeDetector: React.FC<ChatModeDetectorProps> = ({
  children,
  initialParticipants = [],
  onModeChange
}) => {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [mode, setMode] = useState<ChatMode>('single-chat');
  
  // Feature flags
  const enhancedMessagesEnabled = useModernChatFeature('enhanced-message-wrapper');
  
  // Detect chat mode based on participants
  const detectChatMode = (participantList: Participant[]): ChatMode => {
    const humans = participantList.filter(p => p.type === 'human');
    const agents = participantList.filter(p => p.type === 'ai');
    
    if (humans.length === 1 && agents.length === 1) {
      return 'single-chat';
    }
    
    if (humans.length === 1 && agents.length > 1) {
      return 'multi-agent';
    }
    
    if (humans.length > 1) {
      return 'shared-conversation';
    }
    
    return 'single-chat'; // Default fallback
  };
  
  // Get features based on current mode
  const getFeatures = (currentMode: ChatMode) => {
    const baseFeatures = {
      threading: false,
      dragDropInjection: false,
      participantManagement: false,
      conversationOrchestration: false,
      realTimeIndicators: false,
      governanceUI: false,
      insightsPanel: false
    };
    
    if (!enhancedMessagesEnabled) {
      return baseFeatures;
    }
    
    switch (currentMode) {
      case 'single-chat':
        return {
          ...baseFeatures,
          // Keep it minimal for single chat
        };
        
      case 'multi-agent':
        return {
          ...baseFeatures,
          threading: true,
          dragDropInjection: true,
          participantManagement: true,
          conversationOrchestration: true,
          insightsPanel: true
        };
        
      case 'shared-conversation':
        return {
          ...baseFeatures,
          threading: true,
          dragDropInjection: true,
          participantManagement: true,
          realTimeIndicators: true,
          governanceUI: true,
          insightsPanel: true
        };
        
      default:
        return baseFeatures;
    }
  };
  
  // Update mode when participants change
  useEffect(() => {
    const newMode = detectChatMode(participants);
    if (newMode !== mode) {
      setMode(newMode);
      onModeChange?.(newMode);
      
      console.log(`🎯 [ChatModeDetector] Mode changed: ${mode} → ${newMode}`, {
        participants: participants.length,
        humans: participants.filter(p => p.type === 'human').length,
        agents: participants.filter(p => p.type === 'ai').length
      });
    }
  }, [participants, mode, onModeChange]);
  
  // Participant management functions
  const addParticipant = (participant: Participant) => {
    setParticipants(prev => {
      // Avoid duplicates
      if (prev.find(p => p.id === participant.id)) {
        return prev;
      }
      
      const newParticipants = [...prev, participant];
      console.log(`👥 [ChatModeDetector] Added participant: ${participant.name} (${participant.type})`);
      return newParticipants;
    });
  };
  
  const removeParticipant = (participantId: string) => {
    setParticipants(prev => {
      const participant = prev.find(p => p.id === participantId);
      if (participant) {
        console.log(`👥 [ChatModeDetector] Removed participant: ${participant.name} (${participant.type})`);
      }
      return prev.filter(p => p.id !== participantId);
    });
  };
  
  const updateParticipant = (participantId: string, updates: Partial<Participant>) => {
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId 
          ? { ...p, ...updates }
          : p
      )
    );
  };
  
  const contextValue: ChatModeContextValue = {
    mode,
    participants,
    features: getFeatures(mode),
    addParticipant,
    removeParticipant,
    updateParticipant
  };
  
  return (
    <ChatModeContext.Provider value={contextValue}>
      {children}
    </ChatModeContext.Provider>
  );
};

// Hook to use chat mode context
export const useChatMode = (): ChatModeContextValue => {
  const context = useContext(ChatModeContext);
  if (!context) {
    throw new Error('useChatMode must be used within a ChatModeDetector');
  }
  return context;
};

// Utility hooks for specific mode checks
export const useIsSingleChat = (): boolean => {
  const { mode } = useChatMode();
  return mode === 'single-chat';
};

export const useIsMultiAgent = (): boolean => {
  const { mode } = useChatMode();
  return mode === 'multi-agent';
};

export const useIsSharedConversation = (): boolean => {
  const { mode } = useChatMode();
  return mode === 'shared-conversation';
};

// Feature-specific hooks
export const useThreadingEnabled = (): boolean => {
  const { features } = useChatMode();
  return features.threading;
};

export const useDragDropEnabled = (): boolean => {
  const { features } = useChatMode();
  return features.dragDropInjection;
};

export const useOrchestrationEnabled = (): boolean => {
  const { features } = useChatMode();
  return features.conversationOrchestration;
};

export const useGovernanceEnabled = (): boolean => {
  const { features } = useChatMode();
  return features.governanceUI;
};

export default ChatModeDetector;

