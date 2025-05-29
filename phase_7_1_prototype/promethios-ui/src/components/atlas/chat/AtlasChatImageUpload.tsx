/**
 * AtlasChatImageUpload.tsx
 * 
 * Component for handling image uploads in ATLAS Chat, including drag-and-drop,
 * clipboard paste, and file selection capabilities.
 */

import React, { useState, useRef, useCallback } from 'react';
import './AtlasChat.css';

export interface AtlasChatImageUploadProps {
  onImageUpload: (imageFile: File) => void;
  onImagePaste: (imageData: string) => void;
  isDisabled?: boolean;
}

const AtlasChatImageUpload: React.FC<AtlasChatImageUploadProps> = ({
  onImageUpload,
  onImagePaste,
  isDisabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled) return;
    setIsDragging(true);
  }, [isDisabled]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled) return;
    setIsDragging(true);
  }, [isDisabled]);
  
  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isDisabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      }
    }
  }, [isDisabled, onImageUpload]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type.startsWith('image/')) {
      onImageUpload(file);
    }
    
    // Reset the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isDisabled, onImageUpload]);
  
  // Handle click on upload button
  const handleUploadClick = useCallback(() => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  }, [isDisabled]);
  
  // Handle paste event (for clipboard images)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (isDisabled) return;
    
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
              onImagePaste(event.target.result);
            }
          };
          reader.readAsDataURL(blob);
          
          // Prevent the image from being pasted into the input
          e.preventDefault();
          break;
        }
      }
    }
  }, [isDisabled, onImagePaste]);
  
  return (
    <div 
      className={`atlas-chat-upload ${isDragging ? 'dragging' : ''} ${isDisabled ? 'disabled' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <button 
        className="upload-button" 
        onClick={handleUploadClick}
        disabled={isDisabled}
        title="Upload an image for analysis"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 10v4H2v-4H0v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4h-2zm-1-7h-3V1H6v2H3l5 5 5-5z" />
        </svg>
      </button>
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-message">Drop image to upload</div>
        </div>
      )}
    </div>
  );
};

export default AtlasChatImageUpload;
