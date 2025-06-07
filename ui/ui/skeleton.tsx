/**
 * Skeleton component for content placeholders during loading
 * 
 * This component provides a customizable skeleton for loading states
 */

import React from 'react';

export interface SkeletonProps {
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
 * Skeleton component for content placeholders during loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  'data-testid': dataTestId = 'skeleton',
}) => {
  return (
    <div 
      className={`skeleton ${className}`}
      data-testid={dataTestId}
    >
      <div className="skeleton-pulse"></div>
    </div>
  );
};
