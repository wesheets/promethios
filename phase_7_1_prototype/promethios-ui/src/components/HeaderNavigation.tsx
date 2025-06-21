import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../types/notification';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

interface HeaderNavigationProps {
  isLoggedIn: boolean;
  userName?: string;
  userRole?: string;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  isLoggedIn,
  userName = 'User',
  userRole = 'User',
}) => {
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  // Use the new notification system
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    isLoading,
    error 
  } = useNotifications();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleDashboardClick = () => {
    navigate('/ui/dashboard');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/preferences');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/profile');
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type or action
    if (notification.actions && notification.actions.length > 0) {
      const primaryAction = notification.actions[0];
      if (primaryAction.url) {
        navigate(primaryAction.url);
      }
    }

    handleNotificationMenuClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = { sx: { fontSize: 16, mr: 1 } };
    
    switch (type) {
      case 'governance':
        return priority === 'critical' ? 
          <ErrorIcon {...iconProps} sx={{ ...iconProps.sx, color: '#f56565' }} /> :
          <WarningIcon {...iconProps} sx={{ ...iconProps.sx, color: '#ed8936' }} />;
      case 'trust_boundary':
        return <CheckCircleIcon {...iconProps} sx={{ ...iconProps.sx, color: '#48bb78' }} />;
      case 'observer':
        return <InfoIcon {...iconProps} sx={{ ...iconProps.sx, color: '#4299e1' }} />;
      case 'system':
        return <CircleIcon {...iconProps} sx={{ ...iconProps.sx, color: '#a0aec0' }} />;
      default:
        return <InfoIcon {...iconProps} sx={{ ...iconProps.sx, color: '#4299e1' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#f56565';
      case 'high':
        return '#ed8936';
      case 'medium':
        return '#ecc94b';
      case 'low':
        return '#48bb78';
      default:
        return '#a0aec0';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1a202c',
        borderBottom: '1px solid #2d3748',
      }}
    >
      <Toolbar>
        {/* Logo */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="dashboard"
          onClick={handleDashboardClick}
          sx={{ mr: 2 }}
        >
          <DashboardIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            display: { xs: 'none', sm: 'block' },
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          onClick={handleDashboardClick}
        >
          PROMETHIOS
        </Typography>

        {/* Search */}
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>

        <Box sx={{ flexGrow: 1 }} />

        {/* Right side icons */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Notifications */}
          <IconButton
            size="large"
            aria-label={`show ${unreadCount} new notifications`}
            color="inherit"
            onClick={handleNotificationMenuOpen}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#4299e1' }}>
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: '#2d3748',
              color: 'white',
              minWidth: 200,
            },
          }}
        >
          <MenuItem disabled>
            <ListItemText
              primary={userName}
              secondary={userRole}
              secondaryTypographyProps={{ color: '#a0aec0' }}
            />
          </MenuItem>
          <Divider sx={{ backgroundColor: '#4a5568' }} />
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <PersonIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
            <ListItemIcon>
              <SettingsIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider sx={{ backgroundColor: '#4a5568' }} />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>

        {/* Enhanced Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: '#2d3748',
              color: 'white',
              minWidth: 400,
              maxHeight: 500,
              overflow: 'auto',
            },
          }}
        >
          {/* Header */}
          <MenuItem disabled sx={{ borderBottom: '1px solid #4a5568' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Typography variant="h6">Notifications</Typography>
              {unreadCount > 0 && (
                <Typography 
                  variant="caption" 
                  sx={{ cursor: 'pointer', color: '#4299e1' }}
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Typography>
              )}
            </Box>
          </MenuItem>

          {/* Loading State */}
          {isLoading && (
            <MenuItem disabled>
              <ListItemText primary="Loading notifications..." />
            </MenuItem>
          )}

          {/* Error State */}
          {error && (
            <MenuItem disabled>
              <ListItemText 
                primary="Error loading notifications"
                secondary={error}
                secondaryTypographyProps={{ color: '#f56565' }}
              />
            </MenuItem>
          )}

          {/* No Notifications */}
          {!isLoading && !error && notifications.length === 0 && (
            <MenuItem disabled>
              <ListItemText primary="No notifications" />
            </MenuItem>
          )}

          {/* Notification Items */}
          {!isLoading && !error && notifications.slice(0, 10).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'rgba(66, 153, 225, 0.1)',
                borderLeft: notification.read ? 'none' : '3px solid #4299e1',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                alignItems: 'flex-start',
                py: 1.5,
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                  {getNotificationIcon(notification.type, notification.priority)}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: notification.read ? 'normal' : 'bold',
                        mb: 0.5,
                        wordBreak: 'break-word'
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#a0aec0',
                        display: 'block',
                        wordBreak: 'break-word'
                      }}
                    >
                      {notification.message}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="caption" sx={{ color: '#a0aec0', mb: 0.5 }}>
                      {formatTimestamp(notification.timestamp)}
                    </Typography>
                    <Chip
                      label={notification.priority}
                      size="small"
                      sx={{
                        backgroundColor: getPriorityColor(notification.priority),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  </Box>
                </Box>
                
                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    {notification.actions.slice(0, 2).map((action, index) => (
                      <Chip
                        key={index}
                        label={action.label}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: '#4299e1',
                          borderColor: '#4299e1',
                          fontSize: '0.7rem',
                          height: 24,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (action.url) {
                            navigate(action.url);
                            handleNotificationMenuClose();
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </MenuItem>
          ))}

          {/* View All Link */}
          {notifications.length > 10 && (
            <MenuItem 
              onClick={() => {
                navigate('/ui/notifications');
                handleNotificationMenuClose();
              }}
              sx={{ borderTop: '1px solid #4a5568', justifyContent: 'center' }}
            >
              <Typography variant="body2" sx={{ color: '#4299e1' }}>
                View all notifications
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderNavigation;

