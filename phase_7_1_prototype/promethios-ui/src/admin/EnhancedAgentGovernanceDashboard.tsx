/**
 * Enhanced Agent Governance Dashboard Component
 * 
 * This component provides comprehensive oversight of both chat-specific and universal
 * agent governance, allowing administrators to monitor and manage governance across
 * all AI interactions in the system.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore,
  Refresh,
  Security,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Sync,
  Dashboard,
  Psychology,
  AdminPanelSettings,
  Visibility,
  Settings
} from '@mui/icons-material';
import { useAdminDashboard } from './AdminDashboardContext';
import { getUniversalGovernance } from '../services/universal';
import UniversalTrainOfThoughtPanel from '../components/universal/UniversalTrainOfThoughtPanel';

// Enhanced interfaces for universal governance
interface UniversalAgent {
  id: string;
  name: string;
  type: 'chat' | 'api' | 'wrapped' | 'multi_agent' | 'external';
  context: 'modern_chat' | 'universal' | 'cross_platform';
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  trustScore: number;
  complianceScore: number;
  violationCount: number;
  enforcementCount: number;
  autonomyLevel: string;
  syncStatus: 'synced' | 'pending' | 'error';
}

interface GovernanceMetrics {
  totalAgents: number;
  activeAgents: number;
  averageTrustScore: number;
  averageComplianceScore: number;
  totalViolations: number;
  syncHealth: number;
  crossContextCoordination: boolean;
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
      id={`governance-tabpanel-${index}`}
      aria-labelledby={`governance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnhancedAgentGovernanceDashboard: React.FC = () => {
  const { isLoading, refreshVigilData } = useAdminDashboard();
  const [tabValue, setTabValue] = useState(0);
  const [universalAgents, setUniversalAgents] = useState<UniversalAgent[]>([]);
  const [governanceMetrics, setGovernanceMetrics] = useState<GovernanceMetrics | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [featureParity, setFeatureParity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showUniversalDetails, setShowUniversalDetails] = useState(false);

  const universalGovernance = getUniversalGovernance();

  useEffect(() => {
    loadUniversalGovernanceData();
    const interval = setInterval(loadUniversalGovernanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUniversalGovernanceData = async () => {
    try {
      setLoading(true);
      console.log('🔄 [Admin] Loading universal governance data');

      // Load sync status
      const syncData = await universalGovernance.getSyncStatus();
      setSyncStatus(syncData);

      // Load feature parity
      const parityData = await universalGovernance.ensureFeatureParity();
      setFeatureParity(parityData);

      // Generate mock universal agents data (in real implementation, this would come from the governance adapter)
      const mockUniversalAgents: UniversalAgent[] = [
        {
          id: 'chat-agent-001',
          name: 'Modern Chat Agent',
          type: 'chat',
          context: 'modern_chat',
          status: 'active',
          lastActive: new Date().toISOString(),
          trustScore: 0.87,
          complianceScore: 0.95,
          violationCount: 2,
          enforcementCount: 1,
          autonomyLevel: 'moderate',
          syncStatus: 'synced'
        },
        {
          id: 'api-agent-001',
          name: 'OpenAI API Wrapper',
          type: 'api',
          context: 'universal',
          status: 'active',
          lastActive: new Date().toISOString(),
          trustScore: 0.92,
          complianceScore: 0.98,
          violationCount: 0,
          enforcementCount: 0,
          autonomyLevel: 'high',
          syncStatus: 'synced'
        },
        {
          id: 'wrapped-agent-001',
          name: 'Claude Wrapper Agent',
          type: 'wrapped',
          context: 'universal',
          status: 'active',
          lastActive: new Date().toISOString(),
          trustScore: 0.78,
          complianceScore: 0.89,
          violationCount: 3,
          enforcementCount: 2,
          autonomyLevel: 'basic',
          syncStatus: 'synced'
        },
        {
          id: 'multi-agent-001',
          name: 'Multi-Agent Coordinator',
          type: 'multi_agent',
          context: 'universal',
          status: 'active',
          lastActive: new Date().toISOString(),
          trustScore: 0.85,
          complianceScore: 0.93,
          violationCount: 1,
          enforcementCount: 1,
          autonomyLevel: 'moderate',
          syncStatus: 'synced'
        },
        {
          id: 'external-agent-001',
          name: 'External API Integration',
          type: 'external',
          context: 'cross_platform',
          status: 'inactive',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          trustScore: 0.65,
          complianceScore: 0.82,
          violationCount: 5,
          enforcementCount: 3,
          autonomyLevel: 'minimal',
          syncStatus: 'pending'
        }
      ];

      setUniversalAgents(mockUniversalAgents);

      // Calculate governance metrics
      const activeAgents = mockUniversalAgents.filter(agent => agent.status === 'active');
      const metrics: GovernanceMetrics = {
        totalAgents: mockUniversalAgents.length,
        activeAgents: activeAgents.length,
        averageTrustScore: activeAgents.reduce((sum, agent) => sum + agent.trustScore, 0) / activeAgents.length,
        averageComplianceScore: activeAgents.reduce((sum, agent) => sum + agent.complianceScore, 0) / activeAgents.length,
        totalViolations: mockUniversalAgents.reduce((sum, agent) => sum + agent.violationCount, 0),
        syncHealth: syncData?.isHealthy ? 1.0 : 0.7,
        crossContextCoordination: syncData?.contexts?.length > 1
      };

      setGovernanceMetrics(metrics);

      console.log('✅ [Admin] Universal governance data loaded:', {
        agents: mockUniversalAgents.length,
        syncHealth: syncData?.isHealthy,
        featureParity: parityData?.overallParity
      });
    } catch (error) {
      console.error('❌ [Admin] Failed to load universal governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getSyncStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced': return 'success';
      case 'pending': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getAutonomyLevelColor = (level: string) => {
    switch (level) {
      case 'minimal': return 'error';
      case 'basic': return 'warning';
      case 'moderate': return 'info';
      case 'high': return 'success';
      case 'full': return 'primary';
      default: return 'default';
    }
  };

  const renderGovernanceOverview = () => (
    <Grid container spacing={3}>
      {/* Governance Metrics Cards */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Agents
                </Typography>
                <Typography variant="h4">
                  {governanceMetrics?.totalAgents || 0}
                </Typography>
              </Box>
              <AdminPanelSettings color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Average Trust Score
                </Typography>
                <Typography variant="h4">
                  {((governanceMetrics?.averageTrustScore || 0) * 100).toFixed(0)}%
                </Typography>
              </Box>
              <TrendingUp color="success" sx={{ fontSize: 40 }} />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(governanceMetrics?.averageTrustScore || 0) * 100} 
              sx={{ mt: 1 }}
              color="success"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Compliance Score
                </Typography>
                <Typography variant="h4">
                  {((governanceMetrics?.averageComplianceScore || 0) * 100).toFixed(0)}%
                </Typography>
              </Box>
              <Security color="info" sx={{ fontSize: 40 }} />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(governanceMetrics?.averageComplianceScore || 0) * 100} 
              sx={{ mt: 1 }}
              color="info"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Sync Health
                </Typography>
                <Typography variant="h4">
                  {((governanceMetrics?.syncHealth || 0) * 100).toFixed(0)}%
                </Typography>
              </Box>
              <Sync color={governanceMetrics?.syncHealth > 0.9 ? 'success' : 'warning'} sx={{ fontSize: 40 }} />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(governanceMetrics?.syncHealth || 0) * 100} 
              sx={{ mt: 1 }}
              color={governanceMetrics?.syncHealth > 0.9 ? 'success' : 'warning'}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Synchronization Status */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sync color="primary" />
              Cross-Context Synchronization
            </Typography>
            
            {syncStatus && (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Chip 
                    label={syncStatus.isHealthy ? 'Healthy' : 'Issues Detected'} 
                    color={syncStatus.isHealthy ? 'success' : 'warning'}
                    icon={syncStatus.isHealthy ? <CheckCircle /> : <Warning />}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Last sync: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Pending Events</Typography>
                    <Typography variant="h6">{syncStatus.pendingEvents}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Active Conflicts</Typography>
                    <Typography variant="h6">{syncStatus.activeConflicts}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Feature Parity Status */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Dashboard color="secondary" />
              Feature Parity Status
            </Typography>
            
            {featureParity && (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Chip 
                    label={featureParity.overallParity ? 'Complete Parity' : 'Partial Parity'} 
                    color={featureParity.overallParity ? 'success' : 'warning'}
                    icon={featureParity.overallParity ? <CheckCircle /> : <Warning />}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Score: {(featureParity.parityScore * 100).toFixed(0)}%
                  </Typography>
                </Box>
                
                {featureParity.missingFeatures.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {featureParity.missingFeatures.length} missing features detected
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderUniversalAgentsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Agent Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Context</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Trust Score</TableCell>
            <TableCell>Compliance</TableCell>
            <TableCell>Autonomy Level</TableCell>
            <TableCell>Sync Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {universalAgents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {agent.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {agent.id}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={agent.type} 
                  size="small" 
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={agent.context} 
                  size="small" 
                  color="secondary"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={agent.status} 
                  size="small" 
                  color={getStatusColor(agent.status) as any}
                />
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    {(agent.trustScore * 100).toFixed(0)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={agent.trustScore * 100} 
                    sx={{ width: 60, height: 4 }}
                    color="success"
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    {(agent.complianceScore * 100).toFixed(0)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={agent.complianceScore * 100} 
                    sx={{ width: 60, height: 4 }}
                    color="info"
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={agent.autonomyLevel} 
                  size="small" 
                  color={getAutonomyLevelColor(agent.autonomyLevel) as any}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={agent.syncStatus} 
                  size="small" 
                  color={getSyncStatusColor(agent.syncStatus) as any}
                  icon={agent.syncStatus === 'synced' ? <CheckCircle /> : <Warning />}
                />
              </TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton 
                    size="small" 
                    onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton size="small">
                    <Settings />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderUniversalGovernanceDetails = () => (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={showUniversalDetails}
            onChange={(e) => setShowUniversalDetails(e.target.checked)}
          />
        }
        label="Show Universal Governance Details"
      />
      
      {showUniversalDetails && selectedAgent && (
        <Box mt={2}>
          <UniversalTrainOfThoughtPanel
            agentId={selectedAgent}
            showDetails={true}
            compact={false}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          Enhanced Agent Governance Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadUniversalGovernanceData} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Governance Overview" />
          <Tab label="Universal Agents" />
          <Tab label="Governance Details" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderGovernanceOverview()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Universal Agent Governance
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Monitor governance across all AI agents: chat, API wrappers, multi-agent systems, and external integrations
          </Typography>
        </Box>
        {renderUniversalAgentsTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderUniversalGovernanceDetails()}
      </TabPanel>
    </Box>
  );
};

export default EnhancedAgentGovernanceDashboard;

