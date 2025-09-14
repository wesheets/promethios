/**
 * CompleteEnhancedChatPage - Test page for the revolutionary multi-agent chat interface
 * Showcases all features: adaptive panels, drag & drop, threading, context intelligence
 */

import React, { useState } from 'react';
import { Box, Typography, Button, Chip, Paper } from '@mui/material';
import CompleteAdaptiveChatContainer from '../modules/chat/components/CompleteAdaptiveChatContainer';

const CompleteEnhancedChatPage: React.FC = () => {
  const [sessionId] = useState(`session-${Date.now()}`);
  const [participants, setParticipants] = useState<any[]>([]);

  const handleParticipantChange = (newParticipants: any[]) => {
    setParticipants(newParticipants);
  };

  const getLayoutDescription = () => {
    const agents = participants.filter(p => p.type === 'agent');
    const humans = participants.filter(p => p.type === 'human');

    if (agents.length < 2 && humans.length < 2) {
      return '1:1 Chat - Full width like ChatGPT';
    } else if (agents.length >= 2 && humans.length < 2) {
      return 'Multi-Agent - Left panel + main chat';
    } else if (agents.length < 2 && humans.length >= 2) {
      return 'Multi-Human - Main chat + right panel';
    } else {
      return 'Full Multi-Party - Both panels visible';
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a'
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          p: 2,
          backgroundColor: '#1e293b',
          borderRadius: 0,
          borderBottom: '1px solid #334155'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                color: '#e2e8f0',
                fontWeight: 700,
                mb: 0.5
              }}
            >
              🚀 Complete Enhanced Multi-Agent Chat
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}
            >
              Revolutionary interface with adaptive layouts, drag & drop behavioral injection, and smart threading
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={getLayoutDescription()}
              sx={{
                backgroundColor: '#3B82F620',
                color: '#3B82F6',
                border: '1px solid #3B82F640',
                fontSize: '0.75rem'
              }}
            />
            <Chip
              label={`${participants.length} participants`}
              sx={{
                backgroundColor: '#10B98120',
                color: '#10B981',
                border: '1px solid #10B98140',
                fontSize: '0.75rem'
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Feature Highlights */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #334155'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="✨ Adaptive Layouts"
            size="small"
            sx={{
              backgroundColor: '#8B5CF620',
              color: '#8B5CF6',
              fontSize: '0.7rem'
            }}
          />
          <Chip
            label="🎯 Drag & Drop Behavioral Injection"
            size="small"
            sx={{
              backgroundColor: '#F59E0B20',
              color: '#F59E0B',
              fontSize: '0.7rem'
            }}
          />
          <Chip
            label="🧵 Smart Threading"
            size="small"
            sx={{
              backgroundColor: '#06B6D420',
              color: '#06B6D4',
              fontSize: '0.7rem'
            }}
          />
          <Chip
            label="🧠 Conversation Intelligence"
            size="small"
            sx={{
              backgroundColor: '#EC489920',
              color: '#EC4899',
              fontSize: '0.7rem'
            }}
          />
          <Chip
            label="🎨 Strategic Color Coding"
            size="small"
            sx={{
              backgroundColor: '#84CC1620',
              color: '#84CC16',
              fontSize: '0.7rem'
            }}
          />
        </Box>
      </Box>

      {/* Main Chat Interface */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <CompleteAdaptiveChatContainer
          sessionId={sessionId}
          height="100%"
          onParticipantChange={handleParticipantChange}
          agentId="agent-claude"
          governanceEnabled={true}
        />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 1,
          backgroundColor: '#0f172a',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#64748b',
            fontSize: '0.7rem'
          }}
        >
          🎯 Try dragging AI agents onto messages for behavioral injection • 
          🧵 Click reply to create threads • 
          ➕ Add participants to see adaptive layouts
        </Typography>
      </Box>
    </Box>
  );
};

export default CompleteEnhancedChatPage;

