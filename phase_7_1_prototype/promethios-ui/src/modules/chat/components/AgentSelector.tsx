/**
 * Enhanced Agent Selector with Ad Hoc and Pre-Wrapped Multi-Agent Systems
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
  Alert,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Star as StarIcon,
  Security as SecurityIcon
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
  onMultiAgentSystemSelected: (system: MultiAgentSystem | null) => void;
  disabled?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  mode,
  onAgentSelected,
  onMultiAgentConfigured,
  onMultiAgentSystemSelected,
  disabled = false
}) => {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableSystems, setAvailableSystems] = useState<MultiAgentSystem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<MultiAgentSystem | null>(null);
  const [coordinationPattern, setCoordinationPattern] = useState<'sequential' | 'parallel' | 'hierarchical'>('parallel');
  const [agentRoles, setAgentRoles] = useState<Record<string, string>>({});
  const [systemName, setSystemName] = useState<string>('');
  const [systemDescription, setSystemDescription] = useState<string>('');
  const [systemType, setSystemType] = useState<'sequential' | 'parallel' | 'hierarchical'>('parallel');
  const [tabValue, setTabValue] = useState(0);
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
          governanceScore: 95,
          capabilities: ['research', 'analysis', 'data-processing']
        },
        {
          id: 'agent-2',
          name: 'Creative Writer',
          description: 'Expert in creative content and storytelling',
          status: 'online',
          governanceScore: 88,
          capabilities: ['writing', 'creativity', 'storytelling']
        },
        {
          id: 'agent-3',
          name: 'Technical Advisor',
          description: 'Focused on technical solutions and implementation',
          status: 'online',
          governanceScore: 92,
          capabilities: ['technical', 'implementation', 'problem-solving']
        },
        {
          id: 'agent-4',
          name: 'Data Analyst',
          description: 'Expert in data analysis and visualization',
          status: 'online',
          governanceScore: 90,
          capabilities: ['data-analysis', 'visualization', 'statistics']
        },
        {
          id: 'agent-5',
          name: 'Project Manager',
          description: 'Coordination and project management specialist',
          status: 'online',
          governanceScore: 94,
          capabilities: ['coordination', 'planning', 'management']
        }
      ];

      // Add some demo multi-agent systems
      const demoSystems: MultiAgentSystem[] = [
        {
          id: 'system-1',
          name: 'Research & Analysis Team',
          description: 'Combined research and technical analysis capabilities',
          agents: [demoAgents[0], demoAgents[3]],
          coordinationPattern: 'sequential',
          governanceScore: 93,
          status: 'active'
        },
        {
          id: 'system-2',
          name: 'Creative Development Squad',
          description: 'Creative writing with technical implementation',
          agents: [demoAgents[1], demoAgents[2]],
          coordinationPattern: 'parallel',
          governanceScore: 90,
          status: 'active'
        }
      ];

      setAvailableAgents([...userAgents, ...demoAgents]);
      setAvailableSystems([...userSystems, ...demoSystems]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    onAgentSelected(agent);
    // Clear multi-agent selections
    setSelectedAgents([]);
    setSelectedSystem(null);
    onMultiAgentConfigured(null);
    onMultiAgentSystemSelected(null);
  };

  const handleMultiAgentToggle = (agent: Agent, checked: boolean) => {
    let newSelection: Agent[];

    if (checked) {
      newSelection = [...selectedAgents, agent];
      // Set default role
      setAgentRoles(prev => ({
        ...prev,
        [agent.id]: agent.capabilities?.[0] || 'general'
      }));
    } else {
      newSelection = selectedAgents.filter(a => a.id !== agent.id);
      // Remove role
      setAgentRoles(prev => {
        const newRoles = { ...prev };
        delete newRoles[agent.id];
        return newRoles;
      });
    }

    setSelectedAgents(newSelection);

    // Clear single agent and system selections
    setSelectedAgent(null);
    setSelectedSystem(null);
    onAgentSelected(null);
    onMultiAgentSystemSelected(null);

    // Update multi-agent configuration
    if (newSelection.length > 0) {
      const config: AdHocMultiAgentConfig = {
        agents: newSelection,
        coordinationPattern,
        maxAgents: 5,
        roles: agentRoles
      };
      onMultiAgentConfigured(config);
    } else {
      onMultiAgentConfigured(null);
    }
  };

  const handleSystemSelect = (system: MultiAgentSystem) => {
    setSelectedSystem(system);
    onMultiAgentSystemSelected(system);
    // Clear other selections
    setSelectedAgent(null);
    setSelectedAgents([]);
    onAgentSelected(null);
    onMultiAgentConfigured(null);
  };

  const handleRoleChange = (agentId: string, role: string) => {
    const newRoles = { ...agentRoles, [agentId]: role };
    setAgentRoles(newRoles);

    if (selectedAgents.length > 0) {
      const config: AdHocMultiAgentConfig = {
        agents: selectedAgents,
        coordinationPattern,
        maxAgents: 5,
        roles: newRoles
      };
      onMultiAgentConfigured(config);
    }
  };

  const handleCoordinationPatternChange = (pattern: 'sequential' | 'parallel' | 'hierarchical') => {
    setCoordinationPattern(pattern);

    if (selectedAgents.length > 0) {
      const config: AdHocMultiAgentConfig = {
        agents: selectedAgents,
        coordinationPattern: pattern,
        maxAgents: 5,
        roles: agentRoles
      };
      onMultiAgentConfigured(config);
    }
  };

  const handleSaveAsSystem = async () => {
    if (selectedAgents.length < 2 || !systemName.trim() || !systemDescription.trim()) {
      setError('Please select at least 2 agents and provide a system name and description');
      return;
    }

    try {
      // Prepare ad hoc configuration data for the wrapper
      const adHocConfig = {
        name: systemName.trim(),
        description: systemDescription.trim(),
        systemType: systemType,
        agentIds: selectedAgents.map(a => a.id),
        agentRoles: agentRoles,
        governanceRules: {
          crossAgentValidation: true,
          errorHandling: 'fallback',
          loggingLevel: 'standard',
          governancePolicy: 'standard',
          maxExecutionTime: 300,
          rateLimiting: {
            requestsPerMinute: 60,
            burstLimit: 10
          }
        }
      };

      // Store configuration in sessionStorage for the wrapper to pick up
      sessionStorage.setItem('adHocSystemConfig', JSON.stringify(adHocConfig));

      // Navigate to the Multi-Agent Wrapper with a flag indicating it's from ad hoc
      window.location.href = '/multi-agent-wrapping?fromAdHoc=true';

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prepare system for wrapping');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'offline':
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  if (mode !== 'multi-agent') {
    return null;
  }

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#2a2a2a', color: 'white' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
        <GroupIcon sx={{ mr: 1 }} />
        Multi-Agent Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{
          mb: 2,
          '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
          '& .Mui-selected': { color: 'white' },
          '& .MuiTabs-indicator': { backgroundColor: '#2196F3' }
        }}
      >
        <Tab label="Ad Hoc Multi-Agent" />
        <Tab label="Pre-Wrapped Systems" />
      </Tabs>

      {loading ? (
        <Typography color="white">Loading agents...</Typography>
      ) : (
        <Box>
          {/* Ad Hoc Multi-Agent Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Select Agents and Assign Roles
              </Typography>

              <Box sx={{ mb: 2 }}>
                {availableAgents.map((agent) => (
                  <Box key={agent.id} sx={{ mb: 2, p: 2, border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedAgents.some(a => a.id === agent.id)}
                            onChange={(e) => handleMultiAgentToggle(agent, e.target.checked)}
                            disabled={disabled}
                            sx={{ color: 'white' }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'white' }}>{agent.name}</Typography>
                            <Chip
                              label={agent.status}
                              size="small"
                              color={getStatusColor(agent.status) as any}
                            />
                            <Chip
                              icon={<SecurityIcon />}
                              label={`${agent.governanceScore}%`}
                              size="small"
                              variant="outlined"
                              sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                            />
                          </Box>
                        }
                      />

                      {selectedAgents.some(a => a.id === agent.id) && (
                        <TextField
                          size="small"
                          label="Role"
                          value={agentRoles[agent.id] || ''}
                          onChange={(e) => handleRoleChange(agent.id, e.target.value)}
                          sx={{
                            width: 150,
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                            }
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', ml: 4 }}>
                      {agent.description}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Coordination Pattern */}
              {selectedAgents.length > 1 && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Coordination Pattern</InputLabel>
                    <Select
                      value={coordinationPattern}
                      label="Coordination Pattern"
                      onChange={(e) => handleCoordinationPatternChange(e.target.value as any)}
                      disabled={disabled}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                      }}
                    >
                      <MenuItem value="parallel">Parallel (All respond simultaneously)</MenuItem>
                      <MenuItem value="sequential">Sequential (One after another)</MenuItem>
                      <MenuItem value="hierarchical">Hierarchical (By governance score)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Save as System */}
              {selectedAgents.length >= 2 && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                    Wrap as Multi-Agent System
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2, display: 'block' }}>
                    This will take you to the Multi-Agent System Wrapper to create a governed system with these agents.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      size="small"
                      label="System Name"
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                      required
                      sx={{
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                        }
                      }}
                    />
                    
                    <TextField
                      size="small"
                      label="System Description"
                      value={systemDescription}
                      onChange={(e) => setSystemDescription(e.target.value)}
                      multiline
                      rows={2}
                      required
                      sx={{
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                        }
                      }}
                    />
                    
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>System Type</InputLabel>
                      <Select
                        value={systemType}
                        label="System Type"
                        onChange={(e) => setSystemType(e.target.value as 'sequential' | 'parallel' | 'hierarchical')}
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                        }}
                      >
                        <MenuItem value="parallel">Parallel (All respond simultaneously)</MenuItem>
                        <MenuItem value="sequential">Sequential (One after another)</MenuItem>
                        <MenuItem value="hierarchical">Hierarchical (By governance score)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveAsSystem}
                      disabled={!systemName.trim() || !systemDescription.trim()}
                      sx={{ mt: 1 }}
                    >
                      Wrap as System
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Pre-Wrapped Systems Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                Available Multi-Agent Systems
              </Typography>

              {availableSystems.length === 0 ? (
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>No pre-wrapped systems available.</Typography>
              ) : (
                <Box>
                  {availableSystems.map((system) => (
                    <Card
                      key={system.id}
                      variant="outlined"
                      sx={{
                        mb: 2,
                        backgroundColor: selectedSystem?.id === system.id ? '#3a3a3a' : '#2a2a2a',
                        borderColor: selectedSystem?.id === system.id ? '#2196F3' : 'rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white' }}>{system.name}</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{system.description}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {system.agents.map(agent => (
                            <Chip key={agent.id} label={agent.name} size="small" variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }} />
                          ))}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 1, display: 'block' }}>
                          Coordination: {system.coordinationPattern} | Governance: {system.governanceScore}%
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          onClick={() => handleSystemSelect(system)}
                          variant={selectedSystem?.id === system.id ? 'contained' : 'outlined'}
                          sx={{ color: selectedSystem?.id === system.id ? 'white' : '#2196F3', borderColor: '#2196F3' }}
                        >
                          {selectedSystem?.id === system.id ? 'Selected' : 'Select System'}
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
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

