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
  CircularProgress
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
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { agentLifecycleService, AgentLifecycleEvent } from '../services/AgentLifecycleService';
import { metricsCollectionExtension, AgentMetricsProfile } from '../extensions/MetricsCollectionExtension';
import { useAuth } from '../context/AuthContext';
import { useRealTimeMetrics } from '../hooks/useRealTimeMetrics';

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
  minHeight: '100vh'
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

interface AgentLifecycleDashboardProps {
  agentId?: string; // If provided, shows lifecycle for specific agent
}

export const AgentLifecycleDashboard: React.FC<AgentLifecycleDashboardProps> = ({ agentId: propAgentId }) => {
  const { currentUser } = useAuth();
  const { agentId: urlAgentId } = useParams<{ agentId: string }>();
  const agentId = propAgentId || urlAgentId; // Use prop first, then URL param
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Summary data
  const [summary, setSummary] = useState<{
    totalAgents: number;
    testAgents: number;
    productionAgents: number;
    deployedAgents: number;
    recentEvents: AgentLifecycleEvent[];
  } | null>(null);
  
  // Agent-specific data
  const [agentHistory, setAgentHistory] = useState<AgentLifecycleEvent[]>([]);
  
  // Real-time metrics for agent-specific view
  const testMetrics = useRealTimeMetrics(agentId || '', 'test');
  const productionMetrics = useRealTimeMetrics(agentId || '', 'production');

  useEffect(() => {
    if (currentUser?.uid) {
      loadDashboardData();
    }
  }, [currentUser?.uid, agentId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (agentId) {
        // Load specific agent lifecycle
        const history = await agentLifecycleService.getAgentLifecycleHistory(agentId);
        setAgentHistory(history);
        // Note: Metrics are now loaded via real-time hooks
      } else {
        // Load user summary
        const userSummary = await agentLifecycleService.getUserAgentLifecycleSummary(currentUser!.uid);
        setSummary(userSummary);
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
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
      {!agentId && summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <ScienceIcon sx={{ color: DARK_THEME.primary, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: DARK_THEME.primary }}>
                      {summary.totalAgents}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                      Total Agents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <ScienceIcon sx={{ color: DARK_THEME.warning, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: DARK_THEME.warning }}>
                      {summary.testAgents}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                      Test Agents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <RocketIcon sx={{ color: DARK_THEME.success, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: DARK_THEME.success }}>
                      {summary.productionAgents}
                    </Typography>
                    <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                      Production Agents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CloudIcon sx={{ color: DARK_THEME.primary, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: DARK_THEME.primary }}>
                      {summary.deployedAgents}
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
    </DashboardContainer>
  );
};

export default AgentLifecycleDashboard;

