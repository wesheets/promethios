/**
 * AgentAvatarSelector - Intuitive clickable agent selection for multi-agent chat
 * Replaces @mention typing with visual avatar selection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  IconButton,
  Badge
} from '@mui/material';
import { Add as AddIcon, DragIndicator } from '@mui/icons-material';
import GuestSelectorPopup from './GuestSelectorPopup';
import { unifiedParticipantService, UnifiedParticipant } from '../services/UnifiedParticipantService';
import { useUnifiedParticipantsOptional } from '../contexts/UnifiedParticipantContext';

// Import drag & drop functionality
import { useAgentDragSource } from '../hooks/useDragDrop';

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
  // Unified participant support (replaces sharedConversationParticipants)
  unifiedParticipants?: Array<{
    id: string;
    name: string;
    avatar?: string;
    type: 'ai_agent' | 'human';
    status: 'active' | 'pending' | 'declined';
    addedAt: Date;
    addedBy?: string;
    invitationId?: string;
  }>;
  // New props for unified invitation functionality
  chatSession?: {
    id: string;
    name: string;
    messageCount?: number;
  };
  agentId?: string;
  user?: any; // Firebase user object
  // Enhanced unified participant management
  useUnifiedParticipants?: boolean; // Flag to enable unified participant system
  onAddAIAgent?: (agentConfig: {
    id: string;
    name: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    color?: string;
    hotkey?: string;
    avatar?: string;
  }) => void;
  onRemoveParticipant?: (participantId: string) => void;
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
  unifiedParticipants = [], // Add the missing prop destructuring
  chatSession,
  agentId,
  user,
  useUnifiedParticipants = false,
  onAddAIAgent,
  onRemoveParticipant
}) => {
  const [guestSelectorOpen, setGuestSelectorOpen] = useState(false);
  const [realTimeParticipants, setRealTimeParticipants] = useState<UnifiedParticipant[]>([]);
  
  // Use unified participant context if available
  const participantContext = useUnifiedParticipantsOptional();
  
  // Subscribe to real-time participant updates when using unified system
  useEffect(() => {
    if (useUnifiedParticipants && conversationId && !participantContext) {
      console.log('🔔 [AgentAvatarSelector] Setting up unified participant subscription for:', conversationId);
      
      const unsubscribe = unifiedParticipantService.subscribeToParticipants(
        conversationId,
        (participants) => {
          console.log('🔔 [AgentAvatarSelector] Received participant update:', participants.length);
          setRealTimeParticipants(participants);
        }
      );
      
      return () => {
        console.log('🔕 [AgentAvatarSelector] Cleaning up participant subscription');
        unsubscribe();
      };
    }
  }, [useUnifiedParticipants, conversationId, participantContext]);
  
  // Helper function to get proper agent name
  const getAgentDisplayName = (participant: any) => {
    // If we have a proper name that's not just an ID, use it
    if (participant.name && !participant.name.startsWith('Agent ') && !participant.name.includes('-')) {
      return participant.name;
    }
    
    // Check if there's a better name in agentConfig
    if (participant.agentConfig?.name) {
      return participant.agentConfig.name;
    }
    
    // For AI agents, try to extract a meaningful name from the ID
    if (participant.type === 'ai_agent' || participant.type === 'ai') {
      // If the ID contains meaningful parts, try to extract them
      if (participant.id.includes('claude')) {
        return 'Claude Assistant';
      } else if (participant.id.includes('gpt')) {
        return 'GPT Assistant';
      } else if (participant.id.includes('chatbot')) {
        // Try to extract a number or identifier
        const match = participant.id.match(/chatbot-(\d+)/);
        if (match) {
          return `AI Agent ${match[1]}`;
        }
        return 'AI Assistant';
      }
    }
    
    // Fallback to the original name or a generic name
    return participant.name || (participant.type === 'human' ? 'Guest User' : 'AI Assistant');
  };

  // Determine which agents/participants to show
  const allAgents = useUnifiedParticipants 
    ? (participantContext?.participants || realTimeParticipants).map(participant => ({
        id: participant.id,
        name: getAgentDisplayName(participant),
        avatar: participant.avatar || participant.agentConfig?.avatar,
        color: participant.agentConfig?.color || (participant.type === 'human' ? '#3b82f6' : '#8b5cf6'),
        hotkey: participant.agentConfig?.hotkey,
        type: participant.type === 'ai_agent' ? 'ai_agent' : 'human',
        status: participant.status,
        isPending: participant.status === 'pending',
        permissions: participant.permissions
      }))
    : isSharedMode 
      ? (unifiedParticipants || sharedConversationParticipants)
          .filter(participant => {
            // In shared mode, filter out the host agent if hideHostAgent is true
            console.log('🔍 [AgentAvatarSelector] Filtering participant:', {
              participantId: participant.id,
              hideHostAgent,
              hostAgentId: hostAgent?.id,
              shouldFilter: hideHostAgent && hostAgent && participant.id === hostAgent.id
            });
            
            if (hideHostAgent && hostAgent && participant.id === hostAgent.id) {
              console.log('🔍 [AgentAvatarSelector] Filtering out host agent in shared mode:', participant.id);
              return false;
            }
            return true;
          })
          .map(participant => ({
            id: participant.id,
            name: getAgentDisplayName(participant),
            avatar: participant.avatar,
            color: participant.type === 'human' ? '#3b82f6' : '#8b5cf6', // Blue for humans, purple for AI
            hotkey: undefined,
            type: participant.type === 'ai' ? 'ai_agent' : participant.type, // Normalize type
            status: participant.status, // Include status for pending/active distinction
            isPending: participant.status === 'pending' // Flag for visual styling
          }))
      : hideHostAgent 
        ? guestAgents 
        : hostAgent ? [hostAgent, ...guestAgents] : guestAgents;

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

  // Handle target selection (for messaging) - unified for both humans and agents
  const handleTargetClick = (targetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🎯 [AgentAvatarSelector] handleTargetClick called:', {
      targetId,
      currentSelectedTarget: selectedTarget,
      currentSelectedAgents: selectedAgents
    });
    
    // Check if this is a human participant
    const isHuman = humanParticipants.some(h => h.id === targetId);
    
    if (isHuman) {
      console.log('👤 [AgentAvatarSelector] Selecting human participant:', targetId);
      
      // For humans, we need to:
      // 1. Clear agent selections (since we're targeting a human)
      // 2. Set the target to the human
      onSelectionChange(hostAgent ? [hostAgent.id] : []); // Reset to just host agent if available
      onTargetChange?.(targetId); // Set human as target
      
      console.log('👤 [AgentAvatarSelector] Human participant selected as target');
    } else {
      console.log('🤖 [AgentAvatarSelector] Setting agent as target:', targetId);
      onTargetChange?.(targetId);
    }
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
      opacity: 1, // Always full opacity for better visibility
      filter: isSelected ? 'none' : 'grayscale(20%)', // Less grayscale when not selected
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      '&:hover': {
        opacity: 1,
        filter: 'none',
        transform: 'scale(1.1)',
        boxShadow: isSelected ? '0 0 12px #3b82f680' : '0 0 8px #3b82f640'
      }
    };
  };

  // Get agent style based on selection state
  const getAgentStyle = (agent: AgentInfo) => {
    const isSelected = selectedAgents.includes(agent.id);
    const isPending = (agent as any).isPending;
    
    return {
      width: 32,
      height: 32,
      bgcolor: isPending ? '#6b7280' : (isSelected ? agent.color : '#64748b'),
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: 600,
      border: isPending 
        ? '2px dashed #9ca3af' // Dashed border for pending
        : (isSelected ? `2px solid ${agent.color}` : '2px solid transparent'),
      opacity: isPending ? 0.6 : 1,
      filter: isPending ? 'grayscale(50%)' : (isSelected ? 'none' : 'grayscale(20%)'),
      transition: 'all 0.2s ease',
      cursor: isPending ? 'not-allowed' : 'pointer',
      '&:hover': {
        opacity: isPending ? 0.6 : 1,
        filter: isPending ? 'grayscale(50%)' : 'none',
        transform: isPending ? 'none' : 'scale(1.1)',
        boxShadow: isPending ? 'none' : (isSelected ? `0 0 12px ${agent.color}80` : `0 0 8px ${agent.color}40`)
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

  // Handle adding AI agent in unified system
  const handleAddAIAgent = async (agentConfig: {
    id: string;
    name: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    color?: string;
    hotkey?: string;
    avatar?: string;
  }) => {
    // Use context if available, otherwise use service directly
    if (participantContext) {
      try {
        console.log('🤖 [AgentAvatarSelector] Adding AI agent via context:', agentConfig);
        await participantContext.addAIAgent(agentConfig);
        console.log('✅ [AgentAvatarSelector] AI agent added via context');
        onAddAIAgent?.(agentConfig);
      } catch (error) {
        console.error('❌ [AgentAvatarSelector] Failed to add AI agent via context:', error);
      }
    } else if (useUnifiedParticipants && conversationId && currentUserId) {
      try {
        console.log('🤖 [AgentAvatarSelector] Adding AI agent via unified system:', agentConfig);
        
        await unifiedParticipantService.addAIAgentParticipant(
          conversationId,
          agentConfig.id,
          agentConfig.name,
          currentUserId,
          agentConfig
        );
        
        console.log('✅ [AgentAvatarSelector] AI agent added successfully');
        onAddAIAgent?.(agentConfig);
        
      } catch (error) {
        console.error('❌ [AgentAvatarSelector] Failed to add AI agent:', error);
      }
    } else {
      // Fallback to parent callback
      onAddAIAgent?.(agentConfig);
    }
  };

  // Handle removing participant in unified system
  const handleRemoveParticipant = async (participantId: string) => {
    // Use context if available, otherwise use service directly
    if (participantContext) {
      try {
        console.log('🗑️ [AgentAvatarSelector] Removing participant via context:', participantId);
        await participantContext.removeParticipant(participantId);
        console.log('✅ [AgentAvatarSelector] Participant removed via context');
        onRemoveParticipant?.(participantId);
      } catch (error) {
        console.error('❌ [AgentAvatarSelector] Failed to remove participant via context:', error);
      }
    } else if (useUnifiedParticipants && conversationId && currentUserId) {
      try {
        console.log('🗑️ [AgentAvatarSelector] Removing participant via unified system:', participantId);
        
        await unifiedParticipantService.removeParticipant(
          conversationId,
          participantId,
          currentUserId
        );
        
        console.log('✅ [AgentAvatarSelector] Participant removed successfully');
        onRemoveParticipant?.(participantId);
        
      } catch (error) {
        console.error('❌ [AgentAvatarSelector] Failed to remove participant:', error);
      }
    } else {
      // Fallback to parent callback
      onRemoveParticipant?.(participantId);
    }
  };

  // Get current participant IDs for guest selector
  const currentParticipants = allAgents.map(agent => agent.id);

  // Draggable Agent Avatar Component (separate component to avoid hook rule violations)
  const DraggableAgentAvatar: React.FC<{
    agent: AgentInfo;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    hostAgent: any;
    onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string) => void;
    useUnifiedParticipants: boolean;
    participantContext: any;
    handleRemoveParticipant: (agentId: string) => void;
    getAgentStyle: (agent: AgentInfo) => any;
  }> = ({ 
    agent, 
    isSelected, 
    onClick, 
    hostAgent, 
    onBehaviorPrompt, 
    useUnifiedParticipants, 
    participantContext, 
    handleRemoveParticipant, 
    getAgentStyle 
  }) => {
    const isPending = (agent as any).isPending;
    const isAI = agent.type === 'ai_agent';
    
    // Debug logging for drag functionality
    console.log('🎯 [AgentAvatarSelector] Rendering agent:', {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      isAI,
      isPending,
      draggable: isAI && !isPending
    });
    
    // Make AI agents draggable - this hook is now called consistently
    const { dragRef, isDragging, dragHandlers } = useAgentDragSource(
      agent.id,
      {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        color: agent.color
      },
      false // isHuman = false for AI agents
    );

    // Enhanced click handler that doesn't interfere with drag
    const handleClick = useCallback((event: React.MouseEvent) => {
      // Don't handle click if this was a drag operation
      if (isDragging) {
        console.log('🎯 [AgentAvatarSelector] Ignoring click during drag');
        return;
      }
      
      console.log('🎯 [AgentAvatarSelector] Agent clicked:', agent.id);
      handleAgentClick(agent.id, event);
    }, [agent.id, isDragging]);

    // Enhanced drag handlers with debugging
    const enhancedDragHandlers = isAI && !isPending ? {
      ...dragHandlers,
      onDragStart: (e: React.DragEvent) => {
        console.log('🚀 [AgentAvatarSelector] Drag started for agent:', agent.name);
        dragHandlers.onDragStart?.(e);
      },
      onDragEnd: (e: React.DragEvent) => {
        console.log('🏁 [AgentAvatarSelector] Drag ended for agent:', agent.name);
        dragHandlers.onDragEnd?.(e);
      }
    } : {};

    return (
      <Tooltip
        title={
          <Box sx={{ p: 1.5, minWidth: 200 }}>
            {/* Agent Info Header */}
            <Box sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              {agent.name}
              {isAI && <DragIndicator sx={{ fontSize: '12px', opacity: 0.7 }} />}
            </Box>
            <Box sx={{ fontSize: '0.75rem', opacity: 0.8, mb: 1, textAlign: 'center' }}>
              {hostAgent && agent.id === hostAgent.id ? '👑 Host Agent' : 
               agent.type === 'human' ? 
                 (isPending ? '⏳ Guest User (Pending)' : '👤 Guest User') : 
                 (isPending ? '⏳ Guest Agent (Pending)' : '🤖 Guest Agent')}
            </Box>
            <Box sx={{ fontSize: '0.7rem', opacity: 0.6, mb: 1.5, textAlign: 'center' }}>
              {isAI && !isPending && '💡 Drag onto messages to interact • '}
              {isSelected ? 'Selected for messaging' : 'Click to select for messaging'}
              {agent.hotkey && ` • Press ${agent.hotkey.toUpperCase()}`}
            </Box>
            
            {/* Enhanced Behavior Prompts with Participant Selection */}
            {isAI && !isPending && (
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
            )}
            
            {/* Remove Participant Section (for unified system) */}
            {useUnifiedParticipants && (
              (participantContext?.canRemoveParticipant(agent.id) || (agent as any).permissions?.canRemove)
            ) && (
              <Box sx={{ borderTop: '1px solid #374151', pt: 1, mt: 1 }}>
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveParticipant(agent.id);
                  }}
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 1,
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: '#ef4444',
                    border: '1px solid #ef444440',
                    textAlign: 'center',
                    '&:hover': {
                      bgcolor: '#ef444420',
                      borderColor: '#ef444460'
                    }
                  }}
                >
                  🗑️ Remove {agent.type === 'human' ? 'Participant' : 'Agent'}
                </Box>
              </Box>
            )}
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
              bgcolor: isSelected ? agent.color : '#64748b',
              opacity: 0.8
            }
          }}
        >
          <Avatar
            ref={isAI && !isPending ? dragRef : undefined}
            {...enhancedDragHandlers}
            onClick={handleClick}
            sx={{
              ...getAgentStyle(agent),
              cursor: isAI && !isPending ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
              opacity: isDragging ? 0.7 : (isPending ? 0.6 : 1),
              transform: isDragging ? 'rotate(5deg)' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                ...getAgentStyle(agent)['&:hover'],
                transform: isDragging ? 'rotate(5deg)' : (isPending ? 'none' : 'scale(1.1)'),
              }
            }}
          >
            {agent.avatar || agent.name.charAt(0)}
          </Avatar>
        </Badge>
      </Tooltip>
    );
  };

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
        // If only this agent is selected, deselect (default to host if available)
        const defaultSelection = hostAgent ? [hostAgent.id] : [];
        console.log('🔍 [AgentAvatarSelector] Deselecting agent, defaulting to host:', defaultSelection);
        onSelectionChange(defaultSelection);
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
        <DraggableAgentAvatar
          key={agent.id}
          agent={agent}
          isSelected={selectedAgents.includes(agent.id)}
          onClick={(e) => handleAgentClick(agent.id, e)}
          hostAgent={hostAgent}
          onBehaviorPrompt={onBehaviorPrompt}
          useUnifiedParticipants={useUnifiedParticipants}
          participantContext={participantContext}
          handleRemoveParticipant={handleRemoveParticipant}
          getAgentStyle={getAgentStyle}
        />
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
        agentName={hostAgent?.name || 'No Agent'}
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

