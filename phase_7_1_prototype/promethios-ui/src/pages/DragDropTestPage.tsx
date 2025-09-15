/**
 * Comprehensive Test Page for Drag & Drop Functionality
 * Demonstrates agent-to-message interactions and behavioral prompting
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Alert,
  Chip,
  Button,
  Grid,
} from '@mui/material';
import { 
  DragIndicator, 
  Psychology, 
  QuestionMark, 
  Lightbulb,
  Analytics,
  CloudQueue,
  Handshake,
  Refresh,
} from '@mui/icons-material';

// Import our enhanced components
import DragDropEnabledChatHeader from '../components/chat/DragDropEnabledChatHeader';
import DragDropEnabledChatMessage from '../components/chat/DragDropEnabledChatMessage';
import DragDropEnabledAgentAvatarSelector from '../components/DragDropEnabledAgentAvatarSelector';

// Import drag & drop system
import { dragDropRegistry, initializeDefaultActions } from '../systems/DragDropRegistry';
import { useDragDropEvents } from '../hooks/useDragDrop';

const DragDropTestPage: React.FC = () => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [multiChatState, setMultiChatState] = useState({
    activeContextId: 'main-chat',
    contexts: [
      {
        id: 'main-chat',
        type: 'ai_agent' as const,
        name: 'AI Collaboration',
        isActive: true,
        unreadCount: 0,
        canClose: false,
      }
    ],
    sidePanel: {
      isOpen: false,
      type: 'participants' as const,
    }
  });

  // Mock chat session data
  const mockHostChatSession = {
    agentId: 'agent-1',
    agentName: 'Manus Assistant',
    userId: 'user-1',
    hostUserName: 'John Doe',
    participants: {
      guests: [
        {
          id: 'agent-2',
          type: 'ai_agent',
          agentConfig: { name: 'Research Agent' },
        },
        {
          id: 'agent-3',
          type: 'ai_agent',
          agentConfig: { name: 'Creative Agent' },
        },
        {
          id: 'user-2',
          type: 'human',
          name: 'Jane Smith',
        }
      ]
    }
  };

  const mockUser = {
    uid: 'user-1',
    displayName: 'John Doe',
  };

  // Mock messages
  const [messages] = useState([
    {
      id: 'msg-1',
      content: 'I need help analyzing the market trends for our new product launch. What factors should we consider?',
      timestamp: '10:30 AM',
      sender: {
        id: 'user-1',
        name: 'John Doe',
        type: 'human' as const,
      }
    },
    {
      id: 'msg-2',
      content: 'Based on current market data, I recommend focusing on three key areas: competitive analysis, customer segmentation, and pricing strategy. Let me break down each area for you.',
      timestamp: '10:32 AM',
      sender: {
        id: 'agent-1',
        name: 'Manus Assistant',
        type: 'ai' as const,
      }
    },
    {
      id: 'msg-3',
      content: 'That sounds comprehensive. Can you elaborate on the competitive analysis part? I want to make sure we\'re not missing any key competitors.',
      timestamp: '10:35 AM',
      sender: {
        id: 'user-1',
        name: 'John Doe',
        type: 'human' as const,
      }
    },
    {
      id: 'msg-4',
      content: 'Absolutely! For competitive analysis, we should examine both direct and indirect competitors. I can help identify market leaders, analyze their pricing models, and assess their strengths and weaknesses.',
      timestamp: '10:37 AM',
      sender: {
        id: 'agent-2',
        name: 'Research Agent',
        type: 'ai' as const,
      }
    }
  ]);

  // Listen to drag & drop events
  const events = useDragDropEvents();

  // Initialize drag & drop system
  useEffect(() => {
    initializeDefaultActions();
  }, []);

  // Handle agent interaction with messages
  const handleAgentInteraction = (agentId: string, messageId: string, actionType: string) => {
    const newInteraction = {
      id: Date.now(),
      agentId,
      messageId,
      actionType,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setInteractions(prev => [newInteraction, ...prev.slice(0, 9)]); // Keep last 10 interactions
    
    console.log('Agent interaction triggered:', newInteraction);
  };

  // Mock handlers for header
  const handleContextSwitch = (contextId: string) => {
    console.log('Context switch:', contextId);
  };

  const handleContextClose = (contextId: string) => {
    console.log('Context close:', contextId);
  };

  const handleAddParticipant = () => {
    console.log('Add participant');
  };

  const handleToggleSidePanel = (type: 'participants' | 'tools' | 'settings') => {
    setMultiChatState(prev => ({
      ...prev,
      sidePanel: {
        isOpen: !prev.sidePanel.isOpen || prev.sidePanel.type !== type,
        type,
      }
    }));
  };

  // Get sender colors (same logic as in the components)
  const getSenderColor = (senderId: string, senderType: 'ai' | 'human') => {
    if (senderType === 'human') return '#64748b';
    
    const agentColorPalette = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    ];
    
    const agentIndex = ['agent-1', 'agent-2', 'agent-3'].indexOf(senderId);
    return agentColorPalette[agentIndex % agentColorPalette.length];
  };

  const clearInteractions = () => {
    setInteractions([]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 4 }}>
        Drag & Drop Test Environment
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>How to test:</strong> Drag the colored agent chips from the header onto any message below. 
          Watch for visual feedback and check the interaction log to see the results.
        </Typography>
      </Alert>

      {/* Enhanced Chat Header */}
      <Paper sx={{ mb: 4, bgcolor: '#1e293b', overflow: 'hidden' }}>
        <DragDropEnabledChatHeader
          hostChatSession={mockHostChatSession}
          user={mockUser}
          multiChatState={multiChatState}
          onContextSwitch={handleContextSwitch}
          onContextClose={handleContextClose}
          onAddParticipant={handleAddParticipant}
          onToggleSidePanel={handleToggleSidePanel}
        />
      </Paper>

      <Grid container spacing={4}>
        {/* Chat Messages */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', minHeight: '500px' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
              Chat Messages (Drop Targets)
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.map((message) => (
                <DragDropEnabledChatMessage
                  key={message.id}
                  message={message}
                  senderColor={getSenderColor(message.sender.id, message.sender.type)}
                  onAgentInteraction={handleAgentInteraction}
                />
              ))}
            </Box>

            {/* Bottom Agent Avatar Selector */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #334155' }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Bottom Agent Avatars (Also Draggable)
              </Typography>
              <DragDropEnabledAgentAvatarSelector
                hostAgent={{
                  id: 'agent-1',
                  name: 'Manus Assistant',
                  color: '#ef4444',
                  type: 'ai_agent',
                  hotkey: 'M'
                }}
                guestAgents={[
                  {
                    id: 'agent-2',
                    name: 'Research Agent',
                    color: '#f97316',
                    type: 'ai_agent',
                    hotkey: 'R'
                  },
                  {
                    id: 'agent-3',
                    name: 'Creative Agent',
                    color: '#eab308',
                    type: 'ai_agent',
                    hotkey: 'C'
                  }
                ]}
                selectedAgents={[]}
                onSelectionChange={() => {}}
                humanParticipants={[
                  {
                    id: 'user-1',
                    name: 'John Doe',
                    type: 'human',
                    status: 'online'
                  },
                  {
                    id: 'user-2',
                    name: 'Jane Smith',
                    type: 'human',
                    status: 'online'
                  }
                ]}
                onBehaviorPrompt={(agentId, agentName, behavior) => {
                  console.log('Behavior prompt from bottom avatar:', { agentId, agentName, behavior });
                  handleAgentInteraction(agentId, 'bottom-interaction', behavior);
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Interaction Log & System Info */}
        <Grid item xs={12} md={4}>
          {/* Recent Interactions */}
          <Paper sx={{ p: 3, bgcolor: '#1e293b', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                Interaction Log
              </Typography>
              <Button
                size="small"
                onClick={clearInteractions}
                startIcon={<Refresh />}
                sx={{ color: '#94a3b8' }}
              >
                Clear
              </Button>
            </Box>
            
            {interactions.length === 0 ? (
              <Typography sx={{ color: '#64748b', fontStyle: 'italic', fontSize: '14px' }}>
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
                      {interaction.actionType.replace('_', ' ').toUpperCase()}
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

          {/* System Events */}
          <Paper sx={{ p: 3, bgcolor: '#1e293b' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              System Events
            </Typography>
            
            {events.length === 0 ? (
              <Typography sx={{ color: '#64748b', fontStyle: 'italic', fontSize: '14px' }}>
                No system events yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {events.slice(0, 5).map((event, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      bgcolor: '#334155',
                      borderRadius: 1,
                      borderLeft: `3px solid ${
                        event.type.includes('success') ? '#22c55e' :
                        event.type.includes('error') ? '#ef4444' :
                        '#3b82f6'
                      }`,
                    }}
                  >
                    <Typography sx={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                      {event.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '10px' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          {/* Available Actions Legend */}
          <Paper sx={{ p: 3, bgcolor: '#1e293b', mt: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Available Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { id: 'collaborate', label: 'Collaborate', icon: <Handshake />, color: '#22c55e' },
                { id: 'question', label: 'Question', icon: <QuestionMark />, color: '#3b82f6' },
                { id: 'expert_analysis', label: 'Expert Analysis', icon: <Analytics />, color: '#8b5cf6' },
                { id: 'creative_ideas', label: 'Creative Ideas', icon: <Lightbulb />, color: '#eab308' },
                { id: 'devils_advocate', label: "Devil's Advocate", icon: <Psychology />, color: '#ef4444' },
                { id: 'pessimist', label: 'Pessimist', icon: <CloudQueue />, color: '#64748b' },
              ].map((action) => (
                <Chip
                  key={action.id}
                  icon={action.icon}
                  label={action.label}
                  size="small"
                  sx={{
                    bgcolor: `${action.color}20`,
                    color: action.color,
                    '& .MuiChip-icon': { color: action.color },
                    fontSize: '11px',
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Paper sx={{ p: 3, bgcolor: '#1e293b', mt: 4 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Testing Instructions
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
            1. <strong>Drag agents:</strong> Click and drag the colored agent chips from the header OR the bottom avatar selector
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
            2. <strong>Drop on messages:</strong> Drop agents onto any message to trigger interactions
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
            3. <strong>Visual feedback:</strong> Watch for hover effects, drop zones, and success indicators
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
            4. <strong>Monitor logs:</strong> Check the interaction log and system events for results
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
            5. <strong>Multiple sources:</strong> Both header chips and bottom avatars are draggable
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
            6. <strong>Behavioral prompts:</strong> Different agents may trigger different behavioral prompts
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DragDropTestPage;

