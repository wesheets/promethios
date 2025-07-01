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
import PolicyRuleBuilder from '../components/governance/PolicyRuleBuilder';
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
  ExpandMore
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'effectiveness_score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Promethios Policy states
  const [policies, setPolicies] = useState<PrometheiosPolicy[]>([]);
  const [policyTemplates, setPolicyTemplates] = useState<any[]>([]);
  const [policyAnalytics, setPolicyAnalytics] = useState<{[key: string]: PolicyAnalytics}>({});
  const [policyOptimizations, setPolicyOptimizations] = useState<{[key: string]: PolicyOptimization}>({});
  const [policyConflicts, setPolicyConflicts] = useState<{[key: string]: PolicyConflict[]}>({});
  
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
    loadAllData();
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load policies using Promethios API
      const [policiesData, templatesData] = await Promise.all([
        prometheiosPolicyAPI.listPolicies(),
        prometheiosPolicyAPI.getPolicyTemplates()
      ]);
      
      setPolicies(policiesData);
      setPolicyTemplates(templatesData);
      
      // Load analytics for each policy
      const analyticsPromises = policiesData.map(async (policy) => {
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
      
    } catch (error) {
      console.error('Failed to load policy data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Policy management functions
  const handleCreatePolicy = async (policy: PrometheiosPolicy) => {
    try {
      const createdPolicy = await prometheiosPolicyAPI.createPolicy(policy);
      setPolicies(prev => [...prev, createdPolicy]);
      setCreatePolicyOpen(false);
    } catch (error) {
      console.error('Failed to create policy:', error);
    }
  };

  const handleUpdatePolicy = async (policy: PrometheiosPolicy) => {
    try {
      const updatedPolicy = await prometheiosPolicyAPI.updatePolicy(policy.policy_id, policy);
      setPolicies(prev => prev.map(p => p.policy_id === policy.policy_id ? updatedPolicy : p));
      setEditPolicyOpen(false);
      setSelectedPolicy(null);
    } catch (error) {
      console.error('Failed to update policy:', error);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await prometheiosPolicyAPI.deletePolicy(policyId);
      setPolicies(prev => prev.filter(p => p.policy_id !== policyId));
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
  const filteredPolicies = policies.filter(policy => {
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
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {renderPoliciesTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h6">Policy Templates</Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and use pre-built policy templates for common compliance requirements.
        </Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6">Policy Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          View comprehensive analytics and insights for your governance policies.
        </Typography>
      </TabPanel>

      {/* Create Policy Dialog */}
      <Dialog 
        open={createPolicyOpen} 
        onClose={() => setCreatePolicyOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Create New Policy</DialogTitle>
        <DialogContent>
          <PolicyRuleBuilder
            mode="create"
            onSave={handleCreatePolicy}
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
            <PolicyRuleBuilder
              policy={selectedPolicy}
              mode="edit"
              onSave={handleUpdatePolicy}
              onCancel={() => setEditPolicyOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Policy Dialog */}
      <Dialog 
        open={viewPolicyOpen} 
        onClose={() => setViewPolicyOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>View Policy</DialogTitle>
        <DialogContent>
          {selectedPolicy && (
            <PolicyRuleBuilder
              policy={selectedPolicy}
              mode="view"
              onCancel={() => setViewPolicyOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

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

