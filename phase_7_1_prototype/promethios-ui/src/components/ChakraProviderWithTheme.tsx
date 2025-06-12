import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Define a comprehensive theme that fixes all known issues
const theme = extendTheme({
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    bold: 700,
    extrabold: 800,
    // Add the missing fontWeightBold property
    fontWeightBold: 700,
  },
  colors: {
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    blue: {
      50: '#EBF8FF',
      100: '#BEE3F8',
      200: '#90CDF4',
      300: '#63B3ED',
      400: '#4299E1',
      500: '#3182CE',
      600: '#2B6CB0',
      700: '#2C5282',
      800: '#2A4365',
      900: '#1A365D',
    },
    brand: {
      50: '#e6f6ff',
      100: '#b3e0ff',
      200: '#80cbff',
      300: '#4db5ff',
      400: '#1a9fff',
      500: '#0080e6',
      600: '#0066b3',
      700: '#004d80',
      800: '#00334d',
      900: '#001a26',
    },
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#1A202C' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'black',
      }
    })
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'blue' ? 'blue.500' : 'gray.500',
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'blue' ? 'blue.600' : 'gray.600',
          },
        }),
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
      },
    },
    Text: {
      baseStyle: {
        fontWeight: 'normal',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'gray.800',
          borderRadius: 'lg',
          p: 4,
        },
      },
    },
    FormLabel: {
      baseStyle: {
        fontWeight: 'medium',
        color: 'gray.300',
      },
    },
    Input: {
      baseStyle: {
        field: {
          bg: 'gray.700',
          borderColor: 'gray.600',
          color: 'white',
          _placeholder: {
            color: 'gray.400',
          },
          _focus: {
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px #3182CE',
          },
        },
      },
    },
    Textarea: {
      baseStyle: {
        bg: 'gray.700',
        borderColor: 'gray.600',
        color: 'white',
        _placeholder: {
          color: 'gray.400',
        },
        _focus: {
          borderColor: 'blue.500',
          boxShadow: '0 0 0 1px #3182CE',
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          bg: 'gray.700',
          borderColor: 'gray.600',
          color: 'white',
          _focus: {
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px #3182CE',
          },
        },
      },
    },
  },
  // Add semantic tokens for better theme consistency
  semanticTokens: {
    colors: {
      'chakra-body-text': {
        _light: 'gray.800',
        _dark: 'whiteAlpha.900',
      },
      'chakra-body-bg': {
        _light: 'white',
        _dark: 'gray.800',
      },
      'chakra-border-color': {
        _light: 'gray.200',
        _dark: 'whiteAlpha.300',
      },
      'chakra-subtle-bg': {
        _light: 'gray.100',
        _dark: 'gray.700',
      },
      'chakra-subtle-text': {
        _light: 'gray.600',
        _dark: 'gray.400',
      },
    },
  },
});

// Create a wrapper component that provides the Chakra theme with error handling
const ChakraProviderWithTheme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add error boundary for Chakra UI components
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('ChakraProvider error:', error);
      if (error.message.includes('chakra') || error.message.includes('theme')) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Theme Error</h2>
        <p>There was an error loading the Chakra UI theme. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <ChakraProvider theme={theme} resetCSS={true}>
      {children}
    </ChakraProvider>
  );
};

export default ChakraProviderWithTheme;

