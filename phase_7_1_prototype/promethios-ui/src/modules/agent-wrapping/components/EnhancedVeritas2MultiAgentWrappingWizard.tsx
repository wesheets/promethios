import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  Tooltip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Slider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Chat,
  Dashboard,
  Assessment,
  Rocket,
  Add,
  DragIndicator,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  Delete,
  Edit,
  Download as ExportIcon,
  ArrowBack,
  ArrowForward,
  AutoAwesome,
  Psychology,
  Analytics,
  Groups,
  ExpandMore,
  Science,
  TrendingUp,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAgentWrappers } from '../hooks/useAgentWrappers';
import { useMultiAgentSystemsUnified } from '../hooks/useMultiAgentSystemsUnified';
import { usePolicyBackend } from '../../../hooks/usePolicyBackend';
import { useNavigate } from 'react-router-dom';
import { PolicyTemplate } from '../../../services/policyBackendService';
import { MultiAgentSystem, AgentRole, AgentConnection, FlowType } from '../types/multiAgent';
import { useAuth } from '../../../context/AuthContext';
import { DualAgentWrapperRegistry } from '../services/DualAgentWrapperRegistry';
import MultiAgentSystemRegistry from '../services/MultiAgentSystemRegistry';
import { DualAgentWrapper, GovernanceConfiguration } from '../types/dualWrapper';

// Enhanced Veritas 2 Configuration Interface for Multi-Agent Systems
interface EnhancedVeritas2MultiAgentConfig {
  enabled: boolean;
  systemLevelAnalytics: {
    enabled: boolean;
    crossAgentEmotionalTracking: boolean;
    systemWideUncertaintyAnalysis: boolean;
    collectiveIntelligenceMonitoring: boolean;
    emergentBehaviorDetection: boolean;
  };
  multiAgentOrchestration: {
    enabled: boolean;
    coordinationOptimization: boolean;
    conflictResolution: boolean;
    loadBalancing: boolean;
    performanceOptimization: boolean;
  };
  distributedHITL: {
    enabled: boolean;
    expertPoolManagement: boolean;
    collaborativeDecisionMaking: boolean;
    escalationChains: boolean;
    consensusBuilding: boolean;
  };
  systemGovernance: {
    enabled: boolean;
    crossAgentPolicyEnforcement: boolean;
    systemWideCompliance: boolean;
    emergentRiskDetection: boolean;
    adaptiveGovernance: boolean;
  };
}

const steps = [
  'Agent Selection',
  'Basic Info',
  'Collaboration Model',
  'Agent Role Selection',
  'Enhanced Veritas 2',
  'Testing & Validation',
  'Review & Deploy'
];

interface EnhancedVeritas2MultiAgentWizardProps {
  onComplete?: (system: MultiAgentSystem) => void;
  onCancel?: () => void;
}

const EnhancedVeritas2MultiAgentWrappingWizard: React.FC<EnhancedVeritas2MultiAgentWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<DualAgentWrapper[]>([]);
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [collaborationModel, setCollaborationModel] = useState<FlowType>('sequential');
  const [agentRoles, setAgentRoles] = useState<AgentRole[]>([]);
  const [enhancedVeritas2Config, setEnhancedVeritas2Config] = useState<EnhancedVeritas2MultiAgentConfig>({
    enabled: true,
    systemLevelAnalytics: {
      enabled: true,
      crossAgentEmotionalTracking: true,
      systemWideUncertaintyAnalysis: true,
      collectiveIntelligenceMonitoring: true,
      emergentBehaviorDetection: false,
    },
    multiAgentOrchestration: {
      enabled: true,
      coordinationOptimization: true,
      conflictResolution: true,
      loadBalancing: true,
      performanceOptimization: true,
    },
    distributedHITL: {
      enabled: true,
      expertPoolManagement: true,
      collaborativeDecisionMaking: true,
      escalationChains: true,
      consensusBuilding: false,
    },
    systemGovernance: {
      enabled: true,
      crossAgentPolicyEnforcement: true,
      systemWideCompliance: true,
      emergentRiskDetection: true,
      adaptiveGovernance: false,
    },
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const { wrappers, loading: wrappersLoading } = useAgentWrappers();
  const { createSystem } = useMultiAgentSystemsUnified();

  const updateEnhancedVeritas2Config = (updates: Partial<EnhancedVeritas2MultiAgentConfig>) => {
    setEnhancedVeritas2Config(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const systemData: Partial<MultiAgentSystem> = {
        name: systemName,
        description: systemDescription,
        agents: selectedAgents.map(wrapper => ({
          id: wrapper.id,
          name: wrapper.baseAgent.name,
          role: agentRoles.find(role => role.agentId === wrapper.id)?.role || 'assistant',
          capabilities: wrapper.baseAgent.capabilities,
          endpoint: wrapper.baseAgent.endpoint,
          provider: wrapper.baseAgent.provider,
        })),
        flowType: collaborationModel,
        connections: [], // Will be auto-generated based on flow type
        governance: {
          level: 'advanced',
          policies: [],
          trustConfig: {
            initialScore: 85,
            minimumThreshold: 70,
            decayRate: 0.05,
            recoveryRate: 0.1,
            factors: [],
            evaluationInterval: 30,
          },
          auditConfig: {
            enabled: true,
            logLevel: 'info',
            retentionDays: 90,
            includePayloads: true,
          },
          // Enhanced Veritas 2 Configuration
          enhancedVeritas2: enhancedVeritas2Config,
        },
        metadata: {
          description: systemDescription,
          tags: ['enhanced', 'veritas-2', 'multi-agent'],
          enhancedVeritas2Enabled: enhancedVeritas2Config.enabled,
        },
      };

      const createdSystem = await createSystem(systemData);
      
      if (onComplete) {
        onComplete(createdSystem);
      } else {
        navigate('/multi-agent-wrapping', { 
          state: { 
            success: true, 
            systemId: createdSystem.id,
            message: 'Multi-agent system successfully created with Enhanced Veritas 2!' 
          } 
        });
      }
    } catch (err) {
      console.error('Failed to create Enhanced Veritas 2 multi-agent system:', err);
      setError(err instanceof Error ? err.message : 'Failed to create multi-agent system');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderAgentSelection();
      case 1:
        return renderBasicInfo();
      case 2:
        return renderCollaborationModel();
      case 3:
        return renderAgentRoleSelection();
      case 4:
        return renderEnhancedVeritas2();
      case 5:
        return renderTestingValidation();
      case 6:
        return renderReviewDeploy();
      default:
        return null;
    }
  };

  const renderAgentSelection = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Agent Selection</Typography>
          <Chip 
            icon={<AutoAwesome />} 
            label="Enhanced Veritas 2" 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select agents for your Enhanced Veritas 2 multi-agent system with advanced orchestration
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🧠 <strong>Enhanced Veritas 2 Multi-Agent System</strong><br />
            Your system will feature cross-agent emotional tracking, system-wide uncertainty analysis, and distributed human-in-the-loop collaboration.
          </Typography>
        </Alert>

        {wrappersLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {wrappers.map((wrapper) => (
              <Grid item xs={12} md={6} key={wrapper.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedAgents.includes(wrapper) ? '2px solid #1976d2' : '1px solid rgba(255,255,255,0.12)',
                    '&:hover': { borderColor: '#1976d2' }
                  }}
                  onClick={() => {
                    if (selectedAgents.includes(wrapper)) {
                      setSelectedAgents(selectedAgents.filter(a => a.id !== wrapper.id));
                    } else {
                      setSelectedAgents([...selectedAgents, wrapper]);
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{wrapper.baseAgent.name}</Typography>
                      {selectedAgents.includes(wrapper) && (
                        <CheckCircle color="primary" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {wrapper.baseAgent.description}
                    </Typography>
                    <Box mt={1}>
                      <Chip label={wrapper.baseAgent.provider} size="small" />
                      {wrapper.metadata?.tags?.includes('veritas-2') && (
                        <Chip label="Veritas 2" color="secondary" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Selected: {selectedAgents.length} agents
        </Typography>
      </CardContent>
    </Card>
  );

  const renderBasicInfo = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Basic Information</Typography>
          <Badge badgeContent="Enhanced" color="secondary">
            <Chip label="Veritas 2" size="small" color="primary" sx={{ ml: 2 }} />
          </Badge>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure basic information for your Enhanced Veritas 2 multi-agent system
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="System Name"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="e.g., Customer Support Team, Content Creation Pipeline"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="System Description"
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              placeholder="Describe the purpose and goals of this multi-agent system..."
            />
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            🧠 Enhanced Veritas 2 will automatically configure system-level emotional intelligence and orchestration based on your agents.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderCollaborationModel = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Chat sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Collaboration Model</Typography>
          <Chip label="Enhanced Orchestration" size="small" color="primary" sx={{ ml: 2 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose how agents will collaborate with Enhanced Veritas 2 orchestration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Collaboration Flow</InputLabel>
              <Select
                value={collaborationModel}
                onChange={(e) => setCollaborationModel(e.target.value as FlowType)}
                label="Collaboration Flow"
              >
                <MenuItem value="sequential">Sequential - Agents work in order</MenuItem>
                <MenuItem value="parallel">Parallel - Agents work simultaneously</MenuItem>
                <MenuItem value="hierarchical">Hierarchical - Structured decision tree</MenuItem>
                <MenuItem value="round_table">Round Table - Collaborative discussion</MenuItem>
                <MenuItem value="innovation_lab">Innovation Lab - Creative collaboration</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            🤖 Enhanced Veritas 2 will optimize coordination patterns and detect emergent behaviors in your chosen collaboration model.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderAgentRoleSelection = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Agent Role Selection</Typography>
          <Chip label="Role-Based Governance" size="small" color="primary" sx={{ ml: 2 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Assign roles to agents with Enhanced Veritas 2 role-based monitoring
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Veritas 2 Profile</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>{agent.baseAgent.name}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={agentRoles.find(role => role.agentId === agent.id)?.role || ''}
                        onChange={(e) => {
                          const newRoles = agentRoles.filter(role => role.agentId !== agent.id);
                          newRoles.push({
                            agentId: agent.id,
                            role: e.target.value,
                            permissions: [],
                            priority: 1,
                          });
                          setAgentRoles(newRoles);
                        }}
                      >
                        <MenuItem value="coordinator">Coordinator</MenuItem>
                        <MenuItem value="specialist">Specialist</MenuItem>
                        <MenuItem value="reviewer">Reviewer</MenuItem>
                        <MenuItem value="executor">Executor</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Chip label="Emotional Intelligence" size="small" color="secondary" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderEnhancedVeritas2 = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} color="primary" />
          <Typography variant="h6">Enhanced Veritas 2 Multi-Agent Configuration</Typography>
          <Chip label="BETA" size="small" color="warning" sx={{ ml: 2 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure advanced multi-agent emotional intelligence and orchestration features
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🚀 <strong>Enhanced Veritas 2 Multi-Agent System</strong><br />
            Advanced system-level analytics, distributed collaboration, and emergent behavior detection will be automatically deployed.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={enhancedVeritas2Config.enabled}
                  onChange={(e) => updateEnhancedVeritas2Config({ enabled: e.target.checked })}
                />
              }
              label="Enable Enhanced Veritas 2 Multi-Agent Features"
            />
          </Grid>

          {enhancedVeritas2Config.enabled && (
            <>
              {/* System-Level Analytics */}
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center">
                      <Analytics color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">System-Level Analytics</Typography>
                      <Chip 
                        label={`${Object.values(enhancedVeritas2Config.systemLevelAnalytics).filter(Boolean).length - 1}/4 Features`} 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 2 }} 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.systemLevelAnalytics.crossAgentEmotionalTracking}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                systemLevelAnalytics: {
                                  ...enhancedVeritas2Config.systemLevelAnalytics,
                                  crossAgentEmotionalTracking: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Cross-Agent Emotional Tracking"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Monitor emotional states across all agents in the system
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.systemLevelAnalytics.systemWideUncertaintyAnalysis}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                systemLevelAnalytics: {
                                  ...enhancedVeritas2Config.systemLevelAnalytics,
                                  systemWideUncertaintyAnalysis: e.target.checked
                                }
                              })}
                            />
                          }
                          label="System-Wide Uncertainty Analysis"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Analyze uncertainty patterns across the entire system
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.systemLevelAnalytics.collectiveIntelligenceMonitoring}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                systemLevelAnalytics: {
                                  ...enhancedVeritas2Config.systemLevelAnalytics,
                                  collectiveIntelligenceMonitoring: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Collective Intelligence Monitoring"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Track collective decision-making and intelligence emergence
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.systemLevelAnalytics.emergentBehaviorDetection}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                systemLevelAnalytics: {
                                  ...enhancedVeritas2Config.systemLevelAnalytics,
                                  emergentBehaviorDetection: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Emergent Behavior Detection"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Detect unexpected behaviors emerging from agent interactions
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Multi-Agent Orchestration */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center">
                      <Dashboard color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Multi-Agent Orchestration</Typography>
                      <Chip 
                        label={`${Object.values(enhancedVeritas2Config.multiAgentOrchestration).filter(Boolean).length - 1}/4 Features`} 
                        size="small" 
                        color="secondary" 
                        sx={{ ml: 2 }} 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.multiAgentOrchestration.coordinationOptimization}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                multiAgentOrchestration: {
                                  ...enhancedVeritas2Config.multiAgentOrchestration,
                                  coordinationOptimization: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Coordination Optimization"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Optimize coordination patterns for maximum efficiency
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.multiAgentOrchestration.conflictResolution}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                multiAgentOrchestration: {
                                  ...enhancedVeritas2Config.multiAgentOrchestration,
                                  conflictResolution: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Conflict Resolution"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Automatically resolve conflicts between agents
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.multiAgentOrchestration.loadBalancing}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                multiAgentOrchestration: {
                                  ...enhancedVeritas2Config.multiAgentOrchestration,
                                  loadBalancing: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Load Balancing"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Balance workload across agents dynamically
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.multiAgentOrchestration.performanceOptimization}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                multiAgentOrchestration: {
                                  ...enhancedVeritas2Config.multiAgentOrchestration,
                                  performanceOptimization: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Performance Optimization"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Continuously optimize system performance
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Distributed HITL */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center">
                      <Groups color="info" sx={{ mr: 1 }} />
                      <Typography variant="h6">Distributed Human-in-the-Loop</Typography>
                      <Badge badgeContent="Advanced" color="info">
                        <Chip label="HITL" size="small" color="info" sx={{ ml: 2 }} />
                      </Badge>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.distributedHITL.expertPoolManagement}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                distributedHITL: {
                                  ...enhancedVeritas2Config.distributedHITL,
                                  expertPoolManagement: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Expert Pool Management"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Manage distributed pool of human experts
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.distributedHITL.collaborativeDecisionMaking}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                distributedHITL: {
                                  ...enhancedVeritas2Config.distributedHITL,
                                  collaborativeDecisionMaking: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Collaborative Decision Making"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Enable collaborative decisions between humans and agents
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.distributedHITL.escalationChains}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                distributedHITL: {
                                  ...enhancedVeritas2Config.distributedHITL,
                                  escalationChains: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Escalation Chains"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Automatic escalation through expert hierarchies
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* System Governance */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center">
                      <Assessment color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6">System Governance</Typography>
                      <Chip 
                        label={`${Object.values(enhancedVeritas2Config.systemGovernance).filter(Boolean).length - 1}/4 Features`} 
                        size="small" 
                        color="success" 
                        sx={{ ml: 2 }} 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.systemGovernance.crossAgentPolicyEnforcement}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                systemGovernance: {
                                  ...enhancedVeritas2Config.systemGovernance,
                                  crossAgentPolicyEnforcement: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Cross-Agent Policy Enforcement"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Enforce policies consistently across all agents
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.systemGovernance.systemWideCompliance}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                systemGovernance: {
                                  ...enhancedVeritas2Config.systemGovernance,
                                  systemWideCompliance: e.target.checked
                                }
                              })}
                            />
                          }
                          label="System-Wide Compliance"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Monitor compliance across the entire system
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedVeritas2Config.systemGovernance.emergentRiskDetection}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                systemGovernance: {
                                  ...enhancedVeritas2Config.systemGovernance,
                                  emergentRiskDetection: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Emergent Risk Detection"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Detect risks emerging from system interactions
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTestingValidation = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Science sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Testing & Validation</Typography>
          <Chip label="Enhanced Testing" size="small" color="primary" sx={{ ml: 2 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Validate your Enhanced Veritas 2 multi-agent system configuration
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🧪 <strong>Enhanced Veritas 2 Testing</strong><br />
            System will be tested for emotional intelligence accuracy, uncertainty analysis effectiveness, and HITL collaboration responsiveness.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>System Configuration</Typography>
                <Typography variant="body2">Agents: {selectedAgents.length}</Typography>
                <Typography variant="body2">Collaboration: {collaborationModel}</Typography>
                <Typography variant="body2">Veritas 2: {enhancedVeritas2Config.enabled ? 'Enabled' : 'Disabled'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Enhanced Features</Typography>
                <Typography variant="body2">System Analytics: {enhancedVeritas2Config.systemLevelAnalytics.enabled ? '✅' : '❌'}</Typography>
                <Typography variant="body2">Orchestration: {enhancedVeritas2Config.multiAgentOrchestration.enabled ? '✅' : '❌'}</Typography>
                <Typography variant="body2">Distributed HITL: {enhancedVeritas2Config.distributedHITL.enabled ? '✅' : '❌'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderReviewDeploy = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Rocket sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Review & Deploy</Typography>
          <Chip label="Enhanced Veritas 2 Ready" size="small" color="success" sx={{ ml: 2 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Review your Enhanced Veritas 2 multi-agent system and deploy to testing and production
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🚀 <strong>Ready for Deployment</strong><br />
            Your Enhanced Veritas 2 multi-agent system will be deployed with advanced emotional intelligence and orchestration capabilities.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>System Summary</Typography>
            <Typography variant="body1"><strong>Name:</strong> {systemName}</Typography>
            <Typography variant="body1"><strong>Description:</strong> {systemDescription}</Typography>
            <Typography variant="body1"><strong>Agents:</strong> {selectedAgents.length}</Typography>
            <Typography variant="body1"><strong>Collaboration Model:</strong> {collaborationModel}</Typography>
            <Typography variant="body1"><strong>Enhanced Veritas 2:</strong> {enhancedVeritas2Config.enabled ? 'Enabled with advanced features' : 'Disabled'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <AutoAwesome color="primary" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" gutterBottom align="center">
            Enhanced Veritas 2 Multi-Agent Wizard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Create advanced multi-agent systems with emotional intelligence and distributed collaboration
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                {label}
                {index === 4 && enhancedVeritas2Config.enabled && (
                  <Chip size="small" label="Veritas 2" color="primary" sx={{ ml: 1 }} />
                )}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            onClick={activeStep === 0 ? onCancel : handleBack}
            startIcon={<ArrowBack />}
            disabled={loading}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
            disabled={loading || (activeStep === 0 && selectedAgents.length === 0)}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Create Enhanced Veritas 2 System'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EnhancedVeritas2MultiAgentWrappingWizard;

