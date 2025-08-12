/**
 * Performance Analytics Component
 * 
 * Comprehensive performance analytics dashboard for chatbot systems
 * including response times, conversation metrics, and system performance.
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
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MessageSquare, 
  Users, 
  Activity, 
  Zap, 
  Target, 
  BarChart3, 
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
  Timer,
  Gauge
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  status: 'good' | 'warning' | 'critical';
}

interface TimeSeriesData {
  timestamp: string;
  responseTime: number;
  conversations: number;
  successRate: number;
  errorRate: number;
  throughput: number;
}

const PerformanceAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  const mockMetrics: PerformanceMetric[] = [
    {
      id: 'avg_response_time',
      name: 'Avg Response Time',
      value: 1.2,
      unit: 'seconds',
      change: -8.5,
      trend: 'down',
      target: 2.0,
      status: 'good'
    },
    {
      id: 'conversations_per_hour',
      name: 'Conversations/Hour',
      value: 847,
      unit: 'conversations',
      change: 12.3,
      trend: 'up',
      target: 800,
      status: 'good'
    },
    {
      id: 'success_rate',
      name: 'Success Rate',
      value: 94.7,
      unit: '%',
      change: 2.1,
      trend: 'up',
      target: 95.0,
      status: 'warning'
    },
    {
      id: 'error_rate',
      name: 'Error Rate',
      value: 2.3,
      unit: '%',
      change: -15.2,
      trend: 'down',
      target: 5.0,
      status: 'good'
    },
    {
      id: 'uptime',
      name: 'System Uptime',
      value: 99.8,
      unit: '%',
      change: 0.1,
      trend: 'stable',
      target: 99.9,
      status: 'good'
    },
    {
      id: 'throughput',
      name: 'Throughput',
      value: 2847,
      unit: 'req/min',
      change: 18.7,
      trend: 'up',
      target: 3000,
      status: 'good'
    }
  ];

  const mockTimeSeriesData: TimeSeriesData[] = [
    { timestamp: '2024-01-14', responseTime: 1.5, conversations: 720, successRate: 92.1, errorRate: 3.2, throughput: 2400 },
    { timestamp: '2024-01-15', responseTime: 1.3, conversations: 780, successRate: 93.5, errorRate: 2.8, throughput: 2600 },
    { timestamp: '2024-01-16', responseTime: 1.4, conversations: 850, successRate: 94.2, errorRate: 2.5, throughput: 2750 },
    { timestamp: '2024-01-17', responseTime: 1.2, conversations: 920, successRate: 95.1, errorRate: 2.1, throughput: 2900 },
    { timestamp: '2024-01-18', responseTime: 1.1, conversations: 890, successRate: 94.8, errorRate: 2.3, throughput: 2850 },
    { timestamp: '2024-01-19', responseTime: 1.3, conversations: 810, successRate: 93.9, errorRate: 2.7, throughput: 2700 },
    { timestamp: '2024-01-20', responseTime: 1.2, conversations: 847, successRate: 94.7, errorRate: 2.3, throughput: 2847 }
  ];

  const responseTimeDistribution = [
    { range: '0-0.5s', count: 1247, percentage: 42.3 },
    { range: '0.5-1s', count: 892, percentage: 30.2 },
    { range: '1-2s', count: 567, percentage: 19.2 },
    { range: '2-5s', count: 189, percentage: 6.4 },
    { range: '5s+', count: 56, percentage: 1.9 }
  ];

  const conversationTypes = [
    { name: 'Information Requests', value: 45.2, color: '#3B82F6' },
    { name: 'Support Tickets', value: 28.7, color: '#10B981' },
    { name: 'Sales Inquiries', value: 15.3, color: '#F59E0B' },
    { name: 'Complaints', value: 7.1, color: '#EF4444' },
    { name: 'Other', value: 3.7, color: '#8B5CF6' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(mockMetrics);
      setTimeSeriesData(mockTimeSeriesData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
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
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const exportData = () => {
    console.log('Exporting performance analytics data...');
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
        <span className="ml-2 text-lg text-white">Loading performance analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
          <p className="text-gray-300 mt-2">
            Monitor system performance, response times, and conversation metrics in real-time.
          </p>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="1h" className="text-white">Last Hour</SelectItem>
              <SelectItem value="24h" className="text-white">Last 24h</SelectItem>
              <SelectItem value="7d" className="text-white">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-white">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" className="text-white border-gray-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
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
                  metric.status === 'good' ? 'bg-green-100' :
                  metric.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {metric.id === 'avg_response_time' && <Clock className="h-4 w-4 text-blue-600" />}
                  {metric.id === 'conversations_per_hour' && <MessageSquare className="h-4 w-4 text-green-600" />}
                  {metric.id === 'success_rate' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {metric.id === 'error_rate' && <AlertCircle className="h-4 w-4 text-red-600" />}
                  {metric.id === 'uptime' && <Activity className="h-4 w-4 text-blue-600" />}
                  {metric.id === 'throughput' && <Gauge className="h-4 w-4 text-purple-600" />}
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
            Performance Trends
          </TabsTrigger>
          <TabsTrigger value="distribution" className="text-white data-[state=active]:bg-gray-700">
            Response Distribution
          </TabsTrigger>
          <TabsTrigger value="conversations" className="text-white data-[state=active]:bg-gray-700">
            Conversation Types
          </TabsTrigger>
          <TabsTrigger value="system" className="text-white data-[state=active]:bg-gray-700">
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Performance Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Response Time Trends</CardTitle>
                <CardDescription className="text-gray-300">
                  Average response time over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
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
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Conversation Volume</CardTitle>
                <CardDescription className="text-gray-300">
                  Number of conversations handled per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
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
                      dataKey="conversations" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Success & Error Rates</CardTitle>
                <CardDescription className="text-gray-300">
                  Success rate vs error rate over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
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
                      dataKey="successRate" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Success Rate (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Error Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Throughput</CardTitle>
                <CardDescription className="text-gray-300">
                  Requests processed per minute
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
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
                    <Bar dataKey="throughput" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Response Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Response Time Distribution</CardTitle>
              <CardDescription className="text-gray-300">
                Distribution of response times across all conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={responseTimeDistribution}>
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
        </TabsContent>

        {/* Conversation Types Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Conversation Type Breakdown</CardTitle>
              <CardDescription className="text-gray-300">
                Distribution of conversation types by percentage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={conversationTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {conversationTypes.map((entry, index) => (
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
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Status</CardTitle>
                <CardDescription className="text-gray-300">
                  Current system health indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">API Endpoints</span>
                    <Badge variant="default" className="bg-green-600">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Database</span>
                    <Badge variant="default" className="bg-green-600">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Cache Layer</span>
                    <Badge variant="default" className="bg-green-600">Optimal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Message Queue</span>
                    <Badge variant="secondary">Processing</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">External APIs</span>
                    <Badge variant="default" className="bg-green-600">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resource Usage</CardTitle>
                <CardDescription className="text-gray-300">
                  Current system resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">CPU Usage</span>
                      <span className="text-white">67%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Memory Usage</span>
                      <span className="text-white">54%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '54%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Disk Usage</span>
                      <span className="text-white">32%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '32%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Network I/O</span>
                      <span className="text-white">78%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
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

export default PerformanceAnalytics;

