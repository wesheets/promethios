/**
 * Audit Reports Page
 * 
 * Enterprise-grade cryptographic audit reports interface with full-width layout,
 * agent scorecards, and downloadable compliance reports.
 * Matches the design patterns of the Enhanced Governance Violations Page.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../theme/darkTheme';
import { useAuth } from '../../context/AuthContext';
import { useGovernanceDashboard } from '../../hooks/useGovernanceDashboard';
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
  Pagination,
  Badge,
  Stack,
  CircularProgress,
  Breadcrumbs,
  Link,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Security,
  Assessment,
  Download,
  Visibility,
  VerifiedUser,
  Shield,
  CheckCircle,
  Warning,
  Error,
  FilterList,
  Refresh,
  GetApp,
  Timeline,
  TrendingUp,
  Analytics,
  Lock,
  Key,
  Fingerprint,
  AccountTree,
  Storage,
  CloudDownload
} from '@mui/icons-material';

interface Agent {
  agentId: string;
  agentName: string;
  agentType: string;
  status: 'healthy' | 'warning' | 'critical';
  trustScore: number;
  compliance: number;
  violations: number;
  health: number;
  lastActivity: string;
  auditLogCount: number;
  cryptographicIntegrity: 'verified' | 'pending' | 'failed';
  governance: string;
}

interface AuditMetrics {
  totalAgents: number;
  verifiedLogs: number;
  pendingVerification: number;
  failedVerification: number;
  complianceScore: number;
  avgResolutionTime: string;
}

interface FilterState {
  search: string;
  agentType: string;
  governance: string;
  status: string;
  assignee: string;
}

const AuditReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { metrics, loading: dashboardLoading, refreshMetrics } = useGovernanceDashboard();
  
  // State management
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    agentType: 'All Types',
    governance: 'All Governance',
    status: 'All Statuses',
    assignee: 'All Assignees'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedAgentForReport, setSelectedAgentForReport] = useState<Agent | null>(null);
  const [reportType, setReportType] = useState<'compliance' | 'audit' | 'cryptographic'>('compliance');

  // Mock audit metrics (replace with real API call)
  const auditMetrics: AuditMetrics = {
    totalAgents: agents.length,
    verifiedLogs: Math.floor(agents.length * 0.85),
    pendingVerification: Math.floor(agents.length * 0.10),
    failedVerification: Math.floor(agents.length * 0.05),
    complianceScore: 94,
    avgResolutionTime: '2.3h'
  };

  // Load agents from governance dashboard
  useEffect(() => {
    loadAgents();
  }, [currentUser]);

  const loadAgents = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Use the governance dashboard metrics to get agent data
      await refreshMetrics();
      
      // Mock agent data based on governance metrics (replace with real API)
      const mockAgents: Agent[] = [
        {
          agentId: 'agent-001',
          agentName: 'API Key Test Agent',
          agentType: 'Image',
          status: 'healthy',
          trustScore: 85,
          compliance: 92,
          violations: 0,
          health: 98,
          lastActivity: '2 minutes ago',
          auditLogCount: 1247,
          cryptographicIntegrity: 'verified',
          governance: 'Active Lite'
        },
        {
          agentId: 'agent-002', 
          agentName: 'Auth Fix Test Agent',
          agentType: 'Image',
          status: 'healthy',
          trustScore: 78,
          compliance: 88,
          violations: 1,
          health: 94,
          lastActivity: '5 minutes ago',
          auditLogCount: 892,
          cryptographicIntegrity: 'verified',
          governance: 'Not Assigned'
        },
        {
          agentId: 'agent-003',
          agentName: 'Backend Test Agent',
          agentType: 'Image', 
          status: 'healthy',
          trustScore: 91,
          compliance: 96,
          violations: 0,
          health: 99,
          lastActivity: '1 minute ago',
          auditLogCount: 2156,
          cryptographicIntegrity: 'verified',
          governance: 'Not Assigned'
        },
        {
          agentId: 'agent-004',
          agentName: 'Claude Assistant',
          agentType: 'Image',
          status: 'healthy', 
          trustScore: 88,
          compliance: 94,
          violations: 0,
          health: 97,
          lastActivity: '3 minutes ago',
          auditLogCount: 1634,
          cryptographicIntegrity: 'verified',
          governance: 'Age Wrapped'
        },
        {
          agentId: 'agent-005',
          agentName: 'Claude Assistant Test',
          agentType: 'Image',
          status: 'healthy',
          trustScore: 82,
          compliance: 90,
          violations: 0,
          health: 95,
          lastActivity: '7 minutes ago', 
          auditLogCount: 743,
          cryptographicIntegrity: 'verified',
          governance: 'Age Wrapped'
        }
      ];

      setAgents(mockAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
      console.error('Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, refreshMetrics]);

  // Filter agents based on current filters
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.agentName.toLowerCase().includes(filters.search.toLowerCase()) ||
                           agent.agentId.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = filters.agentType === 'All Types' || agent.agentType === filters.agentType;
      const matchesGovernance = filters.governance === 'All Governance' || agent.governance === filters.governance;
      const matchesStatus = filters.status === 'All Statuses' || agent.status === filters.status;
      
      return matchesSearch && matchesType && matchesGovernance && matchesStatus;
    });
  }, [agents, filters]);

  // Pagination
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAgents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAgents, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAgents.length / rowsPerPage);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  // Handle report generation
  const handleGenerateReport = (agent: Agent, type: 'compliance' | 'audit' | 'cryptographic') => {
    setSelectedAgentForReport(agent);
    setReportType(type);
    setReportDialog(true);
  };

  const handleDownloadReport = async () => {
    if (!selectedAgentForReport) return;

    // Mock report generation (replace with real API call)
    const reportData = {
      agentId: selectedAgentForReport.agentId,
      agentName: selectedAgentForReport.agentName,
      reportType,
      generatedAt: new Date().toISOString(),
      cryptographicProof: 'SHA256:' + Math.random().toString(36).substring(2, 15),
      auditTrail: `${selectedAgentForReport.auditLogCount} verified entries`,
      complianceScore: selectedAgentForReport.compliance
    };

    // Create and download mock report
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAgentForReport.agentName}_${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setReportDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getIntegrityColor = (integrity: string) => {
    switch (integrity) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#0f1419',
        color: 'white',
        p: 3
      }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            <Link color="inherit" href="/ui/governance">Governance</Link>
            <Typography color="white">Audit Reports</Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Cryptographic Audit Reports
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            Enterprise-grade audit trails with mathematical proof and compliance reporting
          </Typography>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadAgents}
              disabled={loading}
            >
              Auto Refresh List
            </Button>
            <Button variant="outlined" startIcon={<Analytics />}>
              Analytics
            </Button>
            <Button variant="outlined" startIcon={<GetApp />}>
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<CloudDownload />} color="primary">
              Export JSON
            </Button>
          </Stack>
        </Box>

        {/* Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#3182ce', fontWeight: 'bold' }}>
                  {auditMetrics.totalAgents}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Agents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#38a169', fontWeight: 'bold' }}>
                  {auditMetrics.verifiedLogs}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Verified Logs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#d69e2e', fontWeight: 'bold' }}>
                  {auditMetrics.pendingVerification}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#e53e3e', fontWeight: 'bold' }}>
                  {auditMetrics.failedVerification}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Failed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#38a169', fontWeight: 'bold' }}>
                  {auditMetrics.complianceScore}%
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Compliance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#3182ce', fontWeight: 'bold' }}>
                  {auditMetrics.avgResolutionTime}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Avg Resolution
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              Advanced Filters & Search
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search agents..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      backgroundColor: '#2d3748',
                      '& fieldset': { borderColor: '#4a5568' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Agent Type</InputLabel>
                  <Select
                    value={filters.agentType}
                    onChange={(e) => handleFilterChange('agentType', e.target.value)}
                    sx={{ backgroundColor: '#2d3748' }}
                  >
                    <MenuItem value="All Types">All Types</MenuItem>
                    <MenuItem value="Image">Image</MenuItem>
                    <MenuItem value="Text">Text</MenuItem>
                    <MenuItem value="Multi-Agent">Multi-Agent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Governance</InputLabel>
                  <Select
                    value={filters.governance}
                    onChange={(e) => handleFilterChange('governance', e.target.value)}
                    sx={{ backgroundColor: '#2d3748' }}
                  >
                    <MenuItem value="All Governance">All Governance</MenuItem>
                    <MenuItem value="Active Lite">Active Lite</MenuItem>
                    <MenuItem value="Age Wrapped">Age Wrapped</MenuItem>
                    <MenuItem value="Not Assigned">Not Assigned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    sx={{ backgroundColor: '#2d3748' }}
                  >
                    <MenuItem value="All Statuses">All Statuses</MenuItem>
                    <MenuItem value="healthy">Healthy</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Agent Scorecards Table */}
        <Card sx={{ backgroundColor: '#1e2328', border: '1px solid #2d3748' }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Agent Audit Scorecards ({filteredAgents.length})
              </Typography>
            }
            action={
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<Refresh />} onClick={loadAgents}>
                  Refresh
                </Button>
                <Button size="small" startIcon={<Download />}>
                  Export All
                </Button>
              </Stack>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2d3748' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Agent</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trust Score</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Compliance</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Violations</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Health</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Governance</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedAgents.map((agent) => (
                    <TableRow 
                      key={agent.agentId}
                      sx={{ 
                        '&:hover': { backgroundColor: '#2d3748' },
                        borderBottom: '1px solid #4a5568'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Security sx={{ mr: 1, color: '#3182ce' }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                              {agent.agentName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {agent.agentId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${agent.trustScore}%`}
                          color={agent.trustScore >= 80 ? 'success' : agent.trustScore >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${agent.compliance}%`}
                          color={agent.compliance >= 90 ? 'success' : agent.compliance >= 70 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={agent.violations}
                          color={agent.violations === 0 ? 'success' : agent.violations <= 2 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${agent.health}%`}
                          color={agent.health >= 95 ? 'success' : agent.health >= 80 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={agent.status}
                          color={getStatusColor(agent.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={agent.agentType} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={agent.governance}
                          color={agent.governance !== 'Not Assigned' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Compliance Report">
                            <IconButton 
                              size="small" 
                              onClick={() => handleGenerateReport(agent, 'compliance')}
                              sx={{ color: '#38a169' }}
                            >
                              <Assessment />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Audit Trail">
                            <IconButton 
                              size="small"
                              onClick={() => handleGenerateReport(agent, 'audit')}
                              sx={{ color: '#3182ce' }}
                            >
                              <Timeline />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cryptographic Proof">
                            <IconButton 
                              size="small"
                              onClick={() => handleGenerateReport(agent, 'cryptographic')}
                              sx={{ color: '#d69e2e' }}
                            >
                              <Lock />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Showing {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small">
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    sx={{ backgroundColor: '#2d3748', minWidth: 80 }}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: 'white',
                      '&.Mui-selected': {
                        backgroundColor: '#3182ce'
                      }
                    }
                  }}
                />
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Report Generation Dialog */}
        <Dialog 
          open={reportDialog} 
          onClose={() => setReportDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { backgroundColor: '#1e2328', color: 'white' }
          }}
        >
          <DialogTitle>
            Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
          </DialogTitle>
          <DialogContent>
            {selectedAgentForReport && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Agent: <strong>{selectedAgentForReport.agentName}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                  This will generate a cryptographically signed {reportType} report with mathematical proof of authenticity.
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Report will include {selectedAgentForReport.auditLogCount} verified audit entries with SHA-256 hash chain verification.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleDownloadReport} 
              variant="contained" 
              startIcon={<Download />}
            >
              Generate & Download
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AuditReportsPage;

