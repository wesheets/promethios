import React, { useState, useRef, useEffect } from 'react';
import { useGovernance } from '../../context/GovernanceContext';
import AgentFirebaseService, { AgentConfiguration } from '../../firebase/agentService';

/**
 * Enhanced Chat Message Interface
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'observer';
  content: string;
  timestamp: number;
  agentId?: string;
  governanceEnabled?: boolean;
  trustScore?: number;
  violations?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    article?: string;
  }>;
  observerCommentary?: string;
  metadata?: {
    responseTime?: number;
    governanceOverhead?: number;
    complianceScore?: number;
  };
}

/**
 * Enhanced Chat Interface Props
 */
interface EnhancedChatInterfaceProps {
  agentId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  governanceEnabled: boolean;
  onGovernanceToggle: (enabled: boolean) => void;
  className?: string;
  showMetricsSidebar?: boolean;
  onToggleMetricsSidebar?: () => void;
}

/**
 * Enhanced Chat Interface Component
 * 
 * ChatGPT-inspired spacious layout with:
 * - Full-width conversation area
 * - Large message bubbles with generous padding
 * - Governance toggle in header
 * - Agent metrics in collapsible sidebar
 * - Observer commentary integration
 */
const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  agentId,
  messages,
  onSendMessage,
  governanceEnabled,
  onGovernanceToggle,
  className = '',
  showMetricsSidebar = true,
  onToggleMetricsSidebar
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<AgentConfiguration | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { governanceLevel, setGovernanceLevel } = useGovernance();

  // Load agent configuration
  useEffect(() => {
    const loadAgent = async () => {
      try {
        const agentConfig = await AgentFirebaseService.getAgentConfiguration(agentId);
        setAgent(agentConfig);
      } catch (error) {
        console.error('Error loading agent:', error);
      }
    };

    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle textarea auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Get trust score color
  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get governance level color
  const getGovernanceLevelColor = (level: string) => {
    switch (level) {
      case 'maximum': return 'bg-purple-100 text-purple-800';
      case 'strict': return 'bg-red-100 text-red-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`flex h-full bg-white ${className}`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {agent?.name || 'Loading...'}
                </h2>
                <p className="text-sm text-gray-500">
                  {agent?.description || 'Agent conversation'}
                </p>
              </div>
              {agent && (
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGovernanceLevelColor(agent.governanceLevel)}`}>
                    {agent.governanceLevel}
                  </span>
                  {agent.trustScore && (
                    <span className={`text-sm font-medium ${getTrustScoreColor(agent.trustScore)}`}>
                      Trust: {agent.trustScore}%
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Governance Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Governance</span>
                <button
                  onClick={() => onGovernanceToggle(!governanceEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    governanceEnabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      governanceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${governanceEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {governanceEnabled ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Metrics Sidebar Toggle */}
              {onToggleMetricsSidebar && (
                <button
                  onClick={onToggleMetricsSidebar}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Toggle metrics sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Send a message to {agent?.name || 'your agent'} to begin testing governance features.
                {governanceEnabled ? ' Governance is currently enabled.' : ' Governance is currently disabled.'}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                governanceEnabled={governanceEnabled}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-6 py-4 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {agent?.name || 'Agent'} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <form onSubmit={handleSubmit} className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent?.name || 'agent'}...`}
                className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '52px', maxHeight: '200px' }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="flex-shrink-0 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
          
          {/* Governance Status Indicator */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                Governance: <span className={governanceEnabled ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {governanceEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </span>
              {governanceEnabled && (
                <span>
                  Level: <span className="font-medium">{governanceLevel}</span>
                </span>
              )}
            </div>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Chat Message Component
 */
interface ChatMessageComponentProps {
  message: ChatMessage;
  governanceEnabled: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageComponentProps> = ({
  message,
  governanceEnabled
}) => {
  const [showViolations, setShowViolations] = useState(false);

  const isUser = message.type === 'user';
  const isObserver = message.type === 'observer';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${isUser ? 'ml-12' : 'mr-12'}`}>
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-6 py-4 ${
            isUser
              ? 'bg-blue-600 text-white'
              : isObserver
              ? 'bg-purple-50 border border-purple-200'
              : 'bg-gray-100'
          }`}
        >
          {/* Message Content */}
          <div className={`text-base leading-relaxed ${isObserver ? 'text-purple-900' : ''}`}>
            {message.content}
          </div>

          {/* Agent Message Metadata */}
          {!isUser && !isObserver && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                {message.trustScore && (
                  <span className={`font-medium ${
                    message.trustScore >= 90 ? 'text-green-600' :
                    message.trustScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Trust: {message.trustScore}%
                  </span>
                )}
                {message.governanceEnabled !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    message.governanceEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.governanceEnabled ? 'Governed' : 'Ungoverned'}
                  </span>
                )}
                {message.violations && message.violations.length > 0 && (
                  <button
                    onClick={() => setShowViolations(!showViolations)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    {message.violations.length} violation{message.violations.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
              
              {message.metadata?.responseTime && (
                <span className="text-gray-500">
                  {message.metadata.responseTime}ms
                </span>
              )}
            </div>
          )}

          {/* Violations Details */}
          {showViolations && message.violations && message.violations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              {message.violations.map((violation, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    violation.severity === 'high' ? 'bg-red-50 border border-red-200' :
                    violation.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">{violation.type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      violation.severity === 'high' ? 'bg-red-100 text-red-800' :
                      violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {violation.severity}
                    </span>
                  </div>
                  <p className="text-gray-700">{violation.description}</p>
                  {violation.article && (
                    <p className="text-gray-500 text-xs mt-1">
                      Constitutional Article: {violation.article}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observer Commentary */}
        {message.observerCommentary && (
          <div className="mt-2 ml-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div>
                  <p className="text-sm text-purple-900 font-medium">Observer</p>
                  <p className="text-sm text-purple-800">{message.observerCommentary}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-2 text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;

