import React, { createContext, useContext, useState, useCallback } from 'react';
import ChatWindowManager from './ChatWindowManager';
import FixedBottomChat from './FixedBottomChat';

interface BottomChatWindow {
  id: string;
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
}

interface ChatIntegrationContextType {
  isDirectMessageOpen: boolean;
  activeConversationId: string | null;
  bottomChats: BottomChatWindow[];
  openDirectMessage: (userId: string, userName: string) => void;
  closeDirectMessage: () => void;
  openBottomChat: (userId: string, userName: string, userAvatar?: string) => void;
  closeBottomChat: (chatId: string) => void;
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
  const [bottomChats, setBottomChats] = useState<BottomChatWindow[]>([]);

  // Open bottom chat function
  const openBottomChat = useCallback((userId: string, userName: string, userAvatar?: string) => {
    console.log('💬 [SimpleChatProvider] Opening bottom chat with:', userName, '(ID:', userId, ')');
    
    // Check if chat already exists
    const existingChat = bottomChats.find(chat => chat.participantId === userId);
    if (existingChat) {
      console.log('💬 [SimpleChatProvider] Chat already exists for:', userName);
      return; // Chat already open, no need to create another
    }

    // Create new bottom chat
    const newChat: BottomChatWindow = {
      id: `chat-${userId}-${Date.now()}`,
      conversationId: `conv-${currentUserId}-${userId}`,
      participantId: userId,
      participantName: userName,
      participantAvatar: userAvatar,
    };

    setBottomChats(prev => [...prev, newChat]);
    console.log('✅ [SimpleChatProvider] Created bottom chat:', newChat.id);
  }, [bottomChats, currentUserId]);

  // Close bottom chat function
  const closeBottomChat = useCallback((chatId: string) => {
    console.log('🗑️ [SimpleChatProvider] Closing bottom chat:', chatId);
    setBottomChats(prev => prev.filter(chat => chat.id !== chatId));
  }, []);

  // Open direct message (full-screen chat)
  const openDirectMessage = useCallback((userId: string, userName: string) => {
    console.log('💬 [SimpleChatProvider] Opening direct message with:', userName);
    setActiveConversationId(`conv-${currentUserId}-${userId}`);
    setIsDirectMessageOpen(true);
  }, [currentUserId]);

  // Close direct message
  const closeDirectMessage = useCallback(() => {
    console.log('🗑️ [SimpleChatProvider] Closing direct message');
    setIsDirectMessageOpen(false);
    setActiveConversationId(null);
  }, []);

  // Video/Voice call functions (placeholder)
  const startVideoCall = useCallback((userId: string) => {
    console.log('📹 [SimpleChatProvider] Starting video call with:', userId);
    // TODO: Implement video call functionality
  }, []);

  const startVoiceCall = useCallback((userId: string) => {
    console.log('📞 [SimpleChatProvider] Starting voice call with:', userId);
    // TODO: Implement voice call functionality
  }, []);

  const contextValue: ChatIntegrationContextType = {
    isDirectMessageOpen,
    activeConversationId,
    bottomChats,
    openDirectMessage,
    closeDirectMessage,
    openBottomChat,
    closeBottomChat,
    startVideoCall,
    startVoiceCall,
  };

  console.log('🔍 [SimpleChatProvider] Rendering with', bottomChats.length, 'bottom chats');

  return (
    <ChatIntegrationContext.Provider value={contextValue}>
      {children}
      
      {/* Full-screen Chat Window Manager */}
      <ChatWindowManager />
      
      {/* Bottom Chat Windows */}
      {bottomChats.map((chat, index) => (
        <FixedBottomChat
          key={chat.id}
          participantId={chat.participantId}
          participantName={chat.participantName}
          participantAvatar={chat.participantAvatar}
          position={index}
          onClose={() => closeBottomChat(chat.id)}
        />
      ))}
    </ChatIntegrationContext.Provider>
  );
};

export default ChatIntegrationProvider;

