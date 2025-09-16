/**
 * ReplyButton - Button to start a thread or reply to a message
 * Appears on hover over messages in the main chat
 */

import React from 'react';
import {
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Forum as ForumIcon
} from '@mui/icons-material';

interface ReplyButtonProps {
  onReply: () => void;
  hasThread?: boolean;
  size?: 'small' | 'medium';
  variant?: 'default' | 'compact';
}

export const ReplyButton: React.FC<ReplyButtonProps> = ({
  onReply,
  hasThread = false,
  size = 'small',
  variant = 'default'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const tooltipText = hasThread ? 'Reply in thread' : 'Start a thread';
  const icon = hasThread ? <ForumIcon /> : <ReplyIcon />;

  if (variant === 'compact') {
    return (
      <Tooltip title={tooltipText} placement="top">
        <IconButton
          onClick={onReply}
          size={size}
          sx={{
            width: 24,
            height: 24,
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            color: theme.palette.text.secondary,
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              borderColor: 'rgba(59, 130, 246, 0.3)',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '14px'
            }
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipText} placement="top">
      <IconButton
        onClick={onReply}
        size={size}
        sx={{
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          color: theme.palette.text.secondary,
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            transform: 'scale(1.05)',
          }
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export default ReplyButton;

