import React, { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  Badge,
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
  Info,
  ColorLens,
  FormatSize,
  ChatBubble,
  Branding,
  PlayArrow,
  TouchApp,
} from '@mui/icons-material';
import { ChatbotProfile } from '../../../types/ChatbotTypes';
import { useWidgetCustomizer } from '../../../context/WidgetCustomizerContext';
import ColorPicker from './ColorPicker';

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
  bubbleSpacing: number;
  bubbleMaxWidth: number;
  
  // Header & Branding
  showHeader: boolean;
  headerTitle: string;
  headerSubtitle: string;
  showAvatar: boolean;
  avatarUrl: string;
  showStatus: boolean;
  
  // Branding & Attribution
  showPoweredBy: boolean;
  poweredByText: string;
  poweredByRemovable: boolean; // Based on tier
  customBranding: boolean;
  brandingText: string;
  brandingUrl: string;
  
  // Widget Appearance & Behavior
  initialState: 'minimized' | 'bubble' | 'expanded';
  bubbleIcon: string;
  bubbleText: string;
  bubblePosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  expandAnimation: 'slide' | 'fade' | 'scale' | 'bounce';
  
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
  pulseEffect: boolean;
  slideInEffect: boolean;
  
  // Welcome & Greeting
  showWelcomeMessage: boolean;
  welcomeMessage: string;
  suggestedQuestions: string[];
  
  // Position & Behavior
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  minimizable: boolean;
  draggable: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
  
  // Advanced Features
  showThinking: boolean;
  thinkingText: string;
  showTimestamps: boolean;
  showReadReceipts: boolean;
  enableSounds: boolean;
  soundNotifications: boolean;
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
  bubbleSpacing: 12,
  bubbleMaxWidth: 80,
  
  showHeader: true,
  headerTitle: 'Chat Support',
  headerSubtitle: 'We\'re here to help!',
  showAvatar: true,
  avatarUrl: '',
  showStatus: true,
  
  // Branding & Attribution
  showPoweredBy: true,
  poweredByText: 'Powered by Promethios',
  poweredByRemovable: false, // Based on tier
  customBranding: false,
  brandingText: '',
  brandingUrl: '',
  
  // Widget Appearance & Behavior
  initialState: 'bubble',
  bubbleIcon: '💬',
  bubbleText: 'Chat with us!',
  bubblePosition: 'bottom-right',
  expandAnimation: 'slide',
  
  inputPlaceholder: 'Type your message...',
  showAttachments: true,
  showEmojis: true,
  showSendButton: true,
  
  enableAnimations: true,
  typingIndicator: true,
  messageAnimations: true,
  hoverEffects: true,
  pulseEffect: true,
  slideInEffect: true,
  
  showWelcomeMessage: true,
  welcomeMessage: 'Hello! How can I help you today?',
  suggestedQuestions: ['How can I get started?', 'What are your hours?', 'Contact support'],
  
  position: 'bottom-right',
  minimizable: true,
  draggable: false,
  autoOpen: false,
  autoOpenDelay: 3000,
  
  showThinking: true,
  thinkingText: 'AI is thinking...',
  showTimestamps: false,
  showReadReceipts: false,
  enableSounds: true,
  soundNotifications: true,
};

const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({ chatbot, onSave, onClose }) => {
  const { config, updateConfig, resetConfig, setActiveChatbotId } = useWidgetCustomizer();
  const [activeTab, setActiveTab] = useState(0);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);
  const [previewMessages, setPreviewMessages] = useState([
    { id: 1, type: 'bot', text: config.welcomeMessage, timestamp: new Date() },
    { id: 2, type: 'user', text: 'Hello! I need help with my account.', timestamp: new Date() },
    { id: 3, type: 'bot', text: 'I\'d be happy to help you with your account. What specific issue are you experiencing?', timestamp: new Date() },
    { id: 4, type: 'user', text: 'I can\'t log in to my dashboard.', timestamp: new Date() },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [previewMinimized, setPreviewMinimized] = useState(false);

  // Set active chatbot when component mounts
  useEffect(() => {
    setActiveChatbotId(chatbot.identity.id);
  }, [chatbot.identity.id, setActiveChatbotId]);

  // Color picker handlers
  const handleColorClick = (colorKey: string, event: React.MouseEvent<HTMLElement>) => {
    setColorPickerOpen(colorKey);
    setColorPickerAnchor(event.currentTarget);
  };

  const handleColorChange = (colorKey: string, color: string) => {
    updateConfig(colorKey as keyof WidgetConfig, color);
  };

  const handleColorPickerClose = () => {
    setColorPickerOpen(null);
    setColorPickerAnchor(null);
  };

  const handleSave = () => {
    onSave(config);
  };

  const handleReset = () => {
    resetConfig();
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
                        onClick={(e) => handleColorClick('primaryColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.primaryColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Secondary Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => handleColorClick('secondaryColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.secondaryColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.secondaryColor}
                        onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Background</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => handleColorClick('backgroundColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.backgroundColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Text Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => handleColorClick('textColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.textColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.textColor}
                        onChange={(e) => updateConfig('textColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ color: 'white', mt: 3, mb: 2 }}>Chat Bubble Colors</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>User Bubbles</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => handleColorClick('userBubbleColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.userBubbleColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.userBubbleColor}
                        onChange={(e) => updateConfig('userBubbleColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Bot Bubbles</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => handleColorClick('botBubbleColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.botBubbleColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.botBubbleColor}
                        onChange={(e) => updateConfig('botBubbleColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Stack>
          )}
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
              
              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Font Family</Typography>
                <Autocomplete
                  value={config.fontFamily}
                  onChange={(e, value) => updateConfig('fontFamily', value || 'Inter')}
                  options={[
                    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
                    'Source Sans Pro', 'Nunito', 'Raleway', 'Ubuntu', 'Playfair Display',
                    'Merriweather', 'Georgia', 'Times New Roman', 'Arial', 'Helvetica',
                    'Verdana', 'Trebuchet MS', 'Courier New', 'Monaco'
                  ]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#0f172a',
                          color: 'white',
                          fontFamily: config.fontFamily,
                          '& fieldset': { borderColor: '#334155' },
                          '&:hover fieldset': { borderColor: '#4b5563' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ fontFamily: option }}>
                      {option}
                    </Box>
                  )}
                />
              </Box>

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
                  marks={[
                    { value: 10, label: '10px' },
                    { value: 14, label: '14px' },
                    { value: 18, label: '18px' },
                    { value: 24, label: '24px' },
                  ]}
                  sx={{
                    color: '#3b82f6',
                    '& .MuiSlider-mark': { color: '#64748b' },
                    '& .MuiSlider-markLabel': { color: '#64748b', fontSize: '0.75rem' },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Font Weight</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={config.fontWeight}
                    onChange={(e) => updateConfig('fontWeight', e.target.value)}
                    sx={{
                      bgcolor: '#0f172a',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    }}
                  >
                    <MenuItem value="300" sx={{ fontWeight: 300 }}>Light (300)</MenuItem>
                    <MenuItem value="400" sx={{ fontWeight: 400 }}>Regular (400)</MenuItem>
                    <MenuItem value="500" sx={{ fontWeight: 500 }}>Medium (500)</MenuItem>
                    <MenuItem value="600" sx={{ fontWeight: 600 }}>Semi Bold (600)</MenuItem>
                    <MenuItem value="700" sx={{ fontWeight: 700 }}>Bold (700)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Text Preview</Typography>
              
              <Paper
                sx={{
                  p: 3,
                  bgcolor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: config.fontFamily,
                    fontSize: `${config.fontSize + 4}px`,
                    fontWeight: config.fontWeight,
                    color: config.textColor,
                    mb: 2,
                  }}
                >
                  Chat Header Title
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: config.fontFamily,
                    fontSize: `${config.fontSize}px`,
                    fontWeight: config.fontWeight,
                    color: config.textColor,
                    mb: 1,
                  }}
                >
                  Hello! How can I help you today?
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: config.fontFamily,
                    fontSize: `${config.fontSize - 2}px`,
                    fontWeight: config.fontWeight,
                    color: '#94a3b8',
                  }}
                >
                  This is how your chat text will appear to users.
                </Typography>
              </Paper>
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

          {/* Chat Bubbles Tab */}
          {activeTab === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Chat Bubble Styling</Typography>
              
              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Bubble Colors</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>User Bubbles</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => handleColorClick('userBubbleColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.userBubbleColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.userBubbleColor}
                        onChange={(e) => updateConfig('userBubbleColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Bot Bubbles</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => handleColorClick('botBubbleColor', e)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: config.botBubbleColor,
                          borderRadius: 1,
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: '#3b82f6',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        value={config.botBubbleColor}
                        onChange={(e) => updateConfig('botBubbleColor', e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#334155' },
                            '&:hover fieldset': { borderColor: '#4b5563' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Bubble Shape & Size</Typography>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Border Radius: {config.bubbleRadius}px
                </Typography>
                <Slider
                  value={config.bubbleRadius}
                  onChange={(e, value) => updateConfig('bubbleRadius', value)}
                  min={4}
                  max={32}
                  step={2}
                  marks={[
                    { value: 4, label: '4px' },
                    { value: 12, label: '12px' },
                    { value: 20, label: '20px' },
                    { value: 32, label: '32px' },
                  ]}
                  sx={{
                    color: '#3b82f6',
                    '& .MuiSlider-mark': { color: '#64748b' },
                    '& .MuiSlider-markLabel': { color: '#64748b', fontSize: '0.75rem' },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Bubble Spacing: {config.bubbleSpacing}px
                </Typography>
                <Slider
                  value={config.bubbleSpacing}
                  onChange={(e, value) => updateConfig('bubbleSpacing', value)}
                  min={4}
                  max={24}
                  step={2}
                  marks={[
                    { value: 4, label: '4px' },
                    { value: 12, label: '12px' },
                    { value: 24, label: '24px' },
                  ]}
                  sx={{
                    color: '#3b82f6',
                    '& .MuiSlider-mark': { color: '#64748b' },
                    '& .MuiSlider-markLabel': { color: '#64748b', fontSize: '0.75rem' },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Max Width: {config.bubbleMaxWidth}%
                </Typography>
                <Slider
                  value={config.bubbleMaxWidth}
                  onChange={(e, value) => updateConfig('bubbleMaxWidth', value)}
                  min={50}
                  max={90}
                  step={5}
                  marks={[
                    { value: 50, label: '50%' },
                    { value: 70, label: '70%' },
                    { value: 90, label: '90%' },
                  ]}
                  sx={{
                    color: '#3b82f6',
                    '& .MuiSlider-mark': { color: '#64748b' },
                    '& .MuiSlider-markLabel': { color: '#64748b', fontSize: '0.75rem' },
                  }}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.bubbleShadow}
                    onChange={(e) => updateConfig('bubbleShadow', e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                  />
                }
                label="Drop Shadow"
                sx={{ color: '#94a3b8' }}
              />

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Bubble Preview</Typography>
              
              <Paper
                sx={{
                  p: 3,
                  bgcolor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 2,
                }}
              >
                <Stack spacing={config.bubbleSpacing / 8}>
                  {/* Bot Bubble */}
                  <Box display="flex" justifyContent="flex-start">
                    <Box
                      sx={{
                        maxWidth: `${config.bubbleMaxWidth}%`,
                        bgcolor: config.botBubbleColor,
                        color: config.textColor,
                        p: 1.5,
                        borderRadius: `${config.bubbleRadius}px`,
                        fontFamily: config.fontFamily,
                        fontSize: `${config.fontSize}px`,
                        fontWeight: config.fontWeight,
                        boxShadow: config.bubbleShadow ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      Hello! How can I help you today?
                    </Box>
                  </Box>

                  {/* User Bubble */}
                  <Box display="flex" justifyContent="flex-end">
                    <Box
                      sx={{
                        maxWidth: `${config.bubbleMaxWidth}%`,
                        bgcolor: config.userBubbleColor,
                        color: 'white',
                        p: 1.5,
                        borderRadius: `${config.bubbleRadius}px`,
                        fontFamily: config.fontFamily,
                        fontSize: `${config.fontSize}px`,
                        fontWeight: config.fontWeight,
                        boxShadow: config.bubbleShadow ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      I need help with my account
                    </Box>
                  </Box>
                </Stack>
              </Paper>
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
              
              <Tooltip title="Enable smooth animations throughout the chat interface" arrow>
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
              </Tooltip>

              <Tooltip title="Show animated dots when the bot is typing a response" arrow>
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
              </Tooltip>

              <Tooltip title="Animate message bubbles as they appear in the conversation" arrow>
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
              </Tooltip>

              <Tooltip title="Add subtle hover effects to interactive elements" arrow>
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
              </Tooltip>

              <Tooltip title="Display a thinking indicator when the AI is processing complex requests" arrow>
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
              </Tooltip>

              {config.showThinking && (
                <TextField
                  label="Thinking Text"
                  value={config.thinkingText}
                  onChange={(e) => updateConfig('thinkingText', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0f172a',
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#4b5563' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                  }}
                />
              )}

              <Tooltip title="Play subtle sound effects for message notifications" arrow>
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
              </Tooltip>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Animation Speed</Typography>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Animation Duration: {config.animationSpeed}ms
                </Typography>
                <Slider
                  value={config.animationSpeed}
                  onChange={(e, value) => updateConfig('animationSpeed', value)}
                  min={100}
                  max={1000}
                  step={50}
                  marks={[
                    { value: 100, label: 'Fast' },
                    { value: 300, label: 'Normal' },
                    { value: 600, label: 'Slow' },
                    { value: 1000, label: 'Very Slow' },
                  ]}
                  sx={{
                    color: '#3b82f6',
                    '& .MuiSlider-mark': { color: '#64748b' },
                    '& .MuiSlider-markLabel': { color: '#64748b', fontSize: '0.75rem' },
                  }}
                />
              </Box>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Animation Preview</Typography>
              
              <Paper
                sx={{
                  p: 3,
                  bgcolor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Typing Indicator Demo */}
                {config.typingIndicator && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                      Typing Indicator:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          p: 1,
                          bgcolor: config.botBubbleColor,
                          borderRadius: `${config.bubbleRadius}px`,
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 6,
                              height: 6,
                              bgcolor: config.textColor,
                              borderRadius: '50%',
                              animation: config.enableAnimations ? `typing-dot ${config.animationSpeed * 2}ms infinite ${i * 200}ms` : 'none',
                              '@keyframes typing-dot': {
                                '0%, 60%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                                '30%': { opacity: 1, transform: 'scale(1)' },
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Message Animation Demo */}
                {config.messageAnimations && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                      Message Animation:
                    </Typography>
                    <Box
                      sx={{
                        maxWidth: '70%',
                        bgcolor: config.userBubbleColor,
                        color: 'white',
                        p: 1.5,
                        borderRadius: `${config.bubbleRadius}px`,
                        fontFamily: config.fontFamily,
                        fontSize: `${config.fontSize}px`,
                        animation: config.enableAnimations ? `message-slide ${config.animationSpeed}ms ease-out infinite alternate` : 'none',
                        '@keyframes message-slide': {
                          '0%': { opacity: 0, transform: 'translateY(10px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      Hello! This message slides in smoothly.
                    </Box>
                  </Box>
                )}

                {/* Thinking Indicator Demo */}
                {config.showThinking && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                      Thinking Indicator:
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 1,
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          border: '2px solid #3b82f6',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: config.enableAnimations ? `spin ${config.animationSpeed}ms linear infinite` : 'none',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#3b82f6',
                          fontFamily: config.fontFamily,
                          fontSize: `${config.fontSize - 2}px`,
                        }}
                      >
                        {config.thinkingText}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Stack>
          )}
                sx={{ color: '#94a3b8' }}
              />
            </Stack>
          )}

          {/* Behavior Tab */}
          {activeTab === 6 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Widget Behavior</Typography>
              
              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Widget Position & Appearance</Typography>

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Position</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={config.position}
                    onChange={(e) => updateConfig('position', e.target.value)}
                    sx={{
                      bgcolor: '#0f172a',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    }}
                  >
                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                    <MenuItem value="top-right">Top Right</MenuItem>
                    <MenuItem value="top-left">Top Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Tooltip title="Allow users to minimize the chat widget to a small bubble" arrow>
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
              </Tooltip>

              <Tooltip title="Allow users to drag the chat widget around the screen" arrow>
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
              </Tooltip>

              <Tooltip title="Automatically open the chat widget when the page loads" arrow>
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
              </Tooltip>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Input Controls</Typography>

              <TextField
                label="Input Placeholder"
                value={config.inputPlaceholder}
                onChange={(e) => updateConfig('inputPlaceholder', e.target.value)}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0f172a',
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#4b5563' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />

              <Tooltip title="Show a button for users to attach files" arrow>
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
              </Tooltip>

              <Tooltip title="Show a button for users to insert emojis" arrow>
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
              </Tooltip>

              <Tooltip title="Show a send button (messages can still be sent with Enter)" arrow>
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
              </Tooltip>

              <Tooltip title="Show timestamps on messages" arrow>
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
              </Tooltip>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Branding & Attribution</Typography>

              <Tooltip title="Display 'Powered by Promethios' branding (can be removed with paid plans)" arrow>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.showBranding}
                      onChange={(e) => updateConfig('showBranding', e.target.checked)}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' } }}
                    />
                  }
                  label="Show 'Powered by Promethios'"
                  sx={{ color: '#94a3b8' }}
                />
              </Tooltip>

              {config.showBranding && (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#3b82f6', mb: 1 }}>
                    💡 Branding Removal
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    The "Powered by Promethios" branding can be removed with:
                  </Typography>
                  <Box component="ul" sx={{ color: '#94a3b8', fontSize: '0.875rem', pl: 2, m: 0 }}>
                    <li>Professional Plan ($29/month)</li>
                    <li>Enterprise Plan ($99/month)</li>
                    <li>Custom Enterprise Solutions</li>
                  </Box>
                </Paper>
              )}

              <Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Custom CSS Classes</Typography>
                <TextField
                  placeholder="custom-chat-widget my-brand-colors"
                  value={config.customClasses}
                  onChange={(e) => updateConfig('customClasses', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0f172a',
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#4b5563' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                  Add custom CSS classes for advanced styling
                </Typography>
              </Box>

              <Divider sx={{ bgcolor: '#334155' }} />

              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Widget Preview</Typography>
              
              <Paper
                sx={{
                  p: 3,
                  bgcolor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 2,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: 300,
                    height: 200,
                    bgcolor: '#1e293b',
                    borderRadius: 2,
                    border: '1px solid #334155',
                    position: 'relative',
                    mx: 'auto',
                  }}
                >
                  {/* Widget Position Indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 60,
                      height: 40,
                      bgcolor: config.primaryColor,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      ...(config.position === 'bottom-right' && { bottom: 8, right: 8 }),
                      ...(config.position === 'bottom-left' && { bottom: 8, left: 8 }),
                      ...(config.position === 'top-right' && { top: 8, right: 8 }),
                      ...(config.position === 'top-left' && { top: 8, left: 8 }),
                      ...(config.position === 'center' && { 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)' 
                      }),
                    }}
                  >
                    CHAT
                  </Box>

                  {/* Branding Preview */}
                  {config.showBranding && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.625rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          bgcolor: '#3b82f6',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.5rem',
                          fontWeight: 'bold',
                        }}
                      >
                        P
                      </Box>
                      Powered by Promethios
                    </Box>
                  )}
                </Box>
              </Paper>
            </Stack>
          )}
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

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerOpen)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPopover-paper': {
            bgcolor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        {colorPickerOpen && (
          <ColorPicker
            color={config[colorPickerOpen as keyof WidgetConfig] as string}
            onChange={(color) => handleColorChange(colorPickerOpen, color)}
            onClose={handleColorPickerClose}
          />
        )}
      </Popover>

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

