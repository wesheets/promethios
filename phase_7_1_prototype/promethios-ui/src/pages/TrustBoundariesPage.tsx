import React, { useState, useEffect } from 'react';
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
  const [tabValue, setTabValue] = useState(0);
  const [boundaries, setBoundaries] = useState<TrustBoundary[]>([]);
  const [thresholds, setThresholds] = useState<TrustThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [createBoundaryOpen, setCreateBoundaryOpen] = useState(false);
  const [createThresholdOpen, setCreateThresholdOpen] = useState(false);

  // Mock data based on backend schema
  useEffect(() => {
    setTimeout(() => {
      setBoundaries([
        {
          boundary_id: 'tb-001',
          source_instance_id: 'instance-001',
          target_instance_id: 'instance-002',
          source_name: 'Financial Analysis Agent',
          target_name: 'Data Processing System',
          trust_level: 85,
          boundary_type: 'direct',
          status: 'active',
          created_at: '2025-06-15T10:30:00Z',
          expires_at: '2026-06-15T10:30:00Z',
          policies: [
            {
              policy_id: 'pol-001',
              policy_type: 'access',
              policy_config: { allowed_operations: ['read', 'analyze'] }
            }
          ],
          attestations: ['att-001', 'att-002'],
          metadata: {}
        },
        {
          boundary_id: 'tb-002',
          source_instance_id: 'instance-003',
          target_instance_id: 'instance-004',
          source_name: 'Legal Compliance Bot',
          target_name: 'Document Management',
          trust_level: 95,
          boundary_type: 'federated',
          status: 'active',
          created_at: '2025-06-10T14:20:00Z',
          policies: [
            {
              policy_id: 'pol-002',
              policy_type: 'data',
              policy_config: { encryption_required: true, audit_trail: true }
            }
          ],
          attestations: ['att-003', 'att-004', 'att-005'],
          metadata: {}
        },
        {
          boundary_id: 'tb-003',
          source_instance_id: 'instance-005',
          target_instance_id: 'instance-006',
          source_name: 'Customer Support System',
          target_name: 'CRM Integration',
          trust_level: 72,
          boundary_type: 'transitive',
          status: 'suspended',
          created_at: '2025-06-05T09:15:00Z',
          policies: [],
          attestations: ['att-006'],
          metadata: { suspension_reason: 'Trust level below threshold' }
        }
      ]);

      setThresholds([
        {
          threshold_id: 'th-001',
          name: 'Financial Operations',
          description: 'Minimum trust requirements for financial data processing',
          min_trust_level: 90,
          max_trust_level: 100,
          agent_types: ['financial_analysis', 'trading_bot', 'risk_assessment'],
          actions: { alert: true, quarantine: false, disable: true, retrain: true },
          industry_standard: true
        },
        {
          threshold_id: 'th-002',
          name: 'Healthcare Compliance',
          description: 'HIPAA-compliant trust boundaries for healthcare agents',
          min_trust_level: 95,
          max_trust_level: 100,
          agent_types: ['medical_diagnosis', 'patient_data', 'healthcare_bot'],
          actions: { alert: true, quarantine: true, disable: true, retrain: false },
          industry_standard: true
        },
        {
          threshold_id: 'th-003',
          name: 'General Operations',
          description: 'Standard trust requirements for general-purpose agents',
          min_trust_level: 75,
          max_trust_level: 100,
          agent_types: ['customer_support', 'data_processing', 'content_generation'],
          actions: { alert: true, quarantine: false, disable: false, retrain: true },
          industry_standard: false
        },
        {
          threshold_id: 'th-004',
          name: 'Development & Testing',
          description: 'Relaxed boundaries for development and testing environments',
          min_trust_level: 60,
          max_trust_level: 100,
          agent_types: ['test_agent', 'development_bot', 'prototype'],
          actions: { alert: true, quarantine: false, disable: false, retrain: false },
          industry_standard: false
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

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

  // Calculate statistics
  const activeBoundaries = boundaries.filter(b => b.status === 'active').length;
  const averageTrustLevel = boundaries.reduce((sum, b) => sum + b.trust_level, 0) / boundaries.length;
  const boundariesAtRisk = boundaries.filter(b => b.trust_level < 80).length;
  const totalPolicies = boundaries.reduce((sum, b) => sum + b.policies.length, 0);

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

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Trust Boundaries
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
          Configure trust thresholds, safety limits, and boundary policies for agent interactions
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Shield sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6">Active Boundaries</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {activeBoundaries}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Out of {boundaries.length} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline sx={{ color: '#10b981', mr: 2 }} />
                <Typography variant="h6">Average Trust Level</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: getTrustLevelColor(averageTrustLevel), fontWeight: 'bold' }}>
                {Math.round(averageTrustLevel)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Across all boundaries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: '#f59e0b', mr: 2 }} />
                <Typography variant="h6">At Risk</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: boundariesAtRisk > 0 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                {boundariesAtRisk}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Below 80% trust threshold
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Policy sx={{ color: '#8b5cf6', mr: 2 }} />
                <Typography variant="h6">Active Policies</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                {totalPolicies}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Enforcement rules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Risk Alert */}
      {boundariesAtRisk > 0 && (
        <Alert severity="warning" sx={{ mb: 4, backgroundColor: '#92400e', color: 'white' }}>
          <AlertTitle>Boundary Risk Alert</AlertTitle>
          {boundariesAtRisk} trust boundar{boundariesAtRisk > 1 ? 'ies' : 'y'} currently below recommended thresholds. Review and adjust trust levels or policies.
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
              '& .MuiTab-root': { 
                color: '#a0aec0',
                '&.Mui-selected': { color: '#3b82f6' }
              }
            }}
          >
            <Tab label="Trust Boundaries" />
            <Tab label="Threshold Configuration" />
            <Tab label="Industry Standards" />
            <Tab label="Policy Mapping" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Trust Boundaries Management */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Trust Boundary Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateBoundaryOpen(true)}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              Create Boundary
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Source → Target</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trust Level</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Boundary Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Policies</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Attestations</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boundaries.map((boundary) => (
                  <TableRow key={boundary.boundary_id} sx={{ '&:hover': { backgroundColor: '#2d3748' } }}>
                    <TableCell sx={{ color: 'white' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {boundary.source_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                          <AccountTree sx={{ color: '#a0aec0', fontSize: 16 }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          {boundary.target_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: getTrustLevelColor(boundary.trust_level), fontWeight: 'bold', mr: 2 }}>
                          {boundary.trust_level}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={boundary.trust_level}
                          sx={{
                            width: 80,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getTrustLevelColor(boundary.trust_level)
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Chip
                        label={boundary.boundary_type.toUpperCase()}
                        sx={{
                          backgroundColor: getBoundaryTypeColor(boundary.boundary_type),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Chip
                        label={boundary.status.toUpperCase()}
                        color={getStatusColor(boundary.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2">
                        {boundary.policies.length} active
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2">
                        {boundary.attestations.length} linked
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
                        {threshold.agent_types.map((type) => (
                          <Chip
                            key={type}
                            label={type.replace('_', ' ')}
                            size="small"
                            sx={{ backgroundColor: '#4a5568', color: 'white' }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                        Threshold Actions:
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={<Switch checked={threshold.actions.alert} size="small" />}
                            label="Alert"
                            sx={{ color: '#a0aec0' }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={<Switch checked={threshold.actions.quarantine} size="small" />}
                            label="Quarantine"
                            sx={{ color: '#a0aec0' }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={<Switch checked={threshold.actions.disable} size="small" />}
                            label="Disable"
                            sx={{ color: '#a0aec0' }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={<Switch checked={threshold.actions.retrain} size="small" />}
                            label="Retrain"
                            sx={{ color: '#a0aec0' }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton size="small" sx={{ color: '#3b82f6' }}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#ef4444' }}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Industry Standards */}
          <Typography variant="h6" gutterBottom>Industry Standard Trust Boundaries</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Pre-configured trust thresholds based on industry best practices and regulatory requirements
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#3b82f6', mb: 2 }}>
                    Financial Services
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    SOX, PCI-DSS compliant trust boundaries for financial operations
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Minimum Trust: 90%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Actions: Alert, Disable, Retrain
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
    </Box>
  );
};

export default TrustBoundariesPage;

