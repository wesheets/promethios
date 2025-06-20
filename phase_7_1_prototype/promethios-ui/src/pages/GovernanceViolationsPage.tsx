/**
 * Governance Violations Page
 * 
 * Comprehensive violation tracking and management interface for both single agents 
 * and multi-agent systems. Shows violations from PRISM, VIGIL, and other governance systems.
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
  Alert,
  Divider,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Pagination
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Security,
  Visibility,
  Person,
  Group,
  FilterList,
  Download,
  Refresh,
  ExpandMore,
  Timeline,
  Assessment,
  BugReport,
  Shield,
  Gavel,
  Assignment,
  Close,
  PlayArrow,
  Pause,
  Stop,
  MoreVert,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
  observerService, 
  PRISMViolation, 
  VigilViolation 
} from '../services/observers';

interface ViolationSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  active: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface ViolationDetail extends PRISMViolation, VigilViolation {
  id: string;
  source: 'PRISM' | 'VIGIL' | 'GOVERNANCE' | 'MULTI_AGENT';
  agent_id: string;
  agent_name: string;
  agent_type: 'single' | 'multi_agent_system';
  status: 'active' | 'resolved' | 'investigating' | 'dismissed';
  resolution_notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  impact_score: number;
}

interface RemediationAction {
  id: string;
  violation_id: string;
  action_type: 'policy_update' | 'agent_retrain' | 'threshold_adjust' | 'manual_review';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

const GovernanceViolationsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'summary' | 'details' | 'trends'>('summary');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [violationSummary, setViolationSummary] = useState<ViolationSummary | null>(null);
  const [violations, setViolations] = useState<ViolationDetail[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<ViolationDetail | null>(null);
  const [remediationActions, setRemediationActions] = useState<RemediationAction[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [remediationDialogOpen, setRemediationDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    const initializeViolationsData = () => {
      // Mock violation summary
      const summary: ViolationSummary = {
        total: 47,
        critical: 3,
        high: 8,
        medium: 21,
        low: 15,
        resolved: 32,
        active: 15,
        trend: 'down',
        trendPercent: 12.5
      };

      // Mock violation details
      const mockViolations: ViolationDetail[] = [
        {
          id: 'viol_001',
          source: 'PRISM',
          agent_id: 'agent_financial',
          agent_name: 'Financial Advisor Agent',
          agent_type: 'single',
          type: 'trust_threshold_breach',
          severity: 'critical',
          message: 'Trust score dropped below minimum threshold (0.65 < 0.8)',
          timestamp: '2025-06-20T14:30:00Z',
          tool: 'financial_analysis',
          status: 'active',
          impact_score: 95,
          created_at: '2025-06-20T14:30:00Z',
          updated_at: '2025-06-20T14:30:00Z'
        },
        {
          id: 'viol_002',
          source: 'VIGIL',
          agent_id: 'multi_agent_support',
          agent_name: 'Customer Support Team',
          agent_type: 'multi_agent_system',
          type: 'goal_drift_detected',
          severity: 'high',
          message: 'Agent conversation drifted from original support goal',
          timestamp: '2025-06-20T13:45:00Z',
          status: 'investigating',
          impact_score: 78,
          created_at: '2025-06-20T13:45:00Z',
          updated_at: '2025-06-20T15:20:00Z',
          assigned_to: 'governance_team'
        },
        {
          id: 'viol_003',
          source: 'GOVERNANCE',
          agent_id: 'agent_legal',
          agent_name: 'Legal Advisor Agent',
          agent_type: 'single',
          type: 'policy_compliance_failure',
          severity: 'high',
          message: 'Failed to comply with legal disclaimer policy',
          timestamp: '2025-06-20T12:15:00Z',
          status: 'resolved',
          impact_score: 82,
          created_at: '2025-06-20T12:15:00Z',
          updated_at: '2025-06-20T16:45:00Z',
          resolution_notes: 'Policy updated to include automatic disclaimer insertion'
        },
        {
          id: 'viol_004',
          source: 'MULTI_AGENT',
          agent_id: 'multi_agent_research',
          agent_name: 'Research Analysis Team',
          agent_type: 'multi_agent_system',
          type: 'coordination_failure',
          severity: 'medium',
          message: 'Agent coordination protocol violation in shared context',
          timestamp: '2025-06-20T11:30:00Z',
          status: 'resolved',
          impact_score: 65,
          created_at: '2025-06-20T11:30:00Z',
          updated_at: '2025-06-20T14:15:00Z'
        },
        {
          id: 'viol_005',
          source: 'PRISM',
          agent_id: 'agent_customer_service',
          agent_name: 'Customer Service Agent',
          agent_type: 'single',
          type: 'rate_limit_exceeded',
          severity: 'medium',
          message: 'Exceeded maximum requests per minute (75 > 60)',
          timestamp: '2025-06-20T10:45:00Z',
          tool: 'customer_query',
          status: 'active',
          impact_score: 45,
          created_at: '2025-06-20T10:45:00Z',
          updated_at: '2025-06-20T10:45:00Z'
        }
      ];

      // Mock remediation actions
      const mockActions: RemediationAction[] = [
        {
          id: 'action_001',
          violation_id: 'viol_001',
          action_type: 'threshold_adjust',
          description: 'Temporarily lower trust threshold to 0.7 while investigating root cause',
          status: 'pending',
          created_at: '2025-06-20T15:00:00Z'
        },
        {
          id: 'action_002',
          violation_id: 'viol_003',
          action_type: 'policy_update',
          description: 'Updated legal disclaimer policy to include automatic insertion',
          status: 'completed',
          created_at: '2025-06-20T16:30:00Z',
          completed_at: '2025-06-20T16:45:00Z'
        }
      ];

      setViolationSummary(summary);
      setViolations(mockViolations);
      setRemediationActions(mockActions);
      setAvailableAgents([
        'Financial Advisor Agent',
        'Customer Support Team',
        'Legal Advisor Agent',
        'Research Analysis Team',
        'Customer Service Agent'
      ]);
    };

    initializeViolationsData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#EF4444';
      case 'investigating': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'dismissed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'PRISM': return <Visibility />;
      case 'VIGIL': return <Security />;
      case 'GOVERNANCE': return <Gavel />;
      case 'MULTI_AGENT': return <Group />;
      default: return <BugReport />;
    }
  };

  const handleViolationClick = (violation: ViolationDetail) => {
    setSelectedViolation(violation);
    setDetailDialogOpen(true);
  };

  const handleRemediation = (violation: ViolationDetail) => {
    setSelectedViolation(violation);
    setRemediationDialogOpen(true);
  };

  const exportViolations = () => {
    const exportData = {
      summary: violationSummary,
      violations: violations,
      remediation_actions: remediationActions,
      filters: {
        agents: selectedAgents,
        severity: severityFilter,
        status: statusFilter,
        source: sourceFilter,
        date_range: dateRange
      },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance_violations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredViolations = violations.filter(violation => {
    if (selectedAgents.length > 0 && !selectedAgents.includes(violation.agent_name)) return false;
    if (severityFilter.length > 0 && !severityFilter.includes(violation.severity)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(violation.status)) return false;
    if (sourceFilter.length > 0 && !sourceFilter.includes(violation.source)) return false;
    return true;
  });

  const paginatedViolations = filteredViolations.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

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
          <Typography variant="h4" gutterBottom>
            Governance Violations
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Monitor and manage governance violations across all agents and systems
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportViolations}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {violationSummary && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="text.primary" gutterBottom>
                      {violationSummary.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Total Violations
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#6B7280' }}>
                    <BugReport />
                  </Avatar>
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  {violationSummary.trend === 'down' ? (
                    <TrendingDown sx={{ color: '#10B981', mr: 1 }} />
                  ) : (
                    <TrendingUp sx={{ color: '#EF4444', mr: 1 }} />
                  )}
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    {violationSummary.trendPercent}% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="error.main" gutterBottom>
                      {violationSummary.critical}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Critical
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#EF4444' }}>
                    <Error />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="warning.main" gutterBottom>
                      {violationSummary.high}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      High
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#F59E0B' }}>
                    <Warning />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="info.main" gutterBottom>
                      {violationSummary.medium}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Medium
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#3B82F6' }}>
                    <Info />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      {violationSummary.resolved}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Resolved
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#10B981' }}>
                    <CheckCircle />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="error.main" gutterBottom>
                      {violationSummary.active}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Active
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#EF4444' }}>
                    <PlayArrow />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                multiple
                options={availableAgents}
                value={selectedAgents}
                onChange={(event, newValue) => setSelectedAgents(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Agents"
                    variant="outlined"
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  multiple
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as string[])}
                  label="Severity"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as string[])}
                  label="Status"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="dismissed">Dismissed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  multiple
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as string[])}
                  label="Source"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="PRISM">PRISM</MenuItem>
                  <MenuItem value="VIGIL">VIGIL</MenuItem>
                  <MenuItem value="GOVERNANCE">Governance</MenuItem>
                  <MenuItem value="MULTI_AGENT">Multi-Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  label="Date Range"
                >
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSelectedAgents([]);
                  setSeverityFilter([]);
                  setStatusFilter([]);
                  setSourceFilter([]);
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={`Violations (${filteredViolations.length})`}
          subheader={`Showing ${paginatedViolations.length} of ${filteredViolations.length} violations`}
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedViolations.map((violation) => (
                  <TableRow 
                    key={violation.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViolationClick(violation)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: getSeverityColor(violation.severity), mr: 1, width: 24, height: 24 }}>
                          {getSourceIcon(violation.source)}
                        </Avatar>
                        {violation.source}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {violation.agent_type === 'multi_agent_system' ? <Group sx={{ mr: 1 }} /> : <Person sx={{ mr: 1 }} />}
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {violation.agent_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            {violation.agent_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {violation.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={violation.severity}
                        size="small"
                        sx={{
                          bgcolor: getSeverityColor(violation.severity),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={violation.status}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: getStatusColor(violation.status),
                          color: getStatusColor(violation.status)
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LinearProgress
                          variant="determinate"
                          value={violation.impact_score}
                          sx={{
                            width: 60,
                            mr: 1,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getSeverityColor(violation.severity)
                            }
                          }}
                        />
                        <Typography variant="body2">
                          {violation.impact_score}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(violation.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        {new Date(violation.created_at).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemediation(violation);
                          }}
                        >
                          <Assignment />
                        </IconButton>
                        <IconButton size="small">
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={Math.ceil(filteredViolations.length / rowsPerPage)}
              page={page}
              onChange={(event, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Violation Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Violation Details</Typography>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedViolation && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Basic Information
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>ID</Typography>
                    <Typography variant="body1">{selectedViolation.id}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Source</Typography>
                    <Box display="flex" alignItems="center">
                      {getSourceIcon(selectedViolation.source)}
                      <Typography variant="body1" ml={1}>{selectedViolation.source}</Typography>
                    </Box>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Agent</Typography>
                    <Typography variant="body1">{selectedViolation.agent_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      {selectedViolation.agent_id} ({selectedViolation.agent_type})
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Violation Details
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Type</Typography>
                    <Typography variant="body1">
                      {selectedViolation.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Severity</Typography>
                    <Chip
                      label={selectedViolation.severity}
                      sx={{
                        bgcolor: getSeverityColor(selectedViolation.severity),
                        color: 'white'
                      }}
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>Impact Score</Typography>
                    <Box display="flex" alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={selectedViolation.impact_score}
                        sx={{
                          width: 100,
                          mr: 1,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getSeverityColor(selectedViolation.severity)
                          }
                        }}
                      />
                      <Typography variant="body1">{selectedViolation.impact_score}/100</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Message
                  </Typography>
                  <Alert severity={selectedViolation.severity as any} sx={{ mb: 2 }}>
                    {selectedViolation.message}
                  </Alert>
                </Grid>

                {selectedViolation.tool && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Tool Context
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Tool: {selectedViolation.tool}
                    </Typography>
                  </Grid>
                )}

                {selectedViolation.resolution_notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Resolution Notes
                    </Typography>
                    <Typography variant="body2">
                      {selectedViolation.resolution_notes}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Timeline
                  </Typography>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Created: {new Date(selectedViolation.created_at).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Updated: {new Date(selectedViolation.updated_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setDetailDialogOpen(false);
              if (selectedViolation) {
                handleRemediation(selectedViolation);
              }
            }}
          >
            Create Remediation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remediation Dialog */}
      <Dialog
        open={remediationDialogOpen}
        onClose={() => setRemediationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Remediation Action</DialogTitle>
        <DialogContent>
          {selectedViolation && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Creating remediation for: {selectedViolation.type?.replace(/_/g, ' ')}
              </Alert>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Action Type</InputLabel>
                <Select
                  defaultValue="manual_review"
                  label="Action Type"
                >
                  <MenuItem value="policy_update">Policy Update</MenuItem>
                  <MenuItem value="agent_retrain">Agent Retraining</MenuItem>
                  <MenuItem value="threshold_adjust">Threshold Adjustment</MenuItem>
                  <MenuItem value="manual_review">Manual Review</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                variant="outlined"
                placeholder="Describe the remediation action to be taken..."
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  defaultValue=""
                  label="Assign To"
                >
                  <MenuItem value="governance_team">Governance Team</MenuItem>
                  <MenuItem value="technical_team">Technical Team</MenuItem>
                  <MenuItem value="policy_team">Policy Team</MenuItem>
                  <MenuItem value="agent_owner">Agent Owner</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemediationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Action</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GovernanceViolationsPage;

