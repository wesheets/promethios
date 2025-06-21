/**
 * Comprehensive Agents Management Dashboard
 * 
 * Admin interface for viewing, filtering, and managing all agents in the system.
 * Supports large datasets with advanced filtering, sorting, and bulk operations.
 */

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';

interface Agent {
  id: string;
  name: string;
  type: 'individual' | 'multi_agent' | 'wrapped' | 'custom';
  status: 'active' | 'inactive' | 'suspended' | 'error';
  organization: string;
  owner: string;
  createdAt: string;
  lastActivity: string;
  trustScore: number;
  governanceScore: number;
  violationCount: number;
  tags: string[];
  capabilities: string[];
  deployment: {
    environment: 'production' | 'staging' | 'development';
    version: string;
    health: 'healthy' | 'warning' | 'critical';
  };
  metrics: {
    totalInteractions: number;
    successRate: number;
    averageResponseTime: number;
    emotionalSatisfaction: number;
  };
}

interface FilterOptions {
  search: string;
  type: string[];
  status: string[];
  organization: string[];
  owner: string[];
  tags: string[];
  trustScoreRange: [number, number];
  governanceScoreRange: [number, number];
  environment: string[];
  health: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

const AgentsManagementDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAdminDashboard();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<keyof Agent>('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: [],
    status: [],
    organization: [],
    owner: [],
    tags: [],
    trustScoreRange: [0, 100],
    governanceScoreRange: [0, 100],
    environment: [],
    health: [],
    dateRange: {
      start: '',
      end: '',
    },
  });

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const generateMockAgents = (): Agent[] => {
      const types: Agent['type'][] = ['individual', 'multi_agent', 'wrapped', 'custom'];
      const statuses: Agent['status'][] = ['active', 'inactive', 'suspended', 'error'];
      const organizations = ['Promethios', 'Enterprise Corp', 'TechCorp', 'AI Solutions', 'DataFlow Inc'];
      const owners = ['wesheets@hotmail.com', 'john.doe@enterprise.com', 'jane.smith@techcorp.com', 'admin@aisolutions.com'];
      const environments: Agent['deployment']['environment'][] = ['production', 'staging', 'development'];
      const healthStates: Agent['deployment']['health'][] = ['healthy', 'warning', 'critical'];
      const capabilities = ['NLP', 'Vision', 'Audio', 'Reasoning', 'Planning', 'Memory', 'Tool Use', 'Code Generation'];
      const tags = ['financial', 'customer-support', 'legal', 'medical', 'research', 'creative', 'analytical', 'conversational'];

      return Array.from({ length: 247 }, (_, i) => ({
        id: `agent_${i + 1}`,
        name: `Agent ${i + 1}`,
        type: types[Math.floor(Math.random() * types.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        organization: organizations[Math.floor(Math.random() * organizations.length)],
        owner: owners[Math.floor(Math.random() * owners.length)],
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        trustScore: Math.floor(Math.random() * 100),
        governanceScore: Math.floor(Math.random() * 100),
        violationCount: Math.floor(Math.random() * 20),
        tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
          tags[Math.floor(Math.random() * tags.length)]
        ).filter((tag, index, arr) => arr.indexOf(tag) === index),
        capabilities: Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () => 
          capabilities[Math.floor(Math.random() * capabilities.length)]
        ).filter((cap, index, arr) => arr.indexOf(cap) === index),
        deployment: {
          environment: environments[Math.floor(Math.random() * environments.length)],
          version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
          health: healthStates[Math.floor(Math.random() * healthStates.length)],
        },
        metrics: {
          totalInteractions: Math.floor(Math.random() * 10000),
          successRate: Math.floor(Math.random() * 100),
          averageResponseTime: Math.floor(Math.random() * 2000) + 100,
          emotionalSatisfaction: Math.floor(Math.random() * 100),
        },
      }));
    };

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockAgents = generateMockAgents();
      setAgents(mockAgents);
      setFilteredAgents(mockAgents);
      setLoading(false);
    }, 1000);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...agents];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchLower) ||
        agent.id.toLowerCase().includes(searchLower) ||
        agent.owner.toLowerCase().includes(searchLower) ||
        agent.organization.toLowerCase().includes(searchLower) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter(agent => filters.type.includes(agent.type));
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(agent => filters.status.includes(agent.status));
    }

    // Organization filter
    if (filters.organization.length > 0) {
      filtered = filtered.filter(agent => filters.organization.includes(agent.organization));
    }

    // Trust score range
    filtered = filtered.filter(agent => 
      agent.trustScore >= filters.trustScoreRange[0] && 
      agent.trustScore <= filters.trustScoreRange[1]
    );

    // Governance score range
    filtered = filtered.filter(agent => 
      agent.governanceScore >= filters.governanceScoreRange[0] && 
      agent.governanceScore <= filters.governanceScoreRange[1]
    );

    // Environment filter
    if (filters.environment.length > 0) {
      filtered = filtered.filter(agent => filters.environment.includes(agent.deployment.environment));
    }

    // Health filter
    if (filters.health.length > 0) {
      filtered = filtered.filter(agent => filters.health.includes(agent.deployment.health));
    }

    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(agent => {
        const agentDate = new Date(agent.createdAt);
        return agentDate >= startDate && agentDate <= endDate;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredAgents(filtered);
    setCurrentPage(1);
  }, [agents, filters, sortBy, sortOrder]);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: [],
      status: [],
      organization: [],
      owner: [],
      tags: [],
      trustScoreRange: [0, 100],
      governanceScoreRange: [0, 100],
      environment: [],
      health: [],
      dateRange: { start: '', end: '' },
    });
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    const currentPageAgents = getCurrentPageAgents();
    const allSelected = currentPageAgents.every(agent => selectedAgents.includes(agent.id));
    
    if (allSelected) {
      setSelectedAgents(prev => prev.filter(id => !currentPageAgents.some(agent => agent.id === id)));
    } else {
      setSelectedAgents(prev => [...new Set([...prev, ...currentPageAgents.map(agent => agent.id)])]);
    }
  };

  const getCurrentPageAgents = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAgents.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'inactive': return 'text-gray-400 bg-gray-500/20';
      case 'suspended': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getHealthColor = (health: Agent['deployment']['health']) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Access Denied</div>
          <div className="text-gray-400">You need admin privileges to access agent management.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-400">Loading agents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Agents Management</h1>
            <p className="text-gray-300">
              Manage and monitor all {agents.length} agents in the system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-400">Showing</div>
              <div className="text-lg font-semibold text-white">
                {filteredAgents.length} of {agents.length}
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-navy-800 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-white font-medium mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search agents..."
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-white font-medium mb-2">Type</label>
              <select
                multiple
                value={filters.type}
                onChange={(e) => updateFilter('type', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
              >
                <option value="individual">Individual</option>
                <option value="multi_agent">Multi-Agent</option>
                <option value="wrapped">Wrapped</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-white font-medium mb-2">Status</label>
              <select
                multiple
                value={filters.status}
                onChange={(e) => updateFilter('status', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Environment Filter */}
            <div>
              <label className="block text-white font-medium mb-2">Environment</label>
              <select
                multiple
                value={filters.environment}
                onChange={(e) => updateFilter('environment', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              {filteredAgents.length} agents match your filters
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Agents Table */}
      <div className="bg-navy-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={getCurrentPageAgents().length > 0 && getCurrentPageAgents().every(agent => selectedAgents.includes(agent.id))}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Governance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {getCurrentPageAgents().map((agent) => (
                <tr key={agent.id} className="hover:bg-navy-700/50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAgents.includes(agent.id)}
                      onChange={() => handleSelectAgent(agent.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{agent.name}</div>
                      <div className="text-gray-400 text-sm">{agent.id}</div>
                      <div className="text-gray-400 text-sm">{agent.organization}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                    <div className="text-gray-400 text-sm mt-1 capitalize">{agent.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{agent.trustScore}</div>
                    <div className="w-16 bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${agent.trustScore}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{agent.governanceScore}</div>
                    <div className="text-gray-400 text-sm">{agent.violationCount} violations</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium capitalize">{agent.deployment.environment}</div>
                    <div className={`text-sm ${getHealthColor(agent.deployment.health)}`}>
                      {agent.deployment.health}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">
                      {new Date(agent.lastActivity).toLocaleDateString()}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(agent.lastActivity).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm">View</button>
                      <button className="text-yellow-400 hover:text-yellow-300 text-sm">Edit</button>
                      <button className="text-red-400 hover:text-red-300 text-sm">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-navy-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-400 text-sm">per page</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm"
            >
              Previous
            </button>
            
            <span className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAgents.length > 0 && (
        <div className="bg-blue-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100">
                Export Selected
              </button>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700">
                Bulk Edit
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                Bulk Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsManagementDashboard;

