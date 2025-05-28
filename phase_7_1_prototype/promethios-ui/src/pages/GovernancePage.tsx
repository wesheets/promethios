import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { observerService, PRISMMetrics, PRISMViolation, VigilMetrics, VigilViolation } from '../services/observers';
import { liveObserverService, useRealtimeObserverData } from '../services/liveObservers';

const GovernancePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prismMetrics, setPrismMetrics] = useState<PRISMMetrics | null>(null);
  const [prismViolations, setPrismViolations] = useState<PRISMViolation[]>([]);
  const [vigilMetrics, setVigilMetrics] = useState<VigilMetrics | null>(null);
  const [vigilViolations, setVigilViolations] = useState<VigilViolation[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [useLiveData, setUseLiveData] = useState(true);
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

  // Real-time data hook
  const { 
    connected, 
    prismMetrics: realtimePrismMetrics, 
    vigilMetrics: realtimeVigilMetrics, 
    violations: realtimeViolations,
    error: realtimeError 
  } = useRealtimeObserverData(selectedAgentId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Update metrics from real-time data when available
  useEffect(() => {
    if (useLiveData && realtimePrismMetrics) {
      setPrismMetrics(realtimePrismMetrics);
    }
    if (useLiveData && realtimeVigilMetrics) {
      setVigilMetrics(realtimeVigilMetrics);
    }
    if (useLiveData && realtimeViolations) {
      // Filter and update violations by type
      const prismViolationsList = realtimeViolations.filter(v => 'observation' in v) as PRISMViolation[];
      const vigilViolationsList = realtimeViolations.filter(v => !('observation' in v)) as VigilViolation[];
      
      if (prismViolationsList.length > 0) {
        setPrismViolations(prev => [...prev, ...prismViolationsList]);
      }
      if (vigilViolationsList.length > 0) {
        setVigilViolations(prev => [...prev, ...vigilViolationsList]);
      }
    }
  }, [useLiveData, realtimePrismMetrics, realtimeVigilMetrics, realtimeViolations]);

  // Fetch data from observer service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (useLiveData) {
          // Use live data service
          const [prismMetricsData, prismViolationsData, vigilMetricsData, vigilViolationsData] = await Promise.all([
            liveObserverService.getPRISMMetrics(),
            liveObserverService.getPRISMViolations(),
            liveObserverService.getVigilMetrics(),
            liveObserverService.getVigilViolations()
          ]);

          setPrismMetrics(prismMetricsData);
          setPrismViolations(prismViolationsData);
          setVigilMetrics(vigilMetricsData);
          setVigilViolations(vigilViolationsData);
        } else {
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
        }
      } catch (error) {
        console.error('Error fetching observer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [useLiveData]);

  // Handle config save
  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      
      if (useLiveData) {
        await Promise.all([
          liveObserverService.updatePRISMConfig(prismConfig),
          liveObserverService.updateVigilConfig(vigilConfig)
        ]);
        
        // Show success message
        alert('Configuration saved successfully');
      } else {
        // Mock save for demo
        console.log('Saving config (mock):', { prismConfig, vigilConfig });
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Show success message
        alert('Configuration saved successfully (mock)');
      }
      
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
              onClick={() => setUseLiveData(true)}
              className={`px-3 py-1 text-sm rounded-l-md ${
                useLiveData 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Live Data
            </button>
            <button
              onClick={() => setUseLiveData(false)}
              className={`px-3 py-1 text-sm rounded-r-md ${
                !useLiveData 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Mock Data
            </button>
          </div>
          
          {useLiveData && (
            <div className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {connected ? 'Real-time updates active' : 'Real-time updates disconnected'}
              </span>
              {realtimeError && (
                <span className="ml-2 text-sm text-red-500">{realtimeError}</span>
              )}
            </div>
          )}
          
          {useLiveData && (
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
          )}
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
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Mode</h4>
              <p className="text-gray-700 dark:text-gray-300">Passive</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Scope</h4>
              <p className="text-gray-700 dark:text-gray-300">Belief Trace & Manifest Validation</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Status</h4>
              <p className="text-gray-700 dark:text-gray-300">
                {useLiveData ? (connected ? 'Active' : 'Disconnected') : 'Active'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Belief Trace Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Missing Trace Violations</h4>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {prismViolations.filter(v => v.type === 'missing_trace').length}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Unverified Source Violations</h4>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {prismViolations.filter(v => v.type === 'unverified_source').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Memory Access Patterns</h3>
          {prismMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(prismMetrics.memoryAccess).map(([memoryId, data]) => (
                <div key={memoryId} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{memoryId}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Read Count</p>
                      <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{data.readCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Write Count</p>
                      <p className="text-xl font-semibold text-green-600 dark:text-green-400">{data.writeCount}</p>
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

  // Render Vigil observer tab
  const renderVigilTab = () => {
    return (
      <div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">VIGIL Observer Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Mode</h4>
              <p className="text-gray-700 dark:text-gray-300">Active</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Scope</h4>
              <p className="text-gray-700 dark:text-gray-300">Trust Decay & Loop Outcome</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Status</h4>
              <p className="text-gray-700 dark:text-gray-300">
                {useLiveData ? (connected ? 'Active' : 'Disconnected') : 'Active'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Trust Scores</h3>
          {vigilMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(vigilMetrics.trustScores).map(([agentId, score]) => (
                <div key={agentId} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{agentId}</h4>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mr-2">
                      <div 
                        className={`h-2.5 rounded-full ${
                          score >= 0.8 ? 'bg-green-600' :
                          score >= 0.6 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{score.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Loop Outcomes</h3>
          {vigilMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Success</h4>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{vigilMetrics.loopOutcomes.success}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Failure</h4>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{vigilMetrics.loopOutcomes.failure}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Unreflected</h4>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{vigilMetrics.loopOutcomes.unreflected}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Drift Statistics</h3>
          {vigilMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Total Goals</h4>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{vigilMetrics.driftStats.totalGoals}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Drift Detected</h4>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{vigilMetrics.driftStats.driftDetected}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Significant Drift</h4>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{vigilMetrics.driftStats.significantDrift}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render configuration tab
  const renderConfigTab = () => {
    return (
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Governance Configuration</h3>
        
        {/* Config Mode Toggle */}
        <div className="mb-6 flex items-center">
          <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Configuration Mode:</span>
          <button
            onClick={() => setUseLiveData(true)}
            className={`px-3 py-1 text-sm rounded-l-md ${
              useLiveData 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Live Config
          </button>
          <button
            onClick={() => setUseLiveData(false)}
            className={`px-3 py-1 text-sm rounded-r-md ${
              !useLiveData 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Demo Config
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">PRISM Observer Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trace Validation Level</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  value={prismConfig.traceValidationLevel}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, traceValidationLevel: e.target.value});
                    setConfigChanged(true);
                  }}
                >
                  <option value="standard">standard</option>
                  <option value="strict">strict</option>
                  <option value="lenient">lenient</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manifest Validation Level</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  value={prismConfig.manifestValidationLevel}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, manifestValidationLevel: e.target.value});
                    setConfigChanged(true);
                  }}
                >
                  <option value="standard">standard</option>
                  <option value="strict">strict</option>
                  <option value="lenient">lenient</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sampling Rate (%)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={prismConfig.samplingRate}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, samplingRate: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Missing Trace Threshold (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={prismConfig.missingTraceThreshold}
                  onChange={(e) => {
                    setPrismConfig({...prismConfig, missingTraceThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" 
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">VIGIL Observer Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drift Threshold (%)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={vigilConfig.driftThreshold}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, driftThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Significant Drift Threshold (%)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={vigilConfig.significantDriftThreshold}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, significantDriftThreshold: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trust Score Minimum</label>
                <input 
                  type="number" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={vigilConfig.trustScoreMinimum}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, trustScoreMinimum: parseFloat(e.target.value)});
                    setConfigChanged(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unreflected Failure Limit</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={vigilConfig.unreflectedFailureLimit}
                  onChange={(e) => {
                    setVigilConfig({...vigilConfig, unreflectedFailureLimit: parseInt(e.target.value)});
                    setConfigChanged(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              className={`px-4 py-2 ${
                configChanged 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white rounded transition`}
              onClick={handleSaveConfig}
              disabled={!configChanged}
            >
              Save Configuration
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
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('prism')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prism'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              PRISM Observer
            </button>
            <button
              onClick={() => setActiveTab('vigil')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vigil'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              VIGIL Observer
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Configuration
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'prism' && renderPrismTab()}
        {activeTab === 'vigil' && renderVigilTab()}
        {activeTab === 'config' && renderConfigTab()}
      </div>
    </div>
  );
};

export default GovernancePage;
