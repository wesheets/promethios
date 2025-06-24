import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import AdvancedChatComponent from '../components/AdvancedChatComponent';

const ChatPageContainer = styled(Box)(() => ({
  height: 'calc(100vh - 64px)', // Full viewport height minus header
  width: '100%',
  backgroundColor: '#1a202c', // Match the site's dark theme
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  // Remove absolute positioning to respect parent margins
  // The MainLayoutProxy will handle the sidebar margins
}));

const ModernChatPage: React.FC = () => {
  return (
    <ChatPageContainer>
      <AdvancedChatComponent />
    </ChatPageContainer>
  );
};

export default ModernChatPage;

