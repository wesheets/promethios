/**
 * Enhanced MessageInput component with file upload, paste support, and URL handling
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  IconButton, 
  Tooltip, 
  Chip,
  Stack,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';

interface AttachmentPreview {
  id: string;
  name: string;
  type: 'image' | 'document' | 'url';
  content?: string;
  file?: File;
  url?: string;
}

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: AttachmentPreview[]) => void;
  disabled?: boolean;
  allowFileUpload?: boolean;
  allowUrlInput?: boolean;
  allowPaste?: boolean;
  governanceEnabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  allowFileUpload = true,
  allowUrlInput = true,
  allowPaste = true,
  governanceEnabled = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [attachMenuAnchor, setAttachMenuAnchor] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    if (!allowPaste) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle image paste
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const attachment: AttachmentPreview = {
            id: Date.now().toString(),
            name: `Pasted Image ${Date.now()}`,
            type: 'image',
            file
          };
          setAttachments(prev => [...prev, attachment]);
        }
      }
      
      // Handle text paste (could be URLs)
      if (item.type === 'text/plain') {
        item.getAsString((text) => {
          // Check if pasted text is a URL
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (urlRegex.test(text.trim()) && allowUrlInput) {
            const attachment: AttachmentPreview = {
              id: Date.now().toString(),
              name: text.trim(),
              type: 'url',
              url: text.trim()
            };
            setAttachments(prev => [...prev, attachment]);
          }
        });
      }
    }
  }, [allowPaste, allowUrlInput]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const attachment: AttachmentPreview = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        file
      };
      setAttachments(prev => [...prev, attachment]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlAdd = () => {
    const url = prompt('Enter URL:');
    if (url && url.trim()) {
      const attachment: AttachmentPreview = {
        id: Date.now().toString(),
        name: url.trim(),
        type: 'url',
        url: url.trim()
      };
      setAttachments(prev => [...prev, attachment]);
    }
    setAttachMenuAnchor(null);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleAttachMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAttachMenuAnchor(event.currentTarget);
  };

  const handleAttachMenuClose = () => {
    setAttachMenuAnchor(null);
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon />;
      case 'url': return <LinkIcon />;
      default: return <DocumentIcon />;
    }
  };

  return (
    <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
      {/* Governance Status Indicator */}
      {governanceEnabled && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 1,
          p: 1,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: 1,
          border: '1px solid rgba(76, 175, 80, 0.3)'
        }}>
          <ShieldIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
          <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: '#4CAF50' }}>
            Governance Mode Active - Messages will be monitored for compliance
          </Typography>
        </Box>
      )}
      
      {!governanceEnabled && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 1,
          p: 1,
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderRadius: 1,
          border: '1px solid rgba(255, 152, 0, 0.3)'
        }}>
          <WarningIcon sx={{ color: '#FF9800', fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: '#FF9800' }}>
            Standard Mode - No governance monitoring active
          </Typography>
        </Box>
      )}
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, display: 'block' }}>
            Attachments:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {attachments.map((attachment) => (
              <Chip
                key={attachment.id}
                icon={getAttachmentIcon(attachment.type)}
                label={attachment.name}
                onDelete={() => removeAttachment(attachment.id)}
                deleteIcon={<CloseIcon />}
                variant="outlined"
                size="small"
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '& .MuiChip-deleteIcon': { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        {/* Attachment Button */}
        {(allowFileUpload || allowUrlInput) && (
          <>
            <Tooltip title="Add attachment">
              <IconButton 
                onClick={handleAttachMenuOpen}
                disabled={disabled}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <AttachFileIcon />
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={attachMenuAnchor}
              open={Boolean(attachMenuAnchor)}
              onClose={handleAttachMenuClose}
              PaperProps={{
                sx: { backgroundColor: '#2a2a2a', color: 'white' }
              }}
            >
              {allowFileUpload && (
                <MenuItem onClick={() => fileInputRef.current?.click()}>
                  <ListItemIcon>
                    <DocumentIcon sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="Upload File" />
                </MenuItem>
              )}
              {allowUrlInput && (
                <MenuItem onClick={handleUrlAdd}>
                  <ListItemIcon>
                    <LinkIcon sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="Add URL" />
                </MenuItem>
              )}
            </Menu>
          </>
        )}

        {/* Text Input */}
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          placeholder="Type your message..."
          disabled={disabled}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              '& fieldset': { 
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: '2px'
              },
              '&:hover fieldset': { 
                borderColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: '2px'
              },
              '&.Mui-focused fieldset': { 
                borderColor: '#2196F3',
                borderWidth: '2px'
              }
            },
            '& .MuiInputBase-input': {
              color: 'white',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
                opacity: 1
              }
            }
          }}
        />

        {/* Send Button */}
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          sx={{ 
            minWidth: 'auto', 
            px: 2,
            height: 'fit-content'
          }}
        >
          <SendIcon />
        </Button>
      </Box>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </Box>
  );
};

export default MessageInput;

