import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface FloatingChatWindow {
  id: string;
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  position: { x: number; y: number };
  isMinimized: boolean;
}

interface FloatingChatDebugOverlayProps {
  floatingChats: FloatingChatWindow[];
  enabled?: boolean;
}

const FloatingChatDebugOverlay: React.FC<FloatingChatDebugOverlayProps> = ({
  floatingChats,
  enabled = true
}) => {
  if (!enabled) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 10,
        left: 10,
        width: 300,
        maxHeight: 400,
        p: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        zIndex: 99999,
        fontSize: '12px',
        overflow: 'auto',
        border: '2px solid #ff0000'
      }}
    >
      <Typography variant="h6" sx={{ color: '#ff0000', mb: 1, fontSize: '14px' }}>
        🐛 Floating Chat Debug
      </Typography>
      
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#00ff00' }}>
          Total Chats: {floatingChats.length}
        </Typography>
        <Typography variant="body2" sx={{ color: '#00ff00' }}>
          Viewport: {window.innerWidth}x{window.innerHeight}
        </Typography>
      </Box>

      {floatingChats.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#ffff00' }}>
          No floating chats found
        </Typography>
      ) : (
        floatingChats.map((chat, index) => (
          <Box key={chat.id} sx={{ mb: 1, p: 1, border: '1px solid #333' }}>
            <Typography variant="body2" sx={{ color: '#00ffff' }}>
              Chat {index + 1}: {chat.participantName}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '10px' }}>
              ID: {chat.id}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '10px' }}>
              Position: x={chat.position.x}, y={chat.position.y}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '10px' }}>
              Minimized: {chat.isMinimized ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '10px' }}>
              Participant ID: {chat.participantId}
            </Typography>
          </Box>
        ))
      )}

      <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #333' }}>
        <Typography variant="body2" sx={{ color: '#ff00ff', fontSize: '10px' }}>
          Debug Actions:
        </Typography>
        <button
          onClick={() => {
            console.log('🔍 Current floating chats:', floatingChats);
            console.log('🔍 DOM elements with "chat":', document.querySelectorAll('[class*="chat"], [id*="chat"]'));
            console.log('🔍 DOM elements with high z-index:', 
              Array.from(document.querySelectorAll('*')).filter(el => {
                const zIndex = window.getComputedStyle(el).zIndex;
                return zIndex && parseInt(zIndex) > 1000;
              })
            );
          }}
          style={{
            fontSize: '10px',
            padding: '2px 4px',
            margin: '2px',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #666'
          }}
        >
          Log Debug Info
        </button>
        
        <button
          onClick={() => {
            // Create a test floating element
            const testDiv = document.createElement('div');
            testDiv.style.cssText = `
              position: fixed;
              top: 100px;
              right: 50px;
              width: 200px;
              height: 100px;
              background: red;
              border: 3px solid yellow;
              z-index: 99998;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
            `;
            testDiv.textContent = 'TEST ELEMENT';
            document.body.appendChild(testDiv);
            
            setTimeout(() => testDiv.remove(), 3000);
          }}
          style={{
            fontSize: '10px',
            padding: '2px 4px',
            margin: '2px',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #666'
          }}
        >
          Test Position
        </button>
      </Box>
    </Paper>
  );
};

export default FloatingChatDebugOverlay;

