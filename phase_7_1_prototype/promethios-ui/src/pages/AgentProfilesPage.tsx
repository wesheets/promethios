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
  FormGroup,
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
import EnhancedAgentRegistration from '../components/EnhancedAgentRegistration';
import PromethiosAgentRegistration from '../components/PromethiosAgentRegistration';
import { useAuth } from '../context/AuthContext';
import { useDemoAuth } from '../hooks/useDemoAuth';
import AgentManageModal from '../components/AgentManageModal';
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
  governancePolicy: string | object | null;
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

// Create Multi-Agent System Dialog Component
interface CreateMultiAgentDialogProps {
  open: boolean;
  onClose: () => void;
  selectedAgents: string[];
  agentProfiles: AgentProfile[];
  onSystemCreated: (systemData: {
    systemName: string;
    systemDescription: string;
    systemType: string;
    selectedAgents: string[];
  }) => void;
}

const CreateMultiAgentDialog: React.FC<CreateMultiAgentDialogProps> = ({ 
  open, 
  onClose, 
  selectedAgents, 
  agentProfiles,
  onSystemCreated 
}) => {
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [systemType, setSystemType] = useState('sequential');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAgentNames = selectedAgents
    .map(id => agentProfiles.find(agent => agent.identity.id === id)?.identity.name)
    .filter(Boolean)
    .join(', ');

  const handleSubmit = async () => {
    if (!systemName.trim() || !systemDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const systemData = {
        systemName: systemName.trim(),
        systemDescription: systemDescription.trim(),
        systemType,
        selectedAgents
      };

      onSystemCreated(systemData);
      
      // Reset form
      setSystemName('');
      setSystemDescription('');
      setSystemType('sequential');
      
    } catch (error) {
      console.error('Error creating multi-agent system:', error);
      alert('Failed to create multi-agent system. Please try again.');
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
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Group sx={{ color: '#3182ce' }} />
          Create Multi-Agent System
        </Box>
      </DialogTitle>
      <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto', pt: 3 }}>
        <Box>
          <Typography variant="body2" color="#a0aec0" mb={3}>
            Create a governed multi-agent system from your selected agents. This will start the 7-step wrapping process.
          </Typography>

          {/* Selected Agents Display */}
          <Box mb={3}>
            <Typography variant="subtitle2" color="white" mb={1}>
              Selected Agents ({selectedAgents.length})
            </Typography>
            <Box 
              sx={{ 
                backgroundColor: '#1a202c', 
                border: '1px solid #4a5568', 
                borderRadius: 1, 
                p: 2 
              }}
            >
              <Typography variant="body2" color="#a0aec0">
                {selectedAgentNames}
              </Typography>
            </Box>
          </Box>

          {/* System Name */}
          <Box mb={3}>
            <Typography variant="subtitle2" color="white" mb={1}>
              System Name *
            </Typography>
            <TextField
              fullWidth
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="e.g., Customer Support Pipeline"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#3182ce' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                },
                '& .MuiInputBase-input::placeholder': { color: '#a0aec0' },
              }}
            />
          </Box>

          {/* System Description */}
          <Box mb={3}>
            <Typography variant="subtitle2" color="white" mb={1}>
              Description *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              placeholder="Describe what this multi-agent system will do and how the agents will work together..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#3182ce' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                },
                '& .MuiInputBase-input::placeholder': { color: '#a0aec0' },
              }}
            />
          </Box>

          {/* System Type */}
          <Box mb={3}>
            <Typography variant="subtitle2" color="white" mb={1}>
              System Type
            </Typography>
            <FormControl fullWidth>
              <Select
                value={systemType}
                onChange={(e) => setSystemType(e.target.value)}
                sx={{
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  '& .MuiSvgIcon-root': { color: 'white' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2d3748',
                      color: 'white',
                      border: '1px solid #4a5568',
                    },
                  },
                }}
              >
                <MenuItem value="sequential">Sequential - Agents work in order</MenuItem>
                <MenuItem value="parallel">Parallel - Agents work simultaneously</MenuItem>
                <MenuItem value="conditional">Conditional - Agents work based on conditions</MenuItem>
                <MenuItem value="custom">Custom - Define your own workflow</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
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
          disabled={isSubmitting || !systemName.trim() || !systemDescription.trim()}
          sx={{
            backgroundColor: '#3182ce',
            color: 'white',
            '&:hover': { backgroundColor: '#2c5aa0' },
            '&:disabled': { backgroundColor: '#6b7280' },
          }}
        >
          {isSubmitting ? 'Creating System...' : 'Continue to Wizard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Add Agent Dialog Component
interface AddAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onAgentAdded: (agent: AgentProfile) => void;
}

const AddAgentDialog: React.FC<AddAgentDialogProps> = ({ open, onClose, onAgentAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agentData, setAgentData] = useState<any>({});
  const { currentUser } = useAuth();
  const { currentUser: demoUser } = useDemoAuth();
  const effectiveUser = currentUser || demoUser;

  const handleSubmit = async () => {
    if (!agentData.agentName?.trim() || !agentData.apiEndpoint?.trim() || !agentData.apiKey?.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!effectiveUser?.uid) {
      alert('You must be logged in to add agents');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Import the storage service
      const { userAgentStorage } = await import('../services/UserAgentStorageService');
      
      // Set current user for storage service
      userAgentStorage.setCurrentUser(effectiveUser.uid);
      
      // Create new agent profile
      const newAgent: AgentProfile = {
        identity: {
          id: `agent-${Date.now()}`,
          name: agentData.agentName.trim(),
          version: '1.0.0',
          description: agentData.description?.trim() || `AI agent: ${agentData.agentName}`,
          ownerId: effectiveUser.uid,
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
        // Store enhanced API details for later use in wrapping wizard
        apiDetails: {
          endpoint: agentData.apiEndpoint.trim(),
          key: agentData.apiKey.trim(),
          provider: agentData.provider?.trim() || 'Custom',
          selectedModel: agentData.selectedModel,
          selectedCapabilities: agentData.selectedCapabilities,
          selectedContextLength: agentData.selectedContextLength,
          discoveredInfo: agentData.discoveredInfo
        }
      };

      // Save to unified storage with user scoping
      await userAgentStorage.saveAgent(newAgent);
      
      // Load the scorecard that was automatically created
      const scorecard = await userAgentStorage.loadScorecard(newAgent.identity.id);
      if (scorecard) {
        newAgent.latestScorecard = scorecard;
      }

      console.log('Agent saved to unified storage:', newAgent.identity.name);
      
      // Notify parent component
      onAgentAdded(newAgent);
      
      // Reset form
      setAgentData({});
      
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2d3748',
          color: 'white',
          border: '1px solid #4a5568',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Add sx={{ color: '#3182ce' }} />
          Add New Agent
        </Box>
      </DialogTitle>
      <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <EnhancedAgentRegistration
          onDataChange={setAgentData}
          title="Connect Your AI Agent"
          subtitle="Connect your existing AI agent by providing its API details. The agent will appear as 'unwrapped' in your My Agents list, ready for governance wrapping."
        />
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
          disabled={isSubmitting || !agentData.agentName?.trim() || !agentData.apiEndpoint?.trim() || !agentData.apiKey?.trim()}
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
  const [showPromethiosDialog, setShowPromethiosDialog] = useState(false);
  const [promethiosAgentData, setPromethiosAgentData] = useState<any>(null);
  const [isSubmittingPromethios, setIsSubmittingPromethios] = useState(false);
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

  const handlePromethiosAgent = () => {
    handleClose();
    setShowPromethiosDialog(true);
  };

  const handlePromethiosSubmit = async () => {
    if (!promethiosAgentData?.agentName?.trim()) {
      return;
    }

    setIsSubmittingPromethios(true);
    try {
      // Here you would typically call an API to create the Promethios agent
      console.log('Creating Promethios agent:', promethiosAgentData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close dialog and reset state
      setShowPromethiosDialog(false);
      setPromethiosAgentData(null);
      
      // You might want to refresh the agents list here
      // or show a success message
      
    } catch (error) {
      console.error('Failed to create Promethios agent:', error);
    } finally {
      setIsSubmittingPromethios(false);
    }
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
        {/* TODO: Uncomment when Promethios agent integration with scorecards is complete
        <MenuItem onClick={handlePromethiosAgent} sx={{ py: 2 }}>
          <ListItemIcon>
            <Security sx={{ color: '#3b82f6' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Create Promethios Agent"
            secondary="Create a new agent with native governance LLM"
            secondaryTypographyProps={{ sx: { color: '#a0aec0' } }}
          />
        </MenuItem>
        <Divider sx={{ borderColor: '#4a5568', my: 1 }} />
        */}
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

      {/* Promethios Native Agent Dialog */}
      <Dialog 
        open={showPromethiosDialog} 
        onClose={() => setShowPromethiosDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Security sx={{ color: '#3b82f6' }} />
            Create Promethios Native Agent
          </Box>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <PromethiosAgentRegistration
            onDataChange={setPromethiosAgentData}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPromethiosDialog(false)}
            disabled={isSubmittingPromethios}
            sx={{ color: '#a0aec0' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handlePromethiosSubmit}
            disabled={!promethiosAgentData?.agentName?.trim() || isSubmittingPromethios}
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              '&:hover': { backgroundColor: '#2563eb' },
              '&:disabled': { backgroundColor: '#374151', color: '#6b7280' },
            }}
          >
            {isSubmittingPromethios ? 'Creating...' : 'Create Agent'}
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
  onManageAgent: (agentId: string) => void;
}> = ({ profile, selectionMode, isSelected, onSelectionChange, onManageAgent }) => {
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
    // Any wrapped agent is considered "Governed" regardless of policy choice
    // Even "No Policy" is a governance decision made through the wrapping process
    if (profile.isWrapped && !profile.isDeployed) return { status: 'governed', label: '🟢 Governed', color: '#10b981' };
    // "Deployed" status for agents actually deployed to external systems
    return { status: 'deployed', label: '🚀 Deployed to Production', color: '#3182ce' };
  };

  const getNextAction = (profile: AgentProfile) => {
    const lifecycle = getLifecycleStatus(profile);
    switch (lifecycle.status) {
      case 'unwrapped':
        return {
          label: 'Wrap Agent',
          icon: <Settings />,
          action: () => {
            // Pass agent ID to wrapping wizard
            window.location.href = `/ui/agents/wrapping?agentId=${profile.identity.id}`;
          },
          color: '#3182ce'
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
          action: () => onManageAgent(profile.identity.id),
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

        {/* Governance Status Badges */}
        <Box mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
            {/* Governed Badge - shows when agent is wrapped */}
            {profile.isWrapped && (
              <Chip
                label="Governed"
                size="small"
                sx={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
            
            {/* Policy Badge - shows policy type or "No Policy" */}
            {profile.isWrapped && (
              <Chip
                label={profile.governancePolicy 
                  ? (typeof profile.governancePolicy === 'object' 
                    ? `${profile.governancePolicy.complianceFramework || 'General'} - ${profile.governancePolicy.securityLevel || 'Standard'}`
                    : profile.governancePolicy)
                  : 'No Policy'}
                size="small"
                sx={{
                  backgroundColor: profile.governancePolicy ? '#f59e0b' : '#6b7280',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
            
            {/* Deployed Badge - shows when deployed to production */}
            {profile.isDeployed && (
              <Chip
                label="Deployed"
                size="small"
                sx={{
                  backgroundColor: '#3182ce',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
            
            {/* Unwrapped indicator - only shows when not wrapped */}
            {!profile.isWrapped && (
              <Chip
                label="Unwrapped"
                size="small"
                sx={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
          {profile.identity.description}
        </Typography>

        {/* Agent Tools & Capabilities */}
        {profile.apiDetails && (
          <Box mb={2}>
            <Typography variant="body2" sx={{ color: '#718096', mb: 1, fontWeight: 600 }}>
              Tools & Capabilities
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {/* Provider */}
              <Chip
                label={profile.apiDetails.provider || 'Custom'}
                size="small"
                icon={<Api />}
                sx={{
                  backgroundColor: '#1a202c',
                  color: '#a0aec0',
                  fontSize: '0.75rem',
                }}
              />
              
              {/* Model */}
              {profile.apiDetails.selectedModel && (
                <Chip
                  label={profile.apiDetails.selectedModel}
                  size="small"
                  icon={<SmartToy />}
                  sx={{
                    backgroundColor: '#1a202c',
                    color: '#a0aec0',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              
              {/* Capabilities */}
              {profile.apiDetails.selectedCapabilities && profile.apiDetails.selectedCapabilities.length > 0 && (
                <Chip
                  label={`${profile.apiDetails.selectedCapabilities.length} capabilities`}
                  size="small"
                  icon={<AutoAwesome />}
                  sx={{
                    backgroundColor: '#1a202c',
                    color: '#a0aec0',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              
              {/* Context Length */}
              {profile.apiDetails.selectedContextLength && (
                <Chip
                  label={`${profile.apiDetails.selectedContextLength}k context`}
                  size="small"
                  icon={<Psychology />}
                  sx={{
                    backgroundColor: '#1a202c',
                    color: '#a0aec0',
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Health and Trust Metrics */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={4}>
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
          <Grid item xs={4}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Trust Score
              </Typography>
              <Typography variant="h6" sx={{ color: '#3182ce' }}>
                {profile.latestScorecard?.score || 0}/100
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Gov ID
              </Typography>
              <Typography variant="body2" sx={{ color: '#10b981', fontFamily: 'monospace' }}>
                {profile.governanceId || 'GV-' + profile.identity.id.slice(-6).toUpperCase()}
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
            {/* Deploy Button - only show for wrapped agents */}
            {profile.isWrapped && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Launch />}
                sx={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  '&:hover': { backgroundColor: '#7c3aed' },
                  minWidth: '80px'
                }}
                onClick={() => window.location.href = `/ui/agents/deploy?agentId=${profile.identity.id}`}
              >
                Deploy
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<Chat />}
              sx={{
                borderColor: '#4a5568',
                color: '#a0aec0',
                '&:hover': { borderColor: '#718096', backgroundColor: '#1a202c' },
                minWidth: '70px'
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
  
  // Create Multi-Agent System dialog state
  const [showCreateMultiAgentDialog, setShowCreateMultiAgentDialog] = useState(false);
  
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
  
  // Modal state for agent management
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  
  // Fallback to demo auth for testing if no Firebase user
  const { currentUser: demoUser, loading: demoLoading } = useDemoAuth();
  const effectiveUser = currentUser || demoUser;
  const effectiveLoading = loading || demoLoading;

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

  // Load multi-agent systems from unified storage
  const [multiAgentSystems, setMultiAgentSystems] = useState<any[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);

  // Load multi-agent systems on component mount
  useEffect(() => {
    loadMultiAgentSystems();
  }, []);

  const loadMultiAgentSystems = async () => {
    try {
      setSystemsLoading(true);
      const { UnifiedStorageService } = await import('../services/UnifiedStorageService');
      const storageService = new UnifiedStorageService();
      
      // Get user's system list
      const userSystems = await storageService.get('user', 'multi-agent-systems') || [];
      
      // Filter out testing and production versions - only show main systems
      const mainSystems = userSystems.filter((systemRef: any) => {
        const systemId = systemRef.id || '';
        return !systemId.endsWith('-testing') && 
               !systemId.endsWith('-production') &&
               !systemRef.environment &&
               !systemRef.deploymentType;
      });
      
      // Load full system data for each system
      const systemsData = await Promise.all(
        mainSystems.map(async (systemRef: any) => {
          try {
            const fullSystemData = await storageService.get('agents', `multi-agent-system-${systemRef.id}`);
            return fullSystemData || systemRef;
          } catch (error) {
            console.warn(`Failed to load system ${systemRef.id}:`, error);
            return systemRef;
          }
        })
      );
      
      setMultiAgentSystems(systemsData.filter(Boolean));
    } catch (error) {
      console.error('Error loading multi-agent systems:', error);
      setMultiAgentSystems([]);
    } finally {
      setSystemsLoading(false);
    }
  };

  const multiAgentContexts: any[] = multiAgentSystems;
  const activeContexts: any[] = multiAgentSystems.filter(system => system.status === 'active');
  const contextsLoading = systemsLoading;
  const contextsError = null;
  const createContext = async () => {};
  const sendMessage = async () => {};
  const refreshContexts = loadMultiAgentSystems;
  const contextsStorageReady = true;

  // System profiles from multi-agent contexts with null safety
  const systemProfiles: SystemProfile[] = (multiAgentContexts || []).map(context => ({
    identity: {
      id: context?.id || context?.contextId || 'unknown',
      name: context?.name || 'Unknown System',
      description: context?.description || `Multi-agent system with ${context?.agentIds?.length || 0} agents`,
      status: context?.status || 'active'
    },
    healthStatus: 'healthy' as const,
    attestationCount: 3, // Default attestation count
    lastActivity: context?.updatedAt ? new Date(context.updatedAt) : new Date()
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

  const handleManageAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setManageModalOpen(true);
  };

  const handleCreateMultiAgentSystem = () => {
    if (selectedAgents.length < 2) {
      alert('Please select at least 2 agents to create a multi-agent system');
      return;
    }
    
    // Show the create multi-agent system dialog
    setShowCreateMultiAgentDialog(true);
  };

  const handleSystemCreated = (systemData: {
    systemName: string;
    systemDescription: string;
    systemType: string;
    selectedAgents: string[];
  }) => {
    // Close the dialog
    setShowCreateMultiAgentDialog(false);
    
    // Reset selection mode
    setSelectionMode(false);
    setSelectedAgents([]);
    
    // Navigate to multi-agent wrapping wizard with system data and selected agents
    const agentParams = systemData.selectedAgents.map(id => `agentId=${id}`).join('&');
    const systemDataParam = encodeURIComponent(JSON.stringify({
      name: systemData.systemName,
      description: systemData.systemDescription,
      systemType: systemData.systemType
    }));
    
    window.location.href = `/ui/agents/multi-wrapping?${agentParams}&systemData=${systemDataParam}`;
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedAgents([]); // Clear selections when toggling
  };

  const wrappedAgents = agentProfiles.filter(agent => agent?.isWrapped);
  const canCreateMultiAgent = selectedAgents.length >= 2;

  // Load agents from unified storage
  const loadAgentsFromStorage = async () => {
    if (!effectiveUser?.uid) {
      console.log('No user logged in, skipping agent loading');
      setAgentProfiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Import and initialize storage service
      const { userAgentStorage } = await import('../services/UserAgentStorageService');
      userAgentStorage.setCurrentUser(effectiveUser.uid);
      
      // Load user's agents
      const userAgents = await userAgentStorage.loadUserAgents();
      console.log(`Loaded ${userAgents.length} agents from unified storage for user ${effectiveUser.uid}`);
      
      // Since we now load production agents only, no need to filter them out
      // Production agents are the ones users should see and manage
      const agentsToShow = userAgents;
      
      // Load scorecards for each agent
      const agentsWithScorecards = await Promise.all(
        agentsToShow.map(async (agent) => {
          try {
            const scorecard = await userAgentStorage.loadScorecard(agent.identity.id);
            return {
              ...agent,
              latestScorecard: scorecard,
            };
          } catch (error) {
            console.error(`Error loading scorecard for agent ${agent.identity.id}:`, error);
            return agent;
          }
        })
      );
      
      setAgentProfiles(agentsWithScorecards);
      console.log(`Loaded ${agentsWithScorecards.length} agents from unified storage for user ${effectiveUser.uid}`);
      
      // Debug: Check isWrapped status for each agent
      agentsWithScorecards.forEach(agent => {
        console.log(`🔍 Agent "${agent.identity?.name}" - isWrapped: ${agent.isWrapped}, ID: ${agent.identity?.id}`);
      });
      
    } catch (error) {
      console.error('Error loading agents from storage:', error);
      setAgentProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentsFromStorage();
    
    // Add event listeners for agent creation/updates
    const handleAgentCreated = () => {
      console.log('🔄 Agent created event received, refreshing agent list...');
      loadAgentsFromStorage();
    };
    
    const handleAgentUpdated = () => {
      console.log('🔄 Agent updated event received, refreshing agent list...');
      loadAgentsFromStorage();
    };
    
    // Listen for custom events
    window.addEventListener('agentCreated', handleAgentCreated);
    window.addEventListener('agentUpdated', handleAgentUpdated);
    
    // Listen for storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('agents')) {
        console.log('🔄 Storage change detected for agents, refreshing...');
        loadAgentsFromStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('agentCreated', handleAgentCreated);
      window.removeEventListener('agentUpdated', handleAgentUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [effectiveUser?.uid]);

  // Refresh function for manual reload
  const handleRefreshAgents = () => {
    loadAgentsFromStorage();
  };

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
                  onClick={handleRefreshAgents}
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
                        onManageAgent={handleManageAgent}
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
                    onManageAgent={handleManageAgent}
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
              console.log('Agent added successfully:', newAgent.identity.name);
              setShowAddAgentDialog(false);
              
              // Refresh agents from storage to get the latest data
              await handleRefreshAgents();
              
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

        {/* Create Multi-Agent System Dialog */}
        <CreateMultiAgentDialog
          open={showCreateMultiAgentDialog}
          onClose={() => setShowCreateMultiAgentDialog(false)}
          selectedAgents={selectedAgents}
          agentProfiles={agentProfiles}
          onSystemCreated={handleSystemCreated}
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

        {/* Agent Management Modal */}
        <AgentManageModal
          open={manageModalOpen}
          onClose={() => {
            setManageModalOpen(false);
            setSelectedAgentId(null);
          }}
          agentId={selectedAgentId}
          onAgentUpdated={async (updatedAgent) => {
            // Refresh the agents list to show updated data
            await handleRefreshAgents();
          }}
        />
      </Container>
    </ThemeProvider>
  );
};

export default AgentProfilesPage;

