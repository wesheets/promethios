import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useAgentContext } from '../context/AgentContext';

interface MyAgentsPageProps {
  className?: string;
}

/**
 * MyAgentsPage Component
 * 
 * Displays user's wrapped agents and allows selection for multi-agent system creation.
 * This is the "My Agents" page that shows in the screenshots.
 */
const MyAgentsPage: React.FC<MyAgentsPageProps> = ({ className }) => {
  const navigate = useNavigate();
  const { wrappedAgents, userCreatedAgents } = useAgentContext();
  const [selectedAgents, setSelectedAgents] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [systemType, setSystemType] = useState('parallel');

  const getTypeIcon = (type: string) => {
    return <AgentIcon sx={{ color: '#2BFFC6' }} />;
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return '#10a37f';
      case 'Anthropic': return '#d97706';
      case 'Cohere': return '#7c3aed';
      case 'HuggingFace': return '#ff6b35';
      default: return '#6b7280';
    }
  };

  const handleAgentSelection = (agent: any, selected: boolean) => {
    if (selected) {
      setSelectedAgents(prev => [...prev, agent]);
    } else {
      setSelectedAgents(prev => prev.filter(a => a.id !== agent.id));
    }
  };

  const handleCreateMultiAgentSystem = () => {
    if (selectedAgents.length < 2) {
      return;
    }
    setDialogOpen(true);
  };

  const handleContinueToWizard = () => {
    const navigationData = {
      preSelectedAgents: selectedAgents,
      initialStep: 2, // Start at step 3 (Collaboration Model)
      initialTeamData: {
        name: systemName,
        description: systemDescription,
        workflow: systemType
      }
    };
    
    console.log('MyAgentsPage Navigation Data:', navigationData);
    
    // Store in localStorage as backup and use URL params
    localStorage.setItem('multiAgentWrapperData', JSON.stringify(navigationData));
    
    // Create URL with parameters
    const agentIds = selectedAgents.map(agent => agent.id).join(',');
    const searchParams = new URLSearchParams({
      agentIds: agentIds,
      systemName: systemName,
      systemDescription: systemDescription,
      systemType: systemType,
      step: '2'
    });
    
    // Navigate to MultiAgentWrapper with URL parameters
    navigate(`/agents/multi-wrapping?${searchParams.toString()}`);
  };

  const isAgentSelected = (agent: any) => {
    return selectedAgents.some(a => a.id === agent.id);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }} className={className}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          My Agents
        </Typography>
        <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
          Manage and monitor your individual agents and multi-agent systems
        </Typography>

        {selectedAgents.length >= 2 && (
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: '#1976d2', 
              color: 'white', 
              mb: 3,
              '& .MuiAlert-icon': { color: 'white' }
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                variant="contained"
                sx={{ backgroundColor: '#2BFFC6', color: '#0D1117' }}
                onClick={handleCreateMultiAgentSystem}
              >
                Create Multi-Agent System (2)
              </Button>
            }
          >
            Select 2 or more wrapped agents to create a multi-agent system. Selected: {selectedAgents.length} agents
          </Alert>
        )}
      </Box>

      {/* Filters and Actions */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          sx={{ color: 'white', borderColor: 'white' }}
          onClick={() => navigate('/agents/wrapping')}
        >
          Add New Agent
        </Button>
        
        {selectedAgents.length >= 2 && (
          <Button
            variant="contained"
            startIcon={<GroupIcon />}
            sx={{ backgroundColor: '#2BFFC6', color: '#0D1117' }}
            onClick={handleCreateMultiAgentSystem}
          >
            Create Multi-Agent System ({selectedAgents.length})
          </Button>
        )}
      </Box>

      {/* Agents Grid */}
      {wrappedAgents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AgentIcon sx={{ fontSize: 64, color: '#555', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#ccc', mb: 2 }}>
            No agents found
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
            Start by wrapping your first agent to enable multi-agent collaboration
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ backgroundColor: '#2BFFC6', color: '#0D1117' }}
            onClick={() => navigate('/agents/wrapping')}
          >
            Wrap Your First Agent
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wrappedAgents.map(agent => (
            <Grid item xs={12} md={6} lg={4} key={agent.id}>
              <Card 
                sx={{ 
                  backgroundColor: isAgentSelected(agent) ? '#1976d2' : '#2a2a2a',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: isAgentSelected(agent) ? '2px solid #2BFFC6' : '1px solid #444',
                  '&:hover': {
                    backgroundColor: isAgentSelected(agent) ? '#1565c0' : '#333'
                  }
                }}
                onClick={() => handleAgentSelection(agent, !isAgentSelected(agent))}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Checkbox
                      checked={isAgentSelected(agent)}
                      sx={{ color: 'white', p: 0, mr: 1 }}
                    />
                    {getTypeIcon(agent.type)}
                    <Typography variant="h6" sx={{ color: 'white', ml: 1, flex: 1 }}>
                      {agent.name}
                    </Typography>
                    <Chip 
                      label={agent.user_created ? "CUSTOM" : "DEMO"} 
                      size="small" 
                      sx={{ 
                        backgroundColor: agent.user_created ? '#1976d2' : '#4caf50', 
                        color: 'white'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                    {agent.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={agent.provider} 
                      size="small" 
                      sx={{ 
                        backgroundColor: getProviderColor(agent.provider), 
                        color: 'white'
                      }}
                    />
                    <Chip 
                      label="Governed" 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#4caf50', 
                        color: 'white'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SettingsIcon />}
                      sx={{ color: 'white', borderColor: 'white', flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle agent configuration
                      }}
                    >
                      Configure
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Multi-Agent System Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2a2a2a', color: 'white' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Create Multi-Agent System
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
            Create a governed multi-agent system from your selected agents. This will start the 7-step wrapping process.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
              Selected Agents ({selectedAgents.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedAgents.map(agent => (
                <Chip
                  key={agent.id}
                  label={agent.name}
                  size="small"
                  sx={{ backgroundColor: '#1976d2', color: 'white' }}
                />
              ))}
            </Box>
          </Box>

          <TextField
            fullWidth
            label="System Name"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#555' },
                '&:hover fieldset': { borderColor: '#777' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' }
              },
              '& .MuiInputLabel-root': { color: '#ccc' }
            }}
            placeholder="e.g., Customer Support Pipeline"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={systemDescription}
            onChange={(e) => setSystemDescription(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#555' },
                '&:hover fieldset': { borderColor: '#777' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' }
              },
              '& .MuiInputLabel-root': { color: '#ccc' }
            }}
            placeholder="Describe what this multi-agent system will do and how the agents will work together"
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#ccc' }}>System Type</InputLabel>
            <Select
              value={systemType}
              onChange={(e) => setSystemType(e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#777' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
              }}
            >
              <MenuItem value="parallel">Parallel - Agents work simultaneously</MenuItem>
              <MenuItem value="sequential">Sequential - Agents work in order</MenuItem>
              <MenuItem value="pipeline">Pipeline - Output flows between agents</MenuItem>
              <MenuItem value="consensus">Consensus - Agents collaborate on decisions</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ color: '#ccc' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleContinueToWizard}
            variant="contained"
            disabled={!systemName.trim() || !systemDescription.trim()}
            sx={{ 
              backgroundColor: '#2BFFC6',
              color: '#0D1117',
              '&:hover': { backgroundColor: '#22D6A7' }
            }}
          >
            Continue to Wizard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyAgentsPage;

