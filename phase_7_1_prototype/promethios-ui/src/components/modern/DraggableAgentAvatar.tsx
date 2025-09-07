/**
 * Draggable Agent Avatar
 * Extends the existing AgentAvatarSelector with drag & drop capabilities
 * Builds on the current hover prompt system without breaking existing functionality
 */

import React, { useState, useRef } from 'react';
import { Box, Tooltip, Avatar, Paper } from '@mui/material';
import { useModernChatFeature, trackFeatureUsage } from '../../config/modernChatConfig';
import { useChatMode } from './ChatModeDetector';

export interface AgentData {
  agentId: string;
  agentName: string;
  agentColor?: string;
  avatar?: string;
  availableRoles: string[];
  availableBehaviors: string[];
  isActive?: boolean;
}

export interface DraggableAgentAvatarProps {
  agent: AgentData;
  
  // Existing hover prompt system integration
  onHoverPrompt?: (prompt: string) => void;
  existingHoverPrompts?: Array<{
    icon: string;
    label: string;
    prompt: string;
  }>;
  
  // New drag & drop functionality
  enableDrag?: boolean;
  onDragStart?: (agent: AgentData) => void;
  onDragEnd?: (agent: AgentData) => void;
  
  // Styling
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
  sx?: any;
}

export const DraggableAgentAvatar: React.FC<DraggableAgentAvatarProps> = ({
  agent,
  onHoverPrompt,
  existingHoverPrompts = [],
  enableDrag = true,
  onDragStart,
  onDragEnd,
  size = 'medium',
  showLabel = true,
  className,
  sx
}) => {
  
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  
  // Feature flags and context
  const dragDropEnabled = useModernChatFeature('drag-drop-injection');
  const { mode, features } = useChatMode();
  
  // Default hover prompts (existing system)
  const defaultHoverPrompts = [
    { icon: '🤝', label: 'Collaborate', prompt: 'collaborate with me on this' },
    { icon: '😈', label: 'Devil\'s Advocate', prompt: 'play devil\'s advocate on this' },
    { icon: '🔍', label: 'Analyze', prompt: 'provide detailed analysis of this' },
    { icon: '💡', label: 'Brainstorm', prompt: 'brainstorm ideas related to this' },
    { icon: '⚖️', label: 'Evaluate', prompt: 'evaluate the pros and cons of this' },
    { icon: '🎯', label: 'Focus', prompt: 'help me focus on the key points here' }
  ];
  
  const hoverPrompts = existingHoverPrompts.length > 0 ? existingHoverPrompts : defaultHoverPrompts;
  
  // Size configurations
  const sizeConfig = {
    small: { width: 32, height: 32, fontSize: '12px' },
    medium: { width: 40, height: 40, fontSize: '14px' },
    large: { width: 48, height: 48, fontSize: '16px' }
  };
  
  const config = sizeConfig[size];
  
  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!dragDropEnabled || !enableDrag || !features.dragDropInjection) {
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
    setShowTooltip(false);
    
    // Store drag start position
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Set drag data
    const dragData = {
      agentId: agent.agentId,
      agentName: agent.agentName,
      agentColor: agent.agentColor,
      availableRoles: agent.availableRoles,
      availableBehaviors: agent.availableBehaviors,
      dragType: 'agent-avatar'
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Custom drag image
    const dragImage = createDragImage();
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    onDragStart?.(agent);
    
    trackFeatureUsage('drag-drop-injection', 'drag_started', {
      agentId: agent.agentId,
      agentName: agent.agentName,
      chatMode: mode
    });
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    dragStartPos.current = null;
    
    onDragEnd?.(agent);
    
    trackFeatureUsage('drag-drop-injection', 'drag_ended', {
      agentId: agent.agentId,
      agentName: agent.agentName,
      dropEffect: e.dataTransfer.dropEffect
    });
  };
  
  // Create custom drag image
  const createDragImage = (): HTMLElement => {
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      width: 60px;
      height: 60px;
      background: ${agent.agentColor || '#3b82f6'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      position: absolute;
      top: -1000px;
      left: -1000px;
      z-index: 9999;
    `;
    dragImage.textContent = agent.agentName.charAt(0);
    document.body.appendChild(dragImage);
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 100);
    
    return dragImage;
  };
  
  // Handle existing hover prompt clicks
  const handleHoverPromptClick = (prompt: string) => {
    onHoverPrompt?.(prompt);
    setShowTooltip(false);
    
    trackFeatureUsage('enhanced-agent-avatars', 'hover_prompt_used', {
      agentId: agent.agentId,
      prompt: prompt.substring(0, 50)
    });
  };
  
  // Tooltip content with hover prompts
  const tooltipContent = (
    <Box sx={{ p: 1, maxWidth: 200 }}>
      <Box sx={{ mb: 1, fontWeight: 600, fontSize: '12px' }}>
        {agent.agentName}
      </Box>
      
      {/* Existing hover prompts */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {hoverPrompts.map((prompt, index) => (
          <Box
            key={index}
            onClick={() => handleHoverPromptClick(prompt.prompt)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 0.5,
              borderRadius: 1,
              cursor: 'pointer',
              fontSize: '11px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <span>{prompt.icon}</span>
            <span>{prompt.label}</span>
          </Box>
        ))}
      </Box>
      
      {/* Drag instruction (only if drag & drop enabled) */}
      {dragDropEnabled && features.dragDropInjection && (
        <Box
          sx={{
            mt: 1,
            pt: 1,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontStyle: 'italic'
          }}
        >
          💡 Drag onto messages to inject responses
        </Box>
      )}
    </Box>
  );
  
  // Avatar styling
  const avatarStyling = {
    width: config.width,
    height: config.height,
    bgcolor: agent.agentColor || '#3b82f6',
    fontSize: config.fontSize,
    fontWeight: 600,
    cursor: dragDropEnabled && features.dragDropInjection ? 'grab' : 'pointer',
    transition: 'all 0.2s ease',
    border: agent.isActive ? '2px solid #10b981' : '2px solid transparent',
    
    // Drag state styling
    ...(isDragging && {
      opacity: 0.5,
      transform: 'scale(0.9)',
      cursor: 'grabbing'
    }),
    
    // Hover effects
    '&:hover': {
      transform: isDragging ? 'scale(0.9)' : 'scale(1.05)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    },
    
    // Custom styling
    ...sx
  };
  
  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5
      }}
    >
      <Tooltip
        title={tooltipContent}
        open={showTooltip}
        onOpen={() => setShowTooltip(true)}
        onClose={() => setShowTooltip(false)}
        placement="top"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              fontSize: '12px',
              maxWidth: 'none'
            }
          }
        }}
      >
        <Avatar
          src={agent.avatar}
          draggable={dragDropEnabled && enableDrag && features.dragDropInjection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sx={avatarStyling}
        >
          {agent.agentName.charAt(0)}
        </Avatar>
      </Tooltip>
      
      {/* Agent label */}
      {showLabel && (
        <Box
          sx={{
            fontSize: '10px',
            color: 'rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
            maxWidth: config.width + 20,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {agent.agentName}
        </Box>
      )}
      
      {/* Drag indicator */}
      {dragDropEnabled && features.dragDropInjection && !isDragging && (
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'white',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '.MuiBox-root:hover &': {
              opacity: 1
            }
          }}
        >
          ⋮⋮
        </Box>
      )}
    </Box>
  );
};

export default DraggableAgentAvatar;

