import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  TextField,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Close,
  Search,
  Person,
  Business,
  LocationOn,
  Star,
  Message,
  SmartToy,
  Verified,
  Public
} from '@mui/icons-material';
import { ConnectionService } from '../../services/ConnectionService';
import { UserProfileService } from '../../services/UserProfileService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserConnectionsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

interface ConnectionWithProfile {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  connectedAt: Date;
  profile?: any;
}

const UserConnectionsModal: React.FC<UserConnectionsModalProps> = ({
  open,
  onClose,
  userId,
  userName
}) => {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<ConnectionWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const connectionService = ConnectionService.getInstance();
  const profileService = new UserProfileService();

  useEffect(() => {
    if (open && userId) {
      loadConnections();
    }
  }, [open, userId]);

  useEffect(() => {
    // Filter connections based on search term
    if (searchTerm.trim() === '') {
      setFilteredConnections(connections);
    } else {
      const filtered = connections.filter(conn =>
        conn.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.profile?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.profile?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConnections(filtered);
    }
  }, [searchTerm, connections]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get connections from ConnectionService
      const userConnections = await connectionService.getUserConnections(userId);
      
      // Transform connections to get the other user's info
      const connectionsWithProfiles: ConnectionWithProfile[] = [];
      
      for (const connection of userConnections) {
        const otherUserId = connection.userId1 === userId ? connection.userId2 : connection.userId1;
        const otherUserName = connection.userId1 === userId ? connection.user2Name : connection.user1Name;
        const otherUserAvatar = connection.userId1 === userId ? connection.user2Avatar : connection.user1Avatar;
        
        // Try to load full profile for each connection
        let profile = null;
        try {
          profile = await profileService.getUserProfile(otherUserId);
        } catch (error) {
          console.warn(`Failed to load profile for user ${otherUserId}:`, error);
        }
        
        connectionsWithProfiles.push({
          id: connection.id,
          userId: otherUserId,
          userName: otherUserName,
          userAvatar: otherUserAvatar,
          connectedAt: connection.connectedAt,
          profile
        });
      }
      
      // Sort by connection date (most recent first)
      connectionsWithProfiles.sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());
      
      setConnections(connectionsWithProfiles);
    } catch (error) {
      console.error('Failed to load connections:', error);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (connectionUserId: string) => {
    navigate(`/ui/profile/${connectionUserId}`);
    onClose();
  };

  const handleMessage = (connectionUserId: string) => {
    // TODO: Implement messaging functionality
    console.log('Starting message with:', connectionUserId);
  };

  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      return value.name || value.title || value.label || JSON.stringify(value);
    }
    return String(value);
  };

  const getAIAgentColor = (type: string) => {
    const colors = {
      'Claude': '#FF6B35',
      'ChatGPT': '#10A37F',
      'OpenAI': '#10A37F',
      'Gemini': '#4285F4',
      'Assistant': '#6366F1',
      'Custom': '#8B5CF6'
    };
    return colors[type as keyof typeof colors] || '#6366F1';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {userName ? `${userName}'s Connections` : 'Connections'} ({connections.length})
          </Typography>
          <IconButton onClick={onClose} sx={{ p: 1 }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search connections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : filteredConnections.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {searchTerm ? 'No connections found matching your search.' : 'No connections yet.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredConnections.map((connection) => (
              <Grid item xs={12} sm={6} md={4} key={connection.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    '&:hover': { 
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    {/* Profile Header */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          connection.profile?.isOnline ? (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#4CAF50',
                                border: '2px solid white',
                              }}
                            />
                          ) : null
                        }
                      >
                        <Avatar 
                          src={connection.profile?.profilePhoto || connection.profile?.avatar || connection.userAvatar} 
                          sx={{ width: 60, height: 60, mb: 1 }}
                        >
                          {connection.userName?.charAt(0) || '?'}
                        </Avatar>
                      </Badge>
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {safeRender(connection.profile?.name || connection.userName)}
                          </Typography>
                          {(connection.profile?.rating || 0) >= 4.5 && (
                            <Verified sx={{ color: '#1976D2', fontSize: 16 }} />
                          )}
                        </Box>
                        
                        {(connection.profile?.title || connection.profile?.company) && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                            {connection.profile?.title && connection.profile?.company 
                              ? `${safeRender(connection.profile.title)} at ${safeRender(connection.profile.company)}` 
                              : connection.profile?.title 
                                ? safeRender(connection.profile.title) 
                                : connection.profile?.company 
                                  ? `Professional at ${safeRender(connection.profile.company)}` 
                                  : ''}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Stats */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      {connection.profile?.location && (
                        <Tooltip title={connection.profile.location}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              {safeRender(connection.profile.location).length > 10 
                                ? `${safeRender(connection.profile.location).substring(0, 10)}...` 
                                : safeRender(connection.profile.location)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                      {connection.profile?.rating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ fontSize: 14, color: '#FFA726' }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {connection.profile.rating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* AI Collaborators */}
                    {(connection.profile?.aiAgents || []).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                          {(connection.profile.aiAgents || []).slice(0, 2).map((agent: any, index: number) => (
                            <Chip
                              key={agent?.id || index}
                              size="small"
                              icon={<SmartToy />}
                              label={safeRender(agent?.name || agent?.type || 'AI')}
                              sx={{
                                backgroundColor: getAIAgentColor(agent?.type || 'Assistant'),
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                          ))}
                          {(connection.profile.aiAgents || []).length > 2 && (
                            <Chip
                              size="small"
                              label={`+${(connection.profile.aiAgents || []).length - 2}`}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Skills */}
                    {(connection.profile?.skills || []).length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                        {(connection.profile.skills || []).slice(0, 2).map((skill: any, index: number) => (
                          <Chip
                            key={index}
                            size="small"
                            label={safeRender(skill)}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        ))}
                        {(connection.profile.skills || []).length > 2 && (
                          <Chip
                            size="small"
                            label={`+${(connection.profile.skills || []).length - 2}`}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Person />}
                      onClick={() => handleViewProfile(connection.userId)}
                      sx={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Message />}
                      onClick={() => handleMessage(connection.userId)}
                      sx={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      Message
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserConnectionsModal;

