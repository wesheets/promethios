import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import { 
  Person as PersonIcon,
  Search as SearchIcon,
  FiberManualRecord as OnlineIcon
} from '@mui/icons-material';
import { UserConnection } from '../../services/FirebaseDirectMessageService';
import { connectionService, Connection } from '../../services/ConnectionService';

interface MessageCreationModalProps {
  open: boolean;
  onClose: () => void;
  user?: {
    uid: string;
    displayName?: string;
    email?: string;
  } | null;
  onMessageCreated?: (messageData: {
    id: string;
    participant: {
      id: string;
      name: string;
      avatar?: string;
      isOnline?: boolean;
    };
  }) => void;
}

const MessageCreationModal: React.FC<MessageCreationModalProps> = ({
  open,
  onClose,
  user,
  onMessageCreated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<UserConnection | null>(null);
  const [message, setMessage] = useState('');

  // Load user connections when modal opens and user is available
  useEffect(() => {
    if (open && user?.uid) {
      console.log('💬 [MessageModal] Modal opened with user:', user.uid);
      loadConnections();
    } else if (open && !user?.uid) {
      console.log('💬 [MessageModal] Modal opened but no user available');
    }
  }, [open, user?.uid]);

  const loadConnections = async () => {
    if (!user?.uid) {
      console.log('💬 [MessageModal] No user ID available for loading connections');
      return;
    }

    try {
      setLoadingConnections(true);
      setError(null);
      
      console.log('💬 [MessageModal] Loading connections...');
      console.log('💬 [MessageModal] User object:', user);
      console.log('💬 [MessageModal] User UID:', user.uid);
      
      if (!user.uid) {
        console.log('💬 [MessageModal] User ID not available');
        setConnections([]);
        return;
      }
      
      console.log('💬 [MessageModal] User ID available:', user.uid);
      console.log('💬 [MessageModal] Calling connectionService.getUserConnections with:', user.uid);
      
      const rawConnections = await connectionService.getUserConnections(user.uid);
      console.log('💬 [MessageModal] Found', rawConnections.length, 'raw connections:', rawConnections);
      
      // Transform Connection objects to UserConnection format
      const userConnections: UserConnection[] = rawConnections.map(connection => {
        // Determine which user is the "connected user" (not the current user)
        const isCurrentUserUser1 = connection.userId1 === user.uid;
        const connectedUserId = isCurrentUserUser1 ? connection.userId2 : connection.userId1;
        const connectedUserName = isCurrentUserUser1 ? connection.user2Name : connection.user1Name;
        const connectedUserAvatar = isCurrentUserUser1 ? connection.user2Avatar : connection.user1Avatar;
        
        console.log('💬 [MessageModal] Transforming connection:', {
          connectionId: connection.id,
          isCurrentUserUser1,
          connectedUserId,
          connectedUserName,
          connectedUserAvatar
        });
        
        return {
          id: connection.id,
          userId: user.uid,
          connectedUserId,
          connectedUserName: connectedUserName || 'Unknown User',
          connectedUserAvatar,
          connectedUserTitle: '', // Not available in Connection data
          connectedUserCompany: '', // Not available in Connection data
          status: 'accepted' as const, // Connections are already accepted
          isOnline: false, // TODO: Add online status logic
          createdAt: connection.connectedAt,
          updatedAt: connection.connectedAt
        };
      });
      
      console.log('💬 [MessageModal] Transformed to', userConnections.length, 'user connections:', userConnections);
      setConnections(userConnections);
    } catch (error) {
      console.error('❌ [MessageModal] Error loading connections:', error);
      setError('Failed to load connections');
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedConnection(null);
      setMessage('');
      setError(null);
    }
  }, [open]);

  const handleConnectionSelect = (connection: UserConnection) => {
    console.log('💬 [MessageCreationModal] Connection selected:', connection);
    setSelectedConnection(connection);
  };

  const handleSendMessage = async () => {
    if (!selectedConnection || !message.trim() || !user?.uid) {
      console.log('💬 [MessageCreationModal] Cannot send message - missing data:', {
        hasConnection: !!selectedConnection,
        hasMessage: !!message.trim(),
        hasUser: !!user?.uid
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('💬 [MessageCreationModal] Sending first message:', {
        from: user.uid,
        to: selectedConnection.connectedUserId,
        message: message.trim()
      });

      // Import Firebase service
      const { FirebaseDirectMessageService } = await import('../../services/FirebaseDirectMessageService');
      const firebaseDirectMessageService = FirebaseDirectMessageService.getInstance();

      // Create or get conversation
      const conversationId = await firebaseDirectMessageService.createOrGetConversation(
        user.uid,
        selectedConnection.connectedUserId,
        {
          userName: user.displayName || user.email || 'User',
          userAvatar: undefined, // TODO: Get user avatar
          connectedUserName: selectedConnection.connectedUserName,
          connectedUserAvatar: selectedConnection.connectedUserAvatar
        }
      );

      console.log('💬 [MessageCreationModal] Created/got conversation:', conversationId);

      // Send the first message
      await firebaseDirectMessageService.addMessageToConversation(
        conversationId,
        {
          senderId: user.uid,
          senderName: user.displayName || user.email || 'User',
          content: message.trim(),
          timestamp: new Date(),
          type: 'text'
        }
      );

      console.log('💬 [MessageCreationModal] First message sent successfully');

      // Open the full chat interface
      if (onMessageCreated) {
        onMessageCreated({
          id: conversationId,
          participant: {
            id: selectedConnection.connectedUserId,
            name: selectedConnection.connectedUserName || 'Unknown User',
            avatar: selectedConnection.connectedUserAvatar,
            isOnline: selectedConnection.isOnline
          }
        });
      }

      // Close the modal
      onClose();

    } catch (error) {
      console.error('❌ [MessageCreationModal] Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToConnections = () => {
    setSelectedConnection(null);
    setMessage('');
  };



  // Filter connections based on search
  const filteredConnections = connections.filter(connection =>
    (connection.connectedUserName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (connection.connectedUserCompany || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (connection.connectedUserTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155'
        }
      }}
    >
      <DialogTitle sx={{ color: '#f8fafc', borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: '#10b981' }} />
          Start Conversation
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
          Select a connection to start a conversation
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              bgcolor: '#7f1d1d',
              color: '#fecaca',
              '& .MuiAlert-icon': { color: '#fecaca' }
            }}
          >
            {error}
          </Alert>
        )}

        {!selectedConnection ? (
          <>
            {/* Connection Selection */}
            <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 1 }}>
              Select Connection:
            </Typography>
            
            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: 1,
                  color: '#f8fafc',
                  '& input::placeholder': {
                    color: '#94a3b8',
                    opacity: 1
                  },
                  '&:hover': {
                    border: '1px solid #64748b'
                  },
                  '&.Mui-focused': {
                    border: '1px solid #6366f1'
                  }
                }
              }}
              sx={{ mb: 2 }}
            />

            {loadingConnections ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} sx={{ color: '#10b981' }} />
              </Box>
            ) : filteredConnections.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
                {connections.length === 0 ? 'No connections available' : 'No connections match your search'}
              </Typography>
            ) : (
              <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #334155', borderRadius: 1 }}>
                {filteredConnections.map((connection) => (
                  <ListItem key={connection.id} sx={{ px: 0 }}>
                    <ListItemButton
                      onClick={() => handleConnectionSelect(connection)}
                      sx={{
                        '&:hover': { bgcolor: '#334155' },
                        borderRadius: 1,
                        mx: 1
                      }}
                    >
                      <ListItemAvatar>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            src={connection.connectedUserAvatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            {(connection.connectedUserName || 'U')?.charAt(0)?.toUpperCase() || '?'}
                          </Avatar>
                          {connection.isOnline && (
                            <OnlineIcon
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                color: '#10b981',
                                fontSize: 12,
                                bgcolor: '#1e293b',
                                borderRadius: '50%'
                              }}
                            />
                          )}
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={connection.connectedUserName || 'Connected User'}
                        secondary={
                          <Box>
                            {connection.connectedUserTitle && (
                              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                                {connection.connectedUserTitle}
                              </Typography>
                            )}
                            {connection.connectedUserCompany && (
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                {connection.connectedUserCompany}
                              </Typography>
                            )}
                          </Box>
                        }
                        primaryTypographyProps={{ color: '#f8fafc', fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        ) : (
          <>
            {/* Message Composition */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 1 }}>
                To:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#334155', borderRadius: 1 }}>
                <Avatar
                  src={selectedConnection.connectedUserAvatar}
                  sx={{ width: 24, height: 24, bgcolor: '#6366f1' }}
                >
                  {selectedConnection.connectedUserName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                  {selectedConnection.connectedUserName || 'Unknown User'}
                </Typography>
                <Button
                  size="small"
                  onClick={handleBackToConnections}
                  sx={{ ml: 'auto', color: '#94a3b8', minWidth: 'auto', p: 0.5 }}
                >
                  Change
                </Button>
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 1 }}>
              Message:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              InputProps={{
                sx: {
                  bgcolor: '#334155',
                  border: '1px solid #475569',
                  borderRadius: 1,
                  color: '#f8fafc',
                  '& textarea::placeholder': {
                    color: '#94a3b8',
                    opacity: 1
                  },
                  '&:hover': {
                    border: '1px solid #64748b'
                  },
                  '&.Mui-focused': {
                    border: '1px solid #6366f1'
                  }
                }
              }}
            />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #334155' }}>
        <Button
          onClick={onClose}
          sx={{ color: '#94a3b8' }}
        >
          Cancel
        </Button>
        {selectedConnection && (
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || loading}
            variant="contained"
            sx={{
              bgcolor: '#10b981',
              color: '#ffffff',
              '&:hover': { bgcolor: '#059669' },
              '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#6b7280' }} /> : 'Send Message'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MessageCreationModal;

