/**
 * AgentAvatarSelector - Intuitive clickable agent selection for multi-agent chat
 * Replaces @mention typing with visual avatar selection
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  IconButton,
  Badge
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export interface AgentInfo {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  hotkey?: string;
}

export interface AgentAvatarSelectorProps {
  hostAgent: AgentInfo;
  guestAgents: AgentInfo[];
  selectedAgents: string[];
  onSelectionChange: (selectedAgentIds: string[]) => void;
  onAddAgent?: () => void;
}

export const AgentAvatarSelector: React.FC<AgentAvatarSelectorProps> = ({
  hostAgent,
  guestAgents,
  selectedAgents,
  onSelectionChange,
  onAddAgent
}) => {
  const allAgents = [hostAgent, ...guestAgents];

  // Handle agent selection toggle
  const handleAgentClick = (agentId: string, event: React.MouseEvent) => {
    const isCtrlClick = event.ctrlKey || event.metaKey;
    
    if (isCtrlClick) {
      // Multi-select mode
      if (selectedAgents.includes(agentId)) {
        // Remove from selection
        onSelectionChange(selectedAgents.filter(id => id !== agentId));
      } else {
        // Add to selection
        onSelectionChange([...selectedAgents, agentId]);
      }
    } else {
      // Single select mode
      if (selectedAgents.length === 1 && selectedAgents[0] === agentId) {
        // If only this agent is selected, deselect (default to host)
        onSelectionChange([hostAgent.id]);
      } else {
        // Select only this agent
        onSelectionChange([agentId]);
      }
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle hotkeys when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const agent = allAgents.find(a => a.hotkey?.toLowerCase() === event.key.toLowerCase());
      if (agent) {
        event.preventDefault();
        const mockEvent = { ctrlKey: event.ctrlKey, metaKey: event.metaKey } as React.MouseEvent;
        handleAgentClick(agent.id, mockEvent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allAgents, selectedAgents, onSelectionChange]);

  // Get agent color based on selection state
  const getAgentStyle = (agent: AgentInfo) => {
    const isSelected = selectedAgents.includes(agent.id);
    
    return {
      width: 32,
      height: 32,
      bgcolor: isSelected ? agent.color : '#64748b',
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: 600,
      border: isSelected ? `2px solid ${agent.color}` : '2px solid transparent',
      opacity: isSelected ? 1 : 0.5,
      filter: isSelected ? 'none' : 'grayscale(100%)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      '&:hover': {
        opacity: 1,
        filter: 'none',
        transform: 'scale(1.1)',
        boxShadow: `0 0 8px ${agent.color}40`
      }
    };
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      pr: 2,
      borderRight: '1px solid #334155'
    }}>
      {/* Agent Avatars */}
      {allAgents.map((agent) => (
        <Tooltip 
          key={agent.id}
          title={
            <Box>
              <Box sx={{ fontWeight: 600 }}>{agent.name}</Box>
              <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {selectedAgents.includes(agent.id) ? 'Selected' : 'Click to select'}
                {agent.hotkey && ` • Press ${agent.hotkey.toUpperCase()}`}
              </Box>
              <Box sx={{ fontSize: '0.7rem', opacity: 0.6, mt: 0.5 }}>
                {agent.id === hostAgent.id ? 'Host Agent' : 'Guest Agent'}
              </Box>
            </Box>
          }
          placement="top"
        >
          <Badge
            badgeContent={agent.hotkey?.toUpperCase()}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                minWidth: 16,
                height: 16,
                bgcolor: selectedAgents.includes(agent.id) ? agent.color : '#64748b',
                opacity: 0.8
              }
            }}
          >
            <Avatar
              onClick={(e) => handleAgentClick(agent.id, e)}
              sx={getAgentStyle(agent)}
            >
              {agent.avatar || agent.name.charAt(0)}
            </Avatar>
          </Badge>
        </Tooltip>
      ))}

      {/* Add Agent Button */}
      {onAddAgent && (
        <Tooltip title="Add guest agent to conversation">
          <IconButton
            onClick={onAddAgent}
            size="small"
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#374151',
              color: '#94a3b8',
              border: '2px dashed #4b5563',
              '&:hover': {
                bgcolor: '#4b5563',
                color: '#e2e8f0',
                borderColor: '#6b7280'
              }
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Selection Indicator */}
      {selectedAgents.length > 1 && (
        <Box sx={{ 
          ml: 1, 
          px: 1, 
          py: 0.25, 
          bgcolor: '#3b82f620', 
          border: '1px solid #3b82f640',
          borderRadius: 1,
          fontSize: '0.7rem',
          color: '#3b82f6',
          fontWeight: 500
        }}>
          {selectedAgents.length} selected
        </Box>
      )}
    </Box>
  );
};

export default AgentAvatarSelector;

