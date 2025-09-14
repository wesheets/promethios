/**
 * StepByStepCompleteEnhancedChatPage - Step-by-step component integration
 * Add components one by one to identify any import issues
 */

import React, { useState } from 'react';
import { Box, Typography, Button, Chip, Paper } from '@mui/material';

// Step 1: Basic imports (WORKING)
import { ModernChatProvider } from '../components/modern/ModernChatProvider';
import { AdaptiveMessageRenderer } from '../components/modern/AdaptiveMessageRenderer';

// Step 2: Add participant panels
import ParticipantPanelLeft from '../components/modern/ParticipantPanelLeft';
import ParticipantPanelRight from '../components/modern/ParticipantPanelRight';

// Step 3: Add message enhancement
import MessageIdentityStrip from '../components/modern/MessageIdentityStrip';
import ContextBar from '../components/modern/ContextBar';

const StepByStepCompleteEnhancedChatPage: React.FC = () => {
  const [sessionId] = useState(`session-${Date.now()}`);
  const [step, setStep] = useState(1);

  // Mock data for testing
  const mockAgents = [
    {
      id: 'claude',
      name: 'Claude',
      model: 'claude-3-sonnet',
      color: '#3B82F6',
      status: 'active' as const,
      trustScore: 95
    },
    {
      id: 'gpt4',
      name: 'GPT-4',
      model: 'gpt-4',
      color: '#06B6D4',
      status: 'idle' as const,
      trustScore: 92
    }
  ];

  const mockHumans = [
    {
      id: 'user1',
      name: 'You',
      role: 'host',
      color: '#F59E0B',
      status: 'online' as const,
      email: 'user@example.com'
    },
    {
      id: 'user2',
      name: 'Sarah',
      role: 'guest1',
      color: '#EF4444',
      status: 'online' as const,
      email: 'sarah@example.com'
    }
  ];

  const mockParticipant = {
    id: 'claude',
    name: 'Claude',
    type: 'agent' as const,
    model: 'claude-3-sonnet',
    color: '#3B82F6'
  };

  const mockInsights = [
    {
      type: 'summary' as const,
      title: 'Test Insight',
      content: 'This is a test conversation insight.',
      confidence: 0.95
    }
  ];

  const mockMetrics = {
    messageCount: 5,
    participantCount: 3,
    agentCount: 2,
    humanCount: 1,
    avgResponseTime: 1.5,
    collaborationScore: 0.85,
    sentimentScore: 0.75
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
              ✅ Step 1: Basic Components Working!
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
              ModernChatProvider and AdaptiveMessageRenderer loaded successfully.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setStep(2)}
              sx={{ backgroundColor: '#3B82F6' }}
            >
              Add Participant Panels
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ height: '400px', display: 'flex' }}>
            <ParticipantPanelLeft
              agents={mockAgents}
              onAddAgent={() => console.log('Add agent')}
              onAgentSettings={() => console.log('Agent settings')}
              onAgentDragStart={() => console.log('Drag start')}
              isVisible={true}
              width="20%"
            />
            <Box sx={{ flex: 1, p: 4, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
                  ✅ Step 2: Participant Panels Working!
                </Typography>
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
                  Left and right panels loaded successfully.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setStep(3)}
                  sx={{ backgroundColor: '#10B981' }}
                >
                  Add Message Enhancement
                </Button>
              </Box>
            </Box>
            <ParticipantPanelRight
              humans={mockHumans}
              onInviteHuman={() => console.log('Invite human')}
              onHumanSettings={() => console.log('Human settings')}
              onGenerateInviteLink={() => 'test-link'}
              isVisible={true}
              width="20%"
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 4 }}>
            <ContextBar
              insights={mockInsights}
              metrics={mockMetrics}
              isExpanded={false}
              onToggleExpanded={() => console.log('Toggle context')}
            />
            <Box sx={{ mt: 2 }}>
              <MessageIdentityStrip
                participant={mockParticipant}
                message="This is a test message with identity strip!"
                timestamp={new Date()}
                showMetadata={false}
              />
            </Box>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
                ✅ Step 3: Message Enhancement Working!
              </Typography>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
                Context bar and message identity strips loaded successfully.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setStep(4)}
                sx={{ backgroundColor: '#8B5CF6' }}
              >
                Test Complete Interface
              </Button>
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" sx={{ color: '#10B981', mb: 2 }}>
              🎉 All Components Working Successfully!
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
              Ready to integrate drag & drop and threading systems.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip label="✅ ModernChatProvider" sx={{ backgroundColor: '#10B98120', color: '#10B981' }} />
              <Chip label="✅ AdaptiveMessageRenderer" sx={{ backgroundColor: '#3B82F620', color: '#3B82F6' }} />
              <Chip label="✅ Participant Panels" sx={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }} />
              <Chip label="✅ Message Enhancement" sx={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }} />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <ModernChatProvider sessionId={sessionId}>
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
          <Typography
            variant="h5"
            sx={{
              color: '#e2e8f0',
              fontWeight: 700,
              mb: 0.5
            }}
          >
            🔧 Step-by-Step Enhanced Chat Integration
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#94a3b8',
              fontSize: '0.875rem'
            }}
          >
            Testing components incrementally - Currently on Step {step} of 4
          </Typography>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {renderStep()}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 1,
            backgroundColor: '#0f172a',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
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
            🔧 Debug Mode: Step {step}/4 - Component integration testing
          </Typography>
          {step > 1 && (
            <Button
              size="small"
              onClick={() => setStep(step - 1)}
              sx={{ color: '#94a3b8' }}
            >
              ← Previous Step
            </Button>
          )}
        </Box>
      </Box>
    </ModernChatProvider>
  );
};

export default StepByStepCompleteEnhancedChatPage;

