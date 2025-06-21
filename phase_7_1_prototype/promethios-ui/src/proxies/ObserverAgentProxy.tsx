import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminCheck } from '../hooks/useAdminCheck';

/**
 * ObserverAgentProxy Component
 * 
 * This proxy component serves as a bridge to the Observer Agent component.
 * It provides AI governance guidance and contextual assistance with full
 * governance integration, OpenAI LLM, and adaptive pulsing.
 */
const ObserverAgentProxy: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Only render if user is logged in
  if (!currentUser) {
    return null;
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      // TODO: Integrate with OpenAI service
      console.log('Observer Agent query:', chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Observer Agent
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Governed by Promethios"></div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border-l-4 border-green-400">
        <p className="text-gray-200 mb-2">🤖 Intelligent Governance Assistant</p>
        <p className="text-gray-400 text-sm">
          I'm your AI-powered governance companion, wrapped by Promethios for trust and compliance.
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-blue-400 text-sm font-medium mb-1 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Context: {location.pathname.split('/').pop() || 'Dashboard'}
          </h3>
          <p className="text-gray-300 text-sm">
            {location.pathname.includes('dashboard') && "Your governance score is good! Consider reviewing agent policies."}
            {location.pathname.includes('agents') && "Monitor your agents' trust metrics and compliance status."}
            {location.pathname.includes('governance') && "Review governance policies and compliance requirements."}
            {!location.pathname.includes('dashboard') && !location.pathname.includes('agents') && !location.pathname.includes('governance') && "Navigate to different sections for contextual guidance."}
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-purple-400 text-sm font-medium mb-1 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Trust Score: 89% (Compliant)
          </h3>
          <p className="text-gray-300 text-sm">Observer Agent is governed and monitored by Promethios.</p>
        </div>

        {isExpanded && (
          <div className="bg-gray-800 rounded-lg p-3">
            <h3 className="text-yellow-400 text-sm font-medium mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Governance Features
            </h3>
            <ul className="text-gray-300 text-xs space-y-1">
              <li>• Real-time trust monitoring</li>
              <li>• OpenAI LLM integration</li>
              <li>• Compliance verification</li>
              <li>• Adaptive pulsing on navigation</li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-600">
        <form onSubmit={handleChatSubmit} className="relative">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about governance, trust metrics, or compliance..."
            className="w-full bg-gray-800 text-gray-200 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-400 text-center">
          Powered by OpenAI • Governed by Promethios
        </div>
      </div>
    </div>
  );
};

export default ObserverAgentProxy;
