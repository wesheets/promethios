/**
 * Simplified Policy Creation Wizard
 * 
 * A user-friendly, step-by-step interface for creating governance policies
 * with guided templates, common dropdowns, and clear instructions.
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
  Chip,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Divider,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as ComplianceIcon,
  Shield as ContentIcon,
  Psychology as EthicalIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Info as TipIcon
} from '@mui/icons-material';
import PolicyWizardNavigation from './PolicyWizardNavigation';
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

import { unifiedPolicyRegistry, STANDARD_POLICY_IDS } from '../../services/UnifiedPolicyRegistry';

// Policy templates for quick start - now connected to comprehensive policies
const getEnhancedPolicyTemplates = () => {
  const hipaaPolicy = unifiedPolicyRegistry.getPolicy(STANDARD_POLICY_IDS.HIPAA);
  const soxPolicy = unifiedPolicyRegistry.getPolicy(STANDARD_POLICY_IDS.SOX);
  const gdprPolicy = unifiedPolicyRegistry.getPolicy(STANDARD_POLICY_IDS.GDPR);

  return {
    SECURITY: {
      name: 'Basic Security Policy',
      icon: SecurityIcon,
      color: '#f44336',
      description: 'Protect against common security threats and data breaches',
      rules: [
        {
          id: '1',
          name: 'Block Personal Information',
          condition: 'contains_personal_info',
          action: 'alert' as const,
          description: 'Alert when personal information like SSN, credit cards, or addresses are detected'
        },
        {
          id: '2', 
          name: 'Block Low Trust Content',
          condition: 'trust_score_low',
          action: 'deny' as const,
          description: 'Block responses that have low trust or confidence scores'
        }
      ]
    },
    COMPLIANCE: {
      name: 'Comprehensive Compliance Policy',
      icon: ComplianceIcon,
      color: '#2196f3',
      description: `Enterprise-grade compliance with ${hipaaPolicy?.rules.length || 17} HIPAA, ${soxPolicy?.rules.length || 15} SOX, and ${gdprPolicy?.rules.length || 25} GDPR rules`,
      comprehensive: true,
      availablePolicies: [
        {
          id: STANDARD_POLICY_IDS.HIPAA,
          name: hipaaPolicy?.name || 'HIPAA Compliance',
          description: hipaaPolicy?.summary || 'Healthcare data protection',
          ruleCount: hipaaPolicy?.rules.length || 17,
          framework: hipaaPolicy?.legalFramework || 'HIPAA'
        },
        {
          id: STANDARD_POLICY_IDS.SOX,
          name: soxPolicy?.name || 'SOX Compliance',
          description: soxPolicy?.summary || 'Financial reporting controls',
          ruleCount: soxPolicy?.rules.length || 15,
          framework: soxPolicy?.legalFramework || 'Sarbanes-Oxley Act'
        },
        {
          id: STANDARD_POLICY_IDS.GDPR,
          name: gdprPolicy?.name || 'GDPR Compliance',
          description: gdprPolicy?.summary || 'EU data protection',
          ruleCount: gdprPolicy?.rules.length || 25,
          framework: gdprPolicy?.legalFramework || 'GDPR'
        }
      ],
      rules: [
        {
          id: '1',
          name: 'Comprehensive Healthcare Compliance',
          condition: 'healthcare_data_detected',
          action: 'escalate' as const,
          description: `Apply all ${hipaaPolicy?.rules.length || 17} HIPAA rules for healthcare data protection`
        },
        {
          id: '2',
          name: 'Financial Reporting Controls',
          condition: 'financial_data_detected',
          action: 'log' as const,
          description: `Apply all ${soxPolicy?.rules.length || 15} SOX rules for financial data integrity`
        },
        {
          id: '3',
          name: 'Personal Data Protection',
          condition: 'personal_data_detected',
          action: 'alert' as const,
          description: `Apply all ${gdprPolicy?.rules.length || 25} GDPR rules for personal data protection`
        }
      ]
    },
    CONTENT: {
      name: 'Content Safety Policy',
      icon: EthicalIcon,
      color: '#9c27b0',
      description: 'Ensure AI responses are safe, appropriate, and unbiased',
      rules: [
        {
          id: '1',
          name: 'Block Harmful Content',
          condition: 'contains_harmful_content',
          action: 'deny' as const,
          description: 'Block responses containing violence, hate speech, or inappropriate content'
        },
        {
          id: '2',
          name: 'Check for Bias',
          condition: 'potential_bias_detected',
          action: 'alert' as const,
          description: 'Alert when responses might contain bias or discrimination'
        }
      ]
    }
  };
};

const POLICY_TEMPLATES = getEnhancedPolicyTemplates();

// Common conditions with user-friendly descriptions
const COMMON_CONDITIONS = {
  // Security conditions
  'contains_personal_info': 'Contains personal information (SSN, credit cards, addresses)',
  'trust_score_low': 'Response has low trust or confidence score',
  'contains_harmful_content': 'Contains harmful, violent, or inappropriate content',
  'potential_security_threat': 'Potential security threat detected',
  
  // Compliance conditions
  'accessing_sensitive_data': 'Accessing sensitive or protected data',
  'no_user_consent': 'User consent required but not provided',
  'data_retention_expired': 'Data retention period has expired',
  'unauthorized_access': 'User not authorized for this action',
  
  // Content conditions
  'potential_bias_detected': 'Potential bias or discrimination detected',
  'inappropriate_language': 'Inappropriate or offensive language',
  'misinformation_risk': 'Potential misinformation or false claims',
  'copyright_violation': 'Potential copyright or IP violation',
  
  // Performance conditions
  'response_time_slow': 'Response time is slower than expected',
  'high_error_rate': 'Error rate is higher than normal',
  'resource_usage_high': 'System resource usage is high'
};

// Action descriptions
const ACTION_DESCRIPTIONS = {
  'allow': 'Allow the action to proceed normally',
  'deny': 'Block the action and prevent it from happening',
  'log': 'Allow the action but record it for monitoring',
  'alert': 'Allow the action but send an alert to administrators',
  'escalate': 'Allow the action but escalate to human review'
};

interface SimplifiedPolicyWizardProps {
  onSave?: (policy: SimplePolicy) => void;
  onCancel?: () => void;
  initialPolicy?: SimplePolicy;
}

const SimplifiedPolicyWizard: React.FC<SimplifiedPolicyWizardProps> = ({
  onSave,
  onCancel,
  initialPolicy
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [policy, setPolicy] = useState<SimplePolicy>(
    initialPolicy || {
      name: '',
      type: '',
      description: '',
      rules: []
    }
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const steps = [
    {
      label: 'Choose Policy Type',
      description: 'Select what kind of policy you want to create'
    },
    {
      label: 'Basic Information',
      description: 'Give your policy a name and description'
    },
    {
      label: 'Add Rules',
      description: 'Define what actions should be taken in different situations'
    },
    {
      label: 'Review & Save',
      description: 'Review your policy and save it'
    }
  ];

  const handleTemplateSelect = (templateKey: string) => {
    const template = POLICY_TEMPLATES[templateKey as keyof typeof POLICY_TEMPLATES];
    setPolicy({
      name: template.name,
      type: templateKey,
      description: template.description,
      rules: template.rules
    });
    setSelectedTemplate(templateKey);
    setShowTemplateDialog(false);
    setActiveStep(1); // Skip to basic info step
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const addRule = () => {
    const newRule: SimpleRule = {
      id: Date.now().toString(),
      name: '',
      condition: '',
      action: 'log',
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate policy
      if (!policy.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a policy name',
          variant: 'destructive'
        });
        return;
      }

      if (!policy.type) {
        toast({
          title: 'Validation Error', 
          description: 'Please select a policy type',
          variant: 'destructive'
        });
        return;
      }

      if (policy.rules.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please add at least one rule',
          variant: 'destructive'
        });
        return;
      }

      // Check for incomplete rules
      const incompleteRules = policy.rules.filter(rule => 
        !rule.name.trim() || !rule.condition || !rule.action
      );

      if (incompleteRules.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'Please complete all rule fields',
          variant: 'destructive'
        });
        return;
      }

      if (onSave) {
        await onSave(policy);
      }

      toast({
        title: 'Success',
        description: 'Policy created successfully!',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save policy',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              What type of policy do you want to create?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose a template to get started quickly, or select "Custom" to build from scratch.
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(POLICY_TEMPLATES).map(([key, template]) => {
                const IconComponent = template.icon;
                return (
                  <Grid item xs={12} md={4} key={key}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedTemplate === key ? 2 : 1,
                        borderColor: selectedTemplate === key ? template.color : 'divider',
                        '&:hover': { borderColor: template.color }
                      }}
                      onClick={() => handleTemplateSelect(key)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <IconComponent sx={{ color: template.color, mr: 1 }} />
                          <Typography variant="h6">{template.name}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
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
                    border: selectedTemplate === 'custom' ? 2 : 1,
                    borderColor: selectedTemplate === 'custom' ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => {
                    setPolicy({ name: '', type: 'CUSTOM', description: '', rules: [] });
                    setSelectedTemplate('custom');
                    setActiveStep(1);
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AddIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="h6">Custom Policy</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Start from scratch and build your own custom policy rules
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
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
            <Typography variant="h6" gutterBottom>
              Basic Policy Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
                  rows={3}
                  label="Description"
                  value={policy.description}
                  onChange={(e) => setPolicy(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this policy does and why it's important..."
                  helperText="Explain the purpose and scope of this policy in simple terms"
                />
              </Grid>

              {selectedTemplate && selectedTemplate !== 'custom' && (
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
            <Typography variant="h6" gutterBottom>
              Policy Rules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
            <Typography variant="h6" gutterBottom>
              Review Your Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New Policy
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Follow these simple steps to create a governance policy for your AI system.
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography variant="h6">{step.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
            <StepContent>
              {renderStepContent(index)}
              
              {/* Force render navigation buttons - always visible */}
              <Paper sx={{ mt: 3, p: 3, bgcolor: 'primary.light', borderRadius: 2 }} elevation={3}>
                <Typography variant="body2" color="primary.contrastText" sx={{ mb: 2, fontWeight: 'bold' }}>
                  🔧 Navigation Controls (Step {index + 1} of {steps.length})
                </Typography>
                
                <Typography variant="caption" color="primary.contrastText" sx={{ mb: 2, display: 'block' }}>
                  Active Step: {activeStep} | Policy: "{policy.name || 'No name'}" | Rules: {policy.rules.length} | Template: {selectedTemplate || 'None'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleSave}
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      size="large"
                    >
                      {saving ? 'Saving Policy...' : 'Save Policy'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleNext}
                      disabled={
                        (index === 0 && !selectedTemplate) ||
                        (index === 1 && (!policy.name.trim() || !policy.description.trim()))
                      }
                      size="large"
                    >
                      Continue to Next Step
                    </Button>
                  )}
                  
                  {index > 0 && (
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      onClick={handleBack}
                      size="large"
                    >
                      Back
                    </Button>
                  )}
                  
                  {onCancel && (
                    <Button 
                      variant="text" 
                      color="secondary"
                      onClick={onCancel}
                      size="large"
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
                
                {/* Validation status */}
                <Typography variant="caption" color="primary.contrastText" sx={{ mt: 2, display: 'block' }}>
                  {index === 0 && !selectedTemplate && "⚠️ Please select a template to continue"}
                  {index === 1 && (!policy.name.trim() || !policy.description.trim()) && "⚠️ Please fill in policy name and description"}
                  {index === 2 && policy.rules.length === 0 && "⚠️ Please add at least one rule"}
                  {((index === 0 && selectedTemplate) || 
                    (index === 1 && policy.name.trim() && policy.description.trim()) || 
                    (index === 2 && policy.rules.length > 0) ||
                    (index === 3)) && "✅ Ready to proceed"}
                </Typography>
              </Paper>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Standalone Navigation - Always Visible */}
      <PolicyWizardNavigation
        currentStep={activeStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onBack={handleBack}
        onSave={handleSave}
        onCancel={onCancel}
        saving={saving}
        canProceed={
          (activeStep === 0 && !!selectedTemplate) ||
          (activeStep === 1 && policy.name.trim() && policy.description.trim()) ||
          (activeStep === 2 && policy.rules.length > 0) ||
          (activeStep === 3)
        }
        policyName={policy.name}
        rulesCount={policy.rules.length}
        selectedTemplate={selectedTemplate}
        validationMessage={
          activeStep === 0 && !selectedTemplate ? "⚠️ Please select a template to continue" :
          activeStep === 1 && (!policy.name.trim() || !policy.description.trim()) ? "⚠️ Please fill in policy name and description" :
          activeStep === 2 && policy.rules.length === 0 ? "⚠️ Please add at least one rule" :
          "✅ Ready to proceed"
        }
      />
    </Box>
  );
};

export default SimplifiedPolicyWizard;

