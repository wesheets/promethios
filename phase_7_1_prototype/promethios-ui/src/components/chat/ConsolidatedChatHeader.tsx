import React, { useMemo } from 'react';
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
} from '@mui/icons-material';

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

  // Get agent color based on name/type
  const getAgentColor = (agentName?: string) => {
    if (!agentName) return '#64748b';
    const lowerName = agentName.toLowerCase();
    if (lowerName.includes('claude')) return '#ff6b35';
    if (lowerName.includes('openai') || lowerName.includes('gpt')) return '#10a37f';
    if (lowerName.includes('gemini') || lowerName.includes('bard')) return '#4285f4';
    if (lowerName.includes('mistral')) return '#f59e0b';
    if (lowerName.includes('llama')) return '#ef4444';
    return '#10b981';
  };

  // Get AI participants
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
        color: getAgentColor(selectedChatbot.identity?.name || selectedChatbot.name),
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
          color: getAgentColor(guest.name),
        });
      });
    }

    return participants;
  };

  // Get human participants for shared conversations
  const getSharedConversationParticipants = () => {
    if (!isInSharedMode || !activeSharedConversation || !loadedHostChatSession) {
      return { aiParticipants: [], humanParticipants: [] };
    }

    const hostChatSession = loadedHostChatSession;
    
    // Host agent
    const hostAgent = hostChatSession.agentId ? {
      id: hostChatSession.agentId,
      name: hostChatSession.agentName || 'Host Agent',
      type: 'host',
      color: getAgentColor(hostChatSession.agentName),
    } : null;

    // Guest agents
    const guestAgents = (hostChatSession.participants?.guests?.filter(g => 
      g.type === 'ai_agent' && g.id !== hostChatSession.agentId
    ) || []).map(agent => ({
      id: agent.id,
      name: agent.agentConfig?.name || agent.identity?.name || agent.name || 'Guest Agent',
      type: 'guest',
      color: getAgentColor(agent.agentConfig?.name || agent.identity?.name || agent.name),
    }));

    // Host user
    const hostUser = {
      id: hostChatSession.userId,
      name: hostChatSession.hostUserName || hostChatSession.userName || 'Host User',
      type: 'host',
      isOnline: true,
    };

    // Guest humans (excluding current user)
    const guestHumans = (hostChatSession.participants?.guests?.filter(g => 
      g.type === 'human' && g.id !== (user?.uid || 'anonymous')
    ) || []).map(human => ({
      id: human.id,
      name: human.name || 'Guest User',
      type: 'guest',
      isOnline: true,
    }));

    return {
      aiParticipants: [hostAgent, ...guestAgents].filter(Boolean),
      humanParticipants: [hostUser, ...guestHumans],
    };
  };

  // Render participant chip
  const renderParticipantChip = (participant: any, type: 'ai' | 'human') => {
    const isAI = type === 'ai';
    const borderColor = isAI ? participant.color : '#3b82f6';
    const icon = isAI ? '🤖' : '👤';
    
    return (
      <Tooltip
        key={participant.id}
        title={`${icon} ${participant.name} (${participant.type === 'host' ? 'Host' : 'Guest'} ${isAI ? 'AI' : 'Human'})`}
        arrow
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          bgcolor: '#334155',
          borderRadius: 1,
          borderLeft: `3px solid ${borderColor}`,
          cursor: 'pointer',
          '&:hover': { bgcolor: '#475569' },
          height: 28,
          minWidth: 'fit-content'
        }}>
          <Box sx={{ fontSize: '12px' }}>{icon}</Box>
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

  // Get chat name
  const getChatName = () => {
    if (isInSharedMode && activeSharedConversation) {
      const sharedConv = sharedConversations.find(c => c.id === activeSharedConversation);
      const hostUser = sharedConv?.participants?.find(p => 
        p.type === 'human' && p.id === sharedConv.createdBy
      );
      const hostName = hostUser?.name || 'Host User';
      const conversationName = sharedConv?.name || 'Shared Chat';
      return `🤝 ${hostName} - ${conversationName}`;
    }
    
    const activeContextName = multiChatState.contexts.find(c => c.isActive)?.name || 'Chat';
    const agentName = selectedChatbot?.identity?.name || selectedChatbot?.name || 'Agent';
    return `${agentName} - ${currentChatName || activeContextName}`;
  };

  // Get participants based on mode
  const { aiParticipants, humanParticipants: displayHumanParticipants } = isInSharedMode 
    ? getSharedConversationParticipants()
    : { aiParticipants: getAIParticipants(), humanParticipants };

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
        {/* Chat Tabs Section */}
        {!isXsScreen && (
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

        {/* Chat Name Section */}
        <Box sx={{ 
          flex: isXsScreen ? 1 : '0 1 auto',
          minWidth: 0
        }}>
          <Typography variant="body2" sx={{ 
            color: 'white', 
            fontWeight: 600, 
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {getChatName()}
          </Typography>
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

