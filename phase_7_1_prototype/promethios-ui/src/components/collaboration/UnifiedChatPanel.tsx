/**
 * UnifiedChatPanel - Unified chat interface with All/Recent/Shared tabs
 * Replaces separate shared chat tabs with integrated chat history approach
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Badge,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  Group as GroupIcon,
  Home as HostIcon,
  PersonAdd as GuestIcon,
  Add as AddIcon,
  Star as StarIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

export interface ChatItem {
  id: string;
  name: string;
  type: 'solo' | 'shared';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  participants: Array<{
    id: string;
    name: string;
    type: 'human' | 'ai';
    avatar?: string;
  }>;
  isPrivateMode?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isHost?: boolean; // True if user is the host/initiator of this chat
}

export interface UnifiedChatPanelProps {
  chats: ChatItem[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatAction: (chatId: string, action: 'pin' | 'archive' | 'delete' | 'settings') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const UnifiedChatPanel: React.FC<UnifiedChatPanelProps> = ({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
  onChatAction,
  searchQuery,
  onSearchChange
}) => {
  const [activeTab, setActiveTab] = useState(0); // 0: Host Chats, 1: Guest Chats
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; chatId: string } | null>(null);

  // Filter chats based on active tab
  const getFilteredChats = (): ChatItem[] => {
    let filtered = [...chats];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 0: // Host Chats - conversations initiated by the user
        return filtered.filter(chat => 
          chat.type === 'solo' || // 1:1 chats with AI agents
          (chat.type === 'shared' && chat.isHost) // Multi-participant chats hosted by user
        ).filter(chat => !chat.isArchived);
      
      case 1: // Guest Chats - conversations user was invited to
        return filtered.filter(chat => 
          chat.type === 'shared' && !chat.isHost // Shared chats where user is a guest
        ).filter(chat => !chat.isArchived);
      
      default:
        return filtered;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleChatMenu = (event: React.MouseEvent<HTMLElement>, chatId: string) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, chatId });
  };

  const handleMenuAction = (action: 'pin' | 'archive' | 'delete' | 'settings') => {
    if (menuAnchor) {
      onChatAction(menuAnchor.chatId, action);
      setMenuAnchor(null);
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getParticipantAvatars = (participants: ChatItem['participants']) => {
    const maxVisible = 3;
    const visible = participants.slice(0, maxVisible);
    const remaining = participants.length - maxVisible;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {visible.map((participant, index) => (
          <Avatar
            key={participant.id}
            sx={{
              width: 24,
              height: 24,
              bgcolor: participant.type === 'ai' ? '#8b5cf6' : '#3b82f6',
              fontSize: '0.7rem',
              ml: index > 0 ? -0.5 : 0,
              border: '1px solid #1e293b',
              zIndex: maxVisible - index
            }}
          >
            {participant.type === 'ai' ? (
              <AIIcon sx={{ fontSize: 12 }} />
            ) : (
              <PersonIcon sx={{ fontSize: 12 }} />
            )}
          </Avatar>
        ))}
        {remaining > 0 && (
          <Typography variant="caption" sx={{ color: '#94a3b8', ml: 0.5 }}>
            +{remaining}
          </Typography>
        )}
      </Box>
    );
  };

  const filteredChats = getFilteredChats();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Chat History
          </Typography>
          <Tooltip title="New Chat">
            <IconButton
              onClick={onNewChat}
              sx={{
                bgcolor: '#3b82f6',
                color: 'white',
                '&:hover': { bgcolor: '#2563eb' },
                width: 36,
                height: 36
              }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1e293b',
              color: 'white',
              '& fieldset': { borderColor: '#475569' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
            }
          }}
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#3b82f6' }
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HostIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">Host Chats</Typography>
                <Chip
                  label={chats.filter(c => 
                    (c.type === 'solo' || (c.type === 'shared' && c.isHost)) && !c.isArchived
                  ).length}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#94a3b8', height: 20 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GuestIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">Guest Chats</Typography>
                <Chip
                  label={chats.filter(c => c.type === 'shared' && !c.isHost && !c.isArchived).length}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#94a3b8', height: 20 }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredChats.length > 0 ? (
          <List sx={{ py: 0 }}>
            {filteredChats.map((chat) => (
              <ListItem
                key={chat.id}
                button
                selected={activeChat === chat.id}
                onClick={() => onChatSelect(chat.id)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px solid #1e293b',
                  '&.Mui-selected': {
                    bgcolor: '#3b82f620',
                    borderLeft: '3px solid #3b82f6'
                  },
                  '&:hover': {
                    bgcolor: '#1e293b'
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={chat.unreadCount}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        height: 16,
                        minWidth: 16
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: chat.type === 'shared' ? '#8b5cf6' : '#3b82f6',
                        width: 40,
                        height: 40
                      }}
                    >
                      {chat.type === 'shared' ? (
                        <GroupIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <AIIcon sx={{ fontSize: 20 }} />
                      )}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'white',
                          fontWeight: chat.unreadCount > 0 ? 600 : 400,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {chat.name}
                      </Typography>
                      {chat.isPinned && (
                        <StarIcon sx={{ color: '#f59e0b', fontSize: 14 }} />
                      )}
                      {chat.isPrivateMode && (
                        <Chip
                          label="Private"
                          size="small"
                          sx={{
                            bgcolor: '#ef444420',
                            color: '#ef4444',
                            height: 18,
                            fontSize: '0.6rem'
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#94a3b8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        {chat.lastMessage}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {getParticipantAvatars(chat.participants)}
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {formatTime(chat.lastMessageTime)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleChatMenu(e, chat.id)}
                    sx={{ color: '#94a3b8' }}
                  >
                    <MoreIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </Typography>
            {!searchQuery && (
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Start a new conversation or join a shared chat
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
            border: '1px solid #334155',
            borderRadius: 1
          }
        }}
      >
        <MenuItem onClick={() => handleMenuAction('pin')}>
          <StarIcon sx={{ mr: 1, fontSize: 16 }} />
          Pin Chat
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('settings')}>
          <SettingsIcon sx={{ mr: 1, fontSize: 16 }} />
          Settings
        </MenuItem>
        <Divider sx={{ bgcolor: '#334155' }} />
        <MenuItem onClick={() => handleMenuAction('archive')}>
          <ArchiveIcon sx={{ mr: 1, fontSize: 16 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: '#ef4444' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UnifiedChatPanel;

