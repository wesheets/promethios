/**
 * Message Drop Target
 * Provides drop zones on messages for drag & drop behavioral injection
 * Integrates with existing message rendering without breaking functionality
 */

import React, { useState, useRef, useCallback } from 'react';
import { Box, Paper, Fade, Typography } from '@mui/material';
import { useModernChatFeature, trackFeatureUsage } from '../../config/modernChatConfig';
import { useChatMode } from './ChatModeDetector';
import { useModernChatContext } from './ModernChatProvider';

export interface DropTargetProps {
  messageId: string;
  messageContent: string;
  messageType: 'human' | 'ai';
  children: React.ReactNode;
  
  // Drop handling
  onAgentDrop?: (agentData: any, messageId: string) => void;
  enableDropTarget?: boolean;
  
  // Styling
  className?: string;
  sx?: any;
}

export const MessageDropTarget: React.FC<DropTargetProps> = ({
  messageId,
  messageContent,
  messageType,
  children,
  onAgentDrop,
  enableDropTarget = true,
  className,
  sx
}) => {
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropPreview, setDropPreview] = useState<any>(null);
  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Feature flags and context
  const dragDropEnabled = useModernChatFeature('drag-drop-injection');
  const { mode, features } = useChatMode();
  const modernChat = useModernChatContext();
  
  // Only enable drop target if feature is enabled and appropriate for current mode
  const isDropEnabled = dragDropEnabled && enableDropTarget && features.dragDropInjection;
  
  // Drag event handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isDropEnabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this is an agent avatar being dragged
    const dragData = e.dataTransfer.getData('application/json');
    if (dragData) {
      try {
        const agentData = JSON.parse(dragData);
        if (agentData.dragType === 'agent-avatar') {
          setIsDragOver(true);
          setDropPreview(agentData);
          
          // Clear any existing timeout
          if (dropTimeoutRef.current) {
            clearTimeout(dropTimeoutRef.current);
          }
        }
      } catch (error) {
        console.warn('Failed to parse drag data:', error);
      }
    }
  }, [isDropEnabled]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isDropEnabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, [isDropEnabled]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isDropEnabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Use timeout to prevent flickering when dragging over child elements
    dropTimeoutRef.current = setTimeout(() => {
      setIsDragOver(false);
      setDropPreview(null);
    }, 100);
  }, [isDropEnabled]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!isDropEnabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Clear timeout
    if (dropTimeoutRef.current) {
      clearTimeout(dropTimeoutRef.current);
    }
    
    setIsDragOver(false);
    setDropPreview(null);
    
    // Get the dropped agent data
    const dragData = e.dataTransfer.getData('application/json');
    if (dragData) {
      try {
        const agentData = JSON.parse(dragData);
        if (agentData.dragType === 'agent-avatar') {
          
          // Track the drop event
          trackFeatureUsage('drag-drop-injection', 'agent_dropped', {
            agentId: agentData.agentId,
            agentName: agentData.agentName,
            messageId,
            messageType,
            chatMode: mode
          });
          
          // Handle the drop
          onAgentDrop?.(agentData, messageId);
          
          console.log('🎭 [MessageDropTarget] Agent dropped:', {
            agent: agentData.agentName,
            message: messageId,
            content: messageContent.substring(0, 50) + '...'
          });
        }
      } catch (error) {
        console.error('Failed to handle drop:', error);
      }
    }
  }, [isDropEnabled, onAgentDrop, messageId, messageType, messageContent, mode]);
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (dropTimeoutRef.current) {
        clearTimeout(dropTimeoutRef.current);
      }
    };
  }, []);
  
  // Drop preview content
  const renderDropPreview = () => {
    if (!dropPreview || !isDragOver) return null;
    
    return (
      <Fade in={isDragOver}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 2,
            bgcolor: 'rgba(59, 130, 246, 0.95)',
            color: 'white',
            borderRadius: 2,
            zIndex: 1000,
            minWidth: 200,
            textAlign: 'center',
            border: '2px solid #3b82f6',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: dropPreview.agentColor || '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {dropPreview.agentName?.charAt(0)}
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {dropPreview.agentName}
            </Typography>
          </Box>
          
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            🎭 Drop to inject behavioral response
          </Typography>
          
          <Box sx={{ mt: 1, fontSize: '10px', opacity: 0.7 }}>
            Will analyze: "{messageContent.substring(0, 40)}..."
          </Box>
        </Paper>
      </Fade>
    );
  };
  
  // Container styling
  const containerStyling = {
    position: 'relative',
    transition: 'all 0.2s ease',
    
    // Drop target styling
    ...(isDropEnabled && {
      cursor: isDragOver ? 'copy' : 'default'
    }),
    
    // Drag over effects
    ...(isDragOver && {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderRadius: 2,
      transform: 'scale(1.02)',
      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)',
      border: '2px dashed #3b82f6'
    }),
    
    // Custom styling
    ...sx
  };
  
  // If drag & drop is disabled, return children without drop functionality
  if (!isDropEnabled) {
    return (
      <Box className={className} sx={sx}>
        {children}
      </Box>
    );
  }
  
  return (
    <Box
      className={className}
      sx={containerStyling}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-message-id={messageId}
      data-message-type={messageType}
      data-drop-enabled={isDropEnabled}
    >
      {children}
      {renderDropPreview()}
      
      {/* Drop zone indicator (subtle) */}
      {isDropEnabled && !isDragOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 16,
            height: 16,
            borderRadius: '0 4px 0 4px',
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: '#3b82f6',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            
            // Show on hover
            '.MuiBox-root:hover &': {
              opacity: mode === 'multi-agent' ? 0.7 : 0
            }
          }}
        >
          🎯
        </Box>
      )}
    </Box>
  );
};

export default MessageDropTarget;

