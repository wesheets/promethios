/**
 * ParticipantPanelLeftCollapsible - Enhanced AI agents panel with collapse functionality
 * Displays AI agents with drag & drop support and collapsible interface
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Avatar, Chip, Tooltip, Divider, IconButton } from '@mui/material';
import { Add, Settings, DragIndicator } from '@mui/icons-material';
import PanelCollapseButton from './PanelCollapseButton';
import WorkspaceLayoutManager from '../../services/WorkspaceLayoutManager';

interface Agent {
  id: string;
  name: string;
  model: string;
  color: string;
  status: 'active' | 'idle' | 'busy';
  trustScore: number;
}

interface ParticipantPanelLeftCollapsibleProps {
  agents: Agent[];
  onAddAgent: () => void;
  onAgentSettings: (agentId: string) => void;
  onAgentDragStart: (agent: Agent) => void;
  isVisible: boolean;
  width: string;
}

const ParticipantPanelLeftCollapsible: React.FC<ParticipantPanelLeftCollapsibleProps> = ({
  agents,
  onAddAgent,
  onAgentSettings,
  onAgentDragStart,
  isVisible,
  width
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const layoutManager = WorkspaceLayoutManager.getInstance();

  useEffect(() => {
    const unsubscribe = layoutManager.subscribe((state) => {
      setIsCollapsed(state.leftPanelCollapsed);
    });
    return unsubscribe;
  }, [layoutManager]);

  const handleToggleCollapse = () => {
    layoutManager.recordManualInteraction();
    layoutManager.toggleLeftPanel();
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'idle': return '#F59E0B';
      case 'busy': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'idle': return 'Idle';
      case 'busy': return 'Busy';
      default: return 'Unknown';
    }
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        width: isCollapsed ? '3%' : width,
        minWidth: isCollapsed ? '40px' : '200px',
        height: '100%',
        backgroundColor: '#1e293b',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        overflow: isCollapsed ? 'visible' : 'hidden'
      }}
    >
      {/* Collapse Button */}
      <PanelCollapseButton
        isCollapsed={isCollapsed}
        onToggle={handleToggleCollapse}
        position="left"
        panelType="agents"
        participantCount={agents.length}
      />

      {/* Collapsed State */}
      {isCollapsed && (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            py: 2
          }}
        >
          {agents.slice(0, 3).map((agent, index) => (
            <Tooltip key={agent.id} title={`${agent.name} (${getStatusText(agent.status)})`} placement="right">
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: agent.color,
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `2px solid ${getStatusColor(agent.status)}`,
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: `0 0 8px ${agent.color}40`
                  }
                }}
                onClick={() => onAgentSettings(agent.id)}
              >
                {agent.name.charAt(0)}
              </Avatar>
            </Tooltip>
          ))}
          {agents.length > 3 && (
            <Chip
              label={`+${agents.length - 3}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '10px',
                backgroundColor: '#334155',
                color: '#94a3b8'
              }}
            />
          )}
        </Box>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
            <Typography
              variant="h6"
              sx={{
                color: '#e2e8f0',
                fontSize: '1rem',
                fontWeight: 600,
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
              {agents.length} agent{agents.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>

          {/* Agents List */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {agents.map((agent) => (
              <Box
                key={agent.id}
                draggable
                onDragStart={() => onAgentDragStart(agent)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  backgroundColor: '#334155',
                  borderRadius: 1,
                  border: `1px solid ${agent.color}40`,
                  cursor: 'grab',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: '#475569',
                    borderColor: `${agent.color}60`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 8px ${agent.color}20`
                  },
                  '&:active': {
                    cursor: 'grabbing',
                    transform: 'scale(0.98)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: agent.color,
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: `2px solid ${getStatusColor(agent.status)}`
                    }}
                  >
                    {agent.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#e2e8f0',
                        fontWeight: 600,
                        fontSize: '0.875rem',
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
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {agent.model}
                    </Typography>
                  </Box>
                  <DragIndicator sx={{ color: '#64748b', fontSize: 16 }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    label={getStatusText(agent.status)}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '10px',
                      backgroundColor: `${getStatusColor(agent.status)}20`,
                      color: getStatusColor(agent.status),
                      border: `1px solid ${getStatusColor(agent.status)}40`
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#94a3b8',
                        fontSize: '10px'
                      }}
                    >
                      Trust: {agent.trustScore}%
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgentSettings(agent.id);
                      }}
                      sx={{
                        width: 24,
                        height: 24,
                        color: '#64748b',
                        '&:hover': {
                          color: '#94a3b8',
                          backgroundColor: '#475569'
                        }
                      }}
                    >
                      <Settings sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Add Agent Button */}
          <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Add />}
              onClick={onAddAgent}
              sx={{
                borderColor: '#334155',
                color: '#94a3b8',
                fontSize: '0.875rem',
                py: 1,
                '&:hover': {
                  borderColor: '#3B82F6',
                  color: '#3B82F6',
                  backgroundColor: '#3B82F610'
                }
              }}
            >
              Add Agent
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ParticipantPanelLeftCollapsible;

