import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close,
  Save,
  Security,
  Api,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { UserAgentStorageService, AgentProfile } from '../services/UserAgentStorageService';
import { useAuth } from '../context/AuthContext';
import { useDemoAuth } from '../hooks/useDemoAuth';

interface AgentManageModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string | null;
  onAgentUpdated?: (agent: AgentProfile) => void;
}

const AgentManageModal: React.FC<AgentManageModalProps> = ({
  open,
  onClose,
  agentId,
  onAgentUpdated
}) => {
  const { currentUser } = useAuth();
  const { currentUser: demoUser } = useDemoAuth();
  const effectiveUser = currentUser || demoUser;
  
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (open && agentId) {
      loadAgent();
    }
  }, [open, agentId, effectiveUser]);

  const loadAgent = async () => {
    if (!agentId || !effectiveUser) return;
    
    setLoading(true);
    try {
      const storageService = new UserAgentStorageService();
      storageService.setCurrentUser(effectiveUser.uid);
      
      const agentData = await storageService.getAgent(agentId);
      if (agentData) {
        setAgent(agentData);
        setFormData({
          name: agentData.identity.name,
          description: agentData.identity.description,
          version: agentData.identity.version,
          provider: agentData.apiDetails?.provider || '',
          endpoint: agentData.apiDetails?.endpoint || '',
          apiKey: agentData.apiDetails?.key || '',
          selectedModel: agentData.apiDetails?.selectedModel || '',
          selectedCapabilities: agentData.apiDetails?.selectedCapabilities || [],
          selectedContextLength: agentData.apiDetails?.selectedContextLength || '',
        });
      }
    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agent || !effectiveUser) return;
    
    setSaving(true);
    try {
      const storageService = new UserAgentStorageService();
      storageService.setCurrentUser(effectiveUser.uid);
      
      const updatedAgent: AgentProfile = {
        ...agent,
        identity: {
          ...agent.identity,
          name: formData.name,
          description: formData.description,
          version: formData.version,
          lastModifiedDate: new Date(),
        },
        apiDetails: {
          ...agent.apiDetails,
          provider: formData.provider,
          endpoint: formData.endpoint,
          key: formData.apiKey,
          selectedModel: formData.selectedModel,
          selectedCapabilities: formData.selectedCapabilities,
          selectedContextLength: formData.selectedContextLength,
        },
      };
      
      await storageService.saveAgent(updatedAgent);
      setAgent(updatedAgent);
      
      // Notify parent component
      if (onAgentUpdated) {
        onAgentUpdated(updatedAgent);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Error saving agent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setAgent(null);
    setFormData({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a202c',
          color: 'white',
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">Manage Agent</Typography>
            {agent && (
              <Stack direction="row" spacing={1} mt={1}>
                <Chip
                  label={agent.isWrapped ? 'Governed' : 'Unwrapped'}
                  size="small"
                  color={agent.isWrapped ? 'success' : 'error'}
                />
                <Chip
                  label={agent.isDeployed ? 'Deployed' : 'Not Deployed'}
                  size="small"
                  color={agent.isDeployed ? 'info' : 'warning'}
                />
              </Stack>
            )}
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Typography>Loading agent...</Typography>
        ) : !agent ? (
          <Alert severity="error">Agent not found</Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Api /> Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Agent Name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Version"
                    value={formData.version || ''}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* API Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security /> API Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Provider</InputLabel>
                    <Select
                      value={formData.provider || ''}
                      onChange={(e) => handleInputChange('provider', e.target.value)}
                      label="Provider"
                    >
                      <MenuItem value="openai">OpenAI</MenuItem>
                      <MenuItem value="anthropic">Anthropic</MenuItem>
                      <MenuItem value="google">Google</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={formData.selectedModel || ''}
                    onChange={(e) => handleInputChange('selectedModel', e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Endpoint"
                    value={formData.endpoint || ''}
                    onChange={(e) => handleInputChange('endpoint', e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey || ''}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Governance Information */}
            {agent.governancePolicy && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Governance Policy
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Framework:</strong> {agent.governancePolicy.complianceFramework || 'General'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Security Level:</strong> {agent.governancePolicy.securityLevel || 'Standard'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Audit Logging:</strong> {agent.governancePolicy.enableAuditLogging ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Stack>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving || !agent}
          startIcon={<Save />}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgentManageModal;

