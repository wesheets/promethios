/**
 * MarkdownRenderer.tsx
 * 
 * Component for rendering markdown content with custom styling
 * to match the dark theme and improve readability
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Typography, Link, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for markdown elements
const StyledMarkdownContainer = styled(Box)(({ theme }) => ({
  '& h1': {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '1rem',
    marginTop: '1.5rem',
    borderBottom: '2px solid #374151',
    paddingBottom: '0.5rem',
  },
  '& h2': {
    fontSize: '1.3rem',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '0.75rem',
    marginTop: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  '& h3': {
    fontSize: '1.1rem',
    fontWeight: 500,
    color: '#e5e7eb',
    marginBottom: '0.5rem',
    marginTop: '1rem',
  },
  '& p': {
    fontSize: '0.9rem',
    color: '#d1d5db',
    lineHeight: 1.6,
    marginBottom: '0.75rem',
  },
  '& ul': {
    paddingLeft: '1.5rem',
    marginBottom: '0.75rem',
  },
  '& ol': {
    paddingLeft: '1.5rem',
    marginBottom: '0.75rem',
  },
  '& li': {
    fontSize: '0.9rem',
    color: '#d1d5db',
    lineHeight: 1.5,
    marginBottom: '0.25rem',
    '& strong': {
      color: '#ffffff',
      fontWeight: 600,
    },
  },
  '& strong': {
    color: '#ffffff',
    fontWeight: 600,
  },
  '& em': {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  '& code': {
    backgroundColor: '#1f2937',
    color: '#fbbf24',
    padding: '0.125rem 0.25rem',
    borderRadius: '0.25rem',
    fontSize: '0.85rem',
    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  '& pre': {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem',
    overflow: 'auto',
    '& code': {
      backgroundColor: 'transparent',
      color: '#e5e7eb',
      padding: 0,
    },
  },
  '& blockquote': {
    borderLeft: '4px solid #3b82f6',
    paddingLeft: '1rem',
    marginLeft: 0,
    marginBottom: '1rem',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  '& a': {
    color: '#3b82f6',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& hr': {
    border: 'none',
    borderTop: '1px solid #374151',
    margin: '1.5rem 0',
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '1rem',
    '& th': {
      backgroundColor: '#1f2937',
      color: '#ffffff',
      padding: '0.5rem',
      border: '1px solid #374151',
      fontWeight: 600,
    },
    '& td': {
      padding: '0.5rem',
      border: '1px solid #374151',
      color: '#d1d5db',
    },
  },
}));

interface MarkdownRendererProps {
  content: string;
  sx?: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, sx = {} }) => {
  // Custom components for specific markdown elements
  const components = {
    // Custom link component
    a: ({ href, children, ...props }: any) => (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ color: '#3b82f6', textDecoration: 'none' }}
        {...props}
      >
        {children}
      </Link>
    ),
    
    // Custom code block component
    pre: ({ children, ...props }: any) => (
      <Box
        component="pre"
        sx={{
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
          overflow: 'auto',
          fontSize: '0.85rem',
          fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        {...props}
      >
        {children}
      </Box>
    ),
    
    // Custom horizontal rule
    hr: (props: any) => (
      <Divider
        sx={{
          borderColor: '#374151',
          margin: '1.5rem 0',
        }}
        {...props}
      />
    ),
  };

  return (
    <StyledMarkdownContainer sx={sx}>
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </StyledMarkdownContainer>
  );
};

export default MarkdownRenderer;

