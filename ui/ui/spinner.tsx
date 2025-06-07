/**
 * Spinner component for loading indicators
 * 
 * This component provides a customizable spinner for loading states
 */

import React from 'react';

export interface SpinnerProps {
  /**
   * Size of the spinner
   */
  size?: 'sm' | 'default' | 'lg';
  
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
 * Spinner component for loading indicators
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'default',
  className = '',
  'data-testid': dataTestId = 'spinner',
}) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : 'spinner-default';
  
  return (
    <div 
      className={`spinner ${sizeClass} ${className}`}
      data-testid={dataTestId}
    >
      <div className="spinner-inner"></div>
    </div>
  );
};
