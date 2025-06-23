import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import AdvancedChatComponent from '../components/AdvancedChatComponent';

const ChatPageContainer = styled(Box)(() => ({
  height: '100%',
  width: '100%',
  backgroundColor: '#1a202c', // Match the site's dark theme
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}));

const ModernChatPage: React.FC = () => {
  return (
    <ChatPageContainer>
      <AdvancedChatComponent />
    </ChatPageContainer>
  );
};

export default ModernChatPage;

