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
  Tabs,
  Tab,
  Slider,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close,
  Save,
  Security,
  Api,
  Visibility,
  VisibilityOff,
  Settings,
  Assessment,
  Policy,
  ExpandMore,
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
  const [currentTab, setCurrentTab] = useState(0);
  const [governanceFormData, setGovernanceFormData] = useState<any>({});

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
        
        // Initialize governance form data
        const policy = agentData.governancePolicy;
        setGovernanceFormData({
          complianceFramework: policy?.complianceFramework || 'general',
          securityLevel: policy?.securityLevel || 'standard',
          enforcementLevel: policy?.enforcementLevel || 'governance',
          trustThreshold: policy?.trustThreshold || 75,
          enableAuditLogging: policy?.enableAuditLogging || false,
          enableDataRetention: policy?.enableDataRetention || false,
          enableRealTimeMonitoring: policy?.enableRealTimeMonitoring || false,
          enableEscalationPolicies: policy?.enableEscalationPolicies || false,
          dataRetentionDays: policy?.dataRetentionDays || 30,
          alertThreshold: policy?.alertThreshold || 80,
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
      
      // Create updated governance policy if agent is wrapped
      let updatedGovernancePolicy = null;
      if (agent.isWrapped && agent.governancePolicy) {
        updatedGovernancePolicy = {
          ...agent.governancePolicy,
          complianceFramework: governanceFormData.complianceFramework,
          securityLevel: governanceFormData.securityLevel,
          enforcementLevel: governanceFormData.enforcementLevel,
          trustThreshold: governanceFormData.trustThreshold,
          enableAuditLogging: governanceFormData.enableAuditLogging,
          enableDataRetention: governanceFormData.enableDataRetention,
          enableRealTimeMonitoring: governanceFormData.enableRealTimeMonitoring,
          enableEscalationPolicies: governanceFormData.enableEscalationPolicies,
          dataRetentionDays: governanceFormData.dataRetentionDays,
          alertThreshold: governanceFormData.alertThreshold,
          lastUpdated: new Date(),
          // Ensure all date fields in governance policy are proper Date objects
          createdAt: agent.governancePolicy.createdAt instanceof Date 
            ? agent.governancePolicy.createdAt 
            : new Date(agent.governancePolicy.createdAt || Date.now()),
        };
      }
      
      const updatedAgent: AgentProfile = {
        ...agent,
        identity: {
          ...agent.identity,
          name: formData.name,
          description: formData.description,
          version: formData.version,
          lastModifiedDate: new Date(),
          // Ensure creationDate is a proper Date object
          creationDate: agent.identity.creationDate instanceof Date 
            ? agent.identity.creationDate 
            : new Date(agent.identity.creationDate || Date.now()),
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
        // Update governance policy if it exists
        governancePolicy: updatedGovernancePolicy || agent.governancePolicy,
        // Ensure lastActivity is a proper Date object if it exists
        lastActivity: agent.lastActivity 
          ? (agent.lastActivity instanceof Date 
              ? agent.lastActivity 
              : new Date(agent.lastActivity))
          : undefined,
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

  const handleGovernanceInputChange = (field: string, value: any) => {
    setGovernanceFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleClose = () => {
    setAgent(null);
    setFormData({});
    setGovernanceFormData({});
    setCurrentTab(0);
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
          <Box>
            <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tab icon={<Api />} label="Basic Info" />
              <Tab icon={<Security />} label="API Config" />
              {agent.isWrapped && <Tab icon={<Policy />} label="Governance" />}
              {agent.isWrapped && <Tab icon={<Assessment />} label="Metrics" />}
            </Tabs>

            {/* Basic Information Tab */}
            {currentTab === 0 && (
              <Grid container spacing={3}>
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
              </Grid>
            )}

            {/* API Configuration Tab */}
            {currentTab === 1 && (
              <Grid container spacing={3}>
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
              </Grid>
            )}

            {/* Governance Policy Tab */}
            {currentTab === 2 && agent.isWrapped && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Policy /> Governance Policy
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Compliance Framework</InputLabel>
                        <Select
                          value={governanceFormData.complianceFramework || 'general'}
                          onChange={(e) => handleGovernanceInputChange('complianceFramework', e.target.value)}
                          label="Compliance Framework"
                        >
                          <MenuItem value="general">General</MenuItem>
                          <MenuItem value="healthcare">Healthcare</MenuItem>
                          <MenuItem value="hipaa">HIPAA</MenuItem>
                          <MenuItem value="gdpr">GDPR</MenuItem>
                          <MenuItem value="sox">SOX</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Security Level</InputLabel>
                        <Select
                          value={governanceFormData.securityLevel || 'standard'}
                          onChange={(e) => handleGovernanceInputChange('securityLevel', e.target.value)}
                          label="Security Level"
                        >
                          <MenuItem value="basic">Basic</MenuItem>
                          <MenuItem value="standard">Standard</MenuItem>
                          <MenuItem value="strict">Strict</MenuItem>
                          <MenuItem value="maximum">Maximum</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Enforcement Level</InputLabel>
                        <Select
                          value={governanceFormData.enforcementLevel || 'governance'}
                          onChange={(e) => handleGovernanceInputChange('enforcementLevel', e.target.value)}
                          label="Enforcement Level"
                        >
                          <MenuItem value="monitoring">Monitoring Only</MenuItem>
                          <MenuItem value="governance">Governance</MenuItem>
                          <MenuItem value="strict_compliance">Strict Compliance</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Data Retention (Days)"
                        type="number"
                        value={governanceFormData.dataRetentionDays || 30}
                        onChange={(e) => handleGovernanceInputChange('dataRetentionDays', parseInt(e.target.value))}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>Policy Controls</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={governanceFormData.enableAuditLogging || false}
                              onChange={(e) => handleGovernanceInputChange('enableAuditLogging', e.target.checked)}
                            />
                          }
                          label="Enable Audit Logging"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={governanceFormData.enableDataRetention || false}
                              onChange={(e) => handleGovernanceInputChange('enableDataRetention', e.target.checked)}
                            />
                          }
                          label="Enable Data Retention"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={governanceFormData.enableRealTimeMonitoring || false}
                              onChange={(e) => handleGovernanceInputChange('enableRealTimeMonitoring', e.target.checked)}
                            />
                          }
                          label="Real-time Monitoring"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={governanceFormData.enableEscalationPolicies || false}
                              onChange={(e) => handleGovernanceInputChange('enableEscalationPolicies', e.target.checked)}
                            />
                          }
                          label="Escalation Policies"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Trust Metrics Tab */}
            {currentTab === 3 && agent.isWrapped && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment /> Trust Metrics & Monitoring
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Trust Threshold</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Minimum trust score required for agent operations
                      </Typography>
                      <Box sx={{ px: 2 }}>
                        <Slider
                          value={governanceFormData.trustThreshold || 75}
                          onChange={(e, value) => handleGovernanceInputChange('trustThreshold', value)}
                          valueLabelDisplay="auto"
                          step={5}
                          marks
                          min={0}
                          max={100}
                          sx={{ mt: 2 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Current: {governanceFormData.trustThreshold || 75}%
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Alert Threshold</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Trust score level that triggers alerts
                      </Typography>
                      <Box sx={{ px: 2 }}>
                        <Slider
                          value={governanceFormData.alertThreshold || 80}
                          onChange={(e, value) => handleGovernanceInputChange('alertThreshold', value)}
                          valueLabelDisplay="auto"
                          step={5}
                          marks
                          min={0}
                          max={100}
                          sx={{ mt: 2 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Current: {governanceFormData.alertThreshold || 80}%
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Current Metrics Display */}
                  {agent.latestScorecard && (
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Current Metrics</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Trust Score</Typography>
                            <Typography variant="h6">{agent.latestScorecard.score}/100</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Health Status</Typography>
                            <Chip 
                              label={agent.latestScorecard.healthStatus || 'Healthy'} 
                              color="success" 
                              size="small" 
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Risk Level</Typography>
                            <Typography variant="body1">{agent.latestScorecard.riskLevel || 'Low'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Compliance</Typography>
                            <Typography variant="body1">{agent.latestScorecard.complianceStatus || 'Compliant'}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>
            )}
          </Box>
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

// Force rebuild Mon Jun 23 09:36:54 EDT 2025
