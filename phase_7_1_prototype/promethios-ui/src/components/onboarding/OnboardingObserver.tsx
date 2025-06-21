import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingObserver: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'observer', timestamp: Date}>>([]);
  const [isTyping, setIsTyping] = useState(false);

  const demoConversation = [
    {
      user: "What is the Observer Agent?",
      observer: "I'm your AI governance assistant! I monitor your AI systems in real-time, help prevent hallucinations, and ensure compliance with your governance policies. Think of me as your AI's guardian angel. 🛡️"
    },
    {
      user: "How do you prevent hallucinations?",
      observer: "Great question! I work with three core systems: Vigil monitors behavior patterns, Veritas fact-checks information against trusted sources, and PRISM provides transparency into AI reasoning. When I detect potential issues, I intervene before they reach users."
    },
    {
      user: "Can you help me understand my trust score?",
      observer: "Absolutely! Your current trust score is 85, which is quite good. It's calculated from four dimensions: Competence (92%), Reliability (88%), Honesty (82%), and Transparency (79%). I'd recommend focusing on transparency to boost your overall score."
    }
  ];

  const features = [
    {
      title: "Real-time Monitoring",
      description: "I watch your AI systems 24/7, detecting anomalies and potential issues before they impact users.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      title: "Intelligent Assistance",
      description: "Ask me anything about governance, compliance, or your AI's performance. I provide context-aware guidance.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "Proactive Alerts",
      description: "I notify you immediately when trust scores drop, violations occur, or attention is needed.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 4.343l1.414 1.414m9.899 9.899l1.414 1.414m-12.728 0l1.414-1.414m9.899-9.899l1.414-1.414M12 3v3m6 6h3M12 18v3M3 12h3" />
        </svg>
      )
    },
    {
      title: "Governance Education",
      description: "I help you understand AI governance concepts and best practices, making compliance accessible.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentStep, features.length]);

  const simulateChat = (conversationIndex: number) => {
    const conversation = demoConversation[conversationIndex];
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: conversation.user,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages([userMessage]);
    setIsTyping(true);
    
    // Add observer response after delay
    setTimeout(() => {
      setIsTyping(false);
      const observerMessage = {
        id: Date.now() + 1,
        text: conversation.observer,
        sender: 'observer' as const,
        timestamp: new Date()
      };
      setMessages([userMessage, observerMessage]);
    }, 2000);
  };

  const handleContinue = () => {
    navigate('/ui/dashboard');
  };

  const handleBack = () => {
    navigate('/ui/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">PROMETHIOS</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Meet Your Observer Agent
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Your intelligent AI governance assistant is always watching, learning, and helping. 
            Think of it as your AI's guardian angel, ensuring trust and compliance 24/7.
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Side - Chat Interface */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Observer Agent</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-purple-100 text-sm">Online & Monitoring</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 h-80 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p>Try asking me a question!</p>
                  <p className="text-sm mt-2">Click one of the sample questions below</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
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
            
            {/* Sample Questions */}
            <div className="border-t border-gray-700 p-4">
              <p className="text-gray-400 text-sm mb-3">Try these questions:</p>
              <div className="space-y-2">
                {demoConversation.map((conv, index) => (
                  <button
                    key={index}
                    onClick={() => simulateChat(index)}
                    className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    "{conv.user}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">What I Can Do For You</h2>
            
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`p-6 rounded-xl border transition-all duration-300 ${
                  currentStep === index
                    ? 'bg-purple-900/20 border-purple-500 shadow-lg'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    currentStep === index
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Where to Find Me */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Where to Find Me</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Left Sidebar</h3>
              <p className="text-gray-300">Look for the green shield icon above the collapse arrow. Click to expand and chat with me!</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 4.343l1.414 1.414m9.899 9.899l1.414 1.414m-12.728 0l1.414-1.414m9.899-9.899l1.414-1.414M12 3v3m6 6h3M12 18v3M3 12h3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Alerts</h3>
              <p className="text-gray-300">I'll pulse and glow when your attention is needed, especially when trust scores drop below 70.</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Options</span>
          </button>

          <button
            onClick={handleContinue}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105"
          >
            <span>Start Using Promethios</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingObserver;

