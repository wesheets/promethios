import React, { useState, useRef, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';
import { MessageAttachment, AttachmentType } from '../types';
import { FileUploadService } from '../services/FileUploadService';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  allowFileUploads?: boolean;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  userId: string;
  sessionId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type your message...',
  allowFileUploads = true,
  allowedFileTypes = [],
  maxFileSize = 10 * 1024 * 1024,
  userId,
  sessionId
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (onTyping) {
      if (message.trim()) {
        onTyping(true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout to stop typing indicator
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

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift+Enter: Add new line (default behavior)
        return;
      } else {
        // Enter: Send message
        event.preventDefault();
        handleSendMessage();
      }
    }

    // Handle Ctrl+V for paste
    if (event.ctrlKey && event.key === 'v') {
      // Let the default paste behavior happen, then handle it
      setTimeout(() => handlePaste(event), 0);
    }
  };

  // Handle paste events (for clipboard content)
  const handlePaste = async (event: React.KeyboardEvent | React.ClipboardEvent) => {
    if (!allowFileUploads) return;

    try {
      const clipboardData = 'clipboardData' in event 
        ? event.clipboardData 
        : (event as any).clipboardData || window.navigator.clipboard;

      if (!clipboardData) return;

      // Handle clipboard items
      if (clipboardData.items) {
        const items = Array.from(clipboardData.items);
        
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            await handleImagePaste(clipboardData);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error handling paste:', error);
      setError('Failed to paste content');
    }
  };

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
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

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
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle URL detection and attachment
  const handleUrlDetection = (text: string) => {
    const urls = FileUploadService.detectUrls(text);
    
    urls.forEach(url => {
      const urlAttachment = FileUploadService.createUrlAttachment(url);
      setAttachments(prev => {
        // Check if URL already exists
        const exists = prev.some(att => att.url === url);
        return exists ? prev : [...prev, urlAttachment];
      });
    });
  };

  // Handle message change
  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = event.target.value;
    setMessage(newMessage);

    // Auto-detect URLs
    if (newMessage.includes('http')) {
      handleUrlDetection(newMessage);
    }
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

  // Send message
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && attachments.length === 0) {
      return;
    }

    // Clear error
    setError(null);

    // Send message
    onSendMessage(trimmedMessage, attachments.length > 0 ? attachments : undefined);

    // Clear input
    setMessage('');
    setAttachments([]);

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

  // Trigger paste action
  const triggerPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        
        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              const blob = await clipboardItem.getType(type);
              const file = new File([blob], `pasted_image_${Date.now()}.${type.split('/')[1]}`, { type });
              
              setIsUploading(true);
              const attachment = await FileUploadService.uploadFile(file, userId, sessionId);
              setAttachments(prev => [...prev, attachment]);
              setIsUploading(false);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error accessing clipboard:', error);
      setError('Failed to access clipboard');
    }
    handleAttachmentMenuClose();
  };

  const canSend = (message.trim() || attachments.length > 0) && !disabled && !isUploading;

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
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

      {/* Attachments */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {attachments.map((attachment) => (
            <Chip
              key={attachment.id}
              icon={<FileIcon />}
              label={`${attachment.name} (${FileUploadService.formatFileSize(attachment.size)})`}
              onDelete={() => handleRemoveAttachment(attachment.id)}
              deleteIcon={<CloseIcon />}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}

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
              
              <MenuItem onClick={triggerPaste}>
                <ListItemIcon>
                  <PasteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Paste from Clipboard</ListItemText>
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
            </Menu>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedFileTypes.join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </>
        )}

        {/* Text Input */}
        <TextField
          inputRef={textFieldRef}
          multiline
          maxRows={6}
          fullWidth
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          variant="outlined"
          size="small"
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
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ mt: 1, display: 'block', textAlign: 'center' }}
      >
        Press Enter to send • Shift+Enter for new line • Ctrl+V to paste images
      </Typography>
    </Box>
  );
};

