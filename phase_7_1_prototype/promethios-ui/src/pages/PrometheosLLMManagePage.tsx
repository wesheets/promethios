/**
 * Promethios LLM Management Page
 * 
 * Main page for managing Promethios Promethios LLM agents with immediate API access
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add,
  AutoAwesome,
  Api,
  Security,
  Speed,
  CheckCircle,
  Chat,
  Assessment,
  Deploy,
  Refresh
} from '@mui/icons-material';
import { darkThemeStyles } from '../styles/darkThemeStyles';
import { PrometheosLLMAgentCard } from '../components/PrometheosLLMAgentCard';
import { PrometheosLLMCreationWizard } from '../components/PrometheosLLMCreationWizard';
import { prometheosLLMService } from '../services/PrometheosLLMService';

interface ModelInfo {
  modelName: string;
  modelVersion: string;
  baseModel: string;
  datasetCount: number;
  governanceNative: boolean;
  capabilities: string[];
  status: string;
}

export const PrometheosLLMManagePage: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [chatting, setChatting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsData, modelData] = await Promise.all([
        prometheosLLMService.getUserAgents(),
        prometheosLLMService.getModelInfo()
      ]);
      
      setAgents(agentsData);
      setModelInfo(modelData);
    } catch (error) {
      console.error('Failed to load Promethios LLM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentCreated = (newAgent: any) => {
    setAgents(prev => [...prev, newAgent]);
    setShowCreationWizard(false);
  };

  const handleChat = (agentId: string) => {
    const agent = agents.find(a => a.agentId === agentId);
    setSelectedAgent(agent);
    setChatMessage('Hello! Can you tell me about your governance capabilities?');
    setChatResponse(null);
    setShowChatDialog(true);
  };

  const handleSendMessage = async () => {
    if (!selectedAgent || !chatMessage.trim()) return;

    setChatting(true);
    setChatResponse(null);

    try {
      const response = await prometheosLLMService.chatWithAgent(
        selectedAgent.agentId,
        chatMessage
      );
      setChatResponse(response);
    } catch (error) {
      setChatResponse({
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
    } finally {
      setChatting(false);
    }
  };

  const handleViewMetrics = (agentId: string) => {
    // Navigate to metrics page or show metrics dialog
    console.log('View metrics for agent:', agentId);
  };

  const handleDeploy = async (agentId: string) => {
    try {
      const deployment = await prometheosLLMService.deployAgent(agentId);
      console.log('Agent deployed:', deployment);
      
      // Refresh agents to show updated status
      await loadData();
    } catch (error) {
      console.error('Failed to deploy agent:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AutoAwesome sx={{ color: '#3b82f6', fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Promethios LLM Agents
          </Typography>
          <Chip
            label="Lambda 7B"
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
        
        <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
          Create and manage Promethios Promethios LLM agents with built-in governance and immediate API access.
        </Typography>

        {/* Model Information Card */}
        {modelInfo && (
          <Card sx={{ ...darkThemeStyles.card, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ color: '#10b981' }} />
                Model Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    Model: {modelInfo.baseModel} v{modelInfo.modelVersion}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    Dataset: {modelInfo.datasetCount.toLocaleString()} curated samples
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    Status: <span style={{ color: modelInfo.status === 'ready' ? '#10b981' : '#f97316' }}>
                      {modelInfo.status.toUpperCase()}
                    </span>
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<Security />}
                      label="Native Governance"
                      size="small"
                      sx={{ backgroundColor: '#065f46', color: '#10b981' }}
                    />
                    <Chip
                      icon={<CheckCircle />}
                      label="Constitutional"
                      size="small"
                      sx={{ backgroundColor: '#1e3a8a', color: '#3b82f6' }}
                    />
                    <Chip
                      icon={<Speed />}
                      label="Real-time"
                      size="small"
                      sx={{ backgroundColor: '#7c2d12', color: '#f97316' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Benefits Alert */}
        <Alert
          severity="info"
          icon={<Api />}
          sx={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6',
            mb: 3
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            🚀 Immediate API Access
          </Typography>
          <Typography variant="body2">
            Unlike wrapped agents, Promethios LLM agents provide chat and API endpoints immediately upon creation.
            No wrapping or deployment required for basic functionality!
          </Typography>
        </Alert>
      </Box>

      {/* Agents Grid */}
      {agents.length > 0 ? (
        <Grid container spacing={3}>
          {agents.map((agent) => (
            <Grid item xs={12} md={6} lg={4} key={agent.agentId}>
              <PrometheosLLMAgentCard
                agent={agent}
                onChat={handleChat}
                onViewMetrics={handleViewMetrics}
                onDeploy={handleDeploy}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card sx={{ ...darkThemeStyles.card, textAlign: 'center', py: 6 }}>
          <CardContent>
            <AutoAwesome sx={{ fontSize: 64, color: '#3b82f6', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              No Promethios LLM Agents Yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              Create your first Promethios LLM agent to get started with built-in governance
              and immediate API access.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreationWizard(true)}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' }
              }}
            >
              Create Native Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#3b82f6',
          '&:hover': { backgroundColor: '#2563eb' }
        }}
        onClick={() => setShowCreationWizard(true)}
      >
        <Add />
      </Fab>

      {/* Creation Wizard */}
      <PrometheosLLMCreationWizard
        open={showCreationWizard}
        onClose={() => setShowCreationWizard(false)}
        onAgentCreated={handleAgentCreated}
      />

      {/* Chat Dialog */}
      <Dialog
        open={showChatDialog}
        onClose={() => setShowChatDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            ...darkThemeStyles.card,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chat sx={{ color: '#3b82f6' }} />
            Chat with {selectedAgent?.name}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            sx={{ ...darkThemeStyles.textField, mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={chatting || !chatMessage.trim()}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              mb: 2
            }}
          >
            {chatting ? 'Sending...' : 'Send Message'}
          </Button>

          {chatResponse && (
            <>
              <Divider sx={{ my: 2, borderColor: '#374151' }} />
              
              {chatResponse.error ? (
                <Alert severity="error">
                  {chatResponse.error}
                </Alert>
              ) : (
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Response
                  </Typography>
                  
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#1f2937', 
                    borderRadius: 1, 
                    border: '1px solid #374151',
                    mb: 2
                  }}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      {chatResponse.response}
                    </Typography>
                  </Box>

                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    Governance Metrics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Trust Score
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                        {(chatResponse.governanceMetrics.trustScore * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Compliance Rate
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                        {(chatResponse.governanceMetrics.complianceRate * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Response Time
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {chatResponse.governanceMetrics.responseTimeMs}ms
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Violations
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#10b981' }}>
                        {chatResponse.governanceMetrics.policyViolations.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #374151', p: 2 }}>
          <Button
            onClick={() => setShowChatDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

