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
import GuestSelectorPopup from './GuestSelectorPopup';

export interface AgentInfo {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  hotkey?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  type: 'human' | 'ai_agent';
  role?: string;
  status: 'online' | 'away' | 'offline';
  avatar?: string;
  health?: number; // For AI agents
  provider?: string; // For AI agents
}

export interface AgentAvatarSelectorProps {
  hostAgent: AgentInfo;
  guestAgents: AgentInfo[];
  selectedAgents: string[];
  onSelectionChange: (selectedAgentIds: string[]) => void;
  onAddAgent?: () => void;
  // New props for guest selector
  teamMembers?: TeamMember[];
  aiAgents?: TeamMember[];
  onAddGuests?: (guests: TeamMember[]) => void;
  // Human participants
  humanParticipants?: TeamMember[];
  selectedTarget?: string; // Current messaging target (human or agent ID)
  onTargetChange?: (targetId: string) => void;
  // Behavior prompts callback
  onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string) => void;
}

export const AgentAvatarSelector: React.FC<AgentAvatarSelectorProps> = ({
  hostAgent,
  guestAgents,
  selectedAgents,
  onSelectionChange,
  onAddAgent,
  teamMembers = [],
  aiAgents = [],
  onAddGuests,
  humanParticipants = [],
  selectedTarget,
  onTargetChange,
  onBehaviorPrompt
}) => {
  const [guestSelectorOpen, setGuestSelectorOpen] = useState(false);
  const allAgents = [hostAgent, ...guestAgents];

  // Handle target selection (for messaging)
  const handleTargetClick = (targetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    onTargetChange?.(targetId);
  };

  // Get human style based on selection state
  const getHumanStyle = (human: TeamMember) => {
    const isSelected = selectedTarget === human.id;
    const statusColor = human.status === 'online' ? '#10b981' : 
                       human.status === 'away' ? '#f59e0b' : '#6b7280';
    
    return {
      width: 32,
      height: 32,
      bgcolor: isSelected ? '#3b82f6' : '#64748b',
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: 600,
      border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
      opacity: isSelected ? 1 : 0.7,
      filter: isSelected ? 'none' : 'grayscale(50%)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      '&:hover': {
        opacity: 1,
        filter: 'none',
        transform: 'scale(1.1)',
        boxShadow: '0 0 8px #3b82f640'
      }
    };
  };

  // Handle guest selector
  const handleAddGuestClick = () => {
    if (teamMembers.length > 0 || aiAgents.length > 0) {
      setGuestSelectorOpen(true);
    } else {
      // Fallback to original onAddAgent if no team data
      onAddAgent?.();
    }
  };

  const handleGuestsAdded = (guests: TeamMember[]) => {
    onAddGuests?.(guests);
    setGuestSelectorOpen(false);
  };

  // Get current participant IDs for guest selector
  const currentParticipants = allAgents.map(agent => agent.id);

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
      {/* Human Participant Avatars */}
      {humanParticipants.map((human) => (
        <Tooltip 
          key={`human-${human.id}`}
          title={
            <Box>
              <Box sx={{ fontWeight: 600 }}>{human.name}</Box>
              <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {human.role || 'Team Member'}
              </Box>
              <Box sx={{ fontSize: '0.7rem', opacity: 0.6, mt: 0.5 }}>
                Status: {human.status} • Click to message
              </Box>
            </Box>
          }
          placement="top"
        >
          <Badge
            badgeContent=""
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: human.status === 'online' ? '#10b981' : 
                                human.status === 'away' ? '#f59e0b' : '#6b7280',
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: '1px solid white'
              }
            }}
          >
            <Avatar
              onClick={(e) => handleTargetClick(human.id, e)}
              sx={getHumanStyle(human)}
            >
              {human.avatar || human.name.charAt(0)}
            </Avatar>
          </Badge>
        </Tooltip>
      ))}

      {/* Agent Avatars with Behavior Prompts */}
      {allAgents.map((agent) => (
        <Tooltip 
          key={agent.id}
          title={
            <Box sx={{ p: 1.5, minWidth: 200 }}>
              {/* Agent Info Header */}
              <Box sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center' }}>
                {agent.name}
              </Box>
              <Box sx={{ fontSize: '0.75rem', opacity: 0.8, mb: 1, textAlign: 'center' }}>
                {agent.id === hostAgent.id ? '👑 Host Agent' : '🤖 Guest Agent'}
              </Box>
              <Box sx={{ fontSize: '0.7rem', opacity: 0.6, mb: 1.5, textAlign: 'center' }}>
                {selectedAgents.includes(agent.id) ? 'Selected for messaging' : 'Click to select for messaging'}
                {agent.hotkey && ` • Press ${agent.hotkey.toUpperCase()}`}
              </Box>
              
              {/* Behavior Prompts Section */}
              <Box sx={{ borderTop: '1px solid #374151', pt: 1 }}>
                <Box sx={{ fontSize: '0.7rem', opacity: 0.6, mb: 1, textAlign: 'center' }}>
                  Quick Behavior Prompts:
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      onBehaviorPrompt?.(agent.id, agent.name, 'collaborate');
                    }}
                    sx={{
                      bgcolor: '#10b981',
                      color: 'white',
                      fontSize: '10px',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      textAlign: 'center',
                      '&:hover': { bgcolor: '#059669' }
                    }}
                  >
                    🤝 Collaborate
                  </Box>
                  
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      onBehaviorPrompt?.(agent.id, agent.name, 'question');
                    }}
                    sx={{
                      bgcolor: '#3b82f6',
                      color: 'white',
                      fontSize: '10px',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      textAlign: 'center',
                      '&:hover': { bgcolor: '#2563eb' }
                    }}
                  >
                    ❓ Question
                  </Box>
                  
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      onBehaviorPrompt?.(agent.id, agent.name, 'devils_advocate');
                    }}
                    sx={{
                      bgcolor: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      textAlign: 'center',
                      '&:hover': { bgcolor: '#dc2626' }
                    }}
                  >
                    😈 Devil's Advocate
                  </Box>
                  
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      onBehaviorPrompt?.(agent.id, agent.name, 'expert');
                    }}
                    sx={{
                      bgcolor: '#8b5cf6',
                      color: 'white',
                      fontSize: '10px',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      textAlign: 'center',
                      '&:hover': { bgcolor: '#7c3aed' }
                    }}
                  >
                    🎯 Expert Analysis
                  </Box>
                  
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      onBehaviorPrompt?.(agent.id, agent.name, 'creative');
                    }}
                    sx={{
                      bgcolor: '#ec4899',
                      color: 'white',
                      fontSize: '10px',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      textAlign: 'center',
                      '&:hover': { bgcolor: '#db2777' }
                    }}
                  >
                    💡 Creative Ideas
                  </Box>
                </Box>
              </Box>
            </Box>
          }
          placement="top"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                '& .MuiTooltip-arrow': {
                  color: '#1e293b',
                },
              },
            },
          }}
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
      {(onAddAgent || onAddGuests) && (
        <Tooltip title="Add guest agent to conversation">
          <IconButton
            onClick={handleAddGuestClick}
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

      {/* Target Indicator */}
      {selectedTarget && humanParticipants.find(h => h.id === selectedTarget) && (
        <Box sx={{ 
          ml: 1, 
          px: 1, 
          py: 0.25, 
          bgcolor: '#10b98120', 
          border: '1px solid #10b98140',
          borderRadius: 1,
          fontSize: '0.7rem',
          color: '#10b981',
          fontWeight: 500
        }}>
          → {humanParticipants.find(h => h.id === selectedTarget)?.name}
        </Box>
      )}

      {/* Guest Selector Popup */}
      <GuestSelectorPopup
        open={guestSelectorOpen}
        onClose={() => setGuestSelectorOpen(false)}
        onAddGuests={handleGuestsAdded}
        currentParticipants={currentParticipants}
        teamMembers={teamMembers}
        aiAgents={aiAgents}
      />
    </Box>
  );
};

export default AgentAvatarSelector;

