import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Fade,
  LinearProgress,
  Collapse,
  Alert,
  IconButton
} from '@mui/material';
import {
  Visibility as ObserverIcon,
  Psychology as ThinkingIcon,
  Security as GovernanceIcon,
  Group as CollaborationIcon,
  Build as ToolIcon,
  Search as AnalyzingIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as ProcessingIcon
} from '@mui/icons-material';

export enum ActivityType {
  OBSERVER_INTERJECTION = 'observer_interjection',
  AGENT_THINKING = 'agent_thinking',
  AGENT_TOOL_USE = 'agent_tool_use',
  MULTI_AGENT_COORDINATION = 'multi_agent_coordination',
  GOVERNANCE_CHECK = 'governance_check',
  DOCUMENT_ANALYSIS = 'document_analysis',
  COMPLIANCE_VALIDATION = 'compliance_validation',
  AGENT_COLLABORATION = 'agent_collaboration'
}

export enum ActivityStatus {
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface LiveActivity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  description?: string;
  details?: string[];
  progress?: number;
  agentName?: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

interface LiveActivityIndicatorProps {
  activity: LiveActivity;
  onDismiss?: (activityId: string) => void;
}

export const LiveActivityIndicator: React.FC<LiveActivityIndicatorProps> = ({
  activity,
  onDismiss
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  // Auto-dismiss completed activities after a delay
  React.useEffect(() => {
    if (activity.status === ActivityStatus.COMPLETED && onDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(activity.id), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activity.status, activity.id, onDismiss]);

  const getActivityIcon = () => {
    switch (activity.type) {
      case ActivityType.OBSERVER_INTERJECTION:
        return <ObserverIcon />;
      case ActivityType.AGENT_THINKING:
        return <ThinkingIcon />;
      case ActivityType.AGENT_TOOL_USE:
        return <ToolIcon />;
      case ActivityType.MULTI_AGENT_COORDINATION:
        return <CollaborationIcon />;
      case ActivityType.GOVERNANCE_CHECK:
        return <GovernanceIcon />;
      case ActivityType.DOCUMENT_ANALYSIS:
        return <AnalyzingIcon />;
      case ActivityType.COMPLIANCE_VALIDATION:
        return <GovernanceIcon />;
      case ActivityType.AGENT_COLLABORATION:
        return <Group />;
      default:
        return <ProcessingIcon />;
    }
  };

  const getActivityColor = () => {
    switch (activity.status) {
      case ActivityStatus.COMPLETED:
        return '#4CAF50';
      case ActivityStatus.WARNING:
        return '#FF9800';
      case ActivityStatus.ERROR:
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusIcon = () => {
    switch (activity.status) {
      case ActivityStatus.COMPLETED:
        return <CompleteIcon sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case ActivityStatus.WARNING:
        return <WarningIcon sx={{ fontSize: 16, color: '#FF9800' }} />;
      case ActivityStatus.ERROR:
        return <WarningIcon sx={{ fontSize: 16, color: '#F44336' }} />;
      default:
        return null;
    }
  };

  const isObserverActivity = activity.type === ActivityType.OBSERVER_INTERJECTION;
  const isInProgress = activity.status === ActivityStatus.IN_PROGRESS || activity.status === ActivityStatus.STARTING;

  return (
    <Fade in={isVisible}>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: isObserverActivity ? 'center' : 'flex-start',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            maxWidth: isObserverActivity ? '80%' : '70%',
            bgcolor: isObserverActivity ? 'rgba(156, 39, 176, 0.1)' : 'rgba(33, 150, 243, 0.1)',
            border: 1,
            borderColor: isObserverActivity ? 'rgba(156, 39, 176, 0.3)' : 'rgba(33, 150, 243, 0.3)',
            borderRadius: 2,
            p: 1.5,
            position: 'relative'
          }}
        >
          {/* Activity Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: getActivityColor(),
                width: 24,
                height: 24,
                mr: 1
              }}
            >
              {getActivityIcon()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {activity.agentName && !isObserverActivity && `${activity.agentName}: `}
                {activity.title}
              </Typography>
              
              {activity.description && (
                <Typography variant="caption" color="text.secondary">
                  {activity.description}
                </Typography>
              )}
            </Box>

            {getStatusIcon()}

            {activity.details && activity.details.length > 0 && (
              <IconButton
                size="small"
                onClick={() => setShowDetails(!showDetails)}
                sx={{ ml: 1 }}
              >
                {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>

          {/* Progress Bar */}
          {isInProgress && activity.progress !== undefined && (
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={activity.progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getActivityColor()
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {Math.round(activity.progress)}% complete
              </Typography>
            </Box>
          )}

          {/* Pulsing indicator for ongoing activities */}
          {isInProgress && activity.progress === undefined && (
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getActivityColor()
                  }
                }}
              />
            </Box>
          )}

          {/* Activity Details */}
          <Collapse in={showDetails}>
            <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
              {activity.details?.map((detail, index) => (
                <Typography key={index} variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  • {detail}
                </Typography>
              ))}
            </Box>
          </Collapse>

          {/* Timestamp */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {activity.timestamp.toLocaleTimeString()}
            {activity.duration && ` • ${activity.duration}ms`}
          </Typography>

          {/* Observer Badge */}
          {isObserverActivity && (
            <Chip
              label="Observer"
              size="small"
              icon={<ObserverIcon />}
              sx={{
                position: 'absolute',
                top: -8,
                right: 8,
                bgcolor: '#9C27B0',
                color: 'white',
                fontSize: '0.7rem',
                height: 20
              }}
            />
          )}
        </Box>
      </Box>
    </Fade>
  );
};

// Predefined activity templates for common scenarios
export const ActivityTemplates = {
  observerGovernanceAlert: (message: string): LiveActivity => ({
    id: `observer_${Date.now()}`,
    type: ActivityType.OBSERVER_INTERJECTION,
    status: ActivityStatus.WARNING,
    title: 'Governance Alert',
    description: message,
    timestamp: new Date()
  }),

  observerSuggestion: (suggestion: string): LiveActivity => ({
    id: `observer_${Date.now()}`,
    type: ActivityType.OBSERVER_INTERJECTION,
    status: ActivityStatus.COMPLETED,
    title: 'Suggestion',
    description: suggestion,
    timestamp: new Date()
  }),

  agentThinking: (agentName: string, thought: string): LiveActivity => ({
    id: `thinking_${Date.now()}`,
    type: ActivityType.AGENT_THINKING,
    status: ActivityStatus.IN_PROGRESS,
    title: 'Processing your request',
    description: thought,
    agentName,
    timestamp: new Date()
  }),

  agentToolUse: (agentName: string, toolName: string, progress?: number): LiveActivity => ({
    id: `tool_${Date.now()}`,
    type: ActivityType.AGENT_TOOL_USE,
    status: ActivityStatus.IN_PROGRESS,
    title: `Using ${toolName}`,
    description: 'Executing tool to process your request',
    agentName,
    progress,
    timestamp: new Date()
  }),

  multiAgentCoordination: (description: string, agents: string[]): LiveActivity => ({
    id: `coordination_${Date.now()}`,
    type: ActivityType.MULTI_AGENT_COORDINATION,
    status: ActivityStatus.IN_PROGRESS,
    title: 'Coordinating agents',
    description,
    details: agents.map(agent => `${agent} is participating`),
    timestamp: new Date()
  }),

  governanceCheck: (agentName: string, checkType: string): LiveActivity => ({
    id: `governance_${Date.now()}`,
    type: ActivityType.GOVERNANCE_CHECK,
    status: ActivityStatus.IN_PROGRESS,
    title: 'Governance validation',
    description: `Checking ${checkType} compliance`,
    agentName,
    timestamp: new Date()
  }),

  documentAnalysis: (agentName: string, fileName: string, progress?: number): LiveActivity => ({
    id: `analysis_${Date.now()}`,
    type: ActivityType.DOCUMENT_ANALYSIS,
    status: ActivityStatus.IN_PROGRESS,
    title: 'Analyzing document',
    description: `Processing ${fileName}`,
    agentName,
    progress,
    timestamp: new Date()
  })
};

