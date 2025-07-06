import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Badge,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Code as CodeIcon,
  Business as BusinessIcon,
  CloudUpload as DeployIcon,
  Science as TestIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  Groups as GroupsIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { DualAgentWrapperRegistry } from '../services/DualAgentWrapperRegistry';
import { DualWrapperStorageService } from '../services/DualWrapperStorageService';
import { CreateDualWrapperRequest, DualAgentWrapper } from '../types/dualWrapper';

const steps = [
  'Agent Configuration',
  'Governance Setup', 
  'Enhanced Veritas 2'
];

// Enhanced Veritas 2 Configuration Interface
interface EnhancedVeritas2Config {
  enabled: boolean;
  emotionalIntelligence: {
    enabled: boolean;
    sentimentTracking: boolean;
    empathyMonitoring: boolean;
    stressDetection: boolean;
    moodAnalysis: boolean;
  };
  quantumUncertainty: {
    enabled: boolean;
    epistemicAnalysis: boolean;
    aleatoricAnalysis: boolean;
    confidenceTracking: boolean;
    contextualAnalysis: boolean;
    temporalAnalysis: boolean;
    socialAnalysis: boolean;
  };
  hitlCollaboration: {
    enabled: boolean;
    expertTypes: string[];
    uncertaintyThreshold: number;
    autoEscalation: boolean;
    collaborationTimeout: number;
  };
  realTimeAnalytics: {
    enabled: boolean;
    performanceTracking: boolean;
    behaviorAnalysis: boolean;
    predictiveModeling: boolean;
    alerting: boolean;
  };
}

export interface EnhancedVeritas2WizardFormData {
  // Step 1: Agent Configuration
  agentName: string;
  description: string;
  apiEndpoint: string;
  apiKey: string;
  provider: string;
  
  // Step 2: Governance Setup
  governanceLevel: 'basic' | 'standard' | 'advanced';
  enableContentFiltering: boolean;
  enableBehaviorConstraints: boolean;
  enableOutputValidation: boolean;
  trustThreshold: number;
  
  // Step 3: Enhanced Veritas 2
  enhancedVeritas2: EnhancedVeritas2Config;
  enableDualDeployment: boolean;
  testingEnvironment: string;
  deploymentEnvironment: string;
  autoPromote: boolean;
}

interface EnhancedVeritas2AgentWrappingWizardProps {
  onComplete?: (wrapper: DualAgentWrapper) => void;
  onCancel?: () => void;
}

const EnhancedVeritas2AgentWrappingWizard: React.FC<EnhancedVeritas2AgentWrappingWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnhancedVeritas2WizardFormData>({
    agentName: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    provider: 'OpenAI',
    governanceLevel: 'standard',
    enableContentFiltering: true,
    enableBehaviorConstraints: true,
    enableOutputValidation: true,
    trustThreshold: 75,
    enhancedVeritas2: {
      enabled: true,
      emotionalIntelligence: {
        enabled: true,
        sentimentTracking: true,
        empathyMonitoring: true,
        stressDetection: true,
        moodAnalysis: true,
      },
      quantumUncertainty: {
        enabled: true,
        epistemicAnalysis: true,
        aleatoricAnalysis: true,
        confidenceTracking: true,
        contextualAnalysis: true,
        temporalAnalysis: false,
        socialAnalysis: true,
      },
      hitlCollaboration: {
        enabled: true,
        expertTypes: ['Technical Specialist', 'Domain Expert', 'Ethical Advisor'],
        uncertaintyThreshold: 70,
        autoEscalation: true,
        collaborationTimeout: 30,
      },
      realTimeAnalytics: {
        enabled: true,
        performanceTracking: true,
        behaviorAnalysis: true,
        predictiveModeling: false,
        alerting: true,
      },
    },
    enableDualDeployment: true,
    testingEnvironment: 'sandbox',
    deploymentEnvironment: 'production',
    autoPromote: false,
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const [dualRegistry, setDualRegistry] = useState<DualAgentWrapperRegistry | null>(null);

  useEffect(() => {
    // Initialize dual registry
    const initRegistry = async () => {
      try {
        const storage = new DualWrapperStorageService();
        const registry = new DualAgentWrapperRegistry(storage);
        if (user?.uid) {
          registry.setCurrentUser(user.uid);
        }
        setDualRegistry(registry);
      } catch (err) {
        console.error('Failed to initialize dual registry:', err);
        setError('Failed to initialize dual deployment system');
      }
    };

    initRegistry();
  }, [user]);

  const updateFormData = (updates: Partial<EnhancedVeritas2WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateEnhancedVeritas2Config = (updates: Partial<EnhancedVeritas2Config>) => {
    setFormData(prev => ({
      ...prev,
      enhancedVeritas2: { ...prev.enhancedVeritas2, ...updates }
    }));
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
    if (!dualRegistry || !user) {
      setError('Dual deployment system not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateDualWrapperRequest = {
        baseAgent: {
          name: formData.agentName,
          description: formData.description,
          endpoint: formData.apiEndpoint,
          provider: formData.provider,
          capabilities: [], // Will be auto-discovered
        },
        governanceConfig: {
          level: formData.governanceLevel,
          policies: [
            ...(formData.enableContentFiltering ? [{
              id: 'content-filter',
              name: 'Content Filtering',
              description: 'Filter inappropriate content',
              type: 'content_filter' as const,
              rules: [],
              severity: 'medium' as const,
              enabled: true,
            }] : []),
            ...(formData.enableBehaviorConstraints ? [{
              id: 'behavior-constraints',
              name: 'Behavior Constraints',
              description: 'Constrain agent behavior',
              type: 'behavior_constraint' as const,
              rules: [],
              severity: 'high' as const,
              enabled: true,
            }] : []),
            ...(formData.enableOutputValidation ? [{
              id: 'output-validation',
              name: 'Output Validation',
              description: 'Validate agent outputs',
              type: 'output_validation' as const,
              rules: [],
              severity: 'medium' as const,
              enabled: true,
            }] : []),
          ],
          trustConfig: {
            initialScore: formData.trustThreshold,
            minimumThreshold: 50,
            decayRate: 0.1,
            recoveryRate: 0.05,
            factors: [],
            evaluationInterval: 60,
          },
          auditConfig: {
            enabled: true,
            logLevel: 'info',
            retentionDays: 30,
            includePayloads: false,
          },
          // Enhanced Veritas 2 Configuration
          enhancedVeritas2: formData.enhancedVeritas2,
        },
        deploymentConfig: {
          testingEnvironment: formData.testingEnvironment,
          deploymentEnvironment: formData.deploymentEnvironment,
          autoPromote: formData.autoPromote,
          enableMonitoring: true,
          enhancedVeritas2Enabled: formData.enhancedVeritas2.enabled,
        },
        metadata: {
          description: formData.description,
          tags: ['enhanced', 'dual-deployment', 'veritas-2'],
        },
      };

      const dualWrapper = await dualRegistry.createDualWrapper(request);
      
      if (onComplete) {
        onComplete(dualWrapper);
      } else {
        navigate('/agent-wrapping', { 
          state: { 
            success: true, 
            wrapperId: dualWrapper.id,
            message: 'Agent successfully wrapped with Enhanced Veritas 2!' 
          } 
        });
      }
    } catch (err) {
      console.error('Failed to create Enhanced Veritas 2 wrapper:', err);
      setError(err instanceof Error ? err.message : 'Failed to create Enhanced Veritas 2 wrapper');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderAgentConfiguration();
      case 1:
        return renderGovernanceSetup();
      case 2:
        return renderEnhancedVeritas2();
      default:
        return null;
    }
  };

  const renderAgentConfiguration = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AgentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Agent Configuration</Typography>
          <Chip 
            icon={<AutoAwesomeIcon />} 
            label="Enhanced Veritas 2" 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure your AI agent with auto-discovery and Enhanced Veritas 2 emotional intelligence
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🧠 <strong>Enhanced Veritas 2 Ready</strong><br />
            Your agent will be equipped with advanced emotional intelligence, quantum uncertainty analysis, and human-in-the-loop collaboration capabilities.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Agent Name</InputLabel>
              <Select
                value={formData.agentName}
                onChange={(e) => updateFormData({ agentName: e.target.value })}
                label="Agent Name"
              >
                <MenuItem value="Customer Support Bot">Customer Support Bot</MenuItem>
                <MenuItem value="Content Generator">Content Generator</MenuItem>
                <MenuItem value="Data Analyst">Data Analyst</MenuItem>
                <MenuItem value="Code Assistant">Code Assistant</MenuItem>
                <MenuItem value="Custom Agent">Custom Agent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Provider</InputLabel>
              <Select
                value={formData.provider}
                onChange={(e) => updateFormData({ provider: e.target.value })}
                label="Provider"
              >
                <MenuItem value="OpenAI">OpenAI</MenuItem>
                <MenuItem value="Anthropic">Anthropic</MenuItem>
                <MenuItem value="Google">Google</MenuItem>
                <MenuItem value="Azure">Azure OpenAI</MenuItem>
                <MenuItem value="Custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Description</InputLabel>
              <Select
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                label="Description"
              >
                <MenuItem value="AI assistant for customer support with emotional intelligence">Customer Support Assistant</MenuItem>
                <MenuItem value="Content creation with empathy and sentiment awareness">Content Creation Assistant</MenuItem>
                <MenuItem value="Data analysis with uncertainty quantification">Data Analysis Assistant</MenuItem>
                <MenuItem value="Code review with collaborative human expertise">Development Assistant</MenuItem>
                <MenuItem value="Custom AI agent with Enhanced Veritas 2 capabilities">Custom Assistant</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>API Endpoint</InputLabel>
              <Select
                value={formData.apiEndpoint}
                onChange={(e) => updateFormData({ apiEndpoint: e.target.value })}
                label="API Endpoint"
              >
                <MenuItem value="https://api.openai.com/v1/chat/completions">OpenAI Chat Completions</MenuItem>
                <MenuItem value="https://api.anthropic.com/v1/messages">Anthropic Messages</MenuItem>
                <MenuItem value="https://generativelanguage.googleapis.com/v1/models">Google Generative AI</MenuItem>
                <MenuItem value="custom">Custom Endpoint</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>API Key</InputLabel>
              <Select
                value={formData.apiKey}
                onChange={(e) => updateFormData({ apiKey: e.target.value })}
                label="API Key"
              >
                <MenuItem value="sk-test-key">Test API Key</MenuItem>
                <MenuItem value="sk-prod-key">Production API Key</MenuItem>
                <MenuItem value="custom">Enter Custom Key</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            🔒 Your API credentials are securely stored and Enhanced Veritas 2 will monitor emotional intelligence metrics automatically.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderGovernanceSetup = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <GovernanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">Governance Setup</Typography>
          <Badge badgeContent="Enhanced" color="secondary">
            <Chip label="Veritas 2" size="small" color="primary" sx={{ ml: 2 }} />
          </Badge>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure governance controls with Enhanced Veritas 2 emotional intelligence integration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Governance Level</InputLabel>
              <Select
                value={formData.governanceLevel}
                onChange={(e) => updateFormData({ governanceLevel: e.target.value as any })}
                label="Governance Level"
              >
                <MenuItem value="basic">Basic - Essential controls + Emotional monitoring</MenuItem>
                <MenuItem value="standard">Standard - Recommended controls + Uncertainty analysis</MenuItem>
                <MenuItem value="advanced">Advanced - Maximum security + HITL collaboration</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Trust Threshold: {formData.trustThreshold}%</Typography>
            <Slider
              value={formData.trustThreshold}
              onChange={(_, value) => updateFormData({ trustThreshold: value as number })}
              min={0}
              max={100}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              Enhanced Veritas 2 will adjust this dynamically based on emotional intelligence metrics
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Policy Controls</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableContentFiltering}
                      onChange={(e) => updateFormData({ enableContentFiltering: e.target.checked })}
                    />
                  }
                  label="Content Filtering"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  With sentiment analysis
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableBehaviorConstraints}
                      onChange={(e) => updateFormData({ enableBehaviorConstraints: e.target.checked })}
                    />
                  }
                  label="Behavior Constraints"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  With empathy monitoring
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableOutputValidation}
                      onChange={(e) => updateFormData({ enableOutputValidation: e.target.checked })}
                    />
                  }
                  label="Output Validation"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  With uncertainty quantification
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            🧠 Enhanced Veritas 2 will automatically enhance these governance controls with emotional intelligence and uncertainty analysis.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderEnhancedVeritas2 = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} color="primary" />
          <Typography variant="h6">Enhanced Veritas 2 Configuration</Typography>
          <Chip label="BETA" size="small" color="warning" sx={{ ml: 2 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure advanced emotional intelligence, uncertainty analysis, and human collaboration features
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🚀 <strong>Enhanced Veritas 2 Active</strong><br />
            Advanced emotional intelligence and trust management will be automatically deployed to both testing and production environments.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enhancedVeritas2.enabled}
                  onChange={(e) => updateEnhancedVeritas2Config({ enabled: e.target.checked })}
                />
              }
              label="Enable Enhanced Veritas 2"
            />
          </Grid>

          {formData.enhancedVeritas2.enabled && (
            <>
              {/* Emotional Intelligence Section */}
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center">
                      <PsychologyIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Emotional Intelligence</Typography>
                      <Chip 
                        label={`${Object.values(formData.enhancedVeritas2.emotionalIntelligence).filter(Boolean).length - 1}/4 Features`} 
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
                              checked={formData.enhancedVeritas2.emotionalIntelligence.sentimentTracking}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                emotionalIntelligence: {
                                  ...formData.enhancedVeritas2.emotionalIntelligence,
                                  sentimentTracking: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Sentiment Tracking"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Monitor emotional tone and sentiment in real-time
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.emotionalIntelligence.empathyMonitoring}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                emotionalIntelligence: {
                                  ...formData.enhancedVeritas2.emotionalIntelligence,
                                  empathyMonitoring: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Empathy Monitoring"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Track empathetic responses and emotional understanding
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.emotionalIntelligence.stressDetection}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                emotionalIntelligence: {
                                  ...formData.enhancedVeritas2.emotionalIntelligence,
                                  stressDetection: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Stress Detection"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Identify stress indicators and emotional overload
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.emotionalIntelligence.moodAnalysis}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                emotionalIntelligence: {
                                  ...formData.enhancedVeritas2.emotionalIntelligence,
                                  moodAnalysis: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Mood Analysis"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Analyze mood patterns and emotional stability
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Quantum Uncertainty Section */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center">
                      <TestIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Quantum Uncertainty Analysis</Typography>
                      <Chip 
                        label={`${Object.values(formData.enhancedVeritas2.quantumUncertainty).filter(Boolean).length - 1}/6 Features`} 
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
                              checked={formData.enhancedVeritas2.quantumUncertainty.epistemicAnalysis}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                quantumUncertainty: {
                                  ...formData.enhancedVeritas2.quantumUncertainty,
                                  epistemicAnalysis: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Epistemic Analysis"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Knowledge-based uncertainty measurement
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.quantumUncertainty.aleatoricAnalysis}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                quantumUncertainty: {
                                  ...formData.enhancedVeritas2.quantumUncertainty,
                                  aleatoricAnalysis: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Aleatoric Analysis"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Inherent randomness and variability analysis
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.quantumUncertainty.confidenceTracking}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                quantumUncertainty: {
                                  ...formData.enhancedVeritas2.quantumUncertainty,
                                  confidenceTracking: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Confidence Tracking"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Real-time confidence level monitoring
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.quantumUncertainty.contextualAnalysis}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                quantumUncertainty: {
                                  ...formData.enhancedVeritas2.quantumUncertainty,
                                  contextualAnalysis: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Contextual Analysis"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Context-dependent uncertainty evaluation
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.quantumUncertainty.socialAnalysis}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                quantumUncertainty: {
                                  ...formData.enhancedVeritas2.quantumUncertainty,
                                  socialAnalysis: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Social Analysis"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Social interaction uncertainty measurement
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* HITL Collaboration Section */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center">
                      <GroupsIcon color="info" sx={{ mr: 1 }} />
                      <Typography variant="h6">Human-in-the-Loop Collaboration</Typography>
                      <Badge badgeContent={formData.enhancedVeritas2.hitlCollaboration.expertTypes.length} color="info">
                        <Chip label="Experts" size="small" color="info" sx={{ ml: 2 }} />
                      </Badge>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.hitlCollaboration.enabled}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                hitlCollaboration: {
                                  ...formData.enhancedVeritas2.hitlCollaboration,
                                  enabled: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Enable HITL Collaboration"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Uncertainty Threshold: {formData.enhancedVeritas2.hitlCollaboration.uncertaintyThreshold}%
                        </Typography>
                        <Slider
                          value={formData.enhancedVeritas2.hitlCollaboration.uncertaintyThreshold}
                          onChange={(_, value) => updateEnhancedVeritas2Config({
                            hitlCollaboration: {
                              ...formData.enhancedVeritas2.hitlCollaboration,
                              uncertaintyThreshold: value as number
                            }
                          })}
                          min={0}
                          max={100}
                          marks={[
                            { value: 0, label: '0%' },
                            { value: 50, label: '50%' },
                            { value: 100, label: '100%' }
                          ]}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Trigger collaboration when uncertainty exceeds this threshold
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.hitlCollaboration.autoEscalation}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                hitlCollaboration: {
                                  ...formData.enhancedVeritas2.hitlCollaboration,
                                  autoEscalation: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Auto-escalation"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Automatically escalate to human experts when needed
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Real-Time Analytics Section */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center">
                      <AnalyticsIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6">Real-Time Analytics</Typography>
                      <Chip 
                        label={`${Object.values(formData.enhancedVeritas2.realTimeAnalytics).filter(Boolean).length - 1}/4 Features`} 
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
                              checked={formData.enhancedVeritas2.realTimeAnalytics.performanceTracking}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                realTimeAnalytics: {
                                  ...formData.enhancedVeritas2.realTimeAnalytics,
                                  performanceTracking: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Performance Tracking"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Monitor agent performance metrics in real-time
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.realTimeAnalytics.behaviorAnalysis}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                realTimeAnalytics: {
                                  ...formData.enhancedVeritas2.realTimeAnalytics,
                                  behaviorAnalysis: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Behavior Analysis"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Analyze behavioral patterns and trends
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.enhancedVeritas2.realTimeAnalytics.alerting}
                              onChange={(e) => updateEnhancedVeritas2Config({
                                realTimeAnalytics: {
                                  ...formData.enhancedVeritas2.realTimeAnalytics,
                                  alerting: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Real-Time Alerting"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Receive alerts for anomalies and issues
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Dual Deployment Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  <DeployIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dual Deployment Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <TestIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">Testing Environment</Typography>
                        </Box>
                        <FormControl fullWidth>
                          <InputLabel>Environment</InputLabel>
                          <Select
                            value={formData.testingEnvironment}
                            onChange={(e) => updateFormData({ testingEnvironment: e.target.value })}
                            label="Environment"
                          >
                            <MenuItem value="sandbox">Sandbox</MenuItem>
                            <MenuItem value="staging">Staging</MenuItem>
                            <MenuItem value="development">Development</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Test Enhanced Veritas 2 features safely
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                          <Typography variant="h6">Production Environment</Typography>
                        </Box>
                        <FormControl fullWidth>
                          <InputLabel>Environment</InputLabel>
                          <Select
                            value={formData.deploymentEnvironment}
                            onChange={(e) => updateFormData({ deploymentEnvironment: e.target.value })}
                            label="Environment"
                          >
                            <MenuItem value="production">Production</MenuItem>
                            <MenuItem value="live">Live</MenuItem>
                            <MenuItem value="enterprise">Enterprise</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Deploy Enhanced Veritas 2 to production
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <AutoAwesomeIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" gutterBottom align="center">
            Enhanced Veritas 2 Agent Wizard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Create governed AI agents with advanced emotional intelligence and dual deployment
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                {label}
                {index === 2 && formData.enhancedVeritas2.enabled && (
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
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Create Enhanced Veritas 2 Agent'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EnhancedVeritas2AgentWrappingWizard;

