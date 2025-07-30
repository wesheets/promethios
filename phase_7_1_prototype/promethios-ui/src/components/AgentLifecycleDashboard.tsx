/**
 * Agent Lifecycle Dashboard Component
 * 
 * Displays agent lifecycle information including creation, wrapping, deployment,
 * and metrics tracking across the agent's journey from test to production.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Science as ScienceIcon,
  Rocket as RocketIcon,
  Cloud as CloudIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { agentLifecycleService, AgentLifecycleEvent, AgentWithLifecycleStatus } from '../services/AgentLifecycleService';
import { metricsCollectionExtension, AgentMetricsProfile } from '../extensions/MetricsCollectionExtension';
import { useAuth } from '../context/AuthContext';
import { useRealTimeMetrics } from '../hooks/useRealTimeMetrics';
import { useOptimizedLifecycleDashboard } from '../hooks/useOptimizedLifecycleDashboard';
import LifecycleMigrationPanel from './LifecycleMigrationPanel';

// Dark theme colors
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e'
};

const DashboardContainer = styled(Box)(() => ({
  padding: '24px',
  backgroundColor: DARK_THEME.background,
  color: DARK_THEME.text.primary,
  minHeight: '100vh',
  '& .MuiTypography-root': {
    color: DARK_THEME.text.primary
  },
  '& .MuiAlert-root': {
    backgroundColor: DARK_THEME.surface,
    color: DARK_THEME.text.primary,
    border: `1px solid ${DARK_THEME.border}`
  },
  '& .MuiLinearProgress-root': {
    backgroundColor: DARK_THEME.border,
    '& .MuiLinearProgress-bar': {
      backgroundColor: DARK_THEME.primary
    }
  }
}));

const StatsCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  '& .MuiCardContent-root': {
    padding: '20px'
  }
}));

const TimelineCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  marginTop: '24px'
}));

const AgentTable = styled(TableContainer)(() => ({
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '8px',
  '& .MuiTableHead-root': {
    backgroundColor: DARK_THEME.background,
  },
  '& .MuiTableCell-root': {
    color: DARK_THEME.text.primary,
    borderColor: DARK_THEME.border,
  },
  '& .MuiTableCell-head': {
    backgroundColor: DARK_THEME.background,
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: `${DARK_THEME.border}20`,
  }
}));

const StatusIcon = styled(Box)<{ status: boolean }>(({ status }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: status ? DARK_THEME.success : DARK_THEME.error,
}));

interface AgentLifecycleDashboardProps {
  agentId?: string; // If provided, shows lifecycle for specific agent
}

export const AgentLifecycleDashboard: React.FC<AgentLifecycleDashboardProps> = ({ agentId: propAgentId }) => {
  const { currentUser } = useAuth();
  const { agentId: urlAgentId } = useParams<{ agentId: string }>();
  const agentId = propAgentId || urlAgentId; // Use prop first, then URL param
  
  // State for production agents
  const [productionAgents, setProductionAgents] = useState<AgentWithLifecycleStatus[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  
  // Use optimized lifecycle dashboard hook
  const {
    metrics,
    agentHistory,
    isLoading,
    error,
    refreshData,
    cacheAge,
    lastRefresh,
    isOptimized
  } = useOptimizedLifecycleDashboard(agentId);
  
  // Load production agents
  useEffect(() => {
    const loadProductionAgents = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setAgentsLoading(true);
        setAgentsError(null);
        console.log('🔄 Loading production agents for lifecycle dashboard...');
        
        const agents = await agentLifecycleService.getProductionAgentsWithLifecycleStatus(currentUser.uid);
        console.log('✅ Production agents loaded:', agents.length);
        
        setProductionAgents(agents);
      } catch (error) {
        console.error('❌ Failed to load production agents:', error);
        setAgentsError(error instanceof Error ? error.message : 'Failed to load agents');
      } finally {
        setAgentsLoading(false);
      }
    };
    
    loadProductionAgents();
  }, [currentUser?.uid]);
  
  // Extract summary from metrics for backward compatibility
  const summary = metrics?.summary;
  
  // Real-time metrics for agent-specific view
  const testMetrics = useRealTimeMetrics(agentId || '', 'test');
  const productionMetrics = useRealTimeMetrics(agentId || '', 'production');

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <ScienceIcon sx={{ color: DARK_THEME.primary }} />;
      case 'wrapped':
      case 'promoted':
        return <RocketIcon sx={{ color: DARK_THEME.warning }} />;
      case 'deployed':
        return <CloudIcon sx={{ color: DARK_THEME.success }} />;
      default:
        return <InfoIcon sx={{ color: DARK_THEME.text.secondary }} />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return DARK_THEME.primary;
      case 'wrapped':
      case 'promoted':
        return DARK_THEME.warning;
      case 'deployed':
        return DARK_THEME.success;
      default:
        return DARK_THEME.text.secondary;
    }
  };

  // Navigation functions for clickable status icons
  const handleWrapAgent = (agentId: string) => {
    // Navigate to agent wrapping page with specific agent
    window.location.href = `/ui/agents/wrapping?agentId=${agentId}`;
  };

  const handleDeployAgent = (agentId: string) => {
    // Navigate to deployment page with specific agent
    window.location.href = `/ui/agents/wrapping?agentId=${agentId}&tab=deployment`;
  };

  if (loading) {
    return (
      <DashboardContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress sx={{ color: DARK_THEME.primary }} />
        </Box>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Alert severity="error" sx={{ backgroundColor: DARK_THEME.error + '20', color: DARK_THEME.error }}>
          {error}
        </Alert>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        {agentId ? 'Agent Lifecycle Details' : 'Agent Lifecycle Dashboard'}
      </Typography>

      {/* Summary Stats (for user dashboard) */}
      {!agentId && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <RocketIcon sx={{ color: DARK_THEME.success, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: DARK_THEME.success }}>
                      {productionAgents.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                      Production Agents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CloudIcon sx={{ color: DARK_THEME.primary, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: DARK_THEME.primary }}>
                      {productionAgents.filter(a => a.lifecycleStatus.deployed).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                      Deployed Agents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>
      )}

      {/* Agent Metrics (for specific agent) */}
      {agentId && (testMetrics.isInitialized || productionMetrics.isInitialized) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {testMetrics.isInitialized && (
            <Grid item xs={12} md={6}>
              <StatsCard>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: DARK_THEME.warning }}>
                    Test Agent Metrics
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Trust Score</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(testMetrics.trustScore * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={testMetrics.trustScore * 100}
                    sx={{ mb: 2, backgroundColor: DARK_THEME.border }}
                  />
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                    Total Interactions: {testMetrics.totalInteractions} | 
                    Last Updated: {testMetrics.lastUpdate.toLocaleTimeString()}
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          )}

          {productionMetrics.isInitialized && (
            <Grid item xs={12} md={6}>
              <StatsCard>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: DARK_THEME.success }}>
                    Production Agent Metrics
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Trust Score</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(productionMetrics.trustScore * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={productionMetrics.trustScore * 100}
                    sx={{ mb: 2, backgroundColor: DARK_THEME.border }}
                  />
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                    Deployments: {productionMetrics.profile?.deployments.length || 0} | 
                    Interactions: {productionMetrics.totalInteractions} | 
                    Last Updated: {productionMetrics.lastUpdate.toLocaleTimeString()}
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          )}
        </Grid>
      )}

      {/* Production Agents Table - Only show in overview mode */}
      {!agentId && (
        <Card sx={{ mb: 4, backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}` }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                Production Agents Lifecycle Status
              </Typography>
              <Tooltip title="Refresh agent data">
                <IconButton 
                  onClick={() => window.location.reload()} 
                  sx={{ color: DARK_THEME.text.secondary }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {agentsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress sx={{ color: DARK_THEME.primary }} />
              </Box>
            ) : agentsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {agentsError}
              </Alert>
            ) : productionAgents.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No production agents found. Create and wrap some agents to see them here.
              </Alert>
            ) : (
              <AgentTable component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent Name</TableCell>
                      <TableCell align="center">Created</TableCell>
                      <TableCell align="center">Wrapped</TableCell>
                      <TableCell align="center">Deployed</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Last Activity</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productionAgents.map((agentWithStatus) => {
                      const { agent, lifecycleStatus, lastActivity } = agentWithStatus;
                      
                      return (
                        <TableRow key={agent.identity.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {agent.identity.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                                {agent.identity.id}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center">
                            <StatusIcon status={lifecycleStatus.created}>
                              {lifecycleStatus.created ? (
                                <CheckCircleIcon fontSize="small" />
                              ) : (
                                <CancelIcon fontSize="small" />
                              )}
                            </StatusIcon>
                          </TableCell>
                          
                          <TableCell align="center">
                            {lifecycleStatus.wrapped ? (
                              <StatusIcon status={true}>
                                <CheckCircleIcon fontSize="small" />
                              </StatusIcon>
                            ) : (
                              <StatusIcon 
                                status={false} 
                                onClick={() => handleWrapAgent(agent.identity.id)}
                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                                title="Click to wrap this agent"
                              >
                                <CancelIcon fontSize="small" />
                              </StatusIcon>
                            )}
                          </TableCell>
                          
                          <TableCell align="center">
                            {lifecycleStatus.deployed ? (
                              <StatusIcon status={true}>
                                <CheckCircleIcon fontSize="small" />
                              </StatusIcon>
                            ) : (
                              <StatusIcon 
                                status={false} 
                                onClick={() => handleDeployAgent(agent.identity.id)}
                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                                title="Click to deploy this agent"
                              >
                                <CancelIcon fontSize="small" />
                              </StatusIcon>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {agent.apiDetails?.provider || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                              {agent.apiDetails?.selectedModel || 'No model'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {lastActivity ? new Date(lastActivity).toLocaleDateString() : 'Never'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                              {lastActivity ? new Date(lastActivity).toLocaleTimeString() : ''}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={agent.healthStatus || 'Unknown'}
                              size="small"
                              sx={{
                                backgroundColor: 
                                  agent.healthStatus === 'healthy' ? `${DARK_THEME.success}20` :
                                  agent.healthStatus === 'warning' ? `${DARK_THEME.warning}20` :
                                  `${DARK_THEME.error}20`,
                                color:
                                  agent.healthStatus === 'healthy' ? DARK_THEME.success :
                                  agent.healthStatus === 'warning' ? DARK_THEME.warning :
                                  DARK_THEME.error
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </AgentTable>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <TimelineCard>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {agentId ? 'Agent Lifecycle Timeline' : 'Recent Lifecycle Events'}
          </Typography>

          <Timeline>
            {(agentId ? agentHistory : summary?.recentEvents || []).map((event, index) => (
              <TimelineItem key={event.eventId}>
                <TimelineSeparator>
                  <TimelineDot sx={{ backgroundColor: getEventColor(event.eventType) }}>
                    {getEventIcon(event.eventType)}
                  </TimelineDot>
                  {index < (agentId ? agentHistory : summary?.recentEvents || []).length - 1 && (
                    <TimelineConnector sx={{ backgroundColor: DARK_THEME.border }} />
                  )}
                </TimelineSeparator>
                <TimelineContent>
                  <Box sx={{ pb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip 
                        label={event.eventType.toUpperCase()} 
                        size="small"
                        sx={{ 
                          backgroundColor: getEventColor(event.eventType) + '20',
                          color: getEventColor(event.eventType),
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                      Agent: {event.agentId}
                    </Typography>
                    
                    {event.metadata && (
                      <Box>
                        {event.metadata.agentName && (
                          <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block' }}>
                            Name: {event.metadata.agentName}
                          </Typography>
                        )}
                        {event.metadata.deploymentUrl && (
                          <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block' }}>
                            URL: {event.metadata.deploymentUrl}
                          </Typography>
                        )}
                        {event.metadata.metricsProfileCreated && (
                          <Chip 
                            label="Metrics Profile Created" 
                            size="small"
                            sx={{ 
                              mt: 0.5,
                              backgroundColor: DARK_THEME.success + '20',
                              color: DARK_THEME.success
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>

          {(agentId ? agentHistory : summary?.recentEvents || []).length === 0 && (
            <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary, textAlign: 'center', py: 4 }}>
              No lifecycle events found
            </Typography>
          )}
        </CardContent>
      </TimelineCard>

      {/* Migration Panel - Only show in overview mode (not for specific agents) */}
      {!agentId && (
        <LifecycleMigrationPanel />
      )}
    </DashboardContainer>
  );
};

export default AgentLifecycleDashboard;

