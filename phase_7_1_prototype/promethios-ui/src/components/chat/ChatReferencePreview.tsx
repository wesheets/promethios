import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Card,
  CardContent,
  Fade,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Chat as ChatIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon
} from '@mui/icons-material';

interface ChatReferenceData {
  id: string;
  name: string;
  preview: string;
  messageCount: number;
  lastUpdated: Date;
  topics?: string[];
}

interface ChatReferencePreviewProps {
  chatReference: ChatReferenceData | null;
  onDismiss: () => void;
}

const ChatReferencePreview: React.FC<ChatReferencePreviewProps> = ({
  chatReference,
  onDismiss
}) => {
  if (!chatReference) return null;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Fade in={true} timeout={300}>
      <Card
        sx={{
          mb: 2,
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            borderColor: '#3b82f6',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CardContent sx={{ p: 3, pb: '16px !important' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#3b82f6',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Chat Reference
              </Typography>
            </Box>
            
            <Tooltip title="Remove reference">
              <IconButton
                onClick={onDismiss}
                size="small"
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    color: '#ef4444',
                    bgcolor: 'rgba(239, 68, 68, 0.1)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Chat Name */}
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 500,
              mb: 1,
              fontSize: '1rem',
              lineHeight: 1.3
            }}
          >
            {chatReference.name}
          </Typography>

          {/* Preview Text */}
          <Typography
            variant="body2"
            sx={{
              color: '#94a3b8',
              mb: 2,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontStyle: 'italic'
            }}
          >
            "{chatReference.preview}"
          </Typography>

          {/* Metadata */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MessageIcon sx={{ color: '#64748b', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {chatReference.messageCount} message{chatReference.messageCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ color: '#64748b', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {formatTimeAgo(chatReference.lastUpdated)}
              </Typography>
            </Box>
          </Box>

          {/* Topics */}
          {chatReference.topics && chatReference.topics.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {chatReference.topics.slice(0, 3).map((topic, index) => (
                <Chip
                  key={index}
                  label={topic}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    fontSize: '0.75rem',
                    height: '24px',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              ))}
              {chatReference.topics.length > 3 && (
                <Chip
                  label={`+${chatReference.topics.length - 3} more`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(100, 116, 139, 0.1)',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    height: '24px',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              )}
            </Box>
          )}
        </CardContent>

        {/* Subtle gradient border effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
            opacity: 0.6
          }}
        />
      </Card>
    </Fade>
  );
};

export default ChatReferencePreview;

