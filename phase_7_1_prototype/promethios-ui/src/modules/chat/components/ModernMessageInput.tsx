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
import { styled } from '@mui/material/styles';

// Dark theme colors matching the site
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e'
};

const InputContainer = styled(Box)(() => ({
  padding: '16px 24px 24px 24px',
  backgroundColor: DARK_THEME.surface,
  borderTop: `1px solid ${DARK_THEME.border}`,
  position: 'relative'
}));

const ModernInputBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragOver' && prop !== 'hasFiles'
})(({ isDragOver, hasFiles }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: DARK_THEME.background,
  border: `2px solid ${
    isDragOver 
      ? DARK_THEME.primary 
      : hasFiles 
        ? DARK_THEME.success
        : DARK_THEME.border
  }`,
  borderRadius: '24px',
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  
  '&:focus-within': {
    borderColor: DARK_THEME.primary,
    boxShadow: `0 0 0 3px rgba(49, 130, 206, 0.1)`
  },
  
  ...(isDragOver && {
    backgroundColor: 'rgba(49, 130, 206, 0.05)',
    transform: 'scale(1.02)'
  })
}));

const InputField = styled('textarea')(() => ({
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontSize: '14px',
  lineHeight: 1.5,
  padding: '16px 16px 8px 16px',
  resize: 'none',
  fontFamily: 'inherit',
  color: DARK_THEME.text.primary,
  minHeight: '20px',
  maxHeight: '120px',
  
  '&::placeholder': {
    color: DARK_THEME.text.secondary
  },
  
  '&::-webkit-scrollbar': {
    width: '4px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(160, 174, 192, 0.2)',
    borderRadius: '2px'
  }
}));

const InputActions = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px 8px 16px',
  gap: '8px'
}));

const FilePreviewContainer = styled(Box)(() => ({
  padding: '8px 16px 0 16px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  maxHeight: '120px',
  overflowY: 'auto',
  
  '&::-webkit-scrollbar': {
    height: '4px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(160, 174, 192, 0.2)',
    borderRadius: '2px'
  }
}));

const FilePreview = styled(Paper)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 8px',
  backgroundColor: 'rgba(49, 130, 206, 0.1)',
  border: '1px solid rgba(49, 130, 206, 0.2)',
  borderRadius: '4px',
  position: 'relative',
  maxWidth: '200px',
  
  '& .file-info': {
    flex: 1,
    minWidth: 0
  },
  
  '& .file-name': {
    fontSize: '12px',
    fontWeight: 500,
    color: DARK_THEME.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  '& .file-size': {
    fontSize: '10px',
    color: DARK_THEME.text.secondary
  }
}));

const DragOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(49, 130, 206, 0.1)',
  border: `2px dashed ${DARK_THEME.primary}`,
  borderRadius: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  zIndex: 10,
  
  '& .drag-text': {
    color: DARK_THEME.primary,
    fontWeight: 600,
    fontSize: '16px'
  },
  
  '& .drag-subtext': {
    color: DARK_THEME.text.secondary,
    fontSize: '12px'
  }
}));

const UploadProgress = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(45, 55, 72, 0.9)',
  backdropFilter: 'blur(4px)',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
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

