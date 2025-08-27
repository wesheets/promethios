/**
 * AccessibilityEnhancements - Accessibility utilities and components
 * Provides keyboard navigation, screen reader support, and inclusive design
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  Zoom,
  Fade
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowLeft as ArrowLeftIcon,
  KeyboardArrowRight as ArrowRightIcon,
  VolumeUp as VolumeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

// Skip to content link for keyboard navigation
export const SkipToContent: React.FC<{
  targetId: string;
}> = ({ targetId }) => (
  <Box
    component="a"
    href={`#${targetId}`}
    sx={{
      position: 'absolute',
      top: -40,
      left: 8,
      bgcolor: '#3b82f6',
      color: 'white',
      px: 2,
      py: 1,
      borderRadius: 1,
      textDecoration: 'none',
      zIndex: 9999,
      fontSize: '0.875rem',
      fontWeight: 600,
      '&:focus': {
        top: 8
      },
      transition: 'top 0.2s ease'
    }}
  >
    Skip to main content
  </Box>
);

// Keyboard navigation helper
export const useKeyboardNavigation = (
  items: string[],
  onSelect: (index: number) => void,
  enabled: boolean = true
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect(selectedIndex);
          break;
        case 'Escape':
          event.preventDefault();
          setSelectedIndex(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, selectedIndex, onSelect, enabled]);

  return { selectedIndex, setSelectedIndex };
};

// Focus trap for modals and dialogs
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  enabled: boolean;
}> = ({ children, enabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  );
};

// Screen reader announcements
export const ScreenReaderAnnouncement: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
}> = ({ message, priority = 'polite' }) => (
  <Box
    component="div"
    aria-live={priority}
    aria-atomic="true"
    sx={{
      position: 'absolute',
      left: -10000,
      width: 1,
      height: 1,
      overflow: 'hidden'
    }}
  >
    {message}
  </Box>
);

// High contrast mode toggle
export const HighContrastToggle: React.FC<{
  onToggle: (enabled: boolean) => void;
}> = ({ onToggle }) => {
  const [highContrast, setHighContrast] = useState(false);

  const handleToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    onToggle(newValue);
    
    // Apply high contrast styles to document
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  return (
    <Tooltip title={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}>
      <IconButton
        onClick={handleToggle}
        aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
        sx={{
          color: highContrast ? '#ffff00' : '#94a3b8',
          '&:hover': { color: highContrast ? '#ffff88' : '#f1f5f9' }
        }}
      >
        {highContrast ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </IconButton>
    </Tooltip>
  );
};

// Keyboard shortcuts display
export const KeyboardShortcuts: React.FC<{
  shortcuts: Array<{
    key: string;
    description: string;
    action?: () => void;
  }>;
  visible: boolean;
}> = ({ shortcuts, visible }) => (
  <Fade in={visible}>
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: '#1e293b',
        border: '2px solid #3b82f6',
        borderRadius: 2,
        p: 3,
        maxWidth: 400,
        zIndex: 9999,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}
      role="dialog"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <Typography
        id="keyboard-shortcuts-title"
        variant="h6"
        sx={{ color: 'white', mb: 2, textAlign: 'center' }}
      >
        Keyboard Shortcuts
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {shortcuts.map((shortcut, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: '#374151' }
            }}
          >
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {shortcut.description}
            </Typography>
            <Box
              sx={{
                bgcolor: '#374151',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: 'white',
                border: '1px solid #4b5563'
              }}
            >
              {shortcut.key}
            </Box>
          </Box>
        ))}
      </Box>
      
      <Typography
        variant="caption"
        sx={{ color: '#6b7280', textAlign: 'center', display: 'block', mt: 2 }}
      >
        Press Escape to close
      </Typography>
    </Box>
  </Fade>
);

// Accessible button with enhanced feedback
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  shortcut?: string;
}> = ({
  children,
  onClick,
  ariaLabel,
  description,
  disabled = false,
  variant = 'contained',
  size = 'medium',
  shortcut
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <Tooltip 
      title={description || ariaLabel || ''} 
      placement="top"
      TransitionComponent={Zoom}
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        aria-describedby={description ? 'button-description' : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        sx={{
          position: 'relative',
          '&:focus': {
            outline: '2px solid #3b82f6',
            outlineOffset: 2
          },
          '&:focus-visible': {
            outline: '2px solid #3b82f6',
            outlineOffset: 2
          }
        }}
      >
        {children}
        {shortcut && focused && (
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              right: 0,
              bgcolor: '#1e293b',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              border: '1px solid #374151',
              zIndex: 1000
            }}
          >
            {shortcut}
          </Box>
        )}
      </Button>
    </Tooltip>
  );
};

// Accessibility status indicator
export const AccessibilityStatus: React.FC<{
  features: {
    screenReader: boolean;
    keyboardNavigation: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}> = ({ features }) => {
  const activeFeatures = Object.entries(features).filter(([_, enabled]) => enabled);

  if (activeFeatures.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        bgcolor: '#1e293b',
        border: '1px solid #3b82f6',
        borderRadius: 2,
        p: 2,
        zIndex: 1000,
        maxWidth: 200
      }}
      role="status"
      aria-label="Accessibility features active"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AccessibilityIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
          Accessibility Active
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {activeFeatures.map(([feature, _]) => (
          <Typography
            key={feature}
            variant="caption"
            sx={{ color: '#94a3b8', fontSize: '0.7rem' }}
          >
            • {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default {
  SkipToContent,
  useKeyboardNavigation,
  FocusTrap,
  ScreenReaderAnnouncement,
  HighContrastToggle,
  KeyboardShortcuts,
  AccessibleButton,
  AccessibilityStatus
};

