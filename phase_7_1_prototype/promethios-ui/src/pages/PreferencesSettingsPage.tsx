import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';
import { governanceDashboardBackendService } from '../services/governanceDashboardBackendService';
import { darkThemeStyles } from '../styles/darkThemeStyles';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Alert,
  AlertTitle,
  Slider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import {
  Palette,
  Notifications,
  Language,
  Accessibility,
  Speed,
  Security,
  Visibility,
  VolumeUp,
  Brightness4,
  Brightness7,
  Navigation,
  Dashboard,
  Save,
  RestoreFromTrash,
  Add,
  Edit,
  Delete,
  NotificationsActive,
  NotificationsOff,
  Email,
  Sms,
  Computer,
  PhoneAndroid
} from '@mui/icons-material';
import { darkThemeStyles } from '../styles/darkThemeStyles';

interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'standard' | 'comfortable';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  navigationCollapsed: boolean;
  sidebarWidth: number;
  showTooltips: boolean;
  autoSave: boolean;
  confirmActions: boolean;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  categories: {
    governance: boolean;
    trustMetrics: boolean;
    agents: boolean;
    security: boolean;
    system: boolean;
    reports: boolean;
  };
}

interface LanguagePreferences {
  language: string;
  region: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
  currency: string;
  numberFormat: string;
}

interface AccessibilityPreferences {
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  skipLinks: boolean;
  altTextDescriptions: boolean;
  colorBlindSupport: boolean;
  textToSpeech: boolean;
  voiceCommands: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`preferences-tabpanel-${index}`}
      aria-labelledby={`preferences-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PreferencesSettingsPage: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notificationTestResult, setNotificationTestResult] = useState<string | null>(null);

  // Mock preferences data
  const [uiPreferences, setUIPreferences] = useState<UIPreferences>({
    theme: 'dark',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
    density: 'standard',
    animations: true,
    reducedMotion: false,
    highContrast: false,
    navigationCollapsed: false,
    sidebarWidth: 280,
    showTooltips: true,
    autoSave: true,
    confirmActions: true
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    notificationFrequency: 'immediate',
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00'
    },
    categories: {
      governance: true,
      trustMetrics: true,
      agents: true,
      security: true,
      system: false,
      reports: true
    }
  });

  const [languagePreferences, setLanguagePreferences] = useState<LanguagePreferences>({
    language: 'en-US',
    region: 'US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    numberFormat: 'en-US'
  });

  const [accessibilityPreferences, setAccessibilityPreferences] = useState<AccessibilityPreferences>({
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true,
    skipLinks: true,
    altTextDescriptions: true,
    colorBlindSupport: false,
    textToSpeech: false,
    voiceCommands: false
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Real data loading functions with authentication
  const loadUserPreferences = useCallback(async () => {
    if (!currentUser) {
      setAuthError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);

      // Load user preferences from backend
      const [uiPrefs, notifPrefs, accessPrefs] = await Promise.all([
        authApiService.getUserUIPreferences(currentUser),
        authApiService.getUserNotificationPreferences(currentUser),
        authApiService.getUserAccessibilityPreferences(currentUser)
      ]);

      if (uiPrefs) {
        setUIPreferences(prev => ({ ...prev, ...uiPrefs }));
      }
      
      if (notifPrefs) {
        setNotificationPreferences(prev => ({ ...prev, ...notifPrefs }));
      }

      if (accessPrefs) {
        setAccessibilityPreferences(prev => ({ ...prev, ...accessPrefs }));
      }

    } catch (error) {
      console.error('Failed to load user preferences:', error);
      setAuthError('Failed to load user preferences');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load data on component mount and user change
  useEffect(() => {
    loadUserPreferences();
  }, [loadUserPreferences]);

  // Enhanced save function with notifications integration
  const handleSavePreferences = async () => {
    if (!currentUser) {
      setAuthError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);

      // Save all preferences with governance integration
      await Promise.all([
        authApiService.updateUserUIPreferences(currentUser, uiPreferences),
        authApiService.updateUserNotificationPreferences(currentUser, notificationPreferences),
        authApiService.updateUserAccessibilityPreferences(currentUser, accessibilityPreferences)
      ]);

      // Update governance notification settings if needed
      await governanceDashboardBackendService.updateUserNotificationSettings(currentUser, notificationPreferences);

      setSaveSuccess(true);
      
      // Auto-hide success message
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to save preferences:', error);
      setAuthError('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  // Test notification function
  const handleTestNotification = async (type: string) => {
    if (!currentUser) {
      setNotificationTestResult('Authentication required');
      return;
    }

    try {
      setNotificationTestResult('Sending test notification...');
      
      // Send test notification through governance system
      await governanceDashboardBackendService.sendTestNotification(currentUser, {
        type,
        preferences: notificationPreferences
      });

      setNotificationTestResult(`Test ${type} notification sent successfully!`);
      
      // Auto-hide result message
      setTimeout(() => setNotificationTestResult(null), 5000);

    } catch (error) {
      console.error('Failed to send test notification:', error);
      setNotificationTestResult('Failed to send test notification');
      setTimeout(() => setNotificationTestResult(null), 5000);
    }
  };

  // Authentication validation
  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <AlertTitle>Authentication Required</AlertTitle>
          Please log in to access preferences settings. This page requires user authentication to manage personal preferences.
        </Alert>
      </Box>
    );
  }

  if (loading && !uiPreferences.theme) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={darkThemeStyles.typography.primary}>
          Preferences
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  const handleResetToDefaults = () => {
    setUIPreferences({
      theme: 'dark',
      primaryColor: '#3b82f6',
      fontSize: 'medium',
      density: 'standard',
      animations: true,
      reducedMotion: false,
      highContrast: false,
      navigationCollapsed: false,
      sidebarWidth: 280,
      showTooltips: true,
      autoSave: true,
      confirmActions: true
    });
    setShowResetDialog(false);
  };

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' }
  ];

  return (
    <Box sx={darkThemeStyles.pageContainer}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={darkThemeStyles.typography.primary}>
          Preferences
        </Typography>
        <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
          Customize your experience with personalized settings for UI, notifications, and accessibility
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Card sx={darkThemeStyles.card}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RestoreFromTrash />}
                onClick={() => setShowResetDialog(true)}
                sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSavePreferences}
                disabled={loading}
                sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
              >
                {loading ? 'Saving...' : 'Save All Changes'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={darkThemeStyles.card}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
              '& .MuiTab-root': { 
                color: '#a0aec0',
                '&.Mui-selected': { color: '#3b82f6' }
              }
            }}
          >
            <Tab icon={<Palette />} label="UI & Appearance" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Language />} label="Language & Region" />
            <Tab icon={<Accessibility />} label="Accessibility" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* UI & Appearance */}
          <Grid container spacing={3}>
            {/* Theme Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Theme & Colors
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Theme Mode
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={uiPreferences.theme}
                      onChange={(e) => setUIPreferences(prev => ({ ...prev, theme: e.target.value as any }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="light">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Brightness7 />
                          Light
                        </Box>
                      </MenuItem>
                      <MenuItem value="dark">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Brightness4 />
                          Dark
                        </Box>
                      </MenuItem>
                      <MenuItem value="auto">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Speed />
                          Auto (System)
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Primary Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {colorOptions.map((color) => (
                      <Box
                        key={color.value}
                        onClick={() => setUIPreferences(prev => ({ ...prev, primaryColor: color.value }))}
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: color.value,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: uiPreferences.primaryColor === color.value ? '3px solid white' : '1px solid #4a5568',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {uiPreferences.primaryColor === color.value && (
                          <Typography variant="caption" sx={darkThemeStyles.typography.primary}>
                            ✓
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Layout Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Layout & Navigation
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Font Size
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={uiPreferences.fontSize}
                      onChange={(e) => setUIPreferences(prev => ({ ...prev, fontSize: e.target.value as any }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Interface Density
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={uiPreferences.density}
                      onChange={(e) => setUIPreferences(prev => ({ ...prev, density: e.target.value as any }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="compact">Compact</MenuItem>
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="comfortable">Comfortable</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Sidebar Width
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={uiPreferences.sidebarWidth}
                      onChange={(e, value) => setUIPreferences(prev => ({ ...prev, sidebarWidth: value as number }))}
                      min={200}
                      max={400}
                      step={20}
                      marks={[
                        { value: 200, label: '200px' },
                        { value: 280, label: '280px' },
                        { value: 360, label: '360px' },
                        { value: 400, label: '400px' }
                      ]}
                      sx={{
                        color: '#3b82f6',
                        '& .MuiSlider-mark': { color: '#4a5568' },
                        '& .MuiSlider-markLabel': { color: '#a0aec0' }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Behavior Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Behavior & Interactions
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Enable animations</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Smooth transitions and visual effects</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={uiPreferences.animations}
                          onChange={(e) => setUIPreferences(prev => ({ ...prev, animations: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Show tooltips</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Helpful hints on hover</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={uiPreferences.showTooltips}
                          onChange={(e) => setUIPreferences(prev => ({ ...prev, showTooltips: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Auto-save changes</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Automatically save form changes</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={uiPreferences.autoSave}
                          onChange={(e) => setUIPreferences(prev => ({ ...prev, autoSave: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Confirm destructive actions</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Show confirmation dialogs for delete operations</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={uiPreferences.confirmActions}
                          onChange={(e) => setUIPreferences(prev => ({ ...prev, confirmActions: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Notifications */}
          <Grid container spacing={3}>
            {/* Notification Channels */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Notification Channels
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email />
                            <Typography variant="body1" sx={darkThemeStyles.typography.primary}>Email notifications</Typography>
                          </Box>
                        }
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Receive notifications via email</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationPreferences.emailNotifications}
                          onChange={(e) => setNotificationPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Computer />
                            <Typography variant="body1" sx={darkThemeStyles.typography.primary}>Desktop notifications</Typography>
                          </Box>
                        }
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Browser push notifications</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationPreferences.desktopNotifications}
                          onChange={(e) => setNotificationPreferences(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Sms />
                            <Typography variant="body1" sx={darkThemeStyles.typography.primary}>SMS notifications</Typography>
                          </Box>
                        }
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Text message alerts</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationPreferences.smsNotifications}
                          onChange={(e) => setNotificationPreferences(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Notification Frequency
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={notificationPreferences.notificationFrequency}
                      onChange={(e) => setNotificationPreferences(prev => ({ ...prev, notificationFrequency: e.target.value as any }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="immediate">Immediate</MenuItem>
                      <MenuItem value="hourly">Hourly digest</MenuItem>
                      <MenuItem value="daily">Daily digest</MenuItem>
                      <MenuItem value="weekly">Weekly digest</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            {/* Quiet Hours */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Quiet Hours
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                      Enable quiet hours
                    </Typography>
                    <Switch
                      checked={notificationPreferences.quietHours.enabled}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, enabled: e.target.checked }
                      }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                      }}
                    />
                  </Box>
                  {notificationPreferences.quietHours.enabled && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="time"
                          label="Start Time"
                          value={notificationPreferences.quietHours.startTime}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, startTime: e.target.value }
                          }))}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#4a5568' },
                              '&:hover fieldset': { borderColor: '#3b82f6' },
                              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                            },
                            '& .MuiInputLabel-root': { color: '#a0aec0' },
                            '& .MuiInputBase-input': { color: 'white' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="time"
                          label="End Time"
                          value={notificationPreferences.quietHours.endTime}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, endTime: e.target.value }
                          }))}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#4a5568' },
                              '&:hover fieldset': { borderColor: '#3b82f6' },
                              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                            },
                            '& .MuiInputLabel-root': { color: '#a0aec0' },
                            '& .MuiInputBase-input': { color: 'white' }
                          }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Notification Categories */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Notification Categories
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    {Object.entries(notificationPreferences.categories).map(([category, enabled]) => (
                      <React.Fragment key={category}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>{category.replace(/([A-Z])/g, ' $1')}</Typography>}
                            secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Notifications related to {category.toLowerCase()}</Typography>}
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={enabled}
                              onChange={(e) => setNotificationPreferences(prev => ({
                                ...prev,
                                categories: { ...prev.categories, [category]: e.target.checked }
                              }))}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                              }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        {Object.keys(notificationPreferences.categories).indexOf(category) < Object.keys(notificationPreferences.categories).length - 1 && (
                          <Divider sx={{ borderColor: '#4a5568' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Language & Region */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Language
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={languagePreferences.language}
                      onChange={(e) => setLanguagePreferences(prev => ({ ...prev, language: e.target.value }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="en-US">English (US)</MenuItem>
                      <MenuItem value="en-GB">English (UK)</MenuItem>
                      <MenuItem value="es-ES">Spanish</MenuItem>
                      <MenuItem value="fr-FR">French</MenuItem>
                      <MenuItem value="de-DE">German</MenuItem>
                      <MenuItem value="ja-JP">Japanese</MenuItem>
                      <MenuItem value="zh-CN">Chinese (Simplified)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Timezone
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={languagePreferences.timezone}
                      onChange={(e) => setLanguagePreferences(prev => ({ ...prev, timezone: e.target.value }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                      <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                      <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                      <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="Europe/London">London (GMT)</MenuItem>
                      <MenuItem value="Europe/Paris">Paris (CET)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Date Format
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={languagePreferences.dateFormat}
                      onChange={(e) => setLanguagePreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</MenuItem>
                      <MenuItem value="DD MMM YYYY">DD MMM YYYY (31 Dec 2025)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Time Format
                  </Typography>
                  <FormControl fullWidth>
                    <RadioGroup
                      value={languagePreferences.timeFormat}
                      onChange={(e) => setLanguagePreferences(prev => ({ ...prev, timeFormat: e.target.value as any }))}
                    >
                      <FormControlLabel
                        value="12h"
                        control={<Radio sx={{ color: '#a0aec0', '&.Mui-checked': { color: '#3b82f6' } }} />}
                        label={<Typography sx={darkThemeStyles.typography.primary}>12-hour (2:30 PM)</Typography>}
                      />
                      <FormControlLabel
                        value="24h"
                        control={<Radio sx={{ color: '#a0aec0', '&.Mui-checked': { color: '#3b82f6' } }} />}
                        label={<Typography sx={darkThemeStyles.typography.primary}>24-hour (14:30)</Typography>}
                      />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
                    Currency
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={languagePreferences.currency}
                      onChange={(e) => setLanguagePreferences(prev => ({ ...prev, currency: e.target.value }))}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                      }}
                    >
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="JPY">JPY (¥)</MenuItem>
                      <MenuItem value="CAD">CAD (C$)</MenuItem>
                      <MenuItem value="AUD">AUD (A$)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Accessibility */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white', mb: 3 }}>
                <AlertTitle>Accessibility Features</AlertTitle>
                These settings help make Promethios more accessible for users with disabilities. Changes take effect immediately.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Visual Accessibility
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>High contrast mode</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Increase contrast for better visibility</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={uiPreferences.highContrast}
                          onChange={(e) => setUIPreferences(prev => ({ ...prev, highContrast: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Reduced motion</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Minimize animations and transitions</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={uiPreferences.reducedMotion}
                          onChange={(e) => setUIPreferences(prev => ({ ...prev, reducedMotion: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Color blind support</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Adjust colors for color blindness</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={accessibilityPreferences.colorBlindSupport}
                          onChange={(e) => setAccessibilityPreferences(prev => ({ ...prev, colorBlindSupport: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Navigation & Interaction
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Keyboard navigation</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Navigate using keyboard only</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={accessibilityPreferences.keyboardNavigation}
                          onChange={(e) => setAccessibilityPreferences(prev => ({ ...prev, keyboardNavigation: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Enhanced focus indicators</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Clearer focus outlines for keyboard navigation</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={accessibilityPreferences.focusIndicators}
                          onChange={(e) => setAccessibilityPreferences(prev => ({ ...prev, focusIndicators: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Skip navigation links</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Quick links to main content areas</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={accessibilityPreferences.skipLinks}
                          onChange={(e) => setAccessibilityPreferences(prev => ({ ...prev, skipLinks: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={darkThemeStyles.typography.primary}>
                Screen Reader & Audio
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card sx={darkThemeStyles.card}>
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Screen reader optimization</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Optimize interface for screen readers</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={accessibilityPreferences.screenReader}
                          onChange={(e) => setAccessibilityPreferences(prev => ({ ...prev, screenReader: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Enhanced alt text</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Detailed descriptions for images and charts</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={accessibilityPreferences.altTextDescriptions}
                          onChange={(e) => setAccessibilityPreferences(prev => ({ ...prev, altTextDescriptions: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider sx={{ borderColor: '#4a5568' }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body1" sx={darkThemeStyles.typography.primary}>Text-to-speech</Typography>}
                        secondary={<Typography variant="body2" sx={darkThemeStyles.typography.primary}>Read content aloud</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={accessibilityPreferences.textToSpeech}
                          onChange={(e) => setAccessibilityPreferences(prev => ({ ...prev, textToSpeech: e.target.checked }))}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Reset Dialog */}
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle>Reset to Default Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={darkThemeStyles.typography.primary}>
            Are you sure you want to reset all preferences to their default values? This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ backgroundColor: '#92400e', color: 'white' }}>
            <AlertTitle>Warning</AlertTitle>
            This will reset all your customizations including theme, notifications, language, and accessibility settings.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleResetToDefaults}
            sx={{ backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' } }}
          >
            Reset to Defaults
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PreferencesSettingsPage;

