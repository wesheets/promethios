/**
 * Enhanced Message Input with clipboard handling, screenshot paste, and URL preview
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface Attachment {
  id: string;
  type: 'image' | 'file' | 'url';
  name: string;
  data?: string; // base64 for images, URL for links
  size?: number;
  preview?: string;
}

interface EnhancedMessageInputProps {
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message... (Ctrl+V to paste images)"
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);

  // Handle paste events for clipboard content
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    setError(null);
    setIsProcessing(true);

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Handle image paste
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            await handleImageFile(file);
          }
        }
        
        // Handle text paste (might contain URLs)
        if (item.type === 'text/plain') {
          item.getAsString((text) => {
            // Check if pasted text contains URLs
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = text.match(urlRegex);
            
            if (urls) {
              urls.forEach(url => handleURLAttachment(url));
            }
          });
        }
      }
    } catch (err) {
      setError('Failed to process clipboard content');
      console.error('Paste error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle image file processing
  const handleImageFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image file too large (max 10MB)');
        reject(new Error('File too large'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const attachment: Attachment = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          name: file.name || 'pasted-image.png',
          data: result,
          size: file.size,
          preview: result
        };
        
        setAttachments(prev => [...prev, attachment]);
        resolve();
      };
      
      reader.onerror = () => {
        setError('Failed to read image file');
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Handle URL attachment
  const handleURLAttachment = (url: string) => {
    // Basic URL validation
    try {
      new URL(url);
      const attachment: Attachment = {
        id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'url',
        name: url,
        data: url,
        preview: `Preview: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`
      };
      
      setAttachments(prev => [...prev, attachment]);
    } catch (err) {
      console.warn('Invalid URL:', url);
    }
  };

  // Handle file input
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessing(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.type.startsWith('image/')) {
          await handleImageFile(file);
        } else {
          // Handle other file types
          const attachment: Attachment = {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'file',
            name: file.name,
            size: file.size
          };
          
          setAttachments(prev => [...prev, attachment]);
        }
      }
    } catch (err) {
      setError('Failed to process selected files');
    } finally {
      setIsProcessing(false);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Handle send message
  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    
    onSendMessage(message.trim(), attachments);
    setMessage('');
    setAttachments([]);
    setError(null);
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // Set up paste event listener
  useEffect(() => {
    const textField = textFieldRef.current;
    if (textField) {
      textField.addEventListener('paste', handlePaste);
      return () => {
        textField.removeEventListener('paste', handlePaste);
      };
    }
  }, [handlePaste]);

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Attachments ({attachments.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachments.map((attachment) => (
              <Paper key={attachment.id} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {attachment.type === 'image' && <ImageIcon fontSize="small" />}
                {attachment.type === 'file' && <AttachFileIcon fontSize="small" />}
                {attachment.type === 'url' && <LinkIcon fontSize="small" />}
                
                <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {attachment.name}
                </Typography>
                
                {attachment.size && (
                  <Chip 
                    label={`${(attachment.size / 1024).toFixed(1)}KB`} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
                
                <IconButton size="small" onClick={() => removeAttachment(attachment.id)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isProcessing}
          variant="outlined"
          size="small"
        />
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        
        <Tooltip title="Attach files">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
            color="primary"
          >
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Send message">
          <IconButton
            onClick={handleSend}
            disabled={disabled || isProcessing || (!message.trim() && attachments.length === 0)}
            color="primary"
          >
            {isProcessing ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 Tip: Paste images directly with Ctrl+V, or drag & drop files
      </Typography>
    </Box>
  );
};

export default EnhancedMessageInput;

