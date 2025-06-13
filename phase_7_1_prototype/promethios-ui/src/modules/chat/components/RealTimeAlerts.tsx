import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  LinearProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Shield as ShieldIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ObserverIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import {
  GovernanceAlert,
  AlertSeverity,
  AlertType,
  ViolationSeverity
} from '../types';

interface GovernanceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  source: 'observer' | 'system' | 'agent';
  actionRequired?: boolean;
  recommendation?: string;
  metadata?: Record<string, any>;
}

enum AlertType {
  COMPLIANCE_VIOLATION = 'compliance_violation',
  TRUST_SCORE_LOW = 'trust_score_low',
  RISK_THRESHOLD_EXCEEDED = 'risk_threshold_exceeded',
  POLICY_VIOLATION = 'policy_violation',
  OBSERVER_SUGGESTION = 'observer_suggestion',
  SYSTEM_WARNING = 'system_warning',
  GOVERNANCE_SUCCESS = 'governance_success'
}

enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

interface RealTimeAlertsProps {
  alerts: GovernanceAlert[];
  onDismissAlert?: (alertId: string) => void;
  onClearAll?: () => void;
  maxVisible?: number;
  autoHide?: boolean;
  compact?: boolean;
}

export const RealTimeAlerts: React.FC<RealTimeAlertsProps> = ({
  alerts,
  onDismissAlert,
  onClearAll,
  maxVisible = 5,
  autoHide = true,
  compact = false
}) => {
  const [visibleAlerts, setVisibleAlerts] = useState<GovernanceAlert[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Sort alerts by severity and timestamp
    const sortedAlerts = [...alerts].sort((a, b) => {
      const severityOrder = {
        [AlertSeverity.CRITICAL]: 5,
        [AlertSeverity.HIGH]: 4,
        [AlertSeverity.MEDIUM]: 3,
        [AlertSeverity.LOW]: 2,
        [AlertSeverity.INFO]: 1
      };
      
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setVisibleAlerts(sortedAlerts.slice(0, maxVisible));

    // Auto-hide info alerts after delay
    if (autoHide) {
      sortedAlerts.forEach(alert => {
        if (alert.severity === AlertSeverity.INFO && onDismissAlert) {
          setTimeout(() => {
            onDismissAlert(alert.id);
          }, 5000);
        }
      });
    }
  }, [alerts, maxVisible, autoHide, onDismissAlert]);

  const getAlertIcon = (alert: GovernanceAlert) => {
    switch (alert.severity) {
      case AlertSeverity.CRITICAL:
        return <ErrorIcon />;
      case AlertSeverity.HIGH:
        return <WarningIcon />;
      case AlertSeverity.MEDIUM:
        return <WarningIcon />;
      case AlertSeverity.LOW:
        return <InfoIcon />;
      case AlertSeverity.INFO:
        return alert.source === 'observer' ? <ObserverIcon /> : <InfoIcon />;
      default:
        return <NotificationIcon />;
    }
  };

  const getAlertColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#9C27B0'; // Purple for critical
      case AlertSeverity.HIGH:
        return '#F44336'; // Red for high
      case AlertSeverity.MEDIUM:
        return '#FF9800'; // Orange for medium
      case AlertSeverity.LOW:
        return '#2196F3'; // Blue for low
      case AlertSeverity.INFO:
        return '#4CAF50'; // Green for info
      default:
        return '#757575';
    }
  };

  const getAlertSeverityText = (severity: AlertSeverity) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'observer':
        return <ObserverIcon sx={{ fontSize: 16 }} />;
      case 'system':
        return <SecurityIcon sx={{ fontSize: 16 }} />;
      case 'agent':
        return <AutoAwesomeIcon sx={{ fontSize: 16 }} />;
      default:
        return <NotificationIcon sx={{ fontSize: 16 }} />;
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  const criticalCount = alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
  const highCount = alerts.filter(a => a.severity === AlertSeverity.HIGH).length;
  const totalActionRequired = alerts.filter(a => a.actionRequired).length;

  return (
    <Box sx={{ width: compact ? 300 : '100%' }}>
      {/* Alert Summary */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 1,
          bgcolor: criticalCount > 0 ? '#9C27B020' : highCount > 0 ? '#F4433620' : '#4CAF5020',
          border: 1,
          borderColor: criticalCount > 0 ? '#9C27B040' : highCount > 0 ? '#F4433640' : '#4CAF5040'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={alerts.length} color="error" max={99}>
              <NotificationIcon />
            </Badge>
            <Typography variant="subtitle2" sx={{ ml: 1 }}>
              Governance Alerts
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {criticalCount > 0 && (
              <Chip
                label={`${criticalCount} Critical`}
                size="small"
                sx={{ bgcolor: '#9C27B0', color: 'white' }}
              />
            )}
            {highCount > 0 && (
              <Chip
                label={`${highCount} High`}
                size="small"
                sx={{ bgcolor: '#F44336', color: 'white' }}
              />
            )}
            {totalActionRequired > 0 && (
              <Chip
                label={`${totalActionRequired} Action Required`}
                size="small"
                variant="outlined"
                color="warning"
              />
            )}

            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Alert List */}
      <Collapse in={expanded || !compact}>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {visibleAlerts.map((alert, index) => (
            <Zoom
              key={alert.id}
              in={true}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Paper
                elevation={1}
                sx={{
                  mb: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderLeft: 4,
                  borderLeftColor: getAlertColor(alert.severity)
                }}
              >
                <ListItem
                  sx={{
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                >
                  {/* Alert Icon */}
                  <ListItemIcon sx={{ mt: 0.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: getAlertColor(alert.severity),
                        width: 32,
                        height: 32
                      }}
                    >
                      {React.cloneElement(getAlertIcon(alert), { sx: { fontSize: 18, color: 'white' } })}
                    </Avatar>
                  </ListItemIcon>

                  {/* Alert Content */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {alert.title}
                        </Typography>
                        <Chip
                          label={getAlertSeverityText(alert.severity)}
                          size="small"
                          sx={{
                            ml: 1,
                            bgcolor: getAlertColor(alert.severity),
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {alert.message}
                        </Typography>

                        {/* Recommendation */}
                        {alert.recommendation && (
                          <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                            <Typography variant="caption">
                              <strong>Recommendation:</strong> {alert.recommendation}
                            </Typography>
                          </Alert>
                        )}

                        {/* Metadata */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getSourceIcon(alert.source)}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                              {alert.source.charAt(0).toUpperCase() + alert.source.slice(1)}
                            </Typography>
                          </Box>

                          <Typography variant="caption" color="text.secondary">
                            {alert.timestamp.toLocaleTimeString()}
                          </Typography>

                          {alert.actionRequired && (
                            <Chip
                              label="Action Required"
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: '0.6rem', height: 18 }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />

                  {/* Dismiss Button */}
                  {onDismissAlert && (
                    <IconButton
                      size="small"
                      onClick={() => onDismissAlert(alert.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'error.contrastText'
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItem>
              </Paper>
            </Zoom>
          ))}
        </List>

        {/* Show More / Clear All */}
        {alerts.length > maxVisible && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {visibleAlerts.length} of {alerts.length} alerts
            </Typography>
          </Box>
        )}

        {onClearAll && alerts.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Chip
              label="Clear All Alerts"
              onClick={onClearAll}
              size="small"
              variant="outlined"
              color="secondary"
            />
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

// Predefined alert templates for common scenarios
export const AlertTemplates = {
  complianceViolation: (violationType: string, description: string): GovernanceAlert => ({
    id: `compliance_${Date.now()}`,
    type: AlertType.COMPLIANCE_VIOLATION,
    severity: AlertSeverity.HIGH,
    title: 'Compliance Violation Detected',
    message: `${violationType}: ${description}`,
    timestamp: new Date(),
    source: 'system',
    actionRequired: true,
    recommendation: 'Review message content and adjust governance policies if needed'
  }),

  observerSuggestion: (suggestion: string): GovernanceAlert => ({
    id: `observer_${Date.now()}`,
    type: AlertType.OBSERVER_SUGGESTION,
    severity: AlertSeverity.INFO,
    title: 'Observer Suggestion',
    message: suggestion,
    timestamp: new Date(),
    source: 'observer',
    actionRequired: false
  }),

  trustScoreLow: (score: number, threshold: number): GovernanceAlert => ({
    id: `trust_${Date.now()}`,
    type: AlertType.TRUST_SCORE_LOW,
    severity: AlertSeverity.MEDIUM,
    title: 'Low Trust Score',
    message: `Trust score (${score}) is below threshold (${threshold})`,
    timestamp: new Date(),
    source: 'system',
    actionRequired: true,
    recommendation: 'Consider reviewing agent responses and governance settings'
  }),

  riskThresholdExceeded: (riskLevel: string): GovernanceAlert => ({
    id: `risk_${Date.now()}`,
    type: AlertType.RISK_THRESHOLD_EXCEEDED,
    severity: AlertSeverity.CRITICAL,
    title: 'Risk Threshold Exceeded',
    message: `Risk level escalated to ${riskLevel.toUpperCase()}`,
    timestamp: new Date(),
    source: 'system',
    actionRequired: true,
    recommendation: 'Immediate review required - consider halting conversation'
  }),

  governanceSuccess: (message: string): GovernanceAlert => ({
    id: `success_${Date.now()}`,
    type: AlertType.GOVERNANCE_SUCCESS,
    severity: AlertSeverity.INFO,
    title: 'Governance Success',
    message,
    timestamp: new Date(),
    source: 'system',
    actionRequired: false
  })
};

