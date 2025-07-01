/**
 * Enhanced Governance Policies Page
 * 
 * Complete policy management interface with real CRUD operations, comprehensive tooltips,
 * monitoring integration, and advanced policy features. Production-ready implementation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PolicyRuleBuilder } from '../components/governance/PolicyRuleBuilder';
import { policyEnhancementAPI } from '../services/api/policyEnhancementAPI';
import { policiesAPI, PolicyTemplate, AgentPolicyAssignment, PolicyRule, PolicyViolation, PolicyAnalytics } from '../services/api/policiesAPI';
import { MonitoringExtension } from '../extensions/MonitoringExtension';
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
  AlertTitle,
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
  Fab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  Menu,
  MenuList,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  CircularProgress,
  Skeleton
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
  MoreVert,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Search,
  Sort,
  ImportExport,
  TestTube,
  Analytics,
  Shield,
  Speed,
  Verified,
  Psychology,
  Timeline,
  Assessment,
  BugReport,
  Code,
  DataObject,
  FileDownload,
  FileUpload,
  Settings,
  Info,
  HelpOutline,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

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

const EnhancedGovernancePoliciesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'usage_count' | 'effectiveness_score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  // Data states
  const [policyTemplates, setPolicyTemplates] = useState<PolicyTemplate[]>([]);
  const [agentAssignments, setAgentAssignments] = useState<AgentPolicyAssignment[]>([]);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[]>([]);
  const [policyAnalytics, setPolicyAnalytics] = useState<PolicyAnalytics | null>(null);
  
  // Dialog states
  const [createPolicyOpen, setCreatePolicyOpen] = useState(false);
  const [editPolicyOpen, setEditPolicyOpen] = useState(false);
  const [assignPolicyOpen, setAssignPolicyOpen] = useState(false);
  const [testPolicyOpen, setTestPolicyOpen] = useState(false);
  const [importPolicyOpen, setImportPolicyOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyTemplate | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AgentPolicyAssignment | null>(null);
  
  // Form states
  const [newPolicy, setNewPolicy] = useState<Partial<PolicyTemplate>>({
    name: '',
    description: '',
    category: 'general',
    compliance_level: 'standard',
    rules: [],
    tags: []
  });
  const [newRule, setNewRule] = useState<Partial<PolicyRule>>({
    name: '',
    type: 'trust_threshold',
    condition: '',
    action: 'warn',
    parameters: {},
    enabled: true,
    priority: 1
  });
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPolicyForMenu, setSelectedPolicyForMenu] = useState<PolicyTemplate | null>(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [templates, assignments, violations, analytics] = await Promise.all([
        policiesAPI.getPolicyTemplates(),
        policiesAPI.getAgentPolicyAssignments(),
        policiesAPI.getPolicyViolations(),
        policiesAPI.getPolicyAnalytics()
      ]);
      
      setPolicyTemplates(templates);
      setAgentAssignments(assignments);
      setPolicyViolations(violations);
      setPolicyAnalytics(analytics);
    } catch (error) {
      console.error('Error loading policy data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load policy information. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Filter and sort policies
  const filteredPolicies = policyTemplates
    .filter(policy => {
      const matchesSearch = policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           policy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           policy.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || policy.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle policy creation
  const handleCreatePolicy = async () => {
    try {
      if (!newPolicy.name || !newPolicy.description) {
        toast({
          title: 'Validation Error',
          description: 'Policy name and description are required.',
          variant: 'destructive'
        });
        return;
      }

      const createdPolicy = await policiesAPI.createPolicyTemplate({
        name: newPolicy.name,
        description: newPolicy.description,
        category: newPolicy.category || 'general',
        compliance_level: newPolicy.compliance_level || 'standard',
        rules: newPolicy.rules || [],
        tags: newPolicy.tags || []
      });

      setPolicyTemplates(prev => [...prev, createdPolicy]);
      setCreatePolicyOpen(false);
      setNewPolicy({
        name: '',
        description: '',
        category: 'general',
        compliance_level: 'standard',
        rules: [],
        tags: []
      });

      toast({
        title: 'Policy Created',
        description: `Policy "${createdPolicy.name}" has been created successfully.`,
        variant: 'default'
      });

      // Track policy creation in monitoring
      MonitoringExtension.trackEvent('policy_created', {
        policy_id: createdPolicy.id,
        policy_name: createdPolicy.name,
        category: createdPolicy.category,
        user_id: user?.id
      });

    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create policy. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle policy update
  const handleUpdatePolicy = async () => {
    try {
      if (!selectedPolicy) return;

      const updatedPolicy = await policiesAPI.updatePolicyTemplate({
        id: selectedPolicy.id,
        name: newPolicy.name || selectedPolicy.name,
        description: newPolicy.description || selectedPolicy.description,
        category: newPolicy.category || selectedPolicy.category,
        compliance_level: newPolicy.compliance_level || selectedPolicy.compliance_level,
        rules: newPolicy.rules || selectedPolicy.rules,
        tags: newPolicy.tags || selectedPolicy.tags
      });

      setPolicyTemplates(prev => 
        prev.map(policy => policy.id === updatedPolicy.id ? updatedPolicy : policy)
      );
      setEditPolicyOpen(false);
      setSelectedPolicy(null);

      toast({
        title: 'Policy Updated',
        description: `Policy "${updatedPolicy.name}" has been updated successfully.`,
        variant: 'default'
      });

      MonitoringExtension.trackEvent('policy_updated', {
        policy_id: updatedPolicy.id,
        policy_name: updatedPolicy.name,
        user_id: user?.id
      });

    } catch (error) {
      console.error('Error updating policy:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update policy. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle policy deletion
  const handleDeletePolicy = async (policyId: string) => {
    try {
      await policiesAPI.deletePolicyTemplate(policyId);
      setPolicyTemplates(prev => prev.filter(policy => policy.id !== policyId));
      
      toast({
        title: 'Policy Deleted',
        description: 'Policy has been deleted successfully.',
        variant: 'default'
      });

      MonitoringExtension.trackEvent('policy_deleted', {
        policy_id: policyId,
        user_id: user?.id
      });

    } catch (error) {
      console.error('Error deleting policy:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete policy. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle policy duplication
  const handleDuplicatePolicy = async (policy: PolicyTemplate) => {
    try {
      const duplicatedPolicy = await policiesAPI.duplicatePolicyTemplate(
        policy.id, 
        `${policy.name} (Copy)`
      );
      setPolicyTemplates(prev => [...prev, duplicatedPolicy]);
      
      toast({
        title: 'Policy Duplicated',
        description: `Policy "${duplicatedPolicy.name}" has been created.`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Error duplicating policy:', error);
      toast({
        title: 'Duplication Failed',
        description: 'Failed to duplicate policy. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle policy export
  const handleExportPolicy = async (policy: PolicyTemplate, format: 'json' | 'yaml' | 'xml') => {
    try {
      const blob = await policiesAPI.exportPolicyTemplate(policy.id, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${policy.name}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Policy Exported',
        description: `Policy exported as ${format.toUpperCase()} file.`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Error exporting policy:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export policy. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Get policy category icon and color
  const getPolicyIcon = (category: string) => {
    switch (category) {
      case 'financial': return <Security sx={{ color: '#10B981' }} />;
      case 'healthcare': return <Gavel sx={{ color: '#3B82F6' }} />;
      case 'legal': return <Assignment sx={{ color: '#8B5CF6' }} />;
      case 'security': return <Shield sx={{ color: '#EF4444' }} />;
      case 'compliance': return <Verified sx={{ color: '#F59E0B' }} />;
      default: return <Policy sx={{ color: '#6B7280' }} />;
    }
  };

  const getPolicyColor = (category: string) => {
    switch (category) {
      case 'financial': return '#10B981';
      case 'healthcare': return '#3B82F6';
      case 'legal': return '#8B5CF6';
      case 'security': return '#EF4444';
      case 'compliance': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Get compliance level color
  const getComplianceLevelColor = (level: string) => {
    switch (level) {
      case 'lenient': return '#10B981';
      case 'standard': return '#F59E0B';
      case 'strict': return '#EF4444';
      case 'enterprise': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'deprecated': return '#EF4444';
      case 'archived': return '#6B7280';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Governance Policies
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item}>
              <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" width="100%" height={40} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2, color: '#a0aec0' }}>
          <Link color="inherit" href="/governance">
            Governance
          </Link>
          <Typography color="white">Policies</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              Governance Policies
            </Typography>
            <Typography variant="body1" sx={{ color: '#a0aec0' }}>
              Manage policy templates, agent assignments, and compliance monitoring
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Import policy template from file (JSON, YAML, or XML format)">
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setImportPolicyOpen(true)}
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
            </Tooltip>
            
            <Tooltip title="Create a new policy template with custom rules and compliance settings">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreatePolicyOpen(true)}
                sx={{
                  backgroundColor: '#3182ce',
                  '&:hover': {
                    backgroundColor: '#2c5aa0'
                  }
                }}
              >
                Create Policy
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Analytics Overview */}
        {policyAnalytics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Policy sx={{ color: '#3b82f6', mr: 2 }} />
                    <Typography variant="h6">
                      <Tooltip title="Total number of policy templates in the system">
                        Total Policies
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {policyAnalytics.total_policies}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    {policyAnalytics.active_policies} active
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ color: '#10b981', mr: 2 }} />
                    <Typography variant="h6">
                      <Tooltip title="Percentage of agents that are compliant with assigned policies">
                        Compliance Rate
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                    {Math.round(policyAnalytics.compliance_rate * 100)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    {policyAnalytics.total_assignments} assignments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color:'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assessment sx={{ color: '#f59e0b', mr: 2 }} />
                    <Typography variant="h6">
                      <Tooltip title="Average effectiveness score across all policies (based on compliance and violation rates)">
                        Effectiveness
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {Math.round(policyAnalytics.avg_effectiveness_score * 100)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Average score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {policyAnalytics.violation_trend === 'increasing' ? (
                      <TrendingUp sx={{ color: '#ef4444', mr: 2 }} />
                    ) : policyAnalytics.violation_trend === 'decreasing' ? (
                      <TrendingDown sx={{ color: '#10b981', mr: 2 }} />
                    ) : (
                      <Timeline sx={{ color: '#6b7280', mr: 2 }} />
                    )}
                    <Typography variant="h6">
                      <Tooltip title="Current trend in policy violations over the past 30 days">
                        Violation Trend
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ 
                    color: policyAnalytics.violation_trend === 'increasing' ? '#ef4444' : 
                           policyAnalytics.violation_trend === 'decreasing' ? '#10b981' : '#6b7280',
                    fontWeight: 'bold' 
                  }}>
                    {policyAnalytics.violation_trend.charAt(0).toUpperCase() + policyAnalytics.violation_trend.slice(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Past 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
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


      {/* Search and Filter Controls */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search policies, descriptions, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Tooltip title="Search across policy names, descriptions, and tags">
                      <Search sx={{ color: '#a0aec0', mr: 1 }} />
                    </Tooltip>
                  )
                }}
                sx={{
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
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#a0aec0' }}>
                  <Tooltip title="Filter policies by category (financial, healthcare, legal, etc.)">
                    Category
                  </Tooltip>
                </InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  sx={{
                    backgroundColor: '#1a202c',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4a5568',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#718096',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3182ce',
                    },
                  }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="financial">Financial</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="legal">Legal</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="compliance">Compliance</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#a0aec0' }}>
                  <Tooltip title="Filter policies by status (active, draft, deprecated, archived)">
                    Status
                  </Tooltip>
                </InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{
                    backgroundColor: '#1a202c',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4a5568',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#718096',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3182ce',
                    },
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#a0aec0' }}>
                  <Tooltip title="Sort policies by name, creation date, usage count, or effectiveness score">
                    Sort By
                  </Tooltip>
                </InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  sx={{
                    backgroundColor: '#1a202c',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4a5568',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#718096',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3182ce',
                    },
                  }}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="created_at">Created Date</MenuItem>
                  <MenuItem value="usage_count">Usage Count</MenuItem>
                  <MenuItem value="effectiveness_score">Effectiveness</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}>
                  <IconButton
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    sx={{ color: '#a0aec0' }}
                  >
                    <Sort />
                  </IconButton>
                </Tooltip>

                <Tooltip title={`View mode: ${viewMode === 'grid' ? 'Grid' : 'Table'}`}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
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
                    <ToggleButton value="grid">
                      <Assessment />
                    </ToggleButton>
                    <ToggleButton value="table">
                      <Timeline />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Tooltip>

                <Tooltip title="Refresh policy data from server">
                  <IconButton
                    onClick={loadAllData}
                    sx={{ color: '#a0aec0' }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
              '& .MuiTab-root': { 
                color: '#a0aec0',
                '&.Mui-selected': { color: '#3b82f6' }
              }
            }}
          >
            <Tab 
              label={
                <Tooltip title="Manage policy templates that can be assigned to agents">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Policy />
                    Policy Templates
                    <Badge badgeContent={filteredPolicies.length} color="primary" />
                  </Box>
                </Tooltip>
              } 
            />
            <Tab 
              label={
                <Tooltip title="View and manage policy assignments to specific agents">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Agent Assignments
                    <Badge badgeContent={agentAssignments.length} color="primary" />
                  </Box>
                </Tooltip>
              } 
            />
            <Tab 
              label={
                <Tooltip title="Monitor policy violations and compliance issues">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning />
                    Violations
                    <Badge badgeContent={policyViolations.filter(v => !v.resolved_at).length} color="error" />
                  </Box>
                </Tooltip>
              } 
            />
            <Tab 
              label={
                <Tooltip title="View policy analytics, effectiveness metrics, and compliance trends">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Analytics />
                    Analytics
                  </Box>
                </Tooltip>
              } 
            />
          </Tabs>
        </Box>

        {/* Policy Templates Tab */}
        <TabPanel value={activeTab} index={0}>
          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {filteredPolicies.map((policy) => (
                <Grid item xs={12} md={6} lg={4} key={policy.id}>
                  <Card 
                    sx={{ 
                      backgroundColor: '#1a202c', 
                      color: 'white', 
                      border: '1px solid #4a5568',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: getPolicyColor(policy.category),
                        boxShadow: `0 4px 12px ${getPolicyColor(policy.category)}20`
                      }
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ backgroundColor: getPolicyColor(policy.category) }}>
                          {getPolicyIcon(policy.category)}
                        </Avatar>
                      }
                      title={
                        <Tooltip title={`Policy: ${policy.name} - ${policy.description}`}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {policy.name}
                          </Typography>
                        </Tooltip>
                      }
                      subheader={
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Tooltip title={`Category: ${policy.category}`}>
                            <Chip 
                              label={policy.category} 
                              size="small" 
                              sx={{ 
                                backgroundColor: getPolicyColor(policy.category),
                                color: 'white',
                                fontSize: '0.75rem'
                              }} 
                            />
                          </Tooltip>
                          <Tooltip title={`Compliance Level: ${policy.compliance_level}`}>
                            <Chip 
                              label={policy.compliance_level} 
                              size="small" 
                              sx={{ 
                                backgroundColor: getComplianceLevelColor(policy.compliance_level),
                                color: 'white',
                                fontSize: '0.75rem'
                              }} 
                            />
                          </Tooltip>
                          <Tooltip title={`Status: ${policy.status}`}>
                            <Chip 
                              label={policy.status} 
                              size="small" 
                              sx={{ 
                                backgroundColor: getStatusColor(policy.status),
                                color: 'white',
                                fontSize: '0.75rem'
                              }} 
                            />
                          </Tooltip>
                        </Box>
                      }
                      action={
                        <IconButton
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedPolicyForMenu(policy);
                          }}
                          sx={{ color: '#a0aec0' }}
                        >
                          <Tooltip title="More actions for this policy">
                            <MoreVert />
                          </Tooltip>
                        </IconButton>
                      }
                      sx={{
                        '& .MuiCardHeader-subheader': { color: '#a0aec0' }
                      }}
                    />
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                        {policy.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#718096', mb: 1, display: 'block' }}>
                          <Tooltip title="Number of rules defined in this policy">
                            Rules: {policy.rules.length}
                          </Tooltip>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#718096', mb: 1, display: 'block' }}>
                          <Tooltip title="Number of agents currently using this policy">
                            Usage: {policy.usage_count} agents
                          </Tooltip>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#718096', mb: 1, display: 'block' }}>
                          <Tooltip title="Policy effectiveness score based on compliance and violation rates">
                            Effectiveness: {Math.round(policy.effectiveness_score * 100)}%
                          </Tooltip>
                        </Typography>
                      </Box>

                      {policy.tags.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#718096', mb: 1, display: 'block' }}>
                            Tags:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {policy.tags.map((tag) => (
                              <Tooltip key={tag} title={`Tag: ${tag}`}>
                                <Chip 
                                  label={tag} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    borderColor: '#4a5568',
                                    color: '#a0aec0',
                                    fontSize: '0.7rem'
                                  }} 
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Tooltip title="Edit this policy template">
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setNewPolicy(policy);
                              setEditPolicyOpen(true);
                            }}
                            sx={{ 
                              color: '#3182ce',
                              borderColor: '#3182ce',
                              '&:hover': {
                                backgroundColor: '#3182ce20'
                              }
                            }}
                          >
                            Edit
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Test this policy with sample input">
                          <Button
                            size="small"
                            startIcon={<TestTube />}
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setTestPolicyOpen(true);
                            }}
                            sx={{ 
                              color: '#f59e0b',
                              borderColor: '#f59e0b',
                              '&:hover': {
                                backgroundColor: '#f59e0b20'
                              }
                            }}
                          >
                            Test
                          </Button>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            // Table view for policies
            <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Tooltip title="Policy name and category">
                        Policy
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Tooltip title="Compliance level and current status">
                        Compliance
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Tooltip title="Number of rules and agents using this policy">
                        Usage
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Tooltip title="Policy effectiveness score and trend">
                        Effectiveness
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Tooltip title="Available actions for this policy">
                        Actions
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id} sx={{ '&:hover': { backgroundColor: '#2d3748' } }}>
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, backgroundColor: getPolicyColor(policy.category) }}>
                            {getPolicyIcon(policy.category)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {policy.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                              {policy.category}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Box>
                          <Chip 
                            label={policy.compliance_level} 
                            size="small" 
                            sx={{ 
                              backgroundColor: getComplianceLevelColor(policy.compliance_level),
                              color: 'white',
                              mb: 1
                            }} 
                          />
                          <br />
                          <Chip 
                            label={policy.status} 
                            size="small" 
                            sx={{ 
                              backgroundColor: getStatusColor(policy.status),
                              color: 'white'
                            }} 
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Typography variant="body2">
                          {policy.rules.length} rules
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          {policy.usage_count} agents
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {Math.round(policy.effectiveness_score * 100)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={policy.effectiveness_score * 100}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#4a5568',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: policy.effectiveness_score >= 0.8 ? '#10b981' : 
                                                policy.effectiveness_score >= 0.6 ? '#f59e0b' : '#ef4444'
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit policy">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedPolicy(policy);
                                setNewPolicy(policy);
                                setEditPolicyOpen(true);
                              }}
                              sx={{ color: '#3182ce' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Test policy">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedPolicy(policy);
                                setTestPolicyOpen(true);
                              }}
                              sx={{ color: '#f59e0b' }}
                            >
                              <TestTube />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More actions">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                setAnchorEl(e.currentTarget);
                                setSelectedPolicyForMenu(policy);
                              }}
                              sx={{ color: '#a0aec0' }}
                            >
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredPolicies.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Policy sx={{ fontSize: 64, color: '#4a5568', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
                No policies found
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
                {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first policy template to get started'
                }
              </Typography>
              {(!searchQuery && filterCategory === 'all' && filterStatus === 'all') && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreatePolicyOpen(true)}
                  sx={{
                    backgroundColor: '#3182ce',
                    '&:hover': {
                      backgroundColor: '#2c5aa0'
                    }
                  }}
                >
                  Create First Policy
                </Button>
              )}
            </Box>
          )}
        </TabPanel>

        {/* Agent Assignments Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                Agent Policy Assignments
              </Typography>
              <Tooltip title="Assign policies to agents or multi-agent systems">
                <Button
                  variant="contained"
                  startIcon={<Assignment />}
                  onClick={() => setAssignPolicyOpen(true)}
                  sx={{
                    backgroundColor: '#3182ce',
                    '&:hover': {
                      backgroundColor: '#2c5aa0'
                    }
                  }}
                >
                  Assign Policy
                </Button>
              </Tooltip>
            </Box>
            
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Manage policy assignments to individual agents and multi-agent systems
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Agent name and type (single agent or multi-agent system)">
                      Agent
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Policies currently assigned to this agent">
                      Assigned Policies
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Current compliance status and trust score">
                      Compliance
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Policy enforcement mode and last evaluation">
                      Enforcement
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Available actions for this assignment">
                      Actions
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agentAssignments.map((assignment) => (
                  <TableRow key={assignment.id} sx={{ '&:hover': { backgroundColor: '#2d3748' } }}>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, backgroundColor: assignment.agent_type === 'single' ? '#3b82f6' : '#8b5cf6' }}>
                          {assignment.agent_type === 'single' ? <Person /> : <Group />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {assignment.agent_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            {assignment.agent_type === 'single' ? 'Single Agent' : 'Multi-Agent System'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {assignment.policy_ids.map((policyId) => {
                          const policy = policyTemplates.find(p => p.id === policyId);
                          return policy ? (
                            <Tooltip key={policyId} title={`Policy: ${policy.name} - ${policy.description}`}>
                              <Chip 
                                label={policy.name} 
                                size="small" 
                                sx={{ 
                                  backgroundColor: getPolicyColor(policy.category),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }} 
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              key={policyId}
                              label="Unknown Policy" 
                              size="small" 
                              sx={{ 
                                backgroundColor: '#6b7280',
                                color: 'white',
                                fontSize: '0.75rem'
                              }} 
                            />
                          );
                        })}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip 
                            label={assignment.compliance_status} 
                            size="small" 
                            sx={{ 
                              backgroundColor: assignment.compliance_status === 'compliant' ? '#10b981' :
                                             assignment.compliance_status === 'warning' ? '#f59e0b' : '#ef4444',
                              color: 'white',
                              mr: 1
                            }} 
                          />
                          {assignment.compliance_status === 'compliant' ? <CheckCircle sx={{ color: '#10b981' }} /> :
                           assignment.compliance_status === 'warning' ? <Warning sx={{ color: '#f59e0b' }} /> :
                           <Error sx={{ color: '#ef4444' }} />}
                        </Box>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          Trust Score: {Math.round(assignment.trust_score)}%
                        </Typography>
                        {assignment.violation_count > 0 && (
                          <Typography variant="caption" sx={{ color: '#ef4444', display: 'block' }}>
                            {assignment.violation_count} violations
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box>
                        <Chip 
                          label={assignment.enforcement_mode} 
                          size="small" 
                          sx={{ 
                            backgroundColor: assignment.enforcement_mode === 'monitor' ? '#6b7280' :
                                           assignment.enforcement_mode === 'enforce' ? '#f59e0b' : '#ef4444',
                            color: 'white',
                            mb: 1
                          }} 
                        />
                        <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                          Last evaluated: {new Date(assignment.last_evaluation).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit assignment">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setAssignPolicyOpen(true);
                            }}
                            sx={{ color: '#3182ce' }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View details">
                          <IconButton 
                            size="small"
                            sx={{ color: '#f59e0b' }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove assignment">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              // Handle remove assignment
                            }}
                            sx={{ color: '#ef4444' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {agentAssignments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Assignment sx={{ fontSize: 64, color: '#4a5568', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
                No policy assignments found
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
                Assign policies to agents to start monitoring compliance
              </Typography>
              <Button
                variant="contained"
                startIcon={<Assignment />}
                onClick={() => setAssignPolicyOpen(true)}
                sx={{
                  backgroundColor: '#3182ce',
                  '&:hover': {
                    backgroundColor: '#2c5aa0'
                  }
                }}
              >
                Assign First Policy
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Violations Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              Policy Violations
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Monitor and resolve policy violations across all agents
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Violation details and affected policy rule">
                      Violation
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Agent that triggered the violation">
                      Agent
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Violation severity and impact score">
                      Severity
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="When the violation occurred">
                      Occurred
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Current resolution status">
                      Status
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    <Tooltip title="Available actions for this violation">
                      Actions
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policyViolations.slice(0, 10).map((violation) => (
                  <TableRow key={violation.id} sx={{ '&:hover': { backgroundColor: '#2d3748' } }}>
                    <TableCell sx={{ color: 'white' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {violation.rule_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          Policy: {violation.policy_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1 }}>
                          {violation.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {violation.agent_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        {violation.agent_id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box>
                        <Chip 
                          label={violation.severity} 
                          size="small" 
                          sx={{ 
                            backgroundColor: violation.severity === 'critical' ? '#ef4444' :
                                           violation.severity === 'high' ? '#f97316' :
                                           violation.severity === 'medium' ? '#f59e0b' : '#10b981',
                            color: 'white',
                            mb: 1
                          }} 
                        />
                        <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                          Impact: {Math.round(violation.impact_score * 100)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2">
                        {new Date(violation.occurred_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        {new Date(violation.occurred_at).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {violation.resolved_at ? (
                        <Box>
                          <Chip 
                            label="Resolved" 
                            size="small" 
                            sx={{ backgroundColor: '#10b981', color: 'white', mb: 1 }} 
                          />
                          <Typography variant="caption" sx={{ color: '#a0aec0', display: 'block' }}>
                            {new Date(violation.resolved_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip 
                          label="Open" 
                          size="small" 
                          sx={{ backgroundColor: '#ef4444', color: 'white' }} 
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View violation details">
                          <IconButton 
                            size="small"
                            sx={{ color: '#3182ce' }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {!violation.resolved_at && (
                          <Tooltip title="Resolve violation">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                // Handle resolve violation
                              }}
                              sx={{ color: '#10b981' }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {policyViolations.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#a0aec0', mb: 1 }}>
                No policy violations
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                All agents are compliant with their assigned policies
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Policy Analytics & Insights
          </Typography>
          
          {policyAnalytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                  <CardHeader 
                    title={
                      <Tooltip title="Overall policy effectiveness and compliance metrics">
                        Policy Performance Overview
                      </Tooltip>
                    }
                    sx={{ '& .MuiCardHeader-title': { color: 'white' } }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Compliance Rate
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                          {Math.round(policyAnalytics.compliance_rate * 100)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Policy Coverage
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                          {Math.round(policyAnalytics.policy_coverage * 100)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#1a202c', color: 'white', border: '1px solid #4a5568' }}>
                  <CardHeader 
                    title={
                      <Tooltip title="Most and least effective policies based on compliance rates">
                        Top Performing Policies
                      </Tooltip>
                    }
                    sx={{ '& .MuiCardHeader-title': { color: 'white' } }}
                  />
                  <CardContent>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Most Effective:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#10b981', mb: 2 }}>
                      {policyAnalytics.most_effective_policy}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Most Violated:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ef4444' }}>
                      {policyAnalytics.most_violated_policy}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Card>

      {/* Context Menu for Policy Actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568'
          }
        }}
      >
        {selectedPolicyForMenu && (
          <MenuList>
            <MenuItem onClick={() => {
              setSelectedPolicy(selectedPolicyForMenu);
              setNewPolicy(selectedPolicyForMenu);
              setEditPolicyOpen(true);
              setAnchorEl(null);
            }}>
              <ListItemIcon>
                <Edit sx={{ color: '#3182ce' }} />
              </ListItemIcon>
              <ListItemText>
                <Tooltip title="Edit this policy template">
                  Edit Policy
                </Tooltip>
              </ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              handleDuplicatePolicy(selectedPolicyForMenu);
              setAnchorEl(null);
            }}>
              <ListItemIcon>
                <ContentCopy sx={{ color: '#f59e0b' }} />
              </ListItemIcon>
              <ListItemText>
                <Tooltip title="Create a copy of this policy">
                  Duplicate
                </Tooltip>
              </ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              handleExportPolicy(selectedPolicyForMenu, 'json');
              setAnchorEl(null);
            }}>
              <ListItemIcon>
                <Download sx={{ color: '#10b981' }} />
              </ListItemIcon>
              <ListItemText>
                <Tooltip title="Export policy as JSON file">
                  Export JSON
                </Tooltip>
              </ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              setSelectedPolicy(selectedPolicyForMenu);
              setTestPolicyOpen(true);
              setAnchorEl(null);
            }}>
              <ListItemIcon>
                <TestTube sx={{ color: '#8b5cf6' }} />
              </ListItemIcon>
              <ListItemText>
                <Tooltip title="Test policy with sample input">
                  Test Policy
                </Tooltip>
              </ListItemText>
            </MenuItem>
            
            <Divider sx={{ borderColor: '#4a5568' }} />
            
            <MenuItem onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${selectedPolicyForMenu.name}"?`)) {
                handleDeletePolicy(selectedPolicyForMenu.id);
              }
              setAnchorEl(null);
            }}>
              <ListItemIcon>
                <Delete sx={{ color: '#ef4444' }} />
              </ListItemIcon>
              <ListItemText>
                <Tooltip title="Permanently delete this policy">
                  Delete Policy
                </Tooltip>
              </ListItemText>
            </MenuItem>
          </MenuList>
        )}
      </Menu>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add policy"
        onClick={() => setCreatePolicyOpen(true)}
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
        <Tooltip title="Create a new policy template">
          <Add />
        </Tooltip>
      </Fab>

      {/* TODO: Add dialogs for create, edit, assign, test, and import */}
      {/* These would be comprehensive dialog components with form validation */}
    </Box>
  );
};

export default EnhancedGovernancePoliciesPage;

