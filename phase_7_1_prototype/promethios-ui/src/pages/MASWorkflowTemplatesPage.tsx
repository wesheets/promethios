/**
 * MAS Workflow Templates Page
 * 
 * Manages reusable multi-agent workflow templates.
 * Allows users to create, browse, and use proven MAS configurations.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Rating,
  LinearProgress,
  Divider,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as UseTemplateIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Download as ExportIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Psychology as OrchestratorIcon,
  Assessment as MetricsIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as SuccessIcon,
  Speed as PerformanceIcon,
  School as DifficultyIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  masPersistenceService, 
  MASWorkflowTemplate,
  SavedMASConversation
} from '../services/persistence/MASPersistenceService';

interface MASWorkflowTemplatesPageProps {}

const MASWorkflowTemplatesPage: React.FC<MASWorkflowTemplatesPageProps> = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [templates, setTemplates] = useState<MASWorkflowTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MASWorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'success' | 'duration'>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [templatesPerPage] = useState(12);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateToUse, setTemplateToUse] = useState<MASWorkflowTemplate | null>(null);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  
  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MASWorkflowTemplate | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter and sort templates when filters change
  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  // Load templates from persistence service
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const allTemplates = await masPersistenceService.getWorkflowTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort templates
  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usageStats.timesUsed - a.usageStats.timesUsed;
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'success':
          return b.usageStats.averageSuccessRate - a.usageStats.averageSuccessRate;
        case 'duration':
          return a.estimatedDuration - b.estimatedDuration;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
    setCurrentPage(1);
  };

  // Get unique values for filters
  const getUniqueCategories = () => {
    return Array.from(new Set(templates.map(template => template.category))).sort();
  };

  // Handle template actions
  const handleUseTemplate = (template: MASWorkflowTemplate) => {
    setTemplateToUse(template);
    setUseTemplateDialogOpen(true);
  };

  const handleViewTemplate = (template: MASWorkflowTemplate) => {
    navigate(`/ui/mas/templates/${template.templateId}`);
  };

  const handleCreateFromConversation = () => {
    navigate('/ui/mas/conversations', { 
      state: { createTemplate: true } 
    });
  };

  // Confirm use template
  const confirmUseTemplate = async () => {
    if (!templateToUse || !currentUser) return;

    try {
      const conversation = await masPersistenceService.createConversationFromTemplate(
        templateToUse.templateId,
        currentUser.uid
      );
      
      navigate('/ui/mas/think-tank', { 
        state: { loadConversationId: conversation.conversationId } 
      });
    } catch (error) {
      console.error('Error using template:', error);
    } finally {
      setUseTemplateDialogOpen(false);
      setTemplateToUse(null);
    }
  };

  // Handle menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: MASWorkflowTemplate) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTemplate(null);
  };

  // Pagination
  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, endIndex);

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#38a169';
      case 'intermediate': return '#d69e2e';
      case 'advanced': return '#e53e3e';
      default: return '#a0aec0';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'business': return '💼';
      case 'research': return '🔬';
      case 'creative': return '🎨';
      case 'technical': return '⚙️';
      case 'education': return '📚';
      case 'healthcare': return '🏥';
      default: return '📋';
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please log in to access workflow templates.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
          📋 Workflow Templates
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
          Proven multi-agent configurations for common use cases
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3, backgroundColor: '#2d3748', borderColor: '#4a5568' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#a0aec0', mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                    '&.Mui-focused fieldset': { borderColor: '#3182ce' }
                  }
                }}
              />
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {getUniqueCategories().map(category => (
                    <MenuItem key={category} value={category}>
                      {getCategoryIcon(category)} {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Difficulty Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Difficulty</InputLabel>
                <Select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="beginner">🟢 Beginner</MenuItem>
                  <MenuItem value="intermediate">🟡 Intermediate</MenuItem>
                  <MenuItem value="advanced">🔴 Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort By */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
                  }}
                >
                  <MenuItem value="popular">Most Popular</MenuItem>
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="success">Highest Success</MenuItem>
                  <MenuItem value="duration">Shortest Duration</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Results Count */}
            <Grid item xs={12} md={3}>
              <Typography variant="body2" sx={{ color: '#a0aec0', textAlign: 'right' }}>
                {filteredTemplates.length} of {templates.length} templates
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#a0aec0' }}>Loading templates...</Typography>
        </Box>
      ) : currentTemplates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#a0aec0', mb: 2 }}>
            {templates.length === 0 ? 'No templates available yet' : 'No templates match your filters'}
          </Typography>
          {templates.length === 0 && (
            <Button
              variant="contained"
              onClick={handleCreateFromConversation}
              sx={{ backgroundColor: '#3182ce', '&:hover': { backgroundColor: '#2c5aa0' } }}
            >
              Create Your First Template
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {currentTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.templateId}>
                <Card 
                  sx={{ 
                    backgroundColor: '#2d3748', 
                    borderColor: '#4a5568',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      backgroundColor: '#374151',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                            {getCategoryIcon(template.category)}
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                            {template.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={template.difficulty}
                            size="small"
                            sx={{
                              backgroundColor: getDifficultyColor(template.difficulty),
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            {template.category}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, template)}
                        sx={{ color: '#a0aec0' }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, minHeight: 40 }}>
                      {template.description}
                    </Typography>

                    {/* Orchestrator and Agents */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <OrchestratorIcon sx={{ color: '#3182ce', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {template.orchestratorType}
                      </Typography>
                      <GroupIcon sx={{ color: '#38a169', fontSize: 16, ml: 1 }} />
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {template.recommendedAgents.length} agents
                      </Typography>
                    </Box>

                    {/* Performance Metrics */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#1a202c', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.7rem' }}>
                            Success
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#38a169', fontWeight: 600, fontSize: '0.9rem' }}>
                            {Math.round(template.usageStats.averageSuccessRate * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#1a202c', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.7rem' }}>
                            Used
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#3182ce', fontWeight: 600, fontSize: '0.9rem' }}>
                            {template.usageStats.timesUsed}x
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#1a202c', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.7rem' }}>
                            Duration
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#d69e2e', fontWeight: 600, fontSize: '0.9rem' }}>
                            {formatDuration(template.estimatedDuration)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Quality Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Quality:
                      </Typography>
                      <Rating
                        value={template.usageStats.averageQualityScore}
                        precision={0.1}
                        size="small"
                        readOnly
                        sx={{
                          '& .MuiRating-iconFilled': { color: '#ffd700' },
                          '& .MuiRating-iconEmpty': { color: '#4a5568' }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        ({template.usageStats.averageQualityScore.toFixed(1)})
                      </Typography>
                    </Box>

                    {/* Expected Outcomes */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1, fontWeight: 600 }}>
                        Expected Outcomes:
                      </Typography>
                      <Box sx={{ pl: 1 }}>
                        {template.expectedOutcomes.slice(0, 2).map((outcome, index) => (
                          <Typography key={index} variant="body2" sx={{ color: '#a0aec0', fontSize: '0.8rem' }}>
                            • {outcome}
                          </Typography>
                        ))}
                        {template.expectedOutcomes.length > 2 && (
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.8rem' }}>
                            • +{template.expectedOutcomes.length - 2} more...
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {template.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            backgroundColor: '#4a5568',
                            color: '#a0aec0',
                            fontSize: '0.7rem',
                            height: 18
                          }}
                        />
                      ))}
                      {template.tags.length > 3 && (
                        <Chip
                          label={`+${template.tags.length - 3}`}
                          size="small"
                          sx={{
                            backgroundColor: '#4a5568',
                            color: '#a0aec0',
                            fontSize: '0.7rem',
                            height: 18
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewTemplate(template)}
                      sx={{ color: '#a0aec0' }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<UseTemplateIcon />}
                      onClick={() => handleUseTemplate(template)}
                      sx={{ 
                        backgroundColor: '#3182ce', 
                        '&:hover': { backgroundColor: '#2c5aa0' } 
                      }}
                    >
                      Use Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'white',
                    '&.Mui-selected': {
                      backgroundColor: '#3182ce',
                      '&:hover': { backgroundColor: '#2c5aa0' }
                    }
                  }
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#3182ce',
          '&:hover': { backgroundColor: '#2c5aa0' }
        }}
        onClick={handleCreateFromConversation}
      >
        <AddIcon />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568'
          }
        }}
      >
        <MenuItem onClick={() => {
          if (selectedTemplate) handleViewTemplate(selectedTemplate);
          handleMenuClose();
        }}>
          <ListItemIcon><ViewIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTemplate) handleUseTemplate(selectedTemplate);
          handleMenuClose();
        }}>
          <ListItemIcon><UseTemplateIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>Use Template</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle export template
          handleMenuClose();
        }}>
          <ListItemIcon><ExportIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle share template
          handleMenuClose();
        }}>
          <ListItemIcon><ShareIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
      </Menu>

      {/* Use Template Confirmation Dialog */}
      <Dialog
        open={useTemplateDialogOpen}
        onClose={() => setUseTemplateDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568'
          }
        }}
      >
        <DialogTitle>Use Template: {templateToUse?.name}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will create a new conversation based on the "{templateToUse?.name}" template.
          </Typography>
          
          {templateToUse && (
            <Box>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                <strong>Orchestrator:</strong> {templateToUse.orchestratorType}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                <strong>Agents:</strong> {templateToUse.recommendedAgents.length} recommended
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                <strong>Estimated Duration:</strong> {formatDuration(templateToUse.estimatedDuration)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                <strong>Success Rate:</strong> {Math.round(templateToUse.usageStats.averageSuccessRate * 100)}%
              </Typography>
              
              <Divider sx={{ borderColor: '#4a5568', my: 2 }} />
              
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1, fontWeight: 600 }}>
                Expected Outcomes:
              </Typography>
              {templateToUse.expectedOutcomes.map((outcome, index) => (
                <Typography key={index} variant="body2" sx={{ color: '#a0aec0', ml: 2 }}>
                  • {outcome}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUseTemplateDialogOpen(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button onClick={confirmUseTemplate} sx={{ color: '#3182ce' }}>
            Start Conversation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MASWorkflowTemplatesPage;

