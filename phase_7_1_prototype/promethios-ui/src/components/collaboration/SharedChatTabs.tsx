/**
 * SharedChatTabs - Revolutionary shared conversation tab system
 * Displays shared human-AI conversations as tabs at the top of any command center
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Typography,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

export interface SharedConversation {
  id: string;
  name: string;
  participants: {
    id: string;
    name: string;
    type: 'human' | 'ai_agent';
    avatar?: string;
    isOnline?: boolean;
  }[];
  lastActivity: Date;
  unreadCount: number;
  isPrivateMode: boolean; // AI observation toggled off
  createdBy: string;
  hasHistory: boolean;
}

export interface SharedChatTabsProps {
  sharedConversations: SharedConversation[];
  activeConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onConversationClose: (conversationId: string) => void;
  onPrivacyToggle: (conversationId: string, isPrivate: boolean) => void;
  currentUserId: string;
}

export const SharedChatTabs: React.FC<SharedChatTabsProps> = ({
  sharedConversations,
  activeConversationId,
  onConversationSelect,
  onConversationClose,
  onPrivacyToggle,
  currentUserId
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Get participant summary for display
  const getParticipantSummary = (conversation: SharedConversation) => {
    const humans = conversation.participants.filter(p => p.type === 'human');
    const aiAgents = conversation.participants.filter(p => p.type === 'ai_agent');
    
    return {
      humanCount: humans.length,
      aiCount: aiAgents.length,
      otherHumans: humans.filter(h => h.id !== currentUserId)
    };
  };

  // Format last activity time
  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    onConversationSelect(newValue);
  };

  if (sharedConversations.length === 0) {
    return null; // No shared conversations to display
  }

  return (
    <Box sx={{
      borderBottom: '1px solid #334155',
      bgcolor: '#0f172a',
      px: 2,
      py: 1
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <GroupIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
          Shared Conversations
        </Typography>
      </Box>

      <Tabs
        value={activeConversationId || false}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 'auto',
          '& .MuiTabs-indicator': {
            backgroundColor: '#3b82f6',
            height: 2
          },
          '& .MuiTab-root': {
            minHeight: 'auto',
            py: 1,
            px: 2,
            textTransform: 'none',
            color: '#94a3b8',
            '&.Mui-selected': {
              color: '#3b82f6'
            }
          }
        }}
      >
        {sharedConversations.map((conversation) => {
          const summary = getParticipantSummary(conversation);
          const isHovered = hoveredTab === conversation.id;
          
          return (
            <Tab
              key={conversation.id}
              value={conversation.id}
              onMouseEnter={() => setHoveredTab(conversation.id)}
              onMouseLeave={() => setHoveredTab(null)}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  {/* Conversation Name */}
                  <Typography variant="body2" sx={{ 
                    fontWeight: 500,
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conversation.name}
                  </Typography>

                  {/* Participant Avatars */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {summary.otherHumans.slice(0, 2).map((human) => (
                      <Badge
                        key={human.id}
                        badgeContent=""
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: human.isOnline ? '#10b981' : '#6b7280',
                            width: 6,
                            height: 6
                          }
                        }}
                      >
                        <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>
                          {human.avatar || human.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    ))}
                    
                    {summary.aiCount > 0 && (
                      <Chip
                        icon={<AIIcon sx={{ fontSize: 10 }} />}
                        label={summary.aiCount}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: '#8b5cf6',
                          color: 'white',
                          '& .MuiChip-icon': { ml: 0.5 }
                        }}
                      />
                    )}
                  </Box>

                  {/* Privacy Mode Indicator */}
                  {conversation.isPrivateMode && (
                    <Tooltip title="AI observation disabled">
                      <VisibilityOffIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                    </Tooltip>
                  )}

                  {/* Unread Count */}
                  {conversation.unreadCount > 0 && (
                    <Badge
                      badgeContent={conversation.unreadCount}
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontSize: '0.6rem',
                          minWidth: 16,
                          height: 16
                        }
                      }}
                    />
                  )}

                  {/* Last Activity */}
                  <Typography variant="caption" sx={{ 
                    color: '#6b7280',
                    fontSize: '0.6rem',
                    ml: 0.5
                  }}>
                    {formatLastActivity(conversation.lastActivity)}
                  </Typography>

                  {/* Close Button (on hover) */}
                  {isHovered && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConversationClose(conversation.id);
                      }}
                      sx={{
                        width: 16,
                        height: 16,
                        ml: 0.5,
                        color: '#6b7280',
                        '&:hover': { color: '#ef4444' }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  )}

                  {/* Privacy Toggle (on hover) */}
                  {isHovered && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrivacyToggle(conversation.id, !conversation.isPrivateMode);
                      }}
                      sx={{
                        width: 16,
                        height: 16,
                        ml: 0.5,
                        color: conversation.isPrivateMode ? '#f59e0b' : '#6b7280',
                        '&:hover': { color: conversation.isPrivateMode ? '#f59e0b' : '#3b82f6' }
                      }}
                    >
                      {conversation.isPrivateMode ? 
                        <VisibilityOffIcon sx={{ fontSize: 12 }} /> : 
                        <VisibilityIcon sx={{ fontSize: 12 }} />
                      }
                    </IconButton>
                  )}
                </Box>
              }
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default SharedChatTabs;

