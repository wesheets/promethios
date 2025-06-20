import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Divider,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Checkbox,
  FormControlLabel,
  Slide,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Remove,
  CheckCircle,
  Warning,
  Error,
  Chat,
  Assessment,
  Settings,
  Group,
  Person,
  Security,
  Speed,
  Verified,
  Add,
  Build,
  Api,
  CloudUpload,
  Policy,
  Visibility,
  Edit,
  Delete,
  Launch,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { useAgentWrappers } from '../modules/agent-wrapping/hooks/useAgentWrappers';
import { useMultiAgentSystems } from '../modules/agent-wrapping/hooks/useMultiAgentSystems';
import { useAgentIdentities } from '../modules/agent-identity/hooks/useAgentIdentities';
import { useScorecards } from '../modules/agent-identity/hooks/useScorecards';
import { AgentProfile, SystemProfile, CombinedProfile } from '../modules/agent-identity/types/multiAgent';

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
      id={`agent-profiles-tabpanel-${index}`}
      aria-labelledby={`agent-profiles-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Add New Agent Button Component
const AddNewAgentButton: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showFoundryDialog, setShowFoundryDialog] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleImportAPI = () => {
    handleClose();
    // Navigate to agent wrapping wizard for API import
    window.location.href = '/ui/agents/wrapping?mode=import';
  };

  const handleFoundryBeta = () => {
    handleClose();
    setShowFoundryDialog(true);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleClick}
        sx={{
          backgroundColor: '#3182ce',
          color: 'white',
          '&:hover': { backgroundColor: '#2c5aa0' },
          px: 3,
          py: 1.5,
        }}
      >
        Add New Agent
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
            minWidth: 280,
          },
        }}
      >
        <MenuItem onClick={handleImportAPI} sx={{ py: 2 }}>
          <ListItemIcon>
            <Api sx={{ color: '#3182ce' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Import API Agent"
            secondary="Connect your existing agent via API endpoint"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
        <MenuItem onClick={handleFoundryBeta} sx={{ py: 2 }}>
          <ListItemIcon>
            <Build sx={{ color: '#f59e0b' }} />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <span>Build with Foundry</span>
                <Chip 
                  label="Beta" 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#f59e0b', 
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }} 
                />
              </Box>
            }
            secondary="Let Promethios build your agent (coming soon)"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
      </Menu>

      {/* Foundry Beta Dialog */}
      <Dialog 
        open={showFoundryDialog} 
        onClose={() => setShowFoundryDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Build sx={{ color: '#f59e0b' }} />
            Promethios Foundry
            <Chip 
              label="Beta" 
              size="small" 
              sx={{ 
                backgroundColor: '#f59e0b', 
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
              }} 
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#a0aec0', mb: 2 }}>
            The Promethios Foundry allows you to describe what you want your agent to do, 
            and we'll build it for you automatically with proper governance integration.
          </Typography>
          <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
            <Typography variant="body2">
              🚧 This feature is currently in development. For now, please use the 
              "Import API Agent" option to add your existing agents to Promethios.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowFoundryDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Close
          </Button>
          <Button 
            variant="contained"
            onClick={handleImportAPI}
            sx={{
              backgroundColor: '#3182ce',
              color: 'white',
              '&:hover': { backgroundColor: '#2c5aa0' },
            }}
          >
            Import API Agent Instead
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
// Agent Profile Card Component
const AgentProfileCard: React.FC<{ 
  profile: AgentProfile; 
  selectionMode: boolean;
  isSelected: boolean;
  onSelectionChange: (agentId: string, selected: boolean) => void;
}> = ({ profile, selectionMode, isSelected, onSelectionChange }) => {
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getLifecycleStatus = (profile: AgentProfile) => {
    // Determine lifecycle status based on agent state
    if (!profile.isWrapped) return { status: 'unwrapped', label: '🔴 Unwrapped', color: '#ef4444' };
    if (!profile.governancePolicy) return { status: 'wrapped', label: '🟡 Wrapped - No Policy', color: '#f59e0b' };
    if (!profile.isDeployed) return { status: 'governed', label: '🟢 Governed', color: '#10b981' };
    return { status: 'deployed', label: '🚀 Deployed', color: '#3182ce' };
  };

  const getNextAction = (profile: AgentProfile) => {
    const lifecycle = getLifecycleStatus(profile);
    switch (lifecycle.status) {
      case 'unwrapped':
        return {
          label: 'Wrap Agent',
          icon: <Settings />,
          action: () => window.location.href = `/ui/agents/wrapping?agentId=${profile.identity.id}`,
          color: '#3182ce'
        };
      case 'wrapped':
        return {
          label: 'Apply Policy',
          icon: <Policy />,
          action: () => window.location.href = `/ui/governance/policies?agentId=${profile.identity.id}`,
          color: '#10b981'
        };
      case 'governed':
        return {
          label: 'Deploy',
          icon: <Launch />,
          action: () => window.location.href = `/ui/agents/deploy?agentId=${profile.identity.id}`,
          color: '#8b5cf6'
        };
      case 'deployed':
        return {
          label: 'Manage',
          icon: <Visibility />,
          action: () => window.location.href = `/ui/agents/manage?agentId=${profile.identity.id}`,
          color: '#6b7280'
        };
    }
  };

  const lifecycle = getLifecycleStatus(profile);
  const nextAction = getNextAction(profile);
  const canBeSelected = profile.isWrapped && selectionMode; // Only wrapped agents can be selected for multi-agent systems

  return (
    <Card 
      sx={{ 
        height: '100%', 
        backgroundColor: '#2d3748', 
        color: 'white',
        border: isSelected ? '2px solid #3182ce' : '1px solid #4a5568',
        '&:hover': { borderColor: isSelected ? '#3182ce' : '#718096' },
        position: 'relative',
      }}
    >
      {/* Selection Checkbox */}
      {canBeSelected && (
        <Box position="absolute" top={8} right={8} zIndex={1}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelectionChange(profile.identity.id, e.target.checked)}
            sx={{
              color: '#a0aec0',
              '&.Mui-checked': { color: '#3182ce' },
              backgroundColor: 'rgba(45, 55, 72, 0.8)',
              borderRadius: 1,
            }}
          />
        </Box>
      )}
      
      <CardContent>
        {/* Header with Avatar and Status */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#3182ce', width: 48, height: 48 }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {profile.identity.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                v{profile.identity.version}
              </Typography>
            </Box>
          </Box>
          {!canBeSelected && (
            <IconButton size="small" sx={{ color: '#a0aec0' }}>
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Lifecycle Status */}
        <Box mb={2}>
          <Chip
            label={lifecycle.label}
            size="small"
            sx={{
              backgroundColor: lifecycle.color,
              color: 'white',
              fontWeight: 600,
              mb: 1,
            }}
          />
          {profile.governancePolicy && (
            <Chip
              label={`Policy: ${profile.governancePolicy}`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#4a5568',
                color: '#a0aec0',
                ml: 1,
              }}
            />
          )}
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
          {profile.identity.description}
        </Typography>

        {/* Health and Trust Metrics */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Health
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                {profile.healthStatus === 'healthy' && <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />}
                {profile.healthStatus === 'warning' && <Warning sx={{ color: '#f59e0b', fontSize: 16 }} />}
                {profile.healthStatus === 'critical' && <Error sx={{ color: '#ef4444', fontSize: 16 }} />}
                <Typography variant="body2" sx={{ color: 'white', textTransform: 'capitalize' }}>
                  {profile.healthStatus}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Trust Score
              </Typography>
              <Typography variant="h6" sx={{ color: '#3182ce' }}>
                {profile.latestScorecard?.overallScore || 0}/100
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        {!selectionMode && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={nextAction.icon}
              fullWidth
              onClick={nextAction.action}
              sx={{
                backgroundColor: nextAction.color,
                color: 'white',
                '&:hover': { opacity: 0.8 },
              }}
            >
              {nextAction.label}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Chat />}
              sx={{
                borderColor: '#4a5568',
                color: '#a0aec0',
                '&:hover': { borderColor: '#718096', backgroundColor: '#1a202c' },
              }}
              onClick={() => window.location.href = `/ui/chat?agent=${profile.identity.id}`}
            >
              Chat
            </Button>
          </Stack>
        )}
        
        {/* Selection Mode Info */}
        {selectionMode && canBeSelected && (
          <Box textAlign="center" py={1}>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              {isSelected ? 'Selected for multi-agent system' : 'Click checkbox to select'}
            </Typography>
          </Box>
        )}
        
        {selectionMode && !canBeSelected && (
          <Box textAlign="center" py={1}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {!profile.isWrapped ? 'Must be wrapped first' : 'Not available for selection'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
// Main Agent Profiles Page Component
const AgentProfilesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [governanceFilter, setGovernanceFilter] = useState('all');
  
  // Selection state for multi-agent system creation
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // Mock data - would be replaced with actual hooks
  const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>([]);
  const [systemProfiles, setSystemProfiles] = useState<SystemProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const handleAgentSelection = (agentId: string, selected: boolean) => {
    if (selected) {
      setSelectedAgents(prev => [...prev, agentId]);
    } else {
      setSelectedAgents(prev => prev.filter(id => id !== agentId));
    }
  };

  const handleCreateMultiAgentSystem = () => {
    if (selectedAgents.length < 2) {
      alert('Please select at least 2 agents to create a multi-agent system');
      return;
    }
    
    // Navigate to multi-agent wrapping wizard with selected agents
    const agentParams = selectedAgents.map(id => `agentId=${id}`).join('&');
    window.location.href = `/ui/agents/multi-wrapping?${agentParams}`;
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedAgents([]); // Clear selections when toggling
  };

  const wrappedAgents = agentProfiles.filter(agent => agent.isWrapped);
  const canCreateMultiAgent = selectedAgents.length >= 2;

  useEffect(() => {
    // Mock data loading
    const loadProfiles = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock agent profiles with lifecycle states
      const mockAgentProfiles: AgentProfile[] = [
        {
          identity: {
            id: 'agent-1',
            name: 'Customer Support Assistant',
            version: '1.2.0',
            description: 'AI assistant for customer support inquiries',
            ownerId: 'user-1',
            creationDate: new Date('2024-01-15'),
            lastModifiedDate: new Date('2024-06-10'),
            status: 'active'
          },
          latestScorecard: {
            agentId: 'agent-1',
            templateId: 'default',
            evaluationTimestamp: new Date(),
            context: {},
            overallScore: 92,
            metricValues: {}
          },
          attestationCount: 3,
          lastActivity: new Date('2024-06-12'),
          healthStatus: 'healthy',
          trustLevel: 'high',
          isWrapped: true,
          governancePolicy: 'HIPAA Strict',
          isDeployed: true
        },
        {
          identity: {
            id: 'agent-2',
            name: 'Data Analysis Bot',
            version: '2.1.0',
            description: 'Specialized in data analysis and reporting',
            ownerId: 'user-1',
            creationDate: new Date('2024-02-20'),
            lastModifiedDate: new Date('2024-06-08'),
            status: 'active'
          },
          latestScorecard: {
            agentId: 'agent-2',
            templateId: 'default',
            evaluationTimestamp: new Date(),
            context: {},
            overallScore: 78,
            metricValues: {}
          },
          attestationCount: 2,
          lastActivity: new Date('2024-06-11'),
          healthStatus: 'warning',
          trustLevel: 'medium',
          isWrapped: true,
          governancePolicy: 'Financial Services',
          isDeployed: false
        },
        {
          identity: {
            id: 'agent-3',
            name: 'Content Generator',
            version: '1.0.0',
            description: 'Generates marketing content and copy',
            ownerId: 'user-1',
            creationDate: new Date('2024-06-15'),
            lastModifiedDate: new Date('2024-06-15'),
            status: 'active'
          },
          latestScorecard: null,
          attestationCount: 0,
          lastActivity: null,
          healthStatus: 'healthy',
          trustLevel: 'medium',
          isWrapped: false,
          governancePolicy: null,
          isDeployed: false
        }
      ];

      // Mock system profiles
      const mockSystemProfiles: SystemProfile[] = [];

      setAgentProfiles(mockAgentProfiles);
      setSystemProfiles(mockSystemProfiles);
      setLoading(false);
    };

    loadProfiles();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredAgentProfiles = agentProfiles.filter(profile => {
    const matchesSearch = profile.identity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.identity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || profile.identity.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || profile.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  const filteredSystemProfiles = systemProfiles.filter(profile => {
    const matchesSearch = profile.identity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.identity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || profile.identity.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || profile.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header with Add New Agent Button */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                My Agents
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and monitor your individual agents and multi-agent systems
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              {wrappedAgents.length >= 2 && (
                <Button
                  variant={selectionMode ? "contained" : "outlined"}
                  startIcon={<Group />}
                  onClick={handleToggleSelectionMode}
                  sx={{
                    backgroundColor: selectionMode ? '#8b5cf6' : 'transparent',
                    borderColor: '#8b5cf6',
                    color: selectionMode ? 'white' : '#8b5cf6',
                    '&:hover': { 
                      backgroundColor: selectionMode ? '#7c3aed' : 'rgba(139, 92, 246, 0.1)',
                      borderColor: '#7c3aed',
                    },
                  }}
                >
                  {selectionMode ? 'Cancel Selection' : 'Select for Multi-Agent'}
                </Button>
              )}
              <AddNewAgentButton />
            </Stack>
          </Box>
          
          {/* Multi-Agent Creation Bar */}
          {selectionMode && (
            <Slide direction="down" in={selectionMode} mountOnEnter unmountOnExit>
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: '#1e3a8a', 
                  color: 'white',
                  '& .MuiAlert-icon': { color: 'white' },
                }}
                action={
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!canCreateMultiAgent}
                    onClick={handleCreateMultiAgentSystem}
                    sx={{
                      backgroundColor: canCreateMultiAgent ? '#10b981' : '#6b7280',
                      color: 'white',
                      '&:hover': { backgroundColor: canCreateMultiAgent ? '#059669' : '#6b7280' },
                    }}
                  >
                    Create Multi-Agent System ({selectedAgents.length})
                  </Button>
                }
              >
                <Typography variant="body2">
                  Select 2 or more wrapped agents to create a multi-agent system. 
                  Selected: {selectedAgents.length} agents
                </Typography>
              </Alert>
            </Slide>
          )}
        </Box>

        {/* Enhanced Filters and Search */}
        <Box mb={4}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search agents and systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                    '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Lifecycle Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Lifecycle Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="unwrapped">🔴 Unwrapped</MenuItem>
                  <MenuItem value="wrapped">🟡 Wrapped - No Policy</MenuItem>
                  <MenuItem value="governed">🟢 Governed</MenuItem>
                  <MenuItem value="deployed">🚀 Deployed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Health</InputLabel>
                <Select
                  value={healthFilter}
                  label="Health"
                  onChange={(e) => setHealthFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Health</MenuItem>
                  <MenuItem value="healthy">Healthy</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Governance Policy</InputLabel>
                <Select
                  value={governanceFilter}
                  label="Governance Policy"
                  onChange={(e) => setGovernanceFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Policies</MenuItem>
                  <MenuItem value="hipaa">HIPAA Strict</MenuItem>
                  <MenuItem value="financial">Financial Services</MenuItem>
                  <MenuItem value="general">General Business</MenuItem>
                  <MenuItem value="none">No Policy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => window.location.reload()}
                  sx={{
                    borderColor: '#4a5568',
                    color: '#a0aec0',
                    '&:hover': { borderColor: '#718096', backgroundColor: '#2d3748' },
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  sx={{
                    borderColor: '#4a5568',
                    color: '#a0aec0',
                    '&:hover': { borderColor: '#718096', backgroundColor: '#2d3748' },
                  }}
                >
                  More Filters
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Person />
                  Overview ({agentProfiles.length + systemProfiles.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Person />
                  Individual Agents ({agentProfiles.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Group />
                  Multi-Agent Systems ({systemProfiles.length})
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {/* Overview Tab - Combined view */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Typography>Loading profiles...</Typography>
            </Box>
          ) : (
            <>
              {/* Summary Stats */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">{agentProfiles.length}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Individual Agents
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <Group />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">{systemProfiles.length}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Multi-Agent Systems
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CheckCircle />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">
                            {agentProfiles.filter(p => p.healthStatus === 'healthy').length + 
                             systemProfiles.filter(p => p.healthStatus === 'healthy').length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Healthy
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <Verified />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">
                            {agentProfiles.reduce((sum, p) => sum + p.attestationCount, 0) +
                             systemProfiles.reduce((sum, p) => sum + p.attestationCount, 0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Attestations
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recent Activity */}
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Grid container spacing={3}>
                {/* Show mix of agents and systems */}
                {[...filteredAgentProfiles.slice(0, 2), ...filteredSystemProfiles.slice(0, 1)].map((profile, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    {'systemType' in profile.identity ? (
                      <SystemProfileCard profile={profile as SystemProfile} />
                    ) : (
                      <AgentProfileCard 
                        profile={profile as AgentProfile}
                        selectionMode={false}
                        isSelected={false}
                        onSelectionChange={() => {}}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Individual Agents Tab */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Typography>Loading agent profiles...</Typography>
            </Box>
          ) : filteredAgentProfiles.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>No Individual Agents Found</AlertTitle>
              {searchTerm || statusFilter !== 'all' || healthFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'You haven\'t wrapped any individual agents yet. Start by wrapping your first agent!'
              }
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredAgentProfiles.map((profile) => (
                <Grid item xs={12} md={6} lg={4} key={profile.identity.id}>
                  <AgentProfileCard 
                    profile={profile}
                    selectionMode={selectionMode}
                    isSelected={selectedAgents.includes(profile.identity.id)}
                    onSelectionChange={handleAgentSelection}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Multi-Agent Systems Tab */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Typography>Loading system profiles...</Typography>
            </Box>
          ) : filteredSystemProfiles.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>No Multi-Agent Systems Found</AlertTitle>
              {searchTerm || statusFilter !== 'all' || healthFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'You haven\'t created any multi-agent systems yet. Start by creating your first system!'
              }
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredSystemProfiles.map((profile) => (
                <Grid item xs={12} md={6} lg={4} key={profile.identity.id}>
                  <SystemProfileCard profile={profile} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
};

export default AgentProfilesPage;

