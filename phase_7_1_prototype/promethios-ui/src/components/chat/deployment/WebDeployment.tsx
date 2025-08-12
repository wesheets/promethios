/**
 * Web Deployment Component
 * 
 * Dedicated page for web widget deployment configuration
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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Language as WebIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Visibility as PreviewIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  CheckCircle as CheckIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';

interface WebWidgetConfig {
  enabled: boolean;
  widget_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  widget_size: 'small' | 'medium' | 'large' | 'fullscreen';
  theme: 'light' | 'dark' | 'auto';
  primary_color: string;
  secondary_color: string;
  border_radius: number;
  shadow_enabled: boolean;
  animation_enabled: boolean;
  mobile_responsive: boolean;
  allowed_domains: string[];
}

const WebDeployment: React.FC = () => {
  const [config, setConfig] = useState<WebWidgetConfig>({
    enabled: true,
    widget_position: 'bottom-right',
    widget_size: 'medium',
    theme: 'auto',
    primary_color: '#1976d2',
    secondary_color: '#f5f5f5',
    border_radius: 8,
    shadow_enabled: true,
    animation_enabled: true,
    mobile_responsive: true,
    allowed_domains: []
  });

  const [embedCode, setEmbedCode] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const generateEmbedCode = () => {
    const code = `<!-- Promethios Chat Widget -->
<script>
  (function() {
    const chatWidget = document.createElement('div');
    chatWidget.id = 'promethios-chat-widget';
    chatWidget.style.cssText = \`
      position: fixed;
      ${config.widget_position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.widget_position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: ${config.widget_size === 'small' ? '300px' : config.widget_size === 'large' ? '400px' : '350px'};
      height: ${config.widget_size === 'fullscreen' ? '100vh' : '500px'};
      z-index: 9999;
      border-radius: ${config.border_radius}px;
      ${config.shadow_enabled ? 'box-shadow: 0 4px 20px rgba(0,0,0,0.15);' : ''}
    \`;
    
    const iframe = document.createElement('iframe');
    iframe.src = 'https://chat.promethios.ai/widget/embed';
    iframe.style.cssText = \`
      width: 100%;
      height: 100%;
      border: none;
      border-radius: ${config.border_radius}px;
    \`;
    
    chatWidget.appendChild(iframe);
    document.body.appendChild(chatWidget);
    
    // Widget configuration
    window.PromethiosChat = {
      config: ${JSON.stringify(config, null, 2)},
      apiEndpoint: 'https://api.promethios.ai/chat'
    };
  })();
</script>
<!-- End Promethios Chat Widget -->`;
    
    setEmbedCode(code);
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    // TODO: Show success toast
  };

  React.useEffect(() => {
    generateEmbedCode();
  }, [config]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <WebIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          Web Widget Deployment
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Configure and deploy your chatbot as a web widget for websites
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Widget Configuration
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Web Widget</span>}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Widget Position</InputLabel>
              <Select
                value={config.widget_position}
                onChange={(e) => setConfig(prev => ({ ...prev, widget_position: e.target.value as any }))}
                label="Widget Position"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="bottom-right">Bottom Right</MenuItem>
                <MenuItem value="bottom-left">Bottom Left</MenuItem>
                <MenuItem value="top-right">Top Right</MenuItem>
                <MenuItem value="top-left">Top Left</MenuItem>
                <MenuItem value="center">Center</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Widget Size</InputLabel>
              <Select
                value={config.widget_size}
                onChange={(e) => setConfig(prev => ({ ...prev, widget_size: e.target.value as any }))}
                label="Widget Size"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="small">Small (300px)</MenuItem>
                <MenuItem value="medium">Medium (350px)</MenuItem>
                <MenuItem value="large">Large (400px)</MenuItem>
                <MenuItem value="fullscreen">Fullscreen</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Theme</InputLabel>
              <Select
                value={config.theme}
                onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as any }))}
                label="Theme"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto (System)</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'white', mt: 3 }}>
              <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Styling Options
            </Typography>
            
            <TextField
              fullWidth
              label="Primary Color"
              type="color"
              value={config.primary_color}
              onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
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
            
            <TextField
              fullWidth
              label="Border Radius (px)"
              type="number"
              value={config.border_radius}
              onChange={(e) => setConfig(prev => ({ ...prev, border_radius: parseInt(e.target.value) }))}
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
                  checked={config.shadow_enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, shadow_enabled: e.target.checked }))}
                />
              }
              label={<span style={{ color: 'white' }}>Drop Shadow</span>}
              sx={{ mt: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.animation_enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, animation_enabled: e.target.checked }))}
                />
              }
              label={<span style={{ color: 'white' }}>Animations</span>}
              sx={{ mt: 1 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.mobile_responsive}
                  onChange={(e) => setConfig(prev => ({ ...prev, mobile_responsive: e.target.checked }))}
                />
              }
              label={<span style={{ color: 'white' }}>Mobile Responsive</span>}
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>
        
        {/* Embed Code Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Embed Code
              </Typography>
              
              <Box>
                <Tooltip title="Copy to clipboard">
                  <IconButton onClick={copyEmbedCode} sx={{ color: 'white' }}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Preview widget">
                  <IconButton onClick={() => setPreviewOpen(true)} sx={{ color: 'white' }}>
                    <PreviewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={12}
              value={embedCode}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& textarea': { color: 'white' }
                }
              }}
              InputProps={{
                readOnly: true,
              }}
            />
            
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2, 
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                border: '1px solid rgba(33, 150, 243, 0.3)',
                '& .MuiAlert-message': { color: 'white' }
              }}
            >
              Copy this code and paste it into your website's HTML, preferably before the closing &lt;/body&gt; tag.
            </Alert>
            
            <Box mt={3}>
              <Button
                variant="contained"
                startIcon={<LaunchIcon />}
                fullWidth
                onClick={() => window.open('https://docs.promethios.ai/web-widget', '_blank')}
              >
                View Documentation
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WebDeployment;

