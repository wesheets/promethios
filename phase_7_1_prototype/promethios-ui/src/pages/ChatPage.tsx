/**
 * Basic Chat Page for testing the chat functionality
 */

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ChatContainer from '../modules/chat/components/ChatContainer';

const ChatPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Chat Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Basic chat functionality test - incremental build step 4
        </Typography>
      </Box>
      
      <ChatContainer height={500} />
    </Container>
  );
};

export default ChatPage;

