import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  Badge,
  Box,
  Typography,
  Fade,
  Zoom
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { keyframes, styled } from '@mui/material/styles';
import SuperEnhancedObserverAgent from './SuperEnhancedObserverAgent';

// Enhanced pulsing animation with multiple effects
const pulseAnimation = keyframes`
  0% {
    transform: scale(1) translateX(0);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  25% {
    transform: scale(1.05) translateX(8px);
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.5);
  }
  50% {
    transform: scale(1.1) translateX(12px);
    box-shadow: 0 0 0 20px rgba(59, 130, 246, 0.3);
  }
  75% {
    transform: scale(1.05) translateX(8px);
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.1);
  }
  100% {
    transform: scale(1) translateX(0);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

// Attention-grabbing glow effect
const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6);
  }
  100% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  }
`;

// Floating animation for subtle movement
const floatAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const SuperPulsingButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: 100,
  left: 20,
  width: 64,
  height: 64,
  backgroundColor: '#3b82f6',
  color: 'white',
  zIndex: 1300,
  animation: `${pulseAnimation} 3s infinite, ${glowAnimation} 2s infinite, ${floatAnimation} 4s ease-in-out infinite`,
  '&:hover': {
    backgroundColor: '#2563eb',
    transform: 'scale(1.15)',
    animation: 'none', // Stop animations on hover
    boxShadow: '0 0 25px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.6)',
  },
  transition: 'all 0.3s ease-in-out',
  borderRadius: '50%',
  border: '3px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4)',
    zIndex: -1,
    animation: `${glowAnimation} 3s infinite`,
  }
}));

const NotificationDot = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: '#ef4444',
  animation: `${pulseAnimation} 1.5s infinite`,
  border: '2px solid white',
}));

const HoverCard = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 80,
  backgroundColor: '#1e293b',
  color: 'white',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #3b82f6',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
  minWidth: 200,
  zIndex: 1301,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 20,
    left: -8,
    width: 0,
    height: 0,
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent',
    borderRight: '8px solid #3b82f6',
  }
}));

interface SuperEnhancedObserverButtonProps {
  dashboardData?: any;
  currentContext?: string;
  hasNotifications?: boolean;
}

const SuperEnhancedObserverButton: React.FC<SuperEnhancedObserverButtonProps> = ({
  dashboardData,
  currentContext = 'dashboard',
  hasNotifications = true
}) => {
  const [isObserverOpen, setIsObserverOpen] = useState(false);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(true);

  // Pulse more aggressively when there are issues
  useEffect(() => {
    const hasIssues = dashboardData?.violations && parseInt(dashboardData.violations) > 0;
    const lowTrust = dashboardData?.trustScore && parseInt(dashboardData.trustScore) < 85;
    
    if (hasIssues || lowTrust) {
      setShouldPulse(true);
    }
  }, [dashboardData]);

  const handleToggleObserver = () => {
    setIsObserverOpen(!isObserverOpen);
    setShowHoverCard(false);
  };

  const getNotificationCount = () => {
    let count = 0;
    if (dashboardData?.violations && parseInt(dashboardData.violations) > 0) {
      count += parseInt(dashboardData.violations);
    }
    if (dashboardData?.trustScore && parseInt(dashboardData.trustScore) < 85) {
      count += 1;
    }
    return count;
  };

  const getHoverContent = () => {
    const violations = dashboardData?.violations ? parseInt(dashboardData.violations) : 0;
    const trustScore = dashboardData?.trustScore ? parseInt(dashboardData.trustScore) : 0;
    
    return {
      title: "Promethios Observer",
      subtitle: "AI Governance Assistant",
      status: violations > 0 ? "Attention Required" : "All Systems Operational",
      details: [
        `Trust Score: ${trustScore || 'N/A'}`,
        `Violations: ${violations}`,
        `Context: ${currentContext}`
      ]
    };
  };

  return (
    <>
      <Tooltip 
        title="Open Promethios Observer - Your AI Governance Assistant"
        placement="right"
        arrow
      >
        <Box
          sx={{ position: 'relative' }}
          onMouseEnter={() => setShowHoverCard(true)}
          onMouseLeave={() => setShowHoverCard(false)}
        >
          <SuperPulsingButton
            onClick={handleToggleObserver}
            sx={{
              animation: shouldPulse ? undefined : 'none',
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 28 }} />
            
            {/* Notification indicator */}
            {hasNotifications && getNotificationCount() > 0 && (
              <Badge
                badgeContent={getNotificationCount()}
                color="error"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    minWidth: 20,
                    height: 20,
                    animation: `${pulseAnimation} 2s infinite`
                  }
                }}
              />
            )}
          </SuperPulsingButton>

          {/* Hover card */}
          <Fade in={showHoverCard}>
            <HoverCard>
              {(() => {
                const content = getHoverContent();
                return (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                      {content.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                      {content.subtitle}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: content.status.includes('Attention') ? '#ef4444' : '#22c55e',
                        fontWeight: 600,
                        display: 'block',
                        mb: 1
                      }}
                    >
                      {content.status}
                    </Typography>
                    {content.details.map((detail, index) => (
                      <Typography key={index} variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                        {detail}
                      </Typography>
                    ))}
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1, fontStyle: 'italic' }}>
                      Click to open comprehensive governance assistant
                    </Typography>
                  </>
                );
              })()}
            </HoverCard>
          </Fade>
        </Box>
      </Tooltip>

      {/* Super Enhanced Observer Agent */}
      <SuperEnhancedObserverAgent
        isOpen={isObserverOpen}
        onClose={() => setIsObserverOpen(false)}
        dashboardData={dashboardData}
        currentContext={currentContext}
      />
    </>
  );
};

export default SuperEnhancedObserverButton;

