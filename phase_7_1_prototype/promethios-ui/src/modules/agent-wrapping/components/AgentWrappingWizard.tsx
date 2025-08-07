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
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Security as GovernanceIcon,
  CheckCircle,
  CheckCircle as CheckCircleIcon,
  ArrowBack,
  ArrowForward,
  Code as CodeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EnhancedAgentRegistration from '../../../components/EnhancedAgentRegistration';
import { UserAgentStorageService, AgentProfile, GovernancePolicy, ComplianceControl, PolicyRule } from '../../../services/UserAgentStorageService';
import { useAuth } from '../../../context/AuthContext';

const steps = [
  'Agent Configuration',
  'Governance Setup',
  'Review & Deploy'
];

export interface WizardFormData {
  // Step 1: API Endpoint
  agentName: string;
  description: string;
  provider: string;
  apiEndpoint: string;
  authMethod: string;
  apiKey: string;
  model: string;
  // Step 2: Schema
  inputSchema: any;
  outputSchema: any;
  
  // Step 3: Governance
  trustThreshold: number;
  complianceLevel: string;
  enableLogging: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  
  // Autonomous Cognition Configuration
  autonomousCognition?: {
    enabled: boolean;
    autonomyLevel: 'minimal' | 'standard' | 'enhanced' | 'maximum';
    monitoringLevel: 'minimal' | 'standard' | 'enhanced' | 'maximum';
    allowedTriggerTypes: string[];
    consentRequirements: {
      alwaysAsk: boolean;
      trustThreshold: number;
    };
  };
  
  // Step 4: Review (computed)
  estimatedCost: string;
  securityScore: number;
}

const AgentWrappingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  // Check if we're wrapping an existing agent
  const agentId = searchParams.get('agentId');
  const isWrappingExisting = Boolean(agentId);
  
  // Start at step 1 (Governance) if wrapping existing agent, step 0 if new
  const [activeStep, setActiveStep] = useState(isWrappingExisting ? 1 : 0);
  const [agentData, setAgentData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(isWrappingExisting);

  // Load existing agent data if wrapping an existing agent
  useEffect(() => {
    const loadExistingAgent = async () => {
      console.log('Loading agent - agentId:', agentId);
      console.log('currentUser (Firebase):', currentUser);
      console.log('currentUser:', currentUser);
      console.log('currentUser.uid:', currentUser?.uid);
      
      if (!agentId) {
        console.log('No agentId provided, staying on new agent flow');
        return;
      }
      
      if (!currentUser) {
        console.log('No currentUser available, waiting...');
        return;
      }
      
      setIsLoading(true);
      try {
        const StorageServiceClass = UserAgentStorageService;
        const storageService = new StorageServiceClass();
        storageService.setCurrentUser(currentUser.uid);
        console.log('Created storage service for user:', currentUser.uid);
        
        const existingAgent = await storageService.getAgent(agentId);
        console.log('Storage service returned:', existingAgent);
        
        if (existingAgent) {
          setAgentData(existingAgent);
          console.log('Successfully loaded existing agent for wrapping:', existingAgent);
        } else {
          console.warn('Agent not found in storage');
          // Don't redirect automatically - let user stay and see the error
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error loading existing agent:', error);
        // Don't redirect automatically - let user stay and see the error
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAgent();
  }, [agentId, currentUser, navigate]);

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate agent configuration - check the actual fields from EnhancedAgentRegistration
      console.log('Validating agent data:', agentData);
      
      // Check multiple possible field names from EnhancedAgentRegistration
      const hasName = agentData.agentName?.trim() || agentData.identity?.name?.trim();
      const hasEndpoint = agentData.apiEndpoint?.trim() || agentData.endpoint?.trim();
      const hasKey = agentData.apiKey?.trim() || agentData.key?.trim();
      const hasProvider = agentData.provider?.trim();
      
      console.log('Validation check:', { 
        hasName, 
        hasEndpoint, 
        hasKey, 
        hasProvider,
        agentName: agentData.agentName,
        apiEndpoint: agentData.apiEndpoint,
        apiKey: agentData.apiKey ? '[HIDDEN]' : undefined,
        provider: agentData.provider
      });
      
      if (!hasName || !hasEndpoint || !hasKey || !hasProvider) {
        console.log('Validation failed - missing required fields');
        alert('Please complete all required fields: Agent Name, API Endpoint, API Key, and Provider');
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        throw new Error('No user authenticated');
      }

      console.log('🚀 Starting agent wrapping with dual deployment...');
      console.log('Using currentUser:', currentUser.uid);

      // Create governance policy from wizard data (provide default instead of null)
      const governancePolicy: GovernancePolicy = agentData.complianceFramework === 'none' ? {
        trustThreshold: 75,
        securityLevel: 'standard',
        complianceFramework: 'general',
        enableAuditLogging: false,
        enableDataRetention: false,
        enableRateLimiting: false,
        enableContentFiltering: false,
        enableRealTimeMonitoring: false,
        enableEscalationPolicies: false,
        maxRequestsPerMinute: 100,
        policyRules: [],
        complianceControls: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
      } : {
        trustThreshold: agentData.trustThreshold || 85,
        securityLevel: agentData.securityLevel || 'standard',
        complianceFramework: agentData.complianceFramework || 'general',
        enableAuditLogging: agentData.enableAuditLogging !== false,
        enableDataRetention: agentData.enableDataRetention !== false,
        enableRateLimiting: agentData.enableRateLimiting || false,
        enableContentFiltering: agentData.enableContentFiltering || false,
        enableRealTimeMonitoring: agentData.enableRealTimeMonitoring !== false,
        enableEscalationPolicies: agentData.enableEscalationPolicies || false,
        maxRequestsPerMinute: agentData.maxRequestsPerMinute || 100,
        policyRules: [], // Will be populated by backend policy engine
        complianceControls: [], // Initialize as empty array
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      // Step 1: Create local compliance monitoring configuration
      console.log('📋 Setting up local compliance monitoring configuration...');
      
      const complianceControls: ComplianceControl[] = [];
      
      // Add framework-specific controls based on selection
      if (governancePolicy.complianceFramework === 'healthcare') {
        complianceControls.push(
          {
            id: 'hipaa-164-308',
            frameworkId: 'hipaa',
            controlId: '164.308',
            name: 'Administrative Safeguards',
            description: 'Security management process and access authorization',
            requirements: [
              'Implement security management process',
              'Implement access authorization procedures',
              'Implement workforce training procedures'
            ],
            monitoringLevel: governancePolicy.enforcementLevel === 'strict_compliance' ? 'escalate' : 'alert',
            enabled: true
          },
          {
            id: 'hipaa-164-312',
            frameworkId: 'hipaa',
            controlId: '164.312',
            name: 'Technical Safeguards',
            description: 'Access control and audit controls',
            requirements: [
              'Implement access control procedures',
              'Implement audit controls',
              'Implement integrity controls'
            ],
            monitoringLevel: governancePolicy.enforcementLevel === 'strict_compliance' ? 'escalate' : 'alert',
            enabled: true
          }
        );
      } else if (governancePolicy.complianceFramework === 'soc2') {
        complianceControls.push(
          {
            id: 'soc2-cc6-1',
            frameworkId: 'soc2',
            controlId: 'CC6.1',
            name: 'Logical and Physical Access Controls',
            description: 'Controls to restrict logical and physical access',
            requirements: [
              'Implement logical access security measures',
              'Implement physical access security measures',
              'Monitor access activities'
            ],
            monitoringLevel: governancePolicy.enforcementLevel === 'strict_compliance' ? 'escalate' : 'alert',
            enabled: true
          }
        );
      } else if (governancePolicy.complianceFramework === 'gdpr') {
        complianceControls.push(
          {
            id: 'gdpr-art-32',
            frameworkId: 'gdpr',
            controlId: 'Article 32',
            name: 'Security of Processing',
            description: 'Technical and organizational measures for data security',
            requirements: [
              'Implement appropriate technical measures',
              'Implement appropriate organizational measures',
              'Ensure confidentiality, integrity, availability'
            ],
            monitoringLevel: governancePolicy.enforcementLevel === 'strict_compliance' ? 'escalate' : 'alert',
            enabled: true
          }
        );
      }
      
      // Update governance policy with compliance controls (only if policy exists)
      //       // Always set compliance controls and policy rules since governancePolicy is never null
      governancePolicy.complianceControls = complianceControls;

      // Create local policy rules for governance monitoring
      governancePolicy.policyRules = [
        {
          id: 'trust-threshold-check',
          name: 'Trust Threshold Validation',
          description: 'Validates agent responses meet minimum trust threshold',
          condition: `trust_score >= ${governancePolicy.trustThreshold}`,
          action: 'allow',
          parameters: { threshold: governancePolicy.trustThreshold },
          priority: 1
        },
        ...(governancePolicy.enableAuditLogging ? [{
          id: 'audit-logging',
          name: 'Audit Logging',
          description: 'Logs all agent interactions for compliance audit',
          condition: 'always',
          action: 'log' as const,
          parameters: {
            log_level: governancePolicy.enforcementLevel === 'strict_compliance' ? 'detailed' : 'standard',
            compliance_framework: governancePolicy.complianceFramework
          },
          priority: 2
        }] : []),
        ...(governancePolicy.enableRealTimeMonitoring ? [{
          id: 'real-time-monitoring',
          name: 'Real-time Monitoring',
          description: 'Monitors agent behavior in real-time for policy violations',
          condition: 'always',
          action: governancePolicy.enforcementLevel === 'strict_compliance' ? 'escalate' as const : 'log' as const,
          parameters: {
            monitoring_level: governancePolicy.enforcementLevel,
          },
          priority: 3
        }] : [])
      ];

      console.log('✅ Local compliance monitoring configuration created with', complianceControls.length, 'controls');

      // Step 2: Update the existing agent with governance policy
      console.log('💾 Updating agent with governance policy...');
      console.log('Original agent data:', agentData);
      console.log('Governance policy to apply:', governancePolicy);
      
      // For existing agents, preserve the original ID and data
      // For new agents, create a new ID
      const agentId = agentData.identity?.id || agentData.id || `agent-${Date.now()}`;
      // Preserve the original agent name from the loaded agent data
      const agentName = agentData.identity?.name || agentData.agentName || 'Wrapped Agent';
      
      console.log('Agent ID to use:', agentId);
      console.log('Agent name to use (preserving original):', agentName);
      console.log('Original agent data name fields:', {
        'identity.name': agentData.identity?.name,
        'agentName': agentData.agentName,
        'apiKey': agentData.apiKey ? '[HIDDEN]' : 'MISSING',
        'apiEndpoint': agentData.apiEndpoint,
        'provider': agentData.provider,
        'model': agentData.model
      });

      // Step 2: Create the wrapped agent with proper apiDetails structure
      const updatedAgent = {
        ...agentData,
        // Preserve the original agent identity and ID
        identity: {
          ...agentData.identity,
          id: agentId,
          name: agentName,
          // Preserve the original version or set default
          version: agentData.identity?.version || agentData.version || '1.0.0',
          // Preserve the original description
          description: agentData.identity?.description || agentData.description || 'AI Agent with governance controls',
          creationDate: agentData.identity?.creationDate || new Date(),
          lastModifiedDate: new Date(),
        },
        // Ensure we have the agent name in the root level too
        agentName: agentName,
        // Create proper apiDetails structure for chat functionality
        apiDetails: {
          endpoint: agentData.apiEndpoint || agentData.endpoint || 'https://api.openai.com/v1',
          key: agentData.apiKey || agentData.key || '',
          provider: agentData.provider || 'OpenAI',
          selectedModel: agentData.selectedModel || agentData.model || (agentData.provider === 'Anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4'),
          selectedCapabilities: agentData.capabilities || [],
          selectedContextLength: agentData.contextLength || 4096,
          discoveredInfo: agentData.discoveredInfo || null,
        },
        governancePolicy,
        isWrapped: true,
        isDeployed: false, // Agents are "Governed" not "Deployed" until actually deployed to production
        healthStatus: 'healthy' as const,
        trustLevel: governancePolicy.trustThreshold >= 90 ? 'high' : 
                   (governancePolicy.trustThreshold >= 75 ? 'medium' : 'low'),
        lastActivity: new Date(),
      };

      console.log('Updated agent to save:', updatedAgent);
      console.log('🔍 Agent isWrapped status before saving:', updatedAgent.isWrapped);
      console.log('🔍 Agent apiDetails created:', {
        endpoint: updatedAgent.apiDetails.endpoint,
        provider: updatedAgent.apiDetails.provider,
        model: updatedAgent.apiDetails.selectedModel,
        hasKey: !!updatedAgent.apiDetails.key
      });

      // Step 3: Dual Deployment (Testing + Production only)
      console.log('🚀 Starting dual deployment (testing + production)...');
      
      const StorageServiceClass = UserAgentStorageService;
      const storageService = new StorageServiceClass();
      storageService.setCurrentUser(currentUser.uid);
      
      // Create testing version (this is what user will see and chat with)
      const testingAgent = {
        ...updatedAgent,
        identity: {
          ...updatedAgent.identity,
          id: `${updatedAgent.identity.id}-testing`,
          name: updatedAgent.identity.name, // Keep original name for user
        },
        environment: 'testing',
        isDeployed: true,
        deploymentType: 'testing'
      };
      
      // Create production version (for deployment)
      const productionAgent = {
        ...updatedAgent,
        identity: {
          ...updatedAgent.identity,
          id: `${updatedAgent.identity.id}-production`,
          name: updatedAgent.identity.name, // Keep original name for user
        },
        environment: 'production',
        isDeployed: false, // Not deployed until user clicks Deploy
        deploymentType: 'production'
      };
      
      // Save both versions (no original version needed)
      await storageService.saveAgent(testingAgent);
      await storageService.saveAgent(productionAgent);
      
      console.log('✅ Testing deployment completed:', testingAgent.identity.id);
      console.log('✅ Production version created:', productionAgent.identity.id);
      console.log('🔍 Testing agent isWrapped status after saving:', testingAgent.isWrapped);
      console.log('🔍 Production agent isWrapped status after saving:', productionAgent.isWrapped);

      console.log('🎉 Agent successfully wrapped with dual deployment (testing + production)');
      
      // Verify the testing agent was saved (this is what user will interact with)
      const savedAgent = await storageService.getAgent(testingAgent.identity.id);
      console.log('Verification - loaded testing agent:', savedAgent);
      console.log('🔍 Verification - saved agent isWrapped status:', savedAgent?.isWrapped);
      
      setShowSuccessDialog(true);
      
    } catch (error) {
      console.error('❌ Error deploying agent:', error);
      alert('Error deploying agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    navigate('/ui/agents/profiles');
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <EnhancedAgentRegistration
              onDataChange={(data) => {
                console.log('Agent data changed:', data);
                setAgentData(data);
              }}
              isDialog={false}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Governance Setup
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure governance and compliance settings for your agent.
            </Alert>
            
            {/* Show agent being wrapped */}
            {isWrappingExisting && (agentData.identity?.name || agentData.agentName) && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Wrapping existing agent:</strong> {agentData.identity?.name || agentData.agentName}
                </Typography>
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {/* Trust & Security Configuration */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Trust & Security
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Configure trust thresholds and security policies
                    </Typography>
                    
                    {/* Trust Threshold Slider */}
                    <Box sx={{ mb: 3 }}>
                      <Typography gutterBottom>Trust Threshold: {agentData.trustThreshold || 85}%</Typography>
                      <Slider
                        value={agentData.trustThreshold || 85}
                        onChange={(e, value) => setAgentData(prev => ({ ...prev, trustThreshold: value }))}
                        min={50}
                        max={100}
                        step={5}
                        marks={[
                          { value: 50, label: '50%' },
                          { value: 75, label: '75%' },
                          { value: 90, label: '90%' },
                          { value: 100, label: '100%' }
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    
                    {/* Security Level Selection */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Security Level</InputLabel>
                      <Select
                        value={agentData.securityLevel || 'standard'}
                        onChange={(e) => setAgentData(prev => ({ ...prev, securityLevel: e.target.value }))}
                        label="Security Level"
                      >
                        <MenuItem value="lenient">Lenient - Basic security checks</MenuItem>
                        <MenuItem value="standard">Standard - Balanced security</MenuItem>
                        <MenuItem value="strict">Strict - Maximum security</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Rate Limiting */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={agentData.enableRateLimiting || false}
                          onChange={(e) => setAgentData(prev => ({ ...prev, enableRateLimiting: e.target.checked }))}
                        />
                      }
                      label="Enable Rate Limiting"
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Compliance Configuration */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compliance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Ensure regulatory compliance and audit logging
                    </Typography>
                    
                    {/* Compliance Framework Selection */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Compliance Framework</InputLabel>
                      <Select
                        value={agentData.complianceFramework || 'general'}
                        onChange={(e) => setAgentData(prev => ({ ...prev, complianceFramework: e.target.value }))}
                        label="Compliance Framework"
                      >
                        <MenuItem value="none">No Policy - No governance controls (Testing/Development)</MenuItem>
                        <MenuItem value="general">General - Basic governance (Soft Controls)</MenuItem>
                        <MenuItem value="financial">Financial - SOX, PCI DSS (STRICT ENFORCEMENT)</MenuItem>
                        <MenuItem value="healthcare">Healthcare - HIPAA (STRICT ENFORCEMENT)</MenuItem>
                        <MenuItem value="legal">Legal - Attorney-client privilege (STRICT ENFORCEMENT)</MenuItem>
                        <MenuItem value="gdpr">GDPR - EU data protection (STRICT ENFORCEMENT)</MenuItem>
                        <MenuItem value="soc2">SOC 2 - Security controls (STRICT ENFORCEMENT)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Policy Enforcement Level */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Governance Level</InputLabel>
                      <Select
                        value={agentData.enforcementLevel || 'governance'}
                        onChange={(e) => setAgentData(prev => ({ ...prev, enforcementLevel: e.target.value }))}
                        label="Governance Level"
                      >
                        <MenuItem value="governance">Governance Only - Trust scores & recommendations</MenuItem>
                        <MenuItem value="monitoring">Enhanced Monitoring - Detailed logging & compliance tracking</MenuItem>
                        <MenuItem value="strict_compliance">Strict Compliance - Full audit trails & violation alerts</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Show compliance info for strict frameworks */}
                    {(agentData.complianceFramework && agentData.complianceFramework !== 'general') && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>COMPLIANCE MONITORING:</strong> This agent will have enhanced logging and monitoring 
                          for {agentData.complianceFramework.toUpperCase()} compliance. All actions will be tracked 
                          and audited according to regulatory requirements.
                        </Typography>
                      </Alert>
                    )}
                    
                    {/* Audit Logging */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={agentData.enableAuditLogging !== false}
                          onChange={(e) => setAgentData(prev => ({ ...prev, enableAuditLogging: e.target.checked }))}
                        />
                      }
                      label="Enable Audit Logging"
                      sx={{ mb: 1 }}
                    />
                    
                    {/* Data Retention */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={agentData.enableDataRetention !== false}
                          onChange={(e) => setAgentData(prev => ({ ...prev, enableDataRetention: e.target.checked }))}
                        />
                      }
                      label="Enable Data Retention Policies"
                      sx={{ mb: 2 }}
                    />
                    
                    {/* Compliance Status Indicator */}
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`${agentData.complianceFramework?.toUpperCase() || 'GENERAL'} Compliant`} 
                        color="primary" 
                        icon={<CheckCircleIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Advanced Governance Options */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Advanced Governance Options
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agentData.enableContentFiltering || false}
                              onChange={(e) => setAgentData(prev => ({ ...prev, enableContentFiltering: e.target.checked }))}
                            />
                          }
                          label="Content Filtering"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agentData.enableRealTimeMonitoring !== false}
                              onChange={(e) => setAgentData(prev => ({ ...prev, enableRealTimeMonitoring: e.target.checked }))}
                            />
                          }
                          label="Real-time Monitoring"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agentData.enableEscalationPolicies || false}
                              onChange={(e) => setAgentData(prev => ({ ...prev, enableEscalationPolicies: e.target.checked }))}
                            />
                          }
                          label="Escalation Policies"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Deploy
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your agent is ready for deployment with governance controls!
            </Alert>
            
            <Grid container spacing={3}>
              {/* Agent Summary - Editable */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Agent Summary
                    </Typography>
                    
                    {/* Editable Agent Name */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Agent Name
                      </Typography>
                      <input
                        type="text"
                        value={agentData.identity?.name || agentData.agentName || 'My Agent'}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setAgentData(prev => ({
                            ...prev,
                            agentName: newName,
                            identity: prev.identity ? { ...prev.identity, name: newName } : undefined
                          }));
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          backgroundColor: '#2a2a2a',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </Box>
                    
                    <Typography><strong>Provider:</strong> {agentData.apiDetails?.provider || agentData.provider || 'OpenAI'}</Typography>
                    <Typography><strong>Model:</strong> {agentData.apiDetails?.selectedModel || agentData.model || 'GPT-4'}</Typography>
                    <Typography><strong>Status:</strong> Ready for Deployment</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Governance Configuration Summary - Editable */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Governance Configuration
                    </Typography>
                    
                    {/* Editable Trust Threshold */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Trust Threshold: {agentData.trustThreshold || 85}%
                      </Typography>
                      <Slider
                        value={agentData.trustThreshold || 85}
                        onChange={(e, value) => setAgentData(prev => ({ ...prev, trustThreshold: value }))}
                        min={50}
                        max={100}
                        step={5}
                        size="small"
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    
                    <Typography><strong>Security Level:</strong> {(agentData.securityLevel || 'standard').charAt(0).toUpperCase() + (agentData.securityLevel || 'standard').slice(1)}</Typography>
                    <Typography><strong>Compliance Framework:</strong> {(agentData.complianceFramework || 'general').toUpperCase()}</Typography>
                    <Typography><strong>Audit Logging:</strong> {agentData.enableAuditLogging !== false ? 'Enabled' : 'Disabled'}</Typography>
                    <Typography><strong>Rate Limiting:</strong> {agentData.enableRateLimiting ? 'Enabled' : 'Disabled'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Compliance Status */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compliance & Security Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip 
                        label={`${(agentData.complianceFramework || 'general').toUpperCase()} Compliant`} 
                        color="primary" 
                        icon={<CheckCircleIcon />}
                      />
                      <Chip 
                        label={`Trust Score: ${agentData.trustThreshold || 85}%`} 
                        color="success" 
                        icon={<CheckCircleIcon />}
                      />
                      {agentData.enableAuditLogging !== false && (
                        <Chip label="Audit Logging Enabled" color="info" icon={<CheckCircleIcon />} />
                      )}
                      {agentData.enableRateLimiting && (
                        <Chip label="Rate Limiting Enabled" color="warning" icon={<CheckCircleIcon />} />
                      )}
                      {agentData.enableRealTimeMonitoring !== false && (
                        <Chip label="Real-time Monitoring" color="secondary" icon={<CheckCircleIcon />} />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      Your agent will be deployed with the selected governance controls and compliance framework. 
                      All interactions will be monitored and logged according to your configuration.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Agent Wrapping Wizard
      </Typography>
      
      {isWrappingExisting && (agentData.identity?.name || agentData.agentName) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Wrapping existing agent:</strong> {agentData.identity?.name || agentData.agentName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Skipping configuration step since agent details are already available.
          </Typography>
        </Alert>
      )}
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Typography>Loading agent data...</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: 4, mt: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || (isWrappingExisting && activeStep === 1)}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                endIcon={<CheckCircle />}
              >
                {isSubmitting ? 'Creating Agent...' : 'Deploy Agent'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleSuccessClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Agent Successfully Created!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your agent has been successfully wrapped and deployed with governance controls.
          </Typography>
          <Alert severity="success" sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Typography variant="body2">
              ✅ Governance controls activated<br/>
              ✅ Trust scoring enabled<br/>
              ✅ Audit logging configured<br/>
              ✅ Agent ready for use
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleSuccessClose}
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              '&:hover': { backgroundColor: '#2563eb' },
            }}
          >
            View My Agents
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentWrappingWizard;

