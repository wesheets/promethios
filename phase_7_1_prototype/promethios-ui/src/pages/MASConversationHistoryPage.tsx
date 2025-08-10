/**
 * MAS Conversation History Page
 * 
 * Displays and manages saved multi-agent conversations.
 * Allows users to view, search, filter, and resume conversations.
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
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as ResumeIcon,
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
  Assessment as MetricsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  masPersistenceService, 
  SavedMASConversation, 
  MASConversationFilter 
} from '../services/persistence/MASPersistenceService';

interface MASConversationHistoryPageProps {}

const MASConversationHistoryPage: React.FC<MASConversationHistoryPageProps> = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [conversations, setConversations] = useState<SavedMASConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<SavedMASConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrchestrator, setSelectedOrchestrator] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'quality' | 'duration' | 'messages'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [conversationsPerPage] = useState(12);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<SavedMASConversation | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [conversationToEdit, setConversationToEdit] = useState<SavedMASConversation | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  
  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<SavedMASConversation | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  // Filter and sort conversations when filters change
  useEffect(() => {
    filterAndSortConversations();
  }, [conversations, searchTerm, selectedOrchestrator, selectedSessionType, selectedTags, sortBy]);

  // Load conversations from persistence service
  const loadConversations = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userConversations = await masPersistenceService.getUserConversations(currentUser.uid);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort conversations
  const filterAndSortConversations = () => {
    let filtered = [...conversations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Orchestrator filter
    if (selectedOrchestrator) {
      filtered = filtered.filter(conv => conv.sessionConfig.orchestrator.id === selectedOrchestrator);
    }

    // Session type filter
    if (selectedSessionType) {
      filtered = filtered.filter(conv => conv.sessionConfig.sessionType === selectedSessionType);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(conv => 
        selectedTags.every(tag => conv.tags.includes(tag))
      );
    }

    // Sort conversations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'quality':
          return b.sessionMetrics.conversationQuality - a.sessionMetrics.conversationQuality;
        case 'duration':
          return b.sessionMetrics.duration - a.sessionMetrics.duration;
        case 'messages':
          return b.sessionMetrics.totalMessages - a.sessionMetrics.totalMessages;
        default:
          return 0;
      }
    });

    setFilteredConversations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Get unique values for filters
  const getUniqueOrchestrators = () => {
    const orchestrators = conversations.map(conv => conv.sessionConfig.orchestrator);
    return Array.from(new Set(orchestrators.map(o => o.id)))
      .map(id => orchestrators.find(o => o.id === id)!)
      .filter(Boolean);
  };

  const getUniqueSessionTypes = () => {
    return Array.from(new Set(conversations.map(conv => conv.sessionConfig.sessionType)));
  };

  const getAllTags = () => {
    const allTags = conversations.flatMap(conv => conv.tags);
    return Array.from(new Set(allTags)).sort();
  };

  // Handle conversation actions
  const handleResumeConversation = (conversation: SavedMASConversation) => {
    navigate('/ui/mas/think-tank', { 
      state: { loadConversationId: conversation.conversationId } 
    });
  };

  const handleViewConversation = (conversation: SavedMASConversation) => {
    navigate(`/ui/mas/conversations/${conversation.conversationId}`);
  };

  const handleEditConversation = (conversation: SavedMASConversation) => {
    setConversationToEdit(conversation);
    setEditName(conversation.name);
    setEditDescription(conversation.description || '');
    setEditTags([...conversation.tags]);
    setEditDialogOpen(true);
  };

  const handleDeleteConversation = (conversation: SavedMASConversation) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const handleExportConversation = (conversation: SavedMASConversation) => {
    const dataStr = JSON.stringify(conversation, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conversation.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      await masPersistenceService.deleteConversation(conversationToDelete.conversationId);
      await loadConversations(); // Reload conversations
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Save edit
  const saveEdit = async () => {
    if (!conversationToEdit) return;

    try {
      await masPersistenceService.updateConversationMetadata(
        conversationToEdit.conversationId,
        {
          name: editName,
          description: editDescription,
          tags: editTags
        }
      );
      await loadConversations(); // Reload conversations
      setEditDialogOpen(false);
      setConversationToEdit(null);
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  // Handle menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversation: SavedMASConversation) => {
    setMenuAnchor(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedConversation(null);
  };

  // Pagination
  const totalPages = Math.ceil(filteredConversations.length / conversationsPerPage);
  const startIndex = (currentPage - 1) * conversationsPerPage;
  const endIndex = startIndex + conversationsPerPage;
  const currentConversations = filteredConversations.slice(startIndex, endIndex);

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format quality score
  const formatQualityScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please log in to view your conversation history.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
          📚 Conversation History
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
          Manage and resume your multi-agent conversations
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
                placeholder="Search conversations..."
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

            {/* Orchestrator Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Orchestrator</InputLabel>
                <Select
                  value={selectedOrchestrator}
                  onChange={(e) => setSelectedOrchestrator(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {getUniqueOrchestrators().map(orchestrator => (
                    <MenuItem key={orchestrator.id} value={orchestrator.id}>
                      {orchestrator.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Session Type Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Session Type</InputLabel>
                <Select
                  value={selectedSessionType}
                  onChange={(e) => setSelectedSessionType(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {getUniqueSessionTypes().map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
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
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="quality">Highest Quality</MenuItem>
                  <MenuItem value="duration">Longest Duration</MenuItem>
                  <MenuItem value="messages">Most Messages</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Results Count */}
            <Grid item xs={12} md={3}>
              <Typography variant="body2" sx={{ color: '#a0aec0', textAlign: 'right' }}>
                {filteredConversations.length} of {conversations.length} conversations
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Conversations Grid */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#a0aec0' }}>Loading conversations...</Typography>
        </Box>
      ) : currentConversations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#a0aec0', mb: 2 }}>
            {conversations.length === 0 ? 'No conversations yet' : 'No conversations match your filters'}
          </Typography>
          {conversations.length === 0 && (
            <Button
              variant="contained"
              onClick={() => navigate('/ui/mas/think-tank')}
              sx={{ backgroundColor: '#3182ce', '&:hover': { backgroundColor: '#2c5aa0' } }}
            >
              Start Your First Conversation
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {currentConversations.map((conversation) => (
              <Grid item xs={12} md={6} lg={4} key={conversation.conversationId}>
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
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, flex: 1 }}>
                        {conversation.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, conversation)}
                        sx={{ color: '#a0aec0' }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>

                    {/* Description */}
                    {conversation.description && (
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                        {conversation.description}
                      </Typography>
                    )}

                    {/* Orchestrator and Session Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <OrchestratorIcon sx={{ color: '#3182ce', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {conversation.sessionConfig.orchestrator.name}
                      </Typography>
                      <GroupIcon sx={{ color: '#38a169', fontSize: 16, ml: 1 }} />
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {conversation.sessionConfig.participants.length} agents
                      </Typography>
                    </Box>

                    {/* Metrics */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#1a202c', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                            Quality
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#38a169', fontWeight: 600 }}>
                            {formatQualityScore(conversation.sessionMetrics.conversationQuality)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#1a202c', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.75rem' }}>
                            Duration
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#3182ce', fontWeight: 600 }}>
                            {formatDuration(conversation.sessionMetrics.duration)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Messages and Date */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {conversation.sessionMetrics.totalMessages} messages
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        {conversation.updatedAt.toLocaleDateString()}
                      </Typography>
                    </Box>

                    {/* Tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {conversation.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            backgroundColor: '#4a5568',
                            color: '#a0aec0',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      ))}
                      {conversation.tags.length > 3 && (
                        <Chip
                          label={`+${conversation.tags.length - 3}`}
                          size="small"
                          sx={{
                            backgroundColor: '#4a5568',
                            color: '#a0aec0',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewConversation(conversation)}
                      sx={{ color: '#a0aec0' }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<ResumeIcon />}
                      onClick={() => handleResumeConversation(conversation)}
                      sx={{ 
                        backgroundColor: '#3182ce', 
                        '&:hover': { backgroundColor: '#2c5aa0' } 
                      }}
                    >
                      Resume
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
          if (selectedConversation) handleViewConversation(selectedConversation);
          handleMenuClose();
        }}>
          <ListItemIcon><ViewIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedConversation) handleResumeConversation(selectedConversation);
          handleMenuClose();
        }}>
          <ListItemIcon><ResumeIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>Resume</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedConversation) handleEditConversation(selectedConversation);
          handleMenuClose();
        }}>
          <ListItemIcon><EditIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedConversation) handleExportConversation(selectedConversation);
          handleMenuClose();
        }}>
          <ListItemIcon><ExportIcon sx={{ color: 'white' }} /></ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedConversation) handleDeleteConversation(selectedConversation);
          handleMenuClose();
        }}>
          <ListItemIcon><DeleteIcon sx={{ color: '#e53e3e' }} /></ListItemIcon>
          <ListItemText sx={{ color: '#e53e3e' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568'
          }
        }}
      >
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{conversationToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} sx={{ color: '#e53e3e' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568'
          }
        }}
      >
        <DialogTitle>Edit Conversation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' }
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' }
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' }
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' }
            }}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={editTags.join(', ')}
            onChange={(e) => setEditTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#718096' },
                '&.Mui-focused fieldset': { borderColor: '#3182ce' }
              },
              '& .MuiInputLabel-root': { color: '#a0aec0' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button onClick={saveEdit} sx={{ color: '#3182ce' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MASConversationHistoryPage;

