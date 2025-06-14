/**
 * Simple Message component for displaying individual chat messages
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';
  const isSystem = message.sender === 'system';

  let bgColor = 'grey.800'; // Default for agent/system messages
  let textColor = 'white';

  if (isUser) {
    bgColor = 'primary.main';
    textColor = 'primary.contrastText';
  } else if (isAgent) {
    bgColor = '#333333'; // Darker shade for agent messages
    textColor = 'white';
  } else if (isSystem) {
    bgColor = '#2a2a2a'; // Even darker for system messages
    textColor = 'grey.400';
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: bgColor,
          color: textColor,
          borderRadius: '10px'
        }}
      >
        <Typography variant="body1">
          {message.content}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
          {message.timestamp.toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Message;

