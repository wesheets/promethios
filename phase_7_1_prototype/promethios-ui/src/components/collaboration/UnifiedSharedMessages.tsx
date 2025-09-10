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
  IconButton
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
}

const UnifiedSharedMessages: React.FC<UnifiedSharedMessagesProps> = ({
  conversationId,
  currentUserId,
  onSendMessage,
  guestAccess,
  isUnifiedMode = false
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

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message, index) => (
          <Paper
            key={message.id || index}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: message.sender === 'user' ? '#1e293b' : '#0f172a',
              border: '1px solid #334155'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: message.sender === 'user' ? '#3b82f6' : '#8b5cf6' }}>
                {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  {message.metadata?.userName || (message.sender === 'user' ? 'User' : 'AI Assistant')}
                  {message.metadata?.isGuestMessage && (
                    <Chip label="Guest" size="small" sx={{ ml: 1, bgcolor: '#059669', color: 'white' }} />
                  )}
                </Typography>
                <MarkdownRenderer content={message.content} />
                {message.attachments && message.attachments.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {message.attachments.map((attachment, idx) => (
                      <AttachmentRenderer key={idx} attachment={attachment} />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
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
                color: '#f1f5f9',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
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
    </Box>
  );
};

export default UnifiedSharedMessages;

