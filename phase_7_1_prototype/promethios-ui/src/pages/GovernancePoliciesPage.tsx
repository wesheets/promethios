/**
 * Governance Policies Page
 * 
 * Comprehensive policy management interface for both single agents and multi-agent systems.
 * Includes policy templates, configuration, validation, and agent-specific policy assignment.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tabs,
  Tab,
  Fab
} from '@mui/material';
import {
  Policy,
  Add,
  Edit,
  Delete,
  Security,
  Gavel,
  Assignment,
  CheckCircle,
  Warning,
  Error,
  ExpandMore,
  FilterList,
  Person,
  Group,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Download,
  Upload,
  ContentCopy
} from '@mui/icons-material';

interface PolicyTemplate {
  id: string;
  name: string;
  category: 'financial' | 'healthcare' | 'legal' | 'general' | 'custom';
  description: string;
  rules: PolicyRule[];
  compliance_level: 'lenient' | 'standard' | 'strict';
  icon: React.ReactNode;
  color: string;
}

interface PolicyRule {
  id: string;
  name: string;
  type: 'trust_threshold' | 'content_filter' | 'rate_limit' | 'data_retention' | 'audit_requirement';
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'escalate';
  parameters: Record<string, any>;
  enabled: boolean;
}

interface AgentPolicy {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: 'single' | 'multi_agent_system';
  policy_template_id: string;
  custom_rules: PolicyRule[];
  compliance_score: number;
  last_updated: string;
  status: 'active' | 'inactive' | 'pending';
}

const GovernancePoliciesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'templates' | 'assignments' | 'rules'>('templates');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [policyTemplates, setPolicyTemplates] = useState<PolicyTemplate[]>([]);
  const [agentPolicies, setAgentPolicies] = useState<AgentPolicy[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<AgentPolicy | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PolicyRule>>({});

  // Initialize policy templates
  useEffect(() => {
    const initializePolicyTemplates = () => {
      const templates: PolicyTemplate[] = [
        {
          id: 'financial',
          name: 'Financial Services',
          category: 'financial',
          description: 'Comprehensive governance for financial AI agents with regulatory compliance',
          compliance_level: 'strict',
          icon: <Security />,
          color: '#10B981',
          rules: [
            {
              id: 'fin_trust_1',
              name: 'High Trust Threshold',
              type: 'trust_threshold',
              condition: 'trust_score >= 0.9',
              action: 'allow',
              parameters: { min_trust: 0.9, verification_required: true },
              enabled: true
            },
            {
              id: 'fin_audit_1',
              name: 'Complete Audit Trail',
              type: 'audit_requirement',
              condition: 'all_interactions',
              action: 'escalate',
              parameters: { log_level: 'detailed', retention_days: 2555 }, // 7 years
              enabled: true
            },
            {
              id: 'fin_content_1',
              name: 'Financial Content Filter',
              type: 'content_filter',
              condition: 'contains_financial_advice',
              action: 'warn',
              parameters: { keywords: ['investment', 'trading', 'financial advice'], require_disclaimer: true },
              enabled: true
            }
          ]
        },
        {
          id: 'healthcare',
          name: 'Healthcare & HIPAA',
          category: 'healthcare',
          description: 'HIPAA-compliant governance for healthcare AI agents',
          compliance_level: 'strict',
          icon: <Gavel />,
          color: '#3B82F6',
          rules: [
            {
              id: 'hip_trust_1',
              name: 'HIPAA Trust Level',
              type: 'trust_threshold',
              condition: 'trust_score >= 0.95',
              action: 'allow',
              parameters: { min_trust: 0.95, hipaa_certified: true },
              enabled: true
            },
            {
              id: 'hip_data_1',
              name: 'PHI Data Retention',
              type: 'data_retention',
              condition: 'contains_phi',
              action: 'escalate',
              parameters: { max_retention_days: 30, encryption_required: true },
              enabled: true
            },
            {
              id: 'hip_audit_1',
              name: 'HIPAA Audit Requirements',
              type: 'audit_requirement',
              condition: 'phi_access',
              action: 'escalate',
              parameters: { detailed_logging: true, access_tracking: true },
              enabled: true
            }
          ]
        },
        {
          id: 'legal',
          name: 'Legal & Compliance',
          category: 'legal',
          description: 'Legal compliance governance for attorney-client privilege and regulatory requirements',
          compliance_level: 'strict',
          icon: <Assignment />,
          color: '#8B5CF6',
          rules: [
            {
              id: 'leg_trust_1',
              name: 'Legal Professional Trust',
              type: 'trust_threshold',
              condition: 'trust_score >= 0.92',
              action: 'allow',
              parameters: { min_trust: 0.92, legal_certified: true },
              enabled: true
            },
            {
              id: 'leg_content_1',
              name: 'Legal Advice Filter',
              type: 'content_filter',
              condition: 'contains_legal_advice',
              action: 'warn',
              parameters: { require_disclaimer: true, attorney_review: true },
              enabled: true
            }
          ]
        },
        {
          id: 'general',
          name: 'General Purpose',
          category: 'general',
          description: 'Balanced governance for general-purpose AI agents',
          compliance_level: 'standard',
          icon: <Policy />,
          color: '#F59E0B',
          rules: [
            {
              id: 'gen_trust_1',
              name: 'Standard Trust Level',
              type: 'trust_threshold',
              condition: 'trust_score >= 0.7',
              action: 'allow',
              parameters: { min_trust: 0.7 },
              enabled: true
            },
            {
              id: 'gen_rate_1',
              name: 'Rate Limiting',
              type: 'rate_limit',
              condition: 'requests_per_minute > 60',
              action: 'deny',
              parameters: { max_requests: 60, window_minutes: 1 },
              enabled: true
            }
          ]
        }
      ];

      setPolicyTemplates(templates);
    };

    const initializeAgentPolicies = () => {
      const policies: AgentPolicy[] = [
        {
          id: 'policy_1',
          agent_id: 'agent_customer_support',
          agent_name: 'Customer Support Agent',
          agent_type: 'single',
          policy_template_id: 'general',
          custom_rules: [],
          compliance_score: 87,
          last_updated: '2025-06-20T10:30:00Z',
          status: 'active'
        },
        {
          id: 'policy_2',
          agent_id: 'multi_agent_financial',
          agent_name: 'Financial Analysis Team',
          agent_type: 'multi_agent_system',
          policy_template_id: 'financial',
          custom_rules: [],
          compliance_score: 94,
          last_updated: '2025-06-20T09:15:00Z',
          status: 'active'
        }
      ];

      setAgentPolicies(policies);
    };

    initializePolicyTemplates();
    initializeAgentPolicies();
    setAvailableAgents(['Customer Support Agent', 'Code Review Agent', 'Financial Analyst', 'Legal Advisor']);
  }, []);

  const handleCreatePolicy = () => {
    setCreateDialogOpen(true);
  };

  const handleAssignPolicy = (templateId: string) => {
    setSelectedTemplate(policyTemplates.find(t => t.id === templateId) || null);
    setAssignDialogOpen(true);
  };

  const handleEditPolicy = (policy: AgentPolicy) => {
    setEditingPolicy(policy);
    setCreateDialogOpen(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    setAgentPolicies(prev => prev.filter(p => p.id !== policyId));
  };

  const handleSavePolicy = () => {
    // Implementation for saving policy
    setCreateDialogOpen(false);
    setEditingPolicy(null);
  };

  const handleAddRule = () => {
    setNewRule({
      name: '',
      type: 'trust_threshold',
      condition: '',
      action: 'allow',
      parameters: {},
      enabled: true
    });
    setRuleDialogOpen(true);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#3B82F6';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'inactive': return <Error sx={{ color: '#EF4444' }} />;
      case 'pending': return <Warning sx={{ color: '#F59E0B' }} />;
      default: return <Warning />;
    }
  };

  const exportPolicies = () => {
    const exportData = {
      templates: policyTemplates,
      assignments: agentPolicies,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance_policies_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box p={4}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Governance Policies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage policy templates and agent-specific governance configurations
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => {/* Import policies */}}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportPolicies}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePolicy}
          >
            Create Policy
          </Button>
        </Box>
      </Box>

      {/* View Mode Toggle */}
      <Box mb={4}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          aria-label="view mode"
        >
          <ToggleButton value="templates" aria-label="templates">
            <Policy sx={{ mr: 1 }} />
            Policy Templates
          </ToggleButton>
          <ToggleButton value="assignments" aria-label="assignments">
            <Assignment sx={{ mr: 1 }} />
            Agent Assignments
          </ToggleButton>
          <ToggleButton value="rules" aria-label="rules">
            <Gavel sx={{ mr: 1 }} />
            Custom Rules
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Agent Filter */}
      <Box mb={4}>
        <Autocomplete
          multiple
          options={availableAgents}
          value={selectedAgents}
          onChange={(event, newValue) => setSelectedAgents(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Agents"
              placeholder="Select agents to filter policies"
              variant="outlined"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
        />
      </Box>

      {/* Policy Templates View */}
      {viewMode === 'templates' && (
        <Grid container spacing={3}>
          {policyTemplates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: template.color }}>
                      {template.icon}
                    </Avatar>
                  }
                  title={template.name}
                  subheader={
                    <Chip
                      label={template.compliance_level.toUpperCase()}
                      size="small"
                      color={template.compliance_level === 'strict' ? 'error' : 
                             template.compliance_level === 'standard' ? 'warning' : 'success'}
                    />
                  }
                  action={
                    <IconButton onClick={() => handleAssignPolicy(template.id)}>
                      <Add />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {template.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Policy Rules ({template.rules.length})
                  </Typography>
                  
                  <Box>
                    {template.rules.slice(0, 3).map((rule, index) => (
                      <Box key={rule.id} display="flex" alignItems="center" mb={1}>
                        <Chip
                          label={rule.name}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {rule.action}
                        </Typography>
                      </Box>
                    ))}
                    {template.rules.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{template.rules.length - 3} more rules
                      </Typography>
                    )}
                  </Box>

                  <Box mt={2} display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => {/* View template details */}}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={() => {/* Clone template */}}
                    >
                      Clone
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Agent Assignments View */}
      {viewMode === 'assignments' && (
        <Card>
          <CardHeader
            title="Policy Assignments"
            subheader={`${agentPolicies.length} agents with assigned policies`}
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Policy Template</TableCell>
                    <TableCell>Compliance Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agentPolicies
                    .filter(policy => 
                      selectedAgents.length === 0 || 
                      selectedAgents.includes(policy.agent_name)
                    )
                    .map((policy) => {
                      const template = policyTemplates.find(t => t.id === policy.policy_template_id);
                      return (
                        <TableRow key={policy.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {policy.agent_type === 'multi_agent_system' ? <Group /> : <Person />}
                              <Box ml={1}>
                                <Typography variant="body2" fontWeight="medium">
                                  {policy.agent_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {policy.agent_id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={policy.agent_type === 'multi_agent_system' ? 'Multi-Agent' : 'Single Agent'}
                              size="small"
                              color={policy.agent_type === 'multi_agent_system' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {template && (
                              <Box display="flex" alignItems="center">
                                <Avatar sx={{ bgcolor: template.color, width: 24, height: 24, mr: 1 }}>
                                  {template.icon}
                                </Avatar>
                                {template.name}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LinearProgress
                                variant="determinate"
                                value={policy.compliance_score}
                                sx={{
                                  width: 60,
                                  mr: 1,
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: getComplianceColor(policy.compliance_score)
                                  }
                                }}
                              />
                              <Typography variant="body2">
                                {policy.compliance_score}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {getStatusIcon(policy.status)}
                              <Typography variant="body2" ml={1}>
                                {policy.status}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(policy.last_updated).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditPolicy(policy)}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePolicy(policy.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Custom Rules View */}
      {viewMode === 'rules' && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Custom Policy Rules</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddRule}
            >
              Add Rule
            </Button>
          </Box>

          {policyTemplates.map((template) => (
            <Accordion key={template.id}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Avatar sx={{ bgcolor: template.color, mr: 2 }}>
                    {template.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{template.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.rules.length} rules
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rule Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Condition</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {template.rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>{rule.name}</TableCell>
                          <TableCell>
                            <Chip label={rule.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {rule.condition}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rule.action}
                              size="small"
                              color={
                                rule.action === 'allow' ? 'success' :
                                rule.action === 'deny' ? 'error' :
                                rule.action === 'warn' ? 'warning' : 'info'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.enabled}
                              size="small"
                              onChange={() => {/* Toggle rule */}}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Create/Edit Policy Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Name"
                variant="outlined"
                defaultValue={editingPolicy?.agent_name || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Policy Template</InputLabel>
                <Select
                  defaultValue={editingPolicy?.policy_template_id || ''}
                  label="Policy Template"
                >
                  {policyTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePolicy}>
            Save Policy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Policy Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Policy Template</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: selectedTemplate.color, mr: 2 }}>
                  {selectedTemplate.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedTemplate.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate.description}
                  </Typography>
                </Box>
              </Box>

              <Autocomplete
                multiple
                options={availableAgents}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Agents"
                    placeholder="Choose agents to assign this policy"
                    variant="outlined"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Assign Policy</Button>
        </DialogActions>
      </Dialog>

      {/* Add Rule Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Custom Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rule Name"
                variant="outlined"
                value={newRule.name || ''}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={newRule.type || 'trust_threshold'}
                  label="Rule Type"
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                >
                  <MenuItem value="trust_threshold">Trust Threshold</MenuItem>
                  <MenuItem value="content_filter">Content Filter</MenuItem>
                  <MenuItem value="rate_limit">Rate Limit</MenuItem>
                  <MenuItem value="data_retention">Data Retention</MenuItem>
                  <MenuItem value="audit_requirement">Audit Requirement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Condition"
                variant="outlined"
                placeholder="e.g., trust_score >= 0.8"
                value={newRule.condition || ''}
                onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={newRule.action || 'allow'}
                  label="Action"
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                >
                  <MenuItem value="allow">Allow</MenuItem>
                  <MenuItem value="deny">Deny</MenuItem>
                  <MenuItem value="warn">Warn</MenuItem>
                  <MenuItem value="escalate">Escalate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newRule.enabled !== false}
                    onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                  />
                }
                label="Enable Rule"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Add Rule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GovernancePoliciesPage;

