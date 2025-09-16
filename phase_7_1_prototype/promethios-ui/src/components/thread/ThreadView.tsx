/**
 * ThreadView - Main component for displaying threaded conversations
 * Shows parent message and all replies in a side panel with consistent colors and drag & drop
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Forum as ForumIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { ThreadSubscription, ThreadMessage, AddThreadReplyRequest, ResolveThreadRequest } from '../../types/Thread';
import ThreadService from '../../services/ThreadService';
import { useMessageDropTarget } from '../../hooks/useDragDrop';
import ThreadResolutionDialog from './ThreadResolutionDialog';

interface ThreadViewProps {
  threadId: string;
  parentMessage: {
    id: string;
    content: string;
    sender: string;
    timestamp: string;
    senderColor?: string;
  };
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onReplyAdded?: (reply: ThreadMessage) => void;
  onAgentInteraction?: (agentId: string, messageId: string, action: string) => void;
  // Agent/participant data for consistent coloring
  participants?: Array<{
    id: string;
    name: string;
    type: 'user' | 'ai_agent';
    color?: string;
  }>;
}

// Thread message component with drag & drop
const ThreadMessageItem: React.FC<{
  message: ThreadMessage;
  participants?: Array<{ id: string; name: string; type: string; color?: string }>;
  onAgentInteraction?: (agentId: string, messageId: string, action: string) => void;
}> = ({ message, participants, onAgentInteraction }) => {
  const theme = useTheme();
  
  // Find participant data for consistent coloring
  const participant = participants?.find(p => p.id === message.senderId);
  const messageColor = participant?.color || getDefaultColor(message.senderId);
  
  // Add drop functionality to thread messages
  const { dropRef, isOver, canDrop, dropHandlers } = useMessageDropTarget(
    `thread-message-${message.id}`,
    message,
    (source, context) => {
      console.log('🎯 [ThreadMessage] Agent dropped on thread message:', { source, context, messageId: message.id });
      
      const agentId = source.data?.agentId || source.id.replace('agent-', '');
      if (onAgentInteraction) {
        onAgentInteraction(agentId, message.id, 'behavioral_prompt');
      }
    }
  );

  return (
    <Box 
      ref={dropRef}
      {...dropHandlers}
      sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 2, 
        p: 1,
        borderRadius: 1,
        transition: 'all 0.2s ease',
        bgcolor: isOver && canDrop ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: isOver && canDrop ? '2px dashed rgba(59, 130, 246, 0.5)' : '2px solid transparent',
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        }
      }}
    >
      <Avatar 
        sx={{ 
          width: 28, 
          height: 28, 
          bgcolor: messageColor,
          fontSize: '12px',
          fontWeight: 600,
          border: `2px solid ${messageColor}20`
        }}
      >
        {message.senderName.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              fontSize: '13px',
              color: messageColor
            }}
          >
            {message.senderName}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '11px' }}>
            {formatMessageTime(message.timestamp)}
          </Typography>
          {message.senderType === 'ai_agent' && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '10px',
                bgcolor: `${messageColor}20`,
                color: messageColor,
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontWeight: 500
              }}
            >
              AI
            </Typography>
          )}
        </Box>
        <Typography variant="body2" sx={{ fontSize: '13px', lineHeight: 1.4 }}>
          {message.content}
        </Typography>
      </Box>
    </Box>
  );
};

// Utility function for default colors
const getDefaultColor = (senderId: string): string => {
  const colors = [
    '#f97316', '#3b82f6', '#10b981', '#8b5cf6', 
    '#ef4444', '#f59e0b', '#06b6d4', '#ec4899',
    '#6366f1', '#84cc16', '#f43f5e', '#14b8a6'
  ];
  const index = senderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

const formatMessageTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const ThreadView: React.FC<ThreadViewProps> = ({
  threadId,
  parentMessage,
  currentUserId,
  currentUserName,
  onClose,
  onReplyAdded,
  onAgentInteraction,
  participants
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [threadData, setThreadData] = useState<ThreadSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);

  // Get parent message color
  const parentParticipant = participants?.find(p => p.name === parentMessage.sender);
  const parentMessageColor = parentMessage.senderColor || parentParticipant?.color || getDefaultColor(parentMessage.sender);

  // Check if thread can be resolved (active status and user has permission)
  const canResolveThread = threadData?.thread.status === 'active' && threadData?.thread.participants.includes(currentUserId);

  // Subscribe to thread updates
  useEffect(() => {
    console.log('🧵 [ThreadView] Subscribing to thread:', threadId);
    
    const unsubscribe = ThreadService.subscribeToThread(threadId, (data) => {
      console.log('🔔 [ThreadView] Thread update received:', data);
      setThreadData(data);
      setLoading(false);
      
      if (!data) {
        setError('Thread not found');
      }
    });

    return () => {
      console.log('🔕 [ThreadView] Unsubscribing from thread:', threadId);
      unsubscribe();
    };
  }, [threadId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadData?.messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const request: AddThreadReplyRequest = {
        threadId,
        reply: {
          content: replyText.trim(),
          senderId: currentUserId,
          senderName: currentUserName,
          senderType: 'user'
        }
      };

      await ThreadService.addReply(request);
      setReplyText('');
      
      // Notify parent component
      if (onReplyAdded && threadData?.messages) {
        const newReply: ThreadMessage = {
          id: `temp-${Date.now()}`,
          content: replyText.trim(),
          senderId: currentUserId,
          senderName: currentUserName,
          senderType: 'user',
          timestamp: new Date()
        };
        onReplyAdded(newReply);
      }

    } catch (error) {
      console.error('❌ [ThreadView] Error sending reply:', error);
      setError('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Handle thread resolution
  const handleResolveThread = async (request: ResolveThreadRequest) => {
    console.log('🎯 [ThreadView] Resolving thread:', request);
    
    try {
      await ThreadService.resolveThread(request);
      console.log('✅ [ThreadView] Thread resolved successfully');
      
      // Close resolution dialog
      setResolutionDialogOpen(false);
      
      // Optionally close thread view after resolution
      // onClose();
      
    } catch (error) {
      console.error('❌ [ThreadView] Error resolving thread:', error);
      throw error; // Let the dialog handle the error display
    }
  };

  if (loading) {
    return (
      <Paper
        sx={{
          width: 400,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isDarkMode ? '#1e293b' : '#ffffff',
          borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
          Loading thread...
        </Typography>
      </Paper>
    );
  }

  if (error || !threadData) {
    return (
      <Paper
        sx={{
          width: 400,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: isDarkMode ? '#1e293b' : '#ffffff',
          borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Thread</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="error">{error || 'Thread not found'}</Alert>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        width: 400,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDarkMode ? '#1e293b' : '#ffffff',
        borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ForumIcon sx={{ color: '#3b82f6', fontSize: '20px' }} />
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
            Thread
          </Typography>
          {threadData?.thread.status && threadData.thread.status !== 'active' && (
            <Chip
              label={threadData.thread.status}
              size="small"
              sx={{
                bgcolor: threadData.thread.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                color: threadData.thread.status === 'resolved' ? '#10b981' : '#6b7280',
                fontSize: '11px',
                height: 20
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {canResolveThread && (
            <Button
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => setResolutionDialogOpen(true)}
              sx={{
                color: '#10b981',
                borderColor: '#10b981',
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  borderColor: '#10b981'
                }
              }}
              variant="outlined"
            >
              Resolve
            </Button>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Parent Message */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: parentMessageColor,
              fontSize: '14px',
              fontWeight: 600,
              border: `2px solid ${parentMessageColor}20`
            }}
          >
            {parentMessage.sender.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '14px',
                  color: parentMessageColor
                }}
              >
                {parentMessage.sender}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '12px' }}>
                {parentMessage.timestamp}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontSize: '14px', lineHeight: 1.4 }}>
              {parentMessage.content}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Thread Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {threadData.messages.map((message) => (
          <ThreadMessageItem
            key={message.id}
            message={message}
            participants={participants}
            onAgentInteraction={onAgentInteraction}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Input */}
      <Box sx={{ p: 2, borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Reply to thread..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '14px',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              }
            }}
          />
          <IconButton
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
            sx={{
              bgcolor: '#3b82f6',
              color: 'white',
              '&:hover': {
                bgcolor: '#2563eb',
              },
              '&:disabled': {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: theme.palette.text.disabled,
              }
            }}
          >
            {sending ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Thread Resolution Dialog */}
      <ThreadResolutionDialog
        open={resolutionDialogOpen}
        onClose={() => setResolutionDialogOpen(false)}
        threadId={threadId}
        threadMessages={threadData?.messages || []}
        currentUserId={currentUserId}
        onResolve={handleResolveThread}
      />
    </Paper>
  );
};

export default ThreadView;

