import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  Radio,
  Checkbox,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from '@mui/icons-material';

interface ChatInterfaceSettings {
  // Information Processing
  articleAnalysis: {
    showVerificationButton: boolean;
    autoVerifyArticles: boolean;
    hideRawScrapingData: boolean;
    analysisDepth: 'quick' | 'standard' | 'deep';
  };
  searchResults: {
    showSourceLinks: boolean;
    compactView: boolean;
    resultsPerQuery: number;
  };
  documentGeneration: {
    showDownloadLinks: boolean;
    autoOpenDocuments: boolean;
    defaultFormat: 'pdf' | 'docx' | 'txt';
  };
  
  // Response Formatting
  messageStyle: {
    useEmojisInHeaders: boolean;
    compactResponses: boolean;
    showTechnicalDetails: boolean;
    theme: 'professional' | 'casual' | 'technical';
  };
  dataDisplay: {
    showConfidenceScores: boolean;
    includeSourceCitations: boolean;
    expandAllSections: boolean;
    chartStyle: 'modern' | 'classic' | 'minimal';
  };
  
  // Verification & Trust
  factChecking: {
    enableVerificationMode: boolean;
    autoVerifyNewsArticles: boolean;
    showBiasIndicators: boolean;
    verificationDepth: 'basic' | 'standard' | 'comprehensive';
  };
  sourceRequirements: {
    minimumSources: number;
    requireGovernmentSources: boolean;
    includeAcademicSources: boolean;
    showDissentingViews: boolean;
  };
  
  // Performance Settings
  responseSpeed: {
    priority: 'balanced' | 'speed' | 'accuracy';
    timeoutSeconds: number;
  };
  dataHandling: {
    cacheSearchResults: boolean;
    saveVerificationReports: boolean;
    autoOrganizeAttachments: boolean;
  };
}

const defaultSettings: ChatInterfaceSettings = {
  articleAnalysis: {
    showVerificationButton: true,
    autoVerifyArticles: false,
    hideRawScrapingData: true,
    analysisDepth: 'standard'
  },
  searchResults: {
    showSourceLinks: true,
    compactView: false,
    resultsPerQuery: 10
  },
  documentGeneration: {
    showDownloadLinks: true,
    autoOpenDocuments: false,
    defaultFormat: 'pdf'
  },
  messageStyle: {
    useEmojisInHeaders: true,
    compactResponses: false,
    showTechnicalDetails: false,
    theme: 'professional'
  },
  dataDisplay: {
    showConfidenceScores: true,
    includeSourceCitations: true,
    expandAllSections: false,
    chartStyle: 'modern'
  },
  factChecking: {
    enableVerificationMode: true,
    autoVerifyNewsArticles: false,
    showBiasIndicators: true,
    verificationDepth: 'standard'
  },
  sourceRequirements: {
    minimumSources: 3,
    requireGovernmentSources: true,
    includeAcademicSources: true,
    showDissentingViews: false
  },
  responseSpeed: {
    priority: 'balanced',
    timeoutSeconds: 60
  },
  dataHandling: {
    cacheSearchResults: true,
    saveVerificationReports: false,
    autoOrganizeAttachments: true
  }
};

export const ChatInterfacePanel: React.FC = () => {
  const [settings, setSettings] = useState<ChatInterfaceSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatInterfaceSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.warn('Failed to load chat interface settings:', error);
      }
    }
  }, []);

  // Update settings helper
  const updateSettings = (section: keyof ChatInterfaceSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('chatInterfaceSettings', JSON.stringify(settings));
    setHasChanges(false);
    // TODO: Also save to Firebase/backend for persistence across devices
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto',
      bgcolor: '#0f172a',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#1e293b',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#475569',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#64748b',
      },
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #1e293b' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Chat Interface
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Reset to defaults">
              <IconButton size="small" onClick={resetToDefaults} sx={{ color: '#64748b' }}>
                <RefreshIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
              onClick={saveSettings}
              disabled={!hasChanges}
              sx={{
                bgcolor: hasChanges ? '#3b82f6' : '#374151',
                color: 'white',
                fontSize: '0.75rem',
                px: 1.5,
                py: 0.5,
                '&:hover': {
                  bgcolor: hasChanges ? '#2563eb' : '#374151',
                }
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
          Customize how AI responses are processed and displayed
        </Typography>
      </Box>

      {/* Settings Sections */}
      <Box sx={{ p: 2 }}>
        
        {/* Information Processing */}
        <Accordion 
          defaultExpanded 
          sx={{ 
            bgcolor: '#1e293b', 
            border: '1px solid #334155',
            mb: 2,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
            <Typography sx={{ color: 'white', fontWeight: 600 }}>
              🔍 Information Processing
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              
              {/* Article Analysis */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1, fontWeight: 600 }}>
                  📰 Article Analysis
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.articleAnalysis.showVerificationButton}
                        onChange={(e) => updateSettings('articleAnalysis', 'showVerificationButton', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Show verification button</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.articleAnalysis.autoVerifyArticles}
                        onChange={(e) => updateSettings('articleAnalysis', 'autoVerifyArticles', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Auto-verify all articles</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.articleAnalysis.hideRawScrapingData}
                        onChange={(e) => updateSettings('articleAnalysis', 'hideRawScrapingData', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Hide raw scraping data</Typography>}
                  />
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 1 }}>
                      Analysis Depth
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={settings.articleAnalysis.analysisDepth}
                        onChange={(e) => updateSettings('articleAnalysis', 'analysisDepth', e.target.value)}
                        sx={{ 
                          bgcolor: '#334155', 
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' }
                        }}
                      >
                        <MenuItem value="quick">Quick</MenuItem>
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="deep">Deep</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ bgcolor: '#334155' }} />

              {/* Search Results */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1, fontWeight: 600 }}>
                  🔍 Search Results
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.searchResults.showSourceLinks}
                        onChange={(e) => updateSettings('searchResults', 'showSourceLinks', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Show source links</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.searchResults.compactView}
                        onChange={(e) => updateSettings('searchResults', 'compactView', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Compact view</Typography>}
                  />
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 1 }}>
                      Results per query: {settings.searchResults.resultsPerQuery}
                    </Typography>
                    <Slider
                      value={settings.searchResults.resultsPerQuery}
                      onChange={(_, value) => updateSettings('searchResults', 'resultsPerQuery', value)}
                      min={5}
                      max={20}
                      step={5}
                      marks
                      sx={{ color: '#3b82f6' }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Verification & Trust */}
        <Accordion 
          sx={{ 
            bgcolor: '#1e293b', 
            border: '1px solid #334155',
            mb: 2,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
            <Typography sx={{ color: 'white', fontWeight: 600 }}>
              🛡️ Verification & Trust
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              
              {/* Fact-Checking */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1, fontWeight: 600 }}>
                  🔒 Fact-Checking
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.factChecking.enableVerificationMode}
                        onChange={(e) => updateSettings('factChecking', 'enableVerificationMode', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Enable verification mode</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.factChecking.autoVerifyNewsArticles}
                        onChange={(e) => updateSettings('factChecking', 'autoVerifyNewsArticles', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Auto-verify news articles</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.factChecking.showBiasIndicators}
                        onChange={(e) => updateSettings('factChecking', 'showBiasIndicators', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Show bias indicators</Typography>}
                  />
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 1 }}>
                      Verification Depth
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={settings.factChecking.verificationDepth}
                        onChange={(e) => updateSettings('factChecking', 'verificationDepth', e.target.value)}
                        sx={{ 
                          bgcolor: '#334155', 
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' }
                        }}
                      >
                        <MenuItem value="basic">Basic</MenuItem>
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="comprehensive">Comprehensive</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ bgcolor: '#334155' }} />

              {/* Source Requirements */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1, fontWeight: 600 }}>
                  📋 Source Requirements
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 1 }}>
                      Minimum sources: {settings.sourceRequirements.minimumSources}
                    </Typography>
                    <Slider
                      value={settings.sourceRequirements.minimumSources}
                      onChange={(_, value) => updateSettings('sourceRequirements', 'minimumSources', value)}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      sx={{ color: '#3b82f6' }}
                    />
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.sourceRequirements.requireGovernmentSources}
                        onChange={(e) => updateSettings('sourceRequirements', 'requireGovernmentSources', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Require government sources</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.sourceRequirements.includeAcademicSources}
                        onChange={(e) => updateSettings('sourceRequirements', 'includeAcademicSources', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Include academic sources</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.sourceRequirements.showDissentingViews}
                        onChange={(e) => updateSettings('sourceRequirements', 'showDissentingViews', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Show dissenting views</Typography>}
                  />
                </Stack>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Performance Settings */}
        <Accordion 
          sx={{ 
            bgcolor: '#1e293b', 
            border: '1px solid #334155',
            mb: 2,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
            <Typography sx={{ color: 'white', fontWeight: 600 }}>
              ⚡ Performance Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              
              {/* Response Speed */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1, fontWeight: 600 }}>
                  🚀 Response Speed
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={settings.responseSpeed.priority}
                    onChange={(e) => updateSettings('responseSpeed', 'priority', e.target.value)}
                  >
                    <FormControlLabel 
                      value="speed" 
                      control={<Radio size="small" sx={{ color: '#64748b' }} />} 
                      label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Speed priority</Typography>}
                    />
                    <FormControlLabel 
                      value="balanced" 
                      control={<Radio size="small" sx={{ color: '#64748b' }} />} 
                      label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Balanced (recommended)</Typography>}
                    />
                    <FormControlLabel 
                      value="accuracy" 
                      control={<Radio size="small" sx={{ color: '#64748b' }} />} 
                      label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Accuracy priority</Typography>}
                    />
                  </RadioGroup>
                </FormControl>
                
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 1 }}>
                    Timeout: {settings.responseSpeed.timeoutSeconds}s
                  </Typography>
                  <Slider
                    value={settings.responseSpeed.timeoutSeconds}
                    onChange={(_, value) => updateSettings('responseSpeed', 'timeoutSeconds', value)}
                    min={30}
                    max={180}
                    step={30}
                    marks={[
                      { value: 30, label: '30s' },
                      { value: 60, label: '60s' },
                      { value: 120, label: '120s' },
                      { value: 180, label: '180s' }
                    ]}
                    sx={{ color: '#3b82f6' }}
                  />
                </Box>
              </Box>

              <Divider sx={{ bgcolor: '#334155' }} />

              {/* Data Handling */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1, fontWeight: 600 }}>
                  💾 Data Handling
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.dataHandling.cacheSearchResults}
                        onChange={(e) => updateSettings('dataHandling', 'cacheSearchResults', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Cache search results</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.dataHandling.saveVerificationReports}
                        onChange={(e) => updateSettings('dataHandling', 'saveVerificationReports', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Save verification reports</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.dataHandling.autoOrganizeAttachments}
                        onChange={(e) => updateSettings('dataHandling', 'autoOrganizeAttachments', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Auto-organize attachments</Typography>}
                  />
                </Stack>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Status */}
        {hasChanges && (
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #f59e0b' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography sx={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                ⚠️ You have unsaved changes
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.5 }}>
                Click "Save" to apply your customizations
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ChatInterfacePanel;

