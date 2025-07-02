/**
 * Enhanced Governance Reports Page
 * 
 * Enterprise-grade reporting system with real data integration, advanced analytics,
 * notification system integration, and comprehensive workflow management.
 * Uses ReportingExtension following existing extension patterns.
 * Now includes proper user authentication and scoping.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  Slider,
  Autocomplete,
  DatePicker,
  TimePicker
} from '@mui/material';
import {
  Assessment,
  PictureAsPdf,
  TableChart,
  Download,
  Schedule,
  Add,
  Refresh,
  CloudDownload,
  Share,
  Delete,
  Edit,
  Visibility,
  PlayArrow,
  Stop,
  CheckCircle,
  Error,
  Warning,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Timeline,
  Group,
  Security,
  Policy,
  Speed,
  FilterList,
  Search,
  MoreVert,
  GetApp,
  Email,
  CloudUpload,
  Archive,
  Unarchive,
  Approval,
  Cancel,
  Settings,
  Analytics,
  Dashboard,
  Report,
  FileDownload,
  FileCopy,
  Folder,
  FolderOpen,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Notifications,
  NotificationsActive,
  Home,
  NavigateNext
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';
import { useNotificationBackend } from '../hooks/useNotificationBackend';
import { reportingExtension, ReportTemplate, GeneratedReport, ReportAnalytics, ReportGenerationProgress } from '../extensions/ReportingExtension';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedGovernanceReportsPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [reportAnalytics, setReportAnalytics] = useState<ReportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  
  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  
  // Selected items
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  
  // Generation progress
  const [generationProgress, setGenerationProgress] = useState<Map<string, ReportGenerationProgress>>(new Map());
  const [activeGenerations, setActiveGenerations] = useState<Set<string>>(new Set());
  
  // Filters and search
  const [templateFilter, setTemplateFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  
  // Notification integration
  const { addNotification, markAsRead } = useNotificationBackend();
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initialize reporting extension
  useEffect(() => {
    const initializeReporting = async () => {
      try {
        setLoading(true);
        const initialized = await reportingExtension.initialize({
          enable_real_time: realTimeUpdates,
          enable_ml_insights: true,
          enable_predictive_analytics: true
        }, currentUser);
        
        if (!initialized) {
          throw new Error('Failed to initialize reporting system');
        }
        
        await loadAllData();
        
        // Add initialization notification
        addNotification({
          id: `reporting_init_${Date.now()}`,
          type: 'info',
          title: 'Reporting System Initialized',
          message: 'Enterprise reporting system is ready with real-time capabilities',
          timestamp: new Date().toISOString(),
          read: false,
          actions: [
            {
              label: 'View Templates',
              action: () => setCurrentTab(0)
            }
          ]
        });
        
      } catch (error) {
        console.error('Failed to initialize reporting:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize reporting system');
        
        addNotification({
          id: `reporting_error_${Date.now()}`,
          type: 'error',
          title: 'Reporting System Error',
          message: 'Failed to initialize reporting system. Please check backend connectivity.',
          timestamp: new Date().toISOString(),
          read: false,
          actions: [
            {
              label: 'Retry',
              action: () => window.location.reload()
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    // Only initialize if user is authenticated
    if (currentUser) {
      initializeReporting();
    } else {
      setError('User authentication required');
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      reportingExtension.cleanup();
    };
  }, [realTimeUpdates, addNotification, currentUser]);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      const [templates, reports, analytics] = await Promise.all([
        reportingExtension.getReportTemplates(currentUser),
        reportingExtension.getGeneratedReports(currentUser),
        reportingExtension.getReportAnalytics('30d')
      ]);

      setReportTemplates(templates);
      setGeneratedReports(reports);
      setReportAnalytics(analytics);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load reporting data');
      
      addNotification({
        id: `data_load_error_${Date.now()}`,
        type: 'error',
        title: 'Data Loading Error',
        message: 'Failed to load reporting data. Some features may not work correctly.',
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  }, [addNotification]);

  // Auto-refresh data
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(loadAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [realTimeUpdates, loadAllData]);

  // Report generation with real-time progress
  const handleGenerateReport = useCallback(async (template: ReportTemplate, filters: Record<string, any>) => {
    try {
      const reportId = `report_${Date.now()}`;
      setActiveGenerations(prev => new Set([...prev, reportId]));
      
      // Progress callback for real-time updates
      const onProgress = (progress: ReportGenerationProgress) => {
        setGenerationProgress(prev => new Map(prev.set(reportId, progress)));
        
        // Send notification for major milestones
        if (progress.status === 'completed') {
          addNotification({
            id: `report_complete_${reportId}`,
            type: 'success',
            title: 'Report Generated Successfully',
            message: `${template.name} has been generated and is ready for download`,
            timestamp: new Date().toISOString(),
            read: false,
            actions: [
              {
                label: 'Download',
                action: () => handleDownloadReport(reportId)
              },
              {
                label: 'View Reports',
                action: () => setCurrentTab(1)
              }
            ]
          });
          
          setActiveGenerations(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
          
          // Refresh reports list
          loadAllData();
          
        } else if (progress.status === 'failed') {
          addNotification({
            id: `report_failed_${reportId}`,
            type: 'error',
            title: 'Report Generation Failed',
            message: `Failed to generate ${template.name}: ${progress.errors?.[0] || 'Unknown error'}`,
            timestamp: new Date().toISOString(),
            read: false,
            actions: [
              {
                label: 'Retry',
                action: () => handleGenerateReport(template, filters)
              }
            ]
          });
          
          setActiveGenerations(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
        }
      };

      const result = await reportingExtension.generateReport(currentUser, template.id, filters, onProgress);
      
      setSnackbar({
        open: true,
        message: `Report generation started for ${template.name}`,
        severity: 'info'
      });
      
      setGenerateDialogOpen(false);
      
    } catch (error) {
      console.error('Failed to generate report:', error);
      setSnackbar({
        open: true,
        message: `Failed to start report generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
      
      addNotification({
        id: `report_start_error_${Date.now()}`,
        type: 'error',
        title: 'Report Generation Error',
        message: `Failed to start generating ${template.name}`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  }, [addNotification, loadAllData]);

  // Download report
  const handleDownloadReport = useCallback(async (reportId: string) => {
    try {
      const blob = await reportingExtension.downloadReport(currentUser, reportId);
      const report = generatedReports.find(r => r.id === reportId);
      
      if (!report) {
        throw new Error('Report not found');
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.template_name}_${reportId}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: `Downloaded ${report.template_name}`,
        severity: 'success'
      });
      
      addNotification({
        id: `report_download_${reportId}`,
        type: 'info',
        title: 'Report Downloaded',
        message: `${report.template_name} has been downloaded successfully`,
        timestamp: new Date().toISOString(),
        read: false
      });
      
    } catch (error) {
      console.error('Failed to download report:', error);
      setSnackbar({
        open: true,
        message: `Failed to download report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [generatedReports, addNotification]);

  // Bulk operations
  const handleBulkDownload = useCallback(async () => {
    try {
      if (selectedReports.length === 0) {
        setSnackbar({
          open: true,
          message: 'No reports selected for download',
          severity: 'warning'
        });
        return;
      }
      
      const blob = await reportingExtension.bulkExport(selectedReports, 'zip');
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports_bulk_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: `Downloaded ${selectedReports.length} reports as ZIP archive`,
        severity: 'success'
      });
      
      addNotification({
        id: `bulk_download_${Date.now()}`,
        type: 'success',
        title: 'Bulk Download Complete',
        message: `Successfully downloaded ${selectedReports.length} reports`,
        timestamp: new Date().toISOString(),
        read: false
      });
      
      setSelectedReports([]);
      setBulkActionsOpen(false);
      
    } catch (error) {
      console.error('Failed to bulk download:', error);
      setSnackbar({
        open: true,
        message: `Failed to bulk download: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [selectedReports, addNotification]);

  // Share report
  const handleShareReport = useCallback(async (reportId: string, recipients: string[], message?: string) => {
    try {
      await reportingExtension.shareReport(reportId, recipients, message);
      
      const report = generatedReports.find(r => r.id === reportId);
      
      setSnackbar({
        open: true,
        message: `Shared ${report?.template_name} with ${recipients.length} recipients`,
        severity: 'success'
      });
      
      addNotification({
        id: `report_shared_${reportId}`,
        type: 'info',
        title: 'Report Shared',
        message: `${report?.template_name} has been shared with ${recipients.join(', ')}`,
        timestamp: new Date().toISOString(),
        read: false
      });
      
    } catch (error) {
      console.error('Failed to share report:', error);
      setSnackbar({
        open: true,
        message: `Failed to share report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [generatedReports, addNotification]);

  // Schedule report
  const handleScheduleReport = useCallback(async (templateId: string, schedule: any) => {
    try {
      const result = await reportingExtension.scheduleReport(templateId, schedule);
      
      const template = reportTemplates.find(t => t.id === templateId);
      
      setSnackbar({
        open: true,
        message: `Scheduled ${template?.name} for ${schedule.frequency} generation`,
        severity: 'success'
      });
      
      addNotification({
        id: `report_scheduled_${result.schedule_id}`,
        type: 'success',
        title: 'Report Scheduled',
        message: `${template?.name} has been scheduled for ${schedule.frequency} generation`,
        timestamp: new Date().toISOString(),
        read: false,
        actions: [
          {
            label: 'View Schedules',
            action: () => setCurrentTab(2)
          }
        ]
      });
      
      setScheduleDialogOpen(false);
      
    } catch (error) {
      console.error('Failed to schedule report:', error);
      setSnackbar({
        open: true,
        message: `Failed to schedule report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [reportTemplates, addNotification]);

  // Filtered data
  const filteredTemplates = useMemo(() => {
    return reportTemplates.filter(template => {
      const matchesFilter = templateFilter === 'all' || template.category === templateFilter;
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [reportTemplates, templateFilter, searchQuery]);

  const filteredReports = useMemo(() => {
    return generatedReports.filter(report => {
      const matchesFilter = reportFilter === 'all' || report.status === reportFilter;
      const matchesSearch = searchQuery === '' || 
        report.template_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = !dateRange.start || !dateRange.end ||
        (new Date(report.generated_at) >= dateRange.start && new Date(report.generated_at) <= dateRange.end);
      return matchesFilter && matchesSearch && matchesDate;
    });
  }, [generatedReports, reportFilter, searchQuery, dateRange]);

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'generating': return <CircularProgress size={20} sx={{ color: '#F59E0B' }} />;
      case 'failed': return <Error sx={{ color: '#EF4444' }} />;
      case 'approved': return <Approval sx={{ color: '#10B981' }} />;
      case 'rejected': return <Cancel sx={{ color: '#EF4444' }} />;
      default: return <Info />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PictureAsPdf sx={{ color: '#EF4444' }} />;
      case 'excel': return <TableChart sx={{ color: '#10B981' }} />;
      case 'json': return <BarChart sx={{ color: '#3B82F6' }} />;
      case 'csv': return <TableChart sx={{ color: '#F59E0B' }} />;
      default: return <Assessment />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'compliance': return '#10B981';
      case 'audit': return '#3B82F6';
      case 'performance': return '#F59E0B';
      case 'security': return '#EF4444';
      case 'trust': return '#8B5CF6';
      case 'policy': return '#06B6D4';
      case 'custom': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  // Render analytics charts
  const renderAnalyticsCharts = () => {
    if (!reportAnalytics) return null;

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#f8fafc'
          }
        },
        title: {
          display: true,
          color: '#f8fafc'
        }
      },
      scales: {
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { color: '#374151' }
        },
        y: {
          ticks: { color: '#cbd5e1' },
          grid: { color: '#374151' }
        }
      }
    };

    return (
      <Grid container spacing={3}>
        {/* Generation Trends */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '400px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Generation Trends
              </Typography>
              {reportAnalytics.usage_patterns.generation_by_day.length > 0 ? (
                <Line
                  data={{
                    labels: reportAnalytics.usage_patterns.generation_by_day.map(d => d.date),
                    datasets: [{
                      label: 'Reports Generated',
                      data: reportAnalytics.usage_patterns.generation_by_day.map(d => d.count),
                      borderColor: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Daily Report Generation'
                      }
                    }
                  }}
                />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="300px">
                  <Typography color="textSecondary">No generation data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Format Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', height: '400px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Format Distribution
              </Typography>
              {reportAnalytics.usage_patterns.format_distribution.length > 0 ? (
                <Doughnut
                  data={{
                    labels: reportAnalytics.usage_patterns.format_distribution.map(d => d.format.toUpperCase()),
                    datasets: [{
                      data: reportAnalytics.usage_patterns.format_distribution.map(d => d.count),
                      backgroundColor: [
                        '#EF4444', // PDF - Red
                        '#10B981', // Excel - Green
                        '#3B82F6', // JSON - Blue
                        '#F59E0B'  // CSV - Yellow
                      ]
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Report Formats'
                      }
                    }
                  }}
                />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="300px">
                  <Typography color="textSecondary">No format data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              {reportAnalytics.performance_metrics.generation_times.length > 0 ? (
                <Bar
                  data={{
                    labels: reportAnalytics.performance_metrics.generation_times.map(d => d.template),
                    datasets: [
                      {
                        label: 'Average Time (s)',
                        data: reportAnalytics.performance_metrics.generation_times.map(d => d.avg_time),
                        backgroundColor: '#3B82F6'
                      },
                      {
                        label: 'Max Time (s)',
                        data: reportAnalytics.performance_metrics.generation_times.map(d => d.max_time),
                        backgroundColor: '#EF4444'
                      }
                    ]
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Generation Times by Template'
                      }
                    }
                  }}
                />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="300px">
                  <Typography color="textSecondary">No performance data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: '#1a202c' }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: '#1a202c', color: 'white', p: 4 }}
      >
        <Error sx={{ fontSize: 60, color: '#EF4444', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Reporting System Error
        </Typography>
        <Typography variant="body1" color="textSecondary" textAlign="center" mb={4}>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: '#1a202c',
        minHeight: '100vh',
        color: 'white',
        p: 4
      }}
    >
      {/* Header with Breadcrumbs */}
      <Box mb={3}>
        <Breadcrumbs 
          aria-label="breadcrumb" 
          sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: '#cbd5e1' } }}
        >
          <Link 
            color="inherit" 
            href="#" 
            onClick={() => {/* Navigate to home */}}
            sx={{ display: 'flex', alignItems: 'center', color: '#cbd5e1' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Promethios
          </Link>
          <Link 
            color="inherit" 
            href="#"
            sx={{ color: '#cbd5e1' }}
          >
            Governance
          </Link>
          <Typography color="primary">Reports</Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              <Report sx={{ mr: 2, verticalAlign: 'middle' }} />
              Governance Reports
            </Typography>
            <Typography variant="body1" sx={{ color: '#a0aec0' }}>
              Enterprise reporting system with real-time generation, advanced analytics, and comprehensive workflow management
            </Typography>
          </Box>
          
          <Box display="flex" gap={2} alignItems="center">
            {/* Real-time toggle */}
            <Tooltip title="Enable real-time updates and live progress tracking">
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeUpdates}
                    onChange={(e) => setRealTimeUpdates(e.target.checked)}
                    color="primary"
                  />
                }
                label="Real-time"
                sx={{ color: 'white' }}
              />
            </Tooltip>
            
            {/* Refresh button */}
            <Tooltip title="Refresh all data from backend systems">
              <IconButton
                onClick={loadAllData}
                sx={{ color: 'white' }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            
            {/* Analytics button */}
            <Tooltip title="View comprehensive reporting analytics and insights">
              <Button
                variant="outlined"
                startIcon={<Analytics />}
                onClick={() => setAnalyticsDialogOpen(true)}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Analytics
              </Button>
            </Tooltip>
            
            {/* Create template button */}
            <Tooltip title="Create a new report template with custom sections and filters">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setTemplateBuilderOpen(true)}
              >
                Create Template
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Analytics Summary Cards */}
      {reportAnalytics && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {reportAnalytics.overview.total_templates}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Total Templates
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#3B82F6' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      {reportAnalytics.overview.reports_this_month}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      This Month
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#10B981' }}>
                    <TrendingUp />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="info.main" gutterBottom>
                      {reportAnalytics.overview.total_downloads}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Downloads
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#3B82F6' }}>
                    <Download />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="warning.main" gutterBottom>
                      {reportAnalytics.overview.avg_generation_time.toFixed(1)}s
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Avg Generation
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#F59E0B' }}>
                    <Speed />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      {reportAnalytics.overview.compliance_score.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Compliance
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#10B981' }}>
                    <CheckCircle />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="info.main" gutterBottom>
                      {reportAnalytics.overview.audit_coverage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Audit Coverage
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#3B82F6' }}>
                    <Security />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: '#cbd5e1' },
              '& .Mui-selected': { color: '#6366f1' }
            }}
          >
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Assessment />
                  Templates ({reportTemplates.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Folder />
                  Generated Reports ({generatedReports.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule />
                  Scheduled Reports
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Analytics />
                  Analytics & Insights
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Templates Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
            {/* Search */}
            <TextField
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: '#a0aec0', mr: 1 }} />
              }}
              sx={{ 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#374151',
                  '& fieldset': { borderColor: '#4b5563' },
                  '&:hover fieldset': { borderColor: '#6b7280' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
            
            {/* Category filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
              <Select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                sx={{
                  backgroundColor: '#374151',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' }
                }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
                <MenuItem value="audit">Audit</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="trust">Trust</MenuItem>
                <MenuItem value="policy">Policy</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Templates Grid */}
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card 
                  sx={{ 
                    backgroundColor: '#374151', 
                    color: 'white',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Template Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getFormatIcon(template.format)}
                        <Chip
                          label={template.category}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(template.category),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      <Chip
                        label={template.status}
                        size="small"
                        color={template.status === 'active' ? 'success' : 'default'}
                      />
                    </Box>

                    {/* Template Info */}
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      {template.description}
                    </Typography>

                    {/* Template Stats */}
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Tooltip title="Number of times this template has been generated">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PlayArrow fontSize="small" />
                          <Typography variant="caption">
                            {template.usage_stats.generation_count} runs
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="Average generation time for this template">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Speed fontSize="small" />
                          <Typography variant="caption">
                            {formatDuration(template.usage_stats.avg_generation_time)}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="Total downloads of reports from this template">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Download fontSize="small" />
                          <Typography variant="caption">
                            {template.usage_stats.download_count} downloads
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>

                    {/* Sections Preview */}
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      Sections ({template.sections.filter(s => s.enabled).length}):
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                      {template.sections.filter(s => s.enabled).slice(0, 3).map((section) => (
                        <Chip
                          key={section.id}
                          label={section.name}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: '#6b7280',
                            color: '#cbd5e1',
                            fontSize: '0.7rem'
                          }}
                        />
                      ))}
                      {template.sections.filter(s => s.enabled).length > 3 && (
                        <Chip
                          label={`+${template.sections.filter(s => s.enabled).length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: '#6b7280',
                            color: '#cbd5e1',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>

                  {/* Template Actions */}
                  <Box p={2} pt={0}>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Generate a new report using this template">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setGenerateDialogOpen(true);
                          }}
                          sx={{ flex: 1 }}
                        >
                          Generate
                        </Button>
                      </Tooltip>
                      <Tooltip title="Schedule automatic report generation">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setScheduleDialogOpen(true);
                          }}
                          sx={{ color: 'white' }}
                        >
                          <Schedule />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Preview template structure and data">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setPreviewDialogOpen(true);
                          }}
                          sx={{ color: 'white' }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit template configuration">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setTemplateBuilderOpen(true);
                          }}
                          sx={{ color: 'white' }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredTemplates.length === 0 && (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              py={8}
            >
              <Assessment sx={{ fontSize: 80, color: '#6b7280', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No templates found
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={3}>
                {searchQuery || templateFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first report template to get started'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setTemplateBuilderOpen(true)}
              >
                Create Template
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Generated Reports Tab */}
        <TabPanel value={currentTab} index={1}>
          <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
            {/* Search */}
            <TextField
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: '#a0aec0', mr: 1 }} />
              }}
              sx={{ 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#374151',
                  '& fieldset': { borderColor: '#4b5563' },
                  '&:hover fieldset': { borderColor: '#6b7280' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                },
                '& .MuiInputBase-input': { color: 'white' }
              }}
            />
            
            {/* Status filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Status</InputLabel>
              <Select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                sx={{
                  backgroundColor: '#374151',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' }
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="generating">Generating</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            {/* Bulk actions */}
            {selectedReports.length > 0 && (
              <Box display="flex" gap={1}>
                <Tooltip title="Download selected reports as ZIP archive">
                  <Button
                    variant="outlined"
                    startIcon={<CloudDownload />}
                    onClick={handleBulkDownload}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Download ({selectedReports.length})
                  </Button>
                </Tooltip>
                <Tooltip title="Clear selection">
                  <IconButton
                    onClick={() => setSelectedReports([])}
                    sx={{ color: 'white' }}
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Active Generations Progress */}
          {activeGenerations.size > 0 && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Active Generations
              </Typography>
              {Array.from(activeGenerations).map((reportId) => {
                const progress = generationProgress.get(reportId);
                if (!progress) return null;

                return (
                  <Card key={reportId} sx={{ backgroundColor: '#374151', color: 'white', mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1">
                          {progress.current_step}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="body2" color="textSecondary">
                            {progress.progress_percentage.toFixed(0)}%
                          </Typography>
                          <Tooltip title="Cancel report generation">
                            <IconButton
                              size="small"
                              onClick={() => reportingExtension.cancelReportGeneration(reportId)}
                              sx={{ color: 'white' }}
                            >
                              <Stop />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress.progress_percentage}
                        sx={{
                          backgroundColor: '#4b5563',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#6366f1'
                          }
                        }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="textSecondary">
                          ETA: {new Date(progress.estimated_completion).toLocaleTimeString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Data: {Object.values(progress.data_collected).reduce((a, b) => a + b, 0)} records
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* Reports Table */}
          <TableContainer component={Paper} sx={{ backgroundColor: '#374151' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedReports.length > 0 && selectedReports.length < filteredReports.length}
                      checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReports(filteredReports.map(r => r.id));
                        } else {
                          setSelectedReports([]);
                        }
                      }}
                      sx={{ color: 'white' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Report</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Generated</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Size</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Downloads</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow 
                    key={report.id}
                    sx={{ 
                      '&:hover': { backgroundColor: '#4b5563' },
                      backgroundColor: selectedReports.includes(report.id) ? '#4b5563' : 'transparent'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedReports.includes(report.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReports([...selectedReports, report.id]);
                          } else {
                            setSelectedReports(selectedReports.filter(id => id !== report.id));
                          }
                        }}
                        sx={{ color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        {getFormatIcon(report.format)}
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: 'white' }}>
                            {report.template_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {report.id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(report.status)}
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {report.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {new Date(report.generated_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(report.generated_at).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {formatFileSize(report.file_size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {report.access_log.downloads}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {report.status === 'completed' && (
                          <Tooltip title="Download report file">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadReport(report.id)}
                              sx={{ color: 'white' }}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Share report with team members">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedReport(report);
                              // Open share dialog
                            }}
                            sx={{ color: 'white' }}
                          >
                            <Share />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View report details and metadata">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedReport(report);
                              // Open details dialog
                            }}
                            sx={{ color: 'white' }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete report permanently">
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Confirm and delete
                            }}
                            sx={{ color: '#EF4444' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredReports.length === 0 && (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              py={8}
            >
              <Folder sx={{ fontSize: 80, color: '#6b7280', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No reports found
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={3}>
                {searchQuery || reportFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Generate your first report to see it here'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => setCurrentTab(0)}
              >
                Generate Report
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Scheduled Reports Tab */}
        <TabPanel value={currentTab} index={2}>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            py={8}
          >
            <Schedule sx={{ fontSize: 80, color: '#6b7280', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Scheduled Reports
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Automated report scheduling feature coming soon
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setScheduleDialogOpen(true)}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Schedule Report
            </Button>
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={3}>
          {renderAnalyticsCharts()}
        </TabPanel>
      </Card>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="Create Template"
          onClick={() => setTemplateBuilderOpen(true)}
        />
        <SpeedDialAction
          icon={<PlayArrow />}
          tooltipTitle="Generate Report"
          onClick={() => setCurrentTab(0)}
        />
        <SpeedDialAction
          icon={<Analytics />}
          tooltipTitle="View Analytics"
          onClick={() => setAnalyticsDialogOpen(true)}
        />
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle="Refresh Data"
          onClick={loadAllData}
        />
      </SpeedDial>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* TODO: Add dialogs for:
          - Generate Report Dialog
          - Schedule Report Dialog
          - Template Builder Dialog
          - Analytics Dialog
          - Report Details Dialog
          - Share Report Dialog
          - Preview Dialog
      */}
    </Box>
  );
};

const ThemedEnhancedGovernanceReportsPage = () => (
  <ThemeProvider theme={darkTheme}>
    <EnhancedGovernanceReportsPage />
  </ThemeProvider>
);

export default ThemedEnhancedGovernanceReportsPage;

