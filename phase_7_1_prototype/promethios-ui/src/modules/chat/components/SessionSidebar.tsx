import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
  Badge,
  Collapse,
  TextField,
  InputAdornment,
  Divider,
  Avatar,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Chat as ChatIcon,
  Schedule as ScheduleIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { ChatSession, ChatMode } from '../types';
import { ChatSessionRegistry } from '../services/ChatSessionRegistry';

interface SessionSidebarProps {
  userId: string;
  currentSessionId?: string;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  compact?: boolean;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  userId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  compact = false
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recent: true,
    starred: true,
    archived: false
  });
  const [loading, setLoading] = useState(true);

  // Load user sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const userSessions = await ChatSessionRegistry.getUserSessions(userId);
        setSessions(userSessions);
        setFilteredSessions(userSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [userId]);

  // Filter sessions based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
      return;
    }

    const filtered = sessions.filter(session =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.agentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.systemId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSessions(filtered);
  }, [sessions, searchQuery]);

  // Group sessions
  const groupedSessions = {
    recent: filteredSessions
      .filter(s => !s.isStarred && !s.isArchived)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
      .slice(0, 10),
    starred: filteredSessions
      .filter(s => s.isStarred && !s.isArchived)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()),
    archived: filteredSessions
      .filter(s => s.isArchived)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle session star
  const toggleStar = async (sessionId: string, isStarred: boolean) => {
    try {
      await ChatSessionRegistry.updateSession(sessionId, { isStarred: !isStarred });
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, isStarred: !isStarred } : s
      ));
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    if (onDeleteSession) {
      onDeleteSession(sessionId);
    } else {
      try {
        await ChatSessionRegistry.deleteSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  // Get session icon
  const getSessionIcon = (session: ChatSession) => {
    switch (session.mode) {
      case ChatMode.GOVERNANCE:
        return '🛡️';
      case ChatMode.MULTI_AGENT:
        return '👥';
      default:
        return '💬';
    }
  };

  // Format session time
  const formatSessionTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Session item component
  const SessionItem = ({ session }: { session: ChatSession }) => (
    <ListItem
      disablePadding
      sx={{
        mb: 0.5,
        borderRadius: 1,
        bgcolor: currentSessionId === session.id ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: currentSessionId === session.id ? 'action.selected' : 'action.hover'
        }
      }}
    >
      <ListItemButton
        onClick={() => onSessionSelect(session)}
        sx={{ borderRadius: 1, py: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <Typography sx={{ fontSize: '1.2rem' }}>
            {getSessionIcon(session)}
          </Typography>
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Typography variant="body2" noWrap fontWeight={currentSessionId === session.id ? 'bold' : 'normal'}>
              {session.title}
            </Typography>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {formatSessionTime(session.lastActivity)}
              </Typography>
              {session.messageCount > 0 && (
                <Chip
                  label={session.messageCount}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              )}
            </Box>
          }
        />

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(session.id, session.isStarred || false);
            }}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            {session.isStarred ? (
              <StarIcon sx={{ fontSize: 16, color: '#FFD700' }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSession(session.id);
            }}
            sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </ListItemButton>
    </ListItem>
  );

  // Section header component
  const SectionHeader = ({ 
    title, 
    icon, 
    count, 
    sectionKey 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    count: number; 
    sectionKey: string; 
  }) => (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => toggleSection(sectionKey)}
        sx={{ py: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
          }
        />
        <Badge badgeContent={count} color="primary" max={99}>
          {expandedSections[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Badge>
      </ListItemButton>
    </ListItem>
  );

  return (
    <Paper
      elevation={1}
      sx={{
        width: compact ? 280 : 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderRight: 1,
        borderColor: 'divider'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Chat Sessions
          </Typography>
          <Tooltip title="New chat">
            <IconButton onClick={onNewSession} color="primary">
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18 }} />
              </InputAdornment>
            )
          }}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Session List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading sessions...
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 1 }}>
            {/* Recent Sessions */}
            <SectionHeader
              title="Recent"
              icon={<HistoryIcon sx={{ fontSize: 18 }} />}
              count={groupedSessions.recent.length}
              sectionKey="recent"
            />
            <Collapse in={expandedSections.recent}>
              <Box sx={{ pl: 1 }}>
                {groupedSessions.recent.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
                    No recent sessions
                  </Typography>
                ) : (
                  groupedSessions.recent.map((session) => (
                    <SessionItem key={session.id} session={session} />
                  ))
                )}
              </Box>
            </Collapse>

            {/* Starred Sessions */}
            {groupedSessions.starred.length > 0 && (
              <>
                <SectionHeader
                  title="Starred"
                  icon={<StarIcon sx={{ fontSize: 18, color: '#FFD700' }} />}
                  count={groupedSessions.starred.length}
                  sectionKey="starred"
                />
                <Collapse in={expandedSections.starred}>
                  <Box sx={{ pl: 1 }}>
                    {groupedSessions.starred.map((session) => (
                      <SessionItem key={session.id} session={session} />
                    ))}
                  </Box>
                </Collapse>
              </>
            )}

            {/* Archived Sessions */}
            {groupedSessions.archived.length > 0 && (
              <>
                <SectionHeader
                  title="Archived"
                  icon={<FolderIcon sx={{ fontSize: 18 }} />}
                  count={groupedSessions.archived.length}
                  sectionKey="archived"
                />
                <Collapse in={expandedSections.archived}>
                  <Box sx={{ pl: 1 }}>
                    {groupedSessions.archived.map((session) => (
                      <SessionItem key={session.id} session={session} />
                    ))}
                  </Box>
                </Collapse>
              </>
            )}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onNewSession}
          size="small"
        >
          New Chat Session
        </Button>
      </Box>
    </Paper>
  );
};

