/**
 * Enhanced loading state component for Promethios UI
 * 
 * This component provides consistent loading indicators across the application
 * with support for different sizes, types, and customization options.
 */

import React from 'react';
import { Spinner } from '../ui/spinner';
import { Skeleton } from '../ui/skeleton';

export interface LoadingStateProps {
  /**
   * Type of loading indicator to display
   */
  type?: 'spinner' | 'skeleton' | 'progress';
  
  /**
   * Size of the loading indicator
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Text to display alongside the loading indicator
   */
  text?: string;
  
  /**
   * Whether to show the loading indicator inline or as a full overlay
   */
  overlay?: boolean;
  
  /**
   * Duration in milliseconds before showing the loading indicator
   * Prevents flashing for quick operations
   */
  delay?: number;
  
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
 * LoadingState component for consistent loading indicators across the application
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  size = 'medium',
  text,
  overlay = false,
  delay = 300,
  className = '',
  'data-testid': dataTestId = 'loading-state',
}) => {
  const [showLoading, setShowLoading] = React.useState(delay === 0);
  
  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);
  
  if (!showLoading) {
    return null;
  }
  
  const containerClasses = `loading-state ${size} ${overlay ? 'overlay' : ''} ${className}`;
  
  const renderLoadingIndicator = () => {
    switch (type) {
      case 'skeleton':
        return (
          <div className="skeleton-container">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </div>
        );
      case 'progress':
        return (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-value" />
            </div>
          </div>
        );
      case 'spinner':
      default:
        return <Spinner size={size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'default'} />;
    }
  };
  
  return (
    <div className={containerClasses} data-testid={dataTestId}>
      <div className="loading-indicator">
        {renderLoadingIndicator()}
        {text && <div className="loading-text">{text}</div>}
      </div>
    </div>
  );
};

/**
 * Skeleton component for content placeholders during loading
 */
export interface ContentSkeletonProps {
  /**
   * Number of rows to display
   */
  rows?: number;
  
  /**
   * Whether to include a header skeleton
   */
  header?: boolean;
  
  /**
   * Custom class name for styling
   */
  className?: string;
  
  /**
   * Data test ID for testing
   */
  'data-testid'?: string;
}

export const ContentSkeleton: React.FC<ContentSkeletonProps> = ({
  rows = 3,
  header = true,
  className = '',
  'data-testid': dataTestId = 'content-skeleton',
}) => {
  return (
    <div className={`content-skeleton ${className}`} data-testid={dataTestId}>
      {header && (
        <div className="skeleton-header">
          <Skeleton className="h-8 w-1/3 mb-4" />
        </div>
      )}
      <div className="skeleton-body">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton 
            key={index} 
            className={`h-4 w-${Math.max(5, 10 - index)}/${Math.max(6, 12 - index)} mb-2`} 
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Component to wrap async content with loading states
 */
export interface AsyncContentProps {
  /**
   * Whether the content is loading
   */
  isLoading: boolean;
  
  /**
   * Error object if the content failed to load
   */
  error?: Error | null;
  
  /**
   * Content to display when loaded
   */
  children: React.ReactNode;
  
  /**
   * Type of loading indicator to display
   */
  loadingType?: 'spinner' | 'skeleton' | 'progress';
  
  /**
   * Loading text to display
   */
  loadingText?: string;
  
  /**
   * Delay before showing loading indicator
   */
  loadingDelay?: number;
  
  /**
   * Function to retry loading on error
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

export const AsyncContent: React.FC<AsyncContentProps> = ({
  isLoading,
  error,
  children,
  loadingType = 'skeleton',
  loadingText,
  loadingDelay = 300,
  onRetry,
  className = '',
  'data-testid': dataTestId = 'async-content',
}) => {
  if (isLoading) {
    return (
      <LoadingState 
        type={loadingType}
        text={loadingText}
        delay={loadingDelay}
        data-testid={`${dataTestId}-loading`}
      />
    );
  }
  
  if (error) {
    return (
      <div className="error-container" data-testid={`${dataTestId}-error`}>
        <div className="error-icon">⚠️</div>
        <div className="error-message">{error.message || 'An error occurred'}</div>
        {onRetry && (
          <button 
            className="retry-button" 
            onClick={onRetry}
            data-testid={`${dataTestId}-retry`}
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={`async-content ${className}`} data-testid={dataTestId}>
      {children}
    </div>
  );
};
