/**
 * Learning & Adaptation Viewer Component
 * 
 * UI component for viewing and managing learning and adaptation data in the Command Center.
 * Handles user preferences, context understanding, interaction patterns, failed approaches,
 * behavioral adaptations, knowledge acquisition, and performance optimization.
 * Provides learning analytics and clickable integration with chat interface.
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
  Rating
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
  Psychology,
  TrendingUp,
  School,
  Lightbulb,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Star,
  ThumbUp,
  ThumbDown,
  Insights,
  Analytics,
  PersonalVideo,
  Settings,
  Tune,
  AutoFixHigh,
  Memory,
  BrainIcon,
  EmojiObjects,
  Timeline,
  Assessment,
  Speed,
  Favorite,
  FavoriteBorder,
  Bookmark,
  BookmarkBorder,
  Flag,
  PriorityHigh,
  TrendingDown,
  TrendingFlat,
  Sync,
  SyncProblem,
  Verified,
  NewReleases,
  Update,
  History,
  Restore,
  Compare,
  ShowChart,
  BarChart,
  PieChart,
  DonutLarge
} from '@mui/icons-material';
import { LearningAdaptationExtension, UserPreference, ContextUnderstanding, InteractionPattern, FailedApproach, BehavioralAdaptation, KnowledgeAcquisition, PerformanceOptimization } from '../../extensions/LearningAdaptationExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface LearningAdaptationViewerProps {
  chatbot: any;
  onLearningLoad: (learningData: any) => void;
  onAdaptationApply: (adaptation: BehavioralAdaptation) => void;
}

interface SearchFilters {
  keywords: string;
  dataType: string;
  category: string;
  priority: string;
  confidence: number;
  dateRange: string;
}

const dataTypeIcons: Record<string, React.ReactElement> = {
  'preference': <Favorite />,
  'context': <Psychology />,
  'pattern': <Timeline />,
  'failure': <Warning />,
  'adaptation': <AutoFixHigh />,
  'knowledge': <School />,
  'optimization': <Speed />
};

const dataTypeColors: Record<string, string> = {
  'preference': '#e91e63',
  'context': '#9c27b0',
  'pattern': '#3f51b5',
  'failure': '#ff5722',
  'adaptation': '#00bcd4',
  'knowledge': '#4caf50',
  'optimization': '#ff9800'
};

const priorityColors: Record<string, string> = {
  'low': '#6b7280',
  'medium': '#f59e0b',
  'high': '#ef4444',
  'critical': '#dc2626'
};

const strengthColors: Record<string, string> = {
  'weak': '#6b7280',
  'moderate': '#f59e0b',
  'strong': '#10b981',
  'very_strong': '#059669'
};

const stabilityColors: Record<string, string> = {
  'volatile': '#ef4444',
  'emerging': '#f59e0b',
  'stable': '#10b981',
  'very_stable': '#059669',
  'proven': '#047857'
};

export const LearningAdaptationViewer: React.FC<LearningAdaptationViewerProps> = ({
  chatbot,
  onLearningLoad,
  onAdaptationApply
}) => {
  // State management
  const [learningExtension] = useState(() => new LearningAdaptationExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Overview, 1: Preferences, 2: Context, 3: Patterns, 4: Failures, 5: Adaptations, 6: Knowledge, 7: Optimization, 8: Analytics
  
  // Data state
  const [learningData, setLearningData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // UI state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keywords: '',
    dataType: '',
    category: '',
    priority: '',
    confidence: 0,
    dateRange: 'all'
  });
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showAdaptationDialog, setShowAdaptationDialog] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeLearningRepository();
  }, []);

  const initializeLearningRepository = async () => {
    try {
      setLoading(true);
      
      // Initialize extensions
      await learningExtension.initialize();
      await governanceService.initialize();
      
      // Load learning data
      await loadLearningData();
      
      // Load analytics
      await loadAnalytics();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize learning repository:', error);
      setLoading(false);
    }
  };

  const loadLearningData = async () => {
    try {
      // Search for all learning data
      const results = await learningExtension.searchLearningData(chatbot.id, {});
      
      setLearningData(results || []);
      setFilteredData(results || []);
    } catch (error) {
      console.error('Failed to load learning data:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await learningExtension.getLearningAnalytics(chatbot.id);
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
        type: searchFilters.dataType || undefined,
        category: searchFilters.category || undefined
      };

      const results = await learningExtension.searchLearningData(chatbot.id, searchQuery);
      
      // Apply additional filters
      let filtered = results;
      
      if (searchFilters.priority) {
        filtered = filtered.filter(item => 
          item.metadata?.priority === searchFilters.priority ||
          item.priority === searchFilters.priority
        );
      }
      
      if (searchFilters.confidence > 0) {
        filtered = filtered.filter(item => {
          const confidence = item.preference?.confidence || 
                           item.effectiveness?.successRate || 
                           item.validation?.validationScore || 
                           item.mastery?.currentLevel === 'expert' ? 1 : 0.5;
          return confidence >= searchFilters.confidence / 100;
        });
      }
      
      setFilteredData(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchFilters, chatbot.id, learningExtension]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchFilters.keywords || searchFilters.dataType || searchFilters.category || searchFilters.priority || searchFilters.confidence > 0) {
        handleSearch();
      } else {
        setFilteredData(learningData);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchFilters, learningData, handleSearch]);

  // Event handlers
  const handleLoadLearningIntoChat = async (item: any) => {
    try {
      // Load learning context into chat
      await governanceService.loadLearningContext(item.id, item.dataType);
      onLearningLoad(item);
    } catch (error) {
      console.error('Failed to load learning into chat:', error);
    }
  };

  const handleApplyAdaptation = async (adaptation: BehavioralAdaptation) => {
    try {
      await governanceService.applyBehavioralAdaptation(adaptation.id);
      onAdaptationApply(adaptation);
    } catch (error) {
      console.error('Failed to apply adaptation:', error);
    }
  };

  const getDataTypeCount = (type: string): number => {
    return filteredData.filter(item => item.dataType === type).length;
  };

  const getConfidenceScore = (item: any): number => {
    if (item.preference?.confidence) return item.preference.confidence;
    if (item.effectiveness?.successRate) return item.effectiveness.successRate;
    if (item.validation?.validationScore) return item.validation.validationScore;
    if (item.mastery?.currentLevel === 'expert') return 1.0;
    if (item.mastery?.currentLevel === 'advanced') return 0.8;
    if (item.mastery?.currentLevel === 'intermediate') return 0.6;
    if (item.mastery?.currentLevel === 'beginner') return 0.4;
    return 0.5;
  };

  const getItemTitle = (item: any): string => {
    if (item.dataType === 'preference') return `${item.category} - ${item.subcategory}`;
    if (item.dataType === 'context') return item.context?.name || 'Context Understanding';
    if (item.dataType === 'pattern') return item.pattern?.name || 'Interaction Pattern';
    if (item.dataType === 'failure') return item.approach?.name || 'Failed Approach';
    if (item.dataType === 'adaptation') return item.adaptation?.name || 'Behavioral Adaptation';
    if (item.dataType === 'knowledge') return item.knowledge?.area || 'Knowledge Area';
    if (item.dataType === 'optimization') return item.optimization?.name || 'Performance Optimization';
    return 'Learning Item';
  };

  const getItemDescription = (item: any): string => {
    if (item.dataType === 'preference') return `${item.preference?.type}: ${item.preference?.value}`;
    if (item.dataType === 'context') return item.context?.description || 'Context description';
    if (item.dataType === 'pattern') return item.pattern?.description || 'Pattern description';
    if (item.dataType === 'failure') return item.approach?.description || 'Failed approach description';
    if (item.dataType === 'adaptation') return item.adaptation?.description || 'Adaptation description';
    if (item.dataType === 'knowledge') return item.knowledge?.description || 'Knowledge description';
    if (item.dataType === 'optimization') return item.optimization?.description || 'Optimization description';
    return 'Learning item description';
  };

  const renderLearningCard = (item: any) => {
    const dataType = item.dataType;
    const typeIcon = dataTypeIcons[dataType] || <EmojiObjects />;
    const typeColor = dataTypeColors[dataType] || '#6b7280';
    const confidence = getConfidenceScore(item);
    const title = getItemTitle(item);
    const description = getItemDescription(item);

    return (
      <Card
        key={item.id}
        sx={{
          mb: 2,
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
        }}
        onClick={() => handleLoadLearningIntoChat(item)}
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

              {/* Learning Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {title}
                  </Typography>
                  <Chip
                    label={dataType}
                    size="small"
                    sx={{
                      bgcolor: typeColor,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  {item.metadata?.priority && (
                    <Chip
                      label={item.metadata.priority}
                      size="small"
                      sx={{
                        bgcolor: priorityColors[item.metadata.priority] || '#6b7280',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </Box>

                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {description}
                </Typography>

                {/* Type-specific details */}
                {dataType === 'preference' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Strength: {item.preference?.strength} • 
                      Evidence: {item.evidence?.interactions?.length || 0} interactions • 
                      Consistency: {((item.evidence?.consistency || 0.5) * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Scope: {item.metadata?.scope} • 
                      Applied: {item.adaptation?.applicationCount || 0} times • 
                      Success Rate: {((item.adaptation?.successRate || 0) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}

                {dataType === 'context' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Domain: {item.context?.domain} • 
                      Complexity: {item.context?.complexity} • 
                      Importance: {item.context?.importance}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Accuracy: {((item.evolution?.accuracy || 0.5) * 100).toFixed(0)}% • 
                      Completeness: {((item.evolution?.completeness || 0.5) * 100).toFixed(0)}% • 
                      Stability: {((item.evolution?.stability || 0.5) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}

                {dataType === 'pattern' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Type: {item.patternType} • 
                      Success Rate: {((item.effectiveness?.successRate || 0) * 100).toFixed(0)}% • 
                      Used: {item.usage?.applicationCount || 0} times
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      User Satisfaction: {(item.effectiveness?.userSatisfaction || 0).toFixed(1)}/5 • 
                      Stability: {item.metadata?.stability}
                    </Typography>
                  </Box>
                )}

                {dataType === 'failure' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Approach: {item.approachType} • 
                      Severity: {item.metadata?.severity} • 
                      Resolved: {item.metadata?.resolved ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Root Causes: {item.failure?.rootCauses?.length || 0} • 
                      Prevention Rules: {item.prevention?.avoidanceRules?.length || 0}
                    </Typography>
                  </Box>
                )}

                {dataType === 'adaptation' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Type: {item.adaptationType} • 
                      Risk Level: {item.metadata?.riskLevel} • 
                      Reversible: {item.metadata?.reversible ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Success: {item.validation?.overallSuccess ? 'Yes' : 'Pending'} • 
                      Confidence: {((item.validation?.confidence || 0) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}

                {dataType === 'knowledge' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Area: {item.knowledge?.area} • 
                      Level: {item.mastery?.currentLevel} • 
                      Domain: {item.knowledge?.domain}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Competencies: {item.mastery?.competencies?.length || 0} • 
                      Applications: {item.application?.applications?.length || 0}
                    </Typography>
                  </Box>
                )}

                {dataType === 'optimization' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Type: {item.optimizationType} • 
                      Target: {item.optimization?.targetMetric} • 
                      Phase: {item.implementation?.currentPhase || 'Planning'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Progress: {((item.implementation?.progress || 0) * 100).toFixed(0)}% • 
                      Improvement: {item.results?.improvement ? `${item.results.improvement.toFixed(1)}%` : 'TBD'}
                    </Typography>
                  </Box>
                )}

                {/* Confidence/Quality Bar */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Confidence/Quality
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {(confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={confidence * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: '#374151',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: confidence > 0.8 ? '#10b981' : confidence > 0.6 ? '#f59e0b' : '#ef4444'
                      }
                    }}
                  />
                </Box>

                {/* Metadata */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Update sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Never updated'}
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
                    handleLoadLearningIntoChat(item);
                  }}
                  sx={{ color: '#10b981' }}
                >
                  <Launch />
                </IconButton>
              </Tooltip>
              {dataType === 'adaptation' && (
                <Tooltip title="Apply Adaptation">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyAdaptation(item);
                    }}
                    sx={{ color: '#3b82f6' }}
                  >
                    <AutoFixHigh />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                    setShowItemDetails(true);
                  }}
                  sx={{ color: '#94a3b8' }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Learning">
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
          Loading Learning & Adaptation Data...
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
            <Psychology sx={{ mr: 1, color: '#9c27b0' }} />
            Learning & Adaptation
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Create Adaptation">
              <IconButton
                size="small"
                onClick={() => setShowAdaptationDialog(true)}
                sx={{ color: '#10b981' }}
              >
                <Add />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Analytics">
              <IconButton
                size="small"
                onClick={loadAnalytics}
                sx={{ color: '#3b82f6' }}
              >
                <Analytics />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={loadLearningData}
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
            placeholder="Search learning data..."
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
                value={searchFilters.dataType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dataType: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="preference">Preferences</MenuItem>
                <MenuItem value="context">Context</MenuItem>
                <MenuItem value="pattern">Patterns</MenuItem>
                <MenuItem value="failure">Failures</MenuItem>
                <MenuItem value="adaptation">Adaptations</MenuItem>
                <MenuItem value="knowledge">Knowledge</MenuItem>
                <MenuItem value="optimization">Optimization</MenuItem>
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
          <Grid item xs={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                Min Confidence: {searchFilters.confidence}%
              </Typography>
              <Slider
                value={searchFilters.confidence}
                onChange={(_, value) => setSearchFilters(prev => ({ ...prev, confidence: value as number }))}
                min={0}
                max={100}
                step={10}
                size="small"
                sx={{
                  color: '#3b82f6',
                  '& .MuiSlider-thumb': { bgcolor: '#3b82f6' },
                  '& .MuiSlider-track': { bgcolor: '#3b82f6' },
                  '& .MuiSlider-rail': { bgcolor: '#374151' }
                }}
              />
            </Box>
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
          <Tab label={`Overview`} />
          <Tab label={`Preferences (${getDataTypeCount('preference')})`} />
          <Tab label={`Context (${getDataTypeCount('context')})`} />
          <Tab label={`Patterns (${getDataTypeCount('pattern')})`} />
          <Tab label={`Failures (${getDataTypeCount('failure')})`} />
          <Tab label={`Adaptations (${getDataTypeCount('adaptation')})`} />
          <Tab label={`Knowledge (${getDataTypeCount('knowledge')})`} />
          <Tab label={`Optimization (${getDataTypeCount('optimization')})`} />
          <Tab label={`Analytics`} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTab === 0 && (
          <Box>
            {/* Overview */}
            {analytics && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                      {analytics.totalLearningItems || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Total Learning Items
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                      {((analytics.adaptationSuccessRate || 0) * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Adaptation Success Rate
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      {(analytics.learningVelocity || 0).toFixed(1)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Learning Velocity/Week
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: '#10b981' }} />
                      <Typography variant="body1" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                        {analytics.userSatisfactionTrend || 'Stable'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Satisfaction Trend
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Recent Learning Items */}
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Recent Learning Items
            </Typography>
            {filteredData.slice(0, 10).map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            {/* User Preferences */}
            {filteredData.filter(item => item.dataType === 'preference').map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            {/* Context Understanding */}
            {filteredData.filter(item => item.dataType === 'context').map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 3 && (
          <Box>
            {/* Interaction Patterns */}
            {filteredData.filter(item => item.dataType === 'pattern').map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 4 && (
          <Box>
            {/* Failed Approaches */}
            {filteredData.filter(item => item.dataType === 'failure').map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 5 && (
          <Box>
            {/* Behavioral Adaptations */}
            {filteredData.filter(item => item.dataType === 'adaptation').map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 6 && (
          <Box>
            {/* Knowledge Acquisition */}
            {filteredData.filter(item => item.dataType === 'knowledge').map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 7 && (
          <Box>
            {/* Performance Optimization */}
            {filteredData.filter(item => item.dataType === 'optimization').map(renderLearningCard)}
          </Box>
        )}

        {selectedTab === 8 && (
          <Box>
            {/* Analytics */}
            {analytics ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Learning Analytics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', p: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                        Learning Distribution
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(dataTypeColors).map(([type, color]) => (
                          <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 16, height: 16, bgcolor: color, borderRadius: 1 }} />
                            <Typography variant="body2" sx={{ color: '#94a3b8', flex: 1 }}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              {getDataTypeCount(type)}
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

        {filteredData.length === 0 && selectedTab !== 0 && selectedTab !== 8 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Psychology sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
              No learning data found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Learning data will appear here as the agent interacts and learns
            </Typography>
          </Box>
        )}
      </Box>

      {/* Item Details Dialog */}
      <Dialog
        open={showItemDetails}
        onClose={() => setShowItemDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Learning Item Details - {selectedItem ? getItemTitle(selectedItem) : ''}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                {getItemDescription(selectedItem)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Type: {selectedItem.dataType}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Confidence: {(getConfidenceScore(selectedItem) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Created: {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'Unknown'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowItemDetails(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedItem) {
                handleLoadLearningIntoChat(selectedItem);
              }
              setShowItemDetails(false);
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Load into Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Adaptation Dialog */}
      <Dialog
        open={showAdaptationDialog}
        onClose={() => setShowAdaptationDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Create Behavioral Adaptation
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8' }}>
            Adaptation creation form would be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdaptationDialog(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Create Adaptation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

