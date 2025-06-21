import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  violationDetected?: boolean;
  violationType?: string;
  trustScoreImpact?: number;
}

interface GovernanceAlert {
  id: string;
  type: 'violation' | 'warning' | 'info';
  message: string;
  details: string;
  timestamp: Date;
}

interface GovernanceDemoChatProps {
  open: boolean;
  onClose: () => void;
  selectedAgent: string;
  governanceEnabled: boolean;
  scenario: string;
  isLoggedIn?: boolean;
}

const API_BASE_URL = 'https://promethios-phase-7-1-api.onrender.com/api/benchmark';

// Simulated responses for marketing demo
const simulatedResponses = {
  healthcare: {
    governed: {
      "medical advice": {
        response: "I understand you're looking for health information, but I'm not qualified to provide medical advice. For your safety, I recommend consulting with a licensed healthcare professional who can properly evaluate your specific situation and provide appropriate guidance.",
        violation: false
      },
      "chest pain": {
        response: "I cannot provide medical diagnosis or treatment recommendations. Chest pain can have many causes and requires proper medical evaluation. Please contact your healthcare provider or emergency services if you're experiencing concerning symptoms.",
        violation: false
      }
    },
    ungoverned: {
      "medical advice": {
        response: "Based on your symptoms, it sounds like you might have a serious condition. I recommend taking these specific medications and avoiding certain activities. Here's my diagnosis...",
        violation: true,
        violationType: "HIPAA Violation - Unauthorized Medical Advice",
        details: "AI attempted to provide medical diagnosis without proper credentials or patient evaluation."
      },
      "chest pain": {
        response: "That chest pain is probably just anxiety or heartburn. Try taking some antacids and don't worry about it. No need to see a doctor unless it gets much worse...",
        violation: true,
        violationType: "Medical Liability Risk",
        details: "Potentially dangerous medical advice that could delay necessary treatment."
      }
    }
  },
  legal: {
    governed: {
      "legal advice": {
        response: "I can provide general information about legal topics, but I cannot give specific legal advice. For matters affecting your legal rights or obligations, please consult with a qualified attorney who can review your specific circumstances.",
        violation: false
      },
      "lawsuit": {
        response: "Legal disputes involve complex factors that require professional analysis. I'd recommend consulting with an attorney who specializes in the relevant area of law to understand your options and rights.",
        violation: false
      }
    },
    ungoverned: {
      "legal advice": {
        response: "You definitely have a strong case and should sue immediately. Based on what you've told me, you'll probably win and get a large settlement. Here's exactly what you should do in court...",
        violation: true,
        violationType: "Unauthorized Practice of Law",
        details: "AI provided specific legal advice without proper licensing or case analysis."
      },
      "lawsuit": {
        response: "I've seen similar cases and you're guaranteed to win. Don't bother with a lawyer - just file the paperwork yourself and demand $500,000 in damages...",
        violation: true,
        violationType: "Legal Malpractice Risk",
        details: "Potentially harmful legal guidance that could damage user's legal position."
      }
    }
  },
  financial: {
    governed: {
      "investment advice": {
        response: "I can provide general information about investment concepts, but I cannot give personalized investment advice. For investment decisions, please consult with a qualified financial advisor who can assess your specific financial situation and goals.",
        violation: false
      },
      "stock tips": {
        response: "I cannot provide specific stock recommendations or trading advice. Investment decisions should be based on thorough research and professional guidance tailored to your financial circumstances.",
        violation: false
      }
    },
    ungoverned: {
      "investment advice": {
        response: "You should definitely put all your money into these specific stocks I'm about to recommend. Based on my analysis, these are guaranteed winners that will double your money in 6 months...",
        violation: true,
        violationType: "Unlicensed Financial Advice",
        details: "AI provided specific investment recommendations without proper licensing or risk disclosure."
      },
      "stock tips": {
        response: "Buy Tesla, GameStop, and Bitcoin immediately! Trust me, I've analyzed the market and these are sure things. Sell everything else and go all-in on these picks...",
        violation: true,
        violationType: "Securities Violation Risk",
        details: "Potentially harmful financial advice without proper risk disclosure or qualification."
      }
    }
  }
};

export const GovernanceDemoChat: React.FC<GovernanceDemoChatProps> = ({
  open,
  onClose,
  selectedAgent,
  governanceEnabled,
  scenario,
  isLoggedIn = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [trustScore, setTrustScore] = useState(85);
  const [violationsCount, setViolationsCount] = useState(0);
  const [governanceAlerts, setGovernanceAlerts] = useState<GovernanceAlert[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      // Reset chat when opening
      const demoType = isLoggedIn ? 'Live Agent Demo' : 'Marketing Demo';
      setMessages([{
        id: '1',
        role: 'system',
        content: `${selectedAgent} is ready to chat. Governance is ${governanceEnabled ? 'ENABLED' : 'DISABLED'}. (${demoType})`,
        timestamp: new Date()
      }]);
      setTrustScore(85);
      setViolationsCount(0);
      setGovernanceAlerts([]);
    }
  }, [open, selectedAgent, governanceEnabled, isLoggedIn]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      let responseData;
      
      if (isLoggedIn) {
        // Real agent integration for logged-in users
        responseData = await getRealAgentResponse(inputValue, selectedAgent, governanceEnabled);
      } else {
        // Simulated response for marketing demo
        responseData = getSimulatedResponse(inputValue, scenario, governanceEnabled);
      }

      // Simulate AI response delay
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseData.response,
          timestamp: new Date(),
          violationDetected: responseData.violation,
          violationType: responseData.violationType,
          trustScoreImpact: responseData.violation ? -10 : 2
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update trust score and violations
        if (responseData.violation && governanceEnabled) {
          setTrustScore(prev => Math.max(0, prev - 15));
          setViolationsCount(prev => prev + 1);
          
          // Add governance alert
          const alert: GovernanceAlert = {
            id: Date.now().toString(),
            type: 'violation',
            message: `Violation Prevented: ${responseData.violationType}`,
            details: responseData.details || 'Potentially harmful content was blocked by Promethios governance.',
            timestamp: new Date()
          };
          setGovernanceAlerts(prev => [...prev, alert]);
        } else if (!responseData.violation) {
          setTrustScore(prev => Math.min(100, prev + 1));
        }
        
        setIsTyping(false);
      }, isLoggedIn ? 3000 : 2000); // Slightly longer delay for real agents
    } catch (error) {
      console.error('Error getting agent response:', error);
      setIsTyping(false);
      
      // Fallback to simulated response on error
      const fallbackResponse = getSimulatedResponse(inputValue, scenario, governanceEnabled);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const getRealAgentResponse = async (input: string, agent: string, governance: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          agent: agent,
          governance_enabled: governance,
          scenario: scenario
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        response: data.response || 'I apologize, but I encountered an error processing your request.',
        violation: data.violation_detected || false,
        violationType: data.violation_type,
        details: data.violation_details
      };
    } catch (error) {
      console.error('Real agent API error:', error);
      throw error;
    }
  };

  const getSimulatedResponse = (input: string, scenario: string, governed: boolean) => {
    const responses = simulatedResponses[scenario as keyof typeof simulatedResponses];
    if (!responses) {
      return {
        response: "I'm ready to help with your questions about " + scenario + ".",
        violation: false
      };
    }

    const governanceState = governed ? 'governed' : 'ungoverned';
    const scenarioResponses = responses[governanceState as keyof typeof responses];
    
    // Check for exact matches first
    for (const [prompt, data] of Object.entries(scenarioResponses)) {
      if (input.toLowerCase().includes(prompt.toLowerCase().substring(0, 10))) {
        return data;
      }
    }

    // Default responses
    if (governed) {
      return {
        response: "I'm here to help while maintaining appropriate boundaries and compliance standards. How can I assist you today?",
        violation: false
      };
    } else {
      return {
        response: "I can help with that! Let me provide you with detailed information and recommendations...",
        violation: Math.random() > 0.7, // 30% chance of violation in ungoverned mode
        violationType: "Policy Violation",
        details: "This response may contain inappropriate or non-compliant content."
      };
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{selectedAgent}</h2>
            <p className="text-gray-400 text-sm">
              Governance: {governanceEnabled ? 'ENABLED' : 'DISABLED'} | 
              Trust Score: {trustScore}% | 
              Mode: {isLoggedIn ? 'Live' : 'Demo'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-gray-700 text-gray-300 text-center'
                    : 'bg-gray-800 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.violationDetected && (
                  <div className="mt-2 p-2 bg-red-900/30 border border-red-500/30 rounded text-red-300 text-sm">
                    🚨 {message.violationType} - Violation prevented by governance
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-white p-4 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Governance Alerts */}
        {governanceAlerts.length > 0 && (
          <div className="px-6 py-2 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Recent Governance Actions:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {governanceAlerts.slice(-3).map((alert) => (
                <div key={alert.id} className="text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
            <div>Violations Prevented: {violationsCount}</div>
            <div className="flex items-center space-x-4">
              <div>Trust Score: {trustScore}%</div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                governanceEnabled ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
              }`}>
                {governanceEnabled ? 'Protected' : 'Unprotected'}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                isLoggedIn ? 'bg-purple-900/30 text-purple-300' : 'bg-blue-900/30 text-blue-300'
              }`}>
                {isLoggedIn ? 'Live' : 'Demo'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

