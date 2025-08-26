/**
 * TeamPanel - Human-to-human collaboration interface
 * 
 * Provides team messaging, member management, and collaboration features
 * for the right panel of the Agent Command Center.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  Search,
  Send,
  Group,
  Circle,
  Add,
  Settings,
  Notifications,
  Star,
  StarBorder,
  SmartToy,
  Launch
} from '@mui/icons-material';
import HumanChatService, { TeamMember, TeamConversation, HumanMessage } from '../../services/HumanChatService';
import { TeamCollaborationIntegrationService, TeamCollaborationState, CollaborationNotification } from '../../services/TeamCollaborationIntegrationService';
import { OrganizationManagementService } from '../../services/OrganizationManagementService';
import { ChatbotStorageService, ChatbotProfile } from '../../services/ChatbotStorageService';
import { useAuth } from '../../context/AuthContext';

interface TeamPanelProps {
  currentUserId?: string;
  onChatReference?: (reference: string) => void;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ 
  onChatReference
}) => {
  // Get real user from auth context
  const { currentUser: user, loading: authLoading } = useAuth();
  const currentUserId = user?.uid || 'anonymous';
  // Enhanced service instances
  const [humanChatService] = useState(() => HumanChatService.getInstance());
  const [collaborationService] = useState(() => TeamCollaborationIntegrationService.getInstance());
  const [orgService] = useState(() => OrganizationManagementService.getInstance());
  
  // Enhanced state management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [conversations, setConversations] = useState<TeamConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<TeamConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // New enhanced state
  const [collaborationState, setCollaborationState] = useState<TeamCollaborationState | null>(null);
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // AI Teammates state
  const [aiTeammates, setAiTeammates] = useState<ChatbotProfile[]>([]);
  const [favoriteAgents, setFavoriteAgents] = useState<Set<string>>(new Set());
  const [agentsLoading, setAgentsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeTeamPanel = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          console.log('🔍 [Team] Auth still loading, waiting...');
          return;
        }
        
        console.log('🔍 [Team] Initializing team panel for user:', user?.uid);
        
        // Initialize all services
        humanChatService.initialize(currentUserId);
        
        // Use the correct method for collaboration service
        const userName = user?.displayName || user?.email || `User ${currentUserId}`;
        const state = await collaborationService.initializeUserCollaboration(currentUserId, userName);
        setCollaborationState(state);
        
        // OrganizationManagementService doesn't need initialization
        
        // Load initial data
        loadTeamData();
        loadOrganizationData();
        loadAiTeammates();
        loadFavoriteAgents();
        
        // Set user as online
        humanChatService.updateUserStatus('online');

        // Set up real-time listeners
        setupRealtimeListeners();
      } catch (error) {
        console.error('❌ [Team] Failed to initialize team collaboration:', error);
      }
    };

    initializeTeamPanel();

    // Cleanup on unmount
    return () => {
      humanChatService.updateUserStatus('offline');
      cleanupListeners();
    };
  }, [user?.uid, authLoading]); // Depend on user and authLoading like the working page

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [activeConversation?.messages]);

  const loadTeamData = () => {
    setTeamMembers(humanChatService.getTeamMembers());
    setConversations(humanChatService.getUserConversations());
  };

  // New enhanced data loading functions
  const loadOrganizationData = async () => {
    try {
      const orgs = await orgService.getUserOrganizations(currentUserId);
      setOrganizations(orgs);
      
      // Set active organization if user has one
      if (orgs.length > 0 && !activeOrgId) {
        setActiveOrgId(orgs[0].id);
      }
    } catch (error) {
      console.error('Failed to load organization data:', error);
    }
  };

  const loadCollaborationState = async () => {
    try {
      const state = await collaborationService.getCollaborationState();
      setCollaborationState(state);
      setUnreadCount(state.unreadMessages);
      
      // Load notifications
      const notifs = await collaborationService.getNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load collaboration state:', error);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for new messages
    collaborationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Listen for team updates
    collaborationService.onTeamUpdate(() => {
      loadTeamData();
      loadOrganizationData();
    });
  };

  const cleanupListeners = () => {
    collaborationService.removeAllListeners();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartConversation = async (memberId: string) => {
    try {
      const conversation = await humanChatService.startConversation(memberId);
      setActiveConversation(conversation);
      loadTeamData(); // Refresh conversations list
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    try {
      await humanChatService.sendMessage(activeConversation.id, messageInput.trim());
      setMessageInput('');
      
      // Refresh conversation data
      const updatedConversation = humanChatService.getConversation(activeConversation.id);
      if (updatedConversation) {
        setActiveConversation(updatedConversation);
      }
      loadTeamData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  // AI Teammates functions
  const loadAiTeammates = async () => {
    console.log('🔍 [AI Teammates] loadAiTeammates called, currentUserId:', currentUserId);
    console.log('🔍 [AI Teammates] authLoading:', authLoading);
    
    // Circuit breaker: prevent multiple simultaneous calls
    if (agentsLoading) {
      console.log('🔄 [AI Teammates] Already loading agents, skipping duplicate call');
      return;
    }
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('🔍 [AI Teammates] Auth still loading, waiting...');
      return;
    }
    
    if (!user?.uid) {
      console.log('🔍 [AI Teammates] No user UID after auth loaded, setting mock data');
      // Set mock data for demo purposes
      const mockAgents: ChatbotProfile[] = [
        {
          id: 'agent-001',
          identity: {
            id: 'agent-001',
            name: 'Claude Assistant',
            role: 'General Assistant',
            description: 'Helpful AI assistant for various tasks',
            avatar: '/avatars/claude.jpg',
            personality: 'helpful',
            expertise: ['General', 'Analysis', 'Writing']
          },
          configuration: {
            selectedModel: 'claude-3-sonnet',
            temperature: 0.7,
            maxTokens: 4096,
            systemPrompt: 'You are a helpful assistant...'
          },
          status: 'active',
          createdAt: new Date('2024-01-15'),
          lastActive: new Date(),
          health: { overall: 95, trust: 92, performance: 98, governance: 94 }
        }
      ];
      setAiTeammates(mockAgents);
      return;
    }

    try {
      setAgentsLoading(true);
      console.log('🔍 [AI Teammates] Calling chatbotService.getChatbots with user:', user.uid);
      
      const chatbotService = ChatbotStorageService.getInstance();
      const agents = await chatbotService.getChatbots(user.uid);
      
      console.log('🔍 [AI Teammates] getChatbots returned:', agents.length, 'agents');
      console.log('🔍 [AI Teammates] Agent data:', agents);
      
      setAiTeammates(agents);
      console.log('✅ [AI Teammates] Successfully loaded', agents.length, 'AI teammates');
    } catch (error) {
      console.error('❌ [AI Teammates] Failed to load:', error);
      // Set empty array on error
      setAiTeammates([]);
    } finally {
      setAgentsLoading(false);
    }
  };

  const loadFavoriteAgents = () => {
    try {
      const saved = localStorage.getItem(`favoriteAgents_${currentUserId}`);
      if (saved) {
        setFavoriteAgents(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('❌ [AI Teammates] Failed to load favorites:', error);
    }
  };

  const toggleFavoriteAgent = (agentId: string) => {
    const newFavorites = new Set(favoriteAgents);
    if (newFavorites.has(agentId)) {
      newFavorites.delete(agentId);
    } else {
      newFavorites.add(agentId);
    }
    setFavoriteAgents(newFavorites);
    localStorage.setItem(`favoriteAgents_${currentUserId}`, JSON.stringify([...newFavorites]));
  };

  const handleAgentCommandCenter = (agentId: string) => {
    // Navigate to agent's command center
    window.open(`/chat/chatbots/agent-chatbot-${agentId}?panel=team`, '_blank');
  };

  const getAgentStatus = (agent: ChatbotProfile) => {
    // Determine agent status based on health and activity
    if (agent.health?.overall >= 90) return 'online';
    if (agent.health?.overall >= 70) return 'away';
    return 'offline';
  };

  const getAgentStatusColor = (agent: ChatbotProfile) => {
    const status = getAgentStatus(agent);
    return getStatusColor(status);
  };

  if (activeConversation) {
    // Chat view
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              size="small"
              onClick={() => setActiveConversation(null)}
              sx={{ color: '#64748b', minWidth: 'auto', p: 0.5 }}
            >
              ← Back
            </Button>
            <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
              {activeConversation.name}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: '#64748b' }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {activeConversation.messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '70%',
                  bgcolor: message.senderId === currentUserId ? '#3b82f6' : '#374151',
                  color: 'white',
                  borderRadius: 2,
                  borderBottomRightRadius: message.senderId === currentUserId ? 0.5 : 2,
                  borderBottomLeftRadius: message.senderId === currentUserId ? 2 : 0.5,
                }}
              >
                {message.senderId !== currentUserId && (
                  <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5 }}>
                    {message.senderName}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5, textAlign: 'right' }}>
                  {formatMessageTime(message.timestamp)}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message input */}
        <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: '#374151',
                '& fieldset': { borderColor: '#4b5563' },
                '&:hover fieldset': { borderColor: '#6b7280' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#9ca3af',
                opacity: 1,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    sx={{ color: messageInput.trim() ? '#3b82f6' : '#6b7280' }}
                  >
                    <Send />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Options menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <Share sx={{ mr: 1 }} /> Share Chat
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <AttachFile sx={{ mr: 1 }} /> Attach File
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  // Team overview
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
          Team Collaboration
        </Typography>
        
        <TextField
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search team members..."
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              bgcolor: '#374151',
              '& fieldset': { borderColor: '#4b5563' },
              '&:hover fieldset': { borderColor: '#6b7280' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#9ca3af',
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Online members */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 'bold' }}>
          Online Now ({humanChatService.getOnlineMembers().length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {humanChatService.getOnlineMembers().slice(0, 6).map((member) => (
            <Tooltip key={member.id} title={member.name}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Circle sx={{ 
                    color: getStatusColor(member.status), 
                    fontSize: 12,
                    border: '2px solid #1e293b',
                    borderRadius: '50%'
                  }} />
                }
              >
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: '#3b82f6',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#2563eb' }
                  }}
                  onClick={() => handleStartConversation(member.id)}
                >
                  {member.name.charAt(0)}
                </Avatar>
              </Badge>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Recent conversations */}
      {conversations.length > 0 && (
        <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 'bold' }}>
            Recent Conversations
          </Typography>
          
          <List sx={{ p: 0 }}>
            {conversations.slice(0, 3).map((conversation) => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              return (
                <ListItem
                  key={conversation.id}
                  button
                  onClick={() => setActiveConversation(conversation)}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': { bgcolor: '#374151' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#6366f1', width: 32, height: 32 }}>
                      <Group />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {conversation.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        {lastMessage ? lastMessage.content.substring(0, 30) + '...' : 'No messages'}
                      </Typography>
                    }
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {formatMessageTime(conversation.lastActivity)}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}

      {/* Team members list */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, borderTop: '1px solid #334155' }}>
        <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 'bold' }}>
          Team Members ({filteredMembers.length})
        </Typography>
        
        <List sx={{ p: 0 }}>
          {filteredMembers.map((member) => (
            <ListItem
              key={member.id}
              button
              onClick={() => handleStartConversation(member.id)}
              sx={{
                p: 1,
                borderRadius: 1,
                mb: 0.5,
                '&:hover': { bgcolor: '#374151' }
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Circle sx={{ 
                      color: getStatusColor(member.status), 
                      fontSize: 10,
                      border: '2px solid #1e293b',
                      borderRadius: '50%'
                    }} />
                  }
                >
                  <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                    {member.name.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {member.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getStatusText(member.status)}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(member.status),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 16
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {member.role}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* AI Teammates section */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, borderTop: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: '#9ca3af', fontWeight: 'bold' }}>
            <SmartToy sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            AI Teammates ({aiTeammates.length})
          </Typography>
          {agentsLoading && (
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Loading...
            </Typography>
          )}
        </Box>
        
        <List sx={{ p: 0 }}>
          {aiTeammates.map((agent) => (
            <ListItem
              key={agent.id}
              sx={{
                p: 1,
                borderRadius: 1,
                mb: 0.5,
                '&:hover': { bgcolor: '#374151' }
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Circle sx={{ 
                      color: getAgentStatusColor(agent), 
                      fontSize: 10,
                      border: '2px solid #1e293b',
                      borderRadius: '50%'
                    }} />
                  }
                >
                  <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
                    <SmartToy sx={{ fontSize: 18 }} />
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      {agent.name}
                    </Typography>
                    {favoriteAgents.has(agent.id) && (
                      <Star sx={{ fontSize: 14, color: '#fbbf24' }} />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={agent.model || 'AI Agent'}
                      size="small"
                      sx={{
                        bgcolor: getAgentStatusColor(agent),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 16
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {agent.health?.overall || 0}% health
                    </Typography>
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Tooltip title={favoriteAgents.has(agent.id) ? 'Remove from favorites' : 'Add to favorites'}>
                  <IconButton
                    size="small"
                    onClick={() => toggleFavoriteAgent(agent.id)}
                    sx={{ color: favoriteAgents.has(agent.id) ? '#fbbf24' : '#6b7280' }}
                  >
                    {favoriteAgents.has(agent.id) ? <Star sx={{ fontSize: 16 }} /> : <StarBorder sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open Command Center">
                  <IconButton
                    size="small"
                    onClick={() => handleAgentCommandCenter(agent.id)}
                    sx={{ color: '#6b7280', '&:hover': { color: '#3b82f6' } }}
                  >
                    <Launch sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default TeamPanel;

