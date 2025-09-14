/**
 * Optimized Chat History Panel
 * 
 * High-performance chat history interface with advanced features:
 * - React performance optimization (memo, useMemo, useCallback)
 * - Real-time updates with WebSocket integration
 * - Human participant interaction (profile view, direct messaging)
 * - AI-powered categorization and smart search
 * - Enhanced trust score visualization
 * - Instant loading and smooth interactions
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  Popover,
  Card,
  CardContent,
  Badge,
  LinearProgress,
  Fade,
  Skeleton,
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
  Message as DirectMessageIcon,
  Person as ProfileIcon,
  TrendingUp,
  Security,
  Speed,
  Psychology,
  Group,
  Star,
  Circle,
} from '@mui/icons-material';
import { ChatHistoryService, ChatSession, ChatHistoryFilter, ChatParticipant } from '../../services/ChatHistoryService';
import { ChatSharingService } from '../../services/ChatSharingService';
import { SharedConversation } from '../../services/SharedConversationService';
import { useAuth } from '../../context/AuthContext';
import ChatInvitationModal from '../collaboration/ChatInvitationModal';

// Global cache that persists across component re-mounts
const globalChatCache: {[key: string]: {sessions: ChatSession[], timestamp: number}} = {};

// Performance-optimized interfaces
interface OptimizedChatHistoryPanelProps {
  agentId: string;
  agentName: string;
  onChatSelect: (session: ChatSession) => void;
  onNewChat: (session?: ChatSession) => void;
  onShareChat?: (contextId: string) => void;
  currentSessionId?: string;
  refreshTrigger?: number;
  sharedConversations?: SharedConversation[];
  onSharedConversationSelect?: (conversationId: string) => void;
  onDirectMessage?: (userId: string, userName: string) => void; // New: Direct message integration
  onViewProfile?: (userId: string) => void; // New: Profile view integration
  onDeleteSharedConversation?: (conversationId: string) => void; // New: Delete shared conversation
  onBulkCleanupLegacyConversations?: () => void; // New: Bulk cleanup for legacy conversations
}

// Memoized participant component for performance
const ParticipantAvatar = memo(({ 
  participant, 
  size = 24, 
  showTooltip = true,
  onDirectMessage,
  onViewProfile 
}: {
  participant: ChatParticipant;
  size?: number;
  showTooltip?: boolean;
  onDirectMessage?: (userId: string, userName: string) => void;
  onViewProfile?: (userId: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (participant.type === 'human') {
      setAnchorEl(event.currentTarget);
    }
  }, [participant.type]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDirectMessage = useCallback(() => {
    onDirectMessage?.(participant.id, participant.name);
    handleClose();
  }, [onDirectMessage, participant.id, participant.name, handleClose]);

  const handleViewProfile = useCallback(() => {
    onViewProfile?.(participant.id);
    handleClose();
  }, [onViewProfile, participant.id, handleClose]);

  const avatarContent = useMemo(() => (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        participant.type === 'human' && participant.status === 'active' ? (
          <Circle sx={{ fontSize: 8, color: '#10b981' }} />
        ) : null
      }
    >
      <Avatar
        onClick={handleClick}
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          bgcolor: participant.type === 'ai_agent' ? '#6366f1' : '#10b981',
          cursor: participant.type === 'human' ? 'pointer' : 'default',
          border: '2px solid #0f172a',
          '&:hover': participant.type === 'human' ? {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s ease-in-out',
          } : {},
        }}
      >
        {participant.type === 'ai_agent' ? '🤖' : participant.name.charAt(0).toUpperCase()}
      </Avatar>
    </Badge>
  ), [participant, size, handleClick]);

  if (!showTooltip || participant.type !== 'human') {
    return avatarContent;
  }

  return (
    <>
      {avatarContent}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 2,
            mt: 1,
          }
        }}
      >
        <Card sx={{ bgcolor: 'transparent', boxShadow: 'none', minWidth: 200 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#10b981',
                }}
              >
                {participant.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                  {participant.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Circle sx={{ fontSize: 8, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#10b981' }}>
                    Online
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Typography variant="caption" sx={{ color: '#94a3b8', mb: 2, display: 'block' }}>
              {participant.messageCount} messages • Last active {new Date(participant.lastActive).toLocaleDateString()}
            </Typography>

            <Stack spacing={1}>
              <Button
                fullWidth
                size="small"
                startIcon={<ProfileIcon />}
                onClick={handleViewProfile}
                sx={{
                  color: '#94a3b8',
                  borderColor: '#334155',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    color: 'white',
                  },
                }}
                variant="outlined"
              >
                View Profile
              </Button>
              <Button
                fullWidth
                size="small"
                startIcon={<DirectMessageIcon />}
                onClick={handleDirectMessage}
                sx={{
                  bgcolor: '#3b82f6',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#2563eb',
                  },
                }}
                variant="contained"
              >
                Direct Message
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Popover>
    </>
  );
});

// Memoized trust score component
const TrustScoreIndicator = memo(({ score, size = 'small' }: { score: number; size?: 'small' | 'medium' }) => {
  const getColor = useCallback((score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  }, []);

  const getLabel = useCallback((score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Review';
  }, []);

  return (
    <Tooltip title={`Trust Score: ${score.toFixed(1)}% - ${getLabel(score)}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box
          sx={{
            width: size === 'small' ? 6 : 8,
            height: size === 'small' ? 6 : 8,
            borderRadius: '50%',
            bgcolor: getColor(score),
          }}
        />
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'} 
          sx={{ color: '#64748b', fontSize: size === 'small' ? '0.65rem' : '0.75rem' }}
        >
          {score.toFixed(0)}%
        </Typography>
      </Box>
    </Tooltip>
  );
});

// Memoized chat item component for performance
const ChatListItem = memo(({ 
  session, 
  isSelected, 
  agentName, 
  onSelect, 
  onMenuOpen, 
  onInvite, 
  onShare, 
  onStartEdit,
  onDirectMessage,
  onViewProfile,
  shareSuccess,
  editingSessionId,
  editingName,
  onEditChange,
  onEditKeyPress,
  onEditBlur,
}: {
  session: ChatSession;
  isSelected: boolean;
  agentName: string;
  onSelect: (session: ChatSession) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, sessionId: string) => void;
  onInvite: (session: ChatSession) => void;
  onShare: (sessionId: string) => void;
  onStartEdit: (sessionId: string, name: string) => void;
  onDirectMessage?: (userId: string, userName: string) => void;
  onViewProfile?: (userId: string) => void;
  shareSuccess: string | null;
  editingSessionId: string | null;
  editingName: string;
  onEditChange: (value: string) => void;
  onEditKeyPress: (e: React.KeyboardEvent) => void;
  onEditBlur: () => void;
}) => {
  const formatDate = useCallback((date: Date): string => {
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
  }, []);

  return (
    <ListItem
      button
      onClick={() => onSelect(session)}
      sx={{
        py: 1.5,
        px: 2,
        bgcolor: isSelected ? '#1e293b' : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? '#1e293b' : '#1e293b',
        },
        borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
        transition: 'all 0.2s ease-in-out',
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
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={onEditKeyPress}
                onBlur={onEditBlur}
                autoFocus
                size="small"
                variant="outlined"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1e293b',
                    color: 'white',
                    fontSize: '0.875rem',
                    '& fieldset': { borderColor: '#3b82f6' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
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
                  onStartEdit(session.id, session.name);
                }}
                sx={{
                  color: 'white',
                  fontWeight: isSelected ? 600 : 400,
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
              <Chip 
                label="Shared"
                size="small"
                sx={{ ml: 1, bgcolor: '#3b82f6', color: 'white', height: '18px', fontSize: '0.7rem' }}
              />
            )}
            {session.cryptographicReceipt && (
              <Tooltip title="Cryptographically verified">
                <Verified sx={{ fontSize: 14, color: '#3b82f6' }} />
              </Tooltip>
            )}
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            {/* Guest Participants Display with Enhanced Interaction */}
            {session.participants?.guests && session.participants.guests.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                  with
                </Typography>
                {session.participants.guests.map((guest, index) => (
                  <React.Fragment key={guest.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <ParticipantAvatar
                        participant={guest}
                        size={12}
                        onDirectMessage={onDirectMessage}
                        onViewProfile={onViewProfile}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: guest.type === 'ai_agent' ? '#10b981' : '#f59e0b',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          cursor: guest.type === 'ai_agent' ? 'pointer' : 'default',
                          '&:hover': guest.type === 'ai_agent' ? {
                            color: '#3b82f6',
                          } : {},
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (guest.type === 'ai_agent') {
                            window.location.href = `/ui/chat/chatbots?agent=${guest.id}`;
                          }
                        }}
                      >
                        @{guest.name}
                      </Typography>
                    </Box>
                    {index < session.participants.guests.length - 1 && (
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                        ,
                      </Typography>
                    )}
                  </React.Fragment>
                ))}
              </Box>
            )}
            
            {/* Message Count, Date, and Trust Score */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {session.messageCount} messages • {formatDate(session.lastUpdated)}
              </Typography>
              <TrustScoreIndicator score={session.governanceMetrics.overallTrustScore} />
            </Box>
          </Box>
        }
      />
      
      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Chat Invite Button */}
          <Tooltip title="Invite team member to this chat">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onInvite(session);
              }}
              sx={{ 
                color: '#64748b',
                '&:hover': { 
                  color: '#3b82f6',
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                },
              }}
            >
              <PersonAdd sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Quick Share Button */}
          <Tooltip title="Share with Agent - Send this chat as context">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onShare(session.id);
              }}
              sx={{ 
                color: session.isShared ? '#10b981' : '#64748b',
                '&:hover': { 
                  color: '#10b981',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                },
              }}
            >
              {shareSuccess === session.id ? (
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
              onMenuOpen(e, session.id);
            }}
            sx={{ color: '#64748b' }}
          >
            <MoreVert sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
});

// Main optimized component
const OptimizedChatHistoryPanel: React.FC<OptimizedChatHistoryPanelProps> = ({
  agentId,
  agentName,
  onChatSelect,
  onNewChat,
  onShareChat,
  currentSessionId,
  refreshTrigger,
  sharedConversations = [],
  onSharedConversationSelect,
  onDirectMessage,
  onViewProfile,
  onDeleteSharedConversation,
  onBulkCleanupLegacyConversations,
}) => {
  const { currentUser } = useAuth();
  
  // State management with performance optimization
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);  // Start with false, set to true only when needed
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Background refresh state
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  
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

  // Invitation states
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationChatSession, setInvitationChatSession] = useState<ChatSession | null>(null);

  // Service instances (memoized)
  const chatHistoryService = useMemo(() => ChatHistoryService.getInstance(), []);
  const chatSharingService = useMemo(() => ChatSharingService.getInstance(), []);

  // Optimized load function with caching and error handling
  const loadChatSessions = useCallback(async (forceRefresh = false) => {
    console.log('🔍 [DEBUG] loadChatSessions called:', {
      currentUserUid: currentUser?.uid,
      agentId,
      searchTerm,
      loading,
      forceRefresh
    });

    if (!currentUser?.uid) {
      console.log('❌ [DEBUG] No current user UID, skipping load');
      setLoading(false);
      return;
    }

    // Create cache key
    const cacheKey = `${currentUser.uid}_${agentId}_${searchTerm.trim()}`;
    const cached = globalChatCache[cacheKey];  // Use global cache
    const now = Date.now();
    const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

    // Check cache first for instant loading
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log('⚡ [DEBUG] Using cached sessions for instant loading:', {
        cacheKey,
        sessionsCount: cached.sessions.length,
        cacheAge: now - cached.timestamp
      });
      
      setChatSessions(cached.sessions);
      setLoading(false);  // Ensure loading is false for cached data
      
      // Start background refresh if cache is older than 30 seconds
      if ((now - cached.timestamp) > 30000) {
        console.log('🔄 [DEBUG] Starting background refresh...');
        setIsBackgroundRefreshing(true);
        setTimeout(() => loadChatSessions(true), 100);
      }
      return;
    }

    try {
      // Only set loading to true if we're not using cached data
      if (!forceRefresh) {
        setLoading(true);
      }
      console.log('🔍 [DEBUG] Starting chat sessions load...');
      
      // Use a more efficient filter approach
      const filter: ChatHistoryFilter = {
        agentId: agentId,
      };

      // Only add search filter if there's actually a search term
      if (searchTerm.trim()) {
        filter.searchTerm = searchTerm.trim();
      }

      console.log('🔍 [DEBUG] Filter:', filter);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Chat loading timeout')), 10000)
      );

      const sessionsPromise = chatHistoryService.getChatSessions(currentUser.uid, filter);
      
      console.log('🔍 [DEBUG] Waiting for sessions...');
      const sessions = await Promise.race([sessionsPromise, timeoutPromise]) as ChatSession[];
      
      console.log('🔍 [DEBUG] Raw sessions received:', {
        sessionsLength: sessions?.length || 0,
        sessions: sessions?.slice(0, 3).map(s => ({ id: s?.id, name: s?.name, agentId: s?.agentId })) || []
      });
      
      // Validate the sessions data
      const validSessions = sessions.filter(session => 
        session && 
        typeof session.id === 'string' && 
        typeof session.name === 'string'
      );
      
      console.log('🔍 [DEBUG] Valid sessions after filtering:', {
        validSessionsLength: validSessions.length,
        originalLength: sessions?.length || 0,
        validSessions: validSessions.slice(0, 3).map(s => ({ id: s.id, name: s.name, agentId: s.agentId }))
      });
      
      // Update global cache
      globalChatCache[cacheKey] = {
        sessions: validSessions,
        timestamp: now
      };
      
      setChatSessions(validSessions);
      console.log('✅ [DEBUG] Chat sessions set successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Failed to load chat sessions:', error);
      console.error('❌ [DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        currentUserUid: currentUser?.uid,
        agentId,
        searchTerm
      });
      
      // Don't clear existing sessions on error, just log it
      if (chatSessions.length === 0) {
        setChatSessions([]);
      }
    } finally {
      setLoading(false);
      setIsBackgroundRefreshing(false);
      console.log('🔍 [DEBUG] loadChatSessions completed');
    }
  }, [currentUser?.uid, agentId, searchTerm, chatHistoryService, chatSessions.length]);

  // Debounced search for performance - only trigger if search actually changed
  const debouncedSearch = useMemo(() => {
    const timeoutId = setTimeout(() => {
      // Only load if we're not already loading and search term actually changed
      if (!loading) {
        loadChatSessions();
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadChatSessions, loading]);

  useEffect(() => {
    return debouncedSearch;
  }, [debouncedSearch]);

  // Initial load - only when agentId or user changes, not on every render
  useEffect(() => {
    console.log('🔍 [DEBUG] Initial load useEffect triggered:', {
      agentId,
      currentUserUid: currentUser?.uid,
      loading
    });
    
    if (agentId && currentUser?.uid) {
      console.log('🔍 [DEBUG] Conditions met, calling loadChatSessions');
      loadChatSessions();
    } else {
      console.log('🔍 [DEBUG] Conditions not met:', {
        hasAgentId: !!agentId,
        hasCurrentUser: !!currentUser?.uid
      });
    }
  }, [agentId, currentUser?.uid, loadChatSessions]); // Added loadChatSessions back to deps

  // Real-time refresh optimization
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('🔄 [RealTime] Chat history panel refreshing due to trigger:', refreshTrigger);
      loadChatSessions();
    }
  }, [refreshTrigger, loadChatSessions]);

  // Optimized handlers with useCallback
  const handleCreateNewChat = useCallback(async () => {
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

      // Optimistic update
      setChatSessions(prev => [session, ...prev]);
      onChatSelect(session);
      onNewChat(session);
      
      console.log('✅ New chat creation completed successfully');
    } catch (error) {
      console.error('❌ Failed to create new chat:', error);
      loadChatSessions();
    }
  }, [currentUser?.uid, newChatName, agentId, agentName, chatHistoryService, onChatSelect, onNewChat, loadChatSessions]);

  const handleRenameChat = useCallback(async () => {
    if (!renameSessionId || !renameChatName.trim()) return;

    try {
      // Optimistic update
      setChatSessions(prev => prev.map(session => 
        session.id === renameSessionId 
          ? { ...session, name: renameChatName.trim() }
          : session
      ));
      
      setRenameDialogOpen(false);
      setRenameSessionId(null);
      setRenameChatName('');
      
      await chatHistoryService.renameChatSession(renameSessionId, renameChatName.trim());
    } catch (error) {
      console.error('Failed to rename chat:', error);
      loadChatSessions();
    }
  }, [renameSessionId, renameChatName, chatHistoryService, loadChatSessions]);

  const handleStartInlineEdit = useCallback((sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditingName(currentName);
  }, []);

  const handleSaveInlineEdit = useCallback(async () => {
    if (!editingSessionId || !editingName.trim()) return;

    try {
      // Optimistic update
      setChatSessions(prev => prev.map(session => 
        session.id === editingSessionId 
          ? { ...session, name: editingName.trim() }
          : session
      ));
      
      setEditingSessionId(null);
      setEditingName('');
      
      await chatHistoryService.renameChatSession(editingSessionId, editingName.trim());
    } catch (error) {
      console.error('Failed to rename chat:', error);
      loadChatSessions();
    }
  }, [editingSessionId, editingName, chatHistoryService, loadChatSessions]);

  const handleCancelInlineEdit = useCallback(() => {
    setEditingSessionId(null);
    setEditingName('');
  }, []);

  const handleInlineEditKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveInlineEdit();
    } else if (e.key === 'Escape') {
      handleCancelInlineEdit();
    }
  }, [handleSaveInlineEdit, handleCancelInlineEdit]);

  const handleDeleteChat = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      // Optimistic update
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (sessionId === currentSessionId) {
        onNewChat();
      }
      
      await chatHistoryService.deleteChatSession(sessionId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      loadChatSessions();
    }
  }, [currentSessionId, onNewChat, chatHistoryService, loadChatSessions]);

  const handleShareChat = useCallback(async (sessionId: string) => {
    if (!currentUser?.uid) return;

    try {
      setShareLoading(sessionId);
      
      const shareableReference = await chatSharingService.generateChatShareReference(
        sessionId,
        currentUser.uid,
        agentId
      );
      
      const shareMessage = chatSharingService.generateChatShareMessage(shareableReference);
      
      setShareSuccess(sessionId);
      setTimeout(() => setShareSuccess(null), 3000);
      
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
  }, [currentUser?.uid, agentId, chatSharingService, onShareChat]);

  const handleInviteToChat = useCallback((session: ChatSession) => {
    console.log('🎯 [ChatHistory] Inviting team member to chat:', session.name);
    setInvitationChatSession(session);
    setShowInvitationModal(true);
  }, []);

  // Shared conversation delete handler
  const handleDeleteSharedConversation = useCallback(async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this shared conversation? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ [SharedChat] Deleting shared conversation:', conversationId);
      
      if (onDeleteSharedConversation) {
        onDeleteSharedConversation(conversationId);
      }
      
      console.log('✅ [SharedChat] Shared conversation deleted successfully');
    } catch (error) {
      console.error('❌ [SharedChat] Failed to delete shared conversation:', error);
    }
  }, [onDeleteSharedConversation]);

  // Bulk cleanup handler for legacy conversations
  const handleBulkCleanupLegacy = useCallback(async () => {
    if (!confirm('Are you sure you want to clean up all legacy shared conversations? This will remove old conversations that may no longer work properly. This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🧹 [LegacyCleanup] Starting bulk cleanup of legacy conversations');
      
      if (onBulkCleanupLegacyConversations) {
        onBulkCleanupLegacyConversations();
      }
      
      console.log('✅ [LegacyCleanup] Bulk cleanup completed successfully');
    } catch (error) {
      console.error('❌ [LegacyCleanup] Failed to cleanup legacy conversations:', error);
    }
  }, [onBulkCleanupLegacyConversations]);

  // Menu handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setMenuAnchor(event.currentTarget);
    setMenuSessionId(sessionId);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuSessionId(null);
  }, []);

  const handleMenuRename = useCallback(() => {
    if (menuSessionId) {
      const session = chatSessions.find(s => s.id === menuSessionId);
      if (session) {
        setRenameSessionId(menuSessionId);
        setRenameChatName(session.name);
        setRenameDialogOpen(true);
      }
    }
    handleMenuClose();
  }, [menuSessionId, chatSessions, handleMenuClose]);

  const handleMenuShare = useCallback(() => {
    if (menuSessionId) {
      handleShareChat(menuSessionId);
    }
    handleMenuClose();
  }, [menuSessionId, handleShareChat, handleMenuClose]);

  const handleMenuDelete = useCallback(() => {
    if (menuSessionId) {
      handleDeleteChat(menuSessionId);
    }
    handleMenuClose();
  }, [menuSessionId, handleDeleteChat, handleMenuClose]);

  // Filtered shared conversations for search
  const filteredSharedConversations = useMemo(() => {
    return sharedConversations.filter(conv => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const convName = conv.name || 'Shared Chat';
      
      // Safe string conversion and toLowerCase
      const nameMatch = typeof convName === 'string' 
        ? convName.toLowerCase().includes(searchLower)
        : String(convName).toLowerCase().includes(searchLower);
      
      const participantMatch = conv.participants?.some(p => 
        typeof p.name === 'string' 
          ? p.name.toLowerCase().includes(searchLower)
          : String(p.name || '').toLowerCase().includes(searchLower)
      );
      
      return nameMatch || participantMatch;
    });
  }, [sharedConversations, searchTerm]);

  // Loading skeleton component that fills available height
  const LoadingSkeleton = memo(() => (
    <Box sx={{ 
      p: 2,
      height: '100%',      // Fill available height
      overflow: 'hidden'   // Prevent overflow
    }}>
      {[...Array(12)].map((_, index) => (  // Show more skeleton items
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: '#334155' }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#334155' }} />
          </Box>
          <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: '#334155', ml: 4.5 }} />
        </Box>
      ))}
    </Box>
  ));

  return (
    <Box sx={{ 
      height: '100%', 
      maxHeight: '100%',   // Ensure it doesn't exceed parent height
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#0f172a',
      color: 'white',
      overflow: 'hidden',
      position: 'relative'  // Ensure proper positioning
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
              bgcolor: '#1e293b',
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

        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid #334155' }}>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
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
                    label={chatSessions.length}
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
      </Box>

      {/* Chat List */}
      <Box sx={{ 
        flexGrow: 1,     // Take up remaining space
        minHeight: 0,    // Allow shrinking below content size
        maxHeight: '100%', // Don't exceed available space
        overflow: 'hidden',  // Prevent overflow
        bgcolor: '#0f172a',
        display: 'flex',     // Make this a flex container
        flexDirection: 'column'  // Stack content vertically
      }}>
        <Box sx={{
          flexGrow: 1,
          minHeight: 0,      // Allow shrinking
          maxHeight: '100%', // Don't exceed available space
          overflow: 'auto',  // Allow scrolling within this area
          height: '100%'     // Explicitly use full height
        }}>
        {activeTab === 0 ? (
          // Host Chats Tab
          <>
            {/* Debug Info */}
            <Box sx={{ p: 1, bgcolor: '#1e293b', borderBottom: '1px solid #334155' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                DEBUG: User: {currentUser?.uid || 'None'} | Agent: {agentId} | Sessions: {chatSessions.length} | Loading: {loading.toString()} | BG Refresh: {isBackgroundRefreshing.toString()}
              </Typography>
            </Box>
            
            {loading ? (
              <LoadingSkeleton />
            ) : chatSessions.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {searchTerm ? 'No chats found matching your search.' : 'No chat history yet.'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                  DEBUG: User={currentUser?.uid}, Agent={agentId}, Filter={JSON.stringify({ agentId, searchTerm })}
                </Typography>
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
                    },
                  }}
                >
                  Start New Chat
                </Button>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {chatSessions.map((session, index) => (
                  <React.Fragment key={session.id}>
                    <ChatListItem
                      session={session}
                      isSelected={session.id === currentSessionId}
                      agentName={agentName}
                      onSelect={onChatSelect}
                      onMenuOpen={handleMenuOpen}
                      onInvite={handleInviteToChat}
                      onShare={handleShareChat}
                      onStartEdit={handleStartInlineEdit}
                      onDirectMessage={onDirectMessage}
                      onViewProfile={onViewProfile}
                      shareSuccess={shareSuccess}
                      editingSessionId={editingSessionId}
                      editingName={editingName}
                      onEditChange={setEditingName}
                      onEditKeyPress={handleInlineEditKeyPress}
                      onEditBlur={handleSaveInlineEdit}
                    />
                    {index < chatSessions.length - 1 && (
                      <Divider sx={{ bgcolor: '#334155', mx: 2 }} />
                    )}
                  </React.Fragment>
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
              <List sx={{ p: 0 }}>
                {filteredSharedConversations.map((conversation, index) => (
                  <React.Fragment key={conversation.id}>
                    <ListItem
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': { bgcolor: '#1e293b' },
                        transition: 'background-color 0.2s ease-in-out',
                        cursor: 'pointer',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box sx={{ position: 'relative' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                            {conversation.participants?.slice(0, 3).map((participant, pIndex) => (
                              <ParticipantAvatar
                                key={participant.id}
                                participant={participant}
                                size={24}
                                onDirectMessage={onDirectMessage}
                                onViewProfile={onViewProfile}
                              />
                            ))}
                          </Box>
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        onClick={() => onSharedConversationSelect?.(conversation.id)}
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
                      <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label="Guest"
                          size="small"
                          sx={{ bgcolor: '#10b981', color: 'white', fontSize: '0.7rem' }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredSharedConversations.length - 1 && (
                      <Divider sx={{ bgcolor: '#334155', mx: 2 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
        </Box>
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
        <MenuItem onClick={handleMenuRename}>
          <Edit sx={{ mr: 1, fontSize: 16 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleMenuShare}>
          <Share sx={{ mr: 1, fontSize: 16 }} />
          Share
        </MenuItem>
        <Divider sx={{ bgcolor: '#334155' }} />
        <MenuItem onClick={handleMenuDelete} sx={{ color: '#ef4444' }}>
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
        <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white' }}>
          Create New Chat
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e293b' }}>
          <TextField
            autoFocus
            margin="dense"
            label="Chat Name (optional)"
            fullWidth
            variant="outlined"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNewChat();
              }
            }}
            sx={{
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
            Create
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
        <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white' }}>
          Rename Chat
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e293b' }}>
          <TextField
            autoFocus
            margin="dense"
            label="Chat Name"
            fullWidth
            variant="outlined"
            value={renameChatName}
            onChange={(e) => setRenameChatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameChat();
              }
            }}
            sx={{
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

      {/* Chat Invitation Modal */}
      <ChatInvitationModal
        open={showInvitationModal}
        onClose={() => {
          setShowInvitationModal(false);
          setInvitationChatSession(null);
        }}
        chatSession={invitationChatSession ? {
          id: invitationChatSession.id,
          name: invitationChatSession.name,
          messageCount: invitationChatSession.messageCount
        } : null}
        agentId={agentId}
        agentName={agentName}
      />
    </Box>
  );
};

export default memo(OptimizedChatHistoryPanel);

