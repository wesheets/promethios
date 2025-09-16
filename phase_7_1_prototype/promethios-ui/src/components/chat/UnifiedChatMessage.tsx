/**
 * UnifiedChatMessage - Handles both regular messages and thread integration messages
 */

import React from 'react';
import ColorCodedChatMessage from './ColorCodedChatMessage';
import ThreadIntegrationMessage from '../thread/ThreadIntegrationMessage';
import { MessageWithThread, ThreadIntegrationMessage as ThreadIntegrationMessageType } from '../../types/Thread';

interface UnifiedChatMessageProps {
  message: MessageWithThread | ThreadIntegrationMessageType;
  senderColor?: string;
  recipient?: {
    id: string;
    name: string;
    type: 'ai' | 'human';
    avatar?: string;
    color: string;
  };
  isCurrentUser?: boolean;
  currentUserId?: string;
  onAgentInteraction?: (agentId: string, messageId: string, action: string) => void;
  onStartThread?: (messageId: string) => void;
  onOpenThread?: (threadId: string) => void;
  participants?: Array<{
    id: string;
    name: string;
    type: 'user' | 'ai_agent';
    color?: string;
  }>;
}

export const UnifiedChatMessage: React.FC<UnifiedChatMessageProps> = ({
  message,
  senderColor,
  recipient,
  isCurrentUser = false,
  currentUserId,
  onAgentInteraction,
  onStartThread,
  onOpenThread,
  participants
}) => {
  // Check if this is a thread integration message
  if (message.type === 'thread_integration') {
    const integrationMessage = message as ThreadIntegrationMessageType;
    return (
      <ThreadIntegrationMessage
        integrationMessage={integrationMessage}
        onOpenThread={onOpenThread}
        participants={participants}
      />
    );
  }

  // Regular message - convert to ColorCodedChatMessage format
  const regularMessage = message as MessageWithThread;
  const chatMessage = {
    id: regularMessage.id,
    content: regularMessage.content,
    timestamp: regularMessage.timestamp,
    sender: {
      id: regularMessage.sender || 'unknown',
      name: regularMessage.sender || 'Unknown',
      type: 'human' as const, // Default to human, should be determined by actual data
      avatar: undefined
    },
    thread: regularMessage.thread,
    type: regularMessage.type || 'regular'
  };

  return (
    <ColorCodedChatMessage
      message={chatMessage}
      senderColor={senderColor || '#64748b'}
      recipient={recipient}
      isCurrentUser={isCurrentUser}
      currentUserId={currentUserId}
      onAgentInteraction={onAgentInteraction}
      onStartThread={onStartThread}
      onOpenThread={onOpenThread}
    />
  );
};

export default UnifiedChatMessage;

