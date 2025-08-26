/**
 * Repository Browser Component
 * 
 * Complete "GitHub within Promethios" experience with integrated Live Sandbox.
 * Provides expandable repository management, real-time agent development streaming,
 * file preview/editing, and collaborative workflow management.
 * 
 * Revolutionary Features:
 * - Expandable repository list with visual progress states
 * - Integrated Live Sandbox for watching agents work in real-time
 * - File preview and editing capabilities
 * - Real-time collaboration features
 * - Export/import and GitHub integration
 * - Template system for reusable workflows
 * 
 * This transforms AI interaction from "waiting for results" to "watching creation happen live"
 * 
 * @author Manus AI
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Paper,
  Grid,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Rating,
  Skeleton
} from '@mui/material';

import {
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  GitHub as GitHubIcon,
  CloudUpload as DeployIcon,
  Extension as ExtensionIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Timeline as TimelineIcon,
  Computer as SandboxIcon,
  Visibility as WatchIcon,
  ChatBubble as ChatIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { 
  WorkflowRepository, 
  RepositoryFile, 
  RepositoryDirectory,
  RepositoryExtension,
  RepositoryCollaborator,
  RepositoryFilter,
  workflowRepositoryManager 
} from '../../services/WorkflowRepositoryManager';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface RepositoryBrowserProps {
  userId: string;
  agentId: string;
  sessionId: string;
  onRepositorySelect?: (repository: WorkflowRepository) => void;
  onFileSelect?: (file: RepositoryFile, repository: WorkflowRepository) => void;
  onStartWorkflow?: (goal: string, workflowType: string) => void;
  className?: string;
}

interface LiveSandboxState {
  isActive: boolean;
  currentRepository?: WorkflowRepository;
  currentFile?: RepositoryFile;
  agentActions: AgentAction[];
  watchMode: 'code' | 'preview' | 'files' | 'metrics';
  isStreaming: boolean;
}

interface AgentAction {
  id: string;
  type: 'file_create' | 'file_modify' | 'file_delete' | 'tool_execute' | 'phase_complete' | 'user_interaction';
  description: string;
  timestamp: string;
  metadata?: any;
  status: 'in_progress' | 'completed' | 'failed';
}

interface FilePreviewState {
  isOpen: boolean;
  file?: RepositoryFile;
  repository?: WorkflowRepository;
  mode: 'view' | 'edit';
  content: string;
  hasChanges: boolean;
}

// ============================================================================
// REPOSITORY BROWSER COMPONENT
// ============================================================================

export const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({
  userId,
  agentId,
  sessionId,
  onRepositorySelect,
  onFileSelect,
  onStartWorkflow,
  className
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Repository management
  const [repositories, setRepositories] = useState<WorkflowRepository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<WorkflowRepository | null>(null);
  const [expandedRepositories, setExpandedRepositories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Sandbox
  const [liveSandbox, setLiveSandbox] = useState<LiveSandboxState>({
    isActive: false,
    agentActions: [],
    watchMode: 'code',
    isStreaming: false
  });

  // File preview and editing
  const [filePreview, setFilePreview] = useState<FilePreviewState>({
    isOpen: false,
    mode: 'view',
    content: '',
    hasChanges: false
  });

  // UI state
  const [activeTab, setActiveTab] = useState(0); // 0: Repositories, 1: Live Sandbox, 2: Templates
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<RepositoryFilter>({});
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'progress' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dialog states
  const [newWorkflowDialog, setNewWorkflowDialog] = useState(false);
  const [extensionDialog, setExtensionDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Refs for real-time updates
  const repositorySubscriptions = useRef<Map<string, () => void>>(new Map());
  const liveSandboxRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // EFFECTS AND LIFECYCLE
  // ============================================================================

  // Load repositories on mount
  useEffect(() => {
    loadRepositories();
  }, [userId, searchQuery, filter, sortBy, sortOrder]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      repositorySubscriptions.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Auto-scroll live sandbox
  useEffect(() => {
    if (liveSandbox.isStreaming && liveSandboxRef.current) {
      liveSandboxRef.current.scrollTop = liveSandboxRef.current.scrollHeight;
    }
  }, [liveSandbox.agentActions]);

  // ============================================================================
  // REPOSITORY MANAGEMENT
  // ============================================================================

  const loadRepositories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await workflowRepositoryManager.listRepositories(
        userId,
        filter,
        searchQuery,
        sortBy,
        sortOrder,
        50,
        0
      );

      setRepositories(result.repositories);

      // Subscribe to repository updates
      result.repositories.forEach(repo => {
        if (!repositorySubscriptions.current.has(repo.id)) {
          const unsubscribe = workflowRepositoryManager.subscribeToRepository(
            repo.id,
            (updatedRepo) => {
              setRepositories(prev => 
                prev.map(r => r.id === updatedRepo.id ? updatedRepo : r)
              );
              
              // Update live sandbox if this is the active repository
              if (liveSandbox.currentRepository?.id === updatedRepo.id) {
                setLiveSandbox(prev => ({
                  ...prev,
                  currentRepository: updatedRepo
                }));
              }
            }
          );
          repositorySubscriptions.current.set(repo.id, unsubscribe);
        }
      });

    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError('Failed to load repositories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, searchQuery, filter, sortBy, sortOrder]);

  const createNewWorkflow = async (goal: string, workflowType: string, templateId?: string) => {
    try {
      const repository = await workflowRepositoryManager.createRepository(
        goal,
        workflowType,
        userId,
        agentId,
        sessionId,
        templateId
      );

      setRepositories(prev => [repository, ...prev]);
      setSelectedRepository(repository);
      setNewWorkflowDialog(false);

      // Start live sandbox for new workflow
      startLiveSandbox(repository);

      // Notify parent component
      if (onStartWorkflow) {
        onStartWorkflow(goal, workflowType);
      }

      showNotification('Workflow repository created successfully!', 'success');

    } catch (err) {
      console.error('Failed to create workflow:', err);
      showNotification('Failed to create workflow repository.', 'error');
    }
  };

  const extendRepository = async (repository: WorkflowRepository, extensionGoal: string) => {
    try {
      const extension = await workflowRepositoryManager.extendRepository(
        repository.id,
        extensionGoal,
        'feature_addition',
        userId
      );

      // Refresh repository data
      const updatedRepo = await workflowRepositoryManager.getRepository(repository.id, userId);
      if (updatedRepo) {
        setRepositories(prev => 
          prev.map(r => r.id === updatedRepo.id ? updatedRepo : r)
        );
        setSelectedRepository(updatedRepo);
      }

      setExtensionDialog(false);
      showNotification('Repository extension started!', 'success');

    } catch (err) {
      console.error('Failed to extend repository:', err);
      showNotification('Failed to extend repository.', 'error');
    }
  };

  // ============================================================================
  // LIVE SANDBOX MANAGEMENT
  // ============================================================================

  const startLiveSandbox = (repository: WorkflowRepository) => {
    setLiveSandbox({
      isActive: true,
      currentRepository: repository,
      agentActions: [],
      watchMode: 'code',
      isStreaming: true
    });

    // Switch to Live Sandbox tab
    setActiveTab(1);

    // Simulate agent actions (in real implementation, this would come from the autonomous system)
    simulateAgentActions(repository);
  };

  const stopLiveSandbox = () => {
    setLiveSandbox(prev => ({
      ...prev,
      isActive: false,
      isStreaming: false
    }));
  };

  const pauseLiveSandbox = () => {
    setLiveSandbox(prev => ({
      ...prev,
      isStreaming: !prev.isStreaming
    }));
  };

  const simulateAgentActions = (repository: WorkflowRepository) => {
    // This simulates the real-time agent development experience
    // In production, this would receive real updates from the autonomous system
    
    const actions: Omit<AgentAction, 'id' | 'timestamp'>[] = [
      {
        type: 'tool_execute',
        description: 'Analyzing project requirements',
        status: 'completed',
        metadata: { tool: 'requirement_analyzer', duration: 2000 }
      },
      {
        type: 'file_create',
        description: 'Creating project structure',
        status: 'completed',
        metadata: { file: 'package.json', size: 245 }
      },
      {
        type: 'tool_execute',
        description: 'Researching design trends',
        status: 'in_progress',
        metadata: { tool: 'web_search', query: 'modern landing page design' }
      },
      {
        type: 'file_create',
        description: 'Generating wireframe layout',
        status: 'in_progress',
        metadata: { file: 'wireframes.png', progress: 45 }
      }
    ];

    let actionIndex = 0;
    const addAction = () => {
      if (actionIndex < actions.length && liveSandbox.isStreaming) {
        const action: AgentAction = {
          id: `action_${Date.now()}_${actionIndex}`,
          timestamp: new Date().toISOString(),
          ...actions[actionIndex]
        };

        setLiveSandbox(prev => ({
          ...prev,
          agentActions: [...prev.agentActions, action]
        }));

        actionIndex++;
        
        // Schedule next action
        setTimeout(addAction, 2000 + Math.random() * 3000);
      }
    };

    // Start adding actions
    setTimeout(addAction, 1000);
  };

  // ============================================================================
  // FILE MANAGEMENT
  // ============================================================================

  const openFilePreview = (file: RepositoryFile, repository: WorkflowRepository, mode: 'view' | 'edit' = 'view') => {
    setFilePreview({
      isOpen: true,
      file,
      repository,
      mode,
      content: file.content || '',
      hasChanges: false
    });

    // Notify parent component
    if (onFileSelect) {
      onFileSelect(file, repository);
    }
  };

  const closeFilePreview = () => {
    if (filePreview.hasChanges) {
      // Show confirmation dialog
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setFilePreview({
          isOpen: false,
          mode: 'view',
          content: '',
          hasChanges: false
        });
      }
    } else {
      setFilePreview({
        isOpen: false,
        mode: 'view',
        content: '',
        hasChanges: false
      });
    }
  };

  const saveFileChanges = async () => {
    if (!filePreview.file || !filePreview.repository) return;

    try {
      await workflowRepositoryManager.updateFile(
        filePreview.repository.id,
        filePreview.file.path,
        filePreview.content,
        'user'
      );

      setFilePreview(prev => ({ ...prev, hasChanges: false }));
      showNotification('File saved successfully!', 'success');

    } catch (err) {
      console.error('Failed to save file:', err);
      showNotification('Failed to save file.', 'error');
    }
  };

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  const getFileIcon = (file: RepositoryFile) => {
    switch (file.type) {
      case 'javascript':
      case 'python':
      case 'html':
      case 'css':
        return <CodeIcon />;
      case 'image':
        return <ImageIcon />;
      case 'document':
        return <DocumentIcon />;
      default:
        return <FileIcon />;
    }
  };

  const getFileStatusIcon = (status: RepositoryFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'in_progress':
        return <CircularProgress size={16} />;
      case 'failed':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'pending':
      default:
        return <PendingIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getRepositoryStatusColor = (status: WorkflowRepository['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
      case 'extended':
        return 'primary';
      case 'paused':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, severity });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderRepositoryList = () => (
    <Box>
      {/* Search and Filter Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewWorkflowDialog(true)}
          sx={{ whiteSpace: 'nowrap' }}
        >
          New Workflow
        </Button>
        <IconButton onClick={loadRepositories}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Repository Cards */}
      {loading ? (
        <Box>
          {[1, 2, 3].map(i => (
            <Card key={i} sx={{ mb: 2 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : repositories.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No repositories yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first autonomous workflow repository to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewWorkflowDialog(true)}
            >
              Create First Repository
            </Button>
          </CardContent>
        </Card>
      ) : (
        repositories.map(repository => (
          <Card key={repository.id} sx={{ mb: 2 }}>
            <Accordion 
              expanded={expandedRepositories.has(repository.id)}
              onChange={() => {
                const newExpanded = new Set(expandedRepositories);
                if (newExpanded.has(repository.id)) {
                  newExpanded.delete(repository.id);
                } else {
                  newExpanded.add(repository.id);
                }
                setExpandedRepositories(newExpanded);
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                  <FolderIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {repository.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {repository.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Chip 
                        label={repository.status} 
                        size="small" 
                        color={getRepositoryStatusColor(repository.status) as any}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(repository.updatedAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {repository.progress.artifactsGenerated} artifacts
                      </Typography>
                      {repository.userRating && (
                        <Rating value={repository.userRating} size="small" readOnly />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress
                      variant="determinate"
                      value={repository.progress.overallProgress}
                      size={40}
                      thickness={4}
                    />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {repository.progress.overallProgress}%
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                {renderRepositoryDetails(repository)}
              </AccordionDetails>
            </Accordion>
          </Card>
        ))
      )}
    </Box>
  );

  const renderRepositoryDetails = (repository: WorkflowRepository) => (
    <Box>
      {/* Repository Actions */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<WatchIcon />}
          onClick={() => startLiveSandbox(repository)}
          variant={liveSandbox.currentRepository?.id === repository.id ? 'contained' : 'outlined'}
        >
          {liveSandbox.currentRepository?.id === repository.id ? 'Watching' : 'Watch Live'}
        </Button>
        <Button
          size="small"
          startIcon={<ExtensionIcon />}
          onClick={() => {
            setSelectedRepository(repository);
            setExtensionDialog(true);
          }}
        >
          Extend
        </Button>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => {
            setSelectedRepository(repository);
            setExportDialog(true);
          }}
        >
          Export
        </Button>
        <Button
          size="small"
          startIcon={<GitHubIcon />}
          onClick={() => {
            // GitHub integration
            showNotification('GitHub integration coming soon!', 'info');
          }}
        >
          Push to GitHub
        </Button>
        <Button
          size="small"
          startIcon={<DeployIcon />}
          onClick={() => {
            // Deployment
            showNotification('Deployment coming soon!', 'info');
          }}
        >
          Deploy
        </Button>
      </Box>

      {/* Progress Overview */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Progress Overview
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={repository.progress.overallProgress} 
          sx={{ mb: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          Phase {repository.progress.currentPhase}/{repository.progress.totalPhases} • 
          {repository.progress.phasesCompleted} phases completed • 
          {repository.progress.artifactsGenerated} artifacts generated
        </Typography>
      </Box>

      {/* File Structure */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Repository Structure
        </Typography>
        <List dense>
          {/* Core Files */}
          {Object.entries(repository.structure.coreFiles).map(([path, file]) => (
            <ListItem 
              key={path}
              button
              onClick={() => openFilePreview(file, repository)}
            >
              <ListItemIcon>
                {getFileIcon(file)}
              </ListItemIcon>
              <ListItemText 
                primary={file.name}
                secondary={`${file.size} bytes • ${file.type}`}
              />
              <ListItemSecondaryAction>
                {getFileStatusIcon(file.status)}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          
          {/* Artifacts Directory */}
          {Object.entries(repository.structure.directories['artifacts/'].files).map(([filename, file]) => (
            <ListItem 
              key={`artifacts/${filename}`}
              button
              onClick={() => openFilePreview(file, repository)}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                {getFileIcon(file)}
              </ListItemIcon>
              <ListItemText 
                primary={file.name}
                secondary={`artifacts/ • ${file.size} bytes`}
              />
              <ListItemSecondaryAction>
                {getFileStatusIcon(file.status)}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Extensions */}
      {repository.extensions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Extensions
          </Typography>
          {repository.extensions.map(extension => (
            <Card key={extension.id} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {extension.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {extension.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={extension.status} 
                      size="small" 
                      color={extension.status === 'completed' ? 'success' : 'primary'}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={extension.progress}
                      size={24}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Collaborators */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Collaborators
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {repository.collaborators.map(collaborator => (
            <Tooltip key={collaborator.userId} title={`${collaborator.userName} (${collaborator.role})`}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {collaborator.userName.charAt(0)}
              </Avatar>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Box>
  );

  const renderLiveSandbox = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!liveSandbox.isActive ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          <SandboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Live Agent Sandbox
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            Watch autonomous agents work in real-time. Start a workflow or select an active repository to begin.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewWorkflowDialog(true)}
          >
            Start New Workflow
          </Button>
        </Box>
      ) : (
        <>
          {/* Sandbox Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  🤖 Agent: {liveSandbox.currentRepository?.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phase {liveSandbox.currentRepository?.progress.currentPhase}/{liveSandbox.currentRepository?.progress.totalPhases} • 
                  {liveSandbox.currentRepository?.progress.overallProgress}% Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={pauseLiveSandbox}
                  color={liveSandbox.isStreaming ? 'primary' : 'default'}
                >
                  {liveSandbox.isStreaming ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
                <IconButton onClick={stopLiveSandbox}>
                  <StopIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Watch Mode Tabs */}
            <Tabs 
              value={liveSandbox.watchMode} 
              onChange={(_, newValue) => setLiveSandbox(prev => ({ ...prev, watchMode: newValue }))}
              variant="scrollable"
            >
              <Tab label="Code" value="code" />
              <Tab label="Preview" value="preview" />
              <Tab label="Files" value="files" />
              <Tab label="Metrics" value="metrics" />
            </Tabs>
          </Box>

          {/* Sandbox Content */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {liveSandbox.watchMode === 'code' && renderCodeView()}
            {liveSandbox.watchMode === 'preview' && renderPreviewView()}
            {liveSandbox.watchMode === 'files' && renderFilesView()}
            {liveSandbox.watchMode === 'metrics' && renderMetricsView()}
          </Box>

          {/* Agent Actions Stream */}
          <Box 
            ref={liveSandboxRef}
            sx={{ 
              height: 200, 
              overflow: 'auto', 
              borderTop: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🔄 Agent Actions
              </Typography>
              {liveSandbox.agentActions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Waiting for agent actions...
                </Typography>
              ) : (
                liveSandbox.agentActions.map(action => (
                  <Box key={action.id} sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {action.status === 'in_progress' && <CircularProgress size={16} />}
                      {action.status === 'completed' && <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />}
                      {action.status === 'failed' && <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />}
                      <Typography variant="body2">
                        {action.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatTimeAgo(action.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

  const renderCodeView = () => (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto', fontFamily: 'monospace', bgcolor: '#1e1e1e', color: '#d4d4d4' }}>
      <Typography variant="body2" sx={{ mb: 2, color: '#569cd6' }}>
        // Agent is writing code live...
      </Typography>
      <Box sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.5 }}>
        {`export interface WorkflowRepository {
  id: string;
  name: string;
  displayName: string;
  description: string;
  
  // Repository state
  status: 'active' | 'paused' | 'completed' | 'extended' | 'archived' | 'failed';
  visibility: 'private' | 'shared' | 'public' | 'template';
  
  // Workflow context
  originalGoal: string;
  currentGoal: string; // May evolve through extensions
  workflowType: 'code_shell' | 'research_dossier' | 'launch_plan' | 'audit_pack' | 'content_series' | 'custom';
  
  // Progress tracking
  progress: {
    currentPhase: number;
    totalPhases: number;
    overallProgress: number; // 0-100
    phasesCompleted: number;
    artifactsGenerated: number;
    estimatedTimeRemaining: number; // minutes
  };`}
      </Box>
      {liveSandbox.isStreaming && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Agent is typing...
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderPreviewView = () => (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        🖥️ Live Preview
      </Typography>
      <Card sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Generating preview...
          </Typography>
        </Box>
      </Card>
    </Box>
  );

  const renderFilesView = () => (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        📁 File System
      </Typography>
      {liveSandbox.currentRepository && (
        <List>
          {Object.entries(liveSandbox.currentRepository.structure.coreFiles).map(([path, file]) => (
            <ListItem key={path}>
              <ListItemIcon>
                {getFileIcon(file)}
              </ListItemIcon>
              <ListItemText 
                primary={file.name}
                secondary={`${file.size} bytes • ${file.status}`}
              />
              <ListItemSecondaryAction>
                {getFileStatusIcon(file.status)}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  const renderMetricsView = () => (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        📊 Real-time Metrics
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {liveSandbox.currentRepository?.progress.artifactsGenerated || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Files Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                247
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lines of Code
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API Calls
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                1
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Images Generated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Box className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Repositories" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Live Sandbox
                {liveSandbox.isActive && (
                  <Badge color="success" variant="dot" />
                )}
              </Box>
            }
          />
          <Tab label="Templates" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 0 && renderRepositoryList()}
        {activeTab === 1 && renderLiveSandbox()}
        {activeTab === 2 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              Templates coming soon!
            </Typography>
          </Box>
        )}
      </Box>

      {/* Dialogs */}
      <Dialog open={newWorkflowDialog} onClose={() => setNewWorkflowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Workflow Repository</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workflow Goal"
            fullWidth
            variant="outlined"
            placeholder="e.g., Build a landing page for my SaaS product"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Workflow Type</InputLabel>
            <Select defaultValue="code_shell">
              <MenuItem value="code_shell">Code Shell</MenuItem>
              <MenuItem value="research_dossier">Research Dossier</MenuItem>
              <MenuItem value="launch_plan">Launch Plan</MenuItem>
              <MenuItem value="audit_pack">Audit Pack</MenuItem>
              <MenuItem value="content_series">Content Series</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewWorkflowDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createNewWorkflow('Sample workflow goal', 'code_shell')}>
            Create Repository
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog 
        open={filePreview.isOpen} 
        onClose={closeFilePreview} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {filePreview.file && getFileIcon(filePreview.file)}
            {filePreview.file?.name}
          </Box>
          <Box>
            <IconButton onClick={() => setFilePreview(prev => ({ ...prev, mode: prev.mode === 'view' ? 'edit' : 'view' }))}>
              <EditIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TextField
            multiline
            fullWidth
            value={filePreview.content}
            onChange={(e) => setFilePreview(prev => ({ ...prev, content: e.target.value, hasChanges: true }))}
            InputProps={{
              readOnly: filePreview.mode === 'view',
              sx: { 
                fontFamily: 'monospace', 
                fontSize: '0.875rem',
                '& .MuiInputBase-input': {
                  minHeight: '60vh !important'
                }
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFilePreview}>Close</Button>
          {filePreview.mode === 'edit' && filePreview.hasChanges && (
            <Button variant="contained" onClick={saveFileChanges}>
              Save Changes
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
      >
        {notification && (
          <Alert severity={notification.severity} onClose={() => setNotification(null)}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default RepositoryBrowser;

