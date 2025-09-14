/**
 * Enhanced Chat History Panel - Optimized Version
 * 
 * Optimizations implemented:
 * 1. Caching mechanism for host chats
 * 2. Skeleton loader instead of spinner
 * 3. Optimistic loading with cached data
 * 4. Background refresh for real-time updates
 * 5. Improved loading states
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Skeleton,
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

// Cache interface for storing chat sessions
interface ChatSessionCache {
  [agentId: string]: {
    sessions: ChatSession[];
    timestamp: number;
    userId: string;
  };
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Global cache for chat sessions
const chatSessionCache: ChatSessionCache = {};

const EnhancedChatHistoryPanelOptimized: React.FC<EnhancedChatHistoryPanelProps> = ({
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
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
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cache management functions
  const getCacheKey = (userId: string, agentId: string) => `${userId}_${agentId}`;
  
  const getCachedSessions = (userId: string, agentId: string): ChatSession[] | null => {
    const cacheKey = getCacheKey(userId, agentId);
    const cached = chatSessionCache[cacheKey];
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      delete chatSessionCache[cacheKey];
      return null;
    }
    
    return cached.sessions;
  };
  
  const setCachedSessions = (userId: string, agentId: string, sessions: ChatSession[]) => {
    const cacheKey = getCacheKey(userId, agentId);
    chatSessionCache[cacheKey] = {
      sessions: [...sessions],
      timestamp: Date.now(),
      userId
    };
  };

  // Optimized load function with caching
  const loadChatSessions = useCallback(async (forceRefresh = false) => {
    if (!currentUser?.uid) {
      setIsInitialLoading(false);
      return;
    }

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedSessions = getCachedSessions(currentUser.uid, agentId);
        if (cachedSessions) {
          console.log('🚀 [OptimizedChatHistory] Using cached sessions:', cachedSessions.length);
          setChatSessions(cachedSessions);
          setIsInitialLoading(false);
          
          // Start background refresh
          setIsBackgroundRefreshing(true);
          setTimeout(() => loadChatSessions(true), 100);
          return;
        }
      }
      
      if (!forceRefresh) {
        setIsInitialLoading(true);
      }
      
      const filter: ChatHistoryFilter = {
        agentId: agentId,
      };

      if (searchTerm.trim()) {
        filter.searchTerm = searchTerm.trim();
      }

      console.log('🔄 [OptimizedChatHistory] Loading sessions from API...');
      const sessions = await chatHistoryService.getChatSessions(currentUser.uid, filter);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setChatSessions(sessions);
        setCachedSessions(currentUser.uid, agentId, sessions);
        console.log('✅ [OptimizedChatHistory] Sessions loaded and cached:', sessions.length);
      }
    } catch (error) {
      console.error('❌ [OptimizedChatHistory] Failed to load chat sessions:', error);
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoading(false);
        setIsBackgroundRefreshing(false);
      }
    }
  }, [currentUser?.uid, agentId, searchTerm]);

  // Initial load with cache check
  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('🔄 [OptimizedChatHistory] Refreshing due to trigger:', refreshTrigger);
      loadChatSessions(true);
      refreshSharedConversations();
    }
  }, [refreshTrigger, loadChatSessions, refreshSharedConversations]);

  // Handle shared conversation selection with drawer close
  const handleSharedConversationClick = (conversationId: string) => {
    console.log('🔄 [OptimizedChatHistory] Shared conversation selected:', conversationId);
    onSharedConversationSelect(conversationId);
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
      
      // Update cache and state
      const updatedSessions = [session, ...chatSessions];
      setChatSessions(updatedSessions);
      setCachedSessions(currentUser.uid, agentId, updatedSessions);
      
      onChatSelect(session);
      onNewChat(session);
      
      console.log('✅ New chat creation completed successfully');
    } catch (error) {
      console.error('❌ Failed to create new chat:', error);
      loadChatSessions(true);
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

      const updatedSessions = chatSessions.map(session =>
        session.id === renameSessionId
          ? { ...session, name: renameChatName.trim() }
          : session
      );
      
      setChatSessions(updatedSessions);
      setCachedSessions(currentUser.uid, agentId, updatedSessions);

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
      const updatedSessions = chatSessions.filter(session => session.id !== deleteSessionId);
      setChatSessions(updatedSessions);
      setCachedSessions(currentUser.uid, agentId, updatedSessions);
      
      setDeleteDialogOpen(false);
      setDeleteSessionId(null);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Filter chats based on search
  const filteredChats = useMemo(() => {
    if (!searchTerm) return chatSessions;
    
    return chatSessions.filter(chat =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatSessions, searchTerm]);

  // Filter shared conversations based on search
  const filteredSharedConversations = useMemo(() => {
    if (!searchTerm) return sharedConversations;
    
    return sharedConversations.filter(conv =>
      (conv.name || 'Shared Chat').toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participants?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sharedConversations, searchTerm]);

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

  // Skeleton loader component for host chats
  const HostChatsSkeleton = () => (
    <List sx={{ py: 0 }}>
      {[1, 2, 3, 4, 5].map((index) => (
        <ListItem key={index} sx={{ py: 1.5, px: 2, borderBottom: '1px solid #1e293b' }}>
          <ListItemIcon>
            <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: '#334155' }} />
          </ListItemIcon>
          <ListItemText
            primary={<Skeleton variant="text" width="60%" sx={{ bgcolor: '#334155' }} />}
            secondary={<Skeleton variant="text" width="40%" sx={{ bgcolor: '#334155' }} />}
          />
          <ListItemSecondaryAction>
            <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: '#334155' }} />
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Chat History
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isBackgroundRefreshing && (
              <Tooltip title="Refreshing...">
                <CircularProgress size={16} sx={{ color: '#3b82f6' }} />
              </Tooltip>
            )}
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
          // Host Chats Tab - Optimized Loading
          <>
            {isInitialLoading ? (
              <HostChatsSkeleton />
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
          // Guest Chats Tab - Same as before
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
                                ml: pIndex > 0 ? -1 : 0,
                                zIndex: 3 - pIndex,
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

export default EnhancedChatHistoryPanelOptimized;

