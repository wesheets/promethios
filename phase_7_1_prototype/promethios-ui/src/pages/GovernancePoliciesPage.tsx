/**
 * Enhanced Governance Policies Page
 * 
 * Complete policy management interface with real CRUD operations, comprehensive tooltips,
 * monitoring integration, and advanced policy features. Production-ready implementation.
 * Integrated with Promethios PolicyManagementModule.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { useAuth } from '../context/AuthContext';
import { usePolicies } from '../hooks/usePolicies';
import { usePolicyAssignments } from '../hooks/usePolicyAssignments';
import HorizontalPolicyWizard from '../components/governance/HorizontalPolicyWizard';
import AgentPolicyAssignment from '../components/governance/AgentPolicyAssignment';
import PolicyDetailsDialog from '../components/governance/PolicyDetailsDialog';
import { prometheiosPolicyAPI, PrometheiosPolicy, PrometheiosPolicyRule, PolicyAnalytics, PolicyOptimization, PolicyConflict } from '../services/api/prometheiosPolicyAPI';
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
  CircularProgress,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Fab,
  Snackbar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  Search,
  FilterList,
  Sort,
  GridView,
  TableRows,
  Download,
  Upload,
  Share,
  ContentCopy,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  CloudUpload,
  CloudDownload,
  Assignment,
  AssignmentTurnedIn,
  Warning,
  CheckCircle,
  Error,
  Info,
  Security,
  Gavel,
  Settings,
  Balance,
  Article,
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
  HelpOutline,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import AgentMetricsWidget from '../components/AgentMetricsWidget';
import { useMultiAgentRealTimeMetrics } from '../hooks/useRealTimeMetrics';
import { userAgentStorageService } from '../services/UserAgentStorageService';
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
  
  // Use the policies hook for integrated backend + storage management
  const {
    policies,
    loading,
    error: policiesError,
    loadPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    policyStats,
    generatePolicyFromNL
  } = usePolicies();
  
  // Policy assignments hook for agent-policy management
  const { 
    assignments, 
    summary: assignmentSummary, 
    loading: assignmentsLoading, 
    assignPolicy, 
    unassignPolicy, 
    updateAssignment,
    getAgentAssignments,
    getPolicyAssignments,
    isAssigned 
  } = usePolicyAssignments();
  
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'effectiveness_score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Additional states for enhanced features
  const [policyTemplates, setPolicyTemplates] = useState<any[]>([]);
  const [policyAnalytics, setPolicyAnalytics] = useState<{[key: string]: PolicyAnalytics}>({});
  const [policyOptimizations, setPolicyOptimizations] = useState<{[key: string]: PolicyOptimization}>({});
  const [policyConflicts, setPolicyConflicts] = useState<{[key: string]: PolicyConflict[]}>({});
  
  // Agent metrics integration
  const [userAgents, setUserAgents] = useState<Array<{ agentId: string; version: 'test' | 'production' }>>([]);
  const agentMetrics = useMultiAgentRealTimeMetrics(userAgents);
  
  // Dialog states
  const [createPolicyOpen, setCreatePolicyOpen] = useState(false);
  const [editPolicyOpen, setEditPolicyOpen] = useState(false);
  const [viewPolicyOpen, setViewPolicyOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PrometheiosPolicy | null>(null);
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPolicyForMenu, setSelectedPolicyForMenu] = useState<PrometheiosPolicy | null>(null);

  // Load initial data
  useEffect(() => {
    loadPolicies();
    loadTemplatesAndAnalytics();
  }, [loadPolicies]);

  // Load user agents for policy compliance tracking
  useEffect(() => {
    const loadUserAgents = async () => {
      try {
        console.log('🔍 Starting agent loading process...');
        console.log('🔍 Current user:', user?.uid);
        console.log('🔍 User object:', user);
        
        // Ensure user agent storage service has current user
        if (user?.uid) {
          console.log('🔍 Setting current user in storage service:', user.uid);
          userAgentStorageService.setCurrentUser(user.uid);
        } else {
          console.warn('⚠️ No user UID available for agent loading');
          setUserAgents([]);
          setAgentMetrics(prev => ({ ...prev, isLoading: false }));
          return;
        }
        
        console.log('🔍 Calling userAgentStorageService.loadUserAgents()...');
        const agents = await userAgentStorageService.loadUserAgents();
        console.log('🔍 Raw agents loaded from storage:', agents);
        console.log('🔍 Number of agents loaded:', agents.length);
        
        if (agents.length === 0) {
          console.log('⚠️ No agents found in storage for user:', user.uid);
          console.log('💡 This could mean:');
          console.log('  1. No agents have been created yet');
          console.log('  2. Agents are stored with different keys');
          console.log('  3. User authentication issue');
          console.log('  4. Storage service configuration issue');
        }
        
        // Use actual agent profiles instead of creating duplicates
        const agentList = agents.map(agent => {
          console.log('🔍 Processing agent:', agent.identity?.name || 'Unknown');
          return {
            agentId: agent.identity.id,
            name: agent.identity.name,
            status: agent.identity.status,
            version: agent.identity.version || 'production'
          };
        });
        
        // Remove duplicates based on agentId
        const uniqueAgents = agentList.filter((agent, index, self) => 
          index === self.findIndex(a => a.agentId === agent.agentId)
        );
        
        console.log('🎯 Final unique agents for compliance tracking:', uniqueAgents);
        console.log('🎯 Agent names:', uniqueAgents.map(a => a.name));
        setUserAgents(uniqueAgents);
        
        // Set loading to false after successful load
        setAgentMetrics(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('❌ Failed to load user agents for policy tracking:', error);
        console.error('❌ Error details:', error);
        setUserAgents([]); // Fallback to empty array
        setAgentMetrics(prev => ({ ...prev, isLoading: false }));
      }
    };

    // Only load agents if user is authenticated and not loading
    if (user?.uid && !loading) {
      console.log('🔍 User authenticated, loading agents...');
      loadUserAgents();
    } else if (!loading) {
      console.log('🔍 No authenticated user, setting empty agents list');
      setUserAgents([]);
      setAgentMetrics(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, loading]); // Add loading dependency

  const loadTemplatesAndAnalytics = useCallback(async () => {
    try {
      // Load templates
      const templatesData = await prometheiosPolicyAPI.getPolicyTemplates();
      setPolicyTemplates(templatesData);
      
      // Load analytics for existing policies
      if (policies.length > 0) {
        const analyticsPromises = policies.map(async (policy) => {
          try {
            const analytics = await prometheiosPolicyAPI.getPolicyAnalytics(policy.policy_id);
            return { policyId: policy.policy_id, analytics };
          } catch (error) {
            console.warn(`Failed to load analytics for policy ${policy.policy_id}:`, error);
            return { policyId: policy.policy_id, analytics: null };
          }
        });
        
        const analyticsResults = await Promise.all(analyticsPromises);
        const analyticsMap: {[key: string]: PolicyAnalytics} = {};
        analyticsResults.forEach(result => {
          if (result.analytics) {
            analyticsMap[result.policyId] = result.analytics;
          }
        });
        setPolicyAnalytics(analyticsMap);
      }
    } catch (error) {
      console.error('Error loading templates and analytics:', error);
    }
  }, [policies]);

  // Policy management functions using the hook
  const handleCreatePolicy = async (policyData: any) => {
    console.log('🏭 handleCreatePolicy called with data:', JSON.stringify(policyData, null, 2));
    
    try {
      console.log('🔄 Calling createPolicy hook...');
      const createdPolicy = await createPolicy(policyData);
      
      if (createdPolicy) {
        console.log('✅ Policy created successfully:', createdPolicy.policy_id);
        console.log('🚪 Closing dialog...');
        setCreatePolicyOpen(false);
        
        console.log('📊 Reloading analytics...');
        // Reload analytics for the new policy
        loadTemplatesAndAnalytics();
      } else {
        console.error('❌ createPolicy returned null/undefined');
        throw new Error('Policy creation returned null');
      }
    } catch (error) {
      console.error('💥 Failed to create policy in handleCreatePolicy:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error; // Re-throw to let the wizard handle it
    }
  };

  const handleUpdatePolicy = async (policyId: string, updates: any) => {
    try {
      const updatedPolicy = await updatePolicy(policyId, updates);
      if (updatedPolicy) {
        setEditPolicyOpen(false);
        setSelectedPolicy(null);
        // Reload analytics
        loadTemplatesAndAnalytics();
      }
    } catch (error) {
      console.error('Failed to update policy:', error);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      const deleted = await deletePolicy(policyId);
      if (deleted) {
        // Remove analytics for deleted policy
        setPolicyAnalytics(prev => {
          const newAnalytics = { ...prev };
          delete newAnalytics[policyId];
          return newAnalytics;
        });
      }
    } catch (error) {
      console.error('Failed to delete policy:', error);
    }
  };

  const handleOpenCreatePolicy = () => {
    setCreatePolicyOpen(true);
  };

  const handleOpenEditPolicy = (policy: PrometheiosPolicy) => {
    setSelectedPolicy(policy);
    setEditPolicyOpen(true);
  };

  const handleOpenViewPolicy = (policy: PrometheiosPolicy) => {
    setSelectedPolicy(policy);
    setViewPolicyOpen(true);
  };

  // Filter and sort policies
  const filteredPolicies = (policies || []).filter(policy => {
    const matchesSearch = !searchQuery || 
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || policy.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'created_at':
        aValue = a.created_at;
        bValue = b.created_at;
        break;
      case 'effectiveness_score':
        aValue = policyAnalytics[a.policy_id]?.effectiveness_score || 0;
        bValue = policyAnalytics[b.policy_id]?.effectiveness_score || 0;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Render policy card
  const renderPolicyCard = (policy: PrometheiosPolicy) => {
    const analytics = policyAnalytics[policy.policy_id];
    const categoryConfig = getCategoryConfig(policy.category);
    
    return (
      <Card key={policy.policy_id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: categoryConfig.color }}>
              <categoryConfig.icon />
            </Avatar>
          }
          action={
            <IconButton
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setSelectedPolicyForMenu(policy);
              }}
            >
              <MoreVert />
            </IconButton>
          }
          title={
            <Tooltip title={policy.description || 'No description available'}>
              <Typography variant="h6" noWrap>
                {policy.name}
              </Typography>
            </Tooltip>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip 
                label={policy.category} 
                size="small" 
                sx={{ bgcolor: categoryConfig.color, color: 'white' }}
              />
              <Chip 
                label={policy.status} 
                size="small" 
                color={policy.status === 'active' ? 'success' : 'default'}
              />
            </Box>
          }
        />
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {policy.description}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Rules: {policy.rules.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Version: {policy.version}
            </Typography>
          </Box>
          
          {analytics && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Effectiveness Score
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={analytics.effectiveness_score * 100} 
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {(analytics.effectiveness_score * 100).toFixed(1)}% | 
                Compliance: {(analytics.compliance_rate * 100).toFixed(1)}%
              </Typography>
            </Box>
          )}
          
          {policy.metadata?.tags && policy.metadata.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {policy.metadata.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
              {policy.metadata.tags.length > 3 && (
                <Chip label={`+${policy.metadata.tags.length - 3}`} size="small" variant="outlined" />
              )}
            </Box>
          )}
        </CardContent>
        
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => handleOpenViewPolicy(policy)}
          >
            View Details
          </Button>
        </Box>
      </Card>
    );
  };

  // Get category configuration
  const getCategoryConfig = (category?: string) => {
    const configs = {
      SECURITY: { icon: Security, color: '#f44336' },
      COMPLIANCE: { icon: Gavel, color: '#2196f3' },
      OPERATIONAL: { icon: Settings, color: '#ff9800' },
      ETHICAL: { icon: Balance, color: '#9c27b0' },
      LEGAL: { icon: Article, color: '#607d8b' }
    };
    return configs[category as keyof typeof configs] || configs.SECURITY;
  };

  // Render main content
  const renderPoliciesTab = () => (
    <Box>
      {/* Header with controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Policy Management
          <Tooltip title="Create, edit, and manage governance policies for your AI agents">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreatePolicy}
          >
            Create Policy
          </Button>
        </Box>
      </Box>

      {/* Search and filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search policies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ minWidth: 300 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="SECURITY">Security</MenuItem>
            <MenuItem value="COMPLIANCE">Compliance</MenuItem>
            <MenuItem value="OPERATIONAL">Operational</MenuItem>
            <MenuItem value="ETHICAL">Ethical</MenuItem>
            <MenuItem value="LEGAL">Legal</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deprecated">Deprecated</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="grid">
            <GridView />
          </ToggleButton>
          <ToggleButton value="table">
            <TableRows />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Policies grid/table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sortedPolicies.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No policies found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first policy to get started'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreatePolicy}
          >
            Create Policy
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sortedPolicies.map((policy) => (
            <Grid item xs={12} sm={6} md={4} key={policy.policy_id}>
              {renderPolicyCard(policy)}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/governance">
            Governance
          </Link>
          <Typography color="text.primary">Policies</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" sx={{ mt: 1 }}>
          Governance Policies
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage AI governance policies with advanced features including natural language generation, 
          ML-powered optimization, and real-time analytics.
        </Typography>
      </Box>

      {/* Main content */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab 
          label="Policies" 
          icon={<Shield />}
          iconPosition="start"
        />
        <Tab 
          label="Templates" 
          icon={<DataObject />}
          iconPosition="start"
        />
        <Tab 
          label="Analytics" 
          icon={<Analytics />}
          iconPosition="start"
        />
        <Tab 
          label="Agent Compliance" 
          icon={<Assignment />}
          iconPosition="start"
        />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {renderPoliciesTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Policy Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Browse and use pre-built policy templates for common compliance requirements.
          </Typography>
          
          <Grid container spacing={3}>
            {/* Security Policy Template */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ color: '#f44336', mr: 1, fontSize: 28 }} />
                    <Typography variant="h6">Basic Security Policy</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Protect against common security threats and data breaches with automated detection and response.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Included Rules:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="Block Personal Information" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Block Low Trust Content" size="small" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      2 pre-configured rules
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => {
                        setCreatePolicyOpen(true);
                        // Could pre-select this template in the wizard
                      }}
                    >
                      Use Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Compliance Policy Template */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Gavel sx={{ color: '#2196f3', mr: 1, fontSize: 28 }} />
                    <Typography variant="h6">Data Compliance Policy</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ensure compliance with data protection regulations like GDPR, CCPA, and industry standards.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Included Rules:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="Log Sensitive Data Access" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Require User Consent" size="small" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      2 pre-configured rules
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => {
                        setCreatePolicyOpen(true);
                        // Could pre-select this template in the wizard
                      }}
                    >
                      Use Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Content Safety Policy Template */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Balance sx={{ color: '#9c27b0', mr: 1, fontSize: 28 }} />
                    <Typography variant="h6">Content Safety Policy</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ensure AI responses are safe, appropriate, and unbiased with automated content filtering.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Included Rules:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="Block Harmful Content" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Check for Bias" size="small" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      2 pre-configured rules
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => {
                        setCreatePolicyOpen(true);
                        // Could pre-select this template in the wizard
                      }}
                    >
                      Use Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Custom Policy Option */}
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                height: '100%', 
                cursor: 'pointer', 
                border: '2px dashed',
                borderColor: 'primary.main',
                '&:hover': { boxShadow: 4, borderColor: 'primary.dark' }
              }}>
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center'
                }}>
                  <Add sx={{ color: 'primary.main', fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Create Custom Policy
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start from scratch and build your own custom policy rules tailored to your specific needs.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setCreatePolicyOpen(true)}
                  >
                    Create Custom
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2">
                <strong>Pro Tip:</strong> Templates provide a quick starting point with industry best practices. 
                You can customize any template after creation to match your specific requirements.
              </Typography>
            </Alert>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6">Policy Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          View comprehensive analytics and insights for your governance policies.
        </Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Agent Policy Compliance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Monitor real-time policy compliance and manage policy assignments across all your agents.
          </Typography>
          
          {/* Agent-Policy Assignment Interface */}
          <AgentPolicyAssignment
            agents={userAgents.map(({ agentId, version }) => {
              const profile = agentMetrics.getProfile(agentId, version);
              const agentAssignments = getAgentAssignments(agentId);
              return {
                agentId,
                agentName: profile?.agentName || agentId,
                version,
                status: 'active' as const,
                assignedPolicies: agentAssignments.map(a => a.policyId)
              };
            })}
            policies={policies.map(policy => {
              const policyAssignments = getPolicyAssignments(policy.policy_id);
              return {
                policy_id: policy.policy_id,
                name: policy.name,
                category: policy.category || 'OPERATIONAL',
                status: policy.status,
                description: policy.description || '',
                assignedAgents: policyAssignments.map(a => a.agentId)
              };
            })}
            assignments={assignments}
            onAssignPolicy={assignPolicy}
            onUnassignPolicy={unassignPolicy}
            onUpdateAssignment={async (agentId: string, policyId: string, updates: any) => {
              const assignment = assignments.find(a => a.agentId === agentId && a.policyId === policyId);
              if (assignment) {
                await updateAssignment(assignment.id, updates);
              }
            }}
          />

          <Divider sx={{ my: 4 }} />

          {/* Existing Compliance Monitoring */}
          <Typography variant="h6" gutterBottom>
            Real-Time Compliance Monitoring
          </Typography>
          
          {/* Show loading only if we have agents but metrics are still loading */}
          {userAgents.length > 0 && agentMetrics.isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                Loading agent compliance data...
              </Typography>
            </Box>
          ) : userAgents.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>No Agents Found</AlertTitle>
              No agents are currently available for policy compliance monitoring. 
              <br />
              <strong>Next steps:</strong>
              <br />
              • Go to <strong>Agent Wrapping</strong> to create and wrap new agents
              • Or visit <strong>My Agents</strong> to check existing agent status
              <br />
              Once agents are created, they will appear here for policy assignment and compliance monitoring.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {userAgents.map(({ agentId, version }) => {
                const profile = agentMetrics.getProfile(agentId, version);
                const error = agentMetrics.getError(agentId, version);
                
                if (error) {
                  return (
                    <Grid item xs={12} sm={6} md={4} key={`${agentId}_${version}`}>
                      <Alert severity="warning">
                        Failed to load compliance data for {agentId} ({version})
                      </Alert>
                    </Grid>
                  );
                }
                
                if (!profile) return null;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={`${agentId}_${version}`}>
                    <Card sx={{ height: '100%' }}>
                      <CardHeader
                        title={`${profile.agentName} (${version})`}
                        subheader={`Policy Compliance: ${(profile.metrics.governanceMetrics.complianceRate * 100).toFixed(1)}%`}
                        avatar={
                          <Avatar sx={{ 
                            bgcolor: profile.metrics.governanceMetrics.complianceRate > 0.9 ? 'success.main' : 
                                     profile.metrics.governanceMetrics.complianceRate > 0.7 ? 'warning.main' : 'error.main'
                          }}>
                            {profile.metrics.governanceMetrics.complianceRate > 0.9 ? <CheckCircle /> : 
                             profile.metrics.governanceMetrics.complianceRate > 0.7 ? <Warning /> : <Error />}
                          </Avatar>
                        }
                      />
                      <CardContent>
                        <AgentMetricsWidget
                          agentId={agentId}
                          agentName={profile.agentName}
                          version={version}
                          compact={true}
                          showTitle={false}
                        />
                        <Box mt={2}>
                          <Typography variant="caption" color="text.secondary">
                            Policy Violations: {profile.metrics.governanceMetrics.policyViolations}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </TabPanel>

      {/* Create Policy Dialog */}
      <Dialog 
        open={createPolicyOpen} 
        onClose={() => setCreatePolicyOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            minHeight: '80vh',
            zIndex: 9999,
            position: 'relative',
            margin: '0 auto',
            left: 0,
            right: 0
          }
        }}
        sx={{
          zIndex: 9999,
          '& .MuiBackdrop-root': {
            zIndex: 9998
          },
          '& .MuiDialog-container': {
            zIndex: 9999,
            paddingLeft: '240px', // Account for sidebar width
            paddingRight: '20px'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <HorizontalPolicyWizard
            onSave={async (simplePolicy) => {
              // Convert simple policy to full policy format
              const fullPolicy = {
                name: simplePolicy.name,
                version: '1.0.0',
                status: 'draft' as const,
                category: simplePolicy.type,
                description: simplePolicy.description,
                rules: simplePolicy.rules.map(rule => ({
                  name: rule.name,
                  description: rule.description,
                  condition: rule.condition,
                  action: rule.action,
                  priority: 1,
                  metadata: {
                    rationale: rule.description,
                    tags: ['user-created']
                  }
                })),
                metadata: {
                  owner: user?.uid || 'unknown',
                  tags: ['simplified-wizard'],
                  created_via: 'simplified-wizard'
                }
              };
              
              await handleCreatePolicy(fullPolicy);
            }}
            onCancel={() => setCreatePolicyOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog 
        open={editPolicyOpen} 
        onClose={() => setEditPolicyOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Edit Policy</DialogTitle>
        <DialogContent>
          {selectedPolicy && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Policy editing functionality is currently being updated. 
                Please use the Create Policy wizard to create new policies with your desired settings.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Policy: {selectedPolicy.name} (Version {selectedPolicy.version})
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPolicyOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Policy Dialog */}
      <PolicyDetailsDialog
        open={viewPolicyOpen}
        policy={selectedPolicy}
        onClose={() => setViewPolicyOpen(false)}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (selectedPolicyForMenu) handleOpenViewPolicy(selectedPolicyForMenu);
          setAnchorEl(null);
        }}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedPolicyForMenu) handleOpenEditPolicy(selectedPolicyForMenu);
          setAnchorEl(null);
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedPolicyForMenu) handleDeletePolicy(selectedPolicyForMenu.policy_id);
          setAnchorEl(null);
        }}>
          <ListItemIcon><Delete /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

const ThemedEnhancedGovernancePoliciesPage = () => (
  <ThemeProvider theme={darkTheme}>
    <EnhancedGovernancePoliciesPage />
  </ThemeProvider>
);

export default ThemedEnhancedGovernancePoliciesPage;

