/**
 * Agent Management Dashboard Component
 * 
 * This component provides the interface for managing agents in the admin dashboard,
 * including viewing agent scorecards, governance identities, and metrics.
 */

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';
import dashboardDataService, { AgentData } from '../core/firebase/dashboardDataService';
import veritasService from '../core/veritas/VeritasService';

// Agent card component
const AgentCard: React.FC<{ agent: AgentData, onClick: () => void }> = ({ agent, onClick }) => {
  return (
    <div 
      className="bg-navy-800 border border-navy-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors duration-150"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-300">{agent.name}</h3>
        <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded">
          {agent.systemId ? 'System Agent' : 'Individual Agent'}
        </span>
      </div>
      
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {agent.description || 'No description provided'}
      </p>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-navy-700 p-2 rounded">
          <div className="text-xs text-gray-400">Trust Score</div>
          <div className="text-lg font-semibold text-blue-300">
            {agent.metrics?.trust || 'N/A'}
          </div>
        </div>
        <div className="bg-navy-700 p-2 rounded">
          <div className="text-xs text-gray-400">Compliance</div>
          <div className="text-lg font-semibold text-blue-300">
            {agent.metrics?.compliance || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div>Created: {agent.createdAt.toLocaleDateString()}</div>
        <div>Last Active: {agent.lastActive ? agent.lastActive.toLocaleDateString() : 'Never'}</div>
      </div>
    </div>
  );
};

// Agent detail component
const AgentDetail: React.FC<{ agent: AgentData, onClose: () => void }> = ({ agent, onClose }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get Veritas metrics for this agent
        const veritasMetrics = await veritasService.getVeritasMetrics(agent.id);
        
        // Get other metrics from dashboard data service
        const trustMetrics = await dashboardDataService.getAgentMetrics(agent.id, 'trust', 10);
        const complianceMetrics = await dashboardDataService.getAgentMetrics(agent.id, 'compliance', 10);
        const performanceMetrics = await dashboardDataService.getAgentMetrics(agent.id, 'performance', 10);
        
        setMetrics({
          veritas: veritasMetrics,
          trust: trustMetrics,
          compliance: complianceMetrics,
          performance: performanceMetrics
        });
      } catch (error) {
        console.error('Error fetching agent metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [agent.id]);
  
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-300">{agent.name}</h2>
        <button 
          onClick={onClose}
          className="bg-navy-700 hover:bg-navy-600 text-white px-4 py-2 rounded"
        >
          Back to List
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-navy-700 p-4 rounded">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Agent Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">ID:</span>
              <span className="text-white">{agent.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">{agent.systemId ? 'System Agent' : 'Individual Agent'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-white">{agent.createdAt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Updated:</span>
              <span className="text-white">{agent.updatedAt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Active:</span>
              <span className="text-white">{agent.lastActive ? agent.lastActive.toLocaleString() : 'Never'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-navy-700 p-4 rounded">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Governance Identity</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Trust Level:</span>
              <span className="text-white">{agent.metrics?.trust || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Compliance Rate:</span>
              <span className="text-white">{agent.metrics?.compliance || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Performance Score:</span>
              <span className="text-white">{agent.metrics?.performance || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Emotional Intelligence:</span>
              <span className="text-white">{agent.metrics?.emotional || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Verification Accuracy:</span>
              <span className="text-white">{metrics?.veritas?.averageAccuracy.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">Agent Description</h3>
        <p className="text-white bg-navy-700 p-4 rounded">
          {agent.description || 'No description provided'}
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">Metrics Dashboard</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-navy-700 rounded">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-navy-700 p-4 rounded">
              <h4 className="text-md font-semibold text-blue-300 mb-2">Emotional Veritas Metrics</h4>
              {metrics?.veritas ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy:</span>
                    <span className="text-white">{metrics.veritas.averageAccuracy.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Emotional Score:</span>
                    <span className="text-white">{metrics.veritas.averageEmotionalScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trust Score:</span>
                    <span className="text-white">{metrics.veritas.averageTrustScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Empathy Score:</span>
                    <span className="text-white">{metrics.veritas.averageEmpathyScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Verifications:</span>
                    <span className="text-white">{metrics.veritas.totalVerifications}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No Veritas metrics available</p>
              )}
            </div>
            
            <div className="bg-navy-700 p-4 rounded">
              <h4 className="text-md font-semibold text-blue-300 mb-2">Claim Verification</h4>
              {metrics?.veritas?.claimBreakdown ? (
                <div>
                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Verified Claims:</span>
                      <span className="text-white">{metrics.veritas.claimBreakdown.verified}</span>
                    </div>
                    <div className="w-full bg-navy-600 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${(metrics.veritas.claimBreakdown.verified / metrics.veritas.claimBreakdown.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Unverified Claims:</span>
                      <span className="text-white">{metrics.veritas.claimBreakdown.unverified}</span>
                    </div>
                    <div className="w-full bg-navy-600 rounded-full h-2.5">
                      <div 
                        className="bg-red-600 h-2.5 rounded-full" 
                        style={{ width: `${(metrics.veritas.claimBreakdown.unverified / metrics.veritas.claimBreakdown.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400 text-center">
                    Total Claims: {metrics.veritas.claimBreakdown.total}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No claim verification data available</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-blue-300 mb-3">Configuration</h3>
        <div className="bg-navy-700 p-4 rounded">
          <pre className="text-sm text-white overflow-x-auto">
            {JSON.stringify(agent.configuration || {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Main agent management component
const AgentManagementDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAdminDashboard();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);
  
  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let allAgents: AgentData[] = [];
        
        if (isAdmin) {
          // Admin can see all agents
          // First, get all users
          const usersCollection = await dashboardDataService.getAllUsers();
          setUsers(usersCollection);
          
          // Then get agents for each user
          for (const user of usersCollection) {
            const userAgents = await dashboardDataService.getUserAgents(user.uid);
            allAgents = [...allAgents, ...userAgents];
          }
        } else if (currentUser) {
          // Regular users can only see their own agents
          const userAgents = await dashboardDataService.getUserAgents(currentUser.uid);
          allAgents = userAgents;
        }
        
        // Filter by user if needed
        if (userFilter !== 'all' && isAdmin) {
          allAgents = allAgents.filter(agent => agent.userId === userFilter);
        }
        
        setAgents(allAgents);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgents();
  }, [currentUser, isAdmin, userFilter]);
  
  // Handle agent selection
  const handleAgentClick = (agent: AgentData) => {
    setSelectedAgent(agent);
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setSelectedAgent(null);
  };
  
  // Handle user filter change
  const handleUserFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserFilter(e.target.value);
  };
  
  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }
  
  return (
    <div>
      {selectedAgent ? (
        <AgentDetail agent={selectedAgent} onClose={handleBackToList} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-300">Agent Management</h2>
            
            {isAdmin && (
              <div className="flex items-center">
                <label htmlFor="userFilter" className="mr-2 text-white">Filter by User:</label>
                <select
                  id="userFilter"
                  value={userFilter}
                  onChange={handleUserFilterChange}
                  className="bg-navy-700 text-white border border-navy-600 rounded px-3 py-2"
                >
                  <option value="all">All Users</option>
                  {users.map(user => (
                    <option key={user.uid} value={user.uid}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(agent => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent} 
                  onClick={() => handleAgentClick(agent)} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-navy-800 border border-navy-700 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold text-blue-300 mb-2">No Agents Found</h3>
              <p className="text-gray-400">
                {isAdmin 
                  ? userFilter !== 'all' 
                    ? 'No agents found for the selected user.' 
                    : 'No agents have been created yet.'
                  : 'You have not created any agents yet.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AgentManagementDashboard;
