import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { observerService, PRISMMetrics, PRISMViolation, VigilMetrics, VigilViolation } from '../services/observers';

const GovernancePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prismMetrics, setPrismMetrics] = useState<PRISMMetrics | null>(null);
  const [prismViolations, setPrismViolations] = useState<PRISMViolation[]>([]);
  const [vigilMetrics, setVigilMetrics] = useState<VigilMetrics | null>(null);
  const [vigilViolations, setVigilViolations] = useState<VigilViolation[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [configChanged, setConfigChanged] = useState(false);
  const [prismConfig, setPrismConfig] = useState({
    traceValidationLevel: 'standard',
    manifestValidationLevel: 'standard',
    samplingRate: 100,
    missingTraceThreshold: 5
  });
  const [vigilConfig, setVigilConfig] = useState({
    driftThreshold: 20,
    significantDriftThreshold: 40,
    trustScoreMinimum: 0.6,
    unreflectedFailureLimit: 3
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch data from observer service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use mock data service
        const [prismMetricsData, prismViolationsData, vigilMetricsData, vigilViolationsData] = await Promise.all([
          observerService.getPRISMMetrics(),
          observerService.getPRISMViolations(),
          observerService.getVigilMetrics(),
          observerService.getVigilViolations()
        ]);

        setPrismMetrics(prismMetricsData);
        setPrismViolations(prismViolationsData);
        setVigilMetrics(vigilMetricsData);
        setVigilViolations(vigilViolationsData);
      } catch (error) {
        console.error('Error fetching observer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle config save
  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      
      // Mock save for demo
      console.log('Saving config (mock):', { prismConfig, vigilConfig });
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
      alert('Configuration saved successfully (mock)');
      
      setConfigChanged(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            AI Governance
          </h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render governance overview tab
  const renderOverviewTab = () => {
    return (
      <div>
        {/* Data Source Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Data Source:</span>
            <button
              className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white"
            >
              Mock Data
            </button>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="agent-select" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Agent:
            </label>
            <select
              id="agent-select"
              className="px-3 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedAgentId || ''}
              onChange={(e) => setSelectedAgentId(e.target.value || undefined)}
            >
              <option value="">All Agents</option>
              <option value="agent-001">Agent 001</option>
              <option value="agent-002">Agent 002</option>
              <option value="agent-003">Agent 003</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Trust Score Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Average Trust Score</h3>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {vigilMetrics ? 
                  (Object.values(vigilMetrics.trustScores).reduce((sum, score) => sum + score, 0) / 
                   Object.values(vigilMetrics.trustScores).length).toFixed(2) : 
                  'N/A'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">/ 1.0</span>
            </div>
          </div>

          {/* Compliance Rate Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Compliance Rate</h3>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {vigilMetrics ? 
                  ((vigilMetrics.loopOutcomes.success / 
                   (vigilMetrics.loopOutcomes.success + vigilMetrics.loopOutcomes.failure + vigilMetrics.loopOutcomes.unreflected)) * 100).toFixed(1) : 
                  'N/A'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">%</span>
            </div>
          </div>

          {/* Active Violations Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Active Violations</h3>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                {prismViolations.length + vigilViolations.length}
              </span>
            </div>
          </div>

          {/* Governance Status Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Governance Status</h3>
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                prismViolations.some(v => v.severity === 'critical' || v.severity === 'high') ? 
                'bg-red-500' : 
                prismViolations.some(v => v.severity === 'medium') ? 
                'bg-yellow-500' : 
                'bg-green-500'
              }`}></span>
              <span className="text-lg font-semibold">
                {prismViolations.some(v => v.severity === 'critical' || v.severity === 'high') ? 
                'At Risk' : 
                prismViolations.some(v => v.severity === 'medium') ? 
                'Warning' : 
                'Compliant'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Violations */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Violations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {[...prismViolations, ...vigilViolations.map(v => ({
                  type: v.type,
                  severity: v.severity,
                  details: v.message,
                  observation: { timestamp: v.timestamp }
                }))].slice(0, 5).map((violation, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{violation.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        violation.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        violation.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{violation.details}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(violation.observation.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tool Usage */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Tool Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prismMetrics && Object.entries(prismMetrics.toolUsage).map(([tool, data]) => (
              <div key={tool} className="flex items-center">
                <div className="w-1/3 text-gray-700 dark:text-gray-300">{tool}</div>
                <div className="w-2/3 flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (data.count / Math.max(...Object.values(prismMetrics.toolUsage).map(d => d.count))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{data.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render PRISM observer tab
  const renderPrismTab = () => {
    return (
      <div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">PRISM Observer Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Tool Usage</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {prismMetrics ? Object.keys(prismMetrics.toolUsage).length : 0} tools monitored
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {prismMetrics ? Object.values(prismMetrics.toolUsage).reduce((sum, data) => sum + data.count, 0) : 0} total invocations
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Memory Access</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {prismMetrics ? Object.keys(prismMetrics.memoryAccess).length : 0} memory regions monitored
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {prismMetrics ? 
                  Object.values(prismMetrics.memoryAccess).reduce((sum, data) => sum + data.readCount + data.writeCount, 0) : 0} total accesses
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Decisions</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {prismMetrics ? Object.keys(prismMetrics.decisions).length : 0} decision types monitored
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {prismMetrics ? 
                  Object.values(prismMetrics.decisions).reduce((sum, data) => sum + data.count, 0) : 0} total decisions
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">PRISM Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trace Validation Level
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.traceValidationLevel}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, traceValidationLevel: e.target.value});
                    setConfigChanged(true);
                  }}
                >
                  <option value="minimal">Minimal</option>
                  <option value="standard">Standard</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Manifest Validation Level
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.manifestValidationLevel}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, manifestValidationLevel: e.target.value});
                    setConfigChanged(true);
                  }}
                >
                  <option value="minimal">Minimal</option>
                  <option value="standard">Standard</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sampling Rate (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.samplingRate}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, samplingRate: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Missing Trace Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.missingTraceThreshold}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, missingTraceThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">PRISM Violations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tool</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {prismViolations.map((violation, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{violation.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        violation.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        violation.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{violation.tool || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{violation.details}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(violation.observation.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Vigil observer tab
  const renderVigilTab = () => {
    return (
      <div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Vigil Observer Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Trust Scores</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {vigilMetrics ? Object.keys(vigilMetrics.trustScores).length : 0} agents monitored
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Average score: {vigilMetrics ? 
                  (Object.values(vigilMetrics.trustScores).reduce((sum, score) => sum + score, 0) / 
                   Object.values(vigilMetrics.trustScores).length).toFixed(2) : 
                  'N/A'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Loop Outcomes</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Success: {vigilMetrics?.loopOutcomes.success || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Failure: {vigilMetrics?.loopOutcomes.failure || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Unreflected: {vigilMetrics?.loopOutcomes.unreflected || 0}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Drift Statistics</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Total goals: {vigilMetrics?.driftStats.totalGoals || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drift detected: {vigilMetrics?.driftStats.driftDetected || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Significant drift: {vigilMetrics?.driftStats.significantDrift || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Vigil Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Drift Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.driftThreshold}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, driftThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Significant Drift Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.significantDriftThreshold}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, significantDriftThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trust Score Minimum
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.trustScoreMinimum}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, trustScoreMinimum: parseFloat(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unreflected Failure Limit
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.unreflectedFailureLimit}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, unreflectedFailureLimit: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Vigil Violations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {vigilViolations.map((violation, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{violation.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        violation.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        violation.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{violation.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(violation.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render settings tab
  const renderSettingsTab = () => {
    return (
      <div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Governance Settings</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Configure governance settings for both PRISM and Vigil observers. Changes will apply to all monitored agents.
          </p>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">PRISM Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trace Validation Level
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.traceValidationLevel}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, traceValidationLevel: e.target.value});
                    setConfigChanged(true);
                  }}
                >
                  <option value="minimal">Minimal</option>
                  <option value="standard">Standard</option>
                  <option value="strict">Strict</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Controls how strictly belief traces are validated
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Manifest Validation Level
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.manifestValidationLevel}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, manifestValidationLevel: e.target.value});
                    setConfigChanged(true);
                  }}
                >
                  <option value="minimal">Minimal</option>
                  <option value="standard">Standard</option>
                  <option value="strict">Strict</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Controls how strictly agent manifests are validated
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sampling Rate (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.samplingRate}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, samplingRate: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Percentage of observations to sample for validation
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Missing Trace Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={prismConfig.missingTraceThreshold}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, missingTraceThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Number of missing traces before triggering a violation
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Vigil Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Drift Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.driftThreshold}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, driftThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Percentage of drift before triggering a warning
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Significant Drift Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.significantDriftThreshold}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, significantDriftThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Percentage of drift before triggering a violation
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trust Score Minimum
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.trustScoreMinimum}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, trustScoreMinimum: parseFloat(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum trust score before triggering a violation
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unreflected Failure Limit
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={vigilConfig.unreflectedFailureLimit}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, unreflectedFailureLimit: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Number of unreflected failures before triggering a violation
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              className={`px-4 py-2 rounded-md ${
                configChanged 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleSaveConfig}
              disabled={!configChanged}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          AI Governance
        </h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prism'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('prism')}
            >
              PRISM Observer
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vigil'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('vigil')}
            >
              Vigil Observer
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'prism' && renderPrismTab()}
        {activeTab === 'vigil' && renderVigilTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default GovernancePage;
