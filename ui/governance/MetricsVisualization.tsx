/**
 * Enhanced MetricsVisualization component with responsive design, accessibility, and animations
 * 
 * Displays governance metrics visualization for selected profiles with improved UX.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useState, useEffect, useRef } from 'react';
import { GovernanceDomain } from './types';
import { useGovernanceProfile } from './hooks';
import { LoadingSpinner } from '../components/loading-state';
import { ErrorHandler, useErrorHandler } from '../components/error-handling';

interface MetricsVisualizationProps {
  showComparison?: boolean;
  comparisonDomains?: GovernanceDomain[];
  className?: string;
  'data-testid'?: string;
}

export const MetricsVisualization: React.FC<MetricsVisualizationProps> = ({
  showComparison = false,
  comparisonDomains = [],
  className = '',
  'data-testid': dataTestId = 'metrics-visualization',
}) => {
  const { currentProfile, availableProfiles, currentDomain, loading, error } = useGovernanceProfile();
  const [isLoading, setIsLoading] = useState(loading);
  const { error: localError, handleError, resetError } = useErrorHandler();
  const [animateIn, setAnimateIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Update loading state when the hook's loading state changes
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);
  
  // Handle API errors
  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);
  
  // Trigger animation when profile changes
  useEffect(() => {
    if (currentProfile) {
      setAnimateIn(false);
      const timer = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [currentProfile]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Export data function
  const exportData = () => {
    if (!currentProfile) return;
    
    let content: string;
    const filename = `governance-metrics-${currentDomain}-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'json') {
      content = JSON.stringify(currentProfile, null, 2);
      downloadFile(`${filename}.json`, content, 'application/json');
    } else {
      // Create CSV content
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Trust Decay Rate', currentProfile.trustMetrics.trustDecayRate],
        ['Trust Recovery Rate', currentProfile.trustMetrics.trustRecoveryRate],
        ['Min Trust Threshold', currentProfile.trustMetrics.minTrustThreshold],
        ['Event Granularity', currentProfile.monitoring.eventGranularity],
        ['Reporting Frequency', `${currentProfile.monitoring.reportingFrequencyMs}ms`],
        ['State Preservation', currentProfile.recovery.statePreservationDepth],
        ['Max Recovery Attempts', currentProfile.recovery.maxRecoveryAttempts]
      ];
      
      content = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      downloadFile(`${filename}.csv`, content, 'text/csv');
    }
  };
  
  // Helper function to download file
  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  if (isLoading) {
    return (
      <div 
        className={`metrics-visualization loading ${className} ${theme}`} 
        data-testid={dataTestId}
        role="region" 
        aria-label="Loading governance metrics"
      >
        <LoadingSpinner data-testid="async-content-loading" />
        <div className="loading-text" aria-live="polite">Loading governance metrics...</div>
      </div>
    );
  }
  
  if (localError) {
    return (
      <div 
        className={`metrics-visualization error ${className} ${theme}`} 
        data-testid={dataTestId}
        role="alert"
      >
        <div className="error-message" data-testid="async-content-error">
          <h3>Error loading metrics</h3>
          <p>{localError.toString()}</p>
        </div>
        <button 
          onClick={resetError}
          className="retry-button"
          aria-label="Retry loading metrics"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!currentProfile) {
    return (
      <div 
        className={`metrics-visualization empty ${className} ${theme}`} 
        data-testid={dataTestId}
        role="region" 
        aria-label="No profile selected"
      >
        <div className="empty-state">
          <h3>No profile selected</h3>
          <p>Please select a governance profile to view metrics</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`metrics-visualization ${className} ${theme} ${animateIn ? 'animate-in' : ''}`} 
      data-testid={dataTestId}
      ref={contentRef}
      role="region" 
      aria-label="Governance metrics visualization"
    >
      <div className="metrics-header">
        <h2>Governance Metrics</h2>
        <div className="metrics-controls">
          <div className="theme-toggle">
            <button 
              onClick={toggleTheme} 
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="theme-button"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="export-controls">
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              aria-label="Select export format"
              className="export-format-select"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button 
              onClick={exportData} 
              aria-label={`Export data as ${exportFormat}`}
              className="export-button"
            >
              Export
            </button>
          </div>
        </div>
      </div>
      
      <div className="metrics-grid">
        <div className="metrics-section" tabIndex={0}>
          <h3>Trust Metrics</h3>
          <div className="metric-item">
            <span className="metric-label">Trust Decay Rate:</span>
            <span className="metric-value" aria-label={`Trust decay rate: ${currentProfile.trustMetrics.trustDecayRate}`}>
              {currentProfile.trustMetrics.trustDecayRate}
            </span>
            <div className="metric-bar" style={{width: `${currentProfile.trustMetrics.trustDecayRate * 100}%`}}></div>
          </div>
          <div className="metric-item">
            <span className="metric-label">Trust Recovery Rate:</span>
            <span className="metric-value" aria-label={`Trust recovery rate: ${currentProfile.trustMetrics.trustRecoveryRate}`}>
              {currentProfile.trustMetrics.trustRecoveryRate}
            </span>
            <div className="metric-bar" style={{width: `${currentProfile.trustMetrics.trustRecoveryRate * 100}%`}}></div>
          </div>
          <div className="metric-item">
            <span className="metric-label">Min Trust Threshold:</span>
            <span className="metric-value" aria-label={`Minimum trust threshold: ${currentProfile.trustMetrics.minTrustThreshold}`}>
              {currentProfile.trustMetrics.minTrustThreshold}
            </span>
            <div className="metric-bar" style={{width: `${currentProfile.trustMetrics.minTrustThreshold * 100}%`}}></div>
          </div>
        </div>
        
        <div className="metrics-section" tabIndex={0}>
          <h3>Monitoring</h3>
          <div className="metric-item">
            <span className="metric-label">Event Granularity:</span>
            <span className="metric-value" aria-label={`Event granularity: ${currentProfile.monitoring.eventGranularity}`}>
              {currentProfile.monitoring.eventGranularity}
            </span>
            <div className="metric-indicator">
              {Array.from({length: currentProfile.monitoring.eventGranularity}).map((_, i) => (
                <span key={i} className="indicator-dot"></span>
              ))}
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-label">Reporting Frequency:</span>
            <span className="metric-value" aria-label={`Reporting frequency: ${currentProfile.monitoring.reportingFrequencyMs} milliseconds`}>
              {currentProfile.monitoring.reportingFrequencyMs}ms
            </span>
            <div className="metric-scale">
              <span className="scale-label">Slow</span>
              <div className="scale-bar" style={{
                background: `linear-gradient(to right, 
                  var(--color-success) ${100 - (currentProfile.monitoring.reportingFrequencyMs / 100)}%, 
                  var(--color-warning) ${100 - (currentProfile.monitoring.reportingFrequencyMs / 100)}%)`
              }}></div>
              <span className="scale-label">Fast</span>
            </div>
          </div>
        </div>
        
        <div className="metrics-section" tabIndex={0}>
          <h3>Recovery</h3>
          <div className="metric-item">
            <span className="metric-label">State Preservation:</span>
            <span className="metric-value" aria-label={`State preservation depth: ${currentProfile.recovery.statePreservationDepth}`}>
              {currentProfile.recovery.statePreservationDepth}
            </span>
            <div className="state-preservation-visual">
              {Array.from({length: currentProfile.recovery.statePreservationDepth}).map((_, i) => (
                <div key={i} className="state-block" style={{opacity: 1 - (i * 0.2)}}></div>
              ))}
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-label">Max Recovery Attempts:</span>
            <span className="metric-value" aria-label={`Maximum recovery attempts: ${currentProfile.recovery.maxRecoveryAttempts}`}>
              {currentProfile.recovery.maxRecoveryAttempts}
            </span>
            <div className="recovery-attempts-visual">
              {Array.from({length: currentProfile.recovery.maxRecoveryAttempts}).map((_, i) => (
                <div key={i} className="attempt-icon">↻</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="impact-section">
        <h3>Governance Impact</h3>
        <p>
          These metrics directly influence how AI systems are governed and monitored.
          Strong governance settings help ensure responsible AI deployment and usage.
        </p>
        <div className="impact-visualization">
          <div className="impact-item">
            <div className="impact-icon">🛡️</div>
            <div className="impact-label">Protection</div>
            <div className="impact-value">{Math.round(currentProfile.trustMetrics.minTrustThreshold * 100)}%</div>
          </div>
          <div className="impact-item">
            <div className="impact-icon">⚖️</div>
            <div className="impact-label">Accountability</div>
            <div className="impact-value">{Math.round(currentProfile.monitoring.eventGranularity * 25)}%</div>
          </div>
          <div className="impact-item">
            <div className="impact-icon">🔄</div>
            <div className="impact-label">Resilience</div>
            <div className="impact-value">{Math.round(currentProfile.recovery.maxRecoveryAttempts * 33)}%</div>
          </div>
        </div>
      </div>
      
      {showComparison && (
        <div className="comparison-section" tabIndex={0} aria-label="Domain comparison">
          <h3>Domain Comparison</h3>
          <div className="comparison-table" role="table" aria-label="Governance metrics comparison across domains">
            <div className="comparison-row header" role="row">
              <div className="comparison-cell" role="columnheader">Domain</div>
              <div className="comparison-cell" role="columnheader">Trust Threshold</div>
              <div className="comparison-cell" role="columnheader">Recovery Attempts</div>
            </div>
            <div className="comparison-row" role="row">
              <div className="comparison-cell" role="cell">{currentDomain}</div>
              <div className="comparison-cell" role="cell">{currentProfile.trustMetrics.minTrustThreshold}</div>
              <div className="comparison-cell" role="cell">{currentProfile.recovery.maxRecoveryAttempts}</div>
            </div>
            {comparisonDomains.map(domain => {
              const profile = availableProfiles.find(p => p.id === domain);
              if (!profile) return null;
              
              return (
                <div className="comparison-row" key={domain} role="row">
                  <div className="comparison-cell" role="cell">{domain}</div>
                  <div className="comparison-cell" role="cell">{profile.trustMetrics?.minTrustThreshold || 'N/A'}</div>
                  <div className="comparison-cell" role="cell">{profile.recovery?.maxRecoveryAttempts || 'N/A'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="metrics-footer">
        <p className="governance-note">
          <strong>Why governance matters:</strong> Proper AI governance ensures systems operate within ethical boundaries,
          maintain accountability, and preserve trust. These metrics represent concrete measures that protect against misuse
          and ensure responsible AI deployment.
        </p>
      </div>
      
      {/* Add a hidden div for test detection */}
      <div data-testid="async-content-loaded" style={{ display: 'none' }}></div>
      
      <style jsx>{`
        .metrics-visualization {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .metrics-visualization.light {
          --color-bg: #ffffff;
          --color-text: #333333;
          --color-primary: #3a86ff;
          --color-secondary: #8338ec;
          --color-success: #06d6a0;
          --color-warning: #ffbe0b;
          --color-danger: #ef476f;
          --color-border: #e0e0e0;
          --color-card-bg: #f8f9fa;
          background-color: var(--color-bg);
          color: var(--color-text);
        }
        
        .metrics-visualization.dark {
          --color-bg: #1a1a2e;
          --color-text: #e6e6e6;
          --color-primary: #4cc9f0;
          --color-secondary: #7209b7;
          --color-success: #06d6a0;
          --color-warning: #ffd166;
          --color-danger: #ef476f;
          --color-border: #2a2a3a;
          --color-card-bg: #16213e;
          background-color: var(--color-bg);
          color: var(--color-text);
        }
        
        .metrics-visualization.animate-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid var(--color-border);
          padding-bottom: 1rem;
        }
        
        .metrics-controls {
          display: flex;
          gap: 1rem;
        }
        
        .theme-button, .export-button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          background-color: var(--color-card-bg);
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .theme-button:hover, .export-button:hover {
          background-color: var(--color-primary);
          color: white;
        }
        
        .export-format-select {
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          background-color: var(--color-card-bg);
          color: var(--color-text);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .metrics-section {
          background-color: var(--color-card-bg);
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .metrics-section:hover, .metrics-section:focus {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }
        
        .metrics-section h3 {
          margin-top: 0;
          color: var(--color-primary);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .metric-item {
          margin-bottom: 1.5rem;
        }
        
        .metric-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .metric-value {
          display: inline-block;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }
        
        .metric-bar {
          height: 8px;
          background-color: var(--color-primary);
          border-radius: 4px;
          transition: width 1s ease-out;
        }
        
        .metric-indicator {
          display: flex;
          gap: 5px;
          margin-top: 0.5rem;
        }
        
        .indicator-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: var(--color-secondary);
          display: inline-block;
        }
        
        .metric-scale {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .scale-bar {
          flex-grow: 1;
          height: 8px;
          border-radius: 4px;
          transition: background 0.5s ease;
        }
        
        .scale-label {
          font-size: 0.8rem;
          color: var(--color-text);
          opacity: 0.7;
        }
        
        .state-preservation-visual, .recovery-attempts-visual {
          display: flex;
          gap: 5px;
          margin-top: 0.5rem;
        }
        
        .state-block {
          width: 20px;
          height: 20px;
          background-color: var(--color-success);
          border-radius: 4px;
        }
        
        .attempt-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-warning);
          border-radius: 50%;
          font-weight: bold;
        }
        
        .impact-section {
          background-color: var(--color-card-bg);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .impact-section h3 {
          color: var(--color-primary);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .impact-visualization {
          display: flex;
          justify-content: space-around;
          margin-top: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .impact-item {
          text-align: center;
          padding: 1rem;
          border-radius: 8px;
          background-color: var(--color-bg);
          min-width: 120px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .impact-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .impact-label {
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .impact-value {
          font-weight: 700;
          font-size: 1.5rem;
          color: var(--color-primary);
        }
        
        .comparison-section {
          background-color: var(--color-card-bg);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }
        
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .comparison-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid var(--color-border);
        }
        
        .comparison-row.header {
          font-weight: 700;
          background-color: var(--color-bg);
        }
        
        .comparison-cell {
          padding: 0.75rem;
          text-align: left;
        }
        
        .metrics-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border);
        }
        
        .governance-note {
          font-style: italic;
          opacity: 0.9;
          line-height: 1.6;
        }
        
        /* Loading state */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }
        
        .loading-text {
          margin-top: 1rem;
          font-style: italic;
        }
        
        /* Error state */
        .error {
          padding: 2rem;
          text-align: center;
          background-color: var(--color-card-bg);
          border-radius: 8px;
          border: 1px solid var(--color-danger);
        }
        
        .error-message {
          margin-bottom: 1.5rem;
          color: var(--color-danger);
        }
        
        .retry-button {
          padding: 0.75rem 1.5rem;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }
        
        .retry-button:hover {
          background-color: var(--color-secondary);
        }
        
        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .metrics-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .metrics-controls {
            width: 100%;
            justify-content: space-between;
          }
          
          .comparison-row {
            grid-template-columns: repeat(3, minmax(100px, 1fr));
          }
          
          .impact-visualization {
            flex-direction: column;
            align-items: center;
          }
          
          .impact-item {
            width: 100%;
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};
