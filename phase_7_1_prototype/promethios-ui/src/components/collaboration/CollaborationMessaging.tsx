/**
 * CollaborationMessaging - Simplified messaging interface for collaboration workspaces
 * Integrates existing command center messaging functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  Divider,
  InputAdornment,
  Chip,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  Add as AddIcon,
  Mic as MicIcon
} from '@mui/icons-material';

import { CollaborationItem } from '../../pages/CollaborationsPage';
import AgentAvatarSelector from '../AgentAvatarSelector';

// Message types
interface CollaborationMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderType: 'human' | 'ai_agent';
  timestamp: Date;
  attachments?: any[];
  mentions?: string[];
}

interface CollaborationMessagingProps {
  item: CollaborationItem;
  messages: CollaborationMessage[];
  onSendMessage: (message: string, selectedAgents?: string[]) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

const CollaborationMessaging: React.FC<CollaborationMessagingProps> = ({
  item,
  messages,
  onSendMessage,
  onTyping,
  disabled = false
}) => {
  const theme = useTheme();
  const [messageInput, setMessageInput] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    if (onTyping) {
      onTyping(isTyping);
    }
  }, [isTyping, onTyping]);

  // Handle message input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Typing indicator logic
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
    }
  };

  // Handle message sending
  const handleSendMessage = () => {
    if (!messageInput.trim() || disabled) return;

    // Send message with selected agents (for agent command centers)
    const agentsToSend = item.type === 'agent_command_center' ? [item.id] : selectedAgents;
    onSendMessage(messageInput.trim(), agentsToSend);

    // Clear input and reset state
    setMessageInput('');
    setSelectedAgents([]);
    setIsTyping(false);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get message display color
  const getMessageColor = (message: CollaborationMessage) => {
    if (message.senderType === 'ai_agent') {
      // Use item color for agent command centers, or default colors for other types
      return item.type === 'agent_command_center' ? item.color : theme.palette.primary.main;
    }
    return theme.palette.text.primary;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
    }}>
      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.length === 0 ? (
          // Empty state
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
              {item.type === 'agent_command_center' ? 'Start collaborating with AI' :
               item.type === 'channel' ? 'Welcome to the channel' :
               item.type === 'direct_message' ? 'Start your conversation' : 'Begin collaboration'}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.disabled, maxWidth: 400 }}>
              {item.type === 'agent_command_center' ? 
                `This is your dedicated space to collaborate with ${item.name}. Ask questions, request analysis, or get assistance with your work.` :
               item.type === 'channel' ? 
                `This is the beginning of the #${item.name} channel. Share ideas, collaborate, and stay connected with your team.` :
               item.type === 'direct_message' ? 
                `This is the beginning of your direct conversation with ${item.name}.` : 
                'This is the beginning of your collaboration.'}
            </Typography>
          </Box>
        ) : (
          // Messages list
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              color={getMessageColor(message)}
              onTimestamp={formatTimestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        {/* Agent Selector (for non-agent command centers) */}
        {item.type !== 'agent_command_center' && (
          <Box sx={{ mb: 2 }}>
            <AgentAvatarSelector
              selectedAgents={selectedAgents}
              onAgentToggle={(agentId) => {
                setSelectedAgents(prev => 
                  prev.includes(agentId) 
                    ? prev.filter(id => id !== agentId)
                    : [...prev, agentId]
                );
              }}
              maxVisible={6}
              size="small"
            />
          </Box>
        )}

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={
              item.type === 'agent_command_center' ? `Message ${item.name}...` :
              item.type === 'channel' ? `Message #${item.name}...` :
              item.type === 'direct_message' ? `Message ${item.name}...` :
              'Type your message...'
            }
            disabled={disabled}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#f8fafc',
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? '#475569' : '#e2e8f0'
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? '#64748b' : '#cbd5e1'
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main
                }
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" disabled={disabled}>
                      <AttachIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={disabled}>
                      <EmojiIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </InputAdornment>
              )
            }}
          />
          
          <IconButton
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || disabled}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.primary.dark
              },
              '&.Mui-disabled': {
                bgcolor: theme.palette.action.disabled,
                color: theme.palette.action.disabled
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>

        {/* Selected Agents Display */}
        {selectedAgents.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {selectedAgents.map((agentId) => (
              <Chip
                key={agentId}
                label={`AI Agent ${agentId}`}
                size="small"
                onDelete={() => setSelectedAgents(prev => prev.filter(id => id !== agentId))}
                sx={{ fontSize: '11px' }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Individual Message Item Component
interface MessageItemProps {
  message: CollaborationMessage;
  color: string;
  onTimestamp: (timestamp: Date) => string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, color, onTimestamp }) => {
  const theme = useTheme();
  const isAgent = message.senderType === 'ai_agent';

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: isAgent ? color : theme.palette.primary.main,
          fontSize: '14px',
          fontWeight: 600,
          flexShrink: 0
        }}
      >
        {message.senderName.charAt(0).toUpperCase()}
      </Avatar>

      {/* Message Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Message Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              fontSize: '14px',
              color: isAgent ? color : theme.palette.text.primary
            }}
          >
            {message.senderName}
          </Typography>
          
          {isAgent && (
            <Chip
              label="AI"
              size="small"
              sx={{
                height: 16,
                fontSize: '10px',
                fontWeight: 600,
                bgcolor: color,
                color: 'white'
              }}
            />
          )}
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '12px'
            }}
          >
            {onTimestamp(message.timestamp)}
          </Typography>
        </Box>

        {/* Message Text */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: '14px', 
            lineHeight: 1.5,
            color: theme.palette.text.primary,
            wordBreak: 'break-word'
          }}
        >
          {message.content}
        </Typography>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {message.attachments.map((attachment, index) => (
              <Chip
                key={index}
                label={attachment.name || 'Attachment'}
                size="small"
                icon={<AttachIcon />}
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CollaborationMessaging;

