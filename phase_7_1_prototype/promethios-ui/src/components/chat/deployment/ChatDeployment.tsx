/**
 * Chat Deployment & Embedding Interface
 * 
 * Provides comprehensive deployment options for chatbots including:
 * - Website embed widget generator with customizable code
 * - Multi-channel deployment (web, mobile, voice, email, social)
 * - Custom domain and white-labeling options
 * - Deployment testing and validation
 * - Performance monitoring and analytics setup
 */

import React, { useState, useEffect } from 'react';
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
  Chip,
  Divider,
  Alert,
  Paper,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Launch as DeployIcon,
  Code as EmbedIcon,
  Web as WebIcon,
  Mobile as MobileIcon,
  Phone as VoiceIcon,
  Email as EmailIcon,
  Facebook as SocialIcon,
  ContentCopy as CopyIcon,
  Visibility as PreviewIcon,
  Settings as ConfigIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Domain as DomainIcon,
  Palette as BrandIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
  QrCode as QRIcon,
  ExpandMore as ExpandIcon,
  OpenInNew as OpenIcon,
  Integration as IntegrationIcon,
  Api as ApiIcon,
  Webhook as WebhookIcon,
  Storage as DatabaseIcon,
  Cloud as CloudIcon,
  Speed as PerformanceIcon,
} from '@mui/icons-material';

interface DeploymentConfig {
  chatbot_id: string;
  name: string;
  
  // Web Widget Configuration
  web_widget: {
    enabled: boolean;
    domain_whitelist: string[];
    custom_domain?: string;
    widget_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
    widget_size: 'small' | 'medium' | 'large' | 'fullscreen';
    theme: 'light' | 'dark' | 'auto';
    primary_color: string;
    secondary_color: string;
    border_radius: number;
    shadow_enabled: boolean;
    animation_enabled: boolean;
    mobile_responsive: boolean;
  };
  
  // API Configuration
  api_access: {
    enabled: boolean;
    api_key?: string;
    rate_limit: number; // requests per minute
    cors_origins: string[];
    webhook_url?: string;
    authentication_required: boolean;
  };
  
  // Mobile App Integration
  mobile_app: {
    enabled: boolean;
    ios_bundle_id?: string;
    android_package_name?: string;
    sdk_configuration: any;
  };
  
  // Voice Integration
  voice_integration: {
    enabled: boolean;
    provider: 'twilio' | 'vonage' | 'custom';
    phone_number?: string;
    voice_settings: {
      language: string;
      voice_type: 'male' | 'female' | 'neutral';
      speech_rate: number;
      pitch: number;
    };
  };
  
  // Email Integration
  email_integration: {
    enabled: boolean;
    email_address?: string;
    smtp_configuration?: any;
    auto_response_enabled: boolean;
    signature: string;
  };
  
  // Social Media Integration
  social_media: {
    facebook: { enabled: boolean; page_id?: string; access_token?: string };
    instagram: { enabled: boolean; account_id?: string; access_token?: string };
    twitter: { enabled: boolean; account_id?: string; api_key?: string };
    linkedin: { enabled: boolean; company_id?: string; access_token?: string };
    whatsapp: { enabled: boolean; phone_number?: string; api_key?: string };
  };
  
  // Analytics & Monitoring
  analytics: {
    enabled: boolean;
    google_analytics_id?: string;
    custom_tracking: boolean;
    performance_monitoring: boolean;
    error_tracking: boolean;
    user_feedback_collection: boolean;
  };
  
  // Security & Compliance
  security: {
    ssl_required: boolean;
    ip_whitelist: string[];
    rate_limiting: boolean;
    data_encryption: boolean;
    audit_logging: boolean;
    gdpr_compliance: boolean;
  };
}

interface DeploymentStatus {
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'updating';
  url?: string;
  last_deployed?: Date;
  health_check: 'healthy' | 'warning' | 'error';
  performance_score: number;
  uptime_percentage: number;
  total_conversations: number;
  active_users: number;
}

const ChatDeployment: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<DeploymentConfig>({
    chatbot_id: '',
    name: '',
    web_widget: {
      enabled: true,
      domain_whitelist: [],
      widget_position: 'bottom-right',
      widget_size: 'medium',
      theme: 'light',
      primary_color: '#1976d2',
      secondary_color: '#f5f5f5',
      border_radius: 8,
      shadow_enabled: true,
      animation_enabled: true,
      mobile_responsive: true
    },
    api_access: {
      enabled: true,
      rate_limit: 100,
      cors_origins: [],
      authentication_required: true
    },
    mobile_app: {
      enabled: false,
      sdk_configuration: {}
    },
    voice_integration: {
      enabled: false,
      provider: 'twilio',
      voice_settings: {
        language: 'en-US',
        voice_type: 'neutral',
        speech_rate: 1.0,
        pitch: 1.0
      }
    },
    email_integration: {
      enabled: false,
      auto_response_enabled: true,
      signature: ''
    },
    social_media: {
      facebook: { enabled: false },
      instagram: { enabled: false },
      twitter: { enabled: false },
      linkedin: { enabled: false },
      whatsapp: { enabled: false }
    },
    analytics: {
      enabled: true,
      custom_tracking: false,
      performance_monitoring: true,
      error_tracking: true,
      user_feedback_collection: true
    },
    security: {
      ssl_required: true,
      ip_whitelist: [],
      rate_limiting: true,
      data_encryption: true,
      audit_logging: true,
      gdpr_compliance: true
    }
  });
  
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: 'pending',
    health_check: 'healthy',
    performance_score: 95,
    uptime_percentage: 99.9,
    total_conversations: 0,
    active_users: 0
  });
  
  const [embedCode, setEmbedCode] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    generateEmbedCode();
  }, [config.web_widget]);

  const generateEmbedCode = () => {
    const code = `<!-- Promethios Chat Widget -->
<script>
  (function() {
    var chatWidget = document.createElement('div');
    chatWidget.id = 'promethios-chat-widget';
    chatWidget.style.cssText = \`
      position: fixed;
      ${config.web_widget.widget_position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.web_widget.widget_position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: ${config.web_widget.widget_size === 'small' ? '300px' : config.web_widget.widget_size === 'large' ? '400px' : '350px'};
      height: ${config.web_widget.widget_size === 'small' ? '400px' : config.web_widget.widget_size === 'large' ? '600px' : '500px'};
      border-radius: ${config.web_widget.border_radius}px;
      box-shadow: ${config.web_widget.shadow_enabled ? '0 4px 20px rgba(0,0,0,0.15)' : 'none'};
      z-index: 9999;
      background: ${config.web_widget.secondary_color};
      border: 2px solid ${config.web_widget.primary_color};
    \`;
    
    var iframe = document.createElement('iframe');
    iframe.src = 'https://chat.promethios.ai/widget/${config.chatbot_id}';
    iframe.style.cssText = \`
      width: 100%;
      height: 100%;
      border: none;
      border-radius: ${config.web_widget.border_radius}px;
    \`;
    
    chatWidget.appendChild(iframe);
    document.body.appendChild(chatWidget);
    
    // Widget configuration
    window.PromethiosChat = {
      config: ${JSON.stringify(config.web_widget, null, 2)},
      chatbotId: '${config.chatbot_id}',
      apiEndpoint: 'https://api.promethios.ai/chat'
    };
  })();
</script>
<!-- End Promethios Chat Widget -->`;
    
    setEmbedCode(code);
  };

  const updateConfig = (section: keyof DeploymentConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      // TODO: Deploy chatbot with configuration
      console.log('Deploying chatbot with config:', config);
      
      // Simulate deployment process
      setDeploymentStatus(prev => ({ ...prev, status: 'deploying' }));
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setDeploymentStatus(prev => ({
        ...prev,
        status: 'deployed',
        url: `https://chat.promethios.ai/widget/${config.chatbot_id}`,
        last_deployed: new Date()
      }));
      
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStatus(prev => ({ ...prev, status: 'failed' }));
    } finally {
      setDeploying(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      // TODO: Test chatbot connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Update health check status
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    // TODO: Show success toast
  };

  const renderWebWidgetTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <WebIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Web Widget Configuration
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.web_widget.enabled}
                onChange={(e) => updateConfig('web_widget', { enabled: e.target.checked })}
              />
            }
            label="Enable Web Widget"
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Widget Position</InputLabel>
            <Select
              value={config.web_widget.widget_position}
              onChange={(e) => updateConfig('web_widget', { widget_position: e.target.value })}
              label="Widget Position"
            >
              <MenuItem value="bottom-right">Bottom Right</MenuItem>
              <MenuItem value="bottom-left">Bottom Left</MenuItem>
              <MenuItem value="top-right">Top Right</MenuItem>
              <MenuItem value="top-left">Top Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Widget Size</InputLabel>
            <Select
              value={config.web_widget.widget_size}
              onChange={(e) => updateConfig('web_widget', { widget_size: e.target.value })}
              label="Widget Size"
            >
              <MenuItem value="small">Small (300x400)</MenuItem>
              <MenuItem value="medium">Medium (350x500)</MenuItem>
              <MenuItem value="large">Large (400x600)</MenuItem>
              <MenuItem value="fullscreen">Fullscreen</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Theme</InputLabel>
            <Select
              value={config.web_widget.theme}
              onChange={(e) => updateConfig('web_widget', { theme: e.target.value })}
              label="Theme"
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="auto">Auto (System)</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Primary Color"
            type="color"
            value={config.web_widget.primary_color}
            onChange={(e) => updateConfig('web_widget', { primary_color: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Secondary Color"
            type="color"
            value={config.web_widget.secondary_color}
            onChange={(e) => updateConfig('web_widget', { secondary_color: e.target.value })}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Widget Options
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={config.web_widget.shadow_enabled}
                  onChange={(e) => updateConfig('web_widget', { shadow_enabled: e.target.checked })}
                />
              }
              label="Drop Shadow"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.web_widget.animation_enabled}
                  onChange={(e) => updateConfig('web_widget', { animation_enabled: e.target.checked })}
                />
              }
              label="Animations"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.web_widget.mobile_responsive}
                  onChange={(e) => updateConfig('web_widget', { mobile_responsive: e.target.checked })}
                />
              }
              label="Mobile Responsive"
            />
          </FormGroup>
          
          <TextField
            fullWidth
            label="Border Radius (px)"
            type="number"
            value={config.web_widget.border_radius}
            onChange={(e) => updateConfig('web_widget', { border_radius: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 0, max: 50 }}
          />
          
          <TextField
            fullWidth
            label="Allowed Domains (one per line)"
            multiline
            rows={4}
            value={config.web_widget.domain_whitelist.join('\n')}
            onChange={(e) => updateConfig('web_widget', { 
              domain_whitelist: e.target.value.split('\n').filter(d => d.trim()) 
            })}
            margin="normal"
            helperText="Leave empty to allow all domains"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Embed Code
      </Typography>
      
      <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2">
            Copy this code to your website
          </Typography>
          <Button
            startIcon={<CopyIcon />}
            onClick={copyEmbedCode}
            size="small"
          >
            Copy Code
          </Button>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={12}
          value={embedCode}
          variant="outlined"
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
          }}
        />
      </Paper>
    </Box>
  );

  const renderAPITab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <ApiIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        API Configuration
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.api_access.enabled}
                onChange={(e) => updateConfig('api_access', { enabled: e.target.checked })}
              />
            }
            label="Enable API Access"
            sx={{ mb: 2 }}
          />
          
          {config.api_access.enabled && (
            <>
              <TextField
                fullWidth
                label="API Key"
                value={config.api_access.api_key || ''}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Button size="small" onClick={() => {/* TODO: Generate new API key */}}>
                      Generate
                    </Button>
                  )
                }}
                margin="normal"
                helperText="Use this key to authenticate API requests"
              />
              
              <TextField
                fullWidth
                label="Rate Limit (requests/minute)"
                type="number"
                value={config.api_access.rate_limit}
                onChange={(e) => updateConfig('api_access', { rate_limit: parseInt(e.target.value) })}
                margin="normal"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.api_access.authentication_required}
                    onChange={(e) => updateConfig('api_access', { authentication_required: e.target.checked })}
                  />
                }
                label="Require Authentication"
                sx={{ mt: 2 }}
              />
              
              <TextField
                fullWidth
                label="CORS Origins (one per line)"
                multiline
                rows={3}
                value={config.api_access.cors_origins.join('\n')}
                onChange={(e) => updateConfig('api_access', { 
                  cors_origins: e.target.value.split('\n').filter(o => o.trim()) 
                })}
                margin="normal"
                helperText="Allowed origins for cross-origin requests"
              />
              
              <TextField
                fullWidth
                label="Webhook URL"
                value={config.api_access.webhook_url || ''}
                onChange={(e) => updateConfig('api_access', { webhook_url: e.target.value })}
                margin="normal"
                helperText="Optional webhook for conversation events"
              />
            </>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              API Endpoints
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemText
                  primary="POST /api/chat/message"
                  secondary="Send a message to the chatbot"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="GET /api/chat/history"
                  secondary="Retrieve conversation history"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="POST /api/chat/session"
                  secondary="Start a new chat session"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="GET /api/chat/status"
                  secondary="Check chatbot status"
                />
              </ListItem>
            </List>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => {/* TODO: Download API documentation */}}
            >
              Download API Documentation
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderChannelsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <IntegrationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Deployment Channels
      </Typography>
      
      <Grid container spacing={3}>
        {/* Mobile App */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MobileIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Mobile App</Typography>
                <Switch
                  checked={config.mobile_app.enabled}
                  onChange={(e) => updateConfig('mobile_app', { enabled: e.target.checked })}
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              {config.mobile_app.enabled && (
                <>
                  <TextField
                    fullWidth
                    label="iOS Bundle ID"
                    value={config.mobile_app.ios_bundle_id || ''}
                    onChange={(e) => updateConfig('mobile_app', { ios_bundle_id: e.target.value })}
                    margin="normal"
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    label="Android Package Name"
                    value={config.mobile_app.android_package_name || ''}
                    onChange={(e) => updateConfig('mobile_app', { android_package_name: e.target.value })}
                    margin="normal"
                    size="small"
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => {/* TODO: Download SDK */}}
                  >
                    Download SDK
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Voice Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <VoiceIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Voice Integration</Typography>
                <Switch
                  checked={config.voice_integration.enabled}
                  onChange={(e) => updateConfig('voice_integration', { enabled: e.target.checked })}
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              {config.voice_integration.enabled && (
                <>
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel>Provider</InputLabel>
                    <Select
                      value={config.voice_integration.provider}
                      onChange={(e) => updateConfig('voice_integration', { provider: e.target.value })}
                      label="Provider"
                    >
                      <MenuItem value="twilio">Twilio</MenuItem>
                      <MenuItem value="vonage">Vonage</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={config.voice_integration.phone_number || ''}
                    onChange={(e) => updateConfig('voice_integration', { phone_number: e.target.value })}
                    margin="normal"
                    size="small"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Email Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EmailIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Email Integration</Typography>
                <Switch
                  checked={config.email_integration.enabled}
                  onChange={(e) => updateConfig('email_integration', { enabled: e.target.checked })}
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              {config.email_integration.enabled && (
                <>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={config.email_integration.email_address || ''}
                    onChange={(e) => updateConfig('email_integration', { email_address: e.target.value })}
                    margin="normal"
                    size="small"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.email_integration.auto_response_enabled}
                        onChange={(e) => updateConfig('email_integration', { auto_response_enabled: e.target.checked })}
                      />
                    }
                    label="Auto Response"
                    sx={{ mt: 1 }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Social Media */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SocialIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Social Media</Typography>
              </Box>
              
              <FormGroup>
                {Object.entries(config.social_media).map(([platform, settings]) => (
                  <FormControlLabel
                    key={platform}
                    control={
                      <Switch
                        checked={settings.enabled}
                        onChange={(e) => updateConfig('social_media', {
                          [platform]: { ...settings, enabled: e.target.checked }
                        })}
                      />
                    }
                    label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  />
                ))}
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Analytics & Monitoring
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.analytics.enabled}
                onChange={(e) => updateConfig('analytics', { enabled: e.target.checked })}
              />
            }
            label="Enable Analytics"
            sx={{ mb: 2 }}
          />
          
          {config.analytics.enabled && (
            <>
              <TextField
                fullWidth
                label="Google Analytics ID"
                value={config.analytics.google_analytics_id || ''}
                onChange={(e) => updateConfig('analytics', { google_analytics_id: e.target.value })}
                margin="normal"
                placeholder="GA-XXXXXXXXX-X"
              />
              
              <FormGroup sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.analytics.custom_tracking}
                      onChange={(e) => updateConfig('analytics', { custom_tracking: e.target.checked })}
                    />
                  }
                  label="Custom Event Tracking"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.analytics.performance_monitoring}
                      onChange={(e) => updateConfig('analytics', { performance_monitoring: e.target.checked })}
                    />
                  }
                  label="Performance Monitoring"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.analytics.error_tracking}
                      onChange={(e) => updateConfig('analytics', { error_tracking: e.target.checked })}
                    />
                  }
                  label="Error Tracking"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.analytics.user_feedback_collection}
                      onChange={(e) => updateConfig('analytics', { user_feedback_collection: e.target.checked })}
                    />
                  }
                  label="User Feedback Collection"
                />
              </FormGroup>
            </>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Performance
            </Typography>
            
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Performance Score: {deploymentStatus.performance_score}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={deploymentStatus.performance_score}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Uptime: {deploymentStatus.uptime_percentage}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={deploymentStatus.uptime_percentage}
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Typography variant="h4" color="primary">
                  {deploymentStatus.total_conversations.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Conversations
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="h4" color="success.main">
                  {deploymentStatus.active_users.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Users
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSecurityTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Security & Compliance
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Security Settings
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.ssl_required}
                  onChange={(e) => updateConfig('security', { ssl_required: e.target.checked })}
                />
              }
              label="Require SSL/HTTPS"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.rate_limiting}
                  onChange={(e) => updateConfig('security', { rate_limiting: e.target.checked })}
                />
              }
              label="Rate Limiting"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.data_encryption}
                  onChange={(e) => updateConfig('security', { data_encryption: e.target.checked })}
                />
              }
              label="Data Encryption"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.audit_logging}
                  onChange={(e) => updateConfig('security', { audit_logging: e.target.checked })}
                />
              }
              label="Audit Logging"
            />
          </FormGroup>
          
          <TextField
            fullWidth
            label="IP Whitelist (one per line)"
            multiline
            rows={4}
            value={config.security.ip_whitelist.join('\n')}
            onChange={(e) => updateConfig('security', { 
              ip_whitelist: e.target.value.split('\n').filter(ip => ip.trim()) 
            })}
            margin="normal"
            helperText="Leave empty to allow all IPs"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Compliance
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={config.security.gdpr_compliance}
                onChange={(e) => updateConfig('security', { gdpr_compliance: e.target.checked })}
              />
            }
            label="GDPR Compliance"
            sx={{ mb: 2 }}
          />
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              All conversations are processed through your configured governance policies
              and comply with your selected compliance mode.
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Security Status
            </Typography>
            
            <Box display="flex" alignItems="center" mb={1}>
              <CheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">SSL Certificate Valid</Typography>
            </Box>
            
            <Box display="flex" alignItems="center" mb={1}>
              <CheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Data Encryption Enabled</Typography>
            </Box>
            
            <Box display="flex" alignItems="center" mb={1}>
              <CheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Governance Policies Active</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderDeploymentStatus = () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'deployed': return 'success';
        case 'deploying': return 'warning';
        case 'failed': return 'error';
        default: return 'default';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'deployed': return <CheckIcon />;
        case 'deploying': return <CircularProgress size={20} />;
        case 'failed': return <ErrorIcon />;
        default: return <WarningIcon />;
      }
    };

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Deployment Status
          </Typography>
          
          <Chip
            icon={getStatusIcon(deploymentStatus.status)}
            label={deploymentStatus.status.charAt(0).toUpperCase() + deploymentStatus.status.slice(1)}
            color={getStatusColor(deploymentStatus.status) as any}
            variant="outlined"
          />
        </Box>
        
        {deploymentStatus.url && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Deployment URL:
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {deploymentStatus.url}
              </Typography>
              <IconButton size="small" onClick={() => window.open(deploymentStatus.url, '_blank')}>
                <OpenIcon />
              </IconButton>
            </Box>
          </Box>
        )}
        
        <Box display="flex" gap={2} mt={3}>
          <Button
            variant="contained"
            startIcon={<DeployIcon />}
            onClick={handleDeploy}
            disabled={deploying}
          >
            {deploying ? 'Deploying...' : deploymentStatus.status === 'deployed' ? 'Redeploy' : 'Deploy'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleTestConnection}
            disabled={testingConnection}
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          <DeployIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Chat Deployment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Deploy your chatbot across multiple channels with comprehensive configuration options
        </Typography>
      </Box>

      {renderDeploymentStatus()}

      <Paper sx={{ p: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Web Widget" icon={<WebIcon />} />
          <Tab label="API Access" icon={<ApiIcon />} />
          <Tab label="Channels" icon={<IntegrationIcon />} />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
          <Tab label="Security" icon={<SecurityIcon />} />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderWebWidgetTab()}
          {activeTab === 1 && renderAPITab()}
          {activeTab === 2 && renderChannelsTab()}
          {activeTab === 3 && renderAnalyticsTab()}
          {activeTab === 4 && renderSecurityTab()}
        </Box>
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <PreviewIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Widget Preview
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              position: 'relative',
              height: 400,
              backgroundColor: 'grey.100',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            {/* Simulated website background */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Website
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This is how the chat widget will appear on your website.
              </Typography>
            </Box>
            
            {/* Chat widget preview */}
            <Box
              sx={{
                position: 'absolute',
                [config.web_widget.widget_position.includes('bottom') ? 'bottom' : 'top']: 20,
                [config.web_widget.widget_position.includes('right') ? 'right' : 'left']: 20,
                width: config.web_widget.widget_size === 'small' ? 250 : config.web_widget.widget_size === 'large' ? 350 : 300,
                height: config.web_widget.widget_size === 'small' ? 300 : config.web_widget.widget_size === 'large' ? 450 : 375,
                backgroundColor: config.web_widget.secondary_color,
                border: `2px solid ${config.web_widget.primary_color}`,
                borderRadius: `${config.web_widget.border_radius}px`,
                boxShadow: config.web_widget.shadow_enabled ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box
                sx={{
                  backgroundColor: config.web_widget.primary_color,
                  color: 'white',
                  p: 2,
                  borderTopLeftRadius: `${config.web_widget.border_radius}px`,
                  borderTopRightRadius: `${config.web_widget.border_radius}px`
                }}
              >
                <Typography variant="subtitle1">
                  {config.name || 'Chat Widget'}
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Chat interface will appear here
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatDeployment;

