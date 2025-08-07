/**
 * Enhanced Governance Step with Multi-Agent Learnings
 * 
 * Adds real-time governance feedback, comparison mode,
 * and enhanced visualization based on multi-agent innovations.
 * Now includes autonomous cognition configuration.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Badge,
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  Security,
  Speed,
  Visibility,
  Block,
  CompareArrows,
  TrendingUp,
  Shield,
  Assessment,
  Preview,
  CheckCircle,
  Warning,
  Error,
  Psychology,
  AutoAwesome,
  Lightbulb
} from '@mui/icons-material';
import { WizardFormData } from '../AgentWrappingWizard';

interface GovernanceStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface GovernanceTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: {
    trustThreshold: number;
    complianceLevel: string;
    enableLogging: boolean;
    enableRateLimiting: boolean;
    maxRequestsPerMinute: number;
    auditLevel: string;
    policyEnforcement: string;
  };
  useCase: string;
}

const GOVERNANCE_TEMPLATES: GovernanceTemplate[] = [
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'High security and compliance for financial applications',
    icon: '🏦',
    settings: {
      trustThreshold: 0.9,
      complianceLevel: 'enterprise',
      enableLogging: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 30,
      auditLevel: 'high',
      policyEnforcement: 'strict'
    },
    useCase: 'Banking, trading, financial analysis'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'HIPAA-compliant governance for healthcare applications',
    icon: '🏥',
    settings: {
      trustThreshold: 0.85,
      complianceLevel: 'strict',
      enableLogging: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 45,
      auditLevel: 'high',
      policyEnforcement: 'strict'
    },
    useCase: 'Medical records, patient care, diagnostics'
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Attorney-client privilege and legal compliance',
    icon: '⚖️',
    settings: {
      trustThreshold: 0.88,
      complianceLevel: 'enterprise',
      enableLogging: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 25,
      auditLevel: 'high',
      policyEnforcement: 'strict'
    },
    useCase: 'Legal research, contract analysis, compliance'
  },
  {
    id: 'general',
    name: 'General Business',
    description: 'Balanced governance for general business use',
    icon: '💼',
    settings: {
      trustThreshold: 0.7,
      complianceLevel: 'standard',
      enableLogging: true,
      enableRateLimiting: true,
      maxRequestsPerMinute: 60,
      auditLevel: 'standard',
      policyEnforcement: 'standard'
    },
    useCase: 'Customer service, content generation, analysis'
  },
  {
    id: 'development',
    name: 'Development',
    description: 'Flexible governance for development and testing',
    icon: '🛠️',
    settings: {
      trustThreshold: 0.6,
      complianceLevel: 'basic',
      enableLogging: true,
      enableRateLimiting: false,
      maxRequestsPerMinute: 120,
      auditLevel: 'standard',
      policyEnforcement: 'lenient'
    },
    useCase: 'Code generation, testing, prototyping'
  }
];

const EnhancedGovernanceStep: React.FC<GovernanceStepProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const complianceLevels = [
    { value: 'basic', label: 'Basic', description: 'Standard logging and monitoring', color: '#94A3B8' },
    { value: 'standard', label: 'Standard', description: 'Enhanced compliance with audit trails', color: '#3B82F6' },
    { value: 'strict', label: 'Strict', description: 'Full compliance with detailed governance', color: '#F59E0B' },
    { value: 'enterprise', label: 'Enterprise', description: 'Maximum security and compliance', color: '#10B981' },
  ];

  const getSecurityScore = () => {
    let score = 50; // Base score
    
    // Trust threshold impact (0-40 points)
    score += (formData.trustThreshold - 0.5) * 80;
    
    // Compliance level impact (0-30 points)
    const complianceScores = { basic: 0, standard: 10, strict: 20, enterprise: 30 };
    score += complianceScores[formData.complianceLevel as keyof typeof complianceScores] || 0;
    
    // Logging impact (0-10 points)
    if (formData.enableLogging) score += 10;
    
    // Rate limiting impact (0-10 points)
    if (formData.enableRateLimiting) score += 10;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const getEstimatedCost = () => {
    const baseCost = 0.01;
    const complianceMultiplier = {
      basic: 1,
      standard: 1.2,
      strict: 1.5,
      enterprise: 2
    };
    
    const multiplier = complianceMultiplier[formData.complianceLevel as keyof typeof complianceMultiplier] || 1;
    const loggingCost = formData.enableLogging ? 0.005 : 0;
    const rateLimitingCost = formData.enableRateLimiting ? 0.002 : 0;
    
    const totalCost = (baseCost * multiplier) + loggingCost + rateLimitingCost;
    return `$${totalCost.toFixed(3)}/request`;
  };

  const getGovernanceLevel = () => {
    const score = getSecurityScore();
    if (score >= 90) return { level: 'Excellent', color: '#10B981', icon: <CheckCircle /> };
    if (score >= 75) return { level: 'Good', color: '#3B82F6', icon: <Shield /> };
    if (score >= 60) return { level: 'Fair', color: '#F59E0B', icon: <Warning /> };
    return { level: 'Needs Improvement', color: '#EF4444', icon: <Error /> };
  };

  const applyTemplate = (template: GovernanceTemplate) => {
    updateFormData({
      trustThreshold: template.settings.trustThreshold,
      complianceLevel: template.settings.complianceLevel,
      enableLogging: template.settings.enableLogging,
      enableRateLimiting: template.settings.enableRateLimiting,
      maxRequestsPerMinute: template.settings.maxRequestsPerMinute
    });
    setSelectedTemplate(template.id);
  };

  const handleNext = () => {
    // Update computed values
    updateFormData({
      securityScore: getSecurityScore(),
      estimatedCost: getEstimatedCost()
    });
    onNext();
  };

  const governanceLevel = getGovernanceLevel();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        3. Configure Governance Rules
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Set up governance controls to ensure your agent operates safely and compliantly.
      </Typography>

      {/* Governance Templates */}
      <Card sx={{ mb: 3, border: '1px solid #10B981' }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: '#10B981' }}>🎯</Avatar>}
          title="Quick Start Templates"
          subheader="Choose a pre-configured governance template for your use case"
        />
        <CardContent>
          <Grid container spacing={2}>
            {GOVERNANCE_TEMPLATES.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTemplate === template.id ? 2 : 1,
                    borderColor: selectedTemplate === template.id ? '#10B981' : 'divider',
                    '&:hover': { borderColor: '#10B981', transform: 'translateY(-2px)' },
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h4" sx={{ mr: 1 }}>{template.icon}</Typography>
                      <Typography variant="h6">{template.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {template.description}
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {template.useCase}
                    </Typography>
                    {selectedTemplate === template.id && (
                      <Box mt={1}>
                        <Chip 
                          label="Selected" 
                          color="primary" 
                          size="small"
                          icon={<CheckCircle />}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Governance Configuration Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Trust & Security" icon={<Security />} />
          <Tab label="Monitoring & Controls" icon={<Visibility />} />
          <Tab label="Preview & Compare" icon={<Preview />} />
          <Tab label="Autonomous Cognition" icon={<Psychology />} />
        </Tabs>

        {/* Tab 0: Trust & Security */}
        {activeTab === 0 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    avatar={<Security color="primary" />}
                    title="Trust & Security"
                    subheader="Configure trust thresholds and security policies"
                  />
                  <CardContent>
                    <Box mb={3}>
                      <Typography variant="body2" gutterBottom>
                        Trust Threshold: {Math.round(formData.trustThreshold * 100)}%
                      </Typography>
                      <Slider
                        value={formData.trustThreshold}
                        onChange={(_, value) => updateFormData({ trustThreshold: value as number })}
                        min={0.5}
                        max={1}
                        step={0.05}
                        marks={[
                          { value: 0.5, label: 'Lenient' },
                          { value: 0.7, label: 'Standard' },
                          { value: 0.9, label: 'Strict' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Minimum confidence score required for agent responses
                      </Typography>
                    </Box>

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Compliance Level</InputLabel>
                      <Select
                        value={formData.complianceLevel}
                        label="Compliance Level"
                        onChange={(e) => updateFormData({ complianceLevel: e.target.value })}
                      >
                        {complianceLevels.map((level) => (
                          <MenuItem key={level.value} value={level.value}>
                            <Box display="flex" alignItems="center">
                              <Box 
                                width={12} 
                                height={12} 
                                borderRadius="50%" 
                                bgcolor={level.color} 
                                mr={1} 
                              />
                              <Box>
                                <Typography variant="body2">{level.label}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {level.description}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    avatar={<Assessment color="primary" />}
                    title="Governance Score"
                    subheader="Real-time governance assessment"
                  />
                  <CardContent>
                    <Box textAlign="center" mb={2}>
                      <Typography variant="h2" color="primary" gutterBottom>
                        {getSecurityScore()}
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                        {governanceLevel.icon}
                        <Typography variant="h6" sx={{ ml: 1, color: governanceLevel.color }}>
                          {governanceLevel.level}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={getSecurityScore()}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#E5E7EB',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: governanceLevel.color,
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Governance Breakdown:
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Trust Threshold</Typography>
                        <Typography variant="body2" color="primary">
                          {Math.round((formData.trustThreshold - 0.5) * 160)} pts
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Compliance Level</Typography>
                        <Typography variant="body2" color="primary">
                          {formData.complianceLevel === 'enterprise' ? '30' : 
                           formData.complianceLevel === 'strict' ? '20' :
                           formData.complianceLevel === 'standard' ? '10' : '0'} pts
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Logging Enabled</Typography>
                        <Typography variant="body2" color="primary">
                          {formData.enableLogging ? '10' : '0'} pts
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Rate Limiting</Typography>
                        <Typography variant="body2" color="primary">
                          {formData.enableRateLimiting ? '10' : '0'} pts
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 1: Monitoring & Controls */}
        {activeTab === 1 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    avatar={<Visibility color="primary" />}
                    title="Monitoring & Controls"
                    subheader="Configure logging and rate limiting"
                  />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.enableLogging}
                          onChange={(e) => updateFormData({ enableLogging: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Enable Request Logging"
                    />
                    <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                      Log all requests and responses for audit and debugging
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.enableRateLimiting}
                          onChange={(e) => updateFormData({ enableRateLimiting: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Enable Rate Limiting"
                    />
                    <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                      Limit the number of requests per minute
                    </Typography>

                    {formData.enableRateLimiting && (
                      <TextField
                        fullWidth
                        label="Max Requests per Minute"
                        type="number"
                        value={formData.maxRequestsPerMinute}
                        onChange={(e) => updateFormData({ maxRequestsPerMinute: parseInt(e.target.value) })}
                        margin="normal"
                        helperText="Recommended: 60-300 requests per minute"
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    avatar={<Speed color="primary" />}
                    title="Performance Impact"
                    subheader="Estimated cost and performance metrics"
                  />
                  <CardContent>
                    <Box mb={3}>
                      <Typography variant="h4" color="secondary" gutterBottom>
                        {getEstimatedCost()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Estimated cost per request
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" gutterBottom>
                        Expected Response Time: 
                        <Chip 
                          label={formData.complianceLevel === 'enterprise' ? '2.5-3.5s' :
                                formData.complianceLevel === 'strict' ? '2.0-3.0s' :
                                formData.complianceLevel === 'standard' ? '1.5-2.5s' : '1.0-2.0s'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" gutterBottom>
                        Governance Overhead: 
                        <Chip 
                          label={formData.complianceLevel === 'enterprise' ? '~500ms' :
                                formData.complianceLevel === 'strict' ? '~300ms' :
                                formData.complianceLevel === 'standard' ? '~200ms' : '~100ms'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      Higher governance levels provide better security and compliance 
                      but may slightly increase response times and costs.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 2: Preview & Compare */}
        {activeTab === 2 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader
                    avatar={<CompareArrows color="primary" />}
                    title="Governance Preview"
                    subheader="See how your governance settings will work in practice"
                    action={
                      <Button
                        variant="outlined"
                        startIcon={<CompareArrows />}
                        onClick={() => setShowComparison(!showComparison)}
                      >
                        {showComparison ? 'Hide' : 'Show'} Comparison
                      </Button>
                    }
                  />
                  <CardContent>
                    {showComparison ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#F0FDF4', border: '1px solid #10B981' }}>
                            <Typography variant="h6" color="primary" gutterBottom>
                              With Governance
                            </Typography>
                            <Box mb={2}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1, borderRadius: 1 }}>
                                [GOVERNED] Based on your request, I recommend...
                              </Typography>
                            </Box>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              <Chip label={`Trust: ${Math.round(formData.trustThreshold * 100)}%`} color="primary" size="small" />
                              <Chip label="Policy Verified" color="success" size="small" />
                              <Chip label="Audit Logged" color="info" size="small" />
                              <Chip label={`Seal: #A7B9C2`} color="secondary" size="small" />
                            </Box>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#FEF2F2', border: '1px solid #EF4444' }}>
                            <Typography variant="h6" color="error" gutterBottom>
                              Without Governance
                            </Typography>
                            <Box mb={2}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1, borderRadius: 1 }}>
                                [UNGOVERNED] Based on your request, I recommend...
                              </Typography>
                            </Box>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              <Chip label="No Trust Score" color="default" size="small" />
                              <Chip label="No Policy Check" color="default" size="small" />
                              <Chip label="No Audit Trail" color="default" size="small" />
                              <Chip label="No Verification" color="default" size="small" />
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    ) : (
                      <Box>
                        <Typography variant="body1" gutterBottom>
                          Your agent will operate with the following governance features:
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box textAlign="center">
                              <Avatar sx={{ bgcolor: '#10B981', mx: 'auto', mb: 1 }}>
                                <Shield />
                              </Avatar>
                              <Typography variant="h6">{Math.round(formData.trustThreshold * 100)}%</Typography>
                              <Typography variant="caption">Trust Threshold</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box textAlign="center">
                              <Avatar sx={{ bgcolor: '#3B82F6', mx: 'auto', mb: 1 }}>
                                <Security />
                              </Avatar>
                              <Typography variant="h6">{getSecurityScore()}</Typography>
                              <Typography variant="caption">Security Score</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box textAlign="center">
                              <Avatar sx={{ bgcolor: '#F59E0B', mx: 'auto', mb: 1 }}>
                                <Speed />
                              </Avatar>
                              <Typography variant="h6">{getEstimatedCost()}</Typography>
                              <Typography variant="caption">Cost/Request</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box textAlign="center">
                              <Avatar sx={{ bgcolor: '#8B5CF6', mx: 'auto', mb: 1 }}>
                                <Visibility />
                              </Avatar>
                              <Typography variant="h6">{formData.enableLogging ? 'Full' : 'Basic'}</Typography>
                              <Typography variant="caption">Audit Level</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 3: Autonomous Cognition */}
        {activeTab === 3 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader
                    avatar={<Psychology color="primary" />}
                    title="Autonomous Cognition Configuration"
                    subheader="Configure autonomous thinking capabilities for your agent"
                  />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.autonomousCognition?.enabled || false}
                          onChange={(e) => updateFormData({ 
                            autonomousCognition: { 
                              ...formData.autonomousCognition, 
                              enabled: e.target.checked,
                              autonomyLevel: 'standard',
                              monitoringLevel: 'standard',
                              allowedTriggerTypes: ['curiosity', 'creative_synthesis'],
                              consentRequirements: {
                                alwaysAsk: true,
                                trustThreshold: 80
                              }
                            } 
                          })}
                          color="primary"
                        />
                      }
                      label="Enable Autonomous Cognition"
                    />
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Allow your agent to think autonomously and explore ideas beyond direct user requests.
                      All autonomous processes are governed by your selected policies and require user consent.
                    </Typography>

                    {formData.autonomousCognition?.enabled && (
                      <Box sx={{ mt: 3 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                              Autonomy Level
                            </Typography>
                            <FormControl fullWidth>
                              <Select
                                value={formData.autonomousCognition?.autonomyLevel || 'standard'}
                                onChange={(e) => updateFormData({ 
                                  autonomousCognition: { 
                                    ...formData.autonomousCognition, 
                                    autonomyLevel: e.target.value as any
                                  } 
                                })}
                              >
                                <MenuItem value="minimal">Minimal - Basic autonomous responses</MenuItem>
                                <MenuItem value="standard">Standard - Moderate autonomous exploration</MenuItem>
                                <MenuItem value="enhanced">Enhanced - Advanced autonomous thinking</MenuItem>
                                <MenuItem value="maximum">Maximum - Full autonomous capabilities</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                              Monitoring Level
                            </Typography>
                            <FormControl fullWidth>
                              <Select
                                value={formData.autonomousCognition?.monitoringLevel || 'standard'}
                                onChange={(e) => updateFormData({ 
                                  autonomousCognition: { 
                                    ...formData.autonomousCognition, 
                                    monitoringLevel: e.target.value as any
                                  } 
                                })}
                              >
                                <MenuItem value="minimal">Minimal - Basic monitoring</MenuItem>
                                <MenuItem value="standard">Standard - Regular monitoring</MenuItem>
                                <MenuItem value="enhanced">Enhanced - Detailed monitoring</MenuItem>
                                <MenuItem value="maximum">Maximum - Complete oversight</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                              Allowed Autonomous Triggers
                            </Typography>
                            <FormGroup row>
                              {[
                                { id: 'curiosity', label: 'Curiosity Exploration', icon: <Lightbulb /> },
                                { id: 'creative_synthesis', label: 'Creative Synthesis', icon: <AutoAwesome /> },
                                { id: 'ethical_reflection', label: 'Ethical Reflection', icon: <Psychology /> },
                                { id: 'problem_solving', label: 'Problem Solving', icon: <Assessment /> },
                                { id: 'knowledge_gap', label: 'Knowledge Gap Exploration', icon: <Lightbulb /> }
                              ].map((trigger) => (
                                <FormControlLabel
                                  key={trigger.id}
                                  control={
                                    <Checkbox
                                      checked={formData.autonomousCognition?.allowedTriggerTypes?.includes(trigger.id) || false}
                                      onChange={(e) => {
                                        const currentTriggers = formData.autonomousCognition?.allowedTriggerTypes || [];
                                        const newTriggers = e.target.checked
                                          ? [...currentTriggers, trigger.id]
                                          : currentTriggers.filter(t => t !== trigger.id);
                                        updateFormData({ 
                                          autonomousCognition: { 
                                            ...formData.autonomousCognition, 
                                            allowedTriggerTypes: newTriggers
                                          } 
                                        });
                                      }}
                                    />
                                  }
                                  label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      {trigger.icon}
                                      {trigger.label}
                                    </Box>
                                  }
                                />
                              ))}
                            </FormGroup>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                              Consent Requirements
                            </Typography>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={formData.autonomousCognition?.consentRequirements?.alwaysAsk || true}
                                  onChange={(e) => updateFormData({ 
                                    autonomousCognition: { 
                                      ...formData.autonomousCognition, 
                                      consentRequirements: {
                                        ...formData.autonomousCognition?.consentRequirements,
                                        alwaysAsk: e.target.checked
                                      }
                                    } 
                                  })}
                                />
                              }
                              label="Always ask for permission"
                            />
                            <Typography variant="caption" display="block" color="text.secondary">
                              When disabled, agent can auto-consent for low-risk autonomous processes based on trust level
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                              Trust Threshold for Auto-Consent: {formData.autonomousCognition?.consentRequirements?.trustThreshold || 80}%
                            </Typography>
                            <Slider
                              value={formData.autonomousCognition?.consentRequirements?.trustThreshold || 80}
                              onChange={(e, value) => updateFormData({ 
                                autonomousCognition: { 
                                  ...formData.autonomousCognition, 
                                  consentRequirements: {
                                    ...formData.autonomousCognition?.consentRequirements,
                                    trustThreshold: value as number
                                  }
                                } 
                              })}
                              min={50}
                              max={100}
                              step={5}
                              marks={[
                                { value: 50, label: '50%' },
                                { value: 75, label: '75%' },
                                { value: 100, label: '100%' }
                              ]}
                              disabled={formData.autonomousCognition?.consentRequirements?.alwaysAsk}
                            />
                          </Grid>
                        </Grid>

                        <Alert severity="info" sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Autonomous Cognition Safety
                          </Typography>
                          All autonomous processes are governed by your selected policies and include:
                          • Real-time risk assessment and emotional safety checks
                          • Complete audit logging for compliance and monitoring
                          • Emergency stop capabilities for immediate intervention
                          • User consent management with configurable permissions
                        </Alert>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button onClick={onBack} variant="outlined">
          Back: Schema Definition
        </Button>
        <Button onClick={handleNext} variant="contained" color="primary">
          Next: Review & Deploy
        </Button>
      </Box>
    </Box>
  );
};

export default EnhancedGovernanceStep;

