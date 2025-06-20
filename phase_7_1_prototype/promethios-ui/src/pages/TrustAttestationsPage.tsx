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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/material';
import {
  Verified,
  Add,
  Search,
  FilterList,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Info,
  Security,
  Psychology,
  Speed,
  Gavel,
  Assignment,
  Timeline as TimelineIcon,
  TrendingUp,
  Download,
  Share,
  Visibility,
  VerifiedUser,
  Certificate,
  AccountTree,
  History
} from '@mui/icons-material';

interface Attestation {
  attestation_id: string;
  attestation_type: 'identity' | 'capability' | 'integrity' | 'compliance' | 'behavior';
  subject_instance_id: string;
  subject_name: string;
  attester_instance_id: string;
  attester_name: string;
  attestation_data: any;
  parent_attestation_id?: string;
  created_at: string;
  expires_at?: string;
  status: 'active' | 'revoked' | 'expired';
  signature: string;
  verification_history: Array<{
    timestamp: string;
    verification_status: 'valid' | 'invalid' | 'expired' | 'revoked';
    verifier_instance_id: string;
  }>;
  metadata: any;
  confidence_score: number;
  trust_impact: number;
}

interface AttestationChain {
  chain_id: string;
  root_attestation_id: string;
  attestations: Attestation[];
  chain_length: number;
  overall_confidence: number;
  chain_status: 'valid' | 'broken' | 'expired';
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
      id={`attestations-tabpanel-${index}`}
      aria-labelledby={`attestations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TrustAttestationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [attestationChains, setAttestationChains] = useState<AttestationChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data based on backend schema
  useEffect(() => {
    setTimeout(() => {
      setAttestations([
        {
          attestation_id: 'att-001',
          attestation_type: 'compliance',
          subject_instance_id: 'agent-001',
          subject_name: 'Financial Analysis Agent',
          attester_instance_id: 'authority-001',
          attester_name: 'SOX Compliance Authority',
          attestation_data: {
            compliance_level: 'strict',
            audit_trail: true,
            data_encryption: true,
            access_controls: 'role_based'
          },
          created_at: '2025-06-20T10:30:00Z',
          expires_at: '2026-06-20T10:30:00Z',
          status: 'active',
          signature: '0x1a2b3c4d5e6f...',
          verification_history: [
            {
              timestamp: '2025-06-20T10:35:00Z',
              verification_status: 'valid',
              verifier_instance_id: 'verifier-001'
            }
          ],
          metadata: { audit_id: 'AUD-2025-001' },
          confidence_score: 0.95,
          trust_impact: 0.12
        },
        {
          attestation_id: 'att-002',
          attestation_type: 'capability',
          subject_instance_id: 'agent-002',
          subject_name: 'Legal Compliance Bot',
          attester_instance_id: 'authority-002',
          attester_name: 'Legal Verification Service',
          attestation_data: {
            capabilities: ['contract_analysis', 'regulatory_compliance', 'risk_assessment'],
            accuracy_score: 0.98,
            domain_expertise: 'corporate_law'
          },
          created_at: '2025-06-19T14:20:00Z',
          expires_at: '2025-12-19T14:20:00Z',
          status: 'active',
          signature: '0x2b3c4d5e6f7a...',
          verification_history: [
            {
              timestamp: '2025-06-19T14:25:00Z',
              verification_status: 'valid',
              verifier_instance_id: 'verifier-002'
            },
            {
              timestamp: '2025-06-20T09:15:00Z',
              verification_status: 'valid',
              verifier_instance_id: 'verifier-001'
            }
          ],
          metadata: { certification_body: 'Legal Tech Consortium' },
          confidence_score: 0.92,
          trust_impact: 0.08
        },
        {
          attestation_id: 'att-003',
          attestation_type: 'behavior',
          subject_instance_id: 'agent-003',
          subject_name: 'Customer Support System',
          attester_instance_id: 'monitor-001',
          attester_name: 'Behavioral Monitoring Service',
          attestation_data: {
            behavior_pattern: 'consistent',
            response_quality: 0.89,
            escalation_rate: 0.05,
            customer_satisfaction: 0.94
          },
          created_at: '2025-06-18T16:45:00Z',
          status: 'active',
          signature: '0x3c4d5e6f7a8b...',
          verification_history: [
            {
              timestamp: '2025-06-18T16:50:00Z',
              verification_status: 'valid',
              verifier_instance_id: 'verifier-003'
            }
          ],
          metadata: { monitoring_period: '30_days' },
          confidence_score: 0.87,
          trust_impact: 0.06
        },
        {
          attestation_id: 'att-004',
          attestation_type: 'integrity',
          subject_instance_id: 'agent-004',
          subject_name: 'Data Processing Agent',
          attester_instance_id: 'integrity-service',
          attester_name: 'Data Integrity Verification',
          attestation_data: {
            data_consistency: 0.96,
            error_rate: 0.02,
            processing_accuracy: 0.94,
            audit_compliance: true
          },
          created_at: '2025-06-17T11:30:00Z',
          expires_at: '2025-09-17T11:30:00Z',
          status: 'active',
          signature: '0x4d5e6f7a8b9c...',
          verification_history: [
            {
              timestamp: '2025-06-17T11:35:00Z',
              verification_status: 'valid',
              verifier_instance_id: 'verifier-004'
            }
          ],
          metadata: { data_volume: '1.2TB_processed' },
          confidence_score: 0.91,
          trust_impact: 0.09
        },
        {
          attestation_id: 'att-005',
          attestation_type: 'identity',
          subject_instance_id: 'agent-005',
          subject_name: 'Healthcare Assistant',
          attester_instance_id: 'identity-provider',
          attester_name: 'Healthcare Identity Authority',
          attestation_data: {
            identity_verified: true,
            credentials: ['medical_assistant', 'hipaa_certified'],
            background_check: 'passed',
            license_status: 'active'
          },
          parent_attestation_id: 'att-002',
          created_at: '2025-06-16T09:15:00Z',
          expires_at: '2026-06-16T09:15:00Z',
          status: 'active',
          signature: '0x5e6f7a8b9c0d...',
          verification_history: [
            {
              timestamp: '2025-06-16T09:20:00Z',
              verification_status: 'valid',
              verifier_instance_id: 'verifier-005'
            }
          ],
          metadata: { license_number: 'HC-2025-001' },
          confidence_score: 0.96,
          trust_impact: 0.15
        }
      ]);

      setAttestationChains([
        {
          chain_id: 'chain-001',
          root_attestation_id: 'att-002',
          attestations: [], // Would be populated with actual attestation objects
          chain_length: 3,
          overall_confidence: 0.94,
          chain_status: 'valid'
        },
        {
          chain_id: 'chain-002',
          root_attestation_id: 'att-001',
          attestations: [],
          chain_length: 1,
          overall_confidence: 0.95,
          chain_status: 'valid'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getAttestationTypeIcon = (type: string) => {
    switch (type) {
      case 'identity': return <VerifiedUser />;
      case 'capability': return <Psychology />;
      case 'integrity': return <Security />;
      case 'compliance': return <Gavel />;
      case 'behavior': return <Speed />;
      default: return <Certificate />;
    }
  };

  const getAttestationTypeColor = (type: string) => {
    switch (type) {
      case 'identity': return '#3b82f6';
      case 'capability': return '#10b981';
      case 'integrity': return '#8b5cf6';
      case 'compliance': return '#f59e0b';
      case 'behavior': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'revoked': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return '#10b981';
    if (score >= 0.8) return '#f59e0b';
    if (score >= 0.7) return '#f97316';
    return '#ef4444';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredAttestations = attestations.filter(attestation => {
    const matchesSearch = attestation.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attestation.attester_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || attestation.attestation_type === filterType;
    const matchesStatus = filterStatus === 'all' || attestation.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const totalAttestations = attestations.length;
  const activeAttestations = attestations.filter(a => a.status === 'active').length;
  const averageConfidence = attestations.reduce((sum, a) => sum + a.confidence_score, 0) / totalAttestations;
  const totalTrustImpact = attestations.reduce((sum, a) => sum + a.trust_impact, 0);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Trust Attestations
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
          Trust Attestations
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
          Credibility logbook and verification tracking for agent trustworthiness and reputation
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Certificate sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6">Total Attestations</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {totalAttestations}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Verification events logged
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ color: '#10b981', mr: 2 }} />
                <Typography variant="h6">Active Attestations</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                {activeAttestations}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Currently valid
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: '#f59e0b', mr: 2 }} />
                <Typography variant="h6">Average Confidence</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: getConfidenceColor(averageConfidence), fontWeight: 'bold' }}>
                {Math.round(averageConfidence * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Across all attestations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ color: '#8b5cf6', mr: 2 }} />
                <Typography variant="h6">Trust Impact</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                +{Math.round(totalTrustImpact * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Cumulative trust boost
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search attestations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: '#a0aec0', mr: 1 }} />,
                  sx: { color: 'white' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Attestation Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' } }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="identity">Identity</MenuItem>
                  <MenuItem value="capability">Capability</MenuItem>
                  <MenuItem value="integrity">Integrity</MenuItem>
                  <MenuItem value="compliance">Compliance</MenuItem>
                  <MenuItem value="behavior">Behavior</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' } }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="revoked">Revoked</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                fullWidth
                sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
              >
                New Attestation
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
            <Tab label="All Attestations" />
            <Tab label="Attestation Chains" />
            <Tab label="Verification History" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* All Attestations */}
          <Grid container spacing={3}>
            {filteredAttestations.map((attestation) => (
              <Grid item xs={12} lg={6} key={attestation.attestation_id}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          backgroundColor: getAttestationTypeColor(attestation.attestation_type), 
                          mr: 2,
                          width: 40,
                          height: 40
                        }}>
                          {getAttestationTypeIcon(attestation.attestation_type)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {attestation.attestation_type.charAt(0).toUpperCase() + attestation.attestation_type.slice(1)} Attestation
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {attestation.attestation_id}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={attestation.status.toUpperCase()}
                        color={getStatusColor(attestation.status) as any}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ borderColor: '#4a5568', my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Subject: <span style={{ color: 'white', fontWeight: 'bold' }}>{attestation.subject_name}</span>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Attester: <span style={{ color: 'white', fontWeight: 'bold' }}>{attestation.attester_name}</span>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Created: <span style={{ color: 'white' }}>{formatTimestamp(attestation.created_at)}</span>
                      </Typography>
                      {attestation.expires_at && (
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Expires: <span style={{ color: 'white' }}>{formatTimestamp(attestation.expires_at)}</span>
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Confidence Score
                        </Typography>
                        <Typography variant="h6" sx={{ color: getConfidenceColor(attestation.confidence_score), fontWeight: 'bold' }}>
                          {Math.round(attestation.confidence_score * 100)}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Trust Impact
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                          +{Math.round(attestation.trust_impact * 100)}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Verifications
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                          {attestation.verification_history.length}
                        </Typography>
                      </Box>
                    </Box>

                    {attestation.parent_attestation_id && (
                      <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccountTree sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            Part of attestation chain (Parent: {attestation.parent_attestation_id})
                          </Typography>
                        </Box>
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" sx={{ color: '#3b82f6' }}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Certificate">
                        <IconButton size="small" sx={{ color: '#10b981' }}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share Attestation">
                        <IconButton size="small" sx={{ color: '#f59e0b' }}>
                          <Share />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredAttestations.length === 0 && (
            <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
              <AlertTitle>No Attestations Found</AlertTitle>
              No attestations match your current search and filter criteria.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Attestation Chains */}
          <Typography variant="h6" gutterBottom>Attestation Chains</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Hierarchical relationships between attestations showing trust inheritance and verification paths
          </Typography>

          <Grid container spacing={3}>
            {attestationChains.map((chain) => (
              <Grid item xs={12} md={6} key={chain.chain_id}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Chain {chain.chain_id}
                      </Typography>
                      <Chip
                        label={chain.chain_status.toUpperCase()}
                        color={chain.chain_status === 'valid' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Root Attestation: <span style={{ color: 'white' }}>{chain.root_attestation_id}</span>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Chain Length: <span style={{ color: 'white' }}>{chain.chain_length} attestations</span>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Overall Confidence: <span style={{ color: getConfidenceColor(chain.overall_confidence) }}>
                          {Math.round(chain.overall_confidence * 100)}%
                        </span>
                      </Typography>
                    </Box>

                    <Button variant="outlined" size="small" sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}>
                      View Chain Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Verification History */}
          <Typography variant="h6" gutterBottom>Verification History</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Timeline of all verification attempts and their outcomes
          </Typography>

          <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
            <CardContent>
              <Timeline>
                {attestations.flatMap(attestation => 
                  attestation.verification_history.map((verification, index) => (
                    <TimelineItem key={`${attestation.attestation_id}-${index}`}>
                      <TimelineSeparator>
                        <TimelineDot sx={{ 
                          backgroundColor: verification.verification_status === 'valid' ? '#10b981' : '#ef4444' 
                        }}>
                          {verification.verification_status === 'valid' ? <CheckCircle /> : <Error />}
                        </TimelineDot>
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {attestation.subject_name} - {attestation.attestation_type} Verification
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Status: {verification.verification_status} | 
                          Verifier: {verification.verifier_instance_id} | 
                          Time: {formatTimestamp(verification.timestamp)}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))
                )}
              </Timeline>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Analytics */}
          <Typography variant="h6" gutterBottom>Attestation Analytics</Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Statistical analysis and trends in attestation patterns
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Attestation Types Distribution
                  </Typography>
                  {['identity', 'capability', 'integrity', 'compliance', 'behavior'].map(type => {
                    const count = attestations.filter(a => a.attestation_type === type).length;
                    const percentage = (count / totalAttestations) * 100;
                    return (
                      <Box key={type} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {count} ({Math.round(percentage)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getAttestationTypeColor(type)
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Trust Impact Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                    How attestations contribute to overall trust scores
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Total Trust Boost: <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                        +{Math.round(totalTrustImpact * 100)}%
                      </span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Average per Attestation: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                        +{Math.round((totalTrustImpact / totalAttestations) * 100)}%
                      </span>
                    </Typography>
                  </Box>

                  <Alert severity="success" sx={{ backgroundColor: '#065f46', color: 'white' }}>
                    <AlertTitle>High Impact</AlertTitle>
                    Attestations are providing significant trust improvements across the system.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default TrustAttestationsPage;

