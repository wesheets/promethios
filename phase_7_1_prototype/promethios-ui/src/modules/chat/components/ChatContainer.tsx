/**
 * Basic ChatContainer component that combines all chat functionality
 */

import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { Message as MessageType } from '../types';
import { messageService } from '../services/MessageService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatContainerProps {
  height?: string | number;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  height = 600 
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage = messageService.addMessage({
      content,
      sender: 'user'
    });

    // Add simple bot response
    const botMessage = messageService.addMessage({
      content: `Echo: ${content}`,
      sender: 'agent'
    });

    // Update state with all messages
    setMessages(messageService.getMessages());
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <MessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </Paper>
  );
};

export default ChatContainer;

