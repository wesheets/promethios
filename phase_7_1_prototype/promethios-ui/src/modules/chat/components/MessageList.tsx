import React from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  CircularProgress,
  Fade,
  Divider
} from '@mui/material';
import { ChatMessage, MessageSender } from '../types';
import { Message } from './Message';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  showGovernance?: boolean;
  typingIndicator?: {
    isTyping: boolean;
    sender?: string;
  };
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  showGovernance = false,
  typingIndicator
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingIndicator?.isTyping]);

  // Group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const dateKey = message.timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Format date for display
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <Fade in={typingIndicator?.isTyping}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          ml: 5
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 1.5,
            border: 1,
            borderColor: 'divider'
          }}
        >
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {typingIndicator?.sender || 'Agent'} is typing...
          </Typography>
        </Box>
      </Box>
    </Fade>
  );

  if (loading && messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          textAlign: 'center',
          color: 'text.secondary'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Start a conversation
        </Typography>
        <Typography variant="body2">
          Send a message to begin chatting with your agent
        </Typography>
        {showGovernance && (
          <Typography variant="caption" sx={{ mt: 1 }}>
            Governance monitoring is active
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Messages grouped by date */}
      {Object.entries(messageGroups).map(([dateString, dateMessages]) => (
        <Box key={dateString}>
          {/* Date Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              my: 2
            }}
          >
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'background.paper',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                color: 'text.secondary'
              }}
            >
              {formatDateHeader(dateString)}
            </Typography>
          </Box>

          {/* Messages for this date */}
          {dateMessages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              showGovernance={showGovernance}
              isLatest={index === dateMessages.length - 1}
            />
          ))}
        </Box>
      ))}

      {/* Typing Indicator */}
      {typingIndicator?.isTyping && <TypingIndicator />}

      {/* Loading Indicator */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            my: 2
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

