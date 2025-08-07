/**
 * Policy Wizard Integration Component
 * 
 * Bridges the existing PolicyWizard UI components with the new PolicyExtension backend
 * to enable enterprise custom policy creation through the existing UI.
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
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Business as EnterpriseIcon,
  Security as SecurityIcon,
  Gavel as ComplianceIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import { policyExtension, type EnterprisePolicy, type EnterprisePolicyRule } from '../../extensions/PolicyExtension';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/use-auth';

interface PolicyWizardIntegrationProps {
  onPolicyCreated?: (policy: EnterprisePolicy) => void;
  onCancel?: () => void;
  existingPolicy?: EnterprisePolicy;
  mode?: 'create' | 'edit';
}

// Enterprise-specific policy templates
const ENTERPRISE_TEMPLATES = {
  HEALTHCARE: {
    name: 'Healthcare Data Protection (HIPAA)',
    description: 'HIPAA-compliant policies for healthcare organizations',
    complianceFrameworks: ['HIPAA', 'SOC2'],
    rules: [
      {
        name: 'PHI Access Control',
        condition: 'interaction.type == "data_access" && data.contains("PHI")',
        action: 'escalate' as const,
        description: 'Escalate any access to Protected Health Information',
        businessJustification: 'HIPAA Section 164.308(a)(4) - Information Access Management'
      },
      {
        name: 'Audit Trail Requirement',
        condition: 'interaction.type == "data_modification"',
        action: 'log' as const,
        description: 'Log all data modifications for audit compliance',
        businessJustification: 'HIPAA Section 164.312(b) - Audit Controls'
      }
    ]
  },
  FINANCIAL: {
    name: 'Financial Services Compliance',
    description: 'SOX and financial regulation compliance policies',
    complianceFrameworks: ['SOX', 'SOC2', 'PCI_DSS'],
    rules: [
      {
        name: 'Financial Data Protection',
        condition: 'data.contains("financial_data") || data.contains("PII")',
        action: 'deny' as const,
        description: 'Block unauthorized access to financial or personal data',
        businessJustification: 'SOX Section 404 - Internal Controls'
      },
      {
        name: 'Transaction Monitoring',
        condition: 'interaction.type == "transaction"',
        action: 'log' as const,
        description: 'Monitor all financial transactions',
        businessJustification: 'Anti-Money Laundering (AML) requirements'
      }
    ]
  },
  MANUFACTURING: {
    name: 'Manufacturing & Industrial Safety',
    description: 'Safety and operational policies for manufacturing',
    complianceFrameworks: ['ISO_27001', 'OSHA'],
    rules: [
      {
        name: 'Safety Protocol Enforcement',
        condition: 'interaction.involves("safety_equipment") || interaction.involves("hazardous_materials")',
        action: 'escalate' as const,
        description: 'Escalate any safety-related decisions',
        businessJustification: 'OSHA General Duty Clause - Section 5(a)(1)'
      },
      {
        name: 'Quality Control Monitoring',
        condition: 'interaction.type == "quality_check"',
        action: 'log' as const,
        description: 'Log all quality control activities',
        businessJustification: 'ISO 9001 Quality Management Standards'
      }
    ]
  }
};

const COMPLIANCE_FRAMEWORKS = [
  { value: 'HIPAA', label: 'HIPAA (Healthcare)' },
  { value: 'SOC2', label: 'SOC 2 (Security)' },
  { value: 'GDPR', label: 'GDPR (Privacy)' },
  { value: 'SOX', label: 'Sarbanes-Oxley (Financial)' },
  { value: 'PCI_DSS', label: 'PCI DSS (Payment Card)' },
  { value: 'ISO_27001', label: 'ISO 27001 (Information Security)' },
  { value: 'OSHA', label: 'OSHA (Workplace Safety)' },
  { value: 'CCPA', label: 'CCPA (California Privacy)' }
];

const PolicyWizardIntegration: React.FC<PolicyWizardIntegrationProps> = ({
  onPolicyCreated,
  onCancel,
  existingPolicy,
  mode = 'create'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Policy state
  const [policy, setPolicy] = useState<Partial<EnterprisePolicy>>({
    name: '',
    description: '',
    category: '',
    complianceFrameworks: [],
    rules: [],
    deploymentStatus: 'draft',
    approvalWorkflow: {
      requiredApprovers: [],
      currentApprovers: [],
      approvalStatus: 'pending'
    }
  });

  // UI state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [enableEnterpriseFeatures, setEnableEnterpriseFeatures] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (existingPolicy && mode === 'edit') {
      setPolicy(existingPolicy);
    }
  }, [existingPolicy, mode]);

  const handleTemplateSelect = (templateKey: string) => {
    const template = ENTERPRISE_TEMPLATES[templateKey as keyof typeof ENTERPRISE_TEMPLATES];
    if (template) {
      setSelectedTemplate(templateKey);
      setPolicy(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
        complianceFrameworks: template.complianceFrameworks,
        rules: template.rules.map((rule, index) => ({
          rule_id: `rule_${Date.now()}_${index}`,
          name: rule.name,
          condition: rule.condition,
          action: rule.action,
          description: rule.description,
          businessJustification: rule.businessJustification,
          enterpriseId: `enterprise_${user?.uid}`,
          canBeOverridden: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as EnterprisePolicyRule))
      }));
    }
  };

  const handleAddCustomRule = () => {
    const newRule: EnterprisePolicyRule = {
      rule_id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'New Custom Rule',
      condition: 'interaction.type == "custom"',
      action: 'log',
      description: 'Custom enterprise rule',
      enterpriseId: `enterprise_${user?.uid}`,
      canBeOverridden: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setPolicy(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newRule]
    }));
  };

  const handleRuleUpdate = (ruleId: string, updates: Partial<EnterprisePolicyRule>) => {
    setPolicy(prev => ({
      ...prev,
      rules: prev.rules?.map(rule => 
        rule.rule_id === ruleId 
          ? { ...rule, ...updates, updated_at: new Date().toISOString() }
          : rule
      ) || []
    }));
  };

  const handleSavePolicy = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create policies',
        variant: 'destructive'
      });
      return;
    }

    if (!policy.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Policy name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!policy.rules || policy.rules.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one rule is required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Set current user context
      policyExtension.setCurrentUser(user);

      let savedPolicy: EnterprisePolicy;
      
      if (mode === 'create') {
        // Create new enterprise policy using PolicyExtension
        savedPolicy = await policyExtension.createEnterprisePolicy({
          ...policy,
          organizationId: user.uid,
          enterpriseId: `enterprise_${user.uid}`
        });
      } else {
        // Update existing policy
        savedPolicy = await policyExtension.updateEnterprisePolicy(
          existingPolicy!.policy_id,
          policy
        );
      }

      toast({
        title: 'Success',
        description: `Enterprise policy ${mode === 'create' ? 'created' : 'updated'} successfully`,
        variant: 'default'
      });

      if (onPolicyCreated) {
        onPolicyCreated(savedPolicy);
      }

    } catch (error) {
      console.error('Error saving enterprise policy:', error);
      toast({
        title: 'Error',
        description: `Failed to ${mode === 'create' ? 'create' : 'update'} enterprise policy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderEnterpriseFeatures = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EnterpriseIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Enterprise Policy Features</Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={enableEnterpriseFeatures}
              onChange={(e) => setEnableEnterpriseFeatures(e.target.checked)}
            />
          }
          label="Enable Enterprise Features (Custom policies, compliance frameworks, approval workflows)"
        />

        {enableEnterpriseFeatures && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Enterprise features allow you to create custom policies that work alongside Promethios governance,
              with support for compliance frameworks, approval workflows, and organizational scoping.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Compliance Frameworks</InputLabel>
                  <Select
                    multiple
                    value={policy.complianceFrameworks || []}
                    onChange={(e) => setPolicy(prev => ({
                      ...prev,
                      complianceFrameworks: e.target.value as string[]
                    }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {COMPLIANCE_FRAMEWORKS.map((framework) => (
                      <MenuItem key={framework.value} value={framework.value}>
                        {framework.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department Scope</InputLabel>
                  <Select
                    value={policy.departmentId || ''}
                    onChange={(e) => setPolicy(prev => ({
                      ...prev,
                      departmentId: e.target.value
                    }))}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    <MenuItem value="engineering">Engineering</MenuItem>
                    <MenuItem value="finance">Finance</MenuItem>
                    <MenuItem value="hr">Human Resources</MenuItem>
                    <MenuItem value="legal">Legal</MenuItem>
                    <MenuItem value="operations">Operations</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderTemplateSelection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Choose Enterprise Policy Template
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Start with a pre-built template for your industry or create a custom policy from scratch.
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(ENTERPRISE_TEMPLATES).map(([key, template]) => (
            <Grid item xs={12} md={4} key={key}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedTemplate === key ? 2 : 1,
                  borderColor: selectedTemplate === key ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => handleTemplateSelect(key)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontSize="1rem">
                      {template.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {template.complianceFrameworks.map((framework) => (
                      <Chip 
                        key={framework} 
                        label={framework} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPolicyBasics = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Policy Information
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Policy Name"
              value={policy.name || ''}
              onChange={(e) => setPolicy(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Healthcare Data Protection Policy"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={policy.category || ''}
                onChange={(e) => setPolicy(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
                <MenuItem value="operational">Operational</MenuItem>
                <MenuItem value="ethical">Ethical</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={policy.description || ''}
              onChange={(e) => setPolicy(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and scope of this policy..."
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderRules = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Policy Rules</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddCustomRule}
            variant="outlined"
          >
            Add Custom Rule
          </Button>
        </Box>

        {policy.rules && policy.rules.length > 0 ? (
          policy.rules.map((rule, index) => (
            <Accordion key={rule.rule_id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ flexGrow: 1 }}>{rule.name}</Typography>
                  <Chip 
                    label={rule.action} 
                    size="small" 
                    color={rule.action === 'deny' ? 'error' : rule.action === 'escalate' ? 'warning' : 'default'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Rule Name"
                      value={rule.name}
                      onChange={(e) => handleRuleUpdate(rule.rule_id, { name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Action</InputLabel>
                      <Select
                        value={rule.action}
                        onChange={(e) => handleRuleUpdate(rule.rule_id, { action: e.target.value as any })}
                      >
                        <MenuItem value="allow">Allow</MenuItem>
                        <MenuItem value="deny">Deny</MenuItem>
                        <MenuItem value="log">Log</MenuItem>
                        <MenuItem value="alert">Alert</MenuItem>
                        <MenuItem value="escalate">Escalate</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Condition"
                      value={rule.condition}
                      onChange={(e) => handleRuleUpdate(rule.rule_id, { condition: e.target.value })}
                      placeholder="e.g., interaction.type == 'data_access'"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Description"
                      value={rule.description || ''}
                      onChange={(e) => handleRuleUpdate(rule.rule_id, { description: e.target.value })}
                    />
                  </Grid>
                  {enableEnterpriseFeatures && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Business Justification"
                        value={(rule as EnterprisePolicyRule).businessJustification || ''}
                        onChange={(e) => handleRuleUpdate(rule.rule_id, { businessJustification: e.target.value })}
                        placeholder="e.g., Required by HIPAA Section 164.308(a)(4)"
                      />
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Alert severity="info">
            No rules defined yet. Add rules using the templates above or create custom rules.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h4" gutterBottom>
          🏢 Enterprise Policy Creator
        </Typography>
        <Typography variant="body1">
          Create custom governance policies that work alongside Promethios governance.
          Enterprise policies can enforce compliance requirements, business rules, and organizational standards.
        </Typography>
      </Paper>

      {renderEnterpriseFeatures()}
      {enableEnterpriseFeatures && renderTemplateSelection()}
      {renderPolicyBasics()}
      {renderRules()}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        {onCancel && (
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSavePolicy}
          variant="contained"
          startIcon={saving ? undefined : <SaveIcon />}
          disabled={saving || !policy.name?.trim() || !policy.rules?.length}
        >
          {saving ? 'Saving...' : `${mode === 'create' ? 'Create' : 'Update'} Enterprise Policy`}
        </Button>
      </Box>
    </Box>
  );
};

export default PolicyWizardIntegration;

