import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './AtlasBubble.css';

export type AtlasPosition = 'bottom-right' | 'centered' | 'full-width' | 'right-side';

export type AtlasContext = 'default' | 'onboarding' | 'violation' | 'sandbox';

interface AtlasBubbleProps {
  context?: AtlasContext;
  trustScore?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

/**
 * AtlasBubble - The entry point component for the ATLAS Companion Agent
 * 
 * This component serves as the primary interface for users to interact with
 * the ATLAS (Accountability, Transparency, and Liaison Agent System) which
 * acts as the constitutional narrator for Promethios governance.
 */
const AtlasBubble: React.FC<AtlasBubbleProps> = ({
  context = 'default',
  trustScore = 95,
  isExpanded = false,
  onToggleExpand = () => {},
  className = '',
}) => {
  // Determine position based on context
  const getPositionClass = (): AtlasPosition => {
    switch(context) {
      case 'onboarding':
        return 'centered';
      case 'violation':
        return 'full-width';
      case 'sandbox':
        return 'right-side';
      default:
        return 'bottom-right';
    }
  };

  // Get trust score color
  const getTrustColor = (score: number): string => {
    if (score >= 90) return 'var(--color-trust-high)';
    if (score >= 70) return 'var(--color-trust-medium)';
    return 'var(--color-trust-low)';
  };

  const positionClass = getPositionClass();
  const trustColor = getTrustColor(trustScore);

  return (
    <motion.div 
      className={`atlas-bubble ${positionClass} ${isExpanded ? 'expanded' : ''} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="atlas-badge" onClick={onToggleExpand}>
        <div className="atlas-icon">A</div>
        <div className="trust-indicator" style={{ backgroundColor: trustColor }}></div>
        
        {!isExpanded && (
          <div className="atlas-label">
            <span>Ask ATLAS</span>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <motion.div 
          className="atlas-expanded-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="atlas-header">
            <h3>ATLAS: Constitutional Liaison</h3>
            <div className="governance-status">
              <span>Governed by Promethios</span>
              <span className="trust-score">{trustScore}%</span>
            </div>
            <button className="close-button" onClick={onToggleExpand}>×</button>
          </div>
          
          <div className="atlas-content">
            {/* Content will be replaced with AtlasChat component */}
            <div className="placeholder-content">
              <p>ATLAS interface is initializing...</p>
              <p>How can I help you understand Promethios governance?</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AtlasBubble;
