/**
 * TouchOptimizedControls - Touch-friendly version of behavioral orchestration controls
 * Optimized for mobile devices with larger touch targets and gesture support
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Fab,
  Drawer,
  Typography,
  Chip,
  Slider,
  Button,
  ButtonGroup,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Avatar,
  Badge
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Close as CloseIcon,
  TouchApp as TouchIcon,
  AutoAwesome as CreativeIcon,
  Analytics as AnalyticalIcon,
  Favorite as SupportiveIcon,
  RateReview as CriticalIcon,
  Balance as BalancedIcon,
  PlayArrow as TriggerIcon,
  Settings as SettingsIcon,
  Lightbulb as BrainstormIcon,
  QuestionMark as QuestionIcon,
  Summarize as SummarizeIcon,
  TrendingUp as EncourageIcon
} from '@mui/icons-material';
import { BehavioralSettings } from './BehavioralOrchestrationControls';
import { ParticipantData } from './HoverOrchestrationTrigger';

export interface TouchOptimizedControlsProps {
  participants: ParticipantData[];
  selectedParticipant: ParticipantData | null;
  onBehaviorChange: (agentId: string, settings: BehavioralSettings) => void;
  onQuickBehaviorTrigger: (agentId: string, trigger: string) => void;
  onClose: () => void;
  open: boolean;
}

export const TouchOptimizedControls: React.FC<TouchOptimizedControlsProps> = ({
  participants,
  selectedParticipant,
  onBehaviorChange,
  onQuickBehaviorTrigger,
  onClose,
  open
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState<'presets' | 'advanced' | 'triggers'>('presets');
  
  const currentBehavior = selectedParticipant?.currentBehavior || {
    responseStyle: 'balanced',
    creativity: 50,
    assertiveness: 50,
    collaboration: 70,
    verbosity: 60,
    formality: 60,
    proactivity: 60,
    interactionMode: 'active',
    focusAreas: ['general']
  };

  // Behavior presets optimized for touch
  const behaviorPresets = [
    {
      id: 'analytical',
      name: 'Analytical',
      icon: <AnalyticalIcon />,
      color: '#3b82f6',
      description: 'Data-driven, logical responses',
      settings: {
        responseStyle: 'analytical' as const,
        creativity: 20,
        assertiveness: 70,
        collaboration: 50,
        verbosity: 80,
        formality: 80,
        proactivity: 60,
        interactionMode: 'active' as const,
        focusAreas: ['analysis', 'data']
      }
    },
    {
      id: 'creative',
      name: 'Creative',
      icon: <CreativeIcon />,
      color: '#8b5cf6',
      description: 'Innovative, brainstorming mode',
      settings: {
        responseStyle: 'creative' as const,
        creativity: 90,
        assertiveness: 40,
        collaboration: 80,
        verbosity: 70,
        formality: 30,
        proactivity: 80,
        interactionMode: 'active' as const,
        focusAreas: ['creativity', 'innovation']
      }
    },
    {
      id: 'supportive',
      name: 'Supportive',
      icon: <SupportiveIcon />,
      color: '#10b981',
      description: 'Encouraging, collaborative',
      settings: {
        responseStyle: 'supportive' as const,
        creativity: 60,
        assertiveness: 30,
        collaboration: 90,
        verbosity: 60,
        formality: 40,
        proactivity: 70,
        interactionMode: 'active' as const,
        focusAreas: ['support', 'collaboration']
      }
    },
    {
      id: 'critical',
      name: 'Critical',
      icon: <CriticalIcon />,
      color: '#f59e0b',
      description: 'Constructive criticism',
      settings: {
        responseStyle: 'critical' as const,
        creativity: 40,
        assertiveness: 90,
        collaboration: 40,
        verbosity: 70,
        formality: 70,
        proactivity: 80,
        interactionMode: 'active' as const,
        focusAreas: ['critique', 'improvement']
      }
    },
    {
      id: 'balanced',
      name: 'Balanced',
      icon: <BalancedIcon />,
      color: '#6b7280',
      description: 'Moderate, synthesizing',
      settings: {
        responseStyle: 'balanced' as const,
        creativity: 50,
        assertiveness: 50,
        collaboration: 70,
        verbosity: 60,
        formality: 60,
        proactivity: 60,
        interactionMode: 'active' as const,
        focusAreas: ['general']
      }
    }
  ];

  // Quick trigger actions optimized for touch
  const quickTriggers = [
    { id: 'encourage', name: 'Encourage', icon: <EncourageIcon />, color: '#10b981' },
    { id: 'analyze', name: 'Analyze', icon: <AnalyticalIcon />, color: '#3b82f6' },
    { id: 'brainstorm', name: 'Brainstorm', icon: <BrainstormIcon />, color: '#8b5cf6' },
    { id: 'critique', name: 'Critique', icon: <CriticalIcon />, color: '#f59e0b' },
    { id: 'summarize', name: 'Summarize', icon: <SummarizeIcon />, color: '#6b7280' },
    { id: 'question', name: 'Question', icon: <QuestionIcon />, color: '#ef4444' }
  ];

  // Handle behavior preset selection
  const handlePresetSelect = (preset: typeof behaviorPresets[0]) => {
    if (selectedParticipant) {
      onBehaviorChange(selectedParticipant.id, preset.settings);
    }
  };

  // Handle slider change
  const handleSliderChange = (property: keyof BehavioralSettings, value: number) => {
    if (selectedParticipant) {
      const newSettings = {
        ...currentBehavior,
        [property]: value
      };
      onBehaviorChange(selectedParticipant.id, newSettings);
    }
  };

  // Handle quick trigger
  const handleQuickTrigger = (triggerId: string) => {
    if (selectedParticipant) {
      onQuickBehaviorTrigger(selectedParticipant.id, triggerId);
    }
  };

  if (!selectedParticipant) return null;

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80vh',
          minHeight: '50vh'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={selectedParticipant.avatar} 
              sx={{ width: 40, height: 40 }}
            >
              {selectedParticipant.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontSize: '1.1rem' }}>
                {selectedParticipant.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Behavioral Controls
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Tab Navigation */}
        <Box sx={{ mb: 3 }}>
          <ButtonGroup 
            variant="contained" 
            fullWidth
            sx={{ 
              '& .MuiButton-root': { 
                py: 1.5,
                fontSize: '0.9rem',
                textTransform: 'none'
              }
            }}
          >
            <Button
              onClick={() => setActiveTab('presets')}
              sx={{
                bgcolor: activeTab === 'presets' ? '#3b82f6' : '#374151',
                '&:hover': { bgcolor: activeTab === 'presets' ? '#2563eb' : '#4b5563' }
              }}
            >
              Presets
            </Button>
            <Button
              onClick={() => setActiveTab('triggers')}
              sx={{
                bgcolor: activeTab === 'triggers' ? '#3b82f6' : '#374151',
                '&:hover': { bgcolor: activeTab === 'triggers' ? '#2563eb' : '#4b5563' }
              }}
            >
              Quick Actions
            </Button>
            <Button
              onClick={() => setActiveTab('advanced')}
              sx={{
                bgcolor: activeTab === 'advanced' ? '#3b82f6' : '#374151',
                '&:hover': { bgcolor: activeTab === 'advanced' ? '#2563eb' : '#4b5563' }
              }}
            >
              Advanced
            </Button>
          </ButtonGroup>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
          {/* Behavior Presets Tab */}
          {activeTab === 'presets' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {behaviorPresets.map((preset) => (
                <Button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  sx={{
                    p: 2,
                    height: 'auto',
                    flexDirection: 'column',
                    gap: 1,
                    bgcolor: currentBehavior.responseStyle === preset.settings.responseStyle 
                      ? `${preset.color}20` 
                      : '#374151',
                    border: currentBehavior.responseStyle === preset.settings.responseStyle 
                      ? `2px solid ${preset.color}` 
                      : '2px solid transparent',
                    '&:hover': { 
                      bgcolor: `${preset.color}30`,
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Box sx={{ color: preset.color, fontSize: '2rem' }}>
                    {preset.icon}
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                    {preset.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                    {preset.description}
                  </Typography>
                </Button>
              ))}
            </Box>
          )}

          {/* Quick Triggers Tab */}
          {activeTab === 'triggers' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {quickTriggers.map((trigger) => (
                <Button
                  key={trigger.id}
                  onClick={() => handleQuickTrigger(trigger.id)}
                  sx={{
                    p: 2,
                    height: 'auto',
                    flexDirection: 'column',
                    gap: 1,
                    bgcolor: '#374151',
                    '&:hover': { 
                      bgcolor: `${trigger.color}30`,
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Box sx={{ color: trigger.color, fontSize: '2rem' }}>
                    {trigger.icon}
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                    {trigger.name}
                  </Typography>
                </Button>
              ))}
            </Box>
          )}

          {/* Advanced Controls Tab */}
          {activeTab === 'advanced' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { key: 'creativity', label: 'Creativity', color: '#8b5cf6' },
                { key: 'assertiveness', label: 'Assertiveness', color: '#f59e0b' },
                { key: 'collaboration', label: 'Collaboration', color: '#10b981' },
                { key: 'verbosity', label: 'Verbosity', color: '#3b82f6' },
                { key: 'formality', label: 'Formality', color: '#6b7280' },
                { key: 'proactivity', label: 'Proactivity', color: '#ef4444' }
              ].map(({ key, label, color }) => (
                <Box key={key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: color }}>
                      {currentBehavior[key as keyof BehavioralSettings]}%
                    </Typography>
                  </Box>
                  <Slider
                    value={currentBehavior[key as keyof BehavioralSettings] as number}
                    onChange={(_, value) => handleSliderChange(key as keyof BehavioralSettings, value as number)}
                    min={0}
                    max={100}
                    sx={{
                      color: color,
                      height: 8,
                      '& .MuiSlider-thumb': {
                        width: 24,
                        height: 24,
                        '&:hover': { boxShadow: `0 0 0 8px ${color}30` }
                      },
                      '& .MuiSlider-track': { height: 8 },
                      '& .MuiSlider-rail': { height: 8, bgcolor: '#374151' }
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default TouchOptimizedControls;

