/**
 * Horizontal Policy Creation Wizard
 * 
 * A horizontal stepper wizard for creating governance policies,
 * modeled after the Agent Wrapping wizard layout.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  CircularProgress,
  Container
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as ComplianceIcon,
  Shield as ContentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Info as TipIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon
} from '@mui/icons-material';
import { useToast } from '../../hooks/use-toast';

// Simplified interfaces
interface SimpleRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert' | 'escalate';
  description: string;
}

interface SimplePolicy {
  name: string;
  type: string;
  description: string;
  rules: SimpleRule[];
}

// Policy templates for quick start
const POLICY_TEMPLATES = {
  SECURITY: {
    name: 'Basic Security Policy',
    icon: SecurityIcon,
    color: '#f44336',
    type: 'SECURITY',
    description: 'Protect against common security threats and data breaches',
    rules: [
      {
        id: 'rule-1',
        name: 'Block Personal Information',
        condition: 'contains_pii',
        action: 'alert' as const,
        description: 'Alert when personal information like SSN, credit cards, or addresses are detected'
      },
      {
        id: 'rule-2',
        name: 'Block Low Trust Content',
        condition: 'low_trust_score',
        action: 'deny' as const,
        description: 'Block responses that have low trust or confidence scores'
      }
    ]
  },
  COMPLIANCE: {
    name: 'Data Compliance Policy',
    icon: ComplianceIcon,
    color: '#2196f3',
    type: 'COMPLIANCE',
    description: 'Ensure compliance with data protection regulations like GDPR',
    rules: [
      {
        id: 'rule-1',
        name: 'Data Retention Check',
        condition: 'data_retention_violation',
        action: 'deny' as const,
        description: 'Prevent actions that violate data retention policies'
      }
    ]
  },
  CONTENT: {
    name: 'Content Safety Policy',
    icon: ContentIcon,
    color: '#4caf50',
    type: 'CONTENT',
    description: 'Ensure AI responses are safe, appropriate, and unbiased',
    rules: [
      {
        id: 'rule-1',
        name: 'Content Filter',
        condition: 'inappropriate_content',
        action: 'deny' as const,
        description: 'Block inappropriate or harmful content'
      }
    ]
  }
};

const COMMON_CONDITIONS = {
  'contains_pii': 'Contains personal information (SSN, credit cards, addresses)',
  'low_trust_score': 'Response has low trust or confidence score',
  'inappropriate_content': 'Contains inappropriate or harmful content',
  'data_retention_violation': 'Violates data retention policies',
  'bias_detected': 'Potential bias or discrimination detected',
  'custom_keyword': 'Contains specific keywords or phrases'
};

const ACTION_DESCRIPTIONS = {
  'allow': 'Allow the action to proceed normally',
  'deny': 'Block the action and prevent execution',
  'log': 'Allow but log the action for review',
  'alert': 'Allow the action but send an alert to administrators',
  'escalate': 'Escalate to human review before proceeding'
};

interface HorizontalPolicyWizardProps {
  onSave: (policy: SimplePolicy) => Promise<void>;
  onCancel?: () => void;
}

const HorizontalPolicyWizard: React.FC<HorizontalPolicyWizardProps> = ({
  onSave,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [policy, setPolicy] = useState<SimplePolicy>({
    name: '',
    type: '',
    description: '',
    rules: []
  });

  const steps = [
    'Policy Type',
    'Basic Information', 
    'Add Rules',
    'Review & Save'
  ];

  // Load template when selected
  useEffect(() => {
    if (selectedTemplate && POLICY_TEMPLATES[selectedTemplate as keyof typeof POLICY_TEMPLATES]) {
      const template = POLICY_TEMPLATES[selectedTemplate as keyof typeof POLICY_TEMPLATES];
      setPolicy({
        name: template.name,
        type: template.type,
        description: template.description,
        rules: template.rules
      });
    }
  }, [selectedTemplate]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSave = async () => {
    console.log('🚀 Save Policy button clicked!');
    console.log('📋 Current policy data:', JSON.stringify(policy, null, 2));
    
    setSaving(true);
    try {
      // Validation
      console.log('🔍 Starting validation...');
      
      if (!policy.name.trim()) {
        console.error('❌ Validation failed: Policy name is required');
        toast({
          title: "Validation Error",
          description: "Policy name is required",
          variant: "destructive"
        });
        return;
      }

      if (!policy.description.trim()) {
        console.error('❌ Validation failed: Policy description is required');
        toast({
          title: "Validation Error", 
          description: "Policy description is required",
          variant: "destructive"
        });
        return;
      }

      if (policy.rules.length === 0) {
        console.error('❌ Validation failed: At least one rule is required');
        toast({
          title: "Validation Error",
          description: "At least one rule is required",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Validation passed!');
      console.log('📞 Calling onSave function...');
      
      if (onSave) {
        console.log('🔄 Executing onSave callback...');
        await onSave(policy);
        console.log('✅ onSave callback completed successfully!');
      } else {
        console.error('❌ onSave function is not provided!');
        throw new Error('onSave function is not provided');
      }

      console.log('🎉 Policy save completed successfully!');
      toast({
        title: "Success",
        description: "Policy created successfully!",
        variant: "default"
      });

    } catch (error) {
      console.error('💥 Error saving policy:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast({
        title: "Error",
        description: `Failed to save policy: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      console.log('🏁 Setting saving to false...');
      setSaving(false);
    }
  };

  const addRule = () => {
    const newRule: SimpleRule = {
      id: `rule-${Date.now()}`,
      name: '',
      condition: 'contains_pii',
      action: 'alert',
      description: ''
    };
    setPolicy(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  };

  const updateRule = (ruleId: string, updates: Partial<SimpleRule>) => {
    setPolicy(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  };

  const deleteRule = (ruleId: string) => {
    setPolicy(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return !!selectedTemplate;
      case 1: return policy.name.trim() && policy.description.trim();
      case 2: return policy.rules.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              What type of policy do you want to create?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Choose a template to get started quickly, or select "Custom" to build from scratch.
            </Typography>

            <Grid container spacing={3}>
              {Object.entries(POLICY_TEMPLATES).map(([key, template]) => {
                const IconComponent = template.icon;
                return (
                  <Grid item xs={12} md={4} key={key}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedTemplate === key ? 2 : 1,
                        borderColor: selectedTemplate === key ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => setSelectedTemplate(key)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <IconComponent sx={{ color: template.color, mr: 1 }} />
                          <Typography variant="h6">{template.name}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.rules.length} pre-configured rules
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}

              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTemplate === 'CUSTOM' ? 2 : 1,
                    borderColor: selectedTemplate === 'CUSTOM' ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => setSelectedTemplate('CUSTOM')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AddIcon sx={{ color: '#9c27b0', mr: 1 }} />
                      <Typography variant="h6">Custom Policy</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Start from scratch and build your own custom policy rules
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Build your own rules
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Basic Policy Information
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Give your policy a clear name and description so others can understand its purpose.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Policy Name"
                  value={policy.name}
                  onChange={(e) => setPolicy(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Customer Data Protection Policy"
                  helperText="Choose a descriptive name that clearly identifies this policy"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={policy.description}
                  onChange={(e) => setPolicy(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Explain the purpose and scope of this policy in simple terms"
                  helperText="Explain the purpose and scope of this policy in simple terms"
                />
              </Grid>

              {selectedTemplate && selectedTemplate !== 'CUSTOM' && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<TipIcon />}>
                    <Typography variant="body2">
                      <strong>Template Selected:</strong> {POLICY_TEMPLATES[selectedTemplate as keyof typeof POLICY_TEMPLATES].name}
                      <br />
                      We've pre-filled some information based on your template choice. You can modify anything you'd like.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Policy Rules
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Rules define what actions to take in different situations. Each rule has a condition (when to trigger) and an action (what to do).
            </Typography>

            {policy.rules.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  No rules added yet. Click "Add Rule" to create your first rule, or go back to select a template with pre-configured rules.
                </Typography>
              </Alert>
            )}

            {policy.rules.map((rule, index) => (
              <Card key={rule.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Rule {index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => deleteRule(rule.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Rule Name"
                        value={rule.name}
                        onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                        placeholder="e.g., Block Personal Information"
                        helperText="Give this rule a clear, descriptive name"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>When should this rule trigger?</InputLabel>
                        <Select
                          value={rule.condition}
                          onChange={(e) => updateRule(rule.id, { condition: e.target.value })}
                        >
                          {Object.entries(COMMON_CONDITIONS).map(([value, description]) => (
                            <MenuItem key={value} value={value}>
                              <Box>
                                <Typography variant="body2">{description}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>What action should be taken?</InputLabel>
                        <Select
                          value={rule.action}
                          onChange={(e) => updateRule(rule.id, { action: e.target.value as any })}
                        >
                          {Object.entries(ACTION_DESCRIPTIONS).map(([value, description]) => (
                            <MenuItem key={value} value={value}>
                              <Box>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {description}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Description (Optional)"
                        value={rule.description}
                        onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                        placeholder="Explain why this rule is important..."
                        helperText="Optional: Provide additional context about this rule"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addRule}
              sx={{ mt: 2 }}
            >
              Add Rule
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Review Your Policy
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Review your policy details before saving. You can always edit it later.
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {policy.name || 'Untitled Policy'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Type: {policy.type}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {policy.description || 'No description provided'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Rules ({policy.rules.length})
                </Typography>
                
                {policy.rules.map((rule, index) => (
                  <Box key={rule.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {index + 1}. {rule.name || 'Untitled Rule'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      When: {COMMON_CONDITIONS[rule.condition as keyof typeof COMMON_CONDITIONS] || rule.condition}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Action: {rule.action.charAt(0).toUpperCase() + rule.action.slice(1)}
                    </Typography>
                    {rule.description && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {rule.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="body2">
                Your policy is ready to be saved! Once saved, it will be available for use in your governance system.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Policy Creation Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a governance policy for your AI system with guided steps and templates.
        </Typography>
      </Box>

      {/* Horizontal Stepper */}
      <Box sx={{ mb: 6 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="body2" color={index <= activeStep ? 'primary' : 'text.secondary'}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step Content */}
      <Box sx={{ mb: 6, minHeight: 400 }}>
        {renderStepContent()}
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<BackIcon />}
          size="large"
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {onCancel && (
            <Button onClick={onCancel} size="large">
              Cancel
            </Button>
          )}

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !canProceed()}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              size="large"
            >
              {saving ? 'Saving...' : 'Save Policy'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
              endIcon={<NextIcon />}
              size="large"
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default HorizontalPolicyWizard;

// Force deployment Thu Jul 24 17:51:35 EDT 2025
