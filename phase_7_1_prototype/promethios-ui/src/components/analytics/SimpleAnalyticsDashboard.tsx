import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Chat,
  Schedule,
  ThumbUp,
  Warning,
  Speed,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

interface SimpleAnalyticsDashboardProps {
  selectedChatbot?: any;
  currentBotState?: any;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return '#10b981';
      case 'decrease': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'decrease': return <TrendingDown sx={{ fontSize: 16 }} />;
      default: return null;
    }
  };

  return (
    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: '#64748b' }}>{icon}</Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
          {value}
        </Typography>
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ color: getChangeColor(), display: 'flex', alignItems: 'center' }}>
              {getChangeIcon()}
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                {Math.abs(change)}%
              </Typography>
            </Box>
            {description && (
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                {description}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const SimpleAnalyticsDashboard: React.FC<SimpleAnalyticsDashboardProps> = ({
  selectedChatbot,
  currentBotState
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');

  // Mock analytics data - in real implementation, this would come from analytics service
  const analyticsData = {
    overview: {
      totalConversations: 1247,
      uniqueUsers: 892,
      avgResponseTime: 1.2,
      satisfactionScore: 4.3,
      totalMessages: 5634,
      activeUsers: 156
    },
    performance: {
      responseTime: [
        { time: '00:00', value: 1.1 },
        { time: '04:00', value: 0.9 },
        { time: '08:00', value: 1.4 },
        { time: '12:00', value: 1.8 },
        { time: '16:00', value: 1.3 },
        { time: '20:00', value: 1.0 }
      ],
      conversationVolume: [
        { time: '00:00', value: 45 },
        { time: '04:00', value: 23 },
        { time: '08:00', value: 89 },
        { time: '12:00', value: 156 },
        { time: '16:00', value: 134 },
        { time: '20:00', value: 78 }
      ]
    },
    topTopics: [
      { topic: 'Technical Support', count: 234, percentage: 28 },
      { topic: 'Product Information', count: 189, percentage: 23 },
      { topic: 'Billing Questions', count: 156, percentage: 19 },
      { topic: 'Feature Requests', count: 123, percentage: 15 },
      { topic: 'General Inquiry', count: 98, percentage: 12 }
    ],
    recentActivity: [
      { time: '2 min ago', event: 'New conversation started', user: 'User #1234' },
      { time: '5 min ago', event: 'High satisfaction rating received', user: 'User #5678' },
      { time: '8 min ago', event: 'Complex query resolved', user: 'User #9012' },
      { time: '12 min ago', event: 'Escalation to human agent', user: 'User #3456' },
      { time: '15 min ago', event: 'Knowledge base updated', user: 'System' }
    ]
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#1e293b', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AnalyticsIcon sx={{ color: '#3b82f6' }} />
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          Analytics Dashboard
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#64748b' }}>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '& .MuiSvgIcon-root': { color: '#64748b' }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1e293b',
                    border: '1px solid #334155',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': { bgcolor: '#334155' }
                    }
                  }
                }
              }}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Conversations"
            value={analyticsData.overview.totalConversations.toLocaleString()}
            change={12}
            changeType="increase"
            icon={<Chat />}
            description="vs last period"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Unique Users"
            value={analyticsData.overview.uniqueUsers.toLocaleString()}
            change={8}
            changeType="increase"
            icon={<People />}
            description="vs last period"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Avg Response Time"
            value={`${analyticsData.overview.avgResponseTime}s`}
            change={5}
            changeType="decrease"
            icon={<Speed />}
            description="improvement"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Satisfaction Score"
            value={`${analyticsData.overview.satisfactionScore}/5`}
            change={3}
            changeType="increase"
            icon={<ThumbUp />}
            description="user rating"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Messages"
            value={analyticsData.overview.totalMessages.toLocaleString()}
            change={15}
            changeType="increase"
            icon={<Chat />}
            description="vs last period"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Active Users"
            value={analyticsData.overview.activeUsers}
            change={2}
            changeType="increase"
            icon={<People />}
            description="currently online"
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Tabs */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#334155' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: '#64748b' },
              '& .Mui-selected': { color: '#3b82f6' },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
            }}
          >
            <Tab label="Performance" />
            <Tab label="Topics" />
            <Tab label="Activity" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Performance Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ color: '#64748b', mb: 2 }}>
                    Response Time Trend
                  </Typography>
                  <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 1, border: '1px solid #334155' }}>
                    {analyticsData.performance.responseTime.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {item.time}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {item.value}s
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ color: '#64748b', mb: 2 }}>
                    Conversation Volume
                  </Typography>
                  <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 1, border: '1px solid #334155' }}>
                    {analyticsData.performance.conversationVolume.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {item.time}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Top Conversation Topics
              </Typography>
              <TableContainer component={Paper} sx={{ bgcolor: '#0f172a', border: '1px solid #334155' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Topic</TableCell>
                      <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Count</TableCell>
                      <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Percentage</TableCell>
                      <TableCell sx={{ color: '#64748b', borderColor: '#334155' }}>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.topTopics.map((topic, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: 'white', borderColor: '#334155' }}>
                          {topic.topic}
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#334155' }}>
                          {topic.count}
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderColor: '#334155' }}>
                          {topic.percentage}%
                        </TableCell>
                        <TableCell sx={{ borderColor: '#334155' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={topic.percentage} 
                            sx={{ 
                              bgcolor: '#334155',
                              '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Recent Activity
              </Typography>
              <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 1, border: '1px solid #334155' }}>
                {analyticsData.recentActivity.map((activity, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {activity.event}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {activity.user}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {activity.time}
                      </Typography>
                    </Box>
                    {index < analyticsData.recentActivity.length - 1 && (
                      <Divider sx={{ borderColor: '#334155' }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleAnalyticsDashboard;

