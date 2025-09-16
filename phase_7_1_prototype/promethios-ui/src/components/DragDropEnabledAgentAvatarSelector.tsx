/**
 * DragDropEnabledAgentAvatarSelector - Enhanced version with drag & drop functionality
 * Extends AgentAvatarSelector with drag capabilities for bottom agent avatars
 */

import React, { useState, useEffect } from 'react';
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

// Import types from original component
export interface AgentInfo {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  hotkey?: string;
  type?: 'human' | 'ai_agent';
  status?: 'active' | 'pending' | 'declined';
  isPending?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  type: 'human' | 'ai_agent';
  role?: string;
  status: 'online' | 'away' | 'offline';
  avatar?: string;
  health?: number;
  provider?: string;
}

export interface DragDropEnabledAgentAvatarSelectorProps {
  hostAgent: AgentInfo;
  guestAgents: AgentInfo[];
  selectedAgents: string[];
  onSelectionChange: (selectedAgentIds: string[]) => void;
  onAddAgent?: () => void;
  teamMembers?: TeamMember[];
  aiAgents?: TeamMember[];
  onAddGuests?: (guests: TeamMember[]) => void;
  humanParticipants?: TeamMember[];
  selectedTarget?: string;
  onTargetChange?: (targetId: string) => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string) => void;
  currentUserId?: string;
  currentUserName?: string;
  conversationId?: string;
  conversationName?: string;
  connectionsLoading?: boolean;
  hideHostAgent?: boolean;
  isSharedMode?: boolean;
  sharedConversationParticipants?: Array<{
    id: string;
    name: string;
    type: 'human' | 'ai';
    avatar?: string;
    status?: 'online' | 'offline';
  }>;
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
  chatSession?: {
    id: string;
    name: string;
    messageCount?: number;
  };
  agentId?: string;
  user?: any;
  useUnifiedParticipants?: boolean;
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

// Enhanced draggable avatar component
const DraggableAgentAvatar: React.FC<{
  agent: AgentInfo;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string) => void;
  useUnifiedParticipants?: boolean;
  participantContext?: any;
  onRemoveParticipant?: (participantId: string) => void;
}> = ({ 
  agent, 
  isSelected, 
  onClick, 
  onBehaviorPrompt, 
  useUnifiedParticipants, 
  participantContext, 
  onRemoveParticipant 
}) => {
  const isPending = agent.isPending;
  const isAI = agent.type === 'ai_agent';
  
  // Make the avatar draggable if it's an AI agent
  const { dragRef, isDragging, dragHandlers } = useAgentDragSource(
    agent.id,
    {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      color: agent.color,
      avatar: agent.avatar,
      hotkey: agent.hotkey,
    },
    !isAI // isHuman
  );

  // Get agent style based on selection and drag state
  const getAgentStyle = () => {
    return {
      width: 32,
      height: 32,
      bgcolor: isPending ? '#6b7280' : (isSelected ? agent.color : '#64748b'),
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: 600,
      border: isPending 
        ? '2px dashed #9ca3af'
        : (isSelected ? `2px solid ${agent.color}` : '2px solid transparent'),
      opacity: isPending ? 0.6 : (isDragging ? 0.7 : 1),
      filter: isPending ? 'grayscale(50%)' : (isSelected ? 'none' : 'grayscale(20%)'),
      transition: 'all 0.2s ease',
      cursor: isPending ? 'not-allowed' : (isAI ? 'grab' : 'pointer'),
      transform: isDragging ? 'rotate(5deg)' : 'none',
      '&:hover': {
        opacity: isPending ? 0.6 : 1,
        filter: isPending ? 'grayscale(50%)' : 'none',
        transform: isPending ? 'none' : (isDragging ? 'rotate(5deg)' : 'scale(1.1)'),
        boxShadow: isPending ? 'none' : (isSelected ? `0 0 12px ${agent.color}80` : `0 0 8px ${agent.color}40`)
      },
      '&:active': {
        cursor: isAI ? 'grabbing' : 'pointer',
      },
      position: 'relative',
    };
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (participantContext) {
      try {
        await participantContext.removeParticipant(participantId);
        onRemoveParticipant?.(participantId);
      } catch (error) {
        console.error('Failed to remove participant:', error);
      }
    } else {
      onRemoveParticipant?.(participantId);
    }
  };

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1, minWidth: 120 }}>
          <Box sx={{ 
            fontWeight: 'bold', 
            fontSize: '0.8rem', 
            mb: 1,
            color: agent.color,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {agent.name}
            {isAI && <DragIndicator sx={{ fontSize: '12px', opacity: 0.7 }} />}
            {isPending && <span style={{ fontSize: '10px', color: '#f59e0b' }}>(Pending)</span>}
          </Box>
          
          {agent.hotkey && (
            <Box sx={{ fontSize: '0.7rem', color: '#94a3b8', mb: 1 }}>
              Hotkey: {agent.hotkey.toUpperCase()}
            </Box>
          )}

          {isAI && !isPending && (
            <Box sx={{ fontSize: '0.7rem', color: '#94a3b8', mb: 1 }}>
              💡 Drag onto messages to interact
            </Box>
          )}

          {/* Behavior Prompts */}
          {isAI && !isPending && onBehaviorPrompt && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
          )}

          {/* Remove Participant Section */}
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
          ref={dragRef}
          {...(isAI ? dragHandlers : {})}
          onClick={onClick}
          sx={getAgentStyle()}
        >
          {agent.avatar || agent.name.charAt(0)}
        </Avatar>
      </Badge>
    </Tooltip>
  );
};

export const DragDropEnabledAgentAvatarSelector: React.FC<DragDropEnabledAgentAvatarSelectorProps> = ({
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
  unifiedParticipants = [],
  chatSession,
  agentId,
  user,
  useUnifiedParticipants = false,
  onAddAIAgent,
  onRemoveParticipant
}) => {
  const [guestSelectorOpen, setGuestSelectorOpen] = useState(false);
  const [realTimeParticipants, setRealTimeParticipants] = useState<UnifiedParticipant[]>([]);
  
  const participantContext = useUnifiedParticipantsOptional();
  
  // Subscribe to real-time participant updates when using unified system
  useEffect(() => {
    if (useUnifiedParticipants && conversationId && !participantContext) {
      const unsubscribe = unifiedParticipantService.subscribeToParticipants(
        conversationId,
        (participants) => {
          setRealTimeParticipants(participants);
        }
      );
      
      return () => unsubscribe();
    }
  }, [useUnifiedParticipants, conversationId, participantContext]);
  
  // Helper function to get proper agent name
  const getAgentDisplayName = (participant: any) => {
    if (participant.name && !participant.name.startsWith('Agent ') && !participant.name.includes('-')) {
      return participant.name;
    }
    
    if (participant.agentConfig?.name) {
      return participant.agentConfig.name;
    }
    
    if (participant.type === 'ai_agent' || participant.type === 'ai') {
      if (participant.id.includes('claude')) {
        return 'Claude Assistant';
      } else if (participant.id.includes('gpt')) {
        return 'GPT Assistant';
      } else if (participant.id.includes('chatbot')) {
        const match = participant.id.match(/chatbot-(\d+)/);
        if (match) {
          return `AI Agent ${match[1]}`;
        }
        return 'AI Assistant';
      }
    }
    
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
            if (hideHostAgent && hostAgent && participant.id === hostAgent.id) {
              return false;
            }
            return true;
          })
          .map(participant => ({
            id: participant.id,
            name: getAgentDisplayName(participant),
            avatar: participant.avatar,
            color: participant.type === 'human' ? '#3b82f6' : '#8b5cf6',
            hotkey: undefined,
            type: participant.type === 'ai' ? 'ai_agent' : participant.type,
            status: participant.status,
            isPending: participant.status === 'pending'
          }))
      : hideHostAgent 
        ? guestAgents 
        : hostAgent ? [hostAgent, ...guestAgents] : guestAgents;

  // Handle agent click
  const handleAgentClick = (agentId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const agent = allAgents.find(a => a.id === agentId);
    if (agent?.isPending) return; // Don't allow selection of pending agents
    
    const isCurrentlySelected = selectedAgents.includes(agentId);
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select mode
      if (isCurrentlySelected) {
        onSelectionChange(selectedAgents.filter(id => id !== agentId));
      } else {
        onSelectionChange([...selectedAgents, agentId]);
      }
    } else {
      // Single select mode
      if (isCurrentlySelected && selectedAgents.length === 1) {
        onSelectionChange([]);
      } else {
        onSelectionChange([agentId]);
      }
    }
    
    // Clear human target when selecting agents
    if (selectedTarget && humanParticipants.some(h => h.id === selectedTarget)) {
      onTargetChange?.('');
    }
  };

  // Handle target selection for humans
  const handleTargetClick = (targetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const isHuman = humanParticipants.some(h => h.id === targetId);
    
    if (isHuman) {
      onSelectionChange(hostAgent ? [hostAgent.id] : []);
      onTargetChange?.(targetId);
    } else {
      onTargetChange?.(targetId);
    }
  };

  // Get human style based on selection state
  const getHumanStyle = (human: TeamMember) => {
    const isSelected = selectedTarget === human.id;
    
    return {
      width: 32,
      height: 32,
      bgcolor: isSelected ? '#3b82f6' : '#64748b',
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: 600,
      border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
      opacity: 1,
      filter: isSelected ? 'none' : 'grayscale(20%)',
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

  // Handle guest selector
  const handleAddGuestClick = () => {
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
    if (participantContext) {
      try {
        await participantContext.addAIAgent(agentConfig);
        onAddAIAgent?.(agentConfig);
      } catch (error) {
        console.error('Failed to add AI agent via context:', error);
      }
    } else if (useUnifiedParticipants && conversationId && currentUserId) {
      try {
        await unifiedParticipantService.addAIAgentParticipant(
          conversationId,
          agentConfig.id,
          agentConfig.name,
          currentUserId,
          agentConfig
        );
        
        onAddAIAgent?.(agentConfig);
      } catch (error) {
        console.error('Failed to add AI agent:', error);
      }
    } else {
      onAddAIAgent?.(agentConfig);
    }
  };

  // Handle removing participant in unified system
  const handleRemoveParticipant = async (participantId: string) => {
    if (participantContext) {
      try {
        await participantContext.removeParticipant(participantId);
        onRemoveParticipant?.(participantId);
      } catch (error) {
        console.error('Failed to remove participant via context:', error);
      }
    } else if (useUnifiedParticipants && conversationId && currentUserId) {
      try {
        await unifiedParticipantService.removeParticipant(
          conversationId,
          participantId,
          currentUserId
        );
        
        onRemoveParticipant?.(participantId);
      } catch (error) {
        console.error('Failed to remove participant:', error);
      }
    } else {
      onRemoveParticipant?.(participantId);
    }
  };

  // Get current participants for guest selector
  const currentParticipants = [
    ...allAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type as 'human' | 'ai_agent'
    })),
    ...(humanParticipants || []).map(human => ({
      id: human.id,
      name: human.name,
      type: human.type
    }))
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      p: 1,
      bgcolor: '#0f172a',
      borderTop: '1px solid #334155',
      minHeight: 56,
    }}>
      {/* Human Participants */}
      {(humanParticipants || []).map((human) => (
        <Tooltip key={human.id} title={`${human.name} (${human.status})`}>
          <Avatar
            onClick={(e) => handleTargetClick(human.id, e)}
            sx={getHumanStyle(human)}
          >
            {human.avatar || human.name.charAt(0)}
          </Avatar>
        </Tooltip>
      ))}

      {/* AI Agent Participants with Drag & Drop */}
      {allAgents.map((agent) => (
        <DraggableAgentAvatar
          key={agent.id}
          agent={agent}
          isSelected={selectedAgents.includes(agent.id)}
          onClick={(e) => handleAgentClick(agent.id, e)}
          onBehaviorPrompt={onBehaviorPrompt}
          useUnifiedParticipants={useUnifiedParticipants}
          participantContext={participantContext}
          onRemoveParticipant={handleRemoveParticipant}
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
          onAddGuests?.(humans);
          setGuestSelectorOpen(false);
        }}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        conversationId={conversationId}
        conversationName={conversationName}
        agentName={hostAgent?.name || 'No Agent'}
        connectionsLoading={connectionsLoading}
        chatSession={chatSession}
        agentId={agentId}
        user={user}
      />
    </Box>
  );
};

export default DragDropEnabledAgentAvatarSelector;

