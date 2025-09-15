import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModernChatProvider } from '../components/modern/ModernChatProvider';
import ParticipantPanelLeft from '../components/modern/ParticipantPanelLeft';
import ParticipantPanelRight from '../components/modern/ParticipantPanelRight';
import EnhancedContextBar from '../components/modern/EnhancedContextBar';
import AIToAIInteractionIndicator from '../components/modern/AIToAIInteractionIndicator';
import GovernanceReceiptOverlay from '../components/modern/GovernanceReceiptOverlay';
import { InteractionMode } from '../components/modern/InteractionModeSelector';

// Mock data for demonstration
const mockAIAgents = [
  {
    id: 'claude-1',
    name: 'Claude',
    model: 'claude-3-sonnet',
    avatar: '',
    color: '#ff6b35',
    status: 'active' as const,
    trustScore: 95,
    type: 'claude' as const,
    personality: 'analyst' as const,
    complianceLevel: 'high' as const,
    isActive: true,
    recentActivity: 3
  },
  {
    id: 'gpt4-1',
    name: 'GPT-4',
    model: 'gpt-4-turbo',
    avatar: '',
    color: '#10a37f',
    status: 'thinking' as const,
    trustScore: 88,
    type: 'gpt4' as const,
    personality: 'creative' as const,
    complianceLevel: 'high' as const,
    isActive: true,
    recentActivity: 1
  },
  {
    id: 'gemini-1',
    name: 'Gemini',
    model: 'gemini-pro',
    avatar: '',
    color: '#4285f4',
    status: 'idle' as const,
    trustScore: 82,
    type: 'gemini' as const,
    personality: 'governance' as const,
    complianceLevel: 'medium' as const,
    isActive: false,
    recentActivity: 0
  }
];

const mockHumans = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    type: 'human' as const,
    status: 'active' as const,
    avatar: '',
    role: 'Product Manager',
    lastActivity: Date.now() - 5000
  },
  {
    id: 'user-2',
    name: 'Mike Rodriguez',
    type: 'human' as const,
    status: 'active' as const,
    avatar: '',
    role: 'Developer',
    lastActivity: Date.now() - 15000
  }
];

const mockParticipants = [
  ...mockAIAgents.map(agent => ({
    id: agent.id,
    name: agent.name,
    type: 'ai' as const,
    status: agent.status,
    lastActivity: Date.now() - (agent.recentActivity * 10000)
  })),
  ...mockHumans
];

const mockAIInteractions = [
  {
    id: 'interaction-1',
    fromAgent: 'Claude',
    toAgent: 'GPT-4',
    type: 'considering' as const,
    message: "Analyzing GPT-4's approach to the authentication problem...",
    timestamp: Date.now() - 2000,
    duration: 8000
  },
  {
    id: 'interaction-2',
    fromAgent: 'GPT-4',
    toAgent: 'Gemini',
    type: 'consulting' as const,
    message: "Checking governance compliance for proposed solution...",
    timestamp: Date.now() - 5000,
    duration: 12000
  }
];

const mockMessages = [
  {
    id: 'msg-1',
    content: "Let's discuss the new authentication system architecture. I think we should consider a multi-layered approach.",
    sender: { id: 'user-1', name: 'Sarah Chen', type: 'human' as const },
    timestamp: Date.now() - 300000,
    reactions: [],
    governanceScore: 85
  },
  {
    id: 'msg-2',
    content: "I agree with Sarah's multi-layered approach. From a security perspective, we should implement OAuth 2.0 with PKCE for the client-side authentication, combined with JWT tokens for session management. This provides both security and scalability.",
    sender: { id: 'claude-1', name: 'Claude', type: 'ai' as const },
    timestamp: Date.now() - 280000,
    reactions: [{ emoji: '👍', count: 2 }],
    governanceScore: 92,
    aiMetadata: {
      confidence: 0.94,
      reasoning: "Based on industry best practices and security requirements",
      sources: ["OAuth 2.0 RFC", "JWT Security Guidelines"]
    }
  },
  {
    id: 'msg-3',
    content: "Building on Claude's suggestion, I'd recommend adding biometric authentication as an additional layer. We could integrate WebAuthn for passwordless authentication, which would significantly improve user experience while maintaining high security standards.",
    sender: { id: 'gpt4-1', name: 'GPT-4', type: 'ai' as const },
    timestamp: Date.now() - 260000,
    reactions: [{ emoji: '🚀', count: 1 }],
    governanceScore: 88,
    aiMetadata: {
      confidence: 0.91,
      reasoning: "WebAuthn provides strong security with improved UX",
      sources: ["WebAuthn Specification", "FIDO2 Guidelines"]
    }
  },
  {
    id: 'msg-4',
    content: "Great ideas! Mike, what's your take on the implementation complexity?",
    sender: { id: 'user-1', name: 'Sarah Chen', type: 'human' as const },
    timestamp: Date.now() - 240000,
    reactions: [],
    governanceScore: 75
  },
  {
    id: 'msg-5',
    content: "The implementation looks feasible. I'd estimate about 3-4 sprints for the core OAuth/JWT implementation, plus another 2 sprints for WebAuthn integration. We should also consider the testing strategy for biometric flows.",
    sender: { id: 'user-2', name: 'Mike Rodriguez', type: 'human' as const },
    timestamp: Date.now() - 220000,
    reactions: [{ emoji: '✅', count: 3 }],
    governanceScore: 90
  },
  {
    id: 'msg-6',
    content: "From a governance perspective, I need to flag that biometric data handling requires GDPR compliance review. We'll need explicit consent mechanisms and secure biometric template storage. I recommend consulting with our legal team before proceeding with WebAuthn implementation.",
    sender: { id: 'gemini-1', name: 'Gemini', type: 'ai' as const },
    timestamp: Date.now() - 200000,
    reactions: [{ emoji: '⚖️', count: 2 }],
    governanceScore: 96,
    aiMetadata: {
      confidence: 0.97,
      reasoning: "GDPR compliance is mandatory for biometric data processing",
      sources: ["GDPR Article 9", "Biometric Data Guidelines"]
    }
  }
];

/**
 * AliveEnhancedChatPage - Revolutionary multi-agent interface with all "alive" features
 * 
 * This is the showcase page that demonstrates the full power of our enhanced chat system:
 * - Multi-agent AI collaboration (Claude, GPT-4, Gemini)
 * - Real-time human-AI interaction
 * - AI-to-AI communication indicators
 * - Governance and compliance tracking
 * - Trust scores and personality-based interactions
 * - Advanced context awareness
 * - Professional ChatGPT/Manus-quality interface
 */
const AliveEnhancedChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [selectedMode, setSelectedMode] = useState<InteractionMode>('collaborative');
  const [showGovernanceOverlay, setShowGovernanceOverlay] = useState(false);
  const [activeAIInteractions, setActiveAIInteractions] = useState(mockAIInteractions);
  const [messages, setMessages] = useState(mockMessages);
  const [participants, setParticipants] = useState(mockParticipants);

  // Simulate real-time AI interactions
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly trigger AI-to-AI interactions
      if (Math.random() > 0.7) {
        const newInteraction = {
          id: `interaction-${Date.now()}`,
          fromAgent: mockAIAgents[Math.floor(Math.random() * mockAIAgents.length)].name,
          toAgent: mockAIAgents[Math.floor(Math.random() * mockAIAgents.length)].name,
          type: ['considering', 'consulting', 'collaborating'][Math.floor(Math.random() * 3)] as const,
          message: [
            "Analyzing response patterns...",
            "Cross-referencing governance policies...",
            "Optimizing collaborative approach...",
            "Validating technical feasibility..."
          ][Math.floor(Math.random() * 4)],
          timestamp: Date.now(),
          duration: 5000 + Math.random() * 10000
        };
        
        setActiveAIInteractions(prev => [...prev.slice(-2), newInteraction]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Clean up expired interactions
  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveAIInteractions(prev => 
        prev.filter(interaction => 
          Date.now() - interaction.timestamp < interaction.duration
        )
      );
    }, 2000);

    return () => clearInterval(cleanup);
  }, []);

  const handleBackToChat = () => {
    navigate('/ui/chat/chatbots');
  };

  const handleModeChange = (mode: InteractionMode) => {
    setSelectedMode(mode);
  };

  const handleShowGovernance = () => {
    setShowGovernanceOverlay(true);
  };

  return (
    <ModernChatProvider>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#0f172a',
          color: 'white',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBackToChat}
              sx={{ color: '#94a3b8' }}
            >
              Back to Chat
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              🚀 Alive Enhanced Chat
            </Typography>
            <Chip
              label="Revolutionary Interface"
              size="small"
              sx={{
                bgcolor: '#059669',
                color: 'white',
                fontWeight: 500
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${participants.length} Participants`}
              size="small"
              sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleShowGovernance}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' }
              }}
            >
              Governance
            </Button>
          </Box>
        </Box>

        {/* Enhanced Context Bar */}
        <EnhancedContextBar
          mode={selectedMode}
          onModeChange={handleModeChange}
          participants={participants}
          governanceScore={89}
          activeInteractions={activeAIInteractions.length}
        />

        {/* Main Chat Interface */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - AI Agents */}
          <ParticipantPanelLeft
            agents={mockAIAgents}
            interactions={activeAIInteractions}
            mode={selectedMode}
          />

          {/* Center - Chat Messages */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderLeft: '1px solid #1e293b',
              borderRight: '1px solid #1e293b'
            }}
          >
            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: message.sender.type === 'ai' ? '#1e293b' : '#0f172a',
                    border: message.sender.type === 'ai' ? '1px solid #334155' : '1px solid #1e293b'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {message.sender.name}
                    </Typography>
                    <Chip
                      label={message.sender.type === 'ai' ? 'AI' : 'Human'}
                      size="small"
                      sx={{
                        bgcolor: message.sender.type === 'ai' ? '#3b82f6' : '#059669',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Chip
                      label={`Governance: ${message.governanceScore}%`}
                      size="small"
                      sx={{
                        bgcolor: message.governanceScore > 90 ? '#059669' : 
                                message.governanceScore > 80 ? '#f59e0b' : '#ef4444',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                  
                  <Typography sx={{ lineHeight: 1.6 }}>
                    {message.content}
                  </Typography>

                  {message.aiMetadata && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: '#0f172a', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Confidence: {(message.aiMetadata.confidence * 100).toFixed(0)}% | 
                        Reasoning: {message.aiMetadata.reasoning}
                      </Typography>
                    </Box>
                  )}

                  {message.reactions && message.reactions.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {message.reactions.map((reaction, index) => (
                        <Chip
                          key={index}
                          label={`${reaction.emoji} ${reaction.count}`}
                          size="small"
                          sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>

            {/* Input Area */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #1e293b',
                bgcolor: '#0f172a'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  bgcolor: '#1e293b',
                  borderRadius: 2,
                  border: '1px solid #334155'
                }}
              >
                <Typography sx={{ flex: 1, color: '#94a3b8' }}>
                  Type your message... (AI agents will respond automatically)
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#3b82f6',
                    '&:hover': { bgcolor: '#2563eb' }
                  }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Right Panel - Human Participants */}
          <ParticipantPanelRight
            humans={mockHumans}
            mode={selectedMode}
          />
        </Box>

        {/* AI-to-AI Interaction Indicators */}
        {activeAIInteractions.map((interaction) => (
          <AIToAIInteractionIndicator
            key={interaction.id}
            interaction={interaction}
          />
        ))}

        {/* Governance Receipt Overlay */}
        {showGovernanceOverlay && (
          <GovernanceReceiptOverlay
            isOpen={showGovernanceOverlay}
            onClose={() => setShowGovernanceOverlay(false)}
            messages={messages}
            participants={participants}
          />
        )}
      </Box>
    </ModernChatProvider>
  );
};

export default AliveEnhancedChatPage;

