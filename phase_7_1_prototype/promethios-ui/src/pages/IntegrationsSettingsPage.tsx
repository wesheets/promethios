import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tab,
  Tabs,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  Badge,
  Tooltip,
  Avatar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Hub,
  Add,
  Edit,
  Delete,
  MoreVert,
  Settings,
  CheckCircle,
  Cancel,
  Save,
  Warning,
  Info,
  Link,
  LinkOff,
  Refresh,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Launch,
  Webhook,
  Key,
  Security,
  Notifications,
  Cloud,
  Storage,
  Api,
  Code,
  ExpandMore,
  ConnectedTv,
  Chat,
  Email,
  Work,
  Analytics,
  BugReport,
  Schedule
} from '@mui/icons-material';

interface Integration {
  id: string;
  name: string;
  type: 'communication' | 'productivity' | 'development' | 'analytics' | 'storage' | 'security';
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  provider: string;
  connectedAt?: string;
  lastSync?: string;
  config: {
    [key: string]: any;
  };
  permissions: string[];
  webhookUrl?: string;
  apiKey?: string;
  features: string[];
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  status: 'active' | 'revoked' | 'expired';
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  lastTriggered?: string;
  secret: string;
  retryCount: number;
  headers: { [key: string]: string };
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
      id={`integrations-tabpanel-${index}`}
      aria-labelledby={`integrations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const IntegrationsSettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});

  // Mock integrations data
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack-001',
      name: 'Slack',
      type: 'communication',
      description: 'Team communication and notifications',
      icon: '/api/placeholder/40/40',
      status: 'connected',
      provider: 'Slack Technologies',
      connectedAt: '2024-06-15T10:30:00Z',
      lastSync: '2025-06-20T14:30:00Z',
      config: {
        workspace: 'promethios-team',
        defaultChannel: '#ai-governance',
        notificationLevel: 'important'
      },
      permissions: ['channels:read', 'chat:write', 'users:read'],
      webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      features: ['Real-time notifications', 'Agent status updates', 'Policy violations alerts']
    },
    {
      id: 'teams-001',
      name: 'Microsoft Teams',
      type: 'communication',
      description: 'Enterprise communication platform',
      icon: '/api/placeholder/40/40',
      status: 'disconnected',
      provider: 'Microsoft Corporation',
      config: {},
      permissions: [],
      features: ['Team notifications', 'Meeting integration', 'File sharing']
    },
    {
      id: 'jira-001',
      name: 'Jira',
      type: 'productivity',
      description: 'Issue tracking and project management',
      icon: '/api/placeholder/40/40',
      status: 'connected',
      provider: 'Atlassian',
      connectedAt: '2024-05-20T09:15:00Z',
      lastSync: '2025-06-20T12:00:00Z',
      config: {
        instance: 'promethios.atlassian.net',
        project: 'AIGOV',
        issueType: 'Bug'
      },
      permissions: ['read:jira-work', 'write:jira-work'],
      apiKey: 'ATATT3xFfGF0...',
      features: ['Auto-create tickets', 'Policy violation tracking', 'Compliance reporting']
    },
    {
      id: 'github-001',
      name: 'GitHub',
      type: 'development',
      description: 'Code repository and CI/CD integration',
      icon: '/api/placeholder/40/40',
      status: 'error',
      provider: 'GitHub Inc.',
      connectedAt: '2024-04-10T16:45:00Z',
      lastSync: '2025-06-19T08:30:00Z',
      config: {
        organization: 'promethios-corp',
        repository: 'ai-governance',
        branch: 'main'
      },
      permissions: ['repo', 'workflow'],
      apiKey: 'ghp_xxxxxxxxxxxxxxxxxxxx',
      features: ['Code scanning', 'Automated testing', 'Deployment hooks']
    },
    {
      id: 'datadog-001',
      name: 'Datadog',
      type: 'analytics',
      description: 'Monitoring and analytics platform',
      icon: '/api/placeholder/40/40',
      status: 'pending',
      provider: 'Datadog Inc.',
      config: {},
      permissions: [],
      features: ['Performance monitoring', 'Custom metrics', 'Alert management']
    },
    {
      id: 'aws-001',
      name: 'Amazon S3',
      type: 'storage',
      description: 'Cloud storage for backups and exports',
      icon: '/api/placeholder/40/40',
      status: 'connected',
      provider: 'Amazon Web Services',
      connectedAt: '2024-03-01T11:20:00Z',
      lastSync: '2025-06-20T13:45:00Z',
      config: {
        bucket: 'promethios-backups',
        region: 'us-west-2',
        encryption: 'AES256'
      },
      permissions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      apiKey: 'AKIA...',
      features: ['Automated backups', 'Data archiving', 'Compliance exports']
    }
  ]);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'key-001',
      name: 'Production API',
      key: 'pk_live_51234567890abcdef...',
      permissions: ['read:all', 'write:agents', 'write:policies'],
      createdAt: '2024-06-01T10:00:00Z',
      lastUsed: '2025-06-20T14:30:00Z',
      status: 'active'
    },
    {
      id: 'key-002',
      name: 'Development API',
      key: 'pk_test_09876543210fedcba...',
      permissions: ['read:all', 'write:test'],
      createdAt: '2024-05-15T14:20:00Z',
      lastUsed: '2025-06-19T16:45:00Z',
      expiresAt: '2025-12-31T23:59:59Z',
      status: 'active'
    },
    {
      id: 'key-003',
      name: 'Legacy Integration',
      key: 'pk_live_legacy123456789...',
      permissions: ['read:metrics'],
      createdAt: '2024-01-10T09:30:00Z',
      lastUsed: '2025-03-15T11:20:00Z',
      status: 'revoked'
    }
  ]);

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: 'webhook-001',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      events: ['agent.created', 'policy.violated', 'trust.threshold.breached'],
      status: 'active',
      createdAt: '2024-06-15T10:30:00Z',
      lastTriggered: '2025-06-20T14:25:00Z',
      secret: 'whsec_1234567890abcdef...',
      retryCount: 3,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Promethios-Webhook/1.0'
      }
    },
    {
      id: 'webhook-002',
      name: 'Jira Issue Creation',
      url: 'https://promethios.atlassian.net/rest/api/3/issue',
      events: ['policy.violated', 'compliance.failed'],
      status: 'active',
      createdAt: '2024-05-20T09:15:00Z',
      lastTriggered: '2025-06-20T11:30:00Z',
      secret: 'whsec_abcdef1234567890...',
      retryCount: 5,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ATATT3xFfGF0...'
      }
    },
    {
      id: 'webhook-003',
      name: 'Custom Analytics',
      url: 'https://analytics.promethios.com/webhook',
      events: ['trust.score.updated', 'attestation.created'],
      status: 'error',
      createdAt: '2024-04-10T16:45:00Z',
      lastTriggered: '2025-06-18T09:20:00Z',
      secret: 'whsec_fedcba0987654321...',
      retryCount: 3,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleConnectIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowIntegrationDialog(true);
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: 'disconnected', connectedAt: undefined, lastSync: undefined }
        : integration
    ));
    setLoading(false);
  };

  const handleCreateApiKey = () => {
    setSelectedApiKey(null);
    setShowApiKeyDialog(true);
  };

  const handleEditApiKey = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setShowApiKeyDialog(true);
  };

  const handleRevokeApiKey = async (keyId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, status: 'revoked' } : key
    ));
    setLoading(false);
  };

  const handleCreateWebhook = () => {
    setSelectedWebhook(null);
    setShowWebhookDialog(true);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setShowWebhookDialog(true);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
    setLoading(false);
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In real app, show toast notification
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active': return '#10b981';
      case 'disconnected':
      case 'inactive': return '#6b7280';
      case 'error': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'revoked':
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'communication': return <Chat />;
      case 'productivity': return <Work />;
      case 'development': return <Code />;
      case 'analytics': return <Analytics />;
      case 'storage': return <Storage />;
      case 'security': return <Security />;
      default: return <Hub />;
    }
  };

  const getIntegrationsByType = (type: string) => {
    return integrations.filter(integration => integration.type === type);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Integrations
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Connect external systems and manage API access for your organization
        </Typography>
      </Box>

      {/* Integration Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {integrations.filter(i => i.status === 'connected').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Connected
                  </Typography>
                </Box>
                <ConnectedTv sx={{ color: '#3b82f6', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                    {apiKeys.filter(k => k.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active API Keys
                  </Typography>
                </Box>
                <Key sx={{ color: '#10b981', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {webhooks.filter(w => w.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active Webhooks
                  </Typography>
                </Box>
                <Webhook sx={{ color: '#f59e0b', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                    {integrations.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Total Integrations
                  </Typography>
                </Box>
                <Api sx={{ color: '#8b5cf6', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
            <Tab icon={<Hub />} label="External Systems" />
            <Tab icon={<Key />} label="API Keys" />
            <Tab icon={<Webhook />} label="Webhooks" />
            <Tab icon={<Settings />} label="Configuration" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* External Systems */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Available Integrations
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              Connect external systems to enhance your AI governance workflow
            </Typography>
          </Box>

          {/* Integration Categories */}
          {['communication', 'productivity', 'development', 'analytics', 'storage', 'security'].map((type) => {
            const typeIntegrations = getIntegrationsByType(type);
            if (typeIntegrations.length === 0) return null;

            return (
              <Accordion 
                key={type}
                sx={{ 
                  backgroundColor: '#1a202c', 
                  border: '1px solid #4a5568',
                  mb: 2,
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: '#a0aec0' }} />}
                  sx={{ borderBottom: '1px solid #4a5568' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getTypeIcon(type)}
                    <Typography variant="h6" sx={{ color: 'white', textTransform: 'capitalize' }}>
                      {type} ({typeIntegrations.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {typeIntegrations.map((integration) => (
                      <Grid item xs={12} md={6} lg={4} key={integration.id}>
                        <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar
                                src={integration.icon}
                                sx={{ width: 40, height: 40, mr: 2 }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {integration.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                                  {integration.provider}
                                </Typography>
                              </Box>
                              <Chip
                                label={integration.status}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(integration.status),
                                  color: 'white',
                                  textTransform: 'capitalize'
                                }}
                              />
                            </Box>
                            
                            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                              {integration.description}
                            </Typography>

                            {integration.features.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                                  Features:
                                </Typography>
                                {integration.features.slice(0, 2).map((feature, index) => (
                                  <Chip
                                    key={index}
                                    label={feature}
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      borderColor: '#4a5568', 
                                      color: '#a0aec0',
                                      mr: 1,
                                      mb: 1
                                    }}
                                  />
                                ))}
                                {integration.features.length > 2 && (
                                  <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                                    +{integration.features.length - 2} more
                                  </Typography>
                                )}
                              </Box>
                            )}

                            {integration.status === 'connected' && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                                  Connected: {formatDate(integration.connectedAt)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                                  Last sync: {formatDate(integration.lastSync)}
                                </Typography>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {integration.status === 'connected' ? (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Settings />}
                                    onClick={() => handleConnectIntegration(integration)}
                                    sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                                  >
                                    Configure
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<LinkOff />}
                                    onClick={() => handleDisconnectIntegration(integration.id)}
                                    sx={{ borderColor: '#ef4444', color: '#ef4444' }}
                                  >
                                    Disconnect
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Link />}
                                  onClick={() => handleConnectIntegration(integration)}
                                  sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                                >
                                  Connect
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* API Keys */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white' }}>
                API Keys
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Manage API keys for programmatic access to Promethios
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateApiKey}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              Create API Key
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Name</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Key</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Permissions</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Last Used</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {apiKey.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                          Created: {formatDate(apiKey.createdAt)}
                        </Typography>
                        {apiKey.expiresAt && (
                          <Typography variant="body2" sx={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                            Expires: {formatDate(apiKey.expiresAt)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'white', 
                            fontFamily: 'monospace',
                            fontSize: '0.75rem'
                          }}
                        >
                          {showApiKey[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => toggleApiKeyVisibility(apiKey.id)}
                          sx={{ color: '#a0aec0' }}
                        >
                          {showApiKey[apiKey.id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(apiKey.key)}
                          sx={{ color: '#a0aec0' }}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {apiKey.permissions.slice(0, 2).map((permission) => (
                          <Chip
                            key={permission}
                            label={permission}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                          />
                        ))}
                        {apiKey.permissions.length > 2 && (
                          <Chip
                            label={`+${apiKey.permissions.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip
                        label={apiKey.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(apiKey.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>
                      {formatDate(apiKey.lastUsed)}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ color: '#a0aec0' }}
                      >
                        <MoreVert />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{
                          sx: { backgroundColor: '#2d3748', color: 'white' }
                        }}
                      >
                        <MenuItem onClick={() => {
                          handleEditApiKey(apiKey);
                          setAnchorEl(null);
                        }}>
                          <Edit sx={{ mr: 1 }} /> Edit
                        </MenuItem>
                        <MenuItem 
                          onClick={() => {
                            handleRevokeApiKey(apiKey.id);
                            setAnchorEl(null);
                          }}
                          sx={{ color: '#ef4444' }}
                          disabled={apiKey.status === 'revoked'}
                        >
                          <Cancel sx={{ mr: 1 }} /> Revoke
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Webhooks */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white' }}>
                Webhooks
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Configure webhooks to receive real-time notifications
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateWebhook}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              Create Webhook
            </Button>
          </Box>

          <Grid container spacing={3}>
            {webhooks.map((webhook) => (
              <Grid item xs={12} md={6} lg={4} key={webhook.id}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {webhook.name}
                      </Typography>
                      <Chip
                        label={webhook.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(webhook.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Endpoint:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'white', 
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          wordBreak: 'break-all'
                        }}
                      >
                        {webhook.url}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Events ({webhook.events.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {webhook.events.slice(0, 2).map((event) => (
                          <Chip
                            key={event}
                            label={event}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                          />
                        ))}
                        {webhook.events.length > 2 && (
                          <Chip
                            label={`+${webhook.events.length - 2} more`}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                        Created: {formatDate(webhook.createdAt)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                        Last triggered: {formatDate(webhook.lastTriggered)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                        Retry attempts: {webhook.retryCount}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEditWebhook(webhook)}
                        sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        sx={{ borderColor: '#ef4444', color: '#ef4444' }}
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

        <TabPanel value={tabValue} index={3}>
          {/* Configuration */}
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Integration Configuration
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Global Settings
                  </Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Enable webhook retries</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Automatically retry failed webhook deliveries</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          defaultChecked
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Rate limiting</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Apply rate limits to API requests</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          defaultChecked
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Audit logging</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Log all integration activities</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          defaultChecked
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Security Settings
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                      API Key Expiration (days)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      defaultValue={365}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#4a5568' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputBase-input': { color: 'white' }
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                      Webhook Timeout (seconds)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      defaultValue={30}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#4a5568' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputBase-input': { color: 'white' }
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                      Max Retry Attempts
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      defaultValue={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#4a5568' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputBase-input': { color: 'white' }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Integration Dialog */}
      <Dialog
        open={showIntegrationDialog}
        onClose={() => setShowIntegrationDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>
          {selectedIntegration?.status === 'connected' ? 'Configure' : 'Connect'} {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          {selectedIntegration && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                {selectedIntegration.description}
              </Typography>
              
              {selectedIntegration.status === 'connected' ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Integration is active and working properly
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Follow the steps below to connect this integration
                </Alert>
              )}

              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Configuration
              </Typography>
              
              {/* Mock configuration fields based on integration type */}
              <Grid container spacing={2}>
                {selectedIntegration.name === 'Slack' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Workspace URL"
                        defaultValue={selectedIntegration.config.workspace || ''}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#4a5568' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#a0aec0' },
                          '& .MuiInputBase-input': { color: 'white' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Default Channel"
                        defaultValue={selectedIntegration.config.defaultChannel || ''}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#4a5568' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#a0aec0' },
                          '& .MuiInputBase-input': { color: 'white' }
                        }}
                      />
                    </Grid>
                  </>
                )}
                
                {selectedIntegration.name === 'Jira' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Jira Instance URL"
                        defaultValue={selectedIntegration.config.instance || ''}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#4a5568' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#a0aec0' },
                          '& .MuiInputBase-input': { color: 'white' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Project Key"
                        defaultValue={selectedIntegration.config.project || ''}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#4a5568' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#a0aec0' },
                          '& .MuiInputBase-input': { color: 'white' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#a0aec0' }}>Issue Type</InputLabel>
                        <Select
                          defaultValue={selectedIntegration.config.issueType || 'Bug'}
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                          }}
                        >
                          <MenuItem value="Bug">Bug</MenuItem>
                          <MenuItem value="Task">Task</MenuItem>
                          <MenuItem value="Story">Story</MenuItem>
                          <MenuItem value="Epic">Epic</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}

                {selectedIntegration.name === 'Amazon S3' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Bucket Name"
                        defaultValue={selectedIntegration.config.bucket || ''}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#4a5568' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#a0aec0' },
                          '& .MuiInputBase-input': { color: 'white' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#a0aec0' }}>Region</InputLabel>
                        <Select
                          defaultValue={selectedIntegration.config.region || 'us-west-2'}
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                          }}
                        >
                          <MenuItem value="us-east-1">US East (N. Virginia)</MenuItem>
                          <MenuItem value="us-west-2">US West (Oregon)</MenuItem>
                          <MenuItem value="eu-west-1">Europe (Ireland)</MenuItem>
                          <MenuItem value="ap-southeast-1">Asia Pacific (Singapore)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIntegrationDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {selectedIntegration?.status === 'connected' ? 'Save Configuration' : 'Connect Integration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>
          {selectedApiKey ? 'Edit API Key' : 'Create API Key'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Key Name"
                defaultValue={selectedApiKey?.name || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                Permissions
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }} />}
                label="Read access"
                sx={{ color: '#a0aec0', display: 'block' }}
              />
              <FormControlLabel
                control={<Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }} />}
                label="Write access"
                sx={{ color: '#a0aec0', display: 'block' }}
              />
              <FormControlLabel
                control={<Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }} />}
                label="Admin access"
                sx={{ color: '#a0aec0', display: 'block' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiration Date (optional)"
                type="date"
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {selectedApiKey ? 'Update Key' : 'Create Key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Webhook Dialog */}
      <Dialog
        open={showWebhookDialog}
        onClose={() => setShowWebhookDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>
          {selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook Name"
                defaultValue={selectedWebhook?.name || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endpoint URL"
                defaultValue={selectedWebhook?.url || ''}
                placeholder="https://your-app.com/webhook"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                Events to Subscribe
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }} />}
                label="Agent created/updated"
                sx={{ color: '#a0aec0', display: 'block' }}
              />
              <FormControlLabel
                control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }} />}
                label="Policy violations"
                sx={{ color: '#a0aec0', display: 'block' }}
              />
              <FormControlLabel
                control={<Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }} />}
                label="Trust score changes"
                sx={{ color: '#a0aec0', display: 'block' }}
              />
              <FormControlLabel
                control={<Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }} />}
                label="Attestations created"
                sx={{ color: '#a0aec0', display: 'block' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Secret (optional)"
                placeholder="Webhook signing secret"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWebhookDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {selectedWebhook ? 'Update Webhook' : 'Create Webhook'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsSettingsPage;

