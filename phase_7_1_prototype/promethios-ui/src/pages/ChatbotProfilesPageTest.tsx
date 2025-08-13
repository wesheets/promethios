import React from 'react';
import { Container, Typography } from '@mui/material';

const ChatbotProfilesPageTest: React.FC = () => {
  console.log('🔍 ChatbotProfilesPageTest component mounting...');
  
  return (
    <Container>
      <Typography variant="h4">
        Test Chatbot Profiles Page
      </Typography>
      <Typography variant="body1">
        This is a test version to check if the component can mount properly.
      </Typography>
    </Container>
  );
};

export default ChatbotProfilesPageTest;

