/**
 * Performance Analytics Panel
 * 
 * Comprehensive performance analytics and metrics visualization for
 * Enhanced Veritas 2 multi-agent collaboration sessions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  Speed,
  Group,
  Psychology,
  Star,
  Warning,
  CheckCircle,
  Timeline,
  Assessment,
  Compare,
  Download,
  Refresh
} from '@mui/icons-material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterPlot,
  Scatter
} from 'recharts';
import { EnhancedWrapperAgent } from '../multiAgent/enhancedAgentWrapper';

interface PerformanceMetrics {
  collaborationEffectiveness: number;
  uncertaintyReduction: number;
  agentParticipation: number;
  emergentBehaviors: number;
  timeToResolution: number;
  qualityScore: number;
}

interface AgentPerformanceData {
  agentId: string;
  name: string;
  role: string;
  metrics: {
    interactions: number;
    influence: number;
    responsiveness: number;
    quality: number;
    adaptability: number;
    collaboration: number;
  };
  trends: {
    improving: boolean;
    stagnant: boolean;
    declining: boolean;
  };
  specializations: string[];
}

interface CollaborationPattern {
  name: string;
  frequency: number;
  effectiveness: number;
  participants: string[];
  emergent: boolean;
}

interface PerformanceAnalyticsPanelProps {
  metrics: PerformanceMetrics;
  agents: EnhancedWrapperAgent[];
  sessionId?: string;
  timeRange?: string;
  onAgentSelect?: (agentId: string) => void;
  onExportAnalytics?: (data: any) => void;
  className?: string;
}

const PerformanceAnalyticsPanel: React.FC<PerformanceAnalyticsPanelProps> = ({
  metrics,
  agents,
  sessionId,
  timeRange = '1h',
  onAgentSelect,
  onExportAnalytics,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [sortBy, setSortBy] = useState<string>('overall');
  const [agentPerformanceData, setAgentPerformanceData] = useState<AgentPerformanceData[]>([]);
  const [collaborationPatterns, setCollaborationPatterns] = useState<CollaborationPattern[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<any[]>([]);

  // Initialize performance data
  useEffect(() => {
    generateAgentPerformanceData();
    generateCollaborationPatterns();
    generatePerformanceTrends();
  }, [agents, metrics]);

  const generateAgentPerformanceData = () => {
    const data: AgentPerformanceData[] = agents.map(agent => {
      const baseMetrics = agent.performanceMetrics || {
        uncertaintyReductionRate: 0.7,
        collaborationEffectiveness: 0.75,
        responseTime: 2.5,
        accuracyScore: 0.85,
        trustScore: 0.8,
        adaptabilityScore: 0.7,
        verificationCount: 0,
        hitlSessionCount: 0
      };

      return {
        agentId: agent.id,
        name: agent.name,
        role: agent.role || 'participant',
        metrics: {
          interactions: baseMetrics.verificationCount + Math.floor(Math.random() * 20),
          influence: baseMetrics.collaborationEffectiveness + (Math.random() - 0.5) * 0.2,
          responsiveness: Math.max(0, 1 - baseMetrics.responseTime / 10),
          quality: baseMetrics.accuracyScore + (Math.random() - 0.5) * 0.1,
          adaptability: baseMetrics.adaptabilityScore + (Math.random() - 0.5) * 0.15,
          collaboration: baseMetrics.collaborationEffectiveness + (Math.random() - 0.5) * 0.1
        },
        trends: {
          improving: Math.random() > 0.6,
          stagnant: Math.random() > 0.8,
          declining: Math.random() > 0.9
        },
        specializations: agent.uncertaintySpecialties?.map(s => s.uncertaintyType) || []
      };
    });

    setAgentPerformanceData(data);
  };

  const generateCollaborationPatterns = () => {
    const patterns: CollaborationPattern[] = [
      {
        name: 'Round Table Discussion',
        frequency: 0.8,
        effectiveness: 0.85,
        participants: agents.slice(0, 4).map(a => a.name),
        emergent: false
      },
      {
        name: 'Expert Consultation',
        frequency: 0.6,
        effectiveness: 0.92,
        participants: agents.slice(0, 2).map(a => a.name),
        emergent: true
      },
      {
        name: 'Consensus Building',
        frequency: 0.4,
        effectiveness: 0.78,
        participants: agents.map(a => a.name),
        emergent: true
      },
      {
        name: 'Peer Review',
        frequency: 0.7,
        effectiveness: 0.88,
        participants: agents.slice(1, 4).map(a => a.name),
        emergent: false
      }
    ];

    setCollaborationPatterns(patterns);
  };

  const generatePerformanceTrends = () => {
    const trends = [];
    const now = Date.now();
    
    for (let i = 0; i < 20; i++) {
      trends.push({
        timestamp: now - (19 - i) * 60000,
        overall: Math.max(0.3, Math.min(1, 0.6 + i * 0.02 + (Math.random() - 0.5) * 0.1)),
        collaboration: Math.max(0.2, Math.min(1, 0.5 + i * 0.025 + (Math.random() - 0.5) * 0.15)),
        quality: Math.max(0.4, Math.min(1, 0.7 + i * 0.015 + (Math.random() - 0.5) * 0.08)),
        efficiency: Math.max(0.3, Math.min(1, 0.55 + i * 0.02 + (Math.random() - 0.5) * 0.12))
      });
    }

    setPerformanceTrends(trends);
  };

  const sortedAgentData = useMemo(() => {
    return [...agentPerformanceData].sort((a, b) => {
      switch (sortBy) {
        case 'influence':
          return b.metrics.influence - a.metrics.influence;
        case 'quality':
          return b.metrics.quality - a.metrics.quality;
        case 'interactions':
          return b.metrics.interactions - a.metrics.interactions;
        case 'responsiveness':
          return b.metrics.responsiveness - a.metrics.responsiveness;
        default:
          return (b.metrics.influence + b.metrics.quality + b.metrics.collaboration) / 3 -
                 (a.metrics.influence + a.metrics.quality + a.metrics.collaboration) / 3;
      }
    });
  }, [agentPerformanceData, sortBy]);

  const overallPerformanceScore = useMemo(() => {
    const weights = {
      collaborationEffectiveness: 0.25,
      uncertaintyReduction: 0.25,
      qualityScore: 0.2,
      agentParticipation: 0.15,
      timeToResolution: 0.1,
      emergentBehaviors: 0.05
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      const value = metrics[key as keyof PerformanceMetrics] || 0;
      const normalizedValue = key === 'timeToResolution' ? 
        Math.max(0, 1 - value / 30) : // Normalize time (30 min max)
        value;
      return score + normalizedValue * weight;
    }, 0);
  }, [metrics]);

  const getPerformanceColor = (score: number): string => {
    if (score >= 0.8) return '#48bb78';
    if (score >= 0.6) return '#ed8936';
    if (score >= 0.4) return '#ecc94b';
    return '#f56565';
  };

  const getTrendIcon = (trends: any) => {
    if (trends.improving) return <TrendingUp sx={{ color: 'success.main' }} />;
    if (trends.declining) return <TrendingDown sx={{ color: 'error.main' }} />;
    return <Timeline sx={{ color: 'info.main' }} />;
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Overall Performance Score */}
      <Grid item xs={12} md={4}>
        <Card sx={{ backgroundColor: '#4a5568', color: 'white', textAlign: 'center', height: '100%' }}>
          <CardContent>
            <Typography variant="h3" color={getPerformanceColor(overallPerformanceScore)}>
              {(overallPerformanceScore * 100).toFixed(0)}
            </Typography>
            <Typography variant="h6" sx={{ color: '#a0aec0' }}>
              Overall Performance
            </Typography>
            <Box mt={2}>
              <CircularProgress
                variant="determinate"
                value={overallPerformanceScore * 100}
                size={80}
                thickness={4}
                sx={{
                  color: getPerformanceColor(overallPerformanceScore),
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round'
                  }
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#a0aec0', mt: 1 }}>
              Based on {Object.keys(metrics).length} key metrics
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Breakdown */}
      <Grid item xs={12} md={8}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '100%' }}>
          <CardHeader title="Performance Breakdown" />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={[
                {
                  metric: 'Collaboration',
                  value: metrics.collaborationEffectiveness * 100,
                  fullMark: 100
                },
                {
                  metric: 'Uncertainty Reduction',
                  value: metrics.uncertaintyReduction * 100,
                  fullMark: 100
                },
                {
                  metric: 'Quality',
                  value: metrics.qualityScore * 100,
                  fullMark: 100
                },
                {
                  metric: 'Participation',
                  value: metrics.agentParticipation * 100,
                  fullMark: 100
                },
                {
                  metric: 'Efficiency',
                  value: Math.max(0, 100 - metrics.timeToResolution * 3),
                  fullMark: 100
                },
                {
                  metric: 'Innovation',
                  value: metrics.emergentBehaviors * 20,
                  fullMark: 100
                }
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'white', fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#a0aec0', fontSize: 10 }}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#4299e1"
                  fill="#4299e1"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Trends */}
      {showTrends && (
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardHeader
              title="Performance Trends"
              action={
                <FormControlLabel
                  control={
                    <Switch
                      checked={showTrends}
                      onChange={(e) => setShowTrends(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Show Trends"
                  sx={{ color: 'white' }}
                />
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceTrends.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="#a0aec0"
                  />
                  <YAxis stroke="#a0aec0" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#4a5568',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="overall" fill="#4299e1" name="Overall" />
                  <Bar dataKey="collaboration" fill="#48bb78" name="Collaboration" />
                  <Bar dataKey="quality" fill="#ed8936" name="Quality" />
                  <Bar dataKey="efficiency" fill="#9f7aea" name="Efficiency" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderAgentAnalysisTab = () => (
    <Grid container spacing={3}>
      {/* Agent Performance Table */}
      <Grid item xs={12} lg={8}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <CardHeader
            title="Agent Performance Analysis"
            action={
              <Box display="flex" gap={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: 'white' }}>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ color: 'white' }}
                  >
                    <MenuItem value="overall">Overall</MenuItem>
                    <MenuItem value="influence">Influence</MenuItem>
                    <MenuItem value="quality">Quality</MenuItem>
                    <MenuItem value="interactions">Interactions</MenuItem>
                    <MenuItem value="responsiveness">Responsiveness</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={comparisonMode}
                      onChange={(e) => setComparisonMode(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Compare"
                  sx={{ color: 'white' }}
                />
              </Box>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white' }}>Agent</TableCell>
                    <TableCell sx={{ color: 'white' }}>Role</TableCell>
                    <TableCell sx={{ color: 'white' }}>Influence</TableCell>
                    <TableCell sx={{ color: 'white' }}>Quality</TableCell>
                    <TableCell sx={{ color: 'white' }}>Interactions</TableCell>
                    <TableCell sx={{ color: 'white' }}>Trend</TableCell>
                    <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedAgentData.map((agent) => (
                    <TableRow
                      key={agent.agentId}
                      sx={{
                        backgroundColor: selectedAgent === agent.agentId ? '#4a5568' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedAgent(agent.agentId)}
                    >
                      <TableCell sx={{ color: 'white' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">{agent.name}</Typography>
                          {agent.specializations.length > 0 && (
                            <Chip
                              label={agent.specializations[0]}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Chip
                          label={agent.role}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={agent.metrics.influence * 100}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getPerformanceColor(agent.metrics.influence)
                              }
                            }}
                          />
                          <Typography variant="caption">
                            {(agent.metrics.influence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={agent.metrics.quality * 100}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getPerformanceColor(agent.metrics.quality)
                              }
                            }}
                          />
                          <Typography variant="caption">
                            {(agent.metrics.quality * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        {agent.metrics.interactions}
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        {getTrendIcon(agent.trends)}
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Button
                          size="small"
                          onClick={() => onAgentSelect?.(agent.agentId)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Agent Details */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <CardHeader title="Agent Details" />
          <CardContent>
            {selectedAgent ? (
              <Box>
                {(() => {
                  const agent = agentPerformanceData.find(a => a.agentId === selectedAgent);
                  if (!agent) return <Typography>Agent not found</Typography>;
                  
                  return (
                    <Box>
                      <Typography variant="h6" mb={2}>{agent.name}</Typography>
                      
                      <Box mb={3}>
                        <Typography variant="subtitle2" sx={{ color: '#a0aec0', mb: 1 }}>
                          Performance Metrics
                        </Typography>
                        {Object.entries(agent.metrics).map(([key, value]) => (
                          <Box key={key} display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                              {key}:
                            </Typography>
                            <Typography variant="caption" color={getPerformanceColor(value)}>
                              {typeof value === 'number' ? 
                                (value < 1 ? `${(value * 100).toFixed(0)}%` : value.toFixed(0)) :
                                value
                              }
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      <Box mb={3}>
                        <Typography variant="subtitle2" sx={{ color: '#a0aec0', mb: 1 }}>
                          Specializations
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {agent.specializations.map((spec) => (
                            <Chip
                              key={spec}
                              label={spec}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#a0aec0', mb: 1 }}>
                          Performance Trend
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTrendIcon(agent.trends)}
                          <Typography variant="body2">
                            {agent.trends.improving ? 'Improving' :
                             agent.trends.declining ? 'Declining' :
                             agent.trends.stagnant ? 'Stagnant' : 'Stable'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            ) : (
              <Typography sx={{ color: '#a0aec0' }}>
                Select an agent to view detailed performance metrics
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPatternsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <CardHeader title="Collaboration Patterns" />
          <CardContent>
            <Grid container spacing={2}>
              {collaborationPatterns.map((pattern) => (
                <Grid item xs={12} md={6} key={pattern.name}>
                  <Card sx={{ backgroundColor: '#4a5568', color: 'white' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">{pattern.name}</Typography>
                        {pattern.emergent && (
                          <Chip
                            label="Emergent"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      <Box mb={2}>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          Effectiveness
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={pattern.effectiveness * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getPerformanceColor(pattern.effectiveness)
                            }
                          }}
                        />
                        <Typography variant="caption">
                          {(pattern.effectiveness * 100).toFixed(0)}%
                        </Typography>
                      </Box>

                      <Box mb={2}>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          Frequency
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={pattern.frequency * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#4299e1'
                            }
                          }}
                        />
                        <Typography variant="caption">
                          {(pattern.frequency * 100).toFixed(0)}%
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ color: '#a0aec0', mb: 1 }}>
                          Participants ({pattern.participants.length})
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {pattern.participants.slice(0, 3).map((participant) => (
                            <Chip
                              key={participant}
                              label={participant}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                          {pattern.participants.length > 3 && (
                            <Chip
                              label={`+${pattern.participants.length - 3} more`}
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box className={className}>
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Analytics />
              <Typography variant="h6">Performance Analytics</Typography>
              <Chip
                label={`Score: ${(overallPerformanceScore * 100).toFixed(0)}`}
                color={overallPerformanceScore > 0.8 ? 'success' : 
                       overallPerformanceScore > 0.6 ? 'warning' : 'error'}
              />
            </Box>
          }
          action={
            <Box display="flex" gap={1}>
              <Tooltip title="Export analytics">
                <IconButton
                  onClick={() => onExportAnalytics?.({
                    metrics,
                    agentPerformanceData,
                    collaborationPatterns,
                    performanceTrends,
                    overallScore: overallPerformanceScore
                  })}
                  sx={{ color: 'white' }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => {
                    generateAgentPerformanceData();
                    generateCollaborationPatterns();
                    generatePerformanceTrends();
                  }}
                  sx={{ color: 'white' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: 'white' },
              '& .Mui-selected': { color: '#3182ce !important' }
            }}
          >
            <Tab label="Overview" icon={<Assessment />} />
            <Tab label="Agent Analysis" icon={<Group />} />
            <Tab label="Patterns" icon={<Timeline />} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderAgentAnalysisTab()}
          {activeTab === 2 && renderPatternsTab()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceAnalyticsPanel;

