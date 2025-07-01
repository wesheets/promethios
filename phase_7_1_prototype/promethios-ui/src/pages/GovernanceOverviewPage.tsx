/**
 * Governance Overview Page
 * 
 * Comprehensive governance dashboard showing metrics from PRISM, VIGIL, 
 * and other observability systems for both single agents and multi-agent systems.
 */

import React, { useState, useEffect } from 'react';
import { useGovernanceDashboard } from '../hooks/useGovernanceDashboard';
import { usePageMetrics } from '../hooks/usePageMetrics';
import { useAnalytics } from '../components/common/AnalyticsProvider';
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
  FilterList,
  MoreVert
} from '@mui/icons-material';
import { observerService } from '../services/observers';

// Types for governance data
interface PrismMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  averageScore: number;
  lastUpdated: string;
}

interface PrismViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  agentId: string;
  resolved: boolean;
}

interface VigilMetrics {
  trustScores: Record<string, number>;
  driftStats: {
    totalGoals: number;
    driftDetected: number;
    significantDrift: number;
  };
  lastUpdated: string;
}

interface VigilViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  agentId: string;
  trustImpact: number;
}

interface TrustSnapshot {
  agentId: string;
  trustScore: number;
  timestamp: string;
  factors: {
    consistency: number;
    accuracy: number;
    reliability: number;
  };
}

interface GovernanceAwareness {
  totalAgents: number;
  governedAgents: number;
  complianceRate: number;
  lastAudit: string;
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
      id={`governance-tabpanel-${index}`}
      aria-labelledby={`governance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GovernanceOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'single' | 'multi'>('all');

  // Metrics tracking
  const { trackButtonClick, trackFeatureUsage, trackError } = usePageMetrics({
    pageName: 'governance_overview',
    metadata: {
      component: 'GovernanceOverviewPage',
      version: '1.0'
    }
  });
  const { trackGovernance } = useAnalytics();

  // Use real backend data
  const {
    metrics,
    violations,
    overview,
    metricsLoading,
    violationsLoading,
    overviewLoading,
    metricsError,
    violationsError,
    overviewError,
    refreshAll,
    clearErrors,
    filterViolations
  } = useGovernanceDashboard();

  // Mock data for missing variables until backend integration is complete
  const vigilMetrics = {
    trustScores: {},
    driftStats: {
      totalGoals: 0,
      driftDetected: 0,
      significantDrift: 0
    },
    lastUpdated: new Date().toISOString()
  };

  const governanceAwareness = {
    totalAgents: 0,
    governedAgents: 0,
    complianceRate: 0,
    lastAudit: new Date().toISOString()
  };

  const loading = metricsLoading || violationsLoading || overviewLoading;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Track tab change
    const tabNames = ['overview', 'violations', 'reports', 'agents'];
    trackFeatureUsage('governance_tabs', 'tab_change', {
      from_tab: tabNames[activeTab] || 'unknown',
      to_tab: tabNames[newValue] || 'unknown',
      tab_index: newValue
    });
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'all' | 'single' | 'multi') => {
    if (newMode !== null) {
      setViewMode(newMode);
      
      // Track view mode change
      trackFeatureUsage('governance_view_mode', 'mode_change', {
        from_mode: viewMode,
        to_mode: newMode
      });
    }
  };

  // Calculate derived metrics
  const governanceHealth = overview?.governance_health || 'fair';
  const complianceScore = metrics?.compliance_score || 0;
  const trustScore = metrics?.trust_score || 0;
  const totalViolations = violations.length;
  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  const recentViolations = violations.filter(v => {
    const detectedAt = new Date(v.detected_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return detectedAt > weekAgo;
  }).length;

  // Track governance metrics when data loads
  useEffect(() => {
    if (metrics && !loading) {
      trackGovernance('compliance_score', complianceScore, undefined, {
        trust_score: trustScore,
        total_violations: totalViolations,
        critical_violations: criticalViolations,
        governance_health: governanceHealth
      });
      
      trackGovernance('trust_score', trustScore, undefined, {
        compliance_score: complianceScore,
        total_violations: totalViolations,
        critical_violations: criticalViolations
      });
    }
  }, [metrics, loading, complianceScore, trustScore, totalViolations, criticalViolations, governanceHealth, trackGovernance]);

  // Track errors when they occur
  useEffect(() => {
    if (metricsError || violationsError || overviewError) {
      const error = new Error(metricsError || violationsError || overviewError || 'Unknown governance error');
      trackError(error, {
        error_type: 'governance_data_load',
        metrics_error: !!metricsError,
        violations_error: !!violationsError,
        overview_error: !!overviewError
      });
    }
  }, [metricsError, violationsError, overviewError, trackError]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Governance Overview
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Error handling
  if (metricsError || violationsError || overviewError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Governance Overview
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error Loading Governance Data</AlertTitle>
          {metricsError || violationsError || overviewError}
        </Alert>
      </Box>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const calculateOverallGovernanceScore = () => {
    if (!metrics) return 0;
    
    // Calculate overall score from compliance and trust scores
    return Math.round((metrics.compliance_score + metrics.trust_score) / 2);
  };

  const getGovernanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#10B981', icon: <CheckCircle /> };
    if (score >= 75) return { level: 'Good', color: '#3B82F6', icon: <Shield /> };
    if (score >= 60) return { level: 'Fair', color: '#F59E0B', icon: <Warning /> };
    return { level: 'Needs Attention', color: '#EF4444', icon: <Warning /> };
  };

  const exportGovernanceReport = () => {
    // Track export action
    trackButtonClick('export_governance_report', {
      total_violations: totalViolations,
      critical_violations: criticalViolations,
      compliance_score: complianceScore,
      trust_score: trustScore
    });
    
    // Implementation for exporting governance report
    console.log('Exporting governance report...');
  };

  if (loading) {
    return (
      <Box 
        p={4} 
        sx={{ 
          backgroundColor: '#1a202c',
          minHeight: '100vh',
          color: 'white'
        }}
      >
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
          Loading governance data from PRISM, VIGIL, and other observers...
        </Typography>
      </Box>
    );
  }

  const overallScore = calculateOverallGovernanceScore();
  const governanceLevel = getGovernanceLevel(overallScore);

  return (
    <Box 
      p={4} 
      sx={{ 
        backgroundColor: '#1a202c',
        minHeight: '100vh',
        color: 'white'
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Governance Overview
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Comprehensive governance monitoring across all agents and systems
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              trackButtonClick('refresh_governance_data', {
                active_tab: activeTab,
                view_mode: viewMode,
                total_violations: totalViolations
              });
              window.location.reload();
            }}
            sx={{ 
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': {
                borderColor: '#718096',
                backgroundColor: '#2d3748'
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportGovernanceReport}
            sx={{ 
              backgroundColor: '#3182ce',
              '&:hover': {
                backgroundColor: '#2c5aa0'
              }
            }}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {Math.round(overallScore)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
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
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="success.main" gutterBottom>
                    {vigilMetrics ? Object.keys(vigilMetrics.trustScores).length : 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Monitored Agents
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Security />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Active governance monitoring
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="warning.main" gutterBottom>
                    {totalViolations}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active Violations
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Warning />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Across all systems
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" color="info.main" gutterBottom>
                    {governanceAwareness ? Math.round(governanceAwareness.complianceRate) : 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Governance Awareness
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Assessment />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Self-reflection quality
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agent Filter Controls */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
            <Typography variant="h6" sx={{ color: 'white' }}>
              Filter by Agents:
            </Typography>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: '#a0aec0',
                  borderColor: '#4a5568',
                  '&.Mui-selected': {
                    backgroundColor: '#3182ce',
                    color: 'white'
                  }
                }
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="single">Single Agents</ToggleButton>
              <ToggleButton value="multi">Multi-Agent Systems</ToggleButton>
            </ToggleButtonGroup>

            <Autocomplete
              multiple
              options={vigilMetrics ? Object.keys(vigilMetrics.trustScores) : []}
              value={selectedAgents}
              onChange={(event, newValue) => setSelectedAgents(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Agents" 
                  variant="outlined" 
                  size="small"
                  sx={{
                    minWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      '& fieldset': {
                        borderColor: '#4a5568',
                      },
                      '&:hover fieldset': {
                        borderColor: '#718096',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3182ce',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#a0aec0',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    sx={{
                      backgroundColor: '#3182ce',
                      color: 'white',
                      borderColor: '#3182ce'
                    }}
                  />
                ))
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#a0aec0',
                '&.Mui-selected': {
                  color: '#3182ce'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#3182ce'
              }
            }}
          >
            <Tab label="PRISM Overview" />
            <Tab label="VIGIL Metrics" />
            <Tab label="Trust Metrics" />
            <Tab label="Multi-Agent Systems" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* PRISM Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Tool Usage Patterns" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <Box height={300} display="flex" alignItems="center" justifyContent="center">
                    <Typography sx={{ color: '#a0aec0' }}>
                      Chart visualization would be rendered here showing tool usage patterns
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Recent PRISM Violations" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Type</TableCell>
                          <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Severity</TableCell>
                          <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Tool</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>dangerous_command</TableCell>
                          <TableCell sx={{ borderColor: '#4a5568' }}>
                            <Chip label="HIGH" size="small" color="error" />
                          </TableCell>
                          <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>shell_exec</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>sensitive_memory_write</TableCell>
                          <TableCell sx={{ borderColor: '#4a5568' }}>
                            <Chip label="MEDIUM" size="small" color="warning" />
                          </TableCell>
                          <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>N/A</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>missing_trace</TableCell>
                          <TableCell sx={{ borderColor: '#4a5568' }}>
                            <Chip label="MEDIUM" size="small" color="info" />
                          </TableCell>
                          <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>N/A</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* VIGIL Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Trust Score Distribution" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  {vigilMetrics && Object.entries(vigilMetrics.trustScores).map(([agentId, score]) => (
                    <Box key={agentId} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {agentId}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          {Math.round(score)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={score}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: '#4a5568',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: score > 80 ? '#10B981' : score > 60 ? '#F59E0B' : '#EF4444'
                          }
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Drift Detection Stats" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  {vigilMetrics && (
                    <Box>
                      <Box mb={2}>
                        <Typography variant="body2" gutterBottom sx={{ color: 'white' }}>
                          Total Goals: {vigilMetrics.driftStats.totalGoals}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4, 
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#10B981'
                            }
                          }}
                        />
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" gutterBottom sx={{ color: 'white' }}>
                          Drift Detected: {vigilMetrics.driftStats.driftDetected}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(vigilMetrics.driftStats.driftDetected / vigilMetrics.driftStats.totalGoals) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#F59E0B'
                            }
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" gutterBottom sx={{ color: 'white' }}>
                          Significant Drift: {vigilMetrics.driftStats.significantDrift}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(vigilMetrics.driftStats.significantDrift / vigilMetrics.driftStats.totalGoals) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#EF4444'
                            }
                          }}
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
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Trust Score Trends" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Trust score trend visualization would be displayed here showing how agent trust scores change over time.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Trust Factors Breakdown" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Detailed breakdown of trust factors (consistency, accuracy, reliability) for each agent.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {/* Multi-Agent Systems */}
          <Alert severity="info" sx={{ mb: 3, backgroundColor: '#1e3a8a', color: 'white', border: '1px solid #3b82f6' }}>
            Multi-agent governance data will be integrated here from the multi-agent coordination system.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Multi-Agent Contexts" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active multi-agent contexts and their governance status will be displayed here.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Collaboration Metrics" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
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

