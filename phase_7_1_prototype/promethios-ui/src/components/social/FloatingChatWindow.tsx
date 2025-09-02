import React from 'react';

interface FloatingChatWindowProps {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  isMinimized?: boolean;
  isPinned?: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  zIndex?: number;
}

const FloatingChatWindow: React.FC<FloatingChatWindowProps> = ({
  conversationId,
  participantId,
  participantName,
  participantAvatar,
  isMinimized = false,
  isPinned = false,
  position = { x: 100, y: 100 },
  size = { width: 350, height: 500 },
  onClose,
  onMinimize,
  onMaximize,
  onPin,
  onUnpin,
  onPositionChange,
  onSizeChange,
  zIndex = 1000,
}) => {
  console.log('🎯 [FloatingChatWindow] RENDERING with props:', {
    conversationId,
    participantId,
    participantName,
    position,
    size,
    zIndex,
    isMinimized
  });

  if (isMinimized) {
    console.log('🔍 [FloatingChatWindow] Component is minimized, returning null');
    return null; // Minimized state handled by ChatWindowManager
  }

  console.log('🎯 [FloatingChatWindow] About to render TEST component');

  return (
    <div style={{
      position: 'fixed',
      top: 200,
      left: 400,
      zIndex: 99999,
      width: 350,
      height: 500,
      backgroundColor: '#ff0000',
      border: '5px solid #00ff00',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      boxShadow: '0 0 50px rgba(255, 0, 0, 0.8)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div>CHAT WINDOW TEST</div>
        <div style={{ fontSize: '16px', marginTop: '10px' }}>
          {participantName}
        </div>
        <button 
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#00ff00',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default FloatingChatWindow;

