/**
 * VERITAS Metrics Dashboard
 * 
 * This component provides a comprehensive dashboard for monitoring the performance
 * and effectiveness of the enhanced VERITAS verification system.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
  useTheme
} from '@mui/material';
import { 
  BarChart as BarChartIcon,
  Timeline,
  PieChart as PieChartIcon,
  Assessment,
  Speed,
  Domain
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { VeritasMetricsData } from '../veritasMetrics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

// Styled components for enhanced visual appeal
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)'
  }
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  textAlign: 'center'
}));

const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.dark}22 0%, ${theme.palette.primary.light}11 100%)`,
  borderRadius: theme.shape.borderRadius * 2
}));

// Interface for component props
interface VeritasMetricsDashboardProps {
  metrics?: VeritasMetricsData;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

// TabPanel component for tab content
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`veritas-metrics-tabpanel-${index}`}
      aria-labelledby={`veritas-metrics-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// Sample historical data for charts
const generateHistoricalData = (days = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      verifications: Math.floor(Math.random() * 50) + 50,
      blocked: Math.floor(Math.random() * 10) + 5,
      allowed: Math.floor(Math.random() * 40) + 40,
      trustAdjustment: Math.floor(Math.random() * 20) - 10,
      processingTime: Math.floor(Math.random() * 50) + 100
    });
  }
  
  return data;
};

// Sample domain performance data
const domainPerformanceData = [
  { name: 'Legal', accuracy: 93, processingTime: 145, blocked: 8, allowed: 22 },
  { name: 'Medical', accuracy: 89, processingTime: 140, blocked: 5, allowed: 23 },
  { name: 'Historical', accuracy: 91, processingTime: 120, blocked: 2, allowed: 33 },
  { name: 'Entertainment', accuracy: 96, processingTime: 95, blocked: 0, allowed: 27 }
];

// Sample uncertainty detection data
const uncertaintyData = [
  { name: 'Correctly Detected', value: 45 },
  { name: 'Missed', value: 8 },
  { name: 'Incorrectly Identified', value: 3 }
];

/**
 * VERITAS Metrics Dashboard Component
 */
export const VeritasMetricsDashboard: React.FC<VeritasMetricsDashboardProps> = ({
  metrics,
  timeRange = '30d',
  onTimeRangeChange
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [historicalData, setHistoricalData] = useState(generateHistoricalData(30));

  // Colors for charts
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    info: theme.palette.info.main,
    allowed: '#4caf50',
    blocked: '#f44336',
    neutral: '#9e9e9e',
    uncertainty: '#2196f3'
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle time range change
  const handleTimeRangeChange = (event: any) => {
    const newRange = event.target.value;
    setSelectedTimeRange(newRange);
    
    // Update historical data based on selected range
    let days = 30;
    switch (newRange) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      case '365d':
        days = 365;
        break;
    }
    
    setHistoricalData(generateHistoricalData(days));
    
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

  // Default metrics if not provided
  const defaultMetrics: VeritasMetricsData = {
    verificationCounts: {
      total: 120,
      blocked: 15,
      allowed: 105
    },
    domainClassification: {
      total: 120,
      correct: 112,
      byDomain: {
        legal: { correct: 28, total: 30 },
        medical: { correct: 25, total: 28 },
        historical: { correct: 32, total: 35 },
        entertainment: { correct: 27, total: 27 }
      }
    },
    uncertaintyDetection: {
      detected: 45,
      missed: 8,
      incorrectlyIdentified: 3
    },
    trustAdjustments: {
      adjustmentCount: 120,
      totalPenalty: 75,
      totalBonus: 25,
      netAdjustment: -50
    },
    performance: {
      processingCount: 120,
      averageProcessingTime: 125,
      processingTimesByDomain: {
        legal: 145,
        medical: 140,
        historical: 120,
        entertainment: 95
      }
    },
    toggle: {
      enableCount: 5,
      disableCount: 3,
      averageEnableTime: 120,
      averageDisableTime: 80
    }
  };

  const metricsData = metrics || defaultMetrics;

  // Calculate domain accuracy percentages
  const domainAccuracy = Object.entries(metricsData.domainClassification.byDomain).map(([domain, data]) => ({
    name: domain.charAt(0).toUpperCase() + domain.slice(1),
    accuracy: Math.round((data.correct / data.total) * 100)
  }));

  // Calculate verification distribution for pie chart
  const verificationDistribution = [
    { name: 'Allowed', value: metricsData.verificationCounts.allowed },
    { name: 'Blocked', value: metricsData.verificationCounts.blocked }
  ];

  // Calculate trust adjustment distribution for pie chart
  const trustAdjustmentDistribution = [
    { name: 'Penalties', value: Math.abs(metricsData.trustAdjustments.totalPenalty) },
    { name: 'Bonuses', value: metricsData.trustAdjustments.totalBonus }
  ];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <GradientCard elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChartIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
            <Typography variant="h4" component="h1">
              VERITAS Performance Metrics
            </Typography>
          </Box>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedTimeRange}
              onChange={handleTimeRangeChange}
              displayEmpty
              inputProps={{ 'aria-label': 'time range' }}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="365d">Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Monitor the performance and effectiveness of the enhanced VERITAS verification system.
        </Typography>
      </GradientCard>

      {/* Key Metrics Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MetricValue color="primary">
                {metricsData.verificationCounts.total}
              </MetricValue>
              <MetricLabel>Total Verifications</MetricLabel>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MetricValue color="error">
                {metricsData.verificationCounts.blocked}
              </MetricValue>
              <MetricLabel>Blocked Responses</MetricLabel>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MetricValue color="success">
                {Math.round((metricsData.domainClassification.correct / metricsData.domainClassification.total) * 100)}%
              </MetricValue>
              <MetricLabel>Classification Accuracy</MetricLabel>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MetricValue color={metricsData.trustAdjustments.netAdjustment >= 0 ? 'success' : 'error'}>
                {metricsData.trustAdjustments.netAdjustment}
              </MetricValue>
              <MetricLabel>Net Trust Adjustment</MetricLabel>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="VERITAS metrics tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: '64px',
              fontSize: '0.9rem'
            }
          }}
        >
          <Tab icon={<Timeline />} label="Verification Trends" iconPosition="start" />
          <Tab icon={<Domain />} label="Domain Performance" iconPosition="start" />
          <Tab icon={<PieChartIcon />} label="Distribution Analysis" iconPosition="start" />
          <Tab icon={<Speed />} label="System Performance" iconPosition="start" />
          <Tab icon={<Assessment />} label="Detailed Reports" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Verification Trends Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader title="Verification Activity Over Time" />
              <CardContent sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="verifications" 
                      stroke={colors.primary} 
                      activeDot={{ r: 8 }} 
                      name="Total Verifications"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="blocked" 
                      stroke={colors.error} 
                      name="Blocked Responses" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="allowed" 
                      stroke={colors.success} 
                      name="Allowed Responses" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12}>
            <StyledCard>
              <CardHeader title="Trust Adjustment Trends" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="trustAdjustment" 
                      stroke={colors.secondary} 
                      name="Net Trust Adjustment" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Domain Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="Domain Classification Accuracy" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={domainAccuracy}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="accuracy" 
                      name="Accuracy (%)" 
                      fill={colors.primary} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="Domain Processing Time" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={domainPerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="processingTime" 
                      name="Processing Time (ms)" 
                      fill={colors.secondary} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12}>
            <StyledCard>
              <CardHeader title="Domain Verification Results" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={domainPerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="blocked" 
                      name="Blocked" 
                      stackId="a" 
                      fill={colors.error} 
                    />
                    <Bar 
                      dataKey="allowed" 
                      name="Allowed" 
                      stackId="a" 
                      fill={colors.success} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Distribution Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardHeader title="Verification Results" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={verificationDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell key="allowed" fill={colors.allowed} />
                      <Cell key="blocked" fill={colors.blocked} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardHeader title="Trust Adjustments" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trustAdjustmentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell key="penalties" fill={colors.error} />
                      <Cell key="bonuses" fill={colors.success} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardHeader title="Uncertainty Detection" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={uncertaintyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell key="correct" fill={colors.success} />
                      <Cell key="missed" fill={colors.warning} />
                      <Cell key="incorrect" fill={colors.error} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* System Performance Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader title="Processing Time Trends" />
              <CardContent sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="processingTime" 
                      stroke={colors.info} 
                      name="Avg. Processing Time (ms)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="System Resource Utilization" />
              <CardContent sx={{ height: 300 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>CPU Usage</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <Box sx={{ width: '100%', bgcolor: 'background.default', borderRadius: 1, height: 8 }}>
                          <Box 
                            sx={{ 
                              height: '100%', 
                              width: '45%',
                              bgcolor: 'success.main',
                              borderRadius: 1
                            }} 
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2">45%</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Memory Usage</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <Box sx={{ width: '100%', bgcolor: 'background.default', borderRadius: 1, height: 8 }}>
                          <Box 
                            sx={{ 
                              height: '100%', 
                              width: '68%',
                              bgcolor: 'warning.main',
                              borderRadius: 1
                            }} 
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2">68%</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Network I/O</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <Box sx={{ width: '100%', bgcolor: 'background.default', borderRadius: 1, height: 8 }}>
                          <Box 
                            sx={{ 
                              height: '100%', 
                              width: '32%',
                              bgcolor: 'info.main',
                              borderRadius: 1
                            }} 
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2">32%</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Disk I/O</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <Box sx={{ width: '100%', bgcolor: 'background.default', borderRadius: 1, height: 8 }}>
                          <Box 
                            sx={{ 
                              height: '100%', 
                              width: '15%',
                              bgcolor: 'secondary.main',
                              borderRadius: 1
                            }} 
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2">15%</Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Last updated: 2 minutes ago</Typography>
                  <Button size="small" startIcon={<BarChart />}>
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="Toggle Operations" />
              <CardContent sx={{ height: 300 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1">Toggle Count</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                        <Typography variant="h5" color="primary">
                          {metricsData.toggle.enableCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Enable Operations
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                        <Typography variant="h5" color="error">
                          {metricsData.toggle.disableCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Disable Operations
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle1">Average Toggle Time (ms)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                        <Typography variant="h5" color="primary">
                          {metricsData.toggle.averageEnableTime}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Enable Time
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                        <Typography variant="h5" color="error">
                          {metricsData.toggle.averageDisableTime}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Disable Time
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Detailed Reports Tab */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>Detailed Performance Reports</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Access comprehensive reports on VERITAS verification performance and effectiveness.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="Report Generation" 
                subheader="Create custom performance reports"
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Typography variant="caption" gutterBottom>Report Type</Typography>
                      <TextField
                        select
                        defaultValue="verification"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        <option value="verification">Verification Performance</option>
                        <option value="domain">Domain Analysis</option>
                        <option value="uncertainty">Uncertainty Detection</option>
                        <option value="system">System Performance</option>
                        <option value="custom">Custom Report</option>
                      </TextField>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Typography variant="caption" gutterBottom>Time Period</Typography>
                      <TextField
                        select
                        defaultValue="30d"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="custom">Custom Range</option>
                      </TextField>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Typography variant="caption" gutterBottom>Format</Typography>
                      <TextField
                        select
                        defaultValue="pdf"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="csv">CSV Spreadsheet</option>
                        <option value="json">JSON Data</option>
                        <option value="html">HTML Report</option>
                      </TextField>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary">
                    Generate Report
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="Scheduled Reports" 
                subheader="Configure automatic report generation"
              />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Scheduled Reports"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                      Automatically generate and distribute reports on schedule
                    </Typography>
                  </FormGroup>
                </Box>
                
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead" sx={{ bgcolor: theme.palette.background.default }}>
                    <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Report Name</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Schedule</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Recipients</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Format</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>Actions</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>Weekly Performance Summary</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>Every Monday, 8:00 AM</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>Admin Team</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>PDF</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                        <Button size="small" variant="outlined">Edit</Button>
                      </Box>
                    </Box>
                    <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>Monthly Domain Analysis</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>1st of month, 12:00 AM</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>Management</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>PDF, CSV</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                        <Button size="small" variant="outlined">Edit</Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="small" variant="outlined" sx={{ mr: 1 }}>
                    Add Schedule
                  </Button>
                  <Button size="small" variant="outlined" color="secondary">
                    Manage Recipients
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="Recent Reports" 
                subheader="Access previously generated reports"
              />
              <CardContent>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead" sx={{ bgcolor: theme.palette.background.default }}>
                    <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Report Name</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Generated</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Type</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'left' }}>Size</Box>
                      <Box component="th" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>Actions</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>Verification_Performance_May2025.pdf</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>June 1, 2025</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>PDF</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>1.2 MB</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                        <Button size="small" variant="outlined" sx={{ mr: 1 }}>Download</Button>
                        <Button size="small" variant="outlined" color="error">Delete</Button>
                      </Box>
                    </Box>
                    <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>Domain_Analysis_Q2_2025.csv</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>May 15, 2025</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>CSV</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>845 KB</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                        <Button size="small" variant="outlined" sx={{ mr: 1 }}>Download</Button>
                        <Button size="small" variant="outlined" color="error">Delete</Button>
                      </Box>
                    </Box>
                    <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>System_Performance_April2025.html</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>May 1, 2025</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>HTML</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2 }}>2.1 MB</Box>
                      <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                        <Button size="small" variant="outlined" sx={{ mr: 1 }}>Download</Button>
                        <Button size="small" variant="outlined" color="error">Delete</Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default VeritasMetricsDashboard;
