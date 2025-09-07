import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';
import { chatHistoryService, ChatSession } from '../../services/ChatHistoryService';
import { ChatMessage } from '../../services/ChatStorageService';
import SharedConversationService from '../../services/SharedConversationService';
import MarkdownRenderer from '../MarkdownRenderer';
import AttachmentRenderer from '../AttachmentRenderer';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sharedConversationService = SharedConversationService.getInstance();

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    
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
              {isUser ? 'You' : isSystem ? 'System' : chatSession?.agentName || 'AI Assistant'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
          
          {/* Message content */}
          <Box>
            {message.content && (
              <MarkdownRenderer content={message.content} />
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
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message input */}
    </Box>
  );
};

export default SharedConversationMessages;

