import React, { useState, useEffect, useRef } from 'react';
import { 
  EyeIcon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import useContextAwareness from '../hooks/useContextAwareness';
import { useObserverPreferences } from '../hooks/useObserverPreferences';
import { observerAgentService } from '../services/observerAgentService';
import ObserverSettings from './ObserverSettings';
import ObserverTrustMetrics from './ObserverTrustMetrics';

// Types for Observer Agent
interface ObserverSuggestion {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'action_recommendation' | 'governance_alert';
  action?: {
    type: string;
    params: Record<string, any>;
  };
  source: string;
  relevance?: number;
  timestamp: number;
}

interface ObserverState {
  isActive: boolean;
  isExpanded: boolean;
  suggestions: ObserverSuggestion[];
  currentMessage?: string;
  lastError?: string;
  isLoadingLLM: boolean;
  currentPage: string;
  contextInsights: string[];
  isPulsing: boolean;
  pulseCount: number;
  lastPageChange: number;
  pulsingEnabled: boolean;
}

interface ObserverAgentProps {
  currentRoute: string;
  userId?: string;
  userRole?: string;
}

const ObserverAgent: React.FC<ObserverAgentProps> = ({ 
  currentRoute, 
  userId = 'user-1', 
  userRole = 'user' 
}) => {
  // Use context awareness hook
  const { contextState, trackUserAction, getContextualHelp } = useContextAwareness(currentRoute, userId);
  
  // Use preferences hook
  const { preferences, updatePreference } = useObserverPreferences();
  
  const [state, setState] = useState<ObserverState>({
    isActive: true,
    isExpanded: false,
    suggestions: [],
    currentMessage: 'Observer Agent is monitoring your session',
    isLoadingLLM: false,
    currentPage: currentRoute,
    contextInsights: [],
    isPulsing: false,
    pulseCount: 0,
    lastPageChange: Date.now(),
    pulsingEnabled: preferences.pulsingEnabled
  });

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'agent';
    message: string;
    timestamp: number;
  }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrustMetrics, setShowTrustMetrics] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize observer service
  useEffect(() => {
    observerAgentService.initialize(userId, userRole);
  }, [userId, userRole]);

  // Update pulsing enabled state when preferences change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      pulsingEnabled: preferences.pulsingEnabled
    }));
  }, [preferences.pulsingEnabled]);

  // Route change detection for pulsing
  useEffect(() => {
    if (currentRoute !== state.currentPage && state.pulsingEnabled) {
      const timeSinceLastChange = Date.now() - state.lastPageChange;
      
      // Only pulse if enough time has passed since last page change (avoid rapid pulsing)
      if (timeSinceLastChange > 2000) {
        setState(prev => ({
          ...prev,
          currentPage: currentRoute,
          isPulsing: true,
          pulseCount: 0,
          lastPageChange: Date.now()
        }));
        
        // Track page change for context
        trackUserAction('page_navigation');
        
        // Start pulsing animation
        startPulseAnimation();
      }
    }
  }, [currentRoute, state.currentPage, state.lastPageChange, state.pulsingEnabled, trackUserAction]);

  // Pulsing animation control
  const startPulseAnimation = () => {
    let pulseCount = 0;
    const maxPulses = 3;
    
    const pulseInterval = setInterval(() => {
      pulseCount++;
      
      setState(prev => ({
        ...prev,
        pulseCount: pulseCount
      }));
      
      if (pulseCount >= maxPulses) {
        clearInterval(pulseInterval);
        // Stop pulsing after max pulses
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isPulsing: false,
            pulseCount: 0
          }));
        }, 600); // Allow last pulse to complete
      }
    }, 800); // Pulse every 800ms
  };

  // Update state with context awareness data
  useEffect(() => {
    setState(prev => ({
      ...prev,
      suggestions: contextState.suggestions.map(s => ({
        id: s.id,
        text: s.text,
        type: s.type,
        source: s.source,
        timestamp: Date.now(),
        relevance: s.confidence
      })),
      contextInsights: contextState.insights.map(insight => 
        `${insight.title}: ${insight.description}`
      ),
      currentMessage: `Analyzing ${currentRoute.split('/').pop() || 'page'} - ${contextState.governanceMetrics.healthStatus} status`
    }));
  }, [contextState, currentRoute]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const toggleExpanded = () => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  const toggleActive = () => {
    setState(prev => ({ 
      ...prev, 
      isActive: !prev.isActive,
      currentMessage: !prev.isActive ? 'Observer Agent activated' : 'Observer Agent deactivated'
    }));
  };

  const handleSuggestionClick = (suggestion: ObserverSuggestion) => {
    // Track user action
    trackUserAction(`clicked_suggestion_${suggestion.type}`);
    
    if (suggestion.action?.type === 'navigate') {
      // In a real implementation, this would use React Router
      console.log('Navigate to:', suggestion.action.params.route);
    }
    
    // Add to chat history
    setChatHistory(prev => [...prev, {
      type: 'agent',
      message: `I've noted your interest in: ${suggestion.text}`,
      timestamp: Date.now()
    }]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Track user action
    trackUserAction('sent_chat_message');

    // Add user message
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: chatInput,
      timestamp: Date.now()
    }]);

    // Use observer service for intelligent response
    setState(prev => ({ ...prev, isLoadingLLM: true }));
    
    try {
      const response = await observerAgentService.sendMessage(chatInput);
      
      setChatHistory(prev => [...prev, {
        type: 'agent',
        message: response.responseText,
        timestamp: Date.now()
      }]);
      
      // Add any new suggestions from the response
      if (response.suggestions) {
        setState(prev => ({
          ...prev,
          suggestions: [...prev.suggestions, ...response.suggestions.map(s => ({
            id: s.id,
            text: s.text,
            type: s.type,
            source: s.source,
            timestamp: s.timestamp,
            relevance: s.relevance
          }))]
        }));
      }
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'agent',
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setState(prev => ({ ...prev, isLoadingLLM: false }));
    }

    setChatInput('');
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />;
      case 'governance_alert': return <ShieldCheckIcon className="w-4 h-4 text-red-400" />;
      case 'action_recommendation': return <LightBulbIcon className="w-4 h-4 text-blue-400" />;
      default: return <InformationCircleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!state.isActive) {
    return (
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
        <button
          onClick={toggleActive}
          className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 flex items-center justify-center transition-all duration-200 opacity-50 hover:opacity-100"
        >
          <EyeIcon className="w-6 h-6 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
      state.isExpanded ? 'w-96' : 'w-16'
    }`}>
      {/* Minimized State */}
      {!state.isExpanded && (
        <div className="h-full flex flex-col items-center justify-center bg-gray-900 border-r border-gray-700">
          <button
            onClick={toggleExpanded}
            className={`w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center mb-4 transition-all duration-200 relative ${
              state.isPulsing ? 'animate-pulse-glow' : ''
            }`}
            style={{
              animation: state.isPulsing ? `pulseGlow 0.8s ease-in-out ${state.pulseCount}` : 'none'
            }}
          >
            <EyeIcon className="w-6 h-6 text-white" />
            {state.isLoadingLLM && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
            {/* Pulse rings */}
            {state.isPulsing && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75"></div>
                <div className="absolute inset-0 rounded-full border border-blue-300 animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>
              </>
            )}
            {state.suggestions.length > 0 && !state.isLoadingLLM && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                {state.suggestions.length}
              </div>
            )}
          </button>
          
          <div className="writing-mode-vertical text-sm text-gray-400 transform rotate-180">
            Observer
          </div>
        </div>
      )}

      {/* Expanded State */}
      {state.isExpanded && (
        <div className={`h-full bg-gray-900 border-r border-gray-700 flex flex-col ${
          state.isPulsing ? 'shadow-lg shadow-blue-500/20' : ''
        }`}>
          {/* Header */}
          <div className={`p-4 border-b border-gray-700 flex items-center justify-between ${
            state.isPulsing ? 'bg-gradient-to-r from-blue-900/20 to-transparent' : ''
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <EyeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Observer Agent</h3>
                <p className="text-xs text-gray-400">Promethios Governance AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowTrustMetrics(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Governance Status"
              >
                <ShieldCheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Observer Settings"
              >
                <CogIcon className="w-4 h-4" />
              </button>
              <button
                onClick={toggleActive}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Deactivate Observer"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </button>
              <button
                onClick={toggleExpanded}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Insights */}
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">Page Insights</h4>
            <div className="space-y-2">
              {state.contextInsights.map((insight, index) => (
                <div key={index} className="text-xs text-gray-300 bg-gray-800 p-2 rounded">
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">Suggestions</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {state.suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 flex items-start space-x-2 transition-colors"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span>{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                Chat with Observer
              </h4>
            </div>
            
            {/* Chat History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-2 rounded text-xs ${
                      chat.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {chat.message}
                  </div>
                </div>
              ))}
              
              {state.isLoadingLLM && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-300 p-2 rounded text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about governance..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || state.isLoadingLLM}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Settings Overlay */}
          <ObserverSettings 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* Trust Metrics Overlay */}
      <ObserverTrustMetrics 
        isVisible={showTrustMetrics}
        onToggle={() => setShowTrustMetrics(!showTrustMetrics)}
      />
    </div>
  );
};

export default ObserverAgent;

