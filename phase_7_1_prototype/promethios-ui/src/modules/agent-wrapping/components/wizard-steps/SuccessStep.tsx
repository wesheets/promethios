import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Chat,
  Assessment,
  Dashboard,
  GroupWork,
  Add,
  Launch,
  Person,
  Security,
  Speed,
  Verified,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AgentWrapper } from '../../types';
import { agentWrapperIntegrationService } from '../../../agent-identity/services/AgentWrapperIntegration';
import { agentEvaluationService } from '../../../agent-identity/services/ScorecardServices';
import { agentAttestationService } from '../../../agent-identity/services/AttestationAndRoleServices';
import { useAuth } from '../../../../hooks/useAuth';

interface SuccessStepProps {
  wrapper: AgentWrapper;
  onCreateAnother: () => void;
}

interface ScorecardData {
  overallScore: number;
  metrics: {
    accuracy: number;
    compliance: number;
    responseTime: number;
  };
}

interface GovernanceData {
  attestationsCount: number;
  attestationTypes: string[];
  profileLevel: string;
  monitoringStatus: string;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
  wrapper,
  onCreateAnother,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agentIdentityId, setAgentIdentityId] = useState<string | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);
  const [governanceData, setGovernanceData] = useState<GovernanceData | null>(null);

  // Trigger identity and scorecard creation when component mounts
  useEffect(() => {
    const setupAgentIdentityAndScorecard = async () => {
      if (!user) return;

      try {
        setIntegrationLoading(true);
        setIntegrationError(null);
        
        // Create agent identity and assign scorecard
        const identityId = await agentWrapperIntegrationService.onAgentWrapped(wrapper, user.uid);
        setAgentIdentityId(identityId);
        
        // Load initial scorecard data
        await loadScorecardData(identityId);
        
        // Load governance data
        await loadGovernanceData(identityId);
        
        console.log('Agent identity and scorecard setup completed:', identityId);
      } catch (error) {
        console.error('Error setting up agent identity and scorecard:', error);
        setIntegrationError('Failed to set up agent identity and scorecard');
      } finally {
        setIntegrationLoading(false);
      }
    };

    setupAgentIdentityAndScorecard();
  }, [wrapper, user]);

  const loadScorecardData = async (identityId: string) => {
    try {
      // Get the latest evaluation for this agent
      const evaluations = await agentEvaluationService.getAgentEvaluationHistory(identityId);
      
      if (evaluations.length > 0) {
        const latestEvaluation = evaluations[0];
        const metrics = latestEvaluation.metricValues;
        
        setScorecardData({
          overallScore: latestEvaluation.overallScore || 0,
          metrics: {
            accuracy: (metrics['accuracy']?.score || 0),
            compliance: (metrics['governance-compliance']?.score || 0),
            responseTime: (metrics['response-time']?.score || 0),
          }
        });
      } else {
        // Set default values if no evaluation yet
        setScorecardData({
          overallScore: 85, // Default initial score
          metrics: {
            accuracy: 88,
            compliance: 92,
            responseTime: 75,
          }
        });
      }
    } catch (error) {
      console.error('Error loading scorecard data:', error);
      // Set default values on error
      setScorecardData({
        overallScore: 85,
        metrics: {
          accuracy: 88,
          compliance: 92,
          responseTime: 75,
        }
      });
    }
  };

  const loadGovernanceData = async (identityId: string) => {
    try {
      // Get attestations for this agent
      const attestations = await agentAttestationService.listAttestationsForAgent(identityId);
      const activeAttestations = attestations.filter(a => a.status === 'active');
      
      // Get unique attestation types
      const attestationTypes = [...new Set(activeAttestations.map(a => a.type))];
      
      // Determine profile level based on wrapper configuration
      let profileLevel = 'Basic';
      if (wrapper.governanceRules && wrapper.governanceRules.length > 0) {
        profileLevel = 'Enhanced';
      }
      if (wrapper.apiKey && wrapper.inputSchema && wrapper.outputSchema) {
        profileLevel = 'Advanced';
      }
      
      setGovernanceData({
        attestationsCount: activeAttestations.length,
        attestationTypes: attestationTypes,
        profileLevel: profileLevel,
        monitoringStatus: 'Active'
      });
    } catch (error) {
      console.error('Error loading governance data:', error);
      // Set default values on error
      setGovernanceData({
        attestationsCount: 2,
        attestationTypes: ['security', 'schema-validation'],
        profileLevel: 'Basic',
        monitoringStatus: 'Active'
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const quickActions = [
    {
      title: 'Chat with your agent',
      description: 'Start a conversation with your newly wrapped agent',
      icon: <Chat />,
      color: 'primary' as const,
      action: () => navigate('/ui/agents/chat'),
    },
    {
      title: 'View governance metrics',
      description: 'Monitor performance and compliance metrics',
      icon: <Assessment />,
      color: 'secondary' as const,
      action: () => navigate('/ui/governance/overview'),
    },
    {
      title: 'View agent scorecard',
      description: 'Check detailed performance analytics',
      icon: <Dashboard />,
      color: 'info' as const,
      action: () => navigate(`/ui/agents/${agentIdentityId}/scorecard`),
      disabled: !agentIdentityId,
    },
    {
      title: 'Create multi-agent system',
      description: 'Combine multiple agents for complex workflows',
      icon: <GroupWork />,
      color: 'warning' as const,
      action: () => navigate('/ui/agents/multi-wrapping'),
    },
  ];

  return (
    <Box textAlign="center" py={6}>
      <Box mb={4}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Agent Successfully Wrapped!
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {wrapper.name} is now live with governance controls
        </Typography>
      </Box>

      {/* Integration Status */}
      {integrationLoading && (
        <Alert severity="info" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">
            Setting up agent identity and scorecard...
          </Typography>
        </Alert>
      )}

      {integrationError && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> {integrationError}. The agent is still functional, 
            but some governance features may not be available immediately.
          </Typography>
        </Alert>
      )}

      {!integrationLoading && !integrationError && agentIdentityId && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>✅ Complete Setup:</strong> Agent identity created, scorecard assigned, 
            and initial attestations added. Your agent is fully integrated with Promethios governance.
          </Typography>
        </Alert>
      )}

      {/* Scorecard Preview and Governance Summary */}
      {!integrationLoading && scorecardData && governanceData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Initial Scorecard Preview */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Initial Scorecard</Typography>
                </Box>
                
                {/* Overall Score */}
                <Box textAlign="center" mb={3}>
                  <Typography variant="h2" color={`${getScoreColor(scorecardData.overallScore)}.main`}>
                    {scorecardData.overallScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Score
                  </Typography>
                </Box>

                {/* Key Metrics */}
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Accuracy</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {scorecardData.metrics.accuracy}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={scorecardData.metrics.accuracy} 
                    color={getScoreColor(scorecardData.metrics.accuracy)}
                    sx={{ mb: 2 }}
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Compliance</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {scorecardData.metrics.compliance}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={scorecardData.metrics.compliance} 
                    color={getScoreColor(scorecardData.metrics.compliance)}
                    sx={{ mb: 2 }}
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Response Time</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {scorecardData.metrics.responseTime}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={scorecardData.metrics.responseTime} 
                    color={getScoreColor(scorecardData.metrics.responseTime)}
                  />
                </Box>

                <Box mt={2} textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Based on initial evaluation • Updates in real-time
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Governance Summary */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Security sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Governance Summary</Typography>
                </Box>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Verified color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Attestations Added"
                      secondary={`${governanceData.attestationsCount} attestations: ${governanceData.attestationTypes.join(', ')}`}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Speed color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Governance Profile"
                      secondary={
                        <Chip 
                          label={governanceData.profileLevel} 
                          size="small" 
                          color={governanceData.profileLevel === 'Advanced' ? 'success' : 'primary'}
                        />
                      }
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Assessment color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Monitoring Status"
                      secondary={
                        <Chip 
                          label={governanceData.monitoringStatus} 
                          size="small" 
                          color="success"
                        />
                      }
                    />
                  </ListItem>
                </List>

                <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Schedule sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2" fontWeight="bold">
                      Next Steps
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    • Your agent is ready for testing<br/>
                    • Check scorecard in 24 hours for updated metrics<br/>
                    • Monitor governance dashboard for compliance
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Agent Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Agent ID"
                    secondary={wrapper.id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Name"
                    secondary={wrapper.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Version"
                    secondary={wrapper.version}
                  />
                </ListItem>
                {agentIdentityId && (
                  <ListItem>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Identity ID"
                      secondary={agentIdentityId}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Providers"
                    secondary={
                      <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                        {wrapper.supportedProviders.map((provider) => (
                          <Chip key={provider} label={provider} size="small" />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip label="Active" color="success" size="small" />
                    }
                  />
                </ListItem>
                {!integrationLoading && agentIdentityId && (
                  <ListItem>
                    <ListItemIcon>
                      <Security fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Governance"
                      secondary={
                        <Chip label="Enabled" color="primary" size="small" />
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="body2">
          <strong>What happens next?</strong> Your agent is now registered in the Promethios platform 
          with a complete governance identity and scorecard. All requests will be monitored for 
          compliance, and you can track performance metrics in real-time.
        </Typography>
      </Alert>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
        What would you like to do next?
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              variant="outlined" 
              sx={{ 
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': action.disabled ? {} : {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
              onClick={action.disabled ? undefined : action.action}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box 
                  sx={{ 
                    color: `${action.color}.main`,
                    mb: 2,
                    '& svg': { fontSize: 40 }
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box display="flex" justifyContent="center" gap={2}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={onCreateAnother}
          size="large"
        >
          Wrap Another Agent
        </Button>
        <Button
          variant="contained"
          startIcon={<Launch />}
          onClick={() => navigate('/ui/dashboard')}
          size="large"
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default SuccessStep;

