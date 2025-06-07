/**
 * Error handling components for Promethios UI
 * 
 * This module provides comprehensive error handling components including:
 * - ErrorBoundary: React error boundary for catching component errors
 * - ErrorDisplay: Component for displaying errors with retry functionality
 * - useErrorHandler: Hook for handling errors in functional components
 */

import React, { Component, useCallback, useState } from 'react';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /**
   * Content to render when no error has occurred
   */
  children: React.ReactNode;
  
  /**
   * Custom fallback component to render when an error occurs
   * If not provided, a default error UI will be used
   */
  fallback?: React.ReactNode | ((error: Error, resetError: () => void) => React.ReactNode);
  
  /**
   * Callback function called when an error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  /**
   * Custom class name for styling
   */
  className?: string;
  
  /**
   * Data test ID for testing
   */
  'data-testid'?: string;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component for catching and handling errors in React components
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error to monitoring service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, className = '', 'data-testid': dataTestId = 'error-boundary' } = this.props;

    if (hasError && error) {
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetError);
        }
        return fallback;
      }

      return (
        <div className={`error-boundary ${className}`} data-testid={dataTestId}>
          <ErrorDisplay 
            error={error} 
            onRetry={this.resetError} 
            data-testid={`${dataTestId}-display`}
          />
        </div>
      );
    }

    return children;
  }
}

/**
 * Props for the ErrorDisplay component
 */
export interface ErrorDisplayProps {
  /**
   * Error object to display
   */
  error: Error;
  
  /**
   * Title for the error display
   */
  title?: string;
  
  /**
   * Whether to show the error details (stack trace)
   */
  showDetails?: boolean;
  
  /**
   * Callback function for retry action
   */
  onRetry?: () => void;
  
  /**
   * Custom class name for styling
   */
  className?: string;
  
  /**
   * Data test ID for testing
   */
  'data-testid'?: string;
}

/**
 * ErrorDisplay component for displaying errors with retry functionality
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'Something went wrong',
  showDetails = false,
  onRetry,
  className = '',
  'data-testid': dataTestId = 'error-display'
}) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(showDetails);

  const toggleDetails = useCallback(() => {
    setIsDetailsVisible(prev => !prev);
  }, []);

  return (
    <div className={`error-display ${className}`} data-testid={dataTestId}>
      <div className="error-display-icon">⚠️</div>
      <h3 className="error-display-title">{title}</h3>
      <p className="error-display-message">{error.message}</p>
      
      {error.stack && (
        <div className="error-display-details">
          <button 
            className="error-display-toggle" 
            onClick={toggleDetails}
            data-testid={`${dataTestId}-toggle`}
          >
            {isDetailsVisible ? 'Hide details' : 'Show details'}
          </button>
          
          {isDetailsVisible && (
            <pre className="error-display-stack" data-testid={`${dataTestId}-stack`}>
              {error.stack}
            </pre>
          )}
        </div>
      )}
      
      {onRetry && (
        <button 
          className="error-display-retry" 
          onClick={onRetry}
          data-testid={`${dataTestId}-retry`}
        >
          Try again
        </button>
      )}
    </div>
  );
};

/**
 * Hook for handling errors in functional components
 * 
 * @param onError Optional callback function called when an error occurs
 * @returns Object with error state and error handling functions
 */
export const useErrorHandler = (onError?: (error: Error) => void) => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    if (onError) {
      onError(error);
    }
    console.error('Error caught by useErrorHandler:', error);
  }, [onError]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    resetError,
    hasError: error !== null
  };
};

/**
 * Higher-order component for adding error handling to components
 * 
 * @param Component Component to wrap with error handling
 * @param fallback Custom fallback component to render when an error occurs
 * @returns Wrapped component with error handling
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode | ((error: Error, resetError: () => void) => React.ReactNode)
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  WrappedComponent.displayName = `withErrorHandling(${displayName})`;
  
  return WrappedComponent;
}
