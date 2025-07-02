/**
 * Dark Theme Styles Utility
 * 
 * Comprehensive dark theme styling for Material-UI components
 * to ensure consistent appearance across all settings pages
 */

export const darkThemeStyles = {
  // Main container styling
  pageContainer: {
    p: 3,
    backgroundColor: '#1a202c',
    minHeight: '100vh',
    color: 'white'
  },

  // Card styling
  card: {
    backgroundColor: '#2d3748',
    color: 'white',
    border: '1px solid #4a5568',
    '& .MuiCardHeader-title': {
      color: 'white'
    },
    '& .MuiCardHeader-subheader': {
      color: '#a0aec0'
    }
  },

  // TextField styling
  textField: {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { 
        borderColor: '#4a5568' 
      },
      '&:hover fieldset': { 
        borderColor: '#3b82f6' 
      },
      '&.Mui-focused fieldset': { 
        borderColor: '#3b82f6' 
      },
      '& input': { 
        color: 'white !important' 
      },
      '& textarea': { 
        color: 'white !important' 
      }
    },
    '& .MuiInputLabel-root': { 
      color: '#a0aec0' 
    },
    '& .MuiInputLabel-root.Mui-focused': { 
      color: '#3b82f6' 
    },
    '& .MuiInputBase-input': { 
      color: 'white !important' 
    },
    '& .MuiInputBase-input.Mui-disabled': {
      color: '#718096 !important',
      WebkitTextFillColor: '#718096 !important'
    },
    '& .MuiFormHelperText-root': {
      color: '#a0aec0'
    }
  },

  // Select styling
  select: {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { 
        borderColor: '#4a5568' 
      },
      '&:hover fieldset': { 
        borderColor: '#3b82f6' 
      },
      '&.Mui-focused fieldset': { 
        borderColor: '#3b82f6' 
      }
    },
    '& .MuiInputLabel-root': { 
      color: '#a0aec0' 
    },
    '& .MuiInputLabel-root.Mui-focused': { 
      color: '#3b82f6' 
    },
    '& .MuiSelect-select': {
      color: 'white !important'
    },
    '& .MuiSelect-icon': {
      color: '#a0aec0'
    }
  },

  // FormControl styling
  formControl: {
    '& .MuiInputLabel-root': { 
      color: '#a0aec0' 
    },
    '& .MuiInputLabel-root.Mui-focused': { 
      color: '#3b82f6' 
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { 
        borderColor: '#4a5568' 
      },
      '&:hover fieldset': { 
        borderColor: '#3b82f6' 
      },
      '&.Mui-focused fieldset': { 
        borderColor: '#3b82f6' 
      }
    }
  },

  // Typography styling
  typography: {
    primary: {
      color: 'white'
    },
    secondary: {
      color: '#a0aec0'
    },
    muted: {
      color: '#718096'
    }
  },

  // Button styling
  button: {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2563eb'
      }
    },
    secondary: {
      backgroundColor: '#4a5568',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2d3748'
      }
    }
  },

  // Tab styling
  tabs: {
    '& .MuiTab-root': {
      color: '#a0aec0',
      '&.Mui-selected': {
        color: '#3b82f6'
      }
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#3b82f6'
    }
  },

  // Table styling
  table: {
    '& .MuiTableCell-root': {
      color: 'white',
      borderColor: '#4a5568'
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      backgroundColor: '#2d3748',
      color: '#a0aec0',
      fontWeight: 'bold'
    }
  },

  // List styling
  list: {
    '& .MuiListItem-root': {
      color: 'white'
    },
    '& .MuiListItemText-primary': {
      color: 'white'
    },
    '& .MuiListItemText-secondary': {
      color: '#a0aec0'
    }
  },

  // Switch styling
  switch: {
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#3b82f6'
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#3b82f6'
    },
    '& .MuiSwitch-track': {
      backgroundColor: '#4a5568'
    }
  },

  // Chip styling
  chip: {
    backgroundColor: '#4a5568',
    color: 'white',
    '& .MuiChip-deleteIcon': {
      color: '#a0aec0',
      '&:hover': {
        color: 'white'
      }
    }
  },

  // Dialog styling
  dialog: {
    '& .MuiDialog-paper': {
      backgroundColor: '#2d3748',
      color: 'white'
    },
    '& .MuiDialogTitle-root': {
      color: 'white'
    },
    '& .MuiDialogContent-root': {
      color: 'white'
    }
  },

  // Alert styling
  alert: {
    error: {
      backgroundColor: '#7f1d1d',
      color: '#fecaca',
      '& .MuiAlert-icon': {
        color: '#ef4444'
      }
    },
    warning: {
      backgroundColor: '#78350f',
      color: '#fed7aa',
      '& .MuiAlert-icon': {
        color: '#f59e0b'
      }
    },
    info: {
      backgroundColor: '#1e3a8a',
      color: '#bfdbfe',
      '& .MuiAlert-icon': {
        color: '#3b82f6'
      }
    },
    success: {
      backgroundColor: '#14532d',
      color: '#bbf7d0',
      '& .MuiAlert-icon': {
        color: '#10b981'
      }
    }
  },

  // Menu styling
  menu: {
    '& .MuiPaper-root': {
      backgroundColor: '#2d3748',
      color: 'white'
    },
    '& .MuiMenuItem-root': {
      color: 'white',
      '&:hover': {
        backgroundColor: '#4a5568'
      }
    }
  }
};

export default darkThemeStyles;

