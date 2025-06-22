import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Paper,
  LinearProgress,
  Alert,
  Fade,
  Zoom,
  Collapse
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  VideoFile as VideoFileIcon,
  AudioFile as AudioFileIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  ContentPaste as PasteIcon,
  CameraAlt as CameraIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3, 3),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  position: 'relative'
}));

const ModernInputBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragOver' && prop !== 'hasFiles'
})(({ theme, isDragOver, hasFiles }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  border: `2px solid ${
    isDragOver 
      ? theme.palette.primary.main 
      : hasFiles 
        ? theme.palette.secondary.main
        : theme.palette.divider
  }`,
  borderRadius: '24px',
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  
  '&:focus-within': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
  },
  
  ...(isDragOver && {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: 'scale(1.02)'
  })
}));

const InputField = styled('textarea')(({ theme }) => ({
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontSize: '14px',
  lineHeight: 1.5,
  padding: theme.spacing(2, 2, 1, 2),
  resize: 'none',
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.primary,
  minHeight: '20px',
  maxHeight: '120px',
  
  '&::placeholder': {
    color: theme.palette.text.secondary
  },
  
  '&::-webkit-scrollbar': {
    width: '4px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.text.secondary, 0.2),
    borderRadius: '2px'
  }
}));

const InputActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2, 1, 2),
  gap: theme.spacing(1)
}));

const FilePreviewContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2, 0, 2),
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  maxHeight: '120px',
  overflowY: 'auto',
  
  '&::-webkit-scrollbar': {
    height: '4px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.text.secondary, 0.2),
    borderRadius: '2px'
  }
}));

const FilePreview = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  maxWidth: '200px',
  
  '& .file-info': {
    flex: 1,
    minWidth: 0
  },
  
  '& .file-name': {
    fontSize: '12px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  '& .file-size': {
    fontSize: '10px',
    color: theme.palette.text.secondary
  }
}));

const DragOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  zIndex: 10,
  
  '& .drag-text': {
    color: theme.palette.primary.main,
    fontWeight: 600,
    fontSize: '16px'
  },
  
  '& .drag-subtext': {
    color: theme.palette.text.secondary,
    fontSize: '12px'
  }
}));

const UploadProgress = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(4px)',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  zIndex: 20
}));

interface FileAttachment {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'document';
  preview?: string;
  uploadProgress?: number;
}

interface ModernMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

export const ModernMessageInput: React.FC<ModernMessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  maxFiles = 5,
  maxFileSize = 10,
  acceptedFileTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt']
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Handle file type detection
  const getFileType = (file: File): FileAttachment['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  // Handle file size formatting
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file validation
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }
    
    const isValidType = acceptedFileTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.name.toLowerCase().endsWith(type);
    });
    
    if (!isValidType) {
      return 'File type not supported';
    }
    
    return null;
  };

  // Handle file processing
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (attachments.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }

      const attachment: FileAttachment = {
        id: `file_${Date.now()}_${i}`,
        file,
        type: getFileType(file)
      };

      // Generate preview for images
      if (attachment.type === 'image') {
        try {
          const preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          attachment.preview = preview;
        } catch (error) {
          console.error('Error generating preview:', error);
        }
      }

      newAttachments.push(attachment);
      setUploadProgress(((i + 1) / fileArray.length) * 100);
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
    setUploadProgress(0);
  }, [attachments.length, maxFiles, maxFileSize, acceptedFileTypes]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // Handle file input
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    if ((!value.trim() && attachments.length === 0) || disabled || isUploading) return;
    
    onSend(value, attachments);
    setAttachments([]);
    setError(null);
  }, [value, attachments, disabled, isUploading, onSend]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Get file icon
  const getFileIcon = (type: FileAttachment['type']) => {
    switch (type) {
      case 'image': return <ImageIcon fontSize="small" />;
      case 'video': return <VideoFileIcon fontSize="small" />;
      case 'audio': return <AudioFileIcon fontSize="small" />;
      default: return <FileIcon fontSize="small" />;
    }
  };

  return (
    <InputContainer>
      {/* Error Alert */}
      <Collapse in={!!error}>
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Collapse>

      {/* Main Input Box */}
      <ModernInputBox
        isDragOver={isDragOver}
        hasFiles={attachments.length > 0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Upload Progress Overlay */}
        {isUploading && (
          <UploadProgress>
            <Typography variant="body2">Uploading files...</Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ width: '100%' }}
            />
          </UploadProgress>
        )}

        {/* Drag Over Overlay */}
        {isDragOver && (
          <DragOverlay>
            <FolderIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography className="drag-text">
              Drop files here
            </Typography>
            <Typography className="drag-subtext">
              Images, videos, audio, and documents supported
            </Typography>
          </DragOverlay>
        )}

        {/* File Previews */}
        {attachments.length > 0 && (
          <FilePreviewContainer>
            {attachments.map((attachment) => (
              <Zoom in key={attachment.id}>
                <FilePreview>
                  {attachment.preview ? (
                    <img 
                      src={attachment.preview} 
                      alt={attachment.file.name}
                      style={{ 
                        width: 24, 
                        height: 24, 
                        objectFit: 'cover', 
                        borderRadius: 4 
                      }}
                    />
                  ) : (
                    getFileIcon(attachment.type)
                  )}
                  
                  <Box className="file-info">
                    <Typography className="file-name">
                      {attachment.file.name}
                    </Typography>
                    <Typography className="file-size">
                      {formatFileSize(attachment.file.size)}
                    </Typography>
                  </Box>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => removeAttachment(attachment.id)}
                    sx={{ p: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </FilePreview>
              </Zoom>
            ))}
          </FilePreviewContainer>
        )}

        {/* Text Input */}
        <InputField
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          rows={1}
        />

        {/* Input Actions */}
        <InputActions>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* File Upload */}
            <Tooltip title="Attach files">
              <IconButton 
                size="small" 
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                <AttachFileIcon />
              </IconButton>
            </Tooltip>

            {/* Image Upload */}
            <Tooltip title="Upload image">
              <IconButton 
                size="small" 
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.click();
                  }
                }}
                disabled={disabled || isUploading}
              >
                <CameraIcon />
              </IconButton>
            </Tooltip>

            {/* Paste Indicator */}
            {navigator.clipboard && (
              <Tooltip title="Paste from clipboard">
                <IconButton size="small" disabled>
                  <PasteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Character/File Count */}
            <Typography variant="caption" color="text.secondary">
              {attachments.length > 0 && `${attachments.length}/${maxFiles} files`}
              {value.length > 0 && attachments.length > 0 && ' • '}
              {value.length > 0 && `${value.length} chars`}
            </Typography>

            {/* Send Button */}
            <Tooltip title="Send message (Enter)">
              <span>
                <IconButton 
                  color="primary"
                  onClick={handleSend}
                  disabled={(!value.trim() && attachments.length === 0) || disabled || isUploading}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    },
                    '&:disabled': {
                      bgcolor: 'action.disabled',
                      color: 'action.disabled'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </InputActions>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </ModernInputBox>
    </InputContainer>
  );
};

export default ModernMessageInput;

