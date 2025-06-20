/**
 * Governance Reports Page
 * 
 * Comprehensive reporting interface for governance metrics, compliance reports,
 * audit trails, and exportable reports for both single agents and multi-agent systems.
 */

import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  DatePicker,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Assessment,
  Download,
  Schedule,
  Visibility,
  Share,
  Email,
  Print,
  PictureAsPdf,
  TableChart,
  BarChart,
  Timeline,
  Security,
  Gavel,
  Person,
  Group,
  TrendingUp,
  CheckCircle,
  Warning,
  Error,
  Info,
  ExpandMore,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  FilterList,
  CalendarToday,
  CloudDownload,
  Settings
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { LocalizationProvider, DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'audit' | 'performance' | 'security' | 'custom';
  format: 'pdf' | 'excel' | 'json' | 'csv';
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  sections: ReportSection[];
  filters: ReportFilter[];
  created_at: string;
  last_generated: string;
  icon: React.ReactNode;
  color: string;
}

interface ReportSection {
  id: string;
  name: string;
  type: 'summary' | 'chart' | 'table' | 'metrics' | 'violations' | 'trends';
  data_source: 'prism' | 'vigil' | 'governance' | 'multi_agent' | 'combined';
  enabled: boolean;
  config: Record<string, any>;
}

interface ReportFilter {
  id: string;
  name: string;
  type: 'agent_selection' | 'date_range' | 'severity' | 'status' | 'category';
  required: boolean;
  default_value: any;
}

interface GeneratedReport {
  id: string;
  template_id: string;
  template_name: string;
  generated_at: string;
  generated_by: string;
  file_path: string;
  file_size: number;
  format: string;
  status: 'generating' | 'completed' | 'failed';
  download_count: number;
  filters_applied: Record<string, any>;
}

interface ReportMetrics {
  total_reports: number;
  reports_this_month: number;
  most_popular_template: string;
  avg_generation_time: number;
  total_downloads: number;
  compliance_score: number;
  audit_coverage: number;
}

const GovernanceReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'templates' | 'generated' | 'scheduled'>('templates');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [reportMetrics, setReportMetrics] = useState<ReportMetrics | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [reportFilters, setReportFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    const initializeReportsData = () => {
      // Mock report templates
      const templates: ReportTemplate[] = [
        {
          id: 'compliance_monthly',
          name: 'Monthly Compliance Report',
          description: 'Comprehensive monthly compliance overview for all agents',
          category: 'compliance',
          format: 'pdf',
          schedule: 'monthly',
          icon: <Gavel />,
          color: '#10B981',
          created_at: '2025-06-01T00:00:00Z',
          last_generated: '2025-06-20T09:00:00Z',
          sections: [
            {
              id: 'exec_summary',
              name: 'Executive Summary',
              type: 'summary',
              data_source: 'combined',
              enabled: true,
              config: { include_trends: true, highlight_issues: true }
            },
            {
              id: 'compliance_metrics',
              name: 'Compliance Metrics',
              type: 'metrics',
              data_source: 'governance',
              enabled: true,
              config: { show_targets: true, include_benchmarks: true }
            },
            {
              id: 'violation_trends',
              name: 'Violation Trends',
              type: 'chart',
              data_source: 'combined',
              enabled: true,
              config: { chart_type: 'line', time_period: '30d' }
            },
            {
              id: 'agent_performance',
              name: 'Agent Performance Table',
              type: 'table',
              data_source: 'combined',
              enabled: true,
              config: { sort_by: 'compliance_score', include_details: true }
            }
          ],
          filters: [
            {
              id: 'date_range',
              name: 'Date Range',
              type: 'date_range',
              required: true,
              default_value: { start: '2025-05-20', end: '2025-06-20' }
            },
            {
              id: 'agent_filter',
              name: 'Agent Selection',
              type: 'agent_selection',
              required: false,
              default_value: []
            }
          ]
        },
        {
          id: 'security_audit',
          name: 'Security Audit Report',
          description: 'Detailed security audit with PRISM and VIGIL data',
          category: 'security',
          format: 'pdf',
          schedule: 'weekly',
          icon: <Security />,
          color: '#3B82F6',
          created_at: '2025-06-01T00:00:00Z',
          last_generated: '2025-06-19T09:00:00Z',
          sections: [
            {
              id: 'security_overview',
              name: 'Security Overview',
              type: 'summary',
              data_source: 'combined',
              enabled: true,
              config: { focus: 'security', include_recommendations: true }
            },
            {
              id: 'prism_analysis',
              name: 'PRISM Analysis',
              type: 'chart',
              data_source: 'prism',
              enabled: true,
              config: { chart_type: 'bar', metrics: ['tool_usage', 'violations'] }
            },
            {
              id: 'vigil_monitoring',
              name: 'VIGIL Monitoring',
              type: 'chart',
              data_source: 'vigil',
              enabled: true,
              config: { chart_type: 'pie', focus: 'trust_scores' }
            }
          ],
          filters: [
            {
              id: 'severity_filter',
              name: 'Minimum Severity',
              type: 'severity',
              required: false,
              default_value: 'medium'
            }
          ]
        },
        {
          id: 'performance_dashboard',
          name: 'Performance Dashboard',
          description: 'Real-time performance metrics and KPIs',
          category: 'performance',
          format: 'excel',
          schedule: 'daily',
          icon: <Assessment />,
          color: '#F59E0B',
          created_at: '2025-06-01T00:00:00Z',
          last_generated: '2025-06-20T06:00:00Z',
          sections: [
            {
              id: 'kpi_metrics',
              name: 'Key Performance Indicators',
              type: 'metrics',
              data_source: 'combined',
              enabled: true,
              config: { include_targets: true, show_variance: true }
            },
            {
              id: 'trend_analysis',
              name: 'Trend Analysis',
              type: 'chart',
              data_source: 'combined',
              enabled: true,
              config: { chart_type: 'area', time_period: '7d' }
            }
          ],
          filters: []
        },
        {
          id: 'multi_agent_coordination',
          name: 'Multi-Agent Coordination Report',
          description: 'Specialized report for multi-agent system governance',
          category: 'audit',
          format: 'pdf',
          schedule: 'weekly',
          icon: <Group />,
          color: '#8B5CF6',
          created_at: '2025-06-15T00:00:00Z',
          last_generated: '2025-06-20T10:00:00Z',
          sections: [
            {
              id: 'coordination_metrics',
              name: 'Coordination Metrics',
              type: 'metrics',
              data_source: 'multi_agent',
              enabled: true,
              config: { focus: 'collaboration', include_efficiency: true }
            },
            {
              id: 'shared_context_analysis',
              name: 'Shared Context Analysis',
              type: 'chart',
              data_source: 'multi_agent',
              enabled: true,
              config: { chart_type: 'line', metric: 'context_utilization' }
            },
            {
              id: 'governance_compliance',
              name: 'Governance Compliance',
              type: 'table',
              data_source: 'governance',
              enabled: true,
              config: { focus: 'multi_agent_policies' }
            }
          ],
          filters: [
            {
              id: 'system_filter',
              name: 'Multi-Agent Systems',
              type: 'agent_selection',
              required: true,
              default_value: []
            }
          ]
        }
      ];

      // Mock generated reports
      const generated: GeneratedReport[] = [
        {
          id: 'report_001',
          template_id: 'compliance_monthly',
          template_name: 'Monthly Compliance Report',
          generated_at: '2025-06-20T09:00:00Z',
          generated_by: 'system',
          file_path: '/reports/compliance_monthly_2025_06.pdf',
          file_size: 2.4,
          format: 'pdf',
          status: 'completed',
          download_count: 12,
          filters_applied: { date_range: '2025-05-20 to 2025-06-20', agents: 'all' }
        },
        {
          id: 'report_002',
          template_id: 'security_audit',
          template_name: 'Security Audit Report',
          generated_at: '2025-06-19T09:00:00Z',
          generated_by: 'admin',
          file_path: '/reports/security_audit_2025_06_19.pdf',
          file_size: 1.8,
          format: 'pdf',
          status: 'completed',
          download_count: 8,
          filters_applied: { severity: 'medium+', agents: 'financial_agents' }
        },
        {
          id: 'report_003',
          template_id: 'performance_dashboard',
          template_name: 'Performance Dashboard',
          generated_at: '2025-06-20T06:00:00Z',
          generated_by: 'system',
          file_path: '/reports/performance_dashboard_2025_06_20.xlsx',
          file_size: 0.9,
          format: 'excel',
          status: 'completed',
          download_count: 5,
          filters_applied: {}
        }
      ];

      // Mock metrics
      const metrics: ReportMetrics = {
        total_reports: 47,
        reports_this_month: 12,
        most_popular_template: 'Monthly Compliance Report',
        avg_generation_time: 2.3,
        total_downloads: 156,
        compliance_score: 94,
        audit_coverage: 87
      };

      setReportTemplates(templates);
      setGeneratedReports(generated);
      setReportMetrics(metrics);
      setAvailableAgents([
        'Financial Advisor Agent',
        'Customer Support Team',
        'Legal Advisor Agent',
        'Research Analysis Team',
        'Customer Service Agent'
      ]);
    };

    initializeReportsData();
  }, []);

  const handleGenerateReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportFilters({});
    setGenerationStep(0);
    setGenerateDialogOpen(true);
  };

  const handleScheduleReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setScheduleDialogOpen(true);
  };

  const handlePreviewReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${btoa('Mock report content')}`;
    link.download = `${report.template_name.replace(/\s+/g, '_')}_${report.id}.${report.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PictureAsPdf />;
      case 'excel': return <TableChart />;
      case 'json': return <BarChart />;
      case 'csv': return <TableChart />;
      default: return <Assessment />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'compliance': return '#10B981';
      case 'audit': return '#3B82F6';
      case 'performance': return '#F59E0B';
      case 'security': return '#EF4444';
      case 'custom': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'generating': return <Schedule sx={{ color: '#F59E0B' }} />;
      case 'failed': return <Error sx={{ color: '#EF4444' }} />;
      default: return <Info />;
    }
  };

  const exportAllReports = () => {
    const exportData = {
      templates: reportTemplates,
      generated_reports: generatedReports,
      metrics: reportMetrics,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance_reports_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box 
      p={4}
      sx={{ 
        backgroundColor: '#1a202c',
        minHeight: '100vh',
        color: 'white'
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Governance Reports
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Generate, schedule, and manage governance reports for compliance and audit
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
            startIcon={<CloudDownload />}
            onClick={exportAllReports}
          >
            Export All
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Template
          </Button>
        </Box>
      </Box>

      {/* Metrics Summary */}
      {reportMetrics && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {reportMetrics.total_reports}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Total Reports
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
                      {reportMetrics.reports_this_month}
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
                      {reportMetrics.total_downloads}
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
                      {reportMetrics.avg_generation_time}s
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Avg Generation
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#F59E0B' }}>
                    <Schedule />
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
                      {reportMetrics.compliance_score}%
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
                      {reportMetrics.audit_coverage}%
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

      {/* View Mode Toggle */}
      <Box mb={4}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          aria-label="view mode"
        >
          <ToggleButton value="templates" aria-label="templates">
            <Assessment sx={{ mr: 1 }} />
            Report Templates
          </ToggleButton>
          <ToggleButton value="generated" aria-label="generated">
            <Download sx={{ mr: 1 }} />
            Generated Reports
          </ToggleButton>
          <ToggleButton value="scheduled" aria-label="scheduled">
            <Schedule sx={{ mr: 1 }} />
            Scheduled Reports
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Report Templates View */}
      {viewMode === 'templates' && (
        <Grid container spacing={3}>
          {reportTemplates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%', backgroundColor: '#2d3748', color: 'white' }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: template.color }}>
                      {template.icon}
                    </Avatar>
                  }
                  title={<Typography variant="h6" sx={{ color: 'white' }}>{template.name}</Typography>}
                  subheader={
                    <Box display="flex" gap={1} mt={1}>
                      <Chip
                        label={template.category.toUpperCase()}
                        size="small"
                        sx={{ bgcolor: getCategoryColor(template.category), color: 'white' }}
                      />
                      <Chip
                        label={template.format.toUpperCase()}
                        size="small"
                        variant="outlined" 
                        sx={{ backgroundColor: '#4a5568', color: 'white', borderColor: '#4a5568' }}
                      />
                    </Box>
                  }
                />
                <CardContent>
                  <Typography variant="body2" sx={{ color: '#a0aec0' }} paragraph>
                    {template.description}
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="subtitle2" sx={{ color: 'white' }} gutterBottom>
                      Sections ({template.sections.length})
                    </Typography>
                    {template.sections.slice(0, 3).map((section) => (
                      <Chip
                        key={section.id}
                        label={section.name}
                        size="small"
                        variant="outlined" 
                        sx={{ mr: 0.5, mb: 0.5, backgroundColor: '#4a5568', color: 'white', borderColor: '#4a5568' }}
                      />
                    ))}
                    {template.sections.length > 3 && (
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        +{template.sections.length - 3} more
                      </Typography>
                    )}
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Schedule: {template.schedule}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Last Generated: {new Date(template.last_generated).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleGenerateReport(template)}
                      sx={{ backgroundColor: '#3182ce', '&:hover': { backgroundColor: '#2c5aa0' } }}
                    >
                      Generate
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handlePreviewReport(template)}
                      sx={{ backgroundColor: '#4a5568', color: 'white', borderColor: '#4a5568', '&:hover': { backgroundColor: '#2d3748' } }}
                    >
                      Preview
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Schedule />}
                      onClick={() => handleScheduleReport(template)}
                      sx={{ backgroundColor: '#4a5568', color: 'white', borderColor: '#4a5568', '&:hover': { backgroundColor: '#2d3748' } }}
                    >
                      Schedule
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Generated Reports View */}
      {viewMode === 'generated' && (
        <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <CardHeader
            title="Generated Reports"
            subheader={`${generatedReports.length} reports available for download`}
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Generated</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Downloads</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.template_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                            ID: {report.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getFormatIcon(report.format)}
                          <Typography variant="body2" ml={1}>
                            {report.format.toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(report.generated_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          {new Date(report.generated_at).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.file_size} MB
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getStatusIcon(report.status)}
                          <Typography variant="body2" ml={1}>
                            {report.status}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.download_count}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadReport(report)}
                            disabled={report.status !== 'completed'}
                          >
                            <Download />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {/* Share report */}}
                          >
                            <Share />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {/* Delete report */}}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports View */}
      {viewMode === 'scheduled' && (
        <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <CardHeader
            title="Scheduled Reports"
            subheader="Automated report generation schedules"
          />
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Scheduled reports are automatically generated based on the configured schedule and filters.
            </Alert>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Template</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Next Run</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportTemplates
                    .filter(template => template.schedule !== 'manual')
                    .map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ bgcolor: template.color, mr: 2, width: 32, height: 32 }}>
                              {template.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {template.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                                {template.category}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={template.schedule}
                            size="small"
                            color="primary"
                            variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {/* Calculate next run based on schedule */}
                            {template.schedule === 'daily' && 'Tomorrow 09:00'}
                            {template.schedule === 'weekly' && 'Next Monday 09:00'}
                            {template.schedule === 'monthly' && 'July 1st 09:00'}
                            {template.schedule === 'quarterly' && 'October 1st 09:00'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            governance@company.com
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                            <IconButton size="small">
                              <Pause />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Stop />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Generate Report Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Stepper activeStep={generationStep} orientation="vertical">
                <Step>
                  <StepLabel>Configure Filters</StepLabel>
                  <StepContent>
                    <Grid container spacing={3}>
                      {selectedTemplate.filters.map((filter) => (
                        <Grid item xs={12} md={6} key={filter.id}>
                          {filter.type === 'agent_selection' && (
                            <Autocomplete
                              multiple
                              options={availableAgents}
                              value={reportFilters[filter.id] || filter.default_value || []}
                              onChange={(event, newValue) => 
                                setReportFilters({...reportFilters, [filter.id]: newValue})
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label={filter.name}
                                  required={filter.required}
                                />
                              )}
                            />
                          )}
                          {filter.type === 'date_range' && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                {filter.name}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    label="Start Date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    defaultValue={filter.default_value?.start}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    label="End Date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    defaultValue={filter.default_value?.end}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                          {filter.type === 'severity' && (
                            <FormControl fullWidth>
                              <InputLabel>{filter.name}</InputLabel>
                              <Select
                                value={reportFilters[filter.id] || filter.default_value || ''}
                                label={filter.name}
                                onChange={(e) => 
                                  setReportFilters({...reportFilters, [filter.id]: e.target.value})
                                }
                              >
                                <MenuItem value="low">Low and above</MenuItem>
                                <MenuItem value="medium">Medium and above</MenuItem>
                                <MenuItem value="high">High and above</MenuItem>
                                <MenuItem value="critical">Critical only</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </Grid>
                      ))}
                    </Grid>
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        onClick={() => setGenerationStep(1)}
                      >
                        Next
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel>Select Sections</StepLabel>
                  <StepContent>
                    <List>
                      {selectedTemplate.sections.map((section) => (
                        <ListItem key={section.id}>
                          <ListItemIcon>
                            <Checkbox
                              defaultChecked={section.enabled}
                              onChange={(e) => {
                                // Update section enabled state
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={section.name}
                            secondary={`Type: ${section.type} | Source: ${section.data_source}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Box mt={2} display="flex" gap={2}>
                      <Button onClick={() => setGenerationStep(0)}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setGenerationStep(2)}
                      >
                        Next
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel>Review & Generate</StepLabel>
                  <StepContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Review your configuration and click Generate to create the report.
                    </Alert>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Report Configuration:
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2">
                        Template: {selectedTemplate.name}
                      </Typography>
                      <Typography variant="body2">
                        Format: {selectedTemplate.format.toUpperCase()}
                      </Typography>
                      <Typography variant="body2">
                        Sections: {selectedTemplate.sections.filter(s => s.enabled).length} enabled
                      </Typography>
                    </Box>

                    <Box display="flex" gap={2}>
                      <Button onClick={() => setGenerationStep(1)}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          // Generate report
                          setGenerateDialogOpen(false);
                          setGenerationStep(0);
                        }}
                      >
                        Generate Report
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Report Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
                placeholder="e.g., Weekly Security Report"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  defaultValue=""
                  label="Category"
                >
                  <MenuItem value="compliance">Compliance</MenuItem>
                  <MenuItem value="audit">Audit</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                variant="outlined" sx={{ backgroundColor: '#2d3748', color: 'white' }}
                placeholder="Describe what this report template will generate..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Output Format</InputLabel>
                <Select
                  defaultValue="pdf"
                  label="Output Format"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Schedule</InputLabel>
                <Select
                  defaultValue="manual"
                  label="Schedule"
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Template</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                This is a preview of the report structure. Actual data will be populated when generated.
              </Alert>
              
              <Typography variant="h5" gutterBottom>
                {selectedTemplate.name}
              </Typography>
              
              {selectedTemplate.sections.map((section, index) => (
                <Card key={section.id} sx={{ mb: 2 }}>
                  <CardHeader
                    title={`${index + 1}. ${section.name}`}
                    subheader={`Type: ${section.type} | Source: ${section.data_source}`}
                  />
                  <CardContent>
                    {section.type === 'summary' && (
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Executive summary with key findings and recommendations
                      </Typography>
                    )}
                    {section.type === 'chart' && (
                      <Box height={200} display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5">
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                          Chart visualization will appear here
                        </Typography>
                      </Box>
                    )}
                    {section.type === 'table' && (
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Data table with detailed metrics and information
                      </Typography>
                    )}
                    {section.type === 'metrics' && (
                      <Grid container spacing={2}>
                        {[1, 2, 3, 4].map((i) => (
                          <Grid item xs={3} key={i}>
                            <Box textAlign="center" p={2} bgcolor="#f5f5f5">
                              <Typography variant="h4">--</Typography>
                              <Typography variant="caption">Metric {i}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialogOpen(false);
              if (selectedTemplate) {
                handleGenerateReport(selectedTemplate);
              }
            }}
          >
            Generate This Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GovernanceReportsPage;

