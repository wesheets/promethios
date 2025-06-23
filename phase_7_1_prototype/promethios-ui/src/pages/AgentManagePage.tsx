import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Stack,
  Chip,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Edit,
  Security,
  Api,
  SmartToy,
  Psychology,
  AutoAwesome,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { UserAgentStorageService, AgentProfile } from '../services/UserAgentStorageService';
import { useAuth } from '../context/AuthContext';
import { useDemoAuth } from '../hooks/useDemoAuth';

const AgentManagePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentUser: demoUser } = useDemoAuth();
  const effectiveUser = currentUser || demoUser;
  
  const agentId = searchParams.get('agentId');
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadAgent();
  }, [agentId, effectiveUser]);

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
      setEditMode(false);
      
      // Show success message
      alert('Agent updated successfully!');
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

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography>Loading agent...</Typography>
        </Container>
      </ThemeProvider>
    );
  }

  if (!agent) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Agent not found</Alert>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <IconButton onClick={() => navigate('/ui/agents/profiles')}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ color: 'white' }}>
              Manage Agent
            </Typography>
            <Chip
              label={agent.isDeployed ? 'Deployed' : 'Not Deployed'}
              color={agent.isDeployed ? 'success' : 'warning'}
            />
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant={editMode ? 'outlined' : 'contained'}
              startIcon={<Edit />}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Cancel' : 'Edit Agent'}
            </Button>
            
            {editMode && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Basic Information</Typography>
                
                <Stack spacing={2}>
                  <TextField
                    label="Agent Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                  />
                  
                  <TextField
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!editMode}
                    multiline
                    rows={3}
                    fullWidth
                  />
                  
                  <TextField
                    label="Version"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* API Configuration */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" mb={2}>API Configuration</Typography>
                
                <Stack spacing={2}>
                  <TextField
                    label="Provider"
                    value={formData.provider}
                    onChange={(e) => handleInputChange('provider', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                  />
                  
                  <TextField
                    label="API Endpoint"
                    value={formData.endpoint}
                    onChange={(e) => handleInputChange('endpoint', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                  />
                  
                  <TextField
                    label="API Key"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
                  
                  <TextField
                    label="Model"
                    value={formData.selectedModel}
                    onChange={(e) => handleInputChange('selectedModel', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Governance Policy */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Governance Policy</Typography>
                
                {agent.governancePolicy && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, backgroundColor: '#1a202c' }}>
                        <Typography variant="body2" color="text.secondary">Compliance Framework</Typography>
                        <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                          {agent.governancePolicy.complianceFramework}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, backgroundColor: '#1a202c' }}>
                        <Typography variant="body2" color="text.secondary">Security Level</Typography>
                        <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                          {agent.governancePolicy.securityLevel}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, backgroundColor: '#1a202c' }}>
                        <Typography variant="body2" color="text.secondary">Trust Threshold</Typography>
                        <Typography variant="h6">
                          {agent.governancePolicy.trustThreshold}%
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default AgentManagePage;
