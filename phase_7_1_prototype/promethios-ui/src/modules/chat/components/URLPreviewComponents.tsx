/**
 * URL Preview Components for enhanced message input
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

interface URLPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  error?: string;
}

interface URLPreviewProps {
  url: string;
  onRemove?: () => void;
  compact?: boolean;
}

export const URLPreview: React.FC<URLPreviewProps> = ({
  url,
  onRemove,
  compact = false
}) => {
  const [previewData, setPreviewData] = useState<URLPreviewData>({ url });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchURLPreview(url);
  }, [url]);

  const fetchURLPreview = async (targetUrl: string) => {
    setLoading(true);
    
    try {
      // Simulate URL preview fetching (in real app, this would call a backend service)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Mock preview data based on URL patterns
      const mockPreviewData = generateMockPreview(targetUrl);
      setPreviewData(mockPreviewData);
    } catch (error) {
      setPreviewData({
        url: targetUrl,
        error: 'Failed to load preview'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockPreview = (targetUrl: string): URLPreviewData => {
    const domain = extractDomain(targetUrl);
    
    // Generate mock data based on common domains
    if (domain.includes('github')) {
      return {
        url: targetUrl,
        title: 'GitHub Repository',
        description: 'A software development platform for version control and collaboration.',
        siteName: 'GitHub',
        image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
      };
    } else if (domain.includes('youtube')) {
      return {
        url: targetUrl,
        title: 'YouTube Video',
        description: 'Watch videos and discover content on YouTube.',
        siteName: 'YouTube',
        image: 'https://www.youtube.com/img/desktop/yt_1200.png'
      };
    } else if (domain.includes('wikipedia')) {
      return {
        url: targetUrl,
        title: 'Wikipedia Article',
        description: 'Free encyclopedia with information on various topics.',
        siteName: 'Wikipedia'
      };
    } else {
      return {
        url: targetUrl,
        title: `${domain} - Web Page`,
        description: `Content from ${domain}`,
        siteName: domain
      };
    }
  };

  const extractDomain = (targetUrl: string): string => {
    try {
      return new URL(targetUrl).hostname;
    } catch {
      return 'unknown';
    }
  };

  const handleOpenURL = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Card sx={{ maxWidth: compact ? 300 : 400, mb: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LinkIcon fontSize="small" />
            <Skeleton variant="text" width="60%" />
            {onRemove && (
              <IconButton size="small" onClick={onRemove} sx={{ ml: 'auto' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Skeleton variant="rectangular" height={compact ? 60 : 120} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </Card>
    );
  }

  if (previewData.error) {
    return (
      <Alert 
        severity="warning" 
        sx={{ maxWidth: compact ? 300 : 400, mb: 1 }}
        action={
          onRemove && (
            <IconButton size="small" onClick={onRemove}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon fontSize="small" />
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {url}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {previewData.error}
        </Typography>
      </Alert>
    );
  }

  return (
    <Card 
      sx={{ 
        maxWidth: compact ? 300 : 400, 
        mb: 1,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 2
        }
      }}
      onClick={handleOpenURL}
    >
      {previewData.image && !compact && (
        <CardMedia
          component="img"
          height="120"
          image={previewData.image}
          alt={previewData.title}
          sx={{ objectFit: 'cover' }}
        />
      )}
      
      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <LinkIcon fontSize="small" color="primary" />
              {previewData.siteName && (
                <Typography variant="caption" color="text.secondary">
                  {previewData.siteName}
                </Typography>
              )}
              <OpenInNewIcon fontSize="small" color="action" />
            </Box>
            
            {previewData.title && (
              <Typography 
                variant={compact ? "body2" : "subtitle2"} 
                fontWeight="medium"
                sx={{ 
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: compact ? 1 : 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {previewData.title}
              </Typography>
            )}
            
            {previewData.description && !compact && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {previewData.description}
              </Typography>
            )}
            
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                mt: 0.5,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {extractDomain(url)}
            </Typography>
          </Box>
          
          {onRemove && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              sx={{ mt: -0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

interface URLPreviewListProps {
  urls: string[];
  onRemoveURL?: (url: string) => void;
  compact?: boolean;
}

export const URLPreviewList: React.FC<URLPreviewListProps> = ({
  urls,
  onRemoveURL,
  compact = false
}) => {
  if (urls.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        URL Previews ({urls.length}):
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {urls.map((url, index) => (
          <URLPreview
            key={`${url}-${index}`}
            url={url}
            onRemove={onRemoveURL ? () => onRemoveURL(url) : undefined}
            compact={compact}
          />
        ))}
      </Box>
    </Box>
  );
};

export default URLPreview;

