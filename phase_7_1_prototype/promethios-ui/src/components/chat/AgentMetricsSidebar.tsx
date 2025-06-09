import React, { useState } from 'react';
import { ChatMessage } from './EnhancedChatInterface';

/**
 * Agent Metrics Sidebar Props
 */
interface AgentMetricsSidebarProps {
  agentId: string;
  messages: ChatMessage[];
  governanceEnabled: boolean;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Agent Metrics Sidebar Component
 * 
 * Displays real-time governance metrics and analytics for the current agent:
 * - Trust score trends
 * - Violation statistics
 * - Governance effectiveness
 * - Observer insights
 * - Performance metrics
 */
const AgentMetricsSidebar: React.FC<AgentMetricsSidebarProps> = ({
  agentId,
  messages,
  governanceEnabled,
  className = '',
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'violations' | 'observer'>('metrics');

  // Calculate metrics from messages
  const calculateMetrics = () => {
    const agentMessages = messages.filter(m => m.type === 'agent');
    const totalMessages = agentMessages.length;
    
    if (totalMessages === 0) {
      return {
        averageTrustScore: 0,
        totalViolations: 0,
        governanceEffectiveness: 0,
        averageResponseTime: 0,
        violationsByType: {},
        trustTrend: 'stable' as 'improving' | 'declining' | 'stable'
      };
    }

    // Trust score calculations
    const trustScores = agentMessages
      .filter(m => m.trustScore !== undefined)
      .map(m => m.trustScore!);
    
    const averageTrustScore = trustScores.length > 0 
      ? Math.round(trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length)
      : 0;

    // Trust trend calculation
    let trustTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (trustScores.length >= 3) {
      const recent = trustScores.slice(-3);
      const earlier = trustScores.slice(-6, -3);
      if (earlier.length > 0) {
        const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, score) => sum + score, 0) / earlier.length;
        if (recentAvg > earlierAvg + 2) trustTrend = 'improving';
        else if (recentAvg < earlierAvg - 2) trustTrend = 'declining';
      }
    }

    // Violation calculations
    const allViolations = agentMessages
      .flatMap(m => m.violations || []);
    
    const violationsByType = allViolations.reduce((acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Response time calculations
    const responseTimes = agentMessages
      .filter(m => m.metadata?.responseTime)
      .map(m => m.metadata!.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;

    // Governance effectiveness (compare governed vs ungoverned)
    const governedMessages = agentMessages.filter(m => m.governanceEnabled === true);
    const ungovernedMessages = agentMessages.filter(m => m.governanceEnabled === false);
    
    const governedViolations = governedMessages.flatMap(m => m.violations || []).length;
    const ungovernedViolations = ungovernedMessages.flatMap(m => m.violations || []).length;
    
    let governanceEffectiveness = 0;
    if (governedMessages.length > 0 && ungovernedMessages.length > 0) {
      const governedViolationRate = governedViolations / governedMessages.length;
      const ungovernedViolationRate = ungovernedViolations / ungovernedMessages.length;
      governanceEffectiveness = Math.max(0, Math.round((1 - governedViolationRate / Math.max(ungovernedViolationRate, 0.01)) * 100));
    }

    return {
      averageTrustScore,
      totalViolations: allViolations.length,
      governanceEffectiveness,
      averageResponseTime,
      violationsByType,
      trustTrend
    };
  };

  const metrics = calculateMetrics();

  // Get trend icon and color
  const getTrendDisplay = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { icon: '↗️', color: 'text-green-600', text: 'Improving' };
      case 'declining':
        return { icon: '↘️', color: 'text-red-600', text: 'Declining' };
      default:
        return { icon: '→', color: 'text-gray-600', text: 'Stable' };
    }
  };

  const trendDisplay = getTrendDisplay(metrics.trustTrend);

  if (isCollapsed) {
    return (
      <div className={`w-12 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          title="Expand metrics sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Collapsed metrics indicators */}
        <div className="mt-4 space-y-3">
          <div className="text-center">
            <div className={`text-lg font-bold ${
              metrics.averageTrustScore >= 90 ? 'text-green-600' :
              metrics.averageTrustScore >= 75 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.averageTrustScore}
            </div>
            <div className="text-xs text-gray-500">Trust</div>
          </div>
          
          {metrics.totalViolations > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {metrics.totalViolations}
              </div>
              <div className="text-xs text-gray-500">Issues</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-gray-50 border-l border-gray-200 flex flex-col ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Agent Metrics</h3>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Collapse sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-3 flex space-x-1">
          {[
            { id: 'metrics', label: 'Metrics' },
            { id: 'violations', label: 'Issues' },
            { id: 'observer', label: 'Observer' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Trust Score */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Trust Score</h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-bold ${
                    metrics.averageTrustScore >= 90 ? 'text-green-600' :
                    metrics.averageTrustScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.averageTrustScore}%
                  </span>
                  <div className={`flex items-center space-x-1 ${trendDisplay.color}`}>
                    <span>{trendDisplay.icon}</span>
                    <span className="text-sm">{trendDisplay.text}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.averageTrustScore >= 90 ? 'bg-green-600' :
                      metrics.averageTrustScore >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${metrics.averageTrustScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Governance Effectiveness */}
            {governanceEnabled && metrics.governanceEffectiveness > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Governance Impact</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {metrics.governanceEffectiveness}%
                    </span>
                    <span className="text-sm text-gray-500">Effective</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Governance reduces violations by {metrics.governanceEffectiveness}% compared to ungoverned responses.
                  </p>
                </div>
              </div>
            )}

            {/* Performance */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Performance</h4>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Response Time</span>
                    <span className="font-medium">{metrics.averageResponseTime}ms</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Messages</span>
                    <span className="font-medium">{messages.filter(m => m.type === 'agent').length}</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Violations</span>
                    <span className={`font-medium ${metrics.totalViolations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {metrics.totalViolations}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Violation Breakdown</h4>
            
            {Object.keys(metrics.violationsByType).length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 text-green-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No violations detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(metrics.violationsByType)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-bold text-red-600">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'observer' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Observer Insights</h4>
            
            {/* Recent Observer Comments */}
            <div className="space-y-3">
              {messages
                .filter(m => m.observerCommentary)
                .slice(-3)
                .map((message, index) => (
                  <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-purple-900">{message.observerCommentary}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              
              {messages.filter(m => m.observerCommentary).length === 0 && (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 text-purple-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No observer insights yet</p>
                </div>
              )}
            </div>

            {/* Observer Chat Button */}
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Chat with Observer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentMetricsSidebar;

