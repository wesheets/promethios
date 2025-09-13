/**
 * Enhanced Chat History Panel
 * 
 * Enhanced version of ChatHistoryPanel with Host/Guest tabs integration
 * Includes shared conversations from the drawer in the Guest Chats tab
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

const EnhancedChatHistoryPanel: React.FC<EnhancedChatHistoryPanelProps> = ({
  agentId,
  agentName,
  currentUser,
  onChatSelect,
  onNewChat,
  refreshTrigger,
  sharedConversations: propSharedConversations,
  onSharedConversationSelect,
}) => {
  // Use shared conversation context for real-time updates
  const { sharedConversations: contextSharedConversations, refreshSharedConversations } = useSharedConversations();
  
  // Use context conversations if available, fallback to props
  const sharedConversations = contextSharedConversations.length > 0 ? contextSharedConversations : propSharedConversations;
  // Tab state
  const [activeTab, setActiveTab] = useState(0); // 0: Host Chats, 1: Guest Chats
  
  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Load chat sessions
  const loadChatSessions = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const filter: ChatHistoryFilter = {
        agentId: agentId,
      };

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
  }, [currentUser?.uid, agentId, searchTerm]);

  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('🔄 [RealTime] Enhanced chat history panel refreshing due to trigger:', refreshTrigger);
      loadChatSessions();
      // Also refresh shared conversations for real-time updates
      refreshSharedConversations();
    }
  }, [refreshTrigger, loadChatSessions, refreshSharedConversations]);

  // Handle shared conversation selection with drawer close
  const handleSharedConversationClick = (conversationId: string) => {
    console.log('🔄 [EnhancedChatHistory] Shared conversation selected:', conversationId);
    onSharedConversationSelect(conversationId);
    // Note: The parent component should handle closing the drawer/panel if needed
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Create new chat
  const handleCreateNewChat = async () => {
    if (!currentUser?.uid) return;

    try {
      console.log('🆕 Creating new chat session...');
      
      const chatName = newChatName.trim() || undefined;
      
      setNewChatDialogOpen(false);
      setNewChatName('');
      
      const session = await chatHistoryService.createChatSession(
        agentId,
        agentName,
        currentUser.uid,
        chatName
      );

      console.log(`✅ Created new chat session: ${session.name} (${session.id})`);
      
      setChatSessions(prev => [session, ...prev]);
      onChatSelect(session);
      onNewChat(session);
      
      console.log('✅ New chat creation completed successfully');
    } catch (error) {
      console.error('❌ Failed to create new chat:', error);
      loadChatSessions();
    }
  };

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuSessionId(null);
  };

  // Rename chat
  const handleRenameChat = async () => {
    if (!renameSessionId || !renameChatName.trim()) return;

    try {
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
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  // Delete chat
  const handleDeleteChat = async () => {
    if (!deleteSessionId) return;

    try {
      await chatHistoryService.deleteChatSession(deleteSessionId);
      setChatSessions(prev => prev.filter(session => session.id !== deleteSessionId));
      setDeleteDialogOpen(false);
      setDeleteSessionId(null);
    } catch (error) {
      console.error('Failed to delete chat:', error);
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

    return filtered;
  };

  // Filter shared conversations based on search
  const getFilteredSharedConversations = () => {
    if (!searchTerm) return sharedConversations;
    
    return sharedConversations.filter(conv =>
      (conv.name || 'Shared Chat').toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participants?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Chat History
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
                    onClick={() => onChatSelect(session)}
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
                          {formatDate(session.updatedAt)} • {session.messages?.length || 0} messages
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, session.id)}
                        sx={{ color: '#64748b' }}
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
            {filteredSharedConversations.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {searchTerm ? 'No shared conversations found matching your search.' : 'No shared conversations yet'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Create or join a shared conversation to get started
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
                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                          {conversation.participants?.slice(0, 3).map((participant, pIndex) => (
                            <Avatar
                              key={participant.id}
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: '0.6rem',
                                bgcolor: participant.type === 'ai_agent' ? '#6366f1' : '#10b981',
                                border: '2px solid #0f172a',
                                ml: pIndex > 0 ? -0.75 : 0,
                                zIndex: 3 - pIndex
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
                          {conversation.participants?.length || 0} participants • {conversation.messageCount || 0} messages
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

export default EnhancedChatHistoryPanel;

