/**
 * EnhancedChatWrapper
 * 
 * A wrapper component that enhances the existing chat interface with modern features
 * without breaking any existing functionality. This provides a safe, incremental
 * approach to upgrading the chat experience.
 */

import React, { useState, useEffect } from 'react';
import { Box, Fade, Slide } from '@mui/material';
import { ModernChatProvider } from './ModernChatProvider';
import ParticipantPanelLeft from './ParticipantPanelLeft';
import ParticipantPanelRight from './ParticipantPanelRight';

interface EnhancedChatWrapperProps {
  children: React.ReactNode;
  
  // Chat context
  chatMessages: any[];
  selectedChatbot: any;
  user: any;
  chatLoading: boolean;
  
  // Progressive enhancement controls
  enableEnhancedMode?: boolean;
  showLeftPanel?: boolean;
  showRightPanel?: boolean;
  
  // Multi-agent data (for future use)
  aiAgents?: any[];
  humanParticipants?: any[];
}

const EnhancedChatWrapper: React.FC<EnhancedChatWrapperProps> = ({
  children,
  chatMessages,
  selectedChatbot,
  user,
  chatLoading,
  enableEnhancedMode = true,
  showLeftPanel = false,
  showRightPanel = false,
  aiAgents = [],
  humanParticipants = []
}) => {
  
  // Determine when to show panels (progressive enhancement)
  const shouldShowLeftPanel = showLeftPanel || aiAgents.length > 0;
  const shouldShowRightPanel = showRightPanel || humanParticipants.length > 0;
  
  // Mock participants for demo (will be replaced with real data)
  const mockAIParticipants = [
    {
      id: selectedChatbot?.identity?.id || selectedChatbot?.key || 'main-ai',
      name: selectedChatbot?.name || 'AI Assistant',
      type: 'ai' as const,
      avatar: selectedChatbot?.avatar,
      isActive: true,
      status: chatLoading ? 'typing' : 'online'
    },
    ...aiAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      type: 'ai' as const,
      avatar: agent.avatar,
      isActive: false,
      status: 'online'
    }))
  ];
  
  const mockHumanParticipants = [
    {
      id: user?.uid || 'current-user',
      name: user?.displayName || 'You',
      type: 'human' as const,
      avatar: user?.photoURL,
      isActive: true,
      status: 'online'
    },
    ...humanParticipants.map(human => ({
      id: human.id,
      name: human.name,
      type: 'human' as const,
      avatar: human.avatar,
      isActive: false,
      status: 'online'
    }))
  ];
  
  if (!enableEnhancedMode) {
    // Return original interface unchanged
    return <>{children}</>;
  }
  
  return (
    <ModernChatProvider>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          backgroundColor: '#0f172a',
          color: 'white',
          position: 'relative'
        }}
      >
        {/* Left Panel - AI Agents (slides in when needed) */}
        <Slide direction="right" in={shouldShowLeftPanel} mountOnEnter unmountOnExit>
          <Box>
            <ParticipantPanelLeft
              participants={mockAIParticipants}
              onParticipantSelect={(participant) => {
                console.log('AI Agent selected:', participant);
                // TODO: Handle AI agent selection
              }}
              onDragStart={(event, agent) => {
                event.dataTransfer.setData('text/plain', JSON.stringify(agent));
              }}
            />
          </Box>
        </Slide>

        {/* Center - Enhanced Chat Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'all 0.3s ease-in-out',
            // Add subtle enhancements to the existing interface
            '& .MuiBox-root': {
              // Enhance existing message bubbles
              '&[data-message-bubble="true"]': {
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }
              }
            }
          }}
        >
          {/* Enhanced Background Effects */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
              `,
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
          
          {/* Original Chat Content (enhanced) */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {children}
          </Box>
          
          {/* Floating Enhancement Indicators */}
          {chatMessages.length > 0 && (
            <Fade in={true}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  display: 'flex',
                  gap: 1
                }}
              >
                {/* AI Status Indicator */}
                <Box
                  sx={{
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    px: 2,
                    py: 1,
                    fontSize: '0.75rem',
                    color: '#60a5fa',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  Enhanced Mode
                </Box>
                
                {chatLoading && (
                  <Box
                    sx={{
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      px: 2,
                      py: 1,
                      fontSize: '0.75rem',
                      color: '#34d399',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#34d399',
                        animation: 'pulse 2s infinite'
                      }}
                    />
                    AI Thinking
                  </Box>
                )}
              </Box>
            </Fade>
          )}
        </Box>

        {/* Right Panel - Human Participants (slides in when needed) */}
        <Slide direction="left" in={shouldShowRightPanel} mountOnEnter unmountOnExit>
          <Box>
            <ParticipantPanelRight
              participants={mockHumanParticipants}
              onParticipantSelect={(participant) => {
                console.log('Human participant selected:', participant);
                // TODO: Handle human participant selection
              }}
            />
          </Box>
        </Slide>
      </Box>
      
      {/* Global Styles for Enhanced Mode */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </ModernChatProvider>
  );
};

export default EnhancedChatWrapper;

