/**
 * Observer Agent Trust Metrics Component
 * 
 * Displays real-time trust metrics and governance status for the Observer Agent
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { observerAgentGovernance } from '../services/observerAgentGovernance';

interface TrustMetricsProps {
  isVisible: boolean;
  onToggle: () => void;
}

const ObserverTrustMetrics: React.FC<TrustMetricsProps> = ({ isVisible, onToggle }) => {
  const [metrics, setMetrics] = useState(observerAgentGovernance.getGovernanceMetrics());
  const [config, setConfig] = useState(observerAgentGovernance.getGovernanceConfig());
  const [recentEvents, setRecentEvents] = useState(observerAgentGovernance.getGovernanceEvents(5));

  // Update metrics every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(observerAgentGovernance.getGovernanceMetrics());
      setRecentEvents(observerAgentGovernance.getGovernanceEvents(5));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />;
      case 'violation':
        return <XCircleIcon className="w-4 h-4 text-red-400" />;
      default:
        return <ShieldCheckIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'violation':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTrustScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return 'text-green-400';
    if (score >= threshold - 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggle}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Show Observer Governance Status"
        >
          <ShieldCheckIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <EyeIcon className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-white font-medium text-sm">Observer Governance</h3>
            <p className="text-xs text-gray-400">Agent ID: {config.agentId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(metrics.governanceStatus)}
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Governance Status</span>
          <span className={`text-sm font-medium ${getStatusColor(metrics.governanceStatus)}`}>
            {metrics.governanceStatus.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Overall Trust Score</span>
          <span className={getTrustScoreColor(metrics.trustScores.overall, config.trustThresholds.overall)}>
            {metrics.trustScores.overall.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Trust Metrics */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2 mb-3">
          <ChartBarIcon className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-medium text-white">Trust Metrics</h4>
        </div>
        
        <div className="space-y-2">
          {Object.entries(metrics.trustScores).map(([dimension, score]) => {
            if (dimension === 'overall') return null;
            const threshold = config.trustThresholds[dimension as keyof typeof config.trustThresholds];
            
            return (
              <div key={dimension} className="flex items-center justify-between">
                <span className="text-xs text-gray-300 capitalize">
                  {dimension}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        score >= threshold ? 'bg-green-400' : 
                        score >= threshold - 10 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <span className={`text-xs ${getTrustScoreColor(score, threshold)}`}>
                    {score.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium text-white mb-3">Performance</h4>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-400">Response Time</span>
            <div className="text-white font-medium">
              {metrics.performanceMetrics.responseTime.toFixed(1)}s
            </div>
          </div>
          <div>
            <span className="text-gray-400">Error Rate</span>
            <div className="text-white font-medium">
              {(metrics.performanceMetrics.errorRate * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <span className="text-gray-400">User Rating</span>
            <div className="text-white font-medium">
              {metrics.performanceMetrics.userSatisfaction.toFixed(1)}/5
            </div>
          </div>
          <div>
            <span className="text-gray-400">Uptime</span>
            <div className="text-white font-medium">
              {metrics.performanceMetrics.uptime.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium text-white mb-3">Compliance</h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Overall Compliance</span>
            <span className="text-xs text-white font-medium">
              {metrics.complianceStatus.overallCompliance}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Policy Violations</span>
            <span className={`text-xs font-medium ${
              metrics.complianceStatus.policyViolations === 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {metrics.complianceStatus.policyViolations}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Last Audit</span>
            <span className="text-xs text-gray-400">
              {formatTimestamp(metrics.complianceStatus.lastAudit)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <ClockIcon className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-medium text-white">Recent Events</h4>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {recentEvents.length === 0 ? (
            <p className="text-xs text-gray-400">No recent events</p>
          ) : (
            recentEvents.map((event, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    event.severity === 'error' ? 'text-red-400' :
                    event.severity === 'warning' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-gray-400">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                {event.data.message && (
                  <p className="text-gray-300 mt-1">{event.data.message}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-800 rounded-b-lg">
        <p className="text-xs text-gray-400 text-center">
          Governed by Promethios • Version {config.version}
        </p>
      </div>
    </div>
  );
};

export default ObserverTrustMetrics;

