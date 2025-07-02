/**
 * Enterprise Veritas Dashboard
 * 
 * Comprehensive dashboard for Veritas 2.0 Enterprise features including:
 * - Session management and collaboration
 * - Advanced analytics and reporting
 * - Real-time notifications and updates
 * - Compliance monitoring and audit trails
 * - Governance configuration and settings
 * - User-scoped verification history
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { veritasEnterpriseExtension } from '../veritas/enterprise/VeritasEnterpriseExtension';
import type {
  EnterpriseVerificationSession,
  VeritasAnalytics,
  CollaborationRequest,
  VeritasNotification
} from '../veritas/enterprise/VeritasEnterpriseExtension';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondary,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  CloudDownload as CloudDownloadIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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
      id={`veritas-tabpanel-${index}`}
      aria-labelledby={`veritas-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnterpriseVeritasDashboard: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();

  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [sessions, setSessions] = useState<EnterpriseVerificationSession[]>([]);
  const [analytics, setAnalytics] = useState<VeritasAnalytics | null>(null);
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [notifications, setNotifications] = useState<VeritasNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createSessionDialog, setCreateSessionDialog] = useState(false);
  const [collaborateDialog, setCollaborateDialog] = useState(false);
  const [governanceSettingsDialog, setGovernanceSettingsDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<EnterpriseVerificationSession | null>(null);

  // Form states
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [newSessionCompliance, setNewSessionCompliance] = useState<'basic' | 'enhanced' | 'enterprise'>('basic');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorPermissions, setCollaboratorPermissions] = useState<string[]>(['read']);

  // Governance settings form states
  const [governanceSettings, setGovernanceSettings] = useState({
    complianceLevel: 'basic' as 'basic' | 'enhanced' | 'enterprise',
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    policyFramework: 'promethios_standard',
    auditRequirements: [] as string[],
    verificationThresholds: {
      truthProbability: 0.7,
      confidenceLevel: 0.8,
      hallucination: 0.3
    }
  });

  // Notification state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initialize extension and load data
  useEffect(() => {
    const initializeVeritas = async () => {
      if (!currentUser) {
        setError('User authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Initialize enterprise extension
        const initialized = await veritasEnterpriseExtension.initialize({}, currentUser);
        if (!initialized) {
          throw new Error('Failed to initialize Veritas Enterprise');
        }

        // Load initial data
        await loadAllData();

        // Set up real-time notifications
        const unsubscribe = veritasEnterpriseExtension.onNotification((notification) => {
          setNotifications(prev => [notification, ...prev]);
          
          // Show snackbar for important notifications
          if (notification.severity === 'error' || notification.severity === 'warning') {
            setSnackbar({
              open: true,
              message: notification.message,
              severity: notification.severity
            });
          }
        });

        // Cleanup function
        return () => {
          unsubscribe();
          veritasEnterpriseExtension.cleanup();
        };

      } catch (error) {
        console.error('Failed to initialize Veritas Enterprise:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeVeritas();
  }, [currentUser]);

  // Load all dashboard data
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [sessionsData, analyticsData, requestsData, notificationsData] = await Promise.all([
        veritasEnterpriseExtension.getUserSessions(currentUser),
        veritasEnterpriseExtension.getUserAnalytics(currentUser, '30d'),
        veritasEnterpriseExtension.getCollaborationRequests(currentUser),
        veritasEnterpriseExtension.getNotifications(currentUser)
      ]);

      setSessions(sessionsData);
      setAnalytics(analyticsData);
      setCollaborationRequests(requestsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  }, [currentUser]);

  // Create new verification session
  const handleCreateSession = useCallback(async () => {
    if (!currentUser || !newSessionTitle.trim()) return;

    try {
      const newSession = await veritasEnterpriseExtension.createVerificationSession(
        currentUser,
        newSessionTitle.trim(),
        newSessionDescription.trim() || undefined,
        newSessionCompliance
      );

      setSessions(prev => [newSession, ...prev]);
      setCreateSessionDialog(false);
      setNewSessionTitle('');
      setNewSessionDescription('');
      setNewSessionCompliance('basic');

      setSnackbar({
        open: true,
        message: 'Verification session created successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create session',
        severity: 'error'
      });
    }
  }, [currentUser, newSessionTitle, newSessionDescription, newSessionCompliance]);

  // Invite collaborator
  const handleInviteCollaborator = useCallback(async () => {
    if (!currentUser || !selectedSession || !collaboratorEmail.trim()) return;

    try {
      await veritasEnterpriseExtension.inviteCollaborator(
        currentUser,
        selectedSession.id,
        collaboratorEmail.trim(),
        collaboratorPermissions as ('read' | 'verify' | 'comment' | 'admin')[],
        'You have been invited to collaborate on a Veritas verification session.'
      );

      setCollaborateDialog(false);
      setCollaboratorEmail('');
      setCollaboratorPermissions(['read']);
      setSelectedSession(null);

      setSnackbar({
        open: true,
        message: 'Collaboration invitation sent successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send collaboration invitation',
        severity: 'error'
      });
    }
  }, [currentUser, selectedSession, collaboratorEmail, collaboratorPermissions]);

  // Handle collaboration request response
  const handleCollaborationResponse = useCallback(async (requestId: string, response: 'accept' | 'decline') => {
    if (!currentUser) return;

    try {
      await veritasEnterpriseExtension.respondToCollaborationRequest(currentUser, requestId, response);
      
      setCollaborationRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: response === 'accept' ? 'accepted' : 'declined' }
            : req
        )
      );

      setSnackbar({
        open: true,
        message: `Collaboration request ${response}ed`,
        severity: 'success'
      });

      // Reload sessions if accepted
      if (response === 'accept') {
        await loadAllData();
      }
    } catch (error) {
      console.error('Failed to respond to collaboration request:', error);
      setSnackbar({
        open: true,
        message: 'Failed to respond to collaboration request',
        severity: 'error'
      });
    }
  }, [currentUser, loadAllData]);

  // Generate compliance report
  const handleGenerateReport = useCallback(async (format: 'pdf' | 'excel' | 'json' = 'pdf') => {
    if (!currentUser || sessions.length === 0) return;

    try {
      const sessionIds = sessions.map(s => s.id);
      const blob = await veritasEnterpriseExtension.generateComplianceReport(currentUser, sessionIds, format);
      
      // Download the report
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veritas-compliance-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Compliance report generated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate compliance report',
        severity: 'error'
      });
    }
  }, [currentUser, sessions]);

  // Load governance settings
  const loadGovernanceSettings = useCallback(async () => {
    if (!currentUser) return;

    try {
      const settings = await veritasEnterpriseExtension.getGovernanceSettings(currentUser);
      setGovernanceSettings(settings);
    } catch (error) {
      console.error('Failed to load governance settings:', error);
      // Use default settings if loading fails
    }
  }, [currentUser]);

  // Save governance settings
  const handleSaveGovernanceSettings = useCallback(async () => {
    if (!currentUser) return;

    try {
      await veritasEnterpriseExtension.updateGovernanceSettings(currentUser, governanceSettings);
      
      setGovernanceSettingsDialog(false);
      setSnackbar({
        open: true,
        message: 'Governance settings updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save governance settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save governance settings',
        severity: 'error'
      });
    }
  }, [currentUser, governanceSettings]);

  // Load governance settings on component mount
  useEffect(() => {
    if (currentUser) {
      loadGovernanceSettings();
    }
  }, [currentUser, loadGovernanceSettings]);

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Memoized analytics charts data
  const chartData = useMemo(() => {
    if (!analytics) return null;

    return {
      trends: analytics.verificationTrends.map(trend => ({
        date: new Date(trend.date).toLocaleDateString(),
        verifications: trend.count,
        accuracy: Math.round(trend.accuracy * 100)
      })),
      sources: analytics.topSources.slice(0, 5).map(source => ({
        name: source.source,
        count: source.count,
        reliability: Math.round(source.reliability * 100)
      })),
      compliance: [
        { name: 'Audit Trail', value: Math.round(analytics.complianceMetrics.auditTrailCompleteness * 100) },
        { name: 'Data Retention', value: Math.round(analytics.complianceMetrics.dataRetentionCompliance * 100) },
        { name: 'Access Control', value: Math.round(analytics.complianceMetrics.accessControlCompliance * 100) }
      ]
    };
  }, [analytics]);

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Initializing Veritas Enterprise...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  // Authentication required
  if (!currentUser) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Please log in to access Veritas Enterprise features.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <VerifiedIcon sx={{ mr: 2, color: 'primary.main' }} />
            Veritas Enterprise Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Advanced verification, collaboration, and compliance management
          </Typography>
        </Box>

        <Tabs value={currentTab} onChange={handleTabChange} aria-label="veritas dashboard tabs">
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <AssessmentIcon sx={{ mr: 1 }} />
                Overview
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <SecurityIcon sx={{ mr: 1 }} />
                Sessions
                <Chip label={sessions.length} size="small" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <GroupIcon sx={{ mr: 1 }} />
                Collaboration
                <Badge badgeContent={collaborationRequests.filter(r => r.status === 'pending').length} color="error">
                  <Box sx={{ width: 20 }} />
                </Badge>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <AnalyticsIcon sx={{ mr: 1 }} />
                Analytics
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <NotificationsIcon sx={{ mr: 1 }} />
                Notifications
                <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                  <Box sx={{ width: 20 }} />
                </Badge>
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        {/* Overview Tab */}
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Verifications
                </Typography>
                <Typography variant="h4">
                  {analytics?.totalVerifications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  All time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Hallucination Detection
                </Typography>
                <Typography variant="h4">
                  {analytics ? Math.round(analytics.hallucinationDetectionRate * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Detection rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Accuracy
                </Typography>
                <Typography variant="h4">
                  {analytics ? Math.round(analytics.averageAccuracyScore * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Accuracy score
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="h4">
                  {sessions.filter(s => s.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Currently active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Recent Sessions" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Compliance</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.slice(0, 5).map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {session.title}
                            </Typography>
                            {session.description && (
                              <Typography variant="body2" color="text.secondary">
                                {session.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={session.status} 
                              color={session.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={session.complianceLevel} 
                              color={session.complianceLevel === 'enterprise' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(session.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedSession(session);
                                setCollaborateDialog(true);
                              }}
                            >
                              <ShareIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateSessionDialog(true)}
                    fullWidth
                  >
                    New Session
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => handleGenerateReport('pdf')}
                    fullWidth
                  >
                    Generate Report
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => setGovernanceSettingsDialog(true)}
                    fullWidth
                  >
                    Configure Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Governance Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Current Governance Configuration" 
                action={
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => setGovernanceSettingsDialog(true)}
                  >
                    Edit Settings
                  </Button>
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Compliance Level
                      </Typography>
                      <Chip 
                        label={governanceSettings.complianceLevel.charAt(0).toUpperCase() + governanceSettings.complianceLevel.slice(1)}
                        color={governanceSettings.complianceLevel === 'enterprise' ? 'primary' : governanceSettings.complianceLevel === 'enhanced' ? 'secondary' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Risk Tolerance
                      </Typography>
                      <Chip 
                        label={governanceSettings.riskTolerance.charAt(0).toUpperCase() + governanceSettings.riskTolerance.slice(1)}
                        color={governanceSettings.riskTolerance === 'low' ? 'error' : governanceSettings.riskTolerance === 'medium' ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Policy Framework
                      </Typography>
                      <Typography variant="body2">
                        {governanceSettings.policyFramework.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Verification Thresholds
                      </Typography>
                      <Typography variant="body2">
                        Truth: {governanceSettings.verificationThresholds.truthProbability} | 
                        Confidence: {governanceSettings.verificationThresholds.confidenceLevel} | 
                        Hallucination: {governanceSettings.verificationThresholds.hallucination}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Sessions Tab */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Verification Sessions</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateSessionDialog(true)}
          >
            Create Session
          </Button>
        </Box>

        <Grid container spacing={3}>
          {sessions.map((session) => (
            <Grid item xs={12} md={6} lg={4} key={session.id}>
              <Card>
                <CardHeader
                  title={session.title}
                  subheader={session.description}
                  action={
                    <IconButton
                      onClick={() => {
                        setSelectedSession(session);
                        setCollaborateDialog(true);
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Box display="flex" gap={1} mb={2}>
                    <Chip 
                      label={session.status} 
                      color={session.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={session.complianceLevel} 
                      color={session.complianceLevel === 'enterprise' ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {session.verifications.length} verifications
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {session.collaborators.length} collaborators
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(session.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Collaboration Tab */}
        <Typography variant="h5" gutterBottom>
          Collaboration Requests
        </Typography>

        {collaborationRequests.length === 0 ? (
          <Alert severity="info">
            No collaboration requests at this time.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {collaborationRequests.map((request) => (
              <Grid item xs={12} md={6} key={request.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Collaboration Request
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      From: {request.fromUserId}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Session: {request.sessionId}
                    </Typography>
                    
                    {request.message && (
                      <Typography variant="body2" gutterBottom>
                        "{request.message}"
                      </Typography>
                    )}
                    
                    <Box display="flex" gap={1} mt={2} mb={2}>
                      {request.permissions.map((permission) => (
                        <Chip key={permission} label={permission} size="small" />
                      ))}
                    </Box>
                    
                    <Chip 
                      label={request.status} 
                      color={
                        request.status === 'accepted' ? 'success' : 
                        request.status === 'declined' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                    
                    {request.status === 'pending' && (
                      <Box display="flex" gap={1} mt={2}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleCollaborationResponse(request.id, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleCollaborationResponse(request.id, 'decline')}
                        >
                          Decline
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* Analytics Tab */}
        <Typography variant="h5" gutterBottom>
          Verification Analytics
        </Typography>

        {analytics && chartData && (
          <Grid container spacing={3}>
            {/* Verification Trends */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader title="Verification Trends" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="verifications" fill="#8884d8" name="Verifications" />
                      <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#82ca9d" name="Accuracy %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Compliance Metrics */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader title="Compliance Metrics" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.compliance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.compliance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28'][index % 3]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Sources */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Top Evidence Sources" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.sources}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Usage Count" />
                      <Bar yAxisId="right" dataKey="reliability" fill="#82ca9d" name="Reliability %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={4}>
        {/* Notifications Tab */}
        <Typography variant="h5" gutterBottom>
          Notifications
        </Typography>

        {notifications.length === 0 ? (
          <Alert severity="info">
            No notifications at this time.
          </Alert>
        ) : (
          <List>
            {notifications.map((notification) => (
              <ListItem key={notification.id} divider>
                <ListItemIcon>
                  {notification.type === 'hallucination_detected' && <WarningIcon color="warning" />}
                  {notification.type === 'collaboration_request' && <GroupIcon color="primary" />}
                  {notification.type === 'compliance_alert' && <SecurityIcon color="error" />}
                  {notification.type === 'system_update' && <AutoAwesomeIcon color="info" />}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                {!notification.read && (
                  <Chip label="New" color="primary" size="small" />
                )}
              </ListItem>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Create Session Dialog */}
      <Dialog open={createSessionDialog} onClose={() => setCreateSessionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Verification Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Title"
            fullWidth
            variant="outlined"
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newSessionDescription}
            onChange={(e) => setNewSessionDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Compliance Level</InputLabel>
            <Select
              value={newSessionCompliance}
              label="Compliance Level"
              onChange={(e) => setNewSessionCompliance(e.target.value as 'basic' | 'enhanced' | 'enterprise')}
            >
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="enhanced">Enhanced</MenuItem>
              <MenuItem value="enterprise">Enterprise</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSessionDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained" disabled={!newSessionTitle.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collaborate Dialog */}
      <Dialog open={collaborateDialog} onClose={() => setCollaborateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Collaborator</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Session: {selectedSession.title}
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Collaborator Email"
            type="email"
            fullWidth
            variant="outlined"
            value={collaboratorEmail}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Permissions</InputLabel>
            <Select
              multiple
              value={collaboratorPermissions}
              label="Permissions"
              onChange={(e) => setCollaboratorPermissions(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="verify">Verify</MenuItem>
              <MenuItem value="comment">Comment</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCollaborateDialog(false)}>Cancel</Button>
          <Button onClick={handleInviteCollaborator} variant="contained" disabled={!collaboratorEmail.trim()}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Governance Settings Dialog */}
      <Dialog open={governanceSettingsDialog} onClose={() => setGovernanceSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Governance Configuration Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Configure your Veritas governance verification settings. These settings control how verification is performed and what compliance standards are applied.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Compliance Level</InputLabel>
                <Select
                  value={governanceSettings.complianceLevel}
                  label="Compliance Level"
                  onChange={(e) => setGovernanceSettings(prev => ({ 
                    ...prev, 
                    complianceLevel: e.target.value as 'basic' | 'enhanced' | 'enterprise' 
                  }))}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="enhanced">Enhanced</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Risk Tolerance</InputLabel>
                <Select
                  value={governanceSettings.riskTolerance}
                  label="Risk Tolerance"
                  onChange={(e) => setGovernanceSettings(prev => ({ 
                    ...prev, 
                    riskTolerance: e.target.value as 'low' | 'medium' | 'high' 
                  }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Policy Framework</InputLabel>
                <Select
                  value={governanceSettings.policyFramework}
                  label="Policy Framework"
                  onChange={(e) => setGovernanceSettings(prev => ({ 
                    ...prev, 
                    policyFramework: e.target.value 
                  }))}
                >
                  <MenuItem value="promethios_standard">Promethios Standard</MenuItem>
                  <MenuItem value="financial_services">Financial Services</MenuItem>
                  <MenuItem value="healthcare">Healthcare (HIPAA)</MenuItem>
                  <MenuItem value="government">Government</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Audit Requirements</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Select which audit requirements should be enforced for verification sessions.
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Audit Requirements</InputLabel>
                <Select
                  multiple
                  value={governanceSettings.auditRequirements}
                  label="Audit Requirements"
                  onChange={(e) => setGovernanceSettings(prev => ({ 
                    ...prev, 
                    auditRequirements: e.target.value as string[]
                  }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="accuracy_validation">Accuracy Validation</MenuItem>
                  <MenuItem value="source_verification">Source Verification</MenuItem>
                  <MenuItem value="bias_detection">Bias Detection</MenuItem>
                  <MenuItem value="policy_compliance">Policy Compliance</MenuItem>
                  <MenuItem value="risk_assessment">Risk Assessment</MenuItem>
                  <MenuItem value="audit_trail">Complete Audit Trail</MenuItem>
                  <MenuItem value="data_retention">Data Retention Compliance</MenuItem>
                  <MenuItem value="access_control">Access Control Logging</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Verification Thresholds</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Adjust the sensitivity of verification checks. Lower values are more strict.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Truth Probability: {governanceSettings.verificationThresholds.truthProbability}</Typography>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={governanceSettings.verificationThresholds.truthProbability}
                onChange={(e) => setGovernanceSettings(prev => ({
                  ...prev,
                  verificationThresholds: {
                    ...prev.verificationThresholds,
                    truthProbability: parseFloat(e.target.value)
                  }
                }))}
                style={{ width: '100%' }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Confidence Level: {governanceSettings.verificationThresholds.confidenceLevel}</Typography>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={governanceSettings.verificationThresholds.confidenceLevel}
                onChange={(e) => setGovernanceSettings(prev => ({
                  ...prev,
                  verificationThresholds: {
                    ...prev.verificationThresholds,
                    confidenceLevel: parseFloat(e.target.value)
                  }
                }))}
                style={{ width: '100%' }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Hallucination Threshold: {governanceSettings.verificationThresholds.hallucination}</Typography>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={governanceSettings.verificationThresholds.hallucination}
                onChange={(e) => setGovernanceSettings(prev => ({
                  ...prev,
                  verificationThresholds: {
                    ...prev.verificationThresholds,
                    hallucination: parseFloat(e.target.value)
                  }
                }))}
                style={{ width: '100%' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGovernanceSettingsDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveGovernanceSettings} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="New Session"
          onClick={() => setCreateSessionDialog(true)}
        />
        <SpeedDialAction
          icon={<CloudDownloadIcon />}
          tooltipTitle="Generate Report"
          onClick={() => handleGenerateReport('pdf')}
        />
        <SpeedDialAction
          icon={<AnalyticsIcon />}
          tooltipTitle="View Analytics"
          onClick={() => setCurrentTab(3)}
        />
      </SpeedDial>
    </Box>
  );
};

export default EnterpriseVeritasDashboard;

