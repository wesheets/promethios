/**
 * Confidence Badge Component
 * 
 * This component displays a confidence or accuracy score as a colored badge.
 * It provides visual indication of score levels with appropriate colors.
 */

import React from 'react';

interface ConfidenceBadgeProps {
  /** Score value (0-1) */
  score: number;
  /** Type of score */
  type?: 'confidence' | 'accuracy';
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** CSS class name */
  className?: string;
}

/**
 * Confidence Badge Component
 */
const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  type = 'confidence',
  size = 'md',
  className = ''
}) => {
  // Format score as percentage
  const percentage = Math.round(score * 100);
  
  // Determine color based on score
  const getColorClass = () => {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium-high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'medium-low';
    return 'low';
  };
  
  // Determine size class
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'small';
      case 'lg': return 'large';
      default: return 'medium';
    }
  };
  
  // Get label based on type
  const getLabel = () => {
    return type === 'confidence' ? 'Confidence' : 'Accuracy';
  };
  
  return (
    <div className={`confidence-badge ${getColorClass()} ${getSizeClass()} ${className}`}>
      <span className="badge-label">{getLabel()}</span>
      <span className="badge-value">{percentage}%</span>
    </div>
  );
};

export default ConfidenceBadge;
