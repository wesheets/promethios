import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Dark theme styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: '#1a202c',
    color: '#e2e8f0',
    borderRadius: '12px',
    minWidth: '600px',
    maxWidth: '800px'
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#2d3748',
  border: '1px solid #4a5568',
  borderRadius: '8px',
  marginBottom: '16px'
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    color: '#a0aec0'
  },
  '& .MuiSelect-root': {
    backgroundColor: '#4a5568',
    color: '#e2e8f0',
    borderRadius: '6px'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#4a5568'
  },
  '& .MuiSelect-icon': {
    color: '#a0aec0'
  }
}));

// Career roles (professional contexts)
const CAREER_ROLES = [
  { value: 'legal', label: 'Legal Counsel', icon: '⚖️' },
  { value: 'hr', label: 'HR Specialist', icon: '👥' },
  { value: 'customer_service', label: 'Customer Service', icon: '🎧' },
  { value: 'cto', label: 'Chief Technology Officer', icon: '💻' },
  { value: 'cfo', label: 'Chief Financial Officer', icon: '💰' },
  { value: 'marketing', label: 'Marketing Specialist', icon: '📈' },
  { value: 'sales', label: 'Sales Representative', icon: '🤝' },
  { value: 'product_manager', label: 'Product Manager', icon: '📋' },
  { value: 'engineer', label: 'Software Engineer', icon: '⚙️' },
  { value: 'designer', label: 'UX/UI Designer', icon: '🎨' },
  { value: 'analyst', label: 'Business Analyst', icon: '📊' },
  { value: 'consultant', label: 'Strategy Consultant', icon: '🎯' },
  { value: 'researcher', label: 'Research Specialist', icon: '🔬' },
  { value: 'writer', label: 'Content Writer', icon: '✍️' },
  { value: 'trainer', label: 'Training Specialist', icon: '🎓' }
];

// Behaviors (interaction styles from MAS Collaboration)
const BEHAVIORS = [
  { value: 'collaborative', label: 'Collaborative', description: 'Works cooperatively and builds on others\' ideas', color: '#10b981' },
  { value: 'devils_advocate', label: 'Devil\'s Advocate', description: 'Challenges ideas and asks tough questions', color: '#ef4444' },
  { value: 'expert', label: 'Expert', description: 'Provides deep domain knowledge and expertise', color: '#3b82f6' },
  { value: 'facilitator', label: 'Facilitator', description: 'Guides discussions and keeps conversations on track', color: '#8b5cf6' },
  { value: 'critic', label: 'Critic', description: 'Provides constructive criticism and identifies flaws', color: '#f59e0b' },
  { value: 'creative', label: 'Creative', description: 'Generates innovative ideas and creative solutions', color: '#ec4899' },
  { value: 'analyst', label: 'Analyst', description: 'Breaks down complex problems and provides data-driven insights', color: '#06b6d4' }
];

interface AgentConfig {
  agentId: string;
  agentName: string;
  careerRole: string;
  behavior: string;
}

interface AgentConfigurationPopupProps {
  open: boolean;
  onClose: () => void;
  selectedAgents: Array<{
    id: string;
    name: string;
    avatar?: string;
    provider?: string;
  }>;
  onConfigureAgents: (configurations: AgentConfig[]) => void;
}

export const AgentConfigurationPopup: React.FC<AgentConfigurationPopupProps> = ({
  open,
  onClose,
  selectedAgents,
  onConfigureAgents
}) => {
  const [configurations, setConfigurations] = useState<AgentConfig[]>(
    selectedAgents.map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      careerRole: '',
      behavior: 'collaborative' // Default to collaborative
    }))
  );

  const handleCareerRoleChange = (agentId: string, careerRole: string) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.agentId === agentId 
          ? { ...config, careerRole }
          : config
      )
    );
  };

  const handleBehaviorChange = (agentId: string, behavior: string) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.agentId === agentId 
          ? { ...config, behavior }
          : config
      )
    );
  };

  const handleConfigureAgents = () => {
    onConfigureAgents(configurations);
    onClose();
  };

  const getAgentAvatar = (agent: any) => {
    if (agent.provider === 'anthropic' || agent.name.toLowerCase().includes('claude')) {
      return 'C';
    } else if (agent.provider === 'openai' || agent.name.toLowerCase().includes('openai') || agent.name.toLowerCase().includes('gpt')) {
      return 'O';
    } else if (agent.provider === 'google' || agent.name.toLowerCase().includes('gemini')) {
      return 'G';
    }
    return agent.name.charAt(0).toUpperCase();
  };

  const getAgentColor = (agent: any) => {
    if (agent.provider === 'anthropic' || agent.name.toLowerCase().includes('claude')) {
      return '#3b82f6'; // Blue for Claude
    } else if (agent.provider === 'openai' || agent.name.toLowerCase().includes('openai') || agent.name.toLowerCase().includes('gpt')) {
      return '#10b981'; // Green for OpenAI
    } else if (agent.provider === 'google' || agent.name.toLowerCase().includes('gemini')) {
      return '#8b5cf6'; // Purple for Gemini
    }
    return '#6b7280'; // Gray for unknown
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
            🎭 Configure Guest Agents
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1 }}>
          Assign career roles and behaviors to shape how agents participate in this conversation
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {selectedAgents.map((agent, index) => {
            const config = configurations.find(c => c.agentId === agent.id);
            const selectedBehavior = BEHAVIORS.find(b => b.value === config?.behavior);
            
            return (
              <StyledCard key={agent.id}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getAgentColor(agent),
                        width: 40,
                        height: 40,
                        fontSize: '18px',
                        fontWeight: 600
                      }}
                    >
                      {getAgentAvatar(agent)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                        {agent.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        AI Agent • {agent.provider || 'Unknown Provider'}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <StyledFormControl fullWidth>
                        <InputLabel>Career Role</InputLabel>
                        <Select
                          value={config?.careerRole || ''}
                          onChange={(e) => handleCareerRoleChange(agent.id, e.target.value)}
                          label="Career Role"
                        >
                          <MenuItem value="">
                            <em>Select a role...</em>
                          </MenuItem>
                          {CAREER_ROLES.map(role => (
                            <MenuItem key={role.value} value={role.value}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <span>{role.icon}</span>
                                <span>{role.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </StyledFormControl>
                    </Grid>

                    <Grid item xs={6}>
                      <StyledFormControl fullWidth>
                        <InputLabel>Behavior</InputLabel>
                        <Select
                          value={config?.behavior || 'collaborative'}
                          onChange={(e) => handleBehaviorChange(agent.id, e.target.value)}
                          label="Behavior"
                        >
                          {BEHAVIORS.map(behavior => (
                            <MenuItem key={behavior.value} value={behavior.value}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box 
                                  sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    backgroundColor: behavior.color 
                                  }} 
                                />
                                <span>{behavior.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </StyledFormControl>
                    </Grid>
                  </Grid>

                  {selectedBehavior && (
                    <Box mt={2}>
                      <Chip
                        label={selectedBehavior.description}
                        size="small"
                        sx={{
                          backgroundColor: selectedBehavior.color + '20',
                          color: selectedBehavior.color,
                          border: `1px solid ${selectedBehavior.color}40`
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </StyledCard>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#a0aec0',
            '&:hover': { backgroundColor: '#4a5568' }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfigureAgents}
          variant="contained"
          sx={{ 
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            fontWeight: 600
          }}
        >
          Configure Agents
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AgentConfigurationPopup;

