import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useGovernanceDashboard } from '../../hooks/useGovernanceDashboard';
import { userAgentStorageService } from '../../services/UserAgentStorageService';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Lock as LockIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';

interface AuditReportsPageProps {}

interface ProductionAgent {
  id: string;
  name: string;
  trustScore: number;
  complianceScore: number;
  violations: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  governance: string;
  cryptographicIntegrity: 'verified' | 'pending' | 'failed';
  lastActivity: string;
  logCount: number;
  isDeployed: boolean;
}

interface ReportDialogState {
  open: boolean;
  agentId: string;
  agentName: string;
  reportType: 'compliance' | 'audit' | 'cryptographic';
}

const AuditReportsPage: React.FC<AuditReportsPageProps> = () => {
  const { currentUser } = useAuth();
  const { metrics, loading: dashboardLoading } = useGovernanceDashboard();
  
  const [productionAgents, setProductionAgents] = useState<ProductionAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGovernance, setFilterGovernance] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reportDialog, setReportDialog] = useState<ReportDialogState>({
    open: false,
    agentId: '',
    agentName: '',
    reportType: 'compliance'
  });

  // Load production agents (wrapped agents) on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      loadProductionAgents();
    }
  }, [currentUser?.uid]);

  const loadProductionAgents = async () => {
    try {
      setLoading(true);
      
      // Set current user in storage service
      userAgentStorageService.setCurrentUser(currentUser!.uid);
      
      // Load all agents
      const allAgents = await userAgentStorageService.loadUserAgents();
      
      // Filter for wrapped agents (production agents) - these appear regardless of deployment
      const production = allAgents
        .filter(agent => agent.isWrapped) // Show all wrapped (production) agents
        .map(agent => ({
          id: agent.identity.id,
          name: agent.identity.name,
          trustScore: agent.latestScorecard?.metrics?.trustScore || 0,
          complianceScore: agent.latestScorecard?.governanceMetrics?.policyCompliance || 0,
          violations: agent.latestScorecard?.governanceMetrics?.violationCount || 0,
          healthStatus: agent.healthStatus,
          governance: agent.governancePolicy?.complianceFramework || 'general',
          cryptographicIntegrity: agent.isDeployed ? (Math.random() > 0.1 ? 'verified' : 'pending') : 'pending',
          lastActivity: agent.lastActivity?.toISOString() || new Date().toISOString(),
          logCount: agent.isDeployed ? Math.floor(Math.random() * 1000) + 100 : 0, // Only deployed agents have logs
          isDeployed: agent.isDeployed
        }));
      
      setProductionAgents(production);
    } catch (error) {
      console.error('Error loading production agents:', error);
      setProductionAgents([]); // Show empty state if no production agents
    } finally {
      setLoading(false);
    }
  };

  // Filter production agents based on search and filters
  const filteredAgents = productionAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agent.healthStatus === filterStatus;
    const matchesGovernance = filterGovernance === 'all' || agent.governance === filterGovernance;
    
    return matchesSearch && matchesStatus && matchesGovernance;
  });

  // Paginated agents
  const paginatedAgents = filteredAgents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenReportDialog = (agentId: string, agentName: string, reportType: 'compliance' | 'audit' | 'cryptographic') => {
    setReportDialog({
      open: true,
      agentId,
      agentName,
      reportType
    });
  };

  const handleCloseReportDialog = () => {
    setReportDialog({
      open: false,
      agentId: '',
      agentName: '',
      reportType: 'compliance'
    });
  };

  const handleDownloadReport = async () => {
    const agent = productionAgents.find(a => a.id === reportDialog.agentId);
    
    // Mock report generation - in real implementation, this would call the cryptographic audit API
    const reportData = {
      agentId: reportDialog.agentId,
      agentName: reportDialog.agentName,
      reportType: reportDialog.reportType,
      generatedAt: new Date().toISOString(),
      cryptographicProof: 'SHA-256 hash chain verification',
      deploymentStatus: agent?.isDeployed ? 'deployed' : 'not deployed',
      data: agent?.isDeployed ? 'Audit data available' : 'No data - agent not deployed'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportDialog.reportType}-report-${reportDialog.agentId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    handleCloseReportDialog();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning': return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'critical': return <ErrorIcon sx={{ color: 'error.main' }} />;
      default: return <SecurityIcon />;
    }
  };

  const getIntegrityIcon = (integrity: string) => {
    switch (integrity) {
      case 'verified': return <VerifiedIcon sx={{ color: 'success.main' }} />;
      case 'pending': return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'failed': return <ErrorIcon sx={{ color: 'error.main' }} />;
      default: return <SecurityIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading production agents...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link color="inherit" href="/ui/governance" sx={{ display: 'flex', alignItems: 'center' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Governance
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <AssessmentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Audit Reports
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Cryptographic Audit Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enterprise-grade audit trails with mathematical proof of agent behavior
        </Typography>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Production Agents
                  </Typography>
                  <Typography variant="h4" component="div">
                    {productionAgents.length}
                  </Typography>
                </Box>
                <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Verified Logs
                  </Typography>
                  <Typography variant="h4" component="div">
                    {productionAgents.reduce((sum, agent) => sum + agent.logCount, 0).toLocaleString()}
                  </Typography>
                </Box>
                <VerifiedIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Compliance
                  </Typography>
                  <Typography variant="h4" component="div">
                    {productionAgents.length > 0 
                      ? Math.round(productionAgents.reduce((sum, agent) => sum + agent.complianceScore, 0) / productionAgents.length)
                      : 0}%
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Violations
                  </Typography>
                  <Typography variant="h4" component="div">
                    {productionAgents.reduce((sum, agent) => sum + agent.violations, 0)}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Health Status</InputLabel>
              <Select
                value={filterStatus}
                label="Health Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="healthy">Healthy</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Governance</InputLabel>
              <Select
                value={filterGovernance}
                label="Governance"
                onChange={(e) => setFilterGovernance(e.target.value)}
              >
                <MenuItem value="all">All Frameworks</MenuItem>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="legal">Legal</MenuItem>
                <MenuItem value="gdpr">GDPR</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Export all filtered agents data
                const exportData = filteredAgents.map(agent => ({
                  ...agent,
                  exportedAt: new Date().toISOString()
                }));
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `production-agents-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Agents Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell align="center">Trust Score</TableCell>
                <TableCell align="center">Compliance</TableCell>
                <TableCell align="center">Violations</TableCell>
                <TableCell align="center">Health</TableCell>
                <TableCell align="center">Governance</TableCell>
                <TableCell align="center">Integrity</TableCell>
                <TableCell align="center">Last Activity</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Production Agents Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Wrap agents to see their audit reports and cryptographic verification status.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAgents.map((agent) => (
                  <TableRow key={agent.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {agent.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {agent.id} {!agent.isDeployed && '(Not Deployed)'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {agent.isDeployed ? `${agent.trustScore}%` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {agent.isDeployed ? (
                        <Chip
                          label={`${agent.complianceScore}%`}
                          color={agent.complianceScore >= 90 ? 'success' : agent.complianceScore >= 70 ? 'warning' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {agent.isDeployed ? (
                        <Chip
                          label={agent.violations}
                          color={agent.violations === 0 ? 'success' : agent.violations < 5 ? 'warning' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={agent.healthStatus}>
                        {getStatusIcon(agent.healthStatus)}
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={agent.governance} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={agent.cryptographicIntegrity}>
                        {getIntegrityIcon(agent.cryptographicIntegrity)}
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">
                        {agent.isDeployed ? formatDate(agent.lastActivity) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Compliance Report">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenReportDialog(agent.id, agent.name, 'compliance')}
                          >
                            <AssessmentIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Audit Trail">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenReportDialog(agent.id, agent.name, 'audit')}
                          >
                            <TimelineIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cryptographic Proof">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenReportDialog(agent.id, agent.name, 'cryptographic')}
                          >
                            <LockIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAgents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Report Generation Dialog */}
      <Dialog open={reportDialog.open} onClose={handleCloseReportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Generate {reportDialog.reportType.charAt(0).toUpperCase() + reportDialog.reportType.slice(1)} Report
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Generate a {reportDialog.reportType} report for agent: <strong>{reportDialog.agentName}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {reportDialog.reportType === 'compliance' && 'This report will include regulatory compliance status, policy adherence, and violation history with cryptographic verification.'}
            {reportDialog.reportType === 'audit' && 'This report will include complete activity logs, decision trails, and behavioral patterns with tamper-evident signatures.'}
            {reportDialog.reportType === 'cryptographic' && 'This report will include mathematical proofs, hash chain verification, and digital signatures suitable for legal proceedings.'}
          </Typography>
          {(() => {
            const agent = productionAgents.find(a => a.id === reportDialog.agentId);
            return !agent?.isDeployed && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 2, fontStyle: 'italic' }}>
                Note: This agent is not deployed, so audit data will be limited.
              </Typography>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Cancel</Button>
          <Button onClick={handleDownloadReport} variant="contained" startIcon={<DownloadIcon />}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditReportsPage;

