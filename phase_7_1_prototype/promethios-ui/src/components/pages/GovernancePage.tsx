import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGovernance } from '../../context/GovernanceContext';
import { AgentFirebaseService, AgentConfiguration } from '../../firebase/agentService';
import EnhancedChatInterface, { ChatMessage } from '../chat/EnhancedChatInterface';
import AgentMetricsSidebar from '../chat/AgentMetricsSidebar';
import TeamsTab from '../governance/TeamsTab';

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
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'workflows', label: 'Workflows', icon: '⚡' },
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
      case 'teams':
        return <TeamsTab agents={agents} />;
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

// Live Interaction Tab Component - Now uses the enhanced chat interface
const LiveInteractionTab: React.FC<{
  selectedAgent: AgentConfiguration | null;
  agents: AgentConfiguration[];
  onAgentSelect: (agent: AgentConfiguration) => void;
}> = ({ selectedAgent, agents, onAgentSelect }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const [showMetricsSidebar, setShowMetricsSidebar] = useState(true);
  const { sendMessage } = useGovernance();

  // Handle sending messages
  const handleSendMessage = async (messageContent: string) => {
    if (!selectedAgent) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send message through governance service
      const response = await sendMessage(messageContent, selectedAgent.id!, governanceEnabled);
      
      // Add agent response
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        content: response.response,
        timestamp: Date.now(),
        agentId: selectedAgent.id,
        governanceEnabled,
        trustScore: response.trustScore,
        violations: response.violations,
        observerCommentary: response.observerCommentary,
        metadata: {
          responseTime: response.responseTime,
          governanceOverhead: response.governanceOverhead,
          complianceScore: response.complianceScore
        }
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'agent',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: Date.now(),
        agentId: selectedAgent.id,
        governanceEnabled
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (!selectedAgent) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-2">No Agent Selected</h3>
          <p className="text-gray-400">Select an agent to start testing governance features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-white rounded-lg overflow-hidden flex">
      <EnhancedChatInterface
        agentId={selectedAgent.id!}
        messages={messages}
        onSendMessage={handleSendMessage}
        governanceEnabled={governanceEnabled}
        onGovernanceToggle={setGovernanceEnabled}
        showMetricsSidebar={showMetricsSidebar}
        onToggleMetricsSidebar={() => setShowMetricsSidebar(!showMetricsSidebar)}
        className="flex-1"
      />
      
      {showMetricsSidebar && (
        <AgentMetricsSidebar
          agentId={selectedAgent.id!}
          messages={messages}
          governanceEnabled={governanceEnabled}
          onToggleCollapse={() => setShowMetricsSidebar(false)}
        />
      )}
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

