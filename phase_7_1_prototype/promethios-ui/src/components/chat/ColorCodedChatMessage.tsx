import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import DirectionalFlowIndicator from './DirectionalFlowIndicator';

// Import drag & drop functionality
import { useMessageDropTarget } from '../../hooks/useDragDrop';

interface ColorCodedChatMessageProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    sender: {
      id: string;
      name: string;
      type: 'ai' | 'human';
      avatar?: string;
    };
  };
  senderColor: string;
  recipient?: {
    id: string;
    name: string;
    type: 'ai' | 'human';
    avatar?: string;
    color: string;
  };
  isCurrentUser?: boolean;
  onAgentInteraction?: (agentId: string, messageId: string, action: string) => void;
}

const ColorCodedChatMessage: React.FC<ColorCodedChatMessageProps> = ({
  message,
  senderColor,
  recipient,
  isCurrentUser = false,
  onAgentInteraction
}) => {
  const isAI = message.sender.type === 'ai';
  const isHuman = message.sender.type === 'human';

  // Add drop functionality
  const { dropRef, isOver, canDrop, dropHandlers } = useMessageDropTarget(
    message.id,
    message,
    (agentId: string, messageId: string, action: string) => {
      console.log('Agent dropped on message:', { agentId, messageId, action });
      onAgentInteraction?.(agentId, messageId, action);
    }
  );

  return (
    <Box sx={{ 
      mb: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
      maxWidth: '100%'
    }}>
      {/* Directional Flow Indicator */}
      {recipient && (
        <DirectionalFlowIndicator
          sender={{
            id: message.sender.id,
            name: message.sender.name,
            type: message.sender.type,
            avatar: message.sender.avatar,
            color: senderColor
          }}
          recipient={recipient}
          timestamp={message.timestamp}
          isCurrentUser={isCurrentUser}
        />
      )}

      {/* Agent/User Name with Color Square */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        mb: 0.5,
        ml: isCurrentUser ? 0 : 1
      }}>
        {/* Color Square */}
        <Box sx={{
          width: 12,
          height: 12,
          backgroundColor: message.sender.type === 'human' 
            ? '#64748b' // Softer neutral for humans
            : senderColor, // Vibrant colors for agents
          borderRadius: 0.5,
          flexShrink: 0
        }} />
        
        {/* Sender Name */}
        <Typography variant="body2" sx={{ 
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {message.sender.name}
        </Typography>
        
        {/* Timestamp (only show if no directional flow) */}
        {!recipient && (
          <Typography variant="caption" sx={{ 
            color: '#64748b',
            fontSize: '11px'
          }}>
            {message.timestamp}
          </Typography>
        )}
      </Box>

      {/* Message Content with Colored Border */}
      <Box 
        ref={dropRef}
        {...dropHandlers}
        sx={{
          position: 'relative',
          maxWidth: isCurrentUser ? '70%' : '85%',
          minWidth: '200px',
          // Premium hover effect
          transition: 'all 0.2s ease-in-out',
          // Drop zone visual feedback
          backgroundColor: isOver && canDrop ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          border: isOver && canDrop ? '2px dashed #3b82f6' : '2px solid transparent',
          borderRadius: 2,
          cursor: canDrop ? 'copy' : 'default',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        {/* Colored Left Border - Rounded for premium feel */}
        <Box sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: message.sender.type === 'human' 
            ? '#64748b' // Softer neutral for humans
            : senderColor, // Vibrant colors for agents
          borderRadius: '1.5px' // Pill-like rounded corners
        }} />
        
        {/* Message Bubble */}
        <Box sx={{
          ml: 1, // Space for the colored border
          p: 2,
          backgroundColor: isCurrentUser ? '#334155' : '#1e293b',
          borderRadius: 2,
          border: '1px solid #334155',
          position: 'relative',
          // Subtle elevation for premium feel
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          {/* Message Content */}
          <Typography variant="body1" sx={{ 
            color: '#f8fafc',
            lineHeight: 1.6,
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {message.content}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ColorCodedChatMessage;

