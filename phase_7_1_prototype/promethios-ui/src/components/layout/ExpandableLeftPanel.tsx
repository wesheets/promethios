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

// Import components that can be rendered in the panel
import SocialFeed from '../social/SocialFeed';
import SocialFeedPage from '../../pages/SocialFeedPage';

interface ExpandableLeftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  route?: string; // Changed from targetRoute to match usage
  targetRoute?: string;
  width?: string; // Added width prop to match usage
  panelWidth?: string;
  children?: React.ReactNode;
}

const ExpandableLeftPanel: React.FC<ExpandableLeftPanelProps> = ({
  isOpen,
  onClose,
  route,
  targetRoute,
  width,
  panelWidth,
  children
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [panelContent, setPanelContent] = useState<React.ReactNode>(null);

  // Use route or targetRoute (for compatibility)
  const currentRoute = route || targetRoute;
  // Use width or panelWidth (for compatibility)
  const currentWidth = width || panelWidth || '600px';

  // Function to render content based on route
  const renderPanelContent = () => {
    console.log('🔍 [ExpandableLeftPanel] renderPanelContent called');
    console.log('🔍 [ExpandableLeftPanel] currentRoute:', currentRoute);
    console.log('🔍 [ExpandableLeftPanel] route prop:', route);
    console.log('🔍 [ExpandableLeftPanel] targetRoute prop:', targetRoute);
    console.log('🔍 [ExpandableLeftPanel] children:', !!children);
    
    if (children) {
      console.log('🔍 [ExpandableLeftPanel] Returning children');
      return children;
    }

    if (!currentRoute) {
      console.log('🔍 [ExpandableLeftPanel] No currentRoute, showing placeholder');
      return (
        <Box
          sx={{
            p: 3,
            color: '#94a3b8',
            textAlign: 'center'
          }}
        >
          Panel content will appear here
        </Box>
      );
    }

    console.log('🔍 [ExpandableLeftPanel] Checking route matches...');
    console.log('🔍 [ExpandableLeftPanel] social check:', currentRoute.includes('social'));
    console.log('🔍 [ExpandableLeftPanel] social-feed check:', currentRoute.includes('social-feed'));

    // Route-based content rendering
    switch (true) {
      case currentRoute.includes('social-feed') || currentRoute.includes('social'):
        console.log('🎯 [ExpandableLeftPanel] Rendering SocialFeedPage');
        return <SocialFeedPage />;
      
      case currentRoute.includes('profile'):
        console.log('🎯 [ExpandableLeftPanel] Rendering Profile placeholder');
        return (
          <Box sx={{ p: 3, color: '#e2e8f0' }}>
            <h2>Profile</h2>
            <p>Profile content will be implemented here</p>
          </Box>
        );
      
      case currentRoute.includes('organization'):
        console.log('🎯 [ExpandableLeftPanel] Rendering Organization placeholder');
        return (
          <Box sx={{ p: 3, color: '#e2e8f0' }}>
            <h2>Organization</h2>
            <p>Organization content will be implemented here</p>
          </Box>
        );
      
      case currentRoute.includes('discovery'):
        console.log('🎯 [ExpandableLeftPanel] Rendering Discovery placeholder');
        return (
          <Box sx={{ p: 3, color: '#e2e8f0' }}>
            <h2>Discovery</h2>
            <p>Discovery content will be implemented here</p>
          </Box>
        );
      
      default:
        console.log('🎯 [ExpandableLeftPanel] Rendering default loading content for:', currentRoute);
        return (
          <Box
            sx={{
              p: 3,
              color: '#94a3b8',
              textAlign: 'center'
            }}
          >
            <Box sx={{ mb: 2, fontSize: '1.1rem', color: '#e2e8f0' }}>
              Loading {currentRoute}...
            </Box>
            <Box sx={{ fontSize: '0.9rem' }}>
              Content for this route is being implemented
            </Box>
          </Box>
        );
    }
  };

  // Handle route navigation within the panel
  useEffect(() => {
    if (isOpen && currentRoute && currentRoute !== location.pathname) {
      // Store current route to return to later
      const currentLocationRoute = location.pathname;
      
      // Note: We're not navigating anymore, just rendering content in panel
      console.log(`📱 Panel opened for route: ${currentRoute}`);
    }
  }, [isOpen, currentRoute, location.pathname]);

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
            width: currentWidth,
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
                {currentRoute?.includes('social') && 'Social Feed'}
                {currentRoute?.includes('profile') && 'Profile'}
                {currentRoute?.includes('organization') && 'Organization'}
                {currentRoute?.includes('discovery') && 'Discovery'}
                {!currentRoute && 'Panel'}
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
            {renderPanelContent()}
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

