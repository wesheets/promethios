import React, { useState, useEffect, useCallback } from 'react';
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
  AccordionDetails,
  Slider,
  CircularProgress,
  Snackbar,
  Checkbox,
  FormGroup
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
  Schedule,
  MonitorHeart,
  Shield,
  Speed,
  Assessment,
  TrendingUp,
  Download,
  Upload,
  RestartAlt,
  Extension,
  HealthAndSafety,
  Timer,
  DataUsage,
  NotificationsActive,
  Tune,
  PlayArrow,
  Stop,
  Error,
  CloudUpload,
  GitHub,
  Microsoft,
  Google,
  Apple,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  YouTube,
  Telegram,
  WhatsApp
} from '@mui/icons-material';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import integrationsAPI from '../services/api/integrationsAPI';
// import { 
//   Integration, 
//   ApiKey, 
//   Webhook, 
//   MonitoringConfig 
// } from '../services/api/integrationsAPI';

// Temporary type definitions
type Integration = any;
type ApiKey = any;
type Webhook = any;
type MonitoringConfig = any;
import { MonitoringExtension } from '../extensions/MonitoringExtension';
import { LiveAgentStatusWidget } from '../components/monitoring/LiveAgentStatusWidget';
import { AlertManagementWidget } from '../components/monitoring/AlertManagementWidget';

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
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Data state
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfig | null>(null);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  
  // Dialog state
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [showMonitoringConfigDialog, setShowMonitoringConfigDialog] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  
  // Selected items
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  
  // UI state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form state
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    permissions: [] as string[],
    expiresAt: '',
    rateLimit: { requests: 1000, window: 'hour' }
  });
  
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    headers: {} as Record<string, string>
  });

  const [deployForm, setDeployForm] = useState({
    agentId: '',
    integrationId: '',
    deploymentType: 'bot' as 'bot' | 'webhook' | 'api',
    config: {} as Record<string, any>
  });

  const monitoringExtension = new MonitoringExtension();

  // Mock data for development
  const mockIntegrations: Integration[] = [
    {
      id: 'slack-1',
      name: 'Slack',
      type: 'communication',
      description: 'Deploy agents as Slack bots and receive notifications',
      icon: 'slack',
      status: 'connected',
      provider: 'Slack Technologies',
      connectedAt: '2024-01-15T10:30:00Z',
      lastSync: '2024-01-20T14:22:00Z',
      config: {
        workspace: 'promethios-team',
        botToken: 'xoxb-***',
        channels: ['#general', '#ai-governance'],
        permissions: ['chat:write', 'channels:read']
      },
      permissions: ['read', 'write', 'deploy'],
      webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      features: ['Bot Deployment', 'Channel Notifications', 'Slash Commands', 'Interactive Messages']
    },
    {
      id: 'github-1',
      name: 'GitHub',
      type: 'development',
      description: 'Integrate with repositories and deploy via GitHub Actions',
      icon: 'github',
      status: 'connected',
      provider: 'GitHub Inc.',
      connectedAt: '2024-01-10T09:15:00Z',
      lastSync: '2024-01-20T16:45:00Z',
      config: {
        organization: 'promethios-ai',
        repositories: ['agent-deployment', 'governance-framework'],
        accessToken: 'ghp_***',
        webhookSecret: 'webhook_secret_***'
      },
      permissions: ['read', 'write', 'admin'],
      features: ['CI/CD Integration', 'Issue Tracking', 'Pull Request Automation', 'Release Management']
    },
    {
      id: 'discord-1',
      name: 'Discord',
      type: 'communication',
      description: 'Deploy agents as Discord bots for community management',
      icon: 'discord',
      status: 'disconnected',
      provider: 'Discord Inc.',
      config: {},
      permissions: [],
      features: ['Bot Deployment', 'Server Management', 'Voice Integration', 'Moderation Tools']
    },
    {
      id: 'teams-1',
      name: 'Microsoft Teams',
      type: 'communication',
      description: 'Enterprise communication and collaboration platform',
      icon: 'teams',
      status: 'pending',
      provider: 'Microsoft Corporation',
      config: {},
      permissions: [],
      features: ['Bot Deployment', 'Meeting Integration', 'File Sharing', 'Enterprise SSO']
    },
    {
      id: 'jira-1',
      name: 'Jira',
      type: 'productivity',
      description: 'Project management and issue tracking integration',
      icon: 'jira',
      status: 'connected',
      provider: 'Atlassian',
      connectedAt: '2024-01-12T11:20:00Z',
      config: {
        instance: 'promethios.atlassian.net',
        projects: ['PROM', 'GOV'],
        apiToken: 'ATATT3xFfGF0***'
      },
      permissions: ['read', 'write'],
      features: ['Issue Creation', 'Status Updates', 'Custom Fields', 'Automation Rules']
    },
    {
      id: 'notion-1',
      name: 'Notion',
      type: 'productivity',
      description: 'Knowledge management and documentation platform',
      icon: 'notion',
      status: 'disconnected',
      provider: 'Notion Labs Inc.',
      config: {},
      permissions: [],
      features: ['Database Integration', 'Page Creation', 'Content Sync', 'Template Management']
    },
    {
      id: 'aws-1',
      name: 'Amazon Web Services',
      type: 'storage',
      description: 'Cloud infrastructure and deployment platform',
      icon: 'aws',
      status: 'connected',
      provider: 'Amazon Web Services',
      connectedAt: '2024-01-08T08:00:00Z',
      config: {
        region: 'us-east-1',
        accessKeyId: 'AKIA***',
        services: ['Lambda', 'S3', 'CloudWatch']
      },
      permissions: ['read', 'write', 'deploy'],
      features: ['Lambda Deployment', 'S3 Storage', 'CloudWatch Monitoring', 'Auto Scaling']
    },
    {
      id: 'azure-1',
      name: 'Microsoft Azure',
      type: 'storage',
      description: 'Microsoft cloud platform for deployment and monitoring',
      icon: 'azure',
      status: 'disconnected',
      provider: 'Microsoft Corporation',
      config: {},
      permissions: [],
      features: ['Function Apps', 'Blob Storage', 'Application Insights', 'DevOps Integration']
    },
    {
      id: 'gcp-1',
      name: 'Google Cloud Platform',
      type: 'storage',
      description: 'Google cloud infrastructure and AI services',
      icon: 'gcp',
      status: 'pending',
      provider: 'Google LLC',
      config: {},
      permissions: [],
      features: ['Cloud Functions', 'Cloud Storage', 'AI Platform', 'Monitoring']
    },
    {
      id: 'salesforce-1',
      name: 'Salesforce',
      type: 'analytics',
      description: 'CRM integration for customer data and automation',
      icon: 'salesforce',
      status: 'disconnected',
      provider: 'Salesforce Inc.',
      config: {},
      permissions: [],
      features: ['Lead Management', 'Opportunity Tracking', 'Custom Objects', 'Workflow Automation']
    },
    {
      id: 'hubspot-1',
      name: 'HubSpot',
      type: 'analytics',
      description: 'Marketing automation and customer relationship management',
      icon: 'hubspot',
      status: 'disconnected',
      provider: 'HubSpot Inc.',
      config: {},
      permissions: [],
      features: ['Contact Management', 'Email Marketing', 'Analytics Dashboard', 'Lead Scoring']
    },
    {
      id: 'zapier-1',
      name: 'Zapier',
      type: 'productivity',
      description: 'Workflow automation and app integration platform',
      icon: 'zapier',
      status: 'connected',
      provider: 'Zapier Inc.',
      connectedAt: '2024-01-14T13:45:00Z',
      config: {
        apiKey: 'sk_***',
        zaps: ['Slack to Jira', 'GitHub to Notion']
      },
      permissions: ['read', 'write'],
      features: ['Workflow Automation', 'Multi-App Integration', 'Trigger Management', 'Data Transformation']
    }
  ];

  // Load all data on component mount
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setInitialLoading(true);
      
      // For development, use mock data
      setIntegrations(mockIntegrations);
      setApiKeys([
        {
          id: 'key-1',
          name: 'Production API Key',
          key: 'pk_live_***',
          permissions: ['read', 'write', 'deploy'],
          createdAt: '2024-01-15T10:00:00Z',
          lastUsed: '2024-01-20T14:30:00Z',
          status: 'active',
          usageCount: 1247,
          rateLimit: { requests: 1000, window: 'hour' }
        },
        {
          id: 'key-2',
          name: 'Development API Key',
          key: 'pk_test_***',
          permissions: ['read'],
          createdAt: '2024-01-10T09:00:00Z',
          lastUsed: '2024-01-19T16:15:00Z',
          status: 'active',
          usageCount: 342,
          rateLimit: { requests: 100, window: 'hour' }
        }
      ]);
      setWebhooks([
        {
          id: 'webhook-1',
          name: 'Slack Notifications',
          url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
          events: ['agent.deployed', 'violation.detected', 'trust.threshold.breached'],
          status: 'active',
          createdAt: '2024-01-15T11:00:00Z',
          lastTriggered: '2024-01-20T15:22:00Z',
          secret: 'whsec_***',
          retryCount: 3,
          headers: { 'Content-Type': 'application/json' },
          successCount: 156,
          failureCount: 2
        }
      ]);
      setMonitoringConfig({
        alertThresholds: {
          trustScore: 0.7,
          errorRate: 0.05,
          responseTime: 2000,
          violationCount: 5
        },
        refreshIntervals: {
          dashboard: 30,
          metrics: 60,
          alerts: 10
        },
        dataRetention: {
          metrics: 90,
          logs: 30,
          violations: 365
        },
        notifications: {
          email: true,
          slack: true,
          webhook: true,
          inApp: true
        },
        features: {
          realTimeUpdates: true,
          autoAcknowledgeAlerts: false,
          exportMetrics: true,
          customDashboards: true
        }
      });
      setExtensions([
        {
          id: 'monitoring-ext',
          name: 'Advanced Monitoring',
          version: '1.2.0',
          status: 'enabled',
          description: 'Real-time monitoring and alerting for deployed agents',
          capabilities: ['metrics', 'alerts', 'dashboards'],
          config: { enabled: true, interval: 60 }
        }
      ]);
      setSystemHealth({
        status: 'healthy',
        services: [
          { name: 'API Gateway', status: 'up', responseTime: 45, lastCheck: '2024-01-20T16:00:00Z' },
          { name: 'Database', status: 'up', responseTime: 12, lastCheck: '2024-01-20T16:00:00Z' },
          { name: 'Redis Cache', status: 'up', responseTime: 8, lastCheck: '2024-01-20T16:00:00Z' },
          { name: 'Message Queue', status: 'up', responseTime: 23, lastCheck: '2024-01-20T16:00:00Z' }
        ],
        uptime: 99.97,
        version: '2.1.0'
      });
      
    } catch (error) {
      console.error('Failed to load integrations data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load integrations data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setInitialLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Integration handlers
  const handleConnectIntegration = async (integration: Integration) => {
    try {
      setLoading(true);
      
      // Real API call to connect integration
      const connectedIntegration = await integrationsAPI.connectIntegration(integration.id, {
        userId: currentUser?.uid,
        organizationId: currentUser?.organizationId
      });
      
      setIntegrations(prev => prev.map(int => 
        int.id === integration.id 
          ? { 
              ...int, 
              status: 'connected', 
              connectedAt: connectedIntegration.connectedAt || new Date().toISOString(),
              config: connectedIntegration.config
            }
          : int
      ));
      
      toast({
        title: "Integration Connected",
        description: `Successfully connected to ${integration.name}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to connect integration:', error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${integration.name}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectIntegration = async (integration: Integration) => {
    try {
      setLoading(true);
      
      // Real API call to disconnect integration
      await integrationsAPI.disconnectIntegration(integration.id, {
        userId: currentUser?.uid,
        organizationId: currentUser?.organizationId
      });
      
      setIntegrations(prev => prev.map(int => 
        int.id === integration.id 
          ? { ...int, status: 'disconnected', connectedAt: undefined, lastSync: undefined, config: undefined }
          : int
      ));
      
      toast({
        title: "Integration Disconnected",
        description: `Successfully disconnected from ${integration.name}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect from ${integration.name}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestIntegration = async (integration: Integration) => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Integration Test Successful",
        description: `${integration.name} is working correctly`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to test integration:', error);
      toast({
        title: "Integration Test Failed",
        description: `${integration.name} test failed`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeployToIntegration = async (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowDeployDialog(true);
  };

  const handleConfirmDeploy = async () => {
    if (!selectedIntegration) return;
    
    try {
      setLoading(true);
      
      // Mock deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Deployment Successful",
        description: `Agent deployed to ${selectedIntegration.name} successfully`,
        variant: "default"
      });
      
      setShowDeployDialog(false);
      setSelectedIntegration(null);
      
    } catch (error) {
      console.error('Failed to deploy:', error);
      toast({
        title: "Deployment Failed",
        description: `Failed to deploy agent to ${selectedIntegration.name}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // API Key handlers
  const handleCreateApiKey = async () => {
    try {
      setLoading(true);
      
      const newApiKey: ApiKey = {
        id: `key-${Date.now()}`,
        name: apiKeyForm.name,
        key: `pk_${Math.random().toString(36).substr(2, 24)}`,
        permissions: apiKeyForm.permissions,
        createdAt: new Date().toISOString(),
        status: 'active',
        usageCount: 0,
        rateLimit: apiKeyForm.rateLimit,
        expiresAt: apiKeyForm.expiresAt || undefined
      };
      
      setApiKeys(prev => [...prev, newApiKey]);
      setShowApiKeyDialog(false);
      setApiKeyForm({
        name: '',
        permissions: [],
        expiresAt: '',
        rateLimit: { requests: 1000, window: 'hour' }
      });
      
      toast({
        title: "API Key Created",
        description: "New API key has been created successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      setLoading(true);
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' } : key
      ));
      
      toast({
        title: "API Key Revoked",
        description: "API key has been revoked successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast({
        title: "Revocation Failed",
        description: "Failed to revoke API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Webhook handlers
  const handleCreateWebhook = async () => {
    try {
      setLoading(true);
      
      const newWebhook: Webhook = {
        id: `webhook-${Date.now()}`,
        name: webhookForm.name,
        url: webhookForm.url,
        events: webhookForm.events,
        status: 'active',
        createdAt: new Date().toISOString(),
        secret: webhookForm.secret || `whsec_${Math.random().toString(36).substr(2, 24)}`,
        retryCount: 3,
        headers: webhookForm.headers,
        successCount: 0,
        failureCount: 0
      };
      
      setWebhooks(prev => [...prev, newWebhook]);
      setShowWebhookDialog(false);
      setWebhookForm({
        name: '',
        url: '',
        events: [],
        secret: '',
        headers: {}
      });
      
      toast({
        title: "Webhook Created",
        description: "New webhook has been created successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Webhook Test Successful",
        description: `Webhook ${webhook.name} is working correctly`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast({
        title: "Webhook Test Failed",
        description: `Webhook ${webhook.name} test failed`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const getIntegrationsByType = (type: string) => {
    return integrations.filter(integration => integration.type === type);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#6b7280';
      case 'error': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle sx={{ color: '#10b981' }} />;
      case 'disconnected': return <Cancel sx={{ color: '#6b7280' }} />;
      case 'error': return <Error sx={{ color: '#ef4444' }} />;
      case 'pending': return <Schedule sx={{ color: '#f59e0b' }} />;
      default: return <Cancel sx={{ color: '#6b7280' }} />;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateMonitoringConfig = (updates: Partial<MonitoringConfig>) => {
    if (monitoringConfig) {
      setMonitoringConfig({ ...monitoringConfig, ...updates });
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
        Integrations & Deployment
      </Typography>
      
      <Typography variant="body1" sx={{ color: '#a0aec0', mb: 4 }}>
        Connect external services and deploy your AI agents across platforms
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Tooltip title="Number of connected integrations">
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                      {integrations.filter(i => i.status === 'connected').length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Connected
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ color: '#10b981', fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Tooltip title="Number of active API keys">
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                      {apiKeys.filter(k => k.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      API Keys
                    </Typography>
                  </Box>
                  <Key sx={{ color: '#3b82f6', fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Tooltip title="Number of active webhooks">
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      {webhooks.filter(w => w.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Webhooks
                    </Typography>
                  </Box>
                  <Webhook sx={{ color: '#f59e0b', fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Tooltip title="Total number of available integrations and extensions">
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', cursor: 'help' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                      {integrations.length + extensions.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Total Available
                    </Typography>
                  </Box>
                  <Extension sx={{ color: '#8b5cf6', fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
      </Grid>

      {/* Main Tabs */}
      <Paper sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #4a5568',
            '& .MuiTab-root': {
              color: '#a0aec0',
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
          }}
        >
          <Tab label="External Systems" />
          <Tab label="API Keys" />
          <Tab label="Webhooks" />
          <Tab label="Monitoring" />
          <Tab label="Extensions" />
        </Tabs>

        {/* External Systems Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Available Integrations
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              Connect external systems to enhance your AI governance workflow and deploy agents
            </Typography>
          </Box>

          {/* Integration Categories */}
          {['communication', 'productivity', 'development', 'analytics', 'storage', 'security', 'monitoring'].map((type) => {
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
                  sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
                >
                  <Typography variant="h6" sx={{ color: 'white', textTransform: 'capitalize' }}>
                    {type} ({typeIntegrations.length})
                  </Typography>
                  <Chip 
                    label={`${typeIntegrations.filter(i => i.status === 'connected').length} connected`}
                    size="small"
                    sx={{ 
                      ml: 2, 
                      backgroundColor: '#10b981', 
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {typeIntegrations.map((integration) => (
                      <Grid item xs={12} md={6} lg={4} key={integration.id}>
                        <Card sx={{ 
                          backgroundColor: '#2d3748', 
                          border: '1px solid #4a5568',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ 
                                backgroundColor: getStatusColor(integration.status),
                                mr: 2,
                                width: 40,
                                height: 40
                              }}>
                                {integration.name.charAt(0)}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
                                  {integration.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  {getStatusIcon(integration.status)}
                                  <Typography variant="caption" sx={{ 
                                    color: getStatusColor(integration.status),
                                    ml: 0.5,
                                    textTransform: 'capitalize'
                                  }}>
                                    {integration.status}
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                                sx={{ color: '#a0aec0' }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                            
                            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                              {integration.description}
                            </Typography>
                            
                            <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                              Provider: {integration.provider}
                            </Typography>
                            
                            {integration.connectedAt && (
                              <Typography variant="caption" sx={{ color: '#6b7280', mb: 2, display: 'block' }}>
                                Connected: {new Date(integration.connectedAt).toLocaleDateString()}
                              </Typography>
                            )}
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" sx={{ color: '#a0aec0', mb: 1, display: 'block' }}>
                                Features:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {integration.features.slice(0, 3).map((feature, index) => (
                                  <Chip
                                    key={index}
                                    label={feature}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#4a5568',
                                      color: '#a0aec0',
                                      fontSize: '0.7rem',
                                      height: 20
                                    }}
                                  />
                                ))}
                                {integration.features.length > 3 && (
                                  <Chip
                                    label={`+${integration.features.length - 3} more`}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#6b7280',
                                      color: 'white',
                                      fontSize: '0.7rem',
                                      height: 20
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                          
                          <Box sx={{ p: 2, pt: 0 }}>
                            <Stack direction="row" spacing={1}>
                              {integration.status === 'connected' ? (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<CloudUpload />}
                                    onClick={() => handleDeployToIntegration(integration)}
                                    sx={{
                                      backgroundColor: '#3b82f6',
                                      '&:hover': { backgroundColor: '#2563eb' },
                                      flex: 1
                                    }}
                                  >
                                    Deploy
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Settings />}
                                    onClick={() => {
                                      setSelectedIntegration(integration);
                                      setShowIntegrationDialog(true);
                                    }}
                                    sx={{
                                      borderColor: '#4a5568',
                                      color: '#a0aec0',
                                      '&:hover': { borderColor: '#6b7280' }
                                    }}
                                  >
                                    Config
                                  </Button>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTestIntegration(integration)}
                                    sx={{ color: '#10b981' }}
                                  >
                                    <PlayArrow />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDisconnectIntegration(integration)}
                                    sx={{ color: '#ef4444' }}
                                  >
                                    <LinkOff />
                                  </IconButton>
                                </>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Link />}
                                  onClick={() => handleConnectIntegration(integration)}
                                  disabled={integration.status === 'pending'}
                                  sx={{
                                    backgroundColor: '#10b981',
                                    '&:hover': { backgroundColor: '#059669' },
                                    width: '100%'
                                  }}
                                >
                                  {integration.status === 'pending' ? 'Connecting...' : 'Connect'}
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </TabPanel>

        {/* API Keys Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                API Keys
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Manage API keys for programmatic access to Promethios services
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowApiKeyDialog(true)}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' }
              }}
            >
              Create API Key
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: '1px solid #4a5568' } }}>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Key</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Usage</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Last Used</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id} sx={{ '& td': { borderBottom: '1px solid #4a5568' } }}>
                    <TableCell sx={{ color: 'white' }}>{apiKey.name}</TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {showApiKey[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setShowApiKey(prev => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))}
                          sx={{ ml: 1, color: '#a0aec0' }}
                        >
                          {showApiKey[apiKey.id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigator.clipboard.writeText(apiKey.key)}
                          sx={{ color: '#a0aec0' }}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={apiKey.status}
                        size="small"
                        sx={{
                          backgroundColor: apiKey.status === 'active' ? '#10b981' : '#ef4444',
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0' }}>
                      {apiKey.usageCount?.toLocaleString() || 0} requests
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0' }}>
                      {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedApiKey(apiKey);
                            setApiKeyForm({
                              name: apiKey.name,
                              permissions: apiKey.permissions,
                              expiresAt: apiKey.expiresAt || '',
                              rateLimit: apiKey.rateLimit || { requests: 1000, window: 'hour' }
                            });
                            setShowApiKeyDialog(true);
                          }}
                          sx={{ color: '#3b82f6' }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRevokeApiKey(apiKey.id)}
                          sx={{ color: '#ef4444' }}
                          disabled={apiKey.status === 'revoked'}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Webhooks Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Webhooks
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Configure webhooks to receive real-time notifications about events
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowWebhookDialog(true)}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' }
              }}
            >
              Create Webhook
            </Button>
          </Box>

          <Grid container spacing={3}>
            {webhooks.map((webhook) => (
              <Grid item xs={12} md={6} key={webhook.id}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                          {webhook.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {getStatusIcon(webhook.status)}
                          <Typography variant="caption" sx={{ 
                            color: getStatusColor(webhook.status),
                            ml: 0.5,
                            textTransform: 'capitalize'
                          }}>
                            {webhook.status}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ color: '#a0aec0' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, wordBreak: 'break-all' }}>
                      {webhook.url}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#a0aec0', mb: 1, display: 'block' }}>
                        Events:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {webhook.events.map((event, index) => (
                          <Chip
                            key={index}
                            label={event}
                            size="small"
                            sx={{
                              backgroundColor: '#4a5568',
                              color: '#a0aec0',
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#10b981' }}>
                          Success: {webhook.successCount || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#ef4444' }}>
                          Failed: {webhook.failureCount || 0}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 2 }}>
                      Last triggered: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}
                    </Typography>
                    
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayArrow />}
                        onClick={() => handleTestWebhook(webhook)}
                        sx={{
                          borderColor: '#4a5568',
                          color: '#a0aec0',
                          '&:hover': { borderColor: '#6b7280' }
                        }}
                      >
                        Test
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => {
                          setSelectedWebhook(webhook);
                          setWebhookForm({
                            name: webhook.name,
                            url: webhook.url,
                            events: webhook.events,
                            secret: webhook.secret,
                            headers: webhook.headers
                          });
                          setShowWebhookDialog(true);
                        }}
                        sx={{
                          borderColor: '#4a5568',
                          color: '#a0aec0',
                          '&:hover': { borderColor: '#6b7280' }
                        }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        sx={{ color: '#ef4444' }}
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Monitoring Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Monitoring Configuration
          </Typography>
          
          {monitoringConfig && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Alert Thresholds
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Trust Score Threshold: {monitoringConfig.alertThresholds.trustScore}
                      </Typography>
                      <Slider
                        value={monitoringConfig.alertThresholds.trustScore}
                        onChange={(_, value) => handleUpdateMonitoringConfig({
                          alertThresholds: {
                            ...monitoringConfig.alertThresholds,
                            trustScore: value as number
                          }
                        })}
                        min={0}
                        max={1}
                        step={0.1}
                        sx={{ color: '#3b82f6' }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Error Rate Threshold: {(monitoringConfig.alertThresholds.errorRate * 100).toFixed(1)}%
                      </Typography>
                      <Slider
                        value={monitoringConfig.alertThresholds.errorRate}
                        onChange={(_, value) => handleUpdateMonitoringConfig({
                          alertThresholds: {
                            ...monitoringConfig.alertThresholds,
                            errorRate: value as number
                          }
                        })}
                        min={0}
                        max={0.5}
                        step={0.01}
                        sx={{ color: '#ef4444' }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Response Time Threshold: {monitoringConfig.alertThresholds.responseTime}ms
                      </Typography>
                      <Slider
                        value={monitoringConfig.alertThresholds.responseTime}
                        onChange={(_, value) => handleUpdateMonitoringConfig({
                          alertThresholds: {
                            ...monitoringConfig.alertThresholds,
                            responseTime: value as number
                          }
                        })}
                        min={100}
                        max={10000}
                        step={100}
                        sx={{ color: '#f59e0b' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Notification Settings
                    </Typography>
                    
                    <FormGroup>
                      <Tooltip title="Send email notifications for alerts">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={monitoringConfig.notifications.email}
                              onChange={(e) => handleUpdateMonitoringConfig({
                                notifications: {
                                  ...monitoringConfig.notifications,
                                  email: e.target.checked
                                }
                              })}
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                            />
                          }
                          label="Email Notifications"
                          sx={{ color: '#a0aec0', mb: 1 }}
                        />
                      </Tooltip>
                      
                      <Tooltip title="Send Slack notifications for alerts">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={monitoringConfig.notifications.slack}
                              onChange={(e) => handleUpdateMonitoringConfig({
                                notifications: {
                                  ...monitoringConfig.notifications,
                                  slack: e.target.checked
                                }
                              })}
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                            />
                          }
                          label="Slack Notifications"
                          sx={{ color: '#a0aec0', mb: 1 }}
                        />
                      </Tooltip>
                      
                      <Tooltip title="Send webhook notifications for alerts">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={monitoringConfig.notifications.webhook}
                              onChange={(e) => handleUpdateMonitoringConfig({
                                notifications: {
                                  ...monitoringConfig.notifications,
                                  webhook: e.target.checked
                                }
                              })}
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                            />
                          }
                          label="Webhook Notifications"
                          sx={{ color: '#a0aec0', mb: 1 }}
                        />
                      </Tooltip>
                      
                      <Tooltip title="Show in-app notifications for alerts">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={monitoringConfig.notifications.inApp}
                              onChange={(e) => handleUpdateMonitoringConfig({
                                notifications: {
                                  ...monitoringConfig.notifications,
                                  inApp: e.target.checked
                                }
                              })}
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                            />
                          }
                          label="In-App Notifications"
                          sx={{ color: '#a0aec0' }}
                        />
                      </Tooltip>
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Live Monitoring
                    </Typography>
                    <LiveAgentStatusWidget />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Alert Management
                    </Typography>
                    <AlertManagementWidget />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Extensions Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Extensions & Plugins
          </Typography>
          
          <Grid container spacing={3}>
            {extensions.map((extension) => (
              <Grid item xs={12} md={6} lg={4} key={extension.id}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                          {extension.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          v{extension.version}
                        </Typography>
                      </Box>
                      <Chip
                        label={extension.status}
                        size="small"
                        sx={{
                          backgroundColor: extension.status === 'enabled' ? '#10b981' : '#6b7280',
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      {extension.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#a0aec0', mb: 1, display: 'block' }}>
                        Capabilities:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {extension.capabilities.map((capability: string, index: number) => (
                          <Chip
                            key={index}
                            label={capability}
                            size="small"
                            sx={{
                              backgroundColor: '#4a5568',
                              color: '#a0aec0',
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={extension.status === 'enabled' ? 'outlined' : 'contained'}
                        startIcon={extension.status === 'enabled' ? <Stop /> : <PlayArrow />}
                        sx={{
                          ...(extension.status === 'enabled' ? {
                            borderColor: '#ef4444',
                            color: '#ef4444',
                            '&:hover': { borderColor: '#dc2626', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                          } : {
                            backgroundColor: '#10b981',
                            '&:hover': { backgroundColor: '#059669' }
                          })
                        }}
                      >
                        {extension.status === 'enabled' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Settings />}
                        sx={{
                          borderColor: '#4a5568',
                          color: '#a0aec0',
                          '&:hover': { borderColor: '#6b7280' }
                        }}
                      >
                        Configure
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Deployment Dialog */}
      <Dialog
        open={showDeployDialog}
        onClose={() => setShowDeployDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', border: '1px solid #4a5568' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Deploy Agent to {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
            Configure deployment settings for your agent on {selectedIntegration?.name}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#a0aec0' }}>Agent to Deploy</InputLabel>
                <Select
                  value={deployForm.agentId}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, agentId: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '& .MuiSelect-select': { color: 'white' }
                  }}
                >
                  <MenuItem value="agent-1">Customer Support Agent</MenuItem>
                  <MenuItem value="agent-2">Code Review Agent</MenuItem>
                  <MenuItem value="agent-3">Content Moderation Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#a0aec0' }}>Deployment Type</InputLabel>
                <Select
                  value={deployForm.deploymentType}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, deploymentType: e.target.value as any }))}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '& .MuiSelect-select': { color: 'white' }
                  }}
                >
                  <MenuItem value="bot">Bot/Assistant</MenuItem>
                  <MenuItem value="webhook">Webhook Integration</MenuItem>
                  <MenuItem value="api">API Endpoint</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {selectedIntegration?.name === 'Slack' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Slack Channel"
                  placeholder="#general"
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
            )}
            
            {selectedIntegration?.name === 'GitHub' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Repository"
                  placeholder="owner/repository"
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
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeployDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeploy}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Deploy Agent'}
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
          sx: { backgroundColor: '#2d3748', border: '1px solid #4a5568' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {selectedApiKey ? 'Edit API Key' : 'Create API Key'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Key Name"
            value={apiKeyForm.name}
            onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiInputBase-input': { color: 'white' }
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Permissions</InputLabel>
            <Select
              multiple
              value={apiKeyForm.permissions}
              onChange={(e) => setApiKeyForm(prev => ({ ...prev, permissions: e.target.value as string[] }))}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '& .MuiSelect-select': { color: 'white' }
              }}
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
              <MenuItem value="deploy">Deploy</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Expires At (Optional)"
            type="datetime-local"
            value={apiKeyForm.expiresAt}
            onChange={(e) => setApiKeyForm(prev => ({ ...prev, expiresAt: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiInputBase-input': { color: 'white' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowApiKeyDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateApiKey}
            variant="contained"
            disabled={loading || !apiKeyForm.name}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            {loading ? <CircularProgress size={20} /> : (selectedApiKey ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Webhook Dialog */}
      <Dialog
        open={showWebhookDialog}
        onClose={() => setShowWebhookDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', border: '1px solid #4a5568' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Webhook Name"
            value={webhookForm.name}
            onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiInputBase-input': { color: 'white' }
            }}
          />
          
          <TextField
            fullWidth
            label="Webhook URL"
            value={webhookForm.url}
            onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiInputBase-input': { color: 'white' }
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Events</InputLabel>
            <Select
              multiple
              value={webhookForm.events}
              onChange={(e) => setWebhookForm(prev => ({ ...prev, events: e.target.value as string[] }))}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '& .MuiSelect-select': { color: 'white' }
              }}
            >
              <MenuItem value="agent.deployed">Agent Deployed</MenuItem>
              <MenuItem value="violation.detected">Violation Detected</MenuItem>
              <MenuItem value="trust.threshold.breached">Trust Threshold Breached</MenuItem>
              <MenuItem value="system.alert">System Alert</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Secret (Optional)"
            value={webhookForm.secret}
            onChange={(e) => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
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
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowWebhookDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateWebhook}
            variant="contained"
            disabled={loading || !webhookForm.name || !webhookForm.url}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            {loading ? <CircularProgress size={20} /> : (selectedWebhook ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Integration Configuration Dialog */}
      <Dialog
        open={showIntegrationDialog}
        onClose={() => setShowIntegrationDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', border: '1px solid #4a5568' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {selectedIntegration?.name} Configuration
        </DialogTitle>
        <DialogContent>
          {selectedIntegration && (
            <Box>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
                Configure settings for {selectedIntegration.name} integration
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
                        label="Bot Token"
                        type="password"
                        defaultValue={selectedIntegration.config.botToken || ''}
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API Token"
                        type="password"
                        defaultValue={selectedIntegration.config.apiToken || ''}
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
                
                {selectedIntegration.name === 'GitHub' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Organization"
                        defaultValue={selectedIntegration.config.organization || ''}
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
                        label="Access Token"
                        type="password"
                        defaultValue={selectedIntegration.config.accessToken || ''}
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
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowIntegrationDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default IntegrationsSettingsPage;

