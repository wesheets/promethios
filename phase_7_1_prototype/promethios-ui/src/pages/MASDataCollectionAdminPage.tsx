/**
 * MAS Data Collection Admin Page
 * 
 * Admin dashboard for monitoring data collection, governance insights harvesting,
 * and community LLM building progress from multi-agent conversations.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Storage as DataIcon,
  Psychology as GovernanceIcon,
  SmartToy as LLMIcon,
  Analytics as AnalyticsIcon,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  Upload,
  Settings,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Error,
  Info,
  FilterList,
  Search,
  DateRange,
  Group,
  Chat,
  Share,
  Security,
  VerifiedUser,
  Assessment,
  Timeline,
  CloudUpload,
  DataUsage,
  Memory,
  Speed,
  Quality,
  School,
  Community,
  Public,
  Lock,
  Unlock,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataCollectionMetrics {
  totalConversations: number;
  totalMessages: number;
  totalAuditLogShares: number;
  totalGovernanceInsights: number;
  qualityFilteredData: number;
  communityLLMContributions: number;
  dataGrowthRate: number;
  averageQualityScore: number;
  harvestingEfficiency: number;
  storageUsed: number;
  storageCapacity: number;
}

interface GovernanceInsightStats {
  policyCompliance: number;
  trustBuilding: number;
  emotionalIntelligence: number;
  qualityAssurance: number;
  ethicalReasoning: number;
  autonomousCognition: number;
  crossAgentLearning: number;
}

interface CommunityLLMProgress {
  totalTrainingData: number;
  qualityThreshold: number;
  governanceSpecialization: number;
  crossModelLearning: number;
  communityContributions: number;
  estimatedCompletionDate: string;
  currentCapabilities: string[];
  nextMilestones: string[];
}

interface ConversationDataPoint {
  date: string;
  conversations: number;
  messages: number;
  auditShares: number;
  qualityScore: number;
  governanceInsights: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MASDataCollectionAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataExportOpen, setDataExportOpen] = useState(false);

  // Mock data - in real implementation, this would come from APIs
  const [metrics, setMetrics] = useState<DataCollectionMetrics>({
    totalConversations: 15847,
    totalMessages: 234891,
    totalAuditLogShares: 8934,
    totalGovernanceInsights: 45672,
    qualityFilteredData: 187234,
    communityLLMContributions: 156789,
    dataGrowthRate: 23.5,
    averageQualityScore: 8.7,
    harvestingEfficiency: 94.2,
    storageUsed: 2.3, // TB
    storageCapacity: 10.0, // TB
  });

  const [governanceStats, setGovernanceStats] = useState<GovernanceInsightStats>({
    policyCompliance: 34.2,
    trustBuilding: 28.7,
    emotionalIntelligence: 15.3,
    qualityAssurance: 12.8,
    ethicalReasoning: 5.4,
    autonomousCognition: 2.8,
    crossAgentLearning: 0.8,
  });

  const [llmProgress, setLLMProgress] = useState<CommunityLLMProgress>({
    totalTrainingData: 1.2, // TB
    qualityThreshold: 7.5,
    governanceSpecialization: 67.3,
    crossModelLearning: 45.8,
    communityContributions: 89.2,
    estimatedCompletionDate: '2024-12-15',
    currentCapabilities: [
      'Policy Compliance Reasoning',
      'Trust-based Decision Making',
      'Cross-agent Collaboration',
      'Governance Q&A Generation',
      'Audit Log Analysis'
    ],
    nextMilestones: [
      'Advanced Ethical Reasoning (Q4 2024)',
      'Multi-language Governance (Q1 2025)',
      'Enterprise Deployment (Q2 2025)',
      'Community Ownership Transfer (Q3 2025)'
    ]
  });

  const [conversationData, setConversationData] = useState<ConversationDataPoint[]>([
    { date: '2024-01', conversations: 1200, messages: 18500, auditShares: 450, qualityScore: 8.2, governanceInsights: 2100 },
    { date: '2024-02', conversations: 1450, messages: 22100, auditShares: 580, qualityScore: 8.4, governanceInsights: 2650 },
    { date: '2024-03', conversations: 1680, messages: 25800, auditShares: 720, qualityScore: 8.5, governanceInsights: 3200 },
    { date: '2024-04', conversations: 1920, messages: 29200, auditShares: 890, qualityScore: 8.6, governanceInsights: 3800 },
    { date: '2024-05', conversations: 2150, messages: 32800, auditShares: 1050, qualityScore: 8.7, governanceInsights: 4500 },
    { date: '2024-06', conversations: 2380, messages: 36500, auditShares: 1200, qualityScore: 8.8, governanceInsights: 5200 },
    { date: '2024-07', conversations: 2650, messages: 40800, auditShares: 1380, qualityScore: 8.9, governanceInsights: 6100 },
  ]);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getQualityColor = (score: number) => {
    if (score >= 8.5) return '#10b981';
    if (score >= 7.5) return '#f59e0b';
    return '#ef4444';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return '#10b981';
    if (efficiency >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const COLORS = ['#3182ce', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          MAS Data Collection Admin
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#a0aec0' }}>
          Monitor governance insights harvesting and community LLM building progress
        </Typography>
      </Box>

      {/* Alert for Community LLM Progress */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3, 
          backgroundColor: '#1e3a8a', 
          color: 'white',
          '& .MuiAlert-icon': { color: '#60a5fa' }
        }}
      >
        <Typography variant="body2">
          <strong>Community LLM Progress:</strong> {llmProgress.governanceSpecialization}% governance specialization complete. 
          Estimated completion: {llmProgress.estimatedCompletionDate}
        </Typography>
      </Alert>

      {/* Main Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Total Data Collected */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#3182ce', mr: 2 }}>
                  <DataIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Data Collected</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Total Conversations</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.totalConversations.toLocaleString()}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.totalMessages.toLocaleString()} Messages`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
                <Chip 
                  label={`+${metrics.dataGrowthRate}%`} 
                  size="small" 
                  sx={{ backgroundColor: '#10b981', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(metrics.storageUsed / metrics.storageCapacity) * 100}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#3182ce' }
                }}
              />
              <Typography variant="caption" sx={{ color: '#a0aec0', mt: 1, display: 'block' }}>
                Storage: {metrics.storageUsed}TB / {metrics.storageCapacity}TB
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Governance Insights */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#10b981', mr: 2 }}>
                  <GovernanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Governance Insights</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Quality Filtered</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.totalGovernanceInsights.toLocaleString()}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.totalAuditLogShares.toLocaleString()} Audit Shares`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
                <Chip 
                  label={`${metrics.averageQualityScore}/10 Avg`} 
                  size="small" 
                  sx={{ backgroundColor: getQualityColor(metrics.averageQualityScore), color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.harvestingEfficiency}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                }}
              />
              <Typography variant="caption" sx={{ color: '#a0aec0', mt: 1, display: 'block' }}>
                Harvesting Efficiency: {metrics.harvestingEfficiency}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Community LLM Progress */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#8b5cf6', mr: 2 }}>
                  <LLMIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Community LLM</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Training Progress</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {llmProgress.governanceSpecialization}%
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${llmProgress.totalTrainingData}TB Data`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
                <Chip 
                  label={`${llmProgress.communityContributions}% Community`} 
                  size="small" 
                  sx={{ backgroundColor: '#ec4899', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={llmProgress.governanceSpecialization}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' }
                }}
              />
              <Typography variant="caption" sx={{ color: '#a0aec0', mt: 1, display: 'block' }}>
                Est. Completion: {llmProgress.estimatedCompletionDate}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Performance */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ backgroundColor: '#f59e0b', mr: 2 }}>
                  <AnalyticsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>Performance</Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Collection Efficiency</Typography>
                </Box>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
                {metrics.harvestingEfficiency}%
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`${metrics.qualityFilteredData.toLocaleString()} Filtered`} 
                  size="small" 
                  sx={{ backgroundColor: '#4a5568', color: 'white' }}
                />
                <Chip 
                  label="Real-time" 
                  size="small" 
                  sx={{ backgroundColor: '#10b981', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.harvestingEfficiency}
                sx={{ 
                  backgroundColor: '#4a5568',
                  '& .MuiLinearProgress-bar': { backgroundColor: getEfficiencyColor(metrics.harvestingEfficiency) }
                }}
              />
              <Typography variant="caption" sx={{ color: '#a0aec0', mt: 1, display: 'block' }}>
                Quality Threshold: {llmProgress.qualityThreshold}/10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Detailed Views */}
      <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: '#a0aec0' },
              '& .Mui-selected': { color: '#3182ce' },
              '& .MuiTabs-indicator': { backgroundColor: '#3182ce' }
            }}
          >
            <Tab label="Data Collection Trends" />
            <Tab label="Governance Insights" />
            <Tab label="Community LLM Progress" />
            <Tab label="Quality Metrics" />
            <Tab label="System Settings" />
          </Tabs>
        </Box>

        {/* Data Collection Trends Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Data Collection Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={conversationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis dataKey="date" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="conversations" stackId="1" stroke="#3182ce" fill="#3182ce" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="auditShares" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="governanceInsights" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Collection Statistics
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Daily Average</Typography>
                  <Typography variant="h5" sx={{ color: 'white' }}>
                    {Math.round(metrics.totalConversations / 30).toLocaleString()} conversations
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Growth Rate</Typography>
                  <Typography variant="h5" sx={{ color: '#10b981' }}>
                    +{metrics.dataGrowthRate}% monthly
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Quality Filter Rate</Typography>
                  <Typography variant="h5" sx={{ color: '#f59e0b' }}>
                    {Math.round((metrics.qualityFilteredData / metrics.totalMessages) * 100)}%
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Governance Insights Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Governance Insight Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Policy Compliance', value: governanceStats.policyCompliance },
                      { name: 'Trust Building', value: governanceStats.trustBuilding },
                      { name: 'Emotional Intelligence', value: governanceStats.emotionalIntelligence },
                      { name: 'Quality Assurance', value: governanceStats.qualityAssurance },
                      { name: 'Ethical Reasoning', value: governanceStats.ethicalReasoning },
                      { name: 'Autonomous Cognition', value: governanceStats.autonomousCognition },
                      { name: 'Cross-Agent Learning', value: governanceStats.crossAgentLearning },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      color: 'white'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Top Governance Insights
              </Typography>
              <List>
                <ListItem sx={{ backgroundColor: '#1a202c', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    <Security sx={{ color: '#3182ce' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Policy Compliance Reasoning"
                    secondary={`${governanceStats.policyCompliance}% of total insights`}
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: '#a0aec0' }}
                  />
                  <Chip label="High Value" size="small" sx={{ backgroundColor: '#10b981', color: 'white' }} />
                </ListItem>
                <ListItem sx={{ backgroundColor: '#1a202c', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    <VerifiedUser sx={{ color: '#10b981' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Trust Building Strategies"
                    secondary={`${governanceStats.trustBuilding}% of total insights`}
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: '#a0aec0' }}
                  />
                  <Chip label="High Value" size="small" sx={{ backgroundColor: '#10b981', color: 'white' }} />
                </ListItem>
                <ListItem sx={{ backgroundColor: '#1a202c', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    <Psychology sx={{ color: '#8b5cf6' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Emotional Intelligence Application"
                    secondary={`${governanceStats.emotionalIntelligence}% of total insights`}
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: '#a0aec0' }}
                  />
                  <Chip label="Medium Value" size="small" sx={{ backgroundColor: '#f59e0b', color: 'white' }} />
                </ListItem>
                <ListItem sx={{ backgroundColor: '#1a202c', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    <Assessment sx={{ color: '#f59e0b' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Quality Assurance Processes"
                    secondary={`${governanceStats.qualityAssurance}% of total insights`}
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: '#a0aec0' }}
                  />
                  <Chip label="Medium Value" size="small" sx={{ backgroundColor: '#f59e0b', color: 'white' }} />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Community LLM Progress Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Community LLM Development Progress
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      Governance Specialization
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      {llmProgress.governanceSpecialization}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={llmProgress.governanceSpecialization}
                    sx={{ 
                      height: 8,
                      backgroundColor: '#4a5568',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' }
                    }}
                  />
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      Cross-Model Learning
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      {llmProgress.crossModelLearning}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={llmProgress.crossModelLearning}
                    sx={{ 
                      height: 8,
                      backgroundColor: '#4a5568',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#3182ce' }
                    }}
                  />
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      Community Contributions
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      {llmProgress.communityContributions}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={llmProgress.communityContributions}
                    sx={{ 
                      height: 8,
                      backgroundColor: '#4a5568',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                    }}
                  />
                </Box>
              </Stack>
              
              <Typography variant="h6" sx={{ color: 'white', mt: 4, mb: 2 }}>
                Current Capabilities
              </Typography>
              <Grid container spacing={1}>
                {llmProgress.currentCapabilities.map((capability, index) => (
                  <Grid item key={index}>
                    <Chip 
                      label={capability}
                      sx={{ backgroundColor: '#10b981', color: 'white', mb: 1 }}
                      icon={<CheckCircle sx={{ color: 'white !important' }} />}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Next Milestones
              </Typography>
              <Stack spacing={2}>
                {llmProgress.nextMilestones.map((milestone, index) => (
                  <Paper key={index} sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Timeline sx={{ color: '#f59e0b', mr: 1 }} />
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {milestone}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
              
              <Typography variant="h6" sx={{ color: 'white', mt: 4, mb: 2 }}>
                Community Impact
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                  Total Training Data
                </Typography>
                <Typography variant="h4" sx={{ color: '#8b5cf6', mb: 2 }}>
                  {llmProgress.totalTrainingData}TB
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Contributed by {Math.round(llmProgress.communityContributions)}% community members
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Quality Metrics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Quality Score Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={conversationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis dataKey="date" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" domain={[7, 10]} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="qualityScore" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Quality Thresholds
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Minimum Quality Score</Typography>
                  <Typography variant="h4" sx={{ color: '#f59e0b' }}>
                    {llmProgress.qualityThreshold}/10
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Current Average</Typography>
                  <Typography variant="h4" sx={{ color: getQualityColor(metrics.averageQualityScore) }}>
                    {metrics.averageQualityScore}/10
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>Data Filtered</Typography>
                  <Typography variant="h4" sx={{ color: '#3182ce' }}>
                    {Math.round((metrics.qualityFilteredData / metrics.totalMessages) * 100)}%
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Settings Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Data Collection Settings
              </Typography>
              <Stack spacing={3}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable Real-time Data Collection"
                  sx={{ color: 'white' }}
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Quality Filtering Enabled"
                  sx={{ color: 'white' }}
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Governance Insights Harvesting"
                  sx={{ color: 'white' }}
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Community LLM Contributions"
                  sx={{ color: 'white' }}
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Anonymous Data Collection"
                  sx={{ color: 'white' }}
                />
                
                <Box>
                  <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                    Quality Score Threshold
                  </Typography>
                  <TextField
                    type="number"
                    defaultValue={llmProgress.qualityThreshold}
                    inputProps={{ min: 1, max: 10, step: 0.1 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: '#4a5568' },
                        '&:hover fieldset': { borderColor: '#3182ce' },
                        '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                      }
                    }}
                  />
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Data Export & Management
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => setDataExportOpen(true)}
                  sx={{ 
                    color: '#3182ce', 
                    borderColor: '#3182ce',
                    '&:hover': { borderColor: '#2c5aa0', backgroundColor: 'rgba(49, 130, 206, 0.1)' }
                  }}
                >
                  Export Collected Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{ 
                    color: '#10b981', 
                    borderColor: '#10b981',
                    '&:hover': { borderColor: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                  }}
                >
                  Backup to Cloud
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  sx={{ 
                    color: '#f59e0b', 
                    borderColor: '#f59e0b',
                    '&:hover': { borderColor: '#d97706', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
                  }}
                >
                  Refresh Data Collection
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => setSettingsOpen(true)}
                  sx={{ 
                    color: '#8b5cf6', 
                    borderColor: '#8b5cf6',
                    '&:hover': { borderColor: '#7c3aed', backgroundColor: 'rgba(139, 92, 246, 0.1)' }
                  }}
                >
                  Advanced Settings
                </Button>
              </Stack>
              
              <Typography variant="h6" sx={{ color: 'white', mt: 4, mb: 2 }}>
                Storage Management
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Storage Usage
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    {metrics.storageUsed}TB / {metrics.storageCapacity}TB
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(metrics.storageUsed / metrics.storageCapacity) * 100}
                  sx={{ 
                    height: 8,
                    backgroundColor: '#4a5568',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#3182ce' }
                  }}
                />
                <Typography variant="caption" sx={{ color: '#a0aec0', mt: 1, display: 'block' }}>
                  {Math.round(((metrics.storageCapacity - metrics.storageUsed) / metrics.storageCapacity) * 100)}% available
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Data Export Dialog */}
      <Dialog 
        open={dataExportOpen} 
        onClose={() => setDataExportOpen(false)}
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Export Data Collection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: '#a0aec0' }}>
            Select the data types and date range for export.
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Conversation Data"
              sx={{ color: 'white' }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Governance Insights"
              sx={{ color: 'white' }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Audit Log Shares"
              sx={{ color: 'white' }}
            />
            <FormControlLabel
              control={<Switch />}
              label="Quality Metrics"
              sx={{ color: 'white' }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#a0aec0' }}>Export Format</InputLabel>
              <Select
                defaultValue="json"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
                }}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="xlsx">Excel</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDataExportOpen(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button onClick={() => setDataExportOpen(false)} sx={{ color: '#3182ce' }}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Advanced Data Collection Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <TextField
              label="Collection Batch Size"
              type="number"
              defaultValue={1000}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#3182ce' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
            <TextField
              label="Sync Interval (seconds)"
              type="number"
              defaultValue={30}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#3182ce' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                },
                '& .MuiInputLabel-root': { color: '#a0aec0' }
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#a0aec0' }}>Storage Backend</InputLabel>
              <Select
                defaultValue="firebase"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
                }}
              >
                <MenuItem value="firebase">Firebase</MenuItem>
                <MenuItem value="local">Local Storage</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button onClick={() => setSettingsOpen(false)} sx={{ color: '#3182ce' }}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MASDataCollectionAdminPage;

