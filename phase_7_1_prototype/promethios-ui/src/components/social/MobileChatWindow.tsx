import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  Avatar,
  Paper,
  Slide,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

interface MobileChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

const MobileChatWindow: React.FC<MobileChatWindowProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userAvatar,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    // Mock messages for now
    const mockMessages: Message[] = [
      {
        id: '1',
        text: 'Hey there! How are you doing?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        isOwn: false,
        status: 'read',
      },
      {
        id: '2',
        text: 'I\'m doing great! Thanks for asking. How about you?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isOwn: true,
        status: 'read',
      },
      {
        id: '3',
        text: 'Pretty good! Just working on some exciting projects.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        isOwn: false,
        status: 'read',
      },
    ];
    
    setMessages(mockMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
      status: 'sending',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate sending
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog
      fullScreen
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
        },
      }}
    >
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Avatar 
            src={userAvatar} 
            sx={{ width: 32, height: 32, ml: 1, mr: 2 }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {isTyping ? 'typing...' : 'online'}
            </Typography>
          </Box>
          
          <IconButton color="inherit">
            <MoreVertIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          backgroundColor: 'grey.50',
          backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%)',
          backgroundSize: '20px 20px',
        }}
      >
        <List sx={{ p: 1 }}>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
                px: 1,
                py: 0.5,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  maxWidth: '75%',
                  p: 1.5,
                  backgroundColor: message.isOwn ? 'primary.main' : 'background.paper',
                  color: message.isOwn ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  borderTopRightRadius: message.isOwn ? 0.5 : 2,
                  borderTopLeftRadius: message.isOwn ? 2 : 0.5,
                }}
              >
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {message.text}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    textAlign: 'right',
                    mt: 0.5,
                    opacity: 0.7,
                  }}
                >
                  {formatTimestamp(message.timestamp)}
                  {message.isOwn && message.status && (
                    <span style={{ marginLeft: 4 }}>
                      {message.status === 'sending' && '⏳'}
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && '✓✓'}
                    </span>
                  )}
                </Typography>
              </Paper>
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper 
        elevation={8} 
        sx={{ 
          p: 2,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  sx={{
                    backgroundColor: newMessage.trim() ? 'primary.main' : 'transparent',
                    color: newMessage.trim() ? 'primary.contrastText' : 'action.disabled',
                    '&:hover': {
                      backgroundColor: newMessage.trim() ? 'primary.dark' : 'transparent',
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>
    </Dialog>
  );
};

export default MobileChatWindow;

