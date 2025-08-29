import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Divider,
  Tooltip,
  Button,
  CircularProgress,
  Paper,
  Drawer,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as AcceptIcon,
  Cancel as DeclineIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  PersonAdd as ConnectionIcon,
  Chat as MessageIcon,
  Announcement as SystemIcon,
  Warning as AlertIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { useConnections } from '../../hooks/useConnections';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface NotificationSidebarProps {
  open: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right';
  width?: number;
}

/**
 * NotificationSidebar - A sidebar component for displaying notifications
 * 
 * Shows connection requests, messages, and system notifications in a sidebar.
 * Integrates with the notification system and connection system.
 */
const NotificationSidebar: React.FC<NotificationSidebarProps> = ({
  open,
  onClose,
  anchor = 'left',
  width = 320,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  
  // Get notifications from the notification system
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  // Get connection requests from the connection system
  const { 
    pendingRequests, 
    acceptConnectionRequest, 
    declineConnectionRequest,
    loading: connectionsLoading
  } = useConnections();

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle accepting a connection request
  const handleAcceptConnection = async (requestId: string) => {
    try {
      await acceptConnectionRequest(requestId);
    } catch (error) {
      console.error('Failed to accept connection request:', error);
    }
  };

  // Handle declining a connection request
  const handleDeclineConnection = async (requestId: string) => {
    try {
      await declineConnectionRequest(requestId);
    } catch (error) {
      console.error('Failed to decline connection request:', error);
    }
  };

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle deleting a notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    handleMarkAsRead(notification.id);
    
    // Navigate to the appropriate page based on notification type
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return <ConnectionIcon color="primary" />;
      case 'message':
        return <MessageIcon color="info" />;
      case 'system':
        return <SystemIcon color="secondary" />;
      case 'alert':
        return <AlertIcon color="error" />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderLeft: anchor === 'right' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          borderRight: anchor === 'left' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          Notifications
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }} />
          )}
        </Typography>
        <Box>
          <Tooltip title="Close">
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="fullWidth"
        sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}
      >
        <Tab 
          label="All" 
          icon={
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          } 
          iconPosition="start"
        />
        <Tab 
          label="Connections" 
          icon={
            <Badge badgeContent={pendingRequests.length} color="primary">
              <ConnectionIcon />
            </Badge>
          } 
          iconPosition="start"
        />
      </Tabs>

      {/* Content */}
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {/* All Notifications Tab */}
        {tabValue === 0 && (
          <>
            {/* Actions */}
            {notifications.length > 0 && (
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  startIcon={<MarkReadIcon />}
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              </Box>
            )}
            
            {/* Notifications List */}
            {notificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No notifications</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.map((notification: any) => (
                  <React.Fragment key={notification.id}>
                    <ListItem 
                      alignItems="flex-start"
                      sx={{ 
                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' },
                        cursor: 'pointer',
                      }}
                      onClick={() => handleNotificationClick(notification)}
                      secondaryAction={
                        <Box>
                          <Tooltip title="Mark as read">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <MarkReadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={notification.fromUserPhoto}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.title || notification.fromUserName || 'System Notification'}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {notification.message}
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}

        {/* Connection Requests Tab */}
        {tabValue === 1 && (
          <>
            {connectionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingRequests.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No connection requests</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {pendingRequests.map((request: any) => (
                  <React.Fragment key={request.id}>
                    <ListItem 
                      alignItems="flex-start"
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={request.fromUserPhoto}>
                          {request.fromUserName?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={request.fromUserName || 'Unknown User'}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {request.message || 'Wants to connect with you'}
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              {formatDistanceToNow(new Date(request.createdAt.toDate()), { addSuffix: true })}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<AcceptIcon />}
                                onClick={() => handleAcceptConnection(request.id)}
                              >
                                Accept
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeclineIcon />}
                                onClick={() => handleDeclineConnection(request.id)}
                              >
                                Decline
                              </Button>
                            </Box>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationSidebar;

