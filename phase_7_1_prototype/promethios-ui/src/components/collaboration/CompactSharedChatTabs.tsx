import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Badge
} from '@mui/material';
import {
  Close,
  MoreHoriz,
  Lock,
  LockOpen,
  Circle
} from '@mui/icons-material';
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

const CompactSharedChatTabs: React.FC<CompactSharedChatTabsProps> = ({
  sharedConversations,
  activeConversationId,
  onConversationSelect,
  onConversationClose,
  onPrivacyToggle,
  currentUserId,
  maxVisibleTabs = 2
}) => {
  const [overflowMenuAnchor, setOverflowMenuAnchor] = useState<null | HTMLElement>(null);

  const visibleConversations = sharedConversations.slice(0, maxVisibleTabs);
  const overflowConversations = sharedConversations.slice(maxVisibleTabs);

  const getParticipantName = (conversation: SharedConversation) => {
    // Find the human participant (not the current user)
    const humanParticipant = conversation.participants.find(p => 
      p.type === 'human' && p.userId !== currentUserId
    );
    return humanParticipant?.displayName || 'Shared Chat';
  };

  const getConversationColor = (conversationId: string) => {
    // Generate consistent colors based on conversation ID
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const hash = conversationId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleOverflowMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOverflowMenuAnchor(event.currentTarget);
  };

  const handleOverflowMenuClose = () => {
    setOverflowMenuAnchor(null);
  };

  const renderConversationTab = (conversation: SharedConversation, isInMenu = false) => {
    const isActive = conversation.id === activeConversationId;
    const participantName = getParticipantName(conversation);
    const color = getConversationColor(conversation.id);
    const isPrivate = conversation.privacyMode?.isPrivateMode || false;
    
    const participantCount = conversation.participants.filter(p => p.type === 'human').length;
    const lastActivity = conversation.lastActivity ? new Date(conversation.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    if (isInMenu) {
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
            bgcolor: isActive ? '#3b82f620' : 'transparent',
            '&:hover': { bgcolor: '#374151' }
          }}
        >
          <Circle sx={{ fontSize: 8, color }} />
          <Typography variant="body2" sx={{ color: '#e2e8f0', flex: 1 }}>
            {participantName}
          </Typography>
          {isPrivate && <Lock sx={{ fontSize: 12, color: '#ef4444' }} />}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onConversationClose(conversation.id);
            }}
            sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
          >
            <Close sx={{ fontSize: 12 }} />
          </IconButton>
        </MenuItem>
      );
    }

    return (
      <Tooltip
        key={conversation.id}
        title={
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Chat with {participantName}
            </Typography>
            <br />
            <Typography variant="caption">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </Typography>
            {lastActivity && (
              <>
                <br />
                <Typography variant="caption">
                  Last activity: {lastActivity}
                </Typography>
              </>
            )}
            <br />
            <Typography variant="caption" sx={{ color: isPrivate ? '#ef4444' : '#10b981' }}>
              {isPrivate ? '🔒 Private Mode' : '👁️ Observable'}
            </Typography>
          </Box>
        }
        placement="bottom"
        arrow
      >
        <Chip
          avatar={
            <Avatar sx={{ bgcolor: color, width: 20, height: 20 }}>
              {participantName.charAt(0)}
            </Avatar>
          }
          label={participantName}
          variant={isActive ? "filled" : "outlined"}
          size="small"
          onClick={() => onConversationSelect(conversation.id)}
          onDelete={() => onConversationClose(conversation.id)}
          sx={{
            maxWidth: 180,
            bgcolor: isActive ? color : 'transparent',
            color: isActive ? 'white' : '#e2e8f0',
            borderColor: color,
            '&:hover': { 
              bgcolor: isActive ? color : `${color}20`,
              borderColor: color
            },
            '& .MuiChip-label': {
              fontSize: '11px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            },
            '& .MuiChip-deleteIcon': {
              color: isActive ? 'white' : '#64748b',
              '&:hover': { color: '#ef4444' }
            },
            mr: 1
          }}
          icon={isPrivate ? <Lock sx={{ fontSize: 12 }} /> : undefined}
        />
      </Tooltip>
    );
  };

  if (sharedConversations.length === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      overflow: 'hidden'
    }}>
      {/* Visible Conversation Tabs */}
      {visibleConversations.map(conversation => renderConversationTab(conversation))}
      
      {/* Overflow Menu */}
      {overflowConversations.length > 0 && (
        <>
          <Tooltip title={`${overflowConversations.length} more shared chats`} placement="bottom" arrow>
            <IconButton
              size="small"
              onClick={handleOverflowMenuOpen}
              sx={{
                color: '#64748b',
                bgcolor: '#334155',
                width: 28,
                height: 28,
                '&:hover': { bgcolor: '#475569', color: '#e2e8f0' }
              }}
            >
              <Badge badgeContent={overflowConversations.length} color="primary" max={9}>
                <MoreHoriz sx={{ fontSize: 14 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={overflowMenuAnchor}
            open={Boolean(overflowMenuAnchor)}
            onClose={handleOverflowMenuClose}
            PaperProps={{
              sx: {
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 1,
                minWidth: 200
              }
            }}
          >
            {overflowConversations.map(conversation => renderConversationTab(conversation, true))}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default CompactSharedChatTabs;

