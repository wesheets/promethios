import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Divider,
  Badge,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Remove,
  CheckCircle,
  Warning,
  Error,
  Chat,
  Assessment,
  Settings,
  Group,
  Person,
  Security,
  Speed,
  Verified,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { useAgentWrappers } from '../modules/agent-wrapping/hooks/useAgentWrappers';
import { useMultiAgentSystems } from '../modules/agent-wrapping/hooks/useMultiAgentSystems';
import { useAgentIdentities } from '../modules/agent-identity/hooks/useAgentIdentities';
import { useScorecards } from '../modules/agent-identity/hooks/useScorecards';
import { AgentProfile, SystemProfile, CombinedProfile } from '../modules/agent-identity/types/multiAgent';

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
      id={`agent-profiles-tabpanel-${index}`}
      aria-labelledby={`agent-profiles-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Agent Profile Card Component
const AgentProfileCard: React.FC<{ profile: AgentProfile }> = ({ profile }) => {
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      default: return <Remove />;
    }
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6" gutterBottom>
                {profile.identity.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                v{profile.identity.version}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {profile.identity.description}
          </Typography>
        </Box>

        {/* Health Status and Trust Level */}
        <Stack direction="row" spacing={1} mb={2}>
          <Chip
            icon={getHealthIcon(profile.healthStatus)}
            label={profile.healthStatus}
            color={getHealthStatusColor(profile.healthStatus) as any}
            size="small"
          />
          <Chip
            label={`${profile.trustLevel} trust`}
            color={getTrustLevelColor(profile.trustLevel) as any}
            size="small"
          />
          <Chip
            label={profile.identity.status}
            variant="outlined"
            size="small"
          />
        </Stack>

        {/* Scorecard Preview */}
        {profile.latestScorecard && (
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Overall Score
              </Typography>
              <Typography variant="h6" color="primary">
                {profile.latestScorecard.overallScore}/100
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={profile.latestScorecard.overallScore || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Key Metrics */}
        <Grid container spacing={1} mb={3}>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Attestations
              </Typography>
              <Typography variant="h6">
                {profile.attestationCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Last Active
              </Typography>
              <Typography variant="body2">
                {profile.lastActivity ? 
                  new Date(profile.lastActivity).toLocaleDateString() : 
                  'Never'
                }
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Chat />}
            fullWidth
          >
            Chat
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Assessment />}
            fullWidth
          >
            Scorecard
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Multi-Agent System Profile Card Component
const SystemProfileCard: React.FC<{ profile: SystemProfile }> = ({ profile }) => {
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      default: return <Remove />;
    }
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <Group />
            </Avatar>
            <Box>
              <Typography variant="h6" gutterBottom>
                {profile.identity.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.identity.systemType} • {profile.identity.agentIds.length} agents
              </Typography>
            </Box>
          </Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {profile.identity.description}
          </Typography>
        </Box>

        {/* Health Status and Trust Level */}
        <Stack direction="row" spacing={1} mb={2}>
          <Chip
            icon={getHealthIcon(profile.healthStatus)}
            label={profile.healthStatus}
            color={getHealthStatusColor(profile.healthStatus) as any}
            size="small"
          />
          <Chip
            label={`${profile.trustLevel} trust`}
            color={getHealthStatusColor(profile.trustLevel) as any}
            size="small"
          />
          <Chip
            label={profile.identity.status}
            variant="outlined"
            size="small"
          />
        </Stack>

        {/* System Scorecard Preview */}
        {profile.latestScorecard && (
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                System Score
              </Typography>
              <Typography variant="h6" color="primary">
                {profile.latestScorecard.overallScore}/100
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={profile.latestScorecard.overallScore || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
            
            {/* System-specific metrics */}
            <Grid container spacing={1} mt={1}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Workflow
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {profile.latestScorecard.workflowEfficiency}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Trust
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    {profile.latestScorecard.crossAgentTrust}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Coordination
                  </Typography>
                  <Typography variant="body2" color="secondary.main">
                    {profile.latestScorecard.coordinationScore}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Key Metrics */}
        <Grid container spacing={1} mb={3}>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Agents
              </Typography>
              <Typography variant="h6">
                {profile.identity.agentIds.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Attestations
              </Typography>
              <Typography variant="h6">
                {profile.attestationCount}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Chat />}
            fullWidth
          >
            Chat
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Assessment />}
            fullWidth
          >
            System Scorecard
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Main Agent Profiles Page Component
const AgentProfilesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');

  // Mock data - would be replaced with actual hooks
  const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>([]);
  const [systemProfiles, setSystemProfiles] = useState<SystemProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data loading
    const loadProfiles = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock agent profiles
      const mockAgentProfiles: AgentProfile[] = [
        {
          identity: {
            id: 'agent-1',
            name: 'Customer Support Assistant',
            version: '1.2.0',
            description: 'AI assistant for customer support inquiries',
            ownerId: 'user-1',
            creationDate: new Date('2024-01-15'),
            lastModifiedDate: new Date('2024-06-10'),
            status: 'active'
          },
          latestScorecard: {
            agentId: 'agent-1',
            templateId: 'default',
            evaluationTimestamp: new Date(),
            context: {},
            overallScore: 92,
            metricValues: {}
          },
          attestationCount: 3,
          lastActivity: new Date('2024-06-12'),
          healthStatus: 'healthy',
          trustLevel: 'high'
        },
        {
          identity: {
            id: 'agent-2',
            name: 'Data Analysis Bot',
            version: '2.1.0',
            description: 'Specialized in data analysis and reporting',
            ownerId: 'user-1',
            creationDate: new Date('2024-02-20'),
            lastModifiedDate: new Date('2024-06-08'),
            status: 'active'
          },
          latestScorecard: {
            agentId: 'agent-2',
            templateId: 'default',
            evaluationTimestamp: new Date(),
            context: {},
            overallScore: 78,
            metricValues: {}
          },
          attestationCount: 2,
          lastActivity: new Date('2024-06-11'),
          healthStatus: 'warning',
          trustLevel: 'medium'
        }
      ];

      // Mock system profiles
      const mockSystemProfiles: SystemProfile[] = [
        {
          identity: {
            id: 'system-1',
            name: 'Customer Service Multi-Agent System',
            version: '1.0.0',
            description: 'Complete customer service solution with multiple specialized agents',
            ownerId: 'user-1',
            creationDate: new Date('2024-03-01'),
            lastModifiedDate: new Date('2024-06-10'),
            status: 'active',
            systemType: 'sequential',
            agentIds: ['agent-1', 'agent-2'],
            agentRoles: {},
            workflowDefinition: {
              type: 'sequential',
              steps: [],
              dataFlow: [],
              errorHandling: { strategy: 'retry' }
            }
          },
          latestScorecard: {
            systemId: 'system-1',
            agentId: 'system-1',
            templateId: 'system-default',
            evaluationTimestamp: new Date(),
            context: {},
            overallScore: 87,
            metricValues: {},
            systemMetrics: {},
            agentResults: {},
            workflowEfficiency: 85,
            crossAgentTrust: 88,
            coordinationScore: 92
          },
          attestationCount: 4,
          lastActivity: new Date('2024-06-12'),
          healthStatus: 'healthy',
          trustLevel: 'high',
          agentProfiles: mockAgentProfiles
        }
      ];

      setAgentProfiles(mockAgentProfiles);
      setSystemProfiles(mockSystemProfiles);
      setLoading(false);
    };

    loadProfiles();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredAgentProfiles = agentProfiles.filter(profile => {
    const matchesSearch = profile.identity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.identity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || profile.identity.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || profile.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  const filteredSystemProfiles = systemProfiles.filter(profile => {
    const matchesSearch = profile.identity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.identity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || profile.identity.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || profile.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Agent Profiles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and monitor your individual agents and multi-agent systems
          </Typography>
        </Box>

        {/* Filters and Search */}
        <Box mb={4}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search agents and systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Health</InputLabel>
                <Select
                  value={healthFilter}
                  label="Health"
                  onChange={(e) => setHealthFilter(e.target.value)}
                >
                  <MenuItem value="all">All Health</MenuItem>
                  <MenuItem value="healthy">Healthy</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                fullWidth
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Person />
                  Overview ({agentProfiles.length + systemProfiles.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Person />
                  Individual Agents ({agentProfiles.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Group />
                  Multi-Agent Systems ({systemProfiles.length})
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {/* Overview Tab - Combined view */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Typography>Loading profiles...</Typography>
            </Box>
          ) : (
            <>
              {/* Summary Stats */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">{agentProfiles.length}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Individual Agents
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <Group />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">{systemProfiles.length}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Multi-Agent Systems
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CheckCircle />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">
                            {agentProfiles.filter(p => p.healthStatus === 'healthy').length + 
                             systemProfiles.filter(p => p.healthStatus === 'healthy').length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Healthy
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <Verified />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">
                            {agentProfiles.reduce((sum, p) => sum + p.attestationCount, 0) +
                             systemProfiles.reduce((sum, p) => sum + p.attestationCount, 0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Attestations
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recent Activity */}
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Grid container spacing={3}>
                {/* Show mix of agents and systems */}
                {[...filteredAgentProfiles.slice(0, 2), ...filteredSystemProfiles.slice(0, 1)].map((profile, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    {'systemType' in profile.identity ? (
                      <SystemProfileCard profile={profile as SystemProfile} />
                    ) : (
                      <AgentProfileCard profile={profile as AgentProfile} />
                    )}
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Individual Agents Tab */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Typography>Loading agent profiles...</Typography>
            </Box>
          ) : filteredAgentProfiles.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>No Individual Agents Found</AlertTitle>
              {searchTerm || statusFilter !== 'all' || healthFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'You haven\'t wrapped any individual agents yet. Start by wrapping your first agent!'
              }
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredAgentProfiles.map((profile) => (
                <Grid item xs={12} md={6} lg={4} key={profile.identity.id}>
                  <AgentProfileCard profile={profile} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Multi-Agent Systems Tab */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Typography>Loading system profiles...</Typography>
            </Box>
          ) : filteredSystemProfiles.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>No Multi-Agent Systems Found</AlertTitle>
              {searchTerm || statusFilter !== 'all' || healthFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'You haven\'t created any multi-agent systems yet. Start by creating your first system!'
              }
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredSystemProfiles.map((profile) => (
                <Grid item xs={12} md={6} lg={4} key={profile.identity.id}>
                  <SystemProfileCard profile={profile} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
};

export default AgentProfilesPage;

