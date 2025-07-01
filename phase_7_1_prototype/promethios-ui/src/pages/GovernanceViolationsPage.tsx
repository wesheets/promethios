/**
 * Governance Violations Page
 * 
 * Comprehensive violation tracking and remediation interface for governance monitoring.
 * Includes violation detection, categorization, impact assessment, and resolution workflows.
 * Uses real AgentViolation data from the Promethios backend.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
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
  Alert,
  AlertTitle,
  Divider,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Pagination,
  Badge,
  Stack,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Warning,
  Error,
  CheckCircle,
  Security,
  Gavel,
  Assignment,
  Person,
  Group,
  FilterList,
  Refresh,
  Download,
  Visibility,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  Schedule,
  TrendingUp,
  TrendingDown,
  Info,
  BugReport,
  Shield,
  Policy,
  ExpandMore,
  Search,
  Clear,
  GetApp,
  Assessment,
  Timeline as TimelineIcon,
  Notifications,
  NotificationsActive,
  Home,
  NavigateNext
} from '@mui/icons-material';

// Real data interfaces based on AgentViolation model
interface RealViolation {
  id: number;
  agent_id: string;
  user_id: string;
  deployment_id?: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  policy_id?: string;
  policy_name?: string;
  description: string;
  context?: string;
  remediation_suggested?: string;
  timestamp: string;
  status?: 'open' | 'investigating' | 'resolved' | 'false_positive';
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
}

interface ViolationMetrics {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  open: number;
  investigating: number;
  false_positive: number;
  trend: 'up' | 'down' | 'stable';
  avg_resolution_time: number;
  most_common_type: string;
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
      id={`violations-tabpanel-${index}`}
      aria-labelledby={`violations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GovernanceViolationsPage: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [violations, setViolations] = useState<RealViolation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<RealViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Dialog states
  const [selectedViolation, setSelectedViolation] = useState<RealViolation | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'false_positive'>('resolved');
  const [resolving, setResolving] = useState(false);
  
  // Bulk operations
  const [selectedViolations, setSelectedViolations] = useState<number[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'resolve' | 'investigate' | 'export'>('resolve');

  // Load real violation data from backend
  const loadViolations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the real backend API
      const response = await fetch('/api/agent-metrics/violations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load violations: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform backend data to include status if not present
      const violationsWithStatus = data.map((violation: any) => ({
        ...violation,
        status: violation.status || 'open',
        resolved_at: violation.resolved_at || null,
        resolved_by: violation.resolved_by || null,
        resolution_notes: violation.resolution_notes || null
      }));
      
      setViolations(violationsWithStatus);
      setFilteredViolations(violationsWithStatus);
    } catch (err) {
      console.error('Error loading violations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters to violations
  const applyFilters = useCallback(() => {
    let filtered = [...violations];
    
    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(v => v.severity === severityFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => (v.status || 'open') === statusFilter);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.violation_type === typeFilter);
    }
    
    // Agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter(v => v.agent_id === agentFilter);
    }
    
    // Date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(v => new Date(v.timestamp) >= cutoffDate);
    }
    
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.description.toLowerCase().includes(query) ||
        v.violation_type.toLowerCase().includes(query) ||
        v.agent_id.toLowerCase().includes(query) ||
        (v.policy_name && v.policy_name.toLowerCase().includes(query))
      );
    }
    
    setFilteredViolations(filtered);
    setPage(1); // Reset to first page when filters change
  }, [violations, severityFilter, statusFilter, typeFilter, agentFilter, dateRange, searchQuery]);

  // Calculate metrics from real data
  const calculateMetrics = useCallback((): ViolationMetrics => {
    const total = violations.length;
    const critical = violations.filter(v => v.severity === 'critical').length;
    const high = violations.filter(v => v.severity === 'high').length;
    const medium = violations.filter(v => v.severity === 'medium').length;
    const low = violations.filter(v => v.severity === 'low').length;
    
    const resolved = violations.filter(v => v.status === 'resolved').length;
    const open = violations.filter(v => (v.status || 'open') === 'open').length;
    const investigating = violations.filter(v => v.status === 'investigating').length;
    const false_positive = violations.filter(v => v.status === 'false_positive').length;
    
    // Calculate average resolution time
    const resolvedViolations = violations.filter(v => v.status === 'resolved' && v.resolved_at);
    const avgResolutionTime = resolvedViolations.length > 0 
      ? resolvedViolations.reduce((sum, v) => {
          const created = new Date(v.timestamp);
          const resolved = new Date(v.resolved_at!);
          return sum + (resolved.getTime() - created.getTime());
        }, 0) / resolvedViolations.length / (1000 * 60 * 60) // Convert to hours
      : 0;
    
    // Find most common violation type
    const typeCounts = violations.reduce((acc, v) => {
      acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonType = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    
    // Simple trend calculation (could be enhanced with historical data)
    const trend: 'up' | 'down' | 'stable' = 'stable';
    
    return {
      total,
      critical,
      high,
      medium,
      low,
      resolved,
      open,
      investigating,
      false_positive,
      trend,
      avg_resolution_time: avgResolutionTime,
      most_common_type: mostCommonType
    };
  }, [violations]);

  // Resolve violation
  const handleResolveViolation = async (violationId: number, notes: string, status: 'resolved' | 'false_positive') => {
    try {
      setResolving(true);
      
      const response = await fetch(`/api/agent-metrics/violations/${violationId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          resolution_notes: notes,
          resolved_by: 'current_user' // In real app, get from auth context
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to resolve violation: ${response.statusText}`);
      }
      
      // Update local state
      setViolations(prev => prev.map(v => 
        v.id === violationId 
          ? { 
              ...v, 
              status, 
              resolution_notes: notes, 
              resolved_at: new Date().toISOString(),
              resolved_by: 'current_user'
            }
          : v
      ));
      
      setResolveDialogOpen(false);
      setResolutionNotes('');
      setSelectedViolation(null);
      
    } catch (err) {
      console.error('Error resolving violation:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve violation');
    } finally {
      setResolving(false);
    }
  };

  // Bulk operations
  const handleBulkAction = async () => {
    if (selectedViolations.length === 0) return;
    
    try {
      setResolving(true);
      
      if (bulkAction === 'resolve') {
        // Bulk resolve violations
        const response = await fetch('/api/agent-metrics/violations/bulk-resolve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            violation_ids: selectedViolations,
            status: 'resolved',
            resolution_notes: resolutionNotes || 'Bulk resolved',
            resolved_by: 'current_user'
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to bulk resolve violations: ${response.statusText}`);
        }
        
        // Update local state
        setViolations(prev => prev.map(v => 
          selectedViolations.includes(v.id)
            ? { 
                ...v, 
                status: 'resolved' as const, 
                resolution_notes: resolutionNotes || 'Bulk resolved',
                resolved_at: new Date().toISOString(),
                resolved_by: 'current_user'
              }
            : v
        ));
        
      } else if (bulkAction === 'investigate') {
        // Bulk set to investigating
        setViolations(prev => prev.map(v => 
          selectedViolations.includes(v.id)
            ? { ...v, status: 'investigating' as const }
            : v
        ));
        
      } else if (bulkAction === 'export') {
        // Export selected violations
        const selectedData = violations.filter(v => selectedViolations.includes(v.id));
        const csvContent = generateCSVExport(selectedData);
        downloadCSV(csvContent, `violations_export_${new Date().toISOString().split('T')[0]}.csv`);
      }
      
      setSelectedViolations([]);
      setBulkActionDialogOpen(false);
      setResolutionNotes('');
      
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    } finally {
      setResolving(false);
    }
  };

  // Export functions
  const generateCSVExport = (data: RealViolation[]): string => {
    const headers = [
      'ID', 'Agent ID', 'User ID', 'Violation Type', 'Severity', 'Status',
      'Policy Name', 'Description', 'Timestamp', 'Resolved At', 'Resolution Notes'
    ];
    
    const rows = data.map(v => [
      v.id,
      v.agent_id,
      v.user_id,
      v.violation_type,
      v.severity,
      v.status || 'open',
      v.policy_name || '',
      `"${v.description.replace(/"/g, '""')}"`,
      v.timestamp,
      v.resolved_at || '',
      `"${(v.resolution_notes || '').replace(/"/g, '""')}"`
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unique values for filters
  const getUniqueValues = (field: keyof RealViolation): string[] => {
    const values = violations.map(v => v[field]).filter(Boolean) as string[];
    return [...new Set(values)].sort();
  };

  // Effects
  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Get metrics
  const metrics = calculateMetrics();

  // Get paginated data
  const paginatedViolations = filteredViolations.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Severity color mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'investigating': return 'warning';
      case 'false_positive': return 'info';
      case 'open': return 'error';
      default: return 'default';
    }
  };

  // Render metrics cards
  const renderMetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Tooltip title="Total number of governance violations detected across all agents and policies">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Violations
                  </Typography>
                  <Typography variant="h4">
                    {metrics.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Warning />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Tooltip>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Tooltip title="Critical violations require immediate attention and may indicate serious security or compliance issues">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Critical
                  </Typography>
                  <Typography variant="h4" color="error">
                    {metrics.critical}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Error />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Tooltip>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Tooltip title="Percentage of violations that have been successfully resolved">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Resolution Rate
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Tooltip>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Tooltip title="Average time taken to resolve violations (in hours)">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Resolution Time
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(metrics.avg_resolution_time)}h
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Schedule />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Tooltip>
      </Grid>
    </Grid>
  );

  // Render filters
  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardHeader 
        title="Filters & Search"
        action={
          <Tooltip title="Clear all filters and search criteria">
            <IconButton onClick={() => {
              setSeverityFilter('all');
              setStatusFilter('all');
              setTypeFilter('all');
              setAgentFilter('all');
              setDateRange('7');
              setSearchQuery('');
            }}>
              <Clear />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Tooltip title="Search violations by description, type, agent ID, or policy name">
              <TextField
                fullWidth
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                placeholder="Search violations..."
              />
            </Tooltip>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Tooltip title="Filter by violation severity level">
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  label="Severity"
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Tooltip title="Filter by violation status">
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="false_positive">False Positive</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Tooltip title="Filter by violation type">
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {getUniqueValues('violation_type').map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Tooltip>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Tooltip title="Filter by time period">
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="1">Last 24 hours</MenuItem>
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </Grid>
          
          <Grid item xs={12} md={1}>
            <Tooltip title="Refresh violation data from the server">
              <IconButton onClick={loadViolations} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        
        {/* Bulk actions */}
        {selectedViolations.length > 0 && (
          <Box mt={2}>
            <Alert severity="info">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography>
                  {selectedViolations.length} violation(s) selected
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Resolve selected violations">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => {
                        setBulkAction('resolve');
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      Resolve
                    </Button>
                  </Tooltip>
                  <Tooltip title="Mark selected violations as under investigation">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setBulkAction('investigate');
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      Investigate
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export selected violations to CSV">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<GetApp />}
                      onClick={() => {
                        setBulkAction('export');
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      Export
                    </Button>
                  </Tooltip>
                </Stack>
              </Box>
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Render violations table
  const renderViolationsTable = () => (
    <Card>
      <CardHeader 
        title={`Violations (${filteredViolations.length})`}
        action={
          <Tooltip title="Export all filtered violations to CSV">
            <Button
              startIcon={<Download />}
              onClick={() => {
                const csvContent = generateCSVExport(filteredViolations);
                downloadCSV(csvContent, `all_violations_export_${new Date().toISOString().split('T')[0]}.csv`);
              }}
            >
              Export All
            </Button>
          </Tooltip>
        }
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Tooltip title="Select all violations on this page">
                    <input
                      type="checkbox"
                      checked={paginatedViolations.length > 0 && paginatedViolations.every(v => selectedViolations.includes(v.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedViolations(prev => [...new Set([...prev, ...paginatedViolations.map(v => v.id)])]);
                        } else {
                          setSelectedViolations(prev => prev.filter(id => !paginatedViolations.map(v => v.id).includes(id)));
                        }
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Violation severity level">
                    <Typography variant="subtitle2">Severity</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Type of governance violation">
                    <Typography variant="subtitle2">Type</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Agent that triggered the violation">
                    <Typography variant="subtitle2">Agent</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Description of what went wrong">
                    <Typography variant="subtitle2">Description</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Current status of the violation">
                    <Typography variant="subtitle2">Status</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="When the violation occurred">
                    <Typography variant="subtitle2">Timestamp</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Available actions for this violation">
                    <Typography variant="subtitle2">Actions</Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedViolations.map((violation) => (
                <TableRow key={violation.id} hover>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedViolations.includes(violation.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedViolations(prev => [...prev, violation.id]);
                        } else {
                          setSelectedViolations(prev => prev.filter(id => id !== violation.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={violation.severity.toUpperCase()}
                      color={getSeverityColor(violation.severity) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`Violation type: ${violation.violation_type}`}>
                      <Typography variant="body2" noWrap>
                        {violation.violation_type}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`Agent ID: ${violation.agent_id}`}>
                      <Typography variant="body2" noWrap>
                        {violation.agent_id}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={violation.description}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {violation.description}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(violation.status || 'open').toUpperCase()}
                      color={getStatusColor(violation.status || 'open') as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`Occurred at: ${new Date(violation.timestamp).toLocaleString()}`}>
                      <Typography variant="body2">
                        {new Date(violation.timestamp).toLocaleDateString()}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View detailed information about this violation">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedViolation(violation);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {(violation.status === 'open' || violation.status === 'investigating') && (
                        <Tooltip title="Resolve this violation">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedViolation(violation);
                              setResolveDialogOpen(true);
                            }}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={Math.ceil(filteredViolations.length / rowsPerPage)}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </CardContent>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ p: 3 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); }}>
              <Home />
            </Link>
            <Link color="inherit" href="/governance" onClick={(e) => { e.preventDefault(); }}>
              Governance
            </Link>
            <Typography color="text.primary">Violations</Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" gutterBottom>
            Governance Violations
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ p: 3 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); }}>
              <Home />
            </Link>
            <Link color="inherit" href="/governance" onClick={(e) => { e.preventDefault(); }}>
              Governance
            </Link>
            <Typography color="text.primary">Violations</Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" gutterBottom>
            Governance Violations
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Error Loading Violations</AlertTitle>
            {error}
            <Box mt={2}>
              <Button variant="contained" onClick={loadViolations}>
                Retry
              </Button>
            </Box>
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ p: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); }}>
            <Home />
          </Link>
          <Link color="inherit" href="/governance" onClick={(e) => { e.preventDefault(); }}>
            Governance
          </Link>
          <Typography color="text.primary">Violations</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Governance Violations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor, investigate, and resolve governance violations across all deployed agents
            </Typography>
          </Box>
          <Tooltip title="Real-time violation monitoring helps maintain compliance and security">
            <IconButton>
              <Info />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Metrics Cards */}
        {renderMetricsCards()}

        {/* Filters */}
        {renderFilters()}

        {/* Violations Table */}
        {renderViolationsTable()}

        {/* Violation Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Violation Details
            {selectedViolation && (
              <Chip
                label={selectedViolation.severity.toUpperCase()}
                color={getSeverityColor(selectedViolation.severity) as any}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </DialogTitle>
          <DialogContent>
            {selectedViolation && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Agent ID</Typography>
                  <Typography variant="body2" gutterBottom>{selectedViolation.agent_id}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>User ID</Typography>
                  <Typography variant="body2" gutterBottom>{selectedViolation.user_id}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Violation Type</Typography>
                  <Typography variant="body2" gutterBottom>{selectedViolation.violation_type}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Policy</Typography>
                  <Typography variant="body2" gutterBottom>{selectedViolation.policy_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Description</Typography>
                  <Typography variant="body2" gutterBottom>{selectedViolation.description}</Typography>
                </Grid>
                {selectedViolation.context && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Context</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedViolation.context}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {selectedViolation.remediation_suggested && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Suggested Remediation</Typography>
                    <Typography variant="body2" gutterBottom>{selectedViolation.remediation_suggested}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Timestamp</Typography>
                  <Typography variant="body2" gutterBottom>
                    {new Date(selectedViolation.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Status</Typography>
                  <Chip
                    label={(selectedViolation.status || 'open').toUpperCase()}
                    color={getStatusColor(selectedViolation.status || 'open') as any}
                    size="small"
                  />
                </Grid>
                {selectedViolation.resolved_at && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Resolved At</Typography>
                      <Typography variant="body2" gutterBottom>
                        {new Date(selectedViolation.resolved_at).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Resolved By</Typography>
                      <Typography variant="body2" gutterBottom>{selectedViolation.resolved_by || 'N/A'}</Typography>
                    </Grid>
                  </>
                )}
                {selectedViolation.resolution_notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Resolution Notes</Typography>
                    <Typography variant="body2" gutterBottom>{selectedViolation.resolution_notes}</Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            {selectedViolation && (selectedViolation.status === 'open' || selectedViolation.status === 'investigating') && (
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  setResolveDialogOpen(true);
                }}
              >
                Resolve
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Resolve Violation Dialog */}
        <Dialog
          open={resolveDialogOpen}
          onClose={() => setResolveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Resolve Violation</DialogTitle>
          <DialogContent>
            <Box mt={2}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Resolution Status</InputLabel>
                <Select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as 'resolved' | 'false_positive')}
                  label="Resolution Status"
                >
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="false_positive">False Positive</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Resolution Notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how this violation was resolved or why it's a false positive..."
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                if (selectedViolation && resolutionNotes.trim()) {
                  handleResolveViolation(selectedViolation.id, resolutionNotes, resolutionStatus);
                }
              }}
              disabled={resolving || !resolutionNotes.trim()}
            >
              {resolving ? <CircularProgress size={20} /> : 'Resolve'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Action Dialog */}
        <Dialog
          open={bulkActionDialogOpen}
          onClose={() => setBulkActionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Bulk Action: {bulkAction === 'resolve' ? 'Resolve' : bulkAction === 'investigate' ? 'Investigate' : 'Export'} Violations
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              {bulkAction === 'resolve' && `Resolve ${selectedViolations.length} selected violation(s)?`}
              {bulkAction === 'investigate' && `Mark ${selectedViolations.length} selected violation(s) as under investigation?`}
              {bulkAction === 'export' && `Export ${selectedViolations.length} selected violation(s) to CSV?`}
            </Typography>
            {bulkAction === 'resolve' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Resolution Notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how these violations were resolved..."
                sx={{ mt: 2 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleBulkAction}
              disabled={resolving || (bulkAction === 'resolve' && !resolutionNotes.trim())}
            >
              {resolving ? <CircularProgress size={20} /> : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default GovernanceViolationsPage;

