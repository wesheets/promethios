import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface DirectionalFlowIndicatorProps {
  sender: {
    id: string;
    name: string;
    type: 'ai' | 'human';
    avatar?: string;
    color: string;
  };
  recipient: {
    id: string;
    name: string;
    type: 'ai' | 'human';
    avatar?: string;
    color: string;
  };
  timestamp?: string;
  isCurrentUser?: boolean;
}

const DirectionalFlowIndicator: React.FC<DirectionalFlowIndicatorProps> = ({
  sender,
  recipient,
  timestamp,
  isCurrentUser = false
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      mb: 0.5,
      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
      opacity: 0.8
    }}>
      {/* Sender */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5 
      }}>
        {/* Sender Color Dot */}
        <Box sx={{
          width: 8,
          height: 8,
          backgroundColor: sender.color,
          borderRadius: '50%',
          flexShrink: 0
        }} />
        
        {/* Sender Name */}
        <Typography variant="caption" sx={{ 
          color: '#94a3b8',
          fontSize: '11px',
          fontWeight: 500
        }}>
          {sender.name}
        </Typography>
      </Box>

      {/* Arrow */}
      <ArrowForward sx={{ 
        fontSize: 12, 
        color: '#64748b',
        mx: 0.5
      }} />

      {/* Recipient */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5 
      }}>
        {/* Recipient Color Dot */}
        <Box sx={{
          width: 8,
          height: 8,
          backgroundColor: recipient.color,
          borderRadius: '50%',
          flexShrink: 0
        }} />
        
        {/* Recipient Name */}
        <Typography variant="caption" sx={{ 
          color: '#94a3b8',
          fontSize: '11px',
          fontWeight: 500
        }}>
          {recipient.name}
        </Typography>
      </Box>

      {/* Timestamp (optional) */}
      {timestamp && (
        <>
          <Typography variant="caption" sx={{ 
            color: '#64748b',
            fontSize: '10px',
            mx: 1
          }}>
            •
          </Typography>
          <Typography variant="caption" sx={{ 
            color: '#64748b',
            fontSize: '10px'
          }}>
            {timestamp}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default DirectionalFlowIndicator;

