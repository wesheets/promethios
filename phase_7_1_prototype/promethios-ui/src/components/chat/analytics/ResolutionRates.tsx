/**
 * Resolution Rates Component
 * 
 * Comprehensive resolution analytics dashboard including resolution rates,
 * time to resolution, escalation patterns, and efficiency metrics.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Activity,
  Download,
  RefreshCw,
  Filter,
  Timer,
  Zap,
  ArrowUp,
  BarChart3,
  PieChart as PieChartIcon,
  Award,
  Gauge
} from 'lucide-react';

interface ResolutionMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'average' | 'poor';
  target?: number;
}

interface ResolutionData {
  timestamp: string;
  resolutionRate: number;
  avgResolutionTime: number;
  escalationRate: number;
  firstContactResolution: number;
  automatedResolution: number;
}

interface EscalationPattern {
  reason: string;
  count: number;
  percentage: number;
  avgTime: number;
  trend: number;
}

interface ResolutionCategory {
  category: string;
  resolved: number;
  pending: number;
  escalated: number;
  avgTime: number;
}

const ResolutionRates: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<ResolutionMetric[]>([]);
  const [resolutionData, setResolutionData] = useState<ResolutionData[]>([]);
  const [escalationPatterns, setEscalationPatterns] = useState<EscalationPattern[]>([]);
  const [resolutionCategories, setResolutionCategories] = useState<ResolutionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const mockMetrics: ResolutionMetric[] = [
    {
      id: 'overall_resolution',
      name: 'Overall Resolution Rate',
      value: 87.3,
      unit: '%',
      change: 5.2,
      trend: 'up',
      status: 'excellent',
      target: 85.0
    },
    {
      id: 'avg_resolution_time',
      name: 'Avg Resolution Time',
      value: 4.2,
      unit: 'hours',
      change: -12.5,
      trend: 'down',
      status: 'good',
      target: 6.0
    },
    {
      id: 'first_contact_resolution',
      name: 'First Contact Resolution',
      value: 72.8,
      unit: '%',
      change: 8.7,
      trend: 'up',
      status: 'good',
      target: 70.0
    },
    {
      id: 'escalation_rate',
      name: 'Escalation Rate',
      value: 12.7,
      unit: '%',
      change: -15.3,
      trend: 'down',
      status: 'excellent',
      target: 15.0
    },
    {
      id: 'automated_resolution',
      name: 'Automated Resolution',
      value: 64.5,
      unit: '%',
      change: 18.2,
      trend: 'up',
      status: 'excellent',
      target: 60.0
    },
    {
      id: 'sla_compliance',
      name: 'SLA Compliance',
      value: 94.1,
      unit: '%',
      change: 3.8,
      trend: 'up',
      status: 'excellent',
      target: 90.0
    }
  ];

  const mockResolutionData: ResolutionData[] = [
    { timestamp: '2024-01-01', resolutionRate: 82.1, avgResolutionTime: 5.8, escalationRate: 17.9, firstContactResolution: 68.2, automatedResolution: 58.3 },
    { timestamp: '2024-01-05', resolutionRate: 83.7, avgResolutionTime: 5.2, escalationRate: 16.3, firstContactResolution: 69.8, automatedResolution: 60.1 },
    { timestamp: '2024-01-10', resolutionRate: 85.2, avgResolutionTime: 4.9, escalationRate: 14.8, firstContactResolution: 71.2, automatedResolution: 61.7 },
    { timestamp: '2024-01-15', resolutionRate: 86.1, avgResolutionTime: 4.5, escalationRate: 13.9, firstContactResolution: 72.1, automatedResolution: 63.2 },
    { timestamp: '2024-01-20', resolutionRate: 87.3, avgResolutionTime: 4.2, escalationRate: 12.7, firstContactResolution: 72.8, automatedResolution: 64.5 }
  ];

  const mockEscalationPatterns: EscalationPattern[] = [
    {
      reason: 'Complex Technical Issue',
      count: 156,
      percentage: 34.2,
      avgTime: 8.5,
      trend: -8.3
    },
    {
      reason: 'Policy Exception Required',
      count: 89,
      percentage: 19.5,
      avgTime: 6.2,
      trend: -12.1
    },
    {
      reason: 'Billing Dispute',
      count: 67,
      percentage: 14.7,
      avgTime: 12.3,
      trend: 5.2
    },
    {
      reason: 'Account Security Issue',
      count: 54,
      percentage: 11.8,
      avgTime: 4.7,
      trend: -15.6
    },
    {
      reason: 'Product Defect',
      count: 43,
      percentage: 9.4,
      avgTime: 15.8,
      trend: 8.9
    },
    {
      reason: 'Other',
      count: 47,
      percentage: 10.4,
      avgTime: 7.2,
      trend: -3.2
    }
  ];

  const mockResolutionCategories: ResolutionCategory[] = [
    {
      category: 'Technical Support',
      resolved: 1247,
      pending: 89,
      escalated: 156,
      avgTime: 4.8
    },
    {
      category: 'Billing Inquiries',
      resolved: 892,
      pending: 45,
      escalated: 67,
      avgTime: 3.2
    },
    {
      category: 'Account Management',
      resolved: 634,
      pending: 32,
      escalated: 54,
      avgTime: 2.7
    },
    {
      category: 'Product Information',
      resolved: 1456,
      pending: 23,
      escalated: 12,
      avgTime: 1.8
    },
    {
      category: 'Order Status',
      resolved: 789,
      pending: 18,
      escalated: 8,
      avgTime: 1.2
    }
  ];

  const resolutionTimeDistribution = [
    { range: '< 1 hour', count: 1247, percentage: 42.3 },
    { range: '1-4 hours', count: 892, percentage: 30.2 },
    { range: '4-8 hours', count: 456, percentage: 15.4 },
    { range: '8-24 hours', count: 234, percentage: 7.9 },
    { range: '> 24 hours', count: 123, percentage: 4.2 }
  ];

  const resolutionMethods = [
    { name: 'Automated Response', value: 45.2, color: '#10B981' },
    { name: 'Knowledge Base', value: 28.7, color: '#3B82F6' },
    { name: 'Agent Assistance', value: 18.4, color: '#F59E0B' },
    { name: 'Escalation', value: 7.7, color: '#EF4444' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(mockMetrics);
      setResolutionData(mockResolutionData);
      setEscalationPatterns(mockEscalationPatterns);
      setResolutionCategories(mockResolutionCategories);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'average':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  const getResolutionRate = (category: ResolutionCategory) => {
    const total = category.resolved + category.pending + category.escalated;
    return ((category.resolved / total) * 100).toFixed(1);
  };

  const exportData = () => {
    console.log('Exporting resolution rates data...');
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-white">Loading resolution rates data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Resolution Rates</h1>
          <p className="text-gray-300 mt-2">
            Monitor resolution efficiency, escalation patterns, and time-to-resolution metrics.
          </p>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="7d" className="text-white">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-white">Last 30 days</SelectItem>
              <SelectItem value="90d" className="text-white">Last 90 days</SelectItem>
              <SelectItem value="1y" className="text-white">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" className="text-white border-gray-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  metric.status === 'excellent' ? 'bg-green-100' :
                  metric.status === 'good' ? 'bg-blue-100' :
                  metric.status === 'average' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {metric.id === 'overall_resolution' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {metric.id === 'avg_resolution_time' && <Clock className="h-4 w-4 text-blue-600" />}
                  {metric.id === 'first_contact_resolution' && <Zap className="h-4 w-4 text-yellow-600" />}
                  {metric.id === 'escalation_rate' && <ArrowUp className="h-4 w-4 text-red-600" />}
                  {metric.id === 'automated_resolution' && <Activity className="h-4 w-4 text-purple-600" />}
                  {metric.id === 'sla_compliance' && <Award className="h-4 w-4 text-green-600" />}
                </div>
                {getTrendIcon(metric.trend, metric.change)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">{metric.name}</p>
                <p className="text-2xl font-bold text-white">
                  {metric.value}{metric.unit}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`text-sm ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change >= 0 ? '+' : ''}{metric.change}%
                  </span>
                  {metric.target && (
                    <span className="text-xs text-gray-400 ml-2">
                      Target: {metric.target}{metric.unit}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="trends" className="text-white data-[state=active]:bg-gray-700">
            Resolution Trends
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-white data-[state=active]:bg-gray-700">
            By Category
          </TabsTrigger>
          <TabsTrigger value="escalations" className="text-white data-[state=active]:bg-gray-700">
            Escalation Patterns
          </TabsTrigger>
          <TabsTrigger value="methods" className="text-white data-[state=active]:bg-gray-700">
            Resolution Methods
          </TabsTrigger>
        </TabsList>

        {/* Resolution Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resolution Rate Trends</CardTitle>
                <CardDescription className="text-gray-300">
                  Overall and first contact resolution rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="resolutionRate" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Overall Resolution (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="firstContactResolution" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="First Contact Resolution (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resolution Time & Escalations</CardTitle>
                <CardDescription className="text-gray-300">
                  Average resolution time and escalation rate trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgResolutionTime" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Avg Resolution Time (hours)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="escalationRate" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Escalation Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Automated Resolution Growth</CardTitle>
                <CardDescription className="text-gray-300">
                  Percentage of issues resolved automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={resolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="automatedResolution" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resolution Time Distribution</CardTitle>
                <CardDescription className="text-gray-300">
                  Distribution of resolution times across all cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resolutionTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="range" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            {resolutionCategories.map((category, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{category.category}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {category.resolved + category.pending + category.escalated} total cases
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{getResolutionRate(category)}%</p>
                        <p className="text-sm text-gray-300">Resolution Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-500">{category.avgTime}h</p>
                        <p className="text-sm text-gray-300">Avg Time</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-green-500">{category.resolved}</p>
                      <p className="text-sm text-gray-300">Resolved</p>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-500">{category.pending}</p>
                      <p className="text-sm text-gray-300">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-red-500">{category.escalated}</p>
                      <p className="text-sm text-gray-300">Escalated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Escalation Patterns Tab */}
        <TabsContent value="escalations" className="space-y-4">
          <div className="grid gap-4">
            {escalationPatterns.map((pattern, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{pattern.reason}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {pattern.count} escalations ({pattern.percentage}% of total)
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">{pattern.avgTime}h</p>
                        <p className="text-sm text-gray-300">Avg Time</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {pattern.trend < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${pattern.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {pattern.trend}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${pattern.percentage}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Resolution Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resolution Method Distribution</CardTitle>
                <CardDescription className="text-gray-300">
                  How issues are being resolved across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={resolutionMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resolutionMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resolution Efficiency Metrics</CardTitle>
                <CardDescription className="text-gray-300">
                  Key performance indicators for resolution efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Gauge className="h-5 w-5 text-blue-500" />
                      <span className="text-white">Automation Rate</span>
                    </div>
                    <span className="text-white font-bold">64.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Timer className="h-5 w-5 text-green-500" />
                      <span className="text-white">Avg First Response</span>
                    </div>
                    <span className="text-white font-bold">2.3 min</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-white">Self-Service Success</span>
                    </div>
                    <span className="text-white font-bold">73.9%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <span className="text-white">Agent Utilization</span>
                    </div>
                    <span className="text-white font-bold">87.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResolutionRates;

