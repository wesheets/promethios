/**
 * ParticipantPanelLeft - Smart left panel for AI agents
 * Shows draggable agent avatars when 2+ AI agents are in conversation
 */

import React from 'react';
import { Box, Typography, Avatar, Tooltip, IconButton, Divider } from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';

interface Agent {
  id: string;
  name: string;
  model: string;
  avatar?: string;
  color: string;
  status: 'active' | 'idle' | 'thinking';
  trustScore?: number;
}

interface ParticipantPanelLeftProps {
  agents: Agent[];
  onAddAgent?: () => void;
  onAgentSettings?: (agentId: string) => void;
  onAgentDragStart?: (agent: Agent, event: React.DragEvent) => void;
  isVisible: boolean;
  width: string;
}

// Strategic color palette for AI agents (cool spectrum)
const AGENT_COLORS = {
  claude: '#3B82F6',    // Blue
  'gpt-4': '#06B6D4',   // Cyan
  gemini: '#8B5CF6',    // Purple
  custom: '#10B981',    // Emerald
  default: '#64748B'    // Slate
};

const ParticipantPanelLeft: React.FC<ParticipantPanelLeftProps> = ({
  agents,
  onAddAgent,
  onAgentSettings,
  onAgentDragStart,
  isVisible,
  width
}) => {
  const getAgentColor = (agent: Agent): string => {
    const modelKey = agent.model.toLowerCase().replace(/[^a-z0-9]/g, '');
    return AGENT_COLORS[modelKey as keyof typeof AGENT_COLORS] || agent.color || AGENT_COLORS.default;
  };

  const getStatusIndicator = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return { color: '#10B981', label: 'Active' };
      case 'thinking':
        return { color: '#F59E0B', label: 'Thinking...' };
      case 'idle':
        return { color: '#6B7280', label: 'Idle' };
      default:
        return { color: '#6B7280', label: 'Unknown' };
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      sx={{
        width,
        height: '100%',
        backgroundColor: '#1e293b',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Panel Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #334155',
          backgroundColor: '#0f172a'
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '0.875rem',
            mb: 0.5
          }}
        >
          AI Agents
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            fontSize: '0.75rem'
          }}
        >
          {agents.length} active
        </Typography>
      </Box>

      {/* Agent List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1
        }}
      >
        {agents.map((agent, index) => {
          const agentColor = getAgentColor(agent);
          const statusInfo = getStatusIndicator(agent.status);

          return (
            <Box key={agent.id} sx={{ mb: 1 }}>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Model: {agent.model}
                    </Typography>
                    {agent.trustScore && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Trust Score: {agent.trustScore}%
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: statusInfo.color, display: 'block' }}>
                      Status: {statusInfo.label}
                    </Typography>
                  </Box>
                }
                placement="right"
              >
                <Box
                  draggable
                  onDragStart={(e) => onAgentDragStart?.(agent, e)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#334155',
                    border: `2px solid ${agentColor}`,
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#475569',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${agentColor}20`
                    },
                    '&:active': {
                      cursor: 'grabbing',
                      transform: 'translateY(0)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Agent Avatar */}
                    <Avatar
                      src={agent.avatar}
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: agentColor,
                        border: `2px solid ${agentColor}`,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {agent.name.charAt(0).toUpperCase()}
                    </Avatar>

                    {/* Agent Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#e2e8f0',
                          fontWeight: 500,
                          fontSize: '0.8rem',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {agent.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          lineHeight: 1.2
                        }}
                      >
                        {agent.model}
                      </Typography>
                    </Box>

                    {/* Status Indicator */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: statusInfo.color,
                        flexShrink: 0
                      }}
                    />
                  </Box>

                  {/* Settings Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgentSettings?.(agent.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      color: '#94a3b8',
                      '&:hover': {
                        color: '#e2e8f0',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </Tooltip>

              {index < agents.length - 1 && (
                <Divider sx={{ bgcolor: '#475569', my: 1 }} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Add Agent Button */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #334155'
        }}
      >
        <IconButton
          onClick={onAddAgent}
          sx={{
            width: '100%',
            py: 1.5,
            borderRadius: 2,
            backgroundColor: '#334155',
            color: '#94a3b8',
            border: '2px dashed #475569',
            '&:hover': {
              backgroundColor: '#475569',
              color: '#e2e8f0',
              borderColor: '#64748b'
            }
          }}
        >
          <AddIcon sx={{ mr: 1, fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Add Agent
          </Typography>
        </IconButton>
      </Box>
    </Box>
  );
};

export default ParticipantPanelLeft;

