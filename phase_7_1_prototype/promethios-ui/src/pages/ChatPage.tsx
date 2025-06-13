/**
 * Basic Chat Page for testing the chat functionality
 */

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import { useLocation } from 'react-router-dom';
import ChatContainer from '../modules/chat/components/ChatContainer';

const ChatPage: React.FC = () => {
  const location = useLocation();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters to determine which agent or system to chat with
    const urlParams = new URLSearchParams(location.search);
    const agentId = urlParams.get('agent');
    const systemId = urlParams.get('system');
    
    if (agentId) {
      setSelectedAgent(agentId);
      setSelectedSystem(null);
    } else if (systemId) {
      setSelectedSystem(systemId);
      setSelectedAgent(null);
    }
  }, [location.search]);

  const getPageTitle = () => {
    if (selectedAgent) {
      return `Chat with Agent: ${selectedAgent}`;
    } else if (selectedSystem) {
      return `Chat with Multi-Agent System: ${selectedSystem}`;
    }
    return 'Chat Test';
  };

  const getPageDescription = () => {
    if (selectedAgent) {
      return `Direct conversation with individual agent ${selectedAgent}`;
    } else if (selectedSystem) {
      return `Multi-agent conversation with system ${selectedSystem}`;
    }
    return 'Basic chat functionality test - incremental build step 4';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {getPageTitle()}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {getPageDescription()}
        </Typography>
        
        {(selectedAgent || selectedSystem) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {selectedAgent && `Connected to agent: ${selectedAgent}`}
            {selectedSystem && `Connected to multi-agent system: ${selectedSystem}`}
          </Alert>
        )}
      </Box>
      
      <ChatContainer height={500} />
    </Container>
  );
};

export default ChatPage;

