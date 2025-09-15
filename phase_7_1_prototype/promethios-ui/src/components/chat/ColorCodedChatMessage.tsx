import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import DirectionalFlowIndicator from './DirectionalFlowIndicator';

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
}

const ColorCodedChatMessage: React.FC<ColorCodedChatMessageProps> = ({
  message,
  senderColor,
  recipient,
  isCurrentUser = false
}) => {
  const isAI = message.sender.type === 'ai';
  const isHuman = message.sender.type === 'human';

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
          backgroundColor: senderColor,
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
      <Box sx={{
        position: 'relative',
        maxWidth: isCurrentUser ? '70%' : '85%',
        minWidth: '200px'
      }}>
        {/* Colored Left Border */}
        <Box sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: senderColor,
          borderRadius: '1.5px 0 0 1.5px'
        }} />
        
        {/* Message Bubble */}
        <Box sx={{
          ml: 1, // Space for the colored border
          p: 2,
          backgroundColor: isCurrentUser ? '#334155' : '#1e293b',
          borderRadius: 2,
          border: '1px solid #334155',
          position: 'relative'
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

