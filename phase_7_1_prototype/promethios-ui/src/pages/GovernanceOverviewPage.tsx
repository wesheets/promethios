/**
 * Governance Overview Page
 * 
 * Comprehensive governance dashboard showing metrics from PRISM, VIGIL, 
 * and other observability systems for both single agents and multi-agent systems.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Alert,
  Divider,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Security,
  Shield,
  Warning,
  CheckCircle,
  TrendingUp,
  Assessment,
  Visibility,
  Refresh,
  Download,
  Error,
  Info,
  FilterList,
  Person,
  Group,
  Compare
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  observerService, 
  PRISMMetrics, 
  PRISMViolation, 
  VigilMetrics, 
  VigilViolation,
  TrustSnapshot,
  GovernanceAwareness 
} from '../services/observers';

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
      id={`governance-tabpanel-${index}`}
      aria-labelledby={`governance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GovernanceOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'all' | 'single' | 'multi'>('all');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [multiAgentSystems, setMultiAgentSystems] = useState<string[]>([]);
  const [selectedMultiAgentSystem, setSelectedMultiAgentSystem] = useState<string>('');
  const [prismMetrics, setPrismMetrics] = useState<PRISMMetrics | null>(null);
  const [prismViolations, setPrismViolations] = useState<PRISMViolation[]>([]);
  const [vigilMetrics, setVigilMetrics] = useState<VigilMetrics | null>(null);
  const [vigilViolations, setVigilViolations] = useState<VigilViolation[]>([]);
  const [trustSnapshots, setTrustSnapshots] = useState<TrustSnapshot[]>([]);
  const [governanceAwareness, setGovernanceAwareness] = useState<GovernanceAwareness | null>(null);

  useEffect(() => {
    const fetchGovernanceData = async () => {
      setLoading(true);
      try {
        const [
          prismMetricsData,
          prismViolationsData,
          vigilMetricsData,
          vigilViolationsData,
          trustSnapshotsData,
          governanceAwarenessData
        ] = await Promise.all([
          observerService.getPRISMMetrics(),
          observerService.getPRISMViolations(),
          observerService.getVigilMetrics(),
          observerService.getVigilViolations(),
          observerService.getTrustSnapshots(),
          observerService.getGovernanceAwareness()
        ]);

        setPrismMetrics(prismMetricsData);
        setPrismViolations(prismViolationsData);
        setVigilMetrics(vigilMetricsData);
        setVigilViolations(vigilViolationsData);
        setTrustSnapshots(trustSnapshotsData);
        setGovernanceAwareness(governanceAwarenessData);
      } catch (error) {
        console.error('Error fetching governance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGovernanceData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const calculateOverallGovernanceScore = () => {
    if (!prismMetrics || !vigilMetrics || !governanceAwareness) return 0;
    
    // Calculate based on various factors
    const trustScore = Object.values(vigilMetrics.trustScores).reduce((a, b) => a + b, 0) / Object.values(vigilMetrics.trustScores).length;
    const violationPenalty = (prismViolations.length + vigilViolations.length) * 2;
    const awarenessScore = governanceAwareness.overall;
    
    return Math.max(0, Math.min(100, (trustScore * 100 + awarenessScore - violationPenalty) / 2));
  };

  const getGovernanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#10B981', icon: <CheckCircle /> };
    if (score >= 75) return { level: 'Good', color: '#3B82F6', icon: <Shield /> };
    if (score >= 60) return { level: 'Fair', color: '#F59E0B', icon: <Warning /> };
    return { level: 'Needs Improvement', color: '#EF4444', icon: <Error /> };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const exportGovernanceReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      overall_score: calculateOverallGovernanceScore(),
      prism_metrics: prismMetrics,
      prism_violations: prismViolations,
      vigil_metrics: vigilMetrics,
      vigil_violations: vigilViolations,
      trust_snapshots: trustSnapshots,
      governance_awareness: governanceAwareness
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box p={4}>
        <Typography variant="h4" gutterBottom>Governance Overview</Typography>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading governance data from PRISM, VIGIL, and other observers...
        </Typography>
      </Box>
    );
  }

  const overallScore = calculateOverallGovernanceScore();
  const governanceLevel = getGovernanceLevel(overallScore);

  return (
    <Box p={4}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Governance Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive governance monitoring across all agents and systems
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportGovernanceReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {Math.round(overallScore)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Governance Score
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: governanceLevel.color }}>
                  {governanceLevel.icon}
                </Avatar>
              </Box>
              <Box mt={1}>
                <Chip 
                  label={governanceLevel.level} 
                  size="small" 
                  sx={{ bgcolor: governanceLevel.color, color: 'white' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="success.main" gutterBottom>
                    {vigilMetrics ? Object.keys(vigilMetrics.trustScores).length : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitored Agents
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Security />
                </Avatar>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Active governance monitoring
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="warning.main" gutterBottom>
                    {prismViolations.length + vigilViolations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Violations
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Warning />
                </Avatar>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Across all systems
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="info.main" gutterBottom>
                    {governanceAwareness?.overall || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Governance Awareness
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Assessment />
                </Avatar>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Self-reflection quality
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="PRISM Observer" />
            <Tab label="VIGIL Observer" />
            <Tab label="Trust Metrics" />
            <Tab label="Multi-Agent Systems" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* PRISM Observer Data */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Tool Usage Patterns" />
                <CardContent>
                  {prismMetrics && (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={Object.entries(prismMetrics.toolUsage).map(([tool, data]) => ({
                        tool,
                        count: data.count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tool" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Recent PRISM Violations" />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Tool</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {prismViolations.slice(0, 5).map((violation, index) => (
                          <TableRow key={index}>
                            <TableCell>{violation.type}</TableCell>
                            <TableCell>
                              <Chip
                                label={violation.severity}
                                size="small"
                                sx={{ 
                                  bgcolor: getSeverityColor(violation.severity),
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            <TableCell>{violation.tool || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* VIGIL Observer Data */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Loop Outcomes" />
                <CardContent>
                  {vigilMetrics && (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Success', value: vigilMetrics.loopOutcomes.success, fill: '#10B981' },
                            { name: 'Failure', value: vigilMetrics.loopOutcomes.failure, fill: '#EF4444' },
                            { name: 'Unreflected', value: vigilMetrics.loopOutcomes.unreflected, fill: '#F59E0B' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label
                        />
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Drift Detection Stats" />
                <CardContent>
                  {vigilMetrics && (
                    <Box>
                      <Box mb={2}>
                        <Typography variant="body2" gutterBottom>
                          Total Goals: {vigilMetrics.driftStats.totalGoals}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={100}
                          sx={{ height: 8, borderRadius: 4, bgcolor: '#E5E7EB' }}
                        />
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" gutterBottom>
                          Drift Detected: {vigilMetrics.driftStats.driftDetected}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(vigilMetrics.driftStats.driftDetected / vigilMetrics.driftStats.totalGoals) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                          color="warning"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Significant Drift: {vigilMetrics.driftStats.significantDrift}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(vigilMetrics.driftStats.significantDrift / vigilMetrics.driftStats.totalGoals) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                          color="error"
                        />
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Trust Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardHeader title="Trust Score Trends" />
                <CardContent>
                  {trustSnapshots.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trustSnapshots}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis domain={[0, 1]} />
                        <RechartsTooltip 
                          formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Trust Score']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="trustScore" 
                          stroke="#10B981" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardHeader title="Current Trust Scores" />
                <CardContent>
                  {vigilMetrics && Object.entries(vigilMetrics.trustScores).map(([agentId, score]) => (
                    <Box key={agentId} mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{agentId}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {Math.round(score * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={score * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                        color={score > 0.8 ? 'success' : score > 0.6 ? 'warning' : 'error'}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {/* Multi-Agent Systems */}
          <Alert severity="info" sx={{ mb: 3 }}>
            Multi-agent governance data will be integrated here from the multi-agent coordination system.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Multi-Agent Contexts" />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Active multi-agent contexts and their governance status will be displayed here.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Collaboration Metrics" />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Agent collaboration quality and governance compliance metrics.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default GovernanceOverviewPage;

