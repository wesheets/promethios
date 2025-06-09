import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Intelligent Hovering Observer
 * 
 * An OpenAI-powered AI companion that floats on every page, providing
 * contextual guidance, answering questions, and celebrating user progress.
 */
interface HoveringObserverProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

const HoveringObserver: React.FC<HoveringObserverProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context-aware greetings based on current page
  const getContextualGreeting = () => {
    const path = location.pathname;
    
    if (path.includes('/onboarding')) {
      return "👋 Hi! I'm your AI governance companion. I'm here to guide you through understanding AI governance. Feel free to ask me anything!";
    } else if (path.includes('/dashboard')) {
      return "📊 Welcome to your governance dashboard! I can help explain any metrics or insights you see here.";
    } else if (path.includes('/agents')) {
      return "🤖 I see you're managing agents! I can help with agent configuration, team setup, or governance best practices.";
    } else if (path.includes('/governance')) {
      return "🛡️ You're in the governance center! I can explain how our constitutional framework works or help you test governance features.";
    } else if (path.includes('/deploy')) {
      return "🚀 Ready to deploy? I can guide you through the deployment options and help ensure your agents are production-ready.";
    } else {
      return "🦉 Hi! I'm your AI governance companion. I'm here to help you navigate Promethios and understand AI governance. What can I help you with?";
    }
  };

  // Auto-greet when Observer becomes visible
  useEffect(() => {
    if (isVisible && !hasGreeted) {
      const greeting = getContextualGreeting();
      setMessages([{ role: 'assistant', content: greeting }]);
      setHasGreeted(true);
    }
  }, [isVisible, hasGreeted, location.pathname]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate intelligent responses (in production, this would call OpenAI API)
  const getIntelligentResponse = async (userMessage: string): Promise<string> => {
    const path = location.pathname;
    const lowerMessage = userMessage.toLowerCase();

    // Context-aware responses based on current page and user question
    if (lowerMessage.includes('trust score')) {
      return "🎯 Trust scores measure how well an agent follows governance principles! They range from 0-100 and are calculated based on:\n\n• Constitutional compliance (Articles 1.1-5.2)\n• Decision transparency\n• Bias detection\n• Error handling\n\nHigher scores mean more trustworthy AI behavior. Want me to show you how to improve an agent's trust score?";
    }
    
    if (lowerMessage.includes('governance') && lowerMessage.includes('work')) {
      return "🛡️ AI governance is like having a constitution for your AI agents! It ensures they:\n\n• Make fair, unbiased decisions\n• Explain their reasoning clearly\n• Follow ethical guidelines\n• Maintain audit trails\n\nThink of it as guardrails that keep AI safe and trustworthy. Would you like to see a live demo of governed vs ungoverned AI?";
    }

    if (lowerMessage.includes('team') || lowerMessage.includes('collaboration')) {
      return "👥 Multi-agent teams are powerful! When agents work together with governance:\n\n• Each agent has specialized roles\n• Governance ensures fair collaboration\n• Trust scores track team performance\n• Observer monitors interactions\n\nTeams can handle complex workflows like product launches or security incidents. Want to create your first team?";
    }

    if (lowerMessage.includes('deploy') || lowerMessage.includes('production')) {
      return "🚀 Deployment packages your governed agents for production! We support:\n\n• Docker containers (most popular)\n• AWS Lambda functions\n• REST API services\n• Microservices architecture\n\nAll packages include governance frameworks embedded. Ready to deploy something?";
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
      if (path.includes('/onboarding')) {
        return "🎓 No worries! Onboarding can feel overwhelming. Here's what I recommend:\n\n1. Take your time with each step\n2. Try the interactive demos\n3. Ask me specific questions\n4. Remember: you can always come back later\n\nWhat specific part would you like help with?";
      } else {
        return "💡 I'm here to help! Here are some things I can assist with:\n\n• Explaining any feature or concept\n• Troubleshooting issues\n• Best practices for AI governance\n• Navigating the interface\n\nJust ask me anything specific, or tell me what you're trying to accomplish!";
      }
    }

    // Default intelligent response
    return "🤔 That's a great question! While I'm designed to help with AI governance concepts, I might need a bit more context to give you the best answer. Could you tell me more about what you're trying to accomplish or what specific aspect you'd like to understand better?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = await getIntelligentResponse(userMessage);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && onToggle) {
      onToggle();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Chat Interface */}
      {isExpanded && (
        <div className="mb-4 w-80 h-96 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-2">🦉</div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Governance Guide</h3>
                <p className="text-blue-100 text-xs">Always here to help</p>
              </div>
            </div>
            <button
              onClick={toggleExpanded}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 p-3 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about AI governance..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Observer Button */}
      <button
        onClick={toggleExpanded}
        className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${
          isExpanded 
            ? 'bg-gray-700 border-2 border-blue-400' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
        }`}
      >
        <div className="text-2xl">🦉</div>
        
        {/* Notification dot for proactive suggestions */}
        {!isExpanded && messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default HoveringObserver;

