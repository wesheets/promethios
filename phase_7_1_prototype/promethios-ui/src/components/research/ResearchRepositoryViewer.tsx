/**
 * Research Repository Viewer Component
 * 
 * UI component for viewing and managing research in the Command Center.
 * Provides search, filtering, thread management, and clickable integration
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Stack
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
  Science,
  TrendingUp,
  Group,
  Star,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  Launch,
  Refresh,
  Analytics
} from '@mui/icons-material';
import { ResearchRepositoryExtension, ResearchThread, ResearchEntry, ResearchSource, ResearchFinding } from '../../extensions/ResearchRepositoryExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface ResearchRepositoryViewerProps {
  chatbot: any;
  onResearchLoad: (research: ResearchEntry) => void;
  onThreadLoad: (thread: ResearchThread) => void;
  onSourceLoad: (source: ResearchSource) => void;
}

interface SearchFilters {
  keywords: string;
  researchType: string;
  dateRange: string;
  minCredibility: number;
  tags: string[];
  collaborators: string[];
}

export const ResearchRepositoryViewer: React.FC<ResearchRepositoryViewerProps> = ({
  chatbot,
  onResearchLoad,
  onThreadLoad,
  onSourceLoad
}) => {
  // State management
  const [researchExtension] = useState(() => new ResearchRepositoryExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Threads, 1: Entries, 2: Analytics
  
  // Data state
  const [researchThreads, setResearchThreads] = useState<ResearchThread[]>([]);
  const [researchEntries, setResearchEntries] = useState<ResearchEntry[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ResearchThread[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ResearchEntry[]>([]);
  
  // UI state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keywords: '',
    researchType: '',
    dateRange: 'all',
    minCredibility: 0,
    tags: [],
    collaborators: []
  });
  const [selectedThread, setSelectedThread] = useState<ResearchThread | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ResearchEntry | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Initialize component
  useEffect(() => {
    initializeResearchRepository();
  }, []);

  const initializeResearchRepository = async () => {
    try {
      setLoading(true);
      
      // Initialize extensions
      await researchExtension.initialize();
      await governanceService.initialize();
      
      // Load research data
      await loadResearchData();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize research repository:', error);
      setLoading(false);
    }
  };

  const loadResearchData = async () => {
    try {
      // Search for all research threads and entries
      const threads = await researchExtension.searchResearch({
        agentId: chatbot.id
      });
      
      const entries = await researchExtension.searchResearch({
        agentId: chatbot.id
      });
      
      setResearchThreads(threads as any || []);
      setResearchEntries(entries || []);
      setFilteredThreads(threads as any || []);
      setFilteredEntries(entries || []);
    } catch (error) {
      console.error('Failed to load research data:', error);
    }
  };

  // Search and filtering
  const handleSearch = useCallback(async () => {
    try {
      const searchQuery = {
        keywords: searchFilters.keywords ? searchFilters.keywords.split(' ') : undefined,
        researchType: searchFilters.researchType || undefined,
        agentId: chatbot.id,
        minCredibility: searchFilters.minCredibility > 0 ? searchFilters.minCredibility : undefined,
        tags: searchFilters.tags.length > 0 ? searchFilters.tags : undefined
      };

      const results = await researchExtension.searchResearch(searchQuery);
      setFilteredEntries(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchFilters, chatbot.id, researchExtension]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchFilters.keywords || searchFilters.researchType || searchFilters.minCredibility > 0) {
        handleSearch();
      } else {
        setFilteredEntries(researchEntries);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchFilters, researchEntries, handleSearch]);

  // Event handlers
  const handleCreateThread = async (threadData: any) => {
    try {
      const newThread = await researchExtension.createResearchThread({
        ...threadData,
        agentId: chatbot.id
      });
      
      setResearchThreads(prev => [...prev, newThread]);
      setFilteredThreads(prev => [...prev, newThread]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create research thread:', error);
    }
  };

  const handleLoadResearchIntoChat = async (entry: ResearchEntry) => {
    try {
      // Load research context into chat
      await governanceService.loadResearchContext(entry.id);
      onResearchLoad(entry);
      
      // Update access tracking
      entry.accessCount++;
      entry.lastAccessedAt = new Date();
    } catch (error) {
      console.error('Failed to load research into chat:', error);
    }
  };

  const handleShareResearch = async (entry: ResearchEntry, targetAgents: string[]) => {
    try {
      await researchExtension.shareResearchEntry(
        entry.id,
        targetAgents,
        chatbot.id,
        `Sharing research: ${entry.title}`
      );
    } catch (error) {
      console.error('Failed to share research:', error);
    }
  };

  const handleLoadAnalytics = async () => {
    try {
      const analyticsData = await researchExtension.getResearchAnalytics(chatbot.id);
      setAnalytics(analyticsData);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getCompletenessColor = (score: number) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Loading Research Repository...
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
            <Science sx={{ mr: 1, color: '#3b82f6' }} />
            Research Repository
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Create New Thread">
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
                <Analytics />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={loadResearchData}
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
            placeholder="Search research..."
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
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Type</InputLabel>
              <Select
                value={searchFilters.researchType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, researchType: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="market_analysis">Market Analysis</MenuItem>
                <MenuItem value="technical_research">Technical Research</MenuItem>
                <MenuItem value="competitive_analysis">Competitive Analysis</MenuItem>
                <MenuItem value="user_research">User Research</MenuItem>
                <MenuItem value="literature_review">Literature Review</MenuItem>
                <MenuItem value="trend_analysis">Trend Analysis</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Min Credibility</InputLabel>
              <Select
                value={searchFilters.minCredibility}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minCredibility: Number(e.target.value) }))}
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
          <Tab label={`Threads (${filteredThreads.length})`} />
          <Tab label={`Entries (${filteredEntries.length})`} />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTab === 0 && (
          <Box>
            {/* Research Threads */}
            {filteredThreads.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Science sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No research threads found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Create First Thread
                </Button>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredThreads.map((thread) => (
                  <ListItem
                    key={thread.id}
                    sx={{
                      mb: 1,
                      bgcolor: '#1e293b',
                      borderRadius: 1,
                      border: '1px solid #334155',
                      '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {thread.title}
                          </Typography>
                          <Chip
                            label={thread.status}
                            size="small"
                            sx={{
                              bgcolor: thread.status === 'completed' ? '#10b981' : 
                                      thread.status === 'active' ? '#3b82f6' : '#6b7280',
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={thread.priority}
                            size="small"
                            sx={{
                              bgcolor: thread.priority === 'urgent' ? '#ef4444' :
                                      thread.priority === 'high' ? '#f59e0b' : '#6b7280',
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                            {thread.description}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {thread.entries.length} entries • {thread.collaborators.length} collaborators
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Load Thread">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedThread(thread);
                              onThreadLoad(thread);
                            }}
                            sx={{ color: '#3b82f6' }}
                          >
                            <Launch />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedThread(thread)}
                            sx={{ color: '#94a3b8' }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            {/* Research Entries */}
            {filteredEntries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Science sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                  No research entries found
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    sx={{
                      mb: 2,
                      bgcolor: '#1e293b',
                      border: '1px solid #334155',
                      '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
                    }}
                    onClick={() => handleLoadResearchIntoChat(entry)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                            {entry.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                            {entry.description}
                          </Typography>
                          
                          {/* Metrics */}
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Star sx={{ fontSize: 16, color: getCredibilityColor(entry.credibilityScore) }} />
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  Credibility: {(entry.credibilityScore * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle sx={{ fontSize: 16, color: getCompletenessColor(entry.completeness) }} />
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  Complete: {(entry.completeness * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {/* Tags and Type */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={entry.researchType.replace(/_/g, ' ')}
                              size="small"
                              sx={{ bgcolor: '#3b82f6', color: 'white', fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {entry.sources.length} sources • {entry.findings.length} findings
                            </Typography>
                          </Box>

                          {/* Access Info */}
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Accessed {entry.accessCount} times • Last: {entry.lastAccessedAt.toLocaleDateString()}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                          <Tooltip title="Load into Chat">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadResearchIntoChat(entry);
                              }}
                              sx={{ color: '#10b981' }}
                            >
                              <Launch />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share Research">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open share dialog
                              }}
                              sx={{ color: '#3b82f6' }}
                            >
                              <Share />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntry(entry);
                              }}
                              sx={{ color: '#94a3b8' }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Progress Bars */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Research Quality
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {(entry.qualityMetrics.overallQuality * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={entry.qualityMetrics.overallQuality * 100}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: '#374151',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: entry.qualityMetrics.overallQuality > 0.7 ? '#10b981' : 
                                      entry.qualityMetrics.overallQuality > 0.5 ? '#f59e0b' : '#ef4444'
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            {/* Analytics */}
            {analytics ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                  Research Analytics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Total Entries
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                          {analytics.totalEntries}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Avg Credibility
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                          {(analytics.averageCredibility * 100).toFixed(0)}%
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
                <Analytics sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  Click "View Analytics" to load research analytics
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Create Thread Dialog */}
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
          Create Research Thread
        </DialogTitle>
        <DialogContent>
          {/* Create thread form would go here */}
          <Typography sx={{ color: '#94a3b8' }}>
            Research thread creation form would be implemented here
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
            Create Thread
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

