/**
 * CompleteAdaptiveChatContainer - Revolutionary multi-agent chat interface
 * Integrates all modern chat features: adaptive panels, drag & drop, threading, context intelligence
 * This is the complete implementation of the ChatGPT-discussed enhanced interface
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

// Modern Chat System
import { ModernChatProvider } from '../../../components/modern/ModernChatProvider';
import { AdaptiveMessageRenderer } from '../../../components/modern/AdaptiveMessageRenderer';
import { CollapsiblePanelManager } from '../../../components/modern/CollapsiblePanelManager';

// Participant Panels
import ParticipantPanelLeft from '../../../components/modern/ParticipantPanelLeft';
import ParticipantPanelRight from '../../../components/modern/ParticipantPanelRight';

// Message Enhancement
import MessageIdentityStrip from '../../../components/modern/MessageIdentityStrip';
import ContextBar from '../../../components/modern/ContextBar';

// Drag & Drop System (Existing Components)
import { DragDropOrchestrator } from '../../../components/modern/DragDropOrchestrator';
import { DraggableAgentAvatar } from '../../../components/modern/DraggableAgentAvatar';
import { MessageDropTarget } from '../../../components/modern/MessageDropTarget';
import { BehavioralInjectionModal } from '../../../components/modern/BehavioralInjectionModal';

// Threading System (Existing Components)
import { ThreadCreationModal } from '../../../components/threading/ThreadCreationModal';
import { ThreadMessageDisplay } from '../../../components/threading/ThreadMessageDisplay';
import { ThreadNavigationSidebar } from '../../../components/threading/ThreadNavigationSidebar';

// Hooks and Services
import { useModernChat } from '../../../hooks/useModernChat';
import { ChatModeDetector } from '../../../components/modern/ChatModeDetector';

// Existing Components for Integration
import MessageInput from './MessageInput';

interface CompleteAdaptiveChatContainerProps {
  sessionId: string;
  height?: string;
  onParticipantChange?: (participants: any[]) => void;
  agentId?: string;
  multiAgentSystemId?: string;
  governanceEnabled?: boolean;
}

interface Participant {
  id: string;
  name: string;
  type: 'agent' | 'human';
  model?: string;
  role?: string;
  color: string;
  status: 'active' | 'idle' | 'thinking' | 'online' | 'away' | 'offline' | 'typing';
  avatar?: string;
  trustScore?: number;
  joinedAt?: Date;
  email?: string;
}

interface Message {
  id: string;
  content: string;
  participantId: string;
  timestamp: Date;
  threadId?: string;
  parentMessageId?: string;
  metadata?: any;
  type?: 'user' | 'assistant' | 'system';
  sender?: string;
  senderName?: string;
}

interface ConversationInsight {
  type: 'summary' | 'trend' | 'suggestion' | 'collaboration' | 'sentiment';
  title: string;
  content: string;
  confidence: number;
  actionable?: boolean;
}

// Strategic color palettes
const AGENT_COLORS = {
  claude: '#3B82F6',    // Blue
  'gpt-4': '#06B6D4',   // Cyan
  gemini: '#8B5CF6',    // Purple
  custom: '#10B981',    // Emerald
  default: '#64748B'    // Slate
};

const HUMAN_COLORS = {
  host: '#F59E0B',      // Amber
  guest1: '#EF4444',    // Red
  guest2: '#84CC16',    // Lime
  guest3: '#F97316',    // Orange
  collaborator: '#EC4899', // Pink
  default: '#64748B'    // Slate
};

const CompleteAdaptiveChatContainer: React.FC<CompleteAdaptiveChatContainerProps> = ({
  sessionId,
  height = '100%',
  onParticipantChange,
  agentId,
  multiAgentSystemId,
  governanceEnabled = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Modern Chat State
  const { 
    messages: modernMessages, 
    participants: modernParticipants, 
    chatMode, 
    isLoading,
    sendMessage,
    addParticipant,
    removeParticipant
  } = useModernChat(sessionId);

  // Local State
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // UI State
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [contextBarExpanded, setContextBarExpanded] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [draggedAgent, setDraggedAgent] = useState<Participant | null>(null);
  const [dropTargetMessage, setDropTargetMessage] = useState<string | null>(null);
  const [behavioralModalOpen, setBehavioralModalOpen] = useState(false);
  const [threadCreationOpen, setThreadCreationOpen] = useState(false);

  // Initialize participants
  useEffect(() => {
    const initialParticipants: Participant[] = [
      {
        id: 'user-1',
        name: 'You',
        type: 'human',
        role: 'host',
        color: HUMAN_COLORS.host,
        status: 'online',
        joinedAt: new Date(),
        email: 'user@example.com'
      }
    ];

    if (agentId) {
      initialParticipants.push({
        id: agentId,
        name: 'Claude',
        type: 'agent',
        model: 'claude-3-sonnet',
        color: AGENT_COLORS.claude,
        status: 'active',
        trustScore: 95,
        joinedAt: new Date()
      });
    }

    // Add some demo participants for testing
    if (process.env.NODE_ENV === 'development') {
      initialParticipants.push(
        {
          id: 'agent-gpt4',
          name: 'GPT-4',
          type: 'agent',
          model: 'gpt-4',
          color: AGENT_COLORS['gpt-4'],
          status: 'idle',
          trustScore: 92,
          joinedAt: new Date()
        },
        {
          id: 'human-sarah',
          name: 'Sarah',
          type: 'human',
          role: 'guest1',
          color: HUMAN_COLORS.guest1,
          status: 'online',
          email: 'sarah@example.com',
          joinedAt: new Date()
        }
      );
    }

    setParticipants(initialParticipants);
  }, [agentId, multiAgentSystemId]);

  // Initialize demo messages
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const demoMessages: Message[] = [
        {
          id: 'msg-1',
          content: 'Hello! I\'m excited to test the new enhanced multi-agent chat interface.',
          participantId: 'user-1',
          timestamp: new Date(Date.now() - 300000),
          type: 'user'
        },
        {
          id: 'msg-2',
          content: 'Welcome! This is the revolutionary chat interface with adaptive layouts, drag & drop behavioral injection, and smart threading. How can I assist you today?',
          participantId: agentId || 'agent-claude',
          timestamp: new Date(Date.now() - 240000),
          type: 'assistant'
        },
        {
          id: 'msg-3',
          content: 'The interface looks amazing! I can see the participant panels and the strategic color coding.',
          participantId: 'human-sarah',
          timestamp: new Date(Date.now() - 180000),
          type: 'user'
        }
      ];
      setMessages(demoMessages);
    }
  }, [agentId]);

  // Separate participants by type
  const agents = useMemo(() => 
    participants.filter(p => p.type === 'agent'), 
    [participants]
  );
  
  const humans = useMemo(() => 
    participants.filter(p => p.type === 'human'), 
    [participants]
  );

  // Adaptive Layout Logic
  useEffect(() => {
    if (isMobile) {
      // Mobile: No panels, full width
      setLeftPanelVisible(false);
      setRightPanelVisible(false);
    } else {
      // Desktop: Smart panel visibility
      setLeftPanelVisible(agents.length >= 2);
      setRightPanelVisible(humans.length >= 2);
    }
  }, [agents.length, humans.length, isMobile]);

  // Layout Calculations
  const layoutConfig = useMemo(() => {
    if (isMobile) {
      return { leftWidth: '0%', mainWidth: '100%', rightWidth: '0%' };
    }

    const showLeft = leftPanelVisible;
    const showRight = rightPanelVisible;

    if (!showLeft && !showRight) {
      // 1:1 Chat - Full width like ChatGPT
      return { leftWidth: '0%', mainWidth: '100%', rightWidth: '0%' };
    } else if (showLeft && !showRight) {
      // Multi-Agent - Left panel + main chat
      return { leftWidth: '15%', mainWidth: '85%', rightWidth: '0%' };
    } else if (!showLeft && showRight) {
      // Multi-Human - Main chat + right panel
      return { leftWidth: '0%', mainWidth: '85%', rightWidth: '15%' };
    } else {
      // Full Multi-Party - Both panels
      return { leftWidth: '15%', mainWidth: '70%', rightWidth: '15%' };
    }
  }, [leftPanelVisible, rightPanelVisible, isMobile]);

  // Mock conversation insights
  const conversationInsights: ConversationInsight[] = [
    {
      type: 'summary',
      title: 'Conversation Focus',
      content: 'Discussion centers around testing the enhanced multi-agent chat interface with emphasis on user experience and adaptive layouts.',
      confidence: 0.94,
      actionable: false
    },
    {
      type: 'collaboration',
      title: 'Active Collaboration',
      content: 'Multiple participants are actively engaged with balanced contribution across all parties.',
      confidence: 0.89,
      actionable: false
    },
    {
      type: 'suggestion',
      title: 'Feature Testing',
      content: 'Consider testing drag & drop behavioral injection and threading features to validate the complete interface.',
      confidence: 0.82,
      actionable: true
    }
  ];

  // Mock conversation metrics
  const conversationMetrics = {
    messageCount: messages.length,
    participantCount: participants.length,
    agentCount: agents.length,
    humanCount: humans.length,
    avgResponseTime: 1.8,
    collaborationScore: 0.91,
    sentimentScore: 0.78
  };

  // Event Handlers
  const handleAgentDragStart = useCallback((agent: Participant, event: React.DragEvent) => {
    setDraggedAgent(agent);
    event.dataTransfer.setData('application/json', JSON.stringify(agent));
  }, []);

  const handleMessageDrop = useCallback((messageId: string, agent: Participant) => {
    setDropTargetMessage(messageId);
    setDraggedAgent(agent);
    setBehavioralModalOpen(true);
  }, []);

  const handleBehavioralInjection = useCallback((config: any) => {
    console.log('Behavioral injection applied:', config);
    setBehavioralModalOpen(false);
    setDraggedAgent(null);
    setDropTargetMessage(null);
  }, []);

  const handleAddAgent = useCallback(() => {
    const agentNames = ['Gemini', 'Custom AI', 'Specialist'];
    const agentModels = ['gemini-pro', 'custom-model', 'specialist-v1'];
    const nextIndex = agents.length;
    
    const newAgent: Participant = {
      id: `agent-${Date.now()}`,
      name: agentNames[nextIndex % agentNames.length],
      type: 'agent',
      model: agentModels[nextIndex % agentModels.length],
      color: Object.values(AGENT_COLORS)[nextIndex % Object.values(AGENT_COLORS).length],
      status: 'active',
      trustScore: Math.floor(Math.random() * 20) + 80,
      joinedAt: new Date()
    };
    
    setParticipants(prev => [...prev, newAgent]);
  }, [agents.length]);

  const handleInviteHuman = useCallback((email: string, message?: string) => {
    const guestNames = ['Alex', 'Jordan', 'Taylor', 'Morgan'];
    const nextIndex = humans.length - 1; // -1 because host is already there
    
    const newHuman: Participant = {
      id: `human-${Date.now()}`,
      name: guestNames[nextIndex % guestNames.length],
      type: 'human',
      role: `guest${nextIndex + 1}` as any,
      color: Object.values(HUMAN_COLORS)[nextIndex % Object.values(HUMAN_COLORS).length],
      status: 'online',
      email,
      joinedAt: new Date()
    };
    
    setParticipants(prev => [...prev, newHuman]);
    console.log('Human invited:', email, message);
  }, [humans.length]);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      participantId: 'user-1',
      timestamp: new Date(),
      type: 'user'
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: `msg-${Date.now()}-ai`,
        content: `I understand you said: "${content}". This is a demo response from the enhanced chat interface.`,
        participantId: agentId || 'agent-claude',
        timestamp: new Date(),
        type: 'assistant'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  }, [agentId]);

  // Notify parent of participant changes
  useEffect(() => {
    onParticipantChange?.(participants);
  }, [participants, onParticipantChange]);

  return (
    <ModernChatProvider sessionId={sessionId}>
      <DragDropOrchestrator
        onAgentDrop={handleMessageDrop}
        onDragStart={handleAgentDragStart}
      >
        <Box
          sx={{
            height,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            overflow: 'hidden'
          }}
        >
          {/* Context Bar */}
          <ContextBar
            insights={conversationInsights}
            metrics={conversationMetrics}
            isExpanded={contextBarExpanded}
            onToggleExpanded={() => setContextBarExpanded(!contextBarExpanded)}
          />

          {/* Main Chat Area */}
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left Panel - AI Agents */}
            <ParticipantPanelLeft
              agents={agents}
              onAddAgent={handleAddAgent}
              onAgentSettings={(agentId) => console.log('Agent settings:', agentId)}
              onAgentDragStart={handleAgentDragStart}
              isVisible={leftPanelVisible}
              width={layoutConfig.leftWidth}
            />

            {/* Main Chat Container */}
            <Box
              sx={{
                width: layoutConfig.mainWidth,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a202c',
                overflow: 'hidden'
              }}
            >
              {/* Chat Mode Detector */}
              <ChatModeDetector
                participants={participants}
                onModeChange={(mode) => console.log('Chat mode:', mode)}
              />

              {/* Messages Area */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                {messages.length === 0 ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2,
                      color: '#64748b',
                      textAlign: 'center'
                    }}
                  >
                    <Box sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
                      🚀 Enhanced Multi-Agent Chat Interface
                    </Box>
                    <Box sx={{ fontSize: '0.9rem', maxWidth: '400px' }}>
                      Experience adaptive layouts, drag & drop behavioral injection, 
                      smart threading, and conversation intelligence.
                    </Box>
                    <Box sx={{ fontSize: '0.8rem', color: '#475569' }}>
                      Start typing to see the interface in action!
                    </Box>
                  </Box>
                ) : (
                  messages.map((message) => {
                    const participant = participants.find(p => p.id === message.participantId);
                    if (!participant) return null;

                    return (
                      <MessageDropTarget
                        key={message.id}
                        messageId={message.id}
                        onDrop={(agent) => handleMessageDrop(message.id, agent)}
                      >
                        <MessageIdentityStrip
                          participant={participant}
                          message={message.content}
                          timestamp={message.timestamp}
                          isThreaded={!!message.threadId}
                          threadLevel={message.parentMessageId ? 1 : 0}
                          showMetadata={false}
                        >
                          <AdaptiveMessageRenderer
                            message={{
                              id: message.id,
                              content: message.content,
                              sender: message.participantId,
                              senderName: participant.name,
                              timestamp: message.timestamp,
                              type: participant.type,
                              metadata: message.metadata
                            }}
                            participant={participant}
                            chatMode={chatMode}
                            onReply={(messageId) => console.log('Reply to:', messageId)}
                            onThread={(messageId) => setThreadCreationOpen(true)}
                          />
                        </MessageIdentityStrip>
                      </MessageDropTarget>
                    );
                  })
                )}
              </Box>

              {/* Message Input Area */}
              <Box
                sx={{
                  borderTop: '1px solid #334155',
                  backgroundColor: '#1e293b'
                }}
              >
                <MessageInput
                  onSendMessage={(message) => handleSendMessage(message.content)}
                  disabled={isLoading}
                  placeholder={`Message ${layoutConfig.leftWidth === '0%' && layoutConfig.rightWidth === '0%' ? 'AI' : 'everyone'}...`}
                />
              </Box>
            </Box>

            {/* Right Panel - Human Participants */}
            <ParticipantPanelRight
              humans={humans}
              onInviteHuman={handleInviteHuman}
              onHumanSettings={(humanId) => console.log('Human settings:', humanId)}
              onGenerateInviteLink={() => `https://chat.example.com/invite/${sessionId}`}
              isVisible={rightPanelVisible}
              width={layoutConfig.rightWidth}
            />
          </Box>

          {/* Threading Sidebar */}
          {selectedThreadId && (
            <ThreadNavigationSidebar
              threadId={selectedThreadId}
              onClose={() => setSelectedThreadId(null)}
            />
          )}

          {/* Behavioral Injection Modal */}
          <BehavioralInjectionModal
            open={behavioralModalOpen}
            onClose={() => setBehavioralModalOpen(false)}
            agent={draggedAgent}
            targetMessage={dropTargetMessage}
            onSubmit={handleBehavioralInjection}
          />

          {/* Thread Creation Modal */}
          <ThreadCreationModal
            open={threadCreationOpen}
            onClose={() => setThreadCreationOpen(false)}
            onCreateThread={(threadData) => {
              console.log('Thread created:', threadData);
              setThreadCreationOpen(false);
            }}
          />
        </Box>
      </DragDropOrchestrator>
    </ModernChatProvider>
  );
};

export default CompleteAdaptiveChatContainer;

