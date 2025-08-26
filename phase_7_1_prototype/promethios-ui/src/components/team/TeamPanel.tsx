/**
 * TeamPanel - Human-to-human collaboration interface
 * 
 * Provides team messaging, member management, and collaboration features
 * for the right panel of the Agent Command Center.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  IconButton,
  TextField,
  Button,
  Paper,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Card,
  CardContent,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Send,
  MoreVert,
  Person,
  Group,
  Circle,
  Search,
  Add,
  Share,
  AttachFile
} from '@mui/icons-material';
import HumanChatService, { TeamMember, TeamConversation, HumanMessage } from '../../services/HumanChatService';

interface TeamPanelProps {
  currentUserId?: string;
  onChatReference?: (reference: string) => void;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ 
  currentUserId = 'current_user',
  onChatReference 
}) => {
  const [humanChatService] = useState(() => HumanChatService.getInstance());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [conversations, setConversations] = useState<TeamConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<TeamConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the service
    humanChatService.initialize(currentUserId);
    
    // Load initial data
    loadTeamData();
    
    // Set user as online
    humanChatService.updateUserStatus('online');

    // Cleanup on unmount
    return () => {
      humanChatService.updateUserStatus('offline');
    };
  }, [currentUserId, humanChatService]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [activeConversation?.messages]);

  const loadTeamData = () => {
    setTeamMembers(humanChatService.getTeamMembers());
    setConversations(humanChatService.getUserConversations());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartConversation = async (memberId: string) => {
    try {
      const conversation = await humanChatService.startConversation(memberId);
      setActiveConversation(conversation);
      loadTeamData(); // Refresh conversations list
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    try {
      await humanChatService.sendMessage(activeConversation.id, messageInput.trim());
      setMessageInput('');
      
      // Refresh conversation data
      const updatedConversation = humanChatService.getConversation(activeConversation.id);
      if (updatedConversation) {
        setActiveConversation(updatedConversation);
      }
      loadTeamData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (activeConversation) {
    // Chat view
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              size="small"
              onClick={() => setActiveConversation(null)}
              sx={{ color: '#64748b', minWidth: 'auto', p: 0.5 }}
            >
              ← Back
            </Button>
            <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
              {activeConversation.name}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: '#64748b' }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {activeConversation.messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '70%',
                  bgcolor: message.senderId === currentUserId ? '#3b82f6' : '#374151',
                  color: 'white',
                  borderRadius: 2,
                  borderBottomRightRadius: message.senderId === currentUserId ? 0.5 : 2,
                  borderBottomLeftRadius: message.senderId === currentUserId ? 2 : 0.5,
                }}
              >
                {message.senderId !== currentUserId && (
                  <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5 }}>
                    {message.senderName}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5, textAlign: 'right' }}>
                  {formatMessageTime(message.timestamp)}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message input */}
        <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: '#374151',
                '& fieldset': { borderColor: '#4b5563' },
                '&:hover fieldset': { borderColor: '#6b7280' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#9ca3af',
                opacity: 1,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    sx={{ color: messageInput.trim() ? '#3b82f6' : '#6b7280' }}
                  >
                    <Send />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Options menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <Share sx={{ mr: 1 }} /> Share Chat
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <AttachFile sx={{ mr: 1 }} /> Attach File
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  // Team overview
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
          Team Collaboration
        </Typography>
        
        <TextField
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search team members..."
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              bgcolor: '#374151',
              '& fieldset': { borderColor: '#4b5563' },
              '&:hover fieldset': { borderColor: '#6b7280' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#9ca3af',
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Online members */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 'bold' }}>
          Online Now ({humanChatService.getOnlineMembers().length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {humanChatService.getOnlineMembers().slice(0, 6).map((member) => (
            <Tooltip key={member.id} title={member.name}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Circle sx={{ 
                    color: getStatusColor(member.status), 
                    fontSize: 12,
                    border: '2px solid #1e293b',
                    borderRadius: '50%'
                  }} />
                }
              >
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: '#3b82f6',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#2563eb' }
                  }}
                  onClick={() => handleStartConversation(member.id)}
                >
                  {member.name.charAt(0)}
                </Avatar>
              </Badge>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Recent conversations */}
      {conversations.length > 0 && (
        <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 'bold' }}>
            Recent Conversations
          </Typography>
          
          <List sx={{ p: 0 }}>
            {conversations.slice(0, 3).map((conversation) => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              return (
                <ListItem
                  key={conversation.id}
                  button
                  onClick={() => setActiveConversation(conversation)}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': { bgcolor: '#374151' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#6366f1', width: 32, height: 32 }}>
                      <Group />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {conversation.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        {lastMessage ? lastMessage.content.substring(0, 30) + '...' : 'No messages'}
                      </Typography>
                    }
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {formatMessageTime(conversation.lastActivity)}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}

      {/* Team members list */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, borderTop: '1px solid #334155' }}>
        <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 'bold' }}>
          Team Members ({filteredMembers.length})
        </Typography>
        
        <List sx={{ p: 0 }}>
          {filteredMembers.map((member) => (
            <ListItem
              key={member.id}
              button
              onClick={() => handleStartConversation(member.id)}
              sx={{
                p: 1,
                borderRadius: 1,
                mb: 0.5,
                '&:hover': { bgcolor: '#374151' }
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Circle sx={{ 
                      color: getStatusColor(member.status), 
                      fontSize: 10,
                      border: '2px solid #1e293b',
                      borderRadius: '50%'
                    }} />
                  }
                >
                  <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                    {member.name.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {member.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getStatusText(member.status)}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(member.status),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 16
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {member.role}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default TeamPanel;

