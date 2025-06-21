/**
 * Multi-Agent System Dashboard Component
 * 
 * This component provides the interface for managing multi-agent systems in the admin dashboard,
 * including system visualization, metrics, and configuration.
 */

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';
import dashboardDataService, { AgentSystem, AgentData } from '../core/firebase/dashboardDataService';
import veritasService from '../core/veritas/VeritasService';

// System card component
const SystemCard: React.FC<{ system: AgentSystem, onClick: () => void }> = ({ system, onClick }) => {
  const [agentCount, setAgentCount] = useState<number>(0);
  
  useEffect(() => {
    // Get agent count from system.agents array
    setAgentCount(system.agents.length);
  }, [system]);
  
  return (
    <div 
      className="bg-navy-800 border border-navy-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors duration-150"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-300">{system.name}</h3>
        <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded">
          {agentCount} Agents
        </span>
      </div>
      
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {system.description || 'No description provided'}
      </p>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-navy-700 p-2 rounded">
          <div className="text-xs text-gray-400">System Trust</div>
          <div className="text-lg font-semibold text-blue-300">
            {system.metrics?.trust || 'N/A'}
          </div>
        </div>
        <div className="bg-navy-700 p-2 rounded">
          <div className="text-xs text-gray-400">Efficiency</div>
          <div className="text-lg font-semibold text-blue-300">
            {system.metrics?.efficiency || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div>Created: {system.createdAt.toLocaleDateString()}</div>
        <div>Updated: {system.updatedAt.toLocaleDateString()}</div>
      </div>
    </div>
  );
};

// Agent node component for system visualization
const AgentNode: React.FC<{ 
  agent: AgentData, 
  position: { x: number, y: number },
  onClick: () => void
}> = ({ agent, position, onClick }) => {
  return (
    <div 
      className="absolute bg-navy-700 border border-blue-500 rounded-lg p-3 w-40 shadow-lg cursor-pointer hover:bg-navy-600 transition-colors duration-150"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={onClick}
    >
      <div className="text-sm font-semibold text-blue-300 truncate">{agent.name}</div>
      <div className="text-xs text-gray-400 mt-1">Trust: {agent.metrics?.trust || 'N/A'}</div>
    </div>
  );
};

// Connection line between agents
const ConnectionLine: React.FC<{ 
  start: { x: number, y: number }, 
  end: { x: number, y: number },
  strength?: number // 0-1 value representing connection strength
}> = ({ start, end, strength = 0.5 }) => {
  // Calculate line properties
  const strokeWidth = 2 + (strength * 2); // 2-4px based on strength
  const opacity = 0.3 + (strength * 0.5); // 0.3-0.8 opacity based on strength
  
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none" 
      style={{ zIndex: 0 }}
    >
      <line 
        x1={start.x} 
        y1={start.y} 
        x2={end.x} 
        y2={end.y} 
        stroke="#3B82F6" 
        strokeWidth={strokeWidth} 
        strokeOpacity={opacity}
      />
    </svg>
  );
};

// System visualization component
const SystemVisualization: React.FC<{ 
  system: AgentSystem, 
  agents: AgentData[],
  onAgentClick: (agent: AgentData) => void
}> = ({ system, agents, onAgentClick }) => {
  // Calculate positions for agents in a circular layout
  const calculatePositions = () => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    const positions: Record<string, { x: number, y: number }> = {};
    
    agents.forEach((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI;
      positions[agent.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    return positions;
  };
  
  // Generate connections between agents
  const generateConnections = () => {
    const connections: { start: string, end: string, strength: number }[] = [];
    
    // For demo purposes, create connections between sequential agents
    // In a real implementation, this would be based on actual agent interaction data
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        // Create connection with random strength
        connections.push({
          start: agents[i].id,
          end: agents[j].id,
          strength: Math.random()
        });
      }
    }
    
    return connections;
  };
  
  const positions = calculatePositions();
  const connections = generateConnections();
  
  return (
    <div className="relative bg-navy-900 border border-navy-700 rounded-lg h-[600px] overflow-hidden">
      {/* Connection lines */}
      {connections.map((connection, index) => (
        <ConnectionLine 
          key={`connection-${index}`}
          start={positions[connection.start]}
          end={positions[connection.end]}
          strength={connection.strength}
        />
      ))}
      
      {/* Agent nodes */}
      {agents.map((agent) => (
        <AgentNode 
          key={agent.id}
          agent={agent}
          position={positions[agent.id]}
          onClick={() => onAgentClick(agent)}
        />
      ))}
      
      {/* System center node */}
      <div 
        className="absolute bg-purple-900 border-2 border-purple-500 rounded-full w-20 h-20 flex items-center justify-center shadow-lg"
        style={{ 
          left: '400px', 
          top: '300px',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="text-sm font-bold text-purple-300 text-center">System Core</div>
      </div>
    </div>
  );
};

// System detail component
const SystemDetail: React.FC<{ 
  system: AgentSystem, 
  agents: AgentData[],
  onClose: () => void,
  onAgentClick: (agent: AgentData) => void
}> = ({ system, agents, onClose, onAgentClick }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'visualization' | 'metrics' | 'config'>('overview');
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get system-level metrics
        const systemMetrics = await dashboardDataService.getSystemMetrics(system.id);
        
        // Get Veritas metrics for this system
        const veritasMetrics = await veritasService.getVeritasMetrics(undefined, system.id);
        
        setMetrics({
          system: systemMetrics,
          veritas: veritasMetrics
        });
      } catch (error) {
        console.error('Error fetching system metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [system.id]);
  
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-300">{system.name}</h2>
        <button 
          onClick={onClose}
          className="bg-navy-700 hover:bg-navy-600 text-white px-4 py-2 rounded"
        >
          Back to List
        </button>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-navy-700 mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'overview' ? 'text-blue-300 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'visualization' ? 'text-blue-300 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'metrics' ? 'text-blue-300 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'config' ? 'text-blue-300 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('config')}
        >
          Configuration
        </button>
      </div>
      
      {/* Tab content */}
      <div>
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-navy-700 p-4 rounded">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">System Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span className="text-white">{system.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Agents:</span>
                    <span className="text-white">{agents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{system.createdAt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-white">{system.updatedAt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-navy-700 p-4 rounded">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">System Metrics</h3>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trust Score:</span>
                      <span className="text-white">{system.metrics?.trust || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Efficiency:</span>
                      <span className="text-white">{system.metrics?.efficiency || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Communication Quality:</span>
                      <span className="text-white">{system.metrics?.communication || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Collective Intelligence:</span>
                      <span className="text-white">{system.metrics?.collective_intelligence || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">System Description</h3>
              <p className="text-white bg-navy-700 p-4 rounded">
                {system.description || 'No description provided'}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-3">System Agents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map(agent => (
                  <div 
                    key={agent.id}
                    className="bg-navy-700 p-3 rounded cursor-pointer hover:bg-navy-600"
                    onClick={() => onAgentClick(agent)}
                  >
                    <div className="font-medium text-blue-300">{agent.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Trust: {agent.metrics?.trust || 'N/A'} | 
                      Role: {agent.configuration?.role || 'Unspecified'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Visualization tab */}
        {activeTab === 'visualization' && (
          <SystemVisualization 
            system={system} 
            agents={agents}
            onAgentClick={onAgentClick}
          />
        )}
        
        {/* Metrics tab */}
        {activeTab === 'metrics' && (
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-navy-700 p-4 rounded">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">System Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-navy-800 p-3 rounded text-center">
                      <div className="text-3xl font-bold text-blue-300">
                        {system.metrics?.trust || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Trust Score</div>
                    </div>
                    <div className="bg-navy-800 p-3 rounded text-center">
                      <div className="text-3xl font-bold text-blue-300">
                        {system.metrics?.efficiency || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Efficiency</div>
                    </div>
                    <div className="bg-navy-800 p-3 rounded text-center">
                      <div className="text-3xl font-bold text-blue-300">
                        {system.metrics?.communication || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Communication</div>
                    </div>
                    <div className="bg-navy-800 p-3 rounded text-center">
                      <div className="text-3xl font-bold text-blue-300">
                        {system.metrics?.collective_intelligence || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Collective Intelligence</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-navy-700 p-4 rounded">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">Emotional Intelligence</h3>
                  {metrics?.veritas ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-md font-medium text-blue-300 mb-2">Verification Metrics</h4>
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
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium text-blue-300 mb-2">Emotional Breakdown</h4>
                        {Object.keys(metrics.veritas.emotionalBreakdown).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(metrics.veritas.emotionalBreakdown).map(([emotion, count]) => (
                              <div key={emotion} className="flex justify-between">
                                <span className="text-gray-400">{emotion}:</span>
                                <span className="text-white">{count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">No emotional data available</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">No Veritas metrics available for this system</p>
                  )}
                </div>
                
                <div className="bg-navy-700 p-4 rounded">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">Agent Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-navy-600">
                          <th className="pb-2">Agent</th>
                          <th className="pb-2">Trust</th>
                          <th className="pb-2">Compliance</th>
                          <th className="pb-2">Performance</th>
                          <th className="pb-2">Emotional</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agents.map(agent => (
                          <tr key={agent.id} className="border-b border-navy-600 hover:bg-navy-600">
                            <td className="py-3 text-blue-300">{agent.name}</td>
                            <td className="py-3 text-white">{agent.metrics?.trust || 'N/A'}</td>
                            <td className="py-3 text-white">{agent.metrics?.compliance || 'N/A'}</td>
                            <td className="py-3 text-white">{agent.metrics?.performance || 'N/A'}</td>
                            <td className="py-3 text-white">{agent.metrics?.emotional || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Configuration tab */}
        {activeTab === 'config' && (
          <div>
            <div className="bg-navy-700 p-4 rounded mb-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">System Configuration</h3>
              <pre className="text-sm text-white overflow-x-auto">
                {JSON.stringify(system.configuration || {}, null, 2)}
              </pre>
            </div>
            
            <div className="bg-navy-700 p-4 rounded">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">Agent Roles</h3>
              <div className="space-y-4">
                {agents.map(agent => (
                  <div key={agent.id} className="bg-navy-800 p-3 rounded">
                    <div className="font-medium text-blue-300">{agent.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Role: {agent.configuration?.role || 'Unspecified'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {agent.configuration?.roleDescription || 'No role description provided'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Agent detail modal
const AgentDetailModal: React.FC<{ 
  agent: AgentData | null, 
  onClose: () => void 
}> = ({ agent, onClose }) => {
  if (!agent) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-300">{agent.name}</h2>
          <button 
            onClick={onClose}
            className="bg-navy-700 hover:bg-navy-600 text-white px-4 py-2 rounded"
          >
            Close
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
                <span className="text-gray-400">Role:</span>
                <span className="text-white">{agent.configuration?.role || 'Unspecified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span className="text-white">{agent.createdAt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Active:</span>
                <span className="text-white">{agent.lastActive ? agent.lastActive.toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-navy-700 p-4 rounded">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">Agent Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Trust Score:</span>
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
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Agent Description</h3>
          <p className="text-white bg-navy-700 p-4 rounded">
            {agent.description || 'No description provided'}
          </p>
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
    </div>
  );
};

// Main multi-agent system management component
const MultiAgentSystemDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAdminDashboard();
  const [systems, setSystems] = useState<AgentSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<AgentSystem | null>(null);
  const [systemAgents, setSystemAgents] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);
  
  // Fetch systems
  useEffect(() => {
    const fetchSystems = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let allSystems: AgentSystem[] = [];
        
        if (isAdmin) {
          // Admin can see all systems
          // First, get all users
          const usersCollection = await dashboardDataService.getAllUsers();
          setUsers(usersCollection);
          
          // Then get systems for each user
          for (const user of usersCollection) {
            const userSystems = await dashboardDataService.getUserAgentSystems(user.uid);
            allSystems = [...allSystems, ...userSystems];
          }
        } else if (currentUser) {
          // Regular users can only see their own systems
          const userSystems = await dashboardDataService.getUserAgentSystems(currentUser.uid);
          allSystems = userSystems;
        }
        
        // Filter by user if needed
        if (userFilter !== 'all' && isAdmin) {
          allSystems = allSystems.filter(system => system.userId === userFilter);
        }
        
        setSystems(allSystems);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch systems'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSystems();
  }, [currentUser, isAdmin, userFilter]);
  
  // Fetch agents for selected system
  useEffect(() => {
    const fetchSystemAgents = async () => {
      if (!selectedSystem) {
        setSystemAgents([]);
        return;
      }
      
      try {
        const agents: AgentData[] = [];
        
        // Fetch each agent in the system
        for (const agentId of selectedSystem.agents) {
          const agent = await dashboardDataService.getAgentData(selectedSystem.userId, agentId);
          if (agent) {
            agents.push(agent);
          }
        }
        
        setSystemAgents(agents);
      } catch (err) {
        console.error('Error fetching system agents:', err);
      }
    };
    
    fetchSystemAgents();
  }, [selectedSystem]);
  
  // Handle system selection
  const handleSystemClick = (system: AgentSystem) => {
    setSelectedSystem(system);
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setSelectedSystem(null);
  };
  
  // Handle agent click
  const handleAgentClick = (agent: AgentData) => {
    setSelectedAgent(agent);
  };
  
  // Handle close agent detail
  const handleCloseAgentDetail = () => {
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
      {selectedSystem ? (
        <SystemDetail 
          system={selectedSystem} 
          agents={systemAgents}
          onClose={handleBackToList}
          onAgentClick={handleAgentClick}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-300">Multi-Agent Systems</h2>
            
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
          ) : systems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.map(system => (
                <SystemCard 
                  key={system.id} 
                  system={system} 
                  onClick={() => handleSystemClick(system)} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-navy-800 border border-navy-700 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold text-blue-300 mb-2">No Multi-Agent Systems Found</h3>
              <p className="text-gray-400">
                {isAdmin 
                  ? userFilter !== 'all' 
                    ? 'No multi-agent systems found for the selected user.' 
                    : 'No multi-agent systems have been created yet.'
                  : 'You have not created any multi-agent systems yet.'}
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Agent detail modal */}
      {selectedAgent && (
        <AgentDetailModal 
          agent={selectedAgent} 
          onClose={handleCloseAgentDetail} 
        />
      )}
    </div>
  );
};

export default MultiAgentSystemDashboard;
