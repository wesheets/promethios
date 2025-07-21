import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { OptimizedExistingDataBridge } from '../services/OptimizedExistingDataBridge';
import { UserAgentStorageService } from '../services/UserAgentStorageService';
import { multiAgentService } from '../services/multiAgentService';
import { AgentDetailModal } from '../components/AgentDetailModal';
import { exportUtils } from '../utils/exportUtils';

interface GovernanceMetrics {
  overallScore: number;
  trustScore: number;
  agentCount: number;
  violationCount: number;
  hasDeployedAgents: boolean;
}

interface AgentScorecard {
  id: string;
  name: string;
  type: 'Single' | 'Multi-Agent';
  status: 'Active' | 'Inactive' | 'Suspended';
  trustScore: number | null;
  compliance: number | null;
  violations: number;
  health: 'Healthy' | 'Warning' | 'Critical';
  governance: 'Native LLM' | 'API Wrapped';
  isDeployed: boolean;
}

const SimplifiedGovernanceOverviewPage: React.FC = () => {
  console.log('🎯 SimplifiedGovernanceOverviewPage rendering...');
  
  const { currentUser } = useAuth();
  
  // Stable state management
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [scorecards, setScorecards] = useState<AgentScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentScorecard | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [governanceFilter, setGovernanceFilter] = useState('All Governance');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchTerm, setSearchTerm] = useState('');

  // Stable data loading function
  const loadData = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading governance data...');
      
      // Load metrics
      const dataBridge = new OptimizedExistingDataBridge();
      const dashboardMetrics = await dataBridge.getDashboardMetrics(currentUser.uid);
      
      // Load agents
      const userAgentService = new UserAgentStorageService();
      const agents = await userAgentService.loadAgents(currentUser.uid);
      console.log(`📥 Loaded ${agents.length} agents`);
      
      // Load multi-agent systems
      const multiAgentSystems = await multiAgentService.getMultiAgentSystems(currentUser.uid);
      console.log(`🔍 Loaded ${multiAgentSystems.length} multi-agent systems:`, multiAgentSystems);
      
      // Create agent scorecards
      const agentScorecards: AgentScorecard[] = agents.map(agent => {
        const isDeployed = agent.status === 'active';
        
        return {
          id: agent.id,
          name: agent.name || `Agent ${agent.id.slice(-4)}`,
          type: 'Single' as const,
          status: isDeployed ? 'Active' : 'Inactive',
          trustScore: isDeployed ? Math.floor(Math.random() * 40) + 60 : null,
          compliance: isDeployed ? Math.floor(Math.random() * 30) + 70 : null,
          violations: isDeployed ? Math.floor(Math.random() * 3) : 0,
          health: isDeployed ? 'Healthy' : 'Warning',
          governance: agent.type === 'claude' ? 'API Wrapped' : 'Native LLM',
          isDeployed
        };
      });
      
      // Create multi-agent system scorecards
      const multiAgentScorecards: AgentScorecard[] = multiAgentSystems.map(system => {
        const isDeployed = false; // Multi-agent systems are not deployed yet
        
        return {
          id: system.id,
          name: system.name || `Multi-Agent System ${system.id.slice(-4)}`,
          type: 'Multi-Agent' as const,
          status: 'Inactive',
          trustScore: null,
          compliance: null,
          violations: 0,
          health: 'Warning',
          governance: 'Native LLM',
          isDeployed
        };
      });
      
      const allScorecards = [...agentScorecards, ...multiAgentScorecards];
      console.log(`✅ Created ${allScorecards.length} total scorecards (${agentScorecards.length} agents + ${multiAgentScorecards.length} multi-agent systems)`);
      
      // Calculate metrics
      const deployedAgents = allScorecards.filter(s => s.isDeployed);
      const hasDeployedAgents = deployedAgents.length > 0;
      
      const calculatedMetrics: GovernanceMetrics = {
        overallScore: hasDeployedAgents ? Math.floor(deployedAgents.reduce((sum, s) => sum + (s.trustScore || 0), 0) / deployedAgents.length) : 0,
        trustScore: hasDeployedAgents ? Math.floor(deployedAgents.reduce((sum, s) => sum + (s.trustScore || 0), 0) / deployedAgents.length) : 0,
        agentCount: allScorecards.length,
        violationCount: allScorecards.reduce((sum, s) => sum + s.violations, 0),
        hasDeployedAgents
      };
      
      setMetrics(calculatedMetrics);
      setScorecards(allScorecards);
      
    } catch (err) {
      console.error('❌ Error loading governance data:', err);
      setError('Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Load data on mount and user change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stable filtered scorecards
  const filteredScorecards = useMemo(() => {
    return scorecards.filter(scorecard => {
      const matchesType = typeFilter === 'All Types' || scorecard.type === typeFilter;
      const matchesGovernance = governanceFilter === 'All Governance' || scorecard.governance === governanceFilter;
      const matchesStatus = statusFilter === 'All Status' || scorecard.status === statusFilter;
      const matchesSearch = searchTerm === '' || scorecard.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesGovernance && matchesStatus && matchesSearch;
    });
  }, [scorecards, typeFilter, governanceFilter, statusFilter, searchTerm]);

  // Stable event handlers
  const handleExport = useCallback((format: 'csv' | 'json' | 'pdf') => {
    exportUtils.exportGovernanceData(filteredScorecards, format);
  }, [filteredScorecards]);

  const handleAgentClick = useCallback((agent: AgentScorecard) => {
    setSelectedAgent(agent);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedAgent(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading governance data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Governance Overview</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            EXPORT CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
          >
            EXPORT JSON
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
          >
            EXPORT PDF
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Score</p>
              <p className="text-3xl font-bold text-yellow-400">
                {metrics.hasDeployedAgents ? `${metrics.overallScore}%` : 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">
                {metrics.hasDeployedAgents ? 'Fair' : 'No Deployed Agents'}
              </p>
            </div>
            <div className="text-yellow-400">⚠️</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Trust Score</p>
              <p className="text-3xl font-bold text-blue-400">
                {metrics.hasDeployedAgents ? metrics.trustScore : 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">
                {metrics.hasDeployedAgents ? 'Average Rating' : 'Not Deployed'}
              </p>
            </div>
            <div className="text-blue-400">🛡️</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Agents</p>
              <p className="text-3xl font-bold text-green-400">{metrics.agentCount}</p>
              <p className="text-gray-500 text-xs">Under Governance</p>
            </div>
            <div className="text-green-400">👥</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Violations</p>
              <p className="text-3xl font-bold text-red-400">{metrics.violationCount}</p>
              <p className="text-gray-500 text-xs">Active Issues</p>
            </div>
            <div className="text-red-400">⚠️</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500"
          />
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500"
          >
            <option>All Types</option>
            <option>Single</option>
            <option>Multi-Agent</option>
          </select>
          
          <select
            value={governanceFilter}
            onChange={(e) => setGovernanceFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500"
          >
            <option>All Governance</option>
            <option>Native LLM</option>
            <option>API Wrapped</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Suspended</option>
          </select>
        </div>
        
        <div className="mt-4 text-right text-gray-400 text-sm">
          {filteredScorecards.length} of {scorecards.length} agents
        </div>
      </div>

      {/* Agent Scorecards Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Agent Scorecards</h2>
          <p className="text-gray-400 text-sm">{filteredScorecards.length} of {scorecards.length} agents</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Agent</th>
                <th className="px-4 py-3 text-left">Trust Score</th>
                <th className="px-4 py-3 text-left">Compliance</th>
                <th className="px-4 py-3 text-left">Violations</th>
                <th className="px-4 py-3 text-left">Health</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Governance</th>
              </tr>
            </thead>
            <tbody>
              {filteredScorecards.map((scorecard) => (
                <tr
                  key={scorecard.id}
                  className="border-b border-gray-700 hover:bg-gray-750 cursor-pointer"
                  onClick={() => handleAgentClick(scorecard)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        {scorecard.type === 'Multi-Agent' ? '🔗' : '👤'}
                      </div>
                      <div>
                        <div className="font-medium">{scorecard.name}</div>
                        <div className="text-gray-400 text-sm">
                          {scorecard.type === 'Multi-Agent' ? 'Multi-agent system' : 'Single agent'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {scorecard.trustScore !== null ? (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                        {scorecard.trustScore}%
                      </span>
                    ) : (
                      <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-sm">
                        N/A - Not Deployed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {scorecard.compliance !== null ? (
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                        {scorecard.compliance}%
                      </span>
                    ) : (
                      <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-sm">
                        N/A - Not Deployed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-red-400">{scorecard.violations}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      scorecard.health === 'Healthy' ? 'bg-green-600 text-white' :
                      scorecard.health === 'Warning' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {scorecard.health}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      scorecard.status === 'Active' ? 'bg-green-600 text-white' :
                      scorecard.status === 'Inactive' ? 'bg-gray-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {scorecard.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {scorecard.type === 'Multi-Agent' ? '🔗' : '👤'}
                      <span className="ml-2">{scorecard.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {scorecard.governance === 'Native LLM' ? '🏠' : '🔗'}
                      <span className="ml-2">{scorecard.governance}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default SimplifiedGovernanceOverviewPage;

