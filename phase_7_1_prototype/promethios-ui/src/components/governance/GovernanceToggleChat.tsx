import React, { useState, useEffect } from 'react';
import { useGovernance } from '../../context/GovernanceContext';
import { useAuth } from '../../context/AuthContext';
import { agentService } from '../../firebase/agentService';
import { governanceService } from '../../services/governanceService';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  trustScore: number;
  governanceLevel: string;
}

interface Message {
  id: string;
  type: 'user' | 'agent' | 'observer';
  content: string;
  timestamp: Date;
  trustScore?: number;
  violations?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  governanceApplied?: boolean;
}

const GovernanceToggleChat: React.FC = () => {
  const { state, toggleGovernance, setCurrentAgent } = useGovernance();
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load user's agents
  useEffect(() => {
    const loadAgents = async () => {
      if (user) {
        try {
          const userAgents = await agentService.getUserAgents(user.uid);
          const formattedAgents = userAgents.map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status as 'active' | 'inactive',
            trustScore: agent.trustScore || 85,
            governanceLevel: agent.governanceLevel,
          }));
          setAgents(formattedAgents);
          
          // Set first agent as current if none selected
          if (formattedAgents.length > 0 && !state.currentAgent) {
            setCurrentAgent(formattedAgents[0].id);
          }
        } catch (error) {
          console.error('Failed to load agents:', error);
        }
      }
    };

    loadAgents();
  }, [user, setCurrentAgent, state.currentAgent]);

  const currentAgent = agents.find(agent => agent.id === state.currentAgent);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !state.currentAgent || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send message with current governance state
      const response = await governanceService.sendMessage(
        state.currentAgent,
        userMessage.content,
        state.isGovernanceEnabled,
        state.governanceLevel
      );

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: response.response,
          timestamp: new Date(),
          trustScore: response.trustScore,
          violations: response.violations,
          governanceApplied: state.isGovernanceEnabled,
        };

        setMessages(prev => [...prev, agentMessage]);

        // Add Observer commentary if governance is enabled and there are insights
        if (state.isGovernanceEnabled && response.trustScore) {
          setTimeout(() => {
            const observerMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'observer',
              content: `Trust Score: ${response.trustScore}%. ${
                response.violations && response.violations.length > 0
                  ? `Detected ${response.violations.length} potential concern(s). `
                  : 'No governance violations detected. '
              }Response meets ${state.governanceLevel} governance standards.`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, observerMessage]);
          }, 500);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getGovernanceStatusColor = () => {
    return state.isGovernanceEnabled ? 'text-green-400' : 'text-red-400';
  };

  const getGovernanceStatusText = () => {
    return state.isGovernanceEnabled 
      ? `Governed (${state.governanceLevel})` 
      : 'Ungoverned';
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header with Agent Selection and Governance Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Agent Selector */}
          <select
            value={state.currentAgent || ''}
            onChange={(e) => setCurrentAgent(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.type})
              </option>
            ))}
          </select>

          {/* Current Agent Info */}
          {currentAgent && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                currentAgent.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-300">
                Trust: {currentAgent.trustScore}%
              </span>
            </div>
          )}
        </div>

        {/* Governance Toggle */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">Governance:</span>
          <button
            onClick={toggleGovernance}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
              state.isGovernanceEnabled ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.isGovernanceEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${getGovernanceStatusColor()}`}>
            {getGovernanceStatusText()}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-lg mb-2">Start a conversation with your agent</p>
            <p className="text-sm">
              Toggle governance on/off to see the difference in responses
            </p>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'observer'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {message.type === 'user' ? 'You' : 
                   message.type === 'observer' ? 'Observer' : 
                   currentAgent?.name || 'Agent'}
                </span>
                {message.trustScore && (
                  <span className="text-xs bg-green-500 px-2 py-1 rounded">
                    Trust: {message.trustScore}%
                  </span>
                )}
              </div>

              {/* Message Content */}
              <p className="text-sm">{message.content}</p>

              {/* Governance Indicator */}
              {message.type === 'agent' && (
                <div className="mt-2 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    message.governanceApplied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {message.governanceApplied ? 'Governed' : 'Ungoverned'}
                  </span>
                </div>
              )}

              {/* Violations */}
              {message.violations && message.violations.length > 0 && (
                <div className="mt-2 text-xs">
                  <p className="text-yellow-300">
                    ⚠️ {message.violations.length} concern(s) detected
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-300 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              state.currentAgent 
                ? `Message ${currentAgent?.name || 'agent'}...` 
                : 'Select an agent to start chatting...'
            }
            disabled={!state.currentAgent || isLoading}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !state.currentAgent || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
        
        {/* Governance Status Indicator */}
        <div className="mt-2 text-xs text-gray-400 text-center">
          {state.currentAgent ? (
            <>
              Chatting with {currentAgent?.name} • 
              <span className={getGovernanceStatusColor()}>
                {' '}{getGovernanceStatusText()}
              </span>
            </>
          ) : (
            'Select an agent to begin conversation'
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernanceToggleChat;

