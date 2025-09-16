import React, { useState, useEffect, useMemo } from 'react';
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

// Types
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
  };
}

interface ChatbotProfile {
  id: string;
  identity?: {
    id: string;
    name: string;
    avatar?: string;
  };
  name?: string;
}

interface SharedConversation {
  id: string;
  name: string;
  participants?: Array<{
    id: string;
    name: string;
    type: 'human' | 'ai_agent';
  }>;
  createdBy: string;
}

interface ConsolidatedChatHeaderProps {
  // Chat context
  multiChatState: MultiChatState;
  selectedChatbot: ChatbotProfile | null;
  currentChatName: string;
  
  // Participants
  humanParticipants: HumanParticipant[];
  
  // Shared conversation
  isInSharedMode: boolean;
  activeSharedConversation: string | null;
  sharedConversations: SharedConversation[];
  loadedHostChatSession?: any;
  
  // Event handlers
  onSwitchChatContext: (contextId: string) => void;
  onRemoveChatContext: (contextId: string) => void;
  onAddParticipant: () => void;
  onToggleSidePanel: () => void;
  
  // UI state
  maxVisibleParticipants?: number;
  user?: any;
}

const ConsolidatedChatHeader: React.FC<ConsolidatedChatHeaderProps> = ({
  multiChatState,
  selectedChatbot,
  currentChatName,
  humanParticipants,
  isInSharedMode,
  activeSharedConversation,
  sharedConversations,
  loadedHostChatSession,
  onSwitchChatContext,
  onRemoveChatContext,
  onAddParticipant,
  onToggleSidePanel,
  maxVisibleParticipants = 3,
  user,
}) => {
  const theme = useTheme();
  const isSmScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Responsive max visible participants
  const maxVisible = useMemo(() => {
    if (isXsScreen) return 1;
    if (isSmScreen) return 2;
    return maxVisibleParticipants;
  }, [isXsScreen, isSmScreen, maxVisibleParticipants]);

  // Sequential color assignment for agents (humans are always blue)
  const agentColorPalette = [
    '#f97316', // Orange
    '#8b5cf6', // Purple  
    '#10b981', // Green
    '#ec4899', // Pink
    '#eab308', // Yellow
    '#06b6d4', // Cyan
    '#ef4444', // Red
    '#84cc16', // Lime
  ];

  const humanColor = '#3b82f6'; // Blue for all humans

  // Get color for participant based on entry order
  const getParticipantColor = (participant: any, allParticipants: any[], type: 'ai' | 'human') => {
    if (type === 'human') {
      return humanColor;
    }
    
    // For AI agents, assign colors sequentially based on their position in the participants list
    const agentIndex = allParticipants.findIndex(p => p.id === participant.id);
    return agentColorPalette[agentIndex % agentColorPalette.length];
  };

  // Get AI participants (including host agent)
  const getAIParticipants = () => {
    const activeContext = multiChatState.contexts.find(c => c.isActive);
    const participants = [];

    // Add host agent
    if (selectedChatbot) {
      participants.push({
        id: selectedChatbot.identity?.id || selectedChatbot.id,
        name: selectedChatbot.identity?.name || selectedChatbot.name || 'Host Agent',
        avatar: selectedChatbot.identity?.avatar,
        type: 'host',
      });
    }

    // Add guest agents
    if (activeContext?.guestAgents) {
      activeContext.guestAgents.forEach(guest => {
        participants.push({
          id: guest.agentId,
          name: guest.name,
          avatar: guest.avatar,
          type: 'guest',
        });
      });
    }

    // Assign colors based on order
    return participants.map((participant, index) => ({
      ...participant,
      color: agentColorPalette[index % agentColorPalette.length],
    }));
  };

  // Get human participants for shared conversations
  const getSharedConversationParticipants = () => {
    if (!isInSharedMode || !activeSharedConversation || !loadedHostChatSession) {
      return { aiParticipants: [], humanParticipants: [] };
    }

    const hostChatSession = loadedHostChatSession;
    
    // Collect all AI participants first
    const aiParticipants = [];
    
    // Host agent
    if (hostChatSession.agentId) {
      aiParticipants.push({
        id: hostChatSession.agentId,
        name: hostChatSession.agentName || 'Host Agent',
        type: 'host',
      });
    }

    // Guest agents
    const guestAgents = (hostChatSession.participants?.guests?.filter(g => 
      g.type === 'ai_agent' && g.id !== hostChatSession.agentId
    ) || []).map(agent => ({
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

    const guestHumans = (hostChatSession.participants?.guests?.filter(g => 
      g.type === 'human' && g.id !== (user?.uid || 'anonymous')
    ) || []).map(human => ({
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

  // Draggable Agent Chip Component
  const DraggableAgentChip: React.FC<{
    participant: any;
    type: 'ai' | 'human';
  }> = ({ participant, type }) => {
    const isAI = type === 'ai';
    const borderColor = isAI ? participant.color : '#3b82f6';
    
    // Make AI agents draggable
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
        title={
          <Box>
            <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {participant.name} ({participant.type === 'host' ? 'Host' : 'Guest'} {isAI ? 'AI' : 'Human'})
            </Box>
            {isAI && (
              <Box sx={{ fontSize: '12px', color: '#94a3b8' }}>
                💡 Drag onto messages to interact
              </Box>
            )}
          </Box>
        }
        arrow
      >
        <Box 
          ref={isAI ? dragRef : undefined}
          {...(isAI ? dragHandlers : {})}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            bgcolor: '#334155',
            borderRadius: 1,
            borderLeft: `3px solid ${borderColor}`,
            cursor: isAI ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
            opacity: isDragging ? 0.7 : 1,
            transform: isDragging ? 'rotate(5deg)' : 'none',
            '&:hover': { 
              bgcolor: '#475569',
              transform: isDragging ? 'rotate(5deg)' : 'scale(1.05)',
            },
            height: 28,
            minWidth: 'fit-content',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {/* Drag Indicator for AI agents */}
          {isAI && (
            <DragIndicator sx={{ 
              fontSize: 10, 
              color: '#64748b', 
              position: 'absolute',
              top: 2,
              right: 2,
              opacity: 0.6
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
            {participant.name.split(' ')[0]}
          </Typography>
          {!isAI && participant.isOnline !== undefined && (
            <Box sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: participant.isOnline ? '#10b981' : '#6b7280',
              ml: 0.5
            }} />
          )}
        </Box>
      </Tooltip>
    );
  };

  // Render participant chip (now uses DraggableAgentChip)
  const renderParticipantChip = (participant: any, type: 'ai' | 'human') => {
    return <DraggableAgentChip participant={participant} type={type} />;
  };

  // Render overflow indicator
  const renderOverflowIndicator = (count: number, type: 'AI' | 'human', hiddenParticipants: any[]) => (
    <Tooltip
      title={
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>+ {count} more {type}s:</Typography>
          {hiddenParticipants.map(participant => (
            <Typography key={participant.id} sx={{ fontSize: '12px' }}>
              {type === 'AI' ? '🤖' : '👤'} {participant.name}
            </Typography>
          ))}
        </Box>
      }
      arrow
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        bgcolor: '#374151',
        borderRadius: 1,
        borderLeft: '3px solid #6b7280',
        cursor: 'pointer',
        '&:hover': { bgcolor: '#4b5563' },
        height: 28
      }}>
        <Typography sx={{ 
          color: '#9ca3af', 
          fontSize: '10px', 
          fontWeight: 500
        }}>
          +{count} {type}s
        </Typography>
      </Box>
    </Tooltip>
  );

  // Get agent name
  const getAgentName = () => {
    if (isInSharedMode && activeSharedConversation) {
      const sharedConv = sharedConversations.find(c => c.id === activeSharedConversation);
      const hostUser = sharedConv?.participants?.find(p => 
        p.type === 'human' && p.id === sharedConv.createdBy
      );
      const hostName = hostUser?.name || 'Host User';
      const conversationName = sharedConv?.name || 'Shared Chat';
      return `🤝 ${hostName} - ${conversationName}`;
    }
    
    return selectedChatbot?.identity?.name || selectedChatbot?.name || 'Agent';
  };

  // Get chat name (separate from agent name)
  const getChatName = () => {
    if (isInSharedMode && activeSharedConversation) {
      return null; // Chat name is included in agent name for shared mode
    }
    
    return currentChatName || null; // Return null if no chat name assigned yet
  };

  // Get participants based on mode
  const { aiParticipants, humanParticipants: displayHumanParticipants } = isInSharedMode 
    ? getSharedConversationParticipants()
    : { 
        aiParticipants: getAIParticipants(), 
        humanParticipants: (humanParticipants || []).map(human => ({
          ...human,
          color: humanColor
        }))
      };

  // Split visible and hidden participants
  const visibleAI = aiParticipants.slice(0, maxVisible);
  const hiddenAI = aiParticipants.slice(maxVisible);
  const visibleHumans = displayHumanParticipants.slice(0, maxVisible);
  const hiddenHumans = displayHumanParticipants.slice(maxVisible);

  return (
    <Box sx={{ 
      borderBottom: '1px solid #334155',
      bgcolor: '#1e293b'
    }}>
      {/* Main Header Row */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: 3, 
        py: 1.5,
        gap: 2,
        minHeight: 56
      }}>
        {/* Chat Tabs Section - Only show for multi-context scenarios */}
        {!isXsScreen && multiChatState.contexts.length > 1 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
            flex: '0 1 auto'
          }}>
            {multiChatState.contexts.map((context) => (
              <Box
                key={context.id}
                onClick={() => onSwitchChatContext(context.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.5,
                  bgcolor: context.isActive ? '#3b82f6' : '#334155',
                  color: context.isActive ? 'white' : '#94a3b8',
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: context.isActive ? '#2563eb' : '#475569'
                  },
                  minWidth: 'fit-content'
                }}
              >
                {context.avatar && (
                  <Avatar 
                    src={context.avatar} 
                    sx={{ width: 16, height: 16, mr: 0.5 }}
                  />
                )}
                <Typography variant="body2" sx={{ 
                  fontWeight: 500, 
                  whiteSpace: 'nowrap',
                  fontSize: '12px'
                }}>
                  {context.name}
                </Typography>
                {context.unreadCount > 0 && (
                  <Badge 
                    badgeContent={context.unreadCount} 
                    color="error" 
                    sx={{ ml: 0.5 }}
                  />
                )}
                {context.canClose && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveChatContext(context.id);
                    }}
                    sx={{ 
                      ml: 0.5, 
                      p: 0.25, 
                      color: 'inherit',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Agent Name and Chat Name Section */}
        <Box sx={{ 
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5
        }}>
          {/* Host Agent Avatar */}
          <Avatar sx={{
            width: 32,
            height: 32,
            backgroundColor: aiParticipants.length > 0 ? aiParticipants[0].color : '#f97316',
            fontSize: '14px',
            fontWeight: 'bold',
            flexShrink: 0,
            mt: 0.25 // Slight offset to align with text
          }}>
            {selectedChatbot?.identity?.avatar ? (
              <img 
                src={selectedChatbot.identity.avatar} 
                alt={getAgentName()} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              getAgentName().charAt(0).toUpperCase()
            )}
          </Avatar>
          
          {/* Agent Name and Chat Name */}
          <Box sx={{ 
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}>
            {/* Agent Name */}
            <Typography variant="body1" sx={{ 
              color: 'white', 
              fontWeight: 600, 
              fontSize: '16px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {getAgentName()}
            </Typography>
            
            {/* Chat Name (if exists) */}
            {getChatName() && (
              <Typography variant="body2" sx={{ 
                color: '#94a3b8', 
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                "{getChatName()}"
              </Typography>
            )}
          </Box>
        </Box>

        {/* AI Participants Section */}
        {aiParticipants.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            flex: '0 0 auto'
          }}>
            {visibleAI.map(participant => renderParticipantChip(participant, 'ai'))}
            {hiddenAI.length > 0 && renderOverflowIndicator(hiddenAI.length, 'AI', hiddenAI)}
          </Box>
        )}

        {/* Separator */}
        {aiParticipants.length > 0 && displayHumanParticipants.length > 0 && (
          <Box sx={{ width: 1, height: 16, bgcolor: '#64748b' }} />
        )}

        {/* Human Participants Section */}
        {displayHumanParticipants.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            flex: '0 0 auto'
          }}>
            {visibleHumans.map(participant => renderParticipantChip(participant, 'human'))}
            {hiddenHumans.length > 0 && renderOverflowIndicator(hiddenHumans.length, 'human', hiddenHumans)}
          </Box>
        )}

        {/* Actions Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flex: '0 0 auto'
        }}>
          <Tooltip title="Add participant" arrow>
            <IconButton
              size="small"
              onClick={onAddParticipant}
              sx={{ 
                color: '#64748b',
                bgcolor: '#334155',
                '&:hover': { bgcolor: '#475569', color: 'white' }
              }}
            >
              <Add sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Panel Toggle */}
        <IconButton
          onClick={onToggleSidePanel}
          sx={{
            color: '#64748b',
            bgcolor: multiChatState.sidePanel.isOpen ? '#3b82f6' : '#334155',
            '&:hover': { 
              bgcolor: multiChatState.sidePanel.isOpen ? '#2563eb' : '#475569',
              color: 'white'
            }
          }}
        >
          <Group />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ConsolidatedChatHeader;

