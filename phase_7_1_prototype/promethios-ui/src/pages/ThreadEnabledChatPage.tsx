/**
 * ThreadEnabledChatPage - Demo page showcasing threaded conversations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import {
  Forum as ForumIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import ThreadEnabledChatInterface from '../components/chat/ThreadEnabledChatInterface';
import ConsolidatedChatHeader from '../components/chat/ConsolidatedChatHeader';
import AgentAvatarSelector from '../components/AgentAvatarSelector';
import { MessageWithThread, ThreadIntegrationMessage } from '../types/Thread';

const ThreadEnabledChatPage: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Mock data
  const [messages, setMessages] = useState<(MessageWithThread | ThreadIntegrationMessage)[]>([
    {
      id: 'msg1',
      content: 'Hello! I\'m working on implementing a new feature for our application. Could you help me understand the best approach for handling user authentication?',
      sender: 'user1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'regular'
    },
    {
      id: 'msg2',
      content: 'I\'d be happy to help you with authentication! There are several approaches we could consider. For modern applications, I typically recommend using JWT tokens with refresh token rotation for security.',
      sender: 'claude',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      type: 'regular'
    },
    {
      id: 'msg3',
      content: 'That sounds good. What about session management? Should we store sessions in memory or use a database?',
      sender: 'user1',
      timestamp: new Date(Date.now() - 3400000).toISOString(),
      type: 'regular',
      thread: {
        replyCount: 5,
        lastReplyAt: new Date(Date.now() - 1800000),
        participants: ['user1', 'claude', 'mark'],
        status: 'active'
      }
    },
    {
      id: 'msg4',
      content: 'For production applications, I recommend using Redis for session storage. It provides excellent performance and built-in expiration handling.',
      sender: 'claude',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
      type: 'regular'
    },
    {
      id: 'integration1',
      type: 'thread_integration',
      content: 'Authentication implementation discussion resolved with comprehensive security recommendations.',
      senderId: 'system',
      senderName: 'Thread Integration',
      timestamp: new Date(Date.now() - 1800000),
      threadReference: {
        threadId: 'msg3',
        parentMessageId: 'msg3',
        originalMessageCount: 8,
        participants: ['user1', 'claude', 'mark'],
        resolvedBy: 'user1'
      },
      integrationData: {
        summary: 'The team discussed authentication implementation approaches, focusing on JWT tokens, session management with Redis, and security best practices. Key decisions were made regarding token rotation, session storage, and multi-factor authentication integration.',
        keyPoints: [
          'Use JWT with refresh token rotation',
          'Implement Redis for session storage',
          'Add multi-factor authentication support',
          'Follow OWASP security guidelines'
        ],
        keyMessages: [],
        promotedBy: 'user1'
      }
    } as ThreadIntegrationMessage,
    {
      id: 'msg5',
      content: 'Perfect! Now I have a clear roadmap for the authentication system. Let\'s move on to discussing the database schema design.',
      sender: 'user1',
      timestamp: new Date(Date.now() - 1700000).toISOString(),
      type: 'regular'
    }
  ]);

  const participants = [
    {
      id: 'user1',
      name: 'Ted Sheets',
      type: 'user' as const,
      color: '#3b82f6'
    },
    {
      id: 'claude',
      name: 'Claude Assistant',
      type: 'ai_agent' as const,
      color: '#f97316'
    },
    {
      id: 'mark',
      name: 'Mark the Claude',
      type: 'ai_agent' as const,
      color: '#10b981'
    }
  ];

  const agents = [
    {
      id: 'claude',
      name: 'Claude Assistant',
      type: 'ai_agent' as const,
      color: '#f97316',
      avatar: '🤖',
      description: 'General AI Assistant'
    },
    {
      id: 'mark',
      name: 'Mark the Claude',
      type: 'ai_agent' as const,
      color: '#10b981',
      avatar: '👨‍💻',
      description: 'Technical Specialist'
    }
  ];

  const handleAgentInteraction = (agentId: string, messageId: string, action: string) => {
    console.log('🎯 [ThreadEnabledChatPage] Agent interaction:', { agentId, messageId, action });
    
    // Simulate agent response
    const agent = participants.find(p => p.id === agentId);
    if (agent) {
      const newMessage: MessageWithThread = {
        id: `msg_${Date.now()}`,
        content: `${agent.name} responding to your message with ${action} approach: This is a simulated response based on the behavioral prompt you selected.`,
        sender: agentId,
        timestamp: new Date().toISOString(),
        type: 'regular'
      };
      
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleSendMessage = (content: string) => {
    const newMessage: MessageWithThread = {
      id: `msg_${Date.now()}`,
      content,
      sender: 'user1',
      timestamp: new Date().toISOString(),
      type: 'regular'
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: isDarkMode ? '#0f172a' : '#f8fafc'
    }}>
      {/* Header */}
      <Paper sx={{ 
        p: 2, 
        mb: 0,
        bgcolor: isDarkMode ? '#1e293b' : '#ffffff',
        borderRadius: 0,
        borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ForumIcon sx={{ color: '#3b82f6', fontSize: '28px' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Thread-Enabled Chat Demo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag & drop AI agents • Start threads • Resolve discussions
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={<SmartToyIcon />} 
              label="AI Agents" 
              size="small" 
              sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}
            />
            <Chip 
              icon={<PersonIcon />} 
              label="Threaded Conversations" 
              size="small" 
              sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
            />
          </Box>
        </Box>

        {/* Agent Header */}
        <ConsolidatedChatHeader
          agents={agents}
          onAgentInteraction={handleAgentInteraction}
        />
      </Paper>

      {/* Main Chat Interface */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ThreadEnabledChatInterface
          messages={messages}
          currentUserId="user1"
          currentUserName="Ted Sheets"
          conversationId="demo_conversation"
          participants={participants}
          onAgentInteraction={handleAgentInteraction}
          onSendMessage={handleSendMessage}
        />
      </Box>

      {/* Bottom Agent Selector */}
      <Paper sx={{ 
        p: 1,
        bgcolor: isDarkMode ? '#1e293b' : '#ffffff',
        borderRadius: 0,
        borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
      }}>
        <AgentAvatarSelector
          agents={agents}
          onAgentInteraction={handleAgentInteraction}
        />
      </Paper>

      {/* Instructions */}
      <Alert 
        severity="info" 
        sx={{ 
          m: 2, 
          mt: 0,
          bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          🎯 How to use Thread-Enabled Chat:
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>Start threads:</strong> Hover over any message and click the reply button<br/>
          • <strong>Drag & drop agents:</strong> Drag agent chips from header or bottom bar onto messages<br/>
          • <strong>Behavioral prompts:</strong> Select how agents should respond (Collaborate, Analyze, etc.)<br/>
          • <strong>Resolve threads:</strong> Click "Resolve" in thread view to integrate back to main chat<br/>
          • <strong>View integration:</strong> See resolved thread summaries in the main conversation
        </Typography>
      </Alert>
    </Box>
  );
};

export default ThreadEnabledChatPage;

