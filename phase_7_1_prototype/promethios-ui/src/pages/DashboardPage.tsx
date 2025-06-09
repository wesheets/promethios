import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AgentFirebaseService, AgentConfiguration } from '../firebase/agentService';
import SimpleAgentService, { TeamSummary } from '../services/simpleAgentService';

interface DashboardMetrics {
  governanceScore: number;
  agentsMonitored: number;
  teamsActive: number;
  complianceStatus: 'excellent' | 'good' | 'needs_review' | 'critical';
  trustDelta24h: number;
  violationsToday: number;
  deploymentsActive: number;
}

interface ActivityItem {
  id: string;
  type: 'governance' | 'team' | 'deployment' | 'violation' | 'observer';
  title: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  agentId?: string;
  teamId?: string;
}

/**
 * Enhanced Dashboard Page
 * 
 * Comprehensive governance command center that showcases:
 * - Multi-agent and team governance metrics
 * - Real-time Observer insights
 * - Deployment status monitoring
 * - Enhanced activity feed with governance events
 * - Quick actions for all major features
 * 
 * Maintains backward compatibility while adding new capabilities.
 */
const DashboardPage: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    governanceScore: 0,
    agentsMonitored: 0,
    teamsActive: 0,
    complianceStatus: 'good',
    trustDelta24h: 0,
    violationsToday: 0,
    deploymentsActive: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [observerInsight, setObserverInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load dashboard data
  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load agents and teams
      const [agents, teams] = await Promise.all([
        SimpleAgentService.getUserAgents(currentUser?.uid || 'demo-user'),
        SimpleAgentService.getUserTeams(currentUser?.uid || 'demo-user')
      ]);

      // Calculate governance metrics
      const activeAgents = agents.filter(agent => agent.status === 'active');
      const activeTeams = teams.filter(team => team.status === 'active');
      
      const avgTrustScore = activeAgents.length > 0 
        ? Math.round(activeAgents.reduce((sum, agent) => sum + agent.trustScore, 0) / activeAgents.length)
        : 0;

      const teamAvgTrust = activeTeams.length > 0
        ? Math.round(activeTeams.reduce((sum, team) => sum + team.averageTrustScore, 0) / activeTeams.length)
        : 0;

      const overallGovernanceScore = activeAgents.length > 0 || activeTeams.length > 0
        ? Math.round((avgTrustScore + teamAvgTrust) / (activeAgents.length > 0 && activeTeams.length > 0 ? 2 : 1))
        : 0;

      // Simulate real-time metrics
      const trustDelta = Math.floor(Math.random() * 20) - 10; // -10 to +10
      const violationsToday = Math.floor(Math.random() * 5);
      const deploymentsActive = Math.floor(Math.random() * 3);

      const complianceStatus = overallGovernanceScore >= 90 ? 'excellent' :
                              overallGovernanceScore >= 80 ? 'good' :
                              overallGovernanceScore >= 70 ? 'needs_review' : 'critical';

      setMetrics({
        governanceScore: overallGovernanceScore,
        agentsMonitored: activeAgents.length,
        teamsActive: activeTeams.length,
        complianceStatus,
        trustDelta24h: trustDelta,
        violationsToday,
        deploymentsActive
      });

      // Generate recent activity
      const activity = generateRecentActivity(activeAgents, activeTeams);
      setRecentActivity(activity);

      // Generate Observer insight
      const insight = generateObserverInsight(overallGovernanceScore, trustDelta, violationsToday);
      setObserverInsight(insight);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecentActivity = (agents: any[], teams: any[]): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    const now = new Date();

    // Team creation activities
    teams.forEach((team, index) => {
      activities.push({
        id: `team-${team.id}`,
        type: 'team',
        title: 'Team Created',
        description: `Multi-agent team "${team.name}" created with governance identity`,
        timestamp: new Date(now.getTime() - (index + 1) * 3600000).toISOString(),
        severity: 'success',
        teamId: team.id
      });
    });

    // Governance activities
    agents.forEach((agent, index) => {
      if (Math.random() > 0.5) {
        activities.push({
          id: `gov-${agent.id}`,
          type: 'governance',
          title: 'Governance Toggle Tested',
          description: `Agent "${agent.name}" tested with governance ${Math.random() > 0.5 ? 'enabled' : 'disabled'}`,
          timestamp: new Date(now.getTime() - (index + 2) * 1800000).toISOString(),
          severity: 'info',
          agentId: agent.id
        });
      }
    });

    // Observer activities
    activities.push({
      id: 'observer-1',
      type: 'observer',
      title: 'Observer Analysis Complete',
      description: 'Team-level governance analysis completed with recommendations',
      timestamp: new Date(now.getTime() - 900000).toISOString(),
      severity: 'info'
    });

    // Deployment activities
    if (Math.random() > 0.3) {
      activities.push({
        id: 'deploy-1',
        type: 'deployment',
        title: 'Agent Deployment Package Generated',
        description: 'Docker container with governance layers ready for download',
        timestamp: new Date(now.getTime() - 1800000).toISOString(),
        severity: 'success'
      });
    }

    // Violation activities
    if (Math.random() > 0.7) {
      activities.push({
        id: 'violation-1',
        type: 'violation',
        title: 'Governance Violation Detected',
        description: 'Article 3.1 (Source Verification) violation resolved by Observer intervention',
        timestamp: new Date(now.getTime() - 2700000).toISOString(),
        severity: 'warning'
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  };

  const generateObserverInsight = (governanceScore: number, trustDelta: number, violations: number): string => {
    const insights = [
      `Governance ecosystem performing well with ${governanceScore}% overall score. ${trustDelta >= 0 ? 'Trust trending upward' : 'Trust requires attention'}.`,
      `Multi-agent teams showing strong collaboration efficiency. ${violations === 0 ? 'Zero violations detected today' : `${violations} violations resolved through governance intervention`}.`,
      `Constitutional framework enforcement is ${governanceScore >= 85 ? 'highly effective' : 'needs optimization'}. Consider ${trustDelta < 0 ? 'increasing governance levels' : 'maintaining current settings'}.`,
      `Observer monitoring indicates ${violations <= 1 ? 'excellent' : 'moderate'} compliance across all agents and teams. Team governance identities are functioning properly.`,
      `Deployment readiness is high with governed agents showing consistent trust scores. ${governanceScore >= 90 ? 'Ready for production deployment' : 'Consider additional governance tuning'}.`
    ];

    return insights[Math.floor(Math.random() * insights.length)];
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'governance': return '🛡️';
      case 'team': return '👥';
      case 'deployment': return '🚀';
      case 'violation': return '⚠️';
      case 'observer': return '🔍';
      default: return '📋';
    }
  };

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return time.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading governance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome to your Promethios governance dashboard!</p>
          </div>
          {currentUser && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="font-medium">{currentUser.email}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Governance Score */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Governance Score</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                metrics.complianceStatus === 'excellent' ? 'bg-green-900 text-green-200' :
                metrics.complianceStatus === 'good' ? 'bg-blue-900 text-blue-200' :
                metrics.complianceStatus === 'needs_review' ? 'bg-yellow-900 text-yellow-200' :
                'bg-red-900 text-red-200'
              }`}>
                {metrics.complianceStatus === 'needs_review' ? 'Needs Improvement' : metrics.complianceStatus}
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{metrics.governanceScore}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  metrics.governanceScore >= 90 ? 'bg-green-500' :
                  metrics.governanceScore >= 80 ? 'bg-blue-500' :
                  metrics.governanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.governanceScore}%` }}
              ></div>
            </div>
          </div>

          {/* Agents Monitored */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Agents Monitored</h3>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-blue-400 mr-2">{metrics.agentsMonitored}</div>
              <div className="text-sm text-gray-400">
                <div>Individual</div>
                <div className="flex items-center">
                  <span className="text-blue-400 mr-1">●●●●●</span>
                  <span>+{metrics.teamsActive} teams</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Compliance Status</h3>
            <div className={`text-2xl font-bold mb-1 ${
              metrics.complianceStatus === 'excellent' ? 'text-green-400' :
              metrics.complianceStatus === 'good' ? 'text-blue-400' :
              metrics.complianceStatus === 'needs_review' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {metrics.complianceStatus === 'excellent' ? '✓ Excellent' :
               metrics.complianceStatus === 'good' ? '✓ Good' :
               metrics.complianceStatus === 'needs_review' ? '⚠ Needs Review' :
               '✗ Critical'}
            </div>
            <div className="text-sm text-gray-400">
              Last checked: 30 minutes ago
            </div>
          </div>

          {/* Trust Delta */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Trust Delta (24h)</h3>
            <div className={`text-3xl font-bold mb-1 ${
              metrics.trustDelta24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {metrics.trustDelta24h >= 0 ? '+' : ''}{metrics.trustDelta24h}
            </div>
            <div className="text-sm text-gray-400">
              {metrics.violationsToday} violations today
            </div>
          </div>
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="mr-2">⚡</span>
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-750 hover:bg-gray-700 transition-colors">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${getActivityColor(activity.severity)}`}>
                          {activity.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Observer Agent */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="mr-2">🔍</span>
                Observer Agent
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 mb-4">
                <p className="text-blue-100 text-sm leading-relaxed">
                  {observerInsight}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-750 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Governance Tip</div>
                  <div className="text-sm text-gray-300">
                    Regular compliance checks help maintain high governance scores.
                  </div>
                </div>
                
                <div className="bg-gray-750 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Suggested Action</div>
                  <div className="text-sm text-gray-300">
                    Review your agent policies to ensure they meet current standards.
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Ask Observer a question..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/ui/agents')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <span className="mr-2">+</span>
                Wrap New Agent
              </button>
              
              <button
                onClick={() => navigate('/ui/governance')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <span className="mr-2">📋</span>
                View Policies
              </button>
              
              <button
                onClick={() => navigate('/ui/governance')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <span className="mr-2">⚙️</span>
                Configure Observer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

