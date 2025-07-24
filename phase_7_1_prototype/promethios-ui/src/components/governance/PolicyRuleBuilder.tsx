import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  LinearProgress
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../theme/darkTheme';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  PlayArrow as TestIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Lightbulb as SuggestionIcon,
  Psychology as AIIcon,
  Timeline as AnalyticsIcon,
  Security as SecurityIcon,
  Gavel as ComplianceIcon,
  Settings as OperationalIcon,
  Settings as SettingsIcon,
  Balance as EthicalIcon,
  Article as LegalIcon,
  SmartToy as NLIcon,
  TrendingUp as OptimizeIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useToast } from '../../hooks/use-toast';
import { prometheiosPolicyAPI } from '../../services/api/prometheiosPolicyAPI';

// Promethios Policy Schema Interfaces (matching existing schema)
interface PrometheiosPolicyRule {
  rule_id: string;
  name?: string;
  description?: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert' | 'escalate';
  priority?: number;
  metadata?: {
    rationale?: string;
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

interface PrometheiosPolicy {
  policy_id: string;
  name: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  category?: string;
  description?: string;
  rules: PrometheiosPolicyRule[];
  metadata?: {
    owner?: string;
    compliance_mappings?: {
      [standard: string]: string[];
    };
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// Enhanced features interfaces
interface PolicyAnalytics {
  effectiveness_score: number;
  compliance_rate: number;
  violation_count: number;
  total_evaluations: number;
  avg_trust_score: number;
  trend_data: Array<{
    date: string;
    compliance_rate: number;
    violation_count: number;
    total_evaluations: number;
  }>;
}

interface PolicyOptimization {
  suggestions: Array<{
    type: 'rule_modification' | 'rule_addition' | 'rule_removal' | 'priority_adjustment';
    description: string;
    impact_score: number;
    confidence: number;
  }>;
  predicted_improvement: number;
  risk_assessment: 'low' | 'medium' | 'high';
}

interface PolicyConflict {
  rule_id_1: string;
  rule_id_2: string;
  conflict_type: 'contradiction' | 'redundancy' | 'priority_conflict';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution_suggestion: string;
}

// Policy type configurations
const POLICY_TYPE_CONFIGS = {
  SECURITY: {
    icon: SecurityIcon,
    color: '#f44336',
    description: 'Policies for security controls and threat protection',
    commonRules: [
      { condition: 'contains_pii', action: 'alert' as const, description: 'Detect PII in content' },
      { condition: 'trust_score < 70', action: 'deny' as const, description: 'Block low trust responses' },
      { condition: 'contains_malicious_content', action: 'deny' as const, description: 'Block malicious content' }
    ]
  },
  COMPLIANCE: {
    icon: ComplianceIcon,
    color: '#2196f3',
    description: 'Policies for regulatory and compliance requirements',
    commonRules: [
      { condition: 'data_classification == "sensitive"', action: 'log' as const, description: 'Log sensitive data access' },
      { condition: 'user_role != "authorized"', action: 'deny' as const, description: 'Restrict unauthorized access' },
      { condition: 'retention_period_exceeded', action: 'alert' as const, description: 'Data retention compliance' }
    ]
  },
  OPERATIONAL: {
    icon: OperationalIcon,
    color: '#ff9800',
    description: 'Policies for operational controls and procedures',
    commonRules: [
      { condition: 'response_time > 5000', action: 'alert' as const, description: 'Monitor response times' },
      { condition: 'error_rate > 0.05', action: 'escalate' as const, description: 'Escalate high error rates' },
      { condition: 'resource_usage > 80', action: 'log' as const, description: 'Monitor resource usage' }
    ]
  },
  ETHICAL: {
    icon: EthicalIcon,
    color: '#9c27b0',
    description: 'Policies for ethical AI behavior and fairness',
    commonRules: [
      { condition: 'bias_score > 0.3', action: 'alert' as const, description: 'Detect potential bias' },
      { condition: 'fairness_metric < 0.8', action: 'escalate' as const, description: 'Ensure fairness' },
      { condition: 'contains_discriminatory_content', action: 'deny' as const, description: 'Block discriminatory content' }
    ]
  },
  LEGAL: {
    icon: LegalIcon,
    color: '#607d8b',
    description: 'Policies for legal compliance and risk management',
    commonRules: [
      { condition: 'contains_legal_advice', action: 'escalate' as const, description: 'Escalate legal advice requests' },
      { condition: 'copyright_violation_detected', action: 'deny' as const, description: 'Prevent copyright violations' },
      { condition: 'jurisdiction_restricted', action: 'deny' as const, description: 'Respect jurisdiction restrictions' }
    ]
  }
};

interface PolicyRuleBuilderProps {
  policy?: PrometheiosPolicy;
  onSave?: (policy: PrometheiosPolicy) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit' | 'view';
}

const PolicyRuleBuilder: React.FC<PolicyRuleBuilderProps> = ({
  policy: initialPolicy,
  onSave,
  onCancel,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Policy state
  const [policy, setPolicy] = useState<PrometheiosPolicy>(() => ({
    policy_id: initialPolicy?.policy_id || `pol-${Date.now()}`,
    name: initialPolicy?.name || '',
    version: initialPolicy?.version || '1.0.0',
    status: initialPolicy?.status || 'draft',
    category: initialPolicy?.category || '',
    description: initialPolicy?.description || '',
    rules: initialPolicy?.rules || [],
    metadata: initialPolicy?.metadata || {
      owner: '',
      compliance_mappings: {},
      tags: []
    },
    created_at: initialPolicy?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: initialPolicy?.created_by || 'current_user',
    updated_by: 'current_user'
  }));

  // Enhanced features state
  const [analytics, setAnalytics] = useState<PolicyAnalytics | null>(null);
  const [optimization, setOptimization] = useState<PolicyOptimization | null>(null);
  const [conflicts, setConflicts] = useState<PolicyConflict[]>([]);
  const [nlDescription, setNlDescription] = useState('');
  const [generatingFromNL, setGeneratingFromNL] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Load analytics and optimization data
  useEffect(() => {
    if (policy.policy_id && mode !== 'create') {
      loadPolicyAnalytics();
      loadPolicyOptimization();
      detectConflicts();
    }
  }, [policy.policy_id, mode]);

  const loadPolicyAnalytics = async () => {
    try {
      const analyticsData = await prometheiosPolicyAPI.getPolicyAnalytics(policy.policy_id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load policy analytics:', error);
    }
  };

  const loadPolicyOptimization = async () => {
    try {
      const optimizationData = await prometheiosPolicyAPI.optimizePolicy(policy.policy_id);
      setOptimization(optimizationData);
    } catch (error) {
      console.error('Failed to load policy optimization:', error);
    }
  };

  const detectConflicts = async () => {
    try {
      const conflictData = await prometheiosPolicyAPI.detectConflicts(policy.policy_id);
      setConflicts(conflictData);
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    }
  };

  const generatePolicyFromNL = async () => {
    if (!nlDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description for the policy',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingFromNL(true);
    try {
      const generatedPolicy = await prometheiosPolicyAPI.generateFromNL({
        description: nlDescription,
        policy_type: policy.category || 'SECURITY',
        compliance_requirements: policy.metadata?.compliance_mappings ? Object.keys(policy.metadata.compliance_mappings) : [],
        context: policy.description || ''
      });

      setPolicy(prev => ({
        ...prev,
        name: generatedPolicy.name || prev.name,
        description: generatedPolicy.description || prev.description,
        rules: [...prev.rules, ...generatedPolicy.rules],
        metadata: {
          ...prev.metadata,
          ...generatedPolicy.metadata
        }
      }));

      toast({
        title: 'Success',
        description: 'Policy generated from natural language description',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate policy from description',
        variant: 'destructive'
      });
    } finally {
      setGeneratingFromNL(false);
    }
  };

  const testPolicy = async () => {
    setTesting(true);
    try {
      const results = await prometheiosPolicyAPI.testPolicy({
        policy,
        test_scenarios: [
          { input: 'Sample user input with PII: SSN 123-45-6789', expected_action: 'alert' },
          { input: 'Normal user query about weather', expected_action: 'allow' },
          { input: 'Potentially harmful content', expected_action: 'deny' }
        ]
      });
      setTestResults(results);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test policy',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const addRule = () => {
    const newRule: PrometheiosPolicyRule = {
      rule_id: `rule-${Date.now()}`,
      name: '',
      description: '',
      condition: '',
      action: 'log',
      priority: policy.rules.length + 1,
      metadata: {
        rationale: '',
        tags: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setPolicy(prev => ({
      ...prev,
      rules: [...prev.rules, newRule],
      updated_at: new Date().toISOString()
    }));
  };

  const updateRule = (ruleId: string, updates: Partial<PrometheiosPolicyRule>) => {
    setPolicy(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.rule_id === ruleId 
          ? { ...rule, ...updates, updated_at: new Date().toISOString() }
          : rule
      ),
      updated_at: new Date().toISOString()
    }));
  };

  const deleteRule = (ruleId: string) => {
    setPolicy(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.rule_id !== ruleId),
      updated_at: new Date().toISOString()
    }));
  };

  const addCommonRule = (commonRule: any) => {
    const newRule: PrometheiosPolicyRule = {
      rule_id: `rule-${Date.now()}`,
      name: commonRule.description,
      description: commonRule.description,
      condition: commonRule.condition,
      action: commonRule.action,
      priority: policy.rules.length + 1,
      metadata: {
        rationale: `Common rule for ${policy.category} policies`,
        tags: ['common', policy.category?.toLowerCase() || 'general']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setPolicy(prev => ({
      ...prev,
      rules: [...prev.rules, newRule],
      updated_at: new Date().toISOString()
    }));
  };

  const handleSave = async () => {
    if (!policy.name.trim()) {
      toast({
        title: 'Error',
        description: 'Policy name is required',
        variant: 'destructive'
      });
      return;
    }

    if (policy.rules.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one rule is required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      let savedPolicy;
      if (mode === 'create') {
        savedPolicy = await prometheiosPolicyAPI.createPolicy(policy);
      } else {
        savedPolicy = await prometheiosPolicyAPI.updatePolicy(policy.policy_id, policy);
      }

      toast({
        title: 'Success',
        description: `Policy ${mode === 'create' ? 'created' : 'updated'} successfully`,
        variant: 'default'
      });

      if (onSave) {
        onSave(savedPolicy);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${mode === 'create' ? 'create' : 'update'} policy`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(policy.rules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update priorities
    const updatedRules = items.map((rule, index) => ({
      ...rule,
      priority: index + 1,
      updated_at: new Date().toISOString()
    }));

    setPolicy(prev => ({
      ...prev,
      rules: updatedRules,
      updated_at: new Date().toISOString()
    }));
  };

  const renderBasicInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Basic Information
          <Tooltip title="Configure the basic policy information including name, type, and description">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Policy Name"
              value={policy.name}
              onChange={(e) => setPolicy(prev => ({ ...prev, name: e.target.value, updated_at: new Date().toISOString() }))}
              disabled={mode === 'view'}
              helperText="A descriptive name for this policy"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Policy Type</InputLabel>
              <Select
                value={policy.category || ''}
                onChange={(e) => setPolicy(prev => ({ ...prev, category: e.target.value, updated_at: new Date().toISOString() }))}
                disabled={mode === 'view'}
              >
                {Object.entries(POLICY_TYPE_CONFIGS).map(([type, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconComponent sx={{ color: config.color, fontSize: 20 }} />
                        {type}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={policy.status}
                onChange={(e) => setPolicy(prev => ({ ...prev, status: e.target.value as any, updated_at: new Date().toISOString() }))}
                disabled={mode === 'view'}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Version"
              value={policy.version}
              onChange={(e) => setPolicy(prev => ({ ...prev, version: e.target.value, updated_at: new Date().toISOString() }))}
              disabled={mode === 'view'}
              helperText="Semantic version (e.g., 1.0.0)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={policy.description}
              onChange={(e) => setPolicy(prev => ({ ...prev, description: e.target.value, updated_at: new Date().toISOString() }))}
              disabled={mode === 'view'}
              helperText="Detailed description of what this policy does and why it's needed"
            />
          </Grid>
        </Grid>

        {policy.category && POLICY_TYPE_CONFIGS[policy.category as keyof typeof POLICY_TYPE_CONFIGS] && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {POLICY_TYPE_CONFIGS[policy.category as keyof typeof POLICY_TYPE_CONFIGS].description}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderNaturalLanguageGenerator = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Natural Language Policy Generator
          <Tooltip title="Describe your policy requirements in plain English and let AI generate the rules">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Describe your policy requirements"
          value={nlDescription}
          onChange={(e) => setNlDescription(e.target.value)}
          placeholder="e.g., 'I want to block responses with trust scores below 80% and require human review for any financial advice'"
          disabled={mode === 'view' || generatingFromNL}
          helperText="Describe what you want the policy to do in natural language"
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          startIcon={generatingFromNL ? <CircularProgress size={20} /> : <NLIcon />}
          onClick={generatePolicyFromNL}
          disabled={mode === 'view' || generatingFromNL || !nlDescription.trim()}
        >
          {generatingFromNL ? 'Generating...' : 'Generate Policy Rules'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderRulesBuilder = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Policy Rules
            <Tooltip title="Define the specific rules that make up this policy. Rules are evaluated in priority order.">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<TestIcon />}
              onClick={testPolicy}
              disabled={mode === 'view' || testing || policy.rules.length === 0}
            >
              {testing ? 'Testing...' : 'Test Policy'}
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addRule}
              disabled={mode === 'view'}
            >
              Add Rule
            </Button>
          </Box>
        </Box>

        {/* Common Rules for Policy Type */}
        {policy.category && POLICY_TYPE_CONFIGS[policy.category as keyof typeof POLICY_TYPE_CONFIGS] && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                Common {policy.category} Rules
                <Tooltip title="Pre-defined rules commonly used for this policy type">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {POLICY_TYPE_CONFIGS[policy.category as keyof typeof POLICY_TYPE_CONFIGS].commonRules.map((commonRule, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper sx={{ p: 2, border: '1px dashed #ccc' }}>
                      <Typography variant="body2" gutterBottom>
                        {commonRule.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        Condition: {commonRule.condition}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        Action: {commonRule.action}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addCommonRule(commonRule)}
                        disabled={mode === 'view'}
                      >
                        Add Rule
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Rules List */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="rules">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {policy.rules.map((rule, index) => (
                  <Draggable key={rule.rule_id} draggableId={rule.rule_id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 2,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          transform: snapshot.isDragging ? 'rotate(5deg)' : 'none'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <div {...provided.dragHandleProps}>
                              <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            </div>
                            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                              Rule {index + 1}
                              <Tooltip title="Drag to reorder rules. Rules are evaluated in priority order from top to bottom.">
                                <IconButton size="small" sx={{ ml: 1 }}>
                                  <HelpIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Typography>
                            <Chip
                              label={`Priority: ${rule.priority || index + 1}`}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => deleteRule(rule.rule_id)}
                              disabled={mode === 'view'}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Rule Name"
                                value={rule.name || ''}
                                onChange={(e) => updateRule(rule.rule_id, { name: e.target.value })}
                                disabled={mode === 'view'}
                                helperText="A descriptive name for this rule"
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth>
                                <InputLabel>Action</InputLabel>
                                <Select
                                  value={rule.action}
                                  onChange={(e) => updateRule(rule.rule_id, { action: e.target.value as any })}
                                  disabled={mode === 'view'}
                                >
                                  <MenuItem value="allow">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <CheckIcon sx={{ color: 'success.main' }} />
                                      Allow
                                    </Box>
                                  </MenuItem>
                                  <MenuItem value="deny">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <ErrorIcon sx={{ color: 'error.main' }} />
                                      Deny
                                    </Box>
                                  </MenuItem>
                                  <MenuItem value="log">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <AnalyticsIcon sx={{ color: 'info.main' }} />
                                      Log
                                    </Box>
                                  </MenuItem>
                                  <MenuItem value="alert">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <WarningIcon sx={{ color: 'warning.main' }} />
                                      Alert
                                    </Box>
                                  </MenuItem>
                                  <MenuItem value="escalate">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <SuggestionIcon sx={{ color: 'secondary.main' }} />
                                      Escalate
                                    </Box>
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Condition"
                                value={rule.condition}
                                onChange={(e) => updateRule(rule.rule_id, { condition: e.target.value })}
                                disabled={mode === 'view'}
                                helperText="Boolean expression that determines when this rule applies (e.g., trust_score < 70)"
                                placeholder="e.g., trust_score < 70 OR contains_pii == true"
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Description"
                                value={rule.description || ''}
                                onChange={(e) => updateRule(rule.rule_id, { description: e.target.value })}
                                disabled={mode === 'view'}
                                helperText="Explain what this rule does and why it's needed"
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Rationale"
                                value={rule.metadata?.rationale || ''}
                                onChange={(e) => updateRule(rule.rule_id, { 
                                  metadata: { ...rule.metadata, rationale: e.target.value }
                                })}
                                disabled={mode === 'view'}
                                helperText="Business or technical justification for this rule"
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {policy.rules.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No rules defined yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add rules to define how this policy should behave
            </Typography>
          </Paper>
        )}
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Policy Analytics
          <Tooltip title="Real-time analytics showing how this policy is performing in production">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        {analytics ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {(analytics.effectiveness_score * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Effectiveness Score
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {(analytics.compliance_rate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compliance Rate
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {analytics.violation_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Violations (30 days)
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {analytics.total_evaluations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Evaluations
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Compliance Trend (Last 7 Days)
              </Typography>
              <Box sx={{ height: 200, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                {/* Placeholder for chart - would integrate with Recharts */}
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 8 }}>
                  Compliance trend chart would be displayed here
                </Typography>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">
            Analytics data will be available after the policy is deployed and has some usage history.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderOptimization = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI-Powered Optimization
          <Tooltip title="Machine learning suggestions to improve policy effectiveness based on historical data">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        {optimization ? (
          <Box>
            <Alert 
              severity={optimization.risk_assessment === 'low' ? 'success' : optimization.risk_assessment === 'medium' ? 'warning' : 'error'}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                Predicted improvement: <strong>{(optimization.predicted_improvement * 100).toFixed(1)}%</strong>
                {' '}(Risk: {optimization.risk_assessment})
              </Typography>
            </Alert>
            
            <Typography variant="subtitle1" gutterBottom>
              Optimization Suggestions
            </Typography>
            
            <List>
              {optimization.suggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <OptimizeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.description}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Type: {suggestion.type.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Impact Score: {(suggestion.impact_score * 100).toFixed(1)}% | 
                          Confidence: {(suggestion.confidence * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Alert severity="info">
            Optimization suggestions will be available after the policy has sufficient usage data for analysis.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderConflictDetection = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Conflict Detection
          <Tooltip title="Automatic detection of conflicts between rules in this policy">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        {conflicts.length > 0 ? (
          <List>
            {conflicts.map((conflict, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <WarningIcon 
                    color={conflict.severity === 'high' ? 'error' : conflict.severity === 'medium' ? 'warning' : 'info'} 
                  />
                </ListItemIcon>
                <ListItemText
                  primary={conflict.description}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Type: {conflict.conflict_type} | Severity: {conflict.severity}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Resolution: {conflict.resolution_suggestion}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="success">
            No conflicts detected between policy rules.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderTestResults = () => (
    testResults && (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Results
            <Tooltip title="Results from testing this policy against sample scenarios">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          <List>
            {testResults.results?.map((result: any, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {result.passed ? (
                    <CheckIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={result.scenario}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Expected: {result.expected} | Actual: {result.actual}
                      </Typography>
                      {result.explanation && (
                        <Typography variant="caption" display="block">
                          {result.explanation}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          <Alert severity={testResults.overall_passed ? 'success' : 'warning'} sx={{ mt: 2 }}>
            <Typography variant="body2">
              Test Summary: {testResults.passed_count}/{testResults.total_count} scenarios passed
              {testResults.overall_passed ? ' ✓' : ' - Review failed scenarios'}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    )
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {mode === 'create' ? 'Create Policy' : mode === 'edit' ? 'Edit Policy' : 'View Policy'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {mode !== 'view' && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Policy' : 'Save Changes'}
            </Button>
          )}
          
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
          )}
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab 
          label="Basic Info" 
          icon={<SecurityIcon />}
          iconPosition="start"
        />
        <Tab 
          label="AI Generator" 
          icon={<AIIcon />}
          iconPosition="start"
          disabled={mode === 'view'}
        />
        <Tab 
          label="Rules Builder" 
          icon={<SettingsIcon />}
          iconPosition="start"
        />
        <Tab 
          label="Analytics" 
          icon={<AnalyticsIcon />}
          iconPosition="start"
          disabled={mode === 'create'}
        />
        <Tab 
          label="Optimization" 
          icon={<OptimizeIcon />}
          iconPosition="start"
          disabled={mode === 'create'}
        />
        <Tab 
          label="Conflicts" 
          icon={
            <Badge badgeContent={conflicts.length} color="error">
              <WarningIcon />
            </Badge>
          }
          iconPosition="start"
        />
      </Tabs>

      {activeTab === 0 && renderBasicInfo()}
      {activeTab === 1 && renderNaturalLanguageGenerator()}
      {activeTab === 2 && (
        <Box>
          {renderRulesBuilder()}
          {renderTestResults()}
        </Box>
      )}
      {activeTab === 3 && renderAnalytics()}
      {activeTab === 4 && renderOptimization()}
      {activeTab === 5 && renderConflictDetection()}
    </Box>
  );
};

const ThemedPolicyRuleBuilder = (props: PolicyRuleBuilderProps) => (
  <ThemeProvider theme={darkTheme}>
    <PolicyRuleBuilder {...props} />
  </ThemeProvider>
);

export default ThemedPolicyRuleBuilder;

