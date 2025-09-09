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
import MarkdownRenderer from '../MarkdownRenderer';
import AttachmentRenderer from '../AttachmentRenderer';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface SharedConversationMessagesProps {
  conversationId: string;
  currentUserId: string;
  onSendMessage?: (message: string) => void;
}

const SharedConversationMessages: React.FC<SharedConversationMessagesProps> = ({
  conversationId,
  currentUserId,
  onSendMessage
}) => {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sharedConversation, setSharedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sharedConversationService = SharedConversationService.getInstance();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load chat session and messages
  useEffect(() => {
    const loadChatSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 [SharedConversationMessages] Loading shared conversation:', conversationId);
        console.log('🔍 [SharedConversationMessages] Current user ID:', currentUserId);
        
        // First, get the host's chat session ID from the shared conversation ID
        console.log('🔍 [SharedConversationMessages] Calling getHostChatSessionId for:', conversationId);
        const hostChatSessionId = await sharedConversationService.getHostChatSessionId(conversationId);
        
        console.log('🔍 [SharedConversationMessages] getHostChatSessionId result:', hostChatSessionId);
        console.log('🔍 [SharedConversationMessages] hostChatSessionId type:', typeof hostChatSessionId);
        console.log('🔍 [SharedConversationMessages] hostChatSessionId truthy:', !!hostChatSessionId);
        
        if (!hostChatSessionId) {
          console.error('❌ [SharedConversationMessages] Could not find host chat session ID for:', conversationId);
          console.error('❌ [SharedConversationMessages] This means the shared conversation lookup failed');
          console.error('❌ [SharedConversationMessages] Possible causes:');
          console.error('❌   1. Shared conversation does not exist in Firebase');
          console.error('❌   2. Permission denied accessing shared conversation');
          console.error('❌   3. Shared conversation service error');
          console.error('❌   4. Invalid conversation ID format');
          setError('Could not find the original conversation');
          return;
        }

        console.log('🔍 [SharedConversationMessages] Loading host chat session:', hostChatSessionId);
        
        // Load the shared conversation data to get host information
        const sharedConv = await sharedConversationService.getSharedConversation(conversationId);
        if (sharedConv) {
          console.log('✅ [SharedConversationMessages] Loaded shared conversation data:', sharedConv);
          setSharedConversation(sharedConv);
        }
        
        // Load the host's chat session
        const session = await chatHistoryService.getChatSessionById(hostChatSessionId);
        
        if (session) {
          console.log('✅ [SharedConversationMessages] Loaded host chat session:', session.name);
          setChatSession(session);
          setMessages(session.messages || []);
        } else {
          console.warn('⚠️ [SharedConversationMessages] Host chat session not found:', hostChatSessionId);
          setError('Original conversation not found');
        }
      } catch (err) {
        console.error('❌ [SharedConversationMessages] Error loading chat session:', err);
        setError('Failed to load chat messages');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      loadChatSession();
    }
  }, [conversationId, sharedConversationService]);

  // Real-time message listener
  useEffect(() => {
    if (!chatSession?.id) return;

    console.log('🔄 [SharedConversationMessages] Setting up real-time listener for chat session:', chatSession.id);

    // Set up Firebase listener for the chat session
    const unsubscribe = onSnapshot(
      doc(db, 'chats', `session_${chatSession.id}`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('🔄 [SharedConversationMessages] Real-time update received');
          
          // Update messages if they've changed
          if (data.messages && Array.isArray(data.messages)) {
            // Deserialize messages to ensure proper Date objects
            const deserializedMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            }));
            setMessages(deserializedMessages);
            console.log('✅ [SharedConversationMessages] Updated messages from real-time listener:', deserializedMessages.length);
          }
        }
      },
      (error) => {
        console.error('❌ [SharedConversationMessages] Real-time listener error:', error);
      }
    );

    return () => {
      console.log('🔄 [SharedConversationMessages] Cleaning up real-time listener');
      unsubscribe();
    };
  }, [chatSession?.id]);

  // Real-time typing indicators listener
  useEffect(() => {
    if (!conversationId) return;

    console.log('⌨️ [SharedConversationMessages] Setting up typing indicators for:', conversationId);

    // Set up Firebase listener for typing indicators
    const unsubscribe = onSnapshot(
      doc(db, 'shared_conversations_typing', conversationId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const currentlyTyping = new Set<string>();
          
          // Check who is currently typing (exclude current user)
          Object.entries(data).forEach(([userId, typingData]: [string, any]) => {
            if (userId !== currentUserId && typingData?.isTyping && 
                Date.now() - typingData.timestamp < 5000) { // 5 second timeout
              currentlyTyping.add(userId);
            }
          });
          
          setTypingUsers(currentlyTyping);
        }
      },
      (error) => {
        console.error('❌ [SharedConversationMessages] Typing indicators listener error:', error);
      }
    );

    return () => {
      console.log('⌨️ [SharedConversationMessages] Cleaning up typing indicators listener');
      unsubscribe();
    };
  }, [conversationId, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Helper function to get participant name for typing indicators
  const getParticipantName = (userId: string): string => {
    if (!sharedConversation?.participants) return 'Someone';
    
    const participant = sharedConversation.participants.find((p: any) => p.id === userId);
    return participant?.name || 'Someone';
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending || !onSendMessage) return;
    
    setSending(true);
    try {
      await onSendMessage(messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle key press for sending
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    
    // Get actual sender names for shared conversation context
    const getSenderName = () => {
      if (isSystem) return 'System';
      
      if (isUser) {
        // For user messages, check metadata first for shared conversation sender info
        if (message.metadata?.sharedConversationSender) {
          return message.metadata.sharedConversationSender.name;
        }
        
        // Fallback: look up the host user in shared conversation participants
        const hostUser = sharedConversation?.participants?.find(p => 
          p.type === 'human' && p.id === sharedConversation.createdBy
        );
        
        // If we found the host user and they have a proper name (not just an ID)
        if (hostUser?.name && hostUser.name !== `User ${hostUser.id}`) {
          return hostUser.name;
        }
        
        // Final fallback: use a generic host label
        return 'Host User';
      } else {
        // For AI messages, show the actual agent name
        return chatSession?.agentName || sharedConversation?.agentName || 'AI Assistant';
      }
    };
    
    return (
      <Box
        key={`${message.id || index}-${message.timestamp}`}
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          mb: 2,
          alignItems: 'flex-start'
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            mx: 1,
            bgcolor: isUser ? '#2563eb' : isSystem ? '#64748b' : '#16a34a'
          }}
        >
          {isUser ? <PersonIcon /> : <BotIcon />}
        </Avatar>
        
        <Paper
          elevation={1}
          sx={{
            maxWidth: '70%',
            p: 2,
            bgcolor: isUser ? '#1e40af' : isSystem ? '#374151' : '#1e293b',
            color: '#ffffff',
            borderRadius: 2,
            '& .markdown-content': {
              color: '#ffffff'
            }
          }}
        >
          {/* Message header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', mr: 1 }}>
              {getSenderName()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {(() => {
                try {
                  const timestamp = message.timestamp;
                  if (timestamp instanceof Date) {
                    return timestamp.toLocaleTimeString();
                  } else if (typeof timestamp === 'string') {
                    return new Date(timestamp).toLocaleTimeString();
                  } else {
                    return 'Unknown time';
                  }
                } catch (error) {
                  console.error('❌ [SharedConversationMessages] Error formatting timestamp:', error);
                  return 'Invalid time';
                }
              })()}
            </Typography>
          </Box>
          
          {/* Message content */}
          <Box>
            {message.content && (
              <>
                {/* Enhanced debug logging */}
                {(() => {
                  console.log('🐛 [SharedConversationMessages] Message details:', {
                    id: message.id,
                    content: message.content,
                    contentType: typeof message.content,
                    contentStringified: JSON.stringify(message.content),
                    sender: message.sender,
                    timestamp: message.timestamp,
                    timestampType: typeof message.timestamp,
                    fullMessage: message
                  });
                  return null;
                })()}
                <MarkdownRenderer content={
                  (() => {
                    // Enhanced content extraction logic
                    let content = message.content;
                    
                    // If content is an object, try to extract the actual text
                    if (typeof content === 'object' && content !== null) {
                      // Check common object structures for content
                      if (content.content) {
                        content = content.content;
                      } else if (content.text) {
                        content = content.text;
                      } else if (content.message) {
                        content = content.message;
                      } else {
                        // Fallback to JSON string representation
                        content = JSON.stringify(content);
                      }
                    }
                    
                    // Ensure we always return a string
                    const finalContent = typeof content === 'string' ? content : String(content || '');
                    console.log('🐛 [SharedConversationMessages] Final content for rendering:', finalContent);
                    return finalContent;
                  })()
                } />
              </>
            )}
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {message.attachments.map((attachment, idx) => (
                  <AttachmentRenderer
                    key={idx}
                    attachment={attachment}
                    onDownload={() => {}}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        flexDirection: 'column'
      }}>
        <CircularProgress sx={{ color: '#3b82f6', mb: 2 }} />
        <Typography sx={{ color: '#64748b' }}>
          Loading shared conversation...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ bgcolor: '#7f1d1d', color: '#fecaca' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header */}
      {chatSession && (
        <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
          <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 1 }}>
            {chatSession.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Shared conversation with {chatSession.agentName} • {messages.length} messages
          </Typography>
        </Box>
      )}

      {/* Messages container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: '#0f172a'
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            textAlign: 'center'
          }}>
            <Typography sx={{ color: '#64748b' }}>
              No messages in this conversation yet
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            
            {/* Typing indicators */}
            {typingUsers.size > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 1 }}>
                <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#64748b' }}>
                  <TypingIcon sx={{ fontSize: 14 }} />
                </Avatar>
                <Chip
                  label={
                    Array.from(typingUsers).length === 1
                      ? `${getParticipantName(Array.from(typingUsers)[0])} is typing...`
                      : `${Array.from(typingUsers).map(id => getParticipantName(id)).join(', ')} are typing...`
                  }
                  size="small"
                  sx={{
                    bgcolor: '#374151',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message input handled by main chat interface */}
    </Box>
  );
};

export default SharedConversationMessages;

