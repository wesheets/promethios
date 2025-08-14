import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Popover,
  Autocomplete,
} from '@mui/material';
import {
  Palette as ColorsIcon,
  TextFields as TypographyIcon,
  ViewQuilt as LayoutIcon,
  ChatBubble as ChatBubblesIcon,
  Label as BrandingIcon,
  Animation as AnimationsIcon,
  Settings as BehaviorIcon,
  Close as CloseIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  Science as TestTubeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useWidgetCustomizer } from '../../../context/WidgetCustomizerContext';
import ColorPicker from './ColorPicker';

interface WidgetCustomizerProps {
  selectedChatbot: any;
  onClose: () => void;
}

const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({ selectedChatbot, onClose }) => {
  const { config, updateConfig, saveConfig, resetConfig } = useWidgetCustomizer();
  const [activeTab, setActiveTab] = useState(0);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro',
    'Nunito', 'Raleway', 'Ubuntu', 'Merriweather', 'Playfair Display', 'Oswald',
    'PT Sans', 'Lora', 'Noto Sans', 'Fira Sans', 'Work Sans', 'Crimson Text', 'Libre Baskerville'
  ];

  const handleColorPickerOpen = (colorType: string, event: React.MouseEvent<HTMLElement>) => {
    setColorPickerAnchor(event.currentTarget);
    setColorPickerOpen(colorType);
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchor(null);
    setColorPickerOpen(null);
  };

  const handleColorChange = (colorType: string, color: string) => {
    updateConfig(colorType as keyof typeof config, color);
  };

  const handleSave = () => {
    saveConfig(selectedChatbot?.identity?.id);
    onClose();
  };

  const handleReset = () => {
    resetConfig();
  };

  const tabs = [
    { icon: <ColorsIcon />, label: 'COLORS' },
    { icon: <TypographyIcon />, label: 'TYPOGRAPHY' },
    { icon: <LayoutIcon />, label: 'LAYOUT' },
    { icon: <ChatBubblesIcon />, label: 'CHAT BUBBLES' },
    { icon: <BrandingIcon />, label: 'BRANDING' },
    { icon: <AnimationsIcon />, label: 'ANIMATIONS' },
    { icon: <BehaviorIcon />, label: 'BEHAVIOR' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          Widget Customizer
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{
              color: '#94a3b8',
              borderColor: '#334155',
              '&:hover': { borderColor: '#4b5563' },
            }}
          >
            RESET
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
            }}
          >
            SAVE CHANGES
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', height: '100%', gap: 3 }}>
        {/* Controls Panel */}
        <Box sx={{ width: '50%' }}>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                color: '#64748b',
                minHeight: 48,
                '&.Mui-selected': { color: '#3b82f6' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
              />
            ))}
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ height: 'calc(100% - 120px)', overflow: 'auto' }}>
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
                            border: '2px solid #334155',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              borderColor: '#3b82f6',
                            },
                          }}
                          onClick={(e) => handleColorPickerOpen('primaryColor', e)}
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
                            border: '2px solid #334155',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              borderColor: '#3b82f6',
                            },
                          }}
                          onClick={(e) => handleColorPickerOpen('secondaryColor', e)}
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
                            border: '2px solid #334155',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              borderColor: '#3b82f6',
                            },
                          }}
                          onClick={(e) => handleColorPickerOpen('userBubbleColor', e)}
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
                            border: '2px solid #334155',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              borderColor: '#3b82f6',
                            },
                          }}
                          onClick={(e) => handleColorPickerOpen('botBubbleColor', e)}
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
                
                <Autocomplete
                  value={config.fontFamily}
                  onChange={(e, newValue) => updateConfig('fontFamily', newValue || 'Inter')}
                  options={fontOptions}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Font Family"
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
                />

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

                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#94a3b8' }}>Font Weight</InputLabel>
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
                    <MenuItem value={300}>Light (300)</MenuItem>
                    <MenuItem value={400}>Regular (400)</MenuItem>
                    <MenuItem value={500}>Medium (500)</MenuItem>
                    <MenuItem value={600}>Semi Bold (600)</MenuItem>
                    <MenuItem value={700}>Bold (700)</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}

            {/* Other tabs would go here... */}
          </Box>
        </Box>

        {/* Live Preview */}
        <Box sx={{ width: '50%', pl: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>Live Preview</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="380×600"
                size="small"
                sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
              />
              <Chip
                label="bottom-right"
                size="small"
                sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
              />
            </Box>
          </Box>

          {/* Chat Widget Preview */}
          <Paper
            sx={{
              width: 380,
              height: 600,
              bgcolor: config.backgroundColor,
              borderRadius: 2,
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: config.fontFamily,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                bgcolor: config.primaryColor,
                color: 'white',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  🤖
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: `${config.fontSize}px` }}>
                    {selectedChatbot?.identity?.name || 'Chat Support'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    We're here to help!
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    maxWidth: '80%',
                    bgcolor: config.botBubbleColor,
                    color: config.textColor,
                    p: 1.5,
                    borderRadius: `${config.bubbleRadius}px`,
                    fontSize: `${config.fontSize}px`,
                    fontFamily: config.fontFamily,
                    fontWeight: config.fontWeight,
                  }}
                >
                  Hello! How can I help you today?
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Box
                  sx={{
                    maxWidth: '80%',
                    bgcolor: config.userBubbleColor,
                    color: 'white',
                    p: 1.5,
                    borderRadius: `${config.bubbleRadius}px`,
                    fontSize: `${config.fontSize}px`,
                    fontFamily: config.fontFamily,
                    fontWeight: config.fontWeight,
                  }}
                >
                  Hello! I need help with my account.
                </Box>
              </Box>
            </Box>

            {/* Input Area */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <TextField
                placeholder={config.inputPlaceholder}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0f172a',
                    color: config.textColor,
                    fontSize: `${config.fontSize}px`,
                    fontFamily: config.fontFamily,
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#4b5563' },
                    '&.Mui-focused fieldset': { borderColor: config.primaryColor },
                  },
                }}
              />

              <IconButton
                size="small"
                sx={{
                  bgcolor: config.primaryColor,
                  color: 'white',
                  '&:hover': { bgcolor: config.primaryColor, opacity: 0.8 },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>

            {/* Branding */}
            {config.showBranding && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 1,
                  fontSize: '0.75rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.625rem',
                    fontWeight: 'bold',
                  }}
                >
                  P
                </Box>
                Powered by Promethios
              </Box>
            )}
          </Paper>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<TestTubeIcon />}
              sx={{
                color: '#94a3b8',
                borderColor: '#334155',
                '&:hover': { borderColor: '#4b5563', bgcolor: 'rgba(148, 163, 184, 0.1)' },
              }}
            >
              TEST RESPONSE
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{
                color: '#94a3b8',
                borderColor: '#334155',
                '&:hover': { borderColor: '#4b5563', bgcolor: 'rgba(148, 163, 184, 0.1)' },
              }}
            >
              RESET CHAT
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Bottom Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: 3,
          borderTop: '1px solid #334155',
        }}
      >
        <Button
          variant="outlined"
          onClick={handleReset}
          sx={{
            color: '#94a3b8',
            borderColor: '#334155',
            '&:hover': { borderColor: '#4b5563', bgcolor: 'rgba(148, 163, 184, 0.1)' },
          }}
        >
          RESET TO DEFAULT
        </Button>

        <Button
          variant="outlined"
          sx={{
            color: '#94a3b8',
            borderColor: '#334155',
            '&:hover': { borderColor: '#4b5563', bgcolor: 'rgba(148, 163, 184, 0.1)' },
          }}
        >
          CANCEL
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
          }}
        >
          SAVE & DEPLOY
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
            color={config[colorPickerOpen as keyof typeof config] as string}
            onChange={(color) => handleColorChange(colorPickerOpen, color)}
            onClose={handleColorPickerClose}
          />
        )}
      </Popover>
    </Box>
  );
};

export default WidgetCustomizer;

