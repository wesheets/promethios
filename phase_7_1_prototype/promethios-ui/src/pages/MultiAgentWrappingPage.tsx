import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { darkTheme } from '../theme/darkTheme';
import MultiAgentWrappingWizard from '../modules/agent-wrapping/components/MultiAgentWrappingWizard';

const MultiAgentWrappingPage: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [multiAgentSystems, setMultiAgentSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load systems from unified storage
  useEffect(() => {
    loadSystemsFromStorage();
  }, []);

  const loadSystemsFromStorage = async () => {
    try {
      setLoading(true);
      
      // Load from unified storage first
      const { UnifiedStorageService } = await import('../services/UnifiedStorageService');
      const storageService = new UnifiedStorageService();
      
      // Get user's system list
      const userSystems = await storageService.get('user', 'multi-agent-systems') || [];
      
      // Load full system data for each system
      const systemsData = await Promise.all(
        userSystems.map(async (systemRef: any) => {
          try {
            const fullSystemData = await storageService.get('agents', `multi-agent-system-${systemRef.id}`);
            return fullSystemData || systemRef;
          } catch (error) {
            console.warn(`Failed to load system ${systemRef.id}:`, error);
            return systemRef;
          }
        })
      );
      
      // Transform to dashboard format
      const transformedSystems = systemsData.filter(Boolean).map((system: any) => ({
        id: system.id || system.contextId,
        name: system.name,
        description: system.description || `Multi-agent system with ${system.agentIds?.length || 0} agents using ${system.collaborationModel || 'sequential'} collaboration`,
        agents: system.agentIds || [],
        status: system.status || 'active',
        environment: 'production',
        requests: Math.floor(Math.random() * 1000), // Mock data for now
        successRate: Math.floor(Math.random() * 20) + 80, // Mock data for now
        created_at: system.createdAt,
        collaboration_model: system.collaborationModel || system.systemType,
        governance_enabled: true
      }));
      
      setMultiAgentSystems(transformedSystems);
      
      // Fallback to API if no systems in storage
      if (transformedSystems.length === 0) {
        await loadSystemsFromAPI();
      }
    } catch (error) {
      console.error('Error loading systems from storage:', error);
      // Fallback to API
      await loadSystemsFromAPI();
    } finally {
      setLoading(false);
    }
  };

  const loadSystemsFromAPI = async () => {
    try {
      const response = await fetch('https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/contexts');
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match dashboard format
        const transformedSystems = data.contexts.map((context: any) => ({
          id: context.context_id,
          name: context.name,
          description: `Multi-agent system with ${context.agent_ids.length} agents using ${context.collaboration_model} collaboration`,
          agents: context.agent_ids,
          status: context.status,
          environment: 'production',
          requests: Math.floor(Math.random() * 1000), // Mock data for now
          successRate: Math.floor(Math.random() * 20) + 80, // Mock data for now
          created_at: context.created_at,
          collaboration_model: context.collaboration_model,
          governance_enabled: context.governance_enabled
        }));
        setMultiAgentSystems(transformedSystems);
      } else {
        console.error('Failed to load systems from API');
        setMultiAgentSystems([]); // Empty array instead of demo data
      }
    } catch (error) {
      console.error('Error loading systems from API:', error);
      setMultiAgentSystems([]); // Empty array instead of demo data
    }
  };

  // Check URL parameters and automatically show wizard if coming from My Agents workflow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAgentIds = urlParams.has('agentId');
    const hasSystemData = urlParams.has('systemData');
    
    // If URL contains agent IDs or system data, show the wizard automatically
    if (hasAgentIds || hasSystemData) {
      setShowWizard(true);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'error': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production': return 'primary';
      case 'testing': return 'secondary';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'error': return <Warning />;
      case 'inactive': return <Pause />;
      default: return <Pause />;
    }
  };

  if (showWizard) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Button 
            variant="outlined" 
            sx={{ mb: 2 }}
            onClick={() => setShowWizard(false)}
          >
            ← Back to Multi-Agent Systems
          </Button>

          <MultiAgentWrappingWizard />
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>Multi-Agent Wrapping</Typography>
            <Typography variant="body1" color="text.secondary">
              Compose and manage multi-agent systems with governance controls
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setShowWizard(true)}
            size="large"
          >
            Create Multi-Agent System
          </Button>
        </Box>
        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Systems</Typography>
                <Typography variant="h3" color="primary">{multiAgentSystems.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Multi-agent systems created
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Systems</Typography>
                <Typography variant="h3" color="primary">
                  {multiAgentSystems.filter(s => s.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {multiAgentSystems.length > 0 ? Math.round((multiAgentSystems.filter(s => s.status === 'active').length / multiAgentSystems.length) * 100) : 0}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Governance Issues</Typography>
                <Typography variant="h3" color="error">
                  {multiAgentSystems.filter(s => s.status === 'error').length}
                </Typography>
                <Typography variant="body2" color={multiAgentSystems.filter(s => s.status === 'error').length > 0 ? "error.main" : "text.secondary"}>
                  {multiAgentSystems.filter(s => s.status === 'error').length > 0 ? (
                    <>
                      <Warning sx={{ fontSize: 16, mr: 0.5 }} />
                      Needs attention
                    </>
                  ) : (
                    'All systems healthy'
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search multi-agent systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={environmentFilter}
                  label="Environment"
                  onChange={(e) => setEnvironmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Environments</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="testing">Testing</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Multi-Agent Systems Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading multi-agent systems...</Typography>
          </Box>
        ) : multiAgentSystems.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Typography variant="h6" gutterBottom>No Multi-Agent Systems Found</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Create your first multi-agent system to get started
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setShowWizard(true)}
            >
              Create Multi-Agent System
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {multiAgentSystems.map((system) => (
            <Grid item xs={12} md={6} lg={4} key={system.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Chip 
                      label={system.environment}
                      color={getEnvironmentColor(system.environment) as any}
                      size="small"
                    />
                    <Chip 
                      label={system.status}
                      color={getStatusColor(system.status) as any}
                      icon={getStatusIcon(system.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>{system.name}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {system.description}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    AGENTS
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
                    {system.agents.map((agent, index) => (
                      <Chip 
                        key={index} 
                        label={agent} 
                        variant="outlined" 
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Requests</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {system.requests.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {system.successRate}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<Edit />}
                    sx={{ flex: 1 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small"
                    variant="outlined"
                    color={system.status === 'active' ? 'error' : 'success'}
                    startIcon={system.status === 'active' ? <Stop /> : <PlayArrow />}
                    sx={{ flex: 1 }}
                  >
                    {system.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          </Grid>
        )}
      </Box>
    </Container>
    </ThemeProvider>
  );
};

export default MultiAgentWrappingPage;

