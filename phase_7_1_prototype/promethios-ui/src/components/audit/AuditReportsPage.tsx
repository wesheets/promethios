import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AgentSelector } from './AgentSelector';
import { AuditLogViewer } from './AuditLogViewer';
import { ComplianceDashboard } from './ComplianceDashboard';
import { CryptographicVerificationPanel } from './CryptographicVerificationPanel';
import { AuditFilters } from './AuditFilters';
import MultiAgentSystemVisualization from './MultiAgentSystemVisualization';

interface AuditReportsPageProps {}

interface Agent {
  agentId: string;
  agentType: string;
  status: string;
  lastActivity: string;
  trustLevel: string;
  logCount: number;
}

interface AuditLog {
  id: string;
  agentId: string;
  userId: string;
  eventType: string;
  eventData: any;
  timestamp: string;
  verificationStatus: 'verified' | 'pending' | 'failed';
  hash: string;
  signature: string;
  chainPosition: number;
}

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  eventTypes: string[];
  verificationStatus: string[];
  agentTypes: string[];
}

const AuditReportsPage: React.FC<AuditReportsPageProps> = () => {
  const { isDarkMode } = useTheme();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    eventTypes: [],
    verificationStatus: [],
    agentTypes: []
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'compliance' | 'verification'>('logs');

  // Load agents on component mount
  useEffect(() => {
    loadAgents();
  }, []);

  // Load audit logs when agent or filters change
  useEffect(() => {
    if (selectedAgent) {
      loadAuditLogs();
    }
  }, [selectedAgent, filters]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agent-logs/chains');
      if (response.ok) {
        const data = await response.json();
        const agentList = data.chains?.map((chain: any) => ({
          agentId: chain.agentId,
          agentType: chain.metadata?.agentType || 'general',
          status: chain.metadata?.status || 'active',
          lastActivity: chain.lastUpdated,
          trustLevel: chain.metadata?.trustLevel || 'medium',
          logCount: chain.entryCount || 0
        })) || [];
        setAgents(agentList);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!selectedAgent) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        agentId: selectedAgent.agentId,
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        limit: '100'
      });

      if (filters.eventTypes.length > 0) {
        queryParams.append('eventTypes', filters.eventTypes.join(','));
      }
      if (filters.verificationStatus.length > 0) {
        queryParams.append('verificationStatus', filters.verificationStatus.join(','));
      }

      const response = await fetch(`/api/agent-logs/${selectedAgent.agentId}?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    if (!selectedAgent) return;

    try {
      const response = await fetch(`/api/agent-logs/${selectedAgent.agentId}/export`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${selectedAgent.agentId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const handleVerifyChain = async () => {
    if (!selectedAgent) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/agent-logs/${selectedAgent.agentId}/verify`, {
        method: 'POST'
      });

      if (response.ok) {
        const verification = await response.json();
        alert(`Chain verification: ${verification.valid ? 'PASSED' : 'FAILED'}\nIntegrity: ${verification.integrityPercentage}%`);
        // Reload logs to update verification status
        await loadAuditLogs();
      }
    } catch (error) {
      console.error('Error verifying chain:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">🔐 Cryptographic Audit Reports</h1>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Enterprise-grade audit trails with mathematical proof of agent behavior
                </p>
              </div>
              <div className="flex space-x-3">
                {selectedAgent && (
                  <>
                    <button
                      onClick={handleVerifyChain}
                      disabled={loading}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } disabled:opacity-50 transition-colors`}
                    >
                      {loading ? 'Verifying...' : 'Verify Chain'}
                    </button>
                    <button
                      onClick={handleExportLogs}
                      disabled={loading}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        isDarkMode 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } disabled:opacity-50 transition-colors`}
                    >
                      Export Logs
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Agent Selection */}
          <div className="lg:col-span-1">
            <AgentSelector
              agents={agents}
              selectedAgent={selectedAgent}
              onAgentSelect={setSelectedAgent}
              loading={loading}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedAgent ? (
              <>
                {/* Tab Navigation */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm mb-6`}>
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 px-6">
                      {[
                        { id: 'logs', label: 'Audit Logs', icon: '📋' },
                        { id: 'compliance', label: 'Compliance', icon: '⚖️' },
                        { id: 'verification', label: 'Verification', icon: '🔐' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} hover:border-gray-300`
                          } transition-colors`}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'logs' && (
                  <div className="space-y-6">
                    <AuditFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                    <AuditLogViewer
                      logs={auditLogs}
                      loading={loading}
                      onLogSelect={setSelectedLog}
                      selectedLog={selectedLog}
                    />
                  </div>
                )}

                {activeTab === 'compliance' && (
                  <ComplianceDashboard
                    agentId={selectedAgent.agentId}
                  />
                )}

                {activeTab === 'verification' && (
                  <CryptographicVerificationPanel
                    agentId={selectedAgent.agentId}
                    selectedLog={selectedLog}
                  />
                )}
              </>
            ) : (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-12 text-center`}>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium mb-2">Select an Agent</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose an agent from the sidebar to view their cryptographic audit trail
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditReportsPage;

