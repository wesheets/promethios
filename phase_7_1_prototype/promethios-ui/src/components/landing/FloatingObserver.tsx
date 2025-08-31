import React, { useState, useEffect } from 'react';

interface FloatingObserverProps {
  className?: string;
}

const FloatingObserver: React.FC<FloatingObserverProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'observer'}>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    "What is Spark?",
    "How do you prevent hallucinations?",
    "What's a trust score?",
    "Can you wrap ChatGPT?"
  ];

  const responses = {
    "What is Spark?": "I'm your AI governance platform! I wrap any LLM or agent with real-time policy enforcement, trust scoring, and hallucination prevention. Think of me as the observability layer for AI systems. 🛡️",
    "How do you prevent hallucinations?": "Great question! I work with three core systems: Vigil monitors behavior patterns, Veritas fact-checks against trusted sources, and PRISM provides transparency. When I detect fabricated content like fake legal cases, I intervene immediately.",
    "What's a trust score?": "Your trust score combines four dimensions: Competence (how accurate), Reliability (how consistent), Honesty (truthfulness), and Transparency (explainability). A score of 85% means strong governance with room for improvement!",
    "Can you wrap ChatGPT?": "Absolutely! I can wrap any LLM - ChatGPT, Claude, Gemini, you name it. No retraining needed. Just add governance policies like HIPAA compliance, and I'll monitor every interaction in real-time."
  };

  const handleQuestionClick = (question: string) => {
    const userMessage = {
      id: Date.now(),
      text: question,
      sender: 'user' as const
    };
    
    setMessages([userMessage]);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const observerMessage = {
        id: Date.now() + 1,
        text: responses[question as keyof typeof responses] || "I'm here to help with any questions about AI governance!",
        sender: 'observer' as const
      };
      setMessages([userMessage, observerMessage]);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: currentInput,
      sender: 'user' as const
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const observerMessage = {
        id: Date.now() + 1,
        text: "Thanks for your question! I'm a demo version, but the real Observer Agent can help with governance, trust scores, and compliance. Try the quick questions above for more detailed responses!",
        sender: 'observer' as const
      };
      setMessages(prev => [...prev, observerMessage]);
    }, 1500);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {!isExpanded ? (
        // Minimized Observer
        <button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group animate-pulse hover:animate-none"
        >
          <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask me about AI governance
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      ) : (
        // Expanded Observer Chat
        <div className="w-96 h-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Observer Agent</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-green-100 text-xs">Online & Monitoring</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm">Hi! I'm your AI governance assistant.</p>
                <p className="text-xs mt-1">Ask me anything about trust scores, governance, or wrapping ChatGPT!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-100 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length === 0 && (
            <div className="px-4 pb-2">
              <p className="text-gray-400 text-xs mb-2">Quick questions:</p>
              <div className="space-y-1">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="w-full text-left p-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-700 p-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about governance..."
                className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingObserver;

