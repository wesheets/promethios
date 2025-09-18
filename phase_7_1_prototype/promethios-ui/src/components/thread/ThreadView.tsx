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
import EnhancedThreadService from '../../services/EnhancedThreadService';
import { useMessageDropTarget } from '../../hooks/useDragDrop';
import ThreadResolutionDialog from './ThreadResolutionDialog';
import AgentAvatarSelector from '../AgentAvatarSelector';

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
  onScrollToMessage?: (messageId: string) => void; // New prop for scrolling to original message
  // Agent/participant data for consistent coloring
  participants?: Array<{
    id: string;
    name: string;
    type: 'user' | 'ai_agent';
    color?: string;
  }>;
  // Agent selection for thread input
  availableAgents?: Array<{
    id: string;
    name: string;
    avatar?: string;
    color?: string;
  }>;
  selectedAgents?: Array<{
    id: string;
    name: string;
    avatar?: string;
    color?: string;
  }>;
  onAgentSelectionChange?: (agents: Array<{ id: string; name: string; avatar?: string; color?: string; }>) => void;
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
        bgcolor: isOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: isOver ? '2px dashed #3b82f6' : '2px solid transparent',
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: messageColor,
          fontSize: '0.8rem',
          mt: 0.5
        }}
      >
        {message.senderName?.charAt(0) || 'U'}
      </Avatar>

      {/* Message content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: messageColor }}>
            {message.senderName || 'Unknown'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: '#e2e8f0', lineHeight: 1.5 }}>
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
  onScrollToMessage,
  participants,
  availableAgents = [],
  selectedAgents = [],
  onAgentSelectionChange
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

  // Check if current user can resolve thread (thread starter or admin)
  const canResolveThread = threadData?.thread.starterId === currentUserId || 
                          participants?.find(p => p.id === currentUserId)?.type === 'admin';

  // State for multi-agent coordination
  const [agentThinkingStates, setAgentThinkingStates] = useState<{[agentId: string]: boolean}>({});
  const [behaviorPromptActive, setBehaviorPromptActive] = useState<{
    agentId: string;
    behavior: string;
    timestamp: number;
  } | null>(null);

  // Handle agent thinking indicators
  const setAgentThinking = (agentId: string, isThinking: boolean) => {
    setAgentThinkingStates(prev => ({
      ...prev,
      [agentId]: isThinking
    }));
  };

  // Clear thinking indicators after timeout
  useEffect(() => {
    const activeThinkingAgents = Object.entries(agentThinkingStates)
      .filter(([_, isThinking]) => isThinking)
      .map(([agentId]) => agentId);

    if (activeThinkingAgents.length > 0) {
      const timeout = setTimeout(() => {
        setAgentThinkingStates(prev => {
          const updated = { ...prev };
          activeThinkingAgents.forEach(agentId => {
            updated[agentId] = false;
          });
          return updated;
        });
      }, 30000); // Clear after 30 seconds

      return () => clearTimeout(timeout);
    }
  }, [agentThinkingStates]);  // Subscribe to thread updates with real-time synchronization
  useEffect(() => {
    if (!threadId) return;

    console.log('🔄 [ThreadView] Setting up real-time subscription for thread:', threadId);

    // Use EnhancedThreadService for real-time updates
    const unsubscribe = EnhancedThreadService.subscribeToThread(
      threadId,
      (subscription: ThreadSubscription) => {
        console.log('📡 [ThreadView] Received real-time thread update:', {
          threadId,
          messageCount: subscription.messages.length,
          replyCount: subscription.thread.replyCount
        });

        setThreadData(subscription);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔌 [ThreadView] Unsubscribing from thread:', threadId);
      unsubscribe();
    };
  }, [threadId]);  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadData?.messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      // Use EnhancedThreadService for complete agent functionality
      const responses = await EnhancedThreadService.sendThreadMessage({
        threadId,
        message: replyText.trim(),
        targetAgentIds: selectedAgents.map(agent => agent.id),
        senderId: currentUserId,
        senderName: currentUserName
      });

      console.log('✅ [ThreadView] Message sent successfully, agent responses:', responses.length);

      // Clear the input
      setReplyText('');

      // Notify parent component if callback provided
      if (onReplyAdded) {
        // Create a ThreadMessage object for the callback
        const replyMessage: ThreadMessage = {
          id: `temp_${Date.now()}`, // Temporary ID
          content: replyText.trim(),
          senderId: currentUserId,
          senderName: currentUserName,
          senderType: 'user',
          timestamp: new Date(),
          attachments: []
        };
        onReplyAdded(replyMessage);
      }

      // Log agent responses
      responses.forEach(response => {
        console.log(`🤖 [ThreadView] Agent ${response.agentName} responded:`, response.content.substring(0, 100) + '...');
      });

    } catch (error) {
      console.error('❌ [ThreadView] Error sending reply:', error);
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

  // Handle behavioral prompts (drag & drop functionality) with thinking indicators
  const handleBehaviorPrompt = async (
    agentId: string, 
    agentName: string, 
    behavior: string, 
    targetMessageId?: string
  ) => {
    console.log('🎭 [ThreadView] Handling behavioral prompt:', { agentId, agentName, behavior, targetMessageId });

    try {
      // Set thinking indicator
      setAgentThinking(agentId, true);
      
      // Set behavior prompt active state
      setBehaviorPromptActive({
        agentId,
        behavior,
        timestamp: Date.now()
      });

      const response = await EnhancedThreadService.handleBehavioralPrompt({
        threadId,
        agentId,
        agentName,
        behaviorType: behavior,
        targetMessageId,
        senderId: currentUserId,
        senderName: currentUserName
      });

      if (response) {
        console.log('✅ [ThreadView] Behavioral prompt response:', response.content.substring(0, 100) + '...');
      }
    } catch (error) {
      console.error('❌ [ThreadView] Error handling behavioral prompt:', error);
    } finally {
      // Clear thinking indicator
      setAgentThinking(agentId, false);
      setBehaviorPromptActive(null);
    }
  };

  // Handle agent drop on thread messages
  const handleAgentDrop = (agentId: string, agentName: string, targetMessageId: string) => {
    console.log('🖱️ [ThreadView] Agent dropped on message:', { agentId, agentName, targetMessageId });
    
    // Trigger a generic response behavior when agent is dropped
    handleBehaviorPrompt(agentId, agentName, 'analyze', targetMessageId);
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
          width: 500,
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
          width: 500,
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
        width: 500,
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

      {/* Original Message with Thread Attribution */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        {/* Original Message */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: 2, 
            mb: 2,
            cursor: onScrollToMessage ? 'pointer' : 'default',
            borderRadius: 1,
            p: 1,
            mx: -1,
            '&:hover': onScrollToMessage ? {
              bgcolor: isDarkMode ? '#334155' : '#f1f5f9',
              transition: 'background-color 0.2s ease'
            } : {}
          }}
          onClick={() => onScrollToMessage?.(parentMessage.id)}
        >
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: parentMessageColor,
              fontSize: '16px',
              fontWeight: 600,
              border: `2px solid ${parentMessageColor}20`
            }}
          >
            {parentMessage.sender.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '15px',
                  color: parentMessageColor
                }}
              >
                {parentMessage.sender}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '12px' }}>
                {typeof parentMessage.timestamp === 'string' 
                  ? parentMessage.timestamp 
                  : new Date(parentMessage.timestamp).toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontSize: '15px', lineHeight: 1.5, color: theme.palette.text.primary }}>
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
            onAgentDrop={handleAgentDrop}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Enhanced Reply Input with Agent Selector */}
      <Box sx={{ p: 2, borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          alignItems: 'flex-end',
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: 2,
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          p: 1
        }}>
          {/* Agent Avatar Selector for Thread */}
          {availableAgents.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flexShrink: 0,
              mr: 1
            }}>
              <AgentAvatarSelector
                hostAgent={null}
                availableAgents={availableAgents}
                selectedAgents={selectedAgents}
                onSelectionChange={onAgentSelectionChange || (() => {})}
                maxVisible={3}
                size="small"
                showLabels={false}
                variant="compact"
                sx={{
                  '& .MuiAvatar-root': {
                    width: 28,
                    height: 28,
                    fontSize: '12px'
                  }
                }}
              />
            </Box>
          )}
          
          {/* Text Input */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Reply to thread..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '14px',
                '& .MuiInputBase-input': {
                  padding: '8px 0',
                  '&::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 0.7
                  }
                }
              }
            }}
          />
          
          {/* Send Button */}
          <IconButton
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
            sx={{
              bgcolor: '#3b82f6',
              color: 'white',
              width: 32,
              height: 32,
              '&:hover': {
                bgcolor: '#2563eb',
              },
              '&:disabled': {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: theme.palette.text.disabled,
              }
            }}
          >
            {sending ? <CircularProgress size={16} /> : <SendIcon sx={{ fontSize: '16px' }} />}
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

