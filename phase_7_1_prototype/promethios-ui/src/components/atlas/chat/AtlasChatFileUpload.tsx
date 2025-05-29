/**
 * AtlasChatFileUpload.tsx
 * 
 * Component for handling file uploads in ATLAS Chat, including drag-and-drop,
 * file selection, and document analysis capabilities.
 */

import React, { useState, useRef, useCallback } from 'react';
import './AtlasChat.css';

export interface AtlasChatFileUploadProps {
  onFileUpload: (file: File) => void;
  isDisabled?: boolean;
  acceptedFileTypes?: string;
}

const AtlasChatFileUpload: React.FC<AtlasChatFileUploadProps> = ({
  onFileUpload,
  isDisabled = false,
  acceptedFileTypes = '.pdf,.doc,.docx,.txt,.csv,.json'
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
      onFileUpload(file);
    }
  }, [isDisabled, onFileUpload]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    onFileUpload(file);
    
    // Reset the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isDisabled, onFileUpload]);
  
  // Handle click on upload button
  const handleUploadClick = useCallback(() => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  }, [isDisabled]);
  
  return (
    <div 
      className={`atlas-chat-upload ${isDragging ? 'dragging' : ''} ${isDisabled ? 'disabled' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={acceptedFileTypes}
        style={{ display: 'none' }}
      />
      <button 
        className="upload-file-button" 
        onClick={handleUploadClick}
        disabled={isDisabled}
        title="Upload a document for analysis"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
          <path d="M8.5 6.5V8H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V9H6a.5.5 0 0 1 0-1h1.5V6.5a.5.5 0 0 1 1 0z"/>
        </svg>
      </button>
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-message">Drop file to upload</div>
        </div>
      )}
    </div>
  );
};

export default AtlasChatFileUpload;
