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
  Chip,
  InputAdornment
} from '@mui/material';
import { 
  Send as SendIcon, 
  Person as PersonIcon,
  Search as SearchIcon,
  FiberManualRecord as OnlineIcon
} from '@mui/icons-material';
import { firebaseDirectMessageService, UserConnection, CreateDirectMessageRequest } from '../../services/FirebaseDirectMessageService';
import { useAuth } from '../../context/AuthContext';

interface MessageCreationModalProps {
  open: boolean;
  onClose: () => void;
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
  onMessageCreated
}) => {
  const { user } = useAuth();
  const [selectedConnection, setSelectedConnection] = useState<UserConnection | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user connections when modal opens
  useEffect(() => {
    if (open) {
      loadConnections();
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedConnection(null);
      setMessage('');
      setSearchQuery('');
      setError(null);
    }
  }, [open]);

  const loadConnections = async () => {
    try {
      setLoadingConnections(true);
      console.log('💬 [MessageModal] Loading connections...');
      
      if (!user?.uid) {
        console.log('💬 [MessageModal] No user ID available');
        setConnections([]);
        return;
      }
      
      // Use FirebaseDirectMessageService directly
      const userConnections = await firebaseDirectMessageService.getUserConnections();
      console.log('💬 [MessageModal] Found', userConnections.length, 'user connections');
      
      setConnections(userConnections);
    } catch (error) {
      console.error('❌ [MessageModal] Error loading connections:', error);
      setError('Failed to load connections');
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleConnectionSelect = (connection: UserConnection) => {
    setSelectedConnection(connection);
  };

  const handleSendMessage = async () => {
    if (!selectedConnection || !message.trim()) {
      setError('Please select a connection and enter a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CreateDirectMessageRequest = {
        recipientId: selectedConnection.connectedUserId,
        initialMessage: message.trim()
      };

      const conversationId = await firebaseDirectMessageService.createDirectMessage(request);
      
      if (onMessageCreated) {
        onMessageCreated({
          id: conversationId,
          participant: {
            id: selectedConnection.connectedUserId,
            name: selectedConnection.connectedUserName,
            avatar: selectedConnection.connectedUserAvatar,
            isOnline: selectedConnection.isOnline
          }
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
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
          <SendIcon sx={{ color: '#10b981' }} />
          New Message
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
          Send a direct message to one of your connections
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

        {/* Selected Connection */}
        {selectedConnection && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 1 }}>
              To:
            </Typography>
            <Chip
              avatar={
                <Avatar 
                  src={selectedConnection.connectedUserAvatar}
                  sx={{ width: 24, height: 24 }}
                >
                  {selectedConnection.connectedUserName.charAt(0).toUpperCase()}
                </Avatar>
              }
              label={selectedConnection.connectedUserName}
              onDelete={() => setSelectedConnection(null)}
              sx={{
                bgcolor: '#10b981',
                color: 'white',
                '& .MuiChip-deleteIcon': { color: 'white' }
              }}
            />
          </Box>
        )}

        {/* Connection Selection */}
        {!selectedConnection && (
          <>
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
                            {(connection.connectedUserName || 'U').charAt(0).toUpperCase()}
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
        )}

        {/* Message Input */}
        {selectedConnection && (
          <>
            <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 1, mt: 2 }}>
              Message:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#334155',
                  color: '#f8fafc',
                  '& fieldset': { borderColor: '#475569' },
                  '&:hover fieldset': { borderColor: '#64748b' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' }
                },
                '& textarea::placeholder': {
                  color: '#94a3b8',
                  opacity: 1
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
        <Button
          onClick={handleSendMessage}
          disabled={loading || !selectedConnection || !message.trim()}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
          sx={{
            bgcolor: '#10b981',
            color: 'white',
            '&:hover': { bgcolor: '#059669' },
            '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
          }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageCreationModal;

