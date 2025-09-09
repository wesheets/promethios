import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useUnifiedChat, UseUnifiedChatReturn } from '../hooks/useUnifiedChat';
import { useAuth } from '../context/AuthContext';

interface UnifiedChatContextType {
  unifiedChat: UseUnifiedChatReturn;
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
  
  const { currentUser: user, loading: authLoading } = useAuth();
  const unifiedChat = useUnifiedChat({
    sessionId,
    agentId,
    autoInitialize: false // We'll initialize manually when user is available
  });
  
  // Initialize the hook when user becomes available
  useEffect(() => {
    if (user && !authLoading && !unifiedChat.isInitialized) {
      console.log('🔄 [UnifiedChatProvider] Initializing unified chat with user:', user.uid);
      unifiedChat.initialize(user).catch(error => {
        console.error('❌ [UnifiedChatProvider] Failed to initialize unified chat:', error);
      });
    }
  }, [user, authLoading, unifiedChat.isInitialized, unifiedChat.initialize]);
  
  console.log('🏗️ [UnifiedChatProvider] Hook state:', {
    isInitialized: unifiedChat.isInitialized,
    hasManager: unifiedChat.hasManager,
    isEnabled: unifiedChat.isEnabled,
    user: user?.uid,
    authLoading
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
    isEnabled: context.unifiedChat.isEnabled
  });
  
  return context;
};

