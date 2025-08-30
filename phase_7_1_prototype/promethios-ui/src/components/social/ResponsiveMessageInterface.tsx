import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DirectMessageSidebar from './DirectMessageSidebar';

interface ResponsiveMessageInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFloatingChat: (userId: string, userName: string) => void;
  connections?: any[];
}

const ResponsiveMessageInterface: React.FC<ResponsiveMessageInterfaceProps> = ({
  isOpen,
  onClose,
  onOpenFloatingChat,
  connections = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <768px

  // For now, we'll use the original DirectMessageSidebar for all screen sizes
  // but we can add mobile-specific styling through props or CSS
  return (
    <DirectMessageSidebar
      isOpen={isOpen}
      onClose={onClose}
      connections={connections}
      // Add mobile-specific props if needed
    />
  );
};

export default ResponsiveMessageInterface;

