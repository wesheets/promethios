/**
 * Promethios Chat Dashboard
 * 
 * Main dashboard for the Promethios Chat service showing key metrics,
 * governance status, chatbot performance, and quick access to features.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  BarChart as BarChartIcon,
  SmartToy as SmartToyIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ChatbotMetrics {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'training';
  trustScore: number;
  messagesHandled: number;
  resolutionRate: number;
  avgResponseTime: number;
  lastActive: string;
  governanceAlerts: number;
}

interface DashboardStats {
  totalChatbots: number;
  totalMessages: number;
  avgTrustScore: number;
  avgResolutionRate: number;
  activeConversations: number;
  governanceViolations: number;
  monthlyGrowth: number;
  costSavings: number;
}

const ChatDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalChatbots: 0,
    totalMessages: 0,
    avgTrustScore: 0,
    avgResolutionRate: 0,
    activeConversations: 0,
    governanceViolations: 0,
    monthlyGrowth: 0,
    costSavings: 0,
  });
  const [chatbots, setChatbots] = useState<ChatbotMetrics[]>([]);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data - in real implementation, this would come from API
      setDashboardStats({
        totalChatbots: 5,
        totalMessages: 12847,
        avgTrustScore: 88.4,
        avgResolutionRate: 73.2,
        activeConversations: 24,
        governanceViolations: 2,
        monthlyGrowth: 15.3,
        costSavings: 45600,
      });

      setChatbots([
        {
          id: '1',
          name: 'Customer Support Bot',
          status: 'active',
          trustScore: 92.1,
          messagesHandled: 5420,
          resolutionRate: 78.5,
          avgResponseTime: 1.2,
          lastActive: '2 minutes ago',
          governanceAlerts: 0,
        },
        {
          id: '2',
          name: 'Sales Assistant',
          status: 'active',
          trustScore: 89.7,
          messagesHandled: 3210,
          resolutionRate: 71.3,
          avgResponseTime: 0.8,
          lastActive: '5 minutes ago',
          governanceAlerts: 1,
        },
        {
          id: '3',
          name: 'Technical Support',
          status: 'training',
          trustScore: 85.2,
          messagesHandled: 2847,
          resolutionRate: 68.9,
          avgResponseTime: 2.1,
          lastActive: '1 hour ago',
          governanceAlerts: 0,
        },
        {
          id: '4',
          name: 'HR Assistant',
          status: 'paused',
          trustScore: 91.3,
          messagesHandled: 1156,
          resolutionRate: 82.1,
          avgResponseTime: 1.5,
          lastActive: '2 days ago',
          governanceAlerts: 1,
        },
        {
          id: '5',
          name: 'Product Guide',
          status: 'active',
          trustScore: 87.8,
          messagesHandled: 214,
          resolutionRate: 65.7,
          avgResponseTime: 1.8,
          lastActive: '30 minutes ago',
          governanceAlerts: 0,
        },
      ]);

      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'training': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayArrowIcon />;
      case 'paused': return <PauseIcon />;
      case 'training': return <CircularProgress size={16} />;
      default: return <QuestionAnswerIcon />;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh',
          backgroundColor: '#1a202c',
          color: 'white'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#4299e1', mb: 2 }} />
          <Typography variant="h6">Loading Promethios Chat Dashboard...</Typography>
          <Typography variant="body2" sx={{ color: 'gray', mt: 1 }}>
            Gathering governance metrics and chatbot performance data
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      backgroundColor: '#1a202c', 
      minHeight: '100vh', 
      color: 'white',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Promethios Chat Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>
              Governed AI chatbots with complete transparency and control
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/ui/chat/setup/quick-start')}
            sx={{
              backgroundColor: '#4299e1',
              '&:hover': { backgroundColor: '#3182ce' },
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            Create New Chatbot
          </Button>
        </Box>

        {/* Quick Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4299e1' }}>
                      {dashboardStats.totalChatbots}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'gray' }}>
                      Active Chatbots
                    </Typography>
                  </Box>
                  <SmartToyIcon sx={{ fontSize: 40, color: '#4299e1' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#48bb78' }}>
                      {dashboardStats.avgTrustScore}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'gray' }}>
                      Avg Trust Score
                    </Typography>
                  </Box>
                  <ShieldIcon sx={{ fontSize: 40, color: '#48bb78' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed8936' }}>
                      {dashboardStats.totalMessages.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'gray' }}>
                      Messages Handled
                    </Typography>
                  </Box>
                  <QuestionAnswerIcon sx={{ fontSize: 40, color: '#ed8936' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9f7aea' }}>
                      {dashboardStats.avgResolutionRate}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'gray' }}>
                      Resolution Rate
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: '#9f7aea' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Governance Alerts */}
      {dashboardStats.governanceViolations > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3, 
            backgroundColor: '#744210', 
            color: 'white',
            '& .MuiAlert-icon': { color: '#ed8936' }
          }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => navigate('/ui/governance/violations')}
            >
              VIEW DETAILS
            </Button>
          }
        >
          {dashboardStats.governanceViolations} governance violation(s) require attention
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Chatbot Performance */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Chatbot Performance
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/ui/chat/chatbots')}
                  sx={{ color: '#4299e1' }}
                >
                  View All
                </Button>
              </Box>

              <List>
                {chatbots.map((chatbot, index) => (
                  <React.Fragment key={chatbot.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ 
                          backgroundColor: getStatusColor(chatbot.status) === 'success' ? '#48bb78' : 
                                          getStatusColor(chatbot.status) === 'warning' ? '#ed8936' : '#4299e1',
                          width: 40,
                          height: 40
                        }}>
                          {getStatusIcon(chatbot.status)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {chatbot.name}
                            </Typography>
                            <Chip
                              label={chatbot.status}
                              size="small"
                              color={getStatusColor(chatbot.status) as any}
                              sx={{ textTransform: 'capitalize' }}
                            />
                            {chatbot.governanceAlerts > 0 && (
                              <Badge badgeContent={chatbot.governanceAlerts} color="error">
                                <WarningIcon sx={{ fontSize: 16, color: '#f56565' }} />
                              </Badge>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={3}>
                                <Tooltip title="Trust Score - Governance confidence in responses">
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'gray' }}>
                                      Trust Score
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={chatbot.trustScore}
                                        sx={{
                                          flex: 1,
                                          height: 6,
                                          borderRadius: 3,
                                          backgroundColor: '#4a5568',
                                          '& .MuiLinearProgress-bar': {
                                            backgroundColor: getTrustScoreColor(chatbot.trustScore) === 'success' ? '#48bb78' :
                                                            getTrustScoreColor(chatbot.trustScore) === 'warning' ? '#ed8936' : '#f56565'
                                          }
                                        }}
                                      />
                                      <Typography variant="caption" sx={{ color: 'white', minWidth: 35 }}>
                                        {chatbot.trustScore}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Tooltip>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" sx={{ color: 'gray' }}>
                                  Messages
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                  {chatbot.messagesHandled.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" sx={{ color: 'gray' }}>
                                  Resolution
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                  {chatbot.resolutionRate}%
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" sx={{ color: 'gray' }}>
                                  Response Time
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                  {chatbot.avgResponseTime}s
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Analytics">
                          <IconButton 
                            size="small" 
                            sx={{ color: '#4299e1' }}
                            onClick={() => navigate(`/ui/chat/analytics/performance?chatbot=${chatbot.id}`)}
                          >
                            <BarChartIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Chatbot">
                          <IconButton 
                            size="small" 
                            sx={{ color: '#4299e1' }}
                            onClick={() => navigate(`/ui/chat/chatbots/${chatbot.id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Live Chat">
                          <IconButton 
                            size="small" 
                            sx={{ color: '#4299e1' }}
                            onClick={() => navigate(`/ui/chat/chatbots/${chatbot.id}/live`)}
                          >
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    {index < chatbots.length - 1 && <Divider sx={{ backgroundColor: '#4a5568' }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Insights */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/ui/chat/setup/quick-start')}
                      sx={{ 
                        borderColor: '#4299e1', 
                        color: '#4299e1',
                        '&:hover': { borderColor: '#3182ce', backgroundColor: 'rgba(66, 153, 225, 0.1)' }
                      }}
                    >
                      Create New Chatbot
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate('/ui/chat/analytics')}
                      sx={{ 
                        borderColor: '#48bb78', 
                        color: '#48bb78',
                        '&:hover': { borderColor: '#38a169', backgroundColor: 'rgba(72, 187, 120, 0.1)' }
                      }}
                    >
                      View Analytics
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => navigate('/ui/chat/integrations')}
                      sx={{ 
                        borderColor: '#ed8936', 
                        color: '#ed8936',
                        '&:hover': { borderColor: '#dd6b20', backgroundColor: 'rgba(237, 137, 54, 0.1)' }
                      }}
                    >
                      Manage Integrations
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Governance Insights */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Governance Insights
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircleIcon sx={{ color: '#48bb78' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          High Trust Score
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'gray' }}>
                          Average 88.4% across all chatbots
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <SecurityIcon sx={{ color: '#4299e1' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Compliance Ready
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'gray' }}>
                          All chatbots meet governance standards
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TrendingUpIcon sx={{ color: '#9f7aea' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Growing Performance
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'gray' }}>
                          +15.3% improvement this month
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Cost Savings */}
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Cost Savings
                  </Typography>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#48bb78' }}>
                      ${dashboardStats.costSavings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'gray' }}>
                      Saved this month through automation
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'gray', mt: 1, display: 'block' }}>
                      Equivalent to ~15 FTE hours
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatDashboard;

