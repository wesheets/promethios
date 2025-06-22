/**
 * Governance Violations Page
 * 
 * Comprehensive violation tracking and remediation interface for governance monitoring.
 * Includes violation detection, categorization, impact assessment, and resolution workflows.
 */

import React, { useState, useEffect } from 'react';
import { useGovernanceDashboard } from '../hooks/useGovernanceDashboard';
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
  Pagination
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
  Policy
} from '@mui/icons-material';

interface Violation {
  id: string;
  source: 'PRISM' | 'VIGIL' | 'GOVERNANCE' | 'MULTI_AGENT';
  agent_id: string;
  agent_name: string;
  agent_type: 'single' | 'multi';
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  description: string;
  impact: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  trust_impact: number;
  policy_violated?: string;
  remediation_steps: string[];
}

interface ViolationMetrics {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  open: number;
  trend: 'up' | 'down' | 'stable';
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
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');
  const [page, setPage] = useState(1);

  // Use real backend data
  const {
    violations,
    violationsLoading,
    violationsError,
    resolvingViolation,
    operationError,
    resolveViolation,
    refreshAll,
    clearErrors,
    filterViolations
  } = useGovernanceDashboard();

  const loading = violationsLoading;
  // Filter violations based on current filters
  const filteredViolations = filterViolations({
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: sourceFilter !== 'all' ? sourceFilter : undefined
  });

  // Calculate metrics from real data
  const metrics = {
    total: violations.length,
    critical: violations.filter(v => v.severity === 'critical').length,
    high: violations.filter(v => v.severity === 'high').length,
    medium: violations.filter(v => v.severity === 'medium').length,
    low: violations.filter(v => v.severity === 'low').length,
    resolved: violations.filter(v => v.status === 'resolved').length,
    open: violations.filter(v => v.status === 'open').length,
    trend: 'stable' as const
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResolveViolation = async (violationId: string, resolutionNotes: string = 'Violation resolved') => {
    try {
      await resolveViolation(violationId, resolutionNotes);
    } catch (error) {
      console.error('Error resolving violation:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Governance Violations
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Error handling
  if (violationsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Governance Violations
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error Loading Violations</AlertTitle>
          {violationsError}
        </Alert>
      </Box>
    );
  }
      v.id === violationId 
        ? { ...v, status: 'resolved', resolved_at: new Date().toISOString() }
        : v
    ));
  };

  const handleDeleteViolation = (violationId: string) => {
    setViolations(prev => prev.filter(v => v.id !== violationId));
  };

  const exportViolations = () => {
    const dataStr = JSON.stringify(violations, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'governance-violations.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredViolations = violations.filter(violation => {
    if (severityFilter !== 'all' && violation.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && violation.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && violation.source !== sourceFilter) return false;
    if (selectedAgents.length > 0 && !selectedAgents.includes(violation.agent_id)) return false;
    return true;
  });

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
      case 'open': return '#EF4444';
      case 'investigating': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'false_positive': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'PRISM': return <Shield />;
      case 'VIGIL': return <Security />;
      case 'GOVERNANCE': return <Policy />;
      case 'MULTI_AGENT': return <Group />;
      default: return <BugReport />;
    }
  };

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
            Governance Violations
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Monitor, investigate, and resolve governance violations across all agents and systems
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => setLoading(true)}
            sx={{ 
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': {
                borderColor: '#718096',
                backgroundColor: '#2d3748'
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportViolations}
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
        </Box>
      </Box>

      {/* Metrics Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white' }}>
                    {metrics.total}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Total Violations
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    Last 30 days
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#6B7280' }}>
                  <Warning />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: '#EF4444' }}>
                    {metrics.critical}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Critical
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    Immediate attention
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
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: '#F59E0B' }}>
                    {metrics.high}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    High
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    Priority review
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
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: '#3B82F6' }}>
                    {metrics.medium}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Medium
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    Standard review
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
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: '#10B981' }}>
                    {metrics.resolved}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Resolved
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    Successfully fixed
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
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: '#EF4444' }}>
                    {metrics.open}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    Needs attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: metrics.trend === 'down' ? '#10B981' : '#EF4444' }}>
                  {metrics.trend === 'down' ? <TrendingDown /> : <TrendingUp />}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
            <Typography variant="h6" sx={{ color: 'white' }}>
              Filter by:
            </Typography>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Severity</InputLabel>
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
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
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="investigating">Investigating</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="false_positive">False Positive</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Source</InputLabel>
              <Select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
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
                <MenuItem value="all">All Sources</MenuItem>
                <MenuItem value="PRISM">PRISM</MenuItem>
                <MenuItem value="VIGIL">VIGIL</MenuItem>
                <MenuItem value="GOVERNANCE">Governance</MenuItem>
                <MenuItem value="MULTI_AGENT">Multi-Agent</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Last 7 Days</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
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
                <MenuItem value="1">Last 24 Hours</MenuItem>
                <MenuItem value="7">Last 7 Days</MenuItem>
                <MenuItem value="30">Last 30 Days</MenuItem>
                <MenuItem value="90">Last 90 Days</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              sx={{ 
                borderColor: '#4a5568',
                color: '#a0aec0',
                '&:hover': {
                  borderColor: '#718096',
                  backgroundColor: '#1a202c'
                }
              }}
            >
              Clear All
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <CardHeader 
          title={
            <Typography variant="h6" sx={{ color: 'white' }}>
              Violations ({filteredViolations.length})
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Showing {Math.min(5, filteredViolations.length)} of {filteredViolations.length} violations
            </Typography>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c', border: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Source</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Agent</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Type</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Severity</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Impact</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Created</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredViolations.slice(0, 5).map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip
                        icon={getSourceIcon(violation.source)}
                        label={violation.source}
                        size="small"
                        sx={{
                          backgroundColor: '#4a5568',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: '#3182ce' }}>
                          {violation.agent_type === 'multi' ? <Group /> : <Person />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {violation.agent_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            {violation.agent_type === 'multi' ? 'Multi-Agent' : 'Single Agent'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {violation.type}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip
                        label={violation.severity.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(violation.severity),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip
                        label={violation.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(violation.status),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {violation.impact}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={violation.impact}
                          sx={{ 
                            width: 60, 
                            height: 6,
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: violation.impact > 70 ? '#EF4444' : 
                                             violation.impact > 40 ? '#F59E0B' : '#10B981'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>
                      {new Date(violation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <IconButton 
                        size="small"
                        sx={{ color: '#3182ce' }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ color: '#F59E0B' }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ color: '#EF4444' }}
                        onClick={() => handleDeleteViolation(violation.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination 
              count={Math.ceil(filteredViolations.length / 5)} 
              page={page} 
              onChange={(e, newPage) => setPage(newPage)}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#a0aec0',
                  '&.Mui-selected': {
                    backgroundColor: '#3182ce',
                    color: 'white'
                  }
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GovernanceViolationsPage;

