import React from 'react';
import './SpinnerLoader.css';

interface SpinnerLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  subtext?: string;
  className?: string;
}

export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({
  size = 'medium',
  color = 'primary',
  text,
  subtext,
  className = ''
}) => {
  return (
    <div className={`spinner-loader ${size} ${color} ${className}`}>
      <div className="spinner-container">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
      </div>
      
      {(text || subtext) && (
        <div className="spinner-content">
          {text && <div className="spinner-text">{text}</div>}
          {subtext && <div className="spinner-subtext">{subtext}</div>}
        </div>
      )}
    </div>
  );
};

// Professional Dashboard Spinner
export const DashboardSpinnerLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  error?: string | null;
  retryAction?: () => void;
}> = ({ isLoading, children, error, retryAction }) => {
  // Error state
  if (error) {
    return (
      <div className="dashboard-loader-container error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <h3>Unable to Load Dashboard</h3>
            <p>{error}</p>
            {retryAction && (
              <button className="retry-button" onClick={retryAction}>
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Always show children - no loading spinner
  return <>{children}</>;
};

// Compact Spinner for smaller components
export const CompactSpinnerLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}> = ({ isLoading, children, text = "Loading..." }) => {
  if (isLoading) {
    return (
      <div className="compact-loader-container">
        <SpinnerLoader 
          size="small" 
          color="primary"
          text={text}
        />
      </div>
    );
  }

  return <>{children}</>;
};

// Overlay Spinner for full-screen loading
export const OverlaySpinnerLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  subtext?: string;
}> = ({ isLoading, children, text = "Loading", subtext }) => {
  return (
    <div className="overlay-loader-container">
      {children}
      {isLoading && (
        <div className="overlay-backdrop">
          <div className="overlay-content">
            <SpinnerLoader 
              size="large" 
              color="white"
              text={text}
              subtext={subtext}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinnerLoader;

