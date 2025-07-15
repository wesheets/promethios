import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Policy as PolicyIcon,
  Gavel as GavelIcon,
  Psychology as PsychologyIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Dark theme colors
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e'
};

const GovernancePanelContainer = styled(Paper)(() => ({
  width: '320px',
  height: '100%',
  backgroundColor: DARK_THEME.surface,
  borderRight: `1px solid ${DARK_THEME.border}`,
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.3s ease-in-out, opacity 0.3s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  
  '&.collapsed': {
    width: '0px',
    borderRight: 'none',
    opacity: 0
  }
}));

const PanelHeader = styled(Box)(() => ({
  padding: '16px',
  borderBottom: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '72px'
}));

const MetricsContainer = styled(Box)(() => ({
  flex: 1,
  overflow: 'auto',
  padding: '8px',
  backgroundColor: DARK_THEME.surface,
  
  '&::-webkit-scrollbar': {
    width: '6px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: DARK_THEME.border,
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: '#718096'
    }
  }
}));

const MetricCard = styled(Card)(() => ({
  marginBottom: '12px',
  backgroundColor: DARK_THEME.background,
  border: `1px solid ${DARK_THEME.border}`,
  transition: 'all 0.2s ease',
  
  '&:hover': {
    borderColor: DARK_THEME.primary,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
  }
}));

const MetricValue = styled(Typography)(() => ({
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: 1,
  marginBottom: '4px',
  color: DARK_THEME.text.primary
}));

const MetricLabel = styled(Typography)(() => ({
  fontSize: '11px',
  color: DARK_THEME.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  fontWeight: 600
}));

const StatusIndicator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  
  '&.healthy': {
    backgroundColor: 'rgba(56, 161, 105, 0.1)',
    color: DARK_THEME.success,
    border: '1px solid rgba(56, 161, 105, 0.2)'
  },
  
  '&.warning': {
    backgroundColor: 'rgba(214, 158, 46, 0.1)',
    color: DARK_THEME.warning,
    border: '1px solid rgba(214, 158, 46, 0.2)'
  },
  
  '&.error': {
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    color: DARK_THEME.error,
    border: '1px solid rgba(229, 62, 62, 0.2)'
  }
}));

const ActivityItem = styled(ListItem)(() => ({
  padding: '8px',
  borderRadius: '4px',
  marginBottom: '4px',
  backgroundColor: 'rgba(49, 130, 206, 0.02)',
  border: '1px solid rgba(49, 130, 206, 0.1)',
  
  '&:hover': {
    backgroundColor: 'rgba(49, 130, 206, 0.05)'
  }
}));

interface GovernanceMetrics {
  trustScore: number;
  complianceRate: number;
  responseTime: number;
  policyViolations: number;
  observerAlerts: number;
  sessionIntegrity: number;
  agentCoordination: number;
  realTimeMonitoring: boolean;
}

interface GovernanceActivity {
  id: string;
  type: 'policy_check' | 'trust_update' | 'observer_alert' | 'compliance_scan';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
  agentId?: string;
}

interface GovernancePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  metrics: GovernanceMetrics;
  activities: GovernanceActivity[];
  governanceEnabled: boolean;
  onGovernanceToggle: (enabled: boolean) => void;
  multiAgentMode: boolean;
}

export const GovernancePanel: React.FC<GovernancePanelProps> = ({
  isOpen,
  onToggle,
  metrics,
  activities,
  governanceEnabled,
  onGovernanceToggle,
  multiAgentMode
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['metrics', 'status']);

  // Defensive check - if metrics is undefined, provide default values
  const safeMetrics = metrics || {
    trustScore: 0,
    complianceRate: 0,
    responseTime: 0,
    sessionIntegrity: 0,
    policyViolations: 0,
    observerAlerts: 0,
    realTimeMonitoring: false,
    agentCoordination: 0
  };

  // Defensive check - if activities is undefined, provide empty array
  const safeActivities = activities || [];

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getMetricColor = (value: number, threshold: number = 0.8) => {
    if (value >= threshold) return 'success';
    if (value >= threshold * 0.7) return 'warning';
    return 'error';
  };

  const getActivityIcon = (type: GovernanceActivity['type']) => {
    switch (type) {
      case 'policy_check': return <PolicyIcon />;
      case 'trust_update': return <ShieldIcon />;
      case 'observer_alert': return <VisibilityIcon />;
      case 'compliance_scan': return <GavelIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const getActivityColor = (severity: GovernanceActivity['severity']) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <GovernancePanelContainer className={isOpen ? '' : 'collapsed'}>
      {/* Panel Header */}
      <PanelHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Governance
          </Typography>
          <Badge 
            badgeContent={(metrics?.policyViolations || 0) + (metrics?.observerAlerts || 0)} 
            color="error"
            invisible={(metrics?.policyViolations || 0) + (metrics?.observerAlerts || 0) === 0}
          >
            <ShieldIcon fontSize="small" />
          </Badge>
        </Box>
        
        <IconButton onClick={onToggle} size="small">
          <CloseIcon />
        </IconButton>
      </PanelHeader>

      {/* Metrics Container */}
      <MetricsContainer>
        {/* Governance Toggle */}
        <Box sx={{ p: 1, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={governanceEnabled}
                onChange={(e) => onGovernanceToggle(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {governanceEnabled ? 'Governance Active' : 'Governance Disabled'}
              </Typography>
            }
          />
        </Box>

        {/* Core Metrics Section */}
        <Accordion 
          expanded={expandedSections.includes('metrics')}
          onChange={() => handleSectionToggle('metrics')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: DARK_THEME.text.primary }} />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: DARK_THEME.text.primary }}>
              Core Metrics
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1 }}>
            {/* Trust Score */}
            <MetricCard>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <MetricLabel>Trust Score</MetricLabel>
                  <ShieldIcon color={getMetricColor(safeMetrics.trustScore)} fontSize="small" />
                </Box>
                <MetricValue color={getMetricColor(safeMetrics.trustScore)}>
                  {(safeMetrics.trustScore * 100).toFixed(0)}%
                </MetricValue>
                <LinearProgress 
                  variant="determinate" 
                  value={safeMetrics.trustScore * 100}
                  color={getMetricColor(safeMetrics.trustScore)}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </MetricCard>

            {/* Compliance Rate */}
            <MetricCard>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <MetricLabel>Compliance Rate</MetricLabel>
                  <CheckCircleIcon color={getMetricColor(safeMetrics.complianceRate)} fontSize="small" />
                </Box>
                <MetricValue color={getMetricColor(safeMetrics.complianceRate)}>
                  {(safeMetrics.complianceRate * 100).toFixed(0)}%
                </MetricValue>
                <LinearProgress 
                  variant="determinate" 
                  value={safeMetrics.complianceRate * 100}
                  color={getMetricColor(safeMetrics.complianceRate)}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </MetricCard>

            {/* Response Time */}
            <MetricCard>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <MetricLabel>Response Time</MetricLabel>
                  <SpeedIcon color="info" fontSize="small" />
                </Box>
                <MetricValue color="info">
                  {safeMetrics.responseTime.toFixed(1)}s
                </MetricValue>
                <Typography variant="caption" color="text.secondary">
                  Average processing time
                </Typography>
              </CardContent>
            </MetricCard>

            {/* Session Integrity */}
            <MetricCard>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <MetricLabel>Session Integrity</MetricLabel>
                  <TimelineIcon color={getMetricColor(safeMetrics.sessionIntegrity)} fontSize="small" />
                </Box>
                <MetricValue color={getMetricColor(safeMetrics.sessionIntegrity)}>
                  {(safeMetrics.sessionIntegrity * 100).toFixed(0)}%
                </MetricValue>
                <LinearProgress 
                  variant="determinate" 
                  value={safeMetrics.sessionIntegrity * 100}
                  color={getMetricColor(safeMetrics.sessionIntegrity)}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </MetricCard>

            {/* Multi-Agent Coordination (if applicable) */}
            {multiAgentMode && (
              <MetricCard>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <MetricLabel>Agent Coordination</MetricLabel>
                    <GroupIcon color={getMetricColor(safeMetrics.agentCoordination)} fontSize="small" />
                  </Box>
                  <MetricValue color={getMetricColor(safeMetrics.agentCoordination)}>
                    {(safeMetrics.agentCoordination * 100).toFixed(0)}%
                  </MetricValue>
                  <LinearProgress 
                    variant="determinate" 
                    value={safeMetrics.agentCoordination * 100}
                    color={getMetricColor(safeMetrics.agentCoordination)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </MetricCard>
            )}
          </AccordionDetails>
        </Accordion>

        {/* System Status Section */}
        <Accordion 
          expanded={expandedSections.includes('status')}
          onChange={() => handleSectionToggle('status')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: DARK_THEME.text.primary }} />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: DARK_THEME.text.primary }}>
              System Status
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <StatusIndicator className={safeMetrics.realTimeMonitoring ? 'healthy' : 'error'}>
                <VisibilityIcon fontSize="small" />
                Real-time Monitoring: {safeMetrics.realTimeMonitoring ? 'Active' : 'Inactive'}
              </StatusIndicator>
              
              <StatusIndicator className={safeMetrics.policyViolations === 0 ? 'healthy' : 'error'}>
                <WarningIcon fontSize="small" />
                Policy Violations: {safeMetrics.policyViolations}
              </StatusIndicator>
              
              <StatusIndicator className={safeMetrics.observerAlerts === 0 ? 'healthy' : 'warning'}>
                <ErrorIcon fontSize="small" />
                Observer Alerts: {safeMetrics.observerAlerts}
              </StatusIndicator>
              
              <StatusIndicator className="healthy">
                <PsychologyIcon fontSize="small" />
                AI Models: Operational
              </StatusIndicator>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Recent Activity Section */}
        <Accordion 
          expanded={expandedSections.includes('activity')}
          onChange={() => handleSectionToggle('activity')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: DARK_THEME.text.primary }} />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: DARK_THEME.text.primary }}>
              Recent Activity
            </Typography>
            <Badge 
              badgeContent={safeActivities.length} 
              color="primary" 
              sx={{ ml: 1 }}
            />
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              {safeActivities.slice(0, 5).map((activity) => (
                <ActivityItem key={activity.id}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: `${getActivityColor(activity.severity)}.main` 
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {activity.message}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {activity.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {activity.agentId && ` • ${activity.agentId}`}
                      </Typography>
                    }
                  />
                </ActivityItem>
              ))}
              
              {safeActivities.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    No recent activity
                  </Typography>
                </Box>
              )}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Settings Section */}
        <Accordion 
          expanded={expandedSections.includes('settings')}
          onChange={() => handleSectionToggle('settings')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip 
                label="Policy Enforcement: Moderate"
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip 
                label="Trust Threshold: 70%"
                size="small"
                variant="outlined"
                color="info"
              />
              <Chip 
                label="Observer Monitoring: Active"
                size="small"
                variant="outlined"
                color="success"
              />
              <Chip 
                label="Audit Logging: Enabled"
                size="small"
                variant="outlined"
                color="secondary"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </MetricsContainer>
    </GovernancePanelContainer>
  );
};

export default GovernancePanel;

