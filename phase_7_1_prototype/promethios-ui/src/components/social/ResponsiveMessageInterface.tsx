import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CompactMessagePanel from './CompactMessagePanel';
import MobileMessageInterface from './MobileMessageInterface';

interface ResponsiveMessageInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFloatingChat: (userId: string, userName: string) => void;
}

const ResponsiveMessageInterface: React.FC<ResponsiveMessageInterfaceProps> = ({
  isOpen,
  onClose,
  onOpenFloatingChat,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <768px
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 768px-1023px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // 1024px+

  // For mobile, we'll handle chat opening differently
  const handleMobileOpenChat = (userId: string, userName: string) => {
    // On mobile, we don't open floating chats, we navigate to full-screen chat
    console.log('Mobile: Opening full-screen chat with:', userName);
    onOpenFloatingChat(userId, userName); // For now, still call the same function
  };

  if (isMobile) {
    // Mobile: Full-screen interface
    return (
      <MobileMessageInterface
        isOpen={isOpen}
        onClose={onClose}
        onOpenChat={handleMobileOpenChat}
      />
    );
  }

  if (isTablet) {
    // Tablet: Could use a different interface, for now use compact panel
    return (
      <CompactMessagePanel
        isOpen={isOpen}
        onClose={onClose}
        onOpenFloatingChat={onOpenFloatingChat}
      />
    );
  }

  // Desktop: Use the compact slide-out panel
  return (
    <CompactMessagePanel
      isOpen={isOpen}
      onClose={onClose}
      onOpenFloatingChat={onOpenFloatingChat}
    />
  );
};

export default ResponsiveMessageInterface;

