import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'card' | 'metric' | 'chart' | 'list' | 'text' | 'avatar';
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 1,
  height,
  width,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`skeleton-card ${className}`}>
            <div className="skeleton-header">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-title"></div>
            </div>
            <div className="skeleton-content">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          </div>
        );

      case 'metric':
        return (
          <div className={`skeleton-metric ${className}`}>
            <div className="skeleton-metric-value"></div>
            <div className="skeleton-metric-label"></div>
          </div>
        );

      case 'chart':
        return (
          <div className={`skeleton-chart ${className}`} style={{ height: height || '200px', width: width || '100%' }}>
            <div className="skeleton-chart-bars">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-bar" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`skeleton-list ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="skeleton-list-item">
                <div className="skeleton-avatar small"></div>
                <div className="skeleton-list-content">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className={`skeleton-text ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className={`skeleton-line ${i === count - 1 ? 'short' : ''}`}></div>
            ))}
          </div>
        );

      case 'avatar':
        return <div className={`skeleton-avatar ${className}`} style={{ height, width }}></div>;

      default:
        return <div className={`skeleton-default ${className}`} style={{ height, width }}></div>;
    }
  };

  return (
    <div className="skeleton-container">
      {count > 1 && type !== 'list' && type !== 'text'
        ? [...Array(count)].map((_, i) => (
            <div key={i} className="skeleton-item">
              {renderSkeleton()}
            </div>
          ))
        : renderSkeleton()
      }
    </div>
  );
};

export default SkeletonLoader;

