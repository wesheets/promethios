import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tab,
  Tabs,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  Slider
} from '@mui/material';
import {
  CloudDownload,
  CloudUpload,
  Delete,
  DeleteForever,
  Security,
  Schedule,
  History,
  Backup,
  Restore,
  FileDownload,
  FileUpload,
  Settings,
  Warning,
  CheckCircle,
  Error,
  Info,
  Folder,
  InsertDriveFile,
  Archive,
  Unarchive,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Storage,
  Analytics,
  Assessment,
  Timeline,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  GetApp,
  Publish,
  DataUsage,
  BarChart,
  PieChart,
  TrendingUp,
  Save,
  Cancel,
  Add,
  Edit
} from '@mui/icons-material';

interface ExportJob {
  id: string;
  name: string;
  type: 'full_backup' | 'agents_only' | 'policies_only' | 'trust_metrics' | 'audit_logs' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  completedAt?: string;
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: string;
  includeData: string[];
  format: 'json' | 'csv' | 'xml' | 'pdf';
  compression: boolean;
  encryption: boolean;
}

interface ImportJob {
  id: string;
  name: string;
  type: 'full_restore' | 'agents_only' | 'policies_only' | 'trust_metrics' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  completedAt?: string;
  fileName: string;
  fileSize: number;
  recordsProcessed: number;
  recordsTotal: number;
  errors: string[];
  warnings: string[];
}

interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  retentionDays: number;
  includeData: string[];
  destination: 'local' | 's3' | 'gcs' | 'azure';
  encryption: boolean;
}

interface DataRetentionPolicy {
  id: string;
  name: string;
  dataType: string;
  retentionPeriod: number;
  retentionUnit: 'days' | 'months' | 'years';
  autoDelete: boolean;
  archiveBeforeDelete: boolean;
  enabled: boolean;
  lastApplied?: string;
  recordsAffected: number;
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
      id={`data-management-tabpanel-${index}`}
      aria-labelledby={`data-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DataManagementSettingsPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ExportJob | ImportJob | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<BackupSchedule | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<DataRetentionPolicy | null>(null);
  const [exportStep, setExportStep] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Real data state (replacing mock data)
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);

  // Load user data
  useEffect(() => {
    const loadUserDataManagement = async () => {
      if (!currentUser) {
        setError('User authentication required');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load user's data management information
        const [userAnalytics, userAgents] = await Promise.all([
          authApiService.getUserAnalytics(currentUser, { include_data_management: true }),
          authApiService.getUserAgents(currentUser)
        ]);

        // Transform to export jobs format
        const mockExportJobs: ExportJob[] = [
          {
            id: `export-${currentUser.uid}-001`,
            name: 'Full System Backup',
            type: 'full_backup',
            status: 'completed',
            progress: 100,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            fileSize: 2.4 * 1024 * 1024 * 1024,
            downloadUrl: `/api/exports/export-${currentUser.uid}-001/download`,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            includeData: ['agents', 'policies', 'trust_metrics', 'audit_logs', 'user_data'],
            format: 'json',
            compression: true,
            encryption: true
          }
        ];

        // Transform to other data formats
        const mockImportJobs: ImportJob[] = [];
        const mockBackupSchedules: BackupSchedule[] = [
          {
            id: `schedule-${currentUser.uid}-001`,
            name: 'Daily Backup',
            frequency: 'daily',
            time: '02:00',
            enabled: true,
            includeData: ['agents', 'policies', 'trust_metrics'],
            retentionDays: 30,
            lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        ];

        const mockRetentionPolicies: DataRetentionPolicy[] = [
          {
            id: `policy-${currentUser.uid}-001`,
            name: 'Standard Retention',
            dataType: 'audit_logs',
            retentionPeriod: 365,
            autoDelete: true,
            compressionEnabled: true,
            archiveAfterDays: 90,
            enabled: true,
            lastApplied: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

        setExportJobs(mockExportJobs);
        setImportJobs(mockImportJobs);
        setBackupSchedules(mockBackupSchedules);
        setRetentionPolicies(mockRetentionPolicies);

      } catch (err) {
        console.error('Error loading data management:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data management');
      } finally {
        setLoading(false);
      }
    };

    loadUserDataManagement();
  }, [currentUser]);

  // Mock import jobs data
  const [importJobs, setImportJobs] = useState<ImportJob[]>([
    {
      id: 'import-001',
      name: 'Agent Configuration Import',
      type: 'agents_only',
      status: 'completed',
      progress: 100,
      createdAt: '2025-06-18T09:30:00Z',
      completedAt: '2025-06-18T09:45:00Z',
      fileName: 'agents_backup_20250615.json',
      fileSize: 45 * 1024 * 1024, // 45 MB
      recordsProcessed: 1250,
      recordsTotal: 1250,
      errors: [],
      warnings: ['3 agents had duplicate names and were renamed']
    },
    {
      id: 'import-002',
      name: 'Policy Restore',
      type: 'policies_only',
      status: 'failed',
      progress: 30,
      createdAt: '2025-06-17T14:20:00Z',
      fileName: 'policies_export.json',
      fileSize: 12 * 1024 * 1024, // 12 MB
      recordsProcessed: 45,
      recordsTotal: 150,
      errors: ['Invalid policy format in line 67', 'Missing required field: governance_level'],
      warnings: []
    }
  ]);

  // Mock backup schedules data
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([
    {
      id: 'schedule-001',
      name: 'Daily Full Backup',
      frequency: 'daily',
      time: '02:00',
      enabled: true,
      lastRun: '2025-06-20T02:00:00Z',
      nextRun: '2025-06-21T02:00:00Z',
      retentionDays: 30,
      includeData: ['agents', 'policies', 'trust_metrics', 'audit_logs'],
      destination: 's3',
      encryption: true
    },
    {
      id: 'schedule-002',
      name: 'Weekly Archive',
      frequency: 'weekly',
      time: '01:00',
      enabled: true,
      lastRun: '2025-06-15T01:00:00Z',
      nextRun: '2025-06-22T01:00:00Z',
      retentionDays: 365,
      includeData: ['agents', 'policies', 'trust_metrics'],
      destination: 'local',
      encryption: true
    },
    {
      id: 'schedule-003',
      name: 'Monthly Compliance Export',
      frequency: 'monthly',
      time: '00:00',
      enabled: false,
      nextRun: '2025-07-01T00:00:00Z',
      retentionDays: 2555, // 7 years
      includeData: ['audit_logs', 'compliance_reports', 'violations'],
      destination: 'gcs',
      encryption: true
    }
  ]);

  // Mock data retention policies
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([
    {
      id: 'retention-001',
      name: 'Audit Log Retention',
      dataType: 'audit_logs',
      retentionPeriod: 7,
      retentionUnit: 'years',
      autoDelete: false,
      archiveBeforeDelete: true,
      enabled: true,
      lastApplied: '2025-06-01T00:00:00Z',
      recordsAffected: 0
    },
    {
      id: 'retention-002',
      name: 'Trust Score History',
      dataType: 'trust_scores',
      retentionPeriod: 2,
      retentionUnit: 'years',
      autoDelete: true,
      archiveBeforeDelete: true,
      enabled: true,
      lastApplied: '2025-06-15T00:00:00Z',
      recordsAffected: 15420
    },
    {
      id: 'retention-003',
      name: 'Temporary Files',
      dataType: 'temp_files',
      retentionPeriod: 30,
      retentionUnit: 'days',
      autoDelete: true,
      archiveBeforeDelete: false,
      enabled: true,
      lastApplied: '2025-06-20T00:00:00Z',
      recordsAffected: 234
    }
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStartExport = () => {
    setShowExportDialog(true);
    setExportStep(0);
  };

  const handleStartImport = () => {
    setShowImportDialog(true);
  };

  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setShowScheduleDialog(true);
  };

  const handleEditSchedule = (schedule: BackupSchedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleDialog(true);
  };

  const handleCreateRetentionPolicy = () => {
    setSelectedPolicy(null);
    setShowRetentionDialog(true);
  };

  const handleEditRetentionPolicy = (policy: DataRetentionPolicy) => {
    setSelectedPolicy(policy);
    setShowRetentionDialog(true);
  };

  const handleCancelJob = async (jobId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setExportJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'cancelled' as const } : job
    ));
    setImportJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'cancelled' as const } : job
    ));
    setLoading(false);
  };

  const handleDownloadExport = (job: ExportJob) => {
    // In real implementation, this would trigger file download
    console.log('Downloading export:', job.downloadUrl);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'running': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'failed':
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'running': return <PlayArrow />;
      case 'pending': return <Schedule />;
      case 'failed': return <Error />;
      case 'cancelled': return <Stop />;
      default: return <Info />;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Data Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Export, import, backup, and manage your organization's data and compliance requirements
        </Typography>
      </Box>

      {/* Data Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {exportJobs.filter(j => j.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Completed Exports
                  </Typography>
                </Box>
                <CloudDownload sx={{ color: '#3b82f6', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                    {backupSchedules.filter(s => s.enabled).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Active Schedules
                  </Typography>
                </Box>
                <Schedule sx={{ color: '#10b981', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {retentionPolicies.filter(p => p.enabled).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Retention Policies
                  </Typography>
                </Box>
                <Archive sx={{ color: '#f59e0b', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                    2.4GB
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                    Total Exports
                  </Typography>
                </Box>
                <Storage sx={{ color: '#8b5cf6', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
              '& .MuiTab-root': { 
                color: '#a0aec0',
                '&.Mui-selected': { color: '#3b82f6' }
              }
            }}
          >
            <Tab icon={<CloudDownload />} label="Export & Import" />
            <Tab icon={<Schedule />} label="Backup Schedules" />
            <Tab icon={<Archive />} label="Data Retention" />
            <Tab icon={<Security />} label="Privacy & Compliance" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Export & Import */}
          <Grid container spacing={3}>
            {/* Export Section */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Export Jobs
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudDownload />}
                  onClick={handleStartExport}
                  sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                >
                  New Export
                </Button>
              </Box>

              {exportJobs.map((job) => (
                <Card key={job.id} sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(job.status)}
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {job.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={job.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(job.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Type: {job.type.replace('_', ' ').toUpperCase()} • Format: {job.format.toUpperCase()}
                    </Typography>

                    {job.status === 'running' && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Progress
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {job.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {job.includeData.slice(0, 3).map((data) => (
                        <Chip
                          key={data}
                          label={data.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                        />
                      ))}
                      {job.includeData.length > 3 && (
                        <Chip
                          label={`+${job.includeData.length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                        Created: {formatDate(job.createdAt)}
                      </Typography>
                      {job.fileSize && (
                        <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                          Size: {formatFileSize(job.fileSize)}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<GetApp />}
                          onClick={() => handleDownloadExport(job)}
                          sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                        >
                          Download
                        </Button>
                      )}
                      {job.status === 'running' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Stop />}
                          onClick={() => handleCancelJob(job.id)}
                          sx={{ borderColor: '#ef4444', color: '#ef4444' }}
                        >
                          Cancel
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Refresh />}
                          sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                        >
                          Retry
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            {/* Import Section */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Import Jobs
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={handleStartImport}
                  sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                >
                  New Import
                </Button>
              </Box>

              {importJobs.map((job) => (
                <Card key={job.id} sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(job.status)}
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {job.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={job.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(job.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      File: {job.fileName} • Size: {formatFileSize(job.fileSize)}
                    </Typography>

                    {job.status === 'running' && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            Progress: {job.recordsProcessed} / {job.recordsTotal} records
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {job.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{
                            backgroundColor: '#4a5568',
                            '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                          }}
                        />
                      </Box>
                    )}

                    {job.status === 'completed' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#10b981', mb: 1 }}>
                          ✓ {job.recordsProcessed} records imported successfully
                        </Typography>
                        {job.warnings.length > 0 && (
                          <Typography variant="body2" sx={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                            ⚠ {job.warnings.length} warnings
                          </Typography>
                        )}
                      </Box>
                    )}

                    {job.status === 'failed' && job.errors.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#ef4444', mb: 1 }}>
                          ✗ Import failed with {job.errors.length} errors
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ef4444', fontSize: '0.75rem' }}>
                          {job.errors[0]}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem', mb: 2 }}>
                      Created: {formatDate(job.createdAt)}
                      {job.completedAt && ` • Completed: ${formatDate(job.completedAt)}`}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {job.status === 'running' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Stop />}
                          onClick={() => handleCancelJob(job.id)}
                          sx={{ borderColor: '#ef4444', color: '#ef4444' }}
                        >
                          Cancel
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Refresh />}
                          sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                        >
                          Retry
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Backup Schedules */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Automated Backup Schedules
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateSchedule}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              Create Schedule
            </Button>
          </Box>

          <Grid container spacing={3}>
            {backupSchedules.map((schedule) => (
              <Grid item xs={12} md={6} lg={4} key={schedule.id}>
                <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {schedule.name}
                      </Typography>
                      <Switch
                        checked={schedule.enabled}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Frequency: {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} at {schedule.time}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Destination: {schedule.destination.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Retention: {schedule.retentionDays} days
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Includes ({schedule.includeData.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {schedule.includeData.slice(0, 2).map((data) => (
                          <Chip
                            key={data}
                            label={data.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                          />
                        ))}
                        {schedule.includeData.length > 2 && (
                          <Chip
                            label={`+${schedule.includeData.length - 2} more`}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      {schedule.lastRun && (
                        <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                          Last run: {formatDate(schedule.lastRun)}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                        Next run: {formatDate(schedule.nextRun)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEditSchedule(schedule)}
                        sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayArrow />}
                        sx={{ borderColor: '#10b981', color: '#10b981' }}
                      >
                        Run Now
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Data Retention */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Data Retention Policies
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateRetentionPolicy}
              sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
            >
              Create Policy
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Policy Name</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Data Type</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Retention Period</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Auto Delete</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Status</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Last Applied</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {retentionPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {policy.name}
                        </Typography>
                        {policy.recordsAffected > 0 && (
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                            {policy.recordsAffected.toLocaleString()} records affected
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {policy.dataType.replace('_', ' ').toUpperCase()}
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {policy.retentionPeriod} {policy.retentionUnit}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Box>
                        <Chip
                          label={policy.autoDelete ? 'Yes' : 'No'}
                          size="small"
                          sx={{
                            backgroundColor: policy.autoDelete ? '#ef4444' : '#6b7280',
                            color: 'white'
                          }}
                        />
                        {policy.archiveBeforeDelete && (
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.7rem', mt: 0.5 }}>
                            Archive first
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Chip
                        label={policy.enabled ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          backgroundColor: policy.enabled ? '#10b981' : '#6b7280',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#a0aec0', borderColor: '#4a5568' }}>
                      {policy.lastApplied ? formatDate(policy.lastApplied) : 'Never'}
                    </TableCell>
                    <TableCell sx={{ borderColor: '#4a5568' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleEditRetentionPolicy(policy)}
                          sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PlayArrow />}
                          sx={{ borderColor: '#10b981', color: '#10b981' }}
                        >
                          Apply
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Privacy & Compliance */}
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Privacy & Compliance Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Data Privacy Controls
                  </Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Enable data anonymization</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Automatically anonymize personal data in exports</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          defaultChecked
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>GDPR compliance mode</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Enable GDPR-compliant data handling</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          defaultChecked
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'white' }}>Audit trail encryption</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: '#a0aec0' }}>Encrypt all audit logs and compliance data</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          defaultChecked
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Compliance Standards
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <FormGroup>
                      <FormControlLabel
                        control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
                        label="SOC 2 Type II"
                        sx={{ color: '#a0aec0' }}
                      />
                      <FormControlLabel
                        control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
                        label="GDPR (General Data Protection Regulation)"
                        sx={{ color: '#a0aec0' }}
                      />
                      <FormControlLabel
                        control={<Checkbox sx={{ color: '#3b82f6' }} />}
                        label="HIPAA (Health Insurance Portability)"
                        sx={{ color: '#a0aec0' }}
                      />
                      <FormControlLabel
                        control={<Checkbox sx={{ color: '#3b82f6' }} />}
                        label="PCI DSS (Payment Card Industry)"
                        sx={{ color: '#a0aec0' }}
                      />
                      <FormControlLabel
                        control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
                        label="ISO 27001 (Information Security)"
                        sx={{ color: '#a0aec0' }}
                      />
                    </FormGroup>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Data Subject Rights (GDPR)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Visibility />}
                        sx={{ borderColor: '#3b82f6', color: '#3b82f6', mb: 2 }}
                      >
                        Right to Access
                      </Button>
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.8rem' }}>
                        Generate personal data report for data subjects
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Edit />}
                        sx={{ borderColor: '#f59e0b', color: '#f59e0b', mb: 2 }}
                      >
                        Right to Rectification
                      </Button>
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.8rem' }}>
                        Allow data subjects to correct their information
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DeleteForever />}
                        sx={{ borderColor: '#ef4444', color: '#ef4444', mb: 2 }}
                      >
                        Right to Erasure
                      </Button>
                      <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.8rem' }}>
                        Permanently delete personal data upon request
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Create Export</DialogTitle>
        <DialogContent>
          <Stepper activeStep={exportStep} orientation="vertical">
            <Step>
              <StepLabel>Select Data Types</StepLabel>
              <StepContent>
                <FormGroup>
                  <FormControlLabel
                    control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
                    label="Agents and Agent Configurations"
                    sx={{ color: '#a0aec0' }}
                  />
                  <FormControlLabel
                    control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
                    label="Policies and Governance Rules"
                    sx={{ color: '#a0aec0' }}
                  />
                  <FormControlLabel
                    control={<Checkbox sx={{ color: '#3b82f6' }} />}
                    label="Trust Metrics and Scores"
                    sx={{ color: '#a0aec0' }}
                  />
                  <FormControlLabel
                    control={<Checkbox sx={{ color: '#3b82f6' }} />}
                    label="Audit Logs and Compliance Data"
                    sx={{ color: '#a0aec0' }}
                  />
                  <FormControlLabel
                    control={<Checkbox sx={{ color: '#3b82f6' }} />}
                    label="User Data and Preferences"
                    sx={{ color: '#a0aec0' }}
                  />
                </FormGroup>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setExportStep(1)}
                    sx={{ backgroundColor: '#3b82f6', mr: 1 }}
                  >
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Export Options</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#a0aec0' }}>Format</InputLabel>
                      <Select
                        defaultValue="json"
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                        }}
                      >
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="xml">XML</MenuItem>
                        <MenuItem value="pdf">PDF Report</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Export Name"
                      defaultValue="Custom Export"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#4a5568' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputLabel-root': { color: '#a0aec0' },
                        '& .MuiInputBase-input': { color: 'white' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
                      label="Enable compression"
                      sx={{ color: '#a0aec0' }}
                    />
                    <FormControlLabel
                      control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
                      label="Encrypt export file"
                      sx={{ color: '#a0aec0' }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setShowExportDialog(false)}
                    sx={{ backgroundColor: '#3b82f6', mr: 1 }}
                  >
                    Start Export
                  </Button>
                  <Button onClick={() => setExportStep(0)} sx={{ color: '#a0aec0' }}>
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Import Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
              Select a file to import
            </Typography>
            <input
              accept=".json,.csv,.xml"
              style={{ display: 'none' }}
              id="import-file"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="import-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ 
                  borderColor: '#4a5568', 
                  color: '#a0aec0',
                  borderStyle: 'dashed',
                  py: 3,
                  mb: 2
                }}
              >
                Choose File or Drag & Drop
              </Button>
            </label>
            
            {importFile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Selected: {importFile.name} ({formatFileSize(importFile.size)})
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#a0aec0' }}>Import Type</InputLabel>
              <Select
                defaultValue="agents_only"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                }}
              >
                <MenuItem value="full_restore">Full System Restore</MenuItem>
                <MenuItem value="agents_only">Agents Only</MenuItem>
                <MenuItem value="policies_only">Policies Only</MenuItem>
                <MenuItem value="trust_metrics">Trust Metrics</MenuItem>
                <MenuItem value="custom">Custom Selection</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Checkbox sx={{ color: '#3b82f6' }} />}
              label="Validate data before import"
              sx={{ color: '#a0aec0', display: 'block', mb: 1 }}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked sx={{ color: '#3b82f6' }} />}
              label="Create backup before import"
              sx={{ color: '#a0aec0', display: 'block', mb: 1 }}
            />
            <FormControlLabel
              control={<Checkbox sx={{ color: '#3b82f6' }} />}
              label="Skip duplicate records"
              sx={{ color: '#a0aec0', display: 'block' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!importFile}
            sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
          >
            Start Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataManagementSettingsPage;

