import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Collapse
} from '@mui/material';
import {
  Chat as ChatIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { 
  ChatSession, 
  ChatMessage, 
  MessageAttachment, 
  ChatMode, 
  MessageType,
  MessageSender 
} from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { LiveActivityIndicator, LiveActivity, ActivityTemplates } from './LiveActivityIndicator';
import { ChatSessionRegistry } from '../services/ChatSessionRegistry';
import { MessageService } from '../services/MessageService';
import { GovernanceMonitoringService } from '../services/GovernanceMonitoringService';
import { ChatModeService } from '../services/ChatModeService';

interface ChatContainerProps {
  sessionId?: string;
  agentId?: string;
  systemId?: string;
  mode: ChatMode;
  userId: string;
  onSessionChange?: (session: ChatSession | null) => void;
  onModeChange?: (mode: ChatMode) => void;
  compact?: boolean;
  maxHeight?: string | number;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  sessionId,
  agentId,
  systemId,
  mode,
  userId,
  onSessionChange,
  onModeChange,
  compact = false,
  maxHeight = '600px'
}) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState<{isTyping: boolean; sender?: string}>({isTyping: false});
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Get mode configuration
  const modeConfig = ChatModeService.getModeConfig(mode);
  const showGovernance = mode === ChatMode.GOVERNANCE || mode === ChatMode.MULTI_AGENT;

  // Initialize or load session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        
        if (sessionId) {
          // Load existing session
          const existingSession = await ChatSessionRegistry.getSession(sessionId);
          if (existingSession) {
            setSession(existingSession);
            onSessionChange?.(existingSession);
            
            // Load messages
            const sessionMessages = await MessageService.getSessionMessages(sessionId);
            setMessages(sessionMessages);
          }
        } else {
          // Create new session
          const configuration = ChatModeService.getDefaultConfiguration(mode);
          const title = `${modeConfig.displayName} Chat - ${new Date().toLocaleString()}`;
          
          const newSessionId = await ChatSessionRegistry.createSession(
            userId,
            title,
            mode,
            configuration,
            agentId,
            systemId
          );
          
          const newSession = await ChatSessionRegistry.getSession(newSessionId);
          setSession(newSession);
          onSessionChange?.(newSession);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        setError('Failed to initialize chat session');
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [sessionId, agentId, systemId, mode, userId, onSessionChange, modeConfig.displayName]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!session) return;

    const unsubscribe = MessageService.subscribeToSessionMessages(
      session.id,
      (updatedMessages) => {
        setMessages(updatedMessages);
      }
    );

    return unsubscribe;
  }, [session]);

  // Add live activity
  const addLiveActivity = useCallback((activity: LiveActivity) => {
    setLiveActivities(prev => [...prev, activity]);
  }, []);

  // Remove live activity
  const removeLiveActivity = useCallback((activityId: string) => {
    setLiveActivities(prev => prev.filter(a => a.id !== activityId));
  }, []);

  // Simulate agent thinking and processing
  const simulateAgentProcessing = useCallback(async (content: string, attachments?: MessageAttachment[]) => {
    const agentName = systemId ? 'Multi-Agent System' : 'Agent';
    
    // Show thinking indicator
    const thinkingActivity = ActivityTemplates.agentThinking(
      agentName, 
      'Analyzing your request and formulating response...'
    );
    addLiveActivity(thinkingActivity);

    // Show typing indicator
    setTypingIndicator({ isTyping: true, sender: agentName });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    // If governance mode, show governance check
    if (showGovernance) {
      const governanceActivity = ActivityTemplates.governanceCheck(
        agentName,
        'content policy and compliance'
      );
      addLiveActivity(governanceActivity);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Complete governance check
      removeLiveActivity(governanceActivity.id);
    }

    // If there are attachments, show document analysis
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        const analysisActivity = ActivityTemplates.documentAnalysis(
          agentName,
          attachment.name,
          0
        );
        addLiveActivity(analysisActivity);

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          analysisActivity.progress = progress;
          setLiveActivities(prev => 
            prev.map(a => a.id === analysisActivity.id ? { ...analysisActivity } : a)
          );
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        removeLiveActivity(analysisActivity.id);
      }
    }

    // Remove thinking activity
    removeLiveActivity(thinkingActivity.id);
    setTypingIndicator({ isTyping: false });

    return agentName;
  }, [systemId, showGovernance, addLiveActivity, removeLiveActivity]);

  // Simulate Observer interjections
  const simulateObserverInterjection = useCallback(() => {
    const observerMessages = [
      'Monitoring conversation for compliance...',
      'All responses are within governance parameters',
      'Suggestion: Consider asking for more specific details',
      'Notice: Sensitive information detected in conversation',
      'Governance score: Excellent (95/100)'
    ];

    const randomMessage = observerMessages[Math.floor(Math.random() * observerMessages.length)];
    const observerActivity = ActivityTemplates.observerSuggestion(randomMessage);
    addLiveActivity(observerActivity);
  }, [addLiveActivity]);

  // Handle sending messages
  const handleSendMessage = async (content: string, attachments?: MessageAttachment[]) => {
    if (!session || sending) return;

    try {
      setSending(true);
      setError(null);

      // Send user message
      await MessageService.sendMessage(
        session.id,
        userId,
        content,
        MessageType.TEXT,
        attachments,
        undefined,
        agentId,
        systemId
      );

      // Simulate agent processing
      const agentName = await simulateAgentProcessing(content, attachments);

      // Generate mock agent response
      const mockResponse = `I understand your request: "${content}". ${
        attachments && attachments.length > 0 
          ? `I've analyzed the ${attachments.length} file(s) you provided. ` 
          : ''
      }Here's my response based on the current governance settings.`;

      // Evaluate governance if enabled
      let governanceMetrics;
      if (showGovernance) {
        const mockMessage: ChatMessage = {
          id: 'temp',
          sessionId: session.id,
          userId,
          content: mockResponse,
          type: MessageType.TEXT,
          sender: MessageSender.AGENT,
          timestamp: new Date()
        };
        governanceMetrics = await GovernanceMonitoringService.evaluateMessage(mockMessage, agentId, systemId);
      }

      // Add agent response
      await MessageService.addAgentResponse(
        session.id,
        userId,
        mockResponse,
        agentId,
        systemId,
        {
          responseTime: 1500 + Math.random() * 1000,
          tokenCount: Math.floor(50 + Math.random() * 200),
          cost: Math.random() * 0.01
        },
        governanceMetrics
      );

      // Update session activity
      await ChatSessionRegistry.updateSessionActivity(session.id, messages.length + 2);

      // Randomly trigger Observer interjection
      if (showGovernance && Math.random() > 0.7) {
        setTimeout(() => {
          simulateObserverInterjection();
        }, 2000 + Math.random() * 3000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    // This would typically be sent to other users in a real implementation
    console.log('User typing:', isTyping);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography>Loading chat...</Typography>
      </Box>
    );
  }

  if (!session) {
    return (
      <Alert severity="error">
        Failed to load chat session
      </Alert>
    );
  }

  return (
    <Paper
      elevation={compact ? 1 : 3}
      sx={{
        height: maxHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              bgcolor: modeConfig.color,
              borderRadius: '50%',
              p: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mode === ChatMode.STANDARD && <ChatIcon sx={{ color: 'white', fontSize: 20 }} />}
            {mode === ChatMode.GOVERNANCE && <SecurityIcon sx={{ color: 'white', fontSize: 20 }} />}
            {mode === ChatMode.MULTI_AGENT && <GroupIcon sx={{ color: 'white', fontSize: 20 }} />}
          </Box>
          
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              {modeConfig.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session.title}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showGovernance && (
            <Chip
              label="Governed"
              size="small"
              icon={<SecurityIcon />}
              sx={{ bgcolor: '#4CAF50', color: 'white' }}
            />
          )}
          
          <Tooltip title="Chat settings">
            <IconButton size="small" onClick={() => setShowSettings(!showSettings)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Settings Panel */}
      <Collapse in={showSettings}>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Chat Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={showGovernance}
                disabled={mode === ChatMode.MULTI_AGENT}
                size="small"
              />
            }
            label="Real-time governance monitoring"
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {modeConfig.description}
          </Typography>
        </Box>
      </Collapse>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Messages and Live Activities */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessageList
          messages={messages}
          loading={loading}
          showGovernance={showGovernance}
          typingIndicator={typingIndicator}
        />
        
        {/* Live Activities */}
        {liveActivities.length > 0 && (
          <Box sx={{ px: 2, pb: 1 }}>
            {liveActivities.map((activity) => (
              <LiveActivityIndicator
                key={activity.id}
                activity={activity}
                onDismiss={removeLiveActivity}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={sending}
        placeholder={ChatModeService.getModePlaceholder(mode)}
        allowFileUploads={session.configuration.allowFileUploads}
        allowedFileTypes={session.configuration.allowedFileTypes}
        maxFileSize={session.configuration.maxFileSize}
        userId={userId}
        sessionId={session.id}
      />
    </Paper>
  );
};

