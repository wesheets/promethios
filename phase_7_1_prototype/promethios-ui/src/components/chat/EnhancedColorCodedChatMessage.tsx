/**
 * Enhanced ColorCodedChatMessage with improved drag & drop functionality
 * Includes visual feedback, flash effects, and contextual behavioral prompts
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Avatar, Fade } from '@mui/material';
import DirectionalFlowIndicator from './DirectionalFlowIndicator';
import BehavioralPromptPopup from './BehavioralPromptPopup';

// Import drag & drop functionality
import { useMessageDropTarget } from '../../hooks/useDragDrop';

interface EnhancedColorCodedChatMessageProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    sender: {
      id: string;
      name: string;
      type: 'ai' | 'human';
      avatar?: string;
    };
  };
  senderColor: string;
  recipient?: {
    id: string;
    name: string;
    type: 'ai' | 'human';
    avatar?: string;
    color: string;
  };
  isCurrentUser?: boolean;
  onAgentInteraction?: (agentId: string, messageId: string, action: string) => void;
}

const EnhancedColorCodedChatMessage: React.FC<EnhancedColorCodedChatMessageProps> = ({
  message,
  senderColor,
  recipient,
  isCurrentUser = false,
  onAgentInteraction
}) => {
  const [showBehaviorPopup, setShowBehaviorPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [draggedAgent, setDraggedAgent] = useState<any>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const isAI = message.sender.type === 'ai';
  const isHuman = message.sender.type === 'human';

  // Enhanced drop functionality with behavioral prompts
  const { dropRef, isOver, canDrop, dropHandlers } = useMessageDropTarget(
    message.id,
    message,
    (source, context) => {
      console.log('🎯 Agent dropped on message:', { 
        source, 
        context, 
        messageId: message.id,
        messageContent: message.content.substring(0, 100)
      });
      
      // Store the dragged agent info
      const agentData = {
        id: source.data?.agentId || source.id.replace('agent-', ''),
        name: source.data?.name || 'Unknown Agent',
        color: source.data?.color || '#f97316',
      };
      
      setDraggedAgent(agentData);
      
      // Set popup position near the drop location
      setPopupPosition({
        x: context.position.x + 10,
        y: context.position.y - 10,
      });
      
      // Show behavioral prompt popup
      setShowBehaviorPopup(true);
    }
  );

  // Handle behavior selection
  const handleBehaviorSelect = (behavior: string) => {
    if (draggedAgent) {
      console.log('🎭 Behavior selected:', { 
        agentId: draggedAgent.id, 
        messageId: message.id, 
        behavior,
        messageContent: message.content.substring(0, 50)
      });
      
      // Trigger flash effect
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 600);
      
      // Call the interaction handler
      onAgentInteraction?.(draggedAgent.id, message.id, behavior);
    }
    
    // Close popup and reset state
    setShowBehaviorPopup(false);
    setDraggedAgent(null);
  };

  // Handle popup close
  const handlePopupClose = () => {
    setShowBehaviorPopup(false);
    setDraggedAgent(null);
  };

  return (
    <>
      <Box sx={{ 
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        maxWidth: '100%'
      }}>
        {/* Directional Flow Indicator */}
        {recipient && (
          <DirectionalFlowIndicator
            sender={{
              id: message.sender.id,
              name: message.sender.name,
              type: message.sender.type,
              avatar: message.sender.avatar,
              color: senderColor
            }}
            recipient={recipient}
            timestamp={message.timestamp}
            isCurrentUser={isCurrentUser}
          />
        )}

        {/* Agent/User Name with Color Square */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 0.5,
          ml: isCurrentUser ? 0 : 1
        }}>
          {/* Color Square */}
          <Box sx={{
            width: 12,
            height: 12,
            backgroundColor: message.sender.type === 'human' 
              ? '#64748b' // Softer neutral for humans
              : senderColor, // Vibrant colors for agents
            borderRadius: 0.5,
            flexShrink: 0
          }} />
          
          {/* Sender Name */}
          <Typography variant="body2" sx={{ 
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500
          }}>
            {message.sender.name}
          </Typography>
          
          {/* Timestamp (only show if no directional flow) */}
          {!recipient && (
            <Typography variant="caption" sx={{ 
              color: '#64748b',
              fontSize: '11px'
            }}>
              {message.timestamp}
            </Typography>
          )}
        </Box>

        {/* Message Content with Enhanced Drop Zone */}
        <Box 
          ref={(el) => {
            dropRef.current = el;
            messageRef.current = el;
          }}
          {...dropHandlers}
          sx={{
            position: 'relative',
            maxWidth: isCurrentUser ? '70%' : '85%',
            minWidth: '200px',
            // Enhanced hover and drop effects
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            // Drop zone visual feedback
            backgroundColor: isOver && canDrop 
              ? 'rgba(59, 130, 246, 0.15)' 
              : flashEffect 
                ? 'rgba(34, 197, 94, 0.2)'
                : 'transparent',
            border: isOver && canDrop 
              ? '2px dashed #3b82f6' 
              : flashEffect
                ? '2px solid #22c55e'
                : '2px solid transparent',
            borderRadius: 2,
            cursor: canDrop ? 'copy' : 'default',
            // Flash effect animation
            animation: flashEffect ? 'messageFlash 0.6s ease-out' : 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
            },
            // Add keyframe animation
            '@keyframes messageFlash': {
              '0%': { 
                backgroundColor: 'rgba(34, 197, 94, 0.3)',
                borderColor: '#22c55e',
                transform: 'scale(1.02)',
              },
              '50%': { 
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: '#22c55e',
                transform: 'scale(1.01)',
              },
              '100%': { 
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                transform: 'scale(1)',
              },
            }
          }}
        >
          {/* Drop Zone Indicator */}
          {isOver && canDrop && (
            <Fade in={true} timeout={200}>
              <Box sx={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: '#3b82f6',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '11px',
                fontWeight: 600,
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '4px solid #3b82f6',
                }
              }}>
                Drop to interact
              </Box>
            </Fade>
          )}

          {/* Success Indicator */}
          {flashEffect && (
            <Fade in={true} timeout={300}>
              <Box sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: '#22c55e',
                color: 'white',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
              }}>
                ✓
              </Box>
            </Fade>
          )}

          {/* Colored Left Border - Rounded for premium feel */}
          <Box sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: message.sender.type === 'human' 
              ? '#64748b' // Softer neutral for humans
              : senderColor, // Vibrant colors for agents
            borderRadius: '1.5px' // Pill-like rounded corners
          }} />
          
          {/* Message Bubble */}
          <Box sx={{
            ml: 1, // Space for the colored border
            p: 2,
            backgroundColor: isCurrentUser ? '#334155' : '#1e293b',
            borderRadius: 2,
            border: '1px solid #334155',
            position: 'relative',
            // Enhanced elevation for premium feel
            boxShadow: isOver && canDrop 
              ? '0 8px 25px rgba(59, 130, 246, 0.3)' 
              : '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}>
            {/* Message Content */}
            <Typography variant="body1" sx={{ 
              color: '#f8fafc',
              lineHeight: 1.6,
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {message.content}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Behavioral Prompt Popup */}
      <BehavioralPromptPopup
        isVisible={showBehaviorPopup}
        position={popupPosition}
        agentName={draggedAgent?.name || 'Agent'}
        agentColor={draggedAgent?.color}
        targetMessageContent={message.content}
        onBehaviorSelect={handleBehaviorSelect}
        onClose={handlePopupClose}
      />
    </>
  );
};

export default EnhancedColorCodedChatMessage;

