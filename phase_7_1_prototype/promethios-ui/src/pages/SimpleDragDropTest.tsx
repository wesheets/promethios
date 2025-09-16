/**
 * Simple Drag & Drop Test Page
 * Minimal implementation to test core functionality
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
} from '@mui/material';

// Import the core components that should work
import EnhancedColorCodedChatMessage from '../components/chat/EnhancedColorCodedChatMessage';
import EnhancedConsolidatedChatHeader from '../components/chat/EnhancedConsolidatedChatHeader';

const SimpleDragDropTest: React.FC = () => {
  const [interactions, setInteractions] = useState<any[]>([]);

  // Mock data
  const mockMessages = [
    {
      id: 'msg-1',
      content: 'Hello! I need help with market analysis. Can you assist me?',
      timestamp: '10:30 AM',
      sender: {
        id: 'user-1',
        name: 'John Doe',
        type: 'human' as const,
      }
    },
    {
      id: 'msg-2',
      content: 'Of course! I can help you analyze market trends and provide insights.',
      timestamp: '10:32 AM',
      sender: {
        id: 'agent-1',
        name: 'Market Analyst',
        type: 'ai' as const,
      }
    }
  ];

  const mockMultiChatState = {
    activeContextId: 'main-chat',
    contexts: [
      {
        id: 'main-chat',
        type: 'ai_agent' as const,
        name: 'AI Chat',
        isActive: true,
        unreadCount: 0,
        canClose: false,
      }
    ],
    sidePanel: {
      isOpen: false,
    }
  };

  const mockSelectedChatbot = {
    id: 'agent-1',
    identity: {
      id: 'agent-1',
      name: 'Market Analyst',
      avatar: undefined,
    }
  };

  // Handle agent interaction
  const handleAgentInteraction = (agentId: string, messageId: string, action: string) => {
    const newInteraction = {
      id: Date.now(),
      agentId,
      messageId,
      action,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setInteractions(prev => [newInteraction, ...prev.slice(0, 4)]);
    console.log('Agent interaction:', newInteraction);
  };

  // Get sender color
  const getSenderColor = (senderId: string, senderType: 'ai' | 'human') => {
    if (senderType === 'human') return '#64748b';
    return '#ef4444'; // Red for AI
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 4 }}>
        Simple Drag & Drop Test
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Enhanced Features:</strong> Drag agent chips from the header onto messages. 
          You'll see a contextual popup to select the agent's behavior, plus visual feedback including 
          drop zones, hover effects, and success animations.
        </Typography>
      </Alert>

      {/* Enhanced Chat Header */}
      <Paper sx={{ mb: 4, bgcolor: '#1e293b', overflow: 'hidden' }}>
        <EnhancedConsolidatedChatHeader
          multiChatState={mockMultiChatState}
          selectedChatbot={mockSelectedChatbot}
          currentChatName="Enhanced Test Chat"
          humanParticipants={[]}
          isInSharedMode={false}
          activeSharedConversation={null}
          sharedConversations={[]}
          onSwitchChatContext={() => {}}
          onRemoveChatContext={() => {}}
          onAddParticipant={() => {}}
          onToggleSidePanel={() => {}}
        />
      </Paper>

      {/* Messages */}
      <Paper sx={{ p: 3, bgcolor: '#0f172a', mb: 4 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
          Messages (Drop Targets)
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mockMessages.map((message) => (
            <EnhancedColorCodedChatMessage
              key={message.id}
              message={message}
              senderColor={getSenderColor(message.sender.id, message.sender.type)}
              onAgentInteraction={handleAgentInteraction}
            />
          ))}
        </Box>
      </Paper>

      {/* Interaction Log */}
      <Paper sx={{ p: 3, bgcolor: '#1e293b' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Interaction Log
        </Typography>
        
        {interactions.length === 0 ? (
          <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>
            No interactions yet. Try dragging an agent onto a message!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {interactions.map((interaction) => (
              <Box
                key={interaction.id}
                sx={{
                  p: 2,
                  bgcolor: '#334155',
                  borderRadius: 1,
                  borderLeft: '3px solid #22c55e',
                }}
              >
                <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  {interaction.action.toUpperCase()}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '11px' }}>
                  Agent: {interaction.agentId} → Message: {interaction.messageId}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '10px' }}>
                  {interaction.timestamp}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SimpleDragDropTest;

