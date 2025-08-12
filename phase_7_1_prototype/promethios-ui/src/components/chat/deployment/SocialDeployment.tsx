/**
 * Social Media Deployment Component
 * 
 * Dedicated page for social media platform deployment configuration
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
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Launch as LaunchIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface SocialPlatformConfig {
  enabled: boolean;
  app_id?: string;
  app_secret?: string;
  access_token?: string;
  webhook_url?: string;
  auto_response: boolean;
  business_hours_only: boolean;
  response_delay: number; // seconds
}

interface SocialConfig {
  facebook: SocialPlatformConfig;
  instagram: SocialPlatformConfig;
  twitter: SocialPlatformConfig;
  linkedin: SocialPlatformConfig;
  whatsapp: SocialPlatformConfig;
  telegram: SocialPlatformConfig;
}

const SocialDeployment: React.FC = () => {
  const [config, setConfig] = useState<SocialConfig>({
    facebook: {
      enabled: false,
      auto_response: true,
      business_hours_only: true,
      response_delay: 5
    },
    instagram: {
      enabled: false,
      auto_response: true,
      business_hours_only: true,
      response_delay: 5
    },
    twitter: {
      enabled: false,
      auto_response: true,
      business_hours_only: false,
      response_delay: 2
    },
    linkedin: {
      enabled: false,
      auto_response: true,
      business_hours_only: true,
      response_delay: 10
    },
    whatsapp: {
      enabled: false,
      auto_response: true,
      business_hours_only: true,
      response_delay: 3
    },
    telegram: {
      enabled: false,
      auto_response: true,
      business_hours_only: false,
      response_delay: 1
    }
  });

  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);

  const handleTestPlatform = async (platform: string) => {
    setTestingPlatform(platform);
    try {
      // TODO: Test platform configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`${platform} test failed:`, error);
    } finally {
      setTestingPlatform(null);
    }
  };

  const updatePlatformConfig = (platform: keyof SocialConfig, updates: Partial<SocialPlatformConfig>) => {
    setConfig(prev => ({
      ...prev,
      [platform]: { ...prev[platform], ...updates }
    }));
  };

  const platforms = [
    {
      key: 'facebook' as keyof SocialConfig,
      name: 'Facebook',
      icon: <FacebookIcon sx={{ color: '#1877F2' }} />,
      description: 'Facebook Messenger integration',
      setupUrl: 'https://developers.facebook.com/apps/',
      features: ['Direct Messages', 'Page Messages', 'Auto-responses']
    },
    {
      key: 'instagram' as keyof SocialConfig,
      name: 'Instagram',
      icon: <InstagramIcon sx={{ color: '#E4405F' }} />,
      description: 'Instagram Direct Messages',
      setupUrl: 'https://developers.facebook.com/apps/',
      features: ['Direct Messages', 'Story Replies', 'Auto-responses']
    },
    {
      key: 'twitter' as keyof SocialConfig,
      name: 'Twitter',
      icon: <TwitterIcon sx={{ color: '#1DA1F2' }} />,
      description: 'Twitter Direct Messages and mentions',
      setupUrl: 'https://developer.twitter.com/apps/',
      features: ['Direct Messages', 'Mention Replies', 'Auto-responses']
    },
    {
      key: 'linkedin' as keyof SocialConfig,
      name: 'LinkedIn',
      icon: <LinkedInIcon sx={{ color: '#0A66C2' }} />,
      description: 'LinkedIn messaging integration',
      setupUrl: 'https://www.linkedin.com/developers/apps/',
      features: ['Direct Messages', 'Company Page Messages', 'Auto-responses']
    },
    {
      key: 'whatsapp' as keyof SocialConfig,
      name: 'WhatsApp',
      icon: <WhatsAppIcon sx={{ color: '#25D366' }} />,
      description: 'WhatsApp Business API',
      setupUrl: 'https://business.whatsapp.com/',
      features: ['Direct Messages', 'Group Messages', 'Media Support']
    },
    {
      key: 'telegram' as keyof SocialConfig,
      name: 'Telegram',
      icon: <TelegramIcon sx={{ color: '#0088CC' }} />,
      description: 'Telegram Bot integration',
      setupUrl: 'https://core.telegram.org/bots/',
      features: ['Direct Messages', 'Group Messages', 'Inline Queries']
    }
  ];

  const renderPlatformCard = (platform: typeof platforms[0]) => {
    const platformConfig = config[platform.key];
    
    return (
      <Grid item xs={12} md={6} key={platform.key}>
        <Card sx={{ 
          height: '100%',
          bgcolor: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderColor: platformConfig.enabled ? '#1976d2' : 'rgba(255, 255, 255, 0.1)'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                {platform.icon}
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {platform.name}
                </Typography>
              </Box>
              
              <Switch
                checked={platformConfig.enabled}
                onChange={(e) => updatePlatformConfig(platform.key, { enabled: e.target.checked })}
              />
            </Box>
            
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
              {platform.description}
            </Typography>
            
            <Box mb={2}>
              {platform.features.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  size="small"
                  sx={{ 
                    mr: 1, 
                    mb: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                />
              ))}
            </Box>
            
            {platformConfig.enabled && (
              <Box>
                <TextField
                  fullWidth
                  label="App ID"
                  value={platformConfig.app_id || ''}
                  onChange={(e) => updatePlatformConfig(platform.key, { app_id: e.target.value })}
                  margin="dense"
                  size="small"
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
                  label="App Secret"
                  type="password"
                  value={platformConfig.app_secret || ''}
                  onChange={(e) => updatePlatformConfig(platform.key, { app_secret: e.target.value })}
                  margin="dense"
                  size="small"
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
                  label="Access Token"
                  type="password"
                  value={platformConfig.access_token || ''}
                  onChange={(e) => updatePlatformConfig(platform.key, { access_token: e.target.value })}
                  margin="dense"
                  size="small"
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
                      checked={platformConfig.auto_response}
                      onChange={(e) => updatePlatformConfig(platform.key, { auto_response: e.target.checked })}
                      size="small"
                    />
                  }
                  label={<span style={{ color: 'white', fontSize: '0.875rem' }}>Auto Response</span>}
                  sx={{ mt: 1 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={platformConfig.business_hours_only}
                      onChange={(e) => updatePlatformConfig(platform.key, { business_hours_only: e.target.checked })}
                      size="small"
                    />
                  }
                  label={<span style={{ color: 'white', fontSize: '0.875rem' }}>Business Hours Only</span>}
                  sx={{ mt: 1 }}
                />
                
                <TextField
                  fullWidth
                  label="Response Delay (seconds)"
                  type="number"
                  value={platformConfig.response_delay}
                  onChange={(e) => updatePlatformConfig(platform.key, { response_delay: parseInt(e.target.value) })}
                  margin="dense"
                  size="small"
                  InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '& input': { color: 'white' }
                    }
                  }}
                />
                
                <Box display="flex" gap={1} mt={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CheckIcon />}
                    onClick={() => handleTestPlatform(platform.key)}
                    disabled={testingPlatform === platform.key}
                    sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    {testingPlatform === platform.key ? 'Testing...' : 'Test'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => window.open(platform.setupUrl, '_blank')}
                    sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    Setup
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <FacebookIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          Social Media Deployment
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Connect your chatbot to social media platforms for broader reach
        </Typography>
      </Box>

      {/* Platform Configuration Cards */}
      <Grid container spacing={3} mb={4}>
        {platforms.map(platform => renderPlatformCard(platform))}
      </Grid>
      
      {/* Global Settings */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Global Social Media Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Default Response Message"
              multiline
              rows={3}
              defaultValue="Thank you for your message! I'm here to help you. How can I assist you today?"
              margin="normal"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& textarea': { color: 'white' }
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Business Hours (e.g., 9:00-17:00)"
              defaultValue="9:00-17:00"
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
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Out of Hours Message"
              multiline
              rows={3}
              defaultValue="Thank you for your message! We're currently outside business hours but will respond as soon as possible."
              margin="normal"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& textarea': { color: 'white' }
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Timezone"
              defaultValue="UTC"
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
          </Grid>
        </Grid>
      </Paper>
      
      {/* Setup Instructions */}
      <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
          Setup Instructions
        </Typography>
        
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2, 
            bgcolor: 'rgba(33, 150, 243, 0.1)', 
            border: '1px solid rgba(33, 150, 243, 0.3)',
            '& .MuiAlert-message': { color: 'white' }
          }}
        >
          Each social media platform requires creating a developer app and obtaining API credentials. Click the "Setup" button for each platform to access their developer portals.
        </Alert>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckIcon sx={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText 
              primary={<span style={{ color: 'white' }}>Create developer accounts for each platform</span>}
              secondary={<span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Register as a developer on each social media platform</span>}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CheckIcon sx={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText 
              primary={<span style={{ color: 'white' }}>Create apps and obtain credentials</span>}
              secondary={<span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Get App ID, App Secret, and Access Tokens for each platform</span>}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CheckIcon sx={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText 
              primary={<span style={{ color: 'white' }}>Configure webhooks</span>}
              secondary={<span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Set up webhook URLs to receive messages from each platform</span>}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CheckIcon sx={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText 
              primary={<span style={{ color: 'white' }}>Test integrations</span>}
              secondary={<span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Use the test buttons to verify each platform connection</span>}
            />
          </ListItem>
        </List>
      </Paper>
      
      <Box mt={4}>
        <Button
          variant="contained"
          size="large"
          startIcon={<LaunchIcon />}
          onClick={() => window.open('https://docs.promethios.ai/social-media-integration', '_blank')}
        >
          View Social Media Integration Documentation
        </Button>
      </Box>
    </Container>
  );
};

export default SocialDeployment;

