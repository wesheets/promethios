/**
 * MultiAgentResponseIndicator - Shows agent response status and queuing in multi-agent chats
 * Part of the revolutionary multi-agent collaboration system
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Stack,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  Psychology
} from '@mui/icons-material';
import { MultiAgentRoutingService, AgentResponse } from '../services/MultiAgentRoutingService';

export interface AgentStatus {
  agentId: string;
  agentName: string;
  avatar?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  response?: string;
  processingTime?: number;
  error?: string;
  startTime?: Date;
}

export interface MultiAgentResponseIndicatorProps {
  hostAgentId: string;
  guestAgents: Array<{
    agentId: string;
    name: string;
    avatar?: string;
    addedAt: Date;
  }>;
  targetAgents: string[];
  isProcessing: boolean;
  responses: AgentResponse[];
  onResponseComplete?: (responses: AgentResponse[]) => void;
}

export const MultiAgentResponseIndicator: React.FC<MultiAgentResponseIndicatorProps> = ({
  hostAgentId,
  guestAgents,
  targetAgents,
  isProcessing,
  responses,
  onResponseComplete
}) => {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatus>>(new Map());
  const [isExpanded, setIsExpanded] = useState(true);
  const [busyAgents, setBusyAgents] = useState<string[]>([]);

  const routingService = MultiAgentRoutingService.getInstance();

  // Initialize agent statuses
  useEffect(() => {
    if (targetAgents.length === 0) return;

    const newStatuses = new Map<string, AgentStatus>();
    
    // Get all agents (host + guests)
    const allAgents = [
      { agentId: hostAgentId, name: 'Host Agent' },
      ...guestAgents
    ];

    targetAgents.forEach(agentId => {
      const agent = allAgents.find(a => a.agentId === agentId);
      if (agent) {
        newStatuses.set(agentId, {
          agentId,
          agentName: agent.name,
          avatar: agent.avatar,
          status: isProcessing ? 'processing' : 'idle',
          startTime: isProcessing ? new Date() : undefined
        });
      }
    });

    setAgentStatuses(newStatuses);
  }, [targetAgents, hostAgentId, guestAgents, isProcessing]);

  // Update statuses based on responses
  useEffect(() => {
    if (responses.length === 0) return;

    setAgentStatuses(prev => {
      const newStatuses = new Map(prev);
      
      responses.forEach(response => {
        const currentStatus = newStatuses.get(response.agentId);
        if (currentStatus) {
          newStatuses.set(response.agentId, {
            ...currentStatus,
            status: response.error ? 'error' : 'completed',
            response: response.response,
            processingTime: response.processingTime,
            error: response.error
          });
        }
      });

      return newStatuses;
    });

    // Check if all responses are complete
    if (responses.length === targetAgents.length) {
      onResponseComplete?.(responses);
    }
  }, [responses, targetAgents.length, onResponseComplete]);

  // Update busy agents periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBusyAgents(routingService.getBusyAgents());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get agent-specific color (unique per agent)
  const getAgentColor = (agentId: string, agentName: string) => {
    // Predefined colors for known agents
    if (agentName.toLowerCase().includes('claude')) return '#3b82f6';    // Blue
    if (agentName.toLowerCase().includes('openai') || agentName.toLowerCase().includes('gpt')) return '#10b981';    // Green
    if (agentName.toLowerCase().includes('gemini') || agentName.toLowerCase().includes('bard')) return '#8b5cf6';   // Purple
    if (agentName.toLowerCase().includes('anthropic')) return '#06b6d4';  // Cyan
    if (agentName.toLowerCase().includes('mistral')) return '#f59e0b';    // Orange
    if (agentName.toLowerCase().includes('llama')) return '#ef4444';      // Red
    
    // Hash-based color for unknown agents
    let hash = 0;
    for (let i = 0; i < agentId.length; i++) {
      hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#84cc16', '#f97316'];
    return colors[Math.abs(hash) % colors.length];
  };

  // Get status color (for status indicators only)
  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'processing': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Get status overlay (combines agent color with status)
  const getStatusOverlay = (agentId: string, agentName: string, status: AgentStatus['status']) => {
    const agentColor = getAgentColor(agentId, agentName);
    
    // For completed status, use agent color; for others, use status color
    if (status === 'completed') {
      return agentColor;
    } else if (status === 'idle') {
      return agentColor + '80'; // 50% opacity for idle
    } else {
      return getStatusColor(status);
    }
  };

  // Get status icon
  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'processing': return <Psychology sx={{ fontSize: 16 }} />;
      case 'completed': return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'error': return <ErrorIcon sx={{ fontSize: 16 }} />;
      default: return <Schedule sx={{ fontSize: 16 }} />;
    }
  };

  // Calculate processing time for active agents
  const getProcessingTime = (agentStatus: AgentStatus) => {
    if (agentStatus.status === 'processing' && agentStatus.startTime) {
      return Math.floor((new Date().getTime() - agentStatus.startTime.getTime()) / 1000);
    }
    return agentStatus.processingTime ? Math.floor(agentStatus.processingTime / 1000) : 0;
  };

  if (targetAgents.length === 0 || agentStatuses.size === 0) {
    return null;
  }

  const statusArray = Array.from(agentStatuses.values());
  const processingCount = statusArray.filter(s => s.status === 'processing').length;
  const completedCount = statusArray.filter(s => s.status === 'completed').length;
  const errorCount = statusArray.filter(s => s.status === 'error').length;

  return (
    <Paper
      sx={{
        bgcolor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 2,
        overflow: 'hidden',
        mb: 2
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
            Multi-Agent Response Status
          </Typography>
          
          <Stack direction="row" spacing={1}>
            {processingCount > 0 && (
              <Chip
                label={`${processingCount} Processing`}
                size="small"
                sx={{
                  bgcolor: '#f59e0b',
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            )}
            {completedCount > 0 && (
              <Chip
                label={`${completedCount} Complete`}
                size="small"
                sx={{
                  bgcolor: '#10b981',
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            )}
            {errorCount > 0 && (
              <Chip
                label={`${errorCount} Error`}
                size="small"
                sx={{
                  bgcolor: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Stack>
        </Box>

        <IconButton size="small" sx={{ color: '#94a3b8' }}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Agent Status List */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {statusArray.map((agentStatus) => (
              <Box
                key={agentStatus.agentId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  bgcolor: '#0f172a',
                  borderRadius: 1,
                  border: `1px solid ${getStatusColor(agentStatus.status)}20`
                }}
              >
                {/* Agent Avatar */}
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: getStatusOverlay(agentStatus.agentId, agentStatus.agentName, agentStatus.status),
                    fontSize: '0.8rem'
                  }}
                >
                  {agentStatus.agentName.charAt(0)}
                </Avatar>

                {/* Agent Info */}
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: getAgentColor(agentStatus.agentId, agentStatus.agentName), 
                      fontWeight: 500 
                    }}
                  >
                    {agentStatus.agentName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {agentStatus.agentId === hostAgentId ? 'Host Agent' : 'Guest Agent'}
                  </Typography>
                </Box>

                {/* Status Indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: getStatusColor(agentStatus.status) }}>
                    {getStatusIcon(agentStatus.status)}
                  </Box>
                  
                  <Typography
                    variant="caption"
                    sx={{
                      color: getStatusColor(agentStatus.status),
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}
                  >
                    {agentStatus.status}
                  </Typography>
                </Box>

                {/* Processing Time */}
                {(agentStatus.status === 'processing' || agentStatus.status === 'completed') && (
                  <Typography variant="caption" sx={{ color: '#64748b', minWidth: '40px' }}>
                    {getProcessingTime(agentStatus)}s
                  </Typography>
                )}

                {/* Error Indicator */}
                {agentStatus.error && (
                  <Tooltip title={agentStatus.error}>
                    <ErrorIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                  </Tooltip>
                )}
              </Box>
            ))}
          </Stack>

          {/* Overall Progress */}
          {processingCount > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Overall Progress
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {completedCount + errorCount} / {statusArray.length}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(completedCount + errorCount) / statusArray.length * 100}
                sx={{
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#3b82f6'
                  }
                }}
              />
            </Box>
          )}

          {/* Help Text */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#0f172a', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              💡 Agents respond in sequence to prevent overwhelming the conversation. 
              Each agent provides their unique perspective based on their specialized knowledge.
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default MultiAgentResponseIndicator;

