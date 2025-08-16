/**
 * Creative Processes Viewer Component
 * 
 * UI component for viewing and managing creative processes in the Command Center.
 * Handles brainstorming sessions, design iterations, storytelling development,
 * and creative frameworks. Provides comprehensive creative project management
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
  Lightbulb,
  Brush,
  AutoStories,
  Extension,
  Psychology,
  Create,
  Palette,
  MenuBook,
  Build,
  Star,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Group,
  Person,
  Schedule,
  CheckCircle,
  Error,
  Warning,
  Info,
  PlayArrow,
  Pause,
  Stop,
  Replay,
  FastForward,
  SkipNext,
  SkipPrevious,
  Shuffle,
  Loop,
  VolumeUp,
  VolumeOff,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  Comment,
  ThumbUp,
  ThumbDown,
  Favorite,
  FavoriteBorder,
  Bookmark,
  BookmarkBorder,
  Flag,
  Report,
  Block,
  Lock,
  LockOpen,
  Visibility as VisibilityIcon,
  VisibilityOff,
  Public,
  Security,
  VerifiedUser,
  Gavel,
  Balance,
  AccountBalance,
  School,
  Work,
  Home,
  Business,
  Store,
  ShoppingCart,
  AttachMoney,
  MonetizationOn,
  Payment,
  CreditCard,
  AccountBalanceWallet,
  Savings,
  TrendingFlat as Stable,
  ShowChart,
  BarChart,
  PieChart,
  DonutLarge,
  Timeline as TimelineIcon,
  DateRange,
  Today,
  Event,
  AccessTime,
  Timer,
  Alarm,
  AlarmOn,
  AlarmOff,
  NotificationsActive,
  NotificationsOff,
  Notifications,
  NotificationImportant,
  PriorityHigh,
  LowPriority,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  ExpandLess,
  ExpandMore as ExpandMoreIcon,
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Refresh as RefreshIcon,
  Sync,
  SyncProblem,
  CloudSync,
  CloudOff,
  CloudDone,
  CloudUpload,
  CloudDownload,
  Backup,
  Restore,
  Update,
  SystemUpdate,
  GetApp,
  Publish,
  Send,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Unarchive,
  Inbox,
  Drafts,
  Mail,
  MailOutline,
  MarkunreadMailbox,
  MoveToInbox,
  Label,
  LabelImportant,
  LabelOff,
  LocalOffer,
  Loyalty,
  Redeem,
  CardGiftcard,
  Grade,
  Stars,
  StarBorder,
  StarHalf,
  StarOutline,
  StarRate,
  Whatshot,
  Flare,
  Lens,
  Gradient,
  Texture,
  FormatPaint,
  FormatColorFill,
  FormatColorReset,
  FormatColorText,
  Colorize,
  InvertColors,
  InvertColorsOff,
  Opacity,
  BlurOn,
  BlurOff,
  BlurCircular,
  BlurLinear,
  Tune,
  Settings,
  SettingsApplications,
  SettingsBackupRestore,
  SettingsBluetooth,
  SettingsBrightness,
  SettingsCell,
  SettingsEthernet,
  SettingsInputAntenna,
  SettingsInputComponent,
  SettingsInputComposite,
  SettingsInputHdmi,
  SettingsInputSvideo,
  SettingsOverscan,
  SettingsPhone,
  SettingsPower,
  SettingsRemote,
  SettingsSystemDaydream,
  SettingsVoice,
  Dashboard,
  DashboardCustomize,
  ViewModule,
  ViewQuilt,
  ViewStream,
  ViewArray,
  ViewCarousel,
  ViewColumn,
  ViewComfy,
  ViewCompact,
  ViewDay,
  ViewHeadline,
  ViewList,
  ViewWeek,
  Widgets,
  Apps,
  AppsOutage,
  Extension as ExtensionIcon,
  PowerSettingsNew,
  Power,
  PowerOff,
  PowerInput,
  BatteryFull,
  BatteryChargingFull,
  Battery90,
  Battery80,
  Battery60,
  Battery50,
  Battery30,
  Battery20,
  BatteryAlert,
  BatteryUnknown,
  SignalCellular4Bar,
  SignalCellular3Bar,
  SignalCellular2Bar,
  SignalCellular1Bar,
  SignalCellular0Bar,
  SignalCellularAlt,
  SignalCellularConnectedNoInternet4Bar,
  SignalCellularNoSim,
  SignalCellularNull,
  SignalCellularOff,
  SignalWifi4Bar,
  SignalWifi3Bar,
  SignalWifi2Bar,
  SignalWifi1Bar,
  SignalWifi0Bar,
  SignalWifiOff,
  NetworkWifi,
  Wifi,
  WifiOff,
  WifiLock,
  WifiTethering,
  Bluetooth,
  BluetoothAudio,
  BluetoothConnected,
  BluetoothDisabled,
  BluetoothSearching,
  Nfc,
  AirplanemodeActive,
  AirplanemodeInactive,
  Usb,
  UsbOff,
  DeviceHub,
  Devices,
  DevicesOther,
  Computer,
  DesktopMac,
  DesktopWindows,
  LaptopMac,
  LaptopWindows,
  LaptopChromebook,
  Tablet,
  TabletMac,
  TabletAndroid,
  PhoneAndroid,
  PhoneIphone,
  Phonelink,
  PhonelinkErase,
  PhonelinkLock,
  PhonelinkOff,
  PhonelinkRing,
  PhonelinkSetup,
  SecurityUpdate,
  SecurityUpdateGood,
  SecurityUpdateWarning,
  SystemSecurityUpdate,
  SystemSecurityUpdateGood,
  SystemSecurityUpdateWarning
} from '@mui/icons-material';
import { CreativeProcessesExtension, BrainstormingSession, DesignIteration, StorytellingDevelopment, CreativeFramework, CreativeIdea } from '../../extensions/CreativeProcessesExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface CreativeProcessesViewerProps {
  chatbot: any;
  onSessionLoad: (session: BrainstormingSession) => void;
  onIterationLoad: (iteration: DesignIteration) => void;
  onStoryLoad: (story: StorytellingDevelopment) => void;
  onFrameworkLoad: (framework: CreativeFramework) => void;
}

interface SearchFilters {
  keywords: string;
  type: string;
  status: string;
  domain: string;
  complexity: string;
  participant: string;
  confidentiality: string;
  dateRange: string;
}

const processTypeIcons: Record<string, React.ReactElement> = {
  'brainstorming_session': <Psychology />,
  'design_iteration': <Brush />,
  'storytelling_development': <AutoStories />,
  'creative_framework': <Extension />
};

const processTypeColors: Record<string, string> = {
  'brainstorming_session': '#9c27b0',
  'design_iteration': '#ff9800',
  'storytelling_development': '#3f51b5',
  'creative_framework': '#4caf50'
};

const sessionTypeIcons: Record<string, React.ReactElement> = {
  'ideation': <Lightbulb />,
  'problem_solving': <Build />,
  'concept_development': <Create />,
  'innovation': <Star />,
  'strategic_planning': <Dashboard />,
  'creative_exploration': <Palette />
};

const iterationTypeIcons: Record<string, React.ReactElement> = {
  'concept': <Lightbulb />,
  'prototype': <Build />,
  'refinement': <Tune />,
  'variation': <Shuffle />,
  'optimization': <TrendingUp />,
  'finalization': <CheckCircle />
};

const storyTypeIcons: Record<string, React.ReactElement> = {
  'narrative': <MenuBook />,
  'brand_story': <Business />,
  'user_journey': <Timeline />,
  'case_study': <School />,
  'scenario': <Visibility />,
  'vision': <Star />,
  'metaphor': <Psychology />
};

const frameworkTypeIcons: Record<string, React.ReactElement> = {
  'ideation': <Lightbulb />,
  'problem_solving': <Build />,
  'design_thinking': <Brush />,
  'innovation': <Star />,
  'storytelling': <AutoStories />,
  'strategy': <Dashboard />
};

const statusColors: Record<string, string> = {
  'planning': '#6b7280',
  'active': '#10b981',
  'paused': '#f59e0b',
  'completed': '#059669',
  'cancelled': '#ef4444',
  'archived': '#4b5563',
  'draft': '#6b7280',
  'review': '#f59e0b',
  'revision': '#ef4444',
  'approved': '#10b981',
  'rejected': '#ef4444',
  'implemented': '#059669',
  'outline': '#6b7280',
  'published': '#10b981',
  'testing': '#f59e0b',
  'validated': '#10b981',
  'deprecated': '#4b5563'
};

const complexityColors: Record<string, string> = {
  'low': '#10b981',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'very_high': '#dc2626'
};

const confidentialityColors: Record<string, string> = {
  'public': '#10b981',
  'internal': '#f59e0b',
  'confidential': '#ef4444',
  'restricted': '#dc2626'
};

export const CreativeProcessesViewer: React.FC<CreativeProcessesViewerProps> = ({
  chatbot,
  onSessionLoad,
  onIterationLoad,
  onStoryLoad,
  onFrameworkLoad
}) => {
  // State management
  const [creativeExtension] = useState(() => new CreativeProcessesExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0: All, 1: Brainstorming, 2: Design, 3: Storytelling, 4: Frameworks, 5: Analytics
  
  // Data state
  const [allProcesses, setAllProcesses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<BrainstormingSession[]>([]);
  const [iterations, setIterations] = useState<DesignIteration[]>([]);
  const [stories, setStories] = useState<StorytellingDevelopment[]>([]);
  const [frameworks, setFrameworks] = useState<CreativeFramework[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Filtered data
  const [filteredProcesses, setFilteredProcesses] = useState<any[]>([]);
  
  // UI state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keywords: '',
    type: '',
    status: '',
    domain: '',
    complexity: '',
    participant: '',
    confidentiality: '',
    dateRange: 'all'
  });
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateIteration, setShowCreateIteration] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showCreateFramework, setShowCreateFramework] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeCreativeProcesses();
  }, []);

  const initializeCreativeProcesses = async () => {
    try {
      setLoading(true);
      
      // Initialize extensions
      await creativeExtension.initialize();
      await governanceService.initialize();
      
      // Load creative processes data
      await loadCreativeProcessesData();
      
      // Load analytics
      await loadAnalytics();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize creative processes:', error);
      setLoading(false);
    }
  };

  const loadCreativeProcessesData = async () => {
    try {
      // Search for all creative processes
      const results = await creativeExtension.searchCreativeProcesses(chatbot.id, {});
      setAllProcesses(results || []);
      setFilteredProcesses(results || []);

      // Separate by type
      const sessionResults = results.filter(r => r.dataType === 'brainstorming_session');
      const iterationResults = results.filter(r => r.dataType === 'design_iteration');
      const storyResults = results.filter(r => r.dataType === 'storytelling_development');
      const frameworkResults = results.filter(r => r.dataType === 'creative_framework');

      setSessions(sessionResults);
      setIterations(iterationResults);
      setStories(storyResults);
      setFrameworks(frameworkResults);
    } catch (error) {
      console.error('Failed to load creative processes data:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await creativeExtension.getCreativeProcessesAnalytics(chatbot.id);
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
        domain: searchFilters.domain || undefined,
        complexity: searchFilters.complexity || undefined,
        participant: searchFilters.participant || undefined
      };

      const results = await creativeExtension.searchCreativeProcesses(chatbot.id, searchQuery);
      setFilteredProcesses(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchFilters, chatbot.id, creativeExtension]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (Object.values(searchFilters).some(value => value && value !== 'all')) {
        handleSearch();
      } else {
        setFilteredProcesses(allProcesses);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchFilters, allProcesses, handleSearch]);

  // Event handlers
  const handleLoadProcessIntoChat = async (process: any) => {
    try {
      switch (process.dataType) {
        case 'brainstorming_session':
          await governanceService.loadSessionContext(process.id);
          onSessionLoad(process);
          break;
        case 'design_iteration':
          await governanceService.loadIterationContext(process.id);
          onIterationLoad(process);
          break;
        case 'storytelling_development':
          await governanceService.loadStoryContext(process.id);
          onStoryLoad(process);
          break;
        case 'creative_framework':
          await governanceService.loadFrameworkContext(process.id);
          onFrameworkLoad(process);
          break;
      }
    } catch (error) {
      console.error('Failed to load process into chat:', error);
    }
  };

  const getProcessIcon = (process: any): React.ReactElement => {
    if (process.dataType === 'brainstorming_session') {
      return sessionTypeIcons[process.sessionType] || <Psychology />;
    } else if (process.dataType === 'design_iteration') {
      return iterationTypeIcons[process.iterationType] || <Brush />;
    } else if (process.dataType === 'storytelling_development') {
      return storyTypeIcons[process.storyType] || <AutoStories />;
    } else if (process.dataType === 'creative_framework') {
      return frameworkTypeIcons[process.frameworkType] || <Extension />;
    }
    return processTypeIcons[process.dataType] || <Create />;
  };

  const getProcessColor = (process: any): string => {
    return processTypeColors[process.dataType] || '#6b7280';
  };

  const getStatusColor = (status: string): string => {
    return statusColors[status] || '#6b7280';
  };

  const getComplexityColor = (complexity: string): string => {
    return complexityColors[complexity] || '#6b7280';
  };

  const getQualityScore = (process: any): number => {
    if (process.dataType === 'brainstorming_session') {
      return process.outcomes?.qualityScore || 0;
    } else if (process.dataType === 'design_iteration') {
      const quality = process.quality || {};
      const scores = Object.values(quality).filter(v => typeof v === 'number') as number[];
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    } else if (process.dataType === 'storytelling_development') {
      const quality = process.quality || {};
      const scores = Object.values(quality).filter(v => typeof v === 'number') as number[];
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    } else if (process.dataType === 'creative_framework') {
      return process.effectiveness?.outcomeQuality || 0;
    }
    return 0;
  };

  const getProcessMetrics = (process: any): string => {
    if (process.dataType === 'brainstorming_session') {
      return `${process.outcomes?.totalIdeas || 0} ideas • ${process.participants?.participants?.length || 0} participants`;
    } else if (process.dataType === 'design_iteration') {
      return `v${process.version} • ${process.process?.changes?.length || 0} changes • ${process.metadata?.effort || 0}h effort`;
    } else if (process.dataType === 'storytelling_development') {
      return `${process.metadata?.length || 0} words • ${process.structure?.characters?.length || 0} characters`;
    } else if (process.dataType === 'creative_framework') {
      return `${process.effectiveness?.usageCount || 0} uses • ${((process.effectiveness?.successRate || 0) * 100).toFixed(0)}% success`;
    }
    return '';
  };

  const renderProcessCard = (process: any) => {
    const processIcon = getProcessIcon(process);
    const processColor = getProcessColor(process);
    const statusColor = getStatusColor(process.status);
    const complexityColor = getComplexityColor(process.metadata?.complexity || process.complexity);
    const qualityScore = getQualityScore(process);
    const metrics = getProcessMetrics(process);

    return (
      <Card
        key={process.id}
        sx={{
          mb: 2,
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
        }}
        onClick={() => handleLoadProcessIntoChat(process)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {/* Process Icon */}
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: processColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {processIcon}
              </Box>

              {/* Process Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {process.name}
                  </Typography>
                  <Chip
                    label={process.dataType.replace('_', ' ')}
                    size="small"
                    sx={{
                      bgcolor: processColor,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip
                    label={process.status}
                    size="small"
                    sx={{
                      bgcolor: statusColor,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  {(process.metadata?.complexity || process.complexity) && (
                    <Chip
                      label={process.metadata?.complexity || process.complexity}
                      size="small"
                      sx={{
                        bgcolor: complexityColor,
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </Box>

                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {process.description}
                </Typography>

                {/* Process Metrics */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    {metrics}
                  </Typography>
                  {process.metadata?.domain && (
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Domain: {process.metadata.domain}
                    </Typography>
                  )}
                  {process.metadata?.tags && process.metadata.tags.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Tags: {process.metadata.tags.join(', ')}
                    </Typography>
                  )}
                </Box>

                {/* Quality Score */}
                {qualityScore > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Quality Score
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {(qualityScore * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={qualityScore * 100}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: '#374151',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: qualityScore > 0.8 ? '#10b981' : 
                                  qualityScore > 0.6 ? '#f59e0b' : '#3b82f6'
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Timestamps */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Event sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Created: {process.createdAt.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Updated: {process.updatedAt.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Special indicators */}
                {process.dataType === 'brainstorming_session' && process.dynamics?.breakthrough && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      icon={<Star />}
                      label="Breakthrough Session"
                      size="small"
                      sx={{ bgcolor: '#f59e0b', color: 'white', fontSize: '0.7rem' }}
                    />
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
                    handleLoadProcessIntoChat(process);
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
                    setSelectedProcess(process);
                    setShowProcessDetails(true);
                  }}
                  sx={{ color: '#94a3b8' }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Process">
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
              <Tooltip title="Share Process">
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

  const getTabData = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: return filteredProcesses;
      case 1: return filteredProcesses.filter(p => p.dataType === 'brainstorming_session');
      case 2: return filteredProcesses.filter(p => p.dataType === 'design_iteration');
      case 3: return filteredProcesses.filter(p => p.dataType === 'storytelling_development');
      case 4: return filteredProcesses.filter(p => p.dataType === 'creative_framework');
      default: return [];
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Loading Creative Processes...
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
            <Palette sx={{ mr: 1, color: '#9c27b0' }} />
            Creative Processes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="New Brainstorming Session">
              <IconButton
                size="small"
                onClick={() => setShowCreateSession(true)}
                sx={{ color: '#9c27b0' }}
              >
                <Psychology />
              </IconButton>
            </Tooltip>
            <Tooltip title="New Design Iteration">
              <IconButton
                size="small"
                onClick={() => setShowCreateIteration(true)}
                sx={{ color: '#ff9800' }}
              >
                <Brush />
              </IconButton>
            </Tooltip>
            <Tooltip title="New Story">
              <IconButton
                size="small"
                onClick={() => setShowCreateStory(true)}
                sx={{ color: '#3f51b5' }}
              >
                <AutoStories />
              </IconButton>
            </Tooltip>
            <Tooltip title="New Framework">
              <IconButton
                size="small"
                onClick={() => setShowCreateFramework(true)}
                sx={{ color: '#4caf50' }}
              >
                <Extension />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={loadCreativeProcessesData}
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
            placeholder="Search creative processes..."
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
                <MenuItem value="brainstorming_session">Brainstorming</MenuItem>
                <MenuItem value="design_iteration">Design</MenuItem>
                <MenuItem value="storytelling_development">Storytelling</MenuItem>
                <MenuItem value="creative_framework">Framework</MenuItem>
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
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="published">Published</MenuItem>
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
                <MenuItem value="creative">Creative</MenuItem>
                <MenuItem value="education">Education</MenuItem>
                <MenuItem value="research">Research</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Confidentiality</InputLabel>
              <Select
                value={searchFilters.confidentiality}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, confidentiality: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="internal">Internal</MenuItem>
                <MenuItem value="confidential">Confidential</MenuItem>
                <MenuItem value="restricted">Restricted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Date Range</InputLabel>
              <Select
                value={searchFilters.dateRange}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
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
            '& .Mui-selected': { color: '#9c27b0' },
            '& .MuiTabs-indicator': { backgroundColor: '#9c27b0' }
          }}
        >
          <Tab label={`All (${filteredProcesses.length})`} />
          <Tab label={`Brainstorming (${filteredProcesses.filter(p => p.dataType === 'brainstorming_session').length})`} />
          <Tab label={`Design (${filteredProcesses.filter(p => p.dataType === 'design_iteration').length})`} />
          <Tab label={`Storytelling (${filteredProcesses.filter(p => p.dataType === 'storytelling_development').length})`} />
          <Tab label={`Frameworks (${filteredProcesses.filter(p => p.dataType === 'creative_framework').length})`} />
          <Tab label={`Analytics`} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTab < 5 && (
          <Box>
            {/* Overview Cards for Analytics */}
            {analytics && selectedTab === 0 && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                      {analytics.brainstormingMetrics?.activeSessions || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Active Sessions
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      {analytics.designMetrics?.totalIterations || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Design Iterations
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#3f51b5', fontWeight: 'bold' }}>
                      {analytics.storytellingMetrics?.totalStories || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Stories
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {analytics.frameworkMetrics?.publishedFrameworks || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Published Frameworks
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Process Cards */}
            {getTabData(selectedTab).map(renderProcessCard)}
          </Box>
        )}

        {selectedTab === 5 && (
          <Box>
            {/* Analytics */}
            {analytics ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Creative Processes Analytics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                        Brainstorming Metrics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Total Sessions
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {analytics.brainstormingMetrics?.totalSessions || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Average Ideas per Session
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {(analytics.brainstormingMetrics?.averageIdeasPerSession || 0).toFixed(1)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Breakthrough Rate
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {((analytics.brainstormingMetrics?.breakthroughRate || 0) * 100).toFixed(0)}%
                          </Typography>
                        </Box>
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
                <ShowChart sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
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

        {getTabData(selectedTab).length === 0 && selectedTab < 5 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Palette sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
              No creative processes found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Start your first creative process to capture and manage your creative work
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Psychology />}
                onClick={() => setShowCreateSession(true)}
                sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
              >
                Start Brainstorming
              </Button>
              <Button
                variant="contained"
                startIcon={<Brush />}
                onClick={() => setShowCreateIteration(true)}
                sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
              >
                Create Design
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Process Details Dialog */}
      <Dialog
        open={showProcessDetails}
        onClose={() => setShowProcessDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Process Details - {selectedProcess?.name}
        </DialogTitle>
        <DialogContent>
          {selectedProcess && (
            <Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                {selectedProcess.description}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Type: {selectedProcess.dataType} • Status: {selectedProcess.status}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Quality: {(getQualityScore(selectedProcess) * 100).toFixed(0)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProcessDetails(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedProcess) {
                handleLoadProcessIntoChat(selectedProcess);
              }
              setShowProcessDetails(false);
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Load into Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialogs */}
      {[
        { show: showCreateSession, setShow: setShowCreateSession, title: 'Create Brainstorming Session' },
        { show: showCreateIteration, setShow: setShowCreateIteration, title: 'Create Design Iteration' },
        { show: showCreateStory, setShow: setShowCreateStory, title: 'Create Story' },
        { show: showCreateFramework, setShow: setShowCreateFramework, title: 'Create Framework' }
      ].map((dialog, index) => (
        <Dialog
          key={index}
          open={dialog.show}
          onClose={() => dialog.setShow(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
          }}
        >
          <DialogTitle sx={{ color: 'white' }}>
            {dialog.title}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#94a3b8' }}>
              Creation form would be implemented here
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => dialog.setShow(false)} sx={{ color: '#94a3b8' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </Box>
  );
};

