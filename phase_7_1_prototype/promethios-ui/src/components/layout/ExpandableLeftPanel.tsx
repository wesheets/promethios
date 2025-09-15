/**
 * ExpandableLeftPanel
 * 
 * A revolutionary panel system that allows UI pages to slide out from the left navigation
 * while keeping the chat interface active and responsive. Perfect for quick social feed
 * checks, profile browsing, or any UI page without losing chat context.
 */

import React, { useState, useEffect } from 'react';
import { Box, IconButton, Slide, Fade } from '@mui/material';
import { Close as CloseIcon, ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface ExpandableLeftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetRoute?: string;
  panelWidth?: string;
  children?: React.ReactNode;
}

const ExpandableLeftPanel: React.FC<ExpandableLeftPanelProps> = ({
  isOpen,
  onClose,
  targetRoute,
  panelWidth = '50%',
  children
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [panelContent, setPanelContent] = useState<React.ReactNode>(null);

  // Handle route navigation within the panel
  useEffect(() => {
    if (isOpen && targetRoute && targetRoute !== location.pathname) {
      // Store current route to return to later
      const currentRoute = location.pathname;
      
      // Navigate to target route for rendering in panel
      navigate(targetRoute);
      
      // TODO: We'll need to implement a way to render the route content
      // within this panel instead of full page navigation
    }
  }, [isOpen, targetRoute, navigate, location.pathname]);

  const handleClose = () => {
    onClose();
    // Optional: Return to previous route if needed
  };

  return (
    <>
      {/* Backdrop for mobile/smaller screens */}
      <Fade in={isOpen}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1200,
            display: { xs: 'block', md: 'none' }
          }}
          onClick={handleClose}
        />
      </Fade>

      {/* Expandable Panel */}
      <Slide direction="right" in={isOpen} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 64, // After the left navigation bar
            bottom: 0,
            width: panelWidth,
            backgroundColor: '#1e293b',
            borderRight: '1px solid #334155',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Panel Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid #334155',
              backgroundColor: '#0f172a'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleClose}
                sx={{ 
                  color: '#94a3b8',
                  '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.1)' }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Box sx={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 500 }}>
                {targetRoute?.includes('social') && 'Social Feed'}
                {targetRoute?.includes('profile') && 'Profile'}
                {targetRoute?.includes('organization') && 'Organization'}
                {!targetRoute && 'Panel'}
              </Box>
            </Box>
            
            <IconButton
              onClick={handleClose}
              sx={{ 
                color: '#94a3b8',
                '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Panel Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#1e293b'
            }}
          >
            {children || (
              <Box
                sx={{
                  p: 3,
                  color: '#94a3b8',
                  textAlign: 'center'
                }}
              >
                {targetRoute ? (
                  <>
                    <Box sx={{ mb: 2, fontSize: '1.1rem', color: '#e2e8f0' }}>
                      Loading {targetRoute}...
                    </Box>
                    <Box sx={{ fontSize: '0.9rem' }}>
                      UI page content will render here
                    </Box>
                  </>
                ) : (
                  'Panel content will appear here'
                )}
              </Box>
            )}
          </Box>

          {/* Panel Footer (Optional) */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #334155',
              backgroundColor: '#0f172a',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                fontSize: '0.75rem',
                color: '#64748b',
                textAlign: 'center'
              }}
            >
              Press ESC or click outside to close
            </Box>
          </Box>
        </Box>
      </Slide>
    </>
  );
};

export default ExpandableLeftPanel;

