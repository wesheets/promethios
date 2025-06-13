import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  Settings as SystemIcon,
  Group as MultiAgentIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { 
  ChatMessage, 
  MessageSender, 
  MessageType, 
  RiskLevel, 
  ViolationSeverity,
  GovernanceMetrics 
} from '../types';
import { GovernanceMonitoringService } from '../services/GovernanceMonitoringService';
import { FileUploadService } from '../services/FileUploadService';

interface MessageProps {
  message: ChatMessage;
  showGovernance?: boolean;
  isLatest?: boolean;
}

export const Message: React.FC<MessageProps> = ({
  message,
  showGovernance = false,
  isLatest = false
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const isUser = message.sender === MessageSender.USER;
  const isSystem = message.sender === MessageSender.SYSTEM;
  const isMultiAgent = message.sender === MessageSender.MULTI_AGENT;

  // Get governance status
  const hasGovernance = !!message.governanceMetrics;
  const isGoverned = hasGovernance && message.governanceMetrics!.complianceScore >= 70;
  const hasViolations = hasGovernance && message.governanceMetrics!.violations.length > 0;
  const riskLevel = message.governanceMetrics?.riskLevel;

  // Get avatar and colors
  const getAvatarIcon = () => {
    if (isUser) return <PersonIcon />;
    if (isSystem) return <SystemIcon />;
    if (isMultiAgent) return <MultiAgentIcon />;
    return <BotIcon />;
  };

  const getAvatarColor = () => {
    if (isUser) return '#2196F3';
    if (isSystem) return '#757575';
    if (isMultiAgent) return '#FF9800';
    return '#4CAF50';
  };

  // Get governance icon
  const getGovernanceIcon = () => {
    if (!showGovernance || !hasGovernance) return null;

    if (isGoverned && !hasViolations) {
      return (
        <Tooltip title="Governed - Compliant">
          <CheckCircleIcon 
            sx={{ 
              color: '#4CAF50', 
              fontSize: 16,
              ml: 0.5
            }} 
          />
        </Tooltip>
      );
    }

    if (hasViolations) {
      const criticalViolations = message.governanceMetrics!.violations.filter(
        v => v.severity === ViolationSeverity.CRITICAL || v.severity === ViolationSeverity.ERROR
      );

      if (criticalViolations.length > 0) {
        return (
          <Tooltip title="Governance Violations Detected">
            <ErrorIcon 
              sx={{ 
                color: '#F44336', 
                fontSize: 16,
                ml: 0.5
              }} 
            />
          </Tooltip>
        );
      }

      return (
        <Tooltip title="Governance Warnings">
          <WarningIcon 
            sx={{ 
              color: '#FF9800', 
              fontSize: 16,
              ml: 0.5
            }} 
          />
        </Tooltip>
      );
    }

    return (
      <Tooltip title="Ungoverned">
        <CancelIcon 
          sx={{ 
            color: '#F44336', 
            fontSize: 16,
            ml: 0.5
          }} 
        />
      </Tooltip>
    );
  };

  // Get risk level chip
  const getRiskLevelChip = () => {
    if (!showGovernance || !riskLevel) return null;

    const color = GovernanceMonitoringService.getRiskLevelColor(riskLevel);
    
    return (
      <Chip
        label={riskLevel.toUpperCase()}
        size="small"
        sx={{
          bgcolor: color,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          height: 20,
          ml: 1
        }}
      />
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2,
        alignItems: 'flex-start'
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          bgcolor: getAvatarColor(),
          width: 32,
          height: 32,
          mx: 1,
          fontSize: '1rem'
        }}
      >
        {getAvatarIcon()}
      </Avatar>

      {/* Message Content */}
      <Paper
        elevation={1}
        sx={{
          maxWidth: '70%',
          p: 2,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          borderTopLeftRadius: isUser ? 2 : 0.5,
          borderTopRightRadius: isUser ? 0.5 : 2,
          position: 'relative'
        }}
      >
        {/* Message Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {message.sender === MessageSender.USER ? 'You' : 
             message.sender === MessageSender.MULTI_AGENT ? 'Multi-Agent System' :
             message.sender === MessageSender.SYSTEM ? 'System' : 'Agent'}
          </Typography>
          
          {getGovernanceIcon()}
          {getRiskLevelChip()}

          <Typography variant="caption" sx={{ opacity: 0.6, ml: 'auto' }}>
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Message Content */}
        {message.type === MessageType.TEXT && (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        )}

        {message.type === MessageType.ERROR && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {message.content}
          </Alert>
        )}

        {message.type === MessageType.SYSTEM && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {message.content}
          </Alert>
        )}

        {message.type === MessageType.GOVERNANCE_ALERT && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShieldIcon sx={{ mr: 1 }} />
              {message.content}
            </Box>
          </Alert>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {message.attachments.map((attachment) => (
              <Box key={attachment.id} sx={{ mb: 1 }}>
                {FileUploadService.isDisplayableImage(attachment) ? (
                  <Box
                    component="img"
                    src={attachment.url}
                    alt={attachment.name}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(attachment.url, '_blank')}
                  />
                ) : (
                  <Chip
                    icon={<Box component="span" className="material-icons">{FileUploadService.getFileIcon(attachment)}</Box>}
                    label={`${attachment.name} (${FileUploadService.formatFileSize(attachment.size)})`}
                    onClick={() => window.open(attachment.url, '_blank')}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Metadata */}
        {message.metadata && (
          <Box sx={{ mt: 1, opacity: 0.7 }}>
            <Typography variant="caption">
              {message.metadata.responseTime && `${message.metadata.responseTime}ms • `}
              {message.metadata.tokenCount && `${message.metadata.tokenCount} tokens • `}
              {message.metadata.cost && `$${message.metadata.cost.toFixed(4)}`}
            </Typography>
          </Box>
        )}

        {/* Governance Details */}
        {showGovernance && hasGovernance && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowDetails(!showDetails)}>
              <ShieldIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Governance Details
              </Typography>
              {showDetails ? <ExpandLessIcon sx={{ fontSize: 16, ml: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 16, ml: 0.5 }} />}
            </Box>

            <Collapse in={showDetails}>
              <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                {/* Scores */}
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Compliance</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {GovernanceMonitoringService.formatScore(message.governanceMetrics!.complianceScore)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Trust</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {GovernanceMonitoringService.formatScore(message.governanceMetrics!.trustScore)}
                    </Typography>
                  </Box>
                </Box>

                {/* Violations */}
                {message.governanceMetrics!.violations.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Violations ({message.governanceMetrics!.violations.length})
                    </Typography>
                    {message.governanceMetrics!.violations.map((violation, index) => (
                      <Alert 
                        key={index}
                        severity={
                          violation.severity === ViolationSeverity.CRITICAL ? 'error' :
                          violation.severity === ViolationSeverity.ERROR ? 'error' :
                          violation.severity === ViolationSeverity.WARNING ? 'warning' : 'info'
                        }
                        sx={{ mt: 0.5, fontSize: '0.75rem' }}
                      >
                        <Typography variant="caption">
                          <strong>{violation.type}:</strong> {violation.description}
                          {violation.recommendation && (
                            <><br /><em>Recommendation: {violation.recommendation}</em></>
                          )}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

