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
  
  const sharedConversationService = SharedConversationService.getInstance();
  const unifiedGuestChatService = UnifiedGuestChatService.getInstance();

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

      {/* Messages - Using Host Chat Format */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {messages.map((message, index) => (
            <Box
              key={message.id || index}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  maxWidth: '75%',
                  textAlign: message.sender === 'user' ? 'right' : 'left'
                }}
              >
                {/* Message Header with User/Agent Info */}
                {message.metadata?.userName && (
                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {message.metadata.userName}
                      {message.metadata?.isGuestMessage && (
                        <Chip label="Guest" size="small" sx={{ ml: 1, bgcolor: '#059669', color: 'white', height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Typography>
                  </Box>
                )}
                
                {/* Message Content */}
                <MarkdownRenderer 
                  content={message.content}
                  sx={{ 
                    fontSize: '0.9rem',
                    mb: 0.5
                  }}
                />
                
                {/* Attachments Display */}
                {message.attachments && message.attachments.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {message.attachments.map((attachment, idx) => (
                      <AttachmentRenderer key={idx} attachment={attachment} />
                    ))}
                  </Box>
                )}
                
                {/* Timestamp */}
                <Typography variant="caption" sx={{ 
                  color: '#94a3b8', 
                  fontSize: '0.75rem'
                }}>
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'Now'}
                </Typography>
              </Box>
            </Box>
          ))}
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
    </Box>
  );
};

export default UnifiedSharedMessages;

