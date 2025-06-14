/**
 * Updated Chat Page with cleaner layout
 */

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { ChatContainer } from '../modules/chat/components/ChatContainer';

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

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#1a1a1a'
    }}>
      <ChatContainer 
        height="100%" 
        agentId={selectedAgent || undefined}
      />
    </Box>
  );
};

export default ChatPage;

