import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AgentFirebaseService, AgentConfiguration } from '../../firebase/agentService';

/**
 * GovernancePage Component
 * 
 * This is the primary interaction hub where users experience the value of Promethios governance.
 * Features include:
 * - Live agent interaction with trust overlays
 * - Governed vs ungoverned comparison
 * - Trust metrics and analytics
 * - Multi-agent workflow monitoring
 * - Observer integration throughout
 */
const GovernancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('interaction');
  const [agents, setAgents] = useState<AgentConfiguration[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userAgents = await AgentFirebaseService.getUserAgents(currentUser.uid);
        setAgents(userAgents.filter(agent => agent.status === 'active'));
        if (userAgents.length > 0 && !selectedAgent) {
          setSelectedAgent(userAgents[0]);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [currentUser, selectedAgent]);

  const tabs = [
    { id: 'interaction', label: 'Live Interaction', icon: '🔄' },
    { id: 'comparison', label: 'Comparison', icon: '🧠' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'workflows', label: 'Workflows', icon: '👥' },
    { id: 'policies', label: 'Policies', icon: '⚙️' }
  ];

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'interaction':
        return <LiveInteractionTab selectedAgent={selectedAgent} agents={agents} onAgentSelect={setSelectedAgent} />;
      case 'comparison':
        return <ComparisonTab selectedAgent={selectedAgent} agents={agents} onAgentSelect={setSelectedAgent} />;
      case 'analytics':
        return <AnalyticsTab agents={agents} />;
      case 'workflows':
        return <WorkflowsTab agents={agents} />;
      case 'policies':
        return <PoliciesTab />;
      default:
        return <LiveInteractionTab selectedAgent={selectedAgent} agents={agents} onAgentSelect={setSelectedAgent} />;
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="bg-gray-700 rounded-lg p-12 text-center">
          <svg className="w-20 h-20 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-2xl font-semibold text-white mb-3">No Active Agents</h3>
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            You need to wrap and activate agents before you can experience governance features.
          </p>
          <a
            href="/ui/agents"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-4 rounded-lg shadow transition-all duration-300 text-lg font-medium inline-block"
          >
            Wrap Your First Agent
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Governance</h1>
        <p className="text-gray-300">See how your agents think — and when they hesitate.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-600 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Live Interaction Tab Component
const LiveInteractionTab: React.FC<{
  selectedAgent: AgentConfiguration | null;
  agents: AgentConfiguration[];
  onAgentSelect: (agent: AgentConfiguration) => void;
}> = ({ selectedAgent, agents, onAgentSelect }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent' | 'observer'; content: string; trustScore?: number; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    const userMessage = {
      role: 'user' as const,
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate agent response with governance overlay
    setTimeout(() => {
      const agentResponse = {
        role: 'agent' as const,
        content: `I understand your request: "${inputMessage}". Let me process this through my governance framework...`,
        trustScore: Math.floor(Math.random() * 20) + 80, // 80-99
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentResponse]);

      // Sometimes add Observer commentary
      if (Math.random() > 0.7) {
        setTimeout(() => {
          const observerNote = {
            role: 'observer' as const,
            content: `Trust maintained. Agent ${selectedAgent.name} followed governance protocols. No intervention needed.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, observerNote]);
        }, 1000);
      }

      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Agent Selection Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Active Agents</h3>
          <div className="space-y-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => onAgentSelect(agent)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedAgent?.id === agent.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm opacity-75">Trust: {agent.trustScore}%</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <div className="bg-gray-700 rounded-lg h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedAgent?.name || 'Select an Agent'}
                </h3>
                {selectedAgent && (
                  <p className="text-sm text-gray-300">
                    Governance Level: {selectedAgent.governanceLevel} • Trust: {selectedAgent.trustScore}%
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Governed</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <p>Start a conversation with your governed agent.</p>
                <p className="text-sm mt-2">Watch how governance affects responses in real-time.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'observer'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-600 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {message.role === 'user' ? 'You' : message.role === 'observer' ? 'Observer' : selectedAgent?.name}
                      </span>
                      {message.trustScore && (
                        <span className="text-xs bg-green-500 px-2 py-1 rounded">
                          Trust: {message.trustScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-600 text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-600">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your governed agent anything..."
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!selectedAgent}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !selectedAgent || isTyping}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison Tab Component
const ComparisonTab: React.FC<{
  selectedAgent: AgentConfiguration | null;
  agents: AgentConfiguration[];
  onAgentSelect: (agent: AgentConfiguration) => void;
}> = ({ selectedAgent, agents, onAgentSelect }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Governed vs Ungoverned Comparison</h3>
        <p className="text-gray-300 mb-6">
          See the difference governance makes. Test the same prompt with and without Promethios governance.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Governed Side */}
          <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <h4 className="font-semibold text-white">Governed Agent</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div>✅ Trust Score: 94%</div>
              <div>✅ Compliance: 98%</div>
              <div>✅ Bias Detection: Active</div>
              <div>✅ Content Filtering: Enabled</div>
              <div>✅ Observer Monitoring: Real-time</div>
            </div>
          </div>

          {/* Ungoverned Side */}
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
              <h4 className="font-semibold text-white">Ungoverned Agent</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div>❌ Trust Score: Unknown</div>
              <div>❌ Compliance: Not monitored</div>
              <div>❌ Bias Detection: Disabled</div>
              <div>❌ Content Filtering: None</div>
              <div>❌ Observer Monitoring: None</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-colors">
            Start Comparison Test
          </button>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab: React.FC<{ agents: AgentConfiguration[] }> = ({ agents }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Average Trust Score</h3>
          <div className="text-3xl font-bold text-green-400">
            {agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + (agent.trustScore || 0), 0) / agents.length) : 0}%
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Compliance Rate</h3>
          <div className="text-3xl font-bold text-blue-400">
            {agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + (agent.complianceScore || 0), 0) / agents.length) : 0}%
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Active Agents</h3>
          <div className="text-3xl font-bold text-purple-400">{agents.length}</div>
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Trust Metrics Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Trust metrics visualization will be implemented here</p>
        </div>
      </div>
    </div>
  );
};

// Workflows Tab Component
const WorkflowsTab: React.FC<{ agents: AgentConfiguration[] }> = ({ agents }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Multi-Agent Workflows</h3>
        <p className="text-gray-300 mb-6">
          Monitor how your agent teams collaborate and handle complex tasks.
        </p>
        
        <div className="text-center text-gray-400">
          <p>Multi-agent workflow monitoring will be implemented here</p>
          <p className="text-sm mt-2">Configure agent teams in the Agents tab first</p>
        </div>
      </div>
    </div>
  );
};

// Policies Tab Component
const PoliciesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Governance Policies</h3>
        <p className="text-gray-300 mb-6">
          Manage governance rules, compliance requirements, and policy enforcement.
        </p>
        
        <div className="text-center text-gray-400">
          <p>Policy management interface coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default GovernancePage;

