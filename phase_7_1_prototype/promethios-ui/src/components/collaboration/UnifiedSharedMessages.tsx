/**
 * UnifiedSharedMessages - Handles both old SharedConversation and new unified guest access
 * Provides seamless transition between the two systems
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  IconButton,
  Stack
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  Edit as TypingIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { chatHistoryService, ChatSession } from '../../services/ChatHistoryService';
import { ChatMessage } from '../../services/ChatStorageService';
import SharedConversationService from '../../services/SharedConversationService';
import UnifiedGuestChatService, { GuestConversationAccess } from '../../services/UnifiedGuestChatService';
import MarkdownRenderer from '../MarkdownRenderer';
import AttachmentRenderer from '../AttachmentRenderer';
import ColorCodedChatMessage from '../chat/ColorCodedChatMessage';
import { useThreads } from '../../contexts/ThreadContext';
import ThreadView from '../thread/ThreadView';

interface UnifiedSharedMessagesProps {
  conversationId: string;
  currentUserId: string;
  onSendMessage?: (message: string) => void;
  // New props for unified approach
  guestAccess?: GuestConversationAccess;
  isUnifiedMode?: boolean;
  // Hide the input bar for guest users (they should use the main input at bottom)
  hideInputBar?: boolean;
}

const UnifiedSharedMessages: React.FC<UnifiedSharedMessagesProps> = ({
  conversationId,
  currentUserId,
  onSendMessage,
  guestAccess,
  isUnifiedMode = false,
  hideInputBar = false
}) => {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sharedConversation, setSharedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Thread state
  const [threadViewOpen, setThreadViewOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadParentMessage, setActiveThreadParentMessage] = useState<ChatMessage | null>(null);
  
  const sharedConversationService = SharedConversationService.getInstance();
  const unifiedGuestChatService = UnifiedGuestChatService.getInstance();
  
  // Thread context
  const { createThread, openThread, closeThread } = useThreads();

  // Load chat session and messages
  useEffect(() => {
    const loadChatSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 [UnifiedSharedMessages] Loading conversation:', {
          conversationId,
          isUnifiedMode,
          guestAccess: guestAccess?.id
        });
        
        if (isUnifiedMode && guestAccess) {
          // New unified approach - directly access host's conversation
          console.log('🔍 [UnifiedSharedMessages] Using unified mode for guest access');
          
          const hostSession = await unifiedGuestChatService.getHostChatSession(
            guestAccess.hostUserId,
            guestAccess.conversationId
          );
          
          if (hostSession) {
            console.log('✅ [UnifiedSharedMessages] Loaded host session via unified approach:', hostSession.name);
            setChatSession(hostSession);
            setMessages(hostSession.messages || []);
          } else {
            console.error('❌ [UnifiedSharedMessages] Could not load host session');
            setError('Could not access the shared conversation');
          }
          
        } else {
          // Old shared conversation approach (for backward compatibility)
          console.log('🔍 [UnifiedSharedMessages] Using legacy shared conversation mode');
          
          const hostChatSessionId = await sharedConversationService.getHostChatSessionId(conversationId);
          
          if (!hostChatSessionId) {
            console.error('❌ [UnifiedSharedMessages] Could not find host chat session ID');
            setError('Could not find the original conversation');
            return;
          }
          
          // Load the shared conversation data
          const sharedConv = await sharedConversationService.getSharedConversation(conversationId);
          if (sharedConv) {
            setSharedConversation(sharedConv);
          }
          
          // Load the host's chat session
          const session = await chatHistoryService.getChatSessionById(hostChatSessionId);
          
          if (session) {
            console.log('✅ [UnifiedSharedMessages] Loaded host session via legacy approach:', session.name);
            setChatSession(session);
            setMessages(session.messages || []);
          } else {
            setError('Original conversation not found');
          }
        }
        
      } catch (error) {
        console.error('❌ [UnifiedSharedMessages] Error loading chat session:', error);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadChatSession();
  }, [conversationId, isUnifiedMode, guestAccess]);

  // Set up real-time message listener
  useEffect(() => {
    if (!chatSession?.id) return;
    
    console.log('🔍 [UnifiedSharedMessages] Setting up real-time listener for session:', chatSession.id);
    
    let unsubscribe: (() => void) | undefined;
    
    if (isUnifiedMode && guestAccess) {
      // Unified mode: Messages are loaded initially, no real-time listener needed for now
      console.log('🔍 [UnifiedSharedMessages] Unified mode: Using initial message load (no real-time listener)');
      // TODO: Implement proper real-time listener for unified mode if needed
    } else {
      // Use legacy chat history service
      unsubscribe = chatHistoryService.subscribeToSession(chatSession.id, (session) => {
        if (session?.messages) {
          console.log('🔄 [UnifiedSharedMessages] Messages updated via legacy listener:', session.messages.length);
          setMessages(session.messages);
        }
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatSession?.id, isUnifiedMode, guestAccess]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Presence tracking for smart notifications
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    
    console.log('👁️ [UnifiedSharedMessages] Starting presence tracking for conversation:', {
      conversationId,
      currentUserId
    });
    
    // Mark user as viewing this conversation
    sharedConversationService.markUserAsViewing(conversationId, currentUserId);
    
    // Set up heartbeat to maintain presence
    const heartbeatInterval = setInterval(() => {
      sharedConversationService.updatePresenceHeartbeat(conversationId, currentUserId);
    }, 15000); // Update every 15 seconds
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ [UnifiedSharedMessages] Page hidden - stopping presence tracking');
        sharedConversationService.markUserAsNotViewing(conversationId, currentUserId);
      } else {
        console.log('👁️ [UnifiedSharedMessages] Page visible - resuming presence tracking');
        sharedConversationService.markUserAsViewing(conversationId, currentUserId);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      console.log('👁️ [UnifiedSharedMessages] Cleaning up presence tracking');
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sharedConversationService.markUserAsNotViewing(conversationId, currentUserId);
    };
  }, [conversationId, currentUserId]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;
    
    try {
      setSending(true);
      
      if (isUnifiedMode && guestAccess) {
        // Send message via unified guest chat service
        await unifiedGuestChatService.sendMessageToHostConversation(
          guestAccess.hostUserId,
          guestAccess.conversationId,
          currentUserId,
          'Guest User', // TODO: Get actual user name
          messageInput.trim()
        );
      } else {
        // Send message via legacy shared conversation service
        if (onSendMessage) {
          await onSendMessage(messageInput.trim());
        }
      }
      
      setMessageInput('');
      console.log('✅ [UnifiedSharedMessages] Message sent successfully');
      
    } catch (error) {
      console.error('❌ [UnifiedSharedMessages] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Thread handler functions (copied from ChatbotProfilesPageEnhanced)
  const handleStartThread = async (messageId: string) => {
    console.log('🧵 [UnifiedSharedMessages] Starting thread for message:', messageId);
    console.log('🧵 [UnifiedSharedMessages] conversationId:', conversationId);
    console.log('🧵 [UnifiedSharedMessages] currentUserId:', currentUserId);
    
    // Find the parent message from messages
    const parentMessage = messages.find(msg => msg.id === messageId);
    console.log('🧵 [UnifiedSharedMessages] Found parent message:', parentMessage);
    
    // Validate parameters before creating thread
    if (!messageId) {
      console.error('❌ [UnifiedSharedMessages] messageId is required');
      return;
    }
    
    if (!conversationId) {
      console.error('❌ [UnifiedSharedMessages] conversationId is required');
      return;
    }
    
    if (!currentUserId) {
      console.error('❌ [UnifiedSharedMessages] currentUserId is required');
      return;
    }
    
    try {
      // Create thread with a placeholder initial reply
      const initialReply = `Starting a discussion about this message.`;
      
      const threadId = await createThread({
        parentMessageId: messageId,
        conversationId: conversationId,
        initialReply: {
          content: initialReply,
          senderId: currentUserId,
          senderName: 'Guest User', // TODO: Get actual user name
          senderType: 'user'
        }
      });

      console.log('✅ [UnifiedSharedMessages] Thread created successfully:', threadId);

      // Store the parent message for the thread
      setActiveThreadParentMessage(parentMessage);
      
      // Open the newly created thread
      setActiveThreadId(threadId);
      setThreadViewOpen(true);
      
    } catch (error) {
      console.error('❌ [UnifiedSharedMessages] Error starting thread:', error);
    }
  };

  const handleOpenThread = (threadId: string) => {
    console.log('📂 [UnifiedSharedMessages] Opening thread:', threadId);
    setActiveThreadId(threadId);
    setThreadViewOpen(true);
    openThread(threadId);
  };

  const handleCloseThread = () => {
    console.log('❌ [UnifiedSharedMessages] Closing thread view');
    setThreadViewOpen(false);
    if (activeThreadId) {
      closeThread(activeThreadId);
      setActiveThreadId(null);
      setActiveThreadParentMessage(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Typography variant="h6" sx={{ color: '#f1f5f9' }}>
          {isUnifiedMode && guestAccess 
            ? `${guestAccess.conversationName} (with ${guestAccess.hostUserName})`
            : chatSession?.name || 'Shared Conversation'
          }
        </Typography>
        {isUnifiedMode && (
          <Chip 
            label="Unified Mode" 
            size="small" 
            sx={{ mt: 1, bgcolor: '#10b981', color: 'white' }} 
          />
        )}
      </Box>

      {/* Messages - Using Enhanced ColorCodedChatMessage System */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {messages.map((message, index) => {
            // Get participant color helper function (copied from ChatbotProfilesPageEnhanced)
            const getParticipantColor = (participantId: string, type: 'human' | 'ai') => {
              const colors = {
                human: ['#64748b', '#6b7280', '#71717a', '#737373'],
                ai: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#84cc16']
              };
              
              const colorArray = colors[type];
              const hash = participantId.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0);
              
              return colorArray[Math.abs(hash) % colorArray.length];
            };

            // Determine sender info for shared conversation context
            const getSenderInfo = () => {
              const isUser = message.sender === 'user';
              const isSystem = message.sender === 'system';
              
              if (isSystem) {
                return {
                  id: 'system',
                  name: 'System',
                  type: 'ai' as const,
                  avatar: undefined
                };
              }
              
              if (isUser) {
                // For user messages, use metadata if available
                const userName = message.metadata?.userName || 'User';
                const userId = message.metadata?.userId || currentUserId;
                const isGuest = message.metadata?.isGuestMessage || false;
                
                return {
                  id: userId,
                  name: isGuest ? `${userName} (Guest)` : userName,
                  type: 'human' as const,
                  avatar: message.metadata?.userAvatar
                };
              } else {
                // For AI messages, use session or conversation info
                const agentId = chatSession?.agentId || 'ai-assistant';
                const agentName = chatSession?.agentName || 'AI Assistant';
                
                return {
                  id: agentId,
                  name: agentName,
                  type: 'ai' as const,
                  avatar: chatSession?.agentAvatar
                };
              }
            };

            const senderInfo = getSenderInfo();
            const senderColor = getParticipantColor(senderInfo.id, senderInfo.type);
            
            // Determine recipient for directional flow (copied from ChatbotProfilesPageEnhanced)
            const getRecipient = () => {
              const isUser = message.sender === 'user';
              
              if (isUser) {
                // User message - recipient is the target agent(s)
                // Use the host agent from the chat session
                if (chatSession?.agentId) {
                  const agentId = chatSession.agentId;
                  const agentName = chatSession.agentName || 'AI Assistant';
                  
                  return {
                    id: agentId,
                    name: agentName,
                    type: 'ai' as const,
                    avatar: chatSession.agentAvatar,
                    color: getParticipantColor(agentId, 'ai')
                  };
                }
              } else {
                // Agent message - recipient is the user (or guest user)
                const isGuestMessage = message.metadata?.isGuestMessage;
                const userName = message.metadata?.userName || 'User';
                const userId = message.metadata?.userId || currentUserId;
                
                return {
                  id: userId,
                  name: isGuestMessage ? `${userName} (Guest)` : userName,
                  type: 'human' as const,
                  avatar: message.metadata?.userAvatar,
                  color: getParticipantColor(userId, 'human')
                };
              }
              return null;
            };

            const recipient = getRecipient();
            
            // Format timestamp
            const formatTimestamp = () => {
              try {
                if (message.timestamp) {
                  const timestamp = message.timestamp instanceof Date 
                    ? message.timestamp 
                    : new Date(message.timestamp);
                  return timestamp.toLocaleTimeString();
                } else {
                  return 'Now';
                }
              } catch (error) {
                console.error('❌ [UnifiedSharedMessages] Error formatting timestamp:', error);
                return 'Invalid time';
              }
            };

            // Extract content
            const getMessageContent = () => {
              let content = message.content;
              
              // If content is an object, try to extract the actual text
              if (typeof content === 'object' && content !== null) {
                if (content.content) {
                  content = content.content;
                } else if (content.text) {
                  content = content.text;
                } else if (content.message) {
                  content = content.message;
                } else {
                  content = JSON.stringify(content);
                }
              }
              
              return String(content || '');
            };

            // Create message object for ColorCodedChatMessage (same format as ChatbotProfilesPageEnhanced)
            const colorCodedMessage = {
              id: message.id || `msg-${index}`,
              content: getMessageContent(),
              timestamp: formatTimestamp(),
              sender: senderInfo
            };

            return (
              <ColorCodedChatMessage
                key={message.id || index}
                message={colorCodedMessage}
                senderColor={senderColor}
                recipient={recipient}
                isCurrentUser={message.sender === 'user' && senderInfo.id === currentUserId}
                currentUserId={currentUserId}
                onStartThread={handleStartThread}
                onOpenThread={handleOpenThread}
              />
            );
          })}
        </Stack>
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input - Hidden for guest users */}
      {!hideInputBar && (
        <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1e293b',
                  '& fieldset': { borderColor: '#475569' },
                  '&:hover fieldset': { borderColor: '#64748b' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              sx={{ color: '#3b82f6' }}
            >
              {sending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Thread View */}
      {threadViewOpen && activeThreadId && (
        <ThreadView
          threadId={activeThreadId}
          parentMessage={activeThreadParentMessage}
          onClose={handleCloseThread}
          conversationId={conversationId}
          currentUserId={currentUserId}
        />
      )}
    </Box>
  );
};

export default UnifiedSharedMessages;

