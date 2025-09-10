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
  type?: 'human' | 'ai_agent'; // Add type property
  status?: 'active' | 'pending' | 'declined'; // Add status property
  isPending?: boolean; // Add isPending flag
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
  // Props needed for AI collaboration invitations
  currentUserId?: string;
  currentUserName?: string;
  conversationId?: string;
  conversationName?: string;
  // Loading state to handle async data loading
  connectionsLoading?: boolean;
  // Hide host agent (for shared conversations)
  hideHostAgent?: boolean;
  // Shared conversation context
  isSharedMode?: boolean;
  sharedConversationParticipants?: Array<{
    id: string;
    name: string;
    type: 'human' | 'ai';
    avatar?: string;
    status?: 'online' | 'offline';
  }>;
  // New props for unified invitation functionality
  chatSession?: {
    id: string;
    name: string;
    messageCount?: number;
  };
  agentId?: string;
  user?: any; // Firebase user object
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
  onBehaviorPrompt,
  currentUserId,
  currentUserName,
  conversationId,
  conversationName,
  connectionsLoading = false,
  hideHostAgent = false,
  isSharedMode = false,
  sharedConversationParticipants = [],
  chatSession,
  agentId,
  user
}) => {
  const [guestSelectorOpen, setGuestSelectorOpen] = useState(false);
  
  // Determine which agents/participants to show
  const allAgents = isSharedMode 
    ? sharedConversationParticipants.map(participant => ({
        id: participant.id,
        name: participant.name,
        avatar: participant.avatar,
        color: participant.type === 'human' ? '#3b82f6' : '#8b5cf6', // Blue for humans, purple for AI
        hotkey: undefined,
        type: participant.type, // Preserve the type for proper labeling
        status: participant.status, // Include status for pending/active distinction
        isPending: participant.status === 'pending' // Flag for visual styling
      }))
    : hideHostAgent 
      ? guestAgents 
      : [hostAgent, ...guestAgents];

  // Debug logging to see what props are received
  console.log('🔍 [AgentAvatarSelector] Props received:');
  console.log('🔍 [AgentAvatarSelector] isSharedMode:', isSharedMode);
  console.log('🔍 [AgentAvatarSelector] sharedConversationParticipants:', sharedConversationParticipants);
  console.log('🔍 [AgentAvatarSelector] allAgents:', allAgents);
  console.log('🔍 [AgentAvatarSelector] teamMembers:', teamMembers);
  console.log('🔍 [AgentAvatarSelector] teamMembers.length:', teamMembers.length);
  console.log('🔍 [AgentAvatarSelector] aiAgents:', aiAgents);
  console.log('🔍 [AgentAvatarSelector] aiAgents.length:', aiAgents.length);
  console.log('🔍 [AgentAvatarSelector] connectionsLoading:', connectionsLoading);
  console.log('🔍 [AgentAvatarSelector] onAddGuests provided:', !!onAddGuests);
  console.log('🔍 [AgentAvatarSelector] onAddAgent provided:', !!onAddAgent);
  
  // Check if button should be clickable - always allow if there might be people to invite
  const shouldBeClickable = true; // Always allow opening the guest selector
  console.log('🔍 [AgentAvatarSelector] Button should be clickable:', shouldBeClickable);
  console.log('🔍 [AgentAvatarSelector] Reason: Always allow opening guest selector to invite people');

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
    console.log('🔘 [AgentAvatarSelector] Plus button clicked!');
    console.log('🔘 [AgentAvatarSelector] teamMembers.length:', teamMembers.length);
    console.log('🔘 [AgentAvatarSelector] aiAgents.length:', aiAgents.length);
    console.log('🔘 [AgentAvatarSelector] connectionsLoading:', connectionsLoading);
    
    // Always open the guest selector - let the popup handle showing available options
    console.log('🔘 [AgentAvatarSelector] Opening GuestSelectorPopup');
    setGuestSelectorOpen(true);
  };

  const handleGuestsAdded = (guests: TeamMember[]) => {
    onAddGuests?.(guests);
    setGuestSelectorOpen(false);
  };

  // Get current participant IDs for guest selector
  const currentParticipants = allAgents.map(agent => agent.id);

  // Handle agent selection toggle
  const handleAgentClick = (agentId: string, event: React.MouseEvent) => {
    console.log('🔍 [AgentAvatarSelector] handleAgentClick called:', {
      agentId,
      eventType: event.type,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey
    });
    
    // Find the agent to check if it's pending
    const agent = allAgents.find(a => a.id === agentId);
    console.log('🔍 [AgentAvatarSelector] Found agent:', agent);
    
    if ((agent as any)?.isPending) {
      console.log('🔒 [AgentAvatarSelector] Cannot select pending participant:', agentId);
      return; // Don't allow selection of pending participants
    }
    
    const isCtrlClick = event.ctrlKey || event.metaKey;
    console.log('🔍 [AgentAvatarSelector] Click type:', { isCtrlClick });
    
    if (isCtrlClick) {
      // Multi-select mode
      console.log('🔍 [AgentAvatarSelector] Multi-select mode');
      if (selectedAgents.includes(agentId)) {
        // Remove from selection
        console.log('🔍 [AgentAvatarSelector] Removing from selection:', agentId);
        onSelectionChange(selectedAgents.filter(id => id !== agentId));
      } else {
        // Add to selection
        console.log('🔍 [AgentAvatarSelector] Adding to selection:', agentId);
        onSelectionChange([...selectedAgents, agentId]);
      }
    } else {
      // Single select mode
      console.log('🔍 [AgentAvatarSelector] Single select mode');
      if (selectedAgents.length === 1 && selectedAgents[0] === agentId) {
        // If only this agent is selected, deselect (default to host)
        console.log('🔍 [AgentAvatarSelector] Deselecting agent, defaulting to host:', hostAgent.id);
        onSelectionChange([hostAgent.id]);
        // 🔧 FIX: Also clear the messaging target when deselecting
        onTargetChange?.('');
        console.log('🎯 [AgentAvatarSelector] Cleared messaging target');
      } else {
        // Select only this agent
        console.log('🔍 [AgentAvatarSelector] Selecting agent:', agentId);
        onSelectionChange([agentId]);
        // 🔧 FIX: Also set this agent as the messaging target for shared conversations
        onTargetChange?.(agentId);
        console.log('🎯 [AgentAvatarSelector] Set messaging target to agent:', agentId);
      }
    }
    
    console.log('🔍 [AgentAvatarSelector] handleAgentClick completed:', {
      agentId,
      selectedAgents: selectedAgents,
      onSelectionChangeProvided: !!onSelectionChange,
      onTargetChangeProvided: !!onTargetChange
    });
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

  // Get agent color based on selection state and pending status
  const getAgentStyle = (agent: AgentInfo) => {
    const isSelected = selectedAgents.includes(agent.id);
    const isPending = (agent as any).isPending; // Type assertion for pending status
    
    return {
      width: 32,
      height: 32,
      bgcolor: isPending ? '#6b7280' : (isSelected ? agent.color : '#64748b'), // Grey for pending
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: 600,
      border: isPending 
        ? '2px dashed #9ca3af' // Dashed border for pending
        : (isSelected ? `2px solid ${agent.color}` : '2px solid transparent'),
      opacity: isPending ? 0.6 : 1, // Reduced opacity for pending
      cursor: isPending ? 'default' : 'pointer', // Different cursor for pending
      transition: 'all 0.2s ease'
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
                {agent.id === hostAgent.id ? '👑 Host Agent' : 
                 agent.type === 'human' ? 
                   ((agent as any).isPending ? '⏳ Guest User (Pending)' : '👤 Guest User') : 
                   ((agent as any).isPending ? '⏳ Guest Agent (Pending)' : '🤖 Guest Agent')}
              </Box>
              <Box sx={{ fontSize: '0.7rem', opacity: 0.6, mb: 1.5, textAlign: 'center' }}>
                {selectedAgents.includes(agent.id) ? 'Selected for messaging' : 'Click to select for messaging'}
                {agent.hotkey && ` • Press ${agent.hotkey.toUpperCase()}`}
              </Box>
              
              {/* Enhanced Behavior Prompts with Participant Selection */}
              <Box sx={{ borderTop: '1px solid #374151', pt: 1 }}>
                <Box sx={{ fontSize: '0.7rem', opacity: 0.6, mb: 1, textAlign: 'center' }}>
                  Quick Behavior Prompts:
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {/* Simple Behavior Prompts */}
                  {[
                    { behavior: 'collaborate', label: '🤝 Collaborate', color: '#10b981' },
                    { behavior: 'question', label: '❓ Question', color: '#3b82f6' },
                    { behavior: 'devils_advocate', label: '😈 Devil\'s Advocate', color: '#ef4444' },
                    { behavior: 'expert', label: '🧠 Expert Analysis', color: '#8b5cf6' },
                    { behavior: 'creative', label: '💡 Creative Ideas', color: '#ec4899' },
                    { behavior: 'pessimist', label: '🌧️ Pessimist', color: '#f59e0b' }
                  ].map((prompt) => (
                    <Box
                      key={prompt.behavior}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBehaviorPrompt?.(agent.id, agent.name, prompt.behavior);
                      }}
                      sx={{
                        px: 1,
                        py: 0.5,
                        bgcolor: 'rgba(55, 65, 81, 0.8)',
                        borderRadius: 1,
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        color: prompt.color,
                        border: `1px solid ${prompt.color}40`,
                        textAlign: 'center',
                        '&:hover': {
                          bgcolor: `${prompt.color}20`,
                          borderColor: `${prompt.color}60`
                        }
                      }}
                    >
                      {prompt.label}
                    </Box>
                  ))}
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
        onAddHumans={(humans) => {
          // Forward human invitations to parent component
          onAddGuests?.(humans);
          setGuestSelectorOpen(false);
        }}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        conversationId={conversationId}
        conversationName={conversationName}
        agentName={hostAgent.name}
        connectionsLoading={connectionsLoading}
        // New unified functionality props
        chatSession={chatSession}
        agentId={agentId}
        user={user}
      />
    </Box>
  );
};

export default AgentAvatarSelector;

