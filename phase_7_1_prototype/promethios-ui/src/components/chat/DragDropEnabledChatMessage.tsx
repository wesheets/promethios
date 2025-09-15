/**
 * Enhanced Chat Message with Drag & Drop Functionality
 * Extends ColorCodedChatMessage with drop target capabilities for agent interactions
 */

import React, { useState } from 'react';
import { Box, Typography, Avatar, Fade, Paper, Chip } from '@mui/material';
import { 
  Psychology, 
  QuestionMark, 
  Lightbulb, 
  Analytics,
  CloudQueue,
  Handshake 
} from '@mui/icons-material';

// Import drag & drop functionality
import { useMessageDropTarget } from '../../hooks/useDragDrop';
import { DragSource, DropContext } from '../../systems/DragDropRegistry';
import DirectionalFlowIndicator from './DirectionalFlowIndicator';

interface DragDropEnabledChatMessageProps {
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
  onAgentInteraction?: (agentId: string, messageId: string, actionType: string) => void;
}

// Action icons mapping
const actionIcons: Record<string, React.ReactNode> = {
  collaborate: <Handshake sx={{ fontSize: '14px' }} />,
  question: <QuestionMark sx={{ fontSize: '14px' }} />,
  devils_advocate: <Psychology sx={{ fontSize: '14px' }} />,
  expert_analysis: <Analytics sx={{ fontSize: '14px' }} />,
  creative_ideas: <Lightbulb sx={{ fontSize: '14px' }} />,
  pessimist: <CloudQueue sx={{ fontSize: '14px' }} />,
};

const DragDropEnabledChatMessage: React.FC<DragDropEnabledChatMessageProps> = ({
  message,
  senderColor,
  recipient,
  isCurrentUser = false,
  onAgentInteraction,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    source: DragSource;
    context: DropContext;
    actions: any[];
  } | null>(null);

  // Handle drop on message
  const handleDrop = async (source: DragSource, context: DropContext) => {
    console.log('Agent dropped on message:', { source, message, context });
    
    // If it's an agent being dropped, trigger behavioral interaction
    if (source.type === 'agent' || source.type === 'human') {
      // For now, we'll simulate the action selection
      // In a real implementation, this would show a menu or execute the default action
      const defaultAction = 'collaborate'; // Default behavioral prompt
      
      if (onAgentInteraction) {
        onAgentInteraction(source.data.id, message.id, defaultAction);
      }

      // Show a brief feedback
      setShowActionMenu(true);
      setTimeout(() => setShowActionMenu(false), 2000);
    }
  };

  // Set up drop target for this message
  const { dropRef, isOver, canDrop, availableActions, dropHandlers } = useMessageDropTarget(
    message.id,
    message,
    handleDrop
  );

  const isAI = message.sender.type === 'ai';
  const isHuman = message.sender.type === 'human';

  return (
    <Box 
      ref={dropRef}
      {...dropHandlers}
      sx={{ 
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
        position: 'relative',
        // Drop target styling
        transition: 'all 0.2s ease',
        transform: isOver && canDrop ? 'scale(1.02)' : 'scale(1)',
        filter: isOver && canDrop ? 'brightness(1.1)' : 'brightness(1)',
      }}
    >
      {/* Drop overlay when hovering */}
      {isOver && canDrop && (
        <Fade in={true}>
          <Paper
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              border: '2px dashed #3b82f6',
              borderRadius: 2,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography sx={{ 
              color: '#3b82f6', 
              fontWeight: 'bold',
              fontSize: '12px',
              textAlign: 'center',
              px: 2,
            }}>
              Drop to interact with this message
              {availableActions.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {availableActions.slice(0, 3).map((action) => (
                    <Chip
                      key={action.id}
                      label={action.label}
                      size="small"
                      icon={actionIcons[action.id]}
                      sx={{ 
                        fontSize: '10px', 
                        height: '20px',
                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6',
                        '& .MuiChip-icon': { fontSize: '12px' }
                      }}
                    />
                  ))}
                  {availableActions.length > 3 && (
                    <Chip
                      label={`+${availableActions.length - 3} more`}
                      size="small"
                      sx={{ 
                        fontSize: '10px', 
                        height: '20px',
                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6',
                      }}
                    />
                  )}
                </Box>
              )}
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Action feedback overlay */}
      {showActionMenu && (
        <Fade in={true}>
          <Paper
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              bgcolor: 'rgba(34, 197, 94, 0.9)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              zIndex: 2,
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            ✓ Agent interaction triggered
          </Paper>
        </Fade>
      )}

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
        ml: isCurrentUser ? 0 : 1,
        zIndex: 2,
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

      {/* Message Content with Colored Border */}
      <Box sx={{
        bgcolor: '#1e293b',
        borderRadius: 2,
        p: 2,
        maxWidth: '85%',
        minWidth: '200px',
        borderLeft: `4px solid ${message.sender.type === 'human' ? '#64748b' : senderColor}`,
        position: 'relative',
        zIndex: 2,
        // Enhanced styling for drop target
        border: isOver && canDrop ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
        boxShadow: isOver && canDrop ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
      }}>
        <Typography sx={{ 
          color: 'white',
          fontSize: '14px',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap'
        }}>
          {message.content}
        </Typography>

        {/* Drop hint for first-time users */}
        {!isOver && message.sender.type === 'ai' && (
          <Typography sx={{ 
            color: '#64748b',
            fontSize: '10px',
            mt: 1,
            fontStyle: 'italic',
            opacity: 0.7,
          }}>
            💡 Drag agents here to interact with this message
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DragDropEnabledChatMessage;

