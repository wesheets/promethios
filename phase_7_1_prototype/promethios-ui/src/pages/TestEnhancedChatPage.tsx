/**
 * Test Enhanced Chat Page
 * Simple test page to verify the enhanced chat components work without authentication
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

// Import modern components
import { CollapsiblePanelManager } from '../components/modern/CollapsiblePanelManager';
import { AdaptiveChatContainer } from '../modules/chat/components/AdaptiveChatContainer';

const TestEnhancedChatPage: React.FC = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a202c',
        overflow: 'hidden'
      }}
    >
      {/* Simple Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #4a5568',
          backgroundColor: '#2d3748'
        }}
      >
        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
          Enhanced Chat Test
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 0.5 }}>
          Testing the adaptive multi-agent chat interface
        </Typography>
      </Box>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <CollapsiblePanelManager
          maxPanels={2}
          autoCollapseThreshold={768}
          animationDuration={300}
        >
          <AdaptiveChatContainer
            height="100%"
            sessionId="test-session"
          />
        </CollapsiblePanelManager>
      </Box>
    </Box>
  );
};

export default TestEnhancedChatPage;

