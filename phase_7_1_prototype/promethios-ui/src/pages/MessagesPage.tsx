/**
 * MessagesPage - Slack-style human-to-human messaging interface
 * Designed to work within the ExpandableLeftPanel as a 50/50 split screen
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Chip,
  IconButton,
  Divider,
  Paper,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Tag as ChannelIcon,
  Lock as PrivateChannelIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Circle as OnlineIcon,
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface MessagesPageProps {
  onAgentDrop?: (agentId: string, messageId: string) => void;
}

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  unreadCount: number;
  lastActivity: string;
}

interface DirectMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastActivity: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isAgentDropZone?: boolean;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ onAgentDrop }) => {
  const { currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0); // 0: Channels, 1: Direct Messages
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [directMessagesExpanded, setDirectMessagesExpanded] = useState(true);
  const [messageInput, setMessageInput] = useState('');

  // Mock data
  const [channels] = useState<Channel[]>([
    {
      id: 'general',
      name: 'general',
      isPrivate: false,
      unreadCount: 3,
      lastActivity: '2 minutes ago'
    },
    {
      id: 'ai-agents',
      name: 'ai-agents',
      isPrivate: false,
      unreadCount: 7,
      lastActivity: '5 minutes ago'
    },
    {
      id: 'private-team',
      name: 'private-team',
      isPrivate: true,
      unreadCount: 1,
      lastActivity: '1 hour ago'
    }
  ]);

  const [directMessages] = useState<DirectMessage[]>([
    {
      id: 'dm1',
      userId: 'user1',
      userName: 'Sarah Chen',
      avatar: '/avatars/sarah.jpg',
      isOnline: true,
      unreadCount: 2,
      lastMessage: 'Hey, can you review the latest agent config?',
      lastActivity: '3 minutes ago'
    },
    {
      id: 'dm2',
      userId: 'user2',
      userName: 'Marcus Rodriguez',
      avatar: '/avatars/marcus.jpg',
      isOnline: false,
      unreadCount: 0,
      lastMessage: 'Thanks for the help with the deployment!',
      lastActivity: '2 hours ago'
    },
    {
      id: 'dm3',
      userId: 'user3',
      userName: 'Emily Watson',
      avatar: '/avatars/emily.jpg',
      isOnline: true,
      unreadCount: 5,
      lastMessage: 'The new messaging system looks great',
      lastActivity: '10 minutes ago'
    }
  ]);

  const [messages] = useState<Message[]>([
    {
      id: 'msg1',
      senderId: 'user1',
      senderName: 'Sarah Chen',
      senderAvatar: '/avatars/sarah.jpg',
      content: 'Hey everyone! Just wanted to share some thoughts on our latest AI agent configurations.',
      timestamp: '10:30 AM'
    },
    {
      id: 'msg2',
      senderId: 'user2',
      senderName: 'Marcus Rodriguez',
      senderAvatar: '/avatars/marcus.jpg',
      content: 'That sounds interesting! Can you drop an agent here to demonstrate?',
      timestamp: '10:32 AM'
    },
    {
      id: 'msg3',
      senderId: currentUser?.uid || 'current',
      senderName: currentUser?.displayName || 'You',
      senderAvatar: currentUser?.photoURL || '/avatars/default.jpg',
      content: 'Sure! I\'ll drag and drop an AI agent onto this message to show the integration.',
      timestamp: '10:35 AM'
    }
  ]);

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectMessages = directMessages.filter(dm =>
    dm.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // TODO: Implement message sending
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const MessageDropZone: React.FC<{ message: Message; children: React.ReactNode }> = ({ message, children }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'agent',
      drop: (item: any) => {
        if (onAgentDrop) {
          onAgentDrop(item.agentId, message.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    return (
      <Box
        ref={drop}
        sx={{
          position: 'relative',
          '&::after': isOver ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '2px dashed #3b82f6',
            borderRadius: '8px',
            pointerEvents: 'none',
            zIndex: 1,
          } : {}
        }}
      >
        {children}
        {isOver && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            Drop Agent Here
          </Box>
        )}
      </Box>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            width: '300px',
            backgroundColor: '#1e293b',
            borderRight: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
            <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 'bold', mb: 2 }}>
              Messages
            </Typography>
            
            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#334155',
                  color: '#e2e8f0',
                  '& fieldset': { borderColor: '#475569' },
                  '&:hover fieldset': { borderColor: '#64748b' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiInputBase-input::placeholder': { color: '#64748b' }
              }}
            />
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{
              borderBottom: '1px solid #334155',
              '& .MuiTab-root': { color: '#94a3b8', minHeight: '40px' },
              '& .Mui-selected': { color: '#3b82f6' },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
            }}
          >
            <Tab label="CHANNELS" />
            <Tab label="DIRECT" />
          </Tabs>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {selectedTab === 0 && (
              <Box>
                {/* Channels Section */}
                <Box sx={{ p: 1 }}>
                  <ListItemButton
                    onClick={() => setChannelsExpanded(!channelsExpanded)}
                    sx={{ borderRadius: '4px', color: '#94a3b8' }}
                  >
                    <ListItemIcon sx={{ minWidth: '24px' }}>
                      {channelsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Channels" 
                      primaryTypographyProps={{ fontSize: '14px', fontWeight: 'bold' }}
                    />
                    <IconButton size="small" sx={{ color: '#64748b' }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>

                  {channelsExpanded && (
                    <List dense sx={{ pl: 1 }}>
                      {filteredChannels.map((channel) => (
                        <ListItem key={channel.id} disablePadding>
                          <ListItemButton
                            selected={selectedConversation === channel.id}
                            onClick={() => setSelectedConversation(channel.id)}
                            sx={{
                              borderRadius: '4px',
                              '&.Mui-selected': { backgroundColor: '#3b82f6' }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: '24px' }}>
                              {channel.isPrivate ? (
                                <PrivateChannelIcon sx={{ fontSize: '16px', color: '#64748b' }} />
                              ) : (
                                <ChannelIcon sx={{ fontSize: '16px', color: '#64748b' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary={channel.name}
                              primaryTypographyProps={{ fontSize: '14px' }}
                            />
                            {channel.unreadCount > 0 && (
                              <Chip
                                label={channel.unreadCount}
                                size="small"
                                sx={{
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  fontSize: '10px',
                                  height: '18px'
                                }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                {/* Direct Messages Section */}
                <Box sx={{ p: 1 }}>
                  <ListItemButton
                    onClick={() => setDirectMessagesExpanded(!directMessagesExpanded)}
                    sx={{ borderRadius: '4px', color: '#94a3b8' }}
                  >
                    <ListItemIcon sx={{ minWidth: '24px' }}>
                      {directMessagesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Direct Messages" 
                      primaryTypographyProps={{ fontSize: '14px', fontWeight: 'bold' }}
                    />
                    <IconButton size="small" sx={{ color: '#64748b' }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>

                  {directMessagesExpanded && (
                    <List dense sx={{ pl: 1 }}>
                      {filteredDirectMessages.map((dm) => (
                        <ListItem key={dm.id} disablePadding>
                          <ListItemButton
                            selected={selectedConversation === dm.id}
                            onClick={() => setSelectedConversation(dm.id)}
                            sx={{
                              borderRadius: '4px',
                              '&.Mui-selected': { backgroundColor: '#3b82f6' }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: '32px' }}>
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                  dm.isOnline ? (
                                    <OnlineIcon sx={{ fontSize: '8px', color: '#10b981' }} />
                                  ) : null
                                }
                              >
                                <Avatar
                                  src={dm.avatar}
                                  sx={{ width: 24, height: 24, fontSize: '12px' }}
                                >
                                  {dm.userName.charAt(0)}
                                </Avatar>
                              </Badge>
                            </ListItemIcon>
                            <ListItemText 
                              primary={dm.userName}
                              primaryTypographyProps={{ fontSize: '14px' }}
                            />
                            {dm.unreadCount > 0 && (
                              <Chip
                                label={dm.unreadCount}
                                size="small"
                                sx={{
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  fontSize: '10px',
                                  height: '18px'
                                }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                    #{selectedConversation}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {selectedTab === 0 ? 'Channel' : 'Direct Message'}
                  </Typography>
                </Box>
                <IconButton sx={{ color: '#64748b' }}>
                  <MoreIcon />
                </IconButton>
              </Box>

              {/* Messages Area */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                  <MessageDropZone key={message.id} message={message}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 3,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px',
                          p: 1,
                          m: -1,
                          mb: 2
                        }
                      }}
                    >
                      <Avatar
                        src={message.senderAvatar}
                        sx={{ width: 36, height: 36 }}
                      >
                        {message.senderName.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ color: '#e2e8f0', fontWeight: 'bold' }}
                          >
                            {message.senderName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: '#64748b' }}
                          >
                            {message.timestamp}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#cbd5e1', lineHeight: 1.5 }}
                        >
                          {message.content}
                        </Typography>
                      </Box>
                    </Box>
                  </MessageDropZone>
                ))}
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: '#334155',
                    borderRadius: '8px',
                    p: 1
                  }}
                >
                  <IconButton size="small" sx={{ color: '#64748b' }}>
                    <AttachIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder={`Message #${selectedConversation}`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      sx: { color: '#e2e8f0' }
                    }}
                    sx={{
                      '& .MuiInputBase-input::placeholder': { color: '#64748b' }
                    }}
                  />
                  <IconButton size="small" sx={{ color: '#64748b' }}>
                    <EmojiIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    sx={{
                      color: messageInput.trim() ? '#3b82f6' : '#64748b'
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            /* No Conversation Selected */
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                color: '#64748b'
              }}
            >
              <Typography variant="h6">
                Select a conversation to start messaging
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: '300px' }}>
                Choose a channel or direct message from the sidebar to begin your conversation.
                You can also drag and drop AI agents onto messages for enhanced collaboration.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </DndProvider>
  );
};

export default MessagesPage;

