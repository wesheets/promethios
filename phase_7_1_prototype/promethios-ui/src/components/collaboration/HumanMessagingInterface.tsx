/**
 * HumanMessagingInterface - Human-to-human messaging interface
 * Based on CollaborationMessaging but adapted for human conversations only
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  InputAdornment,
  useTheme,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';

// Message types for human conversations
interface HumanMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  attachments?: any[];
  mentions?: string[];
}

interface HumanMessagingInterfaceProps {
  conversationType: 'channel' | 'direct_message';
  conversationId: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  }>;
}

const HumanMessagingInterface: React.FC<HumanMessagingInterfaceProps> = ({
  conversationType,
  conversationId,
  participants
}) => {
  const theme = useTheme();
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<HumanMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsAnchorRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message input changes with @mentions detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setMessageInput(value);
    
    // Typing indicator logic
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
    }

    // @mentions detection
    const beforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(query);
      setMentionPosition(mentionMatch.index || 0);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  // Filter participants for mentions
  const getFilteredParticipants = () => {
    if (!mentionQuery) return participants;
    return participants.filter(participant =>
      participant.name.toLowerCase().includes(mentionQuery)
    );
  };

  // Handle mention selection
  const handleMentionSelect = (participant: typeof participants[0]) => {
    const beforeMention = messageInput.substring(0, mentionPosition);
    const afterCursor = messageInput.substring(inputRef.current?.selectionStart || 0);
    const newValue = `${beforeMention}@${participant.name} ${afterCursor}`;
    
    setMessageInput(newValue);
    setShowMentions(false);
    setMentions(prev => [...prev, participant.id]);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPosition = beforeMention.length + participant.name.length + 2;
      setTimeout(() => {
        inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
  ];

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const cursorPosition = inputRef.current?.selectionStart || messageInput.length;
    const beforeCursor = messageInput.substring(0, cursorPosition);
    const afterCursor = messageInput.substring(cursorPosition);
    const newValue = `${beforeCursor}${emoji}${afterCursor}`;
    
    setMessageInput(newValue);
    setShowEmojiPicker(false);
    
    // Focus back on input and set cursor position
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPosition = cursorPosition + emoji.length;
      setTimeout(() => {
        inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };
  // Handle message sending
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    // Create new message with mentions
    const newMessage: HumanMessage = {
      id: Date.now().toString(),
      content: messageInput.trim(),
      senderId: 'current-user', // This would come from auth context
      senderName: 'You', // This would come from auth context
      timestamp: new Date(),
      mentions: mentions.length > 0 ? mentions : undefined
    };

    // Add message to list
    setMessages(prev => [...prev, newMessage]);

    // Clear input and reset state
    setMessageInput('');
    setMentions([]);
    setIsTyping(false);
    setShowMentions(false);
    setShowEmojiPicker(false);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // TODO: Send message to Firebase/backend with mentions
    console.log('Sending message:', newMessage);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  // Get placeholder text
  const getPlaceholder = () => {
    if (conversationType === 'channel') {
      return 'Type a message...';
    } else if (participants.length > 0) {
      return `Message ${participants[0].name}...`;
    }
    return 'Type a message...';
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#0f172a'
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
            <Typography variant="h6" sx={{ color: '#94a3b8' }}>
              {conversationType === 'channel' ? 'Welcome to the channel' : 'Start your conversation'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 400 }}>
              {conversationType === 'channel' ? 
                'This is the beginning of your channel conversation. Share ideas and collaborate with your team.' :
                participants.length > 0 ?
                  `This is the beginning of your direct conversation with ${participants[0].name}.` :
                  'This is the beginning of your conversation.'}
            </Typography>
          </Box>
        ) : (
          // Messages list
          messages.map((message) => (
            <HumanMessageItem
              key={message.id}
              message={message}
              onTimestamp={formatTimestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid #334155',
        bgcolor: '#1e293b',
        position: 'relative'
      }}>
        {/* Mentions Dropdown */}
        <Popper
          open={showMentions}
          anchorEl={inputRef.current}
          placement="top-start"
          sx={{ zIndex: 1400 }}
        >
          <Paper
            sx={{
              bgcolor: '#334155',
              border: '1px solid #475569',
              borderRadius: 1,
              maxHeight: 200,
              overflow: 'auto',
              minWidth: 200
            }}
          >
            <List dense>
              {getFilteredParticipants().map((participant) => (
                <ListItem
                  key={participant.id}
                  button
                  onClick={() => handleMentionSelect(participant)}
                  sx={{
                    '&:hover': {
                      bgcolor: '#475569'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={participant.avatar}
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: '#6366f1',
                        fontSize: '12px'
                      }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={participant.name}
                    primaryTypographyProps={{
                      sx: { color: '#f8fafc', fontSize: '14px' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Popper>

        {/* Emoji Picker */}
        <Popper
          open={showEmojiPicker}
          anchorEl={inputRef.current}
          placement="top-end"
          sx={{ zIndex: 1400 }}
        >
          <Paper
            sx={{
              bgcolor: '#334155',
              border: '1px solid #475569',
              borderRadius: 1,
              p: 2,
              maxWidth: 320,
              maxHeight: 300,
              overflow: 'auto'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: '#f8fafc', mb: 1, fontSize: '12px' }}
            >
              Choose an emoji
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 0.5
              }}
            >
              {commonEmojis.map((emoji, index) => (
                <IconButton
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  sx={{
                    fontSize: '18px',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      bgcolor: '#475569'
                    }
                  }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Paper>
        </Popper>

        {/* Active Mentions Display */}
        {mentions.length > 0 && (
          <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {mentions.map((mentionId) => {
              const participant = participants.find(p => p.id === mentionId);
              return participant ? (
                <Chip
                  key={mentionId}
                  label={`@${participant.name}`}
                  size="small"
                  onDelete={() => setMentions(prev => prev.filter(id => id !== mentionId))}
                  sx={{
                    bgcolor: '#6366f1',
                    color: 'white',
                    fontSize: '11px',
                    '& .MuiChip-deleteIcon': {
                      color: 'white'
                    }
                  }}
                />
              ) : null;
            })}
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
            placeholder={getPlaceholder()}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#334155',
                color: '#f8fafc',
                '& fieldset': {
                  borderColor: '#475569'
                },
                '&:hover fieldset': {
                  borderColor: '#64748b'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#10b981'
                }
              },
              '& input::placeholder': {
                color: '#94a3b8',
                opacity: 1
              },
              '& textarea::placeholder': {
                color: '#94a3b8',
                opacity: 1
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      sx={{ color: '#94a3b8' }}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <EmojiIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#94a3b8' }}>
                      <AttachIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </InputAdornment>
              )
            }}
          />
          
          <IconButton
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            sx={{
              bgcolor: '#10b981',
              color: 'white',
              '&:hover': {
                bgcolor: '#059669'
              },
              '&.Mui-disabled': {
                bgcolor: '#374151',
                color: '#6b7280'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

// Individual Message Item Component
interface HumanMessageItemProps {
  message: HumanMessage;
  onTimestamp: (timestamp: Date) => string;
}

const HumanMessageItem: React.FC<HumanMessageItemProps> = ({ message, onTimestamp }) => {
  const isCurrentUser = message.senderId === 'current-user';

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <Avatar
        src={message.senderAvatar}
        sx={{
          width: 36,
          height: 36,
          bgcolor: isCurrentUser ? '#10b981' : '#6366f1',
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
              color: isCurrentUser ? '#10b981' : '#f8fafc'
            }}
          >
            {message.senderName}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#94a3b8',
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
            color: '#f8fafc',
            wordBreak: 'break-word'
          }}
        >
          {message.content}
        </Typography>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {message.attachments.map((attachment, index) => (
              <Box
                key={index}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#334155',
                  color: '#f8fafc',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '12px',
                  mr: 0.5,
                  mb: 0.5
                }}
              >
                <AttachIcon sx={{ fontSize: 14 }} />
                {attachment.name || 'Attachment'}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HumanMessagingInterface;

