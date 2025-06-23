import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Button,
  Checkbox,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Star as StarIcon,
  Recommend as RecommendIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Agent, MultiAgentSystem, AdHocMultiAgentConfig } from '../types';

// Dark theme colors
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e'
};

const SelectorContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: DARK_THEME.surface,
  borderBottom: `1px solid ${DARK_THEME.border}`,
  borderRadius: '8px 8px 0 0'
}));

const ModeToggle = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px',
  backgroundColor: DARK_THEME.background,
  borderRadius: '6px',
  border: `1px solid ${DARK_THEME.border}`
}));

const ModeButton = styled(Button)<{ active?: boolean }>(({ active }) => ({
  minWidth: '100px',
  height: '32px',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'none',
  backgroundColor: active ? DARK_THEME.primary : 'transparent',
  color: active ? '#ffffff' : DARK_THEME.text.secondary,
  border: 'none',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: active ? DARK_THEME.primary : DARK_THEME.surface,
    border: 'none'
  }
}));

const WrapSystemButton = styled(Button)(() => ({
  backgroundColor: DARK_THEME.success,
  color: '#ffffff',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#2f855a'
  }
}));

interface EnhancedAgentSelectorProps {
  selectedAgent: Agent | null;
  selectedAgents: Agent[];
  selectedMultiAgentSystem: MultiAgentSystem | null;
  isMultiAgentMode: boolean;
  onAgentSelect: (agent: Agent | null) => void;
  onMultiAgentSelect: (agents: Agent[]) => void;
  onMultiAgentSystemSelect: (system: MultiAgentSystem | null) => void;
  onModeChange: (isMultiAgent: boolean) => void;
  onWrapAsSystem: (config: AdHocMultiAgentConfig) => void;
  showWrapButton: boolean;
  agents: Agent[];
  multiAgentSystems: MultiAgentSystem[];
}

export const EnhancedAgentSelector: React.FC<EnhancedAgentSelectorProps> = ({
  selectedAgent,
  selectedAgents,
  selectedMultiAgentSystem,
  isMultiAgentMode,
  onAgentSelect,
  onMultiAgentSelect,
  onMultiAgentSystemSelect,
  onModeChange,
  onWrapAsSystem,
  showWrapButton,
  agents,
  multiAgentSystems
}) => {
  const [wrapDialogOpen, setWrapDialogOpen] = useState(false);
  const [systemName, setSystemName] = useState('');
  const [systemDescription, setSystemDescription] = useState('');
  const [coordinationPattern, setCoordinationPattern] = useState<'sequential' | 'parallel' | 'hierarchical'>('sequential');

  // Generate suggested system name based on selected agents
  useEffect(() => {
    if (selectedAgents.length > 0) {
      const agentNames = selectedAgents.map(a => a.name.split(' ')[0]).join(' & ');
      setSystemName(`${agentNames} Team`);
      setSystemDescription(`Collaborative system combining ${selectedAgents.map(a => a.name).join(', ')} for enhanced problem-solving capabilities.`);
    }
  }, [selectedAgents]);

  const handleSingleAgentChange = (event: any) => {
    const agentId = event.target.value;
    const agent = agents.find(a => a.id === agentId) || null;
    onAgentSelect(agent);
  };

  const handleMultiAgentChange = (event: any) => {
    const agentIds = event.target.value as string[];
    // Ensure agents is an array before filtering
    const selectedAgentsList = (agents || []).filter(a => agentIds.includes(a.id));
    onMultiAgentSelect(selectedAgentsList);
  };

  const handleSystemSelect = (event: any) => {
    const systemId = event.target.value;
    if (systemId === '') {
      onMultiAgentSystemSelect(null);
      return;
    }
    const system = multiAgentSystems.find(s => s.id === systemId) || null;
    onMultiAgentSystemSelect(system);
  };

  const handleWrapAsSystem = () => {
    const config: AdHocMultiAgentConfig = {
      agents: selectedAgents.map((agent, index) => ({
        id: agent.id,
        role: index === 0 ? 'primary' : 'secondary'
      })),
      coordinationPattern,
      name: systemName,
      description: systemDescription
    };
    onWrapAsSystem(config);
    setWrapDialogOpen(false);
  };

  const getSuggestedCombinations = () => {
    // Return popular/recommended agent combinations
    return [
      { name: 'Research & Analysis', agents: ['factual-agent', 'data-analyst'] },
      { name: 'Creative Content', agents: ['creative-agent', 'technical-writer'] },
      { name: 'Problem Solving', agents: ['factual-agent', 'creative-agent', 'technical-advisor'] }
    ];
  };

  return (
    <>
      <SelectorContainer>
        {/* Mode Toggle */}
        <ModeToggle>
          <ModeButton
            active={!isMultiAgentMode}
            onClick={() => onModeChange(false)}
            startIcon={<PersonIcon />}
          >
            Single Agent
          </ModeButton>
          <ModeButton
            active={isMultiAgentMode}
            onClick={() => onModeChange(true)}
            startIcon={<GroupIcon />}
          >
            Multi-Agent
          </ModeButton>
        </ModeToggle>

        {/* Agent Selection */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMultiAgentMode ? (
            // Single Agent Selector
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Select Agent</InputLabel>
              <Select
                value={selectedAgent?.id || ''}
                onChange={handleSingleAgentChange}
                label="Select Agent"
                sx={{
                  color: DARK_THEME.text.primary,
                  backgroundColor: DARK_THEME.background,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: DARK_THEME.border
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: DARK_THEME.primary
                  }
                }}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: DARK_THEME.primary }}>
                        {agent.avatar}
                      </Avatar>
                      <Typography>{agent.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            // Multi-Agent Selector
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {/* Existing Systems Dropdown */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Existing Systems</InputLabel>
                <Select
                  value={selectedMultiAgentSystem?.id || ''}
                  onChange={handleSystemSelect}
                  label="Existing Systems"
                  sx={{
                    color: DARK_THEME.text.primary,
                    backgroundColor: DARK_THEME.background,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: DARK_THEME.border
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>None - Create Ad Hoc</em>
                  </MenuItem>
                  {multiAgentSystems.map((system) => (
                    <MenuItem key={system.id} value={system.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon sx={{ color: DARK_THEME.warning, fontSize: 16 }} />
                        <Typography>{system.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Ad Hoc Agent Selection */}
              {!selectedMultiAgentSystem && (
                <FormControl size="small" sx={{ minWidth: 250 }}>
                  <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Select Agents</InputLabel>
                  <Select
                    multiple
                    value={selectedAgents.map(a => a.id)}
                    onChange={handleMultiAgentChange}
                    label="Select Agents"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((agentId) => {
                          const agent = agents.find(a => a.id === agentId);
                          return agent ? (
                            <Chip
                              key={agentId}
                              label={agent.name}
                              size="small"
                              avatar={<Avatar sx={{ bgcolor: DARK_THEME.primary }}>{agent.avatar}</Avatar>}
                              sx={{ 
                                color: DARK_THEME.text.primary,
                                backgroundColor: DARK_THEME.surface
                              }}
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                    sx={{
                      color: DARK_THEME.text.primary,
                      backgroundColor: DARK_THEME.background,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: DARK_THEME.border
                      }
                    }}
                  >
                    {agents.map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        <Checkbox 
                          checked={selectedAgents.some(a => a.id === agent.id)}
                          sx={{ color: DARK_THEME.primary }}
                        />
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: DARK_THEME.primary }}>
                                {agent.avatar}
                              </Avatar>
                              <Typography>{agent.name}</Typography>
                            </Box>
                          }
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Wrap as System Button */}
          {showWrapButton && isMultiAgentMode && selectedAgents.length >= 2 && (
            <Tooltip title="Save this agent combination as a reusable system">
              <WrapSystemButton
                size="small"
                startIcon={<SaveIcon />}
                onClick={() => setWrapDialogOpen(true)}
              >
                Wrap as System
              </WrapSystemButton>
            </Tooltip>
          )}

          {/* Settings */}
          <IconButton size="small" sx={{ color: DARK_THEME.text.secondary }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </SelectorContainer>

      {/* Suggested Combinations */}
      {isMultiAgentMode && !selectedMultiAgentSystem && selectedAgents.length === 0 && (
        <Box sx={{ padding: '8px 16px', backgroundColor: DARK_THEME.background, borderBottom: `1px solid ${DARK_THEME.border}` }}>
          <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <RecommendIcon sx={{ fontSize: 14 }} />
            Suggested Combinations
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {getSuggestedCombinations().map((combo, index) => (
              <Chip
                key={index}
                label={combo.name}
                size="small"
                clickable
                onClick={() => {
                  const comboAgents = (agents || []).filter(a => combo.agents.includes(a.id));
                  onMultiAgentSelect(comboAgents);
                }}
                sx={{
                  color: DARK_THEME.text.primary,
                  backgroundColor: DARK_THEME.surface,
                  border: `1px solid ${DARK_THEME.border}`,
                  '&:hover': {
                    backgroundColor: DARK_THEME.primary + '20'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Wrap as System Dialog */}
      <Dialog 
        open={wrapDialogOpen} 
        onClose={() => setWrapDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: DARK_THEME.surface,
            color: DARK_THEME.text.primary
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SaveIcon sx={{ color: DARK_THEME.success }} />
            Wrap as Multi-Agent System
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, backgroundColor: DARK_THEME.primary + '20' }}>
            Create a reusable system from your current agent selection. This will be available for future chats.
          </Alert>
          
          <TextField
            fullWidth
            label="System Name"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: DARK_THEME.text.primary,
                backgroundColor: DARK_THEME.background,
                '& fieldset': { borderColor: DARK_THEME.border }
              },
              '& .MuiInputLabel-root': { color: DARK_THEME.text.secondary }
            }}
          />
          
          <TextField
            fullWidth
            label="Description"
            value={systemDescription}
            onChange={(e) => setSystemDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: DARK_THEME.text.primary,
                backgroundColor: DARK_THEME.background,
                '& fieldset': { borderColor: DARK_THEME.border }
              },
              '& .MuiInputLabel-root': { color: DARK_THEME.text.secondary }
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Coordination Pattern</InputLabel>
            <Select
              value={coordinationPattern}
              onChange={(e) => setCoordinationPattern(e.target.value as any)}
              label="Coordination Pattern"
              sx={{
                color: DARK_THEME.text.primary,
                backgroundColor: DARK_THEME.background,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: DARK_THEME.border }
              }}
            >
              <MenuItem value="sequential">Sequential - Agents work one after another</MenuItem>
              <MenuItem value="parallel">Parallel - Agents work simultaneously</MenuItem>
              <MenuItem value="hierarchical">Hierarchical - Lead agent coordinates others</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.secondary, mb: 1 }}>
              Selected Agents:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedAgents.map((agent) => (
                <Chip
                  key={agent.id}
                  label={agent.name}
                  avatar={<Avatar sx={{ bgcolor: DARK_THEME.primary }}>{agent.avatar}</Avatar>}
                  sx={{ 
                    color: DARK_THEME.text.primary,
                    backgroundColor: DARK_THEME.background,
                    border: `1px solid ${DARK_THEME.border}`
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setWrapDialogOpen(false)}
            sx={{ color: DARK_THEME.text.secondary }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleWrapAsSystem}
            variant="contained"
            startIcon={<CheckCircleIcon />}
            sx={{ 
              backgroundColor: DARK_THEME.success,
              '&:hover': { backgroundColor: '#2f855a' }
            }}
            disabled={!systemName.trim()}
          >
            Create System
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EnhancedAgentSelector;

