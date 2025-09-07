/**
 * Enhanced Message Wrapper
 * Foundation component that all modern chat features build upon
 * Provides progressive enhancement without breaking existing functionality
 */

import React, { useState, useRef, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { useModernChatFeature, trackFeatureUsage } from '../../config/modernChatConfig';
import { ChatMessage } from '../../hooks/useModernChat';

// Progressive enhancement props
export interface EnhancedMessageWrapperProps {
  message: ChatMessage;
  children: React.ReactNode;
  
  // Week 2: Drag & Drop features
  enableDropTarget?: boolean;
  onAgentDrop?: (agentData: any, message: ChatMessage) => void;
  
  // Week 3: Threading features
  enableThreading?: boolean;
  threadId?: string;
  isThreadMessage?: boolean;
  onCreateThread?: (message: ChatMessage) => void;
  onReplyToThread?: (threadId: string, message: ChatMessage) => void;
  
  // Week 4: Intelligence features
  enableIntelligence?: boolean;
  onAnalyzeMessage?: (message: ChatMessage) => void;
  suggestions?: any[];
  
  // Week 5: Advanced features
  enableVirtualization?: boolean;
  virtualIndex?: number;
  
  // Styling and behavior
  className?: string;
  sx?: any;
}

export const EnhancedMessageWrapper: React.FC<EnhancedMessageWrapperProps> = ({
  message,
  children,
  enableDropTarget = false,
  onAgentDrop,
  enableThreading = false,
  threadId,
  isThreadMessage = false,
  onCreateThread,
  onReplyToThread,
  enableIntelligence = false,
  onAnalyzeMessage,
  suggestions = [],
  enableVirtualization = false,
  virtualIndex,
  className,
  sx,
  ...props
}) => {
  
  // Feature flags
  const enhancedMessagesEnabled = useModernChatFeature('enhanced-message-wrapper');
  const dragDropEnabled = useModernChatFeature('drag-drop-injection');
  const threadingEnabled = useModernChatFeature('smart-threading');
  const intelligenceEnabled = useModernChatFeature('conversation-intelligence');
  
  // Local state for progressive features
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedAgent, setDraggedAgent] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Refs for performance tracking
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renderStartTime = useRef(performance.now());
  
  // If enhanced messages not enabled, return original children
  if (!enhancedMessagesEnabled) {
    return <>{children}</>;
  }
  
  // Drag & Drop handlers (Week 2)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!dragDropEnabled || !enableDropTarget) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (!isDragOver) {
      setIsDragOver(true);
      
      try {
        const agentData = e.dataTransfer.getData('application/json');
        if (agentData) {
          setDraggedAgent(JSON.parse(agentData));
        }
      } catch (error) {
        console.warn('Invalid drag data');
      }
      
      trackFeatureUsage('drag-drop-injection', 'drag_over_message', {
        messageId: message.id,
        messageSender: message.sender
      });
    }
  }, [dragDropEnabled, enableDropTarget, isDragOver, message.id, message.sender]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!dragDropEnabled || !enableDropTarget) return;
    
    // Only hide if leaving the entire message area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDraggedAgent(null);
    }
  }, [dragDropEnabled, enableDropTarget]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!dragDropEnabled || !enableDropTarget) return;
    
    e.preventDefault();
    
    try {
      const agentData = JSON.parse(e.dataTransfer.getData('application/json'));
      onAgentDrop?.(agentData, message);
      
      trackFeatureUsage('drag-drop-injection', 'agent_dropped', {
        messageId: message.id,
        agentId: agentData.agentId,
        agentName: agentData.agentName
      });
    } catch (error) {
      console.error('Failed to parse dropped agent data:', error);
    }
    
    setIsDragOver(false);
    setDraggedAgent(null);
  }, [dragDropEnabled, enableDropTarget, onAgentDrop, message]);
  
  // Threading handlers (Week 3)
  const handleCreateThread = useCallback(() => {
    if (!threadingEnabled || !enableThreading) return;
    
    onCreateThread?.(message);
    trackFeatureUsage('smart-threading', 'thread_created_from_message', {
      messageId: message.id
    });
  }, [threadingEnabled, enableThreading, onCreateThread, message]);
  
  // Intelligence handlers (Week 4)
  const handleAnalyzeMessage = useCallback(async () => {
    if (!intelligenceEnabled || !enableIntelligence) return;
    
    setIsAnalyzing(true);
    try {
      await onAnalyzeMessage?.(message);
      trackFeatureUsage('conversation-intelligence', 'message_analyzed', {
        messageId: message.id
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [intelligenceEnabled, enableIntelligence, onAnalyzeMessage, message]);
  
  // Performance tracking
  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > 16) { // More than one frame
      trackFeatureUsage('enhanced-message-wrapper', 'slow_render', {
        messageId: message.id,
        renderTime,
        features: {
          dropTarget: enableDropTarget && dragDropEnabled,
          threading: enableThreading && threadingEnabled,
          intelligence: enableIntelligence && intelligenceEnabled
        }
      });
    }
  }, [message.id, enableDropTarget, dragDropEnabled, enableThreading, threadingEnabled, enableIntelligence, intelligenceEnabled]);
  
  // Calculate wrapper styles
  const wrapperStyles = {
    position: 'relative',
    transition: 'all 0.2s ease',
    
    // Drag & drop styling
    ...(dragDropEnabled && enableDropTarget && {
      border: isDragOver ? '2px dashed #3b82f6' : '2px solid transparent',
      backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
      borderRadius: 2
    }),
    
    // Threading styling
    ...(threadingEnabled && enableThreading && isThreadMessage && {
      marginLeft: 4,
      borderLeft: '3px solid #e3f2fd',
      paddingLeft: 2
    }),
    
    // Intelligence styling
    ...(intelligenceEnabled && enableIntelligence && suggestions.length > 0 && {
      boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3)'
    }),
    
    // Custom styles
    ...sx
  };
  
  return (
    <Box
      ref={wrapperRef}
      className={className}
      data-message-id={message.id}
      data-sender={message.sender}
      data-timestamp={message.timestamp.toISOString()}
      data-enhanced="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={wrapperStyles}
      {...props}
    >
      {/* Original message content - completely unchanged */}
      {children}
      
      {/* Week 2: Drag & Drop Overlay */}
      {dragDropEnabled && enableDropTarget && isDragOver && draggedAgent && (
        <DropTargetOverlay
          draggedAgent={draggedAgent}
          message={message}
        />
      )}
      
      {/* Week 3: Threading Indicators */}
      {threadingEnabled && enableThreading && (
        <ThreadingIndicators
          message={message}
          threadId={threadId}
          isThreadMessage={isThreadMessage}
          onCreateThread={handleCreateThread}
        />
      )}
      
      {/* Week 4: Intelligence Overlays */}
      {intelligenceEnabled && enableIntelligence && (
        <IntelligenceOverlay
          message={message}
          suggestions={suggestions}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyzeMessage}
        />
      )}
      
      {/* Week 5: Virtualization helpers */}
      {enableVirtualization && virtualIndex !== undefined && (
        <VirtualizationMarker
          index={virtualIndex}
          messageId={message.id}
        />
      )}
    </Box>
  );
};

// Week 2: Drop Target Overlay Component
const DropTargetOverlay: React.FC<{
  draggedAgent: any;
  message: ChatMessage;
}> = ({ draggedAgent, message }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderRadius: 2,
      zIndex: 10,
      pointerEvents: 'none'
    }}
  >
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        bgcolor: 'rgba(59, 130, 246, 0.9)',
        color: 'white',
        borderRadius: 2
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: draggedAgent.agentColor || '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600
        }}
      >
        {draggedAgent.agentName?.charAt(0) || 'A'}
      </Box>
      <Box sx={{ fontSize: '14px' }}>
        Drop {draggedAgent.agentName} to inject response
      </Box>
    </Paper>
  </Box>
);

// Week 3: Threading Indicators Component
const ThreadingIndicators: React.FC<{
  message: ChatMessage;
  threadId?: string;
  isThreadMessage: boolean;
  onCreateThread: () => void;
}> = ({ message, threadId, isThreadMessage, onCreateThread }) => {
  
  if (!useModernChatFeature('thread-ui-components')) {
    return null;
  }
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        gap: 0.5,
        opacity: 0,
        transition: 'opacity 0.2s ease',
        '.MuiBox-root:hover &': {
          opacity: 1
        }
      }}
    >
      {!isThreadMessage && (
        <Box
          onClick={onCreateThread}
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: 'rgba(139, 92, 246, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '10px',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(139, 92, 246, 1)'
            }
          }}
          title="Create thread"
        >
          🧵
        </Box>
      )}
    </Box>
  );
};

// Week 4: Intelligence Overlay Component
const IntelligenceOverlay: React.FC<{
  message: ChatMessage;
  suggestions: any[];
  isAnalyzing: boolean;
  onAnalyze: () => void;
}> = ({ message, suggestions, isAnalyzing, onAnalyze }) => {
  
  if (!useModernChatFeature('smart-suggestions')) {
    return null;
  }
  
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: -8,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: suggestions.length > 0 ? 1 : 0,
        transition: 'opacity 0.2s ease'
      }}
    >
      {suggestions.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            px: 1,
            py: 0.5,
            bgcolor: 'rgba(139, 92, 246, 0.9)',
            color: 'white',
            fontSize: '12px',
            borderRadius: 1
          }}
        >
          💡 {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
        </Paper>
      )}
    </Box>
  );
};

// Week 5: Virtualization Marker Component
const VirtualizationMarker: React.FC<{
  index: number;
  messageId: string;
}> = ({ index, messageId }) => {
  
  if (!useModernChatFeature('virtualized-rendering')) {
    return null;
  }
  
  return (
    <Box
      data-virtual-index={index}
      data-message-id={messageId}
      sx={{
        position: 'absolute',
        top: 0,
        left: -20,
        width: 16,
        height: 16,
        fontSize: '8px',
        color: 'rgba(0,0,0,0.3)',
        display: 'none', // Only visible in debug mode
        '.debug-mode &': {
          display: 'block'
        }
      }}
    >
      {index}
    </Box>
  );
};

export default EnhancedMessageWrapper;

