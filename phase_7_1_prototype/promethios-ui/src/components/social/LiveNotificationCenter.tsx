/**
 * Live Notification Center
 * 
 * Real-time notification display with toast notifications, notification badges,
 * and integration with the unified notification system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  Button,
  Chip,
  Stack,
  Paper,
  Snackbar,
  Alert,
  Slide,
  Fade,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  Close,
  Check,
  ThumbUp,
  Comment,
  Share,
  PersonAdd,
  Circle,
  MarkEmailRead
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { socialRealtimeService, LiveNotification } from '../../services/SocialRealtimeService';
import { formatDistanceToNow } from 'date-fns';

interface LiveNotificationCenterProps {
  onNotificationClick?: (notification: LiveNotification) => void;
  maxToastNotifications?: number;
  showToasts?: boolean;
}

interface ToastNotification extends LiveNotification {
  show: boolean;
  autoHide: boolean;
}

const LiveNotificationCenter: React.FC<LiveNotificationCenterProps> = ({
  onNotificationClick,
  maxToastNotifications = 3,
  showToasts = true
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUser?.uid || !isEnabled) return;

    console.log('🔔 [LiveNotificationCenter] Starting notification subscription');

    const unsubscribe = socialRealtimeService.subscribeNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(prev => {
          // Find truly new notifications
          const existingIds = new Set(prev.map(n => n.id));
          const brandNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
          
          // Show toast notifications for new ones
          if (showToasts && brandNewNotifications.length > 0) {
            showToastNotifications(brandNewNotifications);
          }
          
          return newNotifications;
        });
        
        // Update unread count
        const unread = newNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid, isEnabled, showToasts]);

  // Show toast notifications for new notifications
  const showToastNotifications = useCallback((newNotifications: LiveNotification[]) => {
    const toasts = newNotifications
      .slice(0, maxToastNotifications)
      .map(notification => ({
        ...notification,
        show: true,
        autoHide: true
      }));

    setToastNotifications(prev => [...prev, ...toasts]);

    // Auto-hide toasts after 5 seconds
    toasts.forEach((toast, index) => {
      setTimeout(() => {
        setToastNotifications(prev => 
          prev.map(t => t.id === toast.id ? { ...t, show: false } : t)
        );
        
        // Remove from array after animation
        setTimeout(() => {
          setToastNotifications(prev => prev.filter(t => t.id !== toast.id));
        }, 300);
      }, 5000 + (index * 500)); // Stagger the hiding
    });
  }, [maxToastNotifications]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleNotificationClick = (notification: LiveNotification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Close menu
    handleMenuClose();
    
    // Call external handler
    onNotificationClick?.(notification);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // TODO: Update in Firebase
      console.log('📖 [LiveNotificationCenter] Marking notification as read:', notificationId);
    } catch (error) {
      console.error('❌ [LiveNotificationCenter] Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // TODO: Update all in Firebase
      console.log('📖 [LiveNotificationCenter] Marking all notifications as read');
    } catch (error) {
      console.error('❌ [LiveNotificationCenter] Error marking all notifications as read:', error);
    }
  };

  const toggleNotifications = () => {
    setIsEnabled(!isEnabled);
    if (isEnabled) {
      setNotifications([]);
      setUnreadCount(0);
      setToastNotifications([]);
    }
  };

  const getNotificationIcon = (type: LiveNotification['type']) => {
    switch (type) {
      case 'post_like':
        return <ThumbUp fontSize="small" color="primary" />;
      case 'post_comment':
        return <Comment fontSize="small" color="info" />;
      case 'post_share':
        return <Share fontSize="small" color="success" />;
      case 'connection_request':
        return <PersonAdd fontSize="small" color="warning" />;
      case 'mention':
        return <Circle fontSize="small" color="error" />;
      default:
        return <Notifications fontSize="small" />;
    }
  };

  const getNotificationColor = (type: LiveNotification['type']) => {
    switch (type) {
      case 'post_like':
        return 'primary.main';
      case 'post_comment':
        return 'info.main';
      case 'post_share':
        return 'success.main';
      case 'connection_request':
        return 'warning.main';
      case 'mention':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const dismissToast = (toastId: string) => {
    setToastNotifications(prev => 
      prev.map(t => t.id === toastId ? { ...t, show: false } : t)
    );
    
    setTimeout(() => {
      setToastNotifications(prev => prev.filter(t => t.id !== toastId));
    }, 300);
  };

  return (
    <>
      {/* Notification Bell */}
      <IconButton
        onClick={handleMenuOpen}
        color={unreadCount > 0 ? 'primary' : 'default'}
        sx={{
          position: 'relative',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          max={99}
          invisible={!isEnabled || unreadCount === 0}
        >
          {isEnabled ? (
            unreadCount > 0 ? <NotificationsActive /> : <Notifications />
          ) : (
            <NotificationsOff />
          )}
        </Badge>
      </IconButton>

      {/* Notification Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'hidden'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Notifications
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                onClick={toggleNotifications}
                startIcon={isEnabled ? <NotificationsOff /> : <Notifications />}
              >
                {isEnabled ? 'Disable' : 'Enable'}
              </Button>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  startIcon={<MarkEmailRead />}
                >
                  Mark all read
                </Button>
              )}
            </Stack>
          </Stack>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isEnabled ? 'No notifications yet' : 'Notifications disabled'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={notification.fromUserAvatar}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: `2px solid ${getNotificationColor(notification.type)}`
                        }}
                      >
                        {notification.fromUserName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {getNotificationIcon(notification.type)}
                          <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                            {notification.fromUserName}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                          </Typography>
                        </Stack>
                      }
                    />
                    {!notification.read && (
                      <ListItemSecondaryAction>
                        <Circle sx={{ color: 'primary.main', fontSize: 12 }} />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Menu>

      {/* Toast Notifications */}
      {showToasts && toastNotifications.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={toast.show}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            top: `${80 + (index * 80)}px !important`,
            zIndex: 1400 + index
          }}
          TransitionComponent={Slide}
          TransitionProps={{ direction: 'left' }}
        >
          <Alert
            severity="info"
            variant="filled"
            onClose={() => dismissToast(toast.id)}
            sx={{
              width: 350,
              alignItems: 'center',
              '& .MuiAlert-icon': {
                fontSize: '1.2rem'
              }
            }}
            icon={getNotificationIcon(toast.type)}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => dismissToast(toast.id)}
              >
                <Close fontSize="small" />
              </IconButton>
            }
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" fontWeight="bold">
                {toast.fromUserName}
              </Typography>
              <Typography variant="body2">
                {toast.message}
              </Typography>
              {toast.postTitle && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  "{toast.postTitle}"
                </Typography>
              )}
            </Stack>
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default LiveNotificationCenter;

