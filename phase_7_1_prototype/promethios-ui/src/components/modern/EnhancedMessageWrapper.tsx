/**
 * Enhanced Message Wrapper
 * Simple wrapper component for chat messages with modern styling
 */

import React from 'react';
import { Box } from '@mui/material';

interface EnhancedMessageWrapperProps {
  children: React.ReactNode;
  className?: string;
  sx?: any;
}

export const EnhancedMessageWrapper: React.FC<EnhancedMessageWrapperProps> = ({
  children,
  className,
  sx
}) => {
  return (
    <Box
      className={className}
      sx={{
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default EnhancedMessageWrapper;

