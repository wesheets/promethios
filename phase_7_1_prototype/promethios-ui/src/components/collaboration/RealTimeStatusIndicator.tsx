/**
 * RealTimeStatusIndicator - Shows real-time connection and sync status
 * Provides visual feedback about participant synchronization
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Fade,
  IconButton,
  Popover
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useUnifiedParticipantsOptional } from '../../contexts/UnifiedParticipantContext';

export interface RealTimeStatusIndicatorProps {
  compact?: boolean; // Show compact version
  showDetails?: boolean; // Show detailed status info
}

export const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({
  compact = false,
  showDetails = true
}) => {
  const participantContext = useUnifiedParticipantsOptional();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);

  // If no context, don't show anything (unified system not enabled)
  if (!participantContext) {
    return null;
  }

  const {
    isConnected,
    loading,
    error,
    participants,
    lastUpdate,
    getActiveParticipants,
    getPendingParticipants
  } = participantContext;

  // Show animation when participants update
  useEffect(() => {
    if (lastUpdate) {
      setShowUpdateAnimation(true);
      const timer = setTimeout(() => {
        setShowUpdateAnimation(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  // Get status info
  const getStatusInfo = () => {
    if (error) {
      return {
        status: 'error' as const,
        icon: <ErrorIcon />,
        color: '#ef4444',
        label: 'Connection Error',
        description: error
      };
    }

    if (loading) {
      return {
        status: 'loading' as const,
        icon: <SyncIcon className="animate-spin" />,
        color: '#f59e0b',
        label: 'Connecting...',
        description: 'Establishing real-time connection'
      };
    }

    if (!isConnected) {
      return {
        status: 'disconnected' as const,
        icon: <WifiOffIcon />,
        color: '#6b7280',
        label: 'Disconnected',
        description: 'Real-time updates unavailable'
      };
    }

    return {
      status: 'connected' as const,
      icon: <CheckCircleIcon />,
      color: '#10b981',
      label: 'Connected',
      description: 'Real-time updates active'
    };
  };

  const statusInfo = getStatusInfo();
  const activeCount = getActiveParticipants().length;
  const pendingCount = getPendingParticipants().length;

  // Handle info popover
  const handleInfoClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Compact version
  if (compact) {
    return (
      <Tooltip title={`${statusInfo.label} • ${activeCount} active participants`}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: `${statusInfo.color}20`,
            border: `1px solid ${statusInfo.color}40`,
            cursor: 'pointer'
          }}
          onClick={handleInfoClick}
        >
          <Box
            sx={{
              color: statusInfo.color,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.8rem'
            }}
          >
            {statusInfo.icon}
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: statusInfo.color,
              fontWeight: 500,
              fontSize: '0.7rem'
            }}
          >
            {activeCount}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  // Full version
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Connection Status */}
      <Fade in={true}>
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.label}
          size="small"
          sx={{
            bgcolor: `${statusInfo.color}20`,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}40`,
            '& .MuiChip-icon': {
              color: statusInfo.color
            },
            fontSize: '0.7rem',
            height: 24
          }}
        />
      </Fade>

      {/* Participant Count */}
      {isConnected && (
        <Fade in={showUpdateAnimation} timeout={300}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: '#374151',
              border: '1px solid #4b5563'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#10b981',
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
            >
              {activeCount} active
            </Typography>
            {pendingCount > 0 && (
              <>
                <Box sx={{ width: 1, height: 12, bgcolor: '#6b7280' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#f59e0b',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                >
                  {pendingCount} pending
                </Typography>
              </>
            )}
          </Box>
        </Fade>
      )}

      {/* Details Button */}
      {showDetails && (
        <Tooltip title="View connection details">
          <IconButton
            size="small"
            onClick={handleInfoClick}
            sx={{
              color: '#94a3b8',
              '&:hover': {
                color: '#e2e8f0'
              }
            }}
          >
            <InfoIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Details Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleInfoClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
            border: '1px solid #334155',
            minWidth: 250
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Real-Time Status
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Connection Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: statusInfo.color, display: 'flex' }}>
                {statusInfo.icon}
              </Box>
              <Typography variant="body2">
                {statusInfo.description}
              </Typography>
            </Box>

            {/* Last Update */}
            {lastUpdate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Last update: {lastUpdate.toLocaleTimeString()}
                </Typography>
              </Box>
            )}

            {/* Participant Summary */}
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #334155' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.5, display: 'block' }}>
                Participants:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`${activeCount} Active`}
                  size="small"
                  sx={{
                    bgcolor: '#10b98120',
                    color: '#10b981',
                    fontSize: '0.6rem',
                    height: 20
                  }}
                />
                {pendingCount > 0 && (
                  <Chip
                    label={`${pendingCount} Pending`}
                    size="small"
                    sx={{
                      bgcolor: '#f59e0b20',
                      color: '#f59e0b',
                      fontSize: '0.6rem',
                      height: 20
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default RealTimeStatusIndicator;

