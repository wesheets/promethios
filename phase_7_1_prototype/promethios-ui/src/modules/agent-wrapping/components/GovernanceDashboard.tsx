/**
 * Governance Dashboard for Single Agents
 * 
 * Provides comprehensive governance insights, metrics,
 * and monitoring for wrapped single agents.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Security,
  TrendingUp,
  Assessment,
  Shield,
  CheckCircle,
  Warning,
  Error,
  Visibility,
  Download,
  Refresh,
  Info,
  Timeline,
  BarChart
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';

interface GovernanceMetrics {
  agentId: string;
  agentName: string;
  totalRequests: number;
  averageTrustScore: number;
  complianceRate: number;
  averageResponseTime: number;
  policyViolations: number;
  lastAudit: string;
  governanceScore: number;
  trustTrend: Array<{ timestamp: string; score: number }>;
  complianceTrend: Array<{ timestamp: string; rate: number }>;
  recentViolations: Array<{
    id: string;
    timestamp: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

interface GovernanceDashboardProps {
  agentId: string;
  agentName: string;
}

const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({
  agentId,
  agentName
}) => {
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showViolationDetails, setShowViolationDetails] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Simulate loading governance metrics
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data
      const mockMetrics: GovernanceMetrics = {
        agentId,
        agentName,
        totalRequests: 1247,
        averageTrustScore: 0.87,
        complianceRate: 0.94,
        averageResponseTime: 2.3,
        policyViolations: 3,
        lastAudit: new Date().toISOString(),
        governanceScore: 92,
        trustTrend: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          score: 0.8 + Math.random() * 0.15
        })),
        complianceTrend: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rate: 0.9 + Math.random() * 0.1
        })),
        recentViolations: [
          {
            id: 'v1',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Trust Threshold',
            severity: 'low',
            description: 'Response trust score (68%) below threshold (70%)'
          },
          {
            id: 'v2',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Response Time',
            severity: 'medium',
            description: 'Response time (4.2s) exceeded policy limit (3.5s)'
          },
          {
            id: 'v3',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Content Policy',
            severity: 'low',
            description: 'Response flagged for potential policy concern'
          }
        ]
      };
      
      setMetrics(mockMetrics);
      setLoading(false);
    };

    loadMetrics();
  }, [agentId, agentName, selectedTimeRange]);

  const getGovernanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#10B981', icon: <CheckCircle /> };
    if (score >= 75) return { level: 'Good', color: '#3B82F6', icon: <Shield /> };
    if (score >= 60) return { level: 'Fair', color: '#F59E0B', icon: <Warning /> };
    return { level: 'Needs Improvement', color: '#EF4444', icon: <Error /> };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const downloadReport = () => {
    if (!metrics) return;

    const report = {
      agent_id: metrics.agentId,
      agent_name: metrics.agentName,
      report_generated: new Date().toISOString(),
      time_range: selectedTimeRange,
      summary: {
        governance_score: metrics.governanceScore,
        total_requests: metrics.totalRequests,
        average_trust_score: metrics.averageTrustScore,
        compliance_rate: metrics.complianceRate,
        average_response_time: metrics.averageResponseTime,
        policy_violations: metrics.policyViolations
      },
      trends: {
        trust_scores: metrics.trustTrend,
        compliance_rates: metrics.complianceTrend
      },
      violations: metrics.recentViolations
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance_report_${agentName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Governance Dashboard</Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading governance metrics...
        </Typography>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load governance metrics</Alert>
      </Box>
    );
  }

  const governanceLevel = getGovernanceLevel(metrics.governanceScore);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Governance Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metrics.agentName} • Last updated: {new Date().toLocaleString()}
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
            onClick={downloadReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {metrics.governanceScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Governance Score
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
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {Math.round(metrics.averageTrustScore * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Trust Score
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Shield />
                </Avatar>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.averageTrustScore * 100}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    {Math.round(metrics.complianceRate * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Compliance Rate
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.complianceRate * 100}
                color="info"
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="warning.main" gutterBottom>
                    {metrics.policyViolations}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Policy Violations
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Warning />
                </Avatar>
              </Box>
              <Button
                size="small"
                onClick={() => setShowViolationDetails(true)}
                sx={{ mt: 1 }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Trust Score Trend"
              subheader="Last 7 days"
              avatar={<TrendingUp color="primary" />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics.trustTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0.7, 1]} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Trust Score']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Compliance Rate Trend"
              subheader="Last 7 days"
              avatar={<BarChart color="primary" />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsBarChart data={metrics.complianceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0.8, 1]} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Compliance Rate']}
                  />
                  <Bar dataKey="rate" fill="#3B82F6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Recent Activity"
              subheader="Last 24 hours"
              avatar={<Assessment color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary">
                      {metrics.totalRequests}
                    </Typography>
                    <Typography variant="caption">Total Requests</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="info.main">
                      {metrics.averageResponseTime}s
                    </Typography>
                    <Typography variant="caption">Avg Response Time</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="success.main">
                      {Math.round((metrics.totalRequests - metrics.policyViolations) / metrics.totalRequests * 100)}%
                    </Typography>
                    <Typography variant="caption">Success Rate</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="secondary.main">
                      24/7
                    </Typography>
                    <Typography variant="caption">Monitoring</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Governance Status"
              avatar={<Security color="primary" />}
            />
            <CardContent>
              <Box mb={2}>
                <Typography variant="body2" gutterBottom>
                  Overall Health
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.governanceScore}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {metrics.governanceScore}/100
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2" gutterBottom>
                  Last Audit
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(metrics.lastAudit).toLocaleString()}
                </Typography>
              </Box>

              <Box mt={2}>
                <Alert severity="success" sx={{ fontSize: '0.75rem' }}>
                  All systems operational
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Violation Details Dialog */}
      <Dialog
        open={showViolationDetails}
        onClose={() => setShowViolationDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Policy Violations</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.recentViolations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell>
                      {new Date(violation.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{violation.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={violation.severity}
                        size="small"
                        color={getSeverityColor(violation.severity) as any}
                      />
                    </TableCell>
                    <TableCell>{violation.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViolationDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GovernanceDashboard;

