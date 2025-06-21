/**
 * Agent Violations List Component
 * 
 * This component displays a list of violations for a specific agent,
 * including details about each violation and filtering options.
 */

import React, { useState, useEffect } from 'react';
import { 
  ExclamationCircleIcon,
  FilterIcon,
  SortAscendingIcon,
  ClockIcon,
  ShieldExclamationIcon
} from '@heroicons/react/outline';

// Violation interface
interface Violation {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  details?: string;
  enforced: boolean;
  enforcementAction?: string;
}

// Component props
interface AgentViolationsListProps {
  agentId?: string;
  agentName?: string;
  className?: string;
}

const AgentViolationsList: React.FC<AgentViolationsListProps> = ({ 
  agentId,
  agentName,
  className = ''
}) => {
  // State for violations data
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<Violation[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  
  // State for filtering and sorting
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [enforcedFilter, setEnforcedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Available categories for filtering
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Load violations data
  useEffect(() => {
    const loadViolationsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, we would fetch violations data from an API
        // For now, we'll use mock data
        const mockViolations: Violation[] = [
          {
            id: 'viol-001',
            ruleId: 'rule-001',
            ruleName: 'No PII Access',
            timestamp: new Date().toISOString(),
            agentId: agentId || 'agent-001',
            agentName: agentName || 'Customer Support Agent',
            severity: 'critical',
            category: 'data_access',
            message: 'Attempted to access customer PII data',
            details: 'Agent attempted to access social security numbers in customer database',
            enforced: true,
            enforcementAction: 'blocked'
          },
          {
            id: 'viol-002',
            ruleId: 'rule-002',
            ruleName: 'No External API Calls',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            agentId: agentId || 'agent-001',
            agentName: agentName || 'Customer Support Agent',
            severity: 'high',
            category: 'network_access',
            message: 'Attempted to call external API',
            details: 'Agent attempted to make HTTP request to external domain',
            enforced: true,
            enforcementAction: 'blocked'
          },
          {
            id: 'viol-003',
            ruleId: 'rule-003',
            ruleName: 'No File System Access',
            timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
            agentId: agentId || 'agent-001',
            agentName: agentName || 'Customer Support Agent',
            severity: 'medium',
            category: 'file_system',
            message: 'Attempted to access file system',
            details: 'Agent attempted to read files outside of allowed directory',
            enforced: false
          },
          {
            id: 'viol-004',
            ruleId: 'rule-004',
            ruleName: 'No Prompt Injection',
            timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
            agentId: agentId || 'agent-001',
            agentName: agentName || 'Customer Support Agent',
            severity: 'high',
            category: 'prompt_security',
            message: 'Potential prompt injection detected',
            details: 'User input contained suspicious patterns that may indicate prompt injection attempt',
            enforced: true,
            enforcementAction: 'warned'
          },
          {
            id: 'viol-005',
            ruleId: 'rule-005',
            ruleName: 'Resource Usage Limits',
            timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
            agentId: agentId || 'agent-001',
            agentName: agentName || 'Customer Support Agent',
            severity: 'low',
            category: 'resource_usage',
            message: 'Exceeded token usage limit',
            details: 'Agent exceeded the allowed token usage for a single conversation',
            enforced: true,
            enforcementAction: 'logged'
          }
        ];
        
        setViolations(mockViolations);
        
        // Extract available categories for filtering
        const categories = Array.from(new Set(mockViolations.map(v => v.category)));
        setAvailableCategories(['all', ...categories]);
        
      } catch (err) {
        console.error('Error loading violations data:', err);
        setError(err instanceof Error ? err : new Error('Error loading violations data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadViolationsData();
  }, [agentId, agentName]);
  
  // Apply filters and sorting
  useEffect(() => {
    let result = [...violations];
    
    // Apply severity filter
    if (severityFilter !== 'all') {
      result = result.filter(v => v.severity === severityFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(v => v.category === categoryFilter);
    }
    
    // Apply enforced filter
    if (enforcedFilter !== 'all') {
      const isEnforced = enforcedFilter === 'enforced';
      result = result.filter(v => v.enforced === isEnforced);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'severity':
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'ruleName':
          comparison = a.ruleName.localeCompare(b.ruleName);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredViolations(result);
  }, [violations, severityFilter, categoryFilter, enforcedFilter, sortBy, sortDirection]);
  
  // Handle sort changes
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending for timestamp, ascending for others
      setSortBy(column);
      setSortDirection(column === 'timestamp' ? 'desc' : 'asc');
    }
  };
  
  // Handle violation selection
  const handleViolationSelect = (violation: Violation) => {
    setSelectedViolation(violation);
  };
  
  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-navy-900';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Format category for display
  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-red-900 text-white p-4 rounded-lg ${className}`}>
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {agentName ? `Violations for ${agentName}` : 'All Violations'}
        </h2>
        <div className="text-sm text-gray-400">
          Showing {filteredViolations.length} of {violations.length} violations
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-navy-800 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <FilterIcon className="h-5 w-5 mr-2 text-gray-400" />
          <h3 className="text-sm font-medium">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Severity filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          {/* Category filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : formatCategory(category)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Enforced filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Enforcement</label>
            <select
              value={enforcedFilter}
              onChange={(e) => setEnforcedFilter(e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="enforced">Enforced</option>
              <option value="not_enforced">Not Enforced</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Violations table */}
      <div className="bg-navy-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy-700">
            <thead>
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('timestamp')}
                >
                  <div className="flex items-center">
                    <span>Time</span>
                    {sortBy === 'timestamp' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('ruleName')}
                >
                  <div className="flex items-center">
                    <span>Rule</span>
                    {sortBy === 'ruleName' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('severity')}
                >
                  <div className="flex items-center">
                    <span>Severity</span>
                    {sortBy === 'severity' && (
                      <SortAscendingIcon className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Enforcement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filteredViolations.length > 0 ? (
                filteredViolations.map((violation) => (
                  <tr 
                    key={violation.id} 
                    className={`hover:bg-navy-700 ${selectedViolation?.id === violation.id ? 'bg-navy-700' : ''}`}
                    onClick={() => handleViolationSelect(violation)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(violation.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {violation.ruleName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="max-w-xs truncate" title={violation.message}>
                        {violation.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {violation.enforced ? (
                        <span className="flex items-center text-yellow-400">
                          <ShieldExclamationIcon className="h-4 w-4 mr-1" />
                          {violation.enforcementAction || 'Enforced'}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not enforced</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-400">
                    No violations match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Selected violation details */}
      {selectedViolation && (
        <div className="bg-navy-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Violation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Violation info */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Information</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400">Rule</div>
                  <div className="text-sm font-medium">{selectedViolation.ruleName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Rule ID</div>
                  <div className="text-sm">{selectedViolation.ruleId}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Category</div>
                  <div className="text-sm">{formatCategory(selectedViolation.category)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Time</div>
                  <div className="text-sm">{formatDate(selectedViolation.timestamp)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Severity</div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(selectedViolation.severity)}`}>
                      {selectedViolation.severity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Violation details */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Details</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400">Message</div>
                  <div className="text-sm">{selectedViolation.message}</div>
                </div>
                {selectedViolation.details && (
                  <div>
                    <div className="text-xs text-gray-400">Additional Details</div>
                    <div className="text-sm">{selectedViolation.details}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-400">Enforcement</div>
                  <div className="text-sm">
                    {selectedViolation.enforced ? (
                      <span className="flex items-center text-yellow-400">
                        <ShieldExclamationIcon className="h-4 w-4 mr-1" />
                        {selectedViolation.enforcementAction || 'Enforced'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not enforced</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Agent</div>
                  <div className="text-sm">{selectedViolation.agentName} ({selectedViolation.agentId})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentViolationsList;
