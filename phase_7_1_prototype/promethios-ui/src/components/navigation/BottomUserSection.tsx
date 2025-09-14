/**
 * Bottom User Section for Navigation
 * Follows ChatGPT/Slack UX pattern with user profile at bottom of left navigation
 */

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Popover,
  Paper,
  Collapse
} from '@mui/material';
import {
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Tune as PreferencesIcon,
  Business as OrganizationIcon,
  Extension as IntegrationsIcon,
  Storage as DataIcon,
  Key as ApiKeyIcon,
  Tour as ToursIcon,
  Description as DocsIcon,
  Support as SupportIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useUtilityNavigation } from '../../hooks/useUtilityNavigation';
import NotificationBell from '../notifications/NotificationBell';
import ChatButton from '../social/ChatButton';

interface BottomUserSectionProps {
  collapsed: boolean;
  onNavigate: (path: string) => void;
}

const BottomUserSection: React.FC<BottomUserSectionProps> = ({
  collapsed,
  onNavigate
}) => {
  const { currentUser } = useAuth();
  const {
    navigateToProfile,
    navigateToPreferences,
    navigateToOrganization,
    navigateToIntegrations,
    navigateToDataManagement,
    navigateToApiKeys,
    navigateToDocumentation,
    navigateToGuidedTours,
    navigateToSupport,
    handleLogout
  } = useUtilityNavigation();

  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);

  // Get user display info
  const userDisplayName = currentUser?.displayName || 'User';
  const userEmail = currentUser?.email || '';
  const userAvatar = currentUser?.photoURL;
  const userInitials = userDisplayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // User menu for collapsed state
  const UserMenuPopover = () => (
    <Paper sx={{ p: 1, minWidth: 200, bgcolor: '#1e293b', border: '1px solid #334155' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
        <Typography variant="subtitle2" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
          {userDisplayName}
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {userEmail}
        </Typography>
      </Box>
      
      <List dense sx={{ py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => { setUserMenuAnchor(null); navigateToProfile(); }}>
            <ListItemIcon><ProfileIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary="Profile" sx={{ color: '#cbd5e1' }} />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => { setUserMenuAnchor(null); navigateToPreferences(); }}>
            <ListItemIcon><SettingsIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary="Settings" sx={{ color: '#cbd5e1' }} />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => { setUserMenuAnchor(null); navigateToSupport(); }}>
            <ListItemIcon><HelpIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary="Help" sx={{ color: '#cbd5e1' }} />
          </ListItemButton>
        </ListItem>
        
        <Divider sx={{ bgcolor: '#334155', my: 1 }} />
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => { setUserMenuAnchor(null); handleLogout(); }}>
            <ListItemIcon><LogoutIcon sx={{ color: '#ef4444', fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary="Logout" sx={{ color: '#ef4444' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Paper>
  );

  if (collapsed) {
    // Collapsed state - notification, chat, and user avatar
    return (
      <>
        <Box sx={{ mt: 'auto', p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <NotificationBell collapsed={true} />
          <ChatButton collapsed={true} />
          <Tooltip title={`${userDisplayName} - Click for menu`} placement="right" arrow>
            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                color: 'text.primary',
                width: '100%',
                height: 48,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              <Avatar
                src={userAvatar}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#3b82f6',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Menu Popover */}
        <Popover
          open={Boolean(userMenuAnchor)}
          anchorEl={userMenuAnchor}
          onClose={() => setUserMenuAnchor(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <UserMenuPopover />
        </Popover>
      </>
    );
  }

  // Expanded state - full user section
  return (
    <Box sx={{ mt: 'auto' }}>
      <Divider sx={{ borderColor: 'divider' }} />
      
      {/* Notification and Chat Section */}
      <Box sx={{ p: 1, display: 'flex', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <NotificationBell collapsed={false} />
        <ChatButton collapsed={false} />
      </Box>
      
      {/* User Info Section */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Avatar
          src={userAvatar}
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#3b82f6',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {userDisplayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}
          >
            {userEmail}
          </Typography>
        </Box>
      </Box>

      {/* User Menu Items */}
      <List dense sx={{ py: 0 }}>
        {/* Profile */}
        <ListItem disablePadding>
          <ListItemButton onClick={navigateToProfile}>
            <ListItemIcon sx={{ color: 'text.primary' }}>
              <ProfileIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" sx={{ color: 'text.primary' }} />
          </ListItemButton>
        </ListItem>

        {/* Settings with submenu */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setSettingsExpanded(!settingsExpanded)}>
            <ListItemIcon sx={{ color: 'text.primary' }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" sx={{ color: 'text.primary' }} />
            {settingsExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={settingsExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToPreferences} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <PreferencesIcon />
                </ListItemIcon>
                <ListItemText primary="Preferences" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToOrganization} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <OrganizationIcon />
                </ListItemIcon>
                <ListItemText primary="Organization" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToIntegrations} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <IntegrationsIcon />
                </ListItemIcon>
                <ListItemText primary="Integrations" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToDataManagement} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <DataIcon />
                </ListItemIcon>
                <ListItemText primary="Data Management" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToApiKeys} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <ApiKeyIcon />
                </ListItemIcon>
                <ListItemText primary="API Keys" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Help with submenu */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setHelpExpanded(!helpExpanded)}>
            <ListItemIcon sx={{ color: 'text.primary' }}>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Help & Support" sx={{ color: 'text.primary' }} />
            {helpExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={helpExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToDocumentation} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <DocsIcon />
                </ListItemIcon>
                <ListItemText primary="Documentation" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToGuidedTours} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <ToursIcon />
                </ListItemIcon>
                <ListItemText primary="Guided Tours" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={navigateToSupport} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ color: 'text.primary' }}>
                  <SupportIcon />
                </ListItemIcon>
                <ListItemText primary="Support" sx={{ color: 'text.primary' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Logout */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: 'text.primary' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ color: 'text.primary' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default BottomUserSection;

