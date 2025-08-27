/**
 * MultiAgentPerformanceDashboard - Real-time analytics dashboard for multi-agent collaboration
 * Part of the revolutionary multi-agent autonomous research system
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Users, Clock, DollarSign, Star, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  engagement: {
    totalInteractions: number;
    averageResponseTime: number;
    responseRate: number;
    collaborationScore: number;
  };
  quality: {
    averageRating: number;
    consistencyScore: number;
    expertiseRelevance: number;
    helpfulnessRating: number;
  };
  efficiency: {
    tasksCompleted: number;
    costPerTask: number;
    costEfficiencyRatio: number;
    resourceUtilization: number;
  };
  trends: {
    performanceDirection: 'improving' | 'stable' | 'declining';
    qualityTrend: number;
    efficiencyTrend: number;
  };
}

interface DashboardProps {
  sessionId: string;
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  onOptimizationRequest?: (type: string, agentId?: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const MultiAgentPerformanceDashboard: React.FC<DashboardProps> = ({
  sessionId,
  timeframe,
  onOptimizationRequest
}) => {
  const [performanceData, setPerformanceData] = useState<{
    overview: any;
    agentMetrics: AgentPerformanceMetrics[];
    insights: any[];
    recommendations: any[];
  } | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    loadRealTimeMetrics();
    
    // Update real-time metrics every 30 seconds
    const interval = setInterval(loadRealTimeMetrics, 30000);
    return () => clearInterval(interval);
  }, [sessionId, timeframe]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to MultiAgentAnalyticsEngine
      const mockData = {
        overview: {
          totalAgents: 5,
          totalInteractions: 247,
          averageQuality: 8.2,
          totalCost: 42.50,
          systemEfficiency: 76.3
        },
        agentMetrics: [
          {
            agentId: 'agent1',
            agentName: 'Research Specialist',
            engagement: {
              totalInteractions: 65,
              averageResponseTime: 23,
              responseRate: 0.94,
              collaborationScore: 8.7
            },
            quality: {
              averageRating: 8.9,
              consistencyScore: 8.5,
              expertiseRelevance: 9.2,
              helpfulnessRating: 8.8
            },
            efficiency: {
              tasksCompleted: 28,
              costPerTask: 0.65,
              costEfficiencyRatio: 85.2,
              resourceUtilization: 0.78
            },
            trends: {
              performanceDirection: 'improving' as const,
              qualityTrend: 0.15,
              efficiencyTrend: 0.08
            }
          },
          {
            agentId: 'agent2',
            agentName: 'Data Analyst',
            engagement: {
              totalInteractions: 52,
              averageResponseTime: 31,
              responseRate: 0.89,
              collaborationScore: 7.9
            },
            quality: {
              averageRating: 8.3,
              consistencyScore: 8.1,
              expertiseRelevance: 8.7,
              helpfulnessRating: 8.0
            },
            efficiency: {
              tasksCompleted: 22,
              costPerTask: 0.58,
              costEfficiencyRatio: 78.4,
              resourceUtilization: 0.65
            },
            trends: {
              performanceDirection: 'stable' as const,
              qualityTrend: 0.02,
              efficiencyTrend: -0.05
            }
          },
          {
            agentId: 'agent3',
            agentName: 'Creative Assistant',
            engagement: {
              totalInteractions: 38,
              averageResponseTime: 28,
              responseRate: 0.91,
              collaborationScore: 8.1
            },
            quality: {
              averageRating: 7.8,
              consistencyScore: 7.5,
              expertiseRelevance: 8.2,
              helpfulnessRating: 8.3
            },
            efficiency: {
              tasksCompleted: 18,
              costPerTask: 0.72,
              costEfficiencyRatio: 68.9,
              resourceUtilization: 0.58
            },
            trends: {
              performanceDirection: 'improving' as const,
              qualityTrend: 0.12,
              efficiencyTrend: 0.18
            }
          },
          {
            agentId: 'agent4',
            agentName: 'Technical Expert',
            engagement: {
              totalInteractions: 45,
              averageResponseTime: 35,
              responseRate: 0.87,
              collaborationScore: 7.6
            },
            quality: {
              averageRating: 8.6,
              consistencyScore: 8.8,
              expertiseRelevance: 9.1,
              helpfulnessRating: 8.2
            },
            efficiency: {
              tasksCompleted: 19,
              costPerTask: 0.89,
              costEfficiencyRatio: 72.1,
              resourceUtilization: 0.62
            },
            trends: {
              performanceDirection: 'stable' as const,
              qualityTrend: -0.03,
              efficiencyTrend: 0.05
            }
          },
          {
            agentId: 'agent5',
            agentName: 'Quality Reviewer',
            engagement: {
              totalInteractions: 47,
              averageResponseTime: 26,
              responseRate: 0.93,
              collaborationScore: 8.4
            },
            quality: {
              averageRating: 8.7,
              consistencyScore: 9.0,
              expertiseRelevance: 8.5,
              helpfulnessRating: 8.9
            },
            efficiency: {
              tasksCompleted: 25,
              costPerTask: 0.55,
              costEfficiencyRatio: 89.3,
              resourceUtilization: 0.71
            },
            trends: {
              performanceDirection: 'improving' as const,
              qualityTrend: 0.09,
              efficiencyTrend: 0.14
            }
          }
        ],
        insights: [
          {
            type: 'performance',
            severity: 'info',
            title: 'Top Performing Agent',
            description: 'Research Specialist is the top performer with 8.9/10 average rating',
            recommendations: [
              {
                action: 'Use as mentor for other agents',
                priority: 'medium'
              }
            ]
          },
          {
            type: 'efficiency',
            severity: 'warning',
            title: 'Cost Optimization Opportunity',
            description: 'Technical Expert has high cost per task ($0.89)',
            recommendations: [
              {
                action: 'Consider switching to more cost-effective model',
                priority: 'high'
              }
            ]
          }
        ],
        recommendations: [
          {
            type: 'performance',
            description: 'Improve Creative Assistant response consistency',
            priority: 'medium',
            expectedImpact: 'Improve overall system quality by 8-12%'
          },
          {
            type: 'cost',
            description: 'Optimize Technical Expert model selection',
            priority: 'high',
            expectedImpact: 'Reduce costs by 15-20%'
          }
        ]
      };

      setPerformanceData(mockData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      // Simulate real-time metrics
      const mockRealTime = {
        timestamp: new Date(),
        system: {
          activeAgents: 5,
          activeTasks: 3,
          averageResponseTime: 28.5,
          systemLoad: 0.67,
          errorRate: 0.02
        },
        performance: {
          throughput: 15.2,
          qualityScore: 8.2,
          costEfficiency: 76.3,
          userSatisfaction: 8.7,
          collaborationHealth: 8.4
        }
      };

      setRealTimeMetrics(mockRealTime);
    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    }
  };

  const formatTrendIcon = (direction: string, trend: number) => {
    if (direction === 'improving' || trend > 0.05) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (direction === 'declining' || trend < -0.05) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getPerformanceColor = (value: number, max: number = 10) => {
    const percentage = value / max;
    if (percentage >= 0.8) return 'text-green-600';
    if (percentage >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderOverviewCards = () => {
    if (!performanceData || !realTimeMetrics) return null;

    const cards = [
      {
        title: 'Active Agents',
        value: realTimeMetrics.system.activeAgents,
        icon: Users,
        color: 'bg-blue-500',
        trend: '+2 this hour'
      },
      {
        title: 'Avg Response Time',
        value: `${realTimeMetrics.system.averageResponseTime.toFixed(1)}s`,
        icon: Clock,
        color: 'bg-green-500',
        trend: '-5.2s from yesterday'
      },
      {
        title: 'Total Cost',
        value: `$${performanceData.overview.totalCost.toFixed(2)}`,
        icon: DollarSign,
        color: 'bg-purple-500',
        trend: '-12% from last week'
      },
      {
        title: 'Quality Score',
        value: `${performanceData.overview.averageQuality.toFixed(1)}/10`,
        icon: Star,
        color: 'bg-yellow-500',
        trend: '+0.3 from yesterday'
      },
      {
        title: 'System Load',
        value: `${(realTimeMetrics.system.systemLoad * 100).toFixed(0)}%`,
        icon: Activity,
        color: 'bg-indigo-500',
        trend: realTimeMetrics.system.systemLoad > 0.8 ? 'High load' : 'Normal'
      },
      {
        title: 'Collaboration Health',
        value: `${realTimeMetrics.performance.collaborationHealth.toFixed(1)}/10`,
        icon: CheckCircle,
        color: 'bg-teal-500',
        trend: '+0.2 from yesterday'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.trend}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAgentPerformanceChart = () => {
    if (!performanceData) return null;

    const chartData = performanceData.agentMetrics.map(agent => ({
      name: agent.agentName,
      quality: agent.quality.averageRating,
      efficiency: agent.efficiency.costEfficiencyRatio,
      engagement: agent.engagement.collaborationScore,
      responseTime: agent.engagement.averageResponseTime
    }));

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Agent Performance Comparison</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'detailed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Detailed
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={90} domain={[0, 10]} />
            <Radar name="Quality" dataKey="quality" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Radar name="Engagement" dataKey="engagement" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAgentList = () => {
    if (!performanceData) return null;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Agent Performance Details</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {performanceData.agentMetrics.map((agent) => (
            <div
              key={agent.agentId}
              className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedAgent === agent.agentId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{agent.agentName}</h4>
                    {formatTrendIcon(agent.trends.performanceDirection, agent.trends.qualityTrend)}
                    <span className={`text-sm ${getPerformanceColor(agent.quality.averageRating)}`}>
                      {agent.quality.averageRating.toFixed(1)}/10
                    </span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Interactions:</span>
                      <span className="ml-1 font-medium">{agent.engagement.totalInteractions}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Response Time:</span>
                      <span className="ml-1 font-medium">{agent.engagement.averageResponseTime.toFixed(0)}s</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tasks:</span>
                      <span className="ml-1 font-medium">{agent.efficiency.tasksCompleted}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost/Task:</span>
                      <span className="ml-1 font-medium">${agent.efficiency.costPerTask.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedAgent === agent.agentId && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Quality Metrics</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Consistency:</span>
                              <span className={getPerformanceColor(agent.quality.consistencyScore)}>
                                {agent.quality.consistencyScore.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Expertise:</span>
                              <span className={getPerformanceColor(agent.quality.expertiseRelevance)}>
                                {agent.quality.expertiseRelevance.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Helpfulness:</span>
                              <span className={getPerformanceColor(agent.quality.helpfulnessRating)}>
                                {agent.quality.helpfulnessRating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Efficiency Metrics</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Cost Efficiency:</span>
                              <span className={getPerformanceColor(agent.efficiency.costEfficiencyRatio, 100)}>
                                {agent.efficiency.costEfficiencyRatio.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Utilization:</span>
                              <span className={getPerformanceColor(agent.efficiency.resourceUtilization * 10)}>
                                {(agent.efficiency.resourceUtilization * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Actions</h5>
                          <div className="space-y-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOptimizationRequest?.('performance', agent.agentId);
                              }}
                              className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              Optimize Performance
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOptimizationRequest?.('cost', agent.agentId);
                              }}
                              className="w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                            >
                              Optimize Cost
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInsightsAndRecommendations = () => {
    if (!performanceData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Analytics Insights</h3>
          </div>
          <div className="p-6 space-y-4">
            {performanceData.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  insight.severity === 'warning' ? 'bg-yellow-100' : 
                  insight.severity === 'critical' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {insight.severity === 'warning' ? (
                    <AlertTriangle className={`w-4 h-4 ${
                      insight.severity === 'warning' ? 'text-yellow-600' : 
                      insight.severity === 'critical' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Recommended action:</p>
                      <p className="text-sm text-blue-600">{insight.recommendations[0].action}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Optimization Recommendations</h3>
          </div>
          <div className="p-6 space-y-4">
            {performanceData.recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-xs text-gray-500">{rec.type}</span>
                </div>
                <p className="text-sm text-gray-900 mb-2">{rec.description}</p>
                <p className="text-xs text-gray-600">{rec.expectedImpact}</p>
                <button
                  onClick={() => onOptimizationRequest?.(rec.type)}
                  className="mt-3 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Apply Optimization
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading performance analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Multi-Agent Performance Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">
            Last updated: {realTimeMetrics?.timestamp ? new Date(realTimeMetrics.timestamp).toLocaleTimeString() : 'Loading...'}
          </span>
        </div>
      </div>

      {renderOverviewCards()}
      {renderAgentPerformanceChart()}
      {renderAgentList()}
      {renderInsightsAndRecommendations()}
    </div>
  );
};

export default MultiAgentPerformanceDashboard;

