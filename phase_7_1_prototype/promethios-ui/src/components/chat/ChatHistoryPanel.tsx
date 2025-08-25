/**
 * Chat History Panel
 * 
 * Manus-style chat history interface for the right side panel.
 * Provides chat session management, sharing, and organization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Avatar,
  Stack,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Chat,
  Search,
  MoreVert,
  Edit,
  Delete,
  Share,
  Verified,
  Schedule,
  FilterList,
  Close,
  ContentCopy,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { ChatHistoryService, ChatSession, ChatHistoryFilter } from '../../services/ChatHistoryService';
import { ChatSharingService } from '../../services/ChatSharingService';
import { useAuth } from '../../context/AuthContext';

interface ChatHistoryPanelProps {
  agentId: string;
  agentName: string;
  onChatSelect: (session: ChatSession) => void;
  onNewChat: (session?: ChatSession) => void;
  onShareChat?: (contextId: string) => void;
  currentSessionId?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  agentId,
  agentName,
  onChatSelect,
  onNewChat,
  onShareChat,
  currentSessionId,
  refreshTrigger, // Add refresh trigger prop
}) => {
  const { currentUser } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'shared' | 'recent'>('all');
  
  // Dialog states
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameChatName, setRenameChatName] = useState('');
  
  // Inline editing states
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  
  // Share states
  const [shareLoading, setShareLoading] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const chatHistoryService = ChatHistoryService.getInstance();
  const chatSharingService = ChatSharingService.getInstance();

  // Load chat sessions
  const loadChatSessions = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      
      const filter: ChatHistoryFilter = {
        agentId: agentId,
      };

      if (selectedFilter === 'shared') {
        filter.hasSharedContext = true;
      } else if (selectedFilter === 'recent') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filter.dateRange = {
          start: weekAgo,
          end: new Date(),
        };
      }

      if (searchTerm.trim()) {
        filter.searchTerm = searchTerm.trim();
      }

      const sessions = await chatHistoryService.getChatSessions(currentUser.uid, filter);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, agentId, selectedFilter, searchTerm]);

  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadChatSessions();
    }
  }, [refreshTrigger, loadChatSessions]);

  // Create new chat
  const handleCreateNewChat = async () => {
    if (!currentUser?.uid) return;

    try {
      console.log('🆕 Creating new chat session...');
      
      const chatName = newChatName.trim() || undefined;
      const session = await chatHistoryService.createChatSession(
        agentId,
        agentName,
        currentUser.uid,
        chatName
      );

      console.log(`✅ Created new chat session: ${session.name} (${session.id})`);

      setNewChatDialogOpen(false);
      setNewChatName('');
      
      // Force refresh the list immediately
      await loadChatSessions();
      
      // Select the new chat and notify parent
      onChatSelect(session);
      onNewChat(session);
      
      console.log('✅ New chat creation completed successfully');
    } catch (error) {
      console.error('❌ Failed to create new chat:', error);
    }
  };

  // Rename chat
  const handleRenameChat = async () => {
    if (!renameSessionId || !renameChatName.trim()) return;

    try {
      await chatHistoryService.renameChatSession(renameSessionId, renameChatName.trim());
      
      setRenameDialogOpen(false);
      setRenameSessionId(null);
      setRenameChatName('');
      
      // Refresh the list
      await loadChatSessions();
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  // Inline editing functions
  const handleStartInlineEdit = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditingName(currentName);
  };

  const handleSaveInlineEdit = async () => {
    if (!editingSessionId || !editingName.trim()) return;

    try {
      await chatHistoryService.renameChatSession(editingSessionId, editingName.trim());
      setEditingSessionId(null);
      setEditingName('');
      
      // Refresh the list
      await loadChatSessions();
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleInlineEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveInlineEdit();
    } else if (e.key === 'Escape') {
      handleCancelInlineEdit();
    }
  };

  // Delete chat
  const handleDeleteChat = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      await chatHistoryService.deleteChatSession(sessionId);
      
      // Refresh the list
      await loadChatSessions();
      
      // If this was the current session, trigger new chat
      if (sessionId === currentSessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Share chat with agent (enhanced with ChatSharingService)
  const handleShareChat = async (sessionId: string) => {
    if (!currentUser?.uid) return;

    try {
      setShareLoading(sessionId);
      
      // Generate shareable chat reference using new sharing service
      const shareableReference = await chatSharingService.generateChatShareReference(
        sessionId,
        currentUser.uid,
        agentId
      );
      
      // Generate user-friendly share message
      const shareMessage = chatSharingService.generateChatShareMessage(shareableReference);
      
      setShareSuccess(sessionId);
      setTimeout(() => setShareSuccess(null), 3000);
      
      // Copy share message to clipboard
      await navigator.clipboard.writeText(shareMessage);
      
      if (onShareChat) {
        onShareChat(shareableReference.shareableId);
      }
      
      console.log(`✅ Chat shared successfully: ${shareableReference.shareableId}`);
    } catch (error) {
      console.error('❌ Failed to share chat:', error);
    } finally {
      setShareLoading(null);
    }
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setMenuAnchor(event.currentTarget);
    setMenuSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuSessionId(null);
  };

  const handleMenuRename = () => {
    if (menuSessionId) {
      const session = chatSessions.find(s => s.id === menuSessionId);
      if (session) {
        setRenameSessionId(menuSessionId);
        setRenameChatName(session.name);
        setRenameDialogOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleMenuShare = () => {
    if (menuSessionId) {
      handleShareChat(menuSessionId);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (menuSessionId) {
      handleDeleteChat(menuSessionId);
    }
    handleMenuClose();
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get trust score color
  const getTrustScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#0f172a', // Dark background to match chat interface
      color: 'white'
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155', flexShrink: 0, bgcolor: '#0f172a' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Chat History
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setNewChatDialogOpen(true)}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              textTransform: 'none',
            }}
          >
            New Chat
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#64748b' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1e293b', // Darker input background
              color: 'white',
              '& fieldset': { borderColor: '#334155' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#64748b',
              opacity: 1,
            },
          }}
        />

        {/* Filter Chips */}
        <Stack direction="row" spacing={1}>
          {(['all', 'recent', 'shared'] as const).map((filter) => (
            <Chip
              key={filter}
              label={filter === 'all' ? 'All' : filter === 'recent' ? 'Recent' : 'Shared'}
              size="small"
              onClick={() => setSelectedFilter(filter)}
              sx={{
                bgcolor: selectedFilter === filter ? '#3b82f6' : '#374151',
                color: 'white',
                '&:hover': {
                  bgcolor: selectedFilter === filter ? '#2563eb' : '#4b5563',
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#0f172a' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
          </Box>
        ) : chatSessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              {searchTerm 
                ? 'No chats found matching your search.' 
                : selectedFilter === 'shared' 
                  ? 'No chats shared yet.'
                  : selectedFilter === 'recent'
                    ? 'No recent chats (last 7 days).'
                    : 'No chat history yet.'
              }
            </Typography>
            {selectedFilter !== 'shared' && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => setNewChatDialogOpen(true)}
                sx={{
                  borderColor: '#334155',
                  color: '#94a3b8',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    color: 'white',
                    bgcolor: '#1e293b',
                  },
                }}
              >
                Start First Chat
              </Button>
            )}
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {chatSessions.map((session, index) => (
              <React.Fragment key={session.id}>
                <ListItem
                  button
                  onClick={() => onChatSelect(session)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: session.id === currentSessionId ? '#1e293b' : 'transparent',
                    '&:hover': {
                      bgcolor: session.id === currentSessionId ? '#1e293b' : '#1e293b',
                    },
                    borderLeft: session.id === currentSessionId ? '3px solid #3b82f6' : '3px solid transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: '#3b82f6',
                        fontSize: '0.75rem',
                      }}
                    >
                      {agentName?.charAt(0) || 'A'}
                    </Avatar>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {editingSessionId === session.id ? (
                          <TextField
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleInlineEditKeyPress}
                            onBlur={handleSaveInlineEdit}
                            autoFocus
                            size="small"
                            variant="outlined"
                            sx={{
                              flex: 1,
                              '& .MuiOutlinedInput-root': {
                                bgcolor: '#1e293b',
                                color: 'white',
                                fontSize: '0.875rem',
                                '& fieldset': {
                                  borderColor: '#3b82f6',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#3b82f6',
                                },
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                py: 0.5,
                              },
                            }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartInlineEdit(session.id, session.name);
                            }}
                            sx={{
                              color: 'white',
                              fontWeight: session.id === currentSessionId ? 600 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: 1,
                                px: 0.5,
                              },
                            }}
                          >
                            {session.name}
                          </Typography>
                        )}
                        {session.isShared && (
                          <Tooltip title="Shared with agent">
                            <Share sx={{ fontSize: 14, color: '#10b981' }} />
                          </Tooltip>
                        )}
                        {session.cryptographicReceipt && (
                          <Tooltip title="Cryptographically verified">
                            <Verified sx={{ fontSize: 14, color: '#3b82f6' }} />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {session.messageCount} messages • {formatDate(session.lastUpdated)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: getTrustScoreColor(session.governanceMetrics.overallTrustScore),
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                            {session.governanceMetrics.overallTrustScore.toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {/* Quick Share Button */}
                      <Tooltip title="Share with Agent - Send this chat as context">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareChat(session.id);
                          }}
                          sx={{ 
                            color: session.isShared ? '#10b981' : '#64748b',
                            '&:hover': { 
                              color: '#10b981',
                              bgcolor: 'rgba(16, 185, 129, 0.1)',
                            },
                          }}
                        >
                          {shareLoading === session.id ? (
                            <CircularProgress size={16} sx={{ color: '#3b82f6' }} />
                          ) : shareSuccess === session.id ? (
                            <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                          ) : (
                            <Share sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      
                      {/* Menu Button */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, session.id);
                        }}
                        sx={{ color: '#64748b' }}
                      >
                        <MoreVert sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < chatSessions.length - 1 && (
                  <Divider sx={{ bgcolor: '#334155', mx: 2 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            color: 'white',
          },
        }}
      >
        <MenuItem onClick={handleMenuRename} sx={{ color: 'white', '&:hover': { bgcolor: '#374151' } }}>
          <Edit sx={{ mr: 1, fontSize: 16 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleMenuShare} sx={{ color: 'white', '&:hover': { bgcolor: '#374151' } }}>
          <Share sx={{ mr: 1, fontSize: 16 }} />
          Share with Agent
        </MenuItem>
        <Divider sx={{ bgcolor: '#334155' }} />
        <MenuItem onClick={handleMenuDelete} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#374151' } }}>
          <Delete sx={{ mr: 1, fontSize: 16 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* New Chat Dialog */}
      <Dialog
        open={newChatDialogOpen}
        onClose={() => setNewChatDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            color: 'white',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', bgcolor: '#1e293b' }}>
          Start New Chat
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e293b' }}>
          <TextField
            autoFocus
            fullWidth
            label="Chat Name (optional)"
            placeholder={`Chat with ${agentName || 'Agent'} - ${new Date().toLocaleDateString()}`}
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: 'white',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputLabel-root': {
                color: '#94a3b8',
                '&.Mui-focused': { color: '#3b82f6' },
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#64748b',
                opacity: 1,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1e293b' }}>
          <Button onClick={() => setNewChatDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateNewChat}
            variant="contained"
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
            }}
          >
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            color: 'white',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', bgcolor: '#1e293b' }}>
          Rename Chat
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e293b' }}>
          <TextField
            autoFocus
            fullWidth
            label="Chat Name"
            value={renameChatName}
            onChange={(e) => setRenameChatName(e.target.value)}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: 'white',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputLabel-root': {
                color: '#94a3b8',
                '&.Mui-focused': { color: '#3b82f6' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1e293b' }}>
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            onClick={handleRenameChat}
            variant="contained"
            disabled={!renameChatName.trim()}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
            }}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatHistoryPanel;

