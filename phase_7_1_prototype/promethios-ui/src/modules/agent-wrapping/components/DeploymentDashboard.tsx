import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  CloudUpload as DeployIcon,
  Download as ExportIcon,
  Visibility as ViewIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Settings as ConfigIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayArrow as StartIcon,
  Assessment as MetricsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { DeploymentService, DeploymentTarget, DeploymentPackage, DeploymentResult, ExportOptions } from '../services/DeploymentService';
import { DualAgentWrapperRegistry } from '../services/DualAgentWrapperRegistry';
import { EnhancedMultiAgentSystemRegistry } from '../services/EnhancedMultiAgentSystemRegistry';

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
      id={`deployment-tabpanel-${index}`}
      aria-labelledby={`deployment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DeploymentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Services
  const [deploymentService] = useState(() => new DeploymentService());
  const [dualWrapperRegistry] = useState(() => new DualAgentWrapperRegistry());
  const [multiAgentRegistry] = useState(() => new EnhancedMultiAgentSystemRegistry());
  
  // State
  const [deployments, setDeployments] = useState<DeploymentResult[]>([]);
  const [packages, setPackages] = useState<DeploymentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentResult | null>(null);
  
  // Dialog states
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Form states
  const [deploymentTarget, setDeploymentTarget] = useState<DeploymentTarget>({
    type: 'docker',
    environment: 'development',
    platform: 'local',
    configuration: {},
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeSecrets: false,
    includeGovernance: true,
    includeDocumentation: true,
    compressionLevel: 'fast',
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      loadDeployments();
    }
  }, [currentUser]);

  const loadDeployments = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDeployments = await deploymentService.listDeployments(currentUser.uid);
      setDeployments(userDeployments);
    } catch (error) {
      console.error('Error loading deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!selectedPackageId) return;
    
    try {
      const result = await deploymentService.deployPackage(selectedPackageId, deploymentTarget);
      setDeployments(prev => [...prev, result]);
      setShowDeployDialog(false);
      setSelectedPackageId('');
    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed. Please try again.');
    }
  };

  const handleExport = async () => {
    if (!selectedPackageId) return;
    
    try {
      const blob = await deploymentService.exportDeploymentPackage(selectedPackageId, exportOptions);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deployment-package-${selectedPackageId}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowExportDialog(false);
      setSelectedPackageId('');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleStopDeployment = async (deploymentId: string) => {
    try {
      await deploymentService.stopDeployment(deploymentId);
      await loadDeployments();
    } catch (error) {
      console.error('Failed to stop deployment:', error);
      alert('Failed to stop deployment. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed': return <SuccessIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'pending':
      case 'deploying': return <PendingIcon color="warning" />;
      case 'stopped': return <StopIcon color="disabled" />;
      default: return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'success';
      case 'failed': return 'error';
      case 'pending':
      case 'deploying': return 'warning';
      case 'stopped': return 'default';
      default: return 'default';
    }
  };

  const renderDeploymentsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Active Deployments</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDeployments}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DeployIcon />}
            onClick={() => setShowDeployDialog(true)}
          >
            New Deployment
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : deployments.length === 0 ? (
        <Alert severity="info">
          No deployments found. Create your first deployment to get started.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Environment</TableCell>
                <TableCell>Endpoint</TableCell>
                <TableCell>Deployed</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deployments.map((deployment) => (
                <TableRow key={deployment.deploymentId}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getStatusIcon(deployment.status)}
                      <Chip 
                        label={deployment.status} 
                        color={getStatusColor(deployment.status) as any}
                        size="small"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {deployment.deploymentId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Agent" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>Production</TableCell>
                  <TableCell>
                    {deployment.endpoint ? (
                      <Button
                        size="small"
                        href={deployment.endpoint}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {deployment.endpoint}
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDeployment(deployment);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Metrics">
                        <IconButton size="small">
                          <MetricsIcon />
                        </IconButton>
                      </Tooltip>
                      {deployment.status === 'deployed' && (
                        <Tooltip title="Stop Deployment">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleStopDeployment(deployment.deploymentId)}
                          >
                            <StopIcon />
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
      )}
    </Box>
  );

  const renderPackagesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Deployment Packages</Typography>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={() => setShowExportDialog(true)}
        >
          Export Package
        </Button>
      </Box>

      <Grid container spacing={3}>
        {packages.map((pkg) => (
          <Grid item xs={12} md={6} lg={4} key={pkg.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" noWrap>
                    {pkg.name}
                  </Typography>
                  <Chip 
                    label={pkg.type} 
                    size="small" 
                    color={pkg.type === 'multi-agent' ? 'secondary' : 'primary'}
                  />
                </Stack>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {pkg.metadata.description}
                </Typography>
                
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip label={`v${pkg.version}`} size="small" variant="outlined" />
                  <Chip label={pkg.metadata.targetEnvironment} size="small" variant="outlined" />
                </Stack>
                
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(pkg.metadata.createdAt).toLocaleDateString()}
                </Typography>
                
                <Stack direction="row" spacing={1} mt={2}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DeployIcon />}
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      setShowDeployDialog(true);
                    }}
                  >
                    Deploy
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      setShowExportDialog(true);
                    }}
                  >
                    Export
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Deployment Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage deployments and exports for your governed agents and multi-agent systems
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Deployments" />
          <Tab label="Packages" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderDeploymentsTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderPackagesTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Deployment Settings
        </Typography>
        <Alert severity="info">
          Deployment settings configuration coming soon.
        </Alert>
      </TabPanel>

      {/* Deploy Dialog */}
      <Dialog open={showDeployDialog} onClose={() => setShowDeployDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Deploy Package</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Package</InputLabel>
                <Select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                >
                  {packages.map((pkg) => (
                    <MenuItem key={pkg.id} value={pkg.id}>
                      {pkg.name} (v{pkg.version})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Deployment Type</InputLabel>
                <Select
                  value={deploymentTarget.type}
                  onChange={(e) => setDeploymentTarget(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="docker">Docker Container</MenuItem>
                  <MenuItem value="kubernetes">Kubernetes</MenuItem>
                  <MenuItem value="serverless">Serverless</MenuItem>
                  <MenuItem value="api">API Service</MenuItem>
                  <MenuItem value="standalone">Standalone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={deploymentTarget.environment}
                  onChange={(e) => setDeploymentTarget(prev => ({ ...prev, environment: e.target.value as any }))}
                >
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={deploymentTarget.platform}
                  onChange={(e) => setDeploymentTarget(prev => ({ ...prev, platform: e.target.value as any }))}
                >
                  <MenuItem value="aws">AWS</MenuItem>
                  <MenuItem value="gcp">Google Cloud</MenuItem>
                  <MenuItem value="azure">Azure</MenuItem>
                  <MenuItem value="local">Local</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeployDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleDeploy}
            disabled={!selectedPackageId}
            startIcon={<DeployIcon />}
          >
            Deploy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export Package</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Package</InputLabel>
                <Select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                >
                  {packages.map((pkg) => (
                    <MenuItem key={pkg.id} value={pkg.id}>
                      {pkg.name} (v{pkg.version})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                >
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="yaml">YAML</MenuItem>
                  <MenuItem value="docker">Docker</MenuItem>
                  <MenuItem value="kubernetes">Kubernetes</MenuItem>
                  <MenuItem value="zip">ZIP Archive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Compression</InputLabel>
                <Select
                  value={exportOptions.compressionLevel}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, compressionLevel: e.target.value as any }))}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="fast">Fast</MenuItem>
                  <MenuItem value="best">Best</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Export Options</Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeSecrets}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeSecrets: e.target.checked }))}
                    />
                  }
                  label="Include Secrets"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeGovernance}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeGovernance: e.target.checked }))}
                    />
                  }
                  label="Include Governance Configuration"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeDocumentation}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeDocumentation: e.target.checked }))}
                    />
                  }
                  label="Include Documentation"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleExport}
            disabled={!selectedPackageId}
            startIcon={<ExportIcon />}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Deployment Details</DialogTitle>
        <DialogContent>
          {selectedDeployment && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Deployment Information</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>ID:</strong> {selectedDeployment.deploymentId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> 
                    <Chip 
                      label={selectedDeployment.status} 
                      color={getStatusColor(selectedDeployment.status) as any}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {selectedDeployment.endpoint && (
                    <Typography variant="body2">
                      <strong>Endpoint:</strong> 
                      <Button
                        size="small"
                        href={selectedDeployment.endpoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ ml: 1 }}
                      >
                        {selectedDeployment.endpoint}
                      </Button>
                    </Typography>
                  )}
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Metrics</Typography>
                {selectedDeployment.metrics && (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Deployment Time:</strong> {selectedDeployment.metrics.deploymentTime}ms
                    </Typography>
                    <Typography variant="body2">
                      <strong>Health Status:</strong> {selectedDeployment.metrics.healthStatus}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Resource Usage:</strong> {JSON.stringify(selectedDeployment.metrics.resourceUsage)}
                    </Typography>
                  </Stack>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Deployment Logs</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', maxHeight: 300, overflow: 'auto' }}>
                  {selectedDeployment.logs.map((log, index) => (
                    <Typography key={index} variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
                      {log}
                    </Typography>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeploymentDashboard;

