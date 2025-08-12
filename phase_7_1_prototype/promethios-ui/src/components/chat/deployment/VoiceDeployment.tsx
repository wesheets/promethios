/**
 * Voice Deployment Component
 * 
 * Dedicated page for voice integration deployment configuration
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
} from '@mui/material';
import {
  Phone as VoiceIcon,
  Settings as SettingsIcon,
  VolumeUp as SpeechIcon,
  Mic as MicIcon,
  PhoneCallback as CallIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';

interface VoiceConfig {
  enabled: boolean;
  provider: 'twilio' | 'vonage' | 'custom';
  phone_number: string;
  voice_settings: {
    language: string;
    voice_type: 'male' | 'female' | 'neutral';
    speech_rate: number;
    pitch: number;
    volume: number;
  };
  call_routing: {
    business_hours_only: boolean;
    max_call_duration: number;
    queue_enabled: boolean;
    hold_music: boolean;
  };
  transcription: {
    enabled: boolean;
    language: string;
    confidence_threshold: number;
  };
}

const VoiceDeployment: React.FC = () => {
  const [config, setConfig] = useState<VoiceConfig>({
    enabled: false,
    provider: 'twilio',
    phone_number: '',
    voice_settings: {
      language: 'en-US',
      voice_type: 'neutral',
      speech_rate: 1.0,
      pitch: 1.0,
      volume: 0.8
    },
    call_routing: {
      business_hours_only: true,
      max_call_duration: 30,
      queue_enabled: true,
      hold_music: true
    },
    transcription: {
      enabled: true,
      language: 'en-US',
      confidence_threshold: 0.7
    }
  });

  const [testingVoice, setTestingVoice] = useState(false);

  const handleTestVoice = async () => {
    setTestingVoice(true);
    try {
      // TODO: Test voice configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setTestingVoice(false);
    }
  };

  const updateConfig = (section: keyof VoiceConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <VoiceIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          Voice Integration Deployment
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Configure voice calling capabilities for your chatbot
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Provider Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Provider Configuration
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => updateConfig('enabled', e.target.checked)}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Voice Integration</span>}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Voice Provider</InputLabel>
              <Select
                value={config.provider}
                onChange={(e) => updateConfig('provider', e.target.value)}
                label="Voice Provider"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="twilio">Twilio</MenuItem>
                <MenuItem value="vonage">Vonage (Nexmo)</MenuItem>
                <MenuItem value="custom">Custom Provider</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Phone Number"
              value={config.phone_number}
              onChange={(e) => updateConfig('phone_number', e.target.value)}
              margin="normal"
              placeholder="+1 (555) 123-4567"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& input': { color: 'white' }
                }
              }}
            />
            
            {config.provider === 'twilio' && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2, 
                  bgcolor: 'rgba(33, 150, 243, 0.1)', 
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  '& .MuiAlert-message': { color: 'white' }
                }}
              >
                You'll need to configure your Twilio Account SID and Auth Token in the API settings.
              </Alert>
            )}
          </Paper>
          
          {/* Call Routing */}
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <CallIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Call Routing
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.call_routing.business_hours_only}
                  onChange={(e) => updateConfig('call_routing', { business_hours_only: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Business Hours Only</span>}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Max Call Duration (minutes)"
              type="number"
              value={config.call_routing.max_call_duration}
              onChange={(e) => updateConfig('call_routing', { max_call_duration: parseInt(e.target.value) })}
              margin="normal"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& input': { color: 'white' }
                }
              }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.call_routing.queue_enabled}
                  onChange={(e) => updateConfig('call_routing', { queue_enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Call Queue</span>}
              sx={{ mt: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.call_routing.hold_music}
                  onChange={(e) => updateConfig('call_routing', { hold_music: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Hold Music</span>}
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>
        
        {/* Voice Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SpeechIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Voice Settings
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Language</InputLabel>
              <Select
                value={config.voice_settings.language}
                onChange={(e) => updateConfig('voice_settings', { language: e.target.value })}
                label="Language"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="en-US">English (US)</MenuItem>
                <MenuItem value="en-GB">English (UK)</MenuItem>
                <MenuItem value="es-ES">Spanish</MenuItem>
                <MenuItem value="fr-FR">French</MenuItem>
                <MenuItem value="de-DE">German</MenuItem>
                <MenuItem value="it-IT">Italian</MenuItem>
                <MenuItem value="pt-BR">Portuguese</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Voice Type</InputLabel>
              <Select
                value={config.voice_settings.voice_type}
                onChange={(e) => updateConfig('voice_settings', { voice_type: e.target.value })}
                label="Voice Type"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="neutral">Neutral</MenuItem>
              </Select>
            </FormControl>
            
            <Box mt={3}>
              <Typography gutterBottom sx={{ color: 'white' }}>
                Speech Rate: {config.voice_settings.speech_rate}x
              </Typography>
              <Slider
                value={config.voice_settings.speech_rate}
                onChange={(_, value) => updateConfig('voice_settings', { speech_rate: value })}
                min={0.5}
                max={2.0}
                step={0.1}
                marks
                sx={{ color: '#1976d2' }}
              />
            </Box>
            
            <Box mt={3}>
              <Typography gutterBottom sx={{ color: 'white' }}>
                Pitch: {config.voice_settings.pitch}x
              </Typography>
              <Slider
                value={config.voice_settings.pitch}
                onChange={(_, value) => updateConfig('voice_settings', { pitch: value })}
                min={0.5}
                max={2.0}
                step={0.1}
                marks
                sx={{ color: '#1976d2' }}
              />
            </Box>
            
            <Box mt={3}>
              <Typography gutterBottom sx={{ color: 'white' }}>
                Volume: {Math.round(config.voice_settings.volume * 100)}%
              </Typography>
              <Slider
                value={config.voice_settings.volume}
                onChange={(_, value) => updateConfig('voice_settings', { volume: value as number })}
                min={0}
                max={1}
                step={0.1}
                marks
                sx={{ color: '#1976d2' }}
              />
            </Box>
            
            <Box mt={3}>
              <Button
                variant="outlined"
                startIcon={<SpeechIcon />}
                onClick={handleTestVoice}
                disabled={testingVoice}
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                {testingVoice ? 'Testing...' : 'Test Voice'}
              </Button>
            </Box>
          </Paper>
          
          {/* Transcription Settings */}
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <MicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Speech Recognition
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.transcription.enabled}
                  onChange={(e) => updateConfig('transcription', { enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Transcription</span>}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Transcription Language</InputLabel>
              <Select
                value={config.transcription.language}
                onChange={(e) => updateConfig('transcription', { language: e.target.value })}
                label="Transcription Language"
                disabled={!config.transcription.enabled}
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="en-US">English (US)</MenuItem>
                <MenuItem value="en-GB">English (UK)</MenuItem>
                <MenuItem value="es-ES">Spanish</MenuItem>
                <MenuItem value="fr-FR">French</MenuItem>
                <MenuItem value="de-DE">German</MenuItem>
              </Select>
            </FormControl>
            
            <Box mt={3}>
              <Typography gutterBottom sx={{ color: 'white' }}>
                Confidence Threshold: {Math.round(config.transcription.confidence_threshold * 100)}%
              </Typography>
              <Slider
                value={config.transcription.confidence_threshold}
                onChange={(_, value) => updateConfig('transcription', { confidence_threshold: value })}
                min={0.1}
                max={1.0}
                step={0.1}
                marks
                disabled={!config.transcription.enabled}
                sx={{ color: '#1976d2' }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Box mt={4}>
        <Button
          variant="contained"
          size="large"
          startIcon={<LaunchIcon />}
          onClick={() => window.open('https://docs.promethios.ai/voice-integration', '_blank')}
        >
          View Voice Integration Documentation
        </Button>
      </Box>
    </Container>
  );
};

export default VoiceDeployment;

