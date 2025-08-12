/**
 * Email Deployment Component
 * 
 * Dedicated page for email integration deployment configuration
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Email as EmailIcon,
  Settings as SettingsIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';

interface EmailConfig {
  enabled: boolean;
  email_address: string;
  display_name: string;
  smtp_configuration: {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'none' | 'tls' | 'ssl';
  };
  auto_response: {
    enabled: boolean;
    response_time: number; // minutes
    business_hours_only: boolean;
    out_of_office_message: string;
  };
  signature: string;
  forwarding: {
    enabled: boolean;
    forward_to: string[];
    conditions: string[];
  };
}

const EmailDeployment: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig>({
    enabled: false,
    email_address: '',
    display_name: 'Promethios Assistant',
    smtp_configuration: {
      host: '',
      port: 587,
      username: '',
      password: '',
      encryption: 'tls'
    },
    auto_response: {
      enabled: true,
      response_time: 5,
      business_hours_only: true,
      out_of_office_message: 'Thank you for your email. I will respond shortly.'
    },
    signature: 'Best regards,\nPromethios Assistant\n\nPowered by Promethios AI',
    forwarding: {
      enabled: false,
      forward_to: [],
      conditions: []
    }
  });

  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      // TODO: Test email configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Email test failed:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const updateConfig = (section: keyof EmailConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <EmailIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          Email Integration Deployment
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Configure email support capabilities for your chatbot
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Basic Configuration
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => updateConfig('enabled', e.target.checked)}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Email Integration</span>}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Email Address"
              value={config.email_address}
              onChange={(e) => updateConfig('email_address', e.target.value)}
              margin="normal"
              placeholder="support@yourcompany.com"
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
              label="Display Name"
              value={config.display_name}
              onChange={(e) => updateConfig('display_name', e.target.value)}
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
              label="Email Signature"
              multiline
              rows={4}
              value={config.signature}
              onChange={(e) => updateConfig('signature', e.target.value)}
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
          </Paper>
          
          {/* Auto Response Settings */}
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SendIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Auto Response Settings
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.auto_response.enabled}
                  onChange={(e) => updateConfig('auto_response', { enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Auto Response</span>}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Response Time (minutes)"
              type="number"
              value={config.auto_response.response_time}
              onChange={(e) => updateConfig('auto_response', { response_time: parseInt(e.target.value) })}
              margin="normal"
              disabled={!config.auto_response.enabled}
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
                  checked={config.auto_response.business_hours_only}
                  onChange={(e) => updateConfig('auto_response', { business_hours_only: e.target.checked })}
                  disabled={!config.auto_response.enabled}
                />
              }
              label={<span style={{ color: 'white' }}>Business Hours Only</span>}
              sx={{ mt: 2 }}
            />
            
            <TextField
              fullWidth
              label="Out of Office Message"
              multiline
              rows={3}
              value={config.auto_response.out_of_office_message}
              onChange={(e) => updateConfig('auto_response', { out_of_office_message: e.target.value })}
              margin="normal"
              disabled={!config.auto_response.enabled}
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& textarea': { color: 'white' }
                }
              }}
            />
          </Paper>
        </Grid>
        
        {/* SMTP Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              SMTP Configuration
            </Typography>
            
            <TextField
              fullWidth
              label="SMTP Host"
              value={config.smtp_configuration.host}
              onChange={(e) => updateConfig('smtp_configuration', { host: e.target.value })}
              margin="normal"
              placeholder="smtp.gmail.com"
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
              label="SMTP Port"
              type="number"
              value={config.smtp_configuration.port}
              onChange={(e) => updateConfig('smtp_configuration', { port: parseInt(e.target.value) })}
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
              label="Username"
              value={config.smtp_configuration.username}
              onChange={(e) => updateConfig('smtp_configuration', { username: e.target.value })}
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
              label="Password"
              type="password"
              value={config.smtp_configuration.password}
              onChange={(e) => updateConfig('smtp_configuration', { password: e.target.value })}
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
            
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Encryption</InputLabel>
              <Select
                value={config.smtp_configuration.encryption}
                onChange={(e) => updateConfig('smtp_configuration', { encryption: e.target.value })}
                label="Encryption"
                sx={{ 
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="tls">TLS</MenuItem>
                <MenuItem value="ssl">SSL</MenuItem>
              </Select>
            </FormControl>
            
            <Box mt={3}>
              <Button
                variant="outlined"
                startIcon={<CheckIcon />}
                onClick={handleTestConnection}
                disabled={testingConnection}
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </Box>
            
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2, 
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                border: '1px solid rgba(33, 150, 243, 0.3)',
                '& .MuiAlert-message': { color: 'white' }
              }}
            >
              For Gmail, use an App Password instead of your regular password.
            </Alert>
          </Paper>
          
          {/* Email Forwarding */}
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              <InboxIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Email Forwarding
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.forwarding.enabled}
                  onChange={(e) => updateConfig('forwarding', { enabled: e.target.checked })}
                />
              }
              label={<span style={{ color: 'white' }}>Enable Forwarding</span>}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Forward To (comma separated)"
              value={config.forwarding.forward_to.join(', ')}
              onChange={(e) => updateConfig('forwarding', { 
                forward_to: e.target.value.split(',').map(email => email.trim()).filter(email => email) 
              })}
              margin="normal"
              disabled={!config.forwarding.enabled}
              placeholder="admin@company.com, support@company.com"
              InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '& input': { color: 'white' }
                }
              }}
            />
            
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 2, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                border: '1px solid rgba(255, 152, 0, 0.3)',
                '& .MuiAlert-message': { color: 'white' }
              }}
            >
              Forwarding will send copies of all emails to the specified addresses.
            </Alert>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Common Email Providers */}
      <Box mt={4}>
        <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            Common Email Provider Settings
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white' }}>Gmail</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Host: smtp.gmail.com<br/>
                    Port: 587<br/>
                    Encryption: TLS
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white' }}>Outlook</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Host: smtp-mail.outlook.com<br/>
                    Port: 587<br/>
                    Encryption: TLS
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white' }}>Yahoo</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Host: smtp.mail.yahoo.com<br/>
                    Port: 587<br/>
                    Encryption: TLS
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      
      <Box mt={4}>
        <Button
          variant="contained"
          size="large"
          startIcon={<LaunchIcon />}
          onClick={() => window.open('https://docs.promethios.ai/email-integration', '_blank')}
        >
          View Email Integration Documentation
        </Button>
      </Box>
    </Container>
  );
};

export default EmailDeployment;

