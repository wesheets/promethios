import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Collapse,
  Fade
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  ContentPaste as PasteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { MessageAttachment, AttachmentType } from '../types';
import { FileUploadService } from '../services/FileUploadService';
import { 
  FileDropZone, 
  FilePreview, 
  AttachmentGallery, 
  ClipboardPasteArea 
} from './FileUploadComponents';
import { 
  URLPreviewCard, 
  URLDetector, 
  URLAttachmentManager,
  createUrlAttachment,
  isValidUrl,
  normalizeUrl
} from './URLPreviewComponents';

interface EnhancedMessageInputProps {
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  allowFileUploads?: boolean;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  userId: string;
  sessionId: string;
  compact?: boolean;
}

export const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type your message...',
  allowFileUploads = true,
  allowedFileTypes = [],
  maxFileSize = 10 * 1024 * 1024,
  userId,
  sessionId,
  compact = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (onTyping) {
      if (message.trim()) {
        onTyping(true);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 1000);
      } else {
        onTyping(false);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, onTyping]);

  // Show attachments panel when there are attachments or URLs
  useEffect(() => {
    setShowAttachments(attachments.length > 0 || detectedUrls.length > 0);
  }, [attachments.length, detectedUrls.length]);

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        return; // Allow new line
      } else {
        event.preventDefault();
        handleSendMessage();
      }
    }
  };

  // Handle clipboard paste
  const handleClipboardPaste = useCallback(async (event: ClipboardEvent) => {
    if (!allowFileUploads || disabled) return;

    try {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      // Handle text content for URL detection
      const text = clipboardData.getData('text');
      if (text && isValidUrl(text)) {
        const normalizedUrl = normalizeUrl(text);
        if (!detectedUrls.includes(normalizedUrl)) {
          setDetectedUrls(prev => [...prev, normalizedUrl]);
        }
        return;
      }

      // Handle image paste
      const items = Array.from(clipboardData.items);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      
      if (imageItem) {
        event.preventDefault();
        await handleImagePaste(clipboardData);
      }
    } catch (error) {
      console.error('Error handling paste:', error);
      setError('Failed to paste content');
    }
  }, [allowFileUploads, disabled, detectedUrls]);

  // Handle image paste from clipboard
  const handleImagePaste = async (clipboardData: DataTransfer) => {
    try {
      setIsUploading(true);
      setError(null);

      const attachment = await FileUploadService.uploadImageFromClipboard(
        clipboardData,
        userId,
        sessionId
      );

      if (attachment) {
        setAttachments(prev => [...prev, attachment]);
      }
    } catch (error) {
      console.error('Error pasting image:', error);
      setError('Failed to paste image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (files: File[]) => {
    if (!allowFileUploads || files.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);

      const uploadedAttachments = await FileUploadService.uploadFiles(
        files,
        userId,
        sessionId,
        (progress, fileName) => {
          setUploadProgress(progress);
        }
      );

      setAttachments(prev => [...prev, ...uploadedAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFileSelect(files);
  };

  // Handle URL detection
  const handleUrlDetection = (urls: string[]) => {
    const newUrls = urls.filter(url => !detectedUrls.includes(url));
    if (newUrls.length > 0) {
      setDetectedUrls(prev => [...prev, ...newUrls]);
    }
  };

  // Handle message change
  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = event.target.value;
    setMessage(newMessage);
  };

  // Remove attachment
  const handleRemoveAttachment = async (attachmentId: string) => {
    const attachment = attachments.find(att => att.id === attachmentId);
    if (attachment && attachment.type !== AttachmentType.URL) {
      try {
        await FileUploadService.deleteFile(attachment);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  // Remove URL
  const handleRemoveUrl = (url: string) => {
    setDetectedUrls(prev => prev.filter(u => u !== url));
  };

  // Send message
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && attachments.length === 0 && detectedUrls.length === 0) {
      return;
    }

    setError(null);

    // Create URL attachments
    const urlAttachments = detectedUrls.map(url => createUrlAttachment(url));
    const allAttachments = [...attachments, ...urlAttachments];

    // Send message
    onSendMessage(trimmedMessage, allAttachments.length > 0 ? allAttachments : undefined);

    // Clear input
    setMessage('');
    setAttachments([]);
    setDetectedUrls([]);

    // Focus back to input
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  };

  // Handle attachment menu
  const handleAttachmentMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAttachmentMenuClose = () => {
    setAnchorEl(null);
  };

  // Trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    handleAttachmentMenuClose();
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (allowFileUploads && !disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (allowFileUploads && !disabled) {
      const files = Array.from(e.dataTransfer.files);
      handleFileSelect(files);
    }
  };

  const canSend = (message.trim() || attachments.length > 0 || detectedUrls.length > 0) && !disabled && !isUploading;
  const hasAttachments = attachments.length > 0 || detectedUrls.length > 0;

  return (
    <ClipboardPasteArea onPaste={handleClipboardPaste} disabled={disabled}>
      <Box 
        sx={{ 
          p: compact ? 1 : 2, 
          borderTop: 1, 
          borderColor: 'divider', 
          bgcolor: 'background.paper',
          position: 'relative'
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* URL Detector */}
        <URLDetector
          text={message}
          onUrlDetected={handleUrlDetection}
        />

        {/* Drag Overlay */}
        {dragActive && (
          <Fade in={dragActive}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'primary.main',
                opacity: 0.1,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1
              }}
            >
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: 'background.paper'
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" color="primary.main">
                  Drop files here
                </Typography>
              </Paper>
            </Box>
          </Fade>
        )}

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Uploading files...
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {/* Attachments Panel */}
        <Collapse in={showAttachments}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Attachments ({attachments.length + detectedUrls.length})
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowAttachments(!showAttachments)}
                sx={{ ml: 'auto' }}
              >
                {showAttachments ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {/* File Attachments */}
            {attachments.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <AttachmentGallery
                  attachments={attachments}
                  onRemove={handleRemoveAttachment}
                  compact={compact}
                />
              </Box>
            )}

            {/* URL Attachments */}
            {detectedUrls.length > 0 && (
              <URLAttachmentManager
                urls={detectedUrls}
                onRemoveUrl={handleRemoveUrl}
                compact={compact}
              />
            )}
          </Box>
        </Collapse>

        {/* Input Area */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          {/* Attachment Button */}
          {allowFileUploads && (
            <>
              <Tooltip title="Attach files">
                <IconButton
                  onClick={handleAttachmentMenuOpen}
                  disabled={disabled || isUploading}
                  size="small"
                >
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>

              {/* Attachment Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleAttachmentMenuClose}
              >
                <MenuItem onClick={triggerFileInput}>
                  <ListItemIcon>
                    <FileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Upload Files</ListItemText>
                </MenuItem>
                
                <Divider />
                
                <MenuItem disabled>
                  <ListItemIcon>
                    <ImageIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="body2" color="text.secondary">
                      Tip: Ctrl+V to paste images
                    </Typography>
                  </ListItemText>
                </MenuItem>

                <MenuItem disabled>
                  <ListItemIcon>
                    <LinkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="body2" color="text.secondary">
                      URLs are auto-detected
                    </Typography>
                  </ListItemText>
                </MenuItem>
              </Menu>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allowedFileTypes.join(',')}
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </>
          )}

          {/* Text Input */}
          <TextField
            inputRef={textFieldRef}
            multiline
            maxRows={compact ? 3 : 6}
            fullWidth
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            variant="outlined"
            size={compact ? "small" : "medium"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* Send Button */}
          <Tooltip title={canSend ? 'Send message (Enter)' : 'Type a message or attach files'}>
            <span>
              <IconButton
                onClick={handleSendMessage}
                disabled={!canSend}
                color="primary"
                size="large"
                sx={{
                  bgcolor: canSend ? 'primary.main' : 'action.disabled',
                  color: canSend ? 'primary.contrastText' : 'action.disabled',
                  '&:hover': {
                    bgcolor: canSend ? 'primary.dark' : 'action.disabled',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabled',
                    color: 'action.disabled',
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Keyboard Shortcuts Help */}
        {!compact && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            Press Enter to send • Shift+Enter for new line • Ctrl+V to paste images • Drag & drop files
          </Typography>
        )}
      </Box>
    </ClipboardPasteArea>
  );
};

