/**
 * Enhanced Veritas Panel Component
 * 
 * Extends the existing VeritasPanel with uncertainty analysis, HITL collaboration,
 * and enhanced verification capabilities while maintaining backward compatibility.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  VerifiedUser,
  Psychology,
  QuestionAnswer,
  Settings,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
  Group,
  Timeline
} from '@mui/icons-material';
import { VeritasPanel } from '../../components/VeritasPanel';
import UncertaintyAnalysisDisplay from './UncertaintyAnalysisDisplay';
import HITLCollaborationInterface from './HITLCollaborationInterface';
import { 
  EnhancedVerificationResult, 
  EnhancedVeritasOptions,
  HITLSession,
  UncertaintyAnalysis 
} from '../types';
import { useEnhancedVeritas } from '../hooks/useEnhancedVeritas';

interface EnhancedVeritasPanelProps {
  text: string;
  options?: EnhancedVeritasOptions;
  onVerificationComplete?: (result: EnhancedVerificationResult) => void;
  onHITLSessionStart?: (session: HITLSession) => void;
  className?: string;
  showEnhancedFeatures?: boolean;
}

const EnhancedVeritasPanel: React.FC<EnhancedVeritasPanelProps> = ({
  text,
  options = {},
  onVerificationComplete,
  onHITLSessionStart,
  className = '',
  showEnhancedFeatures = true
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [enhancedMode, setEnhancedMode] = useState(options.enhancedMode ?? true);
  const [showSettings, setShowSettings] = useState(false);
  const [enhancedOptions, setEnhancedOptions] = useState<EnhancedVeritasOptions>({
    uncertaintyAnalysis: true,
    hitlCollaboration: true,
    hitlThreshold: 0.7,
    clarificationStrategy: 'progressive',
    multiAgentOrchestration: false,
    quantumUncertainty: false,
    enhancedMode: true,
    ...options
  });

  const {
    result,
    loading,
    error,
    hitlSession,
    verifyTextEnhanced,
    startHITLSession,
    processHumanFeedback,
    completeHITLSession
  } = useEnhancedVeritas();

  useEffect(() => {
    if (text && enhancedMode) {
      handleVerification();
    }
  }, [text, enhancedMode, enhancedOptions]);

  useEffect(() => {
    if (result && onVerificationComplete) {
      onVerificationComplete(result);
    }
  }, [result, onVerificationComplete]);

  useEffect(() => {
    if (hitlSession && onHITLSessionStart) {
      onHITLSessionStart(hitlSession);
    }
  }, [hitlSession, onHITLSessionStart]);

  const handleVerification = async () => {
    if (!text.trim()) return;
    
    try {
      await verifyTextEnhanced(text, enhancedOptions);
    } catch (err) {
      console.error('Enhanced verification failed:', err);
    }
  };

  const handleHITLTrigger = async () => {
    if (result?.uncertaintyAnalysis) {
      try {
        await startHITLSession({
          uncertaintyAnalysis: result.uncertaintyAnalysis,
          context: enhancedOptions.context || {},
          strategy: enhancedOptions.clarificationStrategy,
          priority: 'high'
        });
      } catch (err) {
        console.error('Failed to start HITL session:', err);
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEnhancedModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnhancedMode(event.target.checked);
    setEnhancedOptions(prev => ({ ...prev, enhancedMode: event.target.checked }));
  };

  const handleOptionChange = (option: keyof EnhancedVeritasOptions, value: any) => {
    setEnhancedOptions(prev => ({ ...prev, [option]: value }));
  };

  const getEnhancementStatusChip = () => {
    if (!result?.enhancementMetadata) return null;

    const features = result.enhancementMetadata.featuresUsed;
    const color = features.length > 2 ? 'success' : features.length > 1 ? 'warning' : 'info';
    
    return (
      <Chip
        icon={<AutoAwesome />}
        label={`${features.length} enhancements active`}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderEnhancedSettings = () => (
    <Collapse in={showSettings}>
      <Card sx={{ mt: 2, backgroundColor: '#4a5568', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Enhanced Veritas Settings
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={enhancedOptions.uncertaintyAnalysis}
                  onChange={(e) => handleOptionChange('uncertaintyAnalysis', e.target.checked)}
                />
              }
              label="Uncertainty Analysis"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={enhancedOptions.hitlCollaboration}
                  onChange={(e) => handleOptionChange('hitlCollaboration', e.target.checked)}
                />
              }
              label="Human-in-the-Loop Collaboration"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={enhancedOptions.multiAgentOrchestration}
                  onChange={(e) => handleOptionChange('multiAgentOrchestration', e.target.checked)}
                />
              }
              label="Multi-Agent Orchestration"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={enhancedOptions.quantumUncertainty}
                  onChange={(e) => handleOptionChange('quantumUncertainty', e.target.checked)}
                />
              }
              label="Quantum Uncertainty Analysis"
            />
          </Box>
        </CardContent>
      </Card>
    </Collapse>
  );

  if (!showEnhancedFeatures || !enhancedMode) {
    // Fall back to standard Veritas panel
    return (
      <Box className={className}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FormControlLabel
            control={
              <Switch
                checked={enhancedMode}
                onChange={handleEnhancedModeToggle}
              />
            }
            label="Enhanced Mode"
          />
        </Box>
        <VeritasPanel text={text} options={options} />
      </Box>
    );
  }

  return (
    <Box className={`enhanced-veritas-panel ${className}`}>
      {/* Header with Enhanced Mode Toggle */}
      <Card sx={{ mb: 2, backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <VerifiedUser />
              <Typography variant="h6">Enhanced Veritas</Typography>
              {getEnhancementStatusChip()}
            </Box>
          }
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enhancedMode}
                    onChange={handleEnhancedModeToggle}
                    color="primary"
                  />
                }
                label="Enhanced Mode"
                sx={{ color: 'white' }}
              />
              <Tooltip title="Settings">
                <IconButton
                  onClick={() => setShowSettings(!showSettings)}
                  sx={{ color: 'white' }}
                >
                  {showSettings ? <ExpandLess /> : <Settings />}
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
      </Card>

      {/* Enhanced Settings */}
      {renderEnhancedSettings()}

      {/* Loading State */}
      {loading && (
        <Card sx={{ mb: 2, backgroundColor: '#4a5568', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={24} />
              <Typography>Performing enhanced verification...</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Enhanced verification failed: {error}
        </Alert>
      )}

      {/* Results Tabs */}
      {result && (
        <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ 
                '& .MuiTab-root': { color: 'white' },
                '& .Mui-selected': { color: '#3182ce !important' }
              }}
            >
              <Tab 
                icon={<VerifiedUser />} 
                label="Verification" 
                iconPosition="start"
              />
              {result.uncertaintyAnalysis && (
                <Tab 
                  icon={<Psychology />} 
                  label="Uncertainty" 
                  iconPosition="start"
                />
              )}
              {hitlSession && (
                <Tab 
                  icon={<QuestionAnswer />} 
                  label="Collaboration" 
                  iconPosition="start"
                />
              )}
              {result.multiAgentInsights && (
                <Tab 
                  icon={<Group />} 
                  label="Multi-Agent" 
                  iconPosition="start"
                />
              )}
              {result.quantumAnalysis && (
                <Tab 
                  icon={<Timeline />} 
                  label="Quantum" 
                  iconPosition="start"
                />
              )}
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <CardContent>
            {/* Standard Verification Results */}
            {activeTab === 0 && (
              <Box>
                <VeritasPanel 
                  text={text} 
                  options={options}
                  result={result}
                />
                
                {/* Enhancement Summary */}
                {result.enhancementMetadata && (
                  <Card sx={{ mt: 2, backgroundColor: '#4a5568', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Enhancement Summary
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                        {result.enhancementMetadata.featuresUsed.map((feature) => (
                          <Chip
                            key={feature}
                            label={feature.replace(/_/g, ' ')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Processing time: {result.enhancementMetadata.processingTime.total_time}ms |
                        Accuracy improvement: +{(result.enhancementMetadata.qualityMetrics.accuracy_improvement * 100).toFixed(1)}% |
                        Confidence improvement: +{(result.enhancementMetadata.qualityMetrics.confidence_improvement * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            {/* Uncertainty Analysis */}
            {activeTab === 1 && result.uncertaintyAnalysis && (
              <UncertaintyAnalysisDisplay
                analysis={result.uncertaintyAnalysis}
                onHITLTrigger={handleHITLTrigger}
                onActionSelect={(actionType) => {
                  console.log('Action selected:', actionType);
                  // Handle action selection
                }}
              />
            )}

            {/* HITL Collaboration */}
            {activeTab === 2 && hitlSession && (
              <HITLCollaborationInterface
                session={hitlSession}
                onResponseSubmit={processHumanFeedback}
                onSessionComplete={completeHITLSession}
              />
            )}

            {/* Multi-Agent Insights */}
            {activeTab === 3 && result.multiAgentInsights && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Multi-Agent Collaboration Results
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  {result.multiAgentInsights.agents.length} agents participated in verification
                </Typography>
                {/* Multi-agent visualization would go here */}
              </Box>
            )}

            {/* Quantum Analysis */}
            {activeTab === 4 && result.quantumAnalysis && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Quantum Uncertainty Analysis
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  Quantum states analyzed: {result.quantumAnalysis.quantumStates.length}
                </Typography>
                {/* Quantum visualization would go here */}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {result && !hitlSession && result.uncertaintyAnalysis?.overallUncertainty > 0.5 && (
        <Card sx={{ mt: 2, backgroundColor: '#4a5568', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<QuestionAnswer />}
                onClick={handleHITLTrigger}
                sx={{ backgroundColor: '#3182ce' }}
              >
                Start Collaboration
              </Button>
              <Button
                variant="outlined"
                startIcon={<Psychology />}
                onClick={() => handleVerification()}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Re-analyze
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EnhancedVeritasPanel;

