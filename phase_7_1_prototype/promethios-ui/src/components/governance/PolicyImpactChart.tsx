import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tooltip,
  Grid,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Policy,
  Security,
  Warning,
  CheckCircle,
  Info,
  Refresh,
  Timeline,
  Speed,
  Insights
} from '@mui/icons-material';

interface PolicyData {
  policyId: string;
  policyName: string;
  type: 'trust' | 'compliance' | 'security' | 'performance';
  enabled: boolean;
  strictness: number;
  lastUpdated: string;
}

interface PolicyMetrics {
  policyId: string;
  beforeMetrics: {
    trustScore: number;
    complianceRate: number;
    violationCount: number;
    performanceScore: number;
  };
  afterMetrics: {
    trustScore: number;
    complianceRate: number;
    violationCount: number;
    performanceScore: number;
  };
  impact: {
    trustDelta: number;
    complianceDelta: number;
    violationDelta: number;
    performanceDelta: number;
  };
  effectiveness: number;
}

interface PolicyImpactChartProps {
  policies: PolicyData[];
  beforeAfterMetrics?: boolean;
  recommendOptimizations?: boolean;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  onPolicyClick?: (policyId: string) => void;
  className?: string;
}

/**
 * PolicyImpactChart Component
 * 
 * Shows how policy changes affect agent behavior with comprehensive tooltips
 * for transparency and user education
 */
const PolicyImpactChart: React.FC<PolicyImpactChartProps> = ({
  policies,
  beforeAfterMetrics = true,
  recommendOptimizations = true,
  timeRange = '24h',
  onPolicyClick,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [selectedView, setSelectedView] = useState<'impact' | 'effectiveness' | 'trends'>('impact');
  const [selectedMetric, setSelectedMetric] = useState<'trust' | 'compliance' | 'violations' | 'performance'>('trust');
  const [policyMetrics, setPolicyMetrics] = useState<PolicyMetrics[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate mock policy impact data
  useEffect(() => {
    const mockMetrics: PolicyMetrics[] = policies.map(policy => {
      const baseImpact = policy.strictness / 100;
      const randomVariation = (Math.random() - 0.5) * 0.2;
      
      const beforeMetrics = {
        trustScore: 70 + Math.random() * 20,
        complianceRate: 60 + Math.random() * 30,
        violationCount: Math.floor(Math.random() * 10),
        performanceScore: 80 + Math.random() * 15
      };

      const trustDelta = baseImpact * 15 + randomVariation * 10;
      const complianceDelta = baseImpact * 20 + randomVariation * 15;
      const violationDelta = -(baseImpact * 5 + randomVariation * 3);
      const performanceDelta = -(baseImpact * 5 + randomVariation * 8);

      return {
        policyId: policy.policyId,
        beforeMetrics,
        afterMetrics: {
          trustScore: Math.min(100, beforeMetrics.trustScore + trustDelta),
          complianceRate: Math.min(100, beforeMetrics.complianceRate + complianceDelta),
          violationCount: Math.max(0, beforeMetrics.violationCount + violationDelta),
          performanceScore: Math.max(0, beforeMetrics.performanceScore + performanceDelta)
        },
        impact: {
          trustDelta,
          complianceDelta,
          violationDelta,
          performanceDelta
        },
        effectiveness: Math.min(100, Math.max(0, 
          (trustDelta + complianceDelta - Math.abs(violationDelta) - Math.abs(performanceDelta)) * 2 + 50
        ))
      };
    });

    setPolicyMetrics(mockMetrics);
  }, [policies]);

  // Generate chart data based on selected view
  useEffect(() => {
    let data: any[] = [];

    switch (selectedView) {
      case 'impact':
        data = policyMetrics.map(metric => {
          const policy = policies.find(p => p.policyId === metric.policyId);
          return {
            name: policy?.policyName || metric.policyId,
            policyId: metric.policyId,
            before: metric.beforeMetrics[selectedMetric === 'violations' ? 'violationCount' : 
                   selectedMetric === 'performance' ? 'performanceScore' :
                   selectedMetric === 'compliance' ? 'complianceRate' : 'trustScore'],
            after: metric.afterMetrics[selectedMetric === 'violations' ? 'violationCount' : 
                  selectedMetric === 'performance' ? 'performanceScore' :
                  selectedMetric === 'compliance' ? 'complianceRate' : 'trustScore'],
            delta: metric.impact[selectedMetric === 'violations' ? 'violationDelta' : 
                  selectedMetric === 'performance' ? 'performanceDelta' :
                  selectedMetric === 'compliance' ? 'complianceDelta' : 'trustDelta'],
            type: policies.find(p => p.policyId === metric.policyId)?.type || 'unknown'
          };
        });
        break;
      
      case 'effectiveness':
        data = policyMetrics.map(metric => {
          const policy = policies.find(p => p.policyId === metric.policyId);
          return {
            name: policy?.policyName || metric.policyId,
            policyId: metric.policyId,
            effectiveness: metric.effectiveness,
            strictness: policy?.strictness || 50,
            type: policy?.type || 'unknown'
          };
        });
        break;
      
      case 'trends':
        // Generate time series data
        const timePoints = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        data = timePoints.map((week, index) => {
          const weekData: any = { week };
          policyMetrics.forEach(metric => {
            const policy = policies.find(p => p.policyId === metric.policyId);
            const baseValue = metric.beforeMetrics.trustScore;
            const improvement = (metric.impact.trustDelta / 4) * (index + 1);
            weekData[policy?.policyName || metric.policyId] = Math.round(baseValue + improvement);
          });
          return weekData;
        });
        break;
    }

    setChartData(data);
  }, [selectedView, selectedMetric, policyMetrics, policies]);

  const getMetricColor = (type: string) => {
    switch (type) {
      case 'trust': return '#3B82F6';
      case 'compliance': return '#10B981';
      case 'security': return '#8B5CF6';
      case 'performance': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getImpactIcon = (delta: number) => {
    if (delta > 5) return <TrendingUp sx={{ color: '#10B981' }} />;
    if (delta < -5) return <TrendingDown sx={{ color: '#EF4444' }} />;
    return <Timeline sx={{ color: '#6B7280' }} />;
  };

  const formatDelta = (delta: number, metric: string) => {
    const sign = delta >= 0 ? '+' : '';
    const suffix = metric === 'violations' ? '' : '%';
    return `${sign}${delta.toFixed(1)}${suffix}`;
  };

  const getOptimizationRecommendations = () => {
    return policyMetrics
      .filter(metric => metric.effectiveness < 70)
      .map(metric => {
        const policy = policies.find(p => p.policyId === metric.policyId);
        return {
          policyName: policy?.policyName || metric.policyId,
          recommendation: metric.effectiveness < 50 
            ? 'Consider reducing strictness or reviewing policy logic'
            : 'Minor adjustments may improve effectiveness',
          severity: metric.effectiveness < 50 ? 'high' : 'medium'
        };
      });
  };

  return (
    <Card 
      className={className}
      sx={{ 
        backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
        color: isDarkMode ? 'white' : 'black',
        border: `1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`
      }}
    >
      <CardHeader
        title={
          <Tooltip 
            title="Analyze how governance policies impact agent behavior and performance. Use this to optimize policy settings and understand trade-offs between security and performance."
            arrow
            placement="top"
          >
            <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'help' }}>
              <Assessment sx={{ color: '#3182ce' }} />
              Policy Impact Analysis
              <Info sx={{ fontSize: 16, color: '#6B7280' }} />
            </Box>
          </Tooltip>
        }
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Select the view type to analyze different aspects of policy impact">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                  View
                </InputLabel>
                <Select
                  value={selectedView}
                  onChange={(e) => setSelectedView(e.target.value as any)}
                  sx={{
                    color: isDarkMode ? 'white' : 'black',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#4a5568' : '#e2e8f0'
                    }
                  }}
                >
                  <MenuItem value="impact">Before/After Impact</MenuItem>
                  <MenuItem value="effectiveness">Policy Effectiveness</MenuItem>
                  <MenuItem value="trends">Trend Analysis</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
            
            {selectedView === 'impact' && (
              <Tooltip title="Choose which metric to analyze for policy impact comparison">
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                    Metric
                  </InputLabel>
                  <Select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as any)}
                    sx={{
                      color: isDarkMode ? 'white' : 'black',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDarkMode ? '#4a5568' : '#e2e8f0'
                      }
                    }}
                  >
                    <MenuItem value="trust">Trust</MenuItem>
                    <MenuItem value="compliance">Compliance</MenuItem>
                    <MenuItem value="violations">Violations</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            )}
            
            <Tooltip title="Refresh policy impact data">
              <IconButton size="small">
                <Refresh sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }} />
              </IconButton>
            </Tooltip>
          </Box>
        }
        sx={{
          '& .MuiCardHeader-title': {
            color: isDarkMode ? 'white' : 'black'
          }
        }}
      />
      
      <CardContent>
        {/* Chart Section */}
        <Box mb={3}>
          <ResponsiveContainer width="100%" height={300}>
            {selectedView === 'impact' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4a5568' : '#e2e8f0'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDarkMode ? '#a0aec0' : '#4a5568'}
                  fontSize={12}
                />
                <YAxis stroke={isDarkMode ? '#a0aec0' : '#4a5568'} fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: 8,
                    color: isDarkMode ? 'white' : 'black'
                  }}
                  formatter={(value: any, name: string) => [
                    `${value}${selectedMetric === 'violations' ? '' : '%'}`,
                    name === 'before' ? 'Before Policy' : 'After Policy'
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="before" 
                  fill="#6B7280" 
                  name="Before Policy"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="after" 
                  fill="#3B82F6" 
                  name="After Policy"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            ) : selectedView === 'effectiveness' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4a5568' : '#e2e8f0'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDarkMode ? '#a0aec0' : '#4a5568'}
                  fontSize={12}
                />
                <YAxis stroke={isDarkMode ? '#a0aec0' : '#4a5568'} fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: 8,
                    color: isDarkMode ? 'white' : 'black'
                  }}
                  formatter={(value: any, name: string) => [
                    `${value}%`,
                    name === 'effectiveness' ? 'Policy Effectiveness' : 'Strictness Level'
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="effectiveness" 
                  fill="#10B981" 
                  name="Effectiveness"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4a5568' : '#e2e8f0'} />
                <XAxis 
                  dataKey="week" 
                  stroke={isDarkMode ? '#a0aec0' : '#4a5568'}
                  fontSize={12}
                />
                <YAxis stroke={isDarkMode ? '#a0aec0' : '#4a5568'} fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: 8,
                    color: isDarkMode ? 'white' : 'black'
                  }}
                />
                <Legend />
                {policies.map((policy, index) => (
                  <Line
                    key={policy.policyId}
                    type="monotone"
                    dataKey={policy.policyName}
                    stroke={getMetricColor(policy.type)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* Impact Summary */}
        {selectedView === 'impact' && (
          <Box mb={3}>
            <Tooltip title="Summary of policy impacts showing the change in metrics after policy implementation">
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Impact Summary
                <Info sx={{ fontSize: 16, color: '#6B7280' }} />
              </Typography>
            </Tooltip>
            
            <Grid container spacing={2}>
              {chartData.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.policyId}>
                  <Tooltip 
                    title={`${item.name}: ${formatDelta(item.delta, selectedMetric)} change in ${selectedMetric}. Click to view detailed policy settings.`}
                  >
                    <Card 
                      sx={{ 
                        backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: isDarkMode ? '#4a5568' : '#e2e8f0'
                        }
                      }}
                      onClick={() => onPolicyClick?.(item.policyId)}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2" sx={{ color: isDarkMode ? '#a0aec0' : '#4a5568' }}>
                              {item.name}
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              color: item.delta >= 0 ? '#10B981' : '#EF4444' 
                            }}>
                              {formatDelta(item.delta, selectedMetric)}
                            </Typography>
                          </Box>
                          {getImpactIcon(item.delta)}
                        </Box>
                        <Chip 
                          label={item.type}
                          size="small"
                          sx={{ 
                            mt: 1,
                            bgcolor: getMetricColor(item.type),
                            color: 'white'
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Optimization Recommendations */}
        {recommendOptimizations && (
          <Box>
            <Divider sx={{ my: 2, borderColor: isDarkMode ? '#4a5568' : '#e2e8f0' }} />
            
            <Tooltip title="AI-generated recommendations to optimize policy effectiveness based on current performance data">
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Insights sx={{ color: '#3182ce' }} />
                Optimization Recommendations
                <Info sx={{ fontSize: 16, color: '#6B7280' }} />
              </Typography>
            </Tooltip>

            <List>
              {getOptimizationRecommendations().map((rec, index) => (
                <Tooltip 
                  key={index}
                  title={`This recommendation is based on policy effectiveness analysis. ${rec.severity === 'high' ? 'High priority - immediate attention recommended.' : 'Medium priority - consider for next policy review.'}`}
                >
                  <ListItem 
                    sx={{ 
                      backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      {rec.severity === 'high' ? 
                        <Warning sx={{ color: '#EF4444' }} /> : 
                        <Info sx={{ color: '#F59E0B' }} />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={rec.policyName}
                      secondary={rec.recommendation}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: isDarkMode ? 'white' : 'black'
                        },
                        '& .MuiListItemText-secondary': {
                          color: isDarkMode ? '#a0aec0' : '#4a5568'
                        }
                      }}
                    />
                    <Chip 
                      label={rec.severity}
                      size="small"
                      sx={{ 
                        bgcolor: rec.severity === 'high' ? '#EF4444' : '#F59E0B',
                        color: 'white'
                      }}
                    />
                  </ListItem>
                </Tooltip>
              ))}
              
              {getOptimizationRecommendations().length === 0 && (
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#10B981' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="All policies are performing well"
                    secondary="No optimization recommendations at this time"
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: isDarkMode ? 'white' : 'black'
                      },
                      '& .MuiListItemText-secondary': {
                        color: isDarkMode ? '#a0aec0' : '#4a5568'
                      }
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PolicyImpactChart;

