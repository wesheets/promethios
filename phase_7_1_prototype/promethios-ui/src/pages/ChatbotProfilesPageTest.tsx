import React from 'react';
import { Container, Typography } from '@mui/material';

const ChatbotProfilesPageTest: React.FC = () => {
  console.log('🔍 ChatbotProfilesPageTest component mounting...');
  
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Test Chatbot Profiles Page
      </Typography>
      <Typography variant="body1">
        This is a test version to check if the component can mount properly.
      </Typography>
    </Container>
  );
};

export default ChatbotProfilesPageTest;

