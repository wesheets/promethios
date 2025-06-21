import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  unreadNotifications?: number;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  isLoggedIn,
  userName = 'User',
  userRole = 'User',
  unreadNotifications = 0,
}) => {
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

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
    logout(); // Use the logout function from useAuth
  };

  const handleDashboardClick = () => {
    navigate('/ui/dashboard');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/preferences'); // Navigate to preferences as main settings page
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/profile');
  };

  if (!isLoggedIn) {
    return null; // Don't render for logged-out users
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
            aria-label={`show ${unreadNotifications} new notifications`}
            color="inherit"
            onClick={handleNotificationMenuOpen}
          >
            <Badge badgeContent={unreadNotifications} color="error">
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

        {/* Notifications Menu */}
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
              minWidth: 300,
              maxHeight: 400,
            },
          }}
        >
          <MenuItem disabled>
            <ListItemText primary="Notifications" />
          </MenuItem>
          <Divider sx={{ backgroundColor: '#4a5568' }} />
          {unreadNotifications === 0 ? (
            <MenuItem disabled>
              <ListItemText primary="No new notifications" />
            </MenuItem>
          ) : (
            <MenuItem>
              <ListItemText 
                primary="New governance alert"
                secondary="Agent policy violation detected"
                secondaryTypographyProps={{ color: '#a0aec0' }}
              />
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderNavigation;

