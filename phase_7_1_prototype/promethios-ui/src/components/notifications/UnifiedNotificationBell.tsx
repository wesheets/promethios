/**
 * Unified Notification Bell
 * 
 * Single notification bell that shows total count across all interaction types
 * and opens the UnifiedNotificationCenter
 */

import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Tooltip,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  Notifications,
  NotificationsActive
} from '@mui/icons-material';

import { useUserInteractions } from '../../hooks/useUserInteractions';
import UnifiedNotificationCenter from './UnifiedNotificationCenter';

interface UnifiedNotificationBellProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
  showTooltip?: boolean;
  popoverWidth?: number;
  popoverMaxHeight?: number;
}

export const UnifiedNotificationBell: React.FC<UnifiedNotificationBellProps> = ({
  size = 'medium',
  color = 'inherit',
  showTooltip = true,
  popoverWidth = 480,
  popoverMaxHeight = 600
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  
  const {
    pendingInteractions,
    loading
  } = useUserInteractions();

  const totalNotifications = pendingInteractions.length;
  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const bellIcon = totalNotifications > 0 ? <NotificationsActive /> : <Notifications />;

  const button = (
    <IconButton
      onClick={handleClick}
      size={size}
      color={color}
      sx={{
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
          bgcolor: alpha(theme.palette.primary.main, 0.08)
        },
        ...(totalNotifications > 0 && {
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
            },
            '50%': {
              transform: 'scale(1.05)',
            },
            '100%': {
              transform: 'scale(1)',
            },
          }
        })
      }}
    >
      <Badge
        badgeContent={totalNotifications}
        color="error"
        max={99}
        overlap="circular"
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.75rem',
            minWidth: 18,
            height: 18,
            borderRadius: '9px',
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[2]
          }
        }}
      >
        {bellIcon}
      </Badge>
    </IconButton>
  );

  return (
    <>
      {showTooltip ? (
        <Tooltip 
          title={
            loading 
              ? 'Loading notifications...' 
              : totalNotifications === 0 
                ? 'No new notifications' 
                : `${totalNotifications} new notification${totalNotifications === 1 ? '' : 's'}`
          }
          arrow
        >
          {button}
        </Tooltip>
      ) : (
        button
      )}

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: popoverWidth,
            maxHeight: popoverMaxHeight,
            mt: 1,
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
          }
        }}
      >
        <UnifiedNotificationCenter
          open={isOpen}
          onClose={handleClose}
          maxHeight={popoverMaxHeight - 20}
        />
      </Popover>
    </>
  );
};

export default UnifiedNotificationBell;

