/**
 * Enhanced Emotional Veritas Page
 * 
 * Comprehensive emotional monitoring and governance integration page that correlates
 * emotional analysis with governance metrics, trust scores, and agent behavior patterns.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  Switch,
  Slider,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Psychology,
  Mood,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  Security,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Timeline,
  Assessment,
  Visibility,
  Person,
  Group,
  FilterList,
  Download,
  Refresh,
  ExpandMore,
  PlayArrow,
  Pause,
  Settings,
  NotificationImportant,
  BugReport,
  Shield,
  Gavel,
  MonitorHeart,
  Analytics,
  Compare
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import VeritasIntegrationDemo from '../veritas/components/VeritasIntegrationDemo';
import { 
  observerService, 
  PRISMMetrics, 
  VigilMetrics 
} from '../services/observers';

interface EmotionalMetrics {
  overall_sentiment: number; // -1 to 1
  emotional_stability: number; // 0 to 1
  stress_indicators: number; // 0 to 1
  empathy_score: number; // 0 to 1
  emotional_intelligence: number; // 0 to 1
  mood_variance: number; // 0 to 1
  interaction_quality: number; // 0 to 1
}

interface EmotionalEvent {
  id: string;
  agent_id: string;
  agent_name: string;
  timestamp: string;
  event_type: 'mood_shift' | 'stress_spike' | 'empathy_drop' | 'emotional_violation' | 'positive_interaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  emotional_state: {
    sentiment: number;
    arousal: number;
    valence: number;
    dominance: number;
  };
  context: string;
  governance_correlation: {
    trust_score_impact: number;
    policy_compliance_affected: boolean;
    violation_triggered: boolean;
  };
  resolution_status: 'active' | 'monitoring' | 'resolved' | 'escalated';
}

interface GovernanceEmotionalCorrelation {
  agent_id: string;
  agent_name: string;
  trust_score: number;
  emotional_score: number;
  correlation_strength: number; // -1 to 1
  trend: 'positive' | 'negative' | 'stable';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface EmotionalGovernanceInsight {
  insight_type: 'trust_emotional_correlation' | 'stress_violation_pattern' | 'empathy_compliance_link' | 'mood_performance_impact';
  title: string;
  description: string;
  confidence: number;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  affected_agents: string[];
  recommended_actions: string[];
  data_points: any[];
}

const EmotionalVeritasPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'overview' | 'correlations' | 'events' | 'insights'>('overview');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [emotionalMetrics, setEmotionalMetrics] = useState<Record<string, EmotionalMetrics>>({});
  const [emotionalEvents, setEmotionalEvents] = useState<EmotionalEvent[]>([]);
  const [governanceCorrelations, setGovernanceCorrelations] = useState<GovernanceEmotionalCorrelation[]>([]);
  const [emotionalInsights, setEmotionalInsights] = useState<EmotionalGovernanceInsight[]>([]);
  const [veritasEnabled, setVeritasEnabled] = useState(true);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);
  const [alertThresholds, setAlertThresholds] = useState({
    stress_threshold: 0.7,
    empathy_threshold: 0.3,
    sentiment_threshold: -0.5,
    trust_correlation_threshold: -0.6
  });

  useEffect(() => {
    const initializeEmotionalData = () => {
      // Mock emotional metrics for different agents
      const metrics: Record<string, EmotionalMetrics> = {
        'agent_financial': {
          overall_sentiment: 0.3,
          emotional_stability: 0.8,
          stress_indicators: 0.4,
          empathy_score: 0.7,
          emotional_intelligence: 0.85,
          mood_variance: 0.2,
          interaction_quality: 0.9
        },
        'agent_customer_support': {
          overall_sentiment: 0.6,
          emotional_stability: 0.9,
          stress_indicators: 0.3,
          empathy_score: 0.95,
          emotional_intelligence: 0.9,
          mood_variance: 0.15,
          interaction_quality: 0.95
        },
        'agent_legal': {
          overall_sentiment: 0.1,
          emotional_stability: 0.95,
          stress_indicators: 0.2,
          empathy_score: 0.6,
          emotional_intelligence: 0.8,
          mood_variance: 0.1,
          interaction_quality: 0.85
        },
        'multi_agent_research': {
          overall_sentiment: 0.4,
          emotional_stability: 0.75,
          stress_indicators: 0.5,
          empathy_score: 0.8,
          emotional_intelligence: 0.88,
          mood_variance: 0.3,
          interaction_quality: 0.87
        }
      };

      // Mock emotional events
      const events: EmotionalEvent[] = [
        {
          id: 'event_001',
          agent_id: 'agent_financial',
          agent_name: 'Financial Advisor Agent',
          timestamp: '2025-06-20T14:30:00Z',
          event_type: 'stress_spike',
          severity: 'high',
          emotional_state: {
            sentiment: -0.3,
            arousal: 0.8,
            valence: 0.2,
            dominance: 0.6
          },
          context: 'High-pressure financial advisory session with complex portfolio analysis',
          governance_correlation: {
            trust_score_impact: -5,
            policy_compliance_affected: true,
            violation_triggered: false
          },
          resolution_status: 'monitoring'
        },
        {
          id: 'event_002',
          agent_id: 'agent_customer_support',
          agent_name: 'Customer Support Agent',
          timestamp: '2025-06-20T13:45:00Z',
          event_type: 'positive_interaction',
          severity: 'low',
          emotional_state: {
            sentiment: 0.8,
            arousal: 0.6,
            valence: 0.9,
            dominance: 0.7
          },
          context: 'Successful resolution of customer complaint with high satisfaction',
          governance_correlation: {
            trust_score_impact: 3,
            policy_compliance_affected: false,
            violation_triggered: false
          },
          resolution_status: 'resolved'
        },
        {
          id: 'event_003',
          agent_id: 'multi_agent_research',
          agent_name: 'Research Analysis Team',
          timestamp: '2025-06-20T12:15:00Z',
          event_type: 'empathy_drop',
          severity: 'medium',
          emotional_state: {
            sentiment: 0.1,
            arousal: 0.4,
            valence: 0.3,
            dominance: 0.8
          },
          context: 'Multi-agent coordination stress during complex research task',
          governance_correlation: {
            trust_score_impact: -2,
            policy_compliance_affected: false,
            violation_triggered: false
          },
          resolution_status: 'active'
        }
      ];

      // Mock governance correlations
      const correlations: GovernanceEmotionalCorrelation[] = [
        {
          agent_id: 'agent_financial',
          agent_name: 'Financial Advisor Agent',
          trust_score: 0.72,
          emotional_score: 0.65,
          correlation_strength: 0.78,
          trend: 'positive',
          risk_level: 'medium',
          recommendations: [
            'Monitor stress levels during high-pressure sessions',
            'Implement emotional regulation protocols',
            'Consider workload balancing'
          ]
        },
        {
          agent_id: 'agent_customer_support',
          agent_name: 'Customer Support Agent',
          trust_score: 0.94,
          emotional_score: 0.91,
          correlation_strength: 0.89,
          trend: 'positive',
          risk_level: 'low',
          recommendations: [
            'Maintain current emotional intelligence protocols',
            'Use as model for other agents'
          ]
        },
        {
          agent_id: 'agent_legal',
          agent_name: 'Legal Advisor Agent',
          trust_score: 0.88,
          emotional_score: 0.73,
          correlation_strength: 0.45,
          trend: 'stable',
          risk_level: 'low',
          recommendations: [
            'Enhance empathy training for client interactions',
            'Monitor emotional engagement levels'
          ]
        }
      ];

      // Mock emotional insights
      const insights: EmotionalGovernanceInsight[] = [
        {
          insight_type: 'trust_emotional_correlation',
          title: 'Strong Trust-Emotional Correlation Detected',
          description: 'Agents with higher emotional intelligence scores consistently maintain higher trust scores and better governance compliance.',
          confidence: 0.87,
          impact_level: 'high',
          affected_agents: ['agent_customer_support', 'agent_financial'],
          recommended_actions: [
            'Implement emotional intelligence training for all agents',
            'Use emotional metrics as early warning system for trust degradation',
            'Develop emotional-governance feedback loops'
          ],
          data_points: [
            { agent: 'Customer Support', trust: 0.94, emotional: 0.91 },
            { agent: 'Financial', trust: 0.72, emotional: 0.65 },
            { agent: 'Legal', trust: 0.88, emotional: 0.73 }
          ]
        },
        {
          insight_type: 'stress_violation_pattern',
          title: 'Stress Spikes Precede Governance Violations',
          description: 'Analysis shows that 73% of governance violations are preceded by elevated stress indicators within 2 hours.',
          confidence: 0.73,
          impact_level: 'critical',
          affected_agents: ['agent_financial', 'multi_agent_research'],
          recommended_actions: [
            'Implement real-time stress monitoring',
            'Create stress-based governance alerts',
            'Develop stress mitigation protocols'
          ],
          data_points: [
            { time: '10:00', stress: 0.3, violations: 0 },
            { time: '12:00', stress: 0.7, violations: 2 },
            { time: '14:00', stress: 0.8, violations: 3 },
            { time: '16:00', stress: 0.4, violations: 1 }
          ]
        }
      ];

      setEmotionalMetrics(metrics);
      setEmotionalEvents(events);
      setGovernanceCorrelations(correlations);
      setEmotionalInsights(insights);
      setAvailableAgents([
        'Financial Advisor Agent',
        'Customer Support Agent',
        'Legal Advisor Agent',
        'Research Analysis Team',
        'Customer Service Agent'
      ]);
    };

    initializeEmotionalData();
  }, []);

  const getEmotionalColor = (score: number) => {
    if (score >= 0.8) return '#10B981'; // Green
    if (score >= 0.6) return '#3B82F6'; // Blue
    if (score >= 0.4) return '#F59E0B'; // Yellow
    if (score >= 0.2) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <SentimentSatisfied sx={{ color: '#10B981' }} />;
    if (sentiment > -0.3) return <SentimentNeutral sx={{ color: '#F59E0B' }} />;
    return <SentimentDissatisfied sx={{ color: '#EF4444' }} />;
  };

  const getEventSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const exportEmotionalData = () => {
    const exportData = {
      emotional_metrics: emotionalMetrics,
      emotional_events: emotionalEvents,
      governance_correlations: governanceCorrelations,
      emotional_insights: emotionalInsights,
      alert_thresholds: alertThresholds,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotional_veritas_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          <Typography variant="h4" gutterBottom>
            Emotional Veritas
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Advanced emotional monitoring with governance correlation and trust analysis
          </Typography>
          {/* Enhanced version - Build timestamp: 2025-01-07 */}
        </Box>
        <Box display="flex" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeMonitoring}
                onChange={(e) => setRealTimeMonitoring(e.target.checked)}
              />
            }
            label="Real-time Monitoring"
          />
          <Button
            variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
            startIcon={<Download />}
            onClick={exportEmotionalData}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Real-time Status */}
      {realTimeMonitoring && (
        <Alert 
          severity="info" 
          sx={{ mb: 4 }}
          icon={<MonitorHeart />}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography>
              Real-time emotional monitoring active - {Object.keys(emotionalMetrics).length} agents monitored
            </Typography>
            <CircularProgress size={20} />
          </Box>
        </Alert>
      )}

      {/* View Mode Toggle */}
      <Box mb={4}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          aria-label="view mode"
        >
          <ToggleButton value="overview" aria-label="overview">
            <Psychology sx={{ mr: 1 }} />
            Overview
          </ToggleButton>
          <ToggleButton value="correlations" aria-label="correlations">
            <Compare sx={{ mr: 1 }} />
            Governance Correlations
          </ToggleButton>
          <ToggleButton value="events" aria-label="events">
            <Timeline sx={{ mr: 1 }} />
            Emotional Events
          </ToggleButton>
          <ToggleButton value="insights" aria-label="insights">
            <Analytics sx={{ mr: 1 }} />
            AI Insights
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Agent Filter */}
      <Box mb={4}>
        <Autocomplete
          multiple
          options={availableAgents}
          value={selectedAgents}
          onChange={(event, newValue) => setSelectedAgents(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Agents"
              placeholder="Select agents to analyze"
              variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
                label={option}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
        />
      </Box>

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <Box>
          {/* Emotional Metrics Summary */}
          <Grid container spacing={3} mb={4}>
            {Object.entries(emotionalMetrics)
              .filter(([agentId, metrics]) => 
                selectedAgents.length === 0 || 
                selectedAgents.some(name => agentId.includes(name.toLowerCase().replace(/\s+/g, '_')))
              )
              .map(([agentId, metrics]) => (
                <Grid item xs={12} md={6} lg={4} key={agentId}>
                  <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: getEmotionalColor(metrics.emotional_intelligence) }}>
                          {getSentimentIcon(metrics.overall_sentiment)}
                        </Avatar>
                      }
                      title={agentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      subheader={`Emotional Intelligence: ${(metrics.emotional_intelligence * 100).toFixed(0)}%`}
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Sentiment
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={(metrics.overall_sentiment + 1) * 50}
                              sx={{
                                width: 60,
                                mr: 1,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getEmotionalColor((metrics.overall_sentiment + 1) / 2)
                                }
                              }}
                            />
                            <Typography variant="body2">
                              {(metrics.overall_sentiment * 100).toFixed(0)}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Stability
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={metrics.emotional_stability * 100}
                              sx={{
                                width: 60,
                                mr: 1,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getEmotionalColor(metrics.emotional_stability)
                                }
                              }}
                            />
                            <Typography variant="body2">
                              {(metrics.emotional_stability * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Stress Level
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={metrics.stress_indicators * 100}
                              sx={{
                                width: 60,
                                mr: 1,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getEmotionalColor(1 - metrics.stress_indicators)
                                }
                              }}
                            />
                            <Typography variant="body2">
                              {(metrics.stress_indicators * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Empathy
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={metrics.empathy_score * 100}
                              sx={{
                                width: 60,
                                mr: 1,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getEmotionalColor(metrics.empathy_score)
                                }
                              }}
                            />
                            <Typography variant="body2">
                              {(metrics.empathy_score * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Box mt={2}>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Interaction Quality: {(metrics.interaction_quality * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Mood Variance: {(metrics.mood_variance * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* VERITAS Integration Demo */}
          <Card sx={{ mb: 4, backgroundColor: '#2d3748', color: 'white' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ color: 'white' }}>VERITAS Emotional Integration</Typography>}
              subheader={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Real-time factual verification with emotional context analysis</Typography>}
              action={
                <FormControlLabel
                  control={
                    <Switch
                      checked={veritasEnabled}
                      onChange={(e) => setVeritasEnabled(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#3182ce',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#3182ce',
                        },
                      }}
                    />
                  }
                  label={<Typography sx={{ color: 'white' }}>VERITAS Enabled</Typography>}
                />
              }
            />
            <CardContent>
              {veritasEnabled ? (
                <VeritasIntegrationDemo
                  initialTrustScore={75}
                  onTrustScoreChange={(score) => console.log('Trust score changed:', score)}
                  onObserverNote={(note) => console.log('Observer note:', note)}
                  onTraceUpdate={(entry) => console.log('Trace update:', entry)}
                />
              ) : (
                <Alert severity="info" sx={{ backgroundColor: '#4a5568', color: 'white', '& .MuiAlert-icon': { color: '#3182ce' } }}>
                  VERITAS integration is disabled. Enable to see real-time factual verification with emotional context.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Governance Correlations Tab */}
      {viewMode === 'correlations' && (
        <Box>
          <Grid container spacing={3} mb={4}>
            {governanceCorrelations
              .filter(correlation => 
                selectedAgents.length === 0 || 
                selectedAgents.includes(correlation.agent_name)
              )
              .map((correlation) => (
                <Grid item xs={12} md={6} lg={4} key={correlation.agent_id}>
                  <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: getRiskLevelColor(correlation.risk_level) }}>
                          <Security />
                        </Avatar>
                      }
                      title={correlation.agent_name}
                      subheader={
                        <Box display="flex" gap={1} mt={1}>
                          <Chip
                            label={`Risk: ${correlation.risk_level.toUpperCase()}`}
                            size="small"
                            sx={{ bgcolor: getRiskLevelColor(correlation.risk_level), color: 'white' }}
                          />
                          <Chip
                            label={correlation.trend}
                            size="small"
                            variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
                            color={correlation.trend === 'positive' ? 'success' : correlation.trend === 'negative' ? 'error' : 'default'}
                          />
                        </Box>
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Trust Score
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {(correlation.trust_score * 100).toFixed(0)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Emotional Score
                          </Typography>
                          <Typography variant="h6" color="secondary">
                            {(correlation.emotional_score * 100).toFixed(0)}%
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box mb={2}>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }} gutterBottom>
                          Correlation Strength
                        </Typography>
                        <Box display="flex" alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={Math.abs(correlation.correlation_strength) * 100}
                            sx={{
                              width: '100%',
                              mr: 1,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: correlation.correlation_strength > 0 ? '#10B981' : '#EF4444'
                              }
                            }}
                          />
                          <Typography variant="body2">
                            {(correlation.correlation_strength * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="subtitle2" gutterBottom>
                        Recommendations:
                      </Typography>
                      <List dense>
                        {correlation.recommendations.slice(0, 2).map((rec, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 20 }}>
                              <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={rec}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* Correlation Chart */}
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardHeader title="Trust vs Emotional Score Correlation" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="emotional_score" 
                    type="number" 
                    domain={[0, 1]}
                    label={{ value: 'Emotional Score', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="trust_score" 
                    type="number" 
                    domain={[0, 1]}
                    label={{ value: 'Trust Score', angle: -90, position: 'insideLeft' }}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [`${(value as number * 100).toFixed(1)}%`, name]}
                    labelFormatter={(label) => `Agent: ${label}`}
                  />
                  <Scatter 
                    data={governanceCorrelations.map(c => ({
                      ...c,
                      name: c.agent_name
                    }))}
                    fill="#3B82F6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Emotional Events Tab */}
      {viewMode === 'events' && (
        <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <CardHeader
            title="Emotional Events"
            subheader={`${emotionalEvents.length} events tracked`}
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Emotional State</TableCell>
                    <TableCell>Governance Impact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emotionalEvents
                    .filter(event => 
                      selectedAgents.length === 0 || 
                      selectedAgents.includes(event.agent_name)
                    )
                    .map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {event.agent_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                {event.agent_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.event_type.replace(/_/g, ' ')}
                            size="small"
                            variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.severity}
                            size="small"
                            sx={{
                              bgcolor: getEventSeverityColor(event.severity),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              Sentiment: {(event.emotional_state.sentiment * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                              Arousal: {(event.emotional_state.arousal * 100).toFixed(0)}% | 
                              Valence: {(event.emotional_state.valence * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              Trust Impact: {event.governance_correlation.trust_score_impact > 0 ? '+' : ''}{event.governance_correlation.trust_score_impact}
                            </Typography>
                            {event.governance_correlation.violation_triggered && (
                              <Chip label="Violation" size="small" color="error" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.resolution_status}
                            size="small"
                            color={
                              event.resolution_status === 'resolved' ? 'success' :
                              event.resolution_status === 'active' ? 'error' :
                              event.resolution_status === 'escalated' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(event.timestamp).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Tab */}
      {viewMode === 'insights' && (
        <Box>
          {emotionalInsights.map((insight) => (
            <Card key={insight.insight_type} sx={{ mb: 3 }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: insight.impact_level === 'critical' ? '#EF4444' : insight.impact_level === 'high' ? '#F97316' : '#3B82F6' }}>
                    <Analytics />
                  </Avatar>
                }
                title={insight.title}
                subheader={
                  <Box display="flex" gap={1} mt={1}>
                    <Chip
                      label={`${insight.impact_level.toUpperCase()} IMPACT`}
                      size="small"
                      sx={{
                        bgcolor: insight.impact_level === 'critical' ? '#EF4444' : insight.impact_level === 'high' ? '#F97316' : '#3B82F6',
                        color: 'white'
                      }}
                    />
                    <Chip
                      label={`${(insight.confidence * 100).toFixed(0)}% Confidence`}
                      size="small"
                      variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
                    />
                  </Box>
                }
              />
              <CardContent>
                <Typography variant="body1" paragraph>
                  {insight.description}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Affected Agents:
                </Typography>
                <Box mb={2}>
                  {insight.affected_agents.map((agent) => (
                    <Chip
                      key={agent}
                      label={agent}
                      size="small"
                      variant="outlined" 
                      sx={{ backgroundColor: '#2d3748', color: 'white', mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Recommended Actions:
                </Typography>
                <List dense>
                  {insight.recommended_actions.map((action, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={action}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                {insight.data_points && insight.data_points.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Supporting Data:
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      {insight.insight_type === 'trust_emotional_correlation' ? (
                        <ScatterChart data={insight.data_points}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="emotional" label={{ value: 'Emotional Score', position: 'insideBottom', offset: -5 }} />
                          <YAxis dataKey="trust" label={{ value: 'Trust Score', angle: -90, position: 'insideLeft' }} />
                          <RechartsTooltip />
                          <Scatter dataKey="trust" fill="#3B82F6" />
                        </ScatterChart>
                      ) : (
                        <LineChart data={insight.data_points}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <RechartsTooltip />
                          <Line type="monotone" dataKey="stress" stroke="#EF4444" />
                          <Line type="monotone" dataKey="violations" stroke="#F59E0B" />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default EmotionalVeritasPage;

