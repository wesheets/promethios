import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  TableChart as SpreadsheetIcon,
  Description as DocumentIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { MessageAttachment, AttachmentType } from '../types';
import { FileUploadService } from '../services/FileUploadService';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onError: (error: string) => void;
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  onError,
  allowedTypes = [],
  maxFileSize = 10 * 1024 * 1024,
  maxFiles = 5,
  disabled = false,
  children
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check file count
      if (validFiles.length >= maxFiles) {
        onError(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Check file size
      if (file.size > maxFileSize) {
        onError(`File "${file.name}" exceeds maximum size of ${FileUploadService.formatFileSize(maxFileSize)}`);
        continue;
      }

      // Check file type
      if (allowedTypes.length > 0 && !FileUploadService.isFileTypeSupported(file.type)) {
        onError(`File type "${file.type}" is not supported`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }, [maxFileSize, maxFiles, allowedTypes, onError]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [disabled, validateFiles, onFilesSelected]);

  return (
    <Box
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: children ? 'auto' : 120,
        border: 2,
        borderStyle: 'dashed',
        borderColor: isDragOver ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: isDragOver ? 'primary.light' : 'transparent',
        opacity: isDragOver ? 0.8 : 1,
        transition: 'all 0.2s ease-in-out',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        p: 2
      }}
    >
      {children || (
        <>
          <UploadIcon 
            sx={{ 
              fontSize: 48, 
              color: isDragOver ? 'primary.main' : 'text.secondary',
              mb: 1
            }} 
          />
          <Typography 
            variant="body1" 
            color={isDragOver ? 'primary.main' : 'text.secondary'}
            textAlign="center"
          >
            {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            or click to browse
          </Typography>
        </>
      )}
      
      {isDragOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'primary.main',
            opacity: 0.1,
            borderRadius: 2,
            pointerEvents: 'none'
          }}
        />
      )}
    </Box>
  );
};

interface FilePreviewProps {
  attachment: MessageAttachment;
  onRemove?: (attachmentId: string) => void;
  showProgress?: boolean;
  progress?: number;
  compact?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  attachment,
  onRemove,
  showProgress = false,
  progress = 0,
  compact = false
}) => {
  const getFileIcon = () => {
    switch (attachment.type) {
      case AttachmentType.IMAGE:
        return <ImageIcon />;
      case AttachmentType.PDF:
        return <PdfIcon />;
      case AttachmentType.SPREADSHEET:
        return <SpreadsheetIcon />;
      case AttachmentType.DOCUMENT:
        return <DocumentIcon />;
      case AttachmentType.URL:
        return <LinkIcon />;
      default:
        return <FileIcon />;
    }
  };

  const getFileColor = () => {
    switch (attachment.type) {
      case AttachmentType.IMAGE:
        return '#4CAF50';
      case AttachmentType.PDF:
        return '#F44336';
      case AttachmentType.SPREADSHEET:
        return '#2196F3';
      case AttachmentType.DOCUMENT:
        return '#FF9800';
      case AttachmentType.URL:
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  if (compact) {
    return (
      <Chip
        icon={getFileIcon()}
        label={`${attachment.name} (${FileUploadService.formatFileSize(attachment.size)})`}
        onDelete={onRemove ? () => onRemove(attachment.id) : undefined}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiChip-icon': {
            color: getFileColor()
          }
        }}
      />
    );
  }

  return (
    <Zoom in={true}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
          border: 1,
          borderColor: 'divider'
        }}
      >
        {/* File Icon */}
        <Box
          sx={{
            bgcolor: getFileColor(),
            borderRadius: 1,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 40,
            height: 40
          }}
        >
          {React.cloneElement(getFileIcon(), { sx: { color: 'white' } })}
        </Box>

        {/* File Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight="bold" noWrap>
            {attachment.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {FileUploadService.formatFileSize(attachment.size)} • {attachment.type}
          </Typography>
          
          {/* Progress Bar */}
          {showProgress && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 4, borderRadius: 2 }}
              />
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}% uploaded
              </Typography>
            </Box>
          )}
        </Box>

        {/* Image Preview */}
        {FileUploadService.isDisplayableImage(attachment) && (
          <Box
            component="img"
            src={attachment.url}
            alt={attachment.name}
            sx={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider'
            }}
          />
        )}

        {/* Remove Button */}
        {onRemove && (
          <Tooltip title="Remove file">
            <IconButton
              size="small"
              onClick={() => onRemove(attachment.id)}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.contrastText'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        )}
      </Paper>
    </Zoom>
  );
};

interface AttachmentGalleryProps {
  attachments: MessageAttachment[];
  onRemove?: (attachmentId: string) => void;
  onPreview?: (attachment: MessageAttachment) => void;
  compact?: boolean;
  maxDisplay?: number;
}

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({
  attachments,
  onRemove,
  onPreview,
  compact = false,
  maxDisplay = 3
}) => {
  const displayAttachments = attachments.slice(0, maxDisplay);
  const remainingCount = attachments.length - maxDisplay;

  if (attachments.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {displayAttachments.map((attachment) => (
        <Box
          key={attachment.id}
          onClick={() => onPreview?.(attachment)}
          sx={{ cursor: onPreview ? 'pointer' : 'default' }}
        >
          <FilePreview
            attachment={attachment}
            onRemove={onRemove}
            compact={compact}
          />
        </Box>
      ))}
      
      {remainingCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          +{remainingCount} more file{remainingCount > 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};

interface ClipboardPasteAreaProps {
  onPaste: (event: ClipboardEvent) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const ClipboardPasteArea: React.FC<ClipboardPasteAreaProps> = ({
  onPaste,
  children,
  disabled = false
}) => {
  const [showPasteHint, setShowPasteHint] = useState(false);

  React.useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (disabled) return;
      onPaste(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        setShowPasteHint(true);
        setTimeout(() => setShowPasteHint(false), 2000);
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPaste, disabled]);

  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      
      <Fade in={showPasteHint}>
        <Alert
          severity="info"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            minWidth: 200
          }}
        >
          Paste detected! Images will be uploaded automatically.
        </Alert>
      </Fade>
    </Box>
  );
};

