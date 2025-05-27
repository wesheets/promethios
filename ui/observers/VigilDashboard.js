/**
 * VIGIL Dashboard
 * 
 * A specialized dashboard for monitoring the VIGIL observer (Trust Decay Tracker)
 * in the Promethios governance framework. This dashboard provides detailed insights
 * into trust decay tracking and loop outcome analysis.
 * 
 * @module ui/observers/VigilDashboard
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Grid, Card, CardHeader, CardContent, Typography, Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Divider } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, TrendingDown, BarChart2, RefreshCw } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const VigilDashboard = ({ status, analytics }) => {
  const [timeRange, setTimeRange] = useState('day');
  
  // Format analytics data for charts
  const formatDriftStatsData = () => {
    if (!analytics || !analytics.driftStats) {
      return [];
    }
    
    return [
      { name: 'No Drift', value: analytics.driftStats.totalGoals - analytics.driftStats.driftDetected || 0 },
      { name: 'Minor Drift', value: analytics.driftStats.driftDetected - analytics.driftStats.significantDrift || 0 },
      { name: 'Significant Drift', value: analytics.driftStats.significantDrift || 0 }
    ];
  };
  
  const formatAdherenceDistributionData = () => {
    if (!analytics || !analytics.adherenceDistribution) {
      return [];
    }
    
    return Object.entries(analytics.adherenceDistribution).map(([score, count]) => ({
      name: score,
      value: count
    })).sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
  };
  
  // Render status section
  const renderStatusSection = () => {
    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Activity style={{ marginRight: 8 }} />
            VIGIL Observer Status
          </Box>
        } />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Status</Typography>
              <Chip 
                label={status.status} 
                color={status.status === 'active' ? 'success' : 'warning'} 
                sx={{ fontSize: '1rem', padding: '20px 10px' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Mode</Typography>
              <Chip 
                label="Passive" 
                color="info" 
                sx={{ fontSize: '1rem', padding: '20px 10px' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Scope</Typography>
              <Chip 
                label="Trust Decay & Loop Outcome" 
                color="primary" 
                sx={{ fontSize: '1rem', padding: '20px 10px' }}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Drift Threshold</Typography>
              <Chip 
                label="20%" 
                color="secondary" 
                sx={{ fontSize: '1rem', padding: '20px 10px' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Significant Drift Threshold</Typography>
              <Chip 
                label="40%" 
                color="secondary" 
                sx={{ fontSize: '1rem', padding: '20px 10px' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // Render metrics section
  const renderMetricsSection = () => {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDown style={{ marginRight: 8 }} />
                Drift Statistics
              </Box>
            } />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatDriftStatsData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatDriftStatsData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Goals: {(analytics?.driftStats?.totalGoals || 0).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChart2 style={{ marginRight: 8 }} />
                Adherence Distribution
              </Box>
            } />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatAdherenceDistributionData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render recent violations
  const renderRecentViolations = () => {
    // Mock data for recent violations
    const recentViolations = [
      {
        id: 'viol-001',
        type: 'significant_trust_decay',
        severity: 'high',
        message: 'Trust decreased by 45.2%',
        timestamp: '2025-05-26T15:30:22Z',
        goalId: 'goal-123'
      },
      {
        id: 'viol-002',
        type: 'unreflected_failure',
        severity: 'medium',
        message: 'Loop failed without reflection',
        timestamp: '2025-05-26T14:45:10Z',
        loopId: 'loop-456'
      },
      {
        id: 'viol-003',
        type: 'unauthorized_memory_mutation',
        severity: 'high',
        message: 'Memory modified without authorization',
        timestamp: '2025-05-26T12:15:33Z',
        memoryId: 'mem-789'
      }
    ];
    
    return (
      <Card>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AlertTriangle style={{ marginRight: 8 }} />
            Recent VIGIL Violations
          </Box>
        } />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentViolations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell>{violation.type}</TableCell>
                    <TableCell>
                      <Chip 
                        label={violation.severity} 
                        color={violation.severity === 'high' ? 'error' : violation.severity === 'medium' ? 'warning' : 'info'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{violation.message}</TableCell>
                    <TableCell>{new Date(violation.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div>
      {renderStatusSection()}
      {renderMetricsSection()}
      {renderRecentViolations()}
    </div>
  );
};

export default VigilDashboard;
