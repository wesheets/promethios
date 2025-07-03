import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2BFFC6',
      dark: '#22D6A7',
      light: '#4CFFDB',
    },
    secondary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#4791db',
    },
    background: {
      default: '#0D1117',
      paper: '#1A2233',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B8C4',
    },
    divider: '#2A3343',
    error: {
      main: '#FF4C4C',
    },
    warning: {
      main: '#FF9800',
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: '#FFFFFF',
    },
    h2: {
      color: '#FFFFFF',
    },
    h3: {
      color: '#FFFFFF',
    },
    h4: {
      color: '#FFFFFF',
    },
    h5: {
      color: '#FFFFFF',
    },
    h6: {
      color: '#FFFFFF',
    },
    body1: {
      color: '#FFFFFF',
    },
    body2: {
      color: '#B0B8C4',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A2233',
          border: '1px solid #2A3343',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A2233',
          border: '1px solid #2A3343',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#FFFFFF',
            backgroundColor: '#2A3343',
            '& fieldset': {
              borderColor: '#2A3343',
            },
            '&:hover fieldset': {
              borderColor: '#2BFFC6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2BFFC6',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#B0B8C4',
            '&.Mui-focused': {
              color: '#2BFFC6',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          backgroundColor: '#2A3343',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2A3343',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2BFFC6',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2BFFC6',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        contained: {
          backgroundColor: '#2BFFC6',
          color: '#0D1117',
          '&:hover': {
            backgroundColor: '#22D6A7',
          },
        },
        outlined: {
          borderColor: '#2A3343',
          color: '#FFFFFF',
          '&:hover': {
            borderColor: '#2BFFC6',
            backgroundColor: 'rgba(43, 255, 198, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#2A3343',
          color: '#FFFFFF',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A2233',
          color: '#FFFFFF',
          border: '1px solid #2A3343',
        },
        standardError: {
          backgroundColor: 'rgba(255, 76, 76, 0.1)',
          border: '1px solid #FF4C4C',
          color: '#FF4C4C',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid #FF9800',
          color: '#FF9800',
        },
        standardSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid #4CAF50',
          color: '#4CAF50',
        },
        standardInfo: {
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          border: '1px solid #1976d2',
          color: '#1976d2',
        },
      },
    },
  },
});

