/**
 * SocialProfileMini - Mini profile sidebar for the Social Network panel
 * 
 * This component displays a condensed version of the user's profile
 * in the right sidebar of the social network, similar to LinkedIn's layout.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  Person,
  Business,
  LocationOn,
  Edit,
  Bookmark,
  Group,
  Event,
  Article,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { userProfileService, UserProfile } from '../../services/UserProfileService';

const SocialProfileMini: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userProfile = await userProfileService.getUserProfile(currentUser.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Card sx={{ bgcolor: '#334155', border: '1px solid #475569' }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={80} height={80} />
              <Skeleton variant="text" width={120} height={24} sx={{ mt: 1 }} />
              <Skeleton variant="text" width={100} height={20} />
            </Box>
            <Skeleton variant="rectangular" height={40} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  const displayName = profile?.displayName || currentUser?.displayName || 'User';
  const title = profile?.title || '--Founder';
  const company = profile?.company || 'Promethios';
  const location = profile?.location || 'St Louis, Missouri';
  const connections = profile?.connections?.length || 19;

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Main Profile Card */}
      <Card sx={{ 
        bgcolor: '#334155', 
        border: '1px solid #475569',
        mb: 2
      }}>
        <CardContent>
          {/* Profile Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 2
          }}>
            <Avatar
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: '#6366f1',
                fontSize: '2rem',
                mb: 1
              }}
            >
              {displayName.charAt(0)}
            </Avatar>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#f8fafc',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              {displayName}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#cbd5e1',
                textAlign: 'center'
              }}
            >
              {title}
            </Typography>
            
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#94a3b8',
                textAlign: 'center'
              }}
            >
              {location}
            </Typography>

            {/* Company */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 1,
              color: '#cbd5e1'
            }}>
              <Business sx={{ fontSize: '1rem', mr: 0.5 }} />
              <Typography variant="caption">
                {company}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ bgcolor: '#475569', mb: 2 }} />

          {/* Connections */}
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="text"
              sx={{ 
                color: '#6366f1',
                textTransform: 'none',
                justifyContent: 'flex-start',
                '&:hover': {
                  bgcolor: 'rgba(99, 102, 241, 0.1)'
                }
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Connections
                </Typography>
                <Typography variant="h6" sx={{ color: '#6366f1' }}>
                  {connections}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Grow your network
                </Typography>
              </Box>
            </Button>
          </Box>

          <Divider sx={{ bgcolor: '#475569', mb: 2 }} />

          {/* Premium Promotion */}
          <Box sx={{ 
            bgcolor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 1,
            p: 1.5,
            mb: 2
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#fbbf24',
                fontWeight: 600
              }}
            >
              🔓 Don't miss: Premium for $0
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#cbd5e1',
                display: 'block',
                mt: 0.5
              }}
            >
              Grow your career with Premium
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card sx={{ 
        bgcolor: '#334155', 
        border: '1px solid #475569',
        mb: 2
      }}>
        <CardContent sx={{ py: 2 }}>
          <List dense>
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Bookmark sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Saved items" 
                primaryTypographyProps={{
                  variant: 'body2',
                  color: '#f8fafc'
                }}
              />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Group sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Groups" 
                primaryTypographyProps={{
                  variant: 'body2',
                  color: '#f8fafc'
                }}
              />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Article sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Newsletters" 
                primaryTypographyProps={{
                  variant: 'body2',
                  color: '#f8fafc'
                }}
              />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Event sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Events" 
                primaryTypographyProps={{
                  variant: 'body2',
                  color: '#f8fafc'
                }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card sx={{ 
        bgcolor: '#334155', 
        border: '1px solid #475569'
      }}>
        <CardContent sx={{ py: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: '#f8fafc',
              fontWeight: 600,
              mb: 1
            }}
          >
            Recent Activity
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#94a3b8',
              display: 'block',
              mb: 1
            }}
          >
            You haven't posted yet
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#94a3b8'
            }}
          >
            Posts you share will be displayed here.
          </Typography>
          
          <Button
            fullWidth
            variant="outlined"
            size="small"
            sx={{ 
              mt: 2,
              color: '#6366f1',
              borderColor: '#6366f1',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                borderColor: '#6366f1'
              }
            }}
          >
            Create a post
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SocialProfileMini;

