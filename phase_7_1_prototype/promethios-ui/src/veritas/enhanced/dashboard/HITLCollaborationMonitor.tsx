/**
 * HITL Collaboration Monitor
 * 
 * Real-time monitoring dashboard for Human-in-the-Loop collaboration sessions.
 * Provides live insights into expert interactions, clarification progress,
 * uncertainty reduction, and collaboration effectiveness.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineDot,
  TimelineSeparator,
  TimelineConnector,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  QuestionAnswer as QuestionAnswerIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface HITLCollaborationMonitorProps {
  sessionId?: string;
  onConfigurationChange?: (config: any) => void;
}

interface HITLSession {
  sessionId: string;
  expertId: string;
  expertName: string;
  expertDomain: string;
  sessionStatus: 'active' | 'paused' | 'completed' | 'escalated';
  startTime: string;
  lastActivity: string;
  uncertaintyReduction: number;
  clarificationProgress: number;
  questionsAsked: number;
  questionsAnswered: number;
  expertSatisfaction: number;
  collaborationEffectiveness: number;
  estimatedCompletionTime: number;
}

interface ClarificationQuestion {
  questionId: string;
  questionText: string;
  questionType: string;
  uncertaintyTarget: string;
  askedTime: string;
  answeredTime?: string;
  responseQuality: number;
  informationGain: number;
  expertConfidence: number;
}

interface ExpertInteraction {
  interactionId: string;
  expertId: string;
  interactionType: 'question' | 'response' | 'clarification' | 'escalation';
  content: string;
  timestamp: string;
  effectiveness: number;
  uncertaintyImpact: number;
}

const HITLCollaborationMonitor: React.FC<HITLCollaborationMonitorProps> = ({
  sessionId,
  onConfigurationChange
}) => {
  const theme = useTheme();
  const [activeSessions, setActiveSessions] = useState<HITLSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<HITLSession | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [expertInteractions, setExpertInteractions] = useState<ExpertInteraction[]>([]);
  const [uncertaintyTrend, setUncertaintyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch HITL collaboration data
  const fetchCollaborationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active HITL sessions
      const sessions = await fetchActiveSessions();
      setActiveSessions(sessions);

      // If we have a specific session or select the first active one
      const targetSession = sessionId 
        ? sessions.find(s => s.sessionId === sessionId)
        : sessions[0];

      if (targetSession) {
        setSelectedSession(targetSession);
        
        // Fetch session details
        const questions = await fetchClarificationQuestions(targetSession.sessionId);
        setClarificationQuestions(questions);
        
        const interactions = await fetchExpertInteractions(targetSession.sessionId);
        setExpertInteractions(interactions);
        
        const trend = await fetchUncertaintyTrend(targetSession.sessionId);
        setUncertaintyTrend(trend);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collaboration data');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchCollaborationData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchCollaborationData, 10000);
    return () => clearInterval(interval);
  }, [fetchCollaborationData]);

  // Mock data fetching functions (would connect to actual Enhanced Veritas 2 services)
  const fetchActiveSessions = async (): Promise<HITLSession[]> => {
    return [
      {
        sessionId: 'hitl-001',
        expertId: 'expert-tech-001',
        expertName: 'Dr. Sarah Chen',
        expertDomain: 'technical',
        sessionStatus: 'active',
        startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        lastActivity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        uncertaintyReduction: 0.65,
        clarificationProgress: 0.75,
        questionsAsked: 8,
        questionsAnswered: 6,
        expertSatisfaction: 0.85,
        collaborationEffectiveness: 0.78,
        estimatedCompletionTime: 15
      },
      {
        sessionId: 'hitl-002',
        expertId: 'expert-med-001',
        expertName: 'Dr. Michael Rodriguez',
        expertDomain: 'medical',
        sessionStatus: 'active',
        startTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        lastActivity: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        uncertaintyReduction: 0.45,
        clarificationProgress: 0.55,
        questionsAsked: 5,
        questionsAnswered: 4,
        expertSatisfaction: 0.92,
        collaborationEffectiveness: 0.88,
        estimatedCompletionTime: 25
      }
    ];
  };

  const fetchClarificationQuestions = async (sessionId: string): Promise<ClarificationQuestion[]> => {
    return [
      {
        questionId: 'q-001',
        questionText: 'Can you clarify the technical constraints that might affect the system performance?',
        questionType: 'open_ended',
        uncertaintyTarget: 'epistemic',
        askedTime: new Date(Date.now() - 1200000).toISOString(),
        answeredTime: new Date(Date.now() - 900000).toISOString(),
        responseQuality: 0.85,
        informationGain: 0.25,
        expertConfidence: 0.9
      },
      {
        questionId: 'q-002',
        questionText: 'What is the likelihood of the proposed solution meeting the performance requirements?',
        questionType: 'scale',
        uncertaintyTarget: 'aleatoric',
        askedTime: new Date(Date.now() - 600000).toISOString(),
        answeredTime: new Date(Date.now() - 300000).toISOString(),
        responseQuality: 0.78,
        informationGain: 0.2,
        expertConfidence: 0.75
      },
      {
        questionId: 'q-003',
        questionText: 'Are there any additional factors we should consider for this implementation?',
        questionType: 'open_ended',
        uncertaintyTarget: 'contextual',
        askedTime: new Date(Date.now() - 180000).toISOString(),
        responseQuality: 0.0,
        informationGain: 0.0,
        expertConfidence: 0.0
      }
    ];
  };

  const fetchExpertInteractions = async (sessionId: string): Promise<ExpertInteraction[]> => {
    return [
      {
        interactionId: 'int-001',
        expertId: 'expert-tech-001',
        interactionType: 'response',
        content: 'The main technical constraint is the memory limitation of 8GB RAM...',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        effectiveness: 0.85,
        uncertaintyImpact: -0.25
      },
      {
        interactionId: 'int-002',
        expertId: 'expert-tech-001',
        interactionType: 'clarification',
        content: 'To clarify the performance requirements, we need to consider...',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        effectiveness: 0.78,
        uncertaintyImpact: -0.2
      }
    ];
  };

  const fetchUncertaintyTrend = async (sessionId: string): Promise<any[]> => {
    return [
      { time: '0min', uncertainty: 0.85, confidence: 0.3 },
      { time: '5min', uncertainty: 0.75, confidence: 0.45 },
      { time: '10min', uncertainty: 0.65, confidence: 0.6 },
      { time: '15min', uncertainty: 0.55, confidence: 0.7 },
      { time: '20min', uncertainty: 0.45, confidence: 0.78 },
      { time: '25min', uncertainty: 0.35, confidence: 0.85 },
      { time: '30min', uncertainty: 0.3, confidence: 0.88 }
    ];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'paused': return theme.palette.warning.main;
      case 'completed': return theme.palette.info.main;
      case 'escalated': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Render active sessions overview
  const renderActiveSessionsOverview = () => (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Active HITL Sessions"
        action={
          <IconButton onClick={fetchCollaborationData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent>
        <List>
          {activeSessions.map((session) => (
            <ListItem
              key={session.sessionId}
              button
              selected={selectedSession?.sessionId === session.sessionId}
              onClick={() => setSelectedSession(session)}
              sx={{
                border: 1,
                borderColor: selectedSession?.sessionId === session.sessionId 
                  ? theme.palette.primary.main 
                  : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getStatusColor(session.sessionStatus) }}>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">{session.expertName}</Typography>
                    <Chip
                      label={session.sessionStatus}
                      size="small"
                      sx={{ bgcolor: getStatusColor(session.sessionStatus), color: 'white' }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Domain: {session.expertDomain} • Started: {formatTimeAgo(session.startTime)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingDownIcon fontSize="small" color="success" />
                        <Typography variant="caption">
                          {(session.uncertaintyReduction * 100).toFixed(0)}% reduced
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <QuestionAnswerIcon fontSize="small" color="primary" />
                        <Typography variant="caption">
                          {session.questionsAnswered}/{session.questionsAsked} answered
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" color="info" />
                        <Typography variant="caption">
                          ~{session.estimatedCompletionTime}m remaining
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  // Render session details
  const renderSessionDetails = () => {
    if (!selectedSession) return null;

    return (
      <Grid container spacing={3}>
        {/* Session Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Collaboration Progress" />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Uncertainty Reduction: {(selectedSession.uncertaintyReduction * 100).toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={selectedSession.uncertaintyReduction * 100}
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" gutterBottom>
                  Clarification Progress: {(selectedSession.clarificationProgress * 100).toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={selectedSession.clarificationProgress * 100}
                  color="secondary"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" gutterBottom>
                  Expert Satisfaction: {(selectedSession.expertSatisfaction * 100).toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={selectedSession.expertSatisfaction * 100}
                  color="success"
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {selectedSession.questionsAnswered}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Questions Answered
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="secondary">
                    {(selectedSession.collaborationEffectiveness * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Effectiveness
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Uncertainty Trend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Uncertainty Reduction Trend" />
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={uncertaintyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 1]} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="uncertainty"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    name="Uncertainty"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    name="Confidence"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Questions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Clarification Questions" />
            <CardContent>
              <List>
                {clarificationQuestions.map((question) => (
                  <ListItem key={question.questionId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={question.questionText}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Type: {question.questionType} • Target: {question.uncertaintyTarget}
                          </Typography>
                          {question.answeredTime ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <CheckCircleIcon fontSize="small" color="success" />
                              <Typography variant="caption">
                                Answered • Quality: {(question.responseQuality * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <CircularProgress size={12} />
                              <Typography variant="caption">Awaiting response...</Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Expert Interactions Timeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Expert Interactions" />
            <CardContent>
              <Timeline>
                {expertInteractions.map((interaction, index) => (
                  <TimelineItem key={interaction.interactionId}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="textSecondary">
                      {formatTimeAgo(interaction.timestamp)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot
                        color={interaction.effectiveness > 0.7 ? 'success' : 'warning'}
                      >
                        {interaction.interactionType === 'question' && <QuestionAnswerIcon />}
                        {interaction.interactionType === 'response' && <CheckCircleIcon />}
                        {interaction.interactionType === 'clarification' && <PsychologyIcon />}
                        {interaction.interactionType === 'escalation' && <WarningIcon />}
                      </TimelineDot>
                      {index < expertInteractions.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="h6" component="span">
                        {interaction.interactionType.charAt(0).toUpperCase() + interaction.interactionType.slice(1)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {interaction.content.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={`${(interaction.effectiveness * 100).toFixed(0)}% effective`}
                          size="small"
                          color={interaction.effectiveness > 0.7 ? 'success' : 'warning'}
                        />
                        <Chip
                          label={`${(Math.abs(interaction.uncertaintyImpact) * 100).toFixed(0)}% uncertainty ${interaction.uncertaintyImpact < 0 ? 'reduced' : 'increased'}`}
                          size="small"
                          color={interaction.uncertaintyImpact < 0 ? 'success' : 'error'}
                        />
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading HITL collaboration data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="h6">HITL Monitor Error</Typography>
        <Typography>{error}</Typography>
        <Button onClick={fetchCollaborationData} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        HITL Collaboration Monitor
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Real-time monitoring of human-in-the-loop collaboration sessions, expert interactions, 
        and uncertainty reduction progress.
      </Typography>

      {renderActiveSessionsOverview()}
      {renderSessionDetails()}
    </Box>
  );
};

export default HITLCollaborationMonitor;

