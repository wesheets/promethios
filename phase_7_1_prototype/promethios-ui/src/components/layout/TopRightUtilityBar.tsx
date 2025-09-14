/**
 * Top Right Utility Bar
 * Minimal icons for personal/account items that blend into the background
 * Replaces the bottom section of the left navigation
 */

import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Popover, 
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Business as OrganizationIcon,
  HelpOutline as HelpIcon,
  Logout as LogoutIcon,
  Tune as PreferencesIcon,
  Integration as IntegrationsIcon,
  Storage as DataManagementIcon,
  Key as ApiKeysIcon,
  MenuBook as DocumentationIcon,
  Tour as GuidedToursIcon,
  Support as SupportIcon
} from '@mui/icons-material';

interface TopRightUtilityBarProps {
  onLogout?: () => void;
  onProfileClick?: () => void;
  onOrganizationClick?: () => void;
  onPreferencesClick?: () => void;
  onIntegrationsClick?: () => void;
  onDataManagementClick?: () => void;
  onApiKeysClick?: () => void;
  onDocumentationClick?: () => void;
  onGuidedToursClick?: () => void;
  onSupportClick?: () => void;
}

const TopRightUtilityBar: React.FC<TopRightUtilityBarProps> = ({
  onLogout,
  onProfileClick,
  onOrganizationClick,
  onPreferencesClick,
  onIntegrationsClick,
  onDataManagementClick,
  onApiKeysClick,
  onDocumentationClick,
  onGuidedToursClick,
  onSupportClick
}) => {
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Settings popup content
  const SettingsPopup = () => (
    <Paper sx={{ p: 2, minWidth: 320, bgcolor: '#1e293b', border: '1px solid #334155' }}>
      <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 2 }}>Settings</Typography>
      
      {/* Quick Settings */}
      <FormControlLabel
        control={<Switch defaultChecked size="small" />}
        label="Dark Mode"
        sx={{ color: '#cbd5e1', mb: 1, display: 'block' }}
      />
      
      <FormControlLabel
        control={<Switch defaultChecked size="small" />}
        label="Notifications"
        sx={{ color: '#cbd5e1', mb: 1, display: 'block' }}
      />
      
      <FormControlLabel
        control={<Switch size="small" />}
        label="Auto-save Chats"
        sx={{ color: '#cbd5e1', mb: 2, display: 'block' }}
      />
      
      <Divider sx={{ bgcolor: '#334155', my: 2 }} />
      
      {/* Settings Menu Items */}
      <List dense>
        <ListItem 
          button 
          onClick={() => {
            setSettingsAnchor(null);
            onPreferencesClick?.();
          }}
        >
          <ListItemIcon><PreferencesIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="Preferences" sx={{ color: '#cbd5e1' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => {
            setSettingsAnchor(null);
            onOrganizationClick?.();
          }}
        >
          <ListItemIcon><OrganizationIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="Organization" sx={{ color: '#cbd5e1' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => {
            setSettingsAnchor(null);
            onIntegrationsClick?.();
          }}
        >
          <ListItemIcon><IntegrationsIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="Integrations" sx={{ color: '#cbd5e1' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => {
            setSettingsAnchor(null);
            onDataManagementClick?.();
          }}
        >
          <ListItemIcon><DataManagementIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="Data Management" sx={{ color: '#cbd5e1' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => {
            setSettingsAnchor(null);
            onApiKeysClick?.();
          }}
        >
          <ListItemIcon><ApiKeysIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="API Keys" sx={{ color: '#cbd5e1' }} />
        </ListItem>
      </List>
    </Paper>
  );

  // Help popup content
  const HelpPopup = () => (
    <Paper sx={{ p: 2, minWidth: 280, bgcolor: '#1e293b', border: '1px solid #334155' }}>
      <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 2 }}>Help & Support</Typography>
      
      <List dense>
        <ListItem 
          button 
          onClick={() => {
            setHelpAnchor(null);
            onDocumentationClick?.();
          }}
        >
          <ListItemIcon><DocumentationIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="Documentation" sx={{ color: '#cbd5e1' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => {
            setHelpAnchor(null);
            onGuidedToursClick?.();
          }}
        >
          <ListItemIcon><GuidedToursIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="Guided Tours" sx={{ color: '#cbd5e1' }} />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => {
            setHelpAnchor(null);
            onSupportClick?.();
          }}
        >
          <ListItemIcon><SupportIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></ListItemIcon>
          <ListItemText primary="Support" sx={{ color: '#cbd5e1' }} />
        </ListItem>
      </List>
    </Paper>
  );

  // Logout confirmation dialog
  const LogoutDialog = () => (
    <Dialog
      open={logoutDialogOpen}
      onClose={() => setLogoutDialogOpen(false)}
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          color: '#f1f5f9'
        }
      }}
    >
      <DialogTitle sx={{ color: '#f1f5f9' }}>Confirm Logout</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#cbd5e1' }}>
          Are you sure you want to logout?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setLogoutDialogOpen(false)}
          sx={{ color: '#94a3b8' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => {
            setLogoutDialogOpen(false);
            onLogout?.();
          }}
          sx={{ color: '#ef4444' }}
        >
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        position: 'absolute',
        top: 16,
        right: 200, // Move left to avoid conflict with enhancement indicators
        zIndex: 1001 // Higher z-index than enhancement indicators
      }}>
        {/* Profile Icon - Direct link to profile page */}
        <IconButton
          onClick={onProfileClick}
          sx={{ 
            color: '#94a3b8',
            '&:hover': { 
              color: '#cbd5e1',
              backgroundColor: 'rgba(148, 163, 184, 0.1)'
            },
            padding: '6px'
          }}
          size="small"
          title="Profile"
        >
          <ProfileIcon fontSize="small" />
        </IconButton>

        {/* Settings Icon */}
        <IconButton
          onClick={(e) => setSettingsAnchor(e.currentTarget)}
          sx={{ 
            color: '#94a3b8',
            '&:hover': { 
              color: '#cbd5e1',
              backgroundColor: 'rgba(148, 163, 184, 0.1)'
            },
            padding: '6px'
          }}
          size="small"
          title="Settings"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>

        {/* Help Icon */}
        <IconButton
          onClick={(e) => setHelpAnchor(e.currentTarget)}
          sx={{ 
            color: '#94a3b8',
            '&:hover': { 
              color: '#cbd5e1',
              backgroundColor: 'rgba(148, 163, 184, 0.1)'
            },
            padding: '6px'
          }}
          size="small"
          title="Help & Support"
        >
          <HelpIcon fontSize="small" />
        </IconButton>

        {/* Logout Icon */}
        <IconButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{ 
            color: '#94a3b8',
            '&:hover': { 
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)'
            },
            padding: '6px'
          }}
          size="small"
          title="Logout"
        >
          <LogoutIcon fontSize="small" />
        </IconButton>

        {/* Settings Popover */}
        <Popover
          open={Boolean(settingsAnchor)}
          anchorEl={settingsAnchor}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <SettingsPopup />
        </Popover>

        {/* Help Popover */}
        <Popover
          open={Boolean(helpAnchor)}
          anchorEl={helpAnchor}
          onClose={() => setHelpAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <HelpPopup />
        </Popover>
      </Box>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog />
    </>
  );
};

export default TopRightUtilityBar;

