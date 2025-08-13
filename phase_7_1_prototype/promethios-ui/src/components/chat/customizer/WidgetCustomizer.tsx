import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Tab,
  Tabs,
  ColorPicker,
  Autocomplete,
} from '@mui/material';
import {
  ExpandMore,
  Palette,
  TextFields,
  BorderStyle,
  Animation,
  SmartToy,
  Message,
  Settings,
  Preview,
  Save,
  Refresh,
  Upload,
  Download,
  Copy,
  Visibility,
  VisibilityOff,
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Close,
  Minimize,
  OpenInFull,
} from '@mui/icons-material';
import { ChatbotProfile } from '../../../types/ChatbotTypes';

interface WidgetCustomizerProps {
  chatbot: ChatbotProfile;
  onSave: (config: WidgetConfig) => void;
  onClose: () => void;
}

interface WidgetConfig {
  // Theme & Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  
  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  
  // Layout & Sizing
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
  borderStyle: string;
  borderColor: string;
  
  // Chat Bubble Styling
  userBubbleColor: string;
  botBubbleColor: string;
  bubbleRadius: number;
  bubbleShadow: boolean;
  
  // Header & Branding
  showHeader: boolean;
  headerTitle: string;
  headerSubtitle: string;
  showAvatar: boolean;
  avatarUrl: string;
  showStatus: boolean;
  
  // Input & Controls
  inputPlaceholder: string;
  showAttachments: boolean;
  showEmojis: boolean;
  showSendButton: boolean;
  
  // Animations & Effects
  enableAnimations: boolean;
  typingIndicator: boolean;
  messageAnimations: boolean;
  hoverEffects: boolean;
  
  // Welcome & Greeting
  showWelcomeMessage: boolean;
  welcomeMessage: string;
  suggestedQuestions: string[];
  
  // Position & Behavior
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  minimizable: boolean;
  draggable: boolean;
  autoOpen: boolean;
  
  // Advanced Features
  showThinking: boolean;
  thinkingText: string;
  showTimestamps: boolean;
  showReadReceipts: boolean;
  enableSounds: boolean;
}

const defaultConfig: WidgetConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e293b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  accentColor: '#10b981',
  
  fontFamily: 'Inter',
  fontSize: 14,
  fontWeight: '400',
  
  width: 380,
  height: 600,
  borderRadius: 16,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#e5e7eb',
  
  userBubbleColor: '#3b82f6',
  botBubbleColor: '#f3f4f6',
  bubbleRadius: 18,
  bubbleShadow: true,
  
  showHeader: true,
  headerTitle: 'Chat Support',
  headerSubtitle: 'We\'re here to help!',
  showAvatar: true,
  avatarUrl: '',
  showStatus: true,
  
  inputPlaceholder: 'Type your message...',
  showAttachments: true,
  showEmojis: true,
  showSendButton: true,
  
  enableAnimations: true,
  typingIndicator: true,
  messageAnimations: true,
  hoverEffects: true,
  
  showWelcomeMessage: true,
  welcomeMessage: 'Hello! How can I help you today?',
  suggestedQuestions: ['How can I get started?', 'What are your hours?', 'Contact support'],
  
  position: 'bottom-right',
  minimizable: true,
  draggable: false,
  autoOpen: false,
  
  showThinking: true,
  thinkingText: 'AI is thinking...',
  showTimestamps: false,
  showReadReceipts: false,
  enableSounds: true,
};

const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({ chatbot, onSave, onClose }) => {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState(0);
  const [previewMessages, setPreviewMessages] = useState([
    { id: 1, type: 'bot', text: config.welcomeMessage, timestamp: new Date() },
    { id: 2, type: 'user', text: 'Hello! I need help with my account.', timestamp: new Date() },
    { id: 3, type: 'bot', text: 'I\'d be happy to help you with your account. What specific issue are you experiencing?', timestamp: new Date() },
    { id: 4, type: 'user', text: 'I can\'t log in to my dashboard.', timestamp: new Date() },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [previewMinimized, setPreviewMinimized] = useState(false);

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(config);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
  };

  const simulateTyping = () => {
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      setPreviewMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: 'This is a preview of how your chatbot will respond to users.',
        timestamp: new Date()
      }]);
    }, 2000);
  };

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro', 'Nunito'
  ];

  const positionOptions = [
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'center', label: 'Center' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#1e293b', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Widget Customizer
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleReset}
            sx={{ color: '#94a3b8', borderColor: '#334155' }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Save />}
            onClick={handleSave}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Save Changes
          </Button>
        </Stack>
      </Box>

      {/* Customizer Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { 
              color: '#64748b',
              minWidth: 'auto',
              px: 2,
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#3b82f6' }
          }}
        >
          <Tab icon={<Palette />} label="Colors" />
          <Tab icon={<TextFields />} label="Typography" />
          <Tab icon={<BorderStyle />} label="Layout" />
          <Tab icon={<Message />} label="Chat Bubbles" />
          <Tab icon={<SmartToy />} label="Branding" />
          <Tab icon={<Animation />} label="Animations" />
          <Tab icon={<Settings />} label="Behavior" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        {/* Controls Panel */}
        <Box sx={{ width: '50%', overflow: 'auto', pr: 1 }}>
          {/* Colors Tab */}
          {activeTab === 0 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Color Scheme</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Primary Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.primaryColor,
                          borderRadius: 1,
                          border: '1px solid #334155',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Secondary Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.secondaryColor,
                          borderRadius: 1,
                          border: '1px solid #334155',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.secondaryColor}
                        onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Background</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.backgroundColor,
                          borderRadius: 1,
                          border: '1px solid #334155',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Text Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.textColor,
                          borderRadius: 1,
                          border: '1px solid #334155',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.textColor}
                        onChange={(e) => updateConfig('textColor', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white' }}>Chat Bubble Colors</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>User Bubbles</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.userBubbleColor,
                          borderRadius: 1,
                          border: '1px solid #334155',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.userBubbleColor}
                        onChange={(e) => updateConfig('userBubbleColor', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Bot Bubbles</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.botBubbleColor,
                          borderRadius: 1,
                          border: '1px solid #334155',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.botBubbleColor}
                        onChange={(e) => updateConfig('botBubbleColor', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* Typography Tab */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Typography Settings</Typography>
              
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#94a3b8' }}>Font Family</InputLabel>
                <Select
                  value={config.fontFamily}
                  onChange={(e) => updateConfig('fontFamily', e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {fontOptions.map(font => (
                    <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Font Size: {config.fontSize}px
                </Typography>
                <Slider
                  value={config.fontSize}
                  onChange={(e, value) => updateConfig('fontSize', value)}
                  min={10}
                  max={24}
                  step={1}
                  sx={{ color: '#3b82f6' }}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel sx={{ color: '#94a3b8' }}>Font Weight</InputLabel>
                <Select
                  value={config.fontWeight}
                  onChange={(e) => updateConfig('fontWeight', e.target.value)}
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="300">Light (300)</MenuItem>
                  <MenuItem value="400">Regular (400)</MenuItem>
                  <MenuItem value="500">Medium (500)</MenuItem>
                  <MenuItem value="600">Semi Bold (600)</MenuItem>
                  <MenuItem value="700">Bold (700)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {/* Layout Tab */}
          {activeTab === 2 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Layout & Sizing</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Width (px)"
                    type="number"
                    value={config.width}
                    onChange={(e) => updateConfig('width', parseInt(e.target.value))}
                    fullWidth
                    InputProps={{ inputProps: { min: 300, max: 600 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Height (px)"
                    type="number"
                    value={config.height}
                    onChange={(e) => updateConfig('height', parseInt(e.target.value))}
                    fullWidth
                    InputProps={{ inputProps: { min: 400, max: 800 } }}
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Border Radius: {config.borderRadius}px
                </Typography>
                <Slider
                  value={config.borderRadius}
                  onChange={(e, value) => updateConfig('borderRadius', value)}
                  min={0}
                  max={32}
                  step={1}
                  sx={{ color: '#3b82f6' }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Border Width: {config.borderWidth}px
                </Typography>
                <Slider
                  value={config.borderWidth}
                  onChange={(e, value) => updateConfig('borderWidth', value)}
                  min={0}
                  max={8}
                  step={1}
                  sx={{ color: '#3b82f6' }}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel sx={{ color: '#94a3b8' }}>Position</InputLabel>
                <Select
                  value={config.position}
                  onChange={(e) => updateConfig('position', e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {positionOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {/* Additional tabs would continue here... */}
          
          {/* Branding Tab */}
          {activeTab === 4 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Branding & Header</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showHeader}
                    onChange={(e) => updateConfig('showHeader', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Show Header"
                sx={{ color: '#94a3b8' }}
              />

              {config.showHeader && (
                <Stack spacing={2}>
                  <TextField
                    label="Header Title"
                    value={config.headerTitle}
                    onChange={(e) => updateConfig('headerTitle', e.target.value)}
                    fullWidth
                  />
                  
                  <TextField
                    label="Header Subtitle"
                    value={config.headerSubtitle}
                    onChange={(e) => updateConfig('headerSubtitle', e.target.value)}
                    fullWidth
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.showAvatar}
                        onChange={(e) => updateConfig('showAvatar', e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                      />
                    }
                    label="Show Avatar"
                    sx={{ color: '#94a3b8' }}
                  />

                  {config.showAvatar && (
                    <TextField
                      label="Avatar URL"
                      value={config.avatarUrl}
                      onChange={(e) => updateConfig('avatarUrl', e.target.value)}
                      fullWidth
                      placeholder="https://example.com/avatar.jpg"
                    />
                  )}
                </Stack>
              )}

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white' }}>Welcome Message</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showWelcomeMessage}
                    onChange={(e) => updateConfig('showWelcomeMessage', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Show Welcome Message"
                sx={{ color: '#94a3b8' }}
              />

              {config.showWelcomeMessage && (
                <TextField
                  label="Welcome Message"
                  value={config.welcomeMessage}
                  onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                />
              )}
            </Stack>
          )}

          {/* Animations Tab */}
          {activeTab === 5 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Animations & Effects</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableAnimations}
                    onChange={(e) => updateConfig('enableAnimations', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Enable Animations"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.typingIndicator}
                    onChange={(e) => updateConfig('typingIndicator', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Typing Indicator"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.messageAnimations}
                    onChange={(e) => updateConfig('messageAnimations', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Message Animations"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.hoverEffects}
                    onChange={(e) => updateConfig('hoverEffects', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Hover Effects"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.showThinking}
                    onChange={(e) => updateConfig('showThinking', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Show Thinking Indicator"
                sx={{ color: '#94a3b8' }}
              />

              {config.showThinking && (
                <TextField
                  label="Thinking Text"
                  value={config.thinkingText}
                  onChange={(e) => updateConfig('thinkingText', e.target.value)}
                  fullWidth
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableSounds}
                    onChange={(e) => updateConfig('enableSounds', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Enable Sounds"
                sx={{ color: '#94a3b8' }}
              />
            </Stack>
          )}

          {/* Behavior Tab */}
          {activeTab === 6 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Widget Behavior</Typography>
              
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#94a3b8' }}>Position</InputLabel>
                <Select
                  value={config.position}
                  onChange={(e) => updateConfig('position', e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {positionOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.minimizable}
                    onChange={(e) => updateConfig('minimizable', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Minimizable"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.draggable}
                    onChange={(e) => updateConfig('draggable', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Draggable"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoOpen}
                    onChange={(e) => updateConfig('autoOpen', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Auto Open"
                sx={{ color: '#94a3b8' }}
              />

              <TextField
                label="Input Placeholder"
                value={config.inputPlaceholder}
                onChange={(e) => updateConfig('inputPlaceholder', e.target.value)}
                fullWidth
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.showAttachments}
                    onChange={(e) => updateConfig('showAttachments', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Show Attachments Button"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.showEmojis}
                    onChange={(e) => updateConfig('showEmojis', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Show Emoji Button"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.showSendButton}
                    onChange={(e) => updateConfig('showSendButton', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Show Send Button"
                sx={{ color: '#94a3b8' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.showTimestamps}
                    onChange={(e) => updateConfig('showTimestamps', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Show Timestamps"
                sx={{ color: '#94a3b8' }}
              />
            </Stack>
          )}
        </Box>

        {/* Live Preview */}
        <Box sx={{ width: '50%', pl: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>Live Preview</Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`${config.width}×${config.height}`}
                size="small"
                sx={{ bgcolor: '#374151', color: '#94a3b8' }}
              />
              <Chip
                label={config.position}
                size="small"
                sx={{ bgcolor: '#374151', color: '#94a3b8' }}
              />
            </Stack>
          </Box>
          
          <Paper
            elevation={8}
            sx={{
              width: Math.min(config.width, 380),
              height: Math.min(config.height, 500),
              borderRadius: `${config.borderRadius}px`,
              border: `${config.borderWidth}px ${config.borderStyle} ${config.borderColor}`,
              bgcolor: config.backgroundColor,
              color: config.textColor,
              position: 'relative',
              transform: previewMinimized ? 'scale(0.8)' : 'scale(1)',
              transformOrigin: 'top left',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: config.fontFamily,
              fontSize: `${config.fontSize}px`,
              fontWeight: config.fontWeight,
              boxShadow: config.enableAnimations 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              '&:hover': config.hoverEffects ? {
                transform: previewMinimized ? 'scale(0.82)' : 'scale(1.02)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              } : {},
            }}
          >
            {/* Header */}
            {config.showHeader && (
              <Box
                sx={{
                  bgcolor: config.primaryColor,
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {config.showAvatar && (
                  <Avatar
                    src={config.avatarUrl}
                    sx={{ width: 40, height: 40 }}
                  >
                    <SmartToy />
                  </Avatar>
                )}
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {config.headerTitle}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {config.headerSubtitle}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton 
                    size="small" 
                    sx={{ color: 'white' }}
                    onClick={() => setPreviewMinimized(!previewMinimized)}
                  >
                    <Minimize />
                  </IconButton>
                  <IconButton size="small" sx={{ color: 'white' }}>
                    <Close />
                  </IconButton>
                </Stack>
              </Box>
            )}

            {/* Messages Area */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {previewMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      p: 1.5,
                      borderRadius: `${config.bubbleRadius}px`,
                      bgcolor: message.type === 'user' ? config.userBubbleColor : config.botBubbleColor,
                      color: message.type === 'user' ? 'white' : config.textColor,
                      boxShadow: config.bubbleShadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      animation: config.messageAnimations ? 'slideIn 0.3s ease' : 'none',
                    }}
                  >
                    <Typography variant="body2">
                      {message.text}
                    </Typography>
                    {config.showTimestamps && (
                      <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}

              {/* Thinking Indicator */}
              {isThinking && config.showThinking && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: `${config.bubbleRadius}px`,
                      bgcolor: config.botBubbleColor,
                      color: config.textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: config.primaryColor,
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                      />
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: config.primaryColor,
                          animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                        }}
                      />
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: config.primaryColor,
                          animation: 'pulse 1.5s ease-in-out infinite 0.4s',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {config.thinkingText}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Input Area */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {config.showAttachments && (
                <IconButton size="small" sx={{ color: config.primaryColor }}>
                  <AttachFile />
                </IconButton>
              )}
              <TextField
                placeholder={config.inputPlaceholder}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: `${config.bubbleRadius}px`,
                  },
                }}
              />
              {config.showEmojis && (
                <IconButton size="small" sx={{ color: config.primaryColor }}>
                  <EmojiEmotions />
                </IconButton>
              )}
              {config.showSendButton && (
                <IconButton 
                  size="small" 
                  sx={{ color: config.primaryColor }}
                  onClick={simulateTyping}
                >
                  <Send />
                </IconButton>
              )}
            </Box>
          </Paper>

          {/* Preview Controls */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Preview />}
              onClick={simulateTyping}
              sx={{ borderColor: '#374151', color: '#94a3b8' }}
            >
              Test Response
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={() => setPreviewMessages(previewMessages.slice(0, 4))}
              sx={{ borderColor: '#374151', color: '#94a3b8' }}
            >
              Reset Chat
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #334155', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleReset}
          sx={{ borderColor: '#374151', color: '#94a3b8' }}
        >
          Reset to Default
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderColor: '#374151', color: '#94a3b8' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<Save />}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Save & Deploy
        </Button>
      </Box>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; }
            40% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default WidgetCustomizer;

