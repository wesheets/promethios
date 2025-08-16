/**
 * Documents Repository Viewer Component
 * 
 * UI component for viewing and managing documents/artifacts in the Command Center.
 * Provides search, filtering, version control, and clickable integration
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
  Menu,
  ListItemIcon
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
  Description,
  Code,
  Image,
  VideoFile,
  AudioFile,
  Slideshow,
  TableChart,
  Palette,
  DataObject,
  Settings,
  Launch,
  Refresh,
  Analytics,
  History,
  FileCopy,
  CloudDownload,
  Security,
  Star,
  Schedule,
  Group,
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
  MoreVert
} from '@mui/icons-material';
import { DocumentsArtifactsExtension, DocumentArtifact, ArtifactVersion, ArtifactTemplate } from '../../extensions/DocumentsArtifactsExtension';
import { ChatPanelGovernanceService } from '../../services/ChatPanelGovernanceService';

interface DocumentsRepositoryViewerProps {
  chatbot: any;
  onDocumentLoad: (document: DocumentArtifact) => void;
  onVersionLoad: (document: DocumentArtifact, version: ArtifactVersion) => void;
  onTemplateLoad: (template: ArtifactTemplate) => void;
}

interface SearchFilters {
  keywords: string;
  type: string;
  category: string;
  dateRange: string;
  minQuality: number;
  tags: string[];
  status: string;
}

const typeIcons: Record<string, React.ReactElement> = {
  'document': <Description />,
  'code': <Code />,
  'image': <Image />,
  'video': <VideoFile />,
  'audio': <AudioFile />,
  'presentation': <Slideshow />,
  'spreadsheet': <TableChart />,
  'design': <Palette />,
  'data': <DataObject />,
  'configuration': <Settings />
};

const statusColors: Record<string, string> = {
  'draft': '#6b7280',
  'review': '#f59e0b',
  'approved': '#10b981',
  'published': '#3b82f6',
  'deprecated': '#ef4444',
  'archived': '#4b5563'
};

export const DocumentsRepositoryViewer: React.FC<DocumentsRepositoryViewerProps> = ({
  chatbot,
  onDocumentLoad,
  onVersionLoad,
  onTemplateLoad
}) => {
  // State management
  const [documentsExtension] = useState(() => new DocumentsArtifactsExtension());
  const [governanceService] = useState(() => new ChatPanelGovernanceService());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Documents, 1: Templates, 2: Analytics
  
  // Data state
  const [documents, setDocuments] = useState<DocumentArtifact[]>([]);
  const [templates, setTemplates] = useState<ArtifactTemplate[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentArtifact[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ArtifactTemplate[]>([]);
  
  // UI state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keywords: '',
    type: '',
    category: '',
    dateRange: 'all',
    minQuality: 0,
    tags: [],
    status: ''
  });
  const [selectedDocument, setSelectedDocument] = useState<DocumentArtifact | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    document: DocumentArtifact;
  } | null>(null);

  // Initialize component
  useEffect(() => {
    initializeDocumentsRepository();
  }, []);

  const initializeDocumentsRepository = async () => {
    try {
      setLoading(true);
      
      // Initialize extensions
      await documentsExtension.initialize();
      await governanceService.initialize();
      
      // Load documents data
      await loadDocumentsData();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize documents repository:', error);
      setLoading(false);
    }
  };

  const loadDocumentsData = async () => {
    try {
      // Search for all documents and templates
      const docs = await documentsExtension.searchArtifacts({
        agentId: chatbot.id
      });
      
      setDocuments(docs || []);
      setFilteredDocuments(docs || []);
      
      // Load templates would be implemented here
      setTemplates([]);
      setFilteredTemplates([]);
    } catch (error) {
      console.error('Failed to load documents data:', error);
    }
  };

  // Search and filtering
  const handleSearch = useCallback(async () => {
    try {
      const searchQuery = {
        keywords: searchFilters.keywords ? searchFilters.keywords.split(' ') : undefined,
        type: searchFilters.type || undefined,
        category: searchFilters.category || undefined,
        agentId: chatbot.id,
        minQuality: searchFilters.minQuality > 0 ? searchFilters.minQuality : undefined,
        tags: searchFilters.tags.length > 0 ? searchFilters.tags : undefined,
        status: searchFilters.status || undefined
      };

      const results = await documentsExtension.searchArtifacts(searchQuery);
      setFilteredDocuments(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchFilters, chatbot.id, documentsExtension]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchFilters.keywords || searchFilters.type || searchFilters.category || searchFilters.minQuality > 0) {
        handleSearch();
      } else {
        setFilteredDocuments(documents);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchFilters, documents, handleSearch]);

  // Event handlers
  const handleLoadDocumentIntoChat = async (document: DocumentArtifact, version?: ArtifactVersion) => {
    try {
      // Load document context into chat
      await governanceService.loadDocumentContext(document.id, version?.id);
      
      if (version) {
        onVersionLoad(document, version);
      } else {
        onDocumentLoad(document);
      }
      
      // Update access tracking
      document.usage.viewCount++;
      document.usage.lastAccessed = new Date();
    } catch (error) {
      console.error('Failed to load document into chat:', error);
    }
  };

  const handleShareDocument = async (document: DocumentArtifact, targetAgents: string[], permissions: string[]) => {
    try {
      await documentsExtension.shareArtifact(
        document.id,
        targetAgents,
        chatbot.id,
        permissions,
        `Sharing document: ${document.title}`
      );
    } catch (error) {
      console.error('Failed to share document:', error);
    }
  };

  const handleForkDocument = async (document: DocumentArtifact) => {
    try {
      const forkedDoc = await documentsExtension.forkArtifact(
        document.id,
        chatbot.id,
        `${document.title} (Fork)`
      );
      
      setDocuments(prev => [...prev, forkedDoc]);
      setFilteredDocuments(prev => [...prev, forkedDoc]);
    } catch (error) {
      console.error('Failed to fork document:', error);
    }
  };

  const handleExportDocument = async (document: DocumentArtifact, format: string) => {
    try {
      const result = await documentsExtension.exportArtifact(
        document.id,
        format,
        {},
        chatbot.id
      );
      
      if (result.success && result.filePath) {
        // Trigger download
        window.open(result.filePath, '_blank');
      }
    } catch (error) {
      console.error('Failed to export document:', error);
    }
  };

  const handleLoadAnalytics = async () => {
    try {
      if (selectedDocument) {
        const analyticsData = await documentsExtension.getArtifactAnalytics(
          selectedDocument.id,
          chatbot.id
        );
        setAnalytics(analyticsData);
        setShowAnalytics(true);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleContextMenu = (event: React.MouseEvent, document: DocumentArtifact) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            document
          }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Loading Documents Repository...
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
            <Description sx={{ mr: 1, color: '#3b82f6' }} />
            Documents & Artifacts
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Create New Document">
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
                disabled={!selectedDocument}
              >
                <Analytics />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={loadDocumentsData}
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
            placeholder="Search documents..."
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
                value={searchFilters.type}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="code">Code</MenuItem>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="presentation">Presentation</MenuItem>
                <MenuItem value="spreadsheet">Spreadsheet</MenuItem>
                <MenuItem value="design">Design</MenuItem>
                <MenuItem value="data">Data</MenuItem>
                <MenuItem value="configuration">Configuration</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
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
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Min Quality</InputLabel>
              <Select
                value={searchFilters.minQuality}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minQuality: Number(e.target.value) }))}
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
          <Tab label={`Documents (${filteredDocuments.length})`} />
          <Tab label={`Templates (${filteredTemplates.length})`} />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTab === 0 && (
          <Box>
            {/* Documents */}
            {filteredDocuments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Description sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                  No documents found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Create First Document
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredDocuments.map((document) => {
                  const currentVersion = document.versions[document.versions.length - 1];
                  const typeIcon = typeIcons[document.type] || <Description />;
                  
                  return (
                    <Grid item xs={12} key={document.id}>
                      <Card
                        sx={{
                          bgcolor: '#1e293b',
                          border: '1px solid #334155',
                          '&:hover': { bgcolor: '#334155', cursor: 'pointer' }
                        }}
                        onClick={() => handleLoadDocumentIntoChat(document)}
                        onContextMenu={(e) => handleContextMenu(e, document)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              {/* Type Icon */}
                              <Box
                                sx={{
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: '#3b82f6',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {typeIcon}
                              </Box>

                              {/* Document Info */}
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {document.title}
                                  </Typography>
                                  <Chip
                                    label={currentVersion.status}
                                    size="small"
                                    sx={{
                                      bgcolor: statusColors[currentVersion.status] || '#6b7280',
                                      color: 'white',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                  <Chip
                                    label={`v${document.currentVersion}`}
                                    size="small"
                                    sx={{
                                      bgcolor: '#6b7280',
                                      color: 'white',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                </Box>

                                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                                  {document.description}
                                </Typography>

                                {/* Metrics */}
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  <Grid item xs={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Star sx={{ fontSize: 16, color: getQualityColor(document.qualityMetrics.overallQuality) }} />
                                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        Quality: {(document.qualityMetrics.overallQuality * 100).toFixed(0)}%
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Visibility sx={{ fontSize: 16, color: '#94a3b8' }} />
                                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {document.usage.viewCount} views
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <CloudDownload sx={{ fontSize: 16, color: '#94a3b8' }} />
                                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {document.usage.downloadCount} downloads
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Group sx={{ fontSize: 16, color: '#94a3b8' }} />
                                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {document.collaborators.length} collaborators
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                {/* Tags and Category */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Chip
                                    label={document.category}
                                    size="small"
                                    sx={{ bgcolor: '#3b82f6', color: 'white', fontSize: '0.7rem' }}
                                  />
                                  {document.tags.slice(0, 3).map((tag) => (
                                    <Chip
                                      key={tag}
                                      label={tag}
                                      size="small"
                                      sx={{ bgcolor: '#6b7280', color: 'white', fontSize: '0.7rem' }}
                                    />
                                  ))}
                                  {document.tags.length > 3 && (
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                      +{document.tags.length - 3} more
                                    </Typography>
                                  )}
                                </Box>

                                {/* File Info */}
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {formatFileSize(currentVersion.content.size)} • 
                                  Last updated: {document.updatedAt.toLocaleDateString()} • 
                                  {document.versions.length} versions
                                </Typography>
                              </Box>
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                              <Tooltip title="Load into Chat">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLoadDocumentIntoChat(document);
                                  }}
                                  sx={{ color: '#10b981' }}
                                >
                                  <Launch />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Version History">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDocument(document);
                                    setShowVersionHistory(true);
                                  }}
                                  sx={{ color: '#3b82f6' }}
                                >
                                  <History />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="More Actions">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleContextMenu(e, document);
                                  }}
                                  sx={{ color: '#94a3b8' }}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          {/* Quality Progress Bar */}
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Overall Quality
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {(document.qualityMetrics.overallQuality * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={document.qualityMetrics.overallQuality * 100}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                bgcolor: '#374151',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getQualityColor(document.qualityMetrics.overallQuality)
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

        {selectedTab === 1 && (
          <Box>
            {/* Templates */}
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Slideshow sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                Template management coming soon
              </Typography>
            </Box>
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            {/* Analytics */}
            {analytics ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                  Document Analytics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Total Views
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                          {analytics.metrics.usage.totalViews}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Quality Score
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                          {(analytics.metrics.quality.overallScore * 100).toFixed(0)}%
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
                  Select a document and click "View Analytics" to load analytics
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              handleLoadDocumentIntoChat(contextMenu.document);
            }
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <Launch sx={{ color: '#10b981' }} />
          </ListItemIcon>
          <Typography sx={{ color: 'white' }}>Load into Chat</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              handleShareDocument(contextMenu.document, [], ['read']);
            }
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <Share sx={{ color: '#3b82f6' }} />
          </ListItemIcon>
          <Typography sx={{ color: 'white' }}>Share</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              handleForkDocument(contextMenu.document);
            }
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <FileCopy sx={{ color: '#f59e0b' }} />
          </ListItemIcon>
          <Typography sx={{ color: 'white' }}>Fork</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              handleExportDocument(contextMenu.document, 'pdf');
            }
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <Download sx={{ color: '#94a3b8' }} />
          </ListItemIcon>
          <Typography sx={{ color: 'white' }}>Export as PDF</Typography>
        </MenuItem>
      </Menu>

      {/* Create Document Dialog */}
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
          Create New Document
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8' }}>
            Document creation form would be implemented here
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
            Create Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1e293b', border: '1px solid #334155' }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Version History - {selectedDocument?.title}
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <List>
              {selectedDocument.versions.map((version) => (
                <ListItem
                  key={version.id}
                  sx={{
                    bgcolor: '#334155',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': { bgcolor: '#475569' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'white' }}>
                          v{version.versionNumber}
                        </Typography>
                        <Chip
                          label={version.status}
                          size="small"
                          sx={{
                            bgcolor: statusColors[version.status] || '#6b7280',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {version.changeLog}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {version.createdAt.toLocaleDateString()} • {version.createdBy}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => handleLoadDocumentIntoChat(selectedDocument, version)}
                      sx={{ color: '#3b82f6' }}
                    >
                      <Launch />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionHistory(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

