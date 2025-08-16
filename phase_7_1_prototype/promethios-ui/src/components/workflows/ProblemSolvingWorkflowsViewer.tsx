/**
 * Problem-Solving Workflows Viewer Component
 * 
 * UI component for viewing and managing problem-solving workflows in the Command Center.
 * Handles debugging sessions, decision trees, solution architectures, and optimization strategies.
 * Provides workflow execution, template management, and clickable integration with chat interface.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Search,
  Add,
  FilterList,
  Share,
  Download,
  Visibility,
  Edit,
  Delete,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Launch,
  BugReport,
  AccountTree,
  Architecture,
  Speed,
  Timeline,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Group,
  Star,
  TrendingUp,
  Assessment,
  Build,
  Settings,
  Code,
  Storage,
  Security,
  CloudQueue,
  DeviceHub,
  Memory,
  Router,
  Api,
  DataUsage,
  Insights,
  Psychology,
  Engineering,
  Science,
  Analytics,
  Lightbulb,
  Flag,
  PriorityHigh
} from '@mui/icons-material';
import { ProblemSolvingWorkflowsExtension, DebuggingSession, DecisionTree, SolutionArchitecture, OptimizationStrategy, WorkflowExecution } from '../../extensions/ProblemSolvingWorkflowsExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface ProblemSolvingWorkflowsViewerProps {
  chatbot: any;
  onWorkflowLoad: (workflow: any) => void;
  onExecutionLoad: (execution: WorkflowExecution) => void;
}

interface SearchFilters {
  keywords: string;
  workflowType: string;
  category: string;
  domain: string;
  status: string;
  priority: string;
  dateRange: string;
}

const workflowTypeIcons: Record<string, React.ReactElement> = {
  'debugging': <BugReport />,
  'decision': <AccountTree />,
  'architecture': <Architecture />,
  'optimization': <Speed />
};

const workflowTypeColors: Record<string, string> = {
  'debugging': '#ef4444',
  'decision': '#10b981',
  'architecture': '#3b82f6',
  'optimization': '#f59e0b'
};

const statusColors: Record<string, string> = {
  'pending': '#6b7280',
  'in_progress': '#3b82f6',
  'running': '#3b82f6',
  'completed': '#10b981',
  'failed': '#ef4444',
  'cancelled': '#6b7280',
  'paused': '#f59e0b',
  'resolved': '#10b981',
  'blocked': '#ef4444'
};

const priorityColors: Record<string, string> = {
  'low': '#6b7280',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'critical': '#dc2626'
};

const severityColors: Record<string, string> = {
  'low': '#10b981',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'critical': '#dc2626'
};

export const ProblemSolvingWorkflowsViewer: React.FC<ProblemSolvingWorkflowsViewerProps> = ({
  chatbot,
  onWorkflowLoad,
  onExecutionLoad
}) => {
  // State management
  const [workflowsExtension] = useState(() => new ProblemSolvingWorkflowsExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0: All Workflows, 1: Debugging, 2: Decisions, 3: Architecture, 4: Optimization, 5: Executions, 6: Templates
  
  // Data state
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<any[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<WorkflowExecution[]>([]);
  
  // UI state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keywords: '',
    workflowType: '',
    category: '',
    domain: '',
    status: '',
    priority: '',
    dateRange: 'all'
  });
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Initialize component
  useEffect(() => {
    initializeWorkflowsRepository();
  }, []);

  const initializeWorkflowsRepository = async () => {
    try {
      setLoading(true);
      
      // Initialize extensions
      await workflowsExtension.initialize();
      await governanceService.initialize();
      
      // Load workflow data
      await loadWorkflowData();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize workflows repository:', error);
      setLoading(false);
    }
  };

  const loadWorkflowData = async () => {
    try {
      // Search for all workflows
      const workflowResults = await workflowsExtension.searchWorkflows({
        agentId: chatbot.id
      });
      
      setWorkflows(workflowResults || []);
      setFilteredWorkflows(workflowResults || []);
      
      // Load executions and templates
      setExecutions([]);
      setFilteredExecutions([]);
      setTemplates([]);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
    }
  };

  // Search and filtering
  const handleSearch = useCallback(async () => {
    try {
      const searchQuery = {
        keywords: searchFilters.keywords ? searchFilters.keywords.split(' ') : undefined,
        category: searchFilters.category || undefined,
        domain: searchFilters.domain || undefined,
        status: searchFilters.status || undefined,
        agentId: chatbot.id
      };

      const workflowResults = await workflowsExtension.searchWorkflows(searchQuery);
      setFilteredWorkflows(workflowResults);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchFilters, chatbot.id, workflowsExtension]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchFilters.keywords || searchFilters.workflowType || searchFilters.category || searchFilters.status) {
        handleSearch();
      } else {
        setFilteredWorkflows(workflows);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchFilters, workflows, handleSearch]);

  // Event handlers
  const handleLoadWorkflowIntoChat = async (workflow: any) => {
    try {
      // Load workflow context into chat
      await governanceService.loadWorkflowContext(workflow.id);
      onWorkflowLoad(workflow);
    } catch (error) {
      console.error('Failed to load workflow into chat:', error);
    }
  };

  const handleExecuteWorkflow = async (workflow: any) => {
    try {
      const execution = await workflowsExtension.executeWorkflow(workflow.id, chatbot.id);
      setExecutions(prev => [...prev, execution]);
      setFilteredExecutions(prev => [...prev, execution]);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const handleShareWorkflow = async (workflow: any, targetAgents: string[]) => {
    try {
      await workflowsExtension.shareWorkflow(
        workflow.id,
        targetAgents,
        chatbot.id,
        ['read', 'execute', 'comment']
      );
    } catch (error) {
      console.error('Failed to share workflow:', error);
    }
  };

  const handleLoadAnalytics = async () => {
    try {
      const analyticsData = await workflowsExtension.getWorkflowAnalytics(chatbot.id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const getWorkflowType = (workflow: any): string => {
    if ('problemStatement' in workflow) return 'debugging';
    if ('rootNode' in workflow) return 'decision';
    if ('architecture' in workflow) return 'architecture';
    if ('target' in workflow) return 'optimization';
    return 'unknown';
  };

  const getWorkflowTitle = (workflow: any): string => {
    return workflow.title || workflow.name || 'Untitled Workflow';
  };

  const getWorkflowDescription = (workflow: any): string => {
    return workflow.description || 'No description available';
  };

  const getWorkflowStatus = (workflow: any): string => {
    if ('outcomes' in workflow) return workflow.outcomes?.resolved ? 'resolved' : 'in_progress';
    if ('implementation' in workflow) return workflow.implementation?.selectedAlternative ? 'completed' : 'pending';
    return workflow.status || 'pending';
  };

  const getWorkflowPriority = (workflow: any): string => {
    if ('priority' in workflow) return workflow.priority;
    if ('problemStatement' in workflow) return workflow.problemStatement?.impact?.severity || 'medium';
    if ('context' in workflow) return workflow.context?.riskTolerance === 'low' ? 'high' : 'medium';
    return 'medium';
  };

  const getWorkflowMetrics = (workflow: any): any => {
    if ('metrics' in workflow) return workflow.metrics;
    if ('analysis' in workflow) return { confidence: workflow.analysis?.confidence || 0.5 };
    return { confidence: 0.5 };
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const renderWorkflowCard = (workflow: any) => {
    const workflowType = getWorkflowType(workflow);
    const typeIcon = workflowTypeIcons[workflowType] || <Build />;
    const typeColor = workflowTypeColors[workflowType] || '#6b7280';
    const status = getWorkflowStatus(workflow);
    const priority = getWorkflowPriority(workflow);
    const metrics = getWorkflowMetrics(workflow);

    return (
      <Card
        key={workflow.id}
        sx={{
          mb: 2,
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
        }}
        onClick={() => handleLoadWorkflowIntoChat(workflow)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {/* Type Icon */}
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: typeColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {typeIcon}
              </Box>

              {/* Workflow Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {getWorkflowTitle(workflow)}
                  </Typography>
                  <Chip
                    label={workflowType.replace('_', ' ')}
                    size="small"
                    sx={{
                      bgcolor: typeColor,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip
                    label={status}
                    size="small"
                    sx={{
                      bgcolor: statusColors[status] || '#6b7280',
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip
                    label={priority}
                    size="small"
                    sx={{
                      bgcolor: priorityColors[priority] || '#6b7280',
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {getWorkflowDescription(workflow)}
                </Typography>

                {/* Workflow-specific details */}
                {workflowType === 'debugging' && workflow.problemStatement && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Severity: {workflow.problemStatement.impact?.severity} • 
                      Affected Users: {workflow.problemStatement.impact?.affectedUsers || 'Unknown'} • 
                      Methodology: {workflow.methodology}
                    </Typography>
                    {workflow.hypotheses && workflow.hypotheses.length > 0 && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Hypotheses: {workflow.hypotheses.length} • 
                        Tested: {workflow.hypotheses.filter((h: any) => h.tested).length} • 
                        Confirmed: {workflow.hypotheses.filter((h: any) => h.result === 'confirmed').length}
                      </Typography>
                    )}
                  </Box>
                )}

                {workflowType === 'decision' && workflow.alternatives && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Alternatives: {workflow.alternatives.length} • 
                      Criteria: {workflow.criteria?.length || 0} • 
                      Method: {workflow.analysis?.method || 'Not specified'}
                    </Typography>
                    {workflow.analysis?.results?.recommendedAlternative && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Recommended: {workflow.alternatives.find((a: any) => a.id === workflow.analysis.results.recommendedAlternative)?.name || 'Unknown'}
                      </Typography>
                    )}
                  </Box>
                )}

                {workflowType === 'architecture' && workflow.architecture && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Domain: {workflow.domain} • 
                      Components: {workflow.architecture.components?.length || 0} • 
                      Patterns: {workflow.architecture.patterns?.length || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Complexity: {((workflow.metrics?.complexity || 0.5) * 100).toFixed(0)}% • 
                      Scalability: {((workflow.metrics?.scalability || 0.5) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}

                {workflowType === 'optimization' && workflow.target && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Target: {workflow.target.metric} • 
                      Current: {workflow.target.currentState?.baseline} {workflow.target.currentState?.unit} • 
                      Goal: {workflow.target.desiredState?.target} {workflow.target.desiredState?.unit}
                    </Typography>
                    {workflow.strategies && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Strategies: {workflow.strategies.length} • 
                        Expected Improvement: {workflow.target.desiredState?.improvement || 0}%
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Metrics */}
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'Unknown date'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star sx={{ fontSize: 16, color: '#f59e0b' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {metrics.confidence ? `${(metrics.confidence * 100).toFixed(0)}% confidence` : 'No metrics'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
              <Tooltip title="Load into Chat">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadWorkflowIntoChat(workflow);
                  }}
                  sx={{ color: '#10b981' }}
                >
                  <Launch />
                </IconButton>
              </Tooltip>
              <Tooltip title="Execute Workflow">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExecuteWorkflow(workflow);
                  }}
                  sx={{ color: '#3b82f6' }}
                >
                  <PlayArrow />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkflow(workflow);
                    setShowWorkflowDetails(true);
                  }}
                  sx={{ color: '#94a3b8' }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Workflow">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open share dialog
                  }}
                  sx={{ color: '#94a3b8' }}
                >
                  <Share />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Progress Bar for Status */}
          {(status === 'in_progress' || status === 'running') && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Progress
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {workflowType === 'debugging' && workflow.workflow ? 
                    `${workflow.workflow.filter((s: any) => s.status === 'completed').length}/${workflow.workflow.length} steps` :
                    'In Progress'
                  }
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={workflowType === 'debugging' && workflow.workflow ? 
                  (workflow.workflow.filter((s: any) => s.status === 'completed').length / workflow.workflow.length) * 100 :
                  50
                }
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: '#374151',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: statusColors[status] || '#3b82f6'
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Loading Problem-Solving Workflows...
        </Typography>
        <LinearProgress sx={{ bgcolor: '#374151', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' } }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #374151' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <Build sx={{ mr: 1, color: '#3b82f6' }} />
            Problem-Solving Workflows
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Create New Workflow">
              <IconButton
                size="small"
                onClick={() => setShowCreateDialog(true)}
                sx={{ color: '#10b981' }}
              >
                <Add />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Analytics">
              <IconButton
                size="small"
                onClick={handleLoadAnalytics}
                sx={{ color: '#3b82f6' }}
              >
                <Assessment />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={loadWorkflowData}
                sx={{ color: '#94a3b8' }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search workflows..."
            value={searchFilters.keywords}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, keywords: e.target.value }))}
            InputProps={{
              startAdornment: <Search sx={{ color: '#94a3b8', mr: 1 }} />,
              sx: {
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
              }
            }}
          />
        </Box>

        <Grid container spacing={1}>
          <Grid item xs={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Type</InputLabel>
              <Select
                value={searchFilters.workflowType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, workflowType: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="debugging">Debugging</MenuItem>
                <MenuItem value="decision">Decision Trees</MenuItem>
                <MenuItem value="architecture">Architecture</MenuItem>
                <MenuItem value="optimization">Optimization</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Status</InputLabel>
              <Select
                value={searchFilters.status}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Priority</InputLabel>
              <Select
                value={searchFilters.priority}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, priority: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Domain</InputLabel>
              <Select
                value={searchFilters.domain}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, domain: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Domains</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="business">Business</MenuItem>
                <MenuItem value="process">Process</MenuItem>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="software">Software</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #374151' }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { color: '#94a3b8', minHeight: 40 },
            '& .Mui-selected': { color: '#3b82f6' },
            '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
          }}
        >
          <Tab label={`All (${filteredWorkflows.length})`} />
          <Tab label={`Debugging (${filteredWorkflows.filter(w => getWorkflowType(w) === 'debugging').length})`} />
          <Tab label={`Decisions (${filteredWorkflows.filter(w => getWorkflowType(w) === 'decision').length})`} />
          <Tab label={`Architecture (${filteredWorkflows.filter(w => getWorkflowType(w) === 'architecture').length})`} />
          <Tab label={`Optimization (${filteredWorkflows.filter(w => getWorkflowType(w) === 'optimization').length})`} />
          <Tab label={`Executions (${filteredExecutions.length})`} />
          <Tab label={`Templates (${templates.length})`} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTab === 0 && (
          <Box>
            {/* All Workflows */}
            {filteredWorkflows.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Build sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No workflows found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Create First Workflow
                </Button>
              </Box>
            ) : (
              <Box>
                {filteredWorkflows.map(renderWorkflowCard)}
              </Box>
            )}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            {/* Debugging Sessions */}
            {filteredWorkflows.filter(w => getWorkflowType(w) === 'debugging').map(renderWorkflowCard)}
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            {/* Decision Trees */}
            {filteredWorkflows.filter(w => getWorkflowType(w) === 'decision').map(renderWorkflowCard)}
          </Box>
        )}

        {selectedTab === 3 && (
          <Box>
            {/* Solution Architectures */}
            {filteredWorkflows.filter(w => getWorkflowType(w) === 'architecture').map(renderWorkflowCard)}
          </Box>
        )}

        {selectedTab === 4 && (
          <Box>
            {/* Optimization Strategies */}
            {filteredWorkflows.filter(w => getWorkflowType(w) === 'optimization').map(renderWorkflowCard)}
          </Box>
        )}

        {selectedTab === 5 && (
          <Box>
            {/* Workflow Executions */}
            {filteredExecutions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PlayArrow sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                  No workflow executions found
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                Execution history coming soon
              </Typography>
            )}
          </Box>
        )}

        {selectedTab === 6 && (
          <Box>
            {/* Workflow Templates */}
            {templates.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Settings sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                  No workflow templates found
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                Template management coming soon
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Create Workflow Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Create New Workflow
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8' }}>
            Workflow creation form would be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Create Workflow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workflow Details Dialog */}
      <Dialog
        open={showWorkflowDetails}
        onClose={() => setShowWorkflowDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Workflow Details - {selectedWorkflow ? getWorkflowTitle(selectedWorkflow) : ''}
        </DialogTitle>
        <DialogContent>
          {selectedWorkflow && (
            <Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                {getWorkflowDescription(selectedWorkflow)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Type: {getWorkflowType(selectedWorkflow)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Status: {getWorkflowStatus(selectedWorkflow)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Priority: {getWorkflowPriority(selectedWorkflow)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWorkflowDetails(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedWorkflow) {
                handleLoadWorkflowIntoChat(selectedWorkflow);
              }
              setShowWorkflowDetails(false);
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Load into Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

