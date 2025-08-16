import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Button,
  Divider,
  LinearProgress,
  Collapse,
  Alert,
  Tooltip,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  ExpandMore,
  ExpandLess,
  Memory,
  Storage,
  Api,
  Security,
  Speed,
  Visibility,
  VisibilityOff,
  Circle,
  CheckCircle,
  Warning,
  Error,
  Info,
  Code,
  Psychology,
  Receipt,
  Timeline,
  BugReport,
} from '@mui/icons-material';

interface LiveAgentSandboxProps {
  agentId: string;
  agentName: string;
  isActive?: boolean;
  sessionId?: string;
  onToggleMonitoring?: (enabled: boolean) => void;
}

interface SandboxEvent {
  id: string;
  timestamp: Date;
  type: 'tool_execution' | 'memory_access' | 'governance_check' | 'api_call' | 'receipt_generated' | 'error';
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
  duration?: number;
}

interface AgentState {
  status: 'idle' | 'processing' | 'thinking' | 'executing' | 'error';
  currentTask?: string;
  memoryUsage: number;
  activeTools: string[];
  governanceScore: number;
  lastActivity: Date;
  sessionDuration: number;
}

const LiveAgentSandbox: React.FC<LiveAgentSandboxProps> = ({
  agentId,
  agentName,
  isActive = false,
  sessionId,
  onToggleMonitoring
}) => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    events: true,
    state: true,
    tools: false,
    governance: false
  });
  const [events, setEvents] = useState<SandboxEvent[]>([]);
  const [agentState, setAgentState] = useState<AgentState>({
    status: 'idle',
    memoryUsage: 45,
    activeTools: ['Universal Governance Adapter', 'RAG Service', 'Receipt Extension'],
    governanceScore: 87,
    lastActivity: new Date(),
    sessionDuration: 0
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Load initial sandbox data
  useEffect(() => {
    const loadSandboxData = async () => {
      try {
        const { chatPanelGovernanceService } = await import('../../services/ChatPanelGovernanceService');
        const sandboxData = await chatPanelGovernanceService.getAgentSandboxData(agentId);
        
        setAgentState(prev => ({
          ...prev,
          status: sandboxData.status === 'active' ? 'processing' : 'idle',
          memoryUsage: sandboxData.realtimeData.memoryUsage,
          governanceScore: Math.round(sandboxData.currentMetrics.trustScore * 100),
          lastActivity: new Date()
        }));

        // Convert debug logs to events
        const debugEvents: SandboxEvent[] = sandboxData.debugLogs.map((log: any, index: number) => ({
          id: `debug_${index}`,
          timestamp: log.timestamp,
          type: 'governance_check' as const,
          title: log.source,
          description: log.message,
          status: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info' as const
        }));

        setEvents(debugEvents);
        console.log(`✅ Loaded sandbox data for agent ${agentId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load sandbox data:`, error);
      }
    };

    loadSandboxData();
  }, [agentId]);

  // Mock real-time events simulation
  useEffect(() => {
    if (!isMonitoring || !isActive) return;

    const interval = setInterval(() => {
      // Simulate random events
      const eventTypes = [
        {
          type: 'tool_execution' as const,
          title: 'Tool Execution',
          description: 'Universal Governance Adapter processing message',
          status: 'success' as const,
          duration: Math.random() * 2000 + 500
        },
        {
          type: 'memory_access' as const,
          title: 'Memory Access',
          description: 'Retrieving conversation context from memory',
          status: 'info' as const,
          duration: Math.random() * 500 + 100
        },
        {
          type: 'governance_check' as const,
          title: 'Governance Check',
          description: 'Policy compliance validation completed',
          status: 'success' as const,
          duration: Math.random() * 1000 + 200
        },
        {
          type: 'api_call' as const,
          title: 'API Call',
          description: 'OpenAI GPT-4.1-mini API request',
          status: 'success' as const,
          duration: Math.random() * 3000 + 1000
        },
        {
          type: 'receipt_generated' as const,
          title: 'Receipt Generated',
          description: 'Cryptographic receipt created for tool usage',
          status: 'success' as const,
          duration: Math.random() * 300 + 50
        }
      ];

      // Only add events occasionally to avoid spam
      if (Math.random() < 0.3) {
        const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const newEvent: SandboxEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          ...eventTemplate,
          metadata: {
            agentId,
            sessionId,
            executionTime: eventTemplate.duration
          }
        };

        setEvents(prev => [...prev.slice(-19), newEvent]); // Keep last 20 events

        // Update agent state based on event
        setAgentState(prev => ({
          ...prev,
          status: eventTemplate.type === 'api_call' ? 'processing' : 'idle',
          currentTask: eventTemplate.description,
          lastActivity: new Date(),
          sessionDuration: prev.sessionDuration + 1
        }));
      }
    }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, isActive, agentId, sessionId]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleMonitoring = () => {
    const newState = !isMonitoring;
    setIsMonitoring(newState);
    onToggleMonitoring?.(newState);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const getStatusColor = (status: AgentState['status']) => {
    switch (status) {
      case 'processing': return '#f59e0b';
      case 'thinking': return '#3b82f6';
      case 'executing': return '#8b5cf6';
      case 'error': return '#ef4444';
      default: return '#10b981';
    }
  };

  const getEventIcon = (type: SandboxEvent['type']) => {
    switch (type) {
      case 'tool_execution': return <Api />;
      case 'memory_access': return <Memory />;
      case 'governance_check': return <Security />;
      case 'api_call': return <Code />;
      case 'receipt_generated': return <Receipt />;
      case 'error': return <Error />;
      default: return <Info />;
    }
  };

  const getEventStatusIcon = (status: SandboxEvent['status']) => {
    switch (status) {
      case 'success': return <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'warning': return <Warning sx={{ color: '#f59e0b', fontSize: 16 }} />;
      case 'error': return <Error sx={{ color: '#ef4444', fontSize: 16 }} />;
      default: return <Info sx={{ color: '#3b82f6', fontSize: 16 }} />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Live Agent Sandbox
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isMonitoring}
                onChange={toggleMonitoring}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10b981',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981',
                  },
                }}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Monitor
              </Typography>
            }
            sx={{ m: 0 }}
          />
          <IconButton size="small" onClick={clearEvents} sx={{ color: '#64748b' }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Agent State Overview */}
      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 'bold' }}>
              Agent State
            </Typography>
            <Button
              size="small"
              onClick={() => toggleSection('state')}
              endIcon={expandedSections.state ? <ExpandLess /> : <ExpandMore />}
              sx={{ color: '#64748b', minWidth: 'auto' }}
            >
              {expandedSections.state ? 'Hide' : 'Show'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: getStatusColor(agentState.status),
                animation: agentState.status === 'processing' ? 'pulse 2s infinite' : 'none'
              }}
            />
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
              {agentState.status.charAt(0).toUpperCase() + agentState.status.slice(1)}
            </Typography>
            {agentState.currentTask && (
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                • {agentState.currentTask}
              </Typography>
            )}
          </Box>

          <Collapse in={expandedSections.state}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Memory Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={agentState.memoryUsage}
                    sx={{
                      width: 60,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#334155',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: agentState.memoryUsage > 80 ? '#ef4444' : agentState.memoryUsage > 60 ? '#f59e0b' : '#10b981'
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', minWidth: 35 }}>
                    {agentState.memoryUsage}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Governance Score
                </Typography>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                  {agentState.governanceScore}%
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Session Duration
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {Math.floor(agentState.sessionDuration / 60)}m {agentState.sessionDuration % 60}s
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Last Activity
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {agentState.lastActivity.toLocaleTimeString()}
                </Typography>
              </Box>
            </Stack>
          </Collapse>
        </CardContent>
      </Card>

      {/* Active Tools */}
      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 'bold' }}>
              Active Tools ({agentState.activeTools.length})
            </Typography>
            <Button
              size="small"
              onClick={() => toggleSection('tools')}
              endIcon={expandedSections.tools ? <ExpandLess /> : <ExpandMore />}
              sx={{ color: '#64748b', minWidth: 'auto' }}
            >
              {expandedSections.tools ? 'Hide' : 'Show'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {agentState.activeTools.map((tool, index) => (
              <Chip
                key={index}
                label={tool}
                size="small"
                sx={{
                  bgcolor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  fontSize: '0.75rem'
                }}
              />
            ))}
          </Box>

          <Collapse in={expandedSections.tools}>
            <List dense sx={{ py: 0 }}>
              {agentState.activeTools.map((tool, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Circle sx={{ color: '#10b981', fontSize: 8 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={tool}
                    secondary="Ready"
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { color: 'white', fontSize: '0.85rem' }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { color: '#64748b' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>

      {/* Real-time Events */}
      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 'bold' }}>
              Real-time Events ({events.length})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3b82f6',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3b82f6',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Auto-scroll
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              <Button
                size="small"
                onClick={() => toggleSection('events')}
                endIcon={expandedSections.events ? <ExpandLess /> : <ExpandMore />}
                sx={{ color: '#64748b', minWidth: 'auto' }}
              >
                {expandedSections.events ? 'Hide' : 'Show'}
              </Button>
            </Box>
          </Box>

          <Collapse in={expandedSections.events}>
            <Box
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid #334155',
                borderRadius: 1,
                bgcolor: '#1e293b'
              }}
            >
              {events.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {isMonitoring ? 'Waiting for agent activity...' : 'Monitoring disabled'}
                  </Typography>
                </Box>
              ) : (
                <List dense sx={{ py: 0 }}>
                  {events.map((event) => (
                    <ListItem key={event.id} sx={{ px: 2, py: 1, borderBottom: '1px solid #334155' }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'transparent' }}>
                          {React.cloneElement(getEventIcon(event.type), { 
                            fontSize: 'small', 
                            sx: { color: '#94a3b8' } 
                          })}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'white', fontSize: '0.85rem' }}>
                              {event.title}
                            </Typography>
                            {getEventStatusIcon(event.status)}
                            {event.duration && (
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {event.duration}ms
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {event.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', ml: 2 }}>
                              {event.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  <div ref={eventsEndRef} />
                </List>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Advanced Features Coming Soon */}
      <Alert 
        severity="info" 
        sx={{ 
          bgcolor: '#0f172a', 
          border: '1px solid #334155',
          '& .MuiAlert-icon': { color: '#3b82f6' },
          '& .MuiAlert-message': { color: '#94a3b8' }
        }}
      >
        🚧 Advanced sandbox features coming soon: Governance decision trees, 
        predictive analysis, tool execution profiling, and memory optimization insights.
      </Alert>
    </Box>
  );
};

export default LiveAgentSandbox;

