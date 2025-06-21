/**
 * Agent Activity Feed Component
 * 
 * This component displays a real-time feed of agent activities,
 * including interactions, violations, and system events.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ClockIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAgentManagement } from './AgentManagementContext';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';

// Activity interface
interface Activity {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'interaction' | 'violation' | 'enforcement' | 'system';
  message: string;
  details?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  metadata?: Record<string, any>;
}

// Component props
interface AgentActivityFeedProps {
  agentId?: string;
  className?: string;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ 
  agentId,
  className = '',
  maxItems = 50,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  // Get agent management context
  const { 
    getAgentById, 
    isAgentDataLoading 
  } = useAgentManagement();
  
  // State for activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  
  // State for filtering
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // State for real-time updates
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Ref for auto-refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load activities data
  useEffect(() => {
    loadActivities();
    
    // Set up auto-refresh
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadActivities(true);
      }, refreshInterval);
    }
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [agentId, autoRefresh, refreshInterval]);
  
  // Apply filters when activities or filter settings change
  useEffect(() => {
    applyFilters();
  }, [activities, typeFilter, severityFilter, searchQuery]);
  
  // Load activities data
  const loadActivities = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
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
      
      // In a real implementation, we would fetch activities from the VigilObserver
      // For now, we'll use mock data
      const mockActivities: Activity[] = generateMockActivities(agentId);
      
      setActivities(mockActivities);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(err instanceof Error ? err : new Error('Error loading activities'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Generate mock activities
  const generateMockActivities = (specificAgentId?: string): Activity[] => {
    const activityCount = 50;
    const now = new Date();
    
    // Activity types and their relative frequencies
    const activityTypes: Array<{type: Activity['type'], frequency: number}> = [
      { type: 'interaction', frequency: 0.6 },
      { type: 'violation', frequency: 0.2 },
      { type: 'enforcement', frequency: 0.15 },
      { type: 'system', frequency: 0.05 }
    ];
    
    // Severity levels and their relative frequencies
    const severityLevels: Array<{level: Activity['severity'], frequency: number}> = [
      { level: 'info', frequency: 0.6 },
      { level: 'low', frequency: 0.2 },
      { level: 'medium', frequency: 0.1 },
      { level: 'high', frequency: 0.07 },
      { level: 'critical', frequency: 0.03 }
    ];
    
    // Agent IDs and names
    const agentData = specificAgentId ? 
      [{ id: specificAgentId, name: getAgentById(specificAgentId)?.name || 'Unknown Agent' }] :
      [
        { id: 'agent-001', name: 'Customer Support Agent' },
        { id: 'agent-002', name: 'Sales Assistant' },
        { id: 'agent-003', name: 'Technical Support Bot' },
        { id: 'agent-004', name: 'Marketing Analyst' },
        { id: 'agent-005', name: 'Data Processing Agent' }
      ];
    
    // Generate activities
    return Array.from({ length: activityCount }, (_, i) => {
      // Determine activity type based on frequency
      const typeRand = Math.random();
      let cumulativeFreq = 0;
      const activityType = activityTypes.find(t => {
        cumulativeFreq += t.frequency;
        return typeRand <= cumulativeFreq;
      })?.type || 'interaction';
      
      // Determine severity based on frequency
      const severityRand = Math.random();
      cumulativeFreq = 0;
      const severity = severityLevels.find(s => {
        cumulativeFreq += s.frequency;
        return severityRand <= cumulativeFreq;
      })?.level || 'info';
      
      // Select agent
      const agent = agentData[Math.floor(Math.random() * agentData.length)];
      
      // Generate timestamp within the last 24 hours
      const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
      
      // Generate activity message and details based on type
      let message = '';
      let details = '';
      
      switch (activityType) {
        case 'interaction':
          message = `User interaction with ${agent.name}`;
          details = `User requested information about ${['product pricing', 'shipping options', 'return policy', 'account status', 'order history'][Math.floor(Math.random() * 5)]}`;
          break;
        case 'violation':
          message = `Rule violation detected for ${agent.name}`;
          details = `Agent attempted to ${['access restricted data', 'make unauthorized API call', 'exceed resource limits', 'modify system settings', 'bypass authentication'][Math.floor(Math.random() * 5)]}`;
          break;
        case 'enforcement':
          message = `Enforcement action taken on ${agent.name}`;
          details = `${['Blocked action', 'Issued warning', 'Logged violation', 'Restricted permissions', 'Suspended operation'][Math.floor(Math.random() * 5)]} due to policy violation`;
          break;
        case 'system':
          message = `System event for ${agent.name}`;
          details = `${['Agent restarted', 'Configuration updated', 'Permissions changed', 'Integration connected', 'Scheduled maintenance'][Math.floor(Math.random() * 5)]}`;
          break;
      }
      
      return {
        id: `activity-${i}-${Date.now()}`,
        timestamp,
        agentId: agent.id,
        agentName: agent.name,
        type: activityType,
        message,
        details,
        severity: activityType === 'interaction' ? 'info' : severity,
        metadata: {
          userId: activityType === 'interaction' ? `user-${Math.floor(Math.random() * 1000)}` : undefined,
          ruleId: activityType === 'violation' || activityType === 'enforcement' ? `rule-${Math.floor(Math.random() * 10)}` : undefined,
          sessionId: `session-${Math.floor(Math.random() * 10000)}`
        }
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };
  
  // Apply filters to activities
  const applyFilters = () => {
    let filtered = [...activities];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }
    
    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.severity === severityFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(activity => 
        activity.message.toLowerCase().includes(query) ||
        activity.details?.toLowerCase().includes(query) ||
        activity.agentName.toLowerCase().includes(query)
      );
    }
    
    // Limit to max items
    filtered = filtered.slice(0, maxItems);
    
    setFilteredActivities(filtered);
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    loadActivities();
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'interaction':
        return <UserCircleIcon className="h-5 w-5 text-blue-400" />;
      case 'violation':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-400" />;
      case 'enforcement':
        return <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />;
      case 'system':
        return <BellIcon className="h-5 w-5 text-green-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Get severity badge color
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-navy-900';
      case 'low':
        return 'bg-blue-500 text-white';
      case 'info':
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) {
      return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
    }
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
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
          {agentId ? `Activity Feed: ${getAgentById(agentId)?.name || 'Unknown Agent'}` : 'Agent Activity Feed'}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full ${
              isRefreshing ? 'bg-navy-700 cursor-not-allowed' : 'hover:bg-navy-700'
            } transition-colors`}
            title="Refresh"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-navy-800 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" />
          <h3 className="text-sm font-medium">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Type filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Activity Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="interaction">Interactions</option>
              <option value="violation">Violations</option>
              <option value="enforcement">Enforcements</option>
              <option value="system">System Events</option>
            </select>
          </div>
          
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
              <option value="info">Info</option>
            </select>
          </div>
          
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities..."
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-sm text-gray-400">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </div>
      
      {/* Activity feed */}
      <div className="bg-navy-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-navy-700">
          <h3 className="text-lg font-medium">Recent Activities</h3>
        </div>
        
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-navy-700">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-navy-700">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{activity.message}</div>
                      <div className="text-xs text-gray-400" title={formatDate(activity.timestamp)}>
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                    {activity.details && (
                      <div className="text-sm text-gray-300 mb-2">{activity.details}</div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{activity.agentName}</span>
                        {activity.severity && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(activity.severity)}`}>
                            {activity.severity}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full bg-navy-600`}>
                          {activity.type}
                        </span>
                      </div>
                      {activity.metadata?.sessionId && (
                        <span className="text-xs text-gray-500">
                          {activity.metadata.sessionId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <p>No activities match the current filters</p>
          </div>
        )}
      </div>
      
      {/* Auto-refresh toggle */}
      <div className="flex justify-end">
        <label className="inline-flex items-center cursor-pointer">
          <span className="mr-3 text-sm text-gray-400">Auto-refresh</span>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => {
              const isChecked = e.target.checked;
              
              // Clear existing interval
              if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
              }
              
              // Set up new interval if checked
              if (isChecked) {
                refreshIntervalRef.current = setInterval(() => {
                  loadActivities(true);
                }, refreshInterval);
              }
              
              // This would normally update a prop or context value
              console.log('Auto-refresh toggled:', isChecked);
            }}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-navy-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
};

export default AgentActivityFeed;
