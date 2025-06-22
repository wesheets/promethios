/**
 * Enhanced Chat Page with AI Think Tank Capabilities
 * 
 * This page showcases the revolutionary AI Think Tank feature,
 * enabling multi-system collaboration and governed AI interactions.
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, Button, ButtonGroup, Chip, Alert } from '@mui/material';
import { Psychology, Groups, Science, Policy, Speed, TrendingUp } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { ChatContainer } from '../modules/chat/components/ChatContainer';
import useChatBackend from '../hooks/useChatBackend';

const ChatPage: React.FC = () => {
  const location = useLocation();
  const [userId] = useState('demo-user'); // In real app, get from auth
  const [chatState, chatActions] = useChatBackend({ userId });
  const [selectedMode, setSelectedMode] = useState<'single' | 'think-tank'>('single');
  const [analysisType, setAnalysisType] = useState<'research' | 'policy' | 'strategic' | 'creative'>('research');

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');
    const analysis = urlParams.get('analysis');
    
    if (mode === 'think-tank') {
      setSelectedMode('think-tank');
    }
    
    if (analysis && ['research', 'policy', 'strategic', 'creative'].includes(analysis)) {
      setAnalysisType(analysis as any);
    }
  }, [location.search]);

  // Initialize with a session
  useEffect(() => {
    if (!chatState.currentSession) {
      if (selectedMode === 'think-tank') {
        chatActions.createThinkTankSession({
          coordinationPattern: 'collaborative',
          consensusThreshold: 0.8,
          maxRounds: 3,
        });
      } else {
        chatActions.createSession('single_agent', {
          agentId: 'baseline-agent',
        });
      }
    }
  }, [selectedMode, chatState.currentSession, chatActions]);

  const handleModeChange = async (mode: 'single' | 'think-tank') => {
    setSelectedMode(mode);
    
    if (mode === 'think-tank') {
      await chatActions.createThinkTankSession({
        coordinationPattern: 'collaborative',
        consensusThreshold: 0.8,
        maxRounds: 3,
        governanceLevel: 'moderate',
      });
    } else {
      await chatActions.createSession('single_agent', {
        agentId: 'baseline-agent',
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (selectedMode === 'think-tank') {
      return chatActions.sendThinkTankMessage(message, {
        analysisType,
        priority: 'medium',
      });
    } else {
      return chatActions.sendMessage(message);
    }
  };

  const getThinkTankDescription = () => {
    switch (analysisType) {
      case 'research':
        return 'Multi-AI research collaboration with cross-system validation';
      case 'policy':
        return 'Governance-focused analysis with policy compliance validation';
      case 'strategic':
        return 'Strategic planning with diverse AI perspectives and consensus building';
      case 'creative':
        return 'Creative problem-solving with innovative multi-system approaches';
      default:
        return 'Advanced AI Think Tank analysis';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Promethios AI Chat
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Experience governed AI interactions and revolutionary multi-system collaboration
        </Typography>
      </Box>

      {/* Mode Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Chat Mode
        </Typography>
        
        <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
          <Button
            variant={selectedMode === 'single' ? 'contained' : 'outlined'}
            onClick={() => handleModeChange('single')}
            startIcon={<Psychology />}
          >
            Single Agent
          </Button>
          <Button
            variant={selectedMode === 'think-tank' ? 'contained' : 'outlined'}
            onClick={() => handleModeChange('think-tank')}
            startIcon={<Groups />}
            sx={{ 
              background: selectedMode === 'think-tank' ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' : undefined,
              color: selectedMode === 'think-tank' ? 'white' : undefined,
            }}
          >
            🚀 AI Think Tank
          </Button>
        </ButtonGroup>

        {selectedMode === 'think-tank' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Analysis Type:
            </Typography>
            <ButtonGroup size="small" sx={{ mb: 2 }}>
              <Button
                variant={analysisType === 'research' ? 'contained' : 'outlined'}
                onClick={() => setAnalysisType('research')}
                startIcon={<Science />}
              >
                Research
              </Button>
              <Button
                variant={analysisType === 'policy' ? 'contained' : 'outlined'}
                onClick={() => setAnalysisType('policy')}
                startIcon={<Policy />}
              >
                Policy
              </Button>
              <Button
                variant={analysisType === 'strategic' ? 'contained' : 'outlined'}
                onClick={() => setAnalysisType('strategic')}
                startIcon={<TrendingUp />}
              >
                Strategic
              </Button>
              <Button
                variant={analysisType === 'creative' ? 'contained' : 'outlined'}
                onClick={() => setAnalysisType('creative')}
                startIcon={<Psychology />}
              >
                Creative
              </Button>
            </ButtonGroup>
            
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>AI Think Tank Mode:</strong> {getThinkTankDescription()}
              </Typography>
            </Alert>
          </Box>
        )}
      </Paper>

      {/* System Status */}
      {chatState.systemHealth && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2">System Status:</Typography>
            <Chip
              label={chatState.systemHealth.status.toUpperCase()}
              color={chatState.systemHealth.status === 'healthy' ? 'success' : 'warning'}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Active Sessions: {chatState.systemHealth.active_sessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Messages: {chatState.systemHealth.total_messages}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Governance Status */}
      {chatState.governanceStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">Governance:</Typography>
            <Chip
              label={`Trust Score: ${(chatState.governanceStatus.average_trust_score * 100).toFixed(0)}%`}
              color="primary"
              size="small"
            />
            <Chip
              label={`Compliance: ${(chatState.governanceStatus.compliance_rate * 100).toFixed(0)}%`}
              color="success"
              size="small"
            />
            <Chip
              label={`Messages: ${chatState.governanceStatus.total_messages}`}
              variant="outlined"
              size="small"
            />
            {chatState.governanceStatus.policy_violations > 0 && (
              <Chip
                label={`Violations: ${chatState.governanceStatus.policy_violations}`}
                color="warning"
                size="small"
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Chat Interface */}
      <Paper sx={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
        <ChatContainer
          height="100%"
          session={chatState.currentSession}
          messages={chatState.messages}
          isLoading={chatState.isLoading}
          isSending={chatState.isSending}
          onSendMessage={handleSendMessage}
          error={chatState.error}
          onClearError={chatActions.clearError}
          thinkTankMode={selectedMode === 'think-tank'}
          lastResponse={chatState.lastResponse}
          governanceEnabled={true}
        />
      </Paper>

      {/* Think Tank Features Showcase */}
      {selectedMode === 'think-tank' && (
        <Paper sx={{ p: 3, mt: 3, background: 'linear-gradient(45deg, #f3f4f6 30%, #e5f3ff 90%)' }}>
          <Typography variant="h6" gutterBottom>
            🚀 AI Think Tank Features
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<Groups />}
              label="Multi-System Collaboration"
              variant="outlined"
            />
            <Chip
              icon={<Science />}
              label="Cross-AI Validation"
              variant="outlined"
            />
            <Chip
              icon={<Policy />}
              label="Governance Oversight"
              variant="outlined"
            />
            <Chip
              icon={<Speed />}
              label="Consensus Building"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            Experience the world's first governed AI Think Tank - where multiple AI systems collaborate 
            to provide validated, consensus-driven insights with complete governance oversight.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ChatPage;

