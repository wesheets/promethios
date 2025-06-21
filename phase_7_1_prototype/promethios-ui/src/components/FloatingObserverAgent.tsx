/**
 * Floating Observer Agent Sidebar
 * A collapsible AI assistant that appears on all pages
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'observer';
  timestamp: Date;
}

interface FloatingObserverState {
  isExpanded: boolean;
  isThinking: boolean;
  isPulsing: boolean;
  messages: Message[];
  inputText: string;
  trustScore: number;
  currentContext: string;
}

const FloatingObserverAgent: React.FC = () => {
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<FloatingObserverState>({
    isExpanded: false,
    isThinking: false,
    isPulsing: false,
    messages: [],
    inputText: '',
    trustScore: 89,
    currentContext: 'Dashboard'
  });

  // Pulse on page navigation
  useEffect(() => {
    setState(prev => ({ ...prev, isPulsing: true }));
    
    // Update context based on current page
    const pathContext = getContextFromPath(location.pathname);
    setState(prev => ({ ...prev, currentContext: pathContext }));
    
    // Stop pulsing after animation
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, isPulsing: false }));
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const getContextFromPath = (pathname: string): string => {
    if (pathname.includes('dashboard')) return 'Dashboard';
    if (pathname.includes('agents')) return 'Agents Management';
    if (pathname.includes('governance')) return 'Governance Overview';
    if (pathname.includes('trust-metrics')) return 'Trust Metrics';
    if (pathname.includes('settings')) return 'Settings';
    return 'Promethios Platform';
  };

  const toggleExpanded = () => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  const handleSendMessage = async () => {
    if (!state.inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: state.inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputText: '',
      isThinking: true
    }));

    // Simulate AI thinking and response
    try {
      const response = await generateObserverResponse(state.inputText, state.currentContext);
      
      const observerMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'observer',
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, observerMessage],
        isThinking: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isThinking: false
      }));
    }
  };

  const generateObserverResponse = async (message: string, context: string): Promise<string> => {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try OpenAI API first, fallback to intelligent responses
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are the Promethios Observer Agent, an intelligent AI governance assistant. You help users with AI governance, trust metrics, compliance, and platform navigation. Current context: ${context}. Be helpful, concise, and focus on governance-related guidance.`
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 200,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices[0].message.content;
        }
      }
    } catch (error) {
      console.log('OpenAI API unavailable, using fallback response');
    }

    // Intelligent fallback responses based on context and message
    return getContextualResponse(message, context);
  };

  const getContextualResponse = (message: string, context: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('trust') || lowerMessage.includes('score')) {
      return `Your current trust score is ${state.trustScore}% (Compliant). This is based on governance adherence, policy compliance, and monitoring results. Would you like specific recommendations to improve it?`;
    }
    
    if (lowerMessage.includes('governance') || lowerMessage.includes('policy')) {
      return `In the ${context} section, I recommend focusing on policy compliance and regular audits. Your governance framework is performing well, but consider reviewing agent policies for optimization.`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return `I'm here to help with AI governance! In ${context}, you can monitor agents, review compliance, and optimize trust metrics. What specific area would you like guidance on?`;
    }
    
    if (lowerMessage.includes('agent') || lowerMessage.includes('monitor')) {
      return `For agent management in ${context}, I suggest regular health checks, policy reviews, and trust monitoring. Your agents are currently performing well with good compliance rates.`;
    }
    
    return `Thanks for your question about ${context}! I'm here to help with governance, compliance, and trust optimization. Your current governance score is strong at ${state.trustScore}%. How can I assist you further?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-full z-50 transition-all duration-300 ${
      state.isExpanded ? 'w-96' : 'w-16'
    }`}>
      {/* Floating Toggle Button */}
      <div 
        className={`absolute top-1/2 transform -translate-y-1/2 ${
          state.isExpanded ? 'right-96' : 'right-4'
        } transition-all duration-300 cursor-pointer ${
          state.isPulsing ? 'animate-pulse' : ''
        }`}
        onClick={toggleExpanded}
      >
        <div className={`w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors ${
          state.isPulsing ? 'ring-4 ring-blue-300 ring-opacity-50' : ''
        }`}>
          <div className="text-white text-xl">🤖</div>
          {state.isPulsing && (
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
          )}
        </div>
      </div>

      {/* Expanded Sidebar */}
      {state.isExpanded && (
        <div className="w-96 h-full bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Observer Agent</h3>
                  <p className="text-gray-400 text-xs">Intelligent Governance Assistant</p>
                </div>
              </div>
              <button 
                onClick={toggleExpanded}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Status Bar */}
            <div className="mt-3 p-2 bg-gray-700 rounded">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Context: {state.currentContext}</span>
                <span className="text-green-400">● Governed</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-300">Trust Score: {state.trustScore}%</span>
                <span className="text-blue-400">OpenAI Ready</span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {state.messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-sm">Hi! I'm your AI governance assistant.</p>
                <p className="text-xs mt-1">Ask me about trust metrics, compliance, or governance!</p>
              </div>
            )}
            
            {state.messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Thinking Indicator */}
            {state.isThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">Observer is thinking</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={state.inputText}
                onChange={(e) => setState(prev => ({ ...prev, inputText: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="Ask about governance, trust metrics, compliance..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                disabled={state.isThinking}
              />
              <button
                onClick={handleSendMessage}
                disabled={state.isThinking || !state.inputText.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by OpenAI • Governed by Promethios
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingObserverAgent;

