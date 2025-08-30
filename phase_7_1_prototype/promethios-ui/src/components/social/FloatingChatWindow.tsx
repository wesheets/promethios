import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Minimize,
  Maximize,
  Send,
  VideoCall,
  Call,
  MoreVert,
  DragIndicator,
  PushPin,
  PushPinOutlined,
} from '@mui/icons-material';
import Draggable from 'react-draggable';

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
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Calculate pinned position (bottom-right corner)
  const pinnedPosition = { x: window.innerWidth - size.width - 20, y: window.innerHeight - size.height - 20 };
  const currentPosition = isPinned ? pinnedPosition : position;

  // Handle window resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(300, startWidth + (e.clientX - startX));
      const newHeight = Math.max(400, startHeight + (e.clientY - startY));
      
      onSizeChange?.({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // TODO: Integrate with MessageService
    console.log('📤 Sending message:', messageInput);
    setMessageInput('');
  };

  if (isMinimized) {
    return null; // Minimized state handled by ChatWindowManager
  }

  return (
    <Draggable
      handle=".chat-window-header"
      position={currentPosition}
      disabled={isPinned} // Disable dragging when pinned
      onStop={(e, data) => {
        if (!isPinned) {
          onPositionChange?.({ x: data.x, y: data.y });
        }
      }}
    >
      <Paper
        ref={windowRef}
        elevation={8}
        sx={{
          position: 'fixed',
          width: size.width,
          height: size.height,
          zIndex,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          border: isPinned ? '2px solid' : '1px solid',
          borderColor: isPinned ? 'primary.main' : 'divider',
          cursor: isResizing ? 'nw-resize' : 'default',
          boxShadow: isPinned ? (theme) => theme.shadows[16] : (theme) => theme.shadows[8],
        }}
      >
        {/* Header */}
        <Box
          className="chat-window-header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            backgroundColor: isPinned ? 'secondary.main' : 'primary.main',
            color: 'primary.contrastText',
            cursor: isPinned ? 'default' : 'move',
            userSelect: 'none',
            borderBottom: isPinned ? '1px solid rgba(255,255,255,0.2)' : 'none',
          }}
        >
          <Avatar
            src={participantAvatar}
            sx={{ width: 32, height: 32, mr: 1.5 }}
          >
            {participantName?.[0] || '?'}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {participantName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Online
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Video Call">
              <IconButton size="small" sx={{ color: 'inherit' }}>
                <VideoCall />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Voice Call">
              <IconButton size="small" sx={{ color: 'inherit' }}>
                <Call />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More Options">
              <IconButton size="small" sx={{ color: 'inherit' }}>
                <MoreVert />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isPinned ? "Unpin (Make Draggable)" : "Pin to Bottom-Right"}>
              <IconButton 
                size="small" 
                onClick={isPinned ? onUnpin : onPin}
                sx={{ 
                  color: 'inherit',
                  backgroundColor: isPinned ? 'rgba(255,255,255,0.2)' : 'transparent',
                }}
              >
                {isPinned ? <PushPin /> : <PushPinOutlined />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Minimize">
              <IconButton size="small" onClick={onMinimize} sx={{ color: 'inherit' }}>
                <Minimize />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
                <Close />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            p: 1,
            overflowY: 'auto',
            backgroundColor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'text.secondary'
            }}>
              <Typography variant="body2">
                Start a conversation with {participantName}
              </Typography>
            </Box>
          ) : (
            messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: message.senderId === participantId ? 'flex-start' : 'flex-end',
                  maxWidth: '80%',
                }}
              >
                <Paper
                  sx={{
                    p: 1,
                    backgroundColor: message.senderId === participantId 
                      ? 'grey.100' 
                      : 'primary.main',
                    color: message.senderId === participantId 
                      ? 'text.primary' 
                      : 'primary.contrastText',
                  }}
                >
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            ))
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 1.5, backgroundColor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder={`Message ${participantName}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              sx={{
                minWidth: 'auto',
                px: 2,
                borderRadius: 3,
              }}
            >
              <Send />
            </Button>
          </Box>
        </Box>

        {/* Resize Handle */}
        <Box
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 20,
            height: 20,
            cursor: 'nw-resize',
            backgroundColor: 'primary.main',
            opacity: 0.3,
            '&:hover': { opacity: 0.6 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DragIndicator sx={{ fontSize: 12, color: 'white', transform: 'rotate(45deg)' }} />
        </Box>
      </Paper>
    </Draggable>
  );
};

export default FloatingChatWindow;

