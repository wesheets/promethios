import React, { useState } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import ConsolidatedChatHeader from '../components/chat/ConsolidatedChatHeader';
import ColorCodedChatMessage from '../components/chat/ColorCodedChatMessage';

// Mock data for testing
const mockMultiChatState = {
  activeContextId: 'ai_agent',
  contexts: [
    {
      id: 'ai_agent',
      type: 'ai_agent' as const,
      name: 'AI Assistant',
      avatar: '',
      isActive: true,
      unreadCount: 0,
      canClose: false,
      guestAgents: [
        {
          agentId: 'mark-claude',
          name: 'Mark the Claude',
          avatar: '',
          addedAt: new Date(),
        },
        {
          agentId: 'guest-2', 
          name: 'Gemini Pro',
          avatar: '',
          addedAt: new Date(),
        }
      ]
    },
    {
      id: 'team_chat',
      type: 'team_channel' as const,
      name: 'Team Discussion',
      avatar: '',
      isActive: false,
      unreadCount: 3,
      canClose: true,
    }
  ],
  sidePanel: {
    isOpen: false,
  },
};

const mockSelectedChatbot = {
  id: 'claude-3',
  identity: {
    id: 'claude-3',
    name: 'Claude 3 Sonnet',
    avatar: '',
  },
  name: 'Claude 3 Sonnet',
};

const mockHumanParticipants = [
  {
    userId: 'user-1',
    name: 'Alice Johnson',
    displayName: 'Alice Johnson',
    avatar: '',
    isOnline: true,
  },
  {
    userId: 'user-2',
    name: 'Bob Smith',
    displayName: 'Bob Smith', 
    avatar: '',
    isOnline: false,
  },
  {
    userId: 'user-3',
    name: 'Carol Davis',
    displayName: 'Carol Davis',
    avatar: '',
    isOnline: true,
  },
  {
    userId: 'user-4',
    name: 'David Wilson',
    displayName: 'David Wilson',
    avatar: '',
    isOnline: true,
  },
];

const mockSharedConversations = [
  {
    id: 'shared-1',
    name: 'Project Planning',
    participants: [
      { id: 'user-1', name: 'Alice Johnson', type: 'human' as const },
      { id: 'claude-3', name: 'Claude 3', type: 'ai_agent' as const },
    ],
    createdBy: 'user-1',
  }
];

const mockUser = {
  uid: 'current-user',
  displayName: 'Current User',
  email: 'user@example.com',
};

// Color system matching the header
const agentColorPalette = [
  '#f97316', // Orange
  '#8b5cf6', // Purple  
  '#10b981', // Green
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#06b6d4', // Cyan
];

const humanColor = '#3b82f6'; // Blue for all humans

// Sample messages demonstrating the color coding
const sampleMessages = [
  {
    id: '1',
    content: "Hello! I'm ready to assist you. Is there a specific task or question you'd like help with? I can help you with a wide range of activities using the available tools, such as:\n\n• Web searches\n• Document generation\n• Data visualization\n• Coding and programming\n• Web scraping\n• SEO analysis\n• And more!\n\nPlease let me know what you'd like to do, and I'll be happy to help you.",
    timestamp: '4:34:28 PM',
    sender: {
      id: 'claude-3',
      name: 'Claude Assistant',
      type: 'ai' as const,
    }
  },
  {
    id: '2',
    content: 'hey!',
    timestamp: '4:34:58 PM',
    sender: {
      id: 'current-user',
      name: 'Ted Sheets',
      type: 'human' as const,
    }
  },
  {
    id: '3',
    content: "Hello! I'm Mark the Claude, operating in professional mode with a current Trust Score of 85.8%. I'm prepared to assist you with any tasks or questions you might have. How can I help you today? I'm equipped to support a wide range of activities while maintaining our governance policies and ensuring a helpful, efficient interaction.\n\nIs there a specific area where you're seeking assistance? I'm ready to leverage my capabilities to provide you with the most valuable support possible.",
    timestamp: '4:34:56 PM',
    sender: {
      id: 'mark-claude',
      name: 'Mark the Claude',
      type: 'ai' as const,
    }
  },
  {
    id: '4',
    content: 'morning!',
    timestamp: '7:49:39 AM',
    sender: {
      id: 'current-user',
      name: 'Ted Sheets',
      type: 'human' as const,
    }
  },
  {
    id: '5',
    content: "Good morning! I'm Claude, an AI assistant ready to help you with any tasks or questions you might have. Is there anything specific I can assist you with today? I'm equipped with various tools to help with research, document creation, data visualization, and more. Feel free to ask me anything!",
    timestamp: '7:49:43 AM',
    sender: {
      id: 'claude-3',
      name: 'Claude Assistant',
      type: 'ai' as const,
    }
  }
];

// Get color for a participant
const getParticipantColor = (senderId: string, senderType: 'ai' | 'human') => {
  if (senderType === 'human') {
    return humanColor;
  }
  
  // For AI agents, assign colors based on their ID
  const agentIds = ['claude-3', 'mark-claude'];
  const agentIndex = agentIds.indexOf(senderId);
  return agentColorPalette[agentIndex % agentColorPalette.length];
};

// Dark theme to match the application
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
});

const HeaderTestPage: React.FC = () => {
  const [multiChatState, setMultiChatState] = useState(mockMultiChatState);
  const [isInSharedMode, setIsInSharedMode] = useState(false);
  const [activeSharedConversation, setActiveSharedConversation] = useState<string | null>(null);

  const handleSwitchChatContext = (contextId: string) => {
    setMultiChatState(prev => ({
      ...prev,
      activeContextId: contextId,
      contexts: prev.contexts.map(ctx => ({
        ...ctx,
        isActive: ctx.id === contextId,
      })),
    }));
  };

  const handleRemoveChatContext = (contextId: string) => {
    setMultiChatState(prev => ({
      ...prev,
      contexts: prev.contexts.filter(ctx => ctx.id !== contextId),
    }));
  };

  const handleToggleSidePanel = () => {
    setMultiChatState(prev => ({
      ...prev,
      sidePanel: {
        ...prev.sidePanel,
        isOpen: !prev.sidePanel.isOpen,
      },
    }));
  };

  const handleAddParticipant = () => {
    console.log('Add participant clicked');
  };

  const toggleSharedMode = () => {
    setIsInSharedMode(!isInSharedMode);
    setActiveSharedConversation(isInSharedMode ? null : 'shared-1');
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        color: 'text.primary'
      }}>
        {/* Test Controls */}
        <Box sx={{ 
          p: 2, 
          bgcolor: '#334155', 
          borderBottom: '1px solid #475569',
          display: 'flex',
          gap: 2,
          alignItems: 'center'
        }}>
          <Box sx={{ color: 'white', fontWeight: 600 }}>
            Consolidated Chat Header Test
          </Box>
          <button
            onClick={toggleSharedMode}
            style={{
              padding: '8px 16px',
              backgroundColor: isInSharedMode ? '#3b82f6' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isInSharedMode ? 'Exit Shared Mode' : 'Enter Shared Mode'}
          </button>
          <Box sx={{ color: '#94a3b8', fontSize: '14px' }}>
            Side Panel: {multiChatState.sidePanel.isOpen ? 'Open' : 'Closed'}
          </Box>
        </Box>

        {/* Consolidated Chat Header */}
        <ConsolidatedChatHeader
          multiChatState={multiChatState}
          selectedChatbot={mockSelectedChatbot}
          currentChatName="Test Conversation"
          humanParticipants={mockHumanParticipants}
          isInSharedMode={isInSharedMode}
          activeSharedConversation={activeSharedConversation}
          sharedConversations={mockSharedConversations}
          loadedHostChatSession={isInSharedMode ? {
            agentId: 'claude-3',
            agentName: 'Claude 3 Sonnet',
            userId: 'user-1',
            hostUserName: 'Alice Johnson',
            userName: 'Alice Johnson',
            participants: {
              guests: [
                {
                  id: 'guest-gpt',
                  type: 'ai_agent',
                  name: 'GPT-4',
                  agentConfig: { name: 'GPT-4 Turbo' },
                },
                {
                  id: 'user-2',
                  type: 'human',
                  name: 'Bob Smith',
                },
              ],
            },
          } : undefined}
          onSwitchChatContext={handleSwitchChatContext}
          onRemoveChatContext={handleRemoveChatContext}
          onAddParticipant={handleAddParticipant}
          onToggleSidePanel={handleToggleSidePanel}
          user={mockUser}
        />

        {/* Content Area */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            bgcolor: '#1e293b', 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #334155',
            mb: 3
          }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>
              Consolidated Chat Header Demo
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              This page demonstrates the new consolidated chat header that combines the previous 
              two-header structure into a single, space-efficient header. The header includes:
            </p>
            <ul style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              <li><strong>Chat Tabs:</strong> Switch between different chat contexts (only shown for multi-chat)</li>
              <li><strong>Agent Name:</strong> Prominently displayed in white text</li>
              <li><strong>Chat Name:</strong> Shown below agent name if it exists</li>
              <li><strong>AI Participants:</strong> Host and guest agents with sequential color assignment</li>
              <li><strong>Human Participants:</strong> Human users with blue color and online status</li>
              <li><strong>Overflow Handling:</strong> Shows "+N more" when there are too many participants</li>
            </ul>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
              Use the "Enter Shared Mode" button above to test the shared conversation display.
              Try clicking on tabs, participants, and action buttons to test interactivity.
            </p>
          </Box>

          {/* Sample Messages */}
          <Box sx={{ 
            bgcolor: '#1e293b', 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#f8fafc' }}>
              Color-Coded Messages Demo
            </h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              Messages now feature color-coded left borders and agent names with color squares, 
              matching the participant colors in the header:
            </p>
            
            {/* Messages Container */}
            <Box sx={{ 
              maxHeight: '500px',
              overflowY: 'auto',
              bgcolor: '#0f172a',
              p: 2,
              borderRadius: 1,
              border: '1px solid #334155'
            }}>
              {sampleMessages.map((message) => (
                <ColorCodedChatMessage
                  key={message.id}
                  message={message}
                  senderColor={getParticipantColor(message.sender.id, message.sender.type)}
                  isCurrentUser={message.sender.id === 'current-user'}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default HeaderTestPage;

