import React, { createContext, useContext, ReactNode } from 'react';
import { useUnifiedChat } from '../hooks/useUnifiedChat';
import { UnifiedChatHookReturn } from '../hooks/useUnifiedChat';

interface UnifiedChatContextType {
  unifiedChat: UnifiedChatHookReturn;
}

const UnifiedChatContext = createContext<UnifiedChatContextType | null>(null);

interface UnifiedChatProviderProps {
  children: ReactNode;
  sessionId?: string;
  agentId?: string;
}

export const UnifiedChatProvider: React.FC<UnifiedChatProviderProps> = ({
  children,
  sessionId,
  agentId
}) => {
  console.log('🏗️ [UnifiedChatProvider] Creating provider with sessionId:', sessionId, 'agentId:', agentId);
  
  const unifiedChat = useUnifiedChat(sessionId, agentId);
  
  console.log('🏗️ [UnifiedChatProvider] Hook state:', {
    isInitialized: unifiedChat.isInitialized,
    hasManager: unifiedChat.hasManager,
    instanceId: unifiedChat.instanceId
  });

  return (
    <UnifiedChatContext.Provider value={{ unifiedChat }}>
      {children}
    </UnifiedChatContext.Provider>
  );
};

export const useUnifiedChatContext = (): UnifiedChatContextType => {
  const context = useContext(UnifiedChatContext);
  if (!context) {
    throw new Error('useUnifiedChatContext must be used within a UnifiedChatProvider');
  }
  
  console.log('🔍 [useUnifiedChatContext] Returning context with state:', {
    isInitialized: context.unifiedChat.isInitialized,
    hasManager: context.unifiedChat.hasManager,
    instanceId: context.unifiedChat.instanceId
  });
  
  return context;
};

