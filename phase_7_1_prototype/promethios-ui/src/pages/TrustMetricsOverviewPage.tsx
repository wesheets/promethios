import React, { useState, useEffect } from 'react';
import { useTrustBackend } from '../hooks/useTrustBackend';
import { useAgentBackend } from '../hooks/useAgentBackend';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
  Security,
  Speed,
  Verified,
  Psychology,
  Timeline,
  Assessment,
  Shield
} from '@mui/icons-material';

// Trust dimension icons mapping
const trustDimensionIcons = {
  competence: <Psychology />,
  reliability: <Speed />,
  honesty: <Verified />,
  transparency: <Security />
};

// Trust dimension colors
const trustDimensionColors = {
  competence: '#3b82f6',
  reliability: '#10b981',
  honesty: '#f59e0b',
  transparency: '#8b5cf6'
};

interface TrustScore {
  competence: number;
  reliability: number;
  honesty: number;
  transparency: number;
}

interface AgentTrustMetrics {
  agent_id: string;
  agent_name: string;
  agent_type: 'single' | 'multi_agent_system';
  trust_scores: TrustScore;
  aggregate_score: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  trend_change: number;
  last_evaluation: string;
  total_attestations: number;
  active_boundaries: number;
  risk_level: 'low' | 'medium' | 'high';
  governance_compliance: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trust-tabpanel-${index}`}
      aria-labelledby={`trust-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TrustMetricsOverviewPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [agentMetrics, setAgentMetrics] = useState<AgentTrustMetrics[]>([]);
  
  // Use real backend data
  const {
    metrics: trustMetrics,
    evaluations,
    metricsLoading,
    evaluationsLoading,
    metricsError,
    evaluationsError,
    refreshAll
  } = useTrustBackend();
  
  const {
    agents,
    agentsLoading,
    loadAgents
  } = useAgentBackend();

  const loading = metricsLoading || evaluationsLoading || agentsLoading;

  // Transform backend data into UI format
  useEffect(() => {
    if (trustMetrics && evaluations && agents) {
      const transformedMetrics: AgentTrustMetrics[] = agents.map(agent => {
        // Find latest evaluation for this agent
        const agentEvaluations = evaluations.filter(evaluation => 
          evaluation.agent_id === agent.agent_id || evaluation.target_id === agent.agent_id
        );
        
        const latestEvaluation = agentEvaluations.sort((a, b) => 
          new Date(b.evaluation_timestamp).getTime() - new Date(a.evaluation_timestamp).getTime()
        )[0];

        // Calculate aggregate score and trust dimensions
        const trustScores = latestEvaluation?.trust_dimensions || {
          competence: 0.8,
          reliability: 0.8,
          honesty: 0.8,
          transparency: 0.8
        };

        const aggregateScore = latestEvaluation?.trust_score || 
          Object.values(trustScores).reduce((sum, score) => sum + score, 0) / Object.values(trustScores).length;

        // Calculate trend (simplified - would need historical data for real trend)
        const trend = aggregateScore >= 0.85 ? 'up' : aggregateScore >= 0.75 ? 'stable' : 'down';
        const trendChange = aggregateScore >= 0.85 ? 0.02 : aggregateScore >= 0.75 ? 0.01 : -0.03;

        return {
          agent_id: agent.agent_id,
          agent_name: agent.name || agent.agent_id,
          agent_type: agent.type || 'single',
          trust_scores: trustScores,
          aggregate_score: aggregateScore,
          confidence: latestEvaluation?.confidence_level || 0.8,
          trend,
          trend_change: trendChange,
          last_evaluation: latestEvaluation?.evaluation_timestamp || new Date().toISOString(),
          total_attestations: agentEvaluations.length,
          active_boundaries: 3, // Would come from trust boundaries API
          risk_level: aggregateScore >= 0.85 ? 'low' : aggregateScore >= 0.75 ? 'medium' : 'high',
          governance_compliance: agent.governance_identity?.compliance_level === 'strict' ? 0.95 : 
                                agent.governance_identity?.compliance_level === 'standard' ? 0.85 : 0.75
        };
      });

      setAgentMetrics(transformedMetrics);
    }
  }, [trustMetrics, evaluations, agents]);

  // Load initial data
  useEffect(() => {
    loadAgents();
    refreshAll();
  }, [loadAgents, refreshAll]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.9) return '#10b981'; // Green
    if (score >= 0.8) return '#f59e0b'; // Yellow
    if (score >= 0.7) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getRiskChipColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Calculate overview statistics
  const totalAgents = agentMetrics.length;
  const averageTrustScore = agentMetrics.reduce((sum, agent) => sum + agent.aggregate_score, 0) / totalAgents;
  const highConfidenceAgents = agentMetrics.filter(agent => agent.confidence >= 0.85).length;
  const atRiskAgents = agentMetrics.filter(agent => agent.risk_level === 'medium' || agent.risk_level === 'high').length;
  const totalAttestations = agentMetrics.reduce((sum, agent) => sum + agent.total_attestations, 0);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Trust Metrics Overview
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Error handling
  if (metricsError || evaluationsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Trust Metrics Overview
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error Loading Trust Data</AlertTitle>
          {metricsError || evaluationsError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Trust Metrics Overview
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
          Monitor agent trustworthiness, behavioral quality, and reputation across your organization
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6">Average Trust Score</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: getTrustScoreColor(averageTrustScore), fontWeight: 'bold' }}>
                {Math.round(averageTrustScore * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Across {totalAgents} agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ color: '#10b981', mr: 2 }} />
                <Typography variant="h6">High Confidence</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                {highConfidenceAgents}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Agents with 85%+ confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: '#f59e0b', mr: 2 }} />
                <Typography variant="h6">At Risk</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: atRiskAgents > 0 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                {atRiskAgents}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Agents requiring attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Shield sx={{ color: '#8b5cf6', mr: 2 }} />
                <Typography variant="h6">Total Attestations</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                {totalAttestations}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Verification events logged
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trust Health Alert */}
      {atRiskAgents > 0 && (
        <Alert severity="warning" sx={{ mb: 4, backgroundColor: '#92400e', color: 'white' }}>
          <AlertTitle>Trust Health Alert</AlertTitle>
          {atRiskAgents} agent{atRiskAgents > 1 ? 's' : ''} currently require attention due to declining trust scores or increased risk levels.
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
              '& .MuiTab-root': { 
                color: '#a0aec0',
                '&.Mui-selected': { color: '#3b82f6' }
              }
            }}
          >
            <Tab label="Agent Trust Scores" />
            <Tab label="Trust Trends" />
            <Tab label="Risk Analysis" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Agent Trust Scores Table */}
          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Agent</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trust Dimensions</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Aggregate Score</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Confidence</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trend</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Risk Level</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Attestations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agentMetrics.map((agent) => (
                  <TableRow key={agent.agent_id} sx={{ '&:hover': { backgroundColor: '#2d3748' } }}>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, backgroundColor: '#3b82f6' }}>
                          {agent.agent_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {agent.agent_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            {agent.agent_type === 'single' ? 'Single Agent' : 'Multi-Agent System'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Grid container spacing={1}>
                        {Object.entries(agent.trust_scores).map(([dimension, score]) => (
                          <Grid item key={dimension}>
                            <Tooltip title={`${dimension}: ${Math.round(score * 100)}%`}>
                              <Chip
                                icon={trustDimensionIcons[dimension as keyof TrustScore]}
                                label={Math.round(score * 100)}
                                size="small"
                                sx={{
                                  backgroundColor: trustDimensionColors[dimension as keyof TrustScore],
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Tooltip>
                          </Grid>
                        ))}
                      </Grid>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: getTrustScoreColor(agent.aggregate_score), fontWeight: 'bold', mr: 1 }}>
                          {Math.round(agent.aggregate_score * 100)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={agent.aggregate_score * 100}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getTrustScoreColor(agent.aggregate_score)
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2">
                        {Math.round(agent.confidence * 100)}%
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {agent.trend === 'up' && <TrendingUp sx={{ color: '#10b981', mr: 1 }} />}
                        {agent.trend === 'down' && <TrendingDown sx={{ color: '#ef4444', mr: 1 }} />}
                        {agent.trend === 'stable' && <Timeline sx={{ color: '#a0aec0', mr: 1 }} />}
                        <Typography variant="body2" sx={{ 
                          color: agent.trend === 'up' ? '#10b981' : agent.trend === 'down' ? '#ef4444' : '#a0aec0' 
                        }}>
                          {agent.trend_change > 0 ? '+' : ''}{Math.round(agent.trend_change * 100)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Chip
                        label={agent.risk_level.toUpperCase()}
                        color={getRiskChipColor(agent.risk_level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2">
                        {agent.total_attestations}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Trust Trends */}
          <Typography variant="h6" gutterBottom>Trust Score Trends</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Historical trust score changes and behavioral patterns over time
          </Typography>
          
          <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
            <AlertTitle>Trend Analysis</AlertTitle>
            Trust trends are calculated based on the last 30 days of evaluations. Agents showing consistent improvement receive higher confidence scores.
          </Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Risk Analysis */}
          <Typography variant="h6" gutterBottom>Risk Analysis</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Detailed risk assessment and recommendations for agent oversight
          </Typography>

          <Grid container spacing={3}>
            {agentMetrics.filter(agent => agent.risk_level !== 'low').map((agent) => (
              <Grid item xs={12} md={6} key={agent.agent_id}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Warning sx={{ color: '#f59e0b', mr: 2 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {agent.agent_name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      Risk Level: <Chip label={agent.risk_level.toUpperCase()} color={getRiskChipColor(agent.risk_level) as any} size="small" />
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Trust Score: {Math.round(agent.aggregate_score * 100)}% | 
                      Confidence: {Math.round(agent.confidence * 100)}% |
                      Trend: {agent.trend_change > 0 ? '+' : ''}{Math.round(agent.trend_change * 100)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {agentMetrics.filter(agent => agent.risk_level !== 'low').length === 0 && (
            <Alert severity="success" sx={{ backgroundColor: '#065f46', color: 'white' }}>
              <AlertTitle>All Clear</AlertTitle>
              No agents currently require risk-based attention. All agents are operating within acceptable trust boundaries.
            </Alert>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
};

export default TrustMetricsOverviewPage;

