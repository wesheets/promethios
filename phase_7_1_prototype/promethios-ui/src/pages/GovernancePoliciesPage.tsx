/**
 * Governance Policies Page
 * 
 * Comprehensive policy management interface for both single agents and multi-agent systems.
 * Includes policy templates, configuration, validation, and agent-specific policy assignment.
 * 
 * Updated to use real backend APIs instead of mock data.
 */

import React, { useState, useEffect } from 'react';
import { usePolicyBackend } from '../hooks/usePolicyBackend';
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
  ContentCopy,
  MoreVert
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
  agent_type: 'single' | 'multi';
  policies: string[];
  compliance_status: 'compliant' | 'warning' | 'violation';
  last_updated: string;
  trust_score: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`policies-tabpanel-${index}`}
      aria-labelledby={`policies-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GovernancePoliciesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentType, setAgentType] = useState<'all' | 'single' | 'multi'>('all');
  const [createPolicyOpen, setCreatePolicyOpen] = useState(false);
  const [editPolicyOpen, setEditPolicyOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  // Use real backend data instead of mock data
  const {
    policies: policyTemplates,
    policiesLoading,
    policiesError,
    statistics,
    statisticsLoading,
    createPolicy,
    updatePolicy,
    deletePolicy,
    refreshAll
  } = usePolicyBackend();

  // Mock agent policies for now - this would come from agent management API
  const [agentPolicies, setAgentPolicies] = useState<AgentPolicy[]>([
    {
      id: 'policy-1',
      agent_id: 'agent_customer_support',
      agent_name: 'Customer Support Agent',
      agent_type: 'single',
      policies: ['general-purpose'],
      compliance_status: 'compliant',
      last_updated: '2024-01-15T10:30:00Z',
      trust_score: 85
    },
    {
      id: 'policy-2',
      agent_id: 'multi_agent_financial',
      agent_name: 'Financial Advisory Team',
      agent_type: 'multi',
      policies: ['financial-services'],
      compliance_status: 'compliant',
      last_updated: '2024-01-15T09:15:00Z',
      trust_score: 92
    }
  ]);

  // Add default icons and colors for policies from backend
  const enhancedPolicyTemplates = policyTemplates.map(policy => ({
    ...policy,
    icon: policy.category === 'financial' ? <Security /> :
          policy.category === 'healthcare' ? <Gavel /> :
          policy.category === 'legal' ? <Assignment /> :
          <Policy />,
    color: policy.category === 'financial' ? '#10B981' :
           policy.category === 'healthcare' ? '#3B82F6' :
           policy.category === 'legal' ? '#8B5CF6' :
           '#F59E0B'
  }));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreatePolicy = () => {
    setCreatePolicyOpen(true);
  };

  const handleEditPolicy = (policy: PolicyTemplate) => {
    setSelectedPolicy(policy);
    setEditPolicyOpen(true);
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicy(policyId);
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  const handleClonePolicy = async (policy: PolicyTemplate) => {
    try {
      const clonedPolicy = {
        name: `${policy.name} (Copy)`,
        category: policy.category,
        description: policy.description,
        rules: policy.rules,
        compliance_level: policy.compliance_level
      };
      await createPolicy(clonedPolicy);
    } catch (error) {
      console.error('Error cloning policy:', error);
    }
  };

  const exportPolicies = () => {
    const dataStr = JSON.stringify(enhancedPolicyTemplates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'governance-policies.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredAgentPolicies = agentPolicies.filter(policy => {
    if (agentType !== 'all' && policy.agent_type !== agentType) return false;
    if (selectedAgents.length > 0 && !selectedAgents.includes(policy.agent_id)) return false;
    return true;
  });

  return (
    <Box 
      p={4}
      sx={{ 
        backgroundColor: '#1a202c',
        minHeight: '100vh',
        color: 'white'
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Governance Policies
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Manage policy templates and agent-specific governance configurations
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            sx={{ 
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': {
                borderColor: '#718096',
                backgroundColor: '#2d3748'
              }
            }}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportPolicies}
            sx={{ 
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': {
                borderColor: '#718096',
                backgroundColor: '#2d3748'
              }
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePolicy}
            sx={{ 
              backgroundColor: '#3182ce',
              '&:hover': {
                backgroundColor: '#2c5aa0'
              }
            }}
          >
            Create Policy
          </Button>
        </Box>
      </Box>

      {/* Agent Filter Controls */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
            <Typography variant="h6" sx={{ color: 'white' }}>
              Filter by Agents:
            </Typography>
            
            <ToggleButtonGroup
              value={agentType}
              exclusive
              onChange={(e, newType) => newType && setAgentType(newType)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: '#a0aec0',
                  borderColor: '#4a5568',
                  '&.Mui-selected': {
                    backgroundColor: '#3182ce',
                    color: 'white'
                  }
                }
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="single">Single Agents</ToggleButton>
              <ToggleButton value="multi">Multi-Agent Systems</ToggleButton>
            </ToggleButtonGroup>

            <Autocomplete
              multiple
              options={agentPolicies.map(p => p.agent_id)}
              value={selectedAgents}
              onChange={(event, newValue) => setSelectedAgents(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Agents" 
                  variant="outlined" 
                  size="small"
                  sx={{
                    minWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a202c',
                      '& fieldset': {
                        borderColor: '#4a5568',
                      },
                      '&:hover fieldset': {
                        borderColor: '#718096',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3182ce',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#a0aec0',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    sx={{
                      backgroundColor: '#3182ce',
                      color: 'white',
                      borderColor: '#3182ce'
                    }}
                  />
                ))
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#a0aec0',
                '&.Mui-selected': {
                  color: '#3182ce'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#3182ce'
              }
            }}
          >
            <Tab label="Policy Templates" />
            <Tab label="Policy Assignments" />
            <Tab label="Compliance Monitoring" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* Policy Templates */}
          <Grid container spacing={3}>
            {enhancedPolicyTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: template.color }}>
                        {template.icon}
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {template.name}
                      </Typography>
                    }
                    subheader={
                      <Chip 
                        label={template.compliance_level.toUpperCase()} 
                        size="small" 
                        sx={{
                          backgroundColor: template.compliance_level === 'strict' ? '#EF4444' : 
                                         template.compliance_level === 'standard' ? '#F59E0B' : '#10B981',
                          color: 'white'
                        }}
                      />
                    }
                    action={
                      <IconButton 
                        size="small"
                        sx={{ color: '#a0aec0' }}
                      >
                        <MoreVert />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      {template.description}
                    </Typography>
                    
                    <Box mb={2}>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        Policy Rules ({template.rules.length})
                      </Typography>
                      {template.rules.slice(0, 3).map((rule) => (
                        <Box key={rule.id} display="flex" alignItems="center" mt={1}>
                          <Typography variant="caption" sx={{ color: 'white' }}>
                            {rule.name}
                          </Typography>
                          <Chip 
                            label={rule.type} 
                            size="small" 
                            sx={{ 
                              ml: 1, 
                              backgroundColor: '#4a5568', 
                              color: '#a0aec0',
                              fontSize: '0.7rem'
                            }} 
                          />
                        </Box>
                      ))}
                      {template.rules.length > 3 && (
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          +{template.rules.length - 3} more rules
                        </Typography>
                      )}
                    </Box>

                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        startIcon={<Visibility />}
                        sx={{ 
                          color: '#3182ce',
                          '&:hover': {
                            backgroundColor: '#2d3748'
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<ContentCopy />}
                        onClick={() => handleClonePolicy(template)}
                        sx={{ 
                          color: '#a0aec0',
                          '&:hover': {
                            backgroundColor: '#2d3748'
                          }
                        }}
                      >
                        Clone
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Policy Assignments */}
          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            Policy Assignments
          </Typography>
          
          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Agent</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Type</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Policy Assigned</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Compliance Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Trust Score</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Last Updated</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgentPolicies.map((agentPolicy) => (
                  <TableRow key={agentPolicy.id}>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: '#3182ce' }}>
                          {agentPolicy.agent_type === 'multi' ? <Group /> : <Person />}
                        </Avatar>
                        {agentPolicy.agent_name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip 
                        label={agentPolicy.agent_type === 'multi' ? 'Multi-Agent' : 'Single Agent'} 
                        size="small"
                        sx={{
                          backgroundColor: agentPolicy.agent_type === 'multi' ? '#8B5CF6' : '#3182ce',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {agentPolicy.policies.map(policyId => {
                        const policy = policyTemplates.find(p => p.id === policyId);
                        return policy ? (
                          <Chip 
                            key={policyId}
                            label={policy.name} 
                            size="small" 
                            sx={{ 
                              mr: 1, 
                              backgroundColor: policy.color, 
                              color: 'white' 
                            }}
                          />
                        ) : null;
                      })}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip 
                        label={agentPolicy.compliance_status.toUpperCase()} 
                        size="small"
                        icon={
                          agentPolicy.compliance_status === 'compliant' ? <CheckCircle /> :
                          agentPolicy.compliance_status === 'warning' ? <Warning /> : <Error />
                        }
                        sx={{
                          backgroundColor: 
                            agentPolicy.compliance_status === 'compliant' ? '#10B981' :
                            agentPolicy.compliance_status === 'warning' ? '#F59E0B' : '#EF4444',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {agentPolicy.trust_score}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={agentPolicy.trust_score}
                          sx={{ 
                            width: 60, 
                            height: 6,
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: agentPolicy.trust_score > 80 ? '#10B981' : 
                                             agentPolicy.trust_score > 60 ? '#F59E0B' : '#EF4444'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>
                      {new Date(agentPolicy.last_updated).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <IconButton 
                        size="small"
                        sx={{ color: '#3182ce' }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ color: '#EF4444' }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Compliance Monitoring */}
          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            Compliance Monitoring
          </Typography>
          
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3, 
              backgroundColor: '#1e3a8a', 
              color: 'white', 
              border: '1px solid #3b82f6' 
            }}
          >
            Real-time compliance monitoring and policy violation tracking will be displayed here.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Policy Compliance Overview" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Overall policy compliance metrics and trends across all agents and systems.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                <CardHeader 
                  title="Recent Policy Violations" 
                  sx={{ 
                    '& .MuiCardHeader-title': { color: 'white' }
                  }}
                />
                <CardContent>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Latest policy violations and their resolution status across the governance framework.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add policy"
        onClick={handleCreatePolicy}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          backgroundColor: '#3182ce',
          '&:hover': {
            backgroundColor: '#2c5aa0'
          }
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default GovernancePoliciesPage;

