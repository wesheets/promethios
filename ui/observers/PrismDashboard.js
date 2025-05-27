/**
 * PRISM Dashboard
 * 
 * A specialized dashboard for monitoring the PRISM observer (Belief Trace Auditor)
 * in the Promethios governance framework. This dashboard provides detailed insights
 * into belief trace compliance and manifest validation.
 * 
 * @module ui/observers/PrismDashboard
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Grid, Card, CardHeader, CardContent, Typography, Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Divider } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, AlertTriangle, CheckCircle, XCircle, FileText, Database } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PrismDashboard = ({ status, analytics }) => {
  const [timeRange, setTimeRange] = useState('day');
  
  // Format analytics data for charts
  const formatSourceTypeData = () => {
    if (!analytics || !analytics.traceStats || !analytics.traceStats.sourceTypes) {
      return [];
    }
    
    return Object.entries(analytics.traceStats.sourceTypes).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };
  
  const formatTraceStatsData = () => {
    if (!analytics || !analytics.traceStats) {
      return [];
    }
    
    return [
      { name: 'Verified', value: analytics.traceStats.verifiedTraces || 0 },
      { name: 'Unverified', value: analytics.traceStats.unverifiedTraces || 0 }
    ];
  };
  
  // Render status section
  const renderStatusSection = () => {
    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Eye style={{ marginRight: 8 }} />
            PRISM Observer Status
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
                label="Belief Trace & Manifest Validation" 
                color="primary" 
                sx={{ fontSize: '1rem', padding: '20px 10px' }}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Validation Level</Typography>
              <Chip 
                label="Standard" 
                color="secondary" 
                sx={{ fontSize: '1rem', padding: '20px 10px' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Sampling Rate</Typography>
              <Chip 
                label="100%" 
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
                <FileText style={{ marginRight: 8 }} />
                Trace Verification
              </Box>
            } />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatTraceStatsData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatTraceStatsData().map((entry, index) => (
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
                  Total Traces: {(analytics?.traceStats?.totalTraces || 0).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Database style={{ marginRight: 8 }} />
                Source Types
              </Box>
            } />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatSourceTypeData()}
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
        type: 'missing_trace',
        severity: 'high',
        message: 'Belief has no trace information',
        timestamp: '2025-05-26T15:30:22Z',
        beliefId: 'belief-123'
      },
      {
        id: 'viol-002',
        type: 'invalid_manifest',
        severity: 'medium',
        message: 'Manifest does not conform to its schema',
        timestamp: '2025-05-26T14:45:10Z',
        manifestId: 'manifest-456'
      },
      {
        id: 'viol-003',
        type: 'undeclared_routes',
        severity: 'medium',
        message: 'Manifest contains undeclared routes',
        timestamp: '2025-05-26T12:15:33Z',
        manifestId: 'manifest-789'
      }
    ];
    
    return (
      <Card>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AlertTriangle style={{ marginRight: 8 }} />
            Recent PRISM Violations
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

export default PrismDashboard;
