/**
 * AtlasChatSession.tsx
 * 
 * Session-based ATLAS chat component for logged-in users.
 * This component focuses on providing governance insights for specific agent sessions.
 */

import React, { useState, useEffect } from 'react';
import AtlasChat from './AtlasChat';
import AtlasChatService from './AtlasChatService';

// Governance metrics examples for different agent types
const agentMetrics = {
  default: {
    trustScore: 92,
    complianceRate: 99.7,
    beliefTraceAccuracy: 97.5,
    constitutionalViolations: 0,
    lastVerified: new Date().toISOString()
  },
  assistant: {
    trustScore: 94,
    complianceRate: 99.8,
    beliefTraceAccuracy: 98.2,
    constitutionalViolations: 0,
    lastVerified: new Date().toISOString()
  },
  researcher: {
    trustScore: 91,
    complianceRate: 99.5,
    beliefTraceAccuracy: 96.8,
    constitutionalViolations: 0,
    lastVerified: new Date().toISOString()
  },
  creative: {
    trustScore: 89,
    complianceRate: 99.3,
    beliefTraceAccuracy: 95.7,
    constitutionalViolations: 0,
    lastVerified: new Date().toISOString()
  }
};

// Agent-specific governance explanations
const agentGovernanceExplanations = {
  default: {
    purpose: "This agent is governed by Promethios to ensure it operates safely, ethically, and in alignment with human values.",
    constraints: "The agent operates under a set of constitutional constraints that prevent harmful outputs while maintaining helpfulness.",
    monitoring: "PRISM is actively monitoring this agent's reasoning process and outputs for compliance with governance standards."
  },
  assistant: {
    purpose: "This assistant agent is governed to provide helpful, accurate, and safe responses across a wide range of topics.",
    constraints: "Constitutional constraints ensure the assistant remains helpful without providing harmful advice or misleading information.",
    monitoring: "PRISM monitors the assistant's responses to ensure factual accuracy and appropriate content."
  },
  researcher: {
    purpose: "This research agent is governed to support academic and scientific inquiry while maintaining ethical standards.",
    constraints: "Constitutional constraints balance academic freedom with ethical considerations around sensitive research topics.",
    monitoring: "PRISM monitors research outputs to ensure methodological soundness and ethical compliance."
  },
  creative: {
    purpose: "This creative agent is governed to support artistic expression while respecting content safety guidelines.",
    constraints: "Constitutional constraints balance creative freedom with appropriate content boundaries.",
    monitoring: "PRISM monitors creative outputs to ensure they remain within content safety guidelines."
  }
};

interface AtlasChatSessionProps {
  agentId: string;
  sessionId: string;
  agentType?: 'assistant' | 'researcher' | 'creative';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  initialOpen?: boolean;
  username?: string;
}

const AtlasChatSession: React.FC<AtlasChatSessionProps> = ({
  agentId,
  sessionId,
  agentType = 'assistant',
  position = 'bottom-right',
  theme = 'dark',
  initialOpen = false,
  username
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<any[]>([]);
  const [metrics, setMetrics] = useState(agentMetrics[agentType] || agentMetrics.default);
  const [explanations, setExplanations] = useState(agentGovernanceExplanations[agentType] || agentGovernanceExplanations.default);
  
  // Initialize chat service for session mode
  const chatServiceRef = React.useRef(new AtlasChatService({
    mode: 'session',
    agentId,
    sessionId,
    conversationHistory: [],
    userProfile: {
      isLoggedIn: true,
      username: username || 'User'
    }
  }));
  
  // Initialize with welcome message
  useEffect(() => {
    const chatService = chatServiceRef.current;
    const history = chatService.getConversationHistory();
    
    if (history.length === 0) {
      // Add initial welcome message
      chatService.switchMode('session', agentId, sessionId);
    }
    
    setMessages(chatService.getConversationHistory().map((msg, index) => ({
      id: `msg-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    })));
    
    // Simulate periodic metric updates
    const intervalId = setInterval(() => {
      // Small random fluctuations in metrics to simulate live monitoring
      setMetrics(prev => ({
        ...prev,
        trustScore: Math.max(80, Math.min(100, prev.trustScore + (Math.random() * 0.4 - 0.2))),
        beliefTraceAccuracy: Math.max(90, Math.min(100, prev.beliefTraceAccuracy + (Math.random() * 0.3 - 0.15))),
        lastVerified: new Date().toISOString()
      }));
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [agentId, sessionId]);
  
  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    try {
      const chatService = chatServiceRef.current;
      let response = await chatService.processMessage(message);
      
      // Enhance responses with agent-specific governance insights
      const lowerMessage = message.toLowerCase();
      
      // Add metrics information when asked about status or metrics
      if (lowerMessage.includes('status') || lowerMessage.includes('metrics') || lowerMessage.includes('score')) {
        response += `\n\n**Current Governance Metrics**:\n- Trust Score: ${metrics.trustScore.toFixed(1)}/100\n- Compliance Rate: ${metrics.complianceRate}%\n- Belief Trace Accuracy: ${metrics.beliefTraceAccuracy.toFixed(1)}%\n- Constitutional Violations: ${metrics.constitutionalViolations}\n- Last Verified: ${new Date(metrics.lastVerified).toLocaleString()}`;
      }
      
      // Add agent-specific governance explanation when asked about the agent
      if (lowerMessage.includes('agent') || lowerMessage.includes('governance') || lowerMessage.includes('how it works')) {
        response += `\n\n**Agent Governance Information**:\n- Purpose: ${explanations.purpose}\n- Constraints: ${explanations.constraints}\n- Monitoring: ${explanations.monitoring}`;
      }
      
      // Add real-time monitoring note for specific questions
      if (lowerMessage.includes('monitor') || lowerMessage.includes('watching') || lowerMessage.includes('tracking')) {
        response += `\n\nI'm actively monitoring this session in real-time. If any governance concerns arise, I'll alert you immediately and provide guidance on next steps.`;
      }
      
      // Update messages from service
      setMessages(chatService.getConversationHistory().map((msg, index) => ({
        id: `msg-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })));
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return "I apologize, but I encountered an error processing your request. Please try again.";
    }
  };
  
  return (
    <AtlasChat
      mode="session"
      agentId={agentId}
      sessionId={sessionId}
      position={position}
      theme={theme}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      initialMessages={messages}
      onSendMessage={handleSendMessage}
    />
  );
};

export default AtlasChatSession;
