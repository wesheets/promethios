/**
 * RealTimeOptimizationPanel - Real-time system optimization and control panel
 * Part of the revolutionary multi-agent autonomous research system
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { Zap, Settings, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Users, Activity, Target, Cpu, BarChart3, Gauge } from 'lucide-react';

interface OptimizationMetrics {
  timestamp: Date;
  system: {
    activeAgents: number;
    activeTasks: number;
    averageResponseTime: number;
    systemLoad: number;
    errorRate: number;
    throughput: number;
  };
  performance: {
    qualityScore: number;
    costEfficiency: number;
    userSatisfaction: number;
    collaborationHealth: number;
  };
  predictions: {
    nextHourThroughput: number;
    qualityForecast: number;
    systemStability: number;
    budgetDepletion: Date | null;
  };
}

interface OptimizationAction {
  actionId: string;
  type: 'load_balancing' | 'response_optimization' | 'cost_optimization' | 'quality_enhancement';
  description: string;
  impact: string;
  status: 'pending' | 'applying' | 'completed' | 'failed';
  appliedAt?: Date;
  estimatedCompletion?: Date;
}

interface OptimizationPanelProps {
  sessionId: string;
  onOptimizationApply?: (type: string, config: any) => void;
  onAutoOptimizationToggle?: (enabled: boolean) => void;
}

export const RealTimeOptimizationPanel: React.FC<OptimizationPanelProps> = ({
  sessionId,
  onOptimizationApply,
  onAutoOptimizationToggle
}) => {
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<OptimizationMetrics[]>([]);
  const [activeOptimizations, setActiveOptimizations] = useState<OptimizationAction[]>([]);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(true);
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);
  const [optimizationConfig, setOptimizationConfig] = useState({
    responseTimeThreshold: 45, // seconds
    systemLoadThreshold: 0.8,
    costEfficiencyTarget: 75,
    qualityTarget: 8.0
  });

  useEffect(() => {
    loadRealTimeMetrics();
    loadHistoricalData();
    
    // Update metrics every 10 seconds for real-time monitoring
    const interval = setInterval(() => {
      loadRealTimeMetrics();
      checkForOptimizationOpportunities();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadRealTimeMetrics = async () => {
    try {
      // Simulate real-time metrics with some variation
      const now = new Date();
      const baseMetrics = {
        timestamp: now,
        system: {
          activeAgents: 5 + Math.floor(Math.random() * 3),
          activeTasks: 2 + Math.floor(Math.random() * 4),
          averageResponseTime: 25 + Math.random() * 30,
          systemLoad: 0.4 + Math.random() * 0.4,
          errorRate: Math.random() * 0.05,
          throughput: 12 + Math.random() * 8
        },
        performance: {
          qualityScore: 7.5 + Math.random() * 2,
          costEfficiency: 65 + Math.random() * 25,
          userSatisfaction: 8 + Math.random() * 1.5,
          collaborationHealth: 7.8 + Math.random() * 1.7
        },
        predictions: {
          nextHourThroughput: 15 + Math.random() * 10,
          qualityForecast: 8 + Math.random() * 1.5,
          systemStability: 0.8 + Math.random() * 0.15,
          budgetDepletion: null
        }
      };

      setMetrics(baseMetrics);
      
      // Add to historical data (keep last 20 points)
      setHistoricalData(prev => {
        const newData = [...prev, baseMetrics].slice(-20);
        return newData;
      });
    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    }
  };

  const loadHistoricalData = async () => {
    try {
      // Generate some historical data for the charts
      const historicalPoints = [];
      const now = Date.now();
      
      for (let i = 19; i >= 0; i--) {
        const timestamp = new Date(now - i * 30000); // 30 seconds apart
        historicalPoints.push({
          timestamp,
          system: {
            activeAgents: 5 + Math.floor(Math.random() * 3),
            activeTasks: 2 + Math.floor(Math.random() * 4),
            averageResponseTime: 25 + Math.random() * 30,
            systemLoad: 0.4 + Math.random() * 0.4,
            errorRate: Math.random() * 0.05,
            throughput: 12 + Math.random() * 8
          },
          performance: {
            qualityScore: 7.5 + Math.random() * 2,
            costEfficiency: 65 + Math.random() * 25,
            userSatisfaction: 8 + Math.random() * 1.5,
            collaborationHealth: 7.8 + Math.random() * 1.7
          },
          predictions: {
            nextHourThroughput: 15 + Math.random() * 10,
            qualityForecast: 8 + Math.random() * 1.5,
            systemStability: 0.8 + Math.random() * 0.15,
            budgetDepletion: null
          }
        });
      }
      
      setHistoricalData(historicalPoints);
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  const checkForOptimizationOpportunities = async () => {
    if (!metrics || !autoOptimizationEnabled) return;

    const opportunities = [];

    // Check response time
    if (metrics.system.averageResponseTime > optimizationConfig.responseTimeThreshold) {
      opportunities.push({
        actionId: `opt_${Date.now()}_response`,
        type: 'response_optimization' as const,
        description: 'Optimize agent selection for faster responses',
        impact: 'Expected 25-35% improvement in response time',
        status: 'pending' as const
      });
    }

    // Check system load
    if (metrics.system.systemLoad > optimizationConfig.systemLoadThreshold) {
      opportunities.push({
        actionId: `opt_${Date.now()}_load`,
        type: 'load_balancing' as const,
        description: 'Redistribute workload across agents',
        impact: 'Reduce system load by 20-30%',
        status: 'pending' as const
      });
    }

    // Check cost efficiency
    if (metrics.performance.costEfficiency < optimizationConfig.costEfficiencyTarget) {
      opportunities.push({
        actionId: `opt_${Date.now()}_cost`,
        type: 'cost_optimization' as const,
        description: 'Switch to more cost-effective agent models',
        impact: 'Improve cost efficiency by 15-25%',
        status: 'pending' as const
      });
    }

    // Check quality
    if (metrics.performance.qualityScore < optimizationConfig.qualityTarget) {
      opportunities.push({
        actionId: `opt_${Date.now()}_quality`,
        type: 'quality_enhancement' as const,
        description: 'Enhance agent collaboration for better quality',
        impact: 'Improve quality score by 10-20%',
        status: 'pending' as const
      });
    }

    if (opportunities.length > 0) {
      setActiveOptimizations(prev => [...prev, ...opportunities]);
    }
  };

  const applyOptimization = async (optimization: OptimizationAction) => {
    try {
      // Update status to applying
      setActiveOptimizations(prev => 
        prev.map(opt => 
          opt.actionId === optimization.actionId 
            ? { ...opt, status: 'applying', appliedAt: new Date(), estimatedCompletion: new Date(Date.now() + 30000) }
            : opt
        )
      );

      // Simulate optimization application
      setTimeout(() => {
        setActiveOptimizations(prev => 
          prev.map(opt => 
            opt.actionId === optimization.actionId 
              ? { ...opt, status: 'completed' }
              : opt
          )
        );

        // Trigger callback
        onOptimizationApply?.(optimization.type, {
          threshold: optimizationConfig,
          target: optimization.type
        });
      }, 3000);

    } catch (error) {
      console.error('Error applying optimization:', error);
      setActiveOptimizations(prev => 
        prev.map(opt => 
          opt.actionId === optimization.actionId 
            ? { ...opt, status: 'failed' }
            : opt
        )
      );
    }
  };

  const toggleAutoOptimization = () => {
    const newState = !autoOptimizationEnabled;
    setAutoOptimizationEnabled(newState);
    onAutoOptimizationToggle?.(newState);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'applying': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'applying': return <Activity className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const renderRealTimeMetrics = () => {
    if (!metrics) return null;

    const gaugeMetrics = [
      {
        title: 'System Load',
        value: metrics.system.systemLoad * 100,
        max: 100,
        unit: '%',
        color: metrics.system.systemLoad > 0.8 ? 'text-red-600' : metrics.system.systemLoad > 0.6 ? 'text-yellow-600' : 'text-green-600',
        icon: Cpu
      },
      {
        title: 'Response Time',
        value: metrics.system.averageResponseTime,
        max: 60,
        unit: 's',
        color: metrics.system.averageResponseTime > 45 ? 'text-red-600' : metrics.system.averageResponseTime > 30 ? 'text-yellow-600' : 'text-green-600',
        icon: Clock
      },
      {
        title: 'Quality Score',
        value: metrics.performance.qualityScore,
        max: 10,
        unit: '/10',
        color: metrics.performance.qualityScore > 8 ? 'text-green-600' : metrics.performance.qualityScore > 6 ? 'text-yellow-600' : 'text-red-600',
        icon: Target
      },
      {
        title: 'Cost Efficiency',
        value: metrics.performance.costEfficiency,
        max: 100,
        unit: '%',
        color: metrics.performance.costEfficiency > 75 ? 'text-green-600' : metrics.performance.costEfficiency > 50 ? 'text-yellow-600' : 'text-red-600',
        icon: DollarSign
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {gaugeMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <metric.icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">{metric.title}</span>
              </div>
              <Gauge className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="relative">
              <div className="flex items-baseline space-x-1">
                <span className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metric.value / metric.max > 0.8 ? 'bg-red-500' :
                    metric.value / metric.max > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (metric.value / metric.max) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPerformanceCharts = () => {
    if (historicalData.length === 0) return null;

    const chartData = historicalData.map(point => ({
      time: point.timestamp.toLocaleTimeString(),
      responseTime: point.system.averageResponseTime,
      systemLoad: point.system.systemLoad * 100,
      qualityScore: point.performance.qualityScore,
      costEfficiency: point.performance.costEfficiency,
      throughput: point.system.throughput
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Response Time & System Load */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time (s)" />
              <Line type="monotone" dataKey="systemLoad" stroke="#82ca9d" name="System Load (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quality & Cost Efficiency */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality & Efficiency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="qualityScore" stackId="1" stroke="#ffc658" fill="#ffc658" name="Quality Score" />
              <Area type="monotone" dataKey="costEfficiency" stackId="2" stroke="#ff7300" fill="#ff7300" name="Cost Efficiency %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderOptimizationControls = () => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Optimization Controls</h3>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoOptimizationEnabled}
                  onChange={toggleAutoOptimization}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-Optimization</span>
              </label>
              <Zap className={`w-5 h-5 ${autoOptimizationEnabled ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Response Time Threshold
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={optimizationConfig.responseTimeThreshold}
                  onChange={(e) => setOptimizationConfig(prev => ({
                    ...prev,
                    responseTimeThreshold: parseInt(e.target.value)
                  }))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {optimizationConfig.responseTimeThreshold}s
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Load Threshold
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.1"
                  value={optimizationConfig.systemLoadThreshold}
                  onChange={(e) => setOptimizationConfig(prev => ({
                    ...prev,
                    systemLoadThreshold: parseFloat(e.target.value)
                  }))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {(optimizationConfig.systemLoadThreshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Efficiency Target
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={optimizationConfig.costEfficiencyTarget}
                  onChange={(e) => setOptimizationConfig(prev => ({
                    ...prev,
                    costEfficiencyTarget: parseInt(e.target.value)
                  }))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {optimizationConfig.costEfficiencyTarget}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality Target
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="6"
                  max="10"
                  step="0.1"
                  value={optimizationConfig.qualityTarget}
                  onChange={(e) => setOptimizationConfig(prev => ({
                    ...prev,
                    qualityTarget: parseFloat(e.target.value)
                  }))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {optimizationConfig.qualityTarget.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => checkForOptimizationOpportunities()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Check Opportunities
            </button>
            <button
              onClick={() => setActiveOptimizations([])}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveOptimizations = () => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Optimizations</h3>
        </div>
        <div className="p-6">
          {activeOptimizations.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No active optimizations</p>
              <p className="text-sm text-gray-400">System is running optimally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOptimizations.map((optimization) => (
                <div
                  key={optimization.actionId}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedOptimization === optimization.actionId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(optimization.status)}`}>
                          {getStatusIcon(optimization.status)}
                          <span className="ml-1">{optimization.status.toUpperCase()}</span>
                        </span>
                        <span className="text-sm text-gray-500">{optimization.type.replace('_', ' ')}</span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">{optimization.description}</h4>
                      <p className="text-sm text-gray-600 mb-2">{optimization.impact}</p>
                      
                      {optimization.appliedAt && (
                        <p className="text-xs text-gray-500">
                          Applied: {optimization.appliedAt.toLocaleTimeString()}
                          {optimization.estimatedCompletion && optimization.status === 'applying' && (
                            <span className="ml-2">
                              (ETA: {optimization.estimatedCompletion.toLocaleTimeString()})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {optimization.status === 'pending' && (
                        <button
                          onClick={() => applyOptimization(optimization)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Apply
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOptimization(
                          selectedOptimization === optimization.actionId ? null : optimization.actionId
                        )}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                      >
                        {selectedOptimization === optimization.actionId ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>
                  
                  {selectedOptimization === optimization.actionId && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <h5 className="font-medium text-gray-900 mb-2">Optimization Details</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-medium">{optimization.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className="ml-2 font-medium">{optimization.status}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Expected Impact:</span>
                          <p className="mt-1 text-gray-700">{optimization.impact}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Real-Time Optimization</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${autoOptimizationEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {autoOptimizationEnabled ? 'Auto-optimization active' : 'Manual optimization mode'}
          </span>
        </div>
      </div>

      {renderRealTimeMetrics()}
      {renderPerformanceCharts()}
      {renderOptimizationControls()}
      {renderActiveOptimizations()}
    </div>
  );
};

export default RealTimeOptimizationPanel;

