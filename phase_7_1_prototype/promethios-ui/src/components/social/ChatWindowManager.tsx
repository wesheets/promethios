import React, { useState, useCallback, useEffect } from 'react';
import FloatingChatWindow from './FloatingChatWindow';
import MinimizedChatBubble from './MinimizedChatBubble';

interface ChatWindow {
  id: string;
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  isMinimized: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  unreadCount: number;
}

interface ChatWindowManagerProps {
  children?: React.ReactNode;
}

const ChatWindowManager: React.FC<ChatWindowManagerProps> = ({ children }) => {
  const [chatWindows, setChatWindows] = useState<Map<string, ChatWindow>>(new Map());
  const [nextZIndex, setNextZIndex] = useState(1000);

  // Calculate positions for minimized bubbles
  const getMinimizedPosition = (index: number) => ({
    bottom: 20,
    right: 20 + (index * 220), // Stack horizontally with 220px spacing
  });

  // Open a new chat window or restore minimized one
  const openChatWindow = useCallback((params: {
    participantId: string;
    participantName: string;
    participantAvatar?: string;
    conversationId?: string;
  }) => {
    const { participantId, participantName, participantAvatar, conversationId } = params;
    const windowId = `chat-${participantId}`;
    const chatConversationId = conversationId || `conv-${Date.now()}-${participantId}`;

    setChatWindows(prev => {
      const newWindows = new Map(prev);
      const existingWindow = newWindows.get(windowId);

      if (existingWindow) {
        // Restore minimized window or bring to front
        newWindows.set(windowId, {
          ...existingWindow,
          isMinimized: false,
          zIndex: nextZIndex,
        });
      } else {
        // Create new window
        const windowCount = Array.from(newWindows.values()).filter(w => !w.isMinimized).length;
        newWindows.set(windowId, {
          id: windowId,
          conversationId: chatConversationId,
          participantId,
          participantName,
          participantAvatar,
          isMinimized: false,
          isPinned: false, // Default to unpinned
          position: { 
            x: 100 + (windowCount * 50), // Cascade new windows
            y: 100 + (windowCount * 50) 
          },
          size: { width: 350, height: 500 },
          zIndex: nextZIndex,
          unreadCount: 0,
        });
      }

      return newWindows;
    });

    setNextZIndex(prev => prev + 1);
        console.log('💬 [ChatWindowManager] Opened chat window for:', participantName);
  }, []);

  const handlePin = useCallback((windowId: string) => {
    setChatWindows(prev => {
      const newWindows = new Map(prev);
      const window = newWindows.get(windowId);
      if (window) {
        newWindows.set(windowId, {
          ...window,
          isPinned: true,
          // Move to bottom-right when pinned
          position: { 
            x: window.innerWidth - window.size.width - 20, 
            y: window.innerHeight - window.size.height - 20 
          }
        });
      }
      return newWindows;
    });
    console.log('📌 [ChatWindowManager] Pinned window:', windowId);
  }, []);

  const handleUnpin = useCallback((windowId: string) => {
    setChatWindows(prev => {
      const newWindows = new Map(prev);
      const window = newWindows.get(windowId);
      if (window) {
        newWindows.set(windowId, { ...window, isPinned: false });
      }
      return newWindows;
    });
    console.log('🔓 [ChatWindowManager] Unpinned window:', windowId);
  }, []);

  const handleMinimize = useCallback((windowId: string) => {indow = useCallback((windowId: string) => {
    setChatWindows(prev => {
      const newWindows = new Map(prev);
      const window = newWindows.get(windowId);
      if (window) {
        newWindows.set(windowId, { ...window, isMinimized: true });
      }
      return newWindows;
    });
    
    console.log('📉 [ChatWindowManager] Minimized chat window:', windowId);
  }, []);

  // Close a chat window completely
  const closeChatWindow = useCallback((windowId: string) => {
    setChatWindows(prev => {
      const newWindows = new Map(prev);
      newWindows.delete(windowId);
      return newWindows;
    });
    
    console.log('❌ [ChatWindowManager] Closed chat window:', windowId);
  }, []);

  // Update window position
  const updateWindowPosition = useCallback((windowId: string, position: { x: number; y: number }) => {
    setChatWindows(prev => {
      const newWindows = new Map(prev);
      const window = newWindows.get(windowId);
      if (window) {
        newWindows.set(windowId, { ...window, position });
      }
      return newWindows;
    });
  }, []);

  // Update window size
  const updateWindowSize = useCallback((windowId: string, size: { width: number; height: number }) => {
    setChatWindows(prev => {
      const newWindows = new Map(prev);
      const window = newWindows.get(windowId);
      if (window) {
        newWindows.set(windowId, { ...window, size });
      }
      return newWindows;
    });
  }, []);

  // Bring window to front when clicked
  const bringToFront = useCallback((windowId: string) => {
    setChatWindows(prev => {
      const newWindows = new Map(prev);
      const window = newWindows.get(windowId);
      if (window) {
        newWindows.set(windowId, { ...window, zIndex: nextZIndex });
        setNextZIndex(prev => prev + 1);
      }
      return newWindows;
    });
  }, [nextZIndex]);

  // Expose openChatWindow function globally for other components
  useEffect(() => {
    (window as any).openFloatingChat = openChatWindow;
    return () => {
      delete (window as any).openFloatingChat;
    };
  }, [openChatWindow]);

  const chatWindowsArray = Array.from(chatWindows.values());
  const minimizedWindows = chatWindowsArray.filter(w => w.isMinimized);
  const activeWindows = chatWindowsArray.filter(w => !w.isMinimized);

  return (
    <>
      {children}
      
      {/* Active Floating Chat Windows */}
      {activeWindows.map((window) => (
        <FloatingChatWindow
          key={window.id}
          conversationId={window.conversationId}
          participantId={window.participantId}
          participantName={window.participantName}
          participantAvatar={window.participantAvatar}
          isPinned={window.isPinned}
          position={window.position}
          size={window.size}
          zIndex={window.zIndex}
          onClose={() => closeChatWindow(window.id)}
          onMinimize={() => minimizeChatWindow(window.id)}
          onMaximize={() => bringToFront(window.id)}
          onPin={() => handlePin(window.id)}
          onUnpin={() => handleUnpin(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.id, position)}
          onSizeChange={(size) => updateWindowSize(window.id, size)}
        />
      ))}

      {/* Minimized Chat Bubbles */}
      {minimizedWindows.map((window, index) => (
        <MinimizedChatBubble
          key={window.id}
          conversationId={window.conversationId}
          participantId={window.participantId}
          participantName={window.participantName}
          participantAvatar={window.participantAvatar}
          unreadCount={window.unreadCount}
          position={getMinimizedPosition(index)}
          onClick={() => {
            setChatWindows(prev => {
              const newWindows = new Map(prev);
              newWindows.set(window.id, { 
                ...window, 
                isMinimized: false, 
                zIndex: nextZIndex 
              });
              return newWindows;
            });
            setNextZIndex(prev => prev + 1);
          }}
          onClose={() => closeChatWindow(window.id)}
          zIndex={window.zIndex}
        />
      ))}
    </>
  );
};

export default ChatWindowManager;

