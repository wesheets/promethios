import React, { createContext, useContext, useState, useCallback } from 'react';
import DirectMessageSidebar from './DirectMessageSidebar';

interface ChatIntegrationContextType {
  isDirectMessageOpen: boolean;
  activeConversationId: string | null;
  openDirectMessage: (userId: string, userName: string) => void;
  closeDirectMessage: () => void;
  startVideoCall: (userId: string) => void;
  startVoiceCall: (userId: string) => void;
}

const ChatIntegrationContext = createContext<ChatIntegrationContextType | undefined>(undefined);

export const useChatIntegration = () => {
  const context = useContext(ChatIntegrationContext);
  if (!context) {
    throw new Error('useChatIntegration must be used within a ChatIntegrationProvider');
  }
  return context;
};

interface ChatIntegrationProviderProps {
  children: React.ReactNode;
  currentUserId?: string;
}

const ChatIntegrationProvider: React.FC<ChatIntegrationProviderProps> = ({
  children,
  currentUserId = 'current-user',
}) => {
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [pendingConversation, setPendingConversation] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  const openDirectMessage = useCallback((userId: string, userName: string) => {
    console.log('🔥 Opening direct message with:', userName, '(ID:', userId, ')');
    
    // Store the conversation details
    setPendingConversation({ userId, userName });
    
    // Open the sidebar
    setIsDirectMessageOpen(true);
    
    // Set active conversation (you might want to find existing conversation or create new one)
    // For now, we'll use the userId as conversation ID
    setActiveConversationId(userId);
  }, []);

  const closeDirectMessage = useCallback(() => {
    console.log('🔥 Closing direct message sidebar');
    setIsDirectMessageOpen(false);
    setActiveConversationId(null);
    setPendingConversation(null);
  }, []);

  const startVideoCall = useCallback((userId: string) => {
    console.log('🎥 Starting video call with user:', userId);
    // Implement video call logic here
    // This could integrate with WebRTC, Zoom, Teams, etc.
    alert(`Starting video call with user ${userId}`);
  }, []);

  const startVoiceCall = useCallback((userId: string) => {
    console.log('📞 Starting voice call with user:', userId);
    // Implement voice call logic here
    // This could integrate with WebRTC, phone systems, etc.
    alert(`Starting voice call with user ${userId}`);
  }, []);

  const contextValue: ChatIntegrationContextType = {
    isDirectMessageOpen,
    activeConversationId,
    openDirectMessage,
    closeDirectMessage,
    startVideoCall,
    startVoiceCall,
  };

  return (
    <ChatIntegrationContext.Provider value={contextValue}>
      {children}
      
      {/* Direct Message Sidebar */}
      <DirectMessageSidebar
        isOpen={isDirectMessageOpen}
        onClose={closeDirectMessage}
        initialConversationId={activeConversationId}
        currentUserId={currentUserId}
        onStartVideoCall={startVideoCall}
        onStartVoiceCall={startVoiceCall}
      />
    </ChatIntegrationContext.Provider>
  );
};

export default ChatIntegrationProvider;

