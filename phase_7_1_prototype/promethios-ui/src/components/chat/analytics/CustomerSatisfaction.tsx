/**
 * Customer Satisfaction Component
 * 
 * Comprehensive customer satisfaction analytics dashboard including
 * CSAT scores, NPS, feedback analysis, and sentiment tracking.
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
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  Download,
  RefreshCw,
  Filter,
  Smile,
  Frown,
  Meh,
  Award,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface SatisfactionMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'average' | 'poor';
  target?: number;
}

interface SatisfactionData {
  timestamp: string;
  csat: number;
  nps: number;
  sentiment: number;
  responseRate: number;
  avgRating: number;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  timestamp: string;
  resolved: boolean;
}

const CustomerSatisfaction: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<SatisfactionMetric[]>([]);
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionData[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const mockMetrics: SatisfactionMetric[] = [
    {
      id: 'csat_score',
      name: 'CSAT Score',
      value: 4.6,
      unit: '/5',
      change: 8.2,
      trend: 'up',
      status: 'excellent',
      target: 4.5
    },
    {
      id: 'nps_score',
      name: 'Net Promoter Score',
      value: 67,
      unit: '',
      change: 12.5,
      trend: 'up',
      status: 'good',
      target: 60
    },
    {
      id: 'response_rate',
      name: 'Response Rate',
      value: 78.3,
      unit: '%',
      change: 5.7,
      trend: 'up',
      status: 'good',
      target: 75.0
    },
    {
      id: 'avg_sentiment',
      name: 'Avg Sentiment',
      value: 0.72,
      unit: '',
      change: 15.2,
      trend: 'up',
      status: 'excellent',
      target: 0.6
    },
    {
      id: 'resolution_satisfaction',
      name: 'Resolution Satisfaction',
      value: 89.4,
      unit: '%',
      change: 3.8,
      trend: 'up',
      status: 'excellent',
      target: 85.0
    },
    {
      id: 'recommendation_rate',
      name: 'Recommendation Rate',
      value: 82.1,
      unit: '%',
      change: 7.3,
      trend: 'up',
      status: 'excellent',
      target: 80.0
    }
  ];

  const mockSatisfactionData: SatisfactionData[] = [
    { timestamp: '2024-01-01', csat: 4.2, nps: 58, sentiment: 0.65, responseRate: 72.1, avgRating: 4.1 },
    { timestamp: '2024-01-05', csat: 4.3, nps: 61, sentiment: 0.68, responseRate: 74.3, avgRating: 4.2 },
    { timestamp: '2024-01-10', csat: 4.4, nps: 63, sentiment: 0.69, responseRate: 75.8, avgRating: 4.3 },
    { timestamp: '2024-01-15', csat: 4.5, nps: 65, sentiment: 0.71, responseRate: 76.9, avgRating: 4.4 },
    { timestamp: '2024-01-20', csat: 4.6, nps: 67, sentiment: 0.72, responseRate: 78.3, avgRating: 4.6 }
  ];

  const mockFeedbackItems: FeedbackItem[] = [
    {
      id: 'feedback-1',
      rating: 5,
      comment: 'Excellent service! The chatbot was very helpful and resolved my issue quickly.',
      sentiment: 'positive',
      category: 'Support Quality',
      timestamp: '2024-01-20T14:30:00Z',
      resolved: true
    },
    {
      id: 'feedback-2',
      rating: 4,
      comment: 'Good experience overall, but the response time could be improved.',
      sentiment: 'positive',
      category: 'Response Time',
      timestamp: '2024-01-20T13:15:00Z',
      resolved: false
    },
    {
      id: 'feedback-3',
      rating: 2,
      comment: 'The chatbot didn\'t understand my question and kept giving irrelevant answers.',
      sentiment: 'negative',
      category: 'Understanding',
      timestamp: '2024-01-20T11:45:00Z',
      resolved: false
    },
    {
      id: 'feedback-4',
      rating: 5,
      comment: 'Amazing! Got exactly what I needed without any hassle.',
      sentiment: 'positive',
      category: 'Effectiveness',
      timestamp: '2024-01-20T10:20:00Z',
      resolved: true
    },
    {
      id: 'feedback-5',
      rating: 3,
      comment: 'It was okay, but I had to repeat my question multiple times.',
      sentiment: 'neutral',
      category: 'Understanding',
      timestamp: '2024-01-20T09:30:00Z',
      resolved: false
    }
  ];

  const ratingDistribution = [
    { rating: '5 Stars', count: 1247, percentage: 42.3 },
    { rating: '4 Stars', count: 892, percentage: 30.2 },
    { rating: '3 Stars', count: 456, percentage: 15.4 },
    { rating: '2 Stars', count: 234, percentage: 7.9 },
    { rating: '1 Star', count: 123, percentage: 4.2 }
  ];

  const sentimentDistribution = [
    { name: 'Positive', value: 68.4, color: '#10B981' },
    { name: 'Neutral', value: 23.7, color: '#F59E0B' },
    { name: 'Negative', value: 7.9, color: '#EF4444' }
  ];

  const feedbackCategories = [
    { category: 'Support Quality', count: 456, avgRating: 4.7, trend: 12.3 },
    { category: 'Response Time', count: 342, avgRating: 4.2, trend: -5.2 },
    { category: 'Understanding', count: 289, avgRating: 3.8, trend: 8.7 },
    { category: 'Effectiveness', count: 234, avgRating: 4.5, trend: 15.1 },
    { category: 'User Experience', count: 198, avgRating: 4.3, trend: 6.8 }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(mockMetrics);
      setSatisfactionData(mockSatisfactionData);
      setFeedbackItems(mockFeedbackItems);
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-4 w-4 text-green-500" />;
      case 'neutral':
        return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'negative':
        return <Frown className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
      />
    ));
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  const exportData = () => {
    console.log('Exporting customer satisfaction data...');
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
        <span className="ml-2 text-lg text-white">Loading customer satisfaction data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Customer Satisfaction</h1>
          <p className="text-gray-300 mt-2">
            Monitor customer satisfaction scores, feedback, and sentiment analysis across all interactions.
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
                  {metric.id === 'csat_score' && <Star className="h-4 w-4 text-yellow-600" />}
                  {metric.id === 'nps_score' && <Award className="h-4 w-4 text-blue-600" />}
                  {metric.id === 'response_rate' && <Users className="h-4 w-4 text-green-600" />}
                  {metric.id === 'avg_sentiment' && <Heart className="h-4 w-4 text-red-600" />}
                  {metric.id === 'resolution_satisfaction' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                  {metric.id === 'recommendation_rate' && <Target className="h-4 w-4 text-purple-600" />}
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
            Satisfaction Trends
          </TabsTrigger>
          <TabsTrigger value="ratings" className="text-white data-[state=active]:bg-gray-700">
            Rating Distribution
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="text-white data-[state=active]:bg-gray-700">
            Sentiment Analysis
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-white data-[state=active]:bg-gray-700">
            Recent Feedback
          </TabsTrigger>
        </TabsList>

        {/* Satisfaction Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">CSAT & NPS Trends</CardTitle>
                <CardDescription className="text-gray-300">
                  Customer satisfaction and Net Promoter Score over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={satisfactionData}>
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
                      dataKey="csat" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="CSAT Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nps" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="NPS Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Sentiment & Response Rate</CardTitle>
                <CardDescription className="text-gray-300">
                  Average sentiment score and survey response rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={satisfactionData}>
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
                      dataKey="sentiment" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Sentiment Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="responseRate" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="Response Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Feedback Categories Performance</CardTitle>
                <CardDescription className="text-gray-300">
                  Average ratings and trends by feedback category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex">
                          {getRatingStars(Math.round(category.avgRating))}
                        </div>
                        <div>
                          <p className="text-white font-medium">{category.category}</p>
                          <p className="text-gray-400 text-sm">{category.count} responses</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold">{category.avgRating}/5</span>
                        <div className="flex items-center space-x-1">
                          {category.trend >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${category.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {category.trend >= 0 ? '+' : ''}{category.trend}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rating Distribution Tab */}
        <TabsContent value="ratings" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Rating Distribution</CardTitle>
              <CardDescription className="text-gray-300">
                Distribution of customer ratings across all feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="rating" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }} 
                  />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Sentiment Distribution</CardTitle>
                <CardDescription className="text-gray-300">
                  Overall sentiment breakdown of customer feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sentimentDistribution.map((entry, index) => (
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
                <CardTitle className="text-white">Sentiment Trends</CardTitle>
                <CardDescription className="text-gray-300">
                  Sentiment score changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={satisfactionData}>
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
                      dataKey="sentiment" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4">
            {feedbackItems.map((feedback) => (
              <Card key={feedback.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex">
                        {getRatingStars(feedback.rating)}
                      </div>
                      <Badge variant="outline" className="text-white border-gray-600">
                        {feedback.category}
                      </Badge>
                      {getSentimentIcon(feedback.sentiment)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </span>
                      {feedback.resolved ? (
                        <Badge variant="default" className="bg-green-600">Resolved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{feedback.comment}</p>
                  <div className="flex justify-end mt-3">
                    <Button variant="outline" size="sm" className="text-white border-gray-600">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Respond
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerSatisfaction;

