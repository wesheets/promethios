/**
 * Lifecycle Migration Panel
 * 
 * UI component for running lifecycle migrations and viewing migration status.
 * Provides an easy interface for users to backfill lifecycle events for existing agents.
 */

import React, { useState, useEffect } from 'react';
import { 
  lifecycleMigrationRunner, 
  MigrationProgress, 
  MigrationOptions 
} from '../utils/LifecycleMigrationRunner';

interface MigrationStatus {
  hasMigrationData: boolean;
  totalAgents: number;
  agentsWithLifecycleEvents: number;
  migrationNeeded: boolean;
  lastMigrationDate?: string;
}

export const LifecycleMigrationPanel: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load migration status on component mount
  useEffect(() => {
    loadMigrationStatus();
  }, []);

  const loadMigrationStatus = async () => {
    try {
      setIsLoading(true);
      const status = await lifecycleMigrationRunner.getMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Failed to load migration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runMigration = async (dryRun: boolean = false) => {
    try {
      setIsRunningMigration(true);
      setMigrationProgress(null);
      setMigrationResults(null);

      const options: MigrationOptions = {
        dryRun,
        validateAfter: true,
        onProgress: (progress) => {
          setMigrationProgress(progress);
        }
      };

      const result = await lifecycleMigrationRunner.runMigration(options);
      setMigrationResults(result);

      // Reload status after migration
      if (result.success && !dryRun) {
        await loadMigrationStatus();
      }

    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResults({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsRunningMigration(false);
      setMigrationProgress(null);
    }
  };

  const rollbackMigration = async () => {
    if (!confirm('Are you sure you want to rollback the migration? This will remove all migration-generated lifecycle events.')) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await lifecycleMigrationRunner.rollbackMigration();
      
      if (result.success) {
        alert(`Successfully removed ${result.eventsRemoved} migration-generated events.`);
        await loadMigrationStatus();
      } else {
        alert(`Rollback failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Rollback failed:', error);
      alert('Rollback failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="lifecycle-migration-panel loading">
        <div className="loading-spinner"></div>
        <p>Loading migration status...</p>
      </div>
    );
  }

  return (
    <div className="lifecycle-migration-panel">
      <div className="migration-header">
        <h3>🔄 Lifecycle Data Migration</h3>
        <p>Backfill lifecycle events for existing agents to enable complete lifecycle tracking.</p>
      </div>

      {/* Migration Status */}
      <div className="migration-status">
        <h4>📊 Current Status</h4>
        {migrationStatus && (
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Total Agents:</span>
              <span className="value">{migrationStatus.totalAgents}</span>
            </div>
            <div className="status-item">
              <span className="label">With Lifecycle Events:</span>
              <span className="value">{migrationStatus.agentsWithLifecycleEvents}</span>
            </div>
            <div className="status-item">
              <span className="label">Migration Needed:</span>
              <span className={`value ${migrationStatus.migrationNeeded ? 'warning' : 'success'}`}>
                {migrationStatus.migrationNeeded ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Migration Progress */}
      {migrationProgress && (
        <div className="migration-progress">
          <h4>🔄 Migration Progress</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${migrationProgress.progress}%` }}
            ></div>
          </div>
          <p className="progress-message">
            <strong>{migrationProgress.phase.toUpperCase()}:</strong> {migrationProgress.message}
          </p>
        </div>
      )}

      {/* Migration Results */}
      {migrationResults && (
        <div className={`migration-results ${migrationResults.success ? 'success' : 'error'}`}>
          <h4>{migrationResults.success ? '✅ Migration Completed' : '❌ Migration Failed'}</h4>
          
          {migrationResults.success ? (
            <div className="results-content">
              {migrationResults.migrationReport && (
                <div className="migration-report">
                  <h5>📋 Migration Report</h5>
                  <div className="report-grid">
                    <div className="report-item">
                      <span className="label">Total Agents:</span>
                      <span className="value">{migrationResults.migrationReport.totalAgents}</span>
                    </div>
                    <div className="report-item">
                      <span className="label">Migrated:</span>
                      <span className="value success">{migrationResults.migrationReport.migratedAgents}</span>
                    </div>
                    <div className="report-item">
                      <span className="label">Skipped:</span>
                      <span className="value">{migrationResults.migrationReport.skippedAgents}</span>
                    </div>
                    <div className="report-item">
                      <span className="label">Failed:</span>
                      <span className="value error">{migrationResults.migrationReport.failedAgents}</span>
                    </div>
                    <div className="report-item">
                      <span className="label">Events Created:</span>
                      <span className="value">{migrationResults.migrationReport.eventsCreated}</span>
                    </div>
                    <div className="report-item">
                      <span className="label">Execution Time:</span>
                      <span className="value">{migrationResults.migrationReport.executionTime}ms</span>
                    </div>
                  </div>
                </div>
              )}

              {migrationResults.validationReport && (
                <div className="validation-report">
                  <h5>🔍 Validation Report</h5>
                  <p className={`validation-status ${migrationResults.validationReport.isValid ? 'success' : 'error'}`}>
                    Status: {migrationResults.validationReport.isValid ? 'PASSED' : 'FAILED'}
                  </p>
                  {migrationResults.validationReport.inconsistencies.length > 0 && (
                    <div className="inconsistencies">
                      <p>⚠️ Found {migrationResults.validationReport.inconsistencies.length} inconsistencies</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="error-content">
              <p>Error: {migrationResults.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Migration Actions */}
      <div className="migration-actions">
        <h4>🚀 Actions</h4>
        
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => runMigration(true)}
            disabled={isRunningMigration}
          >
            🧪 Dry Run
          </button>

          <button
            className="btn btn-primary"
            onClick={() => runMigration(false)}
            disabled={isRunningMigration || !migrationStatus?.migrationNeeded}
          >
            {isRunningMigration ? '⏳ Running...' : '🚀 Run Migration'}
          </button>

          <button
            className="btn btn-outline"
            onClick={loadMigrationStatus}
            disabled={isRunningMigration}
          >
            🔄 Refresh Status
          </button>
        </div>

        {/* Advanced Options */}
        <div className="advanced-section">
          <button
            className="btn btn-link"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-options">
              <button
                className="btn btn-danger"
                onClick={rollbackMigration}
                disabled={isRunningMigration || !migrationStatus?.hasMigrationData}
              >
                🗑️ Rollback Migration
              </button>
              <p className="warning-text">
                ⚠️ Rollback will remove all migration-generated lifecycle events. This action cannot be undone.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="migration-help">
        <h4>❓ Help</h4>
        <div className="help-content">
          <p><strong>Dry Run:</strong> Test the migration process without making any changes.</p>
          <p><strong>Run Migration:</strong> Backfill lifecycle events for all existing agents.</p>
          <p><strong>Rollback:</strong> Remove all migration-generated events (use with caution).</p>
        </div>
      </div>

      <style jsx>{`
        .lifecycle-migration-panel {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin: 16px 0;
        }

        .migration-header h3 {
          margin: 0 0 8px 0;
          color: #1a1a1a;
        }

        .migration-header p {
          margin: 0 0 24px 0;
          color: #666;
        }

        .migration-status, .migration-progress, .migration-results, .migration-actions, .migration-help {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }

        .migration-status:last-child, .migration-progress:last-child, .migration-results:last-child, .migration-actions:last-child, .migration-help:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .status-grid, .report-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .status-item, .report-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .label {
          font-weight: 500;
          color: #666;
        }

        .value {
          font-weight: 600;
        }

        .value.success {
          color: #28a745;
        }

        .value.warning {
          color: #ffc107;
        }

        .value.error {
          color: #dc3545;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin: 8px 0;
        }

        .progress-fill {
          height: 100%;
          background: #007bff;
          transition: width 0.3s ease;
        }

        .progress-message {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #666;
        }

        .migration-results.success {
          border-left: 4px solid #28a745;
          background: #f8fff9;
          padding: 16px;
          border-radius: 4px;
        }

        .migration-results.error {
          border-left: 4px solid #dc3545;
          background: #fff8f8;
          padding: 16px;
          border-radius: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-outline {
          background: transparent;
          color: #007bff;
          border: 1px solid #007bff;
        }

        .btn-outline:hover:not(:disabled) {
          background: #007bff;
          color: white;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-link {
          background: transparent;
          color: #007bff;
          border: none;
          text-decoration: underline;
          padding: 4px 0;
        }

        .advanced-options {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .warning-text {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: #dc3545;
        }

        .help-content p {
          margin: 4px 0;
          font-size: 14px;
          color: #666;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .validation-status.success {
          color: #28a745;
          font-weight: 600;
        }

        .validation-status.error {
          color: #dc3545;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default LifecycleMigrationPanel;

