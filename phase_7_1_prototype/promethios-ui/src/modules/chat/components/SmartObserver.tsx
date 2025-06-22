import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
  Popover,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Dark theme colors
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e',
  info: '#3182ce'
};

// Pulse animation for active monitoring
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(56, 161, 105, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(56, 161, 105, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(56, 161, 105, 0);
  }
`;

const ObserverContainer = styled(Box)(() => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
}));

const ObserverButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'observerState' && prop !== 'isActive'
})(({ observerState, isActive }) => ({
  width: 40,
  height: 40,
  backgroundColor: 
    observerState === 'normal' ? DARK_THEME.success :
    observerState === 'warning' ? DARK_THEME.warning :
    observerState === 'error' ? DARK_THEME.error :
    DARK_THEME.surface,
  color: '#ffffff',
  border: `2px solid ${
    observerState === 'normal' ? DARK_THEME.success :
    observerState === 'warning' ? DARK_THEME.warning :
    observerState === 'error' ? DARK_THEME.error :
    DARK_THEME.border
  }`,
  '&:hover': {
    backgroundColor: 
      observerState === 'normal' ? DARK_THEME.success + 'dd' :
      observerState === 'warning' ? DARK_THEME.warning + 'dd' :
      observerState === 'error' ? DARK_THEME.error + 'dd' :
      DARK_THEME.surface + 'dd',
  },
  ...(isActive && observerState === 'normal' && {
    animation: `${pulse} 2s infinite`
  })
}));

const GovernanceCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  minWidth: 320,
  maxWidth: 400
}));

const MetricItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0'
}));

interface GovernanceMetrics {
  trustScore: number;
  complianceRate: number;
  responseTime: number;
  policyViolations: number;
  observerAlerts: number;
  sessionIntegrity: number;
  lastUpdated: Date;
}

interface GovernanceAlert {
  id: string;
  type: 'policy_violation' | 'trust_drop' | 'compliance_issue' | 'performance_warning';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  agentId?: string;
}

interface SmartObserverProps {
  governanceEnabled: boolean;
  metrics: GovernanceMetrics;
  alerts: GovernanceAlert[];
  isMonitoring: boolean;
  onDetailsClick?: () => void;
}

export const SmartObserver: React.FC<SmartObserverProps> = ({
  governanceEnabled,
  metrics,
  alerts,
  isMonitoring,
  onDetailsClick
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Determine observer state based on metrics and alerts
  const getObserverState = () => {
    if (!governanceEnabled) return 'disabled';
    
    const recentAlerts = alerts.filter(alert => 
      Date.now() - alert.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );
    
    const errorAlerts = recentAlerts.filter(alert => alert.severity === 'error');
    const warningAlerts = recentAlerts.filter(alert => alert.severity === 'warning');
    
    if (errorAlerts.length > 0 || metrics.trustScore < 0.7 || metrics.policyViolations > 0) {
      return 'error';
    }
    
    if (warningAlerts.length > 0 || metrics.trustScore < 0.8 || metrics.responseTime > 3) {
      return 'warning';
    }
    
    return 'normal';
  };

  const observerState = getObserverState();
  const alertCount = alerts.filter(alert => 
    Date.now() - alert.timestamp.getTime() < 5 * 60 * 1000
  ).length;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    onDetailsClick?.();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getObserverIcon = () => {
    switch (observerState) {
      case 'normal':
        return <ShieldIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'disabled':
        return <SecurityIcon sx={{ opacity: 0.5 }} />;
      default:
        return <ShieldIcon />;
    }
  };

  const getTooltipText = () => {
    if (!governanceEnabled) return 'Governance disabled';
    
    switch (observerState) {
      case 'normal':
        return `All systems normal • Trust: ${(metrics.trustScore * 100).toFixed(0)}%`;
      case 'warning':
        return `${alertCount} warning${alertCount !== 1 ? 's' : ''} • Trust: ${(metrics.trustScore * 100).toFixed(0)}%`;
      case 'error':
        return `${alertCount} issue${alertCount !== 1 ? 's' : ''} detected • Trust: ${(metrics.trustScore * 100).toFixed(0)}%`;
      default:
        return 'Click for governance details';
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return DARK_THEME.success;
    if (value >= thresholds.warning) return DARK_THEME.warning;
    return DARK_THEME.error;
  };

  if (!governanceEnabled) {
    return (
      <Tooltip title="Governance disabled">
        <ObserverButton observerState="disabled" isActive={false}>
          <SecurityIcon sx={{ opacity: 0.5 }} />
        </ObserverButton>
      </Tooltip>
    );
  }

  return (
    <ObserverContainer>
      <Tooltip title={getTooltipText()}>
        <Badge 
          badgeContent={alertCount > 0 ? alertCount : undefined}
          color={observerState === 'error' ? 'error' : 'warning'}
          max={9}
        >
          <ObserverButton
            observerState={observerState}
            isActive={isMonitoring}
            onClick={handleClick}
          >
            {getObserverIcon()}
          </ObserverButton>
        </Badge>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <GovernanceCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ color: DARK_THEME.info, mr: 1 }} />
              <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                Governance Monitor
              </Typography>
              <Chip
                label={observerState.toUpperCase()}
                size="small"
                sx={{
                  ml: 'auto',
                  backgroundColor: 
                    observerState === 'normal' ? DARK_THEME.success + '20' :
                    observerState === 'warning' ? DARK_THEME.warning + '20' :
                    DARK_THEME.error + '20',
                  color: 
                    observerState === 'normal' ? DARK_THEME.success :
                    observerState === 'warning' ? DARK_THEME.warning :
                    DARK_THEME.error
                }}
              />
            </Box>

            {/* Key Metrics */}
            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.secondary, mb: 1 }}>
              Key Metrics
            </Typography>
            
            <MetricItem>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedIcon sx={{ fontSize: 16, mr: 1, color: DARK_THEME.info }} />
                <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                  Trust Score
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.trustScore * 100}
                  sx={{
                    width: 60,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStatusColor(metrics.trustScore, { good: 0.8, warning: 0.7 })
                    }
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: getStatusColor(metrics.trustScore, { good: 0.8, warning: 0.7 }),
                    fontWeight: 600,
                    minWidth: 35
                  }}
                >
                  {(metrics.trustScore * 100).toFixed(0)}%
                </Typography>
              </Box>
            </MetricItem>

            <MetricItem>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 16, mr: 1, color: DARK_THEME.info }} />
                <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                  Compliance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.complianceRate * 100}
                  sx={{
                    width: 60,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStatusColor(metrics.complianceRate, { good: 0.9, warning: 0.8 })
                    }
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: getStatusColor(metrics.complianceRate, { good: 0.9, warning: 0.8 }),
                    fontWeight: 600,
                    minWidth: 35
                  }}
                >
                  {(metrics.complianceRate * 100).toFixed(0)}%
                </Typography>
              </Box>
            </MetricItem>

            <MetricItem>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpeedIcon sx={{ fontSize: 16, mr: 1, color: DARK_THEME.info }} />
                <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                  Response Time
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: getStatusColor(3 - metrics.responseTime, { good: 2, warning: 1 }),
                  fontWeight: 600
                }}
              >
                {metrics.responseTime.toFixed(1)}s
              </Typography>
            </MetricItem>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
              <>
                <Divider sx={{ my: 2, borderColor: DARK_THEME.border }} />
                <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.secondary, mb: 1 }}>
                  Recent Alerts
                </Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {alerts.slice(0, 3).map((alert) => (
                    <ListItem key={alert.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {alert.severity === 'error' ? (
                          <ErrorIcon sx={{ fontSize: 16, color: DARK_THEME.error }} />
                        ) : alert.severity === 'warning' ? (
                          <WarningIcon sx={{ fontSize: 16, color: DARK_THEME.warning }} />
                        ) : (
                          <InfoIcon sx={{ fontSize: 16, color: DARK_THEME.info }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={alert.timestamp.toLocaleTimeString()}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { color: DARK_THEME.text.primary, fontSize: '12px' }
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          sx: { color: DARK_THEME.text.secondary, fontSize: '10px' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            <Divider sx={{ my: 2, borderColor: DARK_THEME.border }} />
            <Typography 
              variant="caption" 
              sx={{ 
                color: DARK_THEME.text.secondary,
                display: 'block',
                textAlign: 'center'
              }}
            >
              Last updated: {metrics.lastUpdated.toLocaleTimeString()}
            </Typography>
          </CardContent>
        </GovernanceCard>
      </Popover>
    </ObserverContainer>
  );
};

export default SmartObserver;

