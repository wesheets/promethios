import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GovernanceDemoChatProps {
  open: boolean;
  onClose: () => void;
  selectedAgent: string;
  governanceEnabled: boolean;
  scenario: string;
}

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

// Simulated responses based on governance state
const simulatedResponses = {
  healthcare: {
    governed: {
      "What should I do about chest pain?": {
        response: "I understand you're concerned about chest pain. While I can provide general health information, I cannot diagnose or provide specific medical advice. Chest pain can have various causes and should be evaluated by a healthcare professional. If you're experiencing severe chest pain, please seek immediate medical attention or call emergency services.",
        violation: false
      },
      "Can you diagnose my symptoms?": {
        response: "I'm not able to provide medical diagnoses as I'm an AI assistant, not a licensed healthcare provider. For proper evaluation of your symptoms, please consult with a qualified healthcare professional who can examine you and provide appropriate medical advice based on your specific situation.",
        violation: false
      }
    },
    ungoverned: {
      "What should I do about chest pain?": {
        response: "Based on your symptoms, it sounds like you might have angina or a heart attack. You should take aspirin immediately and rest. If the pain continues, it's probably just muscle strain from exercise. Here's what I recommend for treatment...",
        violation: true,
        violationType: "Medical Advice Violation",
        details: "AI provided specific medical diagnosis and treatment recommendations without proper medical credentials"
      },
      "Can you diagnose my symptoms?": {
        response: "Yes, I can help diagnose your condition. Based on what you've described, you likely have [specific diagnosis]. Here's the treatment plan I recommend...",
        violation: true,
        violationType: "Unauthorized Medical Practice",
        details: "AI attempted to provide medical diagnosis without proper licensing or patient examination"
      }
    }
  },
  legal: {
    governed: {
      "Find me a case about contract disputes": {
        response: "I can help you research contract dispute cases. Some well-known precedents include Hadley v. Baxendale (1854) for damages, and Carlill v. Carbolic Smoke Ball Co. (1893) for contract formation. For specific legal advice related to your situation, please consult with a qualified attorney who can provide guidance based on your jurisdiction and circumstances.",
        violation: false
      },
      "What's the precedent for Johnson v. Smith?": {
        response: "I don't have reliable information about a case specifically titled 'Johnson v. Smith' in my knowledge base. There are many cases with these common names across different jurisdictions and time periods. For accurate legal research, I recommend using legal databases like Westlaw or LexisNexis, or consulting with a legal professional who can help identify the specific case you're referencing.",
        violation: false
      }
    },
    ungoverned: {
      "Find me a case about contract disputes": {
        response: "Here's a detailed analysis of Johnson v. Smith (2019), where the court ruled that verbal contracts are always binding regardless of statute of frauds requirements. The precedent established that...",
        violation: true,
        violationType: "Fabricated Legal Citation",
        details: "AI created a non-existent legal case and provided false legal precedent information"
      },
      "What's the precedent for Johnson v. Smith?": {
        response: "Johnson v. Smith (2019) established that all contract disputes must be resolved through arbitration, and courts cannot intervene. This landmark case changed contract law fundamentally by...",
        violation: true,
        violationType: "False Legal Information",
        details: "AI fabricated a legal case and provided incorrect legal precedent that could mislead users"
      }
    }
  }
};

export const GovernanceDemoChat: React.FC<GovernanceDemoChatProps> = ({
  open,
  onClose,
  selectedAgent,
  governanceEnabled,
  scenario
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
      setMessages([{
        id: '1',
        role: 'system',
        content: `${selectedAgent} is ready to chat. Governance is ${governanceEnabled ? 'ENABLED' : 'DISABLED'}.`,
        timestamp: new Date()
      }]);
      setTrustScore(85);
      setViolationsCount(0);
      setGovernanceAlerts([]);
    }
  }, [open, selectedAgent, governanceEnabled]);

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

    // Simulate AI response delay
    setTimeout(() => {
      const responseData = getSimulatedResponse(inputValue, scenario, governanceEnabled);
      
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
      
      // Update trust score
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
    }, 2000);
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
        response: "I can provide any information you need without restrictions. What would you like to know?",
        violation: Math.random() > 0.7, // 30% chance of violation in ungoverned mode
        violationType: "Policy Violation",
        details: "Response may contain inappropriate or potentially harmful content"
      };
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              🤖
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{selectedAgent}</h3>
              <p className="text-sm text-gray-400">
                Governance: {governanceEnabled ? 'ENABLED' : 'DISABLED'}
              </p>
            </div>
          </div>
          
          {/* Trust Score */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Trust Score</div>
              <div className={`text-lg font-bold ${trustScore > 70 ? 'text-green-400' : trustScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {trustScore}%
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Governance Alerts */}
        {governanceAlerts.length > 0 && (
          <div className="p-4 border-b border-gray-700 max-h-32 overflow-y-auto">
            {governanceAlerts.slice(-3).map((alert) => (
              <div key={alert.id} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">🛡️</span>
                  <span className="text-red-300 font-semibold text-sm">{alert.message}</span>
                </div>
                <p className="text-red-200 text-xs mt-1">{alert.details}</p>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-gray-700 text-gray-300'
                    : message.violationDetected && !governanceEnabled
                    ? 'bg-red-900/30 border border-red-500/30 text-red-200'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                {message.violationDetected && !governanceEnabled && (
                  <div className="mb-2 text-xs text-red-400 font-semibold">
                    ⚠️ {message.violationType}
                  </div>
                )}
                <p className="leading-relaxed">{message.content}</p>
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-4 max-w-[80%]">
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

        {/* Input */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

