/**
 * AttachmentRenderer.tsx
 * 
 * Component for rendering attachments in a clean, organized way
 * Supports different file types with appropriate icons and actions
 */

import React from 'react';
import {
  Box,
  Button,
  Chip,
  Typography,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Description as DocumentIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  GetApp as DownloadIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';

interface Attachment {
  id?: string;
  name: string;
  type?: string;
  url?: string;
  size?: number;
  download_url?: string;
}

interface AttachmentRendererProps {
  attachments: Attachment[];
  sx?: any;
}

const AttachmentRenderer: React.FC<AttachmentRendererProps> = ({ attachments, sx = {} }) => {
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension) || mimeType?.startsWith('image/')) {
      return <ImageIcon sx={{ color: '#10b981' }} />;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension) || mimeType?.startsWith('video/')) {
      return <VideoIcon sx={{ color: '#f59e0b' }} />;
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension) || mimeType?.startsWith('audio/')) {
      return <AudioIcon sx={{ color: '#8b5cf6' }} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <ArchiveIcon sx={{ color: '#6b7280' }} />;
    }
    return <DocumentIcon sx={{ color: '#3b82f6' }} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDownload = (attachment: Attachment) => {
    const downloadUrl = attachment.download_url || attachment.url;
    if (downloadUrl) {
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpen = (attachment: Attachment) => {
    const url = attachment.url || attachment.download_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, ...sx }}>
      {/* Attachments Header */}
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#9ca3af', 
          fontSize: '0.75rem',
          fontWeight: 500,
          mb: 1,
          display: 'block'
        }}
      >
        📎 Attachments ({attachments.length})
      </Typography>

      {/* Attachments List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {attachments.map((attachment, index) => (
          <Paper
            key={attachment.id || index}
            sx={{
              p: 2,
              bgcolor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#374151',
                borderColor: '#4b5563'
              }
            }}
          >
            {/* File Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '24px' }}>
              {getFileIcon(attachment.name, attachment.type)}
            </Box>

            {/* File Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {attachment.name}
              </Typography>
              {attachment.size && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#9ca3af',
                    fontSize: '0.75rem'
                  }}
                >
                  {formatFileSize(attachment.size)}
                </Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={() => handleDownload(attachment)}
                  sx={{
                    color: '#3b82f6',
                    '&:hover': {
                      bgcolor: 'rgba(59, 130, 246, 0.1)'
                    }
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Open">
                <IconButton
                  size="small"
                  onClick={() => handleOpen(attachment)}
                  sx={{
                    color: '#10b981',
                    '&:hover': {
                      bgcolor: 'rgba(16, 185, 129, 0.1)'
                    }
                  }}
                >
                  <OpenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default AttachmentRenderer;

