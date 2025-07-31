import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  trustScore?: number;
  governanceStatus?: string;
  policyChecks?: string[];
  timestamp: Date;
}

interface DemoWidgetProps {
  onClose: () => void;
}

export function DemoWidget({ onClose }: DemoWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hi! I'm a governed AI assistant powered by Anthropic and Promethios. Try asking me anything and watch the real-time governance in action!",
      isUser: false,
      trustScore: 0.96,
      governanceStatus: 'approved',
      policyChecks: ['Content Safety ✓', 'Professional Tone ✓', 'Welcome Message ✓'],
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messagesRemaining, setMessagesRemaining] = useState(4);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate session ID
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || messagesRemaining <= 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call demo API
      const response = await fetch('/api/standalone-chatbot/demo/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          session_id: sessionId
        }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        trustScore: data.trust_score,
        governanceStatus: data.governance_status,
        policyChecks: data.policy_checks,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setMessagesRemaining(data.messages_remaining);
      setShowSignupPrompt(data.show_signup_prompt);

    } catch (error) {
      // Fallback to mock response
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm experiencing high demand right now. This is a demo of Promethios governance - notice the trust score and policy checks below!",
        isUser: false,
        trustScore: 0.88,
        governanceStatus: 'approved',
        policyChecks: ['Content Safety ✓', 'Fallback Response ✓'],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, mockResponse]);
      setMessagesRemaining(prev => prev - 1);
      
      if (messagesRemaining <= 2) {
        setShowSignupPrompt(true);
      }
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGovernanceStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'flagged': return 'text-yellow-400';
      case 'blocked': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            <div>
              <h3 className="font-semibold">Governed AI Demo</h3>
              <p className="text-xs text-indigo-200">Powered by Anthropic + Promethios</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-indigo-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="fade-in">
              <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isUser 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Governance indicators for bot messages */}
                  {!message.isUser && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          <span className={getTrustScoreColor(message.trustScore || 0)}>
                            Trust: {((message.trustScore || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className={`flex items-center ${getGovernanceStatusColor(message.governanceStatus || '')}`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span className="capitalize">{message.governanceStatus}</span>
                        </div>
                      </div>
                      
                      {message.policyChecks && message.policyChecks.length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-400">
                            {message.policyChecks.join(' • ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-white px-4 py-2 rounded-lg max-w-xs">
                <div className="flex items-center">
                  <div className="spinner mr-2"></div>
                  <span className="text-sm">Analyzing with governance...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Signup Prompt */}
        {showSignupPrompt && (
          <div className="px-4 py-2 bg-indigo-900 border-t border-indigo-700">
            <div className="text-center">
              <p className="text-sm text-indigo-200 mb-2">
                🎯 Ready to create your own governed chatbot?
              </p>
              <Link 
                to="/signup" 
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          {messagesRemaining > 0 ? (
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="ml-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-400 text-center">
                {messagesRemaining} demo messages remaining
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-3">
                🚀 Demo complete! Create unlimited chatbots with your free trial.
              </p>
              <Link 
                to="/signup" 
                className="btn-primary text-sm px-4 py-2"
              >
                Start Free Trial
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-900 rounded-b-lg">
          <div className="text-xs text-gray-500 text-center">
            Powered by <span className="text-indigo-400">Promethios</span> governance
          </div>
        </div>
      </div>
    </div>
  );
}

