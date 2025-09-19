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
import { useThreads } from '../../hooks/useThreads';
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
  const { createThread, openThread, closeThread } = useThreads(conversationId);

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
      // Unified mode: Set up real-time listener for host conversation
      console.log('🔍 [UnifiedSharedMessages] Unified mode: Setting up real-time listener for host conversation');
      
      unsubscribe = unifiedGuestChatService.subscribeToHostConversation(
        guestAccess.hostUserId,
        guestAccess.conversationId,
        (updatedSession) => {
          if (updatedSession?.messages) {
            console.log('🔄 [UnifiedSharedMessages] Messages updated via unified listener:', updatedSession.messages.length);
            setMessages(updatedSession.messages);
            setChatSession(updatedSession);
          }
        }
      );
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
          chatSession?.participants?.host?.name || 'Guest User', // Use actual host user name
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
          senderName: chatSession?.participants?.host?.name || 'Guest User', // Use actual host user name
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
            // Get participant color helper function (enhanced with enriched data)
            const getParticipantColor = (participantId: string, type: 'human' | 'ai') => {
              // Use exact same color system as host chat
              if (type === 'human') {
                return '#3b82f6'; // Blue for humans
              }
              
              // First, try to get color from enriched participant metadata
              const agentParticipant = chatSession?.participants?.guests?.find(g => 
                g.type === 'ai_agent' && g.id === participantId
              );
              
              if (agentParticipant?.metadata?.color) {
                console.log('🎨 [UnifiedSharedMessages] Using enriched color for agent:', {
                  agentId: participantId,
                  agentName: agentParticipant.name,
                  color: agentParticipant.metadata.color
                });
                return agentParticipant.metadata.color;
              }
              
              // Fallback: Agent color palette (exact same as host chat)
              const agentColorPalette = [
                '#f97316', // Orange
                '#8b5cf6', // Purple  
                '#10b981', // Green
                '#ec4899', // Pink
                '#eab308', // Yellow
                '#06b6d4', // Cyan
                '#ef4444', // Red
                '#84cc16', // Lime
              ];
              
              // Get all participants in order (same logic as host chat)
              const getAllParticipants = () => {
                const participants = [];
                
                // Add host agent first (should get orange)
                if (chatSession?.agentId) {
                  participants.push({
                    id: chatSession.agentId,
                    name: chatSession.agentName || 'Host Agent',
                    type: 'ai'
                  });
                }
                
                // Add known guest agents (Mark the Claude should be second for purple color)
                participants.push({
                  id: 'mark-the-claude',
                  name: 'Mark the Claude',
                  type: 'ai'
                });
                
                // Add other guest agents from chat session
                if (chatSession?.participants?.guests) {
                  chatSession.participants.guests.forEach(guest => {
                    if (guest.type === 'ai_agent' && !participants.find(p => p.id === guest.id)) {
                      participants.push({
                        id: guest.id,
                        name: guest.name,
                        type: 'ai'
                      });
                    }
                  });
                }
                
                return participants;
              };
              
              // Get color based on participant order (same as host chat)
              const allParticipants = getAllParticipants();
              const agentIndex = allParticipants.findIndex(p => p.id === participantId);
              
              if (agentIndex >= 0) {
                const assignedColor = agentColorPalette[agentIndex % agentColorPalette.length];
                console.log('🎨 [UnifiedSharedMessages] Using sequential color for agent:', {
                  agentId: participantId,
                  agentIndex,
                  color: assignedColor,
                  allParticipants: allParticipants.map(p => ({ id: p.id, name: p.name }))
                });
                return assignedColor;
              }
              
              // Fallback to orange for unknown agents
              console.log('🎨 [UnifiedSharedMessages] Using fallback orange for unknown agent:', participantId);
              return agentColorPalette[0]; // Orange
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
                // For user messages, use metadata if available, then try chat session host info
                let userName = message.metadata?.userName || 'User';
                const userId = message.metadata?.userId || currentUserId;
                const isGuest = message.metadata?.isGuestMessage || false;
                
                console.log('🔍 [UnifiedSharedMessages] Resolving user name for message:', {
                  messageId: message.id,
                  initialUserName: userName,
                  metadata: message.metadata,
                  guestAccess: guestAccess ? {
                    hostUserName: guestAccess.hostUserName,
                    hostUserId: guestAccess.hostUserId
                  } : null,
                  chatSessionHost: chatSession?.participants?.host
                });
                
                // Try guestAccess first (most reliable for guest view)
                if (userName === 'User' && guestAccess?.hostUserName && guestAccess.hostUserName !== 'Host') {
                  userName = guestAccess.hostUserName;
                  console.log('🔍 [UnifiedSharedMessages] Using host user name from guest access:', userName);
                }
                
                // Try chat session host participant
                if (userName === 'User' && chatSession?.participants?.host) {
                  const hostUser = chatSession.participants.host;
                  if (hostUser.type === 'human' && hostUser.name && hostUser.name !== 'User') {
                    userName = hostUser.name;
                    console.log('🔍 [UnifiedSharedMessages] Using host user name from chat session:', userName);
                  }
                }
                
                // Try to extract from chat session name if it contains user info
                if (userName === 'User' && chatSession?.name) {
                  // Look for patterns like "test (with Ted Sheets)" or similar
                  const nameMatch = chatSession.name.match(/\(with\s+([^)]+)\)/i);
                  if (nameMatch && nameMatch[1] && nameMatch[1] !== 'User') {
                    userName = nameMatch[1];
                    console.log('🔍 [UnifiedSharedMessages] Extracted host user name from chat session name:', userName);
                  }
                }
                
                // Get avatar from multiple sources
                let userAvatar = message.metadata?.userAvatar;
                if (!userAvatar && chatSession?.participants?.host?.avatar) {
                  userAvatar = chatSession.participants.host.avatar;
                }
                if (!userAvatar && guestAccess?.hostUserAvatar) {
                  userAvatar = guestAccess.hostUserAvatar;
                }
                
                return {
                  id: userId,
                  name: isGuest ? `${userName} (Guest)` : userName,
                  type: 'human' as const,
                  avatar: userAvatar
                };
              } else {
                // For AI messages, improve agent name detection with detailed logging
                let agentId = chatSession?.agentId || 'ai-assistant';
                let agentName = chatSession?.agentName || 'AI Assistant';
                
                console.log('🔍 [UnifiedSharedMessages] Agent name detection for message:', {
                  messageId: message.id,
                  initialAgentId: agentId,
                  initialAgentName: agentName,
                  chatSessionAgentId: chatSession?.agentId,
                  chatSessionAgentName: chatSession?.agentName,
                  messageMetadata: message.metadata
                });
                
                // Try message metadata first
                if (message.metadata?.agentId) {
                  agentId = message.metadata.agentId;
                  agentName = message.metadata.agentName || agentName;
                  console.log('🔍 [UnifiedSharedMessages] Using metadata agent:', { agentId, agentName });
                }
                
                // Try to find agent in chat session participants
                if (chatSession?.participants?.guests) {
                  console.log('🔍 [UnifiedSharedMessages] Searching in participants.guests:', 
                    chatSession.participants.guests.map(g => ({ id: g.id, name: g.name, type: g.type }))
                  );
                  
                  const agent = chatSession.participants.guests.find(g => 
                    g.type === 'ai_agent' && (g.id === agentId || g.id === message.metadata?.agentId)
                  );
                  
                  if (agent) {
                    const foundName = agent.agentConfig?.name || agent.identity?.name || agent.name || agentName;
                    console.log('🔍 [UnifiedSharedMessages] Found agent in participants:', {
                      agentId: agent.id,
                      foundName,
                      agentConfig: agent.agentConfig,
                      identity: agent.identity,
                      name: agent.name
                    });
                    agentName = foundName;
                  } else {
                    console.log('🔍 [UnifiedSharedMessages] Agent not found in participants for ID:', agentId);
                  }
                }
                
                // Try to find agent in host participant if available (but don't override good names)
                if (chatSession?.participants?.host && chatSession.participants.host.id === agentId) {
                  const hostName = chatSession.participants.host.name || agentName;
                  console.log('🔍 [UnifiedSharedMessages] Host participant name available:', hostName);
                  
                  // Only use host name if we don't already have a good enriched name
                  if (agentName === 'AI Assistant' || agentName.includes('Agent chatbot-')) {
                    console.log('🔍 [UnifiedSharedMessages] Using host participant name as fallback:', hostName);
                    agentName = hostName;
                  } else {
                    console.log('🔍 [UnifiedSharedMessages] Keeping enriched agent name:', agentName);
                  }
                }
                
                // Fallback: try to identify from message content patterns
                if (agentName === 'AI Assistant') {
                  const content = message.content.toLowerCase();
                  if (content.includes("i'm mark the claude") || content.includes("mark the claude")) {
                    agentName = 'Mark the Claude';
                    console.log('🔍 [UnifiedSharedMessages] Using content pattern detection: Mark the Claude');
                  } else if (content.includes("chatbot-")) {
                    // Extract agent name from chatbot ID if present
                    const match = content.match(/chatbot-(\d+)/);
                    if (match) {
                      agentName = `Agent ${match[1]}`;
                      console.log('🔍 [UnifiedSharedMessages] Using content pattern detection:', agentName);
                    }
                  }
                }
                
                console.log('✅ [UnifiedSharedMessages] Final resolved agent name:', {
                  agentId,
                  agentName,
                  messageId: message.id
                });
                
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

