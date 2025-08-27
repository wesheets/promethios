/**
 * MobileResponsiveWrapper - Responsive wrapper that adapts the interface for mobile devices
 * Provides touch-optimized interactions and mobile-friendly layouts
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Fab,
  Collapse,
  SwipeableDrawer
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  SmartToy as AIIcon,
  TouchApp as TouchIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

export interface MobileResponsiveWrapperProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  chatInterface: React.ReactNode;
  onMobileMenuToggle?: (open: boolean) => void;
  showMobileOptimizations?: boolean;
}

export const MobileResponsiveWrapper: React.FC<MobileResponsiveWrapperProps> = ({
  children,
  leftPanel,
  rightPanel,
  chatInterface,
  onMobileMenuToggle,
  showMobileOptimizations = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchMode, setTouchMode] = useState(false);

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setTouchMode('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  // Handle mobile menu toggle
  const handleMobileMenuToggle = (open: boolean) => {
    setMobileMenuOpen(open);
    onMobileMenuToggle?.(open);
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#0f172a',
        overflow: 'hidden'
      }}>
        {/* Mobile App Bar */}
        <AppBar 
          position="static" 
          sx={{ 
            bgcolor: '#1e293b', 
            borderBottom: '1px solid #334155',
            zIndex: theme.zIndex.appBar
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important', px: 1 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => handleMobileMenuToggle(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
              Promethios AI
            </Typography>
            
            <IconButton
              color="inherit"
              onClick={() => setRightPanelOpen(true)}
              sx={{ mr: 1 }}
            >
              <PeopleIcon />
            </IconButton>
            
            {showMobileOptimizations && (
              <IconButton
                color="inherit"
                onClick={handleFullscreenToggle}
                size="small"
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            )}
          </Toolbar>
        </AppBar>

        {/* Main Chat Interface - Full Screen on Mobile */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {chatInterface}
        </Box>

        {/* Left Panel - Swipeable Drawer */}
        <SwipeableDrawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => handleMobileMenuToggle(false)}
          onOpen={() => handleMobileMenuToggle(true)}
          disableSwipeToOpen={false}
          PaperProps={{
            sx: {
              width: isSmallMobile ? '85vw' : '320px',
              bgcolor: '#1e293b',
              borderRight: '1px solid #334155'
            }
          }}
        >
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Mobile Panel Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                Menu
              </Typography>
              <IconButton 
                onClick={() => handleMobileMenuToggle(false)}
                sx={{ color: '#94a3b8' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Panel Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {leftPanel}
            </Box>
          </Box>
        </SwipeableDrawer>

        {/* Right Panel - Swipeable Drawer */}
        <SwipeableDrawer
          anchor="right"
          open={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          onOpen={() => setRightPanelOpen(true)}
          disableSwipeToOpen={false}
          PaperProps={{
            sx: {
              width: isSmallMobile ? '85vw' : '320px',
              bgcolor: '#1e293b',
              borderLeft: '1px solid #334155'
            }
          }}
        >
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Mobile Panel Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                Collaboration
              </Typography>
              <IconButton 
                onClick={() => setRightPanelOpen(false)}
                sx={{ color: '#94a3b8' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Panel Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {rightPanel}
            </Box>
          </Box>
        </SwipeableDrawer>

        {/* Touch Mode Indicator */}
        {touchMode && showMobileOptimizations && (
          <Fab
            size="small"
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              bgcolor: '#8b5cf6',
              color: 'white',
              zIndex: theme.zIndex.fab,
              '&:hover': { bgcolor: '#7c3aed' }
            }}
          >
            <TouchIcon sx={{ fontSize: 16 }} />
          </Fab>
        )}
      </Box>
    );
  }

  // Tablet layout
  if (isTablet) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex',
        bgcolor: '#0f172a',
        overflow: 'hidden'
      }}>
        {/* Left Panel - Collapsible */}
        <Collapse in={!mobileMenuOpen} orientation="horizontal">
          <Box sx={{ 
            width: 280, 
            borderRight: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {leftPanel}
          </Box>
        </Collapse>

        {/* Main Content */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {chatInterface}
        </Box>

        {/* Right Panel - Collapsible */}
        <Collapse in={rightPanelOpen} orientation="horizontal">
          <Box sx={{ 
            width: 320, 
            borderLeft: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {rightPanel}
          </Box>
        </Collapse>

        {/* Tablet Controls */}
        <Box sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 1,
          zIndex: theme.zIndex.fab
        }}>
          <Fab
            size="small"
            onClick={() => handleMobileMenuToggle(!mobileMenuOpen)}
            sx={{ bgcolor: '#3b82f6', color: 'white' }}
          >
            <MenuIcon sx={{ fontSize: 16 }} />
          </Fab>
          <Fab
            size="small"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            sx={{ bgcolor: '#8b5cf6', color: 'white' }}
          >
            <PeopleIcon sx={{ fontSize: 16 }} />
          </Fab>
        </Box>
      </Box>
    );
  }

  // Desktop layout - return children as-is
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {children}
    </Box>
  );
};

export default MobileResponsiveWrapper;

