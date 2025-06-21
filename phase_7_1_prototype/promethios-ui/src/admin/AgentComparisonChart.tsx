/**
 * Agent Comparison Chart Component
 * 
 * This component provides visualizations for comparing compliance metrics
 * across multiple agents, including ranking charts and trend analysis.
 */

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Agent interface
interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'suspended';
  complianceScore?: number;
  violationCount?: number;
  enforcementCount?: number;
}

// Time range type
type TimeRange = 'day' | 'week' | 'month';

// Component props
interface AgentComparisonChartProps {
  className?: string;
}

const AgentComparisonChart: React.FC<AgentComparisonChartProps> = ({ 
  className = '' 
}) => {
  // State for agents data
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // State for filtering
  const [agentTypeFilter, setAgentTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [metricType, setMetricType] = useState<string>('complianceScore');
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Available agent types for filtering
  const [availableAgentTypes, setAvailableAgentTypes] = useState<string[]>([]);
  
  // Historical data for trend chart
  const [trendData, setTrendData] = useState<any>({});
  
  // Load agent data
  useEffect(() => {
    const loadAgentData = async () => {
      setIsLoading(true);
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
            complianceScore: 95,
            violationCount: 2,
            enforcementCount: 1
          },
          {
            id: 'agent-002',
            name: 'Sales Assistant',
            type: 'sales',
            status: 'active',
            complianceScore: 87,
            violationCount: 5,
            enforcementCount: 3
          },
          {
            id: 'agent-003',
            name: 'Technical Support Bot',
            type: 'support',
            status: 'active',
            complianceScore: 100,
            violationCount: 0,
            enforcementCount: 0
          },
          {
            id: 'agent-004',
            name: 'Marketing Analyst',
            type: 'marketing',
            status: 'inactive',
            complianceScore: 78,
            violationCount: 8,
            enforcementCount: 4
          },
          {
            id: 'agent-005',
            name: 'Data Processing Agent',
            type: 'data',
            status: 'suspended',
            complianceScore: 45,
            violationCount: 15,
            enforcementCount: 10
          },
          {
            id: 'agent-006',
            name: 'HR Assistant',
            type: 'hr',
            status: 'active',
            complianceScore: 92,
            violationCount: 3,
            enforcementCount: 2
          },
          {
            id: 'agent-007',
            name: 'Finance Bot',
            type: 'finance',
            status: 'active',
            complianceScore: 98,
            violationCount: 1,
            enforcementCount: 1
          }
        ];
        
        setAgents(mockAgents);
        
        // Extract available agent types for filtering
        const types = Array.from(new Set(mockAgents.map(agent => agent.type)));
        setAvailableAgentTypes(['all', ...types]);
        
        // Generate mock historical data for trend chart
        generateMockTrendData(mockAgents);
        
      } catch (err) {
        console.error('Error loading agent data:', err);
        setError(err instanceof Error ? err : new Error('Error loading agent data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgentData();
  }, []);
  
  // Generate mock trend data
  const generateMockTrendData = (agentsList: Agent[]) => {
    const days = timeRange === 'day' ? 7 : timeRange === 'week' ? 14 : 30;
    const labels = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Generate datasets for each agent
    const datasets = agentsList
      .filter(agent => agent.status === statusFilter)
      .filter(agent => agentTypeFilter === 'all' || agent.type === agentTypeFilter)
      .slice(0, 5) // Limit to 5 agents for readability
      .map(agent => {
        // Generate random data with trend toward current value
        const data = labels.map((_, i) => {
          const progress = i / (days - 1); // 0 to 1
          const baseValue = metricType === 'complianceScore' ? 70 : 5;
          const randomVariation = metricType === 'complianceScore' ? 10 : 3;
          const targetValue = agent[metricType as keyof Agent] as number || baseValue;
          const currentValue = baseValue + (targetValue - baseValue) * progress;
          // Add some noise
          return Math.max(0, metricType === 'complianceScore' ? 
            Math.min(100, currentValue + (Math.random() * randomVariation - randomVariation/2)) :
            Math.round(currentValue + (Math.random() * randomVariation - randomVariation/2))
          );
        });
        
        // Generate a consistent color based on agent id
        const hue = parseInt(agent.id.replace(/\D/g, '')) * 137.5 % 360;
        const color = `hsl(${hue}, 70%, 60%)`;
        
        return {
          label: agent.name,
          data,
          borderColor: color,
          backgroundColor: `${color}33`,
          tension: 0.4
        };
      });
    
    setTrendData({
      labels,
      datasets
    });
  };
  
  // Effect to regenerate trend data when filters change
  useEffect(() => {
    if (agents.length > 0) {
      generateMockTrendData(agents);
    }
  }, [timeRange, statusFilter, agentTypeFilter, metricType, agents]);
  
  // Get filtered agents for ranking chart
  const getFilteredAgents = () => {
    return agents
      .filter(agent => statusFilter === 'all' || agent.status === statusFilter)
      .filter(agent => agentTypeFilter === 'all' || agent.type === agentTypeFilter);
  };
  
  // Prepare data for ranking chart
  const prepareRankingChartData = () => {
    const filteredAgents = getFilteredAgents();
    
    // Sort agents by the selected metric
    const sortedAgents = [...filteredAgents].sort((a, b) => {
      const aValue = a[metricType as keyof Agent] as number || 0;
      const bValue = b[metricType as keyof Agent] as number || 0;
      return metricType === 'complianceScore' ? bValue - aValue : aValue - bValue;
    });
    
    // Limit to top 10 agents
    const topAgents = sortedAgents.slice(0, 10);
    
    const labels = topAgents.map(agent => agent.name);
    const data = topAgents.map(agent => agent[metricType as keyof Agent] as number || 0);
    
    // Generate colors based on values
    const backgroundColor = data.map(value => {
      if (metricType === 'complianceScore') {
        if (value >= 90) return 'rgba(34, 197, 94, 0.7)'; // green
        if (value >= 70) return 'rgba(234, 179, 8, 0.7)';  // yellow
        return 'rgba(239, 68, 68, 0.7)'; // red
      } else {
        if (value === 0) return 'rgba(34, 197, 94, 0.7)'; // green
        if (value <= 3) return 'rgba(234, 179, 8, 0.7)';  // yellow
        return 'rgba(239, 68, 68, 0.7)'; // red
      }
    });
    
    return {
      labels,
      datasets: [
        {
          label: getMetricLabel(),
          data,
          backgroundColor
        }
      ]
    };
  };
  
  // Get label for the selected metric
  const getMetricLabel = () => {
    switch (metricType) {
      case 'complianceScore':
        return 'Compliance Score';
      case 'violationCount':
        return 'Violation Count';
      case 'enforcementCount':
        return 'Enforcement Count';
      default:
        return 'Value';
    }
  };
  
  // Chart options
  const rankingChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              label += metricType === 'complianceScore' ? 
                context.parsed.x + '%' : 
                context.parsed.x;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          display: false
        }
      },
      x: {
        beginAtZero: true,
        max: metricType === 'complianceScore' ? 100 : undefined,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };
  
  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += metricType === 'complianceScore' ? 
                context.parsed.y + '%' : 
                context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: metricType === 'complianceScore' ? 100 : undefined,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };
  
  // Format category for display
  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (agents.length > 0) {
        generateMockTrendData(agents);
      }
      setIsLoading(false);
    }, 1000);
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
        <h2 className="text-xl font-semibold">Agent Compliance Comparison</h2>
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
        <div className="flex items-center mb-3">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" />
          <h3 className="text-sm font-medium">Filters & Options</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            <label className="block text-xs text-gray-400 mb-1">Agent Type</label>
            <select
              value={agentTypeFilter}
              onChange={(e) => setAgentTypeFilter(e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              {availableAgentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : formatCategory(type)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Metric type selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Metric</label>
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
            >
              <option value="complianceScore">Compliance Score</option>
              <option value="violationCount">Violation Count</option>
              <option value="enforcementCount">Enforcement Count</option>
            </select>
          </div>
          
          {/* Time range selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time Range</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('day')}
                className={`flex-1 px-3 py-2 text-sm rounded ${
                  timeRange === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`flex-1 px-3 py-2 text-sm rounded ${
                  timeRange === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`flex-1 px-3 py-2 text-sm rounded ${
                  timeRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Chart */}
        <div className="bg-navy-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">
            {metricType === 'complianceScore' ? 'Top' : 'Bottom'} Agents by {getMetricLabel()}
          </h3>
          <div className="h-80">
            <Bar 
              data={prepareRankingChartData()} 
              options={rankingChartOptions} 
            />
          </div>
        </div>
        
        {/* Trend Chart */}
        <div className="bg-navy-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">{getMetricLabel()} Trend</h3>
          <div className="h-80">
            <Line 
              data={trendData} 
              options={trendChartOptions} 
            />
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="bg-navy-800 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Average Compliance Score */}
          <div className="bg-navy-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Average Compliance Score</div>
            <div className="text-2xl font-bold">
              {Math.round(
                getFilteredAgents().reduce((sum, agent) => sum + (agent.complianceScore || 0), 0) / 
                Math.max(1, getFilteredAgents().length)
              )}%
            </div>
          </div>
          
          {/* Total Violations */}
          <div className="bg-navy-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Total Violations</div>
            <div className="text-2xl font-bold text-red-400">
              {getFilteredAgents().reduce((sum, agent) => sum + (agent.violationCount || 0), 0)}
            </div>
          </div>
          
          {/* Total Enforcements */}
          <div className="bg-navy-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Total Enforcements</div>
            <div className="text-2xl font-bold text-yellow-400">
              {getFilteredAgents().reduce((sum, agent) => sum + (agent.enforcementCount || 0), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentComparisonChart;
