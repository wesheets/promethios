import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ModernChatContainer } from '../modules/chat/components/ModernChatContainer';

const PageContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100vw',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden'
}));

const ModernChatPage: React.FC = () => {
  return (
    <PageContainer>
      <ModernChatContainer 
        governanceEnabled={true}
      />
    </PageContainer>
  );
};

export default ModernChatPage;

