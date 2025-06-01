/**
 * Source List Component
 * 
 * This component displays a list of evidence sources used in verification.
 * It shows source names, reliability scores, and links when available.
 */

import React from 'react';
import { EvidenceSource } from '../types';

interface SourceListProps {
  /** Array of evidence sources */
  sources: EvidenceSource[];
  /** Maximum number of sources to display */
  maxItems?: number;
  /** CSS class name */
  className?: string;
}

/**
 * Source List Component
 */
const SourceList: React.FC<SourceListProps> = ({
  sources,
  maxItems,
  className = ''
}) => {
  // Limit sources if maxItems is specified
  const displaySources = maxItems ? sources.slice(0, maxItems) : sources;
  
  // Count hidden sources
  const hiddenCount = maxItems && sources.length > maxItems 
    ? sources.length - maxItems 
    : 0;
  
  return (
    <div className={`source-list ${className}`}>
      {displaySources.length === 0 ? (
        <p className="no-sources">No sources available</p>
      ) : (
        <ul className="sources">
          {displaySources.map((source, index) => (
            <li key={`source-${source.id || index}`} className="source-item">
              <div className="source-name">
                {source.url ? (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    {source.name}
                  </a>
                ) : (
                  <span>{source.name}</span>
                )}
              </div>
              <div className="source-reliability">
                <span className="reliability-label">Reliability:</span>
                <span className="reliability-value">
                  {Math.round(source.reliability * 100)}%
                </span>
              </div>
              {source.timestamp && (
                <div className="source-timestamp">
                  <span className="timestamp-label">Date:</span>
                  <span className="timestamp-value">
                    {new Date(source.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {hiddenCount > 0 && (
        <div className="hidden-sources">
          +{hiddenCount} more {hiddenCount === 1 ? 'source' : 'sources'}
        </div>
      )}
    </div>
  );
};

export default SourceList;
