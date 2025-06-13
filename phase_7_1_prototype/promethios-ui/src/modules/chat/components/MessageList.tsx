/**
 * Simple MessageList component for displaying chat messages
 */

import React from 'react';
import { Box } from '@mui/material';
import { Message as MessageType } from '../types';
import Message from './Message';

interface MessageListProps {
  messages: MessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </Box>
  );
};

export default MessageList;

