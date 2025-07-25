import { createTheme } from '@mui/material/styles';

// Dark theme configuration to match the main Promethios site
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo primary color
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Pink secondary color
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f172a', // Very dark blue background
      paper: '#1e293b', // Slightly lighter for cards/papers
    },
    text: {
      primary: '#f8fafc', // Very light text
      secondary: '#cbd5e1', // Medium light text
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    divider: '#475569',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#f8fafc',
    },
    h2: {
      fontWeight: 600,
      color: '#f8fafc',
    },
    h3: {
      fontWeight: 600,
      color: '#f8fafc',
    },
    h4: {
      fontWeight: 600,
      color: '#f8fafc',
    },
    h5: {
      fontWeight: 600,
      color: '#f8fafc',
    },
    h6: {
      fontWeight: 600,
      color: '#f8fafc',
    },
    body1: {
      color: '#e2e8f0',
    },
    body2: {
      color: '#cbd5e1',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0f172a',
          color: '#f8fafc',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          borderRadius: 12,
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          borderRadius: 8,
          border: '1px solid #334155',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
          },
        },
        outlined: {
          borderColor: '#475569',
          '&:hover': {
            borderColor: '#64748b',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0f172a',
            '& fieldset': {
              borderColor: '#475569',
            },
            '&:hover fieldset': {
              borderColor: '#64748b',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366f1',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#cbd5e1',
            '&.Mui-focused': {
              color: '#6366f1',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#f8fafc',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f172a',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#475569',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#64748b',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366f1',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          '&:hover': {
            backgroundColor: '#334155',
          },
          '&.Mui-selected': {
            backgroundColor: '#6366f1',
            '&:hover': {
              backgroundColor: '#4f46e5',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#334155',
          color: '#f8fafc',
          '&.MuiChip-filled': {
            '&.MuiChip-colorPrimary': {
              backgroundColor: '#6366f1',
              color: '#ffffff',
            },
            '&.MuiChip-colorSecondary': {
              backgroundColor: '#ec4899',
              color: '#ffffff',
            },
          },
          '&.MuiChip-outlined': {
            borderColor: '#475569',
            color: '#cbd5e1',
            '&:hover': {
              backgroundColor: 'rgba(100, 116, 139, 0.1)',
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#334155',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#475569',
          color: '#f8fafc',
        },
        head: {
          backgroundColor: '#334155',
          color: '#f8fafc',
          fontWeight: 600,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: '#cbd5e1',
          '&.Mui-active': {
            color: '#6366f1',
          },
          '&.Mui-completed': {
            color: '#10b981',
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: '#475569',
          '&.Mui-active': {
            color: '#6366f1',
          },
          '&.Mui-completed': {
            color: '#10b981',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardInfo: {
          backgroundColor: '#1e3a8a',
          color: '#dbeafe',
          '& .MuiAlert-icon': {
            color: '#60a5fa',
          },
        },
        standardSuccess: {
          backgroundColor: '#064e3b',
          color: '#d1fae5',
          '& .MuiAlert-icon': {
            color: '#34d399',
          },
        },
        standardWarning: {
          backgroundColor: '#92400e',
          color: '#fef3c7',
          '& .MuiAlert-icon': {
            color: '#fbbf24',
          },
        },
        standardError: {
          backgroundColor: '#991b1b',
          color: '#fecaca',
          '& .MuiAlert-icon': {
            color: '#f87171',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#6366f1',
        },
        track: {
          backgroundColor: '#6366f1',
        },
        rail: {
          backgroundColor: '#475569',
        },
        thumb: {
          backgroundColor: '#6366f1',
          '&:hover': {
            boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
          },
        },
        mark: {
          backgroundColor: '#64748b',
        },
        markLabel: {
          color: '#cbd5e1',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase': {
            '&.Mui-checked': {
              color: '#6366f1',
              '& + .MuiSwitch-track': {
                backgroundColor: '#6366f1',
              },
            },
          },
          '& .MuiSwitch-track': {
            backgroundColor: '#475569',
          },
        },
      },
    },
  },
});

