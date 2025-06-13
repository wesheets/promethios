/**
 * File Upload Components for drag & drop and file selection
 */

import React, { useState, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { fileUploadService, FileUploadResult } from '../services/FileUploadService';

interface FileUploadComponentsProps {
  onFileUploaded: (result: FileUploadResult) => void;
  disabled?: boolean;
}

export const FileUploadComponents: React.FC<FileUploadComponentsProps> = ({
  onFileUploaded,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await fileUploadService.uploadFile(file);
      
      if (result.success) {
        onFileUploaded(result);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept=".txt,.pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp"
      />

      {/* Drag & Drop Area */}
      <Paper
        elevation={isDragging ? 3 : 1}
        sx={{
          p: 3,
          border: isDragging ? '2px dashed' : '2px dashed transparent',
          borderColor: isDragging ? 'primary.main' : 'transparent',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Box sx={{ textAlign: 'center' }}>
          {isUploading ? (
            <Box>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Uploading file...
              </Typography>
            </Box>
          ) : (
            <Box>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drop files here or click to upload
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Supports: Text, PDF, Word, Excel, Images (max 10MB)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                Choose File
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Error Display */}
      {uploadError && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <IconButton
              size="small"
              onClick={() => setUploadError(null)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {uploadError}
        </Alert>
      )}

      {/* Supported File Types */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Supported:
        </Typography>
        {['TXT', 'PDF', 'DOCX', 'XLSX', 'JPG', 'PNG'].map((type) => (
          <Chip
            key={type}
            label={type}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default FileUploadComponents;

