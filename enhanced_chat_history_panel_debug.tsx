/**
 * Debug Enhanced Chat History Panel
 * 
 * This is a diagnostic version of the EnhancedChatHistoryPanel component
 * with extensive logging to help identify why Host Chats tab is empty
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
  Tabs,
  Tab,
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
  PersonAdd,
  Home as HostIcon,
  PersonAdd as GuestIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

import { ChatHistoryService, ChatSession, ChatHistoryFilter } from '../../services/ChatHistoryService';
import { ChatSharingService } from '../../services/ChatSharingService';
import { SharedConversation } from '../../services/SharedConversationService';
import { useSharedConversations } from '../../contexts/SharedConversationContext';

interface EnhancedChatHistoryPanelProps {
  agentId: string;
  agentName: string;
  currentUser: any;
  onChatSelect: (session: ChatSession) => void;
  onNewChat: (session: ChatSession) => void;
  refreshTrigger?: number;
  sharedConversations: SharedConversation[];
  onSharedConversationSelect: (conversationId: string) => void;
}

const EnhancedChatHistoryPanelDebug: React.FC<EnhancedChatHistoryPanelProps> = ({
  agentId,
  agentName,
  currentUser,
  onChatSelect,
  onNewChat,
  refreshTrigger,
  sharedConversations: propSharedConversations,
  onSharedConversationSelect,
}) => {
  // Debug logging for props
  console.log('🔍 [DEBUG] EnhancedChatHistoryPanel Props:', {
    agentId,
    agentName,
    currentUser: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null,
    refreshTrigger,
    propSharedConversationsLength: propSharedConversations?.length || 0,
    onChatSelect: typeof onChatSelect,
    onNewChat: typeof onNewChat,
    onSharedConversationSelect: typeof onSharedConversationSelect
  });

  // Use shared conversation context for real-time updates
  const { sharedConversations: contextSharedConversations, refreshSharedConversations } = useSharedConversations();
  
  // Use context conversations if available, fallback to props
  const sharedConversations = contextSharedConversations.length > 0 ? contextSharedConversations : propSharedConversations;
  
  console.log('🔍 [DEBUG] Shared Conversations:', {
    contextLength: contextSharedConversations.length,
    propLength: propSharedConversations?.length || 0,
    finalLength: sharedConversations.length,
    usingContext: contextSharedConversations.length > 0
  });

  // Tab state
  const [activeTab, setActiveTab] = useState(0); // 0: Host Chats, 1: Guest Chats
  
  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameChatName, setRenameChatName] = useState('');
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  
  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);

  const chatHistoryService = ChatHistoryService.getInstance();
  const chatSharingService = ChatSharingService.getInstance();

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 [DEBUG] State Update:', {
      chatSessionsLength: chatSessions.length,
      loading,
      searchTerm,
      activeTab,
      error,
      currentUserUid: currentUser?.uid
    });
  }, [chatSessions, loading, searchTerm, activeTab, error, currentUser]);

  // Load chat sessions
  const loadChatSessions = useCallback(async () => {
    console.log('🔍 [DEBUG] loadChatSessions called:', {
      currentUserUid: currentUser?.uid,
      agentId,
      searchTerm
    });

    if (!currentUser?.uid) {
      console.log('❌ [DEBUG] No current user UID, skipping load');
      setLoading(false);
      setError('No user authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [DEBUG] Starting chat sessions load...');
      
      const filter: ChatHistoryFilter = {
        agentId: agentId,
      };

      if (searchTerm.trim()) {
        filter.searchTerm = searchTerm.trim();
      }

      console.log('🔍 [DEBUG] Filter:', filter);

      const sessions = await chatHistoryService.getChatSessions(currentUser.uid, filter);
      
      console.log('🔍 [DEBUG] Chat sessions loaded:', {
        sessionsLength: sessions.length,
        sessions: sessions.map(s => ({ id: s.id, name: s.name, agentId: s.agentId }))
      });
      
      setChatSessions(sessions);
    } catch (error) {
      console.error('❌ [DEBUG] Failed to load chat sessions:', error);
      setError(`Failed to load chat sessions: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('🔍 [DEBUG] loadChatSessions completed');
    }
  }, [currentUser?.uid, agentId, searchTerm]);

  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect for loadChatSessions triggered');
    loadChatSessions();
  }, [loadChatSessions]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('🔄 [DEBUG] Enhanced chat history panel refreshing due to trigger:', refreshTrigger);
      loadChatSessions();
      // Also refresh shared conversations for real-time updates
      refreshSharedConversations();
    }
  }, [refreshTrigger, loadChatSessions, refreshSharedConversations]);

  // Handle shared conversation selection with drawer close
  const handleSharedConversationClick = (conversationId: string) => {
    console.log('🔄 [DEBUG] Shared conversation selected:', conversationId);
    onSharedConversationSelect(conversationId);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log('🔍 [DEBUG] Tab changed:', { from: activeTab, to: newValue });
    setActiveTab(newValue);
  };

  // Create new chat
  const handleCreateNewChat = async () => {
    if (!currentUser?.uid) {
      console.log('❌ [DEBUG] Cannot create chat: no user UID');
      return;
    }

    try {
      console.log('🆕 [DEBUG] Creating new chat session...');
      
      const chatName = newChatName.trim() || undefined;
      
      setNewChatDialogOpen(false);
      setNewChatName('');
      
      const session = await chatHistoryService.createChatSession(
        agentId,
        agentName,
        currentUser.uid,
        chatName
      );

      console.log(`✅ [DEBUG] Created new chat session:`, session);
      
      setChatSessions(prev => [session, ...prev]);
      onChatSelect(session);
      onNewChat(session);
      
      console.log('✅ [DEBUG] New chat creation completed successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Failed to create new chat:', error);
      setError(`Failed to create new chat: ${error.message}`);
      loadChatSessions();
    }
  };

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    event.stopPropagation();
    console.log('🔍 [DEBUG] Menu opened for session:', sessionId);
    setMenuAnchor(event.currentTarget);
    setMenuSessionId(sessionId);
  };

  const handleMenuClose = () => {
    console.log('🔍 [DEBUG] Menu closed');
    setMenuAnchor(null);
    setMenuSessionId(null);
  };

  // Rename chat
  const handleRenameChat = async () => {
    if (!renameSessionId || !renameChatName.trim()) return;

    try {
      console.log('🔍 [DEBUG] Renaming chat:', { sessionId: renameSessionId, newName: renameChatName });
      
      await chatHistoryService.updateChatSession(renameSessionId, {
        name: renameChatName.trim(),
      });

      setChatSessions(prev =>
        prev.map(session =>
          session.id === renameSessionId
            ? { ...session, name: renameChatName.trim() }
            : session
        )
      );

      setRenameDialogOpen(false);
      setRenameChatName('');
      setRenameSessionId(null);
      
      console.log('✅ [DEBUG] Chat renamed successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Failed to rename chat:', error);
      setError(`Failed to rename chat: ${error.message}`);
    }
  };

  // Delete chat
  const handleDeleteChat = async () => {
    if (!deleteSessionId) return;

    try {
      console.log('🔍 [DEBUG] Deleting chat:', deleteSessionId);
      
      await chatHistoryService.deleteChatSession(deleteSessionId);
      setChatSessions(prev => prev.filter(session => session.id !== deleteSessionId));
      setDeleteDialogOpen(false);
      setDeleteSessionId(null);
      
      console.log('✅ [DEBUG] Chat deleted successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Failed to delete chat:', error);
      setError(`Failed to delete chat: ${error.message}`);
    }
  };

  // Filter chats based on active tab and search
  const getFilteredChats = () => {
    let filtered = [...chatSessions];

    if (searchTerm) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log('🔍 [DEBUG] getFilteredChats:', {
      originalLength: chatSessions.length,
      filteredLength: filtered.length,
      searchTerm,
      filtered: filtered.map(c => ({ id: c.id, name: c.name }))
    });

    return filtered;
  };

  // Filter shared conversations based on search
  const getFilteredSharedConversations = () => {
    if (!searchTerm) return sharedConversations;
    
    const filtered = sharedConversations.filter(conv =>
      (conv.name || 'Shared Chat').toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participants?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    console.log('🔍 [DEBUG] getFilteredSharedConversations:', {
      originalLength: sharedConversations.length,
      filteredLength: filtered.length,
      searchTerm
    });

    return filtered;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    }

    return date.toLocaleDateString();
  };

  const filteredChats = getFilteredChats();
  const filteredSharedConversations = getFilteredSharedConversations();

  console.log('🔍 [DEBUG] Render data:', {
    activeTab,
    loading,
    error,
    filteredChatsLength: filteredChats.length,
    filteredSharedConversationsLength: filteredSharedConversations.length,
    currentUserUid: currentUser?.uid
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      {/* Debug Info */}
      <Box sx={{ p: 1, bgcolor: '#1e293b', borderBottom: '1px solid #334155' }}>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          DEBUG: User: {currentUser?.uid || 'None'} | Agent: {agentId} | Sessions: {chatSessions.length} | Loading: {loading.toString()} | Error: {error || 'None'}
        </Typography>
      </Box>

      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Chat History (DEBUG)
          </Typography>
          <Tooltip title="New Chat">
            <IconButton
              onClick={() => setNewChatDialogOpen(true)}
              sx={{
                bgcolor: '#3b82f6',
                color: 'white',
                '&:hover': { bgcolor: '#2563eb' },
                width: 36,
                height: 36
              }}
            >
              <Add sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1e293b',
              color: 'white',
              '& fieldset': { borderColor: '#475569' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
            }
          }}
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" sx={{ bgcolor: '#7f1d1d', color: '#fecaca' }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#3b82f6' }
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HostIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">Host Chats</Typography>
                <Chip
                  label={filteredChats.length}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#94a3b8', height: 20 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GuestIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">Guest Chats</Typography>
                <Chip
                  label={filteredSharedConversations.length}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#94a3b8', height: 20 }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 ? (
          // Host Chats Tab
          <>
            <Box sx={{ p: 1, bgcolor: '#1e293b' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                DEBUG Host Chats: Loading={loading.toString()}, Sessions={chatSessions.length}, Filtered={filteredChats.length}
              </Typography>
            </Box>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ color: '#3b82f6', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Loading chat history...
                </Typography>
              </Box>
            ) : filteredChats.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {searchTerm ? 'No chats found matching your search.' : 'No chat history yet.'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                  DEBUG: Total sessions={chatSessions.length}, User={currentUser?.uid}, Agent={agentId}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setNewChatDialogOpen(true)}
                  sx={{
                    borderColor: '#334155',
                    color: '#94a3b8',
                    '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' }
                  }}
                >
                  Start New Chat
                </Button>
              </Box>
            ) : (
              <List sx={{ py: 0 }}>
                {filteredChats.map((session) => (
                  <ListItem
                    key={session.id}
                    button
                    onClick={() => {
                      console.log('🔍 [DEBUG] Chat selected:', session);
                      onChatSelect(session);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderBottom: '1px solid #1e293b',
                      '&:hover': { bgcolor: '#1e293b' }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6' }}>
                        <Chat sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                          {session.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {formatDate(session.updatedAt)} • {session.messages?.length || 0} messages • ID: {session.id}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, session.id)}
                        sx={{ color: '#94a3b8' }}
                      >
                        <MoreVert sx={{ fontSize: 16 }} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        ) : (
          // Guest Chats Tab
          <>
            <Box sx={{ p: 1, bgcolor: '#1e293b' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                DEBUG Guest Chats: Shared={sharedConversations.length}, Filtered={filteredSharedConversations.length}
              </Typography>
            </Box>
            {filteredSharedConversations.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {searchTerm ? 'No shared conversations found matching your search.' : 'No shared conversations yet.'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  DEBUG: Total shared={sharedConversations.length}
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0 }}>
                {filteredSharedConversations.map((conversation) => (
                  <ListItem
                    key={conversation.id}
                    button
                    onClick={() => handleSharedConversationClick(conversation.id)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderBottom: '1px solid #1e293b',
                      '&:hover': { bgcolor: '#1e293b' }
                    }}
                  >
                    <ListItemIcon>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#10b981', mr: 1 }}>
                          <GroupIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5 }}>
                          {conversation.participants?.slice(0, 3).map((participant, index) => (
                            <Avatar
                              key={index}
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: participant.type === 'ai_agent' ? '#3b82f6' : '#8b5cf6'
                              }}
                            >
                              {participant.type === 'ai_agent' ? '🤖' : participant.name.charAt(0).toUpperCase()}
                            </Avatar>
                          ))}
                        </Box>
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                          {conversation.name || 'Shared Chat'}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {conversation.participants?.length || 0} participants • {conversation.messageCount || 0} messages • ID: {conversation.id}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label="Guest"
                        size="small"
                        sx={{ bgcolor: '#10b981', color: 'white', fontSize: '0.7rem' }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Box>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            '& .MuiMenuItem-root': {
              color: '#e2e8f0',
              '&:hover': { bgcolor: '#334155' }
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            const session = chatSessions.find(s => s.id === menuSessionId);
            if (session) {
              setRenameChatName(session.name);
              setRenameSessionId(session.id);
              setRenameDialogOpen(true);
            }
            handleMenuClose();
          }}
        >
          <Edit sx={{ fontSize: 16, mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteSessionId(menuSessionId);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
        >
          <Delete sx={{ fontSize: 16, mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* New Chat Dialog */}
      <Dialog
        open={newChatDialogOpen}
        onClose={() => setNewChatDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#1e293b', color: 'white' }
        }}
      >
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Chat Name (optional)"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: 'white',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button onClick={handleCreateNewChat} sx={{ color: '#3b82f6' }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#1e293b', color: 'white' }
        }}
      >
        <DialogTitle>Rename Chat</DialogTitle>
        <DialogContent>
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
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button onClick={handleRenameChat} sx={{ color: '#3b82f6' }}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#1e293b', color: 'white' }
        }}
      >
        <DialogTitle>Delete Chat</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteChat} sx={{ color: '#ef4444' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedChatHistoryPanelDebug;

