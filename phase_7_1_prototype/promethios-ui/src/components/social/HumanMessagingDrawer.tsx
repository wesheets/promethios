/**
 * Human Messaging Drawer Component
 * 
 * A Slack-style messaging interface that replaces the message icon functionality
 * in the left navigation. Supports channels, direct messages, and agent drop zones.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  Badge,
  Tabs,
  Tab,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Collapse,
  Card,
  CardContent,
  Fab,
} from '@mui/material';
import {
  Close,
  Send,
  MoreVert,
  AttachFile,
  EmojiEmotions,
  Add,
  Search,
  Info,
  Call,
  VideoCall,
  Tag as ChannelIcon,
  Person as DirectMessageIcon,
  Group as GroupIcon,
  ExpandLess,
  ExpandMore,
  SmartToy as AgentIcon,
  DragIndicator,
  Public,
  Lock,
  Notifications,
  NotificationsOff,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useDrop } from 'react-dnd';
import ColorCodedChatMessage from '../chat/ColorCodedChatMessage';

const DRAWER_WIDTH = 400;

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  memberCount: number;
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender: string;
  };
}

interface DirectMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
  };
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'text' | 'agent_drop' | 'system';
  agentId?: string;
  agentName?: string;
  threadId?: string;
  reactions?: { emoji: string; users: string[] }[];
}

interface HumanMessagingDrawerProps {
  open: boolean;
  onClose: () => void;
  onAgentDrop?: (agentId: string, messageId: string) => void;
}

const HumanMessagingDrawer: React.FC<HumanMessagingDrawerProps> = ({
  open,
  onClose,
  onAgentDrop,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - will be replaced with real data from Firebase
  const [channels] = useState<Channel[]>([
    {
      id: 'general',
      name: 'general',
      description: 'General discussion',
      type: 'public',
      memberCount: 15,
      unreadCount: 3,
      lastMessage: {
        content: 'Welcome to the team!',
        timestamp: new Date(),
        sender: 'John Doe'
      }
    },
    {
      id: 'ai-agents',
      name: 'ai-agents',
      description: 'AI agent collaboration',
      type: 'public',
      memberCount: 8,
      unreadCount: 0,
      lastMessage: {
        content: 'New agent deployed successfully',
        timestamp: new Date(Date.now() - 3600000),
        sender: 'Alice Smith'
      }
    },
    {
      id: 'private-team',
      name: 'private-team',
      description: 'Private team discussions',
      type: 'private',
      memberCount: 5,
      unreadCount: 1,
    }
  ]);

  const [directMessages] = useState<DirectMessage[]>([
    {
      id: 'dm-1',
      userId: 'user-1',
      userName: 'John Doe',
      userAvatar: '/avatars/john.jpg',
      isOnline: true,
      unreadCount: 2,
      lastMessage: {
        content: 'Hey, can you review this?',
        timestamp: new Date(Date.now() - 1800000),
      }
    },
    {
      id: 'dm-2',
      userId: 'user-2',
      userName: 'Alice Smith',
      userAvatar: '/avatars/alice.jpg',
      isOnline: false,
      unreadCount: 0,
      lastMessage: {
        content: 'Thanks for the help!',
        timestamp: new Date(Date.now() - 7200000),
      }
    }
  ]);

  // Mock messages for selected conversation
  useEffect(() => {
    if (selectedChannel || selectedDM) {
      // Mock messages - will be replaced with real Firebase data
      setMessages([
        {
          id: 'msg-1',
          content: 'Hello everyone! Welcome to our messaging system.',
          timestamp: new Date(Date.now() - 3600000),
          senderId: 'user-1',
          senderName: 'John Doe',
          senderAvatar: '/avatars/john.jpg',
          type: 'text'
        },
        {
          id: 'msg-2',
          content: 'This looks great! Can we add an AI agent to help with analysis?',
          timestamp: new Date(Date.now() - 1800000),
          senderId: 'user-2',
          senderName: 'Alice Smith',
          senderAvatar: '/avatars/alice.jpg',
          type: 'text'
        },
        {
          id: 'msg-3',
          content: 'AI Agent "Data Analyst" has been added to this conversation.',
          timestamp: new Date(Date.now() - 900000),
          senderId: 'system',
          senderName: 'System',
          type: 'agent_drop',
          agentId: 'agent-1',
          agentName: 'Data Analyst'
        }
      ]);
    }
  }, [selectedChannel, selectedDM]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      timestamp: new Date(),
      senderId: currentUser?.uid || 'current-user',
      senderName: currentUser?.displayName || 'You',
      senderAvatar: currentUser?.photoURL,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderSidebar = () => (
    <Box sx={{ width: 280, borderRight: '1px solid #334155', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          Messages
        </Typography>
        <TextField
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#64748b' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#334155',
              color: 'white',
              '& fieldset': { borderColor: '#475569' },
              '&:hover fieldset': { borderColor: '#64748b' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          borderBottom: '1px solid #334155',
          '& .MuiTab-root': { color: '#94a3b8' },
          '& .Mui-selected': { color: '#3b82f6' },
        }}
      >
        <Tab label="Channels" />
        <Tab label="Direct" />
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <Box>
            {/* Channels Section */}
            <ListItemButton onClick={() => setChannelsExpanded(!channelsExpanded)}>
              <ChannelIcon sx={{ mr: 1, color: '#94a3b8' }} />
              <ListItemText primary="Channels" sx={{ color: '#94a3b8' }} />
              {channelsExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={channelsExpanded}>
              <List dense>
                {channels.map((channel) => (
                  <ListItemButton
                    key={channel.id}
                    selected={selectedChannel === channel.id}
                    onClick={() => {
                      setSelectedChannel(channel.id);
                      setSelectedDM(null);
                    }}
                    sx={{
                      pl: 4,
                      '&.Mui-selected': { backgroundColor: '#334155' },
                      '&:hover': { backgroundColor: '#374151' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {channel.type === 'public' ? (
                        <Public sx={{ mr: 1, fontSize: 16, color: '#94a3b8' }} />
                      ) : (
                        <Lock sx={{ mr: 1, fontSize: 16, color: '#94a3b8' }} />
                      )}
                      <Typography variant="body2" sx={{ color: 'white', flex: 1 }}>
                        {channel.name}
                      </Typography>
                      {channel.unreadCount > 0 && (
                        <Badge
                          badgeContent={channel.unreadCount}
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Direct Messages Section */}
            <ListItemButton onClick={() => setDmsExpanded(!dmsExpanded)}>
              <DirectMessageIcon sx={{ mr: 1, color: '#94a3b8' }} />
              <ListItemText primary="Direct Messages" sx={{ color: '#94a3b8' }} />
              {dmsExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={dmsExpanded}>
              <List dense>
                {directMessages.map((dm) => (
                  <ListItemButton
                    key={dm.id}
                    selected={selectedDM === dm.id}
                    onClick={() => {
                      setSelectedDM(dm.id);
                      setSelectedChannel(null);
                    }}
                    sx={{
                      pl: 4,
                      '&.Mui-selected': { backgroundColor: '#334155' },
                      '&:hover': { backgroundColor: '#374151' },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: dm.isOnline ? '#10b981' : '#6b7280',
                            color: dm.isOnline ? '#10b981' : '#6b7280',
                          },
                        }}
                      >
                        <Avatar
                          src={dm.userAvatar}
                          sx={{ width: 32, height: 32 }}
                        >
                          {dm.userName.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={dm.userName}
                      secondary={dm.lastMessage?.content}
                      sx={{
                        '& .MuiListItemText-primary': { color: 'white', fontSize: '14px' },
                        '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '12px' },
                      }}
                    />
                    {dm.unreadCount > 0 && (
                      <Badge
                        badgeContent={dm.unreadCount}
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        )}
      </Box>

      {/* Add Channel/DM Button */}
      <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
        <Button
          fullWidth
          startIcon={<Add />}
          variant="outlined"
          sx={{
            color: '#94a3b8',
            borderColor: '#475569',
            '&:hover': { borderColor: '#64748b', backgroundColor: '#374151' },
          }}
        >
          {activeTab === 0 ? 'Add Channel' : 'New Message'}
        </Button>
      </Box>
    </Box>
  );

  const renderMessageArea = () => {
    if (!selectedChannel && !selectedDM) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
          }}
        >
          <Typography variant="h6">Select a conversation to start messaging</Typography>
        </Box>
      );
    }

    const conversationName = selectedChannel 
      ? channels.find(c => c.id === selectedChannel)?.name 
      : directMessages.find(dm => dm.id === selectedDM)?.userName;

    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Message Area Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
            {selectedChannel ? '#' : ''}{conversationName}
          </Typography>
          <IconButton sx={{ color: '#94a3b8' }}>
            <Info />
          </IconButton>
          <IconButton sx={{ color: '#94a3b8' }}>
            <Call />
          </IconButton>
          <IconButton sx={{ color: '#94a3b8' }}>
            <VideoCall />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {messages.map((message) => (
            <MessageWithDropZone
              key={message.id}
              message={message}
              onAgentDrop={onAgentDrop}
            />
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={`Message ${conversationName}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton sx={{ color: '#94a3b8' }}>
                    <AttachFile />
                  </IconButton>
                  <IconButton sx={{ color: '#94a3b8' }}>
                    <EmojiEmotions />
                  </IconButton>
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    sx={{ color: newMessage.trim() ? '#3b82f6' : '#94a3b8' }}
                  >
                    <Send />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#334155',
                color: 'white',
                '& fieldset': { borderColor: '#475569' },
                '&:hover fieldset': { borderColor: '#64748b' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          backgroundColor: '#1e293b',
          color: 'white',
          borderRight: '1px solid #334155',
          marginLeft: '260px', // Account for left navigation
          height: '100vh',
          display: 'flex',
          flexDirection: 'row',
        },
      }}
    >
      {renderSidebar()}
      {renderMessageArea()}
    </Drawer>
  );
};

// Message component with agent drop zone functionality
interface MessageWithDropZoneProps {
  message: Message;
  onAgentDrop?: (agentId: string, messageId: string) => void;
}

const MessageWithDropZone: React.FC<MessageWithDropZoneProps> = ({
  message,
  onAgentDrop,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'agent',
    drop: (item: { agentId: string }) => {
      onAgentDrop?.(item.agentId, message.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <Box
      ref={drop}
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 1,
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: isOver ? '2px dashed #3b82f6' : '2px dashed transparent',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {isOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 1,
            zIndex: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
            Drop agent here to add to conversation
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar
          src={message.senderAvatar}
          sx={{ width: 36, height: 36 }}
        >
          {message.senderName.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
              {message.senderName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </Box>
          
          {message.type === 'agent_drop' ? (
            <Card sx={{ backgroundColor: '#334155', border: '1px solid #475569' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AgentIcon sx={{ color: '#3b82f6' }} />
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {message.content}
                  </Typography>
                </Box>
                {message.agentName && (
                  <Chip
                    label={message.agentName}
                    size="small"
                    sx={{
                      mt: 1,
                      backgroundColor: '#3b82f6',
                      color: 'white',
                    }}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Typography variant="body2" sx={{ color: 'white' }}>
              {message.content}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default HumanMessagingDrawer;

