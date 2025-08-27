/**
 * BehavioralOrchestrationControls - Revolutionary hover controls for real-time AI behavior adjustment
 * Allows users to dynamically orchestrate AI agent behaviors during conversations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Slider,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Fade,
  Popper,
  ClickAwayListener,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  AvatarGroup
} from '@mui/material';
import {
  Psychology as BehaviorIcon,
  Tune as TuneIcon,
  Speed as SpeedIcon,
  Lightbulb as CreativeIcon,
  Analytics as AnalyticalIcon,
  Support as SupportiveIcon,
  Gavel as CriticalIcon,
  AutoAwesome as MagicIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VolumeUp as VolumeIcon,
  Group as CollabIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';

export interface BehavioralSettings {
  responseStyle: 'analytical' | 'creative' | 'supportive' | 'critical' | 'balanced';
  creativity: number; // 0-100
  assertiveness: number; // 0-100
  collaboration: number; // 0-100
  verbosity: number; // 0-100
  formality: number; // 0-100
  proactivity: number; // 0-100
  interactionMode: 'active' | 'passive' | 'on-demand';
  focusAreas: string[];
}

export interface AIAgent {
  id: string;
  name: string;
  type: string;
  avatar?: string;
  currentBehavior: BehavioralSettings;
  isActive: boolean;
  ownerId: string;
  ownerName: string;
}

export interface BehavioralOrchestrationControlsProps {
  aiAgents: AIAgent[];
  onBehaviorChange: (agentId: string, settings: BehavioralSettings) => void;
  onQuickBehaviorTrigger: (agentId: string, trigger: string) => void;
  currentUserId: string;
  isVisible: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export const BehavioralOrchestrationControls: React.FC<BehavioralOrchestrationControlsProps> = ({
  aiAgents,
  onBehaviorChange,
  onQuickBehaviorTrigger,
  currentUserId,
  isVisible,
  anchorEl,
  onClose
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [tempSettings, setTempSettings] = useState<BehavioralSettings | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Quick behavior presets
  const behaviorPresets = {
    analytical: {
      responseStyle: 'analytical' as const,
      creativity: 20,
      assertiveness: 70,
      collaboration: 60,
      verbosity: 80,
      formality: 80,
      proactivity: 50,
      interactionMode: 'active' as const,
      focusAreas: ['analysis', 'data', 'logic']
    },
    creative: {
      responseStyle: 'creative' as const,
      creativity: 90,
      assertiveness: 50,
      collaboration: 70,
      verbosity: 60,
      formality: 30,
      proactivity: 80,
      interactionMode: 'active' as const,
      focusAreas: ['innovation', 'brainstorming', 'ideas']
    },
    supportive: {
      responseStyle: 'supportive' as const,
      creativity: 50,
      assertiveness: 30,
      collaboration: 90,
      verbosity: 70,
      formality: 50,
      proactivity: 60,
      interactionMode: 'active' as const,
      focusAreas: ['encouragement', 'assistance', 'guidance']
    },
    critical: {
      responseStyle: 'critical' as const,
      creativity: 40,
      assertiveness: 90,
      collaboration: 40,
      verbosity: 60,
      formality: 70,
      proactivity: 70,
      interactionMode: 'active' as const,
      focusAreas: ['evaluation', 'critique', 'improvement']
    },
    balanced: {
      responseStyle: 'balanced' as const,
      creativity: 50,
      assertiveness: 50,
      collaboration: 70,
      verbosity: 60,
      formality: 60,
      proactivity: 60,
      interactionMode: 'active' as const,
      focusAreas: ['balance', 'moderation', 'synthesis']
    }
  };

  // Quick trigger actions
  const quickTriggers = [
    { id: 'encourage', label: 'Encourage', icon: '💪', description: 'Provide encouragement and motivation' },
    { id: 'analyze', label: 'Analyze', icon: '🔍', description: 'Deep analytical response' },
    { id: 'brainstorm', label: 'Brainstorm', icon: '💡', description: 'Generate creative ideas' },
    { id: 'critique', label: 'Critique', icon: '🎯', description: 'Provide constructive criticism' },
    { id: 'summarize', label: 'Summarize', icon: '📋', description: 'Summarize the conversation' },
    { id: 'question', label: 'Question', icon: '❓', description: 'Ask probing questions' }
  ];

  const handleAgentSelect = (agentId: string) => {
    const agent = aiAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agentId);
      setTempSettings({ ...agent.currentBehavior });
    }
  };

  const handlePresetApply = (preset: keyof typeof behaviorPresets) => {
    if (selectedAgent) {
      const newSettings = { ...behaviorPresets[preset] };
      setTempSettings(newSettings);
      onBehaviorChange(selectedAgent, newSettings);
    }
  };

  const handleSliderChange = (property: keyof BehavioralSettings, value: number) => {
    if (tempSettings && selectedAgent) {
      const newSettings = { ...tempSettings, [property]: value };
      setTempSettings(newSettings);
      onBehaviorChange(selectedAgent, newSettings);
    }
  };

  const handleQuickTrigger = (triggerId: string) => {
    if (selectedAgent) {
      onQuickBehaviorTrigger(selectedAgent, triggerId);
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'analytical': return <AnalyticalIcon sx={{ fontSize: 16 }} />;
      case 'creative': return <CreativeIcon sx={{ fontSize: 16 }} />;
      case 'supportive': return <SupportiveIcon sx={{ fontSize: 16 }} />;
      case 'critical': return <CriticalIcon sx={{ fontSize: 16 }} />;
      default: return <BehaviorIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'analytical': return '#3b82f6';
      case 'creative': return '#8b5cf6';
      case 'supportive': return '#10b981';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const selectedAgentData = selectedAgent ? aiAgents.find(a => a.id === selectedAgent) : null;

  return (
    <Popper
      open={isVisible}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      sx={{ zIndex: 1300 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <ClickAwayListener onClickAway={onClose}>
            <Card
              sx={{
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 2,
                minWidth: 400,
                maxWidth: 500,
                maxHeight: 600,
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MagicIcon sx={{ color: '#8b5cf6' }} />
                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                        Behavioral Orchestration
                      </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Real-time AI behavior adjustment and orchestration
                  </Typography>
                </Box>

                {/* AI Agent Selection */}
                <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                    Select AI Agent
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {aiAgents.map((agent) => (
                      <Tooltip key={agent.id} title={`${agent.name} (${agent.ownerName})`}>
                        <Chip
                          avatar={
                            <Avatar sx={{ bgcolor: '#8b5cf6', width: 24, height: 24 }}>
                              <AIIcon sx={{ fontSize: 12 }} />
                            </Avatar>
                          }
                          label={agent.name}
                          onClick={() => handleAgentSelect(agent.id)}
                          variant={selectedAgent === agent.id ? 'filled' : 'outlined'}
                          sx={{
                            bgcolor: selectedAgent === agent.id ? '#8b5cf620' : 'transparent',
                            color: selectedAgent === agent.id ? '#8b5cf6' : '#94a3b8',
                            border: `1px solid ${selectedAgent === agent.id ? '#8b5cf6' : '#475569'}`,
                            '&:hover': {
                              bgcolor: '#8b5cf610',
                              borderColor: '#8b5cf6'
                            }
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>

                {selectedAgentData && tempSettings && (
                  <>
                    {/* Current Behavior Display */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                          Current Behavior
                        </Typography>
                        <Chip
                          icon={getStyleIcon(tempSettings.responseStyle)}
                          label={tempSettings.responseStyle}
                          size="small"
                          sx={{
                            bgcolor: `${getStyleColor(tempSettings.responseStyle)}20`,
                            color: getStyleColor(tempSettings.responseStyle),
                            height: 20
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {selectedAgentData.name} • Owned by {selectedAgentData.ownerName}
                      </Typography>
                    </Box>

                    {/* Quick Behavior Presets */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
                      <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                        Quick Presets
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Object.entries(behaviorPresets).map(([key, preset]) => (
                          <Button
                            key={key}
                            size="small"
                            startIcon={getStyleIcon(preset.responseStyle)}
                            onClick={() => handlePresetApply(key as keyof typeof behaviorPresets)}
                            sx={{
                              bgcolor: tempSettings.responseStyle === key ? `${getStyleColor(key)}20` : '#334155',
                              color: tempSettings.responseStyle === key ? getStyleColor(key) : '#94a3b8',
                              border: `1px solid ${tempSettings.responseStyle === key ? getStyleColor(key) : '#475569'}`,
                              textTransform: 'capitalize',
                              fontSize: '0.7rem',
                              py: 0.5,
                              px: 1,
                              minWidth: 'auto',
                              '&:hover': {
                                bgcolor: `${getStyleColor(key)}10`,
                                borderColor: getStyleColor(key)
                              }
                            }}
                          >
                            {key}
                          </Button>
                        ))}
                      </Box>
                    </Box>

                    {/* Quick Triggers */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
                      <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                        Quick Triggers
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                        {quickTriggers.map((trigger) => (
                          <Tooltip key={trigger.id} title={trigger.description}>
                            <Button
                              size="small"
                              onClick={() => handleQuickTrigger(trigger.id)}
                              sx={{
                                bgcolor: '#334155',
                                color: '#94a3b8',
                                border: '1px solid #475569',
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1,
                                minWidth: 'auto',
                                flexDirection: 'column',
                                gap: 0.5,
                                '&:hover': {
                                  bgcolor: '#3b82f610',
                                  borderColor: '#3b82f6',
                                  color: '#3b82f6'
                                }
                              }}
                            >
                              <Typography sx={{ fontSize: '1rem' }}>{trigger.icon}</Typography>
                              <Typography sx={{ fontSize: '0.6rem' }}>{trigger.label}</Typography>
                            </Button>
                          </Tooltip>
                        ))}
                      </Box>
                    </Box>

                    {/* Advanced Controls Toggle */}
                    <Box sx={{ p: 2, borderBottom: showAdvanced ? '1px solid #334155' : 'none' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showAdvanced}
                            onChange={(e) => setShowAdvanced(e.target.checked)}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SettingsIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              Advanced Controls
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Advanced Behavior Controls */}
                    {showAdvanced && (
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                          Fine-Tune Behavior
                        </Typography>
                        
                        {/* Behavior Sliders */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {[
                            { key: 'creativity', label: 'Creativity', icon: <CreativeIcon sx={{ fontSize: 16 }} />, color: '#8b5cf6' },
                            { key: 'assertiveness', label: 'Assertiveness', icon: <SpeedIcon sx={{ fontSize: 16 }} />, color: '#ef4444' },
                            { key: 'collaboration', label: 'Collaboration', icon: <CollabIcon sx={{ fontSize: 16 }} />, color: '#10b981' },
                            { key: 'verbosity', label: 'Verbosity', icon: <VolumeIcon sx={{ fontSize: 16 }} />, color: '#f59e0b' },
                            { key: 'formality', label: 'Formality', icon: <VisibilityIcon sx={{ fontSize: 16 }} />, color: '#3b82f6' },
                            { key: 'proactivity', label: 'Proactivity', icon: <TuneIcon sx={{ fontSize: 16 }} />, color: '#06b6d4' }
                          ].map(({ key, label, icon, color }) => (
                            <Box key={key}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {icon}
                                <Typography variant="caption" sx={{ color: 'white', flex: 1 }}>
                                  {label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', minWidth: 30 }}>
                                  {tempSettings[key as keyof BehavioralSettings]}%
                                </Typography>
                              </Box>
                              <Slider
                                value={tempSettings[key as keyof BehavioralSettings] as number}
                                onChange={(_, value) => handleSliderChange(key as keyof BehavioralSettings, value as number)}
                                min={0}
                                max={100}
                                step={5}
                                sx={{
                                  color,
                                  height: 4,
                                  '& .MuiSlider-thumb': {
                                    width: 16,
                                    height: 16,
                                    bgcolor: color
                                  },
                                  '& .MuiSlider-track': { bgcolor: color },
                                  '& .MuiSlider-rail': { bgcolor: '#475569' }
                                }}
                              />
                            </Box>
                          ))}
                        </Box>

                        {/* Interaction Mode */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ color: 'white', mb: 1, display: 'block' }}>
                            Interaction Mode
                          </Typography>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={tempSettings.interactionMode}
                              onChange={(e) => {
                                const newSettings = { ...tempSettings, interactionMode: e.target.value as any };
                                setTempSettings(newSettings);
                                onBehaviorChange(selectedAgent, newSettings);
                              }}
                              sx={{
                                bgcolor: '#334155',
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                              }}
                            >
                              <MenuItem value="active">Active - Proactive participation</MenuItem>
                              <MenuItem value="passive">Passive - Responds when addressed</MenuItem>
                              <MenuItem value="on-demand">On-Demand - Only when triggered</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    )}
                  </>
                )}

                {!selectedAgentData && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <BehaviorIcon sx={{ fontSize: 48, color: '#475569', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Select an AI agent to orchestrate its behavior
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </ClickAwayListener>
        </Fade>
      )}
    </Popper>
  );
};

export default BehavioralOrchestrationControls;

