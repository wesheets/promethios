/**
 * EnhancedHostChatInterface
 * 
 * Enhanced interface component that integrates with the existing host chat system.
 * Replaces the current chat message area while maintaining all existing functionality.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ModernChatProvider } from './ModernChatProvider';
import { AdaptiveMessageRenderer } from './AdaptiveMessageRenderer';
import { ParticipantPanelLeft } from './ParticipantPanelLeft';
import { ParticipantPanelRight } from './ParticipantPanelRight';

interface EnhancedHostChatInterfaceProps {
  // Existing system integration
  chatMessages: any[];
  selectedChatbot: any;
  user: any;
  chatLoading: boolean;
  
  // Progressive enhancement
  showLeftPanel?: boolean;
  showRightPanel?: boolean;
  
  // Additional participants (for future multi-agent support)
  aiAgents?: any[];
  humanParticipants?: any[];
}

const EnhancedHostChatInterface: React.FC<EnhancedHostChatInterfaceProps> = ({
  chatMessages,
  selectedChatbot,
  user,
  chatLoading,
  showLeftPanel = false,
  showRightPanel = false,
  aiAgents = [],
  humanParticipants = []
}) => {
  
  // Determine if we should show the intro screen
  const showIntroScreen = chatMessages.length === 0;
  
  // Mock data for enhanced interface (will be replaced with real data)
  const mockParticipants = useMemo(() => {
    const participants = [];
    
    // Add the main AI agent
    if (selectedChatbot) {
      participants.push({
        id: selectedChatbot.identity?.id || selectedChatbot.key || selectedChatbot.id,
        name: selectedChatbot.name || selectedChatbot.identity?.name || 'AI Assistant',
        type: 'ai',
        avatar: selectedChatbot.avatar || selectedChatbot.identity?.avatar,
        isActive: true,
        status: chatLoading ? 'typing' : 'online'
      });
    }
    
    // Add additional AI agents if any
    aiAgents.forEach(agent => {
      participants.push({
        id: agent.id,
        name: agent.name,
        type: 'ai',
        avatar: agent.avatar,
        isActive: false,
        status: 'online'
      });
    });
    
    // Add human participants if any
    humanParticipants.forEach(human => {
      participants.push({
        id: human.id,
        name: human.name,
        type: 'human',
        avatar: human.avatar,
        isActive: false,
        status: 'online'
      });
    });
    
    return participants;
  }, [selectedChatbot, aiAgents, humanParticipants, chatLoading]);
  
  // Convert existing chat messages to enhanced format
  const enhancedMessages = useMemo(() => {
    return chatMessages.map((message, index) => ({
      id: message.id || `msg-${index}`,
      content: message.content || message.message || '',
      sender: message.sender || (message.role === 'user' ? 'user' : 'assistant'),
      timestamp: message.timestamp || new Date(),
      type: message.type || 'text',
      // Enhanced properties
      participantId: message.sender === 'user' 
        ? user?.uid || 'user' 
        : selectedChatbot?.identity?.id || selectedChatbot?.key || 'assistant',
      participantName: message.sender === 'user'
        ? user?.displayName || user?.email?.split('@')[0] || 'You'
        : selectedChatbot?.name || 'AI Assistant',
      participantType: message.sender === 'user' ? 'human' : 'ai',
      avatar: message.sender === 'user' 
        ? user?.photoURL 
        : selectedChatbot?.avatar || selectedChatbot?.identity?.avatar
    }));
  }, [chatMessages, user, selectedChatbot]);
  
  if (showIntroScreen) {
    // Enhanced intro screen
    return (
      <ModernChatProvider>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            color: 'white'
          }}
        >
          {/* Intro Screen */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              textAlign: 'center',
              px: 4
            }}
          >
            {/* Personalized Greeting */}
            <Typography 
              variant="h3" 
              sx={{ 
                color: 'white', 
                mb: 1, 
                fontWeight: 500,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Hello {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#94a3b8', 
                mb: 6,
                fontWeight: 400,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }
              }}
            >
              What can I do for you?
            </Typography>
          </Box>
        </Box>
      </ModernChatProvider>
    );
  }
  
  // Enhanced chat interface (1-on-1 initially, progressive enhancement)
  return (
    <ModernChatProvider>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          color: 'white'
        }}
      >
        {/* Main Chat Area */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - AI Agents (only show if multiple AI agents or explicitly enabled) */}
          {(showLeftPanel || aiAgents.length > 0) && (
            <ParticipantPanelLeft
              participants={mockParticipants.filter(p => p.type === 'ai')}
              onParticipantSelect={(participant) => {
                console.log('AI Agent selected:', participant);
                // TODO: Handle AI agent selection
              }}
              onDragStart={(event, agent) => {
                event.dataTransfer.setData('text/plain', JSON.stringify(agent));
              }}
            />
          )}

          {/* Center - Chat Messages */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {enhancedMessages.map((message) => (
                <AdaptiveMessageRenderer
                  key={message.id}
                  message={message}
                  participants={mockParticipants}
                  isLoading={chatLoading && message === enhancedMessages[enhancedMessages.length - 1]}
                />
              ))}
              
              {/* Loading indicator for new messages */}
              {chatLoading && enhancedMessages.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      bgcolor: '#1e293b',
                      borderRadius: '18px',
                      px: 3,
                      py: 2,
                      maxWidth: '70%'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {selectedChatbot?.name || 'AI Assistant'} is typing...
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right Panel - Human Participants (only show if multiple humans or explicitly enabled) */}
          {(showRightPanel || humanParticipants.length > 0) && (
            <ParticipantPanelRight
              participants={mockParticipants.filter(p => p.type === 'human')}
              onParticipantSelect={(participant) => {
                console.log('Human participant selected:', participant);
                // TODO: Handle human participant selection
              }}
            />
          )}
        </Box>
      </Box>
    </ModernChatProvider>
  );
};

export default EnhancedHostChatInterface;

