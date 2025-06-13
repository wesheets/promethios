/**
 * Governance Panel component for displaying compliance metrics and alerts
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  LinearProgress,
  Alert,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { 
  GovernanceMetric, 
  GovernanceAlert, 
  governanceMonitoringService 
} from '../services/GovernanceMonitoringService';

interface GovernancePanelProps {
  collapsed?: boolean;
}

export const GovernancePanel: React.FC<GovernancePanelProps> = ({ 
  collapsed = false 
}) => {
  const [metrics, setMetrics] = useState<GovernanceMetric[]>([]);
  const [alerts, setAlerts] = useState<GovernanceAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  useEffect(() => {
    const handleUpdate = (newMetrics: GovernanceMetric[], newAlerts: GovernanceAlert[]) => {
      setMetrics(newMetrics);
      setAlerts(newAlerts);
    };

    governanceMonitoringService.addListener(handleUpdate);
    
    // Initial load
    setMetrics(governanceMonitoringService.getMetrics());
    setAlerts(governanceMonitoringService.getAlerts());

    return () => {
      governanceMonitoringService.removeListener(handleUpdate);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'violation':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'warning':
        return 'warning';
      case 'violation':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Typography variant="h6" component="h3">
          Governance Monitoring
        </Typography>
        <IconButton size="small">
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ mt: 2 }}>
          {/* Metrics */}
          <Typography variant="subtitle2" gutterBottom>
            Compliance Metrics
          </Typography>
          
          {metrics.map((metric) => (
            <Box key={metric.id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getStatusIcon(metric.status)}
                <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>
                  {metric.name}
                </Typography>
                <Chip 
                  label={`${metric.value}%`}
                  color={getStatusColor(metric.status) as any}
                  size="small"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metric.value} 
                color={getStatusColor(metric.status) as any}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {metric.description}
              </Typography>
            </Box>
          ))}

          {/* Alerts */}
          {alerts.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recent Alerts
              </Typography>
              {alerts.slice(0, 3).map((alert) => (
                <Alert 
                  key={alert.id}
                  severity={alert.type === 'violation' ? 'error' : 'warning'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.timestamp.toLocaleTimeString()}
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default GovernancePanel;

