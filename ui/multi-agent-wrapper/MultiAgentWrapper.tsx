import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Security as GovernanceIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Business as BusinessIcon,
  Science as ScienceIcon,
  Chat as ChatIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { SHARED_DEMO_AGENTS, DEMO_TEAM_TEMPLATES, DemoAgent } from '../shared/DemoAgents';

interface MultiAgentTeam {
  id: string;
  name: string;
  description: string;
  agents: DemoAgent[];
  workflow: 'debate' | 'consensus' | 'pipeline' | 'swarm';
  governance_enabled: boolean;
  status: 'active' | 'configured';
}

interface MultiAgentWrapperProps {
  onTeamCreated?: (team: MultiAgentTeam) => void;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

const steps = ['Basic Info', 'Agent Selection', 'Flow Configuration', 'Governance Rules', 'Review & Create'];

export const MultiAgentWrapper: React.FC<MultiAgentWrapperProps> = ({ onTeamCreated }) => {
  const [availableAgents, setAvailableAgents] = useState<DemoAgent[]>(SHARED_DEMO_AGENTS);
  const [activeTeams, setActiveTeams] = useState<MultiAgentTeam[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stepper state for creating new teams
  const [activeStep, setActiveStep] = useState(0);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    workflow: 'pipeline' as any,
    governance_enabled: true,
    selected_agents: [] as DemoAgent[]
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coordinator': return <GroupIcon />;
      case 'specialist': return <ScienceIcon />;
      case 'validator': return <AssessmentIcon />;
      case 'executor': return <CodeIcon />;
      default: return <AgentIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coordinator': return '#2196f3';
      case 'specialist': return '#9c27b0';
      case 'validator': return '#ff9800';
      case 'executor': return '#4caf50';
      default: return '#757575';
    }
  };

  const getWorkflowColor = (workflow: string) => {
    switch (workflow) {
      case 'debate': return '#f44336';
      case 'consensus': return '#4caf50';
      case 'pipeline': return '#2196f3';
      case 'swarm': return '#ff9800';
      default: return '#757575';
    }
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

  const handleActivateTemplate = async (template: any) => {
    setLoading(true);
    setError(null);

    try {
      // Get agents for this template
      const templateAgents = availableAgents.filter(agent => 
        template.agent_ids.includes(agent.id)
      );

      const activeTeam: MultiAgentTeam = {
        id: `active_${template.id}_${Date.now()}`,
        name: template.name,
        description: template.description,
        agents: templateAgents,
        workflow: template.workflow,
        governance_enabled: template.governance_enabled,
        status: 'active'
      };

      setActiveTeams(prev => [...prev, activeTeam]);
      
      if (onTeamCreated) {
        onTeamCreated(activeTeam);
      }

      setSelectedTemplate(null);
      setDialogOpen(false);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to activate team');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelection = (agent: DemoAgent, selected: boolean) => {
    if (selected) {
      setNewTeam(prev => ({
        ...prev,
        selected_agents: [...prev.selected_agents, agent]
      }));
    } else {
      setNewTeam(prev => ({
        ...prev,
        selected_agents: prev.selected_agents.filter(a => a.id !== agent.id)
      }));
    }
  };

  const handleCreateCustomTeam = async () => {
    setLoading(true);
    setError(null);

    try {
      const customTeam: MultiAgentTeam = {
        id: `custom_${Date.now()}`,
        name: newTeam.name,
        description: newTeam.description,
        agents: newTeam.selected_agents,
        workflow: newTeam.workflow,
        governance_enabled: newTeam.governance_enabled,
        status: 'active'
      };

      setActiveTeams(prev => [...prev, customTeam]);
      
      if (onTeamCreated) {
        onTeamCreated(customTeam);
      }

      // Reset form
      setNewTeam({
        name: '',
        description: '',
        workflow: 'pipeline',
        governance_enabled: true,
        selected_agents: []
      });
      setActiveStep(0);
      setDialogOpen(false);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const canProceedToNext = () => {
    switch (activeStep) {
      case 0: return newTeam.name && newTeam.description;
      case 1: return newTeam.selected_agents.length >= 2;
      case 2: return newTeam.workflow;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Multi-Agent System Wrapper
        </Typography>
        <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
          Create governed multi-agent systems from your wrapped agents
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: '#2a2a2a', color: 'white' }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Demo Templates Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 3 }}>
          🚀 Demo Team Templates - Try These First!
        </Typography>
        <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
          These pre-configured multi-agent teams showcase different collaboration patterns and workflows.
          Each team demonstrates how multiple AI agents can work together with Promethios governance.
        </Typography>
        
        <Grid container spacing={3}>
          {DEMO_TEAM_TEMPLATES.map(template => (
            <Grid item xs={12} lg={6} key={template.id}>
              <Card 
                sx={{ 
                  backgroundColor: '#2a2a2a', 
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '2px solid #4caf50',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
                  }
                }}
                onClick={() => {
                  setSelectedTemplate(template);
                  setDialogOpen(true);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon sx={{ mr: 1, color: '#4caf50' }} />
                    <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                      {template.name}
                    </Typography>
                    <Chip 
                      label="DEMO" 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#4caf50', 
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 3, minHeight: '60px' }}>
                    {template.description}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      Team Configuration:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${template.agent_ids.length} Agents`} 
                        size="small" 
                        sx={{ backgroundColor: '#555', color: 'white' }}
                      />
                      <Chip 
                        label={template.workflow} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getWorkflowColor(template.workflow), 
                          color: 'white'
                        }}
                      />
                      <Chip 
                        label={template.governance_enabled ? 'Governed' : 'Ungoverned'} 
                        size="small" 
                        sx={{ 
                          backgroundColor: template.governance_enabled ? '#4caf50' : '#f44336', 
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#45a049' }
                    }}
                  >
                    Activate Team
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4, backgroundColor: '#555' }} />

      {/* Create Custom Team Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 3 }}>
          Create Custom Multi-Agent Team
        </Typography>
        <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
          Build your own custom multi-agent team by selecting individual agents and configuring their collaboration workflow.
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedTemplate(null);
            setActiveStep(0);
            setDialogOpen(true);
          }}
          sx={{ 
            color: 'white', 
            borderColor: 'white',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)'
            }
          }}
        >
          Create Custom Team
        </Button>
      </Box>

      {/* Active Teams Section */}
      {activeTeams.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Your Active Teams
          </Typography>
          
          <Grid container spacing={3}>
            {activeTeams.map(team => (
              <Grid item xs={12} lg={6} key={team.id}>
                <Card sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GroupIcon sx={{ mr: 1, color: '#4caf50' }} />
                      <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                        {team.name}
                      </Typography>
                      <Chip 
                        label="ACTIVE" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#4caf50', 
                          color: 'white'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      {team.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip 
                        label={`${team.agents.length} Agents`} 
                        size="small" 
                        sx={{ backgroundColor: '#555', color: 'white' }}
                      />
                      <Chip 
                        label={team.workflow} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getWorkflowColor(team.workflow), 
                          color: 'white'
                        }}
                      />
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ChatIcon />}
                      sx={{ color: 'white', borderColor: 'white' }}
                    >
                      Start Collaboration
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Team Configuration Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2a2a2a', color: 'white' }
        }}
      >
        {selectedTemplate ? (
          // Template activation dialog
          <>
            <DialogTitle sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ mr: 1, color: '#4caf50' }} />
                Activate {selectedTemplate.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                {selectedTemplate.description}
              </Typography>

              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Team Members
              </Typography>
              <List sx={{ backgroundColor: '#333', borderRadius: 1 }}>
                {selectedTemplate.agent_ids.map((agentId: string, index: number) => {
                  const agent = availableAgents.find(a => a.id === agentId);
                  if (!agent) return null;
                  
                  return (
                    <ListItem key={agentId} divider={index < selectedTemplate.agent_ids.length - 1}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        {getRoleIcon(agent.role || 'specialist')}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ color: 'white' }}>
                              {agent.name}
                            </Typography>
                            <Chip 
                              label={agent.role || 'specialist'} 
                              size="small" 
                              sx={{ 
                                backgroundColor: getRoleColor(agent.role || 'specialist'), 
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#ccc', mb: 0.5 }}>
                              {agent.description}
                            </Typography>
                            <Chip 
                              label={agent.provider} 
                              size="small" 
                              sx={{ 
                                backgroundColor: getProviderColor(agent.provider), 
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>

              <Alert severity="info" sx={{ backgroundColor: '#1976d2', color: 'white', mt: 3 }}>
                This multi-agent team will be activated with Promethios governance coordination, enabling collaborative AI workflows with trust metrics and compliance monitoring across all agents.
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDialogOpen(false)}
                sx={{ color: '#ccc' }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleActivateTemplate(selectedTemplate)}
                variant="contained"
                disabled={loading}
                sx={{ 
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                }}
              >
                {loading ? <CircularProgress size={20} /> : 'Activate Team'}
              </Button>
            </DialogActions>
          </>
        ) : (
          // Custom team creation dialog with stepper
          <>
            <DialogTitle sx={{ color: 'white' }}>
              Create Custom Multi-Agent Team
            </DialogTitle>
            <DialogContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {/* Step 1: Basic Info */}
                <Step>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
                    Basic System Information
                  </StepLabel>
                  <StepContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="System Name"
                          value={newTeam.name}
                          onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: '#555' },
                              '&:hover fieldset': { borderColor: '#777' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                            },
                            '& .MuiInputLabel-root': { color: '#ccc' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={newTeam.description}
                          onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: '#555' },
                              '&:hover fieldset': { borderColor: '#777' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                            },
                            '& .MuiInputLabel-root': { color: '#ccc' }
                          }}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                        sx={{ mr: 1 }}
                      >
                        Next
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 2: Agent Selection */}
                <Step>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
                    Agent Selection
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      Select agents to include in your multi-agent team (minimum 2 required):
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <Grid container spacing={2}>
                        {availableAgents.map(agent => (
                          <Grid item xs={12} md={6} key={agent.id}>
                            <Card 
                              sx={{ 
                                backgroundColor: newTeam.selected_agents.find(a => a.id === agent.id) ? '#1976d2' : '#333',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => handleAgentSelection(
                                agent, 
                                !newTeam.selected_agents.find(a => a.id === agent.id)
                              )}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Checkbox
                                    checked={!!newTeam.selected_agents.find(a => a.id === agent.id)}
                                    sx={{ color: 'white', p: 0, mr: 1 }}
                                  />
                                  <Typography variant="body1" sx={{ color: 'white', flex: 1 }}>
                                    {agent.name}
                                  </Typography>
                                  <Chip 
                                    label={agent.role || 'specialist'} 
                                    size="small" 
                                    sx={{ 
                                      backgroundColor: getRoleColor(agent.role || 'specialist'), 
                                      color: 'white',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ color: '#ccc', fontSize: '0.8rem' }}>
                                  {agent.description}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                        sx={{ mr: 1 }}
                      >
                        Next
                      </Button>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 3: Flow Configuration */}
                <Step>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
                    Flow Configuration
                  </StepLabel>
                  <StepContent>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel sx={{ color: '#ccc' }}>Workflow Type</InputLabel>
                      <Select
                        value={newTeam.workflow}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, workflow: e.target.value as any }))}
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#777' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
                        }}
                      >
                        <MenuItem value="pipeline">Pipeline - Sequential processing</MenuItem>
                        <MenuItem value="consensus">Consensus - Collaborative agreement</MenuItem>
                        <MenuItem value="debate">Debate - Competitive analysis</MenuItem>
                        <MenuItem value="swarm">Swarm - Parallel processing</MenuItem>
                      </Select>
                    </FormControl>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                        sx={{ mr: 1 }}
                      >
                        Next
                      </Button>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 4: Governance Rules */}
                <Step>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
                    Governance Rules
                  </StepLabel>
                  <StepContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={newTeam.governance_enabled}
                          onChange={(e) => setNewTeam(prev => ({ ...prev, governance_enabled: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4caf50' }
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GovernanceIcon sx={{ color: newTeam.governance_enabled ? '#4caf50' : '#ccc' }} />
                          <Typography sx={{ color: 'white' }}>
                            Enable Promethios Governance
                          </Typography>
                        </Box>
                      }
                      sx={{ color: 'white', mb: 2 }}
                    />
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      {newTeam.governance_enabled 
                        ? "Multi-agent coordination will include trust metrics, compliance monitoring, and ethical oversight across all agents."
                        : "Agents will operate without governance oversight - use with caution."
                      }
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mr: 1 }}
                      >
                        Next
                      </Button>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 5: Review & Create */}
                <Step>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
                    Review & Create
                  </StepLabel>
                  <StepContent>
                    <Paper sx={{ p: 2, backgroundColor: '#333', color: 'white', mb: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Team Summary</Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        <strong>Name:</strong> {newTeam.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        <strong>Description:</strong> {newTeam.description}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        <strong>Workflow:</strong> {newTeam.workflow}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                        <strong>Governance:</strong> {newTeam.governance_enabled ? 'Enabled' : 'Disabled'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                        <strong>Agents:</strong> {newTeam.selected_agents.length} selected
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {newTeam.selected_agents.map(agent => (
                          <Chip 
                            key={agent.id}
                            label={agent.name} 
                            size="small" 
                            sx={{ backgroundColor: '#555', color: 'white' }}
                          />
                        ))}
                      </Box>
                    </Paper>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleCreateCustomTeam}
                        disabled={loading}
                        sx={{ 
                          mr: 1,
                          backgroundColor: '#4caf50',
                          '&:hover': { backgroundColor: '#45a049' }
                        }}
                      >
                        {loading ? <CircularProgress size={20} /> : 'Create Team'}
                      </Button>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDialogOpen(false)}
                sx={{ color: '#ccc' }}
                disabled={loading}
              >
                Cancel
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MultiAgentWrapper;

