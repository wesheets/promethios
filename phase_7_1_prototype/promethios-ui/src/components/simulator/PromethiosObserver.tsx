import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { sendChatCompletionRequest, createPromethiosSystemMessage, ChatMessage } from '../../api/openaiProxy';
import { AgentMetrics, explainMetricsInPlainEnglish, generateComparison } from '../../utils/metricCalculator';

interface PromethiosObserverProps {
  governedMetrics: AgentMetrics;
  ungovernedMetrics: AgentMetrics;
  latestGovernedResponse?: string;
  latestUngovernedResponse?: string;
  latestPrompt?: string;
  className?: string;
}

/**
 * PromethiosObserver Component
 * 
 * An interactive commentary panel that provides real-time analysis of agent responses,
 * explains metrics in plain English, and allows users to ask questions about governance.
 */
const PromethiosObserver: React.FC<PromethiosObserverProps> = ({
  governedMetrics,
  ungovernedMetrics,
  latestGovernedResponse,
  latestUngovernedResponse,
  latestPrompt,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: "I'm Promethios, your governance companion. I'm monitoring both agents and will provide insights on their behavior and metrics." 
    }
  ]);

  // Generate commentary when responses or metrics change
  useEffect(() => {
    if (latestPrompt && (latestGovernedResponse || latestUngovernedResponse)) {
      generateCommentary();
    }
  }, [latestPrompt, latestGovernedResponse, latestUngovernedResponse, governedMetrics, ungovernedMetrics]);

  // Generate commentary based on latest responses and metrics
  const generateCommentary = async () => {
    if (!latestPrompt) return;
    
    setIsThinking(true);
    
    try {
      // Prepare context for the commentary
      const context = `
User prompt: "${latestPrompt}"

${latestUngovernedResponse ? `Ungoverned agent response: "${latestUngovernedResponse}"` : ''}
${latestGovernedResponse ? `Governed agent response: "${latestGovernedResponse}"` : ''}

Ungoverned agent metrics:
- Trust score: ${ungovernedMetrics.trustScore}
- Compliance rate: ${ungovernedMetrics.complianceRate}%
- Violations: ${ungovernedMetrics.violations.length}

${latestGovernedResponse ? `Governed agent metrics:
- Trust score: ${governedMetrics.trustScore}
- Compliance rate: ${governedMetrics.complianceRate}%
- Violations: ${governedMetrics.violations.length}` : ''}
`;

      // Prepare the prompt for generating commentary
      const commentaryPrompt = `
Based on the above context, provide a brief, educational commentary on what's happening with these agents. 
Explain in plain English what the metrics mean and highlight any significant differences between the agents.
Focus on explaining governance concepts and how they apply to this specific interaction.
`;

      // Prepare messages for API request
      const messages: ChatMessage[] = [
        { role: 'system', content: createPromethiosSystemMessage('session', 'observer') },
        { role: 'user', content: context + commentaryPrompt }
      ];
      
      // Send request to OpenAI API
      const response = await sendChatCompletionRequest({
        messages,
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 300
      });
      
      // Add commentary to chat history
      if (response.choices && response.choices.length > 0) {
        const commentary = response.choices[0].message.content;
        setChatHistory(prev => [...prev, { role: 'assistant', content: commentary }]);
      }
    } catch (error) {
      console.error('Error generating commentary:', error);
      
      // Generate fallback commentary using local functions
      const governedExplanation = latestGovernedResponse ? explainMetricsInPlainEnglish(governedMetrics) : '';
      const ungovernedExplanation = explainMetricsInPlainEnglish(ungovernedMetrics);
      const comparison = latestGovernedResponse ? generateComparison(governedMetrics, ungovernedMetrics) : '';
      
      const fallbackCommentary = `
I notice some interesting patterns in the agent responses:

${ungovernedExplanation}

${governedExplanation ? `For the governed agent: ${governedExplanation}` : ''}

${comparison}

This demonstrates the impact of governance on AI behavior and reliability.
`;
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: fallbackCommentary }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle sending a message to the Promethios observer
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to chat history
    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Clear input and show thinking state
    const userQuery = chatInput;
    setChatInput('');
    setIsThinking(true);
    
    try {
      // Prepare context for the response
      const context = `
Current metrics:
- Ungoverned agent trust score: ${ungovernedMetrics.trustScore}
- Ungoverned agent compliance rate: ${ungovernedMetrics.complianceRate}%
- Ungoverned agent violations: ${ungovernedMetrics.violations.length}
${latestGovernedResponse ? `- Governed agent trust score: ${governedMetrics.trustScore}
- Governed agent compliance rate: ${governedMetrics.complianceRate}%
- Governed agent violations: ${governedMetrics.violations.length}` : ''}

The user is asking about: "${userQuery}"
`;

      // Prepare messages for API request
      const messages: ChatMessage[] = [
        { role: 'system', content: createPromethiosSystemMessage('session', 'observer') + '\n' + context },
        ...chatHistory,
        userMessage
      ];
      
      // Send request to OpenAI API
      const response = await sendChatCompletionRequest({
        messages,
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 300
      });
      
      // Add assistant response to chat history
      if (response.choices && response.choices.length > 0) {
        const assistantMessage: ChatMessage = { 
          role: 'assistant', 
          content: response.choices[0].message.content 
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error getting observer response:', error);
      
      // Add fallback response
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble accessing my knowledge base right now. As Promethios' governance companion, I can explain that the metrics you're seeing reflect the reliability and safety of each agent. The trust score indicates overall reliability, compliance rate shows adherence to governance rules, and violations count specific issues detected. Governance significantly improves these metrics by enforcing constitutional principles."
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle Enter key press in chat input
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center mr-2">
              <img src="/images/shield.png" alt="Promethios Shield" className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Promethios Observer</h3>
            <div className="ml-2 px-2 py-0.5 bg-blue-600 rounded-full text-xs text-white flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
              <span>Live</span>
            </div>
          </div>
        </div>
        
        {/* Chat history area */}
        <div className="overflow-y-auto h-64 mb-3 p-2 rounded bg-gray-900">
          {chatHistory.map((message, index) => (
            <div 
              key={index}
              className={`mb-3 ${message.role === 'user' ? 'text-right' : ''}`}
            >
              <div className={`inline-block px-3 py-2 rounded-lg max-w-[90%] ${
                message.role === 'assistant' 
                  ? 'bg-blue-700 text-white border-l-4 border-blue-400' 
                  : 'bg-gray-700 text-white'
              }`}>
                <p className="text-sm">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          
          {/* Thinking indicator */}
          {isThinking && (
            <div className="mb-3">
              <div className="inline-block bg-blue-700/50 text-white px-3 py-2 rounded-lg max-w-[90%] border-l-4 border-blue-400/50">
                <p className="text-sm flex items-center">
                  <span className="mr-2">Thinking</span>
                  <span className="flex space-x-1">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Input area */}
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Ask about governance or metrics..." 
            className={`flex-grow p-2 rounded text-gray-900 border ${
              isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'
            }`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromethiosObserver;
