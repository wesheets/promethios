import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Define a custom theme to fix the issues with undefined properties
const theme = extendTheme({
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    bold: 700,
    // Add the missing fontWeightBold property
    fontWeightBold: 700,
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#1A202C',
        color: 'white',
      }
    }
  },
  // Add any other theme customizations needed
});

// Create a wrapper component that provides the Chakra theme
const ChakraProviderWithTheme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
};

export default ChakraProviderWithTheme;
