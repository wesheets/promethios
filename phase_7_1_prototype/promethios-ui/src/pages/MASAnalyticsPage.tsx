/**
 * MAS Analytics Page
 * 
 * Comprehensive analytics and insights for multi-agent system usage.
 * Shows performance trends, orchestrator effectiveness, and learning progress.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as OrchestratorIcon,
  Group as AgentIcon,
  Assessment as MetricsIcon,
  School as LearningIcon,
  Speed as PerformanceIcon,
  CheckCircle as SuccessIcon,
  Schedule as TimeIcon,
  Chat as ConversationIcon,
  Share as ShareIcon,
  Insights as InsightsIcon,
  Star as QualityIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { 
  masPersistenceService, 
  MASAnalytics
} from '../services/persistence/MASPersistenceService';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface MASAnalyticsPageProps {}

const MASAnalyticsPage: React.FC<MASAnalyticsPageProps> = () => {
  const { currentUser } = useAuth();
  
  // State
  const [analytics, setAnalytics] = useState<MASAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Load analytics on mount
  useEffect(() => {
    loadAnalytics();
  }, [currentUser, timeRange]);

  // Load analytics from persistence service
  const loadAnalytics = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userAnalytics = await masPersistenceService.getMASAnalytics(currentUser.uid);
      setAnalytics(userAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format percentage
  const formatPercentage = (num: number) => {
    return `${Math.round(num * 100)}%`;
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  // Chart colors
  const COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#dd6b20'];

  // Prepare chart data
  const prepareOrchestratorData = () => {
    if (!analytics) return [];
    
    return Object.entries(analytics.orchestratorStats).map(([orchestrator, stats]) => ({
      name: orchestrator,
      usage: stats.usageCount,
      quality: stats.averageQualityScore,
      success: stats.averageSuccessRate,
      duration: stats.averageDuration
    }));
  };

  const prepareAgentData = () => {
    if (!analytics) return [];
    
    return Object.entries(analytics.agentStats).map(([agent, stats]) => ({
      name: agent,
      participation: stats.participationCount,
      quality: stats.averageQualityScore,
      relevance: stats.averageRelevanceScore,
      shares: stats.auditLogShareCount
    }));
  };

  const prepareGovernanceInsightsData = () => {
    if (!analytics) return [];
    
    return Object.entries(analytics.governanceStats.insightsByType).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count
    }));
  };

  const prepareLearningTrendsData = () => {
    if (!analytics) return [];
    
    const trends = analytics.learningStats.improvementTrends;
    return [
      { name: 'Quality', improvement: trends.qualityImprovement * 100 },
      { name: 'Governance', improvement: trends.governanceImprovement * 100 },
      { name: 'Efficiency', improvement: trends.efficiencyImprovement * 100 }
    ];
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please log in to view your MAS analytics.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: '#a0aec0' }}>Loading analytics...</Typography>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No analytics data available yet. Start some conversations to see insights!
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
            📊 MAS Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            Insights and performance metrics for your multi-agent conversations
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: '#a0aec0' }}>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
            }}
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="all">All time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ConversationIcon sx={{ color: '#3182ce', fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {formatNumber(analytics.totalConversations)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Total Conversations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chat sx={{ color: '#38a169', fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {formatNumber(analytics.totalMessages)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Total Messages
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <QualityIcon sx={{ color: '#d69e2e', fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {formatPercentage(analytics.averageQualityScore)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Avg Quality Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimeIcon sx={{ color: '#805ad5', fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    {formatDuration(analytics.averageConversationDuration)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Avg Duration
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Orchestrator Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <OrchestratorIcon sx={{ color: '#3182ce' }} />
                Orchestrator Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareOrchestratorData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis dataKey="name" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="usage" fill="#3182ce" name="Usage Count" />
                  <Bar dataKey="quality" fill="#38a169" name="Quality Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Governance Insights Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsightsIcon sx={{ color: '#38a169' }} />
                Governance Insights
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareGovernanceInsightsData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareGovernanceInsightsData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      color: 'white'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Learning Improvement Trends */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LearningIcon sx={{ color: '#d69e2e' }} />
                Learning Improvement Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareLearningTrendsData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis dataKey="name" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      color: 'white'
                    }}
                    formatter={(value) => [`${value}%`, 'Improvement']}
                  />
                  <Bar dataKey="improvement" fill="#d69e2e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AgentIcon sx={{ color: '#805ad5' }} />
                Agent Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={prepareAgentData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis dataKey="name" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="participation" 
                    stackId="1" 
                    stroke="#805ad5" 
                    fill="#805ad5" 
                    name="Participation"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="quality" 
                    stackId="2" 
                    stroke="#38a169" 
                    fill="#38a169" 
                    name="Quality"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Statistics */}
      <Grid container spacing={3}>
        {/* Orchestrator Statistics Table */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Orchestrator Statistics
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Orchestrator</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Usage</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Quality</TableCell>
                      <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Success</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(analytics.orchestratorStats).map(([orchestrator, stats]) => (
                      <TableRow key={orchestrator}>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          {orchestrator}
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          {stats.usageCount}
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          {formatPercentage(stats.averageQualityScore)}
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          {formatPercentage(stats.averageSuccessRate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Insights */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Key Insights
              </Typography>
              
              {/* Governance Compliance */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Governance Compliance
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {formatPercentage(analytics.averageGovernanceCompliance)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analytics.averageGovernanceCompliance * 100}
                  sx={{
                    backgroundColor: '#4a5568',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: analytics.averageGovernanceCompliance > 0.8 ? '#38a169' : 
                                     analytics.averageGovernanceCompliance > 0.6 ? '#d69e2e' : '#e53e3e'
                    }
                  }}
                />
              </Box>

              {/* Audit Log Shares */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                  Total Audit Log Shares
                </Typography>
                <Typography variant="h5" sx={{ color: '#3182ce', fontWeight: 600 }}>
                  {formatNumber(analytics.totalAuditLogShares)}
                </Typography>
              </Box>

              {/* Top Recommendations */}
              <Box>
                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                  Top Recommendations
                </Typography>
                {analytics.governanceStats.topRecommendations.slice(0, 3).map((rec, index) => (
                  <Chip
                    key={index}
                    label={rec}
                    size="small"
                    sx={{
                      backgroundColor: '#4a5568',
                      color: '#a0aec0',
                      fontSize: '0.7rem',
                      mb: 0.5,
                      mr: 0.5,
                      display: 'block',
                      width: 'fit-content'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MASAnalyticsPage;

