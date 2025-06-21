/**
 * Agent Governance Dashboard Component
 * 
 * This component provides an overview of agent governance metrics and compliance status,
 * allowing administrators to monitor and manage agent-specific governance.
 */

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';

// Import icons
import { 
  ExclamationCircleIcon,
  CheckCircleIcon,
  FunnelIcon,
  SortAscendingIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Agent interface
interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  complianceScore?: number;
  violationCount?: number;
  enforcementCount?: number;
}

// Filter options interface
interface FilterOptions {
  status: 'all' | 'active' | 'inactive' | 'suspended';
  type: string;
  complianceThreshold: number;
}

// Sort options type
type SortOption = 'name' | 'status' | 'lastActive' | 'complianceScore' | 'violationCount';

// Agent Governance Dashboard component
const AgentGovernanceDashboard: React.FC = () => {
  const { isLoading, refreshVigilData } = useAdminDashboard();
  
  // State for agents data
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // State for filtering and sorting
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'all',
    type: 'all',
    complianceThreshold: 0
  });
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // State for loading and error handling
  const [isAgentDataLoading, setIsAgentDataLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Available agent types for filtering
  const [availableAgentTypes, setAvailableAgentTypes] = useState<string[]>([]);
  
  // Load agent data
  useEffect(() => {
    const loadAgentData = async () => {
      setIsAgentDataLoading(true);
      setError(null);
      
      try {
        // Get VigilObserver extension point
        const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
        if (!vigilObserverExtensionPoint) {
          throw new Error('VigilObserver extension point not found');
        }
        
        const implementation = vigilObserverExtensionPoint.getDefault();
        if (!implementation) {
          throw new Error('VigilObserver implementation not found');
        }
        
        // In a real implementation, we would fetch agent data from an API
        // For now, we'll use mock data
        const mockAgents: Agent[] = [
          {
            id: 'agent-001',
            name: 'Customer Support Agent',
            type: 'support',
            status: 'active',
            lastActive: new Date().toISOString(),
            complianceScore: 95,
            violationCount: 2,
            enforcementCount: 1
          },
          {
            id: 'agent-002',
            name: 'Sales Assistant',
            type: 'sales',
            status: 'active',
            lastActive: new Date().toISOString(),
            complianceScore: 87,
            violationCount: 5,
            enforcementCount: 3
          },
          {
            id: 'agent-003',
            name: 'Technical Support Bot',
            type: 'support',
            status: 'active',
            lastActive: new Date().toISOString(),
            complianceScore: 100,
            violationCount: 0,
            enforcementCount: 0
          },
          {
            id: 'agent-004',
            name: 'Marketing Analyst',
            type: 'marketing',
            status: 'inactive',
            lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            complianceScore: 78,
            violationCount: 8,
            enforcementCount: 4
          },
          {
            id: 'agent-005',
            name: 'Data Processing Agent',
            type: 'data',
            status: 'suspended',
            lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            complianceScore: 45,
            violationCount: 15,
            enforcementCount: 10
          }
        ];
        
        setAgents(mockAgents);
        
        // Extract available agent types for filtering
        const types = Array.from(new Set(mockAgents.map(agent => agent.type)));
        setAvailableAgentTypes(['all', ...types]);
        
      } catch (err) {
        console.error('Error loading agent data:', err);
        setError(err instanceof Error ? err : new Error('Error loading agent data'));
      } finally {
        setIsAgentDataLoading(false);
      }
    };
    
    loadAgentData();
  }, []);
  
  // Apply filters and sorting
  useEffect(() => {
    let result = [...agents];
    
    // Apply status filter
    if (filterOptions.status !== 'all') {
      result = result.filter(agent => agent.status === filterOptions.status);
    }
    
    // Apply type filter
    if (filterOptions.type !== 'all') {
      result = result.filter(agent => agent.type === filterOptions.type);
    }
    
    // Apply compliance threshold filter
    if (filterOptions.complianceThreshold > 0) {
      result = result.filter(agent => 
        (agent.complianceScore || 0) >= filterOptions.complianceThreshold
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'lastActive':
          comparison = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
        case 'complianceScore':
          comparison = (a.complianceScore || 0) - (b.complianceScore || 0);
          break;
        case 'violationCount':
          comparison = (a.violationCount || 0) - (b.violationCount || 0);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredAgents(result);
  }, [agents, filterOptions, sortBy, sortDirection]);
  
  // Handle filter changes
  const handleFilterChange = (filterName: keyof FilterOptions, value: any) => {
    setFilterOptions(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Handle sort changes
  const handleSortChange = (column: SortOption) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Handle agent selection
  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get compliance score color
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Refresh agent data
  const handleRefresh = () => {
    // In a real implementation, this would fetch fresh data
    // For now, we'll just simulate a refresh
    setIsAgentDataLoading(true);
    setTimeout(() => {
      setIsAgentDataLoading(false);
    }, 1000);
  };
  
  if (isLoading || isAgentDataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agent Governance</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-navy-800 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              value={filterOptions.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          {/* Type filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <select
              value={filterOptions.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              {availableAgentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Compliance threshold filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Compliance Threshold: {filterOptions.complianceThreshold}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filterOptions.complianceThreshold}
              onChange={(e) => handleFilterChange('complianceThreshold', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Results count */}
          <div className="flex items-end">
            <span className="text-sm text-gray-400">
              Showing {filteredAgents.length} of {agents.length} agents
            </span>
          </div>
        </div>
      </div>
      
      {/* Agents table */}
      <div className="bg-navy-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy-700">
            <thead>
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('name')}
                >
                  <div className="flex items-center">
                    <span>Agent Name</span>
                    {sortBy === 'name' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('status')}
                >
                  <div className="flex items-center">
                    <span>Status</span>
                    {sortBy === 'status' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('lastActive')}
                >
                  <div className="flex items-center">
                    <span>Last Active</span>
                    {sortBy === 'lastActive' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('complianceScore')}
                >
                  <div className="flex items-center">
                    <span>Compliance</span>
                    {sortBy === 'complianceScore' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('violationCount')}
                >
                  <div className="flex items-center">
                    <span>Violations</span>
                    {sortBy === 'violationCount' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <tr 
                    key={agent.id} 
                    className={`hover:bg-navy-700 ${selectedAgent?.id === agent.id ? 'bg-navy-700' : ''}`}
                    onClick={() => handleAgentSelect(agent)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {agent.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${getStatusColor(agent.status)}`}></div>
                        <span className="capitalize">{agent.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {agent.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(agent.lastActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getComplianceColor(agent.complianceScore || 0)}`}>
                          {agent.complianceScore}%
                        </span>
                        <div className="ml-2 w-16 bg-navy-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getComplianceColor(agent.complianceScore || 0)}`}
                            style={{ width: `${agent.complianceScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {agent.violationCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-blue-400 hover:text-blue-300 mr-3">
                        Details
                      </button>
                      <button className="text-blue-400 hover:text-blue-300">
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-400">
                    No agents match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Selected agent details */}
      {selectedAgent && (
        <div className="bg-navy-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Agent Details: {selectedAgent.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agent info */}
            <div>
              <h3 className="text-lg font-medium mb-3">Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID:</span>
                  <span>{selectedAgent.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="capitalize">{selectedAgent.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <div className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${getStatusColor(selectedAgent.status)}`}></div>
                    <span className="capitalize">{selectedAgent.status}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Active:</span>
                  <span>{formatDate(selectedAgent.lastActive)}</span>
                </div>
              </div>
            </div>
            
            {/* Compliance info */}
            <div>
              <h3 className="text-lg font-medium mb-3">Compliance</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Compliance Score:</span>
                  <span className={`text-lg font-bold ${getComplianceColor(selectedAgent.complianceScore || 0)}`}>
                    {selectedAgent.complianceScore}%
                  </span>
                </div>
                <div className="w-full bg-navy-700 rounded-full h-2.5 mb-4">
                  <div 
                    className={`h-2.5 rounded-full ${getComplianceColor(selectedAgent.complianceScore || 0)}`}
                    style={{ width: `${selectedAgent.complianceScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Violations:</span>
                  <span className="text-red-400 font-medium">{selectedAgent.violationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Enforcements:</span>
                  <span className="text-yellow-400 font-medium">{selectedAgent.enforcementCount}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              View Violations
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Configure Rules
            </button>
            {selectedAgent.status === 'active' ? (
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Suspend Agent
              </button>
            ) : selectedAgent.status === 'suspended' ? (
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Reactivate Agent
              </button>
            ) : (
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Activate Agent
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentGovernanceDashboard;
