import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  InputAdornment,
  Collapse,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountTree as AccountTreeIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface MASContextSelectorProps {
  onContextSelect: (contextId: string) => void;
  selectedContext: string | null;
  darkMode?: boolean;
}

interface MASContext {
  contextId: string;
  name: string;
  agentIds: string[];
  collaborationModel: string;
  status: 'active' | 'inactive' | 'error';
  lastActivity: string;
  behaviorCount: number;
  protocolCount: number;
  consensusCount: number;
  communicationCount: number;
  governanceEnabled: boolean;
  createdAt: string;
}

const MASContextSelector: React.FC<MASContextSelectorProps> = ({
  onContextSelect,
  selectedContext,
  darkMode = true
}) => {
  const [contexts, setContexts] = useState<MASContext[]>([]);
  const [filteredContexts, setFilteredContexts] = useState<MASContext[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const theme = {
    background: darkMode ? '#1a1a1a' : '#ffffff',
    surface: darkMode ? '#2d2d2d' : '#f5f5f5',
    primary: darkMode ? '#bb86fc' : '#6200ea',
    secondary: darkMode ? '#03dac6' : '#018786',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#b3b3b3' : '#666666',
    success: darkMode ? '#4caf50' : '#2e7d32',
    warning: darkMode ? '#ff9800' : '#ed6c02',
    error: darkMode ? '#f44336' : '#d32f2f',
    border: darkMode ? '#404040' : '#e0e0e0'
  };

  useEffect(() => {
    loadMASContexts();
  }, []);

  useEffect(() => {
    filterContexts();
  }, [searchTerm, contexts]);

  const loadMASContexts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get MAS audit statistics to find available contexts
      const statsResponse = await fetch('/api/multi-agent-audit/stats');
      if (!statsResponse.ok) {
        throw new Error('Failed to load MAS statistics');
      }

      // For demo purposes, create some sample MAS contexts
      // In production, this would come from the actual API
      const sampleContexts: MASContext[] = [
        {
          contextId: 'mas-ctx-001',
          name: 'Financial Analysis Team',
          agentIds: ['agent-finance-1', 'agent-finance-2', 'agent-risk-1'],
          collaborationModel: 'consensus',
          status: 'active',
          lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          behaviorCount: 15,
          protocolCount: 8,
          consensusCount: 12,
          communicationCount: 45,
          governanceEnabled: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
        },
        {
          contextId: 'mas-ctx-002',
          name: 'Customer Support Swarm',
          agentIds: ['agent-support-1', 'agent-support-2', 'agent-support-3', 'agent-escalation-1'],
          collaborationModel: 'leader-follower',
          status: 'active',
          lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          behaviorCount: 32,
          protocolCount: 18,
          consensusCount: 6,
          communicationCount: 128,
          governanceEnabled: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 1 week ago
        },
        {
          contextId: 'mas-ctx-003',
          name: 'Research Coordination',
          agentIds: ['agent-research-1', 'agent-research-2'],
          collaborationModel: 'peer-to-peer',
          status: 'inactive',
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          behaviorCount: 8,
          protocolCount: 4,
          consensusCount: 3,
          communicationCount: 22,
          governanceEnabled: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        },
        {
          contextId: 'mas-ctx-004',
          name: 'Security Monitoring Cluster',
          agentIds: ['agent-security-1', 'agent-security-2', 'agent-security-3', 'agent-alert-1', 'agent-response-1'],
          collaborationModel: 'hierarchical',
          status: 'active',
          lastActivity: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
          behaviorCount: 67,
          protocolCount: 34,
          consensusCount: 28,
          communicationCount: 256,
          governanceEnabled: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() // 2 weeks ago
        }
      ];

      setContexts(sampleContexts);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MAS contexts');
    } finally {
      setLoading(false);
    }
  };

  const filterContexts = () => {
    if (!searchTerm.trim()) {
      setFilteredContexts(contexts);
      return;
    }

    const filtered = contexts.filter(context =>
      context.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      context.contextId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      context.collaborationModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      context.agentIds.some(agentId => 
        agentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    setFilteredContexts(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.success;
      case 'inactive': return theme.warning;
      case 'error': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'inactive': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTotalActivityCount = (context: MASContext) => {
    return context.behaviorCount + context.protocolCount + context.consensusCount + context.communicationCount;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress size={24} sx={{ color: theme.primary }} />
        <Typography sx={{ ml: 1, color: theme.textSecondary }}>
          Loading MAS contexts...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          m: 2,
          backgroundColor: theme.surface,
          color: theme.text,
          '& .MuiAlert-icon': { color: theme.error }
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ backgroundColor: theme.background }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.border}` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ color: theme.text, fontWeight: 'bold' }}>
            <AccountTreeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            MAS Contexts
          </Typography>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{ color: theme.textSecondary }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={expanded}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search contexts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.surface,
                color: theme.text,
                '& fieldset': {
                  borderColor: theme.border,
                },
                '&:hover fieldset': {
                  borderColor: theme.primary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.primary,
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: theme.textSecondary,
                opacity: 1,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.textSecondary }} />
                </InputAdornment>
              ),
            }}
          />
        </Collapse>
      </Box>

      {/* Context List */}
      <Collapse in={expanded}>
        <List sx={{ p: 0 }}>
          {filteredContexts.map((context) => (
            <ListItem key={context.contextId} disablePadding>
              <ListItemButton
                selected={selectedContext === context.contextId}
                onClick={() => onContextSelect(context.contextId)}
                sx={{
                  py: 2,
                  px: 2,
                  borderBottom: `1px solid ${theme.border}`,
                  '&.Mui-selected': {
                    backgroundColor: `${theme.primary}20`,
                    borderLeft: `3px solid ${theme.primary}`,
                  },
                  '&:hover': {
                    backgroundColor: `${theme.primary}10`,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Badge
                    badgeContent={getTotalActivityCount(context)}
                    color="primary"
                    max={999}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: theme.primary,
                        color: theme.background
                      }
                    }}
                  >
                    <AccountTreeIcon sx={{ color: theme.primary }} />
                  </Badge>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" sx={{ color: theme.text, fontWeight: 'bold' }}>
                        {context.name}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(context.status)}
                        label={context.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(context.status),
                          color: theme.background,
                          height: 20,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.textSecondary, display: 'block' }}>
                        {context.contextId}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={0.5} mb={1}>
                        <GroupIcon sx={{ fontSize: 14, color: theme.textSecondary, mr: 0.5 }} />
                        <Typography variant="caption" sx={{ color: theme.textSecondary, mr: 2 }}>
                          {context.agentIds.length} agents
                        </Typography>
                        <TimelineIcon sx={{ fontSize: 14, color: theme.textSecondary, mr: 0.5 }} />
                        <Typography variant="caption" sx={{ color: theme.textSecondary }}>
                          {context.collaborationModel}
                        </Typography>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                        <Chip
                          label={`${context.behaviorCount} behaviors`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: theme.border,
                            color: theme.textSecondary,
                            fontSize: '0.6rem',
                            height: 18
                          }}
                        />
                        <Chip
                          label={`${context.protocolCount} protocols`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: theme.border,
                            color: theme.textSecondary,
                            fontSize: '0.6rem',
                            height: 18
                          }}
                        />
                        <Chip
                          label={`${context.consensusCount} consensus`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: theme.border,
                            color: theme.textSecondary,
                            fontSize: '0.6rem',
                            height: 18
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: theme.textSecondary }}>
                        Last activity: {formatRelativeTime(context.lastActivity)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      {filteredContexts.length === 0 && !loading && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <AccountTreeIcon sx={{ fontSize: 48, color: theme.textSecondary, mb: 1 }} />
          <Typography variant="body2" sx={{ color: theme.textSecondary }}>
            {searchTerm ? 'No contexts match your search' : 'No MAS contexts available'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MASContextSelector;

