import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Share as ShareIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

interface ShareButtonProps {
  entityType: string;
  entityId: string;
  publicUrl?: string;
  embeddedUrl?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
}

/**
 * Universal share button that provides sharing options for any entity
 * Automatically generates public and embedded URLs for sharing
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  entityType,
  entityId,
  publicUrl,
  embeddedUrl,
  title = 'Share',
  size = 'small',
  variant = 'icon'
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const open = Boolean(anchorEl);

  // Generate URLs if not provided
  const defaultPublicUrl = publicUrl || `${window.location.origin}/ui/social/${entityType}/${entityId}`;
  const defaultEmbeddedUrl = embeddedUrl || `${window.location.origin}/ui/collaborations?view=social&${entityType}=${entityId}`;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage(message);
      setShowToast(true);
      handleClose();
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setToastMessage('Failed to copy link');
      setShowToast(true);
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
    handleClose();
  };

  return (
    <>
      <Tooltip title={title}>
        <IconButton
          size={size}
          onClick={handleClick}
          aria-label="share"
          aria-controls={open ? 'share-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <ShareIcon fontSize={size} />
        </IconButton>
      </Tooltip>

      <Menu
        id="share-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'share-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => copyToClipboard(defaultPublicUrl, 'Public link copied! Anyone can view this.')}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy Public Link" secondary="Works for everyone" />
        </MenuItem>

        <MenuItem onClick={() => copyToClipboard(defaultEmbeddedUrl, 'Spark link copied! Opens in collaboration panel.')}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy Spark Link" secondary="Opens in panel" />
        </MenuItem>

        <MenuItem onClick={() => openInNewTab(defaultPublicUrl)}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Open in New Tab" secondary="Standalone view" />
        </MenuItem>
      </Menu>

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowToast(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

