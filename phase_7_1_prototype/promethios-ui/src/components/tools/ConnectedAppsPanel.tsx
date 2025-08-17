import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Stack,
  Grid,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Launch as LaunchIcon,
  Sync as SyncIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Cable as CableIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { connectedAppsService, ConnectedApp, ConnectedAppAction } from '../../services/ConnectedAppsService';

interface ConnectedAppsPanelProps {
  onClose?: () => void;
  onAppConnect?: (app: ConnectedApp) => void;
  onAppDisconnect?: (app: ConnectedApp) => void;
}

const ConnectedAppsPanel: React.FC<ConnectedAppsPanelProps> = ({
  onClose,
  onAppConnect,
  onAppDisconnect
}) => {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ConnectedApp | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const categories = [
    { id: 'all', label: 'All Apps', icon: '🔗' },
    { id: 'productivity', label: 'Productivity', icon: '📋' },
    { id: 'storage', label: 'Storage', icon: '💾' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'development', label: 'Development', icon: '⚡' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'business', label: 'Business', icon: '🚀' }
  ];

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const allApps = await connectedAppsService.getAllApps();
      setApps(allApps);
    } catch (error) {
      console.error('Failed to load connected apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApps = () => {
    let filtered = apps;

    // Filter by category
    if (selectedTab > 0) {
      const category = categories[selectedTab].id;
      filtered = filtered.filter(app => app.category === category);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.provider.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'error': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon sx={{ color: '#10b981' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#ef4444' }} />;
      case 'pending': return <WarningIcon sx={{ color: '#f59e0b' }} />;
      default: return <CableIcon sx={{ color: '#6b7280' }} />;
    }
  };

  const handleConnect = async (app: ConnectedApp) => {
    try {
      setLoading(true);
      const connectedApp = await connectedAppsService.connectApp(app.id);
      
      // Update local state
      setApps(prev => prev.map(a => a.id === app.id ? connectedApp : a));
      
      // Notify parent component
      onAppConnect?.(connectedApp);
      
      console.log(`✅ Connected to ${app.name}`);
    } catch (error) {
      console.error(`Failed to connect to ${app.name}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (app: ConnectedApp) => {
    try {
      setLoading(true);
      await connectedAppsService.disconnectApp(app.id);
      
      // Update local state
      setApps(prev => prev.map(a => 
        a.id === app.id ? { ...a, status: 'disconnected', connectedAt: undefined } : a
      ));
      
      // Notify parent component
      onAppDisconnect?.(app);
      
      console.log(`✅ Disconnected from ${app.name}`);
    } catch (error) {
      console.error(`Failed to disconnect from ${app.name}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (app: ConnectedApp) => {
    try {
      const result = await connectedAppsService.testApp(app.id);
      setTestResults(prev => ({ ...prev, [app.id]: result }));
      
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[app.id];
          return newResults;
        });
      }, 3000);
    } catch (error) {
      console.error(`Failed to test ${app.name}:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [app.id]: { success: false, message: 'Test failed' }
      }));
    }
  };

  const handleSync = async (app: ConnectedApp) => {
    try {
      await connectedAppsService.syncApp(app.id);
      
      // Update last sync time
      setApps(prev => prev.map(a => 
        a.id === app.id ? { ...a, lastSync: new Date().toISOString() } : a
      ));
      
      console.log(`✅ Synced ${app.name}`);
    } catch (error) {
      console.error(`Failed to sync ${app.name}:`, error);
    }
  };

  const renderAppCard = (app: ConnectedApp) => {
    const testResult = testResults[app.id];
    
    return (
      <Card
        key={app.id}
        sx={{
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#3b82f6',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'transparent', width: 40, height: 40, fontSize: '1.5rem' }}>
                {app.icon}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                  {app.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {app.provider}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(app.status)}
              <IconButton
                size="small"
                onClick={(e) => {
                  setSelectedApp(app);
                  setActionMenuAnchor(e.currentTarget);
                }}
                sx={{ color: '#94a3b8' }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, fontSize: '0.8rem' }}>
            {app.description}
          </Typography>

          {/* Status and Connection Info */}
          <Box sx={{ mb: 2 }}>
            <Chip
              label={app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              size="small"
              sx={{
                bgcolor: getStatusColor(app.status) + '20',
                color: getStatusColor(app.status),
                fontSize: '0.7rem',
                height: 20
              }}
            />
            {app.connectedAt && (
              <Typography variant="caption" sx={{ color: '#64748b', ml: 1, fontSize: '0.7rem' }}>
                Connected {new Date(app.connectedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>

          {/* Features */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {app.features.slice(0, 3).map((feature) => (
                <Chip
                  key={feature}
                  label={feature.replace(/_/g, ' ')}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#475569',
                    color: '#94a3b8',
                    fontSize: '0.6rem',
                    height: 18,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ))}
              {app.features.length > 3 && (
                <Chip
                  label={`+${app.features.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#475569',
                    color: '#94a3b8',
                    fontSize: '0.6rem',
                    height: 18
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Test Result */}
          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              sx={{ mb: 2, fontSize: '0.7rem', py: 0 }}
            >
              {testResult.message}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            {app.status === 'connected' ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SyncIcon />}
                  onClick={() => handleSync(app)}
                  sx={{
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    fontSize: '0.7rem',
                    '&:hover': {
                      borderColor: '#2563eb',
                      bgcolor: 'rgba(59, 130, 246, 0.1)'
                    }
                  }}
                >
                  Sync
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDisconnect(app)}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    fontSize: '0.7rem',
                    '&:hover': {
                      borderColor: '#dc2626',
                      bgcolor: 'rgba(239, 68, 68, 0.1)'
                    }
                  }}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<CableIcon />}
                onClick={() => handleConnect(app)}
                sx={{
                  bgcolor: '#3b82f6',
                  fontSize: '0.7rem',
                  '&:hover': { bgcolor: '#2563eb' }
                }}
              >
                Connect
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      maxHeight: '100vh',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #334155', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#3b82f6' }}>
              <CableIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Connected Apps
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Manage your app integrations and connections
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={loadApps}
              sx={{ color: '#94a3b8' }}
            >
              <RefreshIcon />
            </IconButton>
            {onClose && (
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  borderColor: '#475569',
                  color: '#94a3b8',
                  '&:hover': {
                    borderColor: '#64748b',
                    bgcolor: 'rgba(148, 163, 184, 0.1)',
                  }
                }}
              >
                Close
              </Button>
            )}
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                {apps.filter(app => app.status === 'connected').length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Connected
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {apps.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Total Apps
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                {categories.length - 1}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Categories
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Search */}
      <Box sx={{ p: 3, borderBottom: '1px solid #334155', flexShrink: 0 }}>
        <TextField
          fullWidth
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0f172a',
              color: 'white',
              '& fieldset': { borderColor: '#334155' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
            }
          }}
        />
      </Box>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155', flexShrink: 0 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              minHeight: 48,
              fontSize: '0.8rem',
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
          }}
        >
          {categories.map((category, index) => (
            <Tab
              key={category.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{category.icon}</span>
                  {category.label}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Apps Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {getFilteredApps().map((app) => (
              <Grid item xs={12} key={app.id}>
                {renderAppCard(app)}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': { bgcolor: '#374151' }
            }
          }
        }}
      >
        {selectedApp && (
          <>
            <MenuItem onClick={() => {
              handleTest(selectedApp);
              setActionMenuAnchor(null);
            }}>
              <CheckCircleIcon sx={{ mr: 2 }} />
              Test Connection
            </MenuItem>
            <MenuItem onClick={() => {
              setConfigDialogOpen(true);
              setActionMenuAnchor(null);
            }}>
              <SettingsIcon sx={{ mr: 2 }} />
              Configure
            </MenuItem>
            <Divider sx={{ borderColor: '#334155' }} />
            <MenuItem onClick={() => {
              if (selectedApp.oauthUrl) {
                window.open(selectedApp.oauthUrl, '_blank');
              }
              setActionMenuAnchor(null);
            }}>
              <LaunchIcon sx={{ mr: 2 }} />
              Open OAuth
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
          }
        }}
      >
        <DialogTitle>
          Configure {selectedApp?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
            Configure settings and permissions for {selectedApp?.name}
          </Typography>
          
          {selectedApp?.permissions.map((permission) => (
            <Box key={permission} sx={{ mb: 1 }}>
              <Chip
                label={permission.replace(/_/g, ' ')}
                size="small"
                sx={{
                  bgcolor: '#374151',
                  color: 'white',
                  mr: 1
                }}
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => setConfigDialogOpen(false)}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectedAppsPanel;

