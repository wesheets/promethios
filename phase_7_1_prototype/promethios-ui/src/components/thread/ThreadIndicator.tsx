/**
 * ThreadIndicator - Shows thread reply count and opens thread view
 * Displays on messages that have threads in the main chat
 */

import React from 'react';
import {
  Box,
  Chip,
  Avatar,
  AvatarGroup,
  Typography,
  useTheme
} from '@mui/material';
import {
  Forum as ForumIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { ThreadInfo } from '../../types/Thread';

interface ThreadIndicatorProps {
  threadInfo: ThreadInfo;
  onClick: () => void;
  compact?: boolean;
}

export const ThreadIndicator: React.FC<ThreadIndicatorProps> = ({
  threadInfo,
  onClick,
  compact = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const formatReplyCount = (count: number): string => {
    if (count === 1) return '1 reply';
    return `${count} replies`;
  };

  const formatLastReplyTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (compact) {
    return (
      <Chip
        icon={<ReplyIcon sx={{ fontSize: '14px' }} />}
        label={threadInfo.replyCount}
        size="small"
        onClick={onClick}
        sx={{
          height: 20,
          fontSize: '11px',
          bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
          }
        }}
      />
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mt: 1,
        p: 1,
        borderRadius: 2,
        bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
        }
      }}
    >
      <ForumIcon 
        sx={{ 
          fontSize: '16px', 
          color: '#3b82f6' 
        }} 
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#3b82f6', 
            fontWeight: 600,
            fontSize: '12px'
          }}
        >
          {formatReplyCount(threadInfo.replyCount)}
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '11px'
          }}
        >
          • Last reply {formatLastReplyTime(threadInfo.lastReplyAt)}
        </Typography>
      </Box>

      {threadInfo.participants.length > 0 && (
        <AvatarGroup 
          max={3} 
          sx={{ 
            ml: 'auto',
            '& .MuiAvatar-root': {
              width: 16,
              height: 16,
              fontSize: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }
          }}
        >
          {(threadInfo.participants || []).slice(0, 3).map((participantId, index) => (
            <Avatar 
              key={participantId}
              sx={{ 
                bgcolor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                color: 'white'
              }}
            >
              {participantId.charAt(0).toUpperCase()}
            </Avatar>
          ))}
        </AvatarGroup>
      )}
    </Box>
  );
};

export default ThreadIndicator;

