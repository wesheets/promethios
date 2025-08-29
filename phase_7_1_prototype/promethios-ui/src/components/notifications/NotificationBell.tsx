import React, { useState } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationSidebar from './NotificationSidebar';

/**
 * NotificationBell - A notification bell component for the left navigation
 * 
 * Shows a notification bell with a badge indicating unread notifications.
 * Opens a notification sidebar when clicked.
 */
const NotificationBell: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  if (collapsed) {
    return (
      <>
        <Tooltip title="Notifications" placement="right" arrow>
          <IconButton 
            onClick={handleOpenSidebar}
            sx={{ 
              color: 'white', 
              width: '100%', 
              mb: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <NotificationSidebar 
          open={sidebarOpen} 
          onClose={handleCloseSidebar} 
          anchor="right"
        />
      </>
    );
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpenSidebar}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
          {!collapsed && <span style={{ marginLeft: '8px', fontSize: '14px' }}>
            Notifications
          </span>}
        </IconButton>
      </Tooltip>
      <NotificationSidebar 
        open={sidebarOpen} 
        onClose={handleCloseSidebar} 
        anchor="right"
      />
    </>
  );
};

export default NotificationBell;

