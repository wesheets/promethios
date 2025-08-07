/**
 * Enhanced Policy Wizard
 * 
 * Advanced policy creation and management interface that works with
 * comprehensive compliance policies and enables enterprise custom policy creation.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore,
  Security,
  Gavel,
  Shield,
  Settings,
  CheckCircle,
  Warning,
  Info,
  Add,
  Delete,
  Edit
} from '@mui/icons-material';
import { unifiedPolicyRegistry, STANDARD_POLICY_IDS, PolicyContent, PolicyRule } from '../../services/UnifiedPolicyRegistry';
import { useAuth } from '../../hooks/useAuth';

interface EnhancedPolicyWizardProps {
  open: boolean;
  onClose: () => void;
  onPolicyCreated: (policy: PolicyContent) => void;
  editingPolicy?: PolicyContent | null;
}

interface PolicyFormData {
  name: string;
  description: string;
  category: 'compliance' | 'security' | 'privacy' | 'operational' | 'custom';
  legalFramework: string;
  jurisdiction: string[];
  baseTemplate?: string;
  customRules: PolicyRule[];
  enforcementLevel: 'strict' | 'standard' | 'lenient';
  organizationScope: string[];
  businessJustification: string;
}

const WIZARD_STEPS = [
  { id: 'template', title: 'Choose Template', description: 'Select a compliance template or start from scratch' },
  { id: 'details', title: 'Policy Details', description: 'Configure policy information and scope' },
  { id: 'rules', title: 'Rules & Enforcement', description: 'Customize rules and enforcement settings' },
  { id: 'review', title: 'Review & Deploy', description: 'Review and deploy your policy' }
];

const COMPLIANCE_FRAMEWORKS = [
  'HIPAA', 'SOX', 'GDPR', 'CCPA', 'PCI-DSS', 'ISO-27001', 'NIST', 'FedRAMP', 'Custom'
];

const JURISDICTIONS = [
  'US', 'EU', 'UK', 'Canada', 'Australia', 'Japan', 'Singapore', 'Global'
];

const ORGANIZATION_SCOPES = [
  'Healthcare', 'Financial Services', 'Technology', 'Manufacturing', 'Retail', 
  'Government', 'Education', 'Legal', 'Consulting', 'Other'
];

export const EnhancedPolicyWizard: React.FC<EnhancedPolicyWizardProps> = ({
  open,
  onClose,
  onPolicyCreated,
  editingPolicy
}) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PolicyFormData>({
    name: '',
    description: '',
    category: 'custom',
    legalFramework: '',
    jurisdiction: [],
    customRules: [],
    enforcementLevel: 'standard',
    organizationScope: [],
    businessJustification: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyContent | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<PolicyContent[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load available policy templates
  useEffect(() => {
    if (open) {
      const templates = unifiedPolicyRegistry.getActivePolicies();
      setAvailableTemplates(templates);
      
      // If editing, populate form
      if (editingPolicy) {
        setFormData({
          name: editingPolicy.name,
          description: editingPolicy.description,
          category: editingPolicy.category,
          legalFramework: editingPolicy.legalFramework,
          jurisdiction: editingPolicy.jurisdiction,
          customRules: [...editingPolicy.rules],
          enforcementLevel: 'standard',
          organizationScope: [],
          businessJustification: ''
        });
        setSelectedTemplate(editingPolicy);
      }
    }
  }, [open, editingPolicy]);

  const handleNext = () => {
    const errors = validateCurrentStep();
    if (errors.length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
      setValidationErrors([]);
    } else {
      setValidationErrors(errors);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setValidationErrors([]);
  };

  const validateCurrentStep = (): string[] => {
    const errors: string[] = [];
    
    switch (currentStep) {
      case 0: // Template selection
        // Template selection is optional
        break;
      case 1: // Policy details
        if (!formData.name.trim()) errors.push('Policy name is required');
        if (!formData.description.trim()) errors.push('Policy description is required');
        if (!formData.legalFramework.trim()) errors.push('Legal framework is required');
        if (formData.jurisdiction.length === 0) errors.push('At least one jurisdiction is required');
        break;
      case 2: // Rules
        if (formData.customRules.length === 0 && !selectedTemplate) {
          errors.push('At least one rule is required');
        }
        break;
    }
    
    return errors;
  };

  const handleTemplateSelect = (template: PolicyContent) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      name: `${template.name} - Custom`,
      description: `Custom policy based on ${template.name}`,
      category: template.category,
      legalFramework: template.legalFramework,
      jurisdiction: [...template.jurisdiction],
      customRules: [...template.rules]
    }));
  };

  const handleAddCustomRule = () => {
    const newRule: PolicyRule = {
      rule_id: `custom_rule_${Date.now()}`,
      name: 'New Custom Rule',
      description: 'Custom rule description',
      condition: 'custom_condition',
      action: 'alert',
      priority: 50,
      legalBasis: 'Organization policy',
      violationMessage: 'Custom rule violation',
      complianceMessage: 'Custom rule compliance',
      parameters: {}
    };
    
    setFormData(prev => ({
      ...prev,
      customRules: [...prev.customRules, newRule]
    }));
  };

  const handleEditRule = (index: number, updatedRule: PolicyRule) => {
    setFormData(prev => ({
      ...prev,
      customRules: prev.customRules.map((rule, i) => i === index ? updatedRule : rule)
    }));
  };

  const handleDeleteRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      const newPolicy: PolicyContent = {
        policy_id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        version: '1.0.0',
        status: 'active',
        category: formData.category,
        description: formData.description,
        legalFramework: formData.legalFramework,
        jurisdiction: formData.jurisdiction,
        summary: formData.description,
        purpose: `Custom policy for ${formData.organizationScope.join(', ')} operations`,
        scope: formData.businessJustification || 'Organization-specific requirements',
        rules: formData.customRules,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser?.uid || 'unknown',
        compliance_mappings: {
          [formData.legalFramework]: ['Custom_Policy']
        }
      };

      // Add to registry
      unifiedPolicyRegistry.addPolicy(newPolicy);
      
      // Notify parent
      onPolicyCreated(newPolicy);
      
      // Close wizard
      onClose();
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error creating policy:', error);
      setValidationErrors(['Failed to create policy. Please try again.']);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      legalFramework: '',
      jurisdiction: [],
      customRules: [],
      enforcementLevel: 'standard',
      organizationScope: [],
      businessJustification: ''
    });
    setSelectedTemplate(null);
    setCurrentStep(0);
    setValidationErrors([]);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Template Selection
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
              Choose a Compliance Template
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: '#a0aec0' }}>
              Start with a comprehensive compliance template or create a custom policy from scratch.
            </Typography>
            
            <Grid container spacing={3}>
              {availableTemplates.map((template) => (
                <Grid item xs={12} md={6} key={template.policy_id}>
                  <Card
                    sx={{
                      backgroundColor: selectedTemplate?.policy_id === template.policy_id ? '#2d3748' : '#1a202c',
                      border: selectedTemplate?.policy_id === template.policy_id ? '2px solid #3b82f6' : '1px solid #4a5568',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#3b82f6' }
                    }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h4">
                            {template.policy_id.includes('hipaa') ? '🏥' :
                             template.policy_id.includes('sox') ? '💰' :
                             template.policy_id.includes('gdpr') ? '🇪🇺' : '⚙️'}
                          </Typography>
                          <Box>
                            <Typography variant="h6" sx={{ color: 'white' }}>
                              {template.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                              {template.rules.length} comprehensive rules
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                        {template.summary}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Framework: {template.legalFramework}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {/* Custom from scratch option */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    backgroundColor: selectedTemplate === null ? '#2d3748' : '#1a202c',
                    border: selectedTemplate === null ? '2px solid #3b82f6' : '1px solid #4a5568',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#3b82f6' }
                  }}
                  onClick={() => setSelectedTemplate(null)}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4">🎯</Typography>
                        <Box>
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            Custom from Scratch
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Build your own policy
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      Create a completely custom policy tailored to your specific organizational needs.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Framework: Organization-specific
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // Policy Details
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
              Policy Configuration
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Policy Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { backgroundColor: '#2d3748', color: 'white' },
                    '& .MuiInputLabel-root': { color: '#a0aec0' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Policy Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { backgroundColor: '#2d3748', color: 'white' },
                    '& .MuiInputLabel-root': { color: '#a0aec0' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#a0aec0' }}>Legal Framework</InputLabel>
                  <Select
                    value={formData.legalFramework}
                    onChange={(e) => setFormData(prev => ({ ...prev, legalFramework: e.target.value }))}
                    sx={{ backgroundColor: '#2d3748', color: 'white' }}
                  >
                    {COMPLIANCE_FRAMEWORKS.map(framework => (
                      <MenuItem key={framework} value={framework}>{framework}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    sx={{ backgroundColor: '#2d3748', color: 'white' }}
                  >
                    <MenuItem value="compliance">Compliance</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="privacy">Privacy</MenuItem>
                    <MenuItem value="operational">Operational</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#a0aec0' }}>Jurisdictions</InputLabel>
                  <Select
                    multiple
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData(prev => ({ ...prev, jurisdiction: e.target.value as string[] }))}
                    sx={{ backgroundColor: '#2d3748', color: 'white' }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {JURISDICTIONS.map(jurisdiction => (
                      <MenuItem key={jurisdiction} value={jurisdiction}>{jurisdiction}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Business Justification"
                  value={formData.businessJustification}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessJustification: e.target.value }))}
                  placeholder="Explain why this policy is needed for your organization..."
                  sx={{ 
                    '& .MuiOutlinedInput-root': { backgroundColor: '#2d3748', color: 'white' },
                    '& .MuiInputLabel-root': { color: '#a0aec0' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2: // Rules & Enforcement
        return (
          <Box sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                Policy Rules ({formData.customRules.length})
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={handleAddCustomRule}
                sx={{ color: '#3b82f6' }}
              >
                Add Custom Rule
              </Button>
            </Box>
            
            {formData.customRules.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                {selectedTemplate 
                  ? `This policy will inherit ${selectedTemplate.rules.length} rules from the ${selectedTemplate.name} template.`
                  : 'Add custom rules to define your policy enforcement.'
                }
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {formData.customRules.map((rule, index) => (
                  <Accordion key={rule.rule_id} sx={{ backgroundColor: '#2d3748', mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="subtitle1" sx={{ color: 'white', flex: 1 }}>
                          {rule.name}
                        </Typography>
                        <Chip 
                          label={rule.action} 
                          size="small" 
                          color={rule.action === 'deny' ? 'error' : rule.action === 'alert' ? 'warning' : 'info'}
                        />
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRule(index);
                          }}
                          sx={{ color: '#f56565', minWidth: 'auto' }}
                        >
                          <Delete fontSize="small" />
                        </Button>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Rule Name"
                            value={rule.name}
                            onChange={(e) => handleEditRule(index, { ...rule, name: e.target.value })}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { backgroundColor: '#1a202c', color: 'white' },
                              '& .MuiInputLabel-root': { color: '#a0aec0' }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Description"
                            value={rule.description}
                            onChange={(e) => handleEditRule(index, { ...rule, description: e.target.value })}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { backgroundColor: '#1a202c', color: 'white' },
                              '& .MuiInputLabel-root': { color: '#a0aec0' }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel sx={{ color: '#a0aec0' }}>Action</InputLabel>
                            <Select
                              value={rule.action}
                              onChange={(e) => handleEditRule(index, { ...rule, action: e.target.value as any })}
                              sx={{ backgroundColor: '#1a202c', color: 'white' }}
                            >
                              <MenuItem value="allow">Allow</MenuItem>
                              <MenuItem value="deny">Deny</MenuItem>
                              <MenuItem value="log">Log</MenuItem>
                              <MenuItem value="alert">Alert</MenuItem>
                              <MenuItem value="escalate">Escalate</MenuItem>
                              <MenuItem value="redact">Redact</MenuItem>
                              <MenuItem value="encrypt">Encrypt</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Priority"
                            value={rule.priority}
                            onChange={(e) => handleEditRule(index, { ...rule, priority: parseInt(e.target.value) })}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { backgroundColor: '#1a202c', color: 'white' },
                              '& .MuiInputLabel-root': { color: '#a0aec0' }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                Enforcement Level
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.enforcementLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, enforcementLevel: e.target.value as any }))}
                  sx={{ backgroundColor: '#2d3748', color: 'white' }}
                >
                  <MenuItem value="strict">Strict - Block violations immediately</MenuItem>
                  <MenuItem value="standard">Standard - Alert and log violations</MenuItem>
                  <MenuItem value="lenient">Lenient - Log violations only</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        );

      case 3: // Review & Deploy
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
              Review Your Policy
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748' }}>
                  <CardHeader
                    title={<Typography variant="h6" sx={{ color: 'white' }}>Policy Details</Typography>}
                  />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Name"
                          secondary={formData.name}
                          sx={{ '& .MuiListItemText-primary': { color: '#a0aec0' }, '& .MuiListItemText-secondary': { color: 'white' } }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Framework"
                          secondary={formData.legalFramework}
                          sx={{ '& .MuiListItemText-primary': { color: '#a0aec0' }, '& .MuiListItemText-secondary': { color: 'white' } }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Jurisdictions"
                          secondary={formData.jurisdiction.join(', ')}
                          sx={{ '& .MuiListItemText-primary': { color: '#a0aec0' }, '& .MuiListItemText-secondary': { color: 'white' } }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Enforcement"
                          secondary={formData.enforcementLevel}
                          sx={{ '& .MuiListItemText-primary': { color: '#a0aec0' }, '& .MuiListItemText-secondary': { color: 'white' } }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748' }}>
                  <CardHeader
                    title={<Typography variant="h6" sx={{ color: 'white' }}>Rules Summary</Typography>}
                  />
                  <CardContent>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      Total Rules: {formData.customRules.length}
                      {selectedTemplate && ` (+ ${selectedTemplate.rules.length} from template)`}
                    </Typography>
                    
                    {formData.customRules.slice(0, 3).map((rule, index) => (
                      <Box key={rule.rule_id} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {rule.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#718096' }}>
                          Action: {rule.action} | Priority: {rule.priority}
                        </Typography>
                      </Box>
                    ))}
                    
                    {formData.customRules.length > 3 && (
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        ... and {formData.customRules.length - 3} more rules
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Alert severity="success" sx={{ mt: 3, backgroundColor: '#065f46', color: 'white' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Ready to Deploy
              </Typography>
              <Typography variant="body2">
                Your policy is configured and ready to be deployed. It will be immediately available for assignment to agents.
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
      <DialogTitle>
        <Typography variant="h5" sx={{ color: 'white' }}>
          {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1 }}>
          {WIZARD_STEPS[currentStep].description}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {WIZARD_STEPS.map((step) => (
            <Step key={step.id}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { color: '#a0aec0' } }}>
                {step.title}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Please fix the following errors:</Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: '#a0aec0' }}>
          Cancel
        </Button>
        
        {currentStep > 0 && (
          <Button onClick={handlePrevious} sx={{ color: '#3b82f6' }}>
            Previous
          </Button>
        )}
        
        {currentStep < WIZARD_STEPS.length - 1 ? (
          <Button onClick={handleNext} variant="contained" sx={{ backgroundColor: '#3b82f6' }}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#10b981' }}>
            {editingPolicy ? 'Update Policy' : 'Create Policy'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

