import React, { useState, useEffect } from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { DashboardSpinnerLoader } from './SpinnerLoader';
import './ProgressiveLoader.css';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  isLoading: boolean;
  loadingStages?: LoadingStage[];
  currentStage?: number;
  progress?: number;
  error?: string | null;
  retryAction?: () => void;
  fallbackComponent?: React.ReactNode;
  skeletonType?: 'card' | 'metric' | 'chart' | 'list' | 'text';
  skeletonCount?: number;
  showProgress?: boolean;
  showStageInfo?: boolean;
  className?: string;
}

interface LoadingStage {
  id: number;
  name: string;
  description?: string;
  estimatedTime?: number;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  children,
  isLoading,
  loadingStages = [],
  currentStage = 0,
  progress = 0,
  error = null,
  retryAction,
  fallbackComponent,
  skeletonType = 'card',
  skeletonCount = 3,
  showProgress = true,
  showStageInfo = true,
  className = ''
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentStageInfo, setCurrentStageInfo] = useState<LoadingStage | null>(null);

  // Smooth progress animation
  useEffect(() => {
    if (progress > displayProgress) {
      const increment = Math.min(2, progress - displayProgress);
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(progress, prev + increment));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress]);

  // Update current stage info
  useEffect(() => {
    if (loadingStages.length > 0 && currentStage < loadingStages.length) {
      setCurrentStageInfo(loadingStages[currentStage]);
    }
  }, [currentStage, loadingStages]);

  // Error state
  if (error) {
    return (
      <div className={`progressive-loader error ${className}`}>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Loading Error</h3>
            <p>{error}</p>
            {retryAction && (
              <button className="retry-button" onClick={retryAction}>
                Try Again
              </button>
            )}
          </div>
        </div>
        {fallbackComponent && (
          <div className="fallback-content">
            {fallbackComponent}
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`progressive-loader loading ${className}`}>
        {showProgress && (
          <div className="loading-header">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${displayProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {Math.round(displayProgress)}%
              </div>
            </div>
            
            {showStageInfo && currentStageInfo && (
              <div className="stage-info">
                <div className="stage-name">{currentStageInfo.name}</div>
                {currentStageInfo.description && (
                  <div className="stage-description">{currentStageInfo.description}</div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="skeleton-content">
          <SkeletonLoader 
            type={skeletonType} 
            count={skeletonCount}
          />
        </div>
        
        {fallbackComponent && (
          <div className="partial-content">
            {fallbackComponent}
          </div>
        )}
      </div>
    );
  }

  // Loaded state
  return (
    <div className={`progressive-loader loaded ${className}`}>
      {children}
    </div>
  );
};

// Specialized progressive loaders for common use cases
export const DashboardProgressiveLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  error?: string | null;
  retryAction?: () => void;
}> = ({ isLoading, children, error, retryAction }) => {
  return (
    <DashboardSpinnerLoader
      isLoading={isLoading}
      error={error}
      retryAction={retryAction}
    >
      {children}
    </DashboardSpinnerLoader>
  );
};

export const AgentListProgressiveLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  agentCount?: number;
  error?: string | null;
  retryAction?: () => void;
}> = ({ isLoading, children, agentCount = 0, error, retryAction }) => {
  const agentStages: LoadingStage[] = [
    { id: 0, name: "Loading Agent List", description: "Fetching agent configurations..." },
    { id: 1, name: "Loading Scorecards", description: "Retrieving performance metrics..." },
    { id: 2, name: "Processing Data", description: "Calculating agent statistics..." }
  ];

  return (
    <ProgressiveLoader
      isLoading={isLoading}
      loadingStages={agentStages}
      skeletonType="list"
      skeletonCount={Math.max(3, agentCount)}
      error={error}
      retryAction={retryAction}
      showProgress={true}
      showStageInfo={true}
    >
      {children}
    </ProgressiveLoader>
  );
};

export const ChartProgressiveLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  error?: string | null;
  retryAction?: () => void;
}> = ({ isLoading, children, error, retryAction }) => {
  return (
    <ProgressiveLoader
      isLoading={isLoading}
      skeletonType="chart"
      skeletonCount={1}
      error={error}
      retryAction={retryAction}
      showProgress={false}
      showStageInfo={false}
    >
      {children}
    </ProgressiveLoader>
  );
};

export default ProgressiveLoader;

