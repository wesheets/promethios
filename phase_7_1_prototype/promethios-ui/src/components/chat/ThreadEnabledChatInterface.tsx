/**
 * ThreadEnabledChatInterface - Chat interface with threaded conversation support
 * Integrates with existing chat system while adding thread functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, useTheme, Typography, Alert } from '@mui/material';
import UnifiedChatMessage from './UnifiedChatMessage';
import ThreadView from '../thread/ThreadView';
import { useThreads } from '../../hooks/useThreads';
import { MessageWithThread, ThreadIntegrationMessage } from '../../types/Thread';

interface ThreadEnabledChatInterfaceProps {
  messages: (MessageWithThread | ThreadIntegrationMessage)[];
  currentUserId: string;
  currentUserName: string;
  conversationId: string;
  participants?: Array<{
    id: string;
    name: string;
    type: 'user' | 'ai_agent';
    color?: string;
  }>;
  onAgentInteraction?: (agentId: string, messageId: string, action: string) => void;
  onSendMessage?: (content: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ThreadEnabledChatInterface: React.FC<ThreadEnabledChatInterfaceProps> = ({
  messages,
  currentUserId,
  currentUserName,
  conversationId,
  participants = [],
  onAgentInteraction,
  onSendMessage,
  className,
  style
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadViewOpen, setThreadViewOpen] = useState(false);

  // Use threads hook for thread management
  const {
    activeThreads,
    createThread,
    openThread,
    closeThread,
    loading: threadsLoading,
    error: threadsError
  } = useThreads(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle starting a new thread
  const handleStartThread = async (messageId: string) => {
    console.log('🧵 [ThreadEnabledChat] Starting thread for message:', messageId);
    
    try {
      // Create thread with a placeholder initial reply
      // In a real implementation, this might open a dialog for the user to write the first reply
      const initialReply = `Starting a discussion about this message.`;
      
      const threadId = await createThread(messageId, {
        content: initialReply,
        senderId: currentUserId,
        senderName: currentUserName,
        senderType: 'user'
      });

      // Open the newly created thread
      setActiveThreadId(threadId);
      setThreadViewOpen(true);
      
    } catch (error) {
      console.error('❌ [ThreadEnabledChat] Error starting thread:', error);
    }
  };

  // Handle opening an existing thread
  const handleOpenThread = (threadId: string) => {
    console.log('📂 [ThreadEnabledChat] Opening thread:', threadId);
    setActiveThreadId(threadId);
    setThreadViewOpen(true);
    openThread(threadId);
  };

  // Handle closing thread view
  const handleCloseThread = () => {
    console.log('❌ [ThreadEnabledChat] Closing thread view');
    setThreadViewOpen(false);
    if (activeThreadId) {
      closeThread(activeThreadId);
      setActiveThreadId(null);
    }
  };

  // Handle thread reply added
  const handleThreadReplyAdded = (reply: any) => {
    console.log('💬 [ThreadEnabledChat] Thread reply added:', reply);
    // Could trigger a refresh of the main chat to show updated thread indicators
  };

  // Get sender color for a message
  const getSenderColor = (senderId: string): string => {
    const participant = participants.find(p => p.id === senderId);
    if (participant?.color) return participant.color;
    
    // Default color generation
    const colors = [
      '#f97316', '#3b82f6', '#10b981', '#8b5cf6', 
      '#ef4444', '#f59e0b', '#06b6d4', '#ec4899',
      '#6366f1', '#84cc16', '#f43f5e', '#14b8a6'
    ];
    const index = senderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Find parent message for active thread
  const getParentMessage = (threadId: string) => {
    const message = messages.find(m => m.id === threadId);
    if (!message || message.type === 'thread_integration') return null;
    
    const regularMessage = message as MessageWithThread;
    return {
      id: regularMessage.id,
      content: regularMessage.content,
      sender: regularMessage.sender || 'Unknown',
      timestamp: regularMessage.timestamp,
      senderColor: getSenderColor(regularMessage.sender || '')
    };
  };

  return (
    <Box 
      className={className}
      style={style}
      sx={{ 
        display: 'flex', 
        height: '100%',
        bgcolor: isDarkMode ? '#0f172a' : '#f8fafc'
      }}
    >
      {/* Main Chat Area */}
      <Box sx={{ 
        flex: threadViewOpen ? 1 : 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0 // Prevents flex item from overflowing
      }}>
        {/* Error Display */}
        {threadsError && (
          <Alert severity="error" sx={{ m: 1 }}>
            Thread Error: {threadsError}
          </Alert>
        )}

        {/* Messages Container */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          position: 'relative'
        }}>
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: theme.palette.text.secondary
            }}>
              <Typography variant="body2">
                No messages yet. Start a conversation!
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.senderId === currentUserId;
                const senderColor = getSenderColor(message.senderId);
                
                return (
                  <UnifiedChatMessage
                    key={message.id}
                    message={message}
                    senderColor={senderColor}
                    isCurrentUser={isCurrentUser}
                    currentUserId={currentUserId}
                    onAgentInteraction={onAgentInteraction}
                    onStartThread={handleStartThread}
                    onOpenThread={handleOpenThread}
                    participants={participants}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Message Input Area */}
        {onSendMessage && (
          <Box sx={{ 
            p: 2, 
            borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            bgcolor: isDarkMode ? '#1e293b' : '#ffffff'
          }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: isDarkMode ? '#334155' : '#f1f5f9',
              borderRadius: 1,
              color: theme.palette.text.secondary,
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <Typography variant="body2">
                💡 Hover over messages to start threads • Drag agents onto messages for behavioral prompts
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Thread View - Side Panel */}
      {threadViewOpen && activeThreadId && (
        <ThreadView
          threadId={activeThreadId}
          parentMessage={getParentMessage(activeThreadId) || {
            id: activeThreadId,
            content: 'Thread message',
            sender: 'Unknown',
            timestamp: new Date().toISOString()
          }}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onClose={handleCloseThread}
          onReplyAdded={handleThreadReplyAdded}
          onAgentInteraction={onAgentInteraction}
          participants={participants}
        />
      )}
    </Box>
  );
};

export default ThreadEnabledChatInterface;

