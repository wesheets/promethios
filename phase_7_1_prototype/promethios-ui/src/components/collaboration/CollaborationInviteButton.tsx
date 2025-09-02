import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { PersonAdd, Send } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { unifiedNotificationService } from '../../services/UnifiedNotificationService';
import { userSearchService, SearchableUser } from '../../services/UserSearchService';

interface CollaborationInviteButtonProps {
  conversationId: string;
  conversationName: string;
  agentName: string;
  onInviteSent?: (invitedUsers: SearchableUser[]) => void;
  disabled?: boolean;
}

const CollaborationInviteButton: React.FC<CollaborationInviteButtonProps> = ({
  conversationId,
  conversationName,
  agentName,
  onInviteSent,
  disabled = false
}) => {
  const { currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock user search function - in real app, this would search actual users
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock users for demonstration
      const mockUsers: User[] = [
        {
          uid: 'user1',
          displayName: 'Alice Johnson',
          email: 'alice.johnson@company.com',
          photoURL: undefined
        },
        {
          uid: 'user2',
          displayName: 'Bob Smith',
          email: 'bob.smith@company.com',
          photoURL: undefined
        },
        {
          uid: 'user3',
          displayName: 'Carol Davis',
          email: 'carol.davis@company.com',
          photoURL: undefined
        }
      ];
      
      // Filter based on query
      return mockUsers.filter(user => 
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const users = await searchUsers(query);
      setAvailableUsers(users);
    } else {
      setAvailableUsers([]);
    }
  };

  const handleSendInvitations = async () => {
    if (!currentUser || selectedUsers.length === 0) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const invitationPromises = selectedUsers.map(user =>
        unifiedNotificationService.sendCollaborationInvitation(
          currentUser.uid,
          user.uid,
          conversationId,
          conversationName,
          agentName,
          message || `Join me in this AI collaboration session: "${conversationName}" with ${agentName}`
        )
      );

      const results = await Promise.all(invitationPromises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        setSuccess(`Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}`);
        onInviteSent?.(selectedUsers);
      }

      if (failureCount > 0) {
        setError(`Failed to send ${failureCount} invitation${failureCount > 1 ? 's' : ''}`);
      }

      // Reset form if all successful
      if (failureCount === 0) {
        setSelectedUsers([]);
        setMessage('');
        setTimeout(() => {
          setIsDialogOpen(false);
          setSuccess(null);
        }, 2000);
      }

    } catch (error) {
      console.error('Error sending invitations:', error);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDialogClose = () => {
    if (!isSending) {
      setIsDialogOpen(false);
      setSelectedUsers([]);
      setMessage('');
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<PersonAdd />}
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || !currentUser}
        size="small"
        sx={{
          borderColor: '#3b82f6',
          color: '#3b82f6',
          '&:hover': {
            borderColor: '#2563eb',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }
        }}
      >
        Invite to Collaborate
      </Button>

      <Dialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Invite Users to Collaboration
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
              Session: <strong>{conversationName}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              AI Assistant: <strong>{agentName}</strong>
            </Typography>
          </Box>

          <Autocomplete
            multiple
            options={availableUsers}
            value={selectedUsers}
            onChange={(_, newValue) => setSelectedUsers(newValue)}
            inputValue={searchQuery}
            onInputChange={(_, newInputValue) => handleSearchChange(newInputValue)}
            getOptionLabel={(option) => option.displayName}
            isOptionEqualToValue={(option, value) => option.uid === value.uid}
            loading={isSearching}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users by name or email"
                placeholder="Type to search..."
                variant="outlined"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0f172a',
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ color: 'white', backgroundColor: '#1e293b' }}>
                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                  {option.displayName[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2">{option.displayName}</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.uid}
                  label={option.displayName}
                  avatar={<Avatar>{option.displayName[0]}</Avatar>}
                  sx={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    '& .MuiChip-deleteIcon': { color: 'white' }
                  }}
                />
              ))
            }
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Personal message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to your invitation..."
            variant="outlined"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f172a',
                color: 'white',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
              },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2, backgroundColor: '#7f1d1d', color: 'white' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, backgroundColor: '#14532d', color: 'white' }}>
              {success}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleDialogClose}
            disabled={isSending}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendInvitations}
            disabled={selectedUsers.length === 0 || isSending}
            variant="contained"
            startIcon={isSending ? <CircularProgress size={16} /> : <Send />}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              '&:disabled': { backgroundColor: '#374151' }
            }}
          >
            {isSending ? 'Sending...' : `Send Invitation${selectedUsers.length > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CollaborationInviteButton;

