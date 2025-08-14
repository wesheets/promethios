import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import { Check, Palette } from '@mui/icons-material';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose }) => {
  const [selectedColor, setSelectedColor] = useState(color);
  const [customColor, setCustomColor] = useState(color);

  // Predefined color palette
  const colorPalette = [
    // Blues
    '#3b82f6', '#1e40af', '#1d4ed8', '#2563eb', '#60a5fa',
    // Greens
    '#10b981', '#059669', '#047857', '#065f46', '#34d399',
    // Purples
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#a78bfa',
    // Reds
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#f87171',
    // Oranges
    '#f59e0b', '#d97706', '#b45309', '#92400e', '#fbbf24',
    // Grays
    '#6b7280', '#4b5563', '#374151', '#1f2937', '#9ca3af',
    // Pinks
    '#ec4899', '#db2777', '#be185d', '#9d174d', '#f472b6',
    // Teals
    '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#5eead4',
  ];

  const handleColorSelect = (newColor: string) => {
    setSelectedColor(newColor);
    setCustomColor(newColor);
    onChange(newColor);
  };

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    setCustomColor(newColor);
    setSelectedColor(newColor);
    onChange(newColor);
  };

  const isValidHex = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  return (
    <Paper
      sx={{
        p: 3,
        width: 280,
        bgcolor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Palette sx={{ color: '#3b82f6', fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
          Color Picker
        </Typography>
      </Box>

      {/* Color Palette Grid */}
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
        Choose from palette:
      </Typography>
      <Grid container spacing={0.5} mb={3}>
        {colorPalette.map((paletteColor) => (
          <Grid item xs={2.4} key={paletteColor}>
            <Box
              onClick={() => handleColorSelect(paletteColor)}
              sx={{
                width: 32,
                height: 32,
                bgcolor: paletteColor,
                borderRadius: 1,
                cursor: 'pointer',
                border: selectedColor === paletteColor ? '2px solid white' : '1px solid #374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                },
              }}
            >
              {selectedColor === paletteColor && (
                <Check sx={{ color: 'white', fontSize: 16 }} />
              )}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Custom Color Input */}
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
        Or enter custom hex:
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          value={customColor}
          onChange={handleCustomColorChange}
          placeholder="#3b82f6"
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0f172a',
              color: 'white',
              fontSize: '0.875rem',
              '& fieldset': {
                borderColor: '#374151',
              },
              '&:hover fieldset': {
                borderColor: '#4b5563',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3b82f6',
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: '8px 12px',
            },
          }}
        />
        <Box
          sx={{
            width: 32,
            height: 32,
            bgcolor: isValidHex(customColor) ? customColor : '#374151',
            borderRadius: 1,
            border: '1px solid #374151',
          }}
        />
      </Stack>

      {/* Current Color Display */}
      <Box mt={2} p={2} bgcolor="#0f172a" borderRadius={1}>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
          Selected Color:
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: selectedColor,
              borderRadius: 1,
              border: '1px solid #374151',
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace' }}>
              {selectedColor.toUpperCase()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Hex Color Code
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Quick Actions */}
      <Box mt={2} display="flex" justifyContent="space-between">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Click outside to close
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: '#94a3b8',
            '&:hover': { color: 'white' },
          }}
        >
          <Check fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ColorPicker;

