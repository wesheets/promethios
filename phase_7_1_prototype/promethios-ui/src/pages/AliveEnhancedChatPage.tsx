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
    toAgent: 'Claude',
    type: 'collaborating' as const,
    message: "Building on Claude's security analysis with implementation details...",
    timestamp: Date.now() - 1000,
    duration: 6000
  }
];

const mockGovernanceReceipt = {
  messageId: 'msg-123',
  timestamp: Date.now(),
  agentId: 'claude-1',
  overallStatus: 'compliant' as const,
  trustScore: 95,
  checks: [
    {
      id: 'check-1',
      rule: 'Content Safety',
      status: 'passed' as const,
      description: 'No harmful content detected',
      severity: 'high' as const
    },
    {
      id: 'check-2',
      rule: 'Privacy Compliance',
      status: 'passed' as const,
      description: 'No PII exposure detected',
      severity: 'high' as const
    },
    {
      id: 'check-3',
      rule: 'Factual Accuracy',
      status: 'warning' as const,
      description: 'Claims require verification',
      severity: 'medium' as const
    }
  ],
  policyVersion: '2.1.0',
  processingTime: 45,
  ragSources: [
    'Internal Security Guidelines v3.2',
    'OWASP Authentication Best Practices',
    'Company Privacy Policy 2024'
  ]
};

const AliveEnhancedChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentMode, setCurrentMode] = useState<InteractionMode>('collaborative');
  const [showGovernanceReceipt, setShowGovernanceReceipt] = useState(false);
  const [aiInteractions, setAIInteractions] = useState(mockAIInteractions);
  const [messageCount, setMessageCount] = useState(24);

  const handleBackToStandard = () => {
    // Preserve current query parameters and navigate back to standard mode
    const searchParams = new URLSearchParams(location.search);
    navigate(`/chat/chatbots?${searchParams.toString()}`);
  };

  // Simulate AI interactions
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new AI interactions
      if (Math.random() > 0.7) {
        const agents = ['Claude', 'GPT-4', 'Gemini'];
        const types = ['considering', 'agreeing', 'disagreeing', 'collaborating', 'analyzing'] as const;
        const messages = [
          "Evaluating the proposed solution architecture...",
          "Cross-referencing with security best practices...",
          "Analyzing potential edge cases and failure modes...",
          "Considering alternative implementation approaches...",
          "Validating against compliance requirements..."
        ];

        const newInteraction = {
          id: `interaction-${Date.now()}`,
          fromAgent: agents[Math.floor(Math.random() * agents.length)],
          toAgent: agents[Math.floor(Math.random() * agents.length)],
          type: types[Math.floor(Math.random() * types.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: Date.now(),
          duration: 5000 + Math.random() * 5000
        };

        setAIInteractions(prev => [...prev, newInteraction]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (mode: InteractionMode) => {
    setCurrentMode(mode);
    console.log('Interaction mode changed to:', mode);
  };

  const handleInteractionComplete = (interactionId: string) => {
    setAIInteractions(prev => prev.filter(i => i.id !== interactionId));
  };

  const handleSendMessage = () => {
    setMessageCount(prev => prev + 1);
    // Simulate governance check
    setTimeout(() => {
      setShowGovernanceReceipt(true);
    }, 1000);
  };

  return (
    <ModernChatProvider>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          color: 'white'
        }}
      >
        {/* Header with Back Button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1,
            bgcolor: '#1e293b',
            borderBottom: '1px solid #334155',
            zIndex: 1000
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleBackToStandard}
              startIcon={<ArrowBack />}
              size="small"
              sx={{
                borderColor: '#475569',
                color: '#94a3b8',
                '&:hover': {
                  borderColor: '#64748b',
                  bgcolor: 'rgba(148, 163, 184, 0.1)'
                }
              }}
            >
              Standard Mode
            </Button>
            
            <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
              Enhanced Multi-Agent Chat
            </Typography>
            
            <Chip
              label="Revolutionary Mode"
              size="small"
              sx={{
                bgcolor: '#10b981',
                color: 'white',
                fontWeight: 600,
                animation: 'pulse 2s infinite'
              }}
            />
          </Box>
        </Box>

        {/* Enhanced Context Bar */}
        <EnhancedContextBar
          participants={mockParticipants}
          messageCount={messageCount}
          conversationId="demo-conversation"
          conversationTitle="Multi-Agent Authentication Strategy Discussion"
          onModeChange={handleModeChange}
          currentMode={currentMode}
        />

        {/* Main Chat Area */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - AI Agents */}
          <ParticipantPanelLeft
            agents={mockAIAgents}
            isVisible={true}
            width="280px"
            onAddAgent={() => console.log('Add AI agent')}
            onAgentSettings={(id) => console.log('Configure agent:', id)}
            onAgentDragStart={(agent, event) => {
              console.log('Drag started for agent:', agent.name);
              event.dataTransfer.setData('text/plain', JSON.stringify(agent));
            }}
          />

          {/* Center - Chat Messages */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              backgroundColor: '#1e293b'
            }}
          >
            {/* Demo Messages Area */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {/* Welcome Message */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 2 }}>
                  🎉 Revolutionary Multi-Agent Chat Interface
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                  Experience the world's first "alive" collaboration platform with:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  <Chip label="🔥 Conversation Heartbeat" size="small" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} />
                  <Chip label="🤖 Agent Personality Signals" size="small" sx={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }} />
                  <Chip label="💬 AI-to-AI Observable Interactions" size="small" sx={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }} />
                  <Chip label="⚖️ Governance Transparency" size="small" sx={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }} />
                  <Chip label="🎭 Dynamic Interaction Modes" size="small" sx={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }} />
                </Box>
              </Box>

              {/* Demo Message with Governance Receipt */}
              <Box
                sx={{
                  position: 'relative',
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  borderLeft: '4px solid #ff6b35'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: '#ff6b35',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    C
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: '#ff6b35', fontWeight: 600 }}>
                    Claude (Analyst)
                  </Typography>
                  <Chip label="🔥 Active" size="small" sx={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }} />
                </Box>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>
                  Based on our security analysis, I recommend implementing OAuth 2.0 with PKCE for the authentication flow. 
                  This approach provides robust security while maintaining excellent user experience. The implementation should 
                  include proper token rotation and secure storage mechanisms.
                </Typography>

                {/* Governance Receipt Overlay */}
                <GovernanceReceiptOverlay
                  receipt={mockGovernanceReceipt}
                  isVisible={showGovernanceReceipt}
                  onToggleVisibility={() => setShowGovernanceReceipt(!showGovernanceReceipt)}
                />
              </Box>

              {/* Test Controls */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  border: '1px solid rgba(107, 114, 128, 0.3)'
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 2 }}>
                  🧪 Test Controls
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSendMessage}
                    sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                  >
                    Send Test Message
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowGovernanceReceipt(!showGovernanceReceipt)}
                    sx={{ borderColor: '#10b981', color: '#10b981' }}
                  >
                    Toggle Governance Receipt
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const modes: InteractionMode[] = ['workshop', 'debate', 'tutor', 'analysis', 'collaborative'];
                      const currentIndex = modes.indexOf(currentMode);
                      const nextMode = modes[(currentIndex + 1) % modes.length];
                      handleModeChange(nextMode);
                    }}
                    sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                  >
                    Cycle Interaction Mode
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Chat Input Area */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)'
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                💡 This is a demonstration of the revolutionary "alive" chat interface
              </Typography>
            </Box>
          </Box>

          {/* Right Panel - Human Participants */}
          <ParticipantPanelRight
            humans={mockHumans}
            isVisible={true}
            width="280px"
            onInviteHuman={() => console.log('Invite human')}
            onHumanSettings={(id) => console.log('Configure human:', id)}
          />
        </Box>

        {/* AI-to-AI Interaction Indicators */}
        <AIToAIInteractionIndicator
          interactions={aiInteractions}
          isVisible={true}
          onInteractionComplete={handleInteractionComplete}
        />
      </Box>
    </ModernChatProvider>
  );
};

export default AliveEnhancedChatPage;

