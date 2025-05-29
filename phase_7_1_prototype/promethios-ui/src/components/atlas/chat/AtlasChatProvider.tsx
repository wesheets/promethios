/**
 * AtlasChatProvider.tsx
 * 
 * Provider component that manages ATLAS chat context and integration with agent sessions.
 * This component serves as the bridge between the chat components and the application.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AtlasChatPublic from './AtlasChatPublic';
import AtlasChatSession from './AtlasChatSession';

// Define the context shape
interface AtlasChatContextType {
  isLoggedIn: boolean;
  currentAgentId?: string;
  currentSessionId?: string;
  username?: string;
  agentType?: 'assistant' | 'researcher' | 'creative';
  showChat: boolean;
  toggleChat: () => void;
  setAgentSession: (agentId: string, sessionId: string, agentType?: 'assistant' | 'researcher' | 'creative') => void;
  clearAgentSession: () => void;
}

// Create the context with default values
const AtlasChatContext = createContext<AtlasChatContextType>({
  isLoggedIn: false,
  showChat: true,
  toggleChat: () => {},
  setAgentSession: () => {},
  clearAgentSession: () => {}
});

// Hook for components to access the ATLAS chat context
export const useAtlasChat = () => useContext(AtlasChatContext);

interface AtlasChatProviderProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  username?: string;
  initialAgentId?: string;
  initialSessionId?: string;
  initialAgentType?: 'assistant' | 'researcher' | 'creative';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  initialOpen?: boolean;
}

export const AtlasChatProvider: React.FC<AtlasChatProviderProps> = ({
  children,
  isLoggedIn = false,
  username,
  initialAgentId,
  initialSessionId,
  initialAgentType = 'assistant',
  position = 'bottom-right',
  theme = 'dark',
  initialOpen = false
}) => {
  const [showChat, setShowChat] = useState(true);
  const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(initialAgentId);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId);
  const [agentType, setAgentType] = useState<'assistant' | 'researcher' | 'creative'>(initialAgentType);
  const [isOpen, setIsOpen] = useState(initialOpen);
  
  // Toggle chat visibility
  const toggleChat = () => {
    setShowChat(prev => !prev);
  };
  
  // Set current agent session
  const setAgentSession = (
    agentId: string, 
    sessionId: string, 
    type: 'assistant' | 'researcher' | 'creative' = 'assistant'
  ) => {
    setCurrentAgentId(agentId);
    setCurrentSessionId(sessionId);
    setAgentType(type);
  };
  
  // Clear current agent session
  const clearAgentSession = () => {
    setCurrentAgentId(undefined);
    setCurrentSessionId(undefined);
  };
  
  // Context value
  const contextValue: AtlasChatContextType = {
    isLoggedIn,
    currentAgentId,
    currentSessionId,
    username,
    agentType,
    showChat,
    toggleChat,
    setAgentSession,
    clearAgentSession
  };
  
  return (
    <AtlasChatContext.Provider value={contextValue}>
      {children}
      
      {/* Render the appropriate chat component based on login state */}
      {showChat && (
        isLoggedIn && currentAgentId && currentSessionId ? (
          <AtlasChatSession
            agentId={currentAgentId}
            sessionId={currentSessionId}
            agentType={agentType}
            position={position}
            theme={theme}
            initialOpen={isOpen}
            username={username}
          />
        ) : (
          <AtlasChatPublic
            position={position}
            theme={theme}
            initialOpen={isOpen}
          />
        )
      )}
    </AtlasChatContext.Provider>
  );
};

export default AtlasChatProvider;
