/**
 * EnhancedChatInterface - Advanced chat interface with team collaboration
 * 
 * Provides seamless switching between:
 * - AI Agent conversations (existing functionality)
 * - Human-to-human team chats
 * - Guest agent sessions
 * - Receipt sharing and collaboration features
 * 
 * Features:
 * - Dropdown chat selector (Agent, Team Members, Team Channels)
 * - Unified message interface for all chat types
 * - Receipt sharing between team members
 * - Guest agent session integration
 * - Real-time collaboration features
 * - Enterprise-grade team management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Receipt as ReceiptIcon,
  SmartToy as SmartToyIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

import { HumanChatService, HumanChat, HumanMessage } from '../../services/HumanChatService';
import { GuestAgentService, GuestSession, GuestMessage } from '../../services/GuestAgentService';
import { OrganizationManagementService, TeamMember } from '../../services/OrganizationManagementService';
import { ChatHistoryService } from '../../services/ChatHistoryService';

interface EnhancedChatInterfaceProps {
  userId: string;
  userName: string;
  currentAgentId?: string;
  currentAgentName?: string;
  onAgentMessage?: (message: string) => void;
  onReceiptShare?: (receiptData: any) => void;
}

type ChatType = 'agent' | 'human' | 'guest_session';

interface ChatOption {
  id: string;
  type: ChatType;
  name: string;
  subtitle?: string;
  avatar?: string;
  icon: React.ReactNode;
  unreadCount?: number;
  status?: 'online' | 'away' | 'busy' | 'offline';
  lastActivity?: Date;
}

interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'receipt' | 'system' | 'action_request' | 'approval_request';
  receiptData?: any;
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  userId,
  userName,
  currentAgentId,
  currentAgentName,
  onAgentMessage,
  onReceiptShare
}) => {
  // Services
  const [humanChatService] = useState(() => HumanChatService.getInstance());
  const [guestService] = useState(() => GuestAgentService.getInstance());
  const [orgService] = useState(() => OrganizationManagementService.getInstance());
  const [chatHistoryService] = useState(() => ChatHistoryService.getInstance());

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Chat selection
  const [chatOptions, setChatOptions] = useState<ChatOption[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatOption | null>(null);
  const [chatSelectorOpen, setChatSelectorOpen] = useState(false);
  const chatSelectorRef = useRef<HTMLDivElement>(null);

  // Messages
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Team data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [humanChats, setHumanChats] = useState<HumanChat[]>([]);
  const [guestSessions, setGuestSessions] = useState<GuestSession[]>([]);

  // UI state
  const [showReceiptShareDialog, setShowReceiptShareDialog] = useState(false);
  const [availableReceipts, setAvailableReceipts] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // =====================================
  // INITIALIZATION
  // =====================================

  useEffect(() => {
    initializeChatInterface();
  }, [userId]);

  useEffect(() => {
    if (selectedChat) {
      loadChatMessages();
    }
  }, [selectedChat]);

  const initializeChatInterface = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load team data
      await loadTeamData();
      
      // Build chat options
      await buildChatOptions();

      // Set default to agent chat if available
      if (currentAgentId && currentAgentName) {
        setSelectedChat({
          id: currentAgentId,
          type: 'agent',
          name: currentAgentName,
          subtitle: 'Your AI Assistant',
          icon: <SmartToyIcon />,
          status: 'online'
        });
      }

    } catch (err) {
      console.error('Error initializing chat interface:', err);
      setError('Failed to initialize chat interface');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async () => {
    try {
      // Get user's organizations and team members
      const userOrgs = await orgService.getUserOrganizations(userId);
      
      if (userOrgs.length > 0) {
        const orgId = userOrgs[0].orgId;
        const members = await orgService.getOrganizationMembers(orgId);
        setTeamMembers(members.filter(m => m.userId !== userId));

        // Load human chats
        const chats = await humanChatService.getUserChats(userId);
        setHumanChats(chats);

        // Load guest sessions
        const sessions = await guestService.getUserGuestSessions(userId);
        setGuestSessions(sessions);
      }

    } catch (err) {
      console.error('Error loading team data:', err);
    }
  };

  const buildChatOptions = async () => {
    const options: ChatOption[] = [];

    // Add AI Agent option
    if (currentAgentId && currentAgentName) {
      options.push({
        id: currentAgentId,
        type: 'agent',
        name: currentAgentName,
        subtitle: 'Your AI Assistant',
        icon: <SmartToyIcon />,
        status: 'online'
      });
    }

    // Add human chats
    for (const chat of humanChats) {
      const unreadCount = 0; // TODO: Calculate actual unread count
      
      options.push({
        id: chat.id,
        type: 'human',
        name: chat.name,
        subtitle: `${chat.participants.length} members`,
        icon: chat.type === 'direct' ? <PersonIcon /> : <GroupIcon />,
        unreadCount,
        lastActivity: chat.lastActivity
      });
    }

    // Add guest sessions
    for (const session of guestSessions) {
      if (session.status === 'active') {
        const isGuest = session.guestUserId === userId;
        const name = isGuest 
          ? `${session.hostUserName}'s Agent`
          : `${session.guestUserName} (Guest)`;

        options.push({
          id: session.id,
          type: 'guest_session',
          name,
          subtitle: session.purpose,
          icon: <SmartToyIcon />,
          status: 'online',
          lastActivity: session.lastActivity
        });
      }
    }

    setChatOptions(options);
  };

  // =====================================
  // MESSAGE MANAGEMENT
  // =====================================

  const loadChatMessages = async () => {
    if (!selectedChat) return;

    try {
      let loadedMessages: MessageData[] = [];

      switch (selectedChat.type) {
        case 'agent':
          // Load agent chat history
          const agentSessions = await chatHistoryService.getChatSessions(userId);
          if (agentSessions.length > 0) {
            const latestSession = agentSessions[0];
            loadedMessages = latestSession.messages.map(msg => ({
              id: msg.id || `msg_${Date.now()}_${Math.random()}`,
              senderId: msg.role === 'user' ? userId : selectedChat.id,
              senderName: msg.role === 'user' ? userName : selectedChat.name,
              content: msg.content,
              timestamp: new Date(msg.timestamp || Date.now()),
              type: 'text'
            }));
          }
          break;

        case 'human':
          // Load human chat messages
          const humanMessages = await humanChatService.getChatMessages(selectedChat.id);
          loadedMessages = humanMessages.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: msg.content,
            timestamp: msg.timestamp,
            type: msg.type as any,
            receiptData: msg.receiptData
          }));
          break;

        case 'guest_session':
          // Load guest session messages
          const guestMessages = await guestService.getSessionMessages(selectedChat.id);
          loadedMessages = guestMessages.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: msg.content,
            timestamp: msg.timestamp,
            type: msg.type as any,
            requiresApproval: msg.requiresApproval,
            approvalStatus: msg.approvalStatus
          }));
          break;
      }

      setMessages(loadedMessages.reverse()); // Show newest at bottom

    } catch (err) {
      console.error('Error loading chat messages:', err);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !messageInput.trim()) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      let newMessage: MessageData;

      switch (selectedChat.type) {
        case 'agent':
          // Send to AI agent
          if (onAgentMessage) {
            onAgentMessage(content);
          }
          
          // Add user message immediately
          newMessage = {
            id: `msg_${Date.now()}_user`,
            senderId: userId,
            senderName: userName,
            content,
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, newMessage]);
          break;

        case 'human':
          // Send human message
          const humanMessage = await humanChatService.sendMessage(
            selectedChat.id,
            userId,
            content
          );
          
          newMessage = {
            id: humanMessage.id,
            senderId: humanMessage.senderId,
            senderName: humanMessage.senderName,
            content: humanMessage.content,
            timestamp: humanMessage.timestamp,
            type: humanMessage.type as any,
            receiptData: humanMessage.receiptData
          };
          setMessages(prev => [...prev, newMessage]);
          break;

        case 'guest_session':
          // Send guest session message
          const guestMessage = await guestService.processGuestAgentInteraction(
            selectedChat.id,
            userId,
            content
          );
          
          newMessage = {
            id: guestMessage.id,
            senderId: guestMessage.senderId,
            senderName: guestMessage.senderName,
            content: guestMessage.content,
            timestamp: guestMessage.timestamp,
            type: guestMessage.type as any,
            requiresApproval: guestMessage.requiresApproval,
            approvalStatus: guestMessage.approvalStatus
          };
          setMessages(prev => [...prev, newMessage]);
          break;
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleShareReceipt = async () => {
    if (!selectedChat || !selectedReceipt || selectedChat.type !== 'human') return;

    try {
      await humanChatService.shareReceipt(
        selectedChat.id,
        userId,
        selectedReceipt.receiptId,
        selectedReceipt.agentId,
        selectedReceipt.agentName,
        selectedReceipt.sessionId,
        selectedReceipt.sessionName,
        selectedReceipt.action,
        selectedReceipt.preview,
        true
      );

      setShowReceiptShareDialog(false);
      setSelectedReceipt(null);
      
      // Reload messages to show the shared receipt
      await loadChatMessages();

    } catch (err) {
      console.error('Error sharing receipt:', err);
      setError('Failed to share receipt');
    }
  };

  // =====================================
  // UI EVENT HANDLERS
  // =====================================

  const handleChatSelection = (option: ChatOption) => {
    setSelectedChat(option);
    setChatSelectorOpen(false);
  };

  const handleReceiptShareClick = async () => {
    try {
      // Load available receipts from chat history
      const sessions = await chatHistoryService.getChatSessions(userId);
      const receipts: any[] = [];

      for (const session of sessions) {
        if (session.cryptographicReceipt) {
          receipts.push({
            receiptId: session.cryptographicReceipt.receiptId,
            agentId: currentAgentId,
            agentName: currentAgentName,
            sessionId: session.id,
            sessionName: session.name,
            action: 'Chat Session',
            preview: `${session.messages.length} messages`,
            timestamp: new Date(session.createdAt)
          });
        }
      }

      setAvailableReceipts(receipts);
      setShowReceiptShareDialog(true);

    } catch (err) {
      console.error('Error loading receipts:', err);
      setError('Failed to load receipts');
    }
  };

  // =====================================
  // RENDER METHODS
  // =====================================

  const renderChatSelector = () => (
    <Box sx={{ position: 'relative' }}>
      <Button
        ref={chatSelectorRef}
        onClick={() => setChatSelectorOpen(!chatSelectorOpen)}
        endIcon={<ExpandMoreIcon />}
        sx={{
          justifyContent: 'space-between',
          width: '100%',
          textAlign: 'left',
          textTransform: 'none',
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedChat ? (
            <>
              <Avatar sx={{ width: 32, height: 32 }}>
                {selectedChat.icon}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">
                  {selectedChat.name}
                </Typography>
                {selectedChat.subtitle && (
                  <Typography variant="caption" color="text.secondary">
                    {selectedChat.subtitle}
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a chat...
            </Typography>
          )}
        </Box>
      </Button>

      <Menu
        open={chatSelectorOpen}
        onClose={() => setChatSelectorOpen(false)}
        anchorEl={chatSelectorRef.current}
        PaperProps={{
          sx: { width: chatSelectorRef.current?.offsetWidth, maxHeight: 400 }
        }}
      >
        {chatOptions.length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary">No chats available</Typography>
          </MenuItem>
        ) : (
          chatOptions.map((option) => (
            <MenuItem
              key={`${option.type}_${option.id}`}
              onClick={() => handleChatSelection(option)}
              selected={selectedChat?.id === option.id && selectedChat?.type === option.type}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={option.unreadCount}
                  color="primary"
                  invisible={!option.unreadCount}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {option.icon}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={option.name}
                secondary={option.subtitle}
              />
              {option.status && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 
                      option.status === 'online' ? 'success.main' :
                      option.status === 'away' ? 'warning.main' :
                      option.status === 'busy' ? 'error.main' : 'grey.400'
                  }}
                />
              )}
            </MenuItem>
          ))
        )}
        
        <Divider />
        <MenuItem onClick={() => {/* TODO: Open team panel */}}>
          <ListItemAvatar>
            <Avatar sx={{ width: 32, height: 32 }}>
              <AddIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Manage Team" secondary="Add members, create chats" />
        </MenuItem>
      </Menu>
    </Box>
  );

  const renderMessages = () => {
    if (!selectedChat) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 300,
          color: 'text.secondary'
        }}>
          <ChatIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Welcome to Enhanced Chat
          </Typography>
          <Typography variant="body2" textAlign="center">
            Select a chat from the dropdown above to start messaging with your AI agent,
            team members, or guest agents.
          </Typography>
        </Box>
      );
    }

    return (
      <Paper sx={{ height: 400, overflow: 'auto', p: 1 }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary'
          }}>
            <Typography variant="body2">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: 'flex',
                flexDirection: message.senderId === userId ? 'row-reverse' : 'row',
                gap: 1
              }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {message.senderId === userId ? (
                  userName.charAt(0).toUpperCase()
                ) : selectedChat.type === 'agent' ? (
                  <SmartToyIcon />
                ) : (
                  message.senderName.charAt(0).toUpperCase()
                )}
              </Avatar>
              
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: message.senderId === userId ? 'primary.light' : 'grey.100',
                  color: message.senderId === userId ? 'primary.contrastText' : 'text.primary'
                }}
              >
                <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                  {message.senderName} • {message.timestamp.toLocaleTimeString()}
                </Typography>
                
                <Typography variant="body2">
                  {message.content}
                </Typography>

                {message.type === 'receipt' && (
                  <Chip
                    icon={<ReceiptIcon />}
                    label="Receipt Shared"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}

                {message.requiresApproval && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      icon={
                        message.approvalStatus === 'approved' ? <CheckCircleIcon /> :
                        message.approvalStatus === 'rejected' ? <ErrorIcon /> :
                        <WarningIcon />
                      }
                      label={
                        message.approvalStatus === 'approved' ? 'Approved' :
                        message.approvalStatus === 'rejected' ? 'Rejected' :
                        'Pending Approval'
                      }
                      size="small"
                      color={
                        message.approvalStatus === 'approved' ? 'success' :
                        message.approvalStatus === 'rejected' ? 'error' :
                        'warning'
                      }
                    />
                  </Box>
                )}
              </Box>
            </Box>
          ))
        )}

        {typingUsers.length > 0 && (
          <Box sx={{ p: 1, color: 'text.secondary' }}>
            <Typography variant="caption">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderMessageInput = () => (
    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder={
          selectedChat?.type === 'agent' ? 'Message your AI agent...' :
          selectedChat?.type === 'human' ? 'Message your team...' :
          selectedChat?.type === 'guest_session' ? 'Message guest agent...' :
          'Select a chat to start messaging...'
        }
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
        disabled={!selectedChat}
        multiline
        maxRows={3}
      />
      
      <IconButton 
        onClick={handleSendMessage}
        disabled={!selectedChat || !messageInput.trim()}
        color="primary"
      >
        <SendIcon />
      </IconButton>

      {selectedChat?.type === 'human' && (
        <Tooltip title="Share Receipt">
          <IconButton onClick={handleReceiptShareClick}>
            <ReceiptIcon />
          </IconButton>
        </Tooltip>
      )}

      <IconButton disabled>
        <AttachFileIcon />
      </IconButton>
    </Box>
  );

  const renderReceiptShareDialog = () => (
    <Dialog 
      open={showReceiptShareDialog} 
      onClose={() => setShowReceiptShareDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Share Receipt</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a receipt to share with your team
        </Typography>

        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {availableReceipts.map((receipt) => (
            <ListItemButton
              key={receipt.receiptId}
              selected={selectedReceipt?.receiptId === receipt.receiptId}
              onClick={() => setSelectedReceipt(receipt)}
            >
              <ListItemAvatar>
                <Avatar>
                  <ReceiptIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={receipt.action}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {receipt.sessionName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {receipt.timestamp.toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          ))}
        </List>

        {availableReceipts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              No receipts available to share
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowReceiptShareDialog(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleShareReceipt}
          disabled={!selectedReceipt}
          variant="contained"
        >
          Share Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );

  // =====================================
  // MAIN RENDER
  // =====================================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Chat Selector */}
      {renderChatSelector()}

      {/* Messages */}
      <Box sx={{ flexGrow: 1, mt: 2 }}>
        {renderMessages()}
      </Box>

      {/* Message Input */}
      {renderMessageInput()}

      {/* Dialogs */}
      {renderReceiptShareDialog()}
    </Box>
  );
};

export default EnhancedChatInterface;

