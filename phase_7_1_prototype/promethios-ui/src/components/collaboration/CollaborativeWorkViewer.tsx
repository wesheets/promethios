/**
 * Collaborative Work Viewer Component
 * 
 * UI component for viewing and managing collaborative work in the Command Center.
 * Handles multi-step projects, iterative refinements, feedback incorporation,
 * cross-session continuity, and project templates. Provides project management
 * capabilities and clickable integration with chat interface.
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
  CircularProgress,
  Switch,
  FormControlLabel,
  Slider,
  Rating,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
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
  Refresh,
  Launch,
  Group,
  Assignment,
  Timeline as TimelineIcon,
  Feedback,
  History,
  Description,
  Analytics,
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Star,
  ThumbUp,
  ThumbDown,
  Insights,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  People,
  PersonAdd,
  Settings,
  Tune,
  AutoFixHigh,
  Memory,
  Sync,
  SyncProblem,
  Verified,
  NewReleases,
  Update,
  Restore,
  Compare,
  ShowChart,
  BarChart,
  PieChart,
  DonutLarge,
  FolderOpen,
  Folder,
  Description,
  Code,
  BugReport,
  Build,
  School,
  Lightbulb,
  Flag,
  PriorityHigh,
  Block,
  CheckCircleOutline,
  RadioButtonUnchecked,
  AccessTime,
  Event,
  CalendarToday,
  Today,
  DateRange,
  AccountTree,
  Hub,
  Extension,
  Layers,
  ViewModule,
  Dashboard,
  Assessment
} from '@mui/icons-material';
import { CollaborativeWorkExtension, CollaborativeProject, IterativeRefinement, FeedbackIncorporation, CrossSessionContinuity, ProjectTemplate } from '../../extensions/CollaborativeWorkExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface CollaborativeWorkViewerProps {
  chatbot: any;
  onProjectLoad: (project: CollaborativeProject) => void;
  onRefinementLoad: (refinement: IterativeRefinement) => void;
  onFeedbackLoad: (feedback: FeedbackIncorporation) => void;
  onSessionLoad: (session: CrossSessionContinuity) => void;
}

interface SearchFilters {
  keywords: string;
  type: string;
  status: string;
  priority: string;
  participant: string;
  domain: string;
  complexity: string;
  businessValue: string;
  dateRange: string;
}

const projectTypeIcons: Record<string, React.ReactElement> = {
  'research': <School />,
  'development': <Code />,
  'analysis': <Assessment />,
  'creative': <Lightbulb />,
  'planning': <AccountTree />,
  'optimization': <Tune />,
  'documentation': <Description />
};

const projectTypeColors: Record<string, string> = {
  'research': '#3f51b5',
  'development': '#4caf50',
  'analysis': '#ff9800',
  'creative': '#e91e63',
  'planning': '#9c27b0',
  'optimization': '#00bcd4',
  'documentation': '#795548'
};

const statusColors: Record<string, string> = {
  'planning': '#6b7280',
  'active': '#10b981',
  'paused': '#f59e0b',
  'completed': '#059669',
  'cancelled': '#ef4444',
  'archived': '#4b5563'
};

const priorityColors: Record<string, string> = {
  'low': '#6b7280',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'critical': '#dc2626'
};

const complexityColors: Record<string, string> = {
  'low': '#10b981',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'very_high': '#dc2626'
};

const businessValueColors: Record<string, string> = {
  'low': '#6b7280',
  'medium': '#f59e0b',
  'high': '#10b981',
  'strategic': '#3b82f6'
};

export const CollaborativeWorkViewer: React.FC<CollaborativeWorkViewerProps> = ({
  chatbot,
  onProjectLoad,
  onRefinementLoad,
  onFeedbackLoad,
  onSessionLoad
}) => {
  // State management
  const [collaborativeExtension] = useState(() => new CollaborativeWorkExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Projects, 1: Refinements, 2: Feedback, 3: Sessions, 4: Templates, 5: Analytics
  
  // Data state
  const [projects, setProjects] = useState<CollaborativeProject[]>([]);
  const [refinements, setRefinements] = useState<IterativeRefinement[]>([]);
  const [feedback, setFeedback] = useState<FeedbackIncorporation[]>([]);
  const [sessions, setSessions] = useState<CrossSessionContinuity[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Filtered data
  const [filteredProjects, setFilteredProjects] = useState<CollaborativeProject[]>([]);
  const [filteredRefinements, setFilteredRefinements] = useState<IterativeRefinement[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackIncorporation[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<CrossSessionContinuity[]>([]);
  
  // UI state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keywords: '',
    type: '',
    status: '',
    priority: '',
    participant: '',
    domain: '',
    complexity: '',
    businessValue: '',
    dateRange: 'all'
  });
  const [selectedProject, setSelectedProject] = useState<CollaborativeProject | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeCollaborativeWork();
  }, []);

  const initializeCollaborativeWork = async () => {
    try {
      setLoading(true);
      
      // Initialize extensions
      await collaborativeExtension.initialize();
      await governanceService.initialize();
      
      // Load collaborative work data
      await loadCollaborativeWorkData();
      
      // Load analytics
      await loadAnalytics();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize collaborative work:', error);
      setLoading(false);
    }
  };

  const loadCollaborativeWorkData = async () => {
    try {
      // Search for projects
      const projectResults = await collaborativeExtension.searchProjects(chatbot.id, {});
      setProjects(projectResults || []);
      setFilteredProjects(projectResults || []);

      // Load refinements, feedback, sessions for each project
      const allRefinements: IterativeRefinement[] = [];
      const allFeedback: FeedbackIncorporation[] = [];
      const allSessions: CrossSessionContinuity[] = [];

      for (const project of projectResults) {
        // In a real implementation, these would be separate API calls
        // For now, we'll simulate with empty arrays
      }

      setRefinements(allRefinements);
      setFilteredRefinements(allRefinements);
      setFeedback(allFeedback);
      setFilteredFeedback(allFeedback);
      setSessions(allSessions);
      setFilteredSessions(allSessions);
    } catch (error) {
      console.error('Failed to load collaborative work data:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await collaborativeExtension.getCollaborativeWorkAnalytics(chatbot.id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Search and filtering
  const handleSearch = useCallback(async () => {
    try {
      const searchQuery = {
        keywords: searchFilters.keywords ? searchFilters.keywords.split(' ') : undefined,
        type: searchFilters.type || undefined,
        status: searchFilters.status || undefined,
        priority: searchFilters.priority || undefined,
        participant: searchFilters.participant || undefined,
        domain: searchFilters.domain || undefined,
        complexity: searchFilters.complexity || undefined,
        businessValue: searchFilters.businessValue || undefined
      };

      const results = await collaborativeExtension.searchProjects(chatbot.id, searchQuery);
      setFilteredProjects(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchFilters, chatbot.id, collaborativeExtension]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (Object.values(searchFilters).some(value => value && value !== 'all')) {
        handleSearch();
      } else {
        setFilteredProjects(projects);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchFilters, projects, handleSearch]);

  // Event handlers
  const handleLoadProjectIntoChat = async (project: CollaborativeProject) => {
    try {
      await governanceService.loadProjectContext(project.id);
      onProjectLoad(project);
    } catch (error) {
      console.error('Failed to load project into chat:', error);
    }
  };

  const handleLoadRefinementIntoChat = async (refinement: IterativeRefinement) => {
    try {
      await governanceService.loadRefinementContext(refinement.id);
      onRefinementLoad(refinement);
    } catch (error) {
      console.error('Failed to load refinement into chat:', error);
    }
  };

  const handleLoadFeedbackIntoChat = async (feedbackItem: FeedbackIncorporation) => {
    try {
      await governanceService.loadFeedbackContext(feedbackItem.id);
      onFeedbackLoad(feedbackItem);
    } catch (error) {
      console.error('Failed to load feedback into chat:', error);
    }
  };

  const handleLoadSessionIntoChat = async (session: CrossSessionContinuity) => {
    try {
      await governanceService.loadSessionContext(session.id);
      onSessionLoad(session);
    } catch (error) {
      console.error('Failed to load session into chat:', error);
    }
  };

  const getStatusCount = (status: string): number => {
    return filteredProjects.filter(project => project.status === status).length;
  };

  const getTypeCount = (type: string): number => {
    return filteredProjects.filter(project => project.type === type).length;
  };

  const renderProjectCard = (project: CollaborativeProject) => {
    const typeIcon = projectTypeIcons[project.type] || <Assignment />;
    const typeColor = projectTypeColors[project.type] || '#6b7280';
    const statusColor = statusColors[project.status] || '#6b7280';
    const priorityColor = priorityColors[project.priority] || '#6b7280';

    return (
      <Card
        key={project.id}
        sx={{
          mb: 2,
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
        }}
        onClick={() => handleLoadProjectIntoChat(project)}
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

              {/* Project Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {project.name}
                  </Typography>
                  <Chip
                    label={project.type}
                    size="small"
                    sx={{
                      bgcolor: typeColor,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip
                    label={project.status}
                    size="small"
                    sx={{
                      bgcolor: statusColor,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip
                    label={project.priority}
                    size="small"
                    sx={{
                      bgcolor: priorityColor,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {project.description}
                </Typography>

                {/* Project Details */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Domain: {project.metadata.domain} • 
                    Complexity: {project.metadata.complexity} • 
                    Business Value: {project.metadata.businessValue}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Participants: {project.participants.agents.length + project.participants.humans.length} • 
                    Phases: {project.timeline.phases.length} • 
                    Tasks: {project.progress.completedTasks}/{project.progress.totalTasks}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Quality Score: {(project.quality.qualityScore * 100).toFixed(0)}% • 
                    Review Status: {project.quality.reviewStatus} • 
                    Compliance: {project.quality.complianceStatus}
                  </Typography>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Overall Progress
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {(project.progress.overallProgress * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress.overallProgress * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: '#374151',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: project.progress.overallProgress > 0.8 ? '#10b981' : 
                                project.progress.overallProgress > 0.6 ? '#f59e0b' : '#3b82f6'
                      }
                    }}
                  />
                </Box>

                {/* Timeline */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Event sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Started: {project.timeline.startDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Duration: {project.timeline.estimatedDuration}h
                        {project.timeline.actualDuration && ` (${project.timeline.actualDuration}h actual)`}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Blockers and Risks */}
                {(project.progress.blockers.length > 0 || project.progress.risks.length > 0) && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    {project.progress.blockers.length > 0 && (
                      <Chip
                        icon={<Block />}
                        label={`${project.progress.blockers.length} blockers`}
                        size="small"
                        sx={{ bgcolor: '#ef4444', color: 'white', fontSize: '0.7rem' }}
                      />
                    )}
                    {project.progress.risks.length > 0 && (
                      <Chip
                        icon={<Warning />}
                        label={`${project.progress.risks.length} risks`}
                        size="small"
                        sx={{ bgcolor: '#f59e0b', color: 'white', fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
              <Tooltip title="Load into Chat">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadProjectIntoChat(project);
                  }}
                  sx={{ color: '#10b981' }}
                >
                  <Launch />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(project);
                    setShowProjectDetails(true);
                  }}
                  sx={{ color: '#94a3b8' }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Project">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open edit dialog
                  }}
                  sx={{ color: '#94a3b8' }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Project">
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
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Loading Collaborative Work...
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
            <Group sx={{ mr: 1, color: '#10b981' }} />
            Collaborative Work
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Create Project">
              <IconButton
                size="small"
                onClick={() => setShowCreateProject(true)}
                sx={{ color: '#10b981' }}
              >
                <Add />
              </IconButton>
            </Tooltip>
            <Tooltip title="Create from Template">
              <IconButton
                size="small"
                onClick={() => setShowCreateFromTemplate(true)}
                sx={{ color: '#3b82f6' }}
              >
                <Description />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Analytics">
              <IconButton
                size="small"
                onClick={loadAnalytics}
                sx={{ color: '#f59e0b' }}
              >
                <Analytics />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={loadCollaborativeWorkData}
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
            placeholder="Search collaborative work..."
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
          <Grid item xs={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Type</InputLabel>
              <Select
                value={searchFilters.type}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="development">Development</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
                <MenuItem value="creative">Creative</MenuItem>
                <MenuItem value="planning">Planning</MenuItem>
                <MenuItem value="optimization">Optimization</MenuItem>
                <MenuItem value="documentation">Documentation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
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
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="planning">Planning</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
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
          <Grid item xs={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Complexity</InputLabel>
              <Select
                value={searchFilters.complexity}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, complexity: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Complexities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="very_high">Very High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Business Value</InputLabel>
              <Select
                value={searchFilters.businessValue}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, businessValue: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Values</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="strategic">Strategic</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
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
                <MenuItem value="technology">Technology</MenuItem>
                <MenuItem value="business">Business</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="creative">Creative</MenuItem>
                <MenuItem value="operations">Operations</MenuItem>
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
            '& .Mui-selected': { color: '#10b981' },
            '& .MuiTabs-indicator': { backgroundColor: '#10b981' }
          }}
        >
          <Tab label={`Projects (${filteredProjects.length})`} />
          <Tab label={`Refinements (${filteredRefinements.length})`} />
          <Tab label={`Feedback (${filteredFeedback.length})`} />
          <Tab label={`Sessions (${filteredSessions.length})`} />
          <Tab label={`Templates (${templates.length})`} />
          <Tab label={`Analytics`} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTab === 0 && (
          <Box>
            {/* Projects Overview */}
            {analytics && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                      {getStatusCount('active')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Active Projects
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                      {getStatusCount('completed')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Completed Projects
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      {((analytics.projectMetrics?.successRate || 0) * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Success Rate
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#e91e63', fontWeight: 'bold' }}>
                      {(analytics.projectMetrics?.averageProjectDuration || 0).toFixed(0)}h
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Avg Duration
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Project Cards */}
            {filteredProjects.map(renderProjectCard)}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            {/* Refinements */}
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Iterative Refinements
            </Typography>
            {filteredRefinements.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AutoFixHigh sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No refinements found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Refinements will appear here as projects evolve
                </Typography>
              </Box>
            ) : (
              filteredRefinements.map(refinement => (
                <Card key={refinement.id} sx={{ mb: 2, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'white' }}>
                      {refinement.refinement.description}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Type: {refinement.refinementType} • Version: {refinement.version} • Status: {refinement.status}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            {/* Feedback */}
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Feedback Incorporation
            </Typography>
            {filteredFeedback.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Feedback sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No feedback found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Feedback will appear here as it's incorporated into projects
                </Typography>
              </Box>
            ) : (
              filteredFeedback.map(feedbackItem => (
                <Card key={feedbackItem.id} sx={{ mb: 2, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'white' }}>
                      {feedbackItem.feedback.content}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Source: {feedbackItem.feedbackSource} • Type: {feedbackItem.feedbackType} • Status: {feedbackItem.incorporation.status}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}

        {selectedTab === 3 && (
          <Box>
            {/* Sessions */}
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Cross-Session Continuity
            </Typography>
            {filteredSessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <History sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No sessions found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Session continuity data will appear here as work sessions are tracked
                </Typography>
              </Box>
            ) : (
              filteredSessions.map(session => (
                <Card key={session.id} sx={{ mb: 2, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'white' }}>
                      {session.sessionType} Session
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Duration: {session.context.duration}min • Status: {session.status} • Participants: {session.context.participants.length}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}

        {selectedTab === 4 && (
          <Box>
            {/* Templates */}
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Project Templates
            </Typography>
            {templates.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Description sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No templates found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Project templates will appear here to accelerate project creation
                </Typography>
              </Box>
            ) : (
              templates.map(template => (
                <Card key={template.id} sx={{ mb: 2, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'white' }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {template.description}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Category: {template.category} • Domain: {template.domain} • Used: {template.usage.usageCount} times
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}

        {selectedTab === 5 && (
          <Box>
            {/* Analytics */}
            {analytics ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Collaborative Work Analytics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                        Project Distribution
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(projectTypeColors).map(([type, color]) => (
                          <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 16, height: 16, bgcolor: color, borderRadius: 1 }} />
                            <Typography variant="body2" sx={{ color: '#94a3b8', flex: 1 }}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              {getTypeCount(type)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                        Recommendations
                      </Typography>
                      <List dense>
                        {(analytics.recommendations || []).map((rec: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={rec}
                              sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.875rem' } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Analytics sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No analytics data available
                </Typography>
                <Button
                  variant="contained"
                  onClick={loadAnalytics}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Load Analytics
                </Button>
              </Box>
            )}
          </Box>
        )}

        {filteredProjects.length === 0 && selectedTab === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Group sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
              No collaborative projects found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Create your first collaborative project to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateProject(true)}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              Create Project
            </Button>
          </Box>
        )}
      </Box>

      {/* Project Details Dialog */}
      <Dialog
        open={showProjectDetails}
        onClose={() => setShowProjectDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Project Details - {selectedProject?.name}
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                {selectedProject.description}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Type: {selectedProject.type} • Status: {selectedProject.status} • Priority: {selectedProject.priority}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Progress: {(selectedProject.progress.overallProgress * 100).toFixed(0)}% • Quality: {(selectedProject.quality.qualityScore * 100).toFixed(0)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProjectDetails(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedProject) {
                handleLoadProjectIntoChat(selectedProject);
              }
              setShowProjectDetails(false);
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Load into Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Create New Project
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8' }}>
            Project creation form would be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateProject(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create from Template Dialog */}
      <Dialog
        open={showCreateFromTemplate}
        onClose={() => setShowCreateFromTemplate(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Create Project from Template
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8' }}>
            Template selection and customization form would be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateFromTemplate(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Create from Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

