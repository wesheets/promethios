import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

  // Mock data based on backend schema
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAgentMetrics([
        {
          agent_id: 'agent-001',
          agent_name: 'Financial Analysis Agent',
          agent_type: 'single',
          trust_scores: { competence: 0.94, reliability: 0.91, honesty: 0.96, transparency: 0.88 },
          aggregate_score: 0.92,
          confidence: 0.89,
          trend: 'up',
          trend_change: 0.03,
          last_evaluation: '2025-06-20T14:30:00Z',
          total_attestations: 15,
          active_boundaries: 3,
          risk_level: 'low',
          governance_compliance: 0.95
        },
        {
          agent_id: 'agent-002',
          agent_name: 'Customer Support System',
          agent_type: 'multi_agent_system',
          trust_scores: { competence: 0.87, reliability: 0.93, honesty: 0.89, transparency: 0.85 },
          aggregate_score: 0.89,
          confidence: 0.92,
          trend: 'stable',
          trend_change: 0.01,
          last_evaluation: '2025-06-20T13:45:00Z',
          total_attestations: 22,
          active_boundaries: 5,
          risk_level: 'low',
          governance_compliance: 0.91
        },
        {
          agent_id: 'agent-003',
          agent_name: 'Data Processing Agent',
          agent_type: 'single',
          trust_scores: { competence: 0.82, reliability: 0.79, honesty: 0.91, transparency: 0.76 },
          aggregate_score: 0.82,
          confidence: 0.75,
          trend: 'down',
          trend_change: -0.05,
          last_evaluation: '2025-06-20T12:15:00Z',
          total_attestations: 8,
          active_boundaries: 2,
          risk_level: 'medium',
          governance_compliance: 0.84
        },
        {
          agent_id: 'agent-004',
          agent_name: 'Legal Compliance Bot',
          agent_type: 'single',
          trust_scores: { competence: 0.96, reliability: 0.94, honesty: 0.98, transparency: 0.92 },
          aggregate_score: 0.95,
          confidence: 0.94,
          trend: 'up',
          trend_change: 0.02,
          last_evaluation: '2025-06-20T15:00:00Z',
          total_attestations: 28,
          active_boundaries: 4,
          risk_level: 'low',
          governance_compliance: 0.98
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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

