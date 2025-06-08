import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AgentFirebaseService, AgentConfiguration } from '../../firebase/agentService';

/**
 * AgentsPage Component
 * 
 * This component manages the user's wrapped agents and provides access to agent configurations.
 * Features include:
 * - Agent listing with status and metrics
 * - Agent detail views with comprehensive information
 * - Management actions (edit, delete, configure)
 * - Empty state for new users
 * - Integration with Agent Wizard
 */
const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<AgentConfiguration[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userAgents = await AgentFirebaseService.getUserAgents(currentUser.uid);
        setAgents(userAgents);
        
        // If there's an agentId in the URL, load that agent's details
        if (agentId && userAgents.length > 0) {
          const agent = userAgents.find(a => a.id === agentId);
          if (agent) {
            setSelectedAgent(agent);
          }
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        setError('Failed to load agents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [currentUser, agentId]);

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-gray-400';
      case 'pending': return 'text-yellow-400';
      case 'draft': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400';
      case 'inactive': return 'bg-gray-400';
      case 'pending': return 'bg-yellow-400';
      case 'draft': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  // Handle agent actions
  const handleCreateAgent = () => {
    navigate('/ui/agent-wizard');
  };

  const handleViewAgent = (agent: AgentConfiguration) => {
    setSelectedAgent(agent);
    navigate(`/ui/agents/${agent.id}`);
  };

  const handleEditAgent = (agent: AgentConfiguration) => {
    // For now, redirect to wizard - in future this could be an edit mode
    navigate('/ui/agent-wizard');
  };

  const handleDeleteAgent = async (agent: AgentConfiguration) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await AgentFirebaseService.deleteAgentConfiguration(agent.id!);
      setAgents(prev => prev.filter(a => a.id !== agent.id));
      if (selectedAgent?.id === agent.id) {
        setSelectedAgent(null);
        navigate('/ui/agents');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent. Please try again.');
    }
  };

  const handleCloseDetails = () => {
    setSelectedAgent(null);
    navigate('/ui/agents');
  };

  // Loading state
  if (loading) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Agents</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Agent detail view
  if (selectedAgent) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleCloseDetails}
              className="mr-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{selectedAgent.name}</h1>
              <p className="text-gray-300">{selectedAgent.description}</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusBgColor(selectedAgent.status)} animate-pulse`}></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Agent Type</label>
                  <p className="text-white capitalize">{selectedAgent.agentType.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Governance Level</label>
                  <p className="text-white capitalize">{selectedAgent.governanceLevel}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <p className={`capitalize font-medium ${getStatusColor(selectedAgent.status)}`}>
                    {selectedAgent.status}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Created</label>
                  <p className="text-white">{formatRelativeTime(selectedAgent.createdAt)}</p>
                </div>
                {selectedAgent.apiEndpoint && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">API Endpoint</label>
                    <p className="text-blue-400 text-sm break-all">{selectedAgent.apiEndpoint}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Trust Score</span>
                    <span className="text-white font-medium">{selectedAgent.trustScore || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${(selectedAgent.trustScore || 0) >= 90 ? 'bg-green-400' : (selectedAgent.trustScore || 0) >= 80 ? 'bg-blue-400' : 'bg-yellow-400'}`}
                      style={{ width: `${selectedAgent.trustScore || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Compliance Score</span>
                    <span className="text-white font-medium">{selectedAgent.complianceScore || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${(selectedAgent.complianceScore || 0) >= 95 ? 'bg-green-400' : 'bg-yellow-400'}`}
                      style={{ width: `${selectedAgent.complianceScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-white">Agent configuration updated</p>
                    <p className="text-sm text-gray-400">{formatRelativeTime(selectedAgent.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-white">Agent created and governance applied</p>
                    <p className="text-sm text-gray-400">{formatRelativeTime(selectedAgent.createdAt)}</p>
                  </div>
                </div>
                {selectedAgent.lastActivity && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-white">Last activity recorded</p>
                      <p className="text-sm text-gray-400">{formatRelativeTime(selectedAgent.lastActivity)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleEditAgent(selectedAgent)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition-colors"
                >
                  Configure Agent
                </button>
                <button className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded transition-colors">
                  View Logs
                </button>
                <button className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded transition-colors">
                  Export Data
                </button>
                <button
                  onClick={() => handleDeleteAgent(selectedAgent)}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded transition-colors"
                >
                  Delete Agent
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Requests Today</span>
                  <span className="text-white font-medium">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-white font-medium">245ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Error Rate</span>
                  <span className="text-green-400 font-medium">0.02%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-green-400 font-medium">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main agents listing view
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-gray-300">Manage your wrapped AI agents and their governance settings</p>
        </div>
        <button
          onClick={handleCreateAgent}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-lg shadow transition-all duration-300 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Wrap New Agent
        </button>
      </div>

      {agents.length === 0 ? (
        // Empty state
        <div className="bg-gray-700 rounded-lg p-12 text-center">
          <svg className="w-20 h-20 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <h3 className="text-2xl font-semibold text-white mb-3">No Agents Yet</h3>
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Get started by wrapping your first AI agent with Promethios governance. 
            Add transparency, monitoring, and control to any AI system.
          </p>
          <button
            onClick={handleCreateAgent}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-4 rounded-lg shadow transition-all duration-300 text-lg font-medium"
          >
            Wrap Your First Agent
          </button>
        </div>
      ) : (
        // Agents grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map(agent => (
            <div key={agent.id} className="bg-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer" onClick={() => handleViewAgent(agent)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">{agent.name}</h3>
                  <p className="text-gray-300 text-sm line-clamp-2">{agent.description}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusBgColor(agent.status)} animate-pulse ml-3 flex-shrink-0`}></div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Trust Score</span>
                  <div className="flex items-center">
                    <span className={`font-semibold text-sm ${(agent.trustScore || 0) >= 90 ? 'text-green-400' : (agent.trustScore || 0) >= 80 ? 'text-blue-400' : 'text-yellow-400'}`}>
                      {agent.trustScore || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Compliance</span>
                  <span className={`font-semibold text-sm ${(agent.complianceScore || 0) >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {agent.complianceScore || 0}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className={`font-semibold text-sm capitalize ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Type</span>
                  <span className="text-white font-medium text-sm capitalize">{agent.agentType.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-4 border-t border-gray-600 pt-3">
                <div>Created {formatRelativeTime(agent.createdAt)}</div>
                {agent.lastActivity && (
                  <div>Last active {formatRelativeTime(agent.lastActivity)}</div>
                )}
              </div>

              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleEditAgent(agent)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Configure
                </button>
                <button
                  onClick={() => handleDeleteAgent(agent)}
                  className="bg-red-600 hover:bg-red-500 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentsPage;

