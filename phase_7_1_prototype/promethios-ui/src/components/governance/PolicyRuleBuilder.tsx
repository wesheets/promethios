import React, { useState, useCallback } from 'react';
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
  Slider
} from '@mui/material';
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
  Lightbulb as SuggestionIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useToast } from '../../hooks/use-toast';
import { policiesAPI } from '../../services/api/policiesAPI';

interface PolicyRule {
  id: string;
  name: string;
  type: 'trust_threshold' | 'content_filter' | 'rate_limit' | 'data_retention' | 'audit_requirement' | 'pii_protection' | 'response_validation';
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'escalate' | 'log' | 'throttle';
  parameters: Record<string, any>;
  enabled: boolean;
  priority: number;
  description?: string;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  type: PolicyRule['type'];
  defaultParameters: Record<string, any>;
  category: string;
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'trust_basic',
    name: 'Basic Trust Threshold',
    description: 'Require minimum trust score for agent responses',
    type: 'trust_threshold',
    defaultParameters: { threshold: 70, action_on_fail: 'warn' },
    category: 'Trust Management'
  },
  {
    id: 'pii_protection',
    name: 'PII Protection',
    description: 'Detect and block personally identifiable information',
    type: 'pii_protection',
    defaultParameters: { sensitivity: 'high', block_types: ['ssn', 'credit_card', 'email'] },
    category: 'Data Protection'
  },
  {
    id: 'rate_limit_basic',
    name: 'Basic Rate Limiting',
    description: 'Limit requests per time window',
    type: 'rate_limit',
    defaultParameters: { limit: 100, window: 'minute', burst_allowance: 10 },
    category: 'Performance'
  },
  {
    id: 'content_safety',
    name: 'Content Safety Filter',
    description: 'Filter inappropriate or harmful content',
    type: 'content_filter',
    defaultParameters: { categories: ['hate', 'violence', 'adult'], severity: 'medium' },
    category: 'Content Safety'
  },
  {
    id: 'data_retention',
    name: 'Data Retention Policy',
    description: 'Automatically manage data lifecycle',
    type: 'data_retention',
    defaultParameters: { retention_days: 90, auto_delete: true },
    category: 'Compliance'
  }
];

const RULE_ACTIONS = [
  { value: 'allow', label: 'Allow', color: 'success', description: 'Permit the action to proceed' },
  { value: 'deny', label: 'Deny', color: 'error', description: 'Block the action completely' },
  { value: 'warn', label: 'Warn', color: 'warning', description: 'Log warning but allow action' },
  { value: 'escalate', label: 'Escalate', color: 'info', description: 'Escalate to human review' },
  { value: 'log', label: 'Log Only', color: 'default', description: 'Log for audit purposes only' },
  { value: 'throttle', label: 'Throttle', color: 'secondary', description: 'Slow down the action' }
];

interface PolicyRuleBuilderProps {
  initialRules?: PolicyRule[];
  onRulesChange?: (rules: PolicyRule[]) => void;
  onSave?: (rules: PolicyRule[]) => void;
  readOnly?: boolean;
}

export const PolicyRuleBuilder: React.FC<PolicyRuleBuilderProps> = ({
  initialRules = [],
  onRulesChange,
  onSave,
  readOnly = false
}) => {
  const [rules, setRules] = useState<PolicyRule[]>(initialRules);
  const [selectedRule, setSelectedRule] = useState<PolicyRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingRule, setIsTestingRule] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [nlpInput, setNlpInput] = useState('');
  const [isProcessingNLP, setIsProcessingNLP] = useState(false);
  const [nlpSuggestions, setNlpSuggestions] = useState<any>(null);
  const { toast } = useToast();

  const handleRulesChange = useCallback((newRules: PolicyRule[]) => {
    setRules(newRules);
    onRulesChange?.(newRules);
  }, [onRulesChange]);

  const handleDragEnd = (result: any) => {
    if (!result.destination || readOnly) return;

    const newRules = Array.from(rules);
    const [reorderedRule] = newRules.splice(result.source.index, 1);
    newRules.splice(result.destination.index, 0, reorderedRule);

    // Update priorities based on new order
    const updatedRules = newRules.map((rule, index) => ({
      ...rule,
      priority: index + 1
    }));

    handleRulesChange(updatedRules);
    toast({
      title: "Rules reordered",
      description: "Rule priorities have been updated based on the new order."
    });
  };

  const addRuleFromTemplate = (template: RuleTemplate) => {
    const newRule: PolicyRule = {
      id: `rule_${Date.now()}`,
      name: template.name,
      type: template.type,
      condition: generateConditionFromTemplate(template),
      action: 'warn',
      parameters: { ...template.defaultParameters },
      enabled: true,
      priority: rules.length + 1,
      description: template.description
    };

    handleRulesChange([...rules, newRule]);
    setSelectedRule(newRule);
    setIsEditing(true);
    setShowTemplates(false);
    
    toast({
      title: "Rule added",
      description: `${template.name} rule has been added to your policy.`
    });
  };

  const generateConditionFromTemplate = (template: RuleTemplate): string => {
    switch (template.type) {
      case 'trust_threshold':
        return `trust_score >= ${template.defaultParameters.threshold}`;
      case 'rate_limit':
        return `request_count <= ${template.defaultParameters.limit} per ${template.defaultParameters.window}`;
      case 'pii_protection':
        return `contains_pii == false`;
      case 'content_filter':
        return `content_safety_score >= 0.8`;
      case 'data_retention':
        return `data_age <= ${template.defaultParameters.retention_days} days`;
      default:
        return 'true';
    }
  };

  const deleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(rule => rule.id !== ruleId);
    handleRulesChange(updatedRules);
    
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
      setIsEditing(false);
    }
    
    toast({
      title: "Rule deleted",
      description: "The rule has been removed from your policy."
    });
  };

  const duplicateRule = (rule: PolicyRule) => {
    const duplicatedRule: PolicyRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (Copy)`,
      priority: rules.length + 1
    };

    handleRulesChange([...rules, duplicatedRule]);
    toast({
      title: "Rule duplicated",
      description: "A copy of the rule has been created."
    });
  };

  const testRule = async (rule: PolicyRule) => {
    if (!rule) return;

    setIsTestingRule(true);
    try {
      const result = await policiesAPI.validateRule({
        rule: rule,
        agent_id: undefined // Test against all agents
      });

      setTestResults(result);
      toast({
        title: "Rule tested",
        description: `Rule validation completed with ${result.validation_result?.triggers || 0} triggers.`
      });
    } catch (error) {
      console.error('Error testing rule:', error);
      toast({
        title: "Test failed",
        description: "Failed to test the rule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTestingRule(false);
    }
  };

  const processNaturalLanguage = async () => {
    if (!nlpInput.trim()) return;

    setIsProcessingNLP(true);
    try {
      const result = await policiesAPI.createFromNaturalLanguage({
        description: nlpInput,
        context: 'Policy rule creation'
      });

      if (result.success && result.suggested_rules?.length > 0) {
        setNlpSuggestions(result);
        toast({
          title: "AI suggestions ready",
          description: `Generated ${result.suggested_rules.length} rule suggestions from your description.`
        });
      } else {
        toast({
          title: "No suggestions",
          description: "Could not generate rule suggestions from the description. Try being more specific.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing natural language:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process natural language input. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingNLP(false);
    }
  };

  const addSuggestedRule = (suggestedRule: any) => {
    const newRule: PolicyRule = {
      id: `rule_${Date.now()}`,
      name: suggestedRule.name,
      type: suggestedRule.type,
      condition: suggestedRule.condition,
      action: suggestedRule.action,
      parameters: suggestedRule.parameters || {},
      enabled: true,
      priority: rules.length + 1,
      description: `AI-generated rule with ${(suggestedRule.confidence * 100).toFixed(0)}% confidence`
    };

    handleRulesChange([...rules, newRule]);
    setSelectedRule(newRule);
    setIsEditing(true);
    
    toast({
      title: "AI rule added",
      description: `${suggestedRule.name} has been added to your policy.`
    });
  };

  const updateSelectedRule = (updates: Partial<PolicyRule>) => {
    if (!selectedRule) return;

    const updatedRule = { ...selectedRule, ...updates };
    const updatedRules = rules.map(rule => 
      rule.id === selectedRule.id ? updatedRule : rule
    );

    handleRulesChange(updatedRules);
    setSelectedRule(updatedRule);
  };

  const getRuleIcon = (type: PolicyRule['type']) => {
    switch (type) {
      case 'trust_threshold': return '🛡️';
      case 'content_filter': return '🔍';
      case 'rate_limit': return '⏱️';
      case 'data_retention': return '📁';
      case 'audit_requirement': return '📋';
      case 'pii_protection': return '🔒';
      case 'response_validation': return '✅';
      default: return '⚙️';
    }
  };

  const getActionColor = (action: PolicyRule['action']) => {
    const actionConfig = RULE_ACTIONS.find(a => a.value === action);
    return actionConfig?.color || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🏗️ Policy Rule Builder
        <Tooltip title="Create and manage policy rules with visual drag-and-drop interface, AI assistance, and real-time testing">
          <IconButton size="small">
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Rule List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Policy Rules ({rules.length})</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Add rule from template">
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setShowTemplates(true)}
                      disabled={readOnly}
                      size="small"
                    >
                      Add Rule
                    </Button>
                  </Tooltip>
                  {onSave && (
                    <Tooltip title="Save all rules">
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => onSave(rules)}
                        disabled={readOnly}
                        size="small"
                      >
                        Save
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Natural Language Input */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SuggestionIcon color="primary" />
                    <Typography>AI Rule Generation</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Describe your policy rule in natural language... e.g., 'Block responses with trust score below 80%' or 'Limit to 100 requests per minute'"
                      value={nlpInput}
                      onChange={(e) => setNlpInput(e.target.value)}
                      disabled={readOnly}
                    />
                    <Button
                      variant="outlined"
                      startIcon={isProcessingNLP ? <CircularProgress size={16} /> : <SuggestionIcon />}
                      onClick={processNaturalLanguage}
                      disabled={!nlpInput.trim() || isProcessingNLP || readOnly}
                    >
                      {isProcessingNLP ? 'Processing...' : 'Generate Rules'}
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* AI Suggestions */}
              {nlpSuggestions && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Generated {nlpSuggestions.suggested_rules.length} Rule Suggestions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {nlpSuggestions.suggested_rules.map((suggestion: any, index: number) => (
                      <Paper key={index} sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2">{suggestion.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {suggestion.condition} → {suggestion.action}
                            </Typography>
                            <Typography variant="caption">
                              Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => addSuggestedRule(suggestion)}
                            disabled={readOnly}
                          >
                            Add
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Alert>
              )}

              {/* Rules List */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="rules">
                  {(provided) => (
                    <Box {...provided.droppableProps} ref={provided.innerRef}>
                      {rules.map((rule, index) => (
                        <Draggable key={rule.id} draggableId={rule.id} index={index} isDragDisabled={readOnly}>
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                p: 2,
                                mb: 1,
                                cursor: 'pointer',
                                border: selectedRule?.id === rule.id ? 2 : 1,
                                borderColor: selectedRule?.id === rule.id ? 'primary.main' : 'divider',
                                bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                              onClick={() => {
                                setSelectedRule(rule);
                                setIsEditing(false);
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box {...provided.dragHandleProps}>
                                  <DragIcon color="action" />
                                </Box>
                                <Typography sx={{ fontSize: '1.2em' }}>
                                  {getRuleIcon(rule.type)}
                                </Typography>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2">{rule.name}</Typography>
                                    <Chip
                                      label={rule.action}
                                      size="small"
                                      color={getActionColor(rule.action) as any}
                                      variant="outlined"
                                    />
                                    {!rule.enabled && (
                                      <Chip label="Disabled" size="small" variant="outlined" />
                                    )}
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {rule.condition}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Test rule">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        testRule(rule);
                                      }}
                                      disabled={isTestingRule}
                                    >
                                      <TestIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Duplicate rule">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        duplicateRule(rule);
                                      }}
                                      disabled={readOnly}
                                    >
                                      <CopyIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete rule">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteRule(rule.id);
                                      }}
                                      disabled={readOnly}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>

              {rules.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No rules defined
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add your first rule using templates or AI generation
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowTemplates(true)}
                    disabled={readOnly}
                  >
                    Add First Rule
                  </Button>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Rule Editor */}
        <Grid item xs={12} md={6}>
          {selectedRule ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {getRuleIcon(selectedRule.type)} {selectedRule.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={isEditing ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={readOnly}
                    >
                      {isEditing ? 'View' : 'Edit'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={isTestingRule ? <CircularProgress size={16} /> : <TestIcon />}
                      onClick={() => testRule(selectedRule)}
                      disabled={isTestingRule}
                    >
                      Test
                    </Button>
                  </Box>
                </Box>

                {isEditing ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Rule Name"
                      value={selectedRule.name}
                      onChange={(e) => updateSelectedRule({ name: e.target.value })}
                      fullWidth
                    />

                    <FormControl fullWidth>
                      <InputLabel>Rule Type</InputLabel>
                      <Select
                        value={selectedRule.type}
                        onChange={(e) => updateSelectedRule({ type: e.target.value as PolicyRule['type'] })}
                      >
                        <MenuItem value="trust_threshold">Trust Threshold</MenuItem>
                        <MenuItem value="content_filter">Content Filter</MenuItem>
                        <MenuItem value="rate_limit">Rate Limit</MenuItem>
                        <MenuItem value="data_retention">Data Retention</MenuItem>
                        <MenuItem value="audit_requirement">Audit Requirement</MenuItem>
                        <MenuItem value="pii_protection">PII Protection</MenuItem>
                        <MenuItem value="response_validation">Response Validation</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Condition"
                      value={selectedRule.condition}
                      onChange={(e) => updateSelectedRule({ condition: e.target.value })}
                      fullWidth
                      multiline
                      rows={2}
                      helperText="Define when this rule should trigger (e.g., trust_score < 70)"
                    />

                    <FormControl fullWidth>
                      <InputLabel>Action</InputLabel>
                      <Select
                        value={selectedRule.action}
                        onChange={(e) => updateSelectedRule({ action: e.target.value as PolicyRule['action'] })}
                      >
                        {RULE_ACTIONS.map((action) => (
                          <MenuItem key={action.value} value={action.value}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography>{action.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {action.description}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Description"
                      value={selectedRule.description || ''}
                      onChange={(e) => updateSelectedRule({ description: e.target.value })}
                      fullWidth
                      multiline
                      rows={2}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selectedRule.enabled}
                            onChange={(e) => updateSelectedRule({ enabled: e.target.checked })}
                          />
                        }
                        label="Enabled"
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom>Priority: {selectedRule.priority}</Typography>
                        <Slider
                          value={selectedRule.priority}
                          onChange={(_, value) => updateSelectedRule({ priority: value as number })}
                          min={1}
                          max={rules.length}
                          marks
                          step={1}
                        />
                      </Box>
                    </Box>

                    {/* Rule-specific parameters */}
                    {selectedRule.type === 'trust_threshold' && (
                      <TextField
                        label="Trust Threshold"
                        type="number"
                        value={selectedRule.parameters.threshold || 70}
                        onChange={(e) => updateSelectedRule({
                          parameters: { ...selectedRule.parameters, threshold: parseInt(e.target.value) }
                        })}
                        inputProps={{ min: 0, max: 100 }}
                        helperText="Minimum trust score required (0-100)"
                      />
                    )}

                    {selectedRule.type === 'rate_limit' && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Request Limit"
                          type="number"
                          value={selectedRule.parameters.limit || 100}
                          onChange={(e) => updateSelectedRule({
                            parameters: { ...selectedRule.parameters, limit: parseInt(e.target.value) }
                          })}
                          sx={{ flex: 1 }}
                        />
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Time Window</InputLabel>
                          <Select
                            value={selectedRule.parameters.window || 'minute'}
                            onChange={(e) => updateSelectedRule({
                              parameters: { ...selectedRule.parameters, window: e.target.value }
                            })}
                          >
                            <MenuItem value="second">Second</MenuItem>
                            <MenuItem value="minute">Minute</MenuItem>
                            <MenuItem value="hour">Hour</MenuItem>
                            <MenuItem value="day">Day</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                      <Typography>{selectedRule.type.replace('_', ' ').toUpperCase()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Condition</Typography>
                      <Typography fontFamily="monospace" sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                        {selectedRule.condition}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                      <Chip
                        label={selectedRule.action}
                        color={getActionColor(selectedRule.action) as any}
                        variant="outlined"
                      />
                    </Box>
                    {selectedRule.description && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                        <Typography>{selectedRule.description}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip
                          label={selectedRule.enabled ? 'Enabled' : 'Disabled'}
                          color={selectedRule.enabled ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                        <Typography>{selectedRule.priority}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Test Results */}
                {testResults && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Test Results</Typography>
                    <Alert
                      severity={testResults.validation_result?.effectiveness > 0.7 ? 'success' : 
                               testResults.validation_result?.effectiveness > 0.4 ? 'warning' : 'error'}
                    >
                      <Typography variant="subtitle2">
                        Rule Effectiveness: {((testResults.validation_result?.effectiveness || 0) * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        Triggers: {testResults.validation_result?.triggers || 0} out of {testResults.data_points || 0} data points
                      </Typography>
                      <Typography variant="caption">
                        Tested against {testResults.time_range} of historical data
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a rule to view details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click on a rule from the list to view or edit its configuration
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Rule Templates Dialog */}
      <Dialog open={showTemplates} onClose={() => setShowTemplates(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Rule from Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {RULE_TEMPLATES.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <CardContent onClick={() => addRuleFromTemplate(template)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontSize: '1.2em' }}>
                        {getRuleIcon(template.type)}
                      </Typography>
                      <Typography variant="h6">{template.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {template.description}
                    </Typography>
                    <Chip label={template.category} size="small" variant="outlined" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplates(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

