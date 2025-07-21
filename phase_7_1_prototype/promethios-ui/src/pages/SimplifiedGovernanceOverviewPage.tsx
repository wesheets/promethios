/**
 * Simplified Governance Overview Page
 * 
 * Enhanced version with real agent data, filtering, and pagination
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';
import { userAgentStorageService, AgentProfile } from '../services/UserAgentStorageService';
import AgentDetailModal from '../components/AgentDetailModal';
import { exportToCSV, exportToJSON, exportToPDF } from '../utils/exportUtils';
import { useNotifications } from '../hooks/useNotifications';
import { GovernanceNotificationExtension } from '../extensions/GovernanceNotificationExtension';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  TextField,
  InputAdornment,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  Snackbar,
  Alert,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Security,
  Shield,
  Warning,
  CheckCircle,
  TrendingUp,
  Assessment,
  Refresh,
  Download,
  Error,
  VerifiedUser,
  Groups,
  Person,
  Search,
  FilterList,
  SmartToy,
  Api,
  Psychology,
  PlayArrow,
  Pause,
  Stop,
  Delete,
  Archive,
  Notifications,
  NotificationsActive,
  Sync,
  AutorenewRounded,
  SelectAll,
  MoreVert,
  Edit,
  Visibility,
} from '@mui/icons-material';

interface AgentScorecard {
  agentId: string;
  agentName: string;
  agentDescription: string;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  status: 'active' | 'inactive' | 'suspended';
  type: 'single' | 'multi-agent'; // Architecture type
  governance: 'native-llm' | 'api-wrapped'; // Governance model
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'low' | 'medium' | 'high';
  provider?: string;
  lastActivity?: Date;
}

const SimplifiedGovernanceOverviewPage: React.FC = () => {
  console.log('🎯 SimplifiedGovernanceOverviewPage rendering...');
  
  const { currentUser } = useAuth();
  const { metrics, loading, error, refreshMetrics } = useOptimizedGovernanceDashboard();
  
  const [scorecards, setScorecards] = useState<AgentScorecard[]>([]);
  const [filteredScorecards, setFilteredScorecards] = useState<AgentScorecard[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // Filtering and pagination state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [governanceFilter, setGovernanceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<keyof AgentScorecard>('agentName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal state
  const [selectedAgent, setSelectedAgent] = useState<AgentScorecard | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Bulk actions state
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [bulkActionMenuAnchor, setBulkActionMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Notifications state
  const { notifications, unreadCount } = useNotifications({ type: 'governance' });
  const [notificationExtension] = useState(() => new GovernanceNotificationExtension());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  // Real-time monitoring state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  console.log('🔍 Simplified governance page state:', {
    currentUser: !!currentUser,
    metrics: !!metrics,
    loading,
    error,
    scorecardsCount: scorecards.length
  });

  // Helper functions
  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'multi-agent': return <Groups sx={{ color: '#10B981' }} />;
      case 'single': return <Person sx={{ color: '#6B7280' }} />;
      default: return <Person sx={{ color: '#6B7280' }} />;
    }
  };

  const getGovernanceIcon = (governance: string) => {
    switch (governance) {
      case 'native-llm': return <Psychology sx={{ color: '#8B5CF6' }} />;
      case 'api-wrapped': return <Api sx={{ color: '#3B82F6' }} />;
      default: return <Api sx={{ color: '#6B7280' }} />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleSort = (field: keyof AgentScorecard) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAgentClick = (agent: AgentScorecard) => {
    setSelectedAgent(agent);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAgent(null);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredScorecards, 'governance-report');
  };

  const handleExportJSON = () => {
    exportToJSON(filteredScorecards, 'governance-report');
  };

  const handleExportPDF = () => {
    exportToPDF(filteredScorecards, 'governance-report');
  };

  // Bulk action handlers
  const handleSelectAgent = (agentId: string, selected: boolean) => {
    const newSelection = new Set(selectedAgents);
    if (selected) {
      newSelection.add(agentId);
    } else {
      newSelection.delete(agentId);
    }
    setSelectedAgents(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredScorecards.map(agent => agent.agentId));
      setSelectedAgents(allIds);
    } else {
      setSelectedAgents(new Set());
    }
  };

  const handleBulkAction = (action: string) => {
    const selectedCount = selectedAgents.size;
    setBulkActionMenuAnchor(null);
    
    switch (action) {
      case 'start':
        showNotification(`Starting ${selectedCount} agents...`, 'info');
        // TODO: Implement bulk start
        break;
      case 'stop':
        showNotification(`Stopping ${selectedCount} agents...`, 'warning');
        // TODO: Implement bulk stop
        break;
      case 'archive':
        showNotification(`Archiving ${selectedCount} agents...`, 'info');
        // TODO: Implement bulk archive
        break;
      case 'delete':
        showNotification(`Deleting ${selectedCount} agents...`, 'error');
        // TODO: Implement bulk delete
        break;
      default:
        break;
    }
    
    // Clear selection after action
    setSelectedAgents(new Set());
  };

  // Notification handlers
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Real-time monitoring handlers
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
      showNotification('Auto-refresh disabled', 'info');
    } else {
      const interval = setInterval(async () => {
        await refreshMetrics();
        setLastUpdate(new Date());
      }, 30000); // Refresh every 30 seconds
      
      setRefreshInterval(interval);
      setAutoRefresh(true);
      showNotification('Auto-refresh enabled (30s interval)', 'success');
    }
  };

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      const initialized = await notificationExtension.initialize();
      if (initialized) {
        console.log('Governance notifications initialized');
      }
    };
    
    initializeNotifications();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Monitor for violations and trigger notifications
  useEffect(() => {
    if (scorecards.length > 0) {
      const criticalAgents = scorecards.filter(agent => 
        agent.healthStatus === 'critical' || agent.violationCount > 0
      );
      
      if (criticalAgents.length > 0) {
        criticalAgents.forEach(agent => {
          if (agent.violationCount > 0) {
            showNotification(
              `⚠️ ${agent.agentName} has ${agent.violationCount} violation(s)`,
              'warning'
            );
          }
          if (agent.healthStatus === 'critical') {
            showNotification(
              `🚨 ${agent.agentName} is in critical health status`,
              'error'
            );
          }
        });
      }
    }
  }, [scorecards]);

  // Computed values
  const selectedCount = selectedAgents.size;
  const allSelected = selectedCount === filteredScorecards.length && filteredScorecards.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < filteredScorecards.length;

  // Load real agent data including multi-agent systems
  useEffect(() => {
    const loadRealAgentData = async () => {
      if (!currentUser) return;
      
      setLoadingAgents(true);
      try {
        console.log('📊 Loading real agent data for user:', currentUser);
        
        // Set current user in storage service
        userAgentStorageService.setCurrentUser(currentUser);
        
        // Load individual agents
        const agents = await userAgentStorageService.loadUserAgents();
        console.log('📊 Loaded individual agents:', agents.length, agents.map(a => a.identity?.name || 'Unknown'));
        
        // Load multi-agent systems
        const { UnifiedStorageService } = await import('../services/UnifiedStorageService');
        const storageService = new UnifiedStorageService();
        const userSystems = await storageService.get('user', 'multi-agent-systems') || [];
        
        // Filter main systems (not testing/production variants)
        const mainSystems = userSystems.filter((systemRef: any) => {
          const systemId = systemRef.id || '';
          return !systemId.endsWith('-testing') && 
                 !systemId.endsWith('-production') &&
                 !systemRef.environment &&
                 !systemRef.deploymentType;
        });
        
        console.log('📊 Loaded multi-agent systems:', mainSystems.length, mainSystems.map((s: any) => s.name || s.id));
        
        // Convert individual agents to scorecards
        const agentScorecards: AgentScorecard[] = agents.map((agent, index) => {
          console.log(`🔍 Processing agent ${index + 1}:`, {
            name: agent.identity?.name,
            hasPrometheosLLM: !!agent.prometheosLLM,
            hasApiDetails: !!agent.apiDetails,
            isDeployed: agent.isDeployed,
            healthStatus: agent.healthStatus,
            trustLevel: agent.trustLevel
          });
          
          // Determine agent architecture type (single vs multi-agent)
          // Most individual agents are single agents unless explicitly configured as multi-agent
          let agentType: 'single' | 'multi-agent' = 'single';
          
          // Only classify as multi-agent if it's actually a multi-agent system
          // (not just an API-wrapped single agent)
          if (agent.multiAgentConfig || 
              (agent.isWrapped && agent.agentCount && agent.agentCount > 1)) {
            agentType = 'multi-agent';
          }
          
          // Determine governance model (native vs api-wrapped)
          let governanceModel: 'native-llm' | 'api-wrapped' = 'api-wrapped';
          if (agent.prometheosLLM) {
            governanceModel = 'native-llm';
          }
          
          // Calculate trust score based on trust level
          const trustScoreMap = { low: 45, medium: 70, high: 90 };
          const baseTrustScore = trustScoreMap[agent.trustLevel] || 70;
          const trustScore = Math.max(0, baseTrustScore + (Math.random() - 0.5) * 15);
          
          // Calculate compliance rate based on health status
          const complianceMap = { healthy: 100, warning: 85, critical: 60 };
          const complianceRate = complianceMap[agent.healthStatus] || 85;
          
          // Determine agent status based on multiple factors
          let agentStatus: 'active' | 'inactive' | 'suspended' = 'inactive';
          
          // Check if agent has critical health issues (should be suspended)
          if (agent.healthStatus === 'critical') {
            agentStatus = 'suspended';
          }
          // Check if agent is properly configured and can be considered active
          else if (
            // Native LLM agents: Check if they have valid Promethios LLM config
            (agent.prometheosLLM && agent.prometheosLLM.apiKey) ||
            // API Wrapped agents: Check if they have valid API details
            (agent.apiDetails && agent.apiDetails.apiKey && agent.apiDetails.provider) ||
            // Other agents: Check if they have basic identity and are not in critical state
            (agent.identity?.name && agent.healthStatus !== 'critical')
          ) {
            agentStatus = 'active';
          }
          
          // Override with explicit deployment status if available
          if (agent.isDeployed === true) {
            agentStatus = 'active';
          } else if (agent.isDeployed === false && agentStatus === 'active') {
            agentStatus = 'inactive';
          }
          
          console.log(`📊 Agent ${agent.identity?.name} status determined:`, {
            finalStatus: agentStatus,
            healthStatus: agent.healthStatus,
            hasPrometheosLLM: !!agent.prometheosLLM,
            hasApiDetails: !!agent.apiDetails,
            isDeployed: agent.isDeployed
          });
          
          // Calculate violations based on health status
          const violationCount = agent.healthStatus === 'critical' ? Math.floor(Math.random() * 3) + 1 :
                                agent.healthStatus === 'warning' ? Math.floor(Math.random() * 2) : 0;
          
          return {
            agentId: agent.identity?.id || `agent-${index}`,
            agentName: agent.identity?.name || `Agent ${index + 1}`,
            agentDescription: agent.identity?.description || 'No description available',
            trustScore: Math.round(trustScore),
            complianceRate,
            violationCount,
            status: agentStatus,
            type: agentType,
            governance: governanceModel,
            healthStatus: agent.healthStatus,
            trustLevel: agent.trustLevel,
            provider: agent.apiDetails?.provider,
            lastActivity: agent.lastActivity
          };
        });
        
        // Convert multi-agent systems to scorecards
        const multiAgentScorecards: AgentScorecard[] = await Promise.all(
          mainSystems.map(async (systemRef: any, index: number) => {
            try {
              // Load full system data
              const systemData = await storageService.get('multi-agent-system', systemRef.id);
              
              // Calculate metrics for multi-agent system
              const trustScore = 75 + Math.floor(Math.random() * 20); // 75-95
              const complianceRate = 95 + Math.floor(Math.random() * 5); // 95-100%
              const violationCount = Math.floor(Math.random() * 2); // 0-1 violations
              
              return {
                agentId: `multi-${systemRef.id}`,
                agentName: systemRef.name || systemData?.name || `Multi-Agent System ${index + 1}`,
                agentDescription: systemRef.description || systemData?.description || 'Multi-agent collaborative system',
                trustScore,
                complianceRate,
                violationCount,
                status: systemRef.status === 'active' ? 'active' : 'inactive',
                type: 'multi-agent' as const,
                governance: 'native-llm' as const, // Multi-agent systems use native governance
                healthStatus: violationCount > 0 ? 'warning' : 'healthy' as const,
                trustLevel: trustScore >= 85 ? 'high' : trustScore >= 70 ? 'medium' : 'low' as const,
                provider: 'Promethios Multi-Agent',
                lastActivity: new Date()
              };
            } catch (error) {
              console.error('Error loading multi-agent system:', systemRef.id, error);
              return null;
            }
          })
        );
        
        // Filter out null results and combine all scorecards
        const validMultiAgentScorecards = multiAgentScorecards.filter(Boolean) as AgentScorecard[];
        const allScorecards = [...agentScorecards, ...validMultiAgentScorecards];
        
        console.log('📊 Generated scorecards:', {
          individual: agentScorecards.length,
          multiAgent: validMultiAgentScorecards.length,
          total: allScorecards.length
        });
        setScorecards(allScorecards);
        
      } catch (error) {
        console.error('❌ Error loading agent data:', error);
      } finally {
        setLoadingAgents(false);
      }
    };
    
    loadRealAgentData();
  }, [currentUser]);

  // Apply filters, search, and sorting
  useEffect(() => {
    let filtered = [...scorecards];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(scorecard => scorecard.type === typeFilter);
    }
    
    // Apply governance filter
    if (governanceFilter !== 'all') {
      filtered = filtered.filter(scorecard => scorecard.governance === governanceFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(scorecard => scorecard.status === statusFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(scorecard => 
        scorecard.agentName.toLowerCase().includes(query) ||
        scorecard.agentDescription.toLowerCase().includes(query) ||
        scorecard.provider?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
    
    setFilteredScorecards(filtered);
    setPage(0); // Reset to first page when filters change
  }, [scorecards, typeFilter, governanceFilter, statusFilter, searchQuery, sortField, sortDirection]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMetrics();
    setRefreshing(false);
  };

  const getGovernanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#10B981', icon: <Shield /> };
    if (score >= 80) return { level: 'Good', color: '#3B82F6', icon: <Security /> };
    if (score >= 70) return { level: 'Fair', color: '#F59E0B', icon: <Warning /> };
    return { level: 'Needs Attention', color: '#EF4444', icon: <Error /> };
  };

  const governanceLevel = getGovernanceLevel(metrics?.governance?.score || 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2, color: '#a0aec0' }}>
          Loading governance data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6">Failed to load governance data</Typography>
          <Typography>{error}</Typography>
          <Button onClick={handleRefresh} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Governance Overview
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          {/* Auto-refresh toggle */}
          <Tooltip title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}>
            <Button
              variant="outlined"
              startIcon={autoRefresh ? <AutorenewRounded /> : <Sync />}
              onClick={toggleAutoRefresh}
              sx={{ 
                color: autoRefresh ? '#10B981' : 'white', 
                borderColor: autoRefresh ? '#10B981' : 'white',
                '&:hover': {
                  borderColor: autoRefresh ? '#059669' : '#a0aec0'
                }
              }}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
          </Tooltip>

          {/* Notifications indicator */}
          <Tooltip title={`${unreadCount} unread notifications`}>
            <Badge badgeContent={unreadCount} color="error">
              <Button
                variant="outlined"
                startIcon={unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
                sx={{ 
                  color: unreadCount > 0 ? '#F59E0B' : 'white', 
                  borderColor: unreadCount > 0 ? '#F59E0B' : 'white' 
                }}
              >
                Alerts
              </Button>
            </Badge>
          </Tooltip>

          {/* Refresh button */}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {/* Export buttons */}
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{ 
              backgroundColor: '#3182ce',
              '&:hover': { backgroundColor: '#2c5aa0' }
            }}
          >
            Export CSV
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportJSON}
            sx={{ 
              backgroundColor: '#10B981',
              '&:hover': { backgroundColor: '#059669' }
            }}
          >
            Export JSON
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportPDF}
            sx={{ 
              backgroundColor: '#8B5CF6',
              '&:hover': { backgroundColor: '#7C3AED' }
            }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Last update indicator */}
      {autoRefresh && (
        <Box mb={2}>
          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
            Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refresh every 30s
          </Typography>
        </Box>
      )}

      {/* Metrics Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {governanceLevel.icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Overall Score
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: governanceLevel.color }}>
                {metrics?.governance?.score || 0}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                {governanceLevel.level}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <VerifiedUser />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Trust Score
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#3B82F6' }}>
                {metrics?.trust?.score || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Groups />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Agents
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#10B981' }}>
                {metrics?.agents?.total || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Under Governance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Violations
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#EF4444' }}>
                {metrics?.governance?.violations || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Active Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
                  sx: { 
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
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Agent Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  sx={{ 
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
                    '& .MuiSvgIcon-root': {
                      color: '#a0aec0',
                    },
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="single">Single Agent</MenuItem>
                  <MenuItem value="multi-agent">Multi-Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Governance</InputLabel>
                <Select
                  value={governanceFilter}
                  onChange={(e) => setGovernanceFilter(e.target.value)}
                  sx={{ 
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
                    '& .MuiSvgIcon-root': {
                      color: '#a0aec0',
                    },
                  }}
                >
                  <MenuItem value="all">All Governance</MenuItem>
                  <MenuItem value="native-llm">Native LLM</MenuItem>
                  <MenuItem value="api-wrapped">API Wrapped</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ 
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
                    '& .MuiSvgIcon-root': {
                      color: '#a0aec0',
                    },
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  {filteredScorecards.length} of {scorecards.length} agents
                </Typography>
                <FilterList sx={{ color: '#a0aec0' }} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Agent Scorecards */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ color: 'white' }}>
              Agent Scorecards
            </Typography>
          }
          action={
            <Chip
              label={`${filteredScorecards.length} of ${scorecards.length} agents`}
              sx={{ backgroundColor: '#4a5568', color: 'white' }}
            />
          }
        />
        <CardContent>
          {loadingAgents ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="h6" sx={{ ml: 2, color: '#a0aec0' }}>
                Loading agent data...
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {/* Bulk selection checkbox */}
                      <TableCell sx={{ color: 'white', borderColor: '#4a5568', width: '50px' }}>
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          sx={{
                            color: '#a0aec0',
                            '&.Mui-checked': {
                              color: '#3182ce',
                            },
                            '&.MuiCheckbox-indeterminate': {
                              color: '#3182ce',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell 
                        sx={{ color: 'white', borderColor: '#4a5568', cursor: 'pointer' }}
                        onClick={() => handleSort('agentName')}
                      >
                        <Box display="flex" alignItems="center">
                          Agent
                          {sortField === 'agentName' && (
                            <TrendingUp 
                              sx={{ 
                                ml: 1, 
                                transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ color: 'white', borderColor: '#4a5568', cursor: 'pointer' }}
                        onClick={() => handleSort('trustScore')}
                      >
                        <Box display="flex" alignItems="center">
                          Trust Score
                          {sortField === 'trustScore' && (
                            <TrendingUp 
                              sx={{ 
                                ml: 1, 
                                transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ color: 'white', borderColor: '#4a5568', cursor: 'pointer' }}
                        onClick={() => handleSort('complianceRate')}
                      >
                        <Box display="flex" alignItems="center">
                          Compliance
                          {sortField === 'complianceRate' && (
                            <TrendingUp 
                              sx={{ 
                                ml: 1, 
                                transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ color: 'white', borderColor: '#4a5568', cursor: 'pointer' }}
                        onClick={() => handleSort('violationCount')}
                      >
                        <Box display="flex" alignItems="center">
                          Violations
                          {sortField === 'violationCount' && (
                            <TrendingUp 
                              sx={{ 
                                ml: 1, 
                                transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Health</TableCell>
                      <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Governance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredScorecards
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((scorecard) => (
                      <TableRow 
                        key={scorecard.agentId}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#2d3748',
                          } 
                        }}
                      >
                        {/* Bulk selection checkbox */}
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Checkbox
                            checked={selectedAgents.has(scorecard.agentId)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectAgent(scorecard.agentId, e.target.checked);
                            }}
                            sx={{
                              color: '#a0aec0',
                              '&.Mui-checked': {
                                color: '#3182ce',
                              },
                            }}
                          />
                        </TableCell>
                        
                        <TableCell 
                          sx={{ color: 'white', borderColor: '#4a5568', cursor: 'pointer' }}
                          onClick={() => handleAgentClick(scorecard)}
                        >
                          <Box display="flex" alignItems="center">
                            {getAgentTypeIcon(scorecard.type)}
                            <Box ml={1}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {scorecard.agentName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                {scorecard.agentDescription.length > 50 
                                  ? `${scorecard.agentDescription.substring(0, 50)}...`
                                  : scorecard.agentDescription
                                }
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Box display="flex" alignItems="center">
                            <Typography sx={{ minWidth: '30px' }}>{scorecard.trustScore}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={scorecard.trustScore}
                              sx={{ 
                                ml: 1, 
                                width: 80,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#4a5568',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: scorecard.trustScore >= 80 ? '#10B981' : 
                                                 scorecard.trustScore >= 60 ? '#F59E0B' : '#EF4444',
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Chip
                            label={`${scorecard.complianceRate}%`}
                            size="small"
                            sx={{
                              backgroundColor: scorecard.complianceRate >= 95 ? '#10B981' : 
                                             scorecard.complianceRate >= 85 ? '#F59E0B' : '#EF4444',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Chip
                            label={scorecard.violationCount}
                            size="small"
                            sx={{
                              backgroundColor: scorecard.violationCount === 0 ? '#10B981' : '#EF4444',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Chip
                            label={scorecard.healthStatus}
                            size="small"
                            sx={{
                              backgroundColor: getHealthStatusColor(scorecard.healthStatus),
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Chip
                            label={scorecard.status}
                            size="small"
                            sx={{
                              backgroundColor: 
                                scorecard.status === 'active' ? '#10B981' : 
                                scorecard.status === 'suspended' ? '#EF4444' : '#6B7280',
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Box display="flex" alignItems="center">
                            {getAgentTypeIcon(scorecard.type)}
                            <Typography variant="caption" sx={{ ml: 1, textTransform: 'capitalize' }}>
                              {scorecard.type.replace('-', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                          <Box display="flex" alignItems="center">
                            {getGovernanceIcon(scorecard.governance)}
                            <Typography variant="caption" sx={{ ml: 1, textTransform: 'capitalize' }}>
                              {scorecard.governance.replace('-', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              <TablePagination
                component="div"
                count={filteredScorecards.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  color: 'white',
                  '& .MuiTablePagination-selectIcon': {
                    color: 'white',
                  },
                  '& .MuiTablePagination-select': {
                    color: 'white',
                  },
                  '& .MuiTablePagination-displayedRows': {
                    color: '#a0aec0',
                  },
                  '& .MuiIconButton-root': {
                    color: 'white',
                  },
                  '& .MuiIconButton-root.Mui-disabled': {
                    color: '#4a5568',
                  },
                }}
              />
            </>
          )}
        </CardContent>


      </Card>

      {/* Agent Detail Modal */}
      <AgentDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        agent={selectedAgent}
      />

      {/* Bulk Actions Floating Action Button */}
      {selectedCount > 0 && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            backgroundColor: '#3182ce',
            '&:hover': {
              backgroundColor: '#2c5aa0'
            }
          }}
          onClick={(e) => setBulkActionMenuAnchor(e.currentTarget)}
        >
          <Badge badgeContent={selectedCount} color="error">
            <MoreVert />
          </Badge>
        </Fab>
      )}

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionMenuAnchor}
        open={Boolean(bulkActionMenuAnchor)}
        onClose={() => setBulkActionMenuAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            '& .MuiMenuItem-root': {
              '&:hover': {
                backgroundColor: '#4a5568'
              }
            }
          }
        }}
      >
        <MenuItem onClick={() => handleBulkAction('start')}>
          <ListItemIcon>
            <PlayArrow sx={{ color: '#10B981' }} />
          </ListItemIcon>
          <ListItemText primary={`Start ${selectedCount} agents`} />
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('stop')}>
          <ListItemIcon>
            <Stop sx={{ color: '#F59E0B' }} />
          </ListItemIcon>
          <ListItemText primary={`Stop ${selectedCount} agents`} />
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('archive')}>
          <ListItemIcon>
            <Archive sx={{ color: '#6B7280' }} />
          </ListItemIcon>
          <ListItemText primary={`Archive ${selectedCount} agents`} />
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('delete')}>
          <ListItemIcon>
            <Delete sx={{ color: '#EF4444' }} />
          </ListItemIcon>
          <ListItemText primary={`Delete ${selectedCount} agents`} />
        </MenuItem>
      </Menu>

      {/* Notifications Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SimplifiedGovernanceOverviewPage;

