/**
 * Promethios LLM Agent Card Component
 * 
 * Displays Promethios LLM agent information with immediate API access indicators
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  Api as ApiIcon,
  Assessment as AssessmentIcon,
  Deploy as DeployIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  AutoAwesome as AutoAwesomeIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { darkThemeStyles } from '../styles/darkThemeStyles';
import { prometheosLLMService } from '../services/PrometheosLLMService';

interface PrometheosLLMAgent {
  agentId: string;
  userId: string;
  name: string;
  description: string;
  config: {
    modelName: string;
    modelVersion: string;
    baseModel: string;
    datasetCount: number;
    governanceLevel: string;
    trustThreshold: number;
    complianceMode: string;
    responseStyle: string;
    maxTokens: number;
    temperature: number;
  };
  governance: {
    nativeGovernance: boolean;
    bypassProof: boolean;
    constitutionalCompliance: boolean;
    realTimeMonitoring: boolean;
  };
  metrics: {
    totalInteractions: number;
    trustScore: number;
    complianceRate: number;
    averageResponseTime: number;
    violationCount: number;
  };
  status: 'created' | 'active' | 'deployed' | 'inactive';
  createdAt: string;
  lastActiveAt?: string;
  apiAccess: {
    immediate: {
      chatEndpoint: string;
      testingEndpoint: string;
      metricsEndpoint: string;
    };
    production?: {
      publicEndpoint: string;
      apiKey: string;
      documentation: string;
    };
  };
}

interface PrometheosLLMAgentCardProps {
  agent: PrometheosLLMAgent;
  onChat: (agentId: string) => void;
  onViewMetrics: (agentId: string) => void;
  onDeploy: (agentId: string) => void;
  onDelete?: (agentId: string) => void;
}

export const PrometheosLLMAgentCard: React.FC<PrometheosLLMAgentCardProps> = ({
  agent,
  onChat,
  onViewMetrics,
  onDeploy,
  onDelete
}) => {
  const [showAPIDialog, setShowAPIDialog] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello! Can you tell me about your governance capabilities?');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const handleCopyEndpoint = async (endpoint: string, type: string) => {
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopiedEndpoint(type);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (error) {
      console.error('Failed to copy endpoint:', error);
    }
  };

  const handleTestAPI = async () => {
    if (!testMessage.trim()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const result = await prometheosLLMService.testAgentAPI(agent.agentId, testMessage);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: agent.apiAccess.immediate.chatEndpoint,
        responseTime: 0
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'info';
      case 'active': return 'success';
      case 'deployed': return 'primary';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.9) return '#4caf50'; // Green
    if (score >= 0.7) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  return (
    <>
      <Card 
        sx={{ 
          ...darkThemeStyles.card,
          border: '1px solid #3b82f6',
          position: 'relative',
          '&:hover': {
            borderColor: '#60a5fa',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
          }
        }}
      >
        {/* Promethios LLM Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 1
          }}
        >
          <Chip
            icon={<AutoAwesomeIcon />}
            label="Promethios LLM"
            size="small"
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          <Chip
            label={agent.status.toUpperCase()}
            size="small"
            color={getStatusColor(agent.status) as any}
          />
        </Box>

        <CardContent sx={{ pt: 6 }}>
          {/* Agent Header */}
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            {agent.name}
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
            {agent.description}
          </Typography>

          {/* Model Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
              Model: {agent.config.baseModel} • Dataset: {agent.config.datasetCount.toLocaleString()} samples
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096' }}>
              Mode: {agent.config.complianceMode} • Style: {agent.config.responseStyle}
            </Typography>
          </Box>

          {/* Governance Indicators */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<SecurityIcon />}
              label="Bypass-Proof"
              size="small"
              sx={{ backgroundColor: '#065f46', color: '#10b981' }}
            />
            <Chip
              icon={<CheckCircleIcon />}
              label="Constitutional"
              size="small"
              sx={{ backgroundColor: '#1e3a8a', color: '#3b82f6' }}
            />
            <Chip
              icon={<SpeedIcon />}
              label="Real-time"
              size="small"
              sx={{ backgroundColor: '#7c2d12', color: '#f97316' }}
            />
          </Box>

          {/* Metrics Summary */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  Trust Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={agent.metrics.trustScore * 100}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#374151',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getTrustScoreColor(agent.metrics.trustScore)
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {(agent.metrics.trustScore * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  Interactions
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {agent.metrics.totalInteractions.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* API Access Indicator */}
          <Alert
            severity="success"
            icon={<ApiIcon />}
            sx={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              '& .MuiAlert-icon': { color: '#10b981' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              🚀 Immediate API Access Available
            </Typography>
            <Typography variant="caption">
              Chat and testing endpoints ready for integration
            </Typography>
          </Alert>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => onChat(agent.agentId)}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' }
              }}
            >
              Chat
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ApiIcon />}
              onClick={() => setShowAPIDialog(true)}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': { borderColor: '#2563eb', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
              }}
            >
              API
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View Metrics">
              <IconButton
                onClick={() => onViewMetrics(agent.agentId)}
                sx={{ color: '#a0aec0' }}
              >
                <AssessmentIcon />
              </IconButton>
            </Tooltip>

            {agent.status !== 'deployed' && (
              <Tooltip title="Deploy to Production">
                <IconButton
                  onClick={() => onDeploy(agent.agentId)}
                  sx={{ color: '#10b981' }}
                >
                  <DeployIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="More Options">
              <IconButton sx={{ color: '#a0aec0' }}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>

      {/* API Access Dialog */}
      <Dialog
        open={showAPIDialog}
        onClose={() => setShowAPIDialog(false)}
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
            <ApiIcon sx={{ color: '#3b82f6' }} />
            Promethios LLM API Access
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Immediate Access Section */}
          <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: '#10b981' }} />
            Immediate Access (Available Now)
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, backgroundColor: '#1f2937', borderRadius: 1, border: '1px solid #374151' }}>
                <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 1 }}>
                  Chat Endpoint
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0', fontFamily: 'monospace', flex: 1 }}>
                    {agent.apiAccess.immediate.chatEndpoint}
                  </Typography>
                  <Tooltip title={copiedEndpoint === 'chat' ? 'Copied!' : 'Copy endpoint'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyEndpoint(agent.apiAccess.immediate.chatEndpoint, 'chat')}
                      sx={{ color: copiedEndpoint === 'chat' ? '#10b981' : '#a0aec0' }}
                    >
                      {copiedEndpoint === 'chat' ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  POST request with message and user_id
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: '#1f2937', borderRadius: 1, border: '1px solid #374151' }}>
                <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 1 }}>
                  Testing Endpoint
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0', fontFamily: 'monospace', mb: 1 }}>
                  {agent.apiAccess.immediate.testingEndpoint}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  For development testing
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: '#1f2937', borderRadius: 1, border: '1px solid #374151' }}>
                <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 1 }}>
                  Metrics Endpoint
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0', fontFamily: 'monospace', mb: 1 }}>
                  {agent.apiAccess.immediate.metricsEndpoint}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  Real-time governance metrics
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* API Test Section */}
          <Divider sx={{ my: 3, borderColor: '#374151' }} />
          
          <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon sx={{ color: '#f97316' }} />
            Test API
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Test Message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            sx={{
              ...darkThemeStyles.textField,
              mb: 2
            }}
          />

          <Button
            variant="contained"
            onClick={handleTestAPI}
            disabled={testing || !testMessage.trim()}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              mb: 2
            }}
          >
            {testing ? 'Testing...' : 'Test API'}
          </Button>

          {testResult && (
            <Box sx={{ p: 2, backgroundColor: '#1f2937', borderRadius: 1, border: '1px solid #374151' }}>
              <Typography variant="subtitle2" sx={{ 
                color: testResult.success ? '#10b981' : '#ef4444',
                mb: 1 
              }}>
                {testResult.success ? '✅ Success' : '❌ Error'} 
                <Typography component="span" sx={{ color: '#a0aec0', ml: 1 }}>
                  ({testResult.responseTime}ms)
                </Typography>
              </Typography>
              
              {testResult.success ? (
                <Typography variant="body2" sx={{ color: '#a0aec0', fontFamily: 'monospace' }}>
                  {JSON.stringify(testResult.response, null, 2)}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: '#ef4444' }}>
                  {testResult.error}
                </Typography>
              )}
            </Box>
          )}

          {/* Production Access Section */}
          {agent.status === 'deployed' && agent.apiAccess.production && (
            <>
              <Divider sx={{ my: 3, borderColor: '#374151' }} />
              
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeployIcon sx={{ color: '#10b981' }} />
                Production Access
              </Typography>

              <Alert
                severity="info"
                sx={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6'
                }}
              >
                Production endpoints with enhanced features: load balancing, rate limiting, SLA guarantees
              </Alert>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #374151', p: 2 }}>
          <Button
            onClick={() => setShowAPIDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<VisibilityIcon />}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            View Documentation
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

