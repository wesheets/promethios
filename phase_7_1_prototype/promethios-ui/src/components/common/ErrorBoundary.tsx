/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the component tree
 * Provides graceful error handling with user-friendly fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service in production
    if (import.meta.env.MODE === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              bgcolor: '#1e293b', 
              border: '1px solid #ef4444',
              borderRadius: 2
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <BugIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
              <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
                We encountered an unexpected error. Don't worry, your data is safe.
              </Typography>
            </Box>

            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: '#fef2f2',
                '& .MuiAlert-icon': { color: '#ef4444' }
              }}
            >
              <AlertTitle>Error Details</AlertTitle>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                {this.state.error?.message || 'Unknown error occurred'}
              </Typography>
            </Alert>

            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' }
                }}
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                sx={{
                  borderColor: '#6b7280',
                  color: '#6b7280',
                  '&:hover': { 
                    borderColor: '#9ca3af',
                    color: '#9ca3af'
                  }
                }}
              >
                Go Home
              </Button>
            </Box>

            {/* Development error details */}
            {import.meta.env.MODE === 'development' && this.state.errorInfo && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Development Error Details:
                </Typography>
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#0f172a',
                    border: '1px solid #374151',
                    maxHeight: 300,
                    overflow: 'auto'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    component="pre"
                    sx={{ 
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;

