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
  Collapse,
  List,
  ListItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Tune as PreferencesIcon,
  Business as OrganizationIcon,
  Extension as IntegrationsIcon,
  Storage as DataIcon,
  Key as ApiKeyIcon,
  Help as HelpIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Tour as ToursIcon,
  Description as DocsIcon,
  Support as SupportIcon,
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
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const navigate = useNavigate();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Reset expansion states when opening menu
    setSettingsExpanded(false);
    setHelpExpanded(false);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
    setSettingsExpanded(false);
    setHelpExpanded(false);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleSettingsToggle = () => {
    setSettingsExpanded(!settingsExpanded);
    setHelpExpanded(false); // Close help if open
  };

  const handleHelpToggle = () => {
    setHelpExpanded(!helpExpanded);
    setSettingsExpanded(false); // Close settings if open
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
    navigate('/ui/profile'); // Navigate to main profile page
  };

  // Settings navigation handlers
  const handlePreferencesClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/preferences');
  };

  const handleOrganizationClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/organization');
  };

  const handleIntegrationsClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/integrations');
  };

  const handleDataManagementClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/data');
  };

  const handleApiKeysClick = () => {
    handleProfileMenuClose();
    navigate('/ui/settings/api-keys');
  };

  // Help navigation handlers
  const handleToursClick = () => {
    handleProfileMenuClose();
    navigate('/ui/help/tours');
  };

  const handleDocsClick = () => {
    handleProfileMenuClose();
    navigate('/ui/help/documentation');
  };

  const handleSupportClick = () => {
    handleProfileMenuClose();
    navigate('/ui/help/support');
  };

  const handleHelpClick = () => {
    handleProfileMenuClose();
    navigate('/ui/help/documentation');
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

        {/* Profile Menu with Inline Expansion */}
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
              minWidth: 220,
              maxHeight: 500,
              overflow: 'auto',
            },
          }}
        >
          {/* User Info Header */}
          <MenuItem disabled>
            <ListItemText
              primary={userName}
              secondary={userRole}
              secondaryTypographyProps={{ color: '#a0aec0' }}
            />
          </MenuItem>
          <Divider sx={{ backgroundColor: '#4a5568' }} />

          {/* Profile */}
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <PersonIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>

          {/* Settings with Inline Expansion */}
          <MenuItem onClick={handleSettingsToggle}>
            <ListItemIcon>
              <SettingsIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
            {settingsExpanded ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
          </MenuItem>
          <Collapse in={settingsExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <MenuItem onClick={handlePreferencesClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <PreferencesIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Preferences" />
              </MenuItem>
              <MenuItem onClick={handleOrganizationClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <OrganizationIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Organization" />
              </MenuItem>
              <MenuItem onClick={handleIntegrationsClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <IntegrationsIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Integrations" />
              </MenuItem>
              <MenuItem onClick={handleDataManagementClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <DataIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Data Management" />
              </MenuItem>
              <MenuItem onClick={handleApiKeysClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <ApiKeyIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="API Keys" />
              </MenuItem>
            </List>
          </Collapse>

          {/* Help with Inline Expansion */}
          <MenuItem onClick={handleHelpToggle}>
            <ListItemIcon>
              <HelpIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Help" />
            {helpExpanded ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
          </MenuItem>
          <Collapse in={helpExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <MenuItem onClick={handleToursClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <ToursIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Guided Tours" />
              </MenuItem>
              <MenuItem onClick={handleDocsClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <DocsIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Documentation" />
              </MenuItem>
              <MenuItem onClick={handleSupportClick} sx={{ pl: 4 }}>
                <ListItemIcon>
                  <SupportIcon sx={{ color: 'white', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Support" />
              </MenuItem>
            </List>
          </Collapse>

          <Divider sx={{ backgroundColor: '#4a5568' }} />
          
          {/* Logout */}
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

