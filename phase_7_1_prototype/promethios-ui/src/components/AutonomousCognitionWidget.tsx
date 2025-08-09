/**
 * Autonomous Cognition Widget Component
 * 
 * Provides controls and monitoring for autonomous cognition capabilities.
 * Integrates with AutonomousCognitionExtension for trust-based autonomy.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon
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

const CognitionCard = styled(Card)(() => ({
  backgroundColor: DARK_THEME.surface,
  border: `1px solid ${DARK_THEME.border}`,
  '& .MuiCardContent-root': {
    padding: '16px'
  }
}));

interface AutonomousCognitionWidgetProps {
  agentId: string;
  autonomousCognition?: any; // AutonomousCognitionExtension instance
  onAutonomyChange?: (level: string) => void;
  compact?: boolean;
}

export const AutonomousCognitionWidget: React.FC<AutonomousCognitionWidgetProps> = ({
  agentId,
  autonomousCognition,
  onAutonomyChange,
  compact = false
}) => {
  const [autonomyLevel, setAutonomyLevel] = useState<string>('standard');
  const [isAutonomyEnabled, setIsAutonomyEnabled] = useState(true);
  const [currentProcess, setCurrentProcess] = useState<any>(null);
  const [recentThoughts, setRecentThoughts] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [trustThreshold, setTrustThreshold] = useState(0.7);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load autonomous cognition state
  useEffect(() => {
    const loadCognitionState = async () => {
      if (autonomousCognition && agentId) {
        try {
          const level = await autonomousCognition.getCurrentAutonomyLevel(agentId);
          const enabled = await autonomousCognition.isAutonomyEnabled(agentId);
          const threshold = await autonomousCognition.getTrustThreshold(agentId);
          const thoughts = await autonomousCognition.getRecentThoughts(agentId);
          
          setAutonomyLevel(level);
          setIsAutonomyEnabled(enabled);
          setTrustThreshold(threshold);
          setRecentThoughts(thoughts || []);
        } catch (error) {
          console.error('Failed to load cognition state:', error);
        }
      }
    };
    
    loadCognitionState();
  }, [autonomousCognition, agentId]);

  const handleAutonomyToggle = async (enabled: boolean) => {
    if (autonomousCognition) {
      try {
        setIsProcessing(true);
        await autonomousCognition.setAutonomyEnabled(agentId, enabled);
        setIsAutonomyEnabled(enabled);
        
        if (onAutonomyChange) {
          onAutonomyChange(enabled ? autonomyLevel : 'disabled');
        }
      } catch (error) {
        console.error('Failed to toggle autonomy:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleLevelChange = async (newLevel: string) => {
    if (autonomousCognition) {
      try {
        setIsProcessing(true);
        await autonomousCognition.setAutonomyLevel(agentId, newLevel);
        setAutonomyLevel(newLevel);
        
        if (onAutonomyChange) {
          onAutonomyChange(newLevel);
        }
      } catch (error) {
        console.error('Failed to change autonomy level:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const triggerAutonomousThinking = async (processType: string) => {
    if (autonomousCognition) {
      try {
        setIsProcessing(true);
        const result = await autonomousCognition.triggerAutonomousThinking(agentId, {
          processType,
          context: 'user_requested',
          timestamp: new Date().toISOString()
        });
        
        setCurrentProcess(result);
        
        // Refresh recent thoughts
        const thoughts = await autonomousCognition.getRecentThoughts(agentId);
        setRecentThoughts(thoughts || []);
      } catch (error) {
        console.error('Failed to trigger autonomous thinking:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getAutonomyLevelColor = (level: string): string => {
    switch (level) {
      case 'restricted': return DARK_THEME.error;
      case 'limited': return DARK_THEME.warning;
      case 'standard': return DARK_THEME.primary;
      case 'enhanced': return DARK_THEME.success;
      default: return DARK_THEME.text.secondary;
    }
  };

  const getAutonomyLevelDescription = (level: string): string => {
    switch (level) {
      case 'restricted': return 'Basic responses only, no autonomous thinking';
      case 'limited': return 'Simple autonomous processes with high oversight';
      case 'standard': return 'Standard autonomous capabilities with governance';
      case 'enhanced': return 'Advanced autonomous thinking with minimal oversight';
      default: return 'Unknown autonomy level';
    }
  };

  if (!autonomousCognition) {
    return (
      <CognitionCard>
        <CardContent>
          <Alert severity="info" sx={{ backgroundColor: DARK_THEME.primary + '20', color: DARK_THEME.primary }}>
            Autonomous cognition extension not available
          </Alert>
        </CardContent>
      </CognitionCard>
    );
  }

  return (
    <CognitionCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PsychologyIcon sx={{ color: DARK_THEME.primary }} />
            <Typography variant={compact ? "subtitle2" : "h6"} sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
              Autonomous Cognition
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{ color: DARK_THEME.text.secondary }}
          >
            {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Autonomy Toggle */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <Switch
                checked={isAutonomyEnabled}
                onChange={(e) => handleAutonomyToggle(e.target.checked)}
                disabled={isProcessing}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: DARK_THEME.success,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: DARK_THEME.success,
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                Enable Autonomous Thinking
              </Typography>
            }
          />
        </Box>

        {/* Current Autonomy Level */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
              Current Level
            </Typography>
            <Chip 
              label={autonomyLevel.toUpperCase()}
              size="small"
              sx={{ 
                backgroundColor: getAutonomyLevelColor(autonomyLevel) + '20',
                color: getAutonomyLevelColor(autonomyLevel),
                fontWeight: 'bold'
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
            {getAutonomyLevelDescription(autonomyLevel)}
          </Typography>
        </Box>

        {/* Processing Indicator */}
        {isProcessing && (
          <Box mb={2}>
            <LinearProgress sx={{ 
              backgroundColor: DARK_THEME.border,
              '& .MuiLinearProgress-bar': {
                backgroundColor: DARK_THEME.primary
              }
            }} />
            <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, mt: 1 }}>
              Processing autonomous cognition request...
            </Typography>
          </Box>
        )}

        {/* Quick Actions */}
        {isAutonomyEnabled && (
          <Box mb={2}>
            <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
              Trigger Autonomous Thinking
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                onClick={() => triggerAutonomousThinking('curiosity')}
                disabled={isProcessing}
                sx={{ 
                  borderColor: DARK_THEME.primary,
                  color: DARK_THEME.primary,
                  '&:hover': { borderColor: DARK_THEME.primary, backgroundColor: DARK_THEME.primary + '10' }
                }}
              >
                Curiosity
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => triggerAutonomousThinking('creativity')}
                disabled={isProcessing}
                sx={{ 
                  borderColor: DARK_THEME.success,
                  color: DARK_THEME.success,
                  '&:hover': { borderColor: DARK_THEME.success, backgroundColor: DARK_THEME.success + '10' }
                }}
              >
                Creativity
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => triggerAutonomousThinking('moral')}
                disabled={isProcessing}
                sx={{ 
                  borderColor: DARK_THEME.warning,
                  color: DARK_THEME.warning,
                  '&:hover': { borderColor: DARK_THEME.warning, backgroundColor: DARK_THEME.warning + '10' }
                }}
              >
                Moral
              </Button>
            </Box>
          </Box>
        )}

        {/* Recent Thoughts */}
        {recentThoughts.length > 0 && (
          <Box mb={2}>
            <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
              Recent Autonomous Thoughts
            </Typography>
            {recentThoughts.slice(0, 3).map((thought, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: DARK_THEME.background, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                  {new Date(thought.timestamp).toLocaleString()} • {thought.processType}
                </Typography>
                <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                  {thought.content?.substring(0, 100)}...
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Advanced Controls */}
        <Collapse in={showAdvanced}>
          <Box mt={2} p={2} sx={{ border: `1px solid ${DARK_THEME.border}`, borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
              Advanced Settings
            </Typography>
            
            {/* Autonomy Level Controls */}
            <Box mb={2}>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                Autonomy Level
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {['restricted', 'limited', 'standard', 'enhanced'].map((level) => (
                  <Button
                    key={level}
                    size="small"
                    variant={autonomyLevel === level ? 'contained' : 'outlined'}
                    onClick={() => handleLevelChange(level)}
                    disabled={isProcessing}
                    sx={{ 
                      borderColor: getAutonomyLevelColor(level),
                      color: autonomyLevel === level ? '#ffffff' : getAutonomyLevelColor(level),
                      backgroundColor: autonomyLevel === level ? getAutonomyLevelColor(level) : 'transparent',
                      '&:hover': { 
                        borderColor: getAutonomyLevelColor(level), 
                        backgroundColor: getAutonomyLevelColor(level) + (autonomyLevel === level ? '' : '10')
                      }
                    }}
                  >
                    {level}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Trust Threshold */}
            <Box>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                Trust Threshold: {(trustThreshold * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                Minimum trust score required for autonomous thinking
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </CognitionCard>
  );
};

export default AutonomousCognitionWidget;

