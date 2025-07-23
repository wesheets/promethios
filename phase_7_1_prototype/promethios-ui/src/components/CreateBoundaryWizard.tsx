/**
 * Create Boundary Wizard Component
 * 
 * A guided, step-by-step wizard for creating trust boundaries that makes
 * AI governance concepts accessible to investors and non-technical users.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Grid,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Divider
} from '@mui/material';
import {
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  People, 
  Settings, 
  CheckCircle,
  Info,
  Security,
  Handshake,
  AccountTree,
  Business
} from '@mui/icons-material';

interface Agent {
  identity?: {
    id: string;
    name: string;
    description?: string;
    status?: string;
  };
  id?: string;
  name?: string;
  type?: string;
  trust_score?: number;
  capabilities?: string[];
}

interface CreateBoundaryWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (boundaryData: any) => void;
  agents: Agent[];
}

const WIZARD_STEPS = [
  {
    id: 'introduction',
    title: 'What are Trust Boundaries?',
    description: 'Learn how AI agents collaborate safely',
    icon: Info
  },
  {
    id: 'agents',
    title: 'Choose Your Agents',
    description: 'Select which agents will collaborate',
    icon: People
  },
  {
    id: 'trust-level',
    title: 'Set Trust Level',
    description: 'Define collaboration permissions',
    icon: Shield
  },
  {
    id: 'boundary-type',
    title: 'Select Boundary Type',
    description: 'Choose the right architecture',
    icon: AccountTree
  },
  {
    id: 'policies',
    title: 'Add Policies',
    description: 'Apply compliance and security rules',
    icon: Settings
  },
  {
    id: 'review',
    title: 'Review & Deploy',
    description: 'Confirm your trust boundary',
    icon: CheckCircle
  }
];

const BOUNDARY_TYPES = [
  {
    id: 'direct',
    name: 'Direct',
    description: 'Maximum security, minimal latency',
    security: 'High',
    complexity: 'Low',
    useCase: 'Simple automation, predictive analysis',
    color: '#10b981'
  },
  {
    id: 'delegated',
    name: 'Delegated',
    description: 'Balanced security and flexibility',
    security: 'Medium',
    complexity: 'Medium',
    useCase: 'Collaboration, data sharing',
    color: '#3b82f6'
  },
  {
    id: 'transitive',
    name: 'Transitive',
    description: 'Extended trust networks',
    security: 'Low',
    complexity: 'Medium',
    useCase: 'Value chain, supply chain',
    color: '#f59e0b'
  },
  {
    id: 'federated',
    name: 'Federated',
    description: 'Cross-organizational collaboration',
    security: 'Medium',
    complexity: 'High',
    useCase: 'Cross-domain AI, industry consortium',
    color: '#8b5cf6'
  }
];

const TRUST_LEVEL_DESCRIPTIONS = {
  0: { label: 'No Access', description: 'Agent cannot interact', permissions: [] },
  25: { label: 'Basic Access', description: 'Read-only operations', permissions: ['View data', 'Basic queries'] },
  50: { label: 'Standard Access', description: 'Standard operations', permissions: ['Data access', 'Operation execution'] },
  75: { label: 'High Access', description: 'Advanced collaboration', permissions: ['Cross-agent collaboration', 'Data sharing'] },
  100: { label: 'Full Access', description: 'Complete trust', permissions: ['All operations', 'Compliance reporting', 'Administrative access'] }
};

const POLICY_TEMPLATES = [
  {
    id: 'hipaa',
    name: 'HIPAA Compliance',
    description: 'Healthcare data protection',
    icon: '🏥',
    requirements: ['Data encryption', 'Access logging', 'Audit trails']
  },
  {
    id: 'sox',
    name: 'SOX Compliance',
    description: 'Financial reporting controls',
    icon: '💰',
    requirements: ['Financial controls', 'Change management', 'Documentation']
  },
  {
    id: 'gdpr',
    name: 'GDPR Compliance',
    description: 'EU data protection',
    icon: '🇪🇺',
    requirements: ['Data minimization', 'Consent management', 'Right to deletion']
  },
  {
    id: 'custom',
    name: 'Custom Policy',
    description: 'Define your own rules',
    icon: '⚙️',
    requirements: ['Custom rules', 'Flexible configuration']
  }
];

export const CreateBoundaryWizard: React.FC<CreateBoundaryWizardProps> = ({
  open,
  onClose,
  onSubmit,
  agents: propAgents
}) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [formData, setFormData] = useState({
    sourceAgent: '',
    targetAgent: '',
    trustLevel: 80,
    boundaryType: 'direct',
    description: '',
    expiresAt: '',
    policies: [] as string[]
  });

  const currentStepData = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Load agents when wizard opens
  useEffect(() => {
    if (open && currentUser) {
      loadAvailableAgents();
    }
  }, [open, currentUser]);

  const loadAvailableAgents = async () => {
    setLoadingAgents(true);
    try {
      // Use the same agent loading logic as Trust Metrics
      const userAgentStorageService = (await import('../services/UserAgentStorageService')).userAgentStorageService;
      userAgentStorageService.setCurrentUser(currentUser!.uid);
      const loadedAgents = await userAgentStorageService.loadUserAgents();
      
      // Add the multi-agent system if not present
      const hasMultiAgent = loadedAgents.some(agent => agent.identity?.name?.includes('Multi-Agent'));
      if (!hasMultiAgent) {
        loadedAgents.push({
          identity: {
            id: 'test-multi-agent-system',
            name: 'Test Multi-Agent System',
            description: 'Test multi-agent system for boundary testing',
            status: 'active'
          }
        });
      }
      
      setAgents(loadedAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      // Fallback to prop agents if available
      setAgents(propAgents || []);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const boundaryData = {
      source_instance_id: formData.sourceAgent,
      target_instance_id: formData.targetAgent,
      trust_level: formData.trustLevel,
      boundary_type: formData.boundaryType,
      policies: formData.policies.map(policyId => ({
        policy_id: policyId,
        policy_type: 'access' as const,
        policy_config: {}
      })),
      description: formData.description,
      expires_at: formData.expiresAt || undefined
    };
    
    onSubmit(boundaryData);
    onClose();
    
    // Reset form
    setFormData({
      sourceAgent: '',
      targetAgent: '',
      trustLevel: 80,
      boundaryType: 'direct',
      description: '',
      expiresAt: '',
      policies: []
    });
    setCurrentStep(0);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Agents step
        return formData.sourceAgent && formData.targetAgent && formData.sourceAgent !== formData.targetAgent;
      case 2: // Trust level step
        return formData.trustLevel > 0;
      case 3: // Boundary type step
        return formData.boundaryType;
      default:
        return true;
    }
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => (a.identity?.id || a.id) === agentId);
    return agent?.identity?.name || agent?.name || 'Unknown Agent';
  };

  const getTrustLevelInfo = (level: number) => {
    const ranges = Object.keys(TRUST_LEVEL_DESCRIPTIONS).map(Number).sort((a, b) => a - b);
    const range = ranges.find(r => level <= r) || 100;
    return TRUST_LEVEL_DESCRIPTIONS[range as keyof typeof TRUST_LEVEL_DESCRIPTIONS];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Introduction
        return (
          <Box sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ 
                mx: 'auto', 
                width: 96, 
                height: 96, 
                backgroundColor: '#1e3a8a', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 3 
              }}>
                <AccountTree sx={{ fontSize: 48, color: '#3b82f6' }} />
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Trust Boundaries Enable Safe AI Collaboration
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0', mb: 4 }}>
                Think of trust boundaries as smart contracts for AI agents. They define how agents can safely work together while maintaining security and compliance.
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Shield sx={{ fontSize: 32, color: '#10b981', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      Security
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Automatic enforcement of security rules
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Handshake sx={{ fontSize: 32, color: '#3b82f6', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      Collaboration
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Enable safe agent-to-agent workflows
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Business sx={{ fontSize: 32, color: '#8b5cf6', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      Compliance
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Built-in regulatory compliance
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
              <AlertTitle sx={{ color: 'white' }}>Real-World Example</AlertTitle>
              A healthcare AI agent (trust level 95%) can share patient data with a diagnostic AI agent (trust level 90%) 
              through a HIPAA-compliant trust boundary, ensuring secure collaboration while maintaining audit trails.
            </Alert>
          </Box>
        );

      case 1: // Choose Agents
        return (
          <Box sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Select Collaboration Partners
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                Choose which AI agents will work together through this trust boundary.
              </Typography>
            </Box>

            {loadingAgents ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <LinearProgress sx={{ width: '100%' }} />
              </Box>
            ) : (
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    Source Agent
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    The agent that initiates collaboration
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#a0aec0' }}>Select source agent</InputLabel>
                    <Select
                      value={formData.sourceAgent}
                      onChange={(e) => setFormData({...formData, sourceAgent: e.target.value})}
                      sx={{ 
                        color: 'white', 
                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '.MuiSvgIcon-root': { color: '#a0aec0' }
                      }}
                    >
                      {agents.map((agent) => (
                        <MenuItem key={agent.identity?.id || agent.id} value={agent.identity?.id || agent.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 24, height: 24, backgroundColor: '#3b82f6' }}>
                              {(agent.identity?.name || agent.name || 'A').charAt(0)}
                            </Avatar>
                            <Typography>{agent.identity?.name || agent.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    Target Agent
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    The agent that receives collaboration requests
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#a0aec0' }}>Select target agent</InputLabel>
                    <Select
                      value={formData.targetAgent}
                      onChange={(e) => setFormData({...formData, targetAgent: e.target.value})}
                      sx={{ 
                        color: 'white', 
                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '.MuiSvgIcon-root': { color: '#a0aec0' }
                      }}
                    >
                      {agents
                        .filter(agent => (agent.identity?.id || agent.id) !== formData.sourceAgent)
                        .map((agent) => (
                        <MenuItem key={agent.identity?.id || agent.id} value={agent.identity?.id || agent.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 24, height: 24, backgroundColor: '#10b981' }}>
                              {(agent.identity?.name || agent.name || 'A').charAt(0)}
                            </Avatar>
                            <Typography>{agent.identity?.name || agent.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {agents.length === 0 && !loadingAgents && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <AlertTitle>No Agents Available</AlertTitle>
                No agents are currently deployed. Please deploy some agents first before creating trust boundaries.
              </Alert>
            )}
          </Box>
        );

      case 2: // Trust Level
        const trustInfo = getTrustLevelInfo(formData.trustLevel);
        return (
          <Box sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Set Trust Level
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                Define how much the source agent trusts the target agent.
              </Typography>
            </Box>

            <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h3" sx={{ color: '#3b82f6', fontWeight: 'bold', mb: 1 }}>
                    {formData.trustLevel}%
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    {trustInfo.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    {trustInfo.description}
                  </Typography>
                </Box>

                <Slider
                  value={formData.trustLevel}
                  onChange={(_, value) => setFormData({...formData, trustLevel: value as number})}
                  min={0}
                  max={100}
                  step={5}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' }
                  ]}
                  sx={{ 
                    color: '#3b82f6',
                    '& .MuiSlider-markLabel': { color: '#a0aec0' }
                  }}
                />

                {trustInfo.permissions.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
                      Permissions at this level:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {trustInfo.permissions.map((permission, index) => (
                        <Chip 
                          key={index} 
                          label={permission} 
                          size="small" 
                          sx={{ backgroundColor: '#2d3748', color: 'white' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
              <AlertTitle sx={{ color: 'white' }}>Trust Level Guide</AlertTitle>
              Higher trust levels grant more permissions but require stronger security guarantees. 
              Most business applications work well with 70-85% trust levels.
            </Alert>
          </Box>
        );

      case 3: // Boundary Type
        return (
          <Box sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Select Boundary Type
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                Choose the architecture that best fits your collaboration needs.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {BOUNDARY_TYPES.map((type) => (
                <Grid item xs={12} md={6} key={type.id}>
                  <Card 
                    sx={{ 
                      backgroundColor: formData.boundaryType === type.id ? '#2d3748' : '#1a202c',
                      border: formData.boundaryType === type.id ? `2px solid ${type.color}` : '1px solid #4a5568',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: type.color },
                      height: '100%'
                    }}
                    onClick={() => setFormData({...formData, boundaryType: type.id})}
                  >
                    <CardHeader>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {type.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {type.description}
                      </Typography>
                    </CardHeader>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Chip 
                          label={`Security: ${type.security}`} 
                          size="small" 
                          sx={{ backgroundColor: '#2d3748', color: 'white' }}
                        />
                        <Chip 
                          label={`Complexity: ${type.complexity}`} 
                          size="small" 
                          sx={{ backgroundColor: '#2d3748', color: 'white' }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        <strong>Use case:</strong> {type.useCase}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 4: // Policies
        return (
          <Box sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Apply Compliance Policies
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                Add industry-specific compliance and security policies.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {POLICY_TEMPLATES.map((policy) => (
                <Grid item xs={12} md={6} key={policy.id}>
                  <Card 
                    sx={{ 
                      backgroundColor: formData.policies.includes(policy.id) ? '#2d3748' : '#1a202c',
                      border: formData.policies.includes(policy.id) ? '2px solid #3b82f6' : '1px solid #4a5568',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#3b82f6' },
                      height: '100%'
                    }}
                    onClick={() => {
                      const newPolicies = formData.policies.includes(policy.id)
                        ? formData.policies.filter(p => p !== policy.id)
                        : [...formData.policies, policy.id];
                      setFormData({...formData, policies: newPolicies});
                    }}
                  >
                    <CardHeader>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4">{policy.icon}</Typography>
                        <Box>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {policy.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {policy.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardHeader>
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {policy.requirements.map((req, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 6, height: 6, backgroundColor: '#a0aec0', borderRadius: '50%' }} />
                            <Typography variant="body2" sx={{ color: '#a0aec0' }}>{req}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 5: // Review
        return (
          <Box sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Review & Deploy
              </Typography>
              <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                Confirm your trust boundary configuration before deployment.
              </Typography>
            </Box>

            <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 3 }}>
              <CardHeader>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Trust Relationship
                </Typography>
              </CardHeader>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: '#3b82f6', mx: 'auto', mb: 1 }}>
                      {getAgentName(formData.sourceAgent).charAt(0)}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {getAgentName(formData.sourceAgent)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Source Agent
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 32, height: 2, backgroundColor: '#4a5568' }} />
                    <Box sx={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: '50%' }} />
                    <Box sx={{ width: 32, height: 2, backgroundColor: '#4a5568' }} />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: '#10b981', mx: 'auto', mb: 1 }}>
                      {getAgentName(formData.targetAgent).charAt(0)}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {getAgentName(formData.targetAgent)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Target Agent
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardHeader>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Trust Configuration
                    </Typography>
                  </CardHeader>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#a0aec0' }}>Trust Level:</Typography>
                        <Chip label={`${formData.trustLevel}%`} color="primary" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#a0aec0' }}>Boundary Type:</Typography>
                        <Chip 
                          label={BOUNDARY_TYPES.find(t => t.id === formData.boundaryType)?.name} 
                          variant="outlined" 
                          size="small"
                          sx={{ color: 'white', borderColor: '#4a5568' }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardHeader>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Policies Applied
                    </Typography>
                  </CardHeader>
                  <CardContent>
                    {formData.policies.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {formData.policies.map((policyId) => {
                          const policy = POLICY_TEMPLATES.find(p => p.id === policyId);
                          return (
                            <Box key={policyId} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6">{policy?.icon}</Typography>
                              <Typography variant="body2" sx={{ color: 'white' }}>{policy?.name}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        No policies selected
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 3, backgroundColor: '#065f46', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <CheckCircle sx={{ color: '#10b981' }} />
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Ready to Deploy
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#a7f3d0' }}>
                Your trust boundary is configured and ready to enable secure collaboration between the selected agents.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { 
          backgroundColor: '#1a202c', 
          color: 'white',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', borderBottom: '1px solid #4a5568', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <currentStepData.icon sx={{ color: '#3b82f6' }} />
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              {currentStepData.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              {currentStepData.description}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            backgroundColor: '#4a5568',
            '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' }
          }} 
        />
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        <Box sx={{ p: 3 }}>
          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #4a5568', p: 3 }}>
        <Button
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          startIcon={<ChevronLeft />}
          sx={{ color: '#a0aec0', borderColor: '#4a5568' }}
        >
          Previous
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button 
          variant="outlined" 
          onClick={onClose}
          sx={{ color: '#a0aec0', borderColor: '#4a5568', mr: 2 }}
        >
          Cancel
        </Button>
        
        {currentStep === WIZARD_STEPS.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Create Boundary
          </Button>
        ) : (
          <Button 
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed()}
            endIcon={<ChevronRight />}
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateBoundaryWizard;

