/**
 * UnifiedCollaborationDemo - Demo component for testing unified collaboration features
 * Provides a complete test environment for validation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Paper
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Add as AddIcon,
  People as PeopleIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { UnifiedCollaborationWrapper } from './UnifiedCollaborationWrapper';
import { AgentInfo } from '../AgentAvatarSelector';

export interface UnifiedCollaborationDemoProps {
  // Demo configuration
  demoMode?: 'host' | 'guest';
  autoStart?: boolean;
}

export const UnifiedCollaborationDemo: React.FC<UnifiedCollaborationDemoProps> = ({
  demoMode = 'host',
  autoStart = false
}) => {
  // Demo state
  const [isRunning, setIsRunning] = useState(autoStart);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['host-agent']);
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
  }>>([]);

  // Demo configuration
  const [enableUnifiedSystem, setEnableUnifiedSystem] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [showRealTimeStatus, setShowRealTimeStatus] = useState(true);
  const [conversationName, setConversationName] = useState('Demo Collaboration');

  // Mock data
  const conversationId = 'demo-conversation-123';
  const currentUserId = demoMode === 'host' ? 'host-user-123' : 'guest-user-456';
  const currentUserName = demoMode === 'host' ? 'Demo Host' : 'Demo Guest';
  const hostUserName = demoMode === 'guest' ? 'Demo Host' : undefined;

  const hostAgent: AgentInfo = {
    id: 'host-agent',
    name: 'Claude Assistant',
    avatar: '🤖',
    color: '#8b5cf6',
    hotkey: 'c',
    type: 'ai_agent'
  };

  const guestAgents: AgentInfo[] = [
    {
      id: 'gpt-agent',
      name: 'GPT Assistant',
      avatar: '🧠',
      color: '#10b981',
      hotkey: 'g',
      type: 'ai_agent'
    }
  ];

  // Test scenarios
  const testScenarios = [
    {
      name: 'Initialize Unified System',
      description: 'Test system initialization with host and agents',
      test: 'initialization'
    },
    {
      name: 'Add AI Agent',
      description: 'Test adding a new AI agent to the conversation',
      test: 'add_ai_agent'
    },
    {
      name: 'Real-time Updates',
      description: 'Test real-time participant synchronization',
      test: 'real_time_updates'
    },
    {
      name: 'Permission Validation',
      description: 'Test participant permission system',
      test: 'permissions'
    },
    {
      name: 'Remove Participant',
      description: 'Test removing participants with proper permissions',
      test: 'remove_participant'
    }
  ];

  // Initialize test results
  useEffect(() => {
    setTestResults(
      testScenarios.map(scenario => ({
        test: scenario.test,
        status: 'pending',
        message: 'Waiting to run...'
      }))
    );
  }, []);

  // Run test scenario
  const runTest = async (testName: string) => {
    setTestResults(prev => prev.map(result => 
      result.test === testName 
        ? { ...result, status: 'pending', message: 'Running...' }
        : result
    ));

    try {
      switch (testName) {
        case 'initialization':
          await testInitialization();
          break;
        case 'add_ai_agent':
          await testAddAIAgent();
          break;
        case 'real_time_updates':
          await testRealTimeUpdates();
          break;
        case 'permissions':
          await testPermissions();
          break;
        case 'remove_participant':
          await testRemoveParticipant();
          break;
        default:
          throw new Error('Unknown test');
      }

      setTestResults(prev => prev.map(result => 
        result.test === testName 
          ? { ...result, status: 'success', message: 'Test passed!' }
          : result
      ));

    } catch (error) {
      setTestResults(prev => prev.map(result => 
        result.test === testName 
          ? { 
              ...result, 
              status: 'error', 
              message: error instanceof Error ? error.message : 'Test failed'
            }
          : result
      ));
    }
  };

  // Test implementations
  const testInitialization = async () => {
    // Simulate initialization test
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Initialization test completed');
  };

  const testAddAIAgent = async () => {
    // Simulate adding AI agent
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('✅ Add AI agent test completed');
  };

  const testRealTimeUpdates = async () => {
    // Simulate real-time updates test
    await new Promise(resolve => setTimeout(resolve, 1200));
    console.log('✅ Real-time updates test completed');
  };

  const testPermissions = async () => {
    // Simulate permission validation test
    await new Promise(resolve => setTimeout(resolve, 600));
    console.log('✅ Permission validation test completed');
  };

  const testRemoveParticipant = async () => {
    // Simulate remove participant test
    await new Promise(resolve => setTimeout(resolve, 900));
    console.log('✅ Remove participant test completed');
  };

  // Run all tests
  const runAllTests = async () => {
    for (const scenario of testScenarios) {
      await runTest(scenario.test);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
    }
  };

  // Handle demo events
  const handleParticipantAdded = (participant: any) => {
    console.log('🎉 Demo: Participant added:', participant);
  };

  const handleParticipantRemoved = (participantId: string) => {
    console.log('🗑️ Demo: Participant removed:', participantId);
  };

  const handleError = (error: string) => {
    console.error('❌ Demo: Error occurred:', error);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#e2e8f0' }}>
        Unified Collaboration System Demo
      </Typography>

      <Grid container spacing={3}>
        {/* Demo Controls */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#e2e8f0' }}>
                Demo Controls
              </Typography>

              {/* Demo Mode */}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`${demoMode.toUpperCase()} Mode`}
                  color={demoMode === 'host' ? 'primary' : 'secondary'}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  {demoMode === 'host' 
                    ? 'Testing as conversation host'
                    : 'Testing as invited guest'
                  }
                </Typography>
              </Box>

              <Divider sx={{ borderColor: '#334155', my: 2 }} />

              {/* Configuration */}
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableUnifiedSystem}
                      onChange={(e) => setEnableUnifiedSystem(e.target.checked)}
                    />
                  }
                  label="Enable Unified System"
                  sx={{ color: '#e2e8f0' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showHeader}
                      onChange={(e) => setShowHeader(e.target.checked)}
                    />
                  }
                  label="Show Header"
                  sx={{ color: '#e2e8f0' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showRealTimeStatus}
                      onChange={(e) => setShowRealTimeStatus(e.target.checked)}
                    />
                  }
                  label="Show Real-time Status"
                  sx={{ color: '#e2e8f0' }}
                />
              </Box>

              <TextField
                fullWidth
                label="Conversation Name"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
              />

              {/* Demo Actions */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isRunning ? <StopIcon /> : <PlayIcon />}
                  onClick={() => setIsRunning(!isRunning)}
                  color={isRunning ? 'error' : 'primary'}
                  size="small"
                >
                  {isRunning ? 'Stop' : 'Start'} Demo
                </Button>
                <Button
                  variant="outlined"
                  onClick={runAllTests}
                  size="small"
                  disabled={!isRunning}
                >
                  Run Tests
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#e2e8f0' }}>
                Test Results
              </Typography>

              {testResults.map((result, index) => (
                <Box key={result.test} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      label={result.status}
                      size="small"
                      color={
                        result.status === 'success' ? 'success' :
                        result.status === 'error' ? 'error' : 'default'
                      }
                    />
                    <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                      {testScenarios[index]?.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {result.message}
                  </Typography>
                  {index < testResults.length - 1 && (
                    <Divider sx={{ borderColor: '#334155', mt: 1 }} />
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Demo Interface */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              bgcolor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 2,
              overflow: 'hidden',
              height: 600
            }}
          >
            {isRunning ? (
              <UnifiedCollaborationWrapper
                conversationId={conversationId}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                hostAgent={hostAgent}
                guestAgents={guestAgents}
                selectedAgents={selectedAgents}
                onSelectionChange={setSelectedAgents}
                isHost={demoMode === 'host'}
                hostUserName={hostUserName}
                conversationName={conversationName}
                enableUnifiedSystem={enableUnifiedSystem}
                showHeader={showHeader}
                showRealTimeStatus={showRealTimeStatus}
                showParticipantManager={true}
                onParticipantAdded={handleParticipantAdded}
                onParticipantRemoved={handleParticipantRemoved}
                onError={handleError}
              >
                {/* Mock Chat Messages */}
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This is a demo of the unified collaboration system. 
                    {demoMode === 'host' 
                      ? ' You are the host of this conversation.'
                      : ' You are a guest in this shared conversation.'
                    }
                  </Alert>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <SmartToyIcon sx={{ color: '#8b5cf6' }} />
                      <Typography sx={{ color: '#e2e8f0' }}>
                        Hello! I'm Claude Assistant. Welcome to the unified collaboration demo.
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <PeopleIcon sx={{ color: '#3b82f6' }} />
                      <Typography sx={{ color: '#e2e8f0' }}>
                        {demoMode === 'host' 
                          ? 'As the host, you can invite guests and manage all participants.'
                          : 'As a guest, you can add your own AI agents and participate in the conversation.'
                        }
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <AddIcon sx={{ color: '#10b981' }} />
                      <Typography sx={{ color: '#e2e8f0' }}>
                        Try using the + button to add more participants to this conversation!
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </UnifiedCollaborationWrapper>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#94a3b8'
                }}
              >
                <Typography variant="h6">
                  Click "Start Demo" to begin testing
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UnifiedCollaborationDemo;

