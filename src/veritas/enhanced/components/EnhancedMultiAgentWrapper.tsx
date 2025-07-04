/**
 * Enhanced Multi-Agent Wrapper Component
 * 
 * Extends the existing AgentWrapper with Enhanced Veritas 2 capabilities including
 * intelligent suggestions, uncertainty-driven orchestration, and seamless HITL integration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Badge,
  Collapse,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Stack
} from '@mui/material';
import {
  Psychology,
  AutoAwesome,
  Group,
  TrendingUp,
  Settings,
  Lightbulb,
  Warning,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Analytics,
  QuestionAnswer,
  Timeline
} from '@mui/icons-material';
import { AgentWrapper } from '../../../ui/agent-wrapper/AgentWrapper';
import { UncertaintyAnalysisDisplay } from './UncertaintyAnalysisDisplay';
import { HITLCollaborationInterface } from './HITLCollaborationInterface';
import {
  EnhancedWrapperAgent,
  AgentConfigurationSuggestion,
  TeamSuggestion,
  CollaborationPatternSuggestion
} from '../multiAgent/enhancedAgentWrapper';
import {
  UncertaintyAnalysis,
  VerificationContext,
  HITLSession,
  CollaborationSession
} from '../types';
import { useEnhancedVeritas } from '../hooks/useEnhancedVeritas';
import { enhancedAgentWrapperService } from '../multiAgent/enhancedAgentWrapper';
import { intelligentMultiAgentOrchestrator } from '../multiAgent/intelligentOrchestration';

interface EnhancedMultiAgentWrapperProps {
  agents: EnhancedWrapperAgent[];
  onAgentWrapped?: (agent: EnhancedWrapperAgent) => void;
  onTeamCreated?: (teamId: string) => void;
  onCollaborationStarted?: (sessionId: string) => void;
  uncertaintyAnalysis?: UncertaintyAnalysis;
  context?: VerificationContext;
  hitlSession?: HITLSession;
  className?: string;
  enhancedMode?: boolean;
}

const EnhancedMultiAgentWrapper: React.FC<EnhancedMultiAgentWrapperProps> = ({
  agents,
  onAgentWrapped,
  onTeamCreated,
  onCollaborationStarted,
  uncertaintyAnalysis,
  context,
  hitlSession,
  className = '',
  enhancedMode = true
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [intelligentSuggestions, setIntelligentSuggestions] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentConfigurationSuggestion[]>([]);
  const [teamSuggestions, setTeamSuggestions] = useState<TeamSuggestion[]>([]);
  const [patternSuggestions, setPatternSuggestions] = useState<CollaborationPatternSuggestion[]>([]);
  const [activeCollaboration, setActiveCollaboration] = useState<CollaborationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    result: verificationResult,
    loading: verificationLoading,
    analyzeUncertainty
  } = useEnhancedVeritas();

  // Generate suggestions when agents or uncertainty changes
  useEffect(() => {
    if (intelligentSuggestions && agents.length > 0) {
      generateSuggestions();
    }
  }, [agents, uncertaintyAnalysis, context, intelligentSuggestions]);

  const generateSuggestions = useCallback(async () => {
    if (!enhancedMode || agents.length === 0) return;

    setLoading(true);
    try {
      // Generate configuration suggestions
      const configSuggestions = await enhancedAgentWrapperService.generateConfigurationSuggestions(
        agents,
        context,
        uncertaintyAnalysis
      );
      setSuggestions(configSuggestions);

      // Generate team suggestions if uncertainty analysis is available
      if (uncertaintyAnalysis && context) {
        const teamSugs = await enhancedAgentWrapperService.generateTeamSuggestions(
          agents,
          uncertaintyAnalysis,
          context
        );
        setTeamSuggestions(teamSugs);

        // Generate collaboration pattern suggestions
        const patternSugs = await enhancedAgentWrapperService.suggestCollaborationPatterns(
          agents,
          uncertaintyAnalysis,
          context
        );
        setPatternSuggestions(patternSugs);
      }

      setShowSuggestions(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  }, [agents, uncertaintyAnalysis, context, enhancedMode]);

  const handleStartCollaboration = async (teamSuggestion: TeamSuggestion) => {
    if (!uncertaintyAnalysis || !context) {
      setError('Uncertainty analysis and context required for collaboration');
      return;
    }

    setLoading(true);
    try {
      // Create orchestration configuration
      const orchestrationConfig = await intelligentMultiAgentOrchestrator.analyzeAndOrchestrate(
        uncertaintyAnalysis,
        context,
        teamSuggestion.agents
      );

      // Start collaboration session
      const session = await intelligentMultiAgentOrchestrator.startCollaborationSession(
        orchestrationConfig,
        'Enhanced Veritas collaboration session'
      );

      setActiveCollaboration(session);
      if (onCollaborationStarted) {
        onCollaborationStarted(session.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start collaboration');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion: AgentConfigurationSuggestion) => {
    setLoading(true);
    try {
      // Apply suggestion based on type
      switch (suggestion.type) {
        case 'role_optimization':
          await applyRoleOptimization(suggestion);
          break;
        case 'team_composition':
          await applyTeamComposition(suggestion);
          break;
        case 'collaboration_pattern':
          await applyCollaborationPattern(suggestion);
          break;
        case 'uncertainty_specialization':
          await applyUncertaintySpecialization(suggestion);
          break;
      }

      // Refresh suggestions
      await generateSuggestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply suggestion');
    } finally {
      setLoading(false);
    }
  };

  const applyRoleOptimization = async (suggestion: AgentConfigurationSuggestion) => {
    // Implementation for role optimization
    console.log('Applying role optimization:', suggestion);
  };

  const applyTeamComposition = async (suggestion: AgentConfigurationSuggestion) => {
    // Implementation for team composition
    console.log('Applying team composition:', suggestion);
  };

  const applyCollaborationPattern = async (suggestion: AgentConfigurationSuggestion) => {
    // Implementation for collaboration pattern
    console.log('Applying collaboration pattern:', suggestion);
  };

  const applyUncertaintySpecialization = async (suggestion: AgentConfigurationSuggestion) => {
    // Implementation for uncertainty specialization
    console.log('Applying uncertainty specialization:', suggestion);
  };

  const renderSuggestionsPanel = () => (
    <Card sx={{ backgroundColor: '#2d3748', color: 'white', mb: 2 }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <AutoAwesome />
            <Typography variant="h6">Intelligent Suggestions</Typography>
            <Badge badgeContent={suggestions.length + teamSuggestions.length} color="primary">
              <Lightbulb />
            </Badge>
          </Box>
        }
        action={
          <FormControlLabel
            control={
              <Switch
                checked={intelligentSuggestions}
                onChange={(e) => setIntelligentSuggestions(e.target.checked)}
                color="primary"
              />
            }
            label="Enable"
            sx={{ color: 'white' }}
          />
        }
      />
      <Collapse in={showSuggestions && intelligentSuggestions}>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: 'white' },
              '& .Mui-selected': { color: '#3182ce !important' }
            }}
          >
            <Tab label={`Configuration (${suggestions.length})`} />
            <Tab label={`Teams (${teamSuggestions.length})`} />
            <Tab label={`Patterns (${patternSuggestions.length})`} />
          </Tabs>

          {/* Configuration Suggestions */}
          {activeTab === 0 && (
            <Box mt={2}>
              {suggestions.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  No configuration suggestions available
                </Typography>
              ) : (
                <List>
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <ListItem key={index} sx={{ backgroundColor: '#4a5568', mb: 1, borderRadius: 1 }}>
                      <ListItemIcon>
                        {suggestion.type === 'role_optimization' && <Settings />}
                        {suggestion.type === 'team_composition' && <Group />}
                        {suggestion.type === 'collaboration_pattern' && <Timeline />}
                        {suggestion.type === 'uncertainty_specialization' && <Psychology />}
                      </ListItemIcon>
                      <ListItemText
                        primary={suggestion.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                              {suggestion.description}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip
                                label={`${(suggestion.confidence * 100).toFixed(0)}% confidence`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={`+${(suggestion.expectedImprovement * 100).toFixed(0)}% improvement`}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={loading}
                        sx={{ backgroundColor: '#3182ce' }}
                      >
                        Apply
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Team Suggestions */}
          {activeTab === 1 && (
            <Box mt={2}>
              {teamSuggestions.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  No team suggestions available. Provide uncertainty analysis to get team recommendations.
                </Typography>
              ) : (
                <List>
                  {teamSuggestions.slice(0, 3).map((team, index) => (
                    <ListItem key={index} sx={{ backgroundColor: '#4a5568', mb: 1, borderRadius: 1 }}>
                      <ListItemIcon>
                        <Group />
                      </ListItemIcon>
                      <ListItemText
                        primary={team.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                              {team.description}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip
                                label={`${team.agents.length} agents`}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                              <Chip
                                label={`${(team.expectedEffectiveness * 100).toFixed(0)}% effectiveness`}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                              <Chip
                                label={team.collaborationPattern}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => handleStartCollaboration(team)}
                        disabled={loading}
                        sx={{ backgroundColor: '#3182ce' }}
                      >
                        Start
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Pattern Suggestions */}
          {activeTab === 2 && (
            <Box mt={2}>
              {patternSuggestions.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  No collaboration pattern suggestions available
                </Typography>
              ) : (
                <List>
                  {patternSuggestions.slice(0, 3).map((pattern, index) => (
                    <ListItem key={index} sx={{ backgroundColor: '#4a5568', mb: 1, borderRadius: 1 }}>
                      <ListItemIcon>
                        <Timeline />
                      </ListItemIcon>
                      <ListItemText
                        primary={pattern.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                              {pattern.description}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip
                                label={`${(pattern.compatibility * 100).toFixed(0)}% compatible`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={`${pattern.adaptationPotential.toFixed(1)} adaptation`}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );

  const renderActiveCollaboration = () => {
    if (!activeCollaboration) return null;

    const metrics = intelligentMultiAgentOrchestrator.getCollaborationMetrics(activeCollaboration.id);

    return (
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', mb: 2 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Group />
              <Typography variant="h6">Active Collaboration</Typography>
              <Chip
                label={activeCollaboration.status}
                color={activeCollaboration.status === 'active' ? 'success' : 'default'}
                size="small"
              />
            </Box>
          }
          action={
            <Box display="flex" gap={1}>
              <IconButton sx={{ color: 'white' }}>
                <Pause />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Stop />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Analytics />
              </IconButton>
            </Box>
          }
        />
        <CardContent>
          {metrics && (
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  Duration
                </Typography>
                <Typography variant="h6">
                  {Math.round(metrics.duration / 1000 / 60)}m
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  Interactions
                </Typography>
                <Typography variant="h6">
                  {metrics.interactionCount}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  Uncertainty Reduction
                </Typography>
                <Typography variant="h6" color="success.main">
                  {(metrics.uncertaintyReduction * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  Effectiveness
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {(metrics.collaborationEffectiveness * 100).toFixed(0)}%
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Progress bar */}
          <Box mt={2}>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
              Collaboration Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={activeCollaboration.performanceMetrics.overallProgress * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': { backgroundColor: '#3182ce' }
              }}
            />
          </Box>

          {/* Emergent behaviors */}
          {activeCollaboration.emergentBehaviors.length > 0 && (
            <Box mt={2}>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                Emergent Behaviors Detected
              </Typography>
              <Stack direction="row" spacing={1}>
                {activeCollaboration.emergentBehaviors.slice(0, 3).map((behavior, index) => (
                  <Chip
                    key={index}
                    label={behavior.type}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderUncertaintyIntegration = () => {
    if (!uncertaintyAnalysis) return null;

    return (
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', mb: 2 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Psychology />
              <Typography variant="h6">Uncertainty-Driven Orchestration</Typography>
            </Box>
          }
        />
        <CardContent>
          <UncertaintyAnalysisDisplay
            analysis={uncertaintyAnalysis}
            onHITLTrigger={() => {
              // Handle HITL trigger
              console.log('HITL triggered from multi-agent wrapper');
            }}
            onActionSelect={(actionType) => {
              console.log('Action selected:', actionType);
            }}
          />

          {/* Multi-agent recommendations based on uncertainty */}
          <Box mt={2}>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
              Multi-Agent Recommendations
            </Typography>
            <Alert severity="info" sx={{ backgroundColor: '#4a5568', color: 'white' }}>
              <AlertTitle>Uncertainty Level: {(uncertaintyAnalysis.overallUncertainty * 100).toFixed(1)}%</AlertTitle>
              {uncertaintyAnalysis.overallUncertainty > 0.7 ? (
                <Typography variant="body2">
                  High uncertainty detected. Recommend activating multi-agent collaboration with {teamSuggestions.length > 0 ? teamSuggestions[0].agents.length : '3-4'} specialized agents.
                </Typography>
              ) : uncertaintyAnalysis.overallUncertainty > 0.4 ? (
                <Typography variant="body2">
                  Moderate uncertainty. Consider 2-3 agent collaboration for verification and analysis.
                </Typography>
              ) : (
                <Typography variant="body2">
                  Low uncertainty. Single agent with governance monitoring may be sufficient.
                </Typography>
              )}
            </Alert>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderHITLIntegration = () => {
    if (!hitlSession) return null;

    return (
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', mb: 2 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <QuestionAnswer />
              <Typography variant="h6">HITL Integration</Typography>
            </Box>
          }
        />
        <CardContent>
          <HITLCollaborationInterface
            session={hitlSession}
            onResponseSubmit={async (sessionId, questionId, response) => {
              // Handle HITL response
              console.log('HITL response:', { sessionId, questionId, response });
            }}
            onSessionComplete={async (sessionId) => {
              // Handle HITL completion
              console.log('HITL session completed:', sessionId);
            }}
          />

          {/* Agent assistance for HITL */}
          <Box mt={2}>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
              Agent-Assisted Clarification
            </Typography>
            <Alert severity="info" sx={{ backgroundColor: '#4a5568', color: 'white' }}>
              <Typography variant="body2">
                {agents.length} agents available to assist with clarification questions and uncertainty resolution.
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (!enhancedMode) {
    // Fall back to standard AgentWrapper
    return (
      <Box className={className}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FormControlLabel
            control={
              <Switch
                checked={enhancedMode}
                onChange={(e) => {
                  // Handle enhanced mode toggle
                }}
              />
            }
            label="Enhanced Mode"
          />
        </Box>
        <AgentWrapper onAgentWrapped={onAgentWrapped} />
      </Box>
    );
  }

  return (
    <Box className={`enhanced-multi-agent-wrapper ${className}`}>
      {/* Header */}
      <Card sx={{ mb: 2, backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <AutoAwesome />
              <Typography variant="h6">Enhanced Multi-Agent Wrapper</Typography>
              <Chip
                label={`${agents.length} agents`}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Box>
          }
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="Refresh suggestions">
                <IconButton
                  onClick={generateSuggestions}
                  disabled={loading}
                  sx={{ color: 'white' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={enhancedMode}
                    onChange={(e) => {
                      // Handle enhanced mode toggle
                    }}
                    color="primary"
                  />
                }
                label="Enhanced Mode"
                sx={{ color: 'white' }}
              />
            </Box>
          }
        />
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box mb={2}>
          <LinearProgress />
        </Box>
      )}

      {/* Intelligent Suggestions Panel */}
      {renderSuggestionsPanel()}

      {/* Active Collaboration */}
      {renderActiveCollaboration()}

      {/* Uncertainty Integration */}
      {renderUncertaintyIntegration()}

      {/* HITL Integration */}
      {renderHITLIntegration()}

      {/* Standard Agent Wrapper */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Typography variant="h6">Agent Management</Typography>
          }
        />
        <CardContent>
          <AgentWrapper onAgentWrapped={onAgentWrapped} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedMultiAgentWrapper;

