import React from 'react';

/**
 * Error Boundary for Gamification Features
 * 
 * Ensures that if gamification components fail, the app continues to work
 * without the enhanced features.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class GamificationErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Gamification feature failed, continuing without enhanced features:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

/**
 * Optional Component Wrapper
 * 
 * Safely renders components that might not be available, with graceful fallbacks.
 */
interface OptionalComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  condition?: boolean;
}

const OptionalComponent: React.FC<OptionalComponentProps> = ({ 
  children, 
  fallback = null, 
  condition = true 
}) => {
  if (!condition) return fallback;

  return (
    <GamificationErrorBoundary fallback={fallback}>
      {children}
    </GamificationErrorBoundary>
  );
};

/**
 * Backward Compatible Hook
 * 
 * Safely accesses context hooks with fallbacks for missing providers.
 */
export const useOptionalContext = <T,>(
  hookFn: () => T,
  fallback: T
): T => {
  try {
    return hookFn();
  } catch (error) {
    console.warn('Context not available, using fallback:', error);
    return fallback;
  }
};

export { GamificationErrorBoundary, OptionalComponent };
export default GamificationErrorBoundary;

