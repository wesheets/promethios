import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Fade,
  Slide,
  Zoom,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  SwapHoriz as HandoffIcon,
  Group as GroupIcon,
  TrendingUp as AnalysisIcon,
  Lightbulb as IdeaIcon,
  CheckCircle as CompleteIcon,
  Schedule as ProcessingIcon,
  Sync as CoordinatingIcon,
  Chat as ResponseIcon,
  Visibility as ObservingIcon,
  Shield as GovernanceIcon,
  ArrowForward as ArrowIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Dark theme colors matching the site
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  secondary: '#38a169',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e'
};

// Animations
const thinkingPulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const handoffFlow = keyframes`
  0% { transform: translateX(-10px); opacity: 0; }
  50% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(10px); opacity: 0; }
`;

const coordinationRipple = keyframes`
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
`;

// Styled Components
const CoordinationContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8px,
  padding: 8px 0,
  position: 'relative'
}));

// Shimmer animation for thinking indicator
const shimmerAnimation = keyframes`
  0% { left: -100%; }
  100% { left: 100%; }
`;

const ThinkingIndicator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12px,
  padding: 12px 16px,
  backgroundColor: 'rgba(49, 130, 206, 0.08)',
  borderRadius: '16px',
  border: '1px solid rgba(49, 130, 206, 0.2)',
  position: 'relative',
  overflow: 'hidden',
  
  '&.active': {
    animation: `${thinkingPulse} 2s ease-in-out infinite`
  },
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(49, 130, 206, 0.1), transparent)',
    animation: `${shimmerAnimation} 2s ease-in-out infinite`
  }
}));

const HandoffIndicator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8px,
  padding: 8px 16px,
  backgroundColor: 'rgba(56, 161, 105, 0.1)',
  borderRadius: '12px',
  border: '1px solid rgba(56, 161, 105, 0.3)',
  position: 'relative',
  
  '& .handoff-arrow': {
    animation: `${handoffFlow} 1.5s ease-in-out infinite`
  }
}));

const CoordinationMap = styled(Paper)(() => ({
  padding: 16px,
  backgroundColor: 'rgba(45, 55, 72, 0.8)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: 8px,
  position: 'relative',
  overflow: 'hidden'
}));

const AgentNode = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'agentType'
})(({ theme, isActive, agentType }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4px,
  padding: 8px,
  borderRadius: 4px,
  transition: 'all 0.3s ease',
  position: 'relative',
  
  ...(isActive && {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      border: `2px solid ${DARK_THEME.primary}`,
      transform: 'translate(-50%, -50%)',
      animation: `${coordinationRipple} 2s ease-out infinite`
    }
  }),
  
  '& .agent-avatar': {
    width: 40,
    height: 40,
    backgroundColor: agentType === 'observer' 
      ? DARK_THEME.warning
      : agentType === 'factual'
        ? DARK_THEME.primary
        : agentType === 'creative'
          ? DARK_THEME.secondary
          : DARK_THEME.primary,
    transition: 'all 0.3s ease',
    
    ...(isActive && {
      transform: 'scale(1.1)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    })
  },
  
  '& .agent-label': {
    fontSize: '11px',
    fontWeight: 600,
    color: DARK_THEME.text.secondary,
    textAlign: 'center'
  }
}));

const ProcessingSteps = styled(Box)(() => ({
  backgroundColor: 'rgba(45, 55, 72, 0.6)',
  borderRadius: 4px,
  padding: 12px,
  border: `1px solid ${DARK_THEME.border}`
}));

const ThinkingDots = styled(Box)(() => ({
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
  
  '& span': {
    width: '6px',
    height: '6px',
    backgroundColor: DARK_THEME.primary,
    borderRadius: '50%',
    animation: 'thinking 1.4s ease-in-out infinite both',
    
    '&:nth-of-type(1)': { animationDelay: '-0.32s' },
    '&:nth-of-type(2)': { animationDelay: '-0.16s' },
    '&:nth-of-type(3)': { animationDelay: '0s' }
  },
  
  '@keyframes thinking': {
    '0%, 80%, 100%': {
      transform: 'scale(0.8)',
      opacity: 0.5
    },
    '40%': {
      transform: 'scale(1)',
      opacity: 1
    }
  }
}));

// Types
interface Agent {
  id: string;
  name: string;
  type: 'baseline' | 'factual' | 'creative' | 'observer';
  avatar: string;
  status: 'idle' | 'thinking' | 'processing' | 'responding' | 'complete';
}

interface CoordinationStep {
  id: string;
  agentId: string;
  action: string;
  status: 'pending' | 'active' | 'complete';
  timestamp?: Date;
  duration?: number;
}

interface AgentThinkingProps {
  agent: Agent;
  message?: string;
  progress?: number;
  isVisible: boolean;
}

interface AgentHandoffProps {
  fromAgent: Agent;
  toAgent: Agent;
  message: string;
  isVisible: boolean;
}

interface MultiAgentCoordinationProps {
  agents: Agent[];
  coordinationPattern: 'sequential' | 'parallel' | 'hierarchical' | 'collaborative';
  currentStep?: CoordinationStep;
  steps: CoordinationStep[];
  isActive: boolean;
}

// Agent Thinking Component
export const AgentThinking: React.FC<AgentThinkingProps> = ({
  agent,
  message = "Analyzing your request...",
  progress,
  isVisible
}) => {
  const getThinkingIcon = (agentType: Agent['type']) => {
    switch (agentType) {
      case 'factual': return <AnalysisIcon />;
      case 'creative': return <IdeaIcon />;
      case 'observer': return <ObservingIcon />;
      default: return <PsychologyIcon />;
    }
  };

  return (
    <Fade in={isVisible} timeout={300}>
      <ThinkingIndicator className={isVisible ? 'active' : ''}>
        <Avatar 
          sx={{ 
            width: 28, 
            height: 28,
            bgcolor: agent.type === 'observer' ? 'warning.main' : 'primary.main'
          }}
        >
          {agent.avatar}
        </Avatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
            {agent.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {message}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getThinkingIcon(agent.type)}
          <ThinkingDots>
            <span></span>
            <span></span>
            <span></span>
          </ThinkingDots>
        </Box>
        
        {progress !== undefined && (
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              borderRadius: 0
            }}
          />
        )}
      </ThinkingIndicator>
    </Fade>
  );
};

// Agent Handoff Component
export const AgentHandoff: React.FC<AgentHandoffProps> = ({
  fromAgent,
  toAgent,
  message,
  isVisible
}) => {
  return (
    <Slide direction="up" in={isVisible} timeout={400}>
      <HandoffIndicator>
        <Avatar sx={{ width: 24, height: 24 }}>
          {fromAgent.avatar}
        </Avatar>
        
        <Box className="handoff-arrow">
          <ArrowIcon color="secondary" />
        </Box>
        
        <Avatar sx={{ width: 24, height: 24 }}>
          {toAgent.avatar}
        </Avatar>
        
        <Typography variant="caption" sx={{ ml: 1, fontWeight: 500 }}>
          {message}
        </Typography>
      </HandoffIndicator>
    </Slide>
  );
};

// Multi-Agent Coordination Component
export const MultiAgentCoordination: React.FC<MultiAgentCoordinationProps> = ({
  agents,
  coordinationPattern,
  currentStep,
  steps,
  isActive
}) => {
  const [activeAgents, setActiveAgents] = useState<string[]>([]);

  useEffect(() => {
    if (currentStep) {
      setActiveAgents([currentStep.agentId]);
    }
  }, [currentStep]);

  const getPatternDescription = (pattern: string) => {
    switch (pattern) {
      case 'sequential': return 'Agents process in sequence';
      case 'parallel': return 'Agents work simultaneously';
      case 'hierarchical': return 'Lead agent coordinates others';
      case 'collaborative': return 'Agents collaborate iteratively';
      default: return 'Multi-agent coordination';
    }
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'sequential': return <TimelineIcon />;
      case 'parallel': return <GroupIcon />;
      case 'hierarchical': return <CoordinatingIcon />;
      case 'collaborative': return <HandoffIcon />;
      default: return <GroupIcon />;
    }
  };

  return (
    <Zoom in={isActive} timeout={500}>
      <CoordinationMap>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {getPatternIcon(coordinationPattern)}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {coordinationPattern.charAt(0).toUpperCase() + coordinationPattern.slice(1)} Coordination
          </Typography>
          <Chip 
            label={getPatternDescription(coordinationPattern)}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>

        {/* Agent Nodes */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center',
          mb: 2,
          position: 'relative'
        }}>
          {agents.map((agent) => (
            <AgentNode 
              key={agent.id}
              isActive={activeAgents.includes(agent.id)}
              agentType={agent.type}
            >
              <Avatar className="agent-avatar">
                {agent.avatar}
              </Avatar>
              <Typography className="agent-label">
                {agent.name}
              </Typography>
              <Chip 
                label={agent.status}
                size="small"
                color={
                  agent.status === 'complete' ? 'success' :
                  agent.status === 'processing' ? 'primary' :
                  agent.status === 'thinking' ? 'secondary' : 'default'
                }
                sx={{ fontSize: '9px', height: '16px' }}
              />
            </AgentNode>
          ))}
        </Box>

        {/* Processing Steps */}
        {steps.length > 0 && (
          <ProcessingSteps>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Coordination Steps:
            </Typography>
            
            <Stepper orientation="vertical" sx={{ pl: 0 }}>
              {steps.map((step, index) => (
                <Step key={step.id} active={step.status === 'active'} completed={step.status === 'complete'}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar sx={{ 
                        width: 20, 
                        height: 20, 
                        fontSize: '10px',
                        bgcolor: step.status === 'complete' ? 'success.main' : 
                                step.status === 'active' ? 'primary.main' : 'grey.400'
                      }}>
                        {agents.find(a => a.id === step.agentId)?.avatar || <PsychologyIcon sx={{ fontSize: '10px' }} />}
                      </Avatar>
                    )}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {step.action}
                    </Typography>
                  </StepLabel>
                  
                  {step.status === 'active' && (
                    <StepContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <ProcessingIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="primary">
                          In progress...
                        </Typography>
                        <ThinkingDots>
                          <span></span>
                          <span></span>
                          <span></span>
                        </ThinkingDots>
                      </Box>
                    </StepContent>
                  )}
                </Step>
              ))}
            </Stepper>
          </ProcessingSteps>
        )}

        {/* Current Activity */}
        {currentStep && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(49, 130, 206, 0.05)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Current: {currentStep.action}
            </Typography>
            {currentStep.duration && (
              <LinearProgress 
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                color="primary"
              />
            )}
          </Box>
        )}
      </CoordinationMap>
    </Zoom>
  );
};

// Main Coordination Visualization Container
interface AgentCoordinationVisualizationProps {
  agents: Agent[];
  coordinationPattern?: 'sequential' | 'parallel' | 'hierarchical' | 'collaborative';
  isMultiAgent: boolean;
  currentActivity?: {
    type: 'thinking' | 'handoff' | 'coordination';
    data: any;
  };
}

export const AgentCoordinationVisualization: React.FC<AgentCoordinationVisualizationProps> = ({
  agents,
  coordinationPattern = 'sequential',
  isMultiAgent,
  currentActivity
}) => {
  const [steps, setSteps] = useState<CoordinationStep[]>([]);
  const [currentStep, setCurrentStep] = useState<CoordinationStep | undefined>();

  useEffect(() => {
    if (isMultiAgent && agents.length > 1) {
      // Generate coordination steps based on pattern
      const newSteps: CoordinationStep[] = agents.map((agent, index) => ({
        id: `step_${agent.id}_${index}`,
        agentId: agent.id,
        action: `${agent.name} analysis`,
        status: index === 0 ? 'active' : 'pending'
      }));
      
      setSteps(newSteps);
      setCurrentStep(newSteps[0]);
    }
  }, [agents, isMultiAgent]);

  return (
    <CoordinationContainer>
      {/* Single Agent Thinking */}
      {!isMultiAgent && currentActivity?.type === 'thinking' && (
        <AgentThinking
          agent={agents[0]}
          message={currentActivity.data.message}
          progress={currentActivity.data.progress}
          isVisible={true}
        />
      )}

      {/* Agent Handoff */}
      {currentActivity?.type === 'handoff' && (
        <AgentHandoff
          fromAgent={currentActivity.data.fromAgent}
          toAgent={currentActivity.data.toAgent}
          message={currentActivity.data.message}
          isVisible={true}
        />
      )}

      {/* Multi-Agent Coordination */}
      {isMultiAgent && (
        <MultiAgentCoordination
          agents={agents}
          coordinationPattern={coordinationPattern}
          currentStep={currentStep}
          steps={steps}
          isActive={true}
        />
      )}
    </CoordinationContainer>
  );
};

export default AgentCoordinationVisualization;

