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
  Error
} from '@mui/icons-material';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import integrationsAPI, { 
  Integration, 
  ApiKey, 
  Webhook, 
  MonitoringConfig 
} from '../services/api/integrationsAPI';
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

  const monitoringExtension = new MonitoringExtension();

  // Load all data on component mount
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setInitialLoading(true);
      
      const [
        integrationsData,
        apiKeysData,
        webhooksData,
        monitoringConfigData,
        extensionsData,
        systemHealthData
      ] = await Promise.all([
        integrationsAPI.getIntegrations(),
        integrationsAPI.getApiKeys(),
        integrationsAPI.getWebhooks(),
        integrationsAPI.getMonitoringConfig(),
        integrationsAPI.getExtensions(),
        integrationsAPI.getSystemHealth()
      ]);
      
      setIntegrations(integrationsData);
      setApiKeys(apiKeysData);
      setWebhooks(webhooksData);
      setMonitoringConfig(monitoringConfigData);
      setExtensions(extensionsData);
      setSystemHealth(systemHealthData);
      
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
  const handleConnectIntegration = async (integration: Integration, config: Record<string, any>) => {
    try {
      setLoading(true);
      const updatedIntegration = await integrationsAPI.connectIntegration(integration.id, config);
      
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? updatedIntegration : i
      ));
      
      toast({
        title: "Integration Connected",
        description: `Successfully connected ${integration.name}`,
        variant: "default"
      });
      
      setShowIntegrationDialog(false);
      
    } catch (error) {
      console.error('Failed to connect integration:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect integration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      setLoading(true);
      await integrationsAPI.disconnectIntegration(integrationId);
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'disconnected', connectedAt: undefined, lastSync: undefined }
          : integration
      ));
      
      toast({
        title: "Integration Disconnected",
        description: "Integration has been disconnected successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect integration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      setLoading(true);
      const result = await integrationsAPI.testIntegration(integrationId);
      
      toast({
        title: result.success ? "Test Successful" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error('Failed to test integration:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test integration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      setLoading(true);
      await integrationsAPI.syncIntegration(integrationId);
      
      // Refresh integration data
      const updatedIntegration = await integrationsAPI.getIntegration(integrationId);
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId ? updatedIntegration : i
      ));
      
      toast({
        title: "Sync Complete",
        description: "Integration data has been synchronized",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to sync integration:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync integration",
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
      const newApiKey = await integrationsAPI.createApiKey(apiKeyForm);
      
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
        description: error.message || "Failed to create API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiKey = async () => {
    if (!selectedApiKey) return;
    
    try {
      setLoading(true);
      const updatedApiKey = await integrationsAPI.updateApiKey(selectedApiKey.id, {
        name: apiKeyForm.name,
        permissions: apiKeyForm.permissions,
        expiresAt: apiKeyForm.expiresAt || undefined
      });
      
      setApiKeys(prev => prev.map(key => 
        key.id === selectedApiKey.id ? updatedApiKey : key
      ));
      
      setShowApiKeyDialog(false);
      setSelectedApiKey(null);
      
      toast({
        title: "API Key Updated",
        description: "API key has been updated successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to update API key:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      setLoading(true);
      await integrationsAPI.revokeApiKey(keyId);
      
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
        description: error.message || "Failed to revoke API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateApiKey = async (keyId: string) => {
    try {
      setLoading(true);
      const newApiKey = await integrationsAPI.regenerateApiKey(keyId);
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? newApiKey : key
      ));
      
      toast({
        title: "API Key Regenerated",
        description: "New API key has been generated. Please update your applications.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate API key",
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
      const newWebhook = await integrationsAPI.createWebhook(webhookForm);
      
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
        description: error.message || "Failed to create webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return;
    
    try {
      setLoading(true);
      const updatedWebhook = await integrationsAPI.updateWebhook(selectedWebhook.id, webhookForm);
      
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === selectedWebhook.id ? updatedWebhook : webhook
      ));
      
      setShowWebhookDialog(false);
      setSelectedWebhook(null);
      
      toast({
        title: "Webhook Updated",
        description: "Webhook has been updated successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to update webhook:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      await integrationsAPI.deleteWebhook(webhookId);
      
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
      
      toast({
        title: "Webhook Deleted",
        description: "Webhook has been deleted successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      const result = await integrationsAPI.testWebhook(webhookId);
      
      toast({
        title: result.success ? "Test Successful" : "Test Failed",
        description: result.success ? "Webhook test completed successfully" : "Webhook test failed",
        variant: result.success ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Monitoring configuration handlers
  const handleUpdateMonitoringConfig = async (newConfig: Partial<MonitoringConfig>) => {
    try {
      setLoading(true);
      const updatedConfig = await integrationsAPI.updateMonitoringConfig(newConfig);
      
      setMonitoringConfig(updatedConfig);
      
      // Update monitoring extension with new config
      await monitoringExtension.updateConfig(newConfig);
      
      toast({
        title: "Configuration Updated",
        description: "Monitoring configuration has been updated successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to update monitoring config:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update monitoring configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetMonitoringConfig = async () => {
    try {
      setLoading(true);
      const resetConfig = await integrationsAPI.resetMonitoringConfig();
      
      setMonitoringConfig(resetConfig);
      
      toast({
        title: "Configuration Reset",
        description: "Monitoring configuration has been reset to defaults",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to reset monitoring config:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset monitoring configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Extension handlers
  const handleToggleExtension = async (extensionId: string, enabled: boolean) => {
    try {
      setLoading(true);
      
      if (enabled) {
        await integrationsAPI.enableExtension(extensionId);
      } else {
        await integrationsAPI.disableExtension(extensionId);
      }
      
      setExtensions(prev => prev.map(ext => 
        ext.id === extensionId ? { ...ext, status: enabled ? 'enabled' : 'disabled' } : ext
      ));
      
      toast({
        title: `Extension ${enabled ? 'Enabled' : 'Disabled'}`,
        description: `Extension has been ${enabled ? 'enabled' : 'disabled'} successfully`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to toggle extension:', error);
      toast({
        title: "Toggle Failed",
        description: error.message || "Failed to toggle extension",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbarMessage('Copied to clipboard');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
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
      case 'active':
      case 'enabled':
      case 'healthy': return '#10b981';
      case 'disconnected':
      case 'inactive':
      case 'disabled': return '#6b7280';
      case 'error':
      case 'down': return '#ef4444';
      case 'pending':
      case 'degraded': return '#f59e0b';
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
      case 'monitoring': return <MonitorHeart />;
      default: return <Hub />;
    }
  };

  const getIntegrationsByType = (type: string) => {
    return integrations.filter(integration => integration.type === type);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportConfig = async () => {
    try {
      setLoading(true);
      const blob = await integrationsAPI.exportConfiguration();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promethios-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "Configuration has been exported successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to export configuration:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        backgroundColor: '#1a202c'
      }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
        <Typography variant="h6" sx={{ ml: 2, color: '#a0aec0' }}>
          Loading integrations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Integrations & Monitoring
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Connect external systems, manage API access, and configure monitoring for your organization
        </Typography>
      </Box>

      {/* System Health Alert */}
      {systemHealth && systemHealth.status !== 'healthy' && (
        <Alert 
          severity={systemHealth.status === 'down' ? 'error' : 'warning'} 
          sx={{ mb: 3, backgroundColor: '#2d3748', border: '1px solid #4a5568' }}
        >
          <AlertTitle>System Health: {systemHealth.status}</AlertTitle>
          Some services may be experiencing issues. Check the Configuration tab for details.
        </Alert>
      )}

      {/* Integration Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Tooltip title="Number of successfully connected integrations">
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', cursor: 'help' }}>
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
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Tooltip title="Number of active API keys for external access">
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', cursor: 'help' }}>
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
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Tooltip title="Number of active webhooks for real-time notifications">
            <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', cursor: 'help' }}>
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
            <Tab icon={<MonitorHeart />} label="Monitoring" />
            <Tab icon={<Extension />} label="Extensions" />
            <Tab icon={<Settings />} label="Configuration" />
          </Tabs>
        </Box>

        {/* External Systems Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Available Integrations
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              Connect external systems to enhance your AI governance workflow
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
                                sx={{ width: 40, height: 40, mr: 2, backgroundColor: '#4a5568' }}
                              >
                                {getTypeIcon(integration.type)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ color: 'white' }}>
                                  {integration.name}
                                </Typography>
                                <Chip
                                  label={integration.status}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStatusColor(integration.status),
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </Box>
                              <IconButton
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
                                Connected: {formatDate(integration.connectedAt)}
                              </Typography>
                            )}
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                              {integration.features.slice(0, 2).map((feature, index) => (
                                <Chip
                                  key={index}
                                  label={feature}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    borderColor: '#4a5568', 
                                    color: '#a0aec0',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              ))}
                              {integration.features.length > 2 && (
                                <Chip
                                  label={`+${integration.features.length - 2} more`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    borderColor: '#4a5568', 
                                    color: '#a0aec0',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {integration.status === 'connected' ? (
                                <>
                                  <Tooltip title="Test connection to verify integration is working">
                                    <Button
                                      size="small"
                                      startIcon={<PlayArrow />}
                                      onClick={() => handleTestIntegration(integration.id)}
                                      disabled={loading}
                                      sx={{ color: '#3b82f6' }}
                                    >
                                      Test
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title="Synchronize data with external system">
                                    <Button
                                      size="small"
                                      startIcon={<Refresh />}
                                      onClick={() => handleSyncIntegration(integration.id)}
                                      disabled={loading}
                                      sx={{ color: '#10b981' }}
                                    >
                                      Sync
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title="Disconnect this integration">
                                    <Button
                                      size="small"
                                      startIcon={<LinkOff />}
                                      onClick={() => handleDisconnectIntegration(integration.id)}
                                      disabled={loading}
                                      sx={{ color: '#ef4444' }}
                                    >
                                      Disconnect
                                    </Button>
                                  </Tooltip>
                                </>
                              ) : (
                                <Tooltip title="Connect this integration to start using it">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<Link />}
                                    onClick={() => {
                                      setSelectedIntegration(integration);
                                      setShowIntegrationDialog(true);
                                    }}
                                    disabled={loading}
                                    sx={{ 
                                      backgroundColor: '#3b82f6', 
                                      '&:hover': { backgroundColor: '#2563eb' } 
                                    }}
                                  >
                                    Connect
                                  </Button>
                                </Tooltip>
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

        {/* API Keys Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                API Keys
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Manage API keys for external access to your Promethios instance
              </Typography>
            </Box>
            <Tooltip title="Create a new API key for external applications">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSelectedApiKey(null);
                  setApiKeyForm({
                    name: '',
                    permissions: [],
                    expiresAt: '',
                    rateLimit: { requests: 1000, window: 'hour' }
                  });
                  setShowApiKeyDialog(true);
                }}
                sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
              >
                Create API Key
              </Button>
            </Tooltip>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid #4a5568' }}>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Key</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Permissions</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Last Used</TableCell>
                  <TableCell sx={{ color: '#a0aec0', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id} sx={{ borderBottom: '1px solid #4a5568' }}>
                    <TableCell sx={{ color: 'white' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {apiKey.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          Created: {formatDate(apiKey.createdAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {showApiKey[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </Typography>
                        <Tooltip title={showApiKey[apiKey.id] ? "Hide API key" : "Show API key"}>
                          <IconButton
                            size="small"
                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                            sx={{ color: '#a0aec0' }}
                          >
                            {showApiKey[apiKey.id] ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy API key to clipboard">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(apiKey.key)}
                            sx={{ color: '#a0aec0' }}
                          >
                            <ContentCopy />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {apiKey.permissions.slice(0, 2).map((permission, index) => (
                          <Chip
                            key={index}
                            label={permission}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: '#4a5568', 
                              color: '#a0aec0',
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                        {apiKey.permissions.length > 2 && (
                          <Chip
                            label={`+${apiKey.permissions.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: '#4a5568', 
                              color: '#a0aec0',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Chip
                        label={apiKey.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(apiKey.status),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0' }}>
                      {formatDate(apiKey.lastUsed)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit API key settings">
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
                        </Tooltip>
                        <Tooltip title="Regenerate API key">
                          <IconButton
                            size="small"
                            onClick={() => handleRegenerateApiKey(apiKey.id)}
                            disabled={loading || apiKey.status === 'revoked'}
                            sx={{ color: '#f59e0b' }}
                          >
                            <RestartAlt />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revoke API key">
                          <IconButton
                            size="small"
                            onClick={() => handleRevokeApiKey(apiKey.id)}
                            disabled={loading || apiKey.status === 'revoked'}
                            sx={{ color: '#ef4444' }}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
            <Tooltip title="Create a new webhook endpoint">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSelectedWebhook(null);
                  setWebhookForm({
                    name: '',
                    url: '',
                    events: [],
                    secret: '',
                    headers: {}
                  });
                  setShowWebhookDialog(true);
                }}
                sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
              >
                Create Webhook
              </Button>
            </Tooltip>
          </Box>

          <Grid container spacing={3}>
            {webhooks.map((webhook) => (
              <Grid item xs={12} md={6} lg={4} key={webhook.id}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                          {webhook.name}
                        </Typography>
                        <Chip
                          label={webhook.status}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(webhook.status),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                      <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ color: '#a0aec0' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, wordBreak: 'break-all' }}>
                      {webhook.url}
                    </Typography>
                    
                    <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                      Events ({webhook.events.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {webhook.events.slice(0, 3).map((event, index) => (
                        <Chip
                          key={index}
                          label={event}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: '#4a5568', 
                            color: '#a0aec0',
                            fontSize: '0.7rem'
                          }}
                        />
                      ))}
                      {webhook.events.length > 3 && (
                        <Chip
                          label={`+${webhook.events.length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: '#4a5568', 
                            color: '#a0aec0',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                    
                    <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                      Last triggered: {formatDate(webhook.lastTriggered)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Tooltip title="Test webhook endpoint">
                        <Button
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={loading}
                          sx={{ color: '#3b82f6' }}
                        >
                          Test
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit webhook configuration">
                        <Button
                          size="small"
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
                          disabled={loading}
                          sx={{ color: '#10b981' }}
                        >
                          Edit
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete webhook">
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          disabled={loading}
                          sx={{ color: '#ef4444' }}
                        >
                          Delete
                        </Button>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Monitoring Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Monitoring Configuration
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              Configure real-time monitoring, alerts, and data retention for deployed agents
            </Typography>
          </Box>

          {monitoringConfig && (
            <Grid container spacing={3}>
              {/* Alert Thresholds */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Warning sx={{ mr: 1, color: '#f59e0b' }} />
                      Alert Thresholds
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Trust Score Threshold: {monitoringConfig.alertThresholds.trustScore}
                      </Typography>
                      <Tooltip title="Alert when agent trust score falls below this value">
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
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#3b82f6' }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Error Rate Threshold: {monitoringConfig.alertThresholds.errorRate}%
                      </Typography>
                      <Tooltip title="Alert when error rate exceeds this percentage">
                        <Slider
                          value={monitoringConfig.alertThresholds.errorRate}
                          onChange={(_, value) => handleUpdateMonitoringConfig({
                            alertThresholds: {
                              ...monitoringConfig.alertThresholds,
                              errorRate: value as number
                            }
                          })}
                          min={0}
                          max={100}
                          step={5}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#ef4444' }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Response Time Threshold: {monitoringConfig.alertThresholds.responseTime}ms
                      </Typography>
                      <Tooltip title="Alert when response time exceeds this value in milliseconds">
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
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#f59e0b' }}
                        />
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Refresh Intervals */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Timer sx={{ mr: 1, color: '#10b981' }} />
                      Refresh Intervals
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Dashboard Refresh: {monitoringConfig.refreshIntervals.dashboard}s
                      </Typography>
                      <Tooltip title="How often the dashboard updates with new data">
                        <Slider
                          value={monitoringConfig.refreshIntervals.dashboard}
                          onChange={(_, value) => handleUpdateMonitoringConfig({
                            refreshIntervals: {
                              ...monitoringConfig.refreshIntervals,
                              dashboard: value as number
                            }
                          })}
                          min={5}
                          max={300}
                          step={5}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#3b82f6' }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Metrics Collection: {monitoringConfig.refreshIntervals.metrics}s
                      </Typography>
                      <Tooltip title="How often metrics are collected from agents">
                        <Slider
                          value={monitoringConfig.refreshIntervals.metrics}
                          onChange={(_, value) => handleUpdateMonitoringConfig({
                            refreshIntervals: {
                              ...monitoringConfig.refreshIntervals,
                              metrics: value as number
                            }
                          })}
                          min={10}
                          max={600}
                          step={10}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#10b981' }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Alert Processing: {monitoringConfig.refreshIntervals.alerts}s
                      </Typography>
                      <Tooltip title="How often alerts are processed and notifications sent">
                        <Slider
                          value={monitoringConfig.refreshIntervals.alerts}
                          onChange={(_, value) => handleUpdateMonitoringConfig({
                            refreshIntervals: {
                              ...monitoringConfig.refreshIntervals,
                              alerts: value as number
                            }
                          })}
                          min={5}
                          max={120}
                          step={5}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#f59e0b' }}
                        />
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Data Retention */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <DataUsage sx={{ mr: 1, color: '#8b5cf6' }} />
                      Data Retention
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Metrics Retention: {monitoringConfig.dataRetention.metrics} days
                      </Typography>
                      <Tooltip title="How long to keep metrics data">
                        <Slider
                          value={monitoringConfig.dataRetention.metrics}
                          onChange={(_, value) => handleUpdateMonitoringConfig({
                            dataRetention: {
                              ...monitoringConfig.dataRetention,
                              metrics: value as number
                            }
                          })}
                          min={7}
                          max={365}
                          step={7}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#3b82f6' }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Logs Retention: {monitoringConfig.dataRetention.logs} days
                      </Typography>
                      <Tooltip title="How long to keep log data">
                        <Slider
                          value={monitoringConfig.dataRetention.logs}
                          onChange={(_, value) => handleUpdateMonitoringConfig({
                            dataRetention: {
                              ...monitoringConfig.dataRetention,
                              logs: value as number
                            }
                          })}
                          min={7}
                          max={180}
                          step={7}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#10b981' }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Violations Retention: {monitoringConfig.dataRetention.violations} days
                      </Typography>
                      <Tooltip title="How long to keep violation records">
                        <Slider
                          value={monitoringConfig.dataRetention.violations}
                          onChange={(_, value) => handleUpdateMonitoringConfig({
                            dataRetention: {
                              ...monitoringConfig.dataRetention,
                              violations: value as number
                            }
                          })}
                          min={30}
                          max={1095}
                          step={30}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ color: '#ef4444' }}
                        />
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Notification Settings */}
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <NotificationsActive sx={{ mr: 1, color: '#f59e0b' }} />
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

              {/* Live Monitoring Widgets */}
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <MonitorHeart sx={{ mr: 1, color: '#10b981' }} />
                      Live Agent Monitoring
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <LiveAgentStatusWidget />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <AlertManagementWidget />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Reset Configuration */}
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                          Reset Configuration
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Reset all monitoring settings to their default values
                        </Typography>
                      </Box>
                      <Tooltip title="Reset all monitoring configuration to default values">
                        <Button
                          variant="outlined"
                          startIcon={<RestartAlt />}
                          onClick={handleResetMonitoringConfig}
                          disabled={loading}
                          sx={{ 
                            borderColor: '#ef4444', 
                            color: '#ef4444',
                            '&:hover': { borderColor: '#dc2626', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                          }}
                        >
                          Reset to Defaults
                        </Button>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Extensions Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Extensions
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              Manage and configure extensions that extend Promethios functionality
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {extensions.map((extension) => (
              <Grid item xs={12} md={6} lg={4} key={extension.id}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                          {extension.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                          Version: {extension.version}
                        </Typography>
                        <Chip
                          label={extension.status}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(extension.status),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                      <Tooltip title={extension.status === 'enabled' ? "Disable extension" : "Enable extension"}>
                        <Switch
                          checked={extension.status === 'enabled'}
                          onChange={(e) => handleToggleExtension(extension.id, e.target.checked)}
                          disabled={loading}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      {extension.description}
                    </Typography>
                    
                    <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                      Capabilities:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {extension.capabilities.slice(0, 3).map((capability, index) => (
                        <Chip
                          key={index}
                          label={capability}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: '#4a5568', 
                            color: '#a0aec0',
                            fontSize: '0.7rem'
                          }}
                        />
                      ))}
                      {extension.capabilities.length > 3 && (
                        <Chip
                          label={`+${extension.capabilities.length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: '#4a5568', 
                            color: '#a0aec0',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                    
                    {extension.status === 'enabled' && (
                      <Tooltip title="Configure extension settings">
                        <Button
                          size="small"
                          startIcon={<Tune />}
                          sx={{ color: '#3b82f6' }}
                        >
                          Configure
                        </Button>
                      </Tooltip>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Configuration Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              System Configuration
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              System health, backup, and advanced configuration options
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* System Health */}
            {systemHealth && (
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <HealthAndSafety sx={{ mr: 1, color: getStatusColor(systemHealth.status) }} />
                      System Health
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Overall Status: 
                        <Chip
                          label={systemHealth.status}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(systemHealth.status),
                            color: 'white',
                            fontSize: '0.75rem',
                            ml: 1
                          }}
                        />
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Uptime: {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                        Version: {systemHealth.version}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Services:
                    </Typography>
                    {systemHealth.services.map((service, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {service.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {service.responseTime}ms
                          </Typography>
                          <Chip
                            label={service.status}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(service.status),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Backup & Export */}
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Download sx={{ mr: 1, color: '#3b82f6' }} />
                    Backup & Export
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
                    Export your configuration for backup or migration purposes
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                    <Tooltip title="Export all integrations, API keys, webhooks, and monitoring configuration">
                      <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={handleExportConfig}
                        disabled={loading}
                        sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                      >
                        Export Configuration
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Import configuration from a previously exported file">
                      <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        component="label"
                        disabled={loading}
                        sx={{ 
                          borderColor: '#4a5568', 
                          color: '#a0aec0',
                          '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' }
                        }}
                      >
                        Import Configuration
                        <input
                          type="file"
                          hidden
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Handle file import
                              console.log('Import file:', file);
                            }
                          }}
                        />
                      </Button>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* API Key Dialog */}
      <Dialog 
        open={showApiKeyDialog} 
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }
        }}
      >
        <DialogTitle>
          {selectedApiKey ? 'Edit API Key' : 'Create API Key'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Tooltip title="A descriptive name for this API key">
                <TextField
                  fullWidth
                  label="API Key Name"
                  value={apiKeyForm.name}
                  onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
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
              </Tooltip>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Permissions</InputLabel>
                <Tooltip title="Select the permissions this API key should have">
                  <Select
                    multiple
                    value={apiKeyForm.permissions}
                    onChange={(e) => setApiKeyForm(prev => ({ 
                      ...prev, 
                      permissions: typeof e.target.value === 'string' ? [e.target.value] : e.target.value 
                    }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '& .MuiInputBase-input': { color: 'white' }
                    }}
                  >
                    {['read:all', 'write:agents', 'write:policies', 'write:integrations', 'admin:all'].map((permission) => (
                      <MenuItem key={permission} value={permission}>
                        {permission}
                      </MenuItem>
                    ))}
                  </Select>
                </Tooltip>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Tooltip title="Optional expiration date for this API key">
                <TextField
                  fullWidth
                  label="Expires At (Optional)"
                  type="datetime-local"
                  value={apiKeyForm.expiresAt}
                  onChange={(e) => setApiKeyForm(prev => ({ ...prev, expiresAt: e.target.value }))}
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
              </Tooltip>
            </Grid>
            <Grid item xs={12} md={6}>
              <Tooltip title="Rate limit for this API key (requests per hour)">
                <TextField
                  fullWidth
                  label="Rate Limit (requests/hour)"
                  type="number"
                  value={apiKeyForm.rateLimit.requests}
                  onChange={(e) => setApiKeyForm(prev => ({ 
                    ...prev, 
                    rateLimit: { ...prev.rateLimit, requests: parseInt(e.target.value) || 1000 }
                  }))}
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
              </Tooltip>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={selectedApiKey ? handleUpdateApiKey : handleCreateApiKey}
            disabled={loading || !apiKeyForm.name || apiKeyForm.permissions.length === 0}
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {selectedApiKey ? 'Update API Key' : 'Create API Key'}
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
          sx: { backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }
        }}
      >
        <DialogTitle>
          {selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Tooltip title="A descriptive name for this webhook">
                <TextField
                  fullWidth
                  label="Webhook Name"
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
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
              </Tooltip>
            </Grid>
            <Grid item xs={12}>
              <Tooltip title="The URL endpoint where webhook events will be sent">
                <TextField
                  fullWidth
                  label="Endpoint URL"
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
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
              </Tooltip>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                Events to Subscribe
              </Typography>
              <FormGroup>
                {[
                  'agent.created',
                  'agent.updated', 
                  'policy.violated',
                  'trust.threshold.breached',
                  'compliance.report.generated',
                  'system.error'
                ].map((event) => (
                  <Tooltip key={event} title={`Subscribe to ${event} events`}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={webhookForm.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWebhookForm(prev => ({ 
                                ...prev, 
                                events: [...prev.events, event] 
                              }));
                            } else {
                              setWebhookForm(prev => ({ 
                                ...prev, 
                                events: prev.events.filter(e => e !== event) 
                              }));
                            }
                          }}
                          sx={{ '& .MuiSvgIcon-root': { color: '#3b82f6' } }}
                        />
                      }
                      label={event}
                      sx={{ color: '#a0aec0' }}
                    />
                  </Tooltip>
                ))}
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Tooltip title="Optional secret for webhook signature verification">
                <TextField
                  fullWidth
                  label="Secret (optional)"
                  value={webhookForm.secret}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
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
              </Tooltip>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWebhookDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={selectedWebhook ? handleUpdateWebhook : handleCreateWebhook}
            disabled={loading || !webhookForm.name || !webhookForm.url || webhookForm.events.length === 0}
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {selectedWebhook ? 'Update Webhook' : 'Create Webhook'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress sx={{ color: '#3b82f6' }} />
        </Box>
      )}

      {/* Snackbar for clipboard feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#2d3748',
            color: 'white'
          }
        }}
      />
    </Box>
  );
};

export default IntegrationsSettingsPage;

