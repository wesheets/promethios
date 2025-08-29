import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  Grid,
  Rating,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  LocationOn,
  Business,
  Email,
  LinkedIn,
  Twitter,
  GitHub,
  Star,
  PersonAdd,
  Message,
  MoreVert,
  SmartToy,
  Psychology,
  AutoAwesome,
  Verified,
  Public,
  Lock,
  People,
} from '@mui/icons-material';

interface AIAgent {
  id: string;
  name: string;
  type: 'Claude' | 'OpenAI' | 'Gemini' | 'Custom';
  specialization: string[];
  color: string;
}

interface UserProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  
  // Professional Info
  experience: string;
  education: string;
  skills: string[];
  
  // AI Specialization
  aiAgents: AIAgent[];
  aiSkills: string[];
  collaborationStyle: 'Analytical' | 'Creative' | 'Technical' | 'Strategic' | 'Collaborative';
  
  // Social Info
  connectionCount: number;
  collaborationRating: number;
  totalCollaborations: number;
  isOnline: boolean;
  lastActive: string;
  
  // Privacy
  profileVisibility: 'public' | 'connections' | 'private';
  allowDiscovery: boolean;
  
  // Contact
  email?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  
  // Status
  isConnected: boolean;
  connectionStatus: 'none' | 'pending' | 'connected' | 'blocked';
  mutualConnections: number;
}

interface UserProfileCardProps {
  profile: UserProfile;
  variant?: 'full' | 'compact' | 'minimal';
  showActions?: boolean;
  onConnect?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onStartCollaboration?: (userId: string) => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  variant = 'full',
  showActions = true,
  onConnect,
  onMessage,
  onViewProfile,
  onStartCollaboration,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Early return if profile is null/undefined
  if (!profile) {
    return null;
  }

  const getAIAgentColor = (type: string) => {
    switch (type) {
      case 'Claude': return '#FF6B35';
      case 'OpenAI': return '#00A67E';
      case 'Gemini': return '#4285F4';
      default: return '#9C27B0';
    }
  };

  const getVisibilityIcon = () => {
    switch (profile.profileVisibility) {
      case 'public': return <Public fontSize="small" />;
      case 'connections': return <People fontSize="small" />;
      case 'private': return <Lock fontSize="small" />;
    }
  };

  const getConnectionButtonText = () => {
    switch (profile.connectionStatus) {
      case 'none': return 'Connect';
      case 'pending': return 'Pending';
      case 'connected': return 'Connected';
      case 'blocked': return 'Blocked';
      default: return 'Connect';
    }
  };

  const getConnectionButtonColor = () => {
    switch (profile.connectionStatus) {
      case 'connected': return 'success';
      case 'pending': return 'warning';
      case 'blocked': return 'error';
      default: return 'primary';
    }
  };

  if (variant === 'minimal') {
    return (
      <Card sx={{ mb: 1, cursor: 'pointer' }} onClick={() => onViewProfile?.(profile.id)}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: profile?.isOnline ? '#4CAF50' : '#FFA726',
                    border: '2px solid white',
                  }}
                />
              }
            >
              <Avatar src={profile.avatar} sx={{ width: 40, height: 40 }}>
                {profile.name.charAt(0)}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {profile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {profile.title} at {profile.company}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {profile.aiAgents.slice(0, 3).map((agent) => (
                <Tooltip key={agent.id} title={`${agent.name} - ${agent.specialization.join(', ')}`}>
                  <Chip
                    size="small"
                    label={agent.type}
                    sx={{
                      backgroundColor: getAIAgentColor(agent.type),
                      color: 'white',
                      fontSize: '0.7rem',
                      height: 20,
                    }}
                  />
                </Tooltip>
              ))}
              {profile.aiAgents.length > 3 && (
                <Chip
                  size="small"
                  label={`+${profile.aiAgents.length - 3}`}
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card sx={{ 
        mb: 2, 
        height: '100%',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3,
          borderColor: 'primary.main'
        }
      }} onClick={() => onViewProfile?.(profile.id)}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: profile?.isOnline ? '#4CAF50' : '#FFA726',
                    border: '2px solid white',
                  }}
                />
              }
            >
              <Avatar src={profile.avatar} sx={{ width: 60, height: 60 }}>
                {profile.name?.charAt(0) || '?'}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                  {profile.name || 'Anonymous User'}
                </Typography>
                {profile.collaborationRating >= 4.5 && (
                  <Verified sx={{ color: '#1976D2', fontSize: 20 }} />
                )}
                {getVisibilityIcon()}
              </Box>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 2, lineHeight: 1.4 }}
                noWrap
              >
                {profile.title || 'Professional'} at {profile.company || 'Company'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="caption" noWrap>{profile.location || 'Remote'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <People fontSize="small" color="action" />
                  <Typography variant="caption">{profile.connections || 0} connections</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star fontSize="small" color="action" />
                  <Typography variant="caption">{(profile.rating || 4.0).toFixed(1)}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* AI Agents Section */}
          <Box sx={{ mb: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              AI Collaborators:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(profile.aiAgents || []).slice(0, 3).map((agent, index) => (
                <Tooltip key={agent.id || index} title={`${agent.name} - ${agent.specialization?.join(', ') || 'AI Assistant'}`}>
                  <Chip
                    size="small"
                    label={agent.name || agent.type || 'AI'}
                    sx={{
                      backgroundColor: getAIAgentColor(agent.type || 'Assistant'),
                      color: 'white',
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                </Tooltip>
              ))}
              {(profile.aiAgents || []).length > 3 && (
                <Chip
                  size="small"
                  label={`+${(profile.aiAgents || []).length - 3}`}
                  sx={{
                    backgroundColor: 'grey.400',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
              )}
            </Box>
          </Box>
          
          {/* Action Buttons */}
          {showActions && (
            <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
              <Button
                variant="contained"
                size="small"
                color={getConnectionButtonColor()}
                startIcon={<PersonAdd />}
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect?.(profile.id);
                }}
                disabled={profile.connectionStatus === 'pending' || profile.connectionStatus === 'blocked'}
                sx={{ flex: 1 }}
              >
                {getConnectionButtonText()}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Message />}
                onClick={(e) => {
                  e.stopPropagation();
                  onMessage?.(profile.id);
                }}
                sx={{ flex: 1 }}
              >
                Message
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card sx={{ mb: 3 }}>
      {profile.coverImage && (
        <Box
          sx={{
            height: 120,
            backgroundImage: `url(${profile.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 1,
            }}
          >
            {getVisibilityIcon()}
            <IconButton size="small" sx={{ color: 'white' }}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      )}
      
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: profile?.isOnline ? '#4CAF50' : '#FFA726',
                  border: '3px solid white',
                }}
              />
            }
          >
            <Avatar
              src={profile.avatar}
              sx={{
                width: 100,
                height: 100,
                mt: profile.coverImage ? -6 : 0,
                border: '4px solid white',
              }}
            >
              {profile.name.charAt(0)}
            </Avatar>
          </Badge>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h5">{profile.name}</Typography>
              {profile.collaborationRating >= 4.5 && (
                <Verified sx={{ color: '#1976D2', fontSize: 24 }} />
              )}
            </Box>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {profile.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Business fontSize="small" color="action" />
              <Typography variant="body2">{profile.company}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2">{profile.location}</Typography>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              {profile.bio}
            </Typography>
            
            {showActions && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color={getConnectionButtonColor()}
                  startIcon={<PersonAdd />}
                  onClick={() => onConnect?.(profile.id)}
                  disabled={profile.connectionStatus === 'pending' || profile.connectionStatus === 'blocked'}
                >
                  {getConnectionButtonText()}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Message />}
                  onClick={() => onMessage?.(profile.id)}
                >
                  Message
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={() => onStartCollaboration?.(profile.id)}
                >
                  Start AI Collaboration
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy color="primary" />
              AI Agent Portfolio
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {profile.aiAgents.map((agent) => (
                <Tooltip key={agent.id} title={`${agent.name} - ${agent.specialization.join(', ')}`}>
                  <Chip
                    icon={<SmartToy />}
                    label={`${agent.type} - ${agent.name}`}
                    sx={{
                      backgroundColor: getAIAgentColor(agent.type),
                      color: 'white',
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>AI Specializations:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {profile.aiSkills.map((skill) => (
                <Chip key={skill} size="small" label={skill} variant="outlined" />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology color="primary" />
              Collaboration Stats
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Collaboration Rating</Typography>
                <Typography variant="body2">{profile.collaborationRating.toFixed(1)}/5.0</Typography>
              </Box>
              <Rating value={profile.collaborationRating} readOnly precision={0.1} />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Total Collaborations</Typography>
              <Typography variant="body2">{profile.totalCollaborations}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Connections</Typography>
              <Typography variant="body2">{profile.connectionCount}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Collaboration Style</Typography>
              <Chip size="small" label={profile.collaborationStyle} color="primary" />
            </Box>
            
            {profile.mutualConnections > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Mutual Connections</Typography>
                <Typography variant="body2">{profile.mutualConnections}</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
        
        {isExpanded && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>Professional Skills</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {profile.skills.map((skill) => (
                    <Chip key={skill} size="small" label={skill} />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>Contact</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {profile.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" />
                      <Typography variant="body2">{profile.email}</Typography>
                    </Box>
                  )}
                  {profile.linkedin && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkedIn fontSize="small" />
                      <Typography variant="body2">{profile.linkedin}</Typography>
                    </Box>
                  )}
                  {profile.twitter && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Twitter fontSize="small" />
                      <Typography variant="body2">{profile.twitter}</Typography>
                    </Box>
                  )}
                  {profile.github && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GitHub fontSize="small" />
                      <Typography variant="body2">{profile.github}</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="text"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;

