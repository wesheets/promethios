import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
import { governanceDashboardBackendService } from '../services/governanceDashboardBackendService';
import { trustBackendService } from '../services/trustBackendService';
import { useTrustBoundaries } from '../hooks/useTrustBoundaries';
import { CreateBoundaryWizard } from '../components/CreateBoundaryWizard';
import InfoTooltip from '../components/InfoTooltip';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Security,
  Add,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Info,
  Settings,
  Shield,
  Policy,
  AccountTree,
  Timeline,
  TrendingUp,
  TrendingDown,
  Notifications,
  Block,
  PlayArrow,
  Stop
} from '@mui/icons-material';

interface TrustBoundary {
  boundary_id: string;
  source_instance_id: string;
  target_instance_id: string;
  source_name: string;
  target_name: string;
  trust_level: number;
  boundary_type: 'direct' | 'delegated' | 'transitive' | 'federated';
  status: 'active' | 'revoked' | 'expired' | 'suspended';
  created_at: string;
  expires_at?: string;
  policies: Array<{
    policy_id: string;
    policy_type: 'access' | 'data' | 'operation' | 'resource';
    policy_config: any;
  }>;
  attestations: string[];
  metadata: any;
}

interface TrustThreshold {
  threshold_id: string;
  name: string;
  description: string;
  min_trust_level: number;
  max_trust_level: number;
  agent_types: string[];
  actions: {
    alert: boolean;
    quarantine: boolean;
    disable: boolean;
    retrain: boolean;
  };
  industry_standard: boolean;
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
      id={`boundaries-tabpanel-${index}`}
      aria-labelledby={`boundaries-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TrustBoundariesPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [createBoundaryOpen, setCreateBoundaryOpen] = useState(false);
  const [createThresholdOpen, setCreateThresholdOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Use real backend data with user authentication
  const {
    boundaries,
    thresholds,
    metrics,
    boundariesLoading,
    thresholdsLoading,
    metricsLoading,
    boundariesError,
    thresholdsError,
    metricsError,
    creatingBoundary,
    creatingThreshold,
    operationError,
    createBoundary,
    createThreshold,
    updateBoundary,
    deleteBoundary,
    updateThreshold,
    deleteThreshold,
    refreshAll,
    clearErrors
  } = useTrustBoundaries();

  const loading = boundariesLoading || thresholdsLoading || metricsLoading;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getBoundaryTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return '#3b82f6';
      case 'delegated': return '#10b981';
      case 'transitive': return '#f59e0b';
      case 'federated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'revoked': return 'error';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const getTrustLevelColor = (level: number) => {
    if (level >= 90) return '#10b981';
    if (level >= 80) return '#f59e0b';
    if (level >= 70) return '#f97316';
    return '#ef4444';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Calculate statistics - show N/A when no boundaries exist (agents not deployed)
  const activeBoundaries = boundaries.length > 0 ? boundaries.filter(b => b.status === 'active').length : null;
  const averageTrustLevel = boundaries.length > 0 ? boundaries.reduce((sum, b) => sum + b.trust_level, 0) / boundaries.length : null;
  const boundariesAtRisk = boundaries.length > 0 ? boundaries.filter(b => b.trust_level < 80).length : null;
  const totalPolicies = boundaries.length > 0 ? boundaries.reduce((sum, b) => sum + b.policies.length, 0) : null;

  // Authentication validation
  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <AlertTitle>Authentication Required</AlertTitle>
          Please log in to access trust boundaries management. This page requires user authentication to display user-scoped trust data.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Trust Boundaries
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Error handling
  if (boundariesError || thresholdsError || metricsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Trust Boundaries
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error Loading Trust Boundaries</AlertTitle>
          {boundariesError || thresholdsError || metricsError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          <InfoTooltip
            title="Trust Boundaries"
            description="Security perimeters that define how AI agents can interact with each other based on trust levels, policies, and compliance requirements."
            variant="text"
          >
            Trust Boundaries
          </InfoTooltip>
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
          Configure{' '}
          <InfoTooltip
            title="Trust Thresholds"
            description="Minimum trust levels required for agents to perform specific operations or access certain resources."
            variant="underline"
          >
            trust thresholds
          </InfoTooltip>
          ,{' '}
          <InfoTooltip
            title="Safety Limits"
            description="Automated controls that prevent agents from performing actions when trust levels fall below defined thresholds."
            variant="underline"
          >
            safety limits
          </InfoTooltip>
          , and{' '}
          <InfoTooltip
            title="Boundary Policies"
            description="Rules that govern how agents can share data, execute operations, and collaborate across organizational boundaries."
            variant="underline"
          >
            boundary policies
          </InfoTooltip>
          {' '}for agent interactions
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {activeBoundaries !== null ? activeBoundaries : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active Boundaries
                  </Typography>
                </Box>
                <Shield sx={{ color: '#3b82f6', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {averageTrustLevel !== null ? `${Math.round(averageTrustLevel)}%` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Average Trust Level
                  </Typography>
                </Box>
                <TrendingUp sx={{ color: '#10b981', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {boundariesAtRisk !== null ? boundariesAtRisk : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    At Risk
                  </Typography>
                </Box>
                <Warning sx={{ color: '#f59e0b', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {totalPolicies !== null ? totalPolicies : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active Policies
                  </Typography>
                </Box>
                <Policy sx={{ color: '#8b5cf6', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: '#a0aec0' },
              '& .Mui-selected': { color: 'white' },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
            }}
          >
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Active Boundaries
                <InfoTooltip
                  title="Active Boundaries"
                  description="Currently operational trust relationships between agents, defining how they can interact and share resources."
                />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Threshold Configuration
                <InfoTooltip
                  title="Threshold Configuration"
                  description="Set minimum trust levels required for different types of operations and automated responses when thresholds are breached."
                />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Industry Standards
                <InfoTooltip
                  title="Industry Standards"
                  description="Pre-configured trust boundary templates that comply with industry regulations like HIPAA, SOX, and GDPR."
                />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Policy Mapping
                <InfoTooltip
                  title="Policy Mapping"
                  description="Configure how governance policies from the Governance section map to trust requirements and boundary enforcement."
                />
              </Box>
            } />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Active Boundaries */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Trust Boundary Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateBoundaryOpen(true)}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              CREATE BOUNDARY
            </Button>
          </Box>

          {boundaries.length === 0 ? (
            <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
              <AlertTitle>No Trust Boundaries Configured</AlertTitle>
              Trust boundaries will appear here once agents are deployed and boundaries are created. 
              Click "CREATE BOUNDARY" to set up your first trust relationship between agents.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2d3748' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Source → Target
                        <InfoTooltip
                          title="Source → Target"
                          description="The direction of trust relationship, showing which agent (source) is granting trust to another agent (target)."
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Trust Level
                        <InfoTooltip
                          title="Trust Level"
                          description="Numerical score (0-100%) indicating the level of trust granted. Higher scores allow more permissions and access."
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Type
                        <InfoTooltip
                          title="Boundary Type"
                          description="Direct: Point-to-point trust. Delegated: Trust through intermediary. Transitive: Trust chains. Federated: Cross-organizational trust."
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Status
                        <InfoTooltip
                          title="Status"
                          description="Active: Currently operational. Suspended: Temporarily disabled. Expired: Past expiration date. Revoked: Permanently disabled."
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Policies
                        <InfoTooltip
                          title="Policies"
                          description="Number of governance policies attached to this boundary, controlling specific permissions and restrictions."
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boundaries.map((boundary) => (
                    <TableRow key={boundary.boundary_id} sx={{ '&:hover': { backgroundColor: '#2d3748' } }}>
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32, backgroundColor: '#3b82f6' }}>
                            {boundary.source_name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {boundary.source_name} → {boundary.target_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {boundary.trust_level}%
                          </Typography>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: getTrustLevelColor(boundary.trust_level)
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Chip
                          label={boundary.boundary_type}
                          size="small"
                          sx={{
                            backgroundColor: getBoundaryTypeColor(boundary.boundary_type),
                            color: 'white',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Chip
                          label={boundary.status}
                          size="small"
                          color={getStatusColor(boundary.status) as any}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Typography variant="body2">
                          {boundary.policies.length} policies
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Typography variant="body2">
                          {formatTimestamp(boundary.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Boundary">
                            <IconButton size="small" sx={{ color: '#3b82f6' }}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Configure Policies">
                            <IconButton size="small" sx={{ color: '#10b981' }}>
                              <Settings />
                            </IconButton>
                          </Tooltip>
                          {boundary.status === 'active' ? (
                            <Tooltip title="Suspend Boundary">
                              <IconButton size="small" sx={{ color: '#f59e0b' }}>
                                <Stop />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate Boundary">
                              <IconButton size="small" sx={{ color: '#10b981' }}>
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Threshold Configuration */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Trust Threshold Configuration</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateThresholdOpen(true)}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              Create Threshold
            </Button>
          </Box>

          <Grid container spacing={3}>
            {thresholds.map((threshold) => (
              <Grid item xs={12} md={6} key={threshold.threshold_id}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {threshold.name}
                      </Typography>
                      {threshold.industry_standard && (
                        <Chip
                          label="Industry Standard"
                          color="success"
                          size="small"
                          icon={<CheckCircle />}
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
                      {threshold.description}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                        Trust Level Range: {threshold.min_trust_level}% - {threshold.max_trust_level}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={threshold.min_trust_level}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#4a5568',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getTrustLevelColor(threshold.min_trust_level)
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                        Agent Types:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {threshold.agent_types.map((type, index) => (
                          <Chip
                            key={index}
                            label={type}
                            size="small"
                            variant="outlined"
                            sx={{ color: '#a0aec0', borderColor: '#4a5568' }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                        Automated Actions:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {threshold.actions.alert && (
                          <Chip label="Alert" size="small" color="warning" />
                        )}
                        {threshold.actions.quarantine && (
                          <Chip label="Quarantine" size="small" color="error" />
                        )}
                        {threshold.actions.disable && (
                          <Chip label="Disable" size="small" color="error" />
                        )}
                        {threshold.actions.retrain && (
                          <Chip label="Retrain" size="small" color="info" />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Delete />}
                        sx={{ color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Industry Standards */}
          <Typography variant="h6" gutterBottom>Industry Compliance Standards</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Pre-configured trust boundary templates for industry-specific compliance requirements
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#3b82f6', mb: 2 }}>
                    Financial Services
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    SOX and PCI-DSS compliance requirements for financial data processing
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Minimum Trust: 90%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Actions: Alert, Quarantine, Disable
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small" sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}>
                    Apply Standard
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#10b981', mb: 2 }}>
                    Healthcare
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    HIPAA-compliant trust boundaries for healthcare data processing
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Minimum Trust: 95%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Actions: Alert, Quarantine, Disable
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small" sx={{ color: '#10b981', borderColor: '#10b981' }}>
                    Apply Standard
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2 }}>
                    Government
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    FedRAMP and security clearance requirements for government systems
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Minimum Trust: 98%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Actions: Alert, Quarantine, Disable
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small" sx={{ color: '#f59e0b', borderColor: '#f59e0b' }}>
                    Apply Standard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Policy Mapping */}
          <Typography variant="h6" gutterBottom>Policy → Trust Mapping</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Configure how governance policies map to trust requirements and boundary enforcement
          </Typography>

          <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white', mb: 3 }}>
            <AlertTitle>Policy Integration</AlertTitle>
            Trust boundaries automatically inherit policy requirements from the Governance section. 
            Agents must meet both policy compliance AND trust thresholds to operate within boundaries.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    HIPAA Compliance → Healthcare Trust
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    Agents with HIPAA compliance policies require 95%+ trust scores
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label="HIPAA Policy" color="primary" size="small" />
                    <Typography sx={{ color: '#a0aec0' }}>→</Typography>
                    <Chip label="95% Trust Minimum" color="success" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    SOX Compliance → Financial Trust
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    Financial compliance policies enforce 90%+ trust with audit trails
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label="SOX Policy" color="primary" size="small" />
                    <Typography sx={{ color: '#a0aec0' }}>→</Typography>
                    <Chip label="90% Trust + Audit" color="warning" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Create Boundary Wizard */}
      <CreateBoundaryWizard
        open={createBoundaryOpen}
        onClose={() => setCreateBoundaryOpen(false)}
        onSubmit={createBoundary}
        agents={[]} // Will be loaded by the wizard itself
      />
    </Box>
  );
};

export default TrustBoundariesPage;

