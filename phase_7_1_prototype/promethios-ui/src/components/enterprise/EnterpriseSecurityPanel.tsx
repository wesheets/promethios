/**
 * EnterpriseSecurityPanel - Enterprise security monitoring and controls
 * New SECURITY tab for comprehensive security oversight
 */

import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle, Eye, Users, Key, Clock, Activity, Zap, Settings, RefreshCw, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface SecurityMetrics {
  timestamp: Date;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttempts: number;
  authenticatedSessions: number;
  failedLogins: number;
  apiCalls: number;
  rateLimitViolations: number;
}

interface ThreatDetection {
  threatId: string;
  type: 'brute_force' | 'suspicious_activity' | 'data_exfiltration' | 'unauthorized_access' | 'api_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  detectedAt: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  affectedAgents: string[];
  mitigationActions: string[];
}

interface AccessControl {
  userId: string;
  userName: string;
  role: string;
  permissions: string[];
  lastLogin: Date;
  sessionCount: number;
  mfaEnabled: boolean;
  riskScore: number; // 0-100
  recentActivity: Array<{
    action: string;
    resource: string;
    timestamp: Date;
    result: 'success' | 'failure' | 'blocked';
  }>;
}

interface SecurityConfiguration {
  sessionTimeout: number; // minutes
  maxFailedLogins: number;
  rateLimitThreshold: number; // requests per minute
  mfaRequired: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
    expirationDays: number;
  };
  threatDetection: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    autoBlock: boolean;
    alertThreshold: number;
  };
}

interface EnterpriseSecurityPanelProps {
  sessionId: string;
  onSecurityAction?: (action: string, target?: string, config?: any) => void;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const EnterpriseSecurityPanel: React.FC<EnterpriseSecurityPanelProps> = ({
  sessionId,
  onSecurityAction
}) => {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics[]>([]);
  const [threatDetections, setThreatDetections] = useState<ThreatDetection[]>([]);
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfiguration>({
    sessionTimeout: 60,
    maxFailedLogins: 5,
    rateLimitThreshold: 100,
    mfaRequired: true,
    passwordPolicy: {
      minLength: 12,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
      expirationDays: 90
    },
    threatDetection: {
      enabled: true,
      sensitivity: 'medium',
      autoBlock: true,
      alertThreshold: 3
    }
  });
  const [viewMode, setViewMode] = useState<'overview' | 'threats' | 'access' | 'config'>('overview');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadSecurityData();
    
    // Refresh security data every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Generate mock security metrics for the last 24 hours
      const metricsData: SecurityMetrics[] = [];
      const now = Date.now();
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now - i * 60 * 60 * 1000); // Hourly data
        metricsData.push({
          timestamp,
          threatLevel: Math.random() > 0.9 ? 'high' : Math.random() > 0.7 ? 'medium' : 'low',
          activeThreats: Math.floor(Math.random() * 5),
          blockedAttempts: Math.floor(Math.random() * 20),
          authenticatedSessions: 50 + Math.floor(Math.random() * 100),
          failedLogins: Math.floor(Math.random() * 10),
          apiCalls: 1000 + Math.floor(Math.random() * 2000),
          rateLimitViolations: Math.floor(Math.random() * 5)
        });
      }
      
      setSecurityMetrics(metricsData);

      // Generate mock threat detections
      const threats: ThreatDetection[] = [
        {
          threatId: 'threat_1',
          type: 'brute_force',
          severity: 'high',
          source: '192.168.1.100',
          target: 'login_endpoint',
          description: 'Multiple failed login attempts detected from single IP',
          detectedAt: new Date(now - 2 * 60 * 60 * 1000),
          status: 'investigating',
          affectedAgents: ['agent1', 'agent2'],
          mitigationActions: ['IP blocked', 'Account locked', 'Admin notified']
        },
        {
          threatId: 'threat_2',
          type: 'api_abuse',
          severity: 'medium',
          source: 'api_client_xyz',
          target: 'agent_api',
          description: 'Rate limit exceeded by 300% over 5 minutes',
          detectedAt: new Date(now - 30 * 60 * 1000),
          status: 'active',
          affectedAgents: ['agent3'],
          mitigationActions: ['Rate limit enforced', 'Client throttled']
        }
      ];
      
      setThreatDetections(threats);

      // Generate mock access controls
      const accessData: AccessControl[] = [
        {
          userId: 'user_1',
          userName: 'admin@company.com',
          role: 'Administrator',
          permissions: ['read', 'write', 'delete', 'admin'],
          lastLogin: new Date(now - 30 * 60 * 1000),
          sessionCount: 3,
          mfaEnabled: true,
          riskScore: 15,
          recentActivity: [
            {
              action: 'login',
              resource: 'dashboard',
              timestamp: new Date(now - 30 * 60 * 1000),
              result: 'success'
            }
          ]
        },
        {
          userId: 'user_2',
          userName: 'analyst@company.com',
          role: 'Analyst',
          permissions: ['read', 'write'],
          lastLogin: new Date(now - 2 * 60 * 60 * 1000),
          sessionCount: 1,
          mfaEnabled: false,
          riskScore: 45,
          recentActivity: [
            {
              action: 'data_access',
              resource: 'agent_logs',
              timestamp: new Date(now - 2 * 60 * 60 * 1000),
              result: 'success'
            }
          ]
        }
      ];
      
      setAccessControls(accessData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentThreatLevel = () => {
    const latest = securityMetrics[securityMetrics.length - 1];
    return latest?.threatLevel || 'low';
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-800 bg-red-200';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderSecurityOverview = () => {
    const latest = securityMetrics[securityMetrics.length - 1];
    const activeThreats = threatDetections.filter(t => t.status === 'active').length;
    const highRiskUsers = accessControls.filter(u => u.riskScore > 70).length;
    const mfaCompliance = (accessControls.filter(u => u.mfaEnabled).length / Math.max(accessControls.length, 1)) * 100;

    const cards = [
      {
        title: 'Threat Level',
        value: getCurrentThreatLevel().toUpperCase(),
        subtitle: `${activeThreats} active threats`,
        icon: Shield,
        color: getCurrentThreatLevel() === 'low' ? 'bg-green-500' : 
               getCurrentThreatLevel() === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
      },
      {
        title: 'Active Sessions',
        value: latest?.authenticatedSessions || 0,
        subtitle: `${latest?.failedLogins || 0} failed logins`,
        icon: Users,
        color: 'bg-blue-500'
      },
      {
        title: 'API Security',
        value: `${latest?.rateLimitViolations || 0}`,
        subtitle: 'Rate limit violations',
        icon: Key,
        color: (latest?.rateLimitViolations || 0) === 0 ? 'bg-green-500' : 'bg-yellow-500'
      },
      {
        title: 'MFA Compliance',
        value: `${mfaCompliance.toFixed(0)}%`,
        subtitle: `${highRiskUsers} high-risk users`,
        icon: Lock,
        color: mfaCompliance >= 90 ? 'bg-green-500' : mfaCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
      }
    ];

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Metrics Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Events (24h)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={securityMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(time) => new Date(time).getHours() + ':00'} />
                <YAxis />
                <Tooltip labelFormatter={(time) => new Date(time).toLocaleTimeString()} />
                <Legend />
                <Line type="monotone" dataKey="blockedAttempts" stroke="#EF4444" name="Blocked Attempts" />
                <Line type="monotone" dataKey="failedLogins" stroke="#F59E0B" name="Failed Logins" />
                <Line type="monotone" dataKey="rateLimitViolations" stroke="#8B5CF6" name="Rate Limit Violations" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Brute Force', value: threatDetections.filter(t => t.type === 'brute_force').length },
                    { name: 'API Abuse', value: threatDetections.filter(t => t.type === 'api_abuse').length },
                    { name: 'Suspicious Activity', value: threatDetections.filter(t => t.type === 'suspicious_activity').length },
                    { name: 'Unauthorized Access', value: threatDetections.filter(t => t.type === 'unauthorized_access').length }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  const renderThreatDetections = () => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Threat Detections</h3>
        </div>
        <div className="p-6">
          {threatDetections.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No active threats detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {threatDetections.map((threat) => (
                <div key={threat.threatId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        threat.severity === 'critical' ? 'text-red-800 bg-red-200' :
                        threat.severity === 'high' ? 'text-red-600 bg-red-100' :
                        threat.severity === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                        'text-green-600 bg-green-100'
                      }`}>
                        {threat.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{threat.type.replace('_', ' ')}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      threat.status === 'active' ? 'text-red-600 bg-red-100' :
                      threat.status === 'investigating' ? 'text-yellow-600 bg-yellow-100' :
                      threat.status === 'resolved' ? 'text-green-600 bg-green-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {threat.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1">{threat.description}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Source:</span>
                      <span className="ml-1 font-medium">{threat.source}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Target:</span>
                      <span className="ml-1 font-medium">{threat.target}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Detected:</span>
                      <span className="ml-1 font-medium">{threat.detectedAt.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Affected Agents:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {threat.affectedAgents.map((agentId) => (
                        <span key={agentId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {agentId}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Mitigation Actions:</span>
                    <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                      {threat.mitigationActions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex space-x-2">
                    {threat.status === 'active' && (
                      <button
                        onClick={() => onSecurityAction?.('investigate_threat', threat.threatId)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
                      >
                        Investigate
                      </button>
                    )}
                    <button
                      onClick={() => onSecurityAction?.('block_threat', threat.threatId)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => onSecurityAction?.('resolve_threat', threat.threatId)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAccessControls = () => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Access Control Management</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {accessControls.map((user) => (
            <div key={user.userId} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{user.userName}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {user.role}
                  </span>
                  {user.mfaEnabled ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      MFA Enabled
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                      MFA Disabled
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.riskScore <= 30 ? 'text-green-600 bg-green-100' :
                    user.riskScore <= 60 ? 'text-yellow-600 bg-yellow-100' :
                    'text-red-600 bg-red-100'
                  }`}>
                    Risk: {user.riskScore}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Last Login:</span>
                  <span className="ml-1 font-medium">{user.lastLogin.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Active Sessions:</span>
                  <span className="ml-1 font-medium">{user.sessionCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Permissions:</span>
                  <span className="ml-1 font-medium">{user.permissions.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Recent Activity:</span>
                  <span className="ml-1 font-medium">{user.recentActivity.length} actions</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onSecurityAction?.('view_user_details', user.userId)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  View Details
                </button>
                {!user.mfaEnabled && (
                  <button
                    onClick={() => onSecurityAction?.('enforce_mfa', user.userId)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
                  >
                    Enforce MFA
                  </button>
                )}
                {user.riskScore > 70 && (
                  <button
                    onClick={() => onSecurityAction?.('suspend_user', user.userId)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSecurityConfiguration = () => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Security Configuration</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Session Management */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Session Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={securityConfig.sessionTimeout}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    sessionTimeout: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Failed Logins
                </label>
                <input
                  type="number"
                  value={securityConfig.maxFailedLogins}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    maxFailedLogins: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Authentication</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={securityConfig.mfaRequired}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    mfaRequired: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Require Multi-Factor Authentication</span>
              </label>
            </div>
          </div>

          {/* Threat Detection */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Threat Detection</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detection Sensitivity
                </label>
                <select
                  value={securityConfig.threatDetection.sensitivity}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    threatDetection: {
                      ...prev.threatDetection,
                      sensitivity: e.target.value as 'low' | 'medium' | 'high'
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold
                </label>
                <input
                  type="number"
                  value={securityConfig.threatDetection.alertThreshold}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    threatDetection: {
                      ...prev.threatDetection,
                      alertThreshold: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={securityConfig.threatDetection.enabled}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    threatDetection: {
                      ...prev.threatDetection,
                      enabled: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable Threat Detection</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={securityConfig.threatDetection.autoBlock}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    threatDetection: {
                      ...prev.threatDetection,
                      autoBlock: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-block Threats</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => onSecurityAction?.('save_config', undefined, securityConfig)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Save Configuration
            </button>
            <button
              onClick={() => onSecurityAction?.('test_config', undefined, securityConfig)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Test Configuration
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading security data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Enterprise Security Center</h2>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('threats')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'threats' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Threats
            </button>
            <button
              onClick={() => setViewMode('access')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'access' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Access
            </button>
            <button
              onClick={() => setViewMode('config')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'config' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Config
            </button>
          </div>
          
          <button
            onClick={loadSecurityData}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded ${getThreatLevelColor(getCurrentThreatLevel())}`}>
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Threat Level: {getCurrentThreatLevel().toUpperCase()}</span>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {viewMode === 'overview' && renderSecurityOverview()}
      {viewMode === 'threats' && renderThreatDetections()}
      {viewMode === 'access' && renderAccessControls()}
      {viewMode === 'config' && renderSecurityConfiguration()}
    </div>
  );
};

export default EnterpriseSecurityPanel;

