import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, MessageSquare, Clock, 
  ThumbsUp, AlertTriangle, DollarSign, Target, Zap,
  Activity, Shield, Brain, Heart, Star, Award
} from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedChatbot, setSelectedChatbot] = useState('all');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, this would come from the analytics service
  const mockDashboardData = {
    system_metrics: {
      conversations: {
        total: 1247,
        unique_users: 892,
        active_chatbots: 12,
        avg_messages_per_conversation: 8.3,
        resolution_rate: 87.5,
        escalation_rate: 4.2
      },
      performance: {
        avg_response_time: 1.2,
        avg_satisfaction: 4.3,
        avg_sentiment: 0.65,
        avg_trust_score: 0.82
      },
      governance: {
        total_violations: 23,
        violation_rate: 1.8
      },
      cost: {
        total_cost: 156.78,
        cost_per_conversation: 0.126
      },
      messages: {
        total: 10349,
        avg_response_time: 0.95
      }
    },
    top_chatbots: [
      { id: 'support-bot', name: 'Support Bot', conversations: 456, satisfaction: 4.5, resolution_rate: 92 },
      { id: 'sales-bot', name: 'Sales Bot', conversations: 321, satisfaction: 4.2, resolution_rate: 85 },
      { id: 'hr-bot', name: 'HR Bot', conversations: 234, satisfaction: 4.1, resolution_rate: 88 },
      { id: 'tech-bot', name: 'Tech Bot', conversations: 156, satisfaction: 4.0, resolution_rate: 79 },
      { id: 'billing-bot', name: 'Billing Bot', conversations: 80, satisfaction: 3.9, resolution_rate: 91 }
    ],
    hourly_trends: [
      { hour: '00:00', conversations: 12, messages: 89, satisfaction: 4.1 },
      { hour: '01:00', conversations: 8, messages: 56, satisfaction: 4.2 },
      { hour: '02:00', conversations: 5, messages: 34, satisfaction: 4.0 },
      { hour: '03:00', conversations: 3, messages: 21, satisfaction: 4.1 },
      { hour: '04:00', conversations: 7, messages: 45, satisfaction: 4.0 },
      { hour: '05:00', conversations: 15, messages: 98, satisfaction: 4.2 },
      { hour: '06:00', conversations: 28, messages: 187, satisfaction: 4.3 },
      { hour: '07:00', conversations: 45, messages: 312, satisfaction: 4.2 },
      { hour: '08:00', conversations: 67, messages: 456, satisfaction: 4.4 },
      { hour: '09:00', conversations: 89, messages: 623, satisfaction: 4.3 },
      { hour: '10:00', conversations: 102, messages: 734, satisfaction: 4.5 },
      { hour: '11:00', conversations: 95, messages: 687, satisfaction: 4.4 },
      { hour: '12:00', conversations: 87, messages: 598, satisfaction: 4.3 },
      { hour: '13:00', conversations: 92, messages: 645, satisfaction: 4.4 },
      { hour: '14:00', conversations: 98, messages: 712, satisfaction: 4.5 },
      { hour: '15:00', conversations: 105, messages: 789, satisfaction: 4.6 },
      { hour: '16:00', conversations: 89, messages: 634, satisfaction: 4.4 },
      { hour: '17:00', conversations: 76, messages: 523, satisfaction: 4.3 },
      { hour: '18:00', conversations: 54, messages: 378, satisfaction: 4.2 },
      { hour: '19:00', conversations: 43, messages: 289, satisfaction: 4.1 },
      { hour: '20:00', conversations: 32, messages: 198, satisfaction: 4.0 },
      { hour: '21:00', conversations: 25, messages: 156, satisfaction: 4.1 },
      { hour: '22:00', conversations: 18, messages: 123, satisfaction: 4.0 },
      { hour: '23:00', conversations: 14, messages: 98, satisfaction: 4.1 }
    ],
    trending_topics: [
      { topic: 'Account Issues', count: 234, sentiment: 0.2 },
      { topic: 'Product Information', count: 189, sentiment: 0.7 },
      { topic: 'Billing Questions', count: 156, sentiment: 0.1 },
      { topic: 'Technical Support', count: 134, sentiment: 0.3 },
      { topic: 'Feature Requests', count: 98, sentiment: 0.8 }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const loadDashboardData = async () => {
      setLoading(true);
      // In real implementation: const data = await analyticsService.getDashboardData(timeRange);
      setTimeout(() => {
        setDashboardData(mockDashboardData);
        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, [timeRange, selectedChatbot]);

  const metricCards: MetricCard[] = [
    {
      title: 'Total Conversations',
      value: dashboardData?.system_metrics?.conversations?.total || 0,
      change: 12.5,
      changeType: 'increase',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Active conversations today'
    },
    {
      title: 'Unique Users',
      value: dashboardData?.system_metrics?.conversations?.unique_users || 0,
      change: 8.3,
      changeType: 'increase',
      icon: <Users className="h-4 w-4" />,
      description: 'Distinct users engaged'
    },
    {
      title: 'Avg Response Time',
      value: `${dashboardData?.system_metrics?.performance?.avg_response_time || 0}s`,
      change: -5.2,
      changeType: 'decrease',
      icon: <Clock className="h-4 w-4" />,
      description: 'Average bot response time'
    },
    {
      title: 'Satisfaction Score',
      value: `${dashboardData?.system_metrics?.performance?.avg_satisfaction || 0}/5`,
      change: 3.1,
      changeType: 'increase',
      icon: <ThumbsUp className="h-4 w-4" />,
      description: 'User satisfaction rating'
    },
    {
      title: 'Resolution Rate',
      value: `${dashboardData?.system_metrics?.conversations?.resolution_rate || 0}%`,
      change: 2.8,
      changeType: 'increase',
      icon: <Target className="h-4 w-4" />,
      description: 'Successfully resolved conversations'
    },
    {
      title: 'Trust Score',
      value: `${Math.round((dashboardData?.system_metrics?.performance?.avg_trust_score || 0) * 100)}%`,
      change: 1.5,
      changeType: 'increase',
      icon: <Shield className="h-4 w-4" />,
      description: 'Average governance trust score'
    },
    {
      title: 'Total Cost',
      value: `$${dashboardData?.system_metrics?.cost?.total_cost || 0}`,
      change: -8.7,
      changeType: 'decrease',
      icon: <DollarSign className="h-4 w-4" />,
      description: 'Operational costs today'
    },
    {
      title: 'Escalation Rate',
      value: `${dashboardData?.system_metrics?.conversations?.escalation_rate || 0}%`,
      change: -12.3,
      changeType: 'decrease',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Conversations escalated to humans'
    }
  ];

  const renderMetricCard = (metric: MetricCard, index: number) => (
    <Card key={index} className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <div className="text-muted-foreground">{metric.icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric.value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className={`flex items-center ${
            metric.changeType === 'increase' ? 'text-green-600' : 
            metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {metric.changeType === 'increase' ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : metric.changeType === 'decrease' ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : null}
            {Math.abs(metric.change)}%
          </div>
          <span>vs last period</span>
        </div>
        {metric.description && (
          <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
        )}
      </CardContent>
    </Card>
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              Comprehensive insights into your chat performance
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your chat performance and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chatbot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chatbots</SelectItem>
              <SelectItem value="support-bot">Support Bot</SelectItem>
              <SelectItem value="sales-bot">Sales Bot</SelectItem>
              <SelectItem value="hr-bot">HR Bot</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Real-time
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => renderMetricCard(metric, index))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Conversation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Trends</CardTitle>
                <CardDescription>Hourly conversation volume and satisfaction</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData?.hourly_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="conversations"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Conversations"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="satisfaction"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Satisfaction"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Chatbots */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Chatbots</CardTitle>
                <CardDescription>Ranked by conversation volume and satisfaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.top_chatbots?.slice(0, 5).map((bot: any, index: number) => (
                    <div key={bot.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{bot.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {bot.conversations} conversations
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{bot.satisfaction}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bot.resolution_rate}% resolved
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Trending Topics</CardTitle>
              <CardDescription>Most discussed topics and their sentiment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {dashboardData?.trending_topics?.map((topic: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{topic.topic}</h4>
                      <Badge variant={topic.sentiment > 0.5 ? "default" : topic.sentiment > 0 ? "secondary" : "destructive"}>
                        {topic.sentiment > 0.5 ? "Positive" : topic.sentiment > 0 ? "Neutral" : "Negative"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{topic.count} mentions</p>
                    <Progress value={(topic.sentiment + 1) * 50} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>Distribution of bot response times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { range: '0-1s', count: 6234 },
                    { range: '1-2s', count: 2156 },
                    { range: '2-3s', count: 987 },
                    { range: '3-5s', count: 456 },
                    { range: '5s+', count: 123 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Trends</CardTitle>
                <CardDescription>User satisfaction over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData?.hourly_trends?.slice(-12) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis domain={[3.5, 5]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="satisfaction"
                      stroke="#82ca9d"
                      strokeWidth={3}
                      dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>User activity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Users</span>
                    <span className="font-medium">234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Returning Users</span>
                    <span className="font-medium">658</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Session Duration</span>
                    <span className="font-medium">12m 34s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bounce Rate</span>
                    <span className="font-medium">23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Segments</CardTitle>
                <CardDescription>User distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New', value: 234 },
                        { name: 'Returning', value: 658 },
                        { name: 'VIP', value: 89 },
                        { name: 'Enterprise', value: 45 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {[
                        { name: 'New', value: 234 },
                        { name: 'Returning', value: 658 },
                        { name: 'VIP', value: 89 },
                        { name: 'Enterprise', value: 45 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Satisfaction</CardTitle>
                <CardDescription>Satisfaction by user segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { segment: 'New Users', satisfaction: 4.1, color: 'bg-blue-500' },
                    { segment: 'Returning', satisfaction: 4.4, color: 'bg-green-500' },
                    { segment: 'VIP', satisfaction: 4.7, color: 'bg-purple-500' },
                    { segment: 'Enterprise', satisfaction: 4.8, color: 'bg-orange-500' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{item.segment}</span>
                        <span className="font-medium">{item.satisfaction}/5</span>
                      </div>
                      <Progress value={item.satisfaction * 20} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trust Score Trends</CardTitle>
                <CardDescription>Governance trust scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '00:00', trust: 0.85 },
                    { time: '04:00', trust: 0.82 },
                    { time: '08:00', trust: 0.88 },
                    { time: '12:00', trust: 0.84 },
                    { time: '16:00', trust: 0.86 },
                    { time: '20:00', trust: 0.83 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0.7, 1]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="trust"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governance Violations</CardTitle>
                <CardDescription>Policy violations by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: 'Content Safety', violations: 12, severity: 'medium' },
                    { category: 'Data Privacy', violations: 8, severity: 'high' },
                    { category: 'HIPAA Compliance', violations: 3, severity: 'high' },
                    { category: 'Response Quality', violations: 15, severity: 'low' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.category}</p>
                        <p className="text-sm text-muted-foreground">{item.violations} violations</p>
                      </div>
                      <Badge variant={
                        item.severity === 'high' ? 'destructive' :
                        item.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {item.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Operational costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'API Calls', value: 89.45 },
                        { name: 'Storage', value: 23.12 },
                        { name: 'Compute', value: 34.21 },
                        { name: 'Other', value: 10.00 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {[
                        { name: 'API Calls', value: 89.45 },
                        { name: 'Storage', value: 23.12 },
                        { name: 'Compute', value: 34.21 },
                        { name: 'Other', value: 10.00 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency</CardTitle>
                <CardDescription>Cost metrics and optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost per Conversation</span>
                    <span className="font-medium">$0.126</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost per Message</span>
                    <span className="font-medium">$0.015</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly Projection</span>
                    <span className="font-medium">$4,734</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Savings vs Human</span>
                    <span className="font-medium text-green-600">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
                <CardDescription>Return on investment metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">342%</div>
                    <p className="text-sm text-muted-foreground">Total ROI</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cost Savings</span>
                      <span className="font-medium">$12,456</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Efficiency Gains</span>
                      <span className="font-medium">$8,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue Impact</span>
                      <span className="font-medium">$15,678</span>
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

export default AnalyticsDashboard;

