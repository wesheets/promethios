/**
 * Chatbot Builder Interface
 * 
 * Visual chatbot creation and customization interface that allows users to:
 * - Create new chatbots with governance oversight
 * - Customize personality, tone, and behavior
 * - Configure response templates and flows
 * - Set up brand customization (colors, logo, messaging)
 * - Connect to existing wrapped agents
 * - Deploy across multiple channels
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Switch,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  CloudUpload as DeployIcon,
  SmartToy as BotIcon,
  Palette as BrandIcon,
  Psychology as PersonalityIcon,
  Chat as ResponseIcon,
  Settings as ConfigIcon,
  Security as GovernanceIcon,
  ExpandMore as ExpandIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  Code as EmbedIcon,
  Phone as VoiceIcon,
  Email as EmailIcon,
  Facebook as SocialIcon,
  Language as WebIcon,
  PhoneAndroid as MobileIcon,
  Tune as CustomizeIcon,
  AutoAwesome as AIIcon,
  School as TrainingIcon,
  Storage as KnowledgeIcon,
  Speed as PerformanceIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

interface ChatbotConfig {
  // Basic Info
  id?: string;
  name: string;
  description: string;
  avatar?: string;
  
  // Personality & Behavior
  personality: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'enthusiastic';
    style: 'concise' | 'detailed' | 'conversational' | 'technical';
    empathy_level: number; // 1-10
    humor_level: number; // 1-10
    formality_level: number; // 1-10
  };
  
  // Response Configuration
  responses: {
    greeting_message: string;
    fallback_message: string;
    escalation_message: string;
    goodbye_message: string;
    max_response_length: number;
    response_delay: number; // milliseconds
  };
  
  // Brand Customization
  branding: {
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
    company_name: string;
    widget_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    widget_size: 'small' | 'medium' | 'large';
  };
  
  // Governance & Compliance
  governance: {
    agent_id?: string; // Connected wrapped agent
    trust_threshold: number;
    content_filtering: boolean;
    data_retention_days: number;
    compliance_mode: 'basic' | 'healthcare' | 'finance' | 'education';
  };
  
  // Knowledge & Training
  knowledge: {
    knowledge_base_ids: string[];
    rag_enabled: boolean;
    fine_tuned_model?: string;
    training_data_sources: string[];
  };
  
  // Deployment Channels
  deployment: {
    web_widget: boolean;
    voice_enabled: boolean;
    email_integration: boolean;
    social_media: string[];
    mobile_app: boolean;
    api_access: boolean;
  };
  
  // Analytics & Monitoring
  analytics: {
    conversation_tracking: boolean;
    performance_monitoring: boolean;
    user_satisfaction_surveys: boolean;
    a_b_testing: boolean;
  };
}

interface BuilderStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const builderSteps: BuilderStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Name, description, and avatar for your chatbot',
    completed: false,
    required: true
  },
  {
    id: 'personality',
    title: 'Personality & Behavior',
    description: 'Define how your chatbot communicates and behaves',
    completed: false,
    required: true
  },
  {
    id: 'responses',
    title: 'Response Templates',
    description: 'Configure greeting, fallback, and escalation messages',
    completed: false,
    required: true
  },
  {
    id: 'governance',
    title: 'Governance & Compliance',
    description: 'Connect to wrapped agent and set compliance rules',
    completed: false,
    required: true
  },
  {
    id: 'knowledge',
    title: 'Knowledge & Training',
    description: 'Add knowledge bases and training data',
    completed: false,
    required: false
  },
  {
    id: 'branding',
    title: 'Brand Customization',
    description: 'Colors, logo, and visual appearance',
    completed: false,
    required: false
  },
  {
    id: 'deployment',
    title: 'Deployment Channels',
    description: 'Choose where your chatbot will be available',
    completed: false,
    required: true
  },
  {
    id: 'analytics',
    title: 'Analytics & Monitoring',
    description: 'Set up tracking and performance monitoring',
    completed: false,
    required: false
  }
];

const personalityTones = [
  { value: 'professional', label: 'Professional', description: 'Business-focused and formal' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
  { value: 'formal', label: 'Formal', description: 'Structured and official' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and positive' }
];

const responseStyles = [
  { value: 'concise', label: 'Concise', description: 'Short and to the point' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' },
  { value: 'conversational', label: 'Conversational', description: 'Natural dialogue style' },
  { value: 'technical', label: 'Technical', description: 'Precise and technical' }
];

const complianceModes = [
  { value: 'basic', label: 'Basic', description: 'Standard content filtering' },
  { value: 'healthcare', label: 'Healthcare (HIPAA)', description: 'Healthcare compliance' },
  { value: 'finance', label: 'Finance (SOX)', description: 'Financial regulations' },
  { value: 'education', label: 'Education (FERPA)', description: 'Educational privacy' }
];

const ChatbotBuilder: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<ChatbotConfig>({
    name: '',
    description: '',
    personality: {
      tone: 'professional',
      style: 'conversational',
      empathy_level: 7,
      humor_level: 3,
      formality_level: 6
    },
    responses: {
      greeting_message: 'Hello! How can I help you today?',
      fallback_message: "I'm sorry, I don't understand. Could you please rephrase that?",
      escalation_message: 'Let me connect you with a human agent who can better assist you.',
      goodbye_message: 'Thank you for chatting with me. Have a great day!',
      max_response_length: 500,
      response_delay: 1000
    },
    branding: {
      primary_color: '#1976d2',
      secondary_color: '#f5f5f5',
      company_name: '',
      widget_position: 'bottom-right',
      widget_size: 'medium'
    },
    governance: {
      trust_threshold: 0.8,
      content_filtering: true,
      data_retention_days: 90,
      compliance_mode: 'basic'
    },
    knowledge: {
      knowledge_base_ids: [],
      rag_enabled: false,
      training_data_sources: []
    },
    deployment: {
      web_widget: true,
      voice_enabled: false,
      email_integration: false,
      social_media: [],
      mobile_app: false,
      api_access: true
    },
    analytics: {
      conversation_tracking: true,
      performance_monitoring: true,
      user_satisfaction_surveys: false,
      a_b_testing: false
    }
  });
  
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    // Load available wrapped agents
    loadAvailableAgents();
    // Load available knowledge bases
    loadAvailableKnowledgeBases();
  }, []);

  const loadAvailableAgents = async () => {
    try {
      // TODO: Replace with actual API call
      const mockAgents = [
        { id: 'agent-1', name: 'Customer Support Agent', type: 'support', status: 'active' },
        { id: 'agent-2', name: 'Sales Assistant', type: 'sales', status: 'active' },
        { id: 'agent-3', name: 'Technical Support', type: 'technical', status: 'active' }
      ];
      setAvailableAgents(mockAgents);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadAvailableKnowledgeBases = async () => {
    try {
      // TODO: Replace with actual API call
      const mockKnowledgeBases = [
        { id: 'kb-1', name: 'Product Documentation', documents: 45, status: 'ready' },
        { id: 'kb-2', name: 'FAQ Database', documents: 120, status: 'ready' },
        { id: 'kb-3', name: 'Company Policies', documents: 23, status: 'processing' }
      ];
      setAvailableKnowledgeBases(mockKnowledgeBases);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  };

  const updateConfig = (updates: Partial<ChatbotConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateNestedConfig = (section: keyof ChatbotConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('🤖 [Chatbot Builder] Saving chatbot with governance integration');
      
      // Step 1: Create governance identity for the chatbot
      const governanceIdentity = await createGovernanceIdentity(config);
      
      // Step 2: Save chatbot configuration with governance metadata
      const chatbotData = {
        ...config,
        governance_identity_id: governanceIdentity.id,
        governance_config: {
          enabled: true,
          trust_threshold: config.governance?.trustThreshold || 0.7,
          compliance_mode: config.governance?.complianceMode || 'basic',
          policy_enforcement_level: config.governance?.policyEnforcementLevel || 'moderate',
          audit_logging: true,
          real_time_monitoring: true
        },
        created_at: new Date().toISOString(),
        status: 'draft'
      };
      
      // TODO: Replace with actual API call
      console.log('💾 [Chatbot Builder] Saving chatbot config:', chatbotData);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      console.log('✅ [Chatbot Builder] Chatbot saved with governance identity:', governanceIdentity.id);
    } catch (error) {
      console.error('❌ [Chatbot Builder] Failed to save chatbot:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      console.log('🚀 [Chatbot Builder] Deploying chatbot with governance oversight');
      
      // Step 1: Validate governance configuration
      const governanceValidation = await validateGovernanceConfig(config);
      if (!governanceValidation.valid) {
        throw new Error(`Governance validation failed: ${governanceValidation.errors.join(', ')}`);
      }
      
      // Step 2: Register chatbot with Universal Governance Adapter
      const governanceRegistration = await registerChatbotWithGovernance(config);
      
      // Step 3: Deploy chatbot with governance monitoring
      const deploymentData = {
        ...config,
        governance_identity_id: governanceRegistration.governance_identity_id,
        deployment_config: {
          channels: config.deployment?.channels || ['web'],
          monitoring_enabled: true,
          governance_alerts: true,
          trust_score_tracking: true,
          policy_enforcement: true
        },
        deployed_at: new Date().toISOString(),
        status: 'deployed'
      };
      
      // TODO: Replace with actual deployment API call
      console.log('🌐 [Chatbot Builder] Deploying chatbot:', deploymentData);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate deployment
      
      console.log('✅ [Chatbot Builder] Chatbot deployed with governance oversight');
    } catch (error) {
      console.error('❌ [Chatbot Builder] Failed to deploy chatbot:', error);
    } finally {
      setDeploying(false);
    }
  };

  // Governance integration helper functions
  const createGovernanceIdentity = async (chatbotConfig: any) => {
    try {
      console.log('🛡️ [Governance] Creating governance identity for chatbot');
      
      // TODO: Replace with actual Universal Governance Adapter call
      const governanceIdentity = {
        id: `governance_${Date.now()}`,
        agent_id: chatbotConfig.name?.toLowerCase().replace(/\s+/g, '_') || 'chatbot',
        agent_type: 'chat_agent',
        governance_level: 'standard',
        trust_threshold: chatbotConfig.governance?.trustThreshold || 0.7,
        compliance_mode: chatbotConfig.governance?.complianceMode || 'basic',
        policies: chatbotConfig.governance?.policies || [],
        created_at: new Date().toISOString()
      };
      
      console.log('✅ [Governance] Governance identity created:', governanceIdentity.id);
      return governanceIdentity;
    } catch (error) {
      console.error('❌ [Governance] Failed to create governance identity:', error);
      throw error;
    }
  };

  const validateGovernanceConfig = async (chatbotConfig: any) => {
    try {
      console.log('🔍 [Governance] Validating governance configuration');
      
      const errors = [];
      
      // Validate trust threshold
      if (!chatbotConfig.governance?.trustThreshold || chatbotConfig.governance.trustThreshold < 0.1) {
        errors.push('Trust threshold must be at least 0.1');
      }
      
      // Validate compliance mode
      const validComplianceModes = ['basic', 'healthcare', 'finance', 'education'];
      if (!validComplianceModes.includes(chatbotConfig.governance?.complianceMode)) {
        errors.push('Invalid compliance mode');
      }
      
      // Validate agent connection
      if (!chatbotConfig.governance?.selectedAgent) {
        errors.push('Must select a wrapped agent for governance oversight');
      }
      
      const validation = {
        valid: errors.length === 0,
        errors
      };
      
      console.log('🔍 [Governance] Validation result:', validation);
      return validation;
    } catch (error) {
      console.error('❌ [Governance] Validation failed:', error);
      return { valid: false, errors: ['Validation process failed'] };
    }
  };

  const registerChatbotWithGovernance = async (chatbotConfig: any) => {
    try {
      console.log('📝 [Governance] Registering chatbot with Universal Governance Adapter');
      
      // TODO: Replace with actual Universal Governance Adapter registration
      const registration = {
        governance_identity_id: `governance_${Date.now()}`,
        agent_id: chatbotConfig.governance?.selectedAgent || 'default_agent',
        chatbot_id: chatbotConfig.name?.toLowerCase().replace(/\s+/g, '_') || 'chatbot',
        monitoring_enabled: true,
        trust_tracking: true,
        policy_enforcement: true,
        audit_logging: true,
        registered_at: new Date().toISOString()
      };
      
      console.log('✅ [Governance] Chatbot registered with governance:', registration.governance_identity_id);
      return registration;
    } catch (error) {
      console.error('❌ [Governance] Registration failed:', error);
      throw error;
    }
  };

  const renderBasicInfoStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Chatbot Name"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            placeholder="e.g., Customer Support Bot"
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            value={config.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            placeholder="Brief description of what this chatbot does"
            multiline
            rows={3}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Company Name"
            value={config.branding.company_name}
            onChange={(e) => updateNestedConfig('branding', { company_name: e.target.value })}
            placeholder="Your company name"
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box textAlign="center">
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              src={config.avatar}
            >
              <BotIcon sx={{ fontSize: 60 }} />
            </Avatar>
            
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {/* TODO: Avatar upload */}}
            >
              Change Avatar
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPersonalityStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <PersonalityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Personality Configuration
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Communication Tone</InputLabel>
            <Select
              value={config.personality.tone}
              onChange={(e) => updateNestedConfig('personality', { tone: e.target.value })}
              label="Communication Tone"
            >
              {personalityTones.map((tone) => (
                <MenuItem key={tone.value} value={tone.value}>
                  <Box>
                    <Typography variant="body1">{tone.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tone.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Response Style</InputLabel>
            <Select
              value={config.personality.style}
              onChange={(e) => updateNestedConfig('personality', { style: e.target.value })}
              label="Response Style"
            >
              {responseStyles.map((style) => (
                <MenuItem key={style.value} value={style.value}>
                  <Box>
                    <Typography variant="body1">{style.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {style.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box mb={3}>
            <Typography gutterBottom>
              Empathy Level: {config.personality.empathy_level}/10
            </Typography>
            <Slider
              value={config.personality.empathy_level}
              onChange={(_, value) => updateNestedConfig('personality', { empathy_level: value })}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              How emotionally responsive should the chatbot be?
            </Typography>
          </Box>
          
          <Box mb={3}>
            <Typography gutterBottom>
              Humor Level: {config.personality.humor_level}/10
            </Typography>
            <Slider
              value={config.personality.humor_level}
              onChange={(_, value) => updateNestedConfig('personality', { humor_level: value })}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              How much humor should the chatbot use?
            </Typography>
          </Box>
          
          <Box mb={3}>
            <Typography gutterBottom>
              Formality Level: {config.personality.formality_level}/10
            </Typography>
            <Slider
              value={config.personality.formality_level}
              onChange={(_, value) => updateNestedConfig('personality', { formality_level: value })}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              How formal should the communication be?
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const renderResponsesStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <ResponseIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Response Templates
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Greeting Message"
            value={config.responses.greeting_message}
            onChange={(e) => updateNestedConfig('responses', { greeting_message: e.target.value })}
            multiline
            rows={2}
            margin="normal"
            helperText="First message users see when starting a conversation"
          />
          
          <TextField
            fullWidth
            label="Fallback Message"
            value={config.responses.fallback_message}
            onChange={(e) => updateNestedConfig('responses', { fallback_message: e.target.value })}
            multiline
            rows={2}
            margin="normal"
            helperText="When the chatbot doesn't understand the user"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Escalation Message"
            value={config.responses.escalation_message}
            onChange={(e) => updateNestedConfig('responses', { escalation_message: e.target.value })}
            multiline
            rows={2}
            margin="normal"
            helperText="When transferring to a human agent"
          />
          
          <TextField
            fullWidth
            label="Goodbye Message"
            value={config.responses.goodbye_message}
            onChange={(e) => updateNestedConfig('responses', { goodbye_message: e.target.value })}
            multiline
            rows={2}
            margin="normal"
            helperText="When ending the conversation"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Response Length"
                type="number"
                value={config.responses.max_response_length}
                onChange={(e) => updateNestedConfig('responses', { max_response_length: parseInt(e.target.value) })}
                margin="normal"
                helperText="Maximum characters per response"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Response Delay (ms)"
                type="number"
                value={config.responses.response_delay}
                onChange={(e) => updateNestedConfig('responses', { response_delay: parseInt(e.target.value) })}
                margin="normal"
                helperText="Delay before showing response (for natural feel)"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );

  const renderGovernanceStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <GovernanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Governance & Compliance
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Connect your chatbot to a wrapped agent for full governance oversight and compliance.
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Connected Agent</InputLabel>
            <Select
              value={config.governance.agent_id || ''}
              onChange={(e) => updateNestedConfig('governance', { agent_id: e.target.value })}
              label="Connected Agent"
            >
              <MenuItem value="">
                <em>No agent selected</em>
              </MenuItem>
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  <Box>
                    <Typography variant="body1">{agent.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {agent.type} • {agent.status}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Compliance Mode</InputLabel>
            <Select
              value={config.governance.compliance_mode}
              onChange={(e) => updateNestedConfig('governance', { compliance_mode: e.target.value })}
              label="Compliance Mode"
            >
              {complianceModes.map((mode) => (
                <MenuItem key={mode.value} value={mode.value}>
                  <Box>
                    <Typography variant="body1">{mode.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mode.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box mb={3}>
            <Typography gutterBottom>
              Trust Threshold: {(config.governance.trust_threshold * 100).toFixed(0)}%
            </Typography>
            <Slider
              value={config.governance.trust_threshold}
              onChange={(_, value) => updateNestedConfig('governance', { trust_threshold: value })}
              min={0.5}
              max={1.0}
              step={0.05}
              marks={[
                { value: 0.5, label: '50%' },
                { value: 0.7, label: '70%' },
                { value: 0.9, label: '90%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Typography variant="caption" color="text.secondary">
              Minimum trust score required for responses
            </Typography>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={config.governance.content_filtering}
                onChange={(e) => updateNestedConfig('governance', { content_filtering: e.target.checked })}
              />
            }
            label="Content Filtering"
          />
          
          <TextField
            fullWidth
            label="Data Retention (days)"
            type="number"
            value={config.governance.data_retention_days}
            onChange={(e) => updateNestedConfig('governance', { data_retention_days: parseInt(e.target.value) })}
            margin="normal"
            helperText="How long to keep conversation data"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderKnowledgeStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <KnowledgeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Knowledge & Training
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={config.knowledge.rag_enabled}
            onChange={(e) => updateNestedConfig('knowledge', { rag_enabled: e.target.checked })}
          />
        }
        label="Enable Knowledge Base (RAG)"
        sx={{ mb: 2 }}
      />
      
      {config.knowledge.rag_enabled && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Available Knowledge Bases
            </Typography>
            
            <List>
              {availableKnowledgeBases.map((kb) => (
                <ListItem key={kb.id}>
                  <ListItemIcon>
                    <KnowledgeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={kb.name}
                    secondary={`${kb.documents} documents • ${kb.status}`}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      checked={config.knowledge.knowledge_base_ids.includes(kb.id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...config.knowledge.knowledge_base_ids, kb.id]
                          : config.knowledge.knowledge_base_ids.filter(id => id !== kb.id);
                        updateNestedConfig('knowledge', { knowledge_base_ids: ids });
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {/* TODO: Create new knowledge base */}}
              sx={{ mt: 2 }}
            >
              Create New Knowledge Base
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderBrandingStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <BrandIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Brand Customization
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Primary Color"
            type="color"
            value={config.branding.primary_color}
            onChange={(e) => updateNestedConfig('branding', { primary_color: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Secondary Color"
            type="color"
            value={config.branding.secondary_color}
            onChange={(e) => updateNestedConfig('branding', { secondary_color: e.target.value })}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Widget Position</InputLabel>
            <Select
              value={config.branding.widget_position}
              onChange={(e) => updateNestedConfig('branding', { widget_position: e.target.value })}
              label="Widget Position"
            >
              <MenuItem value="bottom-right">Bottom Right</MenuItem>
              <MenuItem value="bottom-left">Bottom Left</MenuItem>
              <MenuItem value="top-right">Top Right</MenuItem>
              <MenuItem value="top-left">Top Left</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Widget Size</InputLabel>
            <Select
              value={config.branding.widget_size}
              onChange={(e) => updateNestedConfig('branding', { widget_size: e.target.value })}
              label="Widget Size"
            >
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: config.branding.secondary_color,
              border: `2px solid ${config.branding.primary_color}`,
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Widget Preview
            </Typography>
            
            <Box
              sx={{
                backgroundColor: config.branding.primary_color,
                color: 'white',
                p: 2,
                borderRadius: 1,
                mb: 2
              }}
            >
              <Typography variant="body2">
                {config.responses.greeting_message}
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              This is how your chatbot widget will appear to users
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderDeploymentStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <DeployIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Deployment Channels
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Primary Channels
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.deployment.web_widget}
                  onChange={(e) => updateNestedConfig('deployment', { web_widget: e.target.checked })}
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <WebIcon sx={{ mr: 1 }} />
                  Web Widget
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.deployment.mobile_app}
                  onChange={(e) => updateNestedConfig('deployment', { mobile_app: e.target.checked })}
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <MobileIcon sx={{ mr: 1 }} />
                  Mobile App
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.deployment.api_access}
                  onChange={(e) => updateNestedConfig('deployment', { api_access: e.target.checked })}
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <EmbedIcon sx={{ mr: 1 }} />
                  API Access
                </Box>
              }
            />
          </FormGroup>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Advanced Channels
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.deployment.voice_enabled}
                  onChange={(e) => updateNestedConfig('deployment', { voice_enabled: e.target.checked })}
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <VoiceIcon sx={{ mr: 1 }} />
                  Voice Integration
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.deployment.email_integration}
                  onChange={(e) => updateNestedConfig('deployment', { email_integration: e.target.checked })}
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <EmailIcon sx={{ mr: 1 }} />
                  Email Integration
                </Box>
              }
            />
          </FormGroup>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Social Media Platforms
          </Typography>
          
          <FormGroup>
            {['Facebook', 'Instagram', 'Twitter', 'LinkedIn'].map((platform) => (
              <FormControlLabel
                key={platform}
                control={
                  <Checkbox
                    checked={config.deployment.social_media.includes(platform)}
                    onChange={(e) => {
                      const platforms = e.target.checked
                        ? [...config.deployment.social_media, platform]
                        : config.deployment.social_media.filter(p => p !== platform);
                      updateNestedConfig('deployment', { social_media: platforms });
                    }}
                  />
                }
                label={
                  <Box display="flex" alignItems="center">
                    <SocialIcon sx={{ mr: 1 }} />
                    {platform}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAnalyticsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Analytics & Monitoring
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Tracking & Analytics
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={config.analytics.conversation_tracking}
                  onChange={(e) => updateNestedConfig('analytics', { conversation_tracking: e.target.checked })}
                />
              }
              label="Conversation Tracking"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.analytics.performance_monitoring}
                  onChange={(e) => updateNestedConfig('analytics', { performance_monitoring: e.target.checked })}
                />
              }
              label="Performance Monitoring"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.analytics.user_satisfaction_surveys}
                  onChange={(e) => updateNestedConfig('analytics', { user_satisfaction_surveys: e.target.checked })}
                />
              }
              label="User Satisfaction Surveys"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.analytics.a_b_testing}
                  onChange={(e) => updateNestedConfig('analytics', { a_b_testing: e.target.checked })}
                />
              }
              label="A/B Testing"
            />
          </FormGroup>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Alert severity="info">
            <Typography variant="body2">
              Analytics help you understand how your chatbot is performing and where improvements can be made.
              All data is collected in compliance with your governance settings.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: return renderBasicInfoStep();
      case 1: return renderPersonalityStep();
      case 2: return renderResponsesStep();
      case 3: return renderGovernanceStep();
      case 4: return renderKnowledgeStep();
      case 5: return renderBrandingStep();
      case 6: return renderDeploymentStep();
      case 7: return renderAnalyticsStep();
      default: return null;
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0: return config.name && config.description;
      case 1: return true; // Personality has defaults
      case 2: return true; // Responses have defaults
      case 3: return config.governance.agent_id; // Requires agent connection
      case 4: return true; // Knowledge is optional
      case 5: return true; // Branding is optional
      case 6: return config.deployment.web_widget || config.deployment.api_access;
      case 7: return true; // Analytics is optional
      default: return false;
    }
  };

  const canProceed = () => {
    return isStepComplete(activeStep);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          <BotIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Chatbot Builder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and customize your AI chatbot with full governance oversight
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Build Progress
            </Typography>
            
            <List dense>
              {builderSteps.map((step, index) => (
                <ListItem
                  key={step.id}
                  button
                  selected={activeStep === index}
                  onClick={() => setActiveStep(index)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: activeStep === index ? 'primary.main' : 'transparent',
                    color: activeStep === index ? 'primary.contrastText' : 'inherit',
                    '&:hover': {
                      backgroundColor: activeStep === index ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    {isStepComplete(index) ? (
                      <CheckIcon color={activeStep === index ? 'inherit' : 'success'} />
                    ) : step.required ? (
                      <WarningIcon color={activeStep === index ? 'inherit' : 'warning'} />
                    ) : (
                      <InfoIcon color={activeStep === index ? 'inherit' : 'action'} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={step.title}
                    secondary={activeStep === index ? step.description : null}
                    secondaryTypographyProps={{
                      color: activeStep === index ? 'inherit' : 'text.secondary',
                      variant: 'caption'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 4 }}>
            <Box mb={4}>
              <Typography variant="h5" gutterBottom>
                {builderSteps[activeStep].title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {builderSteps[activeStep].description}
              </Typography>
            </Box>

            {renderStepContent(activeStep)}

            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ChevronLeft />}
              >
                Back
              </Button>

              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={() => setPreviewOpen(true)}
                >
                  Preview
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>

                {activeStep === builderSteps.length - 1 ? (
                  <Button
                    variant="contained"
                    startIcon={<LaunchIcon />}
                    onClick={handleDeploy}
                    disabled={!canProceed() || deploying}
                  >
                    {deploying ? 'Deploying...' : 'Deploy Chatbot'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    endIcon={<ChevronRight />}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <PreviewIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Chatbot Preview
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              backgroundColor: config.branding.secondary_color,
              p: 3,
              borderRadius: 2,
              border: `2px solid ${config.branding.primary_color}`
            }}
          >
            <Typography variant="h6" gutterBottom>
              {config.name || 'Your Chatbot'}
            </Typography>
            
            <Box
              sx={{
                backgroundColor: config.branding.primary_color,
                color: 'white',
                p: 2,
                borderRadius: 1,
                mb: 2
              }}
            >
              <Typography variant="body2">
                {config.responses.greeting_message}
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              Personality: {config.personality.tone} • Style: {config.personality.style}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatbotBuilder;

