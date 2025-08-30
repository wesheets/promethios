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
import ConnectionRequestModal from '../social/ConnectionRequestModal';

interface NotificationSidebarProps {
  open: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right';
  width?: number;
  onConnectionUpdate?: () => void;
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
  onConnectionUpdate,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConnectionRequest, setSelectedConnectionRequest] = useState<any>(null);
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
    
    // Check if this is a connection request notification
    if (notification.metadata?.notificationType === 'connection_request') {
      // Open the connection request modal
      setSelectedConnectionRequest({
        requestId: notification.metadata.requestId,
        fromUserId: notification.metadata.fromUserId,
        fromUserName: notification.metadata.fromUserName,
        fromUserAvatar: notification.metadata.fromUserAvatar
      });
      setModalOpen(true);
      return;
    }
    
    // Navigate to the appropriate page based on notification type
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  // Handle opening connection request modal from connections tab
  const handleConnectionRequestClick = (request: any) => {
    setSelectedConnectionRequest({
      requestId: request.id,
      fromUserId: request.fromUserId,
      fromUserName: request.fromUserName,
      fromUserAvatar: request.fromUserAvatar
    });
    setModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedConnectionRequest(null);
  };

  // Handle connection accept from modal
  const handleModalAccept = () => {
    // The modal handles the acceptance, we just need to refresh
    handleModalClose();
    // Trigger connection update in parent component
    if (onConnectionUpdate) {
      onConnectionUpdate();
    }
  };

  // Handle connection reject from modal
  const handleModalReject = () => {
    // The modal handles the rejection, we just need to refresh
    handleModalClose();
    // Trigger connection update in parent component
    if (onConnectionUpdate) {
      onConnectionUpdate();
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
            ) : (
              <>
                {/* Connection Request Notifications */}
                {notifications.filter(n => n.metadata?.notificationType === 'connection_request').length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 600 }}>
                      New Requests
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {notifications
                        .filter(n => n.metadata?.notificationType === 'connection_request')
                        .map((notification: any) => (
                        <React.Fragment key={notification.id}>
                          <ListItem 
                            alignItems="flex-start"
                            sx={{ 
                              bgcolor: notification.read ? 'transparent' : 'action.hover',
                              '&:hover': { bgcolor: 'action.selected' },
                              cursor: 'pointer',
                            }}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <ListItemAvatar>
                              <Avatar src={notification.metadata?.fromUserAvatar}>
                                {notification.metadata?.fromUserName?.charAt(0) || 'U'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={notification.metadata?.fromUserName || 'Unknown User'}
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
                  </>
                )}

                {/* Existing Connection Requests from Firebase */}
                {pendingRequests.length > 0 && (
                  <>
                    {notifications.filter(n => n.metadata?.notificationType === 'connection_request').length > 0 && (
                      <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 600 }}>
                        Pending Requests
                      </Typography>
                    )}
                    <List sx={{ p: 0 }}>
                      {pendingRequests.map((request: any) => (
                        <React.Fragment key={request.id}>
                          <ListItem 
                            alignItems="flex-start"
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              cursor: 'pointer',
                            }}
                            onClick={() => handleConnectionRequestClick(request)}
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
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  </>
                )}

                {/* No connection requests */}
                {pendingRequests.length === 0 && 
                 notifications.filter(n => n.metadata?.notificationType === 'connection_request').length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No connection requests</Typography>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>

      {/* Connection Request Modal */}
      {selectedConnectionRequest && (
        <ConnectionRequestModal
          open={modalOpen}
          onClose={handleModalClose}
          requestId={selectedConnectionRequest.requestId}
          fromUserId={selectedConnectionRequest.fromUserId}
          fromUserName={selectedConnectionRequest.fromUserName}
          fromUserAvatar={selectedConnectionRequest.fromUserAvatar}
          onAccept={handleModalAccept}
          onReject={handleModalReject}
        />
      )}
    </Drawer>
  );
};

export default NotificationSidebar;

