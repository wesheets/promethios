/**
 * AtlasChat.tsx
 * 
 * Core chat component for ATLAS that supports both public and session-based modes.
 * This component handles the chat interface, message history, and interaction logic.
 */

import React, { useState, useEffect, useRef } from 'react';
import './AtlasChat.css';
import VerificationHandler from '../../../utils/verificationHandler';

// Global type declarations for verification handler
declare global {
  interface Window {
    verificationHandler: VerificationHandler;
    startVerification: (buttonElement: HTMLElement) => void;
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'atlas' | 'system';
  content: string;
  timestamp: number;
}

export interface AtlasChatProps {
  mode: 'public' | 'session';
  agentId?: string;
  sessionId?: string;
  initialMessages?: ChatMessage[];
  onSendMessage?: (message: string) => Promise<string>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  isOpen?: boolean;
  onToggle?: () => void;
}

const AtlasChat: React.FC<AtlasChatProps> = ({
  mode = 'public',
  agentId,
  sessionId,
  initialMessages = [],
  onSendMessage,
  position = 'bottom-right',
  theme = 'dark',
  isOpen = false,
  onToggle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Default welcome messages based on mode
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = mode === 'public' 
        ? "Hello! I'm ATLAS, your governance companion for Promethios. How can I help you understand AI governance today?"
        : `Hello! I'm ATLAS, monitoring agent ${agentId || 'unknown'} for this session. I'm here to provide governance insights and answer questions about this agent's behavior.`;
      
      setMessages([
        {
          id: 'welcome-1',
          role: 'atlas',
          content: welcomeMessage,
          timestamp: Date.now()
        }
      ]);
    }
  }, [mode, agentId, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize verification handler
  useEffect(() => {
    // Initialize the verification handler for this chat instance
    if (!window.verificationHandler) {
      window.verificationHandler = new VerificationHandler();
    }
    
    // Make startVerification globally available
    if (!window.startVerification) {
      window.startVerification = (buttonElement: HTMLElement) => {
        window.verificationHandler.startVerification(buttonElement);
      };
    }
  }, []);

  // Toggle chat expansion
  const toggleChat = () => {
    setIsExpanded(!isExpanded);
    if (onToggle) {
      onToggle();
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // If onSendMessage is provided, use it to get a response
      let responseContent = '';
      
      if (onSendMessage) {
        responseContent = await onSendMessage(inputValue);
      } else {
        // Default responses if no handler is provided
        if (mode === 'public') {
          responseContent = getPublicModeResponse(inputValue);
        } else {
          responseContent = getSessionModeResponse(inputValue, agentId);
        }
      }
      
      const atlasResponse: ChatMessage = {
        id: `atlas-${Date.now()}`,
        role: 'atlas',
        content: responseContent,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, atlasResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'I apologize, but I encountered an error processing your request. Please try again later.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Default response generator for public mode
  const getPublicModeResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('governance') || lowerMessage.includes('constitution')) {
      return "Promethios governance is built on constitutional AI principles. Our system ensures that AI agents adhere to a set of predefined rules and constraints that guide their behavior. This creates more reliable, trustworthy, and safe AI systems.";
    }
    
    if (lowerMessage.includes('trust') || lowerMessage.includes('safety')) {
      return "Trust and safety are core to Promethios. Our governance framework provides real-time monitoring, verification, and enforcement of AI behavior. The Trust Shield you see indicates an agent is governed by Promethios and adheres to constitutional principles.";
    }
    
    if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
      return "Promethios works by wrapping AI agents in a governance layer that monitors, verifies, and enforces constitutional rules. I'm ATLAS, the companion agent that provides transparency into this process, showing you when and how governance is being applied.";
    }
    
    return "As the ATLAS companion for Promethios, I help explain how governance works in AI systems. I can tell you about our constitutional approach, trust mechanisms, and how we ensure AI systems remain safe and aligned with human values. What specific aspect would you like to know more about?";
  };

  // Default response generator for session mode
  const getSessionModeResponse = (message: string, agentId?: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('monitoring') || lowerMessage.includes('watching')) {
      return `I'm currently monitoring agent ${agentId || 'unknown'} for this session. I track governance metrics like constitutional compliance, belief trace accuracy, and trust scores in real-time.`;
    }
    
    if (lowerMessage.includes('violation') || lowerMessage.includes('breach')) {
      return "No governance violations have been detected in this session. If any constitutional breaches occur, I'll immediately alert you and provide details about the nature of the violation.";
    }
    
    if (lowerMessage.includes('trust') || lowerMessage.includes('score')) {
      return "The current trust score for this agent is 92/100, which is considered excellent. This score is calculated based on constitutional adherence, belief trace accuracy, and historical performance.";
    }
    
    return `I'm monitoring agent ${agentId || 'unknown'} for governance compliance. I can provide insights about this agent's trust score, constitutional adherence, and any potential violations. What specific information would you like to know?`;
  };

  return (
    <div className={`atlas-chat ${position} ${theme} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {isExpanded ? (
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-title">
              <div className="atlas-logo"></div>
              <h3>ATLAS Governance Companion</h3>
            </div>
            <button className="close-button" onClick={toggleChat}>×</button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                {msg.role === 'atlas' && <div className="atlas-avatar"></div>}
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message atlas">
                <div className="atlas-avatar"></div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about governance..."
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || inputValue.trim() === ''}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button className="chat-bubble" onClick={toggleChat}>
          <div className="atlas-icon"></div>
          <span>ATLAS</span>
        </button>
      )}
    </div>
  );
};

export default AtlasChat;
