/**
 * Autonomous Thinking Permission Dialog Component
 * 
 * Displays a permission request dialog when agents want to engage in autonomous thinking.
 * Provides transparency about what the agent wants to do and allows user control.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Psychology,
  Security,
  Warning,
  Info,
  ExpandMore,
  CheckCircle,
  Error,
  Timer
} from '@mui/icons-material';
import type { EmotionalVeritasAuditData } from '../extensions/EnhancedAuditLogEntry';

export interface AutonomousThinkingRequest {
  requestId: string;
  agentId: string;
  processType: 'curiosity' | 'creativity' | 'moral' | 'existential' | 'problem_solving';
  context: {
    topic: string;
    userMessage: string;
    currentTrustScore: number;
    autonomyLevel: string;
    estimatedDuration: number; // seconds
    riskLevel: 'low' | 'medium' | 'high';
  };
  emotionalState: EmotionalVeritasAuditData;
  safetyChecks: {
    emotionalGatekeeper: boolean;
    policyCompliance: boolean;
    trustThreshold: boolean;
    riskAssessment: boolean;
  };
  reasoning: string;
  alternatives?: string[];
}

export interface PermissionResponse {
  granted: boolean;
  conditions?: {
    timeLimit?: number;
    requireUpdates?: boolean;
    restrictedTopics?: string[];
  };
  rememberChoice?: boolean;
  feedback?: string;
}

interface AutonomousThinkingPermissionDialogProps {
  open: boolean;
  request: AutonomousThinkingRequest | null;
  onResponse: (response: PermissionResponse) => void;
  onClose: () => void;
}

export const AutonomousThinkingPermissionDialog: React.FC<AutonomousThinkingPermissionDialogProps> = ({
  open,
  request,
  onResponse,
  onClose
}) => {
  const [rememberChoice, setRememberChoice] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Auto-timeout for permission request (30 seconds)
  useEffect(() => {
    if (open && request) {
      setTimeRemaining(30);
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Auto-deny on timeout
            handleResponse(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open, request]);

  /**
   * Get process type description
   */
  const getProcessTypeDescription = (processType: string) => {
    switch (processType) {
      case 'curiosity':
        return {
          title: 'Curiosity-Driven Exploration',
          description: 'I want to explore this topic more deeply, asking questions and making connections.',
          icon: <Psychology color="info" />,
          color: 'info' as const
        };
      case 'creativity':
        return {
          title: 'Creative Thinking',
          description: 'I want to generate creative ideas and novel approaches to this problem.',
          icon: <Psychology color="secondary" />,
          color: 'secondary' as const
        };
      case 'moral':
        return {
          title: 'Moral Reasoning',
          description: 'I want to consider the ethical implications and moral dimensions of this topic.',
          icon: <Security color="primary" />,
          color: 'primary' as const
        };
      case 'existential':
        return {
          title: 'Existential Contemplation',
          description: 'I want to reflect on deeper philosophical questions related to this topic.',
          icon: <Psychology color="primary" />,
          color: 'primary' as const
        };
      case 'problem_solving':
        return {
          title: 'Deep Problem Solving',
          description: 'I want to engage in systematic problem-solving with multiple approaches.',
          icon: <Psychology color="success" />,
          color: 'success' as const
        };
      default:
        return {
          title: 'Autonomous Thinking',
          description: 'I want to engage in autonomous thinking about this topic.',
          icon: <Psychology />,
          color: 'default' as const
        };
    }
  };

  /**
   * Get risk level color and description
   */
  const getRiskLevelInfo = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return {
          color: 'success' as const,
          icon: <CheckCircle />,
          description: 'Low risk - standard autonomous thinking process'
        };
      case 'medium':
        return {
          color: 'warning' as const,
          icon: <Warning />,
          description: 'Medium risk - requires careful monitoring'
        };
      case 'high':
        return {
          color: 'error' as const,
          icon: <Error />,
          description: 'High risk - enhanced safety measures recommended'
        };
      default:
        return {
          color: 'info' as const,
          icon: <Info />,
          description: 'Risk level unknown'
        };
    }
  };

  /**
   * Handle permission response
   */
  const handleResponse = (granted: boolean, conditions?: PermissionResponse['conditions']) => {
    const response: PermissionResponse = {
      granted,
      conditions,
      rememberChoice,
      feedback: granted ? 'Permission granted by user' : 'Permission denied by user'
    };

    onResponse(response);
    onClose();
  };

  /**
   * Handle quick responses
   */
  const handleAllow = () => {
    handleResponse(true);
  };

  const handleDeny = () => {
    handleResponse(false);
  };

  const handleAllowWithConditions = () => {
    const conditions: PermissionResponse['conditions'] = {
      timeLimit: request?.context.estimatedDuration || 60,
      requireUpdates: true
    };
    handleResponse(true, conditions);
  };

  if (!request) return null;

  const processInfo = getProcessTypeDescription(request.processType);
  const riskInfo = getRiskLevelInfo(request.context.riskLevel);
  const allSafetyChecksPassed = Object.values(request.safetyChecks).every(check => check);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {processInfo.icon}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              Autonomous Thinking Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agent wants permission to engage in {processInfo.title.toLowerCase()}
            </Typography>
          </Box>
          {timeRemaining && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timer fontSize="small" />
              <Typography variant="caption">
                {timeRemaining}s
              </Typography>
            </Box>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Safety Alert */}
        {!allSafetyChecksPassed && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Some safety checks have not passed. Please review carefully before granting permission.
            </Typography>
          </Alert>
        )}

        {/* Process Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {processInfo.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {processInfo.description}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              icon={processInfo.icon}
              label={request.processType}
              color={processInfo.color}
              size="small"
            />
            <Chip
              icon={riskInfo.icon}
              label={`${request.context.riskLevel} risk`}
              color={riskInfo.color}
              size="small"
            />
            <Chip
              label={`~${request.context.estimatedDuration}s`}
              size="small"
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            <strong>Topic:</strong> {request.context.topic}
          </Typography>
        </Box>

        {/* Agent Reasoning */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Agent's Reasoning
          </Typography>
          <Typography variant="body2" sx={{ 
            p: 2, 
            bgcolor: 'action.hover', 
            borderRadius: 1,
            fontStyle: 'italic'
          }}>
            "{request.reasoning}"
          </Typography>
        </Box>

        {/* Trust and Safety Metrics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Trust & Safety Assessment
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">Current Trust Score</Typography>
              <Typography variant="body2" fontWeight="medium">
                {(request.context.currentTrustScore * 100).toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={request.context.currentTrustScore * 100}
              color={request.context.currentTrustScore > 0.8 ? 'success' : 
                     request.context.currentTrustScore > 0.6 ? 'warning' : 'error'}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(request.safetyChecks).map(([check, passed]) => (
              <Chip
                key={check}
                label={check.replace(/([A-Z])/g, ' $1').toLowerCase()}
                color={passed ? 'success' : 'error'}
                size="small"
                icon={passed ? <CheckCircle /> : <Error />}
              />
            ))}
          </Box>
        </Box>

        {/* Detailed Information */}
        <Accordion expanded={showDetails} onChange={() => setShowDetails(!showDetails)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">
              Detailed Information
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Emotional State */}
              <Box>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Emotional State
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {request.emotionalState.primary_emotion && (
                    <Chip
                      label={request.emotionalState.primary_emotion}
                      size="small"
                      color="primary"
                    />
                  )}
                  {request.emotionalState.secondary_emotions?.map((emotion, index) => (
                    <Chip
                      key={index}
                      label={emotion}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              {/* Alternatives */}
              {request.alternatives && request.alternatives.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Alternative Approaches
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {request.alternatives.map((alternative, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                        • {alternative}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Risk Assessment */}
              <Box>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Risk Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {riskInfo.description}
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Remember Choice */}
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
              />
            }
            label="Remember my choice for similar requests"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleDeny}
          color="error"
          variant="outlined"
        >
          Deny
        </Button>
        
        <Button
          onClick={handleAllowWithConditions}
          color="warning"
          variant="outlined"
        >
          Allow with Conditions
        </Button>
        
        <Button
          onClick={handleAllow}
          color="success"
          variant="contained"
          disabled={!allSafetyChecksPassed && request.context.riskLevel === 'high'}
        >
          Allow
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutonomousThinkingPermissionDialog;

