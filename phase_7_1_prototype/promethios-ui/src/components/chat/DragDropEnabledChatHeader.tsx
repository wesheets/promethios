/**
 * Enhanced Chat Header with Drag & Drop Functionality
 * Extends ConsolidatedChatHeader with drag & drop capabilities for agents
 */

import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  Add,
  Group,
  Chat,
  DragIndicator,
} from '@mui/icons-material';

// Import drag & drop functionality
import { useAgentDragSource } from '../../hooks/useDragDrop';
import { initializeDefaultActions } from '../../systems/DragDropRegistry';

// Types (copied from ConsolidatedChatHeader)
interface GuestAgent {
  agentId: string;
  name: string;
  avatar?: string;
  addedAt: Date;
}

interface HumanParticipant {
  userId: string;
  name: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
}

interface ChatContext {
  id: string;
  type: 'ai_agent' | 'human_chat' | 'team_channel';
  name: string;
  avatar?: string;
  isActive: boolean;
  unreadCount: number;
  canClose: boolean;
  guestAgents?: GuestAgent[];
}

interface MultiChatState {
  activeContextId: string;
  contexts: ChatContext[];
  sidePanel: {
    isOpen: boolean;
    type: 'participants' | 'tools' | 'settings';
  };
}

interface DragDropEnabledChatHeaderProps {
  hostChatSession: any;
  user: any;
  multiChatState: MultiChatState;
  onContextSwitch: (contextId: string) => void;
  onContextClose: (contextId: string) => void;
  onAddParticipant: () => void;
  onToggleSidePanel: (type: 'participants' | 'tools' | 'settings') => void;
}

// Enhanced draggable participant chip component
const DraggableParticipantChip: React.FC<{
  participant: any;
  type: 'ai' | 'human';
  isXsScreen: boolean;
}> = ({ participant, type, isXsScreen }) => {
  const isAI = type === 'ai';
  const borderColor = isAI ? participant.color : '#3b82f6';
  
  // Make the chip draggable if it's an AI agent
  const { dragRef, isDragging, dragHandlers } = useAgentDragSource(
    participant.id,
    {
      id: participant.id,
      name: participant.name,
      type: participant.type,
      color: participant.color,
      avatar: participant.avatar,
    },
    !isAI // isHuman
  );

  return (
    <Tooltip
      key={participant.id}
      title={`${participant.name} (${participant.type === 'host' ? 'Host' : 'Guest'} ${isAI ? 'AI' : 'Human'})${isAI ? ' - Drag to interact with messages' : ''}`}
      arrow
    >
      <Box 
        ref={dragRef}
        {...(isAI ? dragHandlers : {})}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          bgcolor: isDragging ? '#475569' : '#334155',
          borderRadius: 1,
          borderLeft: `3px solid ${borderColor}`,
          cursor: isAI ? 'grab' : 'pointer',
          '&:hover': { 
            bgcolor: '#475569',
            transform: isAI ? 'translateY(-1px)' : 'none',
          },
          '&:active': {
            cursor: isAI ? 'grabbing' : 'pointer',
          },
          height: 28,
          minWidth: 'fit-content',
          opacity: isDragging ? 0.7 : 1,
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        {/* Drag indicator for AI agents */}
        {isAI && (
          <DragIndicator sx={{ 
            fontSize: '12px', 
            color: '#64748b',
            opacity: 0.6,
          }} />
        )}
        
        {/* Avatar Circle */}
        <Avatar sx={{
          width: 16,
          height: 16,
          backgroundColor: borderColor,
          fontSize: '8px',
          fontWeight: 'bold'
        }}>
          {participant.avatar ? (
            <img 
              src={participant.avatar} 
              alt={participant.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            participant.name.charAt(0).toUpperCase()
          )}
        </Avatar>
        
        <Typography sx={{ 
          color: 'white', 
          fontSize: '11px', 
          fontWeight: 500,
          maxWidth: isXsScreen ? '40px' : '80px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {participant.name}
        </Typography>
      </Box>
    </Tooltip>
  );
};

const DragDropEnabledChatHeader: React.FC<DragDropEnabledChatHeaderProps> = ({
  hostChatSession,
  user,
  multiChatState,
  onContextSwitch,
  onContextClose,
  onAddParticipant,
  onToggleSidePanel,
}) => {
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Initialize drag & drop actions on component mount
  useEffect(() => {
    initializeDefaultActions();
  }, []);

  // Color palettes (same as original)
  const agentColorPalette = [
    '#ef4444', // red-500
    '#f97316', // orange-500  
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
  ];

  const humanColor = '#64748b'; // slate-500

  // Get participants with colors (same logic as original)
  const getParticipantsWithColors = () => {
    if (!hostChatSession) return { aiParticipants: [], humanParticipants: [] };

    // AI participants
    const aiParticipants: any[] = [];

    // Host agent
    if (hostChatSession.agentId) {
      aiParticipants.push({
        id: hostChatSession.agentId,
        name: hostChatSession.agentName || 'Host Agent',
        type: 'host',
      });
    }

    // Guest agents
    const guestAgents = (hostChatSession.participants?.guests?.filter((g: any) => 
      g.type === 'ai_agent' && g.id !== hostChatSession.agentId
    ) || []).map((agent: any) => ({
      id: agent.id,
      name: agent.agentConfig?.name || agent.identity?.name || agent.name || 'Guest Agent',
      type: 'guest',
    }));

    aiParticipants.push(...guestAgents);

    // Assign colors to AI participants based on order
    const aiParticipantsWithColors = aiParticipants.map((participant, index) => ({
      ...participant,
      color: agentColorPalette[index % agentColorPalette.length],
    }));

    // Human participants (always blue)
    const hostUser = {
      id: hostChatSession.userId,
      name: hostChatSession.hostUserName || hostChatSession.userName || 'Host User',
      type: 'host',
      isOnline: true,
      color: humanColor,
    };

    const guestHumans = (hostChatSession.participants?.guests?.filter((g: any) => 
      g.type === 'human' && g.id !== (user?.uid || 'anonymous')
    ) || []).map((human: any) => ({
      id: human.id,
      name: human.name || 'Guest User',
      type: 'guest',
      isOnline: true,
      color: humanColor,
    }));

    return {
      aiParticipants: aiParticipantsWithColors,
      humanParticipants: [hostUser, ...guestHumans],
    };
  };

  const { aiParticipants, humanParticipants } = getParticipantsWithColors();

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 1,
      bgcolor: '#1e293b',
      borderBottom: '1px solid #334155',
      minHeight: 56,
    }}>
      {/* Left Section - Context Tabs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
        {multiChatState.contexts.map((context) => (
          <Box
            key={context.id}
            onClick={() => onContextSwitch(context.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              bgcolor: context.id === multiChatState.activeContextId ? '#334155' : 'transparent',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#334155' },
              border: context.id === multiChatState.activeContextId ? '1px solid #475569' : '1px solid transparent',
            }}
          >
            <Avatar sx={{ width: 20, height: 20, fontSize: '10px' }}>
              {context.avatar ? (
                <img src={context.avatar} alt={context.name} style={{ width: '100%', height: '100%' }} />
              ) : (
                context.name.charAt(0).toUpperCase()
              )}
            </Avatar>
            
            <Typography sx={{ 
              color: 'white', 
              fontSize: '12px', 
              fontWeight: 500,
              maxWidth: isXsScreen ? '60px' : '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {context.name}
            </Typography>

            {context.unreadCount > 0 && (
              <Badge badgeContent={context.unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '8px', minWidth: '16px', height: '16px' } }} />
            )}

            {context.canClose && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onContextClose(context.id);
                }}
                sx={{ 
                  width: 16, 
                  height: 16, 
                  color: '#94a3b8',
                  '&:hover': { color: 'white', bgcolor: '#475569' }
                }}
              >
                <Close sx={{ fontSize: '12px' }} />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>

      {/* Center Section - Participants */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        px: 2,
        borderLeft: '1px solid #334155',
        borderRight: '1px solid #334155',
        minWidth: 'fit-content'
      }}>
        {/* AI Participants */}
        {aiParticipants.map((participant) => (
          <DraggableParticipantChip
            key={participant.id}
            participant={participant}
            type="ai"
            isXsScreen={isXsScreen}
          />
        ))}

        {/* Human Participants */}
        {(humanParticipants || []).map((participant) => (
          <DraggableParticipantChip
            key={participant.id}
            participant={participant}
            type="human"
            isXsScreen={isXsScreen}
          />
        ))}

        {/* Add Participant Button */}
        <Tooltip title="Add participant" arrow>
          <IconButton
            size="small"
            onClick={onAddParticipant}
            sx={{
              width: 28,
              height: 28,
              bgcolor: '#334155',
              color: '#94a3b8',
              '&:hover': { 
                bgcolor: '#475569',
                color: 'white'
              }
            }}
          >
            <Add sx={{ fontSize: '16px' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Right Section - Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Participants" arrow>
          <IconButton
            size="small"
            onClick={() => onToggleSidePanel('participants')}
            sx={{
              color: multiChatState.sidePanel.isOpen && multiChatState.sidePanel.type === 'participants' 
                ? '#3b82f6' : '#94a3b8',
              '&:hover': { color: 'white' }
            }}
          >
            <Group sx={{ fontSize: '18px' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Tools" arrow>
          <IconButton
            size="small"
            onClick={() => onToggleSidePanel('tools')}
            sx={{
              color: multiChatState.sidePanel.isOpen && multiChatState.sidePanel.type === 'tools' 
                ? '#3b82f6' : '#94a3b8',
              '&:hover': { color: 'white' }
            }}
          >
            <Chat sx={{ fontSize: '18px' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DragDropEnabledChatHeader;

