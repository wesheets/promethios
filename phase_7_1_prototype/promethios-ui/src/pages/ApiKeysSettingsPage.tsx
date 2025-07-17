import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { darkThemeStyles } from '../styles/darkThemeStyles';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Chip,
  TextField,
  Backdrop,
  CircularProgress,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Key,
  ContentCopy,
  Refresh,
  Delete,
  Visibility,
  VisibilityOff,
  Add,
  Security,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';

interface ApiKeyData {
  key: string;
  keyId: string;
  agentId: string;
  agentName: string;
  userId: string;
  type: 'promethios-native' | 'deployment';
  createdAt: string;
  lastUsed: string | null;
  status: 'active' | 'revoked';
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

interface ApiKeyStats {
  total: number;
  active: number;
  revoked: number;
  nativeKeys: number;
  deploymentKeys: number;
}

const ApiKeysSettingsPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [stats, setStats] = useState<ApiKeyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKeyData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyData | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [keyToRegenerate, setKeyToRegenerate] = useState<ApiKeyData | null>(null);
  
  // UI states
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Load API keys from Firebase
  const loadApiKeys = useCallback(async () => {
    console.log('🔑 loadApiKeys: Starting Firebase fetch...');
    console.log('🔑 loadApiKeys: currentUser:', currentUser);
    console.log('🔑 loadApiKeys: currentUser UID:', currentUser?.uid);
    
    if (!currentUser?.uid) {
      console.log('🔑 loadApiKeys: No currentUser UID found, returning early');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔑 loadApiKeys: Querying Firebase for API keys...');
      
      // Query Firebase for API keys belonging to this user (simplified to avoid index requirement)
      const apiKeysRef = collection(db, 'apiKeys');
      const q = query(
        apiKeysRef, 
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('🔑 loadApiKeys: Firebase query returned', querySnapshot.size, 'documents');
      
      const keys: ApiKeyData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔑 loadApiKeys: Processing document:', doc.id, data);
        
        // Convert Firebase document to ApiKeyData format
        const apiKey: ApiKeyData = {
          key: data.key || data.id || doc.id,
          keyId: data.id || doc.id,
          agentId: data.agentId || 'unknown',
          agentName: data.agentName || data.agentId || 'Unknown Agent',
          userId: data.userId,
          type: data.type || 'promethios-native',
          createdAt: data.createdAt || new Date().toISOString(),
          lastUsed: data.lastUsed || null,
          status: data.status || 'active',
          permissions: data.permissions || ['read', 'write'],
          rateLimit: data.rateLimit || {
            requestsPerMinute: 60,
            requestsPerHour: 1000
          }
        };
        
        keys.push(apiKey);
      });
      
      console.log('🔑 loadApiKeys: Processed', keys.length, 'API keys:', keys);
      
      // Sort keys by creation date (newest first) - client-side sorting
      keys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Calculate stats
      const stats: ApiKeyStats = {
        total: keys.length,
        active: keys.filter(k => k.status === 'active').length,
        revoked: keys.filter(k => k.status === 'revoked').length,
        nativeKeys: keys.filter(k => k.type === 'promethios-native').length,
        deploymentKeys: keys.filter(k => k.type === 'deployment').length
      };
      
      setApiKeys(keys);
      setStats(stats);
      console.log('🔑 loadApiKeys: Successfully loaded', keys.length, 'API keys from Firebase');
      console.log('🔑 loadApiKeys: Keys data:', keys);
      console.log('🔑 loadApiKeys: Stats:', stats);
      
    } catch (error) {
      console.error('🔑 loadApiKeys: Firebase error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load API keys from Firebase');
    } finally {
      setLoading(false);
      console.log('🔑 loadApiKeys: Finished (loading set to false)');
    }
  }, [currentUser?.uid]);

  // Load API keys on mount and when user changes
  useEffect(() => {
    console.log('🔑 ApiKeysSettingsPage: useEffect triggered');
    console.log('🔑 User object:', currentUser);
    console.log('🔑 User UID:', currentUser?.uid);
    console.log('🔑 Auth loading:', authLoading);
    
    // Wait for authentication to complete and user to be available
    if (authLoading) {
      console.log('🔑 Authentication still loading, waiting...');
      return;
    }
    
    if (!currentUser) {
      console.log('🔑 No user found after auth loading complete');
      return;
    }
    
    console.log('🔑 User authenticated, loading API keys...');
    loadApiKeys();
  }, [currentUser, authLoading, loadApiKeys]);
  // Copy API key to clipboard
  const copyToClipboard = async (key: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyId);
      setSuccess('API key copied to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      setError('Failed to copy API key');
    }
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  // View key details
  const viewKeyDetails = (key: ApiKeyData) => {
    setSelectedKey(key);
    setShowKeyDialog(true);
  };

  // Delete API key
  const deleteApiKey = async (key: ApiKeyData) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/keys/${key.keyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccess('API key deleted successfully');
        await loadApiKeys(); // Reload keys
      } else {
        throw new Error(data.error || 'Failed to delete API key');
      }
      
    } catch (error) {
      console.error('Error deleting API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete API key');
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
      setKeyToDelete(null);
    }
  };

  // Regenerate API key
  const regenerateApiKey = async (key: ApiKeyData) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/keys/${key.keyId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid })
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate API key');
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccess('API key regenerated successfully');
        await loadApiKeys(); // Reload keys
      } else {
        throw new Error(data.error || 'Failed to regenerate API key');
      }
      
    } catch (error) {
      console.error('Error regenerating API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate API key');
    } finally {
      setLoading(false);
      setShowRegenerateDialog(false);
      setKeyToRegenerate(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format key display
  const formatKeyDisplay = (key: string, keyId: string) => {
    if (visibleKeys.has(keyId)) {
      return key;
    }
    return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`;
  };

  // Get key type color
  const getKeyTypeColor = (type: string) => {
    switch (type) {
      case 'promethios-native':
        return 'primary';
      case 'deployment':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'revoked':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && apiKeys.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      maxWidth: 1200, 
      mx: 'auto',
      ...darkThemeStyles?.pageContainer || { backgroundColor: '#1a202c', color: 'white' }
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          mb: 1, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          ...darkThemeStyles?.typography?.primary || { color: 'white' }
        }}>
          <Key />
          API Keys
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your Promethios API keys for native agents and deployments
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={darkThemeStyles?.card || { backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={darkThemeStyles?.typography?.secondary || { color: '#a0aec0' }}>
                  Total Keys
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={darkThemeStyles?.card || { backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.active}
                </Typography>
                <Typography variant="body2" sx={darkThemeStyles?.typography?.secondary || { color: '#a0aec0' }}>
                  Active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={darkThemeStyles?.card || { backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.revoked}
                </Typography>
                <Typography variant="body2" sx={darkThemeStyles?.typography?.secondary || { color: '#a0aec0' }}>
                  Revoked
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={darkThemeStyles?.card || { backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.nativeKeys}
                </Typography>
                <Typography variant="body2" sx={darkThemeStyles?.typography?.secondary || { color: '#a0aec0' }}>
                  Native Keys
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={darkThemeStyles?.card || { backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">
                  {stats.deploymentKeys}
                </Typography>
                <Typography variant="body2" sx={darkThemeStyles?.typography?.secondary || { color: '#a0aec0' }}>
                  Deployment Keys
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main API Keys Card */}
      <Card sx={darkThemeStyles?.card || { backgroundColor: '#2d3748', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={darkThemeStyles?.typography?.primary || { color: 'white' }}>
              Your API Keys
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadApiKeys}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {apiKeys.length === 0 ? (
            <>
              {console.log('🔑 RENDER: apiKeys.length is 0, current apiKeys:', apiKeys)}
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Key sx={{ fontSize: 64, ...darkThemeStyles?.typography?.secondary || { color: '#a0aec0' }, mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, ...darkThemeStyles?.typography?.secondary || { color: '#a0aec0' } }}>
                  No API Keys Found
                </Typography>
                <Typography variant="body2" sx={darkThemeStyles?.typography?.secondary || { color: '#a0aec0' }}>
                  API keys are automatically generated when you create Promethios Native Agents
                </Typography>
              </Box>
            </>
          ) : (
            <>
              {console.log('🔑 RENDER: apiKeys.length is', apiKeys.length, 'current apiKeys:', apiKeys)}
              <List>
              {apiKeys.map((key, index) => (
                <React.Fragment key={key.keyId}>
                  <ListItem sx={{ py: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      {/* Key Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {key.agentName}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={key.type === 'promethios-native' ? 'Native' : 'Deployment'}
                              color={getKeyTypeColor(key.type) as any}
                            />
                            <Chip
                              size="small"
                              label={key.status}
                              color={getStatusColor(key.status) as any}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => viewKeyDetails(key)}>
                              <Info />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={visibleKeys.has(key.keyId) ? "Hide Key" : "Show Key"}>
                            <IconButton size="small" onClick={() => toggleKeyVisibility(key.keyId)}>
                              {visibleKeys.has(key.keyId) ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy Key">
                            <IconButton 
                              size="small" 
                              onClick={() => copyToClipboard(key.key, key.keyId)}
                              color={copiedKey === key.keyId ? 'success' : 'default'}
                            >
                              {copiedKey === key.keyId ? <CheckCircle /> : <ContentCopy />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Regenerate Key">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setKeyToRegenerate(key);
                                setShowRegenerateDialog(true);
                              }}
                              disabled={key.status === 'revoked'}
                            >
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Key">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setKeyToDelete(key);
                                setShowDeleteDialog(true);
                              }}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Key Display */}
                      <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace' }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {formatKeyDisplay(key.key, key.keyId)}
                        </Typography>
                      </Paper>

                      {/* Key Info */}
                      <Box sx={{ display: 'flex', gap: 3, mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
                        <span>Created: {formatDate(key.createdAt)}</span>
                        <span>Last Used: {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}</span>
                        <span>Rate Limit: {key.rateLimit.requestsPerMinute}/min</span>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < apiKeys.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Key Details Dialog */}
      <Dialog open={showKeyDialog} onClose={() => setShowKeyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>API Key Details</DialogTitle>
        <DialogContent>
          {selectedKey && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Agent Name"
                    value={selectedKey.agentName}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Key Type"
                    value={selectedKey.type === 'promethios-native' ? 'Native' : 'Deployment'}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Status"
                    value={selectedKey.status}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Created"
                    value={formatDate(selectedKey.createdAt)}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Used"
                    value={selectedKey.lastUsed ? formatDate(selectedKey.lastUsed) : 'Never'}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Rate Limit"
                    value={`${selectedKey.rateLimit.requestsPerMinute}/min, ${selectedKey.rateLimit.requestsPerHour}/hour`}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Permissions"
                    value={selectedKey.permissions.join(', ')}
                    fullWidth
                    disabled
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="API Key"
                    value={selectedKey.key}
                    fullWidth
                    disabled
                    multiline
                    rows={3}
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeyDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Delete API Key
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the API key for "{keyToDelete?.agentName}"? 
            This action cannot be undone and will immediately revoke access for any applications using this key.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => keyToDelete && deleteApiKey(keyToDelete)} 
            color="error"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={showRegenerateDialog} onClose={() => setShowRegenerateDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Refresh color="warning" />
          Regenerate API Key
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to regenerate the API key for "{keyToRegenerate?.agentName}"? 
            The old key will be immediately revoked and you'll need to update any applications using it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegenerateDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => keyToRegenerate && regenerateApiKey(keyToRegenerate)} 
            color="warning"
            disabled={loading}
          >
            Regenerate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop open={loading && apiKeys.length > 0} sx={{ zIndex: 1300 }}>
        <CircularProgress />
      </Backdrop>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Box>
  );
};

export default ApiKeysSettingsPage;

