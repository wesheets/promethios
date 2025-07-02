import React, { useState, useEffect } from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  Box,
  Typography,
  Zoom,
  Slide
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

interface ObserverFloatingButtonProps {
  onClick: () => void;
  hasAlerts?: boolean;
  dashboardData?: any;
  isNavigationCollapsed?: boolean;
}

const ObserverFloatingButton: React.FC<ObserverFloatingButtonProps> = ({
  onClick,
  hasAlerts = false,
  dashboardData,
  isNavigationCollapsed = false
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [bumpOut, setBumpOut] = useState(false);

  // Determine if we should show alerts based on dashboard data
  const shouldShowAlerts = () => {
    if (!dashboardData) return false;
    
    const violations = parseInt(dashboardData.violations || '0');
    const trustScore = parseInt(dashboardData.trustScore || '85');
    
    return violations > 0 || trustScore < 75;
  };

  // Auto-pulse when there are alerts or important updates
  useEffect(() => {
    if (shouldShowAlerts() || hasAlerts) {
      setIsPulsing(true);
      setBumpOut(true);
      
      // Show tooltip briefly to get attention
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }, 1000);
      
      return () => clearTimeout(tooltipTimer);
    } else {
      setIsPulsing(false);
      setBumpOut(false);
    }
  }, [hasAlerts, dashboardData]);

  // Periodic attention-getting pulse
  useEffect(() => {
    const interval = setInterval(() => {
      if (!shouldShowAlerts()) {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000);
      }
    }, 30000); // Pulse every 30 seconds

    return () => clearInterval(interval);
  }, [dashboardData]);

  const getAlertCount = () => {
    if (!dashboardData) return 0;
    
    let count = 0;
    const violations = parseInt(dashboardData.violations || '0');
    const trustScore = parseInt(dashboardData.trustScore || '85');
    
    if (violations > 0) count += violations;
    if (trustScore < 75) count += 1;
    
    return count;
  };

  const getTooltipContent = () => {
    if (!dashboardData) return "Promethios Observer - Your AI Governance Assistant";
    
    const violations = parseInt(dashboardData.violations || '0');
    const trustScore = parseInt(dashboardData.trustScore || '85');
    
    if (violations > 0 && trustScore < 75) {
      return `${violations} policy violations detected and trust score needs attention (${trustScore})`;
    } else if (violations > 0) {
      return `${violations} policy violations need your attention`;
    } else if (trustScore < 75) {
      return `Trust score needs improvement (${trustScore})`;
    }
    
    return "Promethios Observer - Your AI Governance Assistant";
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: isNavigationCollapsed ? 120 : 160,
        left: bumpOut ? (isNavigationCollapsed ? 80 : 100) : (isNavigationCollapsed ? 60 : 80),
        zIndex: 1200,
        transition: 'all 0.3s ease-in-out',
        transform: bumpOut ? 'translateX(20px) scale(1.1)' : 'translateX(0) scale(1)',
      }}
    >
      <Zoom in={true}>
        <Tooltip
          title={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Promethios Observer
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                {getTooltipContent()}
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                Click to open your AI governance assistant
              </Typography>
            </Box>
          }
          placement="right"
          arrow
          open={showTooltip}
          onClose={() => setShowTooltip(false)}
          onOpen={() => setShowTooltip(true)}
        >
          <Badge
            badgeContent={getAlertCount()}
            color="error"
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                minWidth: '18px',
                height: '18px',
                animation: shouldShowAlerts() ? 'pulse 1.5s infinite' : 'none'
              }
            }}
          >
            <Fab
              onClick={onClick}
              sx={{
                width: 64,
                height: 64,
                background: shouldShowAlerts() 
                  ? 'linear-gradient(45deg, #f59e0b 30%, #f97316 90%)'
                  : 'linear-gradient(45deg, #0ea5e9 30%, #3b82f6 90%)',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                animation: isPulsing ? 'observerPulse 2s infinite' : 'none',
                '&:hover': {
                  background: shouldShowAlerts()
                    ? 'linear-gradient(45deg, #f97316 30%, #ea580c 90%)'
                    : 'linear-gradient(45deg, #3b82f6 30%, #2563eb 90%)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                },
                transition: 'all 0.3s ease-in-out',
                '@keyframes observerPulse': {
                  '0%': {
                    transform: 'scale(1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    boxShadow: shouldShowAlerts()
                      ? '0 12px 40px rgba(245, 158, 11, 0.6)'
                      : '0 12px 40px rgba(59, 130, 246, 0.6)'
                  },
                  '100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }
                }
              }}
            >
              {shouldShowAlerts() ? (
                <SecurityIcon sx={{ fontSize: 28 }} />
              ) : (
                <AutoAwesomeIcon sx={{ fontSize: 28 }} />
              )}
            </Fab>
          </Badge>
        </Tooltip>
      </Zoom>
      
      {/* Floating label when bumped out */}
      <Slide direction="right" in={bumpOut} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'absolute',
            left: 80,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 2,
            whiteSpace: 'nowrap',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {shouldShowAlerts() ? 'Attention Needed!' : 'Observer Ready'}
        </Box>
      </Slide>
    </Box>
  );
};

export default ObserverFloatingButton;

