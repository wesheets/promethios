import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { firebaseChannelService, CreateChannelRequest } from '../../services/FirebaseChannelService';
import { firebaseDirectMessageService, UserConnection } from '../../services/FirebaseDirectMessageService';

interface ChannelCreationModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onChannelCreated?: (channelId: string) => void;
}

const ChannelCreationModal: React.FC<ChannelCreationModalProps> = ({
  open,
  onClose,
  organizationId,
  organizationName,
  onChannelCreated
}) => {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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
      setChannelName('');
      setDescription('');
      setIsPrivate(false);
      setSelectedUserIds([]);
      setError(null);
    }
  }, [open]);

  const loadConnections = async () => {
    try {
      setLoadingConnections(true);
      const userConnections = await firebaseDirectMessageService.getUserConnections();
      setConnections(userConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
      setError('Failed to load connections');
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CreateChannelRequest = {
        name: channelName.trim(),
        description: description.trim(),
        organizationId,
        organizationName,
        isPrivate,
        invitedUserIds: selectedUserIds
      };

      const channelId = await firebaseChannelService.createChannel(request);
      
      if (onChannelCreated) {
        onChannelCreated(channelId);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating channel:', error);
      setError(error instanceof Error ? error.message : 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

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
          <AddIcon sx={{ color: '#10b981' }} />
          Create New Channel
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
          in {organizationName}
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

        {/* Channel Name */}
        <TextField
          fullWidth
          label="Channel Name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="e.g., general, engineering, design"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#334155',
              color: '#f8fafc',
              '& fieldset': { borderColor: '#475569' },
              '&:hover fieldset': { borderColor: '#64748b' },
              '&.Mui-focused fieldset': { borderColor: '#10b981' }
            },
            '& .MuiInputLabel-root': { color: '#94a3b8' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' }
          }}
        />

        {/* Description */}
        <TextField
          fullWidth
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this channel about?"
          multiline
          rows={2}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#334155',
              color: '#f8fafc',
              '& fieldset': { borderColor: '#475569' },
              '&:hover fieldset': { borderColor: '#64748b' },
              '&.Mui-focused fieldset': { borderColor: '#10b981' }
            },
            '& .MuiInputLabel-root': { color: '#94a3b8' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' }
          }}
        />

        {/* Private Channel Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' }
              }}
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                Private Channel
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Only invited members can see and join this channel
              </Typography>
            </Box>
          }
          sx={{ mb: 3 }}
        />

        {/* Invite Members */}
        <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 1 }}>
          Invite Members
        </Typography>
        
        {selectedUserIds.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedUserIds.map(userId => {
              const connection = connections.find(c => c.connectedUserId === userId);
              return (
                <Chip
                  key={userId}
                  label={connection?.connectedUserName || 'Unknown User'}
                  onDelete={() => handleUserToggle(userId)}
                  size="small"
                  sx={{
                    bgcolor: '#10b981',
                    color: 'white',
                    '& .MuiChip-deleteIcon': { color: 'white' }
                  }}
                />
              );
            })}
          </Box>
        )}

        {loadingConnections ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: '#10b981' }} />
          </Box>
        ) : connections.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
            No connections available to invite
          </Typography>
        ) : (
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {connections.map((connection) => (
              <ListItem
                key={connection.connectedUserId}
                sx={{
                  px: 0,
                  '&:hover': { bgcolor: '#334155' },
                  borderRadius: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={connection.connectedUserAvatar}
                    sx={{ width: 32, height: 32 }}
                  >
                    {connection.connectedUserName.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={connection.connectedUserName}
                  secondary={connection.connectedUserTitle || connection.connectedUserCompany}
                  primaryTypographyProps={{ color: '#f8fafc', fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ color: '#94a3b8', fontSize: '0.75rem' }}
                />
                <ListItemSecondaryAction>
                  <Checkbox
                    checked={selectedUserIds.includes(connection.connectedUserId)}
                    onChange={() => handleUserToggle(connection.connectedUserId)}
                    sx={{
                      color: '#94a3b8',
                      '&.Mui-checked': { color: '#10b981' }
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
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
          onClick={handleCreateChannel}
          disabled={loading || !channelName.trim()}
          variant="contained"
          sx={{
            bgcolor: '#10b981',
            color: 'white',
            '&:hover': { bgcolor: '#059669' },
            '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            'Create Channel'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChannelCreationModal;

