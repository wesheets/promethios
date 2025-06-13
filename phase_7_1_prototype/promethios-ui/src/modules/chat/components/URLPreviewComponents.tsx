import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Link,
  Skeleton,
  Alert,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Link as LinkIcon,
  OpenInNew as OpenIcon,
  Close as CloseIcon,
  Language as WebIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { MessageAttachment, AttachmentType } from '../types';
import { FileUploadService } from '../services/FileUploadService';

interface URLPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain: string;
  favicon?: string;
  type?: 'website' | 'image' | 'video' | 'article';
  error?: string;
}

interface URLPreviewCardProps {
  url: string;
  onRemove?: () => void;
  compact?: boolean;
  autoLoad?: boolean;
}

export const URLPreviewCard: React.FC<URLPreviewCardProps> = ({
  url,
  onRemove,
  compact = false,
  autoLoad = true
}) => {
  const [preview, setPreview] = useState<URLPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoLoad && url) {
      loadPreview();
    }
  }, [url, autoLoad]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the FileUploadService to extract basic URL info
      const basicPreview = await FileUploadService.extractUrlPreview(url);
      
      // Enhanced preview with additional metadata
      const enhancedPreview: URLPreview = {
        url,
        ...basicPreview,
        type: detectUrlType(url),
        favicon: `https://www.google.com/s2/favicons?domain=${basicPreview.domain}&sz=32`
      };
      
      setPreview(enhancedPreview);
    } catch (err) {
      setError('Failed to load URL preview');
      setPreview({
        url,
        domain: 'Unknown',
        title: url,
        error: 'Failed to load preview'
      });
    } finally {
      setLoading(false);
    }
  };

  const detectUrlType = (url: string): URLPreview['type'] => {
    const urlLower = url.toLowerCase();
    
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      return 'image';
    }
    
    if (urlLower.match(/\.(mp4|webm|ogg|avi|mov)$/)) {
      return 'video';
    }
    
    if (urlLower.includes('youtube.com') || urlLower.includes('vimeo.com')) {
      return 'video';
    }
    
    if (urlLower.includes('medium.com') || urlLower.includes('blog') || urlLower.includes('article')) {
      return 'article';
    }
    
    return 'website';
  };

  const getTypeIcon = (type?: URLPreview['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      case 'article':
        return <ArticleIcon />;
      default:
        return <WebIcon />;
    }
  };

  const getTypeColor = (type?: URLPreview['type']) => {
    switch (type) {
      case 'image':
        return '#4CAF50';
      case 'video':
        return '#F44336';
      case 'article':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  if (loading) {
    return (
      <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </Box>
        {onRemove && (
          <IconButton size="small" onClick={onRemove}>
            <CloseIcon />
          </IconButton>
        )}
      </Paper>
    );
  }

  if (error && !preview) {
    return (
      <Alert 
        severity="error" 
        action={
          onRemove && (
            <IconButton size="small" onClick={onRemove}>
              <CloseIcon />
            </IconButton>
          )
        }
      >
        {error}
      </Alert>
    );
  }

  if (!preview) return null;

  if (compact) {
    return (
      <Chip
        icon={getTypeIcon(preview.type)}
        label={preview.domain}
        onDelete={onRemove}
        onClick={() => window.open(url, '_blank')}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiChip-icon': {
            color: getTypeColor(preview.type)
          }
        }}
      />
    );
  }

  return (
    <Fade in={true}>
      <Paper
        elevation={2}
        sx={{
          display: 'flex',
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            elevation: 4,
            borderColor: 'primary.main'
          }
        }}
        onClick={() => window.open(url, '_blank')}
      >
        {/* Preview Image */}
        {preview.image && (
          <Box
            component="img"
            src={preview.image}
            alt={preview.title}
            sx={{
              width: 120,
              height: 80,
              objectFit: 'cover',
              flexShrink: 0
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Content */}
        <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={preview.favicon}
              sx={{ 
                width: 20, 
                height: 20, 
                mr: 1,
                bgcolor: getTypeColor(preview.type)
              }}
            >
              {React.cloneElement(getTypeIcon(preview.type), { sx: { fontSize: 12 } })}
            </Avatar>
            
            <Typography variant="caption" color="text.secondary" noWrap>
              {preview.domain}
            </Typography>
            
            <Chip
              label={preview.type}
              size="small"
              sx={{
                ml: 1,
                height: 16,
                fontSize: '0.6rem',
                bgcolor: getTypeColor(preview.type),
                color: 'white'
              }}
            />
          </Box>

          {/* Title */}
          <Typography 
            variant="body2" 
            fontWeight="bold" 
            sx={{ 
              mb: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {preview.title || 'No title available'}
          </Typography>

          {/* Description */}
          {preview.description && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {preview.description}
            </Typography>
          )}

          {/* URL */}
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {url.length > 50 ? `${url.substring(0, 50)}...` : url}
          </Link>

          {/* Error indicator */}
          {preview.error && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ErrorIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
              <Typography variant="caption" color="warning.main">
                {preview.error}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Open in new tab">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank');
              }}
            >
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {onRemove && (
            <Tooltip title="Remove URL">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                sx={{
                  '&:hover': {
                    bgcolor: 'error.light',
                    color: 'error.contrastText'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

interface URLDetectorProps {
  text: string;
  onUrlDetected: (urls: string[]) => void;
  autoDetect?: boolean;
}

export const URLDetector: React.FC<URLDetectorProps> = ({
  text,
  onUrlDetected,
  autoDetect = true
}) => {
  useEffect(() => {
    if (autoDetect && text) {
      const urls = FileUploadService.detectUrls(text);
      if (urls.length > 0) {
        onUrlDetected(urls);
      }
    }
  }, [text, onUrlDetected, autoDetect]);

  return null; // This is a utility component with no UI
};

interface URLAttachmentManagerProps {
  urls: string[];
  onRemoveUrl: (url: string) => void;
  compact?: boolean;
  maxDisplay?: number;
}

export const URLAttachmentManager: React.FC<URLAttachmentManagerProps> = ({
  urls,
  onRemoveUrl,
  compact = false,
  maxDisplay = 3
}) => {
  const displayUrls = urls.slice(0, maxDisplay);
  const remainingCount = urls.length - maxDisplay;

  if (urls.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {displayUrls.map((url, index) => (
        <URLPreviewCard
          key={`${url}-${index}`}
          url={url}
          onRemove={() => onRemoveUrl(url)}
          compact={compact}
        />
      ))}
      
      {remainingCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          +{remainingCount} more URL{remainingCount > 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};

// Utility function to create URL attachment from URL string
export const createUrlAttachment = (url: string): MessageAttachment => {
  return FileUploadService.createUrlAttachment(url);
};

// Utility function to validate URL
export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Utility function to normalize URL (add protocol if missing)
export const normalizeUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

