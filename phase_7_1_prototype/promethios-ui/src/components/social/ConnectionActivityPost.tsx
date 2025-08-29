import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  Badge,
  Tooltip,
  AvatarGroup,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  Comment,
  Share,
  People,
  PersonAdd,
  Handshake,
  Public,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import TeamMemberBadge from './TeamMemberBadge';

export interface ConnectionActivityUser {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  isVerified: boolean;
}

export interface ConnectionActivity {
  id: string;
  type: 'new_connection' | 'connection_accepted' | 'mutual_connection';
  primaryUser: ConnectionActivityUser;
  secondaryUser: ConnectionActivityUser;
  mutualConnections?: ConnectionActivityUser[];
  message?: string;
  createdAt: Date;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
}

interface ConnectionActivityPostProps {
  activity: ConnectionActivity;
  onLike?: (activityId: string) => void;
  onComment?: (activityId: string) => void;
  onShare?: (activityId: string) => void;
  onViewProfile?: (userId: string) => void;
  onConnect?: (userId: string) => void;
}

/**
 * ConnectionActivityPost - A specialized component for displaying connection activities in the social feed
 * 
 * Displays different types of connection activities:
 * - new_connection: User A connected with User B
 * - connection_accepted: User A accepted User B's connection request
 * - mutual_connection: User A and User B are now connected (they share X mutual connections)
 */
const ConnectionActivityPost: React.FC<ConnectionActivityPostProps> = ({
  activity,
  onLike,
  onComment,
  onShare,
  onViewProfile,
  onConnect,
}) => {
  const [liked, setLiked] = useState(activity.isLiked);
  const [likeCount, setLikeCount] = useState(activity.metrics.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    onLike?.(activity.id);
  };

  const handleViewProfile = (userId: string) => {
    onViewProfile?.(userId);
  };

  const handleConnect = (userId: string) => {
    onConnect?.(userId);
  };

  const renderActivityContent = () => {
    switch (activity.type) {
      case 'new_connection':
        return (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar 
                src={activity.primaryUser.avatar} 
                sx={{ width: 48, height: 48 }}
                onClick={() => handleViewProfile(activity.primaryUser.id)}
              />
              <PersonAdd sx={{ color: 'primary.main' }} />
              <Avatar 
                src={activity.secondaryUser.avatar} 
                sx={{ width: 48, height: 48 }}
                onClick={() => handleViewProfile(activity.secondaryUser.id)}
              />
            </Box>
            <Typography variant="body1">
              <Typography 
                component="span" 
                fontWeight="bold"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProfile(activity.primaryUser.id)}
              >
                {activity.primaryUser.name}
              </Typography>
              {' connected with '}
              <Typography 
                component="span" 
                fontWeight="bold"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProfile(activity.secondaryUser.id)}
              >
                {activity.secondaryUser.name}
              </Typography>
            </Typography>
            {activity.message && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                "{activity.message}"
              </Typography>
            )}
          </>
        );
      
      case 'connection_accepted':
        return (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar 
                src={activity.primaryUser.avatar} 
                sx={{ width: 48, height: 48 }}
                onClick={() => handleViewProfile(activity.primaryUser.id)}
              />
              <Handshake sx={{ color: 'success.main' }} />
              <Avatar 
                src={activity.secondaryUser.avatar} 
                sx={{ width: 48, height: 48 }}
                onClick={() => handleViewProfile(activity.secondaryUser.id)}
              />
            </Box>
            <Typography variant="body1">
              <Typography 
                component="span" 
                fontWeight="bold"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProfile(activity.primaryUser.id)}
              >
                {activity.primaryUser.name}
              </Typography>
              {' accepted '}
              <Typography 
                component="span" 
                fontWeight="bold"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProfile(activity.secondaryUser.id)}
              >
                {activity.secondaryUser.name}
              </Typography>
              {'\'s connection request'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <TeamMemberBadge variant="icon" size="small" />
              <Typography variant="body2" color="text.secondary">
                They are now team members
              </Typography>
            </Box>
          </>
        );
      
      case 'mutual_connection':
        return (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar 
                src={activity.primaryUser.avatar} 
                sx={{ width: 48, height: 48 }}
                onClick={() => handleViewProfile(activity.primaryUser.id)}
              />
              <People sx={{ color: 'primary.main' }} />
              <Avatar 
                src={activity.secondaryUser.avatar} 
                sx={{ width: 48, height: 48 }}
                onClick={() => handleViewProfile(activity.secondaryUser.id)}
              />
            </Box>
            <Typography variant="body1">
              <Typography 
                component="span" 
                fontWeight="bold"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProfile(activity.primaryUser.id)}
              >
                {activity.primaryUser.name}
              </Typography>
              {' and '}
              <Typography 
                component="span" 
                fontWeight="bold"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProfile(activity.secondaryUser.id)}
              >
                {activity.secondaryUser.name}
              </Typography>
              {' are now connected'}
            </Typography>
            
            {activity.mutualConnections && activity.mutualConnections.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {activity.mutualConnections.length} mutual connection{activity.mutualConnections.length !== 1 ? 's' : ''}
                </Typography>
                <AvatarGroup max={5} sx={{ mt: 1, justifyContent: 'flex-start' }}>
                  {activity.mutualConnections.map(user => (
                    <Tooltip key={user.id} title={user.name}>
                      <Avatar 
                        src={user.avatar} 
                        sx={{ width: 32, height: 32 }}
                        onClick={() => handleViewProfile(user.id)}
                      />
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {renderActivityContent()}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Public fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              size="small" 
              label="Connection" 
              color="primary" 
              variant="outlined"
              sx={{ height: 24 }}
            />
          </Box>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Button
            startIcon={liked ? <ThumbUp color="primary" /> : <ThumbUpOutlined />}
            onClick={handleLike}
            size="small"
          >
            {likeCount > 0 ? likeCount : ''} Like
          </Button>
          <Button
            startIcon={<Comment />}
            onClick={() => onComment?.(activity.id)}
            size="small"
          >
            {activity.metrics.comments > 0 ? activity.metrics.comments : ''} Comment
          </Button>
        </Box>
        
        <Button
          startIcon={<Share />}
          onClick={() => onShare?.(activity.id)}
          size="small"
        >
          Share
        </Button>
      </CardActions>
    </Card>
  );
};

export default ConnectionActivityPost;

