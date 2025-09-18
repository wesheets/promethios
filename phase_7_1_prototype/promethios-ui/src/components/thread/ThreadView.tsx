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
  Stack,
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
import ColorCodedChatMessage from '../chat/ColorCodedChatMessage';

// Import the getParticipantColor function from main chat
const getParticipantColor = (participantId: string, type: 'ai' | 'human'): string => {
  // Hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < participantId.length; i++) {
    const char = participantId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Color palettes for different types
  const aiColors = [
    '#f97316', '#3b82f6', '#10b981', '#8b5cf6', 
    '#ef4444', '#f59e0b', '#06b6d4', '#ec4899',
    '#6366f1', '#84cc16', '#f43f5e', '#14b8a6'
  ];
  
  const humanColors = [
    '#64748b', '#6b7280', '#78716c', '#71717a',
    '#737373', '#525252', '#404040', '#262626'
  ];
  
  const colors = type === 'ai' ? aiColors : humanColors;
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
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
  // Additional props needed for exact main chat formatting
  selectedChatbot?: any;
  user?: any;
}

// Thread message component using exact same rendering as main chat
const ThreadMessageItem: React.FC<{
  message: ThreadMessage;
  participants?: Array<{ id: string; name: string; type: string; color?: string }>;
  onAgentInteraction?: (agentId: string, messageId: string, action: string) => void;
  currentUserId?: string;
  selectedChatbot?: any;
  user?: any;
}> = ({ message, participants, onAgentInteraction, currentUserId, selectedChatbot, user }) => {
  const theme = useTheme();
  
  // Use exact same logic as main chat for sender identification
  const isUser = message.senderId === currentUserId || message.senderType === 'user';
  const isAgent = !isUser;
  
  // Get sender details with improved agent identification (copied from main chat)
  const senderId = isUser 
    ? (currentUserId || 'current-user')
    : (() => {
        // First try metadata
        if (message.metadata?.agentId) {
          return message.metadata.agentId;
        }
        
        // Try to identify agent from message content
        const content = message.content.toLowerCase();
        if (content.includes("i'm mark the claude") || content.includes("mark the claude")) {
          return 'mark-the-claude';
        }
        
        // Fallback to selected chatbot
        return selectedChatbot?.identity?.id || selectedChatbot?.id || 'unknown-agent';
      })();
  
  const senderName = isUser
    ? (user?.displayName || user?.email || 'You')
    : (() => {
        // First try metadata
        if (message.metadata?.agentName) {
          return message.metadata.agentName;
        }
        
        // Try to identify agent from message content
        const content = message.content.toLowerCase();
        if (content.includes("i'm mark the claude") || content.includes("mark the claude")) {
          return 'Mark the Claude';
        }
        
        // Fallback to selected chatbot
        return selectedChatbot?.identity?.name || selectedChatbot?.name || 'Assistant';
      })();
  
  const senderType: 'ai' | 'human' = isUser ? 'human' : 'ai';
  const senderColor = getParticipantColor(senderId, senderType);
  
  // Determine recipient for directional flow (copied from main chat)
  const getRecipient = () => {
    if (isUser) {
      // User message - recipient is the target agent(s)
      const hostAgent = selectedChatbot;
      if (hostAgent) {
        const recipientId = hostAgent.identity?.id || hostAgent.id || 'host-agent';
        return {
          id: recipientId,
          name: hostAgent.identity?.name || hostAgent.name || 'Assistant',
          type: 'ai' as const,
          avatar: hostAgent.identity?.avatar,
          color: getParticipantColor(recipientId, 'ai')
        };
      }
    } else {
      // Agent message - recipient is the user
      return {
        id: currentUserId || 'current-user',
        name: user?.displayName || user?.email || 'You',
        type: 'human' as const,
        avatar: user?.photoURL,
        color: getParticipantColor(currentUserId || 'current-user', 'human')
      };
    }
    return null;
  };
  
  // Create message object for ColorCodedChatMessage (exact same format as main chat)
  const colorCodedMessage = {
    id: message.id,
    content: message.content,
    timestamp: typeof message.timestamp === 'string' 
      ? message.timestamp 
      : new Date(message.timestamp).toLocaleString(),
    sender: {
      id: senderId,
      name: senderName,
      type: senderType,
      avatar: message.metadata?.avatar || (isUser ? user?.photoURL : selectedChatbot?.identity?.avatar)
    }
  };
  
  const recipient = getRecipient();
  
  return (
    <ColorCodedChatMessage
      message={colorCodedMessage}
      senderColor={senderColor}
      recipient={recipient}
      isCurrentUser={isUser}
      currentUserId={currentUserId}
      onAgentInteraction={onAgentInteraction}
      onStartThread={() => {}} // Disable nested threading
      onOpenThread={() => {}} // Disable nested threading
    />
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
  onAgentSelectionChange,
  selectedChatbot,
  user
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
      // Auto-include the original message sender if they're an AI agent
      let targetAgentIds = selectedAgents.map(agent => agent.id);
      
      // If the original message sender is an AI agent and not already selected, include them
      if (parentMessage.senderType === 'ai' || parentMessage.sender.includes('Assistant') || parentMessage.sender.includes('Claude')) {
        const originalSenderId = parentMessage.senderId || parentMessage.sender;
        if (!targetAgentIds.includes(originalSenderId)) {
          targetAgentIds.push(originalSenderId);
          console.log('🤖 [ThreadView] Auto-including original sender in thread response:', originalSenderId);
        }
      }

      // Use EnhancedThreadService for complete agent functionality
      const responses = await EnhancedThreadService.sendThreadMessage({
        threadId,
        message: replyText.trim(),
        targetAgentIds,
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
          width: 600,
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
          width: 600,
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
        width: 600,
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
      <Box sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, fontSize: '16px', fontWeight: 600 }}>
          Original Message
        </Typography>
        <Box sx={{ bgcolor: '#0f172a', borderRadius: 2, p: 1 }}>
          <ColorCodedChatMessage
            message={{
              id: parentMessage.id,
              content: parentMessage.content,
              timestamp: typeof parentMessage.timestamp === 'string' 
                ? parentMessage.timestamp 
                : new Date(parentMessage.timestamp).toLocaleTimeString(),
              sender: {
                id: parentMessage.senderId || parentMessage.sender,
                name: parentMessage.sender,
                type: parentMessage.senderType || 'ai',
                avatar: parentMessage.avatar
              }
            }}
            senderColor={parentMessageColor}
            recipient={null}
            isCurrentUser={false}
            currentUserId={currentUserId}
            onAgentInteraction={onAgentInteraction}
            onStartThread={() => {}} // Disable nested threading
            onOpenThread={() => {}} // Disable nested threading
            isInThread={true} // Add flag to indicate this is in a thread
            truncateContent={true} // Add flag to truncate content
          />
        </Box>
      </Box>

      {/* Thread Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1, bgcolor: '#0f172a' }}>
        <Stack 
          spacing={3}
          sx={{
            display: 'flex',
            flexDirection: 'column-reverse', // Reverse direction for bottom-up flow
            justifyContent: 'flex-start', // Start from bottom
            minHeight: '100%',
            paddingBottom: 2
          }}
        >
          {[...threadData.messages].reverse().map((message) => (
            <ThreadMessageItem
              key={message.id}
              message={message}
              onAgentInteraction={onAgentInteraction}
              currentUserId={currentUserId}
              selectedChatbot={selectedChatbot}
              user={user}
            />
          ))}
        </Stack>
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

