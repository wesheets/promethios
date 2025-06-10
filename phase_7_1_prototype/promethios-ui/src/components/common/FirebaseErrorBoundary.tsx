import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  serviceName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Firebase-specific Error Boundary Component
 * 
 * This component provides specialized error handling for Firebase-related errors,
 * with detailed logging and user-friendly fallback UI.
 */
class FirebaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console with service context
    console.error(`Firebase Error in ${this.props.serviceName}:`, error);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to analytics or monitoring service in production
    // This would be implemented in a real application
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if a custom fallback was provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default Firebase error fallback UI
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Firebase Service Error: {this.props.serviceName}
          </h3>
          <p className="text-sm text-red-700 mb-3">
            There was an error connecting to Firebase. This might be due to network issues or service configuration.
          </p>
          {this.state.error && (
            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-32 mb-3">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;
