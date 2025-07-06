/**
 * Interactive Controls Panel
 * 
 * Real-time control interface for Enhanced Veritas 2 multi-agent collaboration,
 * allowing direct manipulation of collaboration parameters and intervention triggers.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack
} from '@mui/material';
import {
  Settings,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Tune,
  Speed,
  Group,
  Psychology,
  Warning,
  CheckCircle,
  ExpandMore,
  Save,
  RestoreFromTrash,
  Emergency,
  AutoMode,
  ManualMode
} from '@mui/icons-material';

interface CollaborationParameters {
  uncertaintyThreshold: number;
  hitlTriggerLevel: number;
  collaborationIntensity: number;
  responseTimeout: number;
  consensusThreshold: number;
  adaptationRate: number;
  emergentBehaviorSensitivity: number;
  qualityGate: number;
}

interface InterventionAction {
  id: string;
  name: string;
  description: string;
  type: 'immediate' | 'scheduled' | 'conditional';
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameters?: Record<string, any>;
}

interface InteractiveControlsPanelProps {
  sessionId?: string;
  onParameterChange?: (parameter: string, value: any) => void;
  onActionTrigger?: (action: InterventionAction) => void;
  onEmergencyStop?: () => void;
  className?: string;
}

const InteractiveControlsPanel: React.FC<InteractiveControlsPanelProps> = ({
  sessionId,
  onParameterChange,
  onActionTrigger,
  onEmergencyStop,
  className = ''
}) => {
  const [parameters, setParameters] = useState<CollaborationParameters>({
    uncertaintyThreshold: 0.7,
    hitlTriggerLevel: 0.8,
    collaborationIntensity: 0.6,
    responseTimeout: 30,
    consensusThreshold: 0.75,
    adaptationRate: 0.5,
    emergentBehaviorSensitivity: 0.6,
    qualityGate: 0.8
  });

  const [autoMode, setAutoMode] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionAction | null>(null);
  const [customParameters, setCustomParameters] = useState<Record<string, any>>({});
  const [presets, setPresets] = useState<Record<string, CollaborationParameters>>({});
  const [activePreset, setActivePreset] = useState<string>('default');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Available intervention actions
  const interventionActions: InterventionAction[] = [
    {
      id: 'add-agent',
      name: 'Add Specialist Agent',
      description: 'Introduce a specialist agent to address specific uncertainty',
      type: 'immediate',
      severity: 'medium',
      parameters: { agentType: 'specialist', domain: 'technical' }
    },
    {
      id: 'escalate-hitl',
      name: 'Escalate to Human Expert',
      description: 'Immediately trigger human-in-the-loop intervention',
      type: 'immediate',
      severity: 'high'
    },
    {
      id: 'change-pattern',
      name: 'Switch Collaboration Pattern',
      description: 'Change the current collaboration pattern',
      type: 'immediate',
      severity: 'low',
      parameters: { pattern: 'round-table' }
    },
    {
      id: 'boost-consensus',
      name: 'Boost Consensus Building',
      description: 'Increase focus on reaching consensus',
      type: 'immediate',
      severity: 'medium'
    },
    {
      id: 'emergency-stop',
      name: 'Emergency Stop',
      description: 'Immediately halt all collaboration activities',
      type: 'immediate',
      severity: 'critical'
    },
    {
      id: 'quality-review',
      name: 'Quality Review Checkpoint',
      description: 'Pause for comprehensive quality assessment',
      type: 'scheduled',
      severity: 'medium'
    }
  ];

  // Parameter presets
  const parameterPresets: Record<string, CollaborationParameters> = {
    conservative: {
      uncertaintyThreshold: 0.5,
      hitlTriggerLevel: 0.6,
      collaborationIntensity: 0.4,
      responseTimeout: 45,
      consensusThreshold: 0.85,
      adaptationRate: 0.3,
      emergentBehaviorSensitivity: 0.4,
      qualityGate: 0.9
    },
    balanced: {
      uncertaintyThreshold: 0.7,
      hitlTriggerLevel: 0.8,
      collaborationIntensity: 0.6,
      responseTimeout: 30,
      consensusThreshold: 0.75,
      adaptationRate: 0.5,
      emergentBehaviorSensitivity: 0.6,
      qualityGate: 0.8
    },
    aggressive: {
      uncertaintyThreshold: 0.8,
      hitlTriggerLevel: 0.9,
      collaborationIntensity: 0.8,
      responseTimeout: 15,
      consensusThreshold: 0.6,
      adaptationRate: 0.7,
      emergentBehaviorSensitivity: 0.8,
      qualityGate: 0.7
    },
    experimental: {
      uncertaintyThreshold: 0.9,
      hitlTriggerLevel: 0.95,
      collaborationIntensity: 0.9,
      responseTimeout: 10,
      consensusThreshold: 0.5,
      adaptationRate: 0.9,
      emergentBehaviorSensitivity: 0.9,
      qualityGate: 0.6
    }
  };

  useEffect(() => {
    setPresets(parameterPresets);
  }, []);

  const handleParameterChange = useCallback((parameter: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [parameter]: value
    }));
    setUnsavedChanges(true);
    
    if (onParameterChange) {
      onParameterChange(parameter, value);
    }
  }, [onParameterChange]);

  const handlePresetChange = (presetName: string) => {
    if (presets[presetName]) {
      setParameters(presets[presetName]);
      setActivePreset(presetName);
      setUnsavedChanges(false);
    }
  };

  const handleSavePreset = () => {
    const presetName = `custom_${Date.now()}`;
    setPresets(prev => ({
      ...prev,
      [presetName]: { ...parameters }
    }));
    setActivePreset(presetName);
    setUnsavedChanges(false);
  };

  const handleInterventionTrigger = (action: InterventionAction) => {
    if (action.severity === 'critical') {
      setSelectedIntervention(action);
      setInterventionDialogOpen(true);
    } else {
      if (onActionTrigger) {
        onActionTrigger(action);
      }
    }
  };

  const confirmIntervention = () => {
    if (selectedIntervention && onActionTrigger) {
      onActionTrigger(selectedIntervention);
      
      if (selectedIntervention.id === 'emergency-stop' && onEmergencyStop) {
        onEmergencyStop();
        setEmergencyMode(true);
      }
    }
    setInterventionDialogOpen(false);
    setSelectedIntervention(null);
  };

  const getParameterColor = (value: number, min: number = 0, max: number = 1): string => {
    const normalized = (value - min) / (max - min);
    if (normalized >= 0.8) return '#f56565';
    if (normalized >= 0.6) return '#ed8936';
    if (normalized >= 0.4) return '#ecc94b';
    return '#48bb78';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#f56565';
      case 'high': return '#ed8936';
      case 'medium': return '#ecc94b';
      case 'low': return '#48bb78';
      default: return '#4299e1';
    }
  };

  const renderParameterControls = () => (
    <Card sx={{ backgroundColor: '#2d3748', color: 'white', mb: 3 }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Tune />
            <Typography variant="h6">Collaboration Parameters</Typography>
            {unsavedChanges && (
              <Chip label="Unsaved Changes" color="warning" size="small" />
            )}
          </Box>
        }
        action={
          <Box display="flex" gap={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'white' }}>Preset</InputLabel>
              <Select
                value={activePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                sx={{ color: 'white' }}
              >
                {Object.keys(presets).map((preset) => (
                  <MenuItem key={preset} value={preset}>
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Save current settings as preset">
              <IconButton onClick={handleSavePreset} sx={{ color: 'white' }}>
                <Save />
              </IconButton>
            </Tooltip>
            <FormControlLabel
              control={
                <Switch
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                  icon={<ManualMode />}
                  checkedIcon={<AutoMode />}
                />
              }
              label={autoMode ? 'Auto' : 'Manual'}
              sx={{ color: 'white' }}
            />
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Uncertainty Controls */}
          <Grid item xs={12} md={6}>
            <Accordion sx={{ backgroundColor: '#4a5568', color: 'white' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="subtitle1">Uncertainty Management</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Uncertainty Threshold: {(parameters.uncertaintyThreshold * 100).toFixed(0)}%
                    </Typography>
                    <Slider
                      value={parameters.uncertaintyThreshold}
                      onChange={(e, value) => handleParameterChange('uncertaintyThreshold', value)}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      disabled={!autoMode}
                      sx={{
                        color: getParameterColor(parameters.uncertaintyThreshold),
                        '& .MuiSlider-thumb': {
                          backgroundColor: getParameterColor(parameters.uncertaintyThreshold)
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Threshold for triggering enhanced collaboration
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      HITL Trigger Level: {(parameters.hitlTriggerLevel * 100).toFixed(0)}%
                    </Typography>
                    <Slider
                      value={parameters.hitlTriggerLevel}
                      onChange={(e, value) => handleParameterChange('hitlTriggerLevel', value)}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      disabled={!autoMode}
                      sx={{
                        color: getParameterColor(parameters.hitlTriggerLevel),
                        '& .MuiSlider-thumb': {
                          backgroundColor: getParameterColor(parameters.hitlTriggerLevel)
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Uncertainty level that triggers human intervention
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Quality Gate: {(parameters.qualityGate * 100).toFixed(0)}%
                    </Typography>
                    <Slider
                      value={parameters.qualityGate}
                      onChange={(e, value) => handleParameterChange('qualityGate', value)}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      disabled={!autoMode}
                      sx={{
                        color: getParameterColor(1 - parameters.qualityGate),
                        '& .MuiSlider-thumb': {
                          backgroundColor: getParameterColor(1 - parameters.qualityGate)
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Minimum quality threshold for accepting results
                    </Typography>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Collaboration Controls */}
          <Grid item xs={12} md={6}>
            <Accordion sx={{ backgroundColor: '#4a5568', color: 'white' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="subtitle1">Collaboration Dynamics</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Collaboration Intensity: {(parameters.collaborationIntensity * 100).toFixed(0)}%
                    </Typography>
                    <Slider
                      value={parameters.collaborationIntensity}
                      onChange={(e, value) => handleParameterChange('collaborationIntensity', value)}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      disabled={!autoMode}
                      sx={{
                        color: getParameterColor(parameters.collaborationIntensity),
                        '& .MuiSlider-thumb': {
                          backgroundColor: getParameterColor(parameters.collaborationIntensity)
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      How actively agents collaborate
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Consensus Threshold: {(parameters.consensusThreshold * 100).toFixed(0)}%
                    </Typography>
                    <Slider
                      value={parameters.consensusThreshold}
                      onChange={(e, value) => handleParameterChange('consensusThreshold', value)}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      disabled={!autoMode}
                      sx={{
                        color: getParameterColor(parameters.consensusThreshold),
                        '& .MuiSlider-thumb': {
                          backgroundColor: getParameterColor(parameters.consensusThreshold)
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Agreement level required for consensus
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                      Response Timeout: {parameters.responseTimeout}s
                    </Typography>
                    <Slider
                      value={parameters.responseTimeout}
                      onChange={(e, value) => handleParameterChange('responseTimeout', value)}
                      min={5}
                      max={120}
                      step={5}
                      disabled={!autoMode}
                      sx={{
                        color: getParameterColor(parameters.responseTimeout, 5, 120),
                        '& .MuiSlider-thumb': {
                          backgroundColor: getParameterColor(parameters.responseTimeout, 5, 120)
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Maximum time to wait for agent responses
                    </Typography>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Advanced Controls */}
          <Grid item xs={12}>
            <Accordion sx={{ backgroundColor: '#4a5568', color: 'white' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography variant="subtitle1">Advanced Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Adaptation Rate: {(parameters.adaptationRate * 100).toFixed(0)}%
                      </Typography>
                      <Slider
                        value={parameters.adaptationRate}
                        onChange={(e, value) => handleParameterChange('adaptationRate', value)}
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        disabled={!autoMode}
                        sx={{
                          color: getParameterColor(parameters.adaptationRate),
                          '& .MuiSlider-thumb': {
                            backgroundColor: getParameterColor(parameters.adaptationRate)
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        How quickly the system adapts to changes
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
                        Emergent Behavior Sensitivity: {(parameters.emergentBehaviorSensitivity * 100).toFixed(0)}%
                      </Typography>
                      <Slider
                        value={parameters.emergentBehaviorSensitivity}
                        onChange={(e, value) => handleParameterChange('emergentBehaviorSensitivity', value)}
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        disabled={!autoMode}
                        sx={{
                          color: getParameterColor(parameters.emergentBehaviorSensitivity),
                          '& .MuiSlider-thumb': {
                            backgroundColor: getParameterColor(parameters.emergentBehaviorSensitivity)
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        Sensitivity to detecting emergent behaviors
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderInterventionActions = () => (
    <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Emergency />
            <Typography variant="h6">Intervention Actions</Typography>
            {emergencyMode && (
              <Chip label="Emergency Mode" color="error" />
            )}
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          {interventionActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.id}>
              <Card
                sx={{
                  backgroundColor: '#4a5568',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#5a6578',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleInterventionTrigger(action)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">{action.name}</Typography>
                    <Chip
                      label={action.severity}
                      size="small"
                      sx={{
                        backgroundColor: getSeverityColor(action.severity),
                        color: 'white'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                    {action.description}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label={action.type}
                      size="small"
                      variant="outlined"
                      sx={{ color: 'white', borderColor: '#a0aec0' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box className={className}>
      {/* Emergency Alert */}
      {emergencyMode && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setEmergencyMode(false)}
            >
              Reset
            </Button>
          }
        >
          <AlertTitle>Emergency Mode Active</AlertTitle>
          All collaboration activities have been halted. Review the situation before resuming.
        </Alert>
      )}

      {renderParameterControls()}
      {renderInterventionActions()}

      {/* Intervention Confirmation Dialog */}
      <Dialog
        open={interventionDialogOpen}
        onClose={() => setInterventionDialogOpen(false)}
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Warning sx={{ color: 'error.main' }} />
            Confirm Intervention
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIntervention && (
            <Box>
              <Typography variant="h6" mb={2}>
                {selectedIntervention.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                {selectedIntervention.description}
              </Typography>
              <Alert severity="warning" sx={{ backgroundColor: '#744210', color: 'white' }}>
                This is a {selectedIntervention.severity} severity action that will immediately affect the collaboration session.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterventionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmIntervention}
            color="error"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InteractiveControlsPanel;

