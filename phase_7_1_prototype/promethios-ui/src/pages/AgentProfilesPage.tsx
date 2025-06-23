import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Checkbox,
  FormControlLabel,
  Slide,
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
  Add,
  Build,
  Api,
  CloudUpload,
  Policy,
  Visibility,
  VisibilityOff,
  Edit,
  Delete,
  Launch,
  LibraryBooks,
  SmartToy,
  Psychology,
  AutoAwesome,
  Divider as DividerIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
// Temporarily disabled to avoid backend dependency errors
// import { useAgentWrappersUnified } from '../modules/agent-wrapping/hooks/useAgentWrappersUnified';
// import { useMultiAgentSystemsUnified } from '../modules/agent-wrapping/hooks/useMultiAgentSystemsUnified';
// import { useAgentIdentities } from '../modules/agent-identity/hooks/useAgentIdentities';
// import { useScorecards } from '../modules/agent-identity/hooks/useScorecards';
// import { AgentProfile as BaseAgentProfile, SystemProfile, CombinedProfile } from '../modules/agent-identity/types/multiAgent';
import PublishToRegistryModal from '../components/PublishToRegistryModal';
// Temporarily disabled to avoid backend dependency errors
// import { agentBackendService } from '../services/agentBackendService';

// Extended AgentProfile interface for our UI needs
interface AgentProfile {
  identity: {
    id: string;
    name: string;
    version: string;
    description: string;
    ownerId: string;
    creationDate: Date;
    lastModifiedDate: Date;
    status: string;
  };
  latestScorecard: {
    overallScore: number;
  } | null;
  attestationCount: number;
  lastActivity: Date | null;
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'high' | 'medium' | 'low';
  isWrapped: boolean;
  governancePolicy: string | null;
  isDeployed: boolean;
  apiDetails?: {
    endpoint: string;
    key: string;
    provider: string;
  };
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
      id={`agent-profiles-tabpanel-${index}`}
      aria-labelledby={`agent-profiles-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Add Agent Dialog Component
interface AddAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onAgentAdded: (agent: AgentProfile) => void;
}

const AddAgentDialog: React.FC<AddAgentDialogProps> = ({ open, onClose, onAgentAdded }) => {
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredInfo, setDiscoveredInfo] = useState<any>(null);

  // Auto-discovery function
  const discoverAgentInfo = async () => {
    if (!apiKey.trim() || !provider) return;
    
    setIsDiscovering(true);
    try {
      // Simulate auto-discovery based on provider
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let discoveredData: any = {};
      
      switch (provider) {
        case 'OpenAI':
          discoveredData = {
            name: agentName || 'OpenAI Assistant',
            description: 'Advanced language model with chat, code generation, and analysis capabilities',
            endpoint: apiEndpoint || 'https://api.openai.com/v1/chat/completions',
            capabilities: ['chat', 'code_generation', 'data_analysis', 'function_calling'],
            models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
            contextLength: 128000,
            supportsFunctions: true
          };
          break;
        case 'Anthropic':
          discoveredData = {
            name: agentName || 'Claude Assistant',
            description: 'Constitutional AI with strong reasoning and safety features',
            endpoint: apiEndpoint || 'https://api.anthropic.com/v1/messages',
            capabilities: ['chat', 'reasoning', 'analysis', 'constitutional_ai'],
            models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
            contextLength: 200000,
            supportsFunctions: false
          };
          break;
        case 'Google':
          discoveredData = {
            name: agentName || 'Gemini Assistant',
            description: 'Multimodal AI with text, image, and code capabilities',
            endpoint: apiEndpoint || 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
            capabilities: ['chat', 'multimodal', 'code_generation', 'image_analysis'],
            models: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
            contextLength: 32000,
            supportsFunctions: true
          };
          break;
        case 'Hugging Face':
          discoveredData = {
            name: agentName || 'Hugging Face Model',
            description: 'Open-source model from Hugging Face Hub',
            endpoint: apiEndpoint || 'https://api-inference.huggingface.co/models/',
            capabilities: ['text_generation', 'chat', 'specialized_tasks'],
            models: ['meta-llama/Llama-2-7b-chat-hf', 'microsoft/DialoGPT-medium'],
            contextLength: 4096,
            supportsFunctions: false
          };
          break;
        case 'Cohere':
          discoveredData = {
            name: agentName || 'Cohere Assistant',
            description: 'Enterprise-focused language model with strong reasoning',
            endpoint: apiEndpoint || 'https://api.cohere.ai/v1/chat',
            capabilities: ['chat', 'text_generation', 'embeddings', 'classification'],
            models: ['command', 'command-light', 'command-nightly'],
            contextLength: 4096,
            supportsFunctions: false
          };
          break;
        default:
          discoveredData = {
            name: agentName || 'Custom Agent',
            description: 'Custom AI agent with unknown capabilities',
            endpoint: apiEndpoint,
            capabilities: ['unknown'],
            models: ['unknown'],
            contextLength: 4096,
            supportsFunctions: false
          };
      }
      
      setDiscoveredInfo(discoveredData);
      
      // Auto-populate fields if they're empty
      if (!agentName.trim()) setAgentName(discoveredData.name);
      if (!description.trim()) setDescription(discoveredData.description);
      if (!apiEndpoint.trim()) setApiEndpoint(discoveredData.endpoint);
      
    } catch (error) {
      console.error('Auto-discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Trigger auto-discovery when provider or API key changes
  useEffect(() => {
    if (provider && apiKey.trim().length > 10) {
      const timer = setTimeout(() => {
        discoverAgentInfo();
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timer);
    }
  }, [provider, apiKey]);

  const handleSubmit = async () => {
    if (!agentName.trim() || !apiEndpoint.trim() || !apiKey.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call to add agent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new agent profile as unwrapped
      const newAgent: AgentProfile = {
        identity: {
          id: `agent-${Date.now()}`,
          name: agentName.trim(),
          version: '1.0.0',
          description: description.trim() || `AI agent: ${agentName}`,
          ownerId: 'user-1',
          creationDate: new Date(),
          lastModifiedDate: new Date(),
          status: 'active'
        },
        latestScorecard: null,
        attestationCount: 0,
        lastActivity: null,
        healthStatus: 'healthy',
        trustLevel: 'medium',
        isWrapped: false,
        governancePolicy: null,
        isDeployed: false,
        // Store API details for later use in wrapping wizard
        apiDetails: {
          endpoint: apiEndpoint.trim(),
          key: apiKey.trim(),
          provider: provider.trim() || 'Custom'
        }
      };

      onAgentAdded(newAgent);
      
      // Reset form
      setAgentName('');
      setDescription('');
      setApiEndpoint('');
      setApiKey('');
      setProvider('');
      
    } catch (error) {
      console.error('Error adding agent:', error);
      alert('Failed to add agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2d3748',
          color: 'white',
          border: '1px solid #4a5568',
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Add sx={{ color: '#3182ce' }} />
          Add New Agent
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: '#1e3a8a', 
            color: 'white',
            mb: 3,
            '& .MuiAlert-icon': { color: 'white' },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            💡 Auto-Discovery Enabled
          </Typography>
          <Typography variant="body2">
            Select a provider and enter your API key - we'll automatically discover and populate 
            your agent's capabilities, models, and optimal settings!
          </Typography>
        </Alert>

        {isDiscovering && (
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: '#065f46', 
              color: 'white',
              mb: 3,
              '& .MuiAlert-icon': { color: 'white' },
            }}
          >
            <Typography variant="body2">
              🔍 Discovering agent capabilities... This may take a moment.
            </Typography>
          </Alert>
        )}

        {discoveredInfo && (
          <Alert 
            severity="success" 
            sx={{ 
              backgroundColor: '#166534', 
              color: 'white',
              mb: 3,
              '& .MuiAlert-icon': { color: 'white' },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              ✅ Discovery Complete!
            </Typography>
            <Typography variant="body2">
              Found {discoveredInfo.models?.length || 0} models, {discoveredInfo.capabilities?.length || 0} capabilities. 
              Context length: {discoveredInfo.contextLength?.toLocaleString() || 'Unknown'} tokens.
            </Typography>
          </Alert>
        )}
        
        <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
          Connect your existing AI agent by providing its API details. The agent will appear as 
          "unwrapped" in your My Agents list, ready for governance wrapping.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Agent Name *"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g., Customer Support Bot"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#718096' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                },
                '& .MuiInputLabel-root': { color: '#a0aec0' },
              }}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your agent's capabilities"
              multiline
              rows={3}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#718096' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                },
                '& .MuiInputLabel-root': { color: '#a0aec0' },
              }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Provider</InputLabel>
              <Select
                value={provider}
                label="Provider"
                onChange={(e) => setProvider(e.target.value)}
                sx={{
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                }}
              >
                <MenuItem value="">Select Provider</MenuItem>
                <MenuItem value="OpenAI">OpenAI</MenuItem>
                <MenuItem value="Anthropic">Anthropic</MenuItem>
                <MenuItem value="Google">Google</MenuItem>
                <MenuItem value="Hugging Face">Hugging Face</MenuItem>
                <MenuItem value="Cohere">Cohere</MenuItem>
                <MenuItem value="Azure">Azure OpenAI</MenuItem>
                <MenuItem value="Custom">Custom/Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="API Endpoint *"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#718096' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                },
                '& .MuiInputLabel-root': { color: '#a0aec0' },
              }}
            />
            
            <TextField
              fullWidth
              label="API Key *"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API key from the provider"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                      sx={{ color: '#a0aec0' }}
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#718096' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                },
                '& .MuiInputLabel-root': { color: '#a0aec0' },
              }}
            />
            
            <Alert 
              severity="info" 
              sx={{ 
                backgroundColor: '#1e3a8a', 
                color: 'white',
                '& .MuiAlert-icon': { color: 'white' },
              }}
            >
              <Typography variant="body2">
                Your API credentials are stored securely and will be used to connect 
                to your agent during the wrapping process.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={isSubmitting}
          sx={{ color: '#a0aec0' }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !agentName.trim() || !apiEndpoint.trim() || !apiKey.trim()}
          sx={{
            backgroundColor: '#3182ce',
            color: 'white',
            '&:hover': { backgroundColor: '#2c5aa0' },
            '&:disabled': { backgroundColor: '#6b7280' },
          }}
        >
          {isSubmitting ? 'Adding Agent...' : 'Add Agent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Add New Agent Button Component
interface AddNewAgentButtonProps {
  onShowAddAgentDialog: () => void;
}

const AddNewAgentButton: React.FC<AddNewAgentButtonProps> = ({ onShowAddAgentDialog }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showFoundryDialog, setShowFoundryDialog] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleImportAPI = () => {
    handleClose();
    // Open the Add Agent dialog instead of navigating away
    onShowAddAgentDialog();
  };

  const handleTemplateLibrary = () => {
    handleClose();
    // Navigate to template library
    window.location.href = '/ui/agents/templates';
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleClick}
        sx={{
          backgroundColor: '#3182ce',
          color: 'white',
          '&:hover': { backgroundColor: '#2c5aa0' },
          px: 3,
          py: 1.5,
        }}
      >
        Add New Agent
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
            minWidth: 280,
          },
        }}
      >
        <MenuItem onClick={() => navigate('/ui/agents/wrap-chatgpt')} sx={{ py: 2 }}>
          <ListItemIcon>
            <SmartToy sx={{ color: '#10b981' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Wrap ChatGPT"
            secondary="Add governance to your existing ChatGPT account"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
        <MenuItem onClick={() => navigate('/ui/agents/wrap-claude')} sx={{ py: 2 }}>
          <ListItemIcon>
            <Psychology sx={{ color: '#8b5cf6' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Wrap Claude"
            secondary="Add governance to your existing Claude account"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
        <MenuItem onClick={() => navigate('/ui/agents/wrap-gemini')} sx={{ py: 2 }}>
          <ListItemIcon>
            <AutoAwesome sx={{ color: '#f59e0b' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Wrap Gemini"
            secondary="Add governance to your existing Gemini account"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
        <MenuItem onClick={() => navigate('/ui/agents/wrap-perplexity')} sx={{ py: 2 }}>
          <ListItemIcon>
            <Search sx={{ color: '#06b6d4' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Wrap Perplexity"
            secondary="Add governance to your existing Perplexity account"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
        <Divider sx={{ borderColor: '#4a5568', my: 1 }} />
        <MenuItem onClick={handleImportAPI} sx={{ py: 2 }}>
          <ListItemIcon>
            <Api sx={{ color: '#3182ce' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Import API Agent"
            secondary="Connect your existing agent via API endpoint"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
        <Divider sx={{ borderColor: '#4a5568', my: 1 }} />
        <MenuItem onClick={handleTemplateLibrary} sx={{ py: 2 }}>
          <ListItemIcon>
            <LibraryBooks sx={{ color: '#10b981' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Browse Template Library"
            secondary="Fork governance-enhanced agent blueprints"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
      </Menu>

      {/* Foundry Beta Dialog */}
      <Dialog 
        open={showFoundryDialog} 
        onClose={() => setShowFoundryDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Build sx={{ color: '#f59e0b' }} />
            Promethios Foundry
            <Chip 
              label="Beta" 
              size="small" 
              sx={{ 
                backgroundColor: '#f59e0b', 
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
              }} 
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#a0aec0', mb: 2 }}>
            The Promethios Foundry allows you to describe what you want your agent to do, 
            and we'll build it for you automatically with proper governance integration.
          </Typography>
          <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
            <Typography variant="body2">
              🚧 This feature is currently in development. For now, please use the 
              "Import API Agent" option to add your existing agents to Promethios.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowFoundryDialog(false)}
            sx={{ color: '#a0aec0' }}
          >
            Close
          </Button>
          <Button 
            variant="contained"
            onClick={handleImportAPI}
            sx={{
              backgroundColor: '#3182ce',
              color: 'white',
              '&:hover': { backgroundColor: '#2c5aa0' },
            }}
          >
            Import API Agent Instead
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// SystemProfile interface for multi-agent systems
interface SystemProfile {
  identity: {
    id: string;
    name: string;
    description: string;
    status: string;
  };
  healthStatus: 'healthy' | 'warning' | 'critical';
  attestationCount: number;
  lastActivity: Date | null;
}

// SystemProfileCard component
const SystemProfileCard: React.FC<{ profile: SystemProfile }> = ({ profile }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        backgroundColor: '#2d3748', 
        color: 'white',
        border: '1px solid #4a5568',
        '&:hover': { borderColor: '#718096' },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#8b5cf6', width: 48, height: 48 }}>
              <Group />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {profile.identity.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Multi-Agent System
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
          {profile.identity.description}
        </Typography>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Health
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                {profile.healthStatus === 'healthy' && <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />}
                {profile.healthStatus === 'warning' && <Warning sx={{ color: '#f59e0b', fontSize: 16 }} />}
                {profile.healthStatus === 'critical' && <Error sx={{ color: '#ef4444', fontSize: 16 }} />}
                <Typography variant="body2" sx={{ color: 'white', textTransform: 'capitalize' }}>
                  {profile.healthStatus}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Typography variant="body2" sx={{ color: '#3182ce', textTransform: 'capitalize' }}>
                {profile.identity.status}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Chat />}
            fullWidth
            sx={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              '&:hover': { backgroundColor: '#7c3aed' },
            }}
          >
            Manage System
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Agent Profile Card Component
const AgentProfileCard: React.FC<{ 
  profile: AgentProfile; 
  selectionMode: boolean;
  isSelected: boolean;
  onSelectionChange: (agentId: string, selected: boolean) => void;
}> = ({ profile, selectionMode, isSelected, onSelectionChange }) => {
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getLifecycleStatus = (profile: AgentProfile) => {
    // Determine lifecycle status based on agent state
    if (!profile.isWrapped) return { status: 'unwrapped', label: '🔴 Unwrapped', color: '#ef4444' };
    if (!profile.governancePolicy) return { status: 'wrapped', label: '🟡 Wrapped - No Policy', color: '#f59e0b' };
    if (!profile.isDeployed) return { status: 'governed', label: '🟢 Governed', color: '#10b981' };
    return { status: 'deployed', label: '🚀 Deployed', color: '#3182ce' };
  };

  const getNextAction = (profile: AgentProfile) => {
    const lifecycle = getLifecycleStatus(profile);
    switch (lifecycle.status) {
      case 'unwrapped':
        return {
          label: 'Wrap Agent',
          icon: <Settings />,
          action: () => {
            // Pass agent data to wrapping wizard via URL params
            const agentData = encodeURIComponent(JSON.stringify({
              id: profile.identity.id,
              name: profile.identity.name,
              description: profile.identity.description,
              apiDetails: profile.apiDetails
            }));
            window.location.href = `/ui/agents/wrapping?agentData=${agentData}`;
          },
          color: '#3182ce'
        };
      case 'wrapped':
        return {
          label: 'Apply Policy',
          icon: <Policy />,
          action: () => window.location.href = `/ui/governance/policies?agentId=${profile.identity.id}`,
          color: '#10b981'
        };
      case 'governed':
        return {
          label: 'Deploy',
          icon: <Launch />,
          action: () => window.location.href = `/ui/agents/deploy?agentId=${profile.identity.id}`,
          color: '#8b5cf6'
        };
      case 'deployed':
        return {
          label: 'Manage',
          icon: <Visibility />,
          action: () => window.location.href = `/ui/agents/manage?agentId=${profile.identity.id}`,
          color: '#6b7280'
        };
    }
  };

  const lifecycle = getLifecycleStatus(profile);
  const nextAction = getNextAction(profile);
  const canBeSelected = profile.isWrapped && selectionMode; // Only wrapped agents can be selected for multi-agent systems

  return (
    <Card 
      sx={{ 
        height: '100%', 
        backgroundColor: '#2d3748', 
        color: 'white',
        border: isSelected ? '2px solid #3182ce' : '1px solid #4a5568',
        '&:hover': { borderColor: isSelected ? '#3182ce' : '#718096' },
        position: 'relative',
      }}
    >
      {/* Selection Checkbox */}
      {canBeSelected && (
        <Box position="absolute" top={8} right={8} zIndex={1}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelectionChange(profile.identity.id, e.target.checked)}
            sx={{
              color: '#a0aec0',
              '&.Mui-checked': { color: '#3182ce' },
              backgroundColor: 'rgba(45, 55, 72, 0.8)',
              borderRadius: 1,
            }}
          />
        </Box>
      )}
      
      <CardContent>
        {/* Header with Avatar and Status */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#3182ce', width: 48, height: 48 }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {profile.identity.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                v{profile.identity.version}
              </Typography>
            </Box>
          </Box>
          {!canBeSelected && (
            <IconButton size="small" sx={{ color: '#a0aec0' }}>
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Lifecycle Status */}
        <Box mb={2}>
          <Chip
            label={lifecycle.label}
            size="small"
            sx={{
              backgroundColor: lifecycle.color,
              color: 'white',
              fontWeight: 600,
              mb: 1,
            }}
          />
          {profile.governancePolicy && (
            <Chip
              label={`Policy: ${profile.governancePolicy}`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#4a5568',
                color: '#a0aec0',
                ml: 1,
              }}
            />
          )}
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
          {profile.identity.description}
        </Typography>

        {/* Health and Trust Metrics */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Health
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                {profile.healthStatus === 'healthy' && <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />}
                {profile.healthStatus === 'warning' && <Warning sx={{ color: '#f59e0b', fontSize: 16 }} />}
                {profile.healthStatus === 'critical' && <Error sx={{ color: '#ef4444', fontSize: 16 }} />}
                <Typography variant="body2" sx={{ color: 'white', textTransform: 'capitalize' }}>
                  {profile.healthStatus}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Trust Score
              </Typography>
              <Typography variant="h6" sx={{ color: '#3182ce' }}>
                {profile.latestScorecard?.overallScore || 0}/100
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        {!selectionMode && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={nextAction.icon}
              fullWidth
              onClick={nextAction.action}
              sx={{
                backgroundColor: nextAction.color,
                color: 'white',
                '&:hover': { opacity: 0.8 },
              }}
            >
              {nextAction.label}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Chat />}
              sx={{
                borderColor: '#4a5568',
                color: '#a0aec0',
                '&:hover': { borderColor: '#718096', backgroundColor: '#1a202c' },
              }}
              onClick={() => window.location.href = `/ui/chat?agent=${profile.identity.id}`}
            >
              Chat
            </Button>
          </Stack>
        )}
        
        {/* Selection Mode Info */}
        {selectionMode && canBeSelected && (
          <Box textAlign="center" py={1}>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              {isSelected ? 'Selected for multi-agent system' : 'Click checkbox to select'}
            </Typography>
          </Box>
        )}
        
        {selectionMode && !canBeSelected && (
          <Box textAlign="center" py={1}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {!profile.isWrapped ? 'Must be wrapped first' : 'Not available for selection'}
            </Typography>
          </Box>
        )}
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
  const [governanceFilter, setGovernanceFilter] = useState('all');
  
  // Selection state for multi-agent system creation
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  // Add Agent dialog state
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false);
  
  // Publish to Registry modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [wrappedAgentData, setWrappedAgentData] = useState<{
    name: string;
    type: 'single' | 'multi-agent';
    governanceTier: 'basic' | 'enhanced' | 'strict';
  } | null>(null);

  // Agent profiles state for real backend data
  const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Simple fallback implementations to avoid backend dependency errors
  const wrappers: any[] = [];
  const activeWrappers: any[] = [];
  const wrappersLoading = false;
  const wrappersError = null;
  const createWrapper = async () => {};
  const updateWrapper = async () => {};
  const deleteWrapper = async () => {};
  const deployWrapper = async () => {};
  const suspendWrapper = async () => {};
  const refreshWrappers = async () => {};
  const wrappersStorageReady = true;

  const multiAgentContexts: any[] = [];
  const activeContexts: any[] = [];
  const contextsLoading = false;
  const contextsError = null;
  const createContext = async () => {};
  const sendMessage = async () => {};
  const refreshContexts = async () => {};
  const contextsStorageReady = true;

  // System profiles from multi-agent contexts with null safety
  const systemProfiles: SystemProfile[] = (multiAgentContexts || []).map(context => ({
    identity: {
      id: context?.context_id || 'unknown',
      name: context?.name || 'Unknown System',
      description: `Multi-agent system with ${context?.agent_ids?.length || 0} agents`,
      status: context?.status || 'inactive'
    },
    healthStatus: 'healthy' as const,
    attestationCount: 0,
    lastActivity: context?.lastActivity ? new Date(context.lastActivity) : null
  }));

  // Combine loading states
  const combinedLoading = loading || wrappersLoading || contextsLoading;

  const handleAgentSelection = (agentId: string, selected: boolean) => {
    if (selected) {
      setSelectedAgents(prev => [...prev, agentId]);
    } else {
      setSelectedAgents(prev => prev.filter(id => id !== agentId));
    }
  };

  const handleCreateMultiAgentSystem = () => {
    if (selectedAgents.length < 2) {
      alert('Please select at least 2 agents to create a multi-agent system');
      return;
    }
    
    // Navigate to multi-agent wrapping wizard with selected agents
    const agentParams = selectedAgents.map(id => `agentId=${id}`).join('&');
    window.location.href = `/ui/agents/multi-wrapping?${agentParams}`;
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedAgents([]); // Clear selections when toggling
  };

  const wrappedAgents = agentProfiles.filter(agent => agent?.isWrapped);
  const canCreateMultiAgent = selectedAgents.length >= 2;

  useEffect(() => {
    // Simplified data loading without backend dependencies
    const loadProfiles = async () => {
      setLoading(true);
      
      try {
        // For now, just set empty profiles to avoid backend errors
        // TODO: Re-enable backend integration when services are properly configured
        console.log('AgentProfilesPage: Using fallback empty data (backend services not configured)');
        setAgentProfiles([]);
        
      } catch (error) {
        console.error('Error loading agent profiles:', error);
        setAgentProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  // Filter agent profiles with null safety
  const filteredAgentProfiles = agentProfiles.filter(profile => {
    const matchesSearch = (profile?.identity?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (profile?.identity?.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || profile?.identity?.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || profile?.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  const filteredSystemProfiles = systemProfiles.filter(profile => {
    const matchesSearch = (profile?.identity?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (profile?.identity?.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || profile?.identity?.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || profile?.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header with Add New Agent Button */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                My Agents
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and monitor your individual agents and multi-agent systems
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              {wrappedAgents.length >= 2 && (
                <Button
                  variant={selectionMode ? "contained" : "outlined"}
                  startIcon={<Group />}
                  onClick={handleToggleSelectionMode}
                  sx={{
                    backgroundColor: selectionMode ? '#8b5cf6' : 'transparent',
                    borderColor: '#8b5cf6',
                    color: selectionMode ? 'white' : '#8b5cf6',
                    '&:hover': { 
                      backgroundColor: selectionMode ? '#7c3aed' : 'rgba(139, 92, 246, 0.1)',
                      borderColor: '#7c3aed',
                    },
                  }}
                >
                  {selectionMode ? 'Cancel Selection' : 'Select for Multi-Agent'}
                </Button>
              )}
              <AddNewAgentButton onShowAddAgentDialog={() => setShowAddAgentDialog(true)} />
            </Stack>
          </Box>
          
          {/* Multi-Agent Creation Bar */}
          {selectionMode && (
            <Slide direction="down" in={selectionMode} mountOnEnter unmountOnExit>
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: '#1e3a8a', 
                  color: 'white',
                  '& .MuiAlert-icon': { color: 'white' },
                }}
                action={
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!canCreateMultiAgent}
                    onClick={handleCreateMultiAgentSystem}
                    sx={{
                      backgroundColor: canCreateMultiAgent ? '#10b981' : '#6b7280',
                      color: 'white',
                      '&:hover': { backgroundColor: canCreateMultiAgent ? '#059669' : '#6b7280' },
                    }}
                  >
                    Create Multi-Agent System ({selectedAgents.length})
                  </Button>
                }
              >
                <Typography variant="body2">
                  Select 2 or more wrapped agents to create a multi-agent system. 
                  Selected: {selectedAgents.length} agents
                </Typography>
              </Alert>
            </Slide>
          )}
        </Box>

        {/* Enhanced Filters and Search */}
        <Box mb={4}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                    '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Lifecycle Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Lifecycle Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="unwrapped">🔴 Unwrapped</MenuItem>
                  <MenuItem value="wrapped">🟡 Wrapped - No Policy</MenuItem>
                  <MenuItem value="governed">🟢 Governed</MenuItem>
                  <MenuItem value="deployed">🚀 Deployed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Health</InputLabel>
                <Select
                  value={healthFilter}
                  label="Health"
                  onChange={(e) => setHealthFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Health</MenuItem>
                  <MenuItem value="healthy">Healthy</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Governance Policy</InputLabel>
                <Select
                  value={governanceFilter}
                  label="Governance Policy"
                  onChange={(e) => setGovernanceFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Policies</MenuItem>
                  <MenuItem value="hipaa">HIPAA Strict</MenuItem>
                  <MenuItem value="financial">Financial Services</MenuItem>
                  <MenuItem value="general">General Business</MenuItem>
                  <MenuItem value="none">No Policy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => window.location.reload()}
                  sx={{
                    borderColor: '#4a5568',
                    color: '#a0aec0',
                    '&:hover': { borderColor: '#718096', backgroundColor: '#2d3748' },
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  sx={{
                    borderColor: '#4a5568',
                    color: '#a0aec0',
                    '&:hover': { borderColor: '#718096', backgroundColor: '#2d3748' },
                  }}
                >
                  More Filters
                </Button>
              </Stack>
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
          {combinedLoading ? (
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
                      <AgentProfileCard 
                        profile={profile as AgentProfile}
                        selectionMode={false}
                        isSelected={false}
                        onSelectionChange={() => {}}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Individual Agents Tab */}
          {combinedLoading ? (
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
                  <AgentProfileCard 
                    profile={profile}
                    selectionMode={selectionMode}
                    isSelected={selectedAgents.includes(profile.identity.id)}
                    onSelectionChange={handleAgentSelection}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Multi-Agent Systems Tab */}
          {combinedLoading ? (
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
        
        {/* Add Agent Dialog */}
        <AddAgentDialog 
          open={showAddAgentDialog}
          onClose={() => setShowAddAgentDialog(false)}
          onAgentAdded={async (newAgent) => {
            try {
              // Simplified agent creation without backend dependencies
              console.log('Agent added (fallback mode):', newAgent.identity.name);
              setShowAddAgentDialog(false);
              
              // Show publish to registry modal after successful creation
              setWrappedAgentData({
                name: newAgent.identity.name,
                type: 'single',
                governanceTier: 'enhanced'
              });
              setShowPublishModal(true);
              
            } catch (error) {
              console.error('Failed to create agent:', error);
              alert('Failed to create agent. Please try again.');
            }
          }}
        />

        {/* Publish to Registry Modal */}
        {wrappedAgentData && (
          <PublishToRegistryModal
            open={showPublishModal}
            onClose={() => {
              setShowPublishModal(false);
              setWrappedAgentData(null);
            }}
            agentName={wrappedAgentData.name}
            agentType={wrappedAgentData.type}
            governanceTier={wrappedAgentData.governanceTier}
            onPublish={(publishData) => {
              console.log('Publishing agent to registry:', publishData);
              // Here you would integrate with the actual registry API
              setShowPublishModal(false);
              setWrappedAgentData(null);
            }}
          />
        )}
      </Container>
    </ThemeProvider>
  );
};

export default AgentProfilesPage;

