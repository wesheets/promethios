import React, { useState } from 'react';
import { Box, Chip, Tooltip, IconButton, Menu, MenuItem, Typography, Avatar, Badge } from '@mui/material';
import { MoreHoriz, People, Chat, Close } from '@mui/icons-material';
import { SharedConversation } from './SharedChatTabs';

interface CompactSharedChatTabsProps {
  sharedConversations: SharedConversation[];
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onConversationClose: (conversationId: string) => void;
  onPrivacyToggle: (conversationId: string) => void;
  currentUserId: string;
  maxVisibleTabs?: number;
}

// Color palette for shared chats
const CHAT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];

const CompactSharedChatTabs: React.FC<CompactSharedChatTabsProps> = ({
  sharedConversations,
  activeConversationId,
  onConversationSelect,
  onConversationClose,
  maxVisibleTabs = 2
}) => {
  const [overflowMenuAnchor, setOverflowMenuAnchor] = useState<null | HTMLElement>(null);

  if (sharedConversations.length === 0) {
    return null;
  }

  const visibleConversations = sharedConversations.slice(0, maxVisibleTabs);
  const hiddenConversations = sharedConversations.slice(maxVisibleTabs);

  const getConversationColor = (index: number) => {
    return CHAT_COLORS[index % CHAT_COLORS.length];
  };

  const getHumanName = (conversation: SharedConversation) => {
    // Extract human participant name (excluding current user)
    const humanParticipant = conversation.participants?.find(p => 
      p.type === 'human' && p.id !== conversation.hostUserId
    );
    return humanParticipant?.name || 'Guest';
  };

  const getParticipantCount = (conversation: SharedConversation) => {
    return conversation.participants?.length || 0;
  };

  const getMessageCount = (conversation: SharedConversation) => {
    return conversation.messageCount || 0;
  };

  const renderTooltipContent = (conversation: SharedConversation) => (
    <Box sx={{ p: 1, maxWidth: 300 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {conversation.name || 'Shared Chat'}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <People sx={{ fontSize: 16 }} />
        <Typography variant="body2">
          {getParticipantCount(conversation)} participants
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chat sx={{ fontSize: 16 }} />
        <Typography variant="body2">
          {getMessageCount(conversation)} messages
        </Typography>
      </Box>

      {conversation.participants && conversation.participants.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#9ca3af', mb: 0.5, display: 'block' }}>
            Participants:
          </Typography>
          {conversation.participants.map((participant, index) => (
            <Box key={participant.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Avatar sx={{ width: 16, height: 16, fontSize: '0.7rem' }}>
                {participant.name.charAt(0)}
              </Avatar>
              <Typography variant="caption">
                {participant.name} {participant.type === 'ai' ? '(AI)' : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  const handleOverflowMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOverflowMenuAnchor(event.currentTarget);
  };

  const handleOverflowMenuClose = () => {
    setOverflowMenuAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
      {visibleConversations.map((conversation, index) => {
        const color = getConversationColor(index);
        const humanName = getHumanName(conversation);
        const isActive = conversation.id === activeConversationId;
        
        return (
          <Tooltip
            key={conversation.id}
            title={renderTooltipContent(conversation)}
            placement="bottom"
            arrow
          >
            <Chip
              avatar={
                <Badge
                  badgeContent={getParticipantCount(conversation)}
                  color="secondary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      height: 14,
                      minWidth: 14,
                      backgroundColor: '#374151',
                      color: 'white'
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      bgcolor: color,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    {humanName.charAt(0)}
                  </Avatar>
                </Badge>
              }
              label={humanName}
              size="small"
              onClick={() => onConversationSelect(conversation.id)}
              onDelete={() => onConversationClose(conversation.id)}
              deleteIcon={<Close sx={{ fontSize: 14 }} />}
              sx={{
                maxWidth: 120,
                bgcolor: isActive ? color : 'transparent',
                color: isActive ? 'white' : '#e2e8f0',
                borderColor: color,
                border: `1px solid ${color}`,
                '&:hover': {
                  bgcolor: isActive ? color : `${color}20`,
                },
                '& .MuiChip-deleteIcon': {
                  color: isActive ? 'white' : '#9ca3af',
                  '&:hover': {
                    color: isActive ? '#f3f4f6' : '#e5e7eb'
                  }
                }
              }}
            />
          </Tooltip>
        );
      })}

      {/* Overflow menu for hidden conversations */}
      {hiddenConversations.length > 0 && (
        <>
          <IconButton
            size="small"
            onClick={handleOverflowMenuOpen}
            sx={{
              color: '#64748b',
              bgcolor: '#334155',
              width: 28,
              height: 28,
              '&:hover': { bgcolor: '#475569' }
            }}
          >
            <MoreHoriz sx={{ fontSize: 16 }} />
          </IconButton>
          
          <Menu
            anchorEl={overflowMenuAnchor}
            open={Boolean(overflowMenuAnchor)}
            onClose={handleOverflowMenuClose}
            PaperProps={{
              sx: {
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                '& .MuiMenuItem-root': {
                  color: '#e2e8f0',
                  '&:hover': { bgcolor: '#334155' }
                }
              }
            }}
          >
            {hiddenConversations.map((conversation, index) => {
              const color = getConversationColor(maxVisibleTabs + index);
              const humanName = getHumanName(conversation);
              
              return (
                <MenuItem
                  key={conversation.id}
                  onClick={() => {
                    onConversationSelect(conversation.id);
                    handleOverflowMenuClose();
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 200
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      bgcolor: color,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    {humanName.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {humanName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {getParticipantCount(conversation)} participants • {getMessageCount(conversation)} messages
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConversationClose(conversation.id);
                    }}
                    sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' } }}
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default CompactSharedChatTabs;

