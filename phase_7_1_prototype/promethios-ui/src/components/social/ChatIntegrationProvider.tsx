import React, { createContext, useContext, useState, useCallback } from 'react';
import ChatWindowManager from './ChatWindowManager';
import LightweightFloatingChat from './LightweightFloatingChat';

interface FloatingChatWindow {
  id: string;
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  position: { x: number; y: number };
  isMinimized: boolean;
}

interface ChatIntegrationContextType {
  isDirectMessageOpen: boolean;
  activeConversationId: string | null;
  floatingChats: FloatingChatWindow[];
  openDirectMessage: (userId: string, userName: string) => void;
  closeDirectMessage: () => void;
  openLightweightChat: (userId: string, userName: string, userAvatar?: string) => void;
  closeLightweightChat: (chatId: string) => void;
  minimizeLightweightChat: (chatId: string) => void;
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
  const [floatingChats, setFloatingChats] = useState<FloatingChatWindow[]>([]);
  const [pendingConversation, setPendingConversation] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  // Generate next position for new floating chat windows
  const getNextPosition = () => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const chatWidth = 320;
    const chatHeight = 400;
    
    // Position in upper-right area, but ensure it's visible
    const baseX = Math.max(50, viewportWidth - chatWidth - 50); // 50px margin from right edge
    const baseY = 100; // 100px from top
    const offset = floatingChats.length * 30; // Cascade multiple chats
    
    // Calculate final position with bounds checking
    let finalX = baseX - offset;
    let finalY = baseY + offset;
    
    // Ensure chat stays within viewport bounds
    finalX = Math.max(10, Math.min(finalX, viewportWidth - chatWidth - 10));
    finalY = Math.max(10, Math.min(finalY, viewportHeight - chatHeight - 10));
    
    console.log('📍 [ChatIntegrationProvider] Calculating position:', { 
      x: finalX, 
      y: finalY,
      viewport: { width: viewportWidth, height: viewportHeight },
      chatDimensions: { width: chatWidth, height: chatHeight },
      offset: offset,
      basePosition: { x: baseX, y: baseY }
    });
    return { x: finalX, y: finalY };
  };

  const openLightweightChat = useCallback((userId: string, userName: string, userAvatar?: string) => {
    console.log('💬 [ChatIntegrationProvider] Opening lightweight chat with:', userName, '(ID:', userId, ')');
    
    // Check if chat already exists
    const existingChat = floatingChats.find(chat => chat.participantId === userId);
    if (existingChat) {
      console.log('💬 [ChatIntegrationProvider] Chat already exists, bringing to front');
      // TODO: Bring existing chat to front
      return;
    }

    // Create new floating chat
    const newChat: FloatingChatWindow = {
      id: `chat-${userId}-${Date.now()}`,
      conversationId: `conv-${currentUserId}-${userId}`, // Shared conversation ID
      participantId: userId,
      participantName: userName,
      participantAvatar: userAvatar,
      position: getNextPosition(),
      isMinimized: false
    };

    setFloatingChats(prev => [...prev, newChat]);
  }, [floatingChats, currentUserId]);

  const closeLightweightChat = useCallback((chatId: string) => {
    console.log('💬 [ChatIntegrationProvider] Closing lightweight chat:', chatId);
    setFloatingChats(prev => prev.filter(chat => chat.id !== chatId));
  }, []);

  const minimizeLightweightChat = useCallback((chatId: string) => {
    console.log('💬 [ChatIntegrationProvider] Minimizing lightweight chat:', chatId);
    setFloatingChats(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, isMinimized: true } : chat
      )
    );
  }, []);

  const updateChatPosition = useCallback((chatId: string, position: { x: number; y: number }) => {
    setFloatingChats(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, position } : chat
      )
    );
  }, []);

  const openDirectMessage = useCallback((userId: string, userName: string) => {
    console.log('🔥 Opening direct message with:', userName, '(ID:', userId, ')');
    
    // Store the conversation details
    setPendingConversation({ userId, userName });
    
    // Open the sidebar
    setIsDirectMessageOpen(true);
    
    // Set active conversation (you might want to find existing conversation or create new one)
    // For now, we'll use the userId as conversation ID
    setActiveConversationId(userId);
    
    // Open floating chat window via ChatWindowManager
    if ((window as any).openFloatingChat) {
      console.log('🎯 [ChatIntegrationProvider] Calling openFloatingChat for:', userName);
      (window as any).openFloatingChat({
        participantId: userId,
        participantName: userName,
        conversationId: `conv-${userId}-${Date.now()}`
      });
    } else {
      console.error('❌ [ChatIntegrationProvider] openFloatingChat not available on window');
    }
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
    floatingChats,
    openDirectMessage,
    closeDirectMessage,
    openLightweightChat,
    closeLightweightChat,
    minimizeLightweightChat,
    startVideoCall,
    startVoiceCall,
  };

  return (
    <ChatIntegrationContext.Provider value={contextValue}>
      {children}
      
      {/* Floating Chat Window Manager */}
      <ChatWindowManager />
      
      {/* Debug: Log floating chats state */}
      {console.log('🔍 [ChatIntegrationProvider] Rendering floating chats:', floatingChats.length, 'total chats')}
      {floatingChats.forEach((chat, index) => {
        console.log(`🔍 [ChatIntegrationProvider] Chat ${index}:`, {
          id: chat.id,
          participantName: chat.participantName,
          isMinimized: chat.isMinimized,
          position: chat.position,
          shouldRender: !chat.isMinimized
        });
      })}
      
      {/* Lightweight Floating Chats */}
      {floatingChats.map((chat) => {
        const shouldRender = !chat.isMinimized;
        console.log('🎯 [ChatIntegrationProvider] Rendering chat:', chat.id, 'shouldRender:', shouldRender, 'position:', chat.position);
        
        if (!shouldRender) {
          console.log('🎯 [ChatIntegrationProvider] Skipping minimized chat:', chat.id);
          return null;
        }
        
        return (
          <LightweightFloatingChat
            key={chat.id}
            conversationId={chat.conversationId}
            participantId={chat.participantId}
            participantName={chat.participantName}
            participantAvatar={chat.participantAvatar}
            position={chat.position}
            onClose={() => closeLightweightChat(chat.id)}
            onMinimize={() => minimizeLightweightChat(chat.id)}
            onPositionChange={(position) => updateChatPosition(chat.id, position)}
          />
        );
      })}
    </ChatIntegrationContext.Provider>
  );
};

export default ChatIntegrationProvider;

