import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Checkbox,
  TextField,
  Alert,
  Divider,
  Badge
} from '@mui/material';
import {
  Person as PersonIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  ChatMode, 
  Agent, 
  MultiAgentSystem,
  AdHocMultiAgentConfig 
} from '../types';
import { agentWrapperRegistry } from '../../agent-wrapping/services/AgentWrapperRegistry';
import { multiAgentSystemRegistry } from '../../agent-wrapping/services/MultiAgentSystemRegistry';

interface AgentSelectorProps {
  userId: string;
  currentMode: ChatMode;
  selectedAgentId?: string;
  selectedSystemId?: string;
  adHocConfig?: AdHocMultiAgentConfig;
  onModeChange: (mode: ChatMode) => void;
  onAgentSelect: (agentId: string) => void;
  onSystemSelect: (systemId: string) => void;
  onAdHocConfigChange: (config: AdHocMultiAgentConfig) => void;
  onWrapAsSystem?: (config: AdHocMultiAgentConfig) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  userId,
  currentMode,
  selectedAgentId,
  selectedSystemId,
  adHocConfig,
  onModeChange,
  onAgentSelect,
  onSystemSelect,
  onAdHocConfigChange,
  onWrapAsSystem
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [multiAgentSystems, setMultiAgentSystems] = useState<MultiAgentSystem[]>([]);
  const [showAdHocDialog, setShowAdHocDialog] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [adHocName, setAdHocName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load agents and systems
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [userAgents, userSystems] = await Promise.all([
          agentWrapperRegistry.getUserAgents(userId),
          multiAgentSystemRegistry.getUserSystems(userId)
        ]);
        setAgents(userAgents);
        setMultiAgentSystems(userSystems);
      } catch (error) {
        console.error('Error loading agents and systems:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Get current selection display
  const getCurrentSelection = () => {
    if (currentMode === ChatMode.STANDARD || currentMode === ChatMode.GOVERNANCE) {
      const agent = agents.find(a => a.id === selectedAgentId);
      return agent ? {
        name: agent.name,
        avatar: agent.avatar,
        type: 'agent',
        status: agent.status || 'online'
      } : null;
    } else if (currentMode === ChatMode.MULTI_AGENT && selectedSystemId) {
      const system = multiAgentSystems.find(s => s.id === selectedSystemId);
      return system ? {
        name: system.name,
        avatar: undefined,
        type: 'system',
        agentCount: system.agents.length
      } : null;
    } else if (currentMode === ChatMode.MULTI_AGENT && adHocConfig) {
      return {
        name: adHocConfig.name || 'Ad-hoc Multi-Agent',
        avatar: undefined,
        type: 'adhoc',
        agentCount: adHocConfig.agentIds.length
      };
    }
    return null;
  };

  // Handle mode change
  const handleModeChange = (mode: ChatMode) => {
    onModeChange(mode);
    
    // Auto-select first available option for the new mode
    if (mode === ChatMode.STANDARD || mode === ChatMode.GOVERNANCE) {
      if (agents.length > 0 && !selectedAgentId) {
        onAgentSelect(agents[0].id);
      }
    } else if (mode === ChatMode.MULTI_AGENT) {
      if (multiAgentSystems.length > 0 && !selectedSystemId && !adHocConfig) {
        onSystemSelect(multiAgentSystems[0].id);
      }
    }
  };

  // Handle ad-hoc multi-agent creation
  const handleCreateAdHoc = () => {
    setSelectedAgents([]);
    setAdHocName('');
    setShowAdHocDialog(true);
  };

  // Confirm ad-hoc creation
  const confirmAdHocCreation = () => {
    if (selectedAgents.length >= 2) {
      const config: AdHocMultiAgentConfig = {
        name: adHocName || `Multi-Agent Chat (${selectedAgents.length} agents)`,
        agentIds: selectedAgents,
        createdAt: new Date(),
        isTemporary: true
      };
      onAdHocConfigChange(config);
      setShowAdHocDialog(false);
    }
  };

  // Handle wrap as system
  const handleWrapAsSystem = () => {
    if (adHocConfig && onWrapAsSystem) {
      onWrapAsSystem(adHocConfig);
    }
  };

  // Get agent compatibility score (mock)
  const getCompatibilityScore = (agentIds: string[]) => {
    // Mock compatibility calculation
    if (agentIds.length < 2) return 0;
    return Math.floor(Math.random() * 30) + 70; // 70-100%
  };

  const currentSelection = getCurrentSelection();
  const compatibilityScore = selectedAgents.length >= 2 ? getCompatibilityScore(selectedAgents) : 0;

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      {/* Mode Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Chat Mode
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {Object.values(ChatMode).map((mode) => {
            const isSelected = currentMode === mode;
            const getChipProps = () => {
              switch (mode) {
                case ChatMode.STANDARD:
                  return { icon: <PersonIcon />, color: 'primary' as const };
                case ChatMode.GOVERNANCE:
                  return { icon: <SecurityIcon />, color: 'success' as const };
                case ChatMode.MULTI_AGENT:
                  return { icon: <GroupIcon />, color: 'secondary' as const };
                default:
                  return { color: 'default' as const };
              }
            };

            return (
              <Chip
                key={mode}
                label={mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {...getChipProps()}
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => handleModeChange(mode)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Current Selection Display */}
      {currentSelection && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Selection
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.default'
            }}
          >
            <Avatar
              src={currentSelection.avatar}
              sx={{ width: 40, height: 40, mr: 2 }}
            >
              {currentSelection.type === 'system' || currentSelection.type === 'adhoc' ? (
                <GroupIcon />
              ) : (
                currentSelection.name.charAt(0)
              )}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                {currentSelection.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentSelection.type === 'agent' && `Status: ${currentSelection.status}`}
                {(currentSelection.type === 'system' || currentSelection.type === 'adhoc') && 
                  `${currentSelection.agentCount} agents`}
              </Typography>
            </Box>

            {currentSelection.type === 'adhoc' && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleWrapAsSystem}
                startIcon={<SettingsIcon />}
              >
                Wrap as System
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Agent/System Selection */}
      {(currentMode === ChatMode.STANDARD || currentMode === ChatMode.GOVERNANCE) && (
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Agent</InputLabel>
            <Select
              value={selectedAgentId || ''}
              onChange={(e) => onAgentSelect(e.target.value)}
              label="Select Agent"
            >
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar
                      src={agent.avatar}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    >
                      {agent.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{agent.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {agent.category}
                      </Typography>
                    </Box>
                    <Chip
                      label={agent.status || 'online'}
                      size="small"
                      color={agent.status === 'online' ? 'success' : 'default'}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {currentMode === ChatMode.MULTI_AGENT && (
        <Box sx={{ mb: 2 }}>
          {/* Pre-wrapped Systems */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Multi-Agent Systems
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Select System</InputLabel>
              <Select
                value={selectedSystemId || ''}
                onChange={(e) => onSystemSelect(e.target.value)}
                label="Select System"
              >
                {multiAgentSystems.map((system) => (
                  <MenuItem key={system.id} value={system.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{system.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {system.agents.length} agents • {system.flowType}
                        </Typography>
                      </Box>
                      <Badge badgeContent={system.agents.length} color="primary" />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Ad-hoc Creation */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateAdHoc}
            sx={{ mb: 1 }}
          >
            Create Ad-hoc Multi-Agent Chat
          </Button>

          {adHocConfig && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Testing {adHocConfig.agentIds.length} agents together. 
              <Button size="small" onClick={handleWrapAsSystem} sx={{ ml: 1 }}>
                Wrap as System
              </Button>
            </Alert>
          )}
        </Box>
      )}

      {/* Ad-hoc Multi-Agent Dialog */}
      <Dialog
        open={showAdHocDialog}
        onClose={() => setShowAdHocDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Create Multi-Agent Chat
            <IconButton onClick={() => setShowAdHocDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            label="Chat Name (Optional)"
            value={adHocName}
            onChange={(e) => setAdHocName(e.target.value)}
            placeholder="e.g., Research & Analysis Team"
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Select Agents (2-5 recommended)
          </Typography>
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {agents.map((agent) => (
              <ListItem key={agent.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    setSelectedAgents(prev => 
                      prev.includes(agent.id)
                        ? prev.filter(id => id !== agent.id)
                        : [...prev, agent.id]
                    );
                  }}
                  disabled={!selectedAgents.includes(agent.id) && selectedAgents.length >= 5}
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedAgents.includes(agent.id)}
                      disabled={!selectedAgents.includes(agent.id) && selectedAgents.length >= 5}
                    />
                  </ListItemIcon>
                  <ListItemIcon>
                    <Avatar src={agent.avatar} sx={{ width: 32, height: 32 }}>
                      {agent.name.charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={agent.name}
                    secondary={`${agent.category} • ${agent.capabilities?.join(', ') || 'General'}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {selectedAgents.length >= 2 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Compatibility Analysis
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Agent Compatibility Score
                </Typography>
                <Chip
                  label={`${compatibilityScore}%`}
                  color={compatibilityScore >= 80 ? 'success' : compatibilityScore >= 60 ? 'warning' : 'error'}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {compatibilityScore >= 80 && "Excellent compatibility - these agents work well together"}
                {compatibilityScore >= 60 && compatibilityScore < 80 && "Good compatibility - minor coordination needed"}
                {compatibilityScore < 60 && "Consider different agent combination for better results"}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowAdHocDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmAdHocCreation}
            variant="contained"
            disabled={selectedAgents.length < 2}
            startIcon={<CheckIcon />}
          >
            Create Chat ({selectedAgents.length} agents)
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

