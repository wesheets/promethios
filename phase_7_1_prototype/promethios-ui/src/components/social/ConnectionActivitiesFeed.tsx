import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import ConnectionActivityPost, { ConnectionActivity } from './ConnectionActivityPost';
import { connectionActivityService } from '../../services/ConnectionActivityService';
import { NavigationService } from '../../services/NavigationService';

interface ConnectionActivitiesFeedProps {
  limit?: number;
  showTitle?: boolean;
  showRefresh?: boolean;
  onNavigateToProfile?: (userId: string) => void;
}

/**
 * ConnectionActivitiesFeed - A component to display connection activities in the social feed
 * 
 * Features:
 * - Displays recent connection activities
 * - Allows users to like, comment, and share activities
 * - Provides links to user profiles
 * - Supports refreshing the feed
 */
const ConnectionActivitiesFeed: React.FC<ConnectionActivitiesFeedProps> = ({
  limit = 10,
  showTitle = true,
  showRefresh = true,
  onNavigateToProfile
}) => {
  const [activities, setActivities] = useState<ConnectionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigationService = NavigationService.getInstance();

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const recentActivities = await connectionActivityService.getRecentConnectionActivities(limit);
      setActivities(recentActivities);
    } catch (err) {
      console.error('Error loading connection activities:', err);
      setError('Failed to load connection activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [limit]);

  const handleRefresh = () => {
    loadActivities();
  };

  const handleLike = (activityId: string) => {
    // Implementation would go here
    console.log(`Liked activity: ${activityId}`);
  };

  const handleComment = (activityId: string) => {
    // Implementation would go here
    console.log(`Commenting on activity: ${activityId}`);
  };

  const handleShare = (activityId: string) => {
    // Implementation would go here
    console.log(`Sharing activity: ${activityId}`);
  };

  const handleViewProfile = (userId: string) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(userId);
    } else {
      navigationService.navigateToProfile(userId);
    }
  };

  const handleConnect = (userId: string) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(userId);
    } else {
      navigationService.navigateToProfile(userId);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (activities.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        {showTitle && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Connections</Typography>
            {showRefresh && (
              <Button startIcon={<Refresh />} onClick={handleRefresh} size="small">
                Refresh
              </Button>
            )}
          </Box>
        )}
        <Alert severity="info">No recent connection activities</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      {showTitle && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Connections</Typography>
          {showRefresh && (
            <Button startIcon={<Refresh />} onClick={handleRefresh} size="small">
              Refresh
            </Button>
          )}
        </Box>
      )}

      {activities.map((activity) => (
        <ConnectionActivityPost
          key={activity.id}
          activity={activity}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onViewProfile={handleViewProfile}
          onConnect={handleConnect}
        />
      ))}

      {activities.length > 0 && activities.length < limit && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No more connection activities to show
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ConnectionActivitiesFeed;

