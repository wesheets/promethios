/**
 * EnterprisePolicyDashboard - Enterprise policy monitoring and coordination
 * Enhances the existing RAG + POLICY tab with multi-agent compliance oversight
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Users, BarChart3, Settings, Download, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AgentPolicyStatus {
  agentId: string;
  agentName: string;
  policyType: 'HIPAA' | 'SOC2' | 'GDPR' | 'SOX' | 'FedRAMP' | 'ISO27001';
  complianceScore: number; // 0-100
  status: 'compliant' | 'non_compliant' | 'pending_review' | 'exempted';
  lastAudit: Date;
  nextAudit: Date;
  violations: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: Date;
    status: 'open' | 'resolved' | 'acknowledged';
  }>;
  certifications: Array<{
    type: string;
    status: 'valid' | 'expired' | 'expiring_soon';
    expiresAt: Date;
  }>;
}

interface PolicyCoordinationRule {
  ruleId: string;
  name: string;
  description: string;
  applicableAgents: string[];
  policyTypes: string[];
  enforcementLevel: 'advisory' | 'warning' | 'blocking';
  status: 'active' | 'inactive' | 'testing';
}

interface EnterprisePolicyDashboardProps {
  sessionId: string;
  activeAgents: Array<{ agentId: string; name: string; type: string }>;
  onPolicyAction?: (action: string, agentId?: string, policyId?: string) => void;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

export const EnterprisePolicyDashboard: React.FC<EnterprisePolicyDashboardProps> = ({
  sessionId,
  activeAgents,
  onPolicyAction
}) => {
  const [agentPolicyStatuses, setAgentPolicyStatuses] = useState<AgentPolicyStatus[]>([]);
  const [coordinationRules, setCoordinationRules] = useState<PolicyCoordinationRule[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'agents' | 'rules' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadPolicyData();
    
    // Refresh policy data every 2 minutes
    const interval = setInterval(loadPolicyData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sessionId, activeAgents]);

  const loadPolicyData = async () => {
    try {
      setLoading(true);
      
      // Simulate loading agent policy statuses from their compliance backends
      const mockAgentStatuses: AgentPolicyStatus[] = activeAgents.map((agent, index) => {
        const policyTypes: Array<'HIPAA' | 'SOC2' | 'GDPR' | 'SOX' | 'FedRAMP' | 'ISO27001'> = 
          ['HIPAA', 'SOC2', 'GDPR', 'SOX', 'FedRAMP', 'ISO27001'];
        
        const complianceScore = 75 + Math.random() * 20; // 75-95
        const hasViolations = Math.random() < 0.3; // 30% chance of violations
        
        return {
          agentId: agent.agentId,
          agentName: agent.name,
          policyType: policyTypes[index % policyTypes.length],
          complianceScore,
          status: complianceScore >= 90 ? 'compliant' : complianceScore >= 70 ? 'pending_review' : 'non_compliant',
          lastAudit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          nextAudit: new Date(Date.now() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000), // Next 30-90 days
          violations: hasViolations ? [
            {
              severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
              description: 'Data retention policy violation detected',
              detectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
              status: Math.random() > 0.5 ? 'open' : 'acknowledged'
            }
          ] : [],
          certifications: [
            {
              type: policyTypes[index % policyTypes.length],
              status: Math.random() > 0.8 ? 'expiring_soon' : 'valid',
              expiresAt: new Date(Date.now() + (90 + Math.random() * 180) * 24 * 60 * 60 * 1000)
            }
          ]
        };
      });

      setAgentPolicyStatuses(mockAgentStatuses);

      // Load coordination rules
      const mockRules: PolicyCoordinationRule[] = [
        {
          ruleId: 'rule_1',
          name: 'HIPAA Data Sharing Coordination',
          description: 'Ensures HIPAA-compliant agents coordinate data sharing protocols',
          applicableAgents: mockAgentStatuses.filter(a => a.policyType === 'HIPAA').map(a => a.agentId),
          policyTypes: ['HIPAA'],
          enforcementLevel: 'blocking',
          status: 'active'
        },
        {
          ruleId: 'rule_2',
          name: 'SOC2 Security Controls Alignment',
          description: 'Aligns security controls across SOC2-compliant agents',
          applicableAgents: mockAgentStatuses.filter(a => a.policyType === 'SOC2').map(a => a.agentId),
          policyTypes: ['SOC2'],
          enforcementLevel: 'warning',
          status: 'active'
        }
      ];

      setCoordinationRules(mockRules);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading policy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      case 'pending_review': return 'text-yellow-600 bg-yellow-100';
      case 'exempted': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-200';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverviewCards = () => {
    const totalAgents = agentPolicyStatuses.length;
    const compliantAgents = agentPolicyStatuses.filter(a => a.status === 'compliant').length;
    const totalViolations = agentPolicyStatuses.reduce((sum, agent) => sum + agent.violations.length, 0);
    const avgComplianceScore = agentPolicyStatuses.reduce((sum, agent) => sum + agent.complianceScore, 0) / Math.max(totalAgents, 1);
    const expiringCerts = agentPolicyStatuses.reduce((sum, agent) => 
      sum + agent.certifications.filter(cert => cert.status === 'expiring_soon').length, 0
    );

    const cards = [
      {
        title: 'Total Agents',
        value: totalAgents,
        subtitle: `${compliantAgents} compliant`,
        icon: Users,
        color: 'bg-blue-500'
      },
      {
        title: 'Compliance Score',
        value: `${avgComplianceScore.toFixed(1)}%`,
        subtitle: 'Average across all agents',
        icon: BarChart3,
        color: avgComplianceScore >= 90 ? 'bg-green-500' : avgComplianceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
      },
      {
        title: 'Active Violations',
        value: totalViolations,
        subtitle: 'Requiring attention',
        icon: AlertTriangle,
        color: totalViolations === 0 ? 'bg-green-500' : totalViolations < 5 ? 'bg-yellow-500' : 'bg-red-500'
      },
      {
        title: 'Expiring Certifications',
        value: expiringCerts,
        subtitle: 'Next 90 days',
        icon: Clock,
        color: expiringCerts === 0 ? 'bg-green-500' : 'bg-yellow-500'
      }
    ];

    return (
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
    );
  };

  const renderComplianceChart = () => {
    const policyTypeData = agentPolicyStatuses.reduce((acc, agent) => {
      const existing = acc.find(item => item.name === agent.policyType);
      if (existing) {
        existing.compliant += agent.status === 'compliant' ? 1 : 0;
        existing.nonCompliant += agent.status === 'non_compliant' ? 1 : 0;
        existing.pending += agent.status === 'pending_review' ? 1 : 0;
        existing.total += 1;
      } else {
        acc.push({
          name: agent.policyType,
          compliant: agent.status === 'compliant' ? 1 : 0,
          nonCompliant: agent.status === 'non_compliant' ? 1 : 0,
          pending: agent.status === 'pending_review' ? 1 : 0,
          total: 1
        });
      }
      return acc;
    }, [] as Array<{ name: string; compliant: number; nonCompliant: number; pending: number; total: number }>);

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Policy Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={policyTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="compliant" stackId="a" fill="#10B981" name="Compliant" />
            <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending Review" />
            <Bar dataKey="nonCompliant" stackId="a" fill="#EF4444" name="Non-Compliant" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAgentList = () => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Agent Policy Status</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {agentPolicyStatuses.map((agent) => (
            <div
              key={agent.agentId}
              className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedAgent === agent.agentId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{agent.agentName}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{agent.policyType}</span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Compliance Score:</span>
                      <span className="ml-1 font-medium">{agent.complianceScore.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Violations:</span>
                      <span className="ml-1 font-medium">{agent.violations.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Audit:</span>
                      <span className="ml-1 font-medium">{agent.lastAudit.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Audit:</span>
                      <span className="ml-1 font-medium">{agent.nextAudit.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {selectedAgent === agent.agentId && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Violations */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Active Violations</h5>
                          {agent.violations.length === 0 ? (
                            <p className="text-sm text-gray-500">No active violations</p>
                          ) : (
                            <div className="space-y-2">
                              {agent.violations.map((violation, index) => (
                                <div key={index} className="border border-gray-200 rounded p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                                      {violation.severity.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {violation.detectedAt.toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{violation.description}</p>
                                  <span className={`text-xs ${violation.status === 'open' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {violation.status.toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Certifications */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Certifications</h5>
                          <div className="space-y-2">
                            {agent.certifications.map((cert, index) => (
                              <div key={index} className="border border-gray-200 rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{cert.type}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    cert.status === 'valid' ? 'text-green-600 bg-green-100' :
                                    cert.status === 'expiring_soon' ? 'text-yellow-600 bg-yellow-100' :
                                    'text-red-600 bg-red-100'
                                  }`}>
                                    {cert.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Expires: {cert.expiresAt.toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPolicyAction?.('audit', agent.agentId);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Run Audit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPolicyAction?.('generate_report', agent.agentId);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Generate Report
                        </button>
                        {agent.violations.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPolicyAction?.('remediate', agent.agentId);
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                          >
                            Remediate
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCoordinationRules = () => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Policy Coordination Rules</h3>
        </div>
        <div className="p-6">
          {coordinationRules.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No coordination rules configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {coordinationRules.map((rule) => (
                <div key={rule.ruleId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.status === 'active' ? 'text-green-600 bg-green-100' :
                        rule.status === 'testing' ? 'text-yellow-600 bg-yellow-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {rule.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.enforcementLevel === 'blocking' ? 'text-red-600 bg-red-100' :
                        rule.enforcementLevel === 'warning' ? 'text-yellow-600 bg-yellow-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {rule.enforcementLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Applicable Agents:</span>
                      <span className="ml-1 font-medium">{rule.applicableAgents.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Policy Types:</span>
                      <span className="ml-1 font-medium">{rule.policyTypes.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading policy data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Enterprise Policy Dashboard</h2>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('agents')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'agents' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Agents
            </button>
            <button
              onClick={() => setViewMode('rules')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'rules' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Rules
            </button>
          </div>
          
          <button
            onClick={loadPolicyData}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => onPolicyAction?.('export_report')}
            className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleTimeString()} • 
        Monitoring {agentPolicyStatuses.length} agents across {new Set(agentPolicyStatuses.map(a => a.policyType)).size} policy types
      </div>

      {viewMode === 'overview' && (
        <>
          {renderOverviewCards()}
          {renderComplianceChart()}
        </>
      )}

      {viewMode === 'agents' && renderAgentList()}
      {viewMode === 'rules' && renderCoordinationRules()}
    </div>
  );
};

export default EnterprisePolicyDashboard;

