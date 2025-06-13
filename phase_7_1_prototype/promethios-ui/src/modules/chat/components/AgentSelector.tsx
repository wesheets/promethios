/**
 * Agent Selector component for choosing and configuring agents
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';
import { 
  Person as PersonIcon,
  Group as GroupIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  Agent, 
  MultiAgentSystem, 
  AdHocMultiAgentConfig,
  ChatMode 
} from '../types';
import { agentWrapperRegistry } from '../../agent-wrapping/services/AgentWrapperRegistry';
import { multiAgentSystemRegistry } from '../../agent-wrapping/services/MultiAgentSystemRegistry';

interface AgentSelectorProps {
  mode: ChatMode;
  onAgentSelected: (agent: Agent | null) => void;
  onMultiAgentConfigured: (config: AdHocMultiAgentConfig | null) => void;
  disabled?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  mode,
  onAgentSelected,
  onMultiAgentConfigured,
  disabled = false
}) => {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableSystems, setAvailableSystems] = useState<MultiAgentSystem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [coordinationPattern, setCoordinationPattern] = useState<'sequential' | 'parallel' | 'hierarchical'>('parallel');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgentsAndSystems();
  }, []);

  const loadAgentsAndSystems = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock user ID for demo
      const userId = 'demo-user';
      
      const [userAgents, userSystems] = await Promise.all([
        agentWrapperRegistry.getUserAgents(userId),
        multiAgentSystemRegistry.getUserSystems(userId)
      ]);

      // Add some demo agents if none exist
      const demoAgents: Agent[] = [
        {
          id: 'agent-1',
          name: 'Research Assistant',
          description: 'Specialized in research and analysis',
          status: 'online',
          governanceScore: 95
        },
        {
          id: 'agent-2', 
          name: 'Creative Writer',
          description: 'Expert in creative content and storytelling',
          status: 'online',
          governanceScore: 88
        },
        {
          id: 'agent-3',
          name: 'Technical Advisor',
          description: 'Focused on technical solutions and implementation',
          status: 'online',
          governanceScore: 92
        }
      ];

      setAvailableAgents([...userAgents, ...demoAgents]);
      setAvailableSystems(userSystems);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    onAgentSelected(agent);
    // Clear multi-agent selection
    setSelectedAgents([]);
    onMultiAgentConfigured(null);
  };

  const handleMultiAgentToggle = (agent: Agent, checked: boolean) => {
    let newSelection: Agent[];
    
    if (checked) {
      newSelection = [...selectedAgents, agent];
    } else {
      newSelection = selectedAgents.filter(a => a.id !== agent.id);
    }

    setSelectedAgents(newSelection);

    // Clear single agent selection
    setSelectedAgent(null);
    onAgentSelected(null);

    // Update multi-agent configuration
    if (newSelection.length > 0) {
      const config: AdHocMultiAgentConfig = {
        agents: newSelection,
        coordinationPattern,
        maxAgents: 5
      };
      onMultiAgentConfigured(config);
    } else {
      onMultiAgentConfigured(null);
    }
  };

  const handleCoordinationPatternChange = (pattern: 'sequential' | 'parallel' | 'hierarchical') => {
    setCoordinationPattern(pattern);
    
    if (selectedAgents.length > 0) {
      const config: AdHocMultiAgentConfig = {
        agents: selectedAgents,
        coordinationPattern: pattern,
        maxAgents: 5
      };
      onMultiAgentConfigured(config);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  if (mode !== 'multi-agent') {
    return null;
  }

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <GroupIcon sx={{ mr: 1 }} />
        Agent Selection
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading agents...</Typography>
      ) : (
        <Box>
          {/* Single Agent Selection */}
          <Typography variant="subtitle2" gutterBottom>
            Single Agent Mode
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {availableAgents.map((agent) => (
              <Chip
                key={agent.id}
                icon={<PersonIcon />}
                label={`${agent.name} (${agent.governanceScore}%)`}
                onClick={() => handleSingleAgentSelect(agent)}
                color={selectedAgent?.id === agent.id ? 'primary' : 'default'}
                variant={selectedAgent?.id === agent.id ? 'filled' : 'outlined'}
                disabled={disabled}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>

          {/* Multi-Agent Selection */}
          <Typography variant="subtitle2" gutterBottom>
            Multi-Agent Mode
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            {availableAgents.map((agent) => (
              <FormControlLabel
                key={agent.id}
                control={
                  <Checkbox
                    checked={selectedAgents.some(a => a.id === agent.id)}
                    onChange={(e) => handleMultiAgentToggle(agent, e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{agent.name}</Typography>
                    <Chip 
                      label={agent.status} 
                      size="small" 
                      color={getStatusColor(agent.status) as any}
                    />
                    <Typography variant="caption" color="text.secondary">
                      ({agent.governanceScore}%)
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Box>

          {/* Coordination Pattern */}
          {selectedAgents.length > 1 && (
            <Box sx={{ mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Coordination Pattern</InputLabel>
                <Select
                  value={coordinationPattern}
                  label="Coordination Pattern"
                  onChange={(e) => handleCoordinationPatternChange(e.target.value as any)}
                  disabled={disabled}
                >
                  <MenuItem value="parallel">Parallel (All respond simultaneously)</MenuItem>
                  <MenuItem value="sequential">Sequential (One after another)</MenuItem>
                  <MenuItem value="hierarchical">Hierarchical (By governance score)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Selection Summary */}
          {(selectedAgent || selectedAgents.length > 0) && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Selection:
              </Typography>
              {selectedAgent && (
                <Typography variant="body2">
                  Single Agent: {selectedAgent.name}
                </Typography>
              )}
              {selectedAgents.length > 0 && (
                <Box>
                  <Typography variant="body2">
                    Multi-Agent ({coordinationPattern}): {selectedAgents.map(a => a.name).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default AgentSelector;

