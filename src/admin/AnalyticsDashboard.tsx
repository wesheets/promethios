/**
 * Analytics Integration Dashboard Component
 * 
 * This component provides the interface for analytics integration with Vigil and PRISM,
 * showing data flow monitoring, governance violations, and system analytics.
 */

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';
import dashboardDataService from '../core/firebase/dashboardDataService';
import { ExtensionRegistry } from '../core/extensions/ExtensionRegistry';

// Analytics data interfaces
interface VigilObservation {
  id: string;
  timestamp: Date;
  agentId?: string;
  userId?: string;
  systemId?: string;
  type: 'violation' | 'warning' | 'info';
  category: string;
  message: string;
  details: any;
  severity: number; // 1-10
}

interface PrismDataFlow {
  id: string;
  timestamp: Date;
  source: string;
  destination: string;
  dataType: string;
  size: number;
  duration: number;
  status: 'success' | 'error' | 'pending';
  metadata: any;
}

interface AnalyticsSummary {
  vigilObservations: {
    total: number;
    violations: number;
    warnings: number;
    info: number;
    byCategory: Record<string, number>;
  };
  prismDataFlows: {
    total: number;
    success: number;
    error: number;
    pending: number;
    averageDuration: number;
    totalDataSize: number;
  };
  timeframe: {
    start: Date;
    end: Date;
  };
}

// Analytics card component
const AnalyticsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}> = ({ title, value, subtitle, icon, color = 'blue' }) => {
  // Color mapping
  const colorClasses = {
    blue: 'bg-blue-900 border-blue-700 text-blue-300',
    green: 'bg-green-900 border-green-700 text-green-300',
    red: 'bg-red-900 border-red-700 text-red-300',
    purple: 'bg-purple-900 border-purple-700 text-purple-300',
    yellow: 'bg-yellow-900 border-yellow-700 text-yellow-300'
  };
  
  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs mt-1 opacity-70">{subtitle}</div>}
    </div>
  );
};

// Vigil observations table
const VigilObservationsTable: React.FC<{ observations: VigilObservation[] }> = ({ observations }) => {
  return (
    <div className="bg-navy-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-blue-300 mb-4">Recent Governance Observations</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-navy-600">
              <th className="pb-2">Type</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Message</th>
              <th className="pb-2">Agent/System</th>
              <th className="pb-2">Severity</th>
              <th className="pb-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {observations.map(obs => (
              <tr key={obs.id} className="border-b border-navy-600 hover:bg-navy-700">
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    obs.type === 'violation' ? 'bg-red-900 text-red-300' :
                    obs.type === 'warning' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-blue-900 text-blue-300'
                  }`}>
                    {obs.type}
                  </span>
                </td>
                <td className="py-3 text-gray-300">{obs.category}</td>
                <td className="py-3 text-white">{obs.message}</td>
                <td className="py-3 text-gray-300">{obs.agentId || obs.systemId || 'N/A'}</td>
                <td className="py-3">
                  <div className="w-full bg-navy-600 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        obs.severity > 7 ? 'bg-red-500' :
                        obs.severity > 4 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${obs.severity * 10}%` }}
                    ></div>
                  </div>
                </td>
                <td className="py-3 text-gray-400">{obs.timestamp.toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {observations.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No governance observations recorded
        </div>
      )}
    </div>
  );
};

// PRISM data flow visualization
const PrismDataFlowVisualization: React.FC<{ dataFlows: PrismDataFlow[] }> = ({ dataFlows }) => {
  // Group data flows by source and destination
  const flowMap = React.useMemo(() => {
    const map: Record<string, Record<string, PrismDataFlow[]>> = {};
    
    dataFlows.forEach(flow => {
      if (!map[flow.source]) {
        map[flow.source] = {};
      }
      
      if (!map[flow.source][flow.destination]) {
        map[flow.source][flow.destination] = [];
      }
      
      map[flow.source][flow.destination].push(flow);
    });
    
    return map;
  }, [dataFlows]);
  
  // Get unique nodes (sources and destinations)
  const nodes = React.useMemo(() => {
    const nodeSet = new Set<string>();
    
    dataFlows.forEach(flow => {
      nodeSet.add(flow.source);
      nodeSet.add(flow.destination);
    });
    
    return Array.from(nodeSet);
  }, [dataFlows]);
  
  // Calculate node positions in a circular layout
  const nodePositions = React.useMemo(() => {
    const positions: Record<string, { x: number, y: number }> = {};
    const centerX = 400;
    const centerY = 250;
    const radius = 200;
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      positions[node] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    return positions;
  }, [nodes]);
  
  return (
    <div className="bg-navy-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-blue-300 mb-4">Data Flow Visualization</h3>
      
      <div className="relative h-[500px] bg-navy-900 rounded-lg overflow-hidden">
        {/* Draw connections between nodes */}
        <svg className="absolute top-0 left-0 w-full h-full">
          {Object.entries(flowMap).map(([source, destinations]) => 
            Object.entries(destinations).map(([destination, flows]) => {
              const sourcePos = nodePositions[source];
              const destPos = nodePositions[destination];
              const flowCount = flows.length;
              const errorCount = flows.filter(f => f.status === 'error').length;
              const successRate = flowCount > 0 ? (flowCount - errorCount) / flowCount : 0;
              
              // Calculate stroke properties based on flow data
              const strokeWidth = 1 + Math.min(5, Math.log2(flowCount + 1));
              const strokeColor = errorCount > 0 ? '#ef4444' : '#3b82f6';
              
              return (
                <g key={`${source}-${destination}`}>
                  {/* Main connection line */}
                  <line 
                    x1={sourcePos.x} 
                    y1={sourcePos.y} 
                    x2={destPos.x} 
                    y2={destPos.y} 
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={0.6}
                  />
                  
                  {/* Flow indicator (animated dot) */}
                  <circle 
                    cx={sourcePos.x} 
                    cy={sourcePos.y} 
                    r={3}
                    fill="#ffffff"
                  >
                    <animate 
                      attributeName="cx" 
                      from={sourcePos.x} 
                      to={destPos.x} 
                      dur="3s" 
                      repeatCount="indefinite"
                    />
                    <animate 
                      attributeName="cy" 
                      from={sourcePos.y} 
                      to={destPos.y} 
                      dur="3s" 
                      repeatCount="indefinite"
                    />
                  </circle>
                  
                  {/* Flow label */}
                  <text 
                    x={(sourcePos.x + destPos.x) / 2} 
                    y={(sourcePos.y + destPos.y) / 2 - 10}
                    fill="#9ca3af"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {flowCount} flows
                  </text>
                </g>
              );
            })
          )}
        </svg>
        
        {/* Draw nodes */}
        {nodes.map(node => {
          const pos = nodePositions[node];
          return (
            <div 
              key={node}
              className="absolute bg-navy-700 border border-blue-500 rounded-lg p-2 shadow-lg"
              style={{ 
                left: `${pos.x}px`, 
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
                minWidth: '100px'
              }}
            >
              <div className="text-sm font-medium text-blue-300 text-center truncate">
                {node}
              </div>
            </div>
          );
        })}
        
        {dataFlows.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No data flows recorded
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics dashboard component
const AnalyticsDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAdminDashboard();
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [vigilObservations, setVigilObservations] = useState<VigilObservation[]>([]);
  const [prismDataFlows, setPrismDataFlows] = useState<PrismDataFlow[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate timeframe dates
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
          case 'hour':
            startDate.setHours(startDate.getHours() - 1);
            break;
          case 'day':
            startDate.setDate(startDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        }
        
        // Get extension registry instance
        const extensionRegistry = ExtensionRegistry.getInstance();
        
        // Get Vigil observer extension point
        const vigilObserverExtensionPoint = extensionRegistry.getExtensionPoint('vigilObserver');
        
        // Get PRISM monitor extension point
        const prismMonitorExtensionPoint = extensionRegistry.getExtensionPoint('prismMonitor');
        
        let observations: VigilObservation[] = [];
        let dataFlows: PrismDataFlow[] = [];
        
        // If extension points exist and have implementations, use them
        if (vigilObserverExtensionPoint && vigilObserverExtensionPoint.getImplementation()) {
          observations = await vigilObserverExtensionPoint.execute('getObservations', {
            startDate,
            endDate,
            limit: 100
          });
        } else {
          // Otherwise, use mock data for demonstration
          observations = generateMockVigilObservations(20, startDate, endDate);
        }
        
        if (prismMonitorExtensionPoint && prismMonitorExtensionPoint.getImplementation()) {
          dataFlows = await prismMonitorExtensionPoint.execute('getDataFlows', {
            startDate,
            endDate,
            limit: 100
          });
        } else {
          // Otherwise, use mock data for demonstration
          dataFlows = generateMockPrismDataFlows(30, startDate, endDate);
        }
        
        // Set fetched data
        setVigilObservations(observations);
        setPrismDataFlows(dataFlows);
        
        // Calculate analytics summary
        const summary = calculateAnalyticsSummary(observations, dataFlows, startDate, endDate);
        setAnalyticsSummary(summary);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeframe]);
  
  // Calculate analytics summary
  const calculateAnalyticsSummary = (
    observations: VigilObservation[],
    dataFlows: PrismDataFlow[],
    startDate: Date,
    endDate: Date
  ): AnalyticsSummary => {
    // Calculate Vigil observations summary
    const vigilSummary = {
      total: observations.length,
      violations: observations.filter(obs => obs.type === 'violation').length,
      warnings: observations.filter(obs => obs.type === 'warning').length,
      info: observations.filter(obs => obs.type === 'info').length,
      byCategory: {} as Record<string, number>
    };
    
    // Count by category
    observations.forEach(obs => {
      if (!vigilSummary.byCategory[obs.category]) {
        vigilSummary.byCategory[obs.category] = 0;
      }
      vigilSummary.byCategory[obs.category]++;
    });
    
    // Calculate PRISM data flows summary
    const successFlows = dataFlows.filter(flow => flow.status === 'success');
    const errorFlows = dataFlows.filter(flow => flow.status === 'error');
    const pendingFlows = dataFlows.filter(flow => flow.status === 'pending');
    
    const totalDuration = successFlows.reduce((sum, flow) => sum + flow.duration, 0);
    const averageDuration = successFlows.length > 0 ? totalDuration / successFlows.length : 0;
    
    const totalDataSize = dataFlows.reduce((sum, flow) => sum + flow.size, 0);
    
    const prismSummary = {
      total: dataFlows.length,
      success: successFlows.length,
      error: errorFlows.length,
      pending: pendingFlows.length,
      averageDuration,
      totalDataSize
    };
    
    return {
      vigilObservations: vigilSummary,
      prismDataFlows: prismSummary,
      timeframe: {
        start: startDate,
        end: endDate
      }
    };
  };
  
  // Generate mock Vigil observations for demonstration
  const generateMockVigilObservations = (
    count: number,
    startDate: Date,
    endDate: Date
  ): VigilObservation[] => {
    const observations: VigilObservation[] = [];
    const types = ['violation', 'warning', 'info'] as const;
    const categories = [
      'boundary_enforcement',
      'data_access',
      'authentication',
      'authorization',
      'input_validation',
      'output_sanitization'
    ];
    
    const timeRange = endDate.getTime() - startDate.getTime();
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const severity = type === 'violation' ? 7 + Math.floor(Math.random() * 4) :
                      type === 'warning' ? 4 + Math.floor(Math.random() * 3) :
                      1 + Math.floor(Math.random() * 3);
      
      const timestamp = new Date(startDate.getTime() + Math.random() * timeRange);
      
      observations.push({
        id: `obs-${i}`,
        timestamp,
        type,
        category,
        message: `${type === 'violation' ? 'Governance violation' : type === 'warning' ? 'Potential issue' : 'Information'} in ${category} module`,
        details: { mock: true },
        severity,
        agentId: Math.random() > 0.5 ? `agent-${Math.floor(Math.random() * 5)}` : undefined,
        systemId: Math.random() > 0.7 ? `system-${Math.floor(Math.random() * 3)}` : undefined,
        userId: `user-${Math.floor(Math.random() * 3)}`
      });
    }
    
    // Sort by timestamp, most recent first
    return observations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };
  
  // Generate mock PRISM data flows for demonstration
  const generateMockPrismDataFlows = (
    count: number,
    startDate: Date,
    endDate: Date
  ): PrismDataFlow[] => {
    const dataFlows: PrismDataFlow[] = [];
    const sources = ['AgentA', 'AgentB', 'AgentC', 'SystemX', 'SystemY', 'UserInterface'];
    const destinations = ['Database', 'API', 'FileSystem', 'AgentA', 'AgentB', 'AgentC', 'SystemX', 'SystemY'];
    const dataTypes = ['text', 'image', 'audio', 'structured', 'binary'];
    const statuses = ['success', 'error', 'pending'] as const;
    
    const timeRange = endDate.getTime() - startDate.getTime();
    
    for (let i = 0; i < count; i++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      let destination = destinations[Math.floor(Math.random() * destinations.length)];
      
      // Ensure source and destination are different
      while (source === destination) {
        destination = destinations[Math.floor(Math.random() * destinations.length)];
      }
      
      const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const size = Math.floor(Math.random() * 1000) + 1; // 1-1000 KB
      const duration = Math.floor(Math.random() * 500) + 10; // 10-510 ms
      
      const timestamp = new Date(startDate.getTime() + Math.random() * timeRange);
      
      dataFlows.push({
        id: `flow-${i}`,
        timestamp,
        source,
        destination,
        dataType,
        size,
        duration,
        status,
        metadata: { mock: true }
      });
    }
    
    // Sort by timestamp, most recent first
    return dataFlows.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: 'hour' | 'day' | 'week' | 'month') => {
    setTimeframe(newTimeframe);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-300">Analytics Dashboard</h2>
        
        <div className="flex items-center space-x-2">
          <button
            className={`px-3 py-1 rounded ${timeframe === 'hour' ? 'bg-blue-700 text-white' : 'bg-navy-700 text-gray-300 hover:bg-navy-600'}`}
            onClick={() => handleTimeframeChange('hour')}
          >
            Hour
          </button>
          <button
            className={`px-3 py-1 rounded ${timeframe === 'day' ? 'bg-blue-700 text-white' : 'bg-navy-700 text-gray-300 hover:bg-navy-600'}`}
            onClick={() => handleTimeframeChange('day')}
          >
            Day
          </button>
          <button
            className={`px-3 py-1 rounded ${timeframe === 'week' ? 'bg-blue-700 text-white' : 'bg-navy-700 text-gray-300 hover:bg-navy-600'}`}
            onClick={() => handleTimeframeChange('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 rounded ${timeframe === 'month' ? 'bg-blue-700 text-white' : 'bg-navy-700 text-gray-300 hover:bg-navy-600'}`}
            onClick={() => handleTimeframeChange('month')}
          >
            Month
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Analytics summary cards */}
          {analyticsSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <AnalyticsCard
                title="Governance Violations"
                value={analyticsSummary.vigilObservations.violations}
                subtitle={`Out of ${analyticsSummary.vigilObservations.total} observations`}
                color="red"
              />
              <AnalyticsCard
                title="Warnings"
                value={analyticsSummary.vigilObservations.warnings}
                color="yellow"
              />
              <AnalyticsCard
                title="Data Flow Success Rate"
                value={`${analyticsSummary.prismDataFlows.total > 0 
                  ? Math.round((analyticsSummary.prismDataFlows.success / analyticsSummary.prismDataFlows.total) * 100) 
                  : 0}%`}
                subtitle={`${analyticsSummary.prismDataFlows.success} of ${analyticsSummary.prismDataFlows.total} flows`}
                color="green"
              />
              <AnalyticsCard
                title="Avg Response Time"
                value={`${Math.round(analyticsSummary.prismDataFlows.averageDuration)} ms`}
                subtitle={`${(analyticsSummary.prismDataFlows.totalDataSize / 1024).toFixed(2)} MB total data`}
                color="blue"
              />
            </div>
          )}
          
          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vigil observations */}
            <VigilObservationsTable observations={vigilObservations} />
            
            {/* PRISM data flow visualization */}
            <PrismDataFlowVisualization dataFlows={prismDataFlows} />
          </div>
          
          {/* Additional analytics */}
          <div className="mt-6 bg-navy-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">Governance Categories</h3>
            
            {analyticsSummary && Object.keys(analyticsSummary.vigilObservations.byCategory).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analyticsSummary.vigilObservations.byCategory).map(([category, count]) => (
                  <div key={category} className="bg-navy-700 p-3 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-blue-300">{category.replace('_', ' ')}</div>
                      <div className="text-white">{count}</div>
                    </div>
                    <div className="w-full bg-navy-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(count / analyticsSummary.vigilObservations.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No category data available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
