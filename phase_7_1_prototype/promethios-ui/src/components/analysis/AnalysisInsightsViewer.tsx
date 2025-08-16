/**
 * Analysis & Insights Repository Viewer Component
 * 
 * UI component for viewing and managing analysis and insights in the Command Center.
 * Provides search, filtering, project management, and clickable integration
 * with chat interface for context loading and continuation.
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
  Paper
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
  Analytics,
  TrendingUp,
  Group,
  Star,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  Launch,
  Refresh,
  Assessment,
  Timeline,
  Compare,
  Psychology,
  BugReport,
  Lightbulb,
  Science,
  BarChart,
  ShowChart,
  PieChart,
  ScatterPlot,
  TableChart,
  Functions,
  Speed,
  Security,
  Insights,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';
import { AnalysisInsightsExtension, AnalysisProject, StatisticalAnalysis, ComparativeAnalysis, PatternRecognition, RootCauseAnalysis, AnalysisInsight } from '../../extensions/AnalysisInsightsExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface AnalysisInsightsViewerProps {
  chatbot: any;
  onAnalysisLoad: (analysis: any) => void;
  onInsightLoad: (insight: AnalysisInsight) => void;
  onProjectLoad: (project: AnalysisProject) => void;
}

interface SearchFilters {
  keywords: string;
  analysisType: string;
  category: string;
  dateRange: string;
  minConfidence: number;
  status: string;
  projectId: string;
}

const analysisTypeIcons: Record<string, React.ReactElement> = {
  'statistical': <Functions />,
  'comparative': <Compare />,
  'pattern': <Psychology />,
  'root_cause': <BugReport />,
  'data_insight': <Lightbulb />,
  'predictive_insight': <TrendingUp />
};

const analysisTypeColors: Record<string, string> = {
  'statistical': '#3b82f6',
  'comparative': '#10b981',
  'pattern': '#f59e0b',
  'root_cause': '#ef4444',
  'data_insight': '#8b5cf6',
  'predictive_insight': '#06b6d4'
};

const significanceColors: Record<string, string> = {
  'critical': '#ef4444',
  'high': '#f59e0b',
  'medium': '#10b981',
  'low': '#6b7280'
};

export const AnalysisInsightsViewer: React.FC<AnalysisInsightsViewerProps> = ({
  chatbot,
  onAnalysisLoad,
  onInsightLoad,
  onProjectLoad
}) => {
  // State management
  const [analysisExtension] = useState(() => new AnalysisInsightsExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Projects, 1: Analyses, 2: Insights, 3: Analytics
  
  // Data state
  const [projects, setProjects] = useState<AnalysisProject[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AnalysisProject[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<any[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<AnalysisInsight[]>([]);
  
  // UI state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keywords: '',
    analysisType: '',
    category: '',
    dateRange: 'all',
    minConfidence: 0,
    status: '',
    projectId: ''
  });
  const [selectedProject, setSelectedProject] = useState<AnalysisProject | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AnalysisInsight | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [showInsightDetails, setShowInsightDetails] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Initialize component
  useEffect(() => {
    initializeAnalysisRepository();
  }, []);

  const initializeAnalysisRepository = async () => {
    try {
      setLoading(true);
      
      // Initialize extensions
      await analysisExtension.initialize();
      await governanceService.initialize();
      
      // Load analysis data
      await loadAnalysisData();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize analysis repository:', error);
      setLoading(false);
    }
  };

  const loadAnalysisData = async () => {
    try {
      // Search for all analyses and insights
      const analysisResults = await analysisExtension.searchAnalyses({
        agentId: chatbot.id
      });
      
      const insightResults = await analysisExtension.searchInsights({
        agentId: chatbot.id
      });
      
      setAnalyses(analysisResults || []);
      setInsights(insightResults || []);
      setFilteredAnalyses(analysisResults || []);
      setFilteredInsights(insightResults || []);
      
      // Projects would be loaded here
      setProjects([]);
      setFilteredProjects([]);
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    }
  };

  // Search and filtering
  const handleSearch = useCallback(async () => {
    try {
      const searchQuery = {
        keywords: searchFilters.keywords ? searchFilters.keywords.split(' ') : undefined,
        type: searchFilters.analysisType || undefined,
        category: searchFilters.category || undefined,
        agentId: chatbot.id,
        minConfidence: searchFilters.minConfidence > 0 ? searchFilters.minConfidence : undefined,
        status: searchFilters.status || undefined,
        projectId: searchFilters.projectId || undefined
      };

      const analysisResults = await analysisExtension.searchAnalyses(searchQuery);
      const insightResults = await analysisExtension.searchInsights(searchQuery);
      
      setFilteredAnalyses(analysisResults);
      setFilteredInsights(insightResults);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchFilters, chatbot.id, analysisExtension]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchFilters.keywords || searchFilters.analysisType || searchFilters.category || searchFilters.minConfidence > 0) {
        handleSearch();
      } else {
        setFilteredAnalyses(analyses);
        setFilteredInsights(insights);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchFilters, analyses, insights, handleSearch]);

  // Event handlers
  const handleLoadAnalysisIntoChat = async (analysis: any) => {
    try {
      // Load analysis context into chat
      await governanceService.loadAnalysisContext(analysis.id);
      onAnalysisLoad(analysis);
      
      // Update access tracking would be implemented here
    } catch (error) {
      console.error('Failed to load analysis into chat:', error);
    }
  };

  const handleLoadInsightIntoChat = async (insight: AnalysisInsight) => {
    try {
      // Load insight context into chat
      await governanceService.loadInsightContext(insight.id);
      onInsightLoad(insight);
    } catch (error) {
      console.error('Failed to load insight into chat:', error);
    }
  };

  const handleShareAnalysis = async (analysis: any, targetAgents: string[]) => {
    try {
      await analysisExtension.shareAnalysis(
        analysis.id,
        targetAgents,
        chatbot.id,
        ['read', 'comment']
      );
    } catch (error) {
      console.error('Failed to share analysis:', error);
    }
  };

  const handleLoadAnalytics = async () => {
    try {
      const analyticsData = await analysisExtension.getAnalysisAnalytics(chatbot.id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const getAnalysisTypeLabel = (analysis: any): string => {
    if ('analysisType' in analysis) return analysis.analysisType;
    if ('comparisonType' in analysis) return 'comparative';
    if ('patternType' in analysis) return 'pattern';
    if ('methodology' in analysis) return 'root_cause';
    return 'unknown';
  };

  const getAnalysisTitle = (analysis: any): string => {
    return analysis.title || analysis.methodology || 'Untitled Analysis';
  };

  const getAnalysisDescription = (analysis: any): string => {
    return analysis.description || analysis.hypothesis || 'No description available';
  };

  const getConfidenceScore = (analysis: any): number => {
    return analysis.confidence || analysis.significance || 0.5;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const formatConfidence = (score: number): string => {
    if (typeof score === 'string') {
      return score;
    }
    return `${(score * 100).toFixed(0)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Loading Analysis & Insights Repository...
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
            <Analytics sx={{ mr: 1, color: '#3b82f6' }} />
            Analysis & Insights
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Create New Analysis">
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
                onClick={loadAnalysisData}
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
            placeholder="Search analyses and insights..."
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
          <Grid item xs={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Type</InputLabel>
              <Select
                value={searchFilters.analysisType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, analysisType: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="statistical">Statistical</MenuItem>
                <MenuItem value="comparative">Comparative</MenuItem>
                <MenuItem value="pattern">Pattern Recognition</MenuItem>
                <MenuItem value="root_cause">Root Cause</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Category</InputLabel>
              <Select
                value={searchFilters.category}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="behavior">Behavior</MenuItem>
                <MenuItem value="trend">Trend</MenuItem>
                <MenuItem value="anomaly">Anomaly</MenuItem>
                <MenuItem value="opportunity">Opportunity</MenuItem>
                <MenuItem value="risk">Risk</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Min Confidence</InputLabel>
              <Select
                value={searchFilters.minConfidence}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minConfidence: Number(e.target.value) }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value={0}>Any</MenuItem>
                <MenuItem value={0.5}>50%+</MenuItem>
                <MenuItem value={0.7}>70%+</MenuItem>
                <MenuItem value={0.8}>80%+</MenuItem>
                <MenuItem value={0.9}>90%+</MenuItem>
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
          sx={{
            '& .MuiTab-root': { color: '#94a3b8', minHeight: 40 },
            '& .Mui-selected': { color: '#3b82f6' },
            '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
          }}
        >
          <Tab label={`Projects (${filteredProjects.length})`} />
          <Tab label={`Analyses (${filteredAnalyses.length})`} />
          <Tab label={`Insights (${filteredInsights.length})`} />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTab === 0 && (
          <Box>
            {/* Analysis Projects */}
            {filteredProjects.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assessment sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No analysis projects found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Create First Project
                </Button>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                Project management coming soon
              </Typography>
            )}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            {/* Analyses */}
            {filteredAnalyses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Analytics sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No analyses found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Create First Analysis
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredAnalyses.map((analysis) => {
                  const analysisType = getAnalysisTypeLabel(analysis);
                  const typeIcon = analysisTypeIcons[analysisType] || <Analytics />;
                  const typeColor = analysisTypeColors[analysisType] || '#6b7280';
                  const confidence = getConfidenceScore(analysis);
                  
                  return (
                    <Grid item xs={12} key={analysis.id}>
                      <Card
                        sx={{
                          bgcolor: '#1e293b',
                          border: '1px solid #334155',
                          '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
                        }}
                        onClick={() => handleLoadAnalysisIntoChat(analysis)}
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

                              {/* Analysis Info */}
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {getAnalysisTitle(analysis)}
                                  </Typography>
                                  <Chip
                                    label={analysisType.replace('_', ' ')}
                                    size="small"
                                    sx={{
                                      bgcolor: typeColor,
                                      color: 'white',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                  {analysis.significance && (
                                    <Chip
                                      label={analysis.significance}
                                      size="small"
                                      sx={{
                                        bgcolor: significanceColors[analysis.significance] || '#6b7280',
                                        color: 'white',
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  )}
                                </Box>

                                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                                  {getAnalysisDescription(analysis)}
                                </Typography>

                                {/* Metrics */}
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Star sx={{ fontSize: 16, color: getConfidenceColor(confidence) }} />
                                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        Confidence: {formatConfidence(confidence)}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Schedule sx={{ fontSize: 16, color: '#94a3b8' }} />
                                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'Unknown date'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                {/* Analysis-specific details */}
                                {analysisType === 'statistical' && analysis.results && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                      Variables: {analysis.variables?.dependent?.length || 0} dependent, {analysis.variables?.independent?.length || 0} independent
                                    </Typography>
                                  </Box>
                                )}

                                {analysisType === 'comparative' && analysis.entities && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                      Comparing {analysis.entities.length} entities across {analysis.dimensions?.length || 0} dimensions
                                    </Typography>
                                  </Box>
                                )}

                                {analysisType === 'pattern' && analysis.patterns && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                      {analysis.patterns.length} patterns detected • {analysis.insights?.length || 0} insights generated
                                    </Typography>
                                  </Box>
                                )}

                                {analysisType === 'root_cause' && analysis.rootCauses && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                      {analysis.rootCauses.length} root causes identified • {analysis.solutions?.length || 0} solutions proposed
                                    </Typography>
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
                                    handleLoadAnalysisIntoChat(analysis);
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
                                    setSelectedAnalysis(analysis);
                                    setShowAnalysisDetails(true);
                                  }}
                                  sx={{ color: '#3b82f6' }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Share Analysis">
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

                          {/* Confidence Progress Bar */}
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Confidence Level
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {formatConfidence(confidence)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={typeof confidence === 'number' ? confidence * 100 : 50}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                bgcolor: '#374151',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getConfidenceColor(confidence)
                                }
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            {/* Insights */}
            {filteredInsights.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Lightbulb sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                  No insights found
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredInsights.map((insight) => (
                  <Card
                    key={insight.id}
                    sx={{
                      mb: 2,
                      bgcolor: '#1e293b',
                      border: '1px solid #334155',
                      '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
                    }}
                    onClick={() => handleLoadInsightIntoChat(insight)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Lightbulb sx={{ color: '#f59e0b', fontSize: 20 }} />
                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {insight.title}
                            </Typography>
                            <Chip
                              label={insight.type.replace('_', ' ')}
                              size="small"
                              sx={{ bgcolor: '#8b5cf6', color: 'white', fontSize: '0.7rem' }}
                            />
                            <Chip
                              label={insight.category}
                              size="small"
                              sx={{ bgcolor: '#6b7280', color: 'white', fontSize: '0.7rem' }}
                            />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                            {insight.insight.summary}
                          </Typography>

                          {/* Metrics */}
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Star sx={{ fontSize: 16, color: getConfidenceColor(insight.insight.confidence) }} />
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  Confidence: {(insight.insight.confidence * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Insights sx={{ fontSize: 16, color: '#f59e0b' }} />
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  Novelty: {(insight.insight.novelty * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {/* Recommendations count */}
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {insight.recommendations.length} recommendations • {insight.sourceAnalyses.length} source analyses
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                          <Tooltip title="Load into Chat">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadInsightIntoChat(insight);
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
                                setSelectedInsight(insight);
                                setShowInsightDetails(true);
                              }}
                              sx={{ color: '#3b82f6' }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Confidence and Novelty Progress Bars */}
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Confidence
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {(insight.insight.confidence * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={insight.insight.confidence * 100}
                              sx={{
                                height: 3,
                                borderRadius: 2,
                                bgcolor: '#374151',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getConfidenceColor(insight.insight.confidence)
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Novelty
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {(insight.insight.novelty * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={insight.insight.novelty * 100}
                              sx={{
                                height: 3,
                                borderRadius: 2,
                                bgcolor: '#374151',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: '#f59e0b'
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Box>
        )}

        {selectedTab === 3 && (
          <Box>
            {/* Analytics */}
            {analytics ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                  Analysis & Insights Analytics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Total Analyses
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                          {analytics.totalAnalyses}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Total Insights
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                          {analytics.totalInsights}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Avg Quality
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                          {(analytics.averageQuality * 100).toFixed(0)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Projects
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                          {analytics.totalProjects}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                          Recommendations
                        </Typography>
                        {analytics.recommendations.map((rec: string, index: number) => (
                          <Typography key={index} variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                            • {rec}
                          </Typography>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assessment sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  Click "View Analytics" to load analysis analytics
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Create Analysis Dialog */}
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
          Create New Analysis
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8' }}>
            Analysis creation form would be implemented here
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
            Create Analysis
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Details Dialog */}
      <Dialog
        open={showAnalysisDetails}
        onClose={() => setShowAnalysisDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Analysis Details - {selectedAnalysis ? getAnalysisTitle(selectedAnalysis) : ''}
        </DialogTitle>
        <DialogContent>
          {selectedAnalysis && (
            <Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                {getAnalysisDescription(selectedAnalysis)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Analysis type: {getAnalysisTypeLabel(selectedAnalysis)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Confidence: {formatConfidence(getConfidenceScore(selectedAnalysis))}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysisDetails(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedAnalysis) {
                handleLoadAnalysisIntoChat(selectedAnalysis);
              }
              setShowAnalysisDetails(false);
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Load into Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Insight Details Dialog */}
      <Dialog
        open={showInsightDetails}
        onClose={() => setShowInsightDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Insight Details - {selectedInsight?.title}
        </DialogTitle>
        <DialogContent>
          {selectedInsight && (
            <Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                {selectedInsight.insight.summary}
              </Typography>
              
              {selectedInsight.insight.details.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                    Details:
                  </Typography>
                  {selectedInsight.insight.details.map((detail, index) => (
                    <Typography key={index} variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                      • {detail}
                    </Typography>
                  ))}
                </Box>
              )}

              {selectedInsight.recommendations.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                    Recommendations:
                  </Typography>
                  {selectedInsight.recommendations.map((rec, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        • {rec.action}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', ml: 2 }}>
                        Priority: {rec.priority} | Impact: {rec.impact} | Effort: {rec.effort}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInsightDetails(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedInsight) {
                handleLoadInsightIntoChat(selectedInsight);
              }
              setShowInsightDetails(false);
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

