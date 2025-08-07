/**
 * Autonomous Governance Dashboard Component
 * 
 * React component providing real-time monitoring and control interface
 * for autonomous cognition governance.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  autonomousGovernanceDashboard, 
  DashboardState, 
  DashboardSession,
  AlertSummary,
  InterventionSummary 
} from '../../services/AutonomousGovernanceDashboard';

// Dashboard Component Props
interface AutonomousGovernanceDashboardProps {
  className?: string;
  refreshInterval?: number;
  showAdvancedControls?: boolean;
}

// Sub-component Props
interface SessionCardProps {
  session: DashboardSession;
  onEmergencyStop: (sessionId: string) => void;
  onTriggerIntervention: (sessionId: string, type: string) => void;
  onViewDetails: (sessionId: string) => void;
}

interface AlertPanelProps {
  alertSummary: AlertSummary;
  onViewAlert: (alertId: string) => void;
  onResolveAlert: (alertId: string) => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  subtitle?: string;
}

interface SystemStatusProps {
  systemHealth: any;
  onRefresh: () => void;
}

/**
 * Main Autonomous Governance Dashboard Component
 */
export const AutonomousGovernanceDashboard: React.FC<AutonomousGovernanceDashboardProps> = ({
  className = '',
  refreshInterval = 10000,
  showAdvancedControls = false
}) => {
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [interventionSummary, setInterventionSummary] = useState<InterventionSummary | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize dashboard and subscribe to updates
  useEffect(() => {
    const subscriberId = `dashboard_${Date.now()}`;
    
    // Subscribe to real-time updates
    autonomousGovernanceDashboard.subscribe(subscriberId, (state: DashboardState) => {
      setDashboardState(state);
      setLoading(false);
    });

    // Initial data load
    loadDashboardData();

    // Cleanup subscription on unmount
    return () => {
      autonomousGovernanceDashboard.unsubscribe(subscriberId);
    };
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const state = autonomousGovernanceDashboard.getDashboardState();
      const alerts = autonomousGovernanceDashboard.getAlertSummary();
      const interventions = autonomousGovernanceDashboard.getInterventionSummary();
      const health = autonomousGovernanceDashboard.getSystemHealth();

      setDashboardState(state);
      setAlertSummary(alerts);
      setInterventionSummary(interventions);
      setSystemHealth(health);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle emergency stop
  const handleEmergencyStop = useCallback(async (sessionId: string) => {
    try {
      const reason = prompt('Enter reason for emergency stop:');
      if (reason) {
        await autonomousGovernanceDashboard.emergencyStop(sessionId, reason);
        await loadDashboardData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute emergency stop');
    }
  }, [loadDashboardData]);

  // Handle intervention trigger
  const handleTriggerIntervention = useCallback(async (sessionId: string, type: string) => {
    try {
      const reason = prompt(`Enter reason for ${type} intervention:`);
      if (reason) {
        await autonomousGovernanceDashboard.triggerIntervention(
          sessionId, 
          type as any, 
          reason
        );
        await loadDashboardData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger intervention');
    }
  }, [loadDashboardData]);

  // Handle session details view
  const handleViewSessionDetails = useCallback(async (sessionId: string) => {
    setSelectedSession(sessionId);
    // In a full implementation, this would open a detailed session view
  }, []);

  // Handle alert actions
  const handleViewAlert = useCallback((alertId: string) => {
    // Implementation for viewing alert details
    console.log('Viewing alert:', alertId);
  }, []);

  const handleResolveAlert = useCallback((alertId: string) => {
    // Implementation for resolving alert
    console.log('Resolving alert:', alertId);
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className={`governance-dashboard loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading governance dashboard...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`governance-dashboard error ${className}`}>
        <div className="error-message">
          <h3>Dashboard Error</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render main dashboard
  return (
    <div className={`governance-dashboard bg-gray-900 text-white min-h-screen ${className}`}>
      {/* Dashboard Header */}
      <div className="dashboard-header bg-gray-800 p-6 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-white">Autonomous Governance Dashboard</h1>
        <div className="header-controls flex gap-4 mt-4">
          <button onClick={loadDashboardData} className="refresh-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            🔄 Refresh
          </button>
          {showAdvancedControls && (
            <button className="export-button bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              📊 Export Report
            </button>
          )}
        </div>
      </div>

      {/* System Status Overview */}
      {systemHealth && (
        <SystemStatusPanel 
          systemHealth={systemHealth}
          onRefresh={loadDashboardData}
        />
      )}

      {/* Key Metrics Row */}
      <div className="metrics-row grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {dashboardState && (
          <>
            <MetricCard
              title="Active Sessions"
              value={dashboardState.system_status.active_sessions}
              status="good"
              subtitle="Currently monitored"
            />
            <MetricCard
              title="Compliance Rate"
              value={`${dashboardState.compliance_overview.overall_compliance_rate}%`}
              trend={dashboardState.compliance_overview.compliance_trend === 'improving' ? 'up' : 'stable'}
              status={dashboardState.compliance_overview.overall_compliance_rate >= 95 ? 'good' : 'warning'}
              subtitle="24h average"
            />
            <MetricCard
              title="Risk Score"
              value={dashboardState.risk_overview.overall_risk_score}
              trend={dashboardState.risk_overview.risk_trend === 'improving' ? 'down' : 'stable'}
              status={dashboardState.risk_overview.overall_risk_score < 30 ? 'good' : 
                     dashboardState.risk_overview.overall_risk_score < 70 ? 'warning' : 'critical'}
              subtitle="Current level"
            />
            <MetricCard
              title="Thoughts Processed"
              value={dashboardState.performance_overview.thoughts_processed_today}
              trend={dashboardState.performance_overview.performance_trend === 'improving' ? 'up' : 'stable'}
              status="good"
              subtitle="Today"
            />
          </>
        )}
      </div>

      {/* Alerts and Interventions Row */}
      <div className="alerts-interventions-row grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
        {alertSummary && (
          <AlertPanel
            alertSummary={alertSummary}
            onViewAlert={handleViewAlert}
            onResolveAlert={handleResolveAlert}
          />
        )}
        
        {interventionSummary && (
          <InterventionPanel
            interventionSummary={interventionSummary}
          />
        )}
      </div>

      {/* Active Sessions */}
      <div className="sessions-section p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Active Sessions</h2>
        <div className="sessions-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardState?.active_sessions.map(session => (
            <SessionCard
              key={session.session_id}
              session={session}
              onEmergencyStop={handleEmergencyStop}
              onTriggerIntervention={handleTriggerIntervention}
              onViewDetails={handleViewSessionDetails}
            />
          ))}
          {(!dashboardState?.active_sessions || dashboardState.active_sessions.length === 0) && (
            <div className="no-sessions bg-gray-800 p-8 rounded-lg border border-gray-700 col-span-full text-center">
              <p className="text-gray-400">No active governance sessions</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Charts */}
      <div className="charts-section p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Performance Trends</h2>
        <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="chart-container bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Thoughts Processed</h3>
            <div className="chart-placeholder text-center py-12 text-gray-400">
              📈 Chart would be rendered here
            </div>
          </div>
          <div className="chart-container bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Compliance Rate</h3>
            <div className="chart-placeholder text-center py-12 text-gray-400">
              📊 Chart would be rendered here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Session Card Component
 */
const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onEmergencyStop,
  onTriggerIntervention,
  onViewDetails
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'terminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="session-card bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="session-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Session {session.session_id.slice(-8)}</h3>
        <span 
          className={`status-badge px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(session.status)}`}
        >
          {session.status}
        </span>
      </div>
      
      <div className="session-details space-y-2 mb-4 text-sm">
        <p className="text-gray-300"><strong className="text-white">Agent:</strong> {session.agent_id}</p>
        <p className="text-gray-300"><strong className="text-white">Duration:</strong> {session.duration}</p>
        <p className="text-gray-300"><strong className="text-white">Active Thoughts:</strong> {session.active_thoughts}</p>
        <p className="text-gray-300"><strong className="text-white">Compliance:</strong> {session.compliance_rate}%</p>
        <p className="text-gray-300">
          <strong className="text-white">Risk Level:</strong> 
          <span className={`ml-2 font-medium ${getRiskColor(session.risk_level)}`}>
            {session.risk_level}
          </span>
        </p>
      </div>

      <div className="session-actions space-y-3">
        <button 
          onClick={() => onViewDetails(session.session_id)}
          className="view-details-button w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          View Details
        </button>
        <div className="intervention-buttons grid grid-cols-3 gap-2">
          <button 
            onClick={() => onTriggerIntervention(session.session_id, 'pause')}
            className="pause-button bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm transition-colors"
          >
            ⏸️ Pause
          </button>
          <button 
            onClick={() => onTriggerIntervention(session.session_id, 'warning')}
            className="warning-button bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm transition-colors"
          >
            ⚠️ Warning
          </button>
          <button 
            onClick={() => onEmergencyStop(session.session_id)}
            className="emergency-stop-button bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
          >
            🛑 Stop
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Alert Panel Component
 */
const AlertPanel: React.FC<AlertPanelProps> = ({
  alertSummary,
  onViewAlert,
  onResolveAlert
}) => {
  return (
    <div className="alert-panel bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">Governance Alerts</h3>
      <div className="alert-summary grid grid-cols-3 gap-4 mb-4">
        <div className="alert-count critical text-center">
          <span className="count block text-2xl font-bold text-red-400">{alertSummary.critical_alerts}</span>
          <span className="label text-sm text-gray-400">Critical</span>
        </div>
        <div className="alert-count warning text-center">
          <span className="count block text-2xl font-bold text-yellow-400">{alertSummary.warning_alerts}</span>
          <span className="label text-sm text-gray-400">Warning</span>
        </div>
        <div className="alert-count info text-center">
          <span className="count block text-2xl font-bold text-blue-400">{alertSummary.info_alerts}</span>
          <span className="label text-sm text-gray-400">Info</span>
        </div>
      </div>
      
      {alertSummary.unresolved_alerts > 0 && (
        <div className="unresolved-alerts bg-red-900/20 border border-red-700 p-4 rounded-lg">
          <p className="text-red-400 mb-2"><strong>{alertSummary.unresolved_alerts}</strong> alerts require immediate attention</p>
          <button className="view-alerts-button bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
            View All Alerts
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Intervention Panel Component
 */
const InterventionPanel: React.FC<{ interventionSummary: InterventionSummary }> = ({
  interventionSummary
}) => {
  return (
    <div className="intervention-panel bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">Governance Interventions</h3>
      <div className="intervention-summary grid grid-cols-3 gap-4 mb-4">
        <div className="intervention-stat text-center">
          <span className="count block text-2xl font-bold text-blue-400">{interventionSummary.total_interventions}</span>
          <span className="label text-sm text-gray-400">Total Today</span>
        </div>
        <div className="intervention-stat text-center">
          <span className="count block text-2xl font-bold text-yellow-400">{interventionSummary.pending_interventions}</span>
          <span className="label text-sm text-gray-400">Pending</span>
        </div>
        <div className="intervention-stat text-center">
          <span className="count block text-2xl font-bold text-orange-400">{interventionSummary.human_review_required}</span>
          <span className="label text-sm text-gray-400">Need Review</span>
        </div>
      </div>
      
      {interventionSummary.human_review_required > 0 && (
        <div className="review-required bg-orange-900/20 border border-orange-700 p-4 rounded-lg">
          <p className="text-orange-400 mb-2"><strong>{interventionSummary.human_review_required}</strong> interventions need human review</p>
          <button className="review-button bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
            Review Interventions
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  status = 'good',
  subtitle
}) => {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-green-500';
      case 'warning': return 'border-yellow-500';
      case 'critical': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <div className={`metric-card bg-gray-800 p-6 rounded-lg border-l-4 ${getStatusColor(status)} border-r border-t border-b border-gray-700`}>
      <div className="metric-header flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        {trend && <span className="trend-icon text-xl">{getTrendIcon(trend)}</span>}
      </div>
      <div className="metric-value text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="metric-subtitle text-sm text-gray-400">{subtitle}</div>}
    </div>
  );
};

/**
 * System Status Panel Component
 */
const SystemStatusPanel: React.FC<SystemStatusProps> = ({
  systemHealth,
  onRefresh
}) => {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className="system-status-panel">
      <div className="status-header">
        <h2>
          {getHealthIcon(systemHealth.status)} System Health: 
          <span style={{ color: getHealthColor(systemHealth.status) }}>
            {systemHealth.status.toUpperCase()}
          </span>
        </h2>
        <button onClick={onRefresh} className="refresh-status-button">
          🔄 Refresh Status
        </button>
      </div>
      
      {systemHealth.issues.length > 0 && (
        <div className="health-issues">
          <h4>Issues Detected:</h4>
          <ul>
            {systemHealth.issues.map((issue: string, index: number) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      {systemHealth.recommendations.length > 0 && (
        <div className="health-recommendations">
          <h4>Recommendations:</h4>
          <ul>
            {systemHealth.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutonomousGovernanceDashboard;

