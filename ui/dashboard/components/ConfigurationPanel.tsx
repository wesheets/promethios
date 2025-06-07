/**
 * Configuration Panel component for the Developer Dashboard
 * 
 * Allows users to configure governance settings.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSpinner } from '../../components/loading-state';
import { ErrorBoundary } from '../../components/error-handling';

export const ConfigurationPanel: React.FC = () => {
  const { 
    loading,
    error,
    updateConfig
  } = useDashboard();
  
  // Local state for form values
  const [trustThreshold, setTrustThreshold] = useState<string>('0.75');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Clear any previous messages
      setSuccessMessage(null);
      
      // Submit configuration update
      const result = await updateConfig({
        trustThreshold: parseFloat(trustThreshold)
      });
      
      // Show success message
      if (result.success) {
        setSuccessMessage('Configuration updated successfully');
      }
    } catch (err) {
      // Error handling is done by the context
      console.error('Failed to update configuration:', err);
    }
  };
  
  return (
    <div className="configuration-panel">
      <h2>Governance Configuration</h2>
      
      {/* Success message */}
      {successMessage && (
        <div className="success-message" data-testid="config-success">
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-message" data-testid="config-error">
          {error}
        </div>
      )}
      
      {/* Configuration form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="trust-threshold">Trust Threshold</label>
          <input
            type="number"
            id="trust-threshold"
            aria-label="Trust Threshold"
            value={trustThreshold}
            onChange={(e) => setTrustThreshold(e.target.value)}
            min="0"
            max="1"
            step="0.01"
            disabled={loading}
          />
          <div className="input-description">
            Minimum trust score required for agent deployment (0-1)
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? <LoadingSpinner size="small" /> : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
