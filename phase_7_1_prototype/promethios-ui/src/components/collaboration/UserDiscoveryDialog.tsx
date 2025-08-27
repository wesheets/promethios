/**
 * UserDiscoveryDialog - Find and invite existing Promethios users
 * Simple user search and discovery system for internal invitations
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  IconButton,
  InputAdornment,
  Checkbox,
  Alert,
  Divider,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  SmartToy as AIIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

export interface PromethiosUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  company?: string;
  industry?: string;
  isOnline: boolean;
  aiAgents: string[];
  collaborationRating: number;
  lastActive: Date;
}

export interface UserDiscoveryDialogProps {
  open: boolean;
  onClose: () => void;
  onInviteUsers: (users: PromethiosUser[]) => Promise<void>;
  conversationName: string;
  currentParticipantIds: string[];
}

export const UserDiscoveryDialog: React.FC<UserDiscoveryDialogProps> = ({
  open,
  onClose,
  onInviteUsers,
  conversationName,
  currentParticipantIds
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PromethiosUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<PromethiosUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Mock user data - in real app, this would come from API
  const mockUsers: PromethiosUser[] = [
    {
      id: 'user1',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      title: 'Product Manager',
      company: 'TechCorp',
      industry: 'Technology',
      isOnline: true,
      aiAgents: ['Claude', 'OpenAI'],
      collaborationRating: 4.8,
      lastActive: new Date()
    },
    {
      id: 'user2',
      name: 'Mike Rodriguez',
      email: 'mike.r@designstudio.com',
      title: 'UX Designer',
      company: 'Design Studio',
      industry: 'Design',
      isOnline: false,
      aiAgents: ['Claude', 'Midjourney'],
      collaborationRating: 4.6,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 'user3',
      name: 'Dr. Emily Watson',
      email: 'e.watson@research.edu',
      title: 'Research Scientist',
      company: 'University Research Lab',
      industry: 'Research',
      isOnline: true,
      aiAgents: ['Claude', 'OpenAI', 'Gemini'],
      collaborationRating: 4.9,
      lastActive: new Date()
    },
    {
      id: 'user4',
      name: 'Alex Kim',
      email: 'alex@startup.io',
      title: 'Founder',
      company: 'AI Startup',
      industry: 'Technology',
      isOnline: true,
      aiAgents: ['OpenAI', 'Anthropic'],
      collaborationRating: 4.7,
      lastActive: new Date()
    }
  ];

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const filtered = mockUsers.filter(user => 
      !currentParticipantIds.includes(user.id) && (
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.title?.toLowerCase().includes(query.toLowerCase()) ||
        user.company?.toLowerCase().includes(query.toLowerCase()) ||
        user.industry?.toLowerCase().includes(query.toLowerCase())
      )
    );
    
    setSearchResults(filtered);
    setIsSearching(false);
  };

  // Handle search input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Toggle user selection
  const toggleUserSelection = (user: PromethiosUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Send invitations
  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsInviting(true);
    try {
      await onInviteUsers(selectedUsers);
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
      onClose();
    } catch (error) {
      console.error('Failed to invite users:', error);
    } finally {
      setIsInviting(false);
    }
  };

  // Format last active time
  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Active now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: '#1e293b', color: 'white', height: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <PersonAddIcon sx={{ color: '#3b82f6' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Find Promethios Users
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Invite existing users to "{conversationName}"
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Search Input */}
        <TextField
          fullWidth
          placeholder="Search by name, email, company, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            )
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0f172a',
              color: 'white',
              '& fieldset': { borderColor: '#475569' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
            }
          }}
        />

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
              Selected ({selectedUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.map((user) => (
                <Chip
                  key={user.id}
                  avatar={<Avatar sx={{ bgcolor: '#3b82f6' }}>{user.name.charAt(0)}</Avatar>}
                  label={user.name}
                  onDelete={() => toggleUserSelection(user)}
                  deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: '#3b82f6',
                    color: 'white',
                    '& .MuiChip-deleteIcon': { color: 'white' }
                  }}
                />
              ))}
            </Box>
            <Divider sx={{ bgcolor: '#334155', mt: 2 }} />
          </Box>
        )}

        {/* Search Results */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isSearching ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#94a3b8' }}>Searching users...</Typography>
            </Box>
          ) : searchQuery && searchResults.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#94a3b8' }}>No users found matching "{searchQuery}"</Typography>
            </Box>
          ) : searchResults.length === 0 && !searchQuery ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 48, color: '#475569', mb: 2 }} />
              <Typography sx={{ color: '#94a3b8' }}>
                Start typing to search for Promethios users
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {searchResults.map((user) => {
                const isSelected = selectedUsers.some(u => u.id === user.id);
                
                return (
                  <ListItem
                    key={user.id}
                    sx={{
                      bgcolor: isSelected ? '#3b82f620' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleUserSelection(user)}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent=""
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: user.isOnline ? '#10b981' : '#6b7280',
                            width: 8,
                            height: 8
                          }
                        }}
                      >
                        <Avatar sx={{ bgcolor: '#3b82f6' }}>
                          {user.avatar || user.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                            {user.name}
                          </Typography>
                          {user.collaborationRating >= 4.5 && (
                            <Chip
                              icon={<CheckIcon sx={{ fontSize: 12 }} />}
                              label={user.collaborationRating.toFixed(1)}
                              size="small"
                              sx={{ bgcolor: '#10b981', color: 'white', height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            {user.title} at {user.company}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              {formatLastActive(user.lastActive)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              •
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {user.aiAgents.slice(0, 2).map((agent) => (
                                <Chip
                                  key={agent}
                                  label={agent}
                                  size="small"
                                  sx={{
                                    bgcolor: '#8b5cf6',
                                    color: 'white',
                                    height: 16,
                                    fontSize: '0.6rem'
                                  }}
                                />
                              ))}
                              {user.aiAgents.length > 2 && (
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                  +{user.aiAgents.length - 2}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleUserSelection(user)}
                        sx={{ color: '#3b82f6' }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {/* Info Alert */}
        {searchResults.length > 0 && (
          <Alert
            severity="info"
            sx={{
              mt: 2,
              bgcolor: '#3b82f620',
              border: '1px solid #3b82f6',
              '& .MuiAlert-icon': { color: '#3b82f6' },
              '& .MuiAlert-message': { color: '#94a3b8' }
            }}
          >
            Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} matching your search
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>
          Cancel
        </Button>
        <Button
          onClick={handleInviteUsers}
          disabled={selectedUsers.length === 0 || isInviting}
          variant="contained"
          startIcon={<PersonAddIcon />}
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
            '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
          }}
        >
          {isInviting ? 'Inviting...' : `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDiscoveryDialog;

