import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

const initialBenchmarkData = [
  {
    name: 'Trust Score',
    ungoverned: 45,
    governed: 92,
  },
  {
    name: 'Compliance',
    ungoverned: 38,
    governed: 95,
  },
  {
    name: 'Error Rate',
    ungoverned: 65,
    governed: 12,
  },
  {
    name: 'Performance',
    ungoverned: 88,
    governed: 85,
  },
];

const timeSeriesData = [
  { month: 'Jan', trust: 50, compliance: 40, errors: 60 },
  { month: 'Feb', trust: 55, compliance: 45, errors: 55 },
  { month: 'Mar', trust: 65, compliance: 55, errors: 45 },
  { month: 'Apr', trust: 75, compliance: 65, errors: 35 },
  { month: 'May', trust: 85, compliance: 80, errors: 25 },
  { month: 'Jun', trust: 92, compliance: 95, errors: 12 },
];

const CMUBenchmarkDashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Interactive playground state
  const [trustThreshold, setTrustThreshold] = useState(50);
  const [complianceStrictness, setComplianceStrictness] = useState(50);
  const [errorTolerance, setErrorTolerance] = useState(50);
  const [benchmarkData, setBenchmarkData] = useState(initialBenchmarkData);
  const [governanceAnalysis, setGovernanceAnalysis] = useState({
    trustScore: 92,
    complianceRate: 95,
    performanceImpact: 3
  });
  
  // Function to update graphs based on parameter values
  const applyParameters = () => {
    // Calculate new values based on slider positions
    const newTrustScore = Math.min(98, Math.max(85, 85 + (trustThreshold - 50) * 0.25));
    const newComplianceRate = Math.min(99, Math.max(80, 85 + (complianceStrictness - 50) * 0.3));
    const newErrorRate = Math.max(5, Math.min(25, 20 - (errorTolerance - 50) * 0.3));
    
    // Calculate performance impact (inverse relationship with strictness)
    const performanceImpact = Math.max(1, Math.min(15, 
      3 + (trustThreshold - 50) * 0.1 + 
      (complianceStrictness - 50) * 0.15 + 
      (50 - errorTolerance) * 0.1
    ));
    
    // Update benchmark data
    const newBenchmarkData = [
      {
        name: 'Trust Score',
        ungoverned: 45,
        governed: Math.round(newTrustScore),
      },
      {
        name: 'Compliance',
        ungoverned: 38,
        governed: Math.round(newComplianceRate),
      },
      {
        name: 'Error Rate',
        ungoverned: 65,
        governed: Math.round(newErrorRate),
      },
      {
        name: 'Performance',
        ungoverned: 88,
        governed: Math.round(88 - performanceImpact),
      },
    ];
    
    setBenchmarkData(newBenchmarkData);
    setGovernanceAnalysis({
      trustScore: Math.round(newTrustScore),
      complianceRate: Math.round(newComplianceRate),
      performanceImpact: Math.round(performanceImpact)
    });
  };
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-5xl md:text-6xl`}>
            CMU Benchmark Results
          </h1>
          <p className={`mt-3 max-w-md mx-auto text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} sm:text-lg md:mt-5 md:text-xl md:max-w-3xl`}>
            See how Promethios governance improves agent trust, compliance, and error rates with minimal performance impact.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === 'overview'
                  ? `${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === 'comparison'
                  ? `${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              Comparison
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === 'trends'
                  ? `${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === 'playground'
                  ? `${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              Interactive Parameters
            </button>
            <a
              href="/cmu-playground"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-2 font-medium text-sm rounded-md ${isDarkMode ? 'bg-purple-700 text-white hover:bg-purple-600' : 'bg-purple-600 text-white hover:bg-purple-500'} shadow`}
            >
              Interactive Playground
            </a>
          </nav>
        </div>

        {/* Content */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6`}>
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Governance Impact at a Glance
                </h2>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Based on CMU benchmark testing across 500+ agent scenarios
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-purple-500">+104%</span>
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Trust Score Improvement
                    </p>
                  </div>
                </div>
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-purple-500">+150%</span>
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Compliance Rate Increase
                    </p>
                  </div>
                </div>
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-purple-500">-82%</span>
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Error Rate Reduction
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={initialBenchmarkData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <YAxis 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                        color: isDarkMode ? '#F9FAFB' : '#111827'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="ungoverned" name="Ungoverned Agent" fill="#9CA3AF" />
                    <Bar dataKey="governed" name="Promethios Governed" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'comparison' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Detailed Comparison
                </h2>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Side-by-side comparison of governed vs. ungoverned agents
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y divide-gray-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Metric
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Ungoverned
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Governed
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Improvement
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Trust Score</td>
                      <td className="px-6 py-4 whitespace-nowrap">45/100</td>
                      <td className="px-6 py-4 whitespace-nowrap">92/100</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-500">+104%</td>
                    </tr>
                    <tr className={isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">Compliance Rate</td>
                      <td className="px-6 py-4 whitespace-nowrap">38%</td>
                      <td className="px-6 py-4 whitespace-nowrap">95%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-500">+150%</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Error Rate</td>
                      <td className="px-6 py-4 whitespace-nowrap">65%</td>
                      <td className="px-6 py-4 whitespace-nowrap">12%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-500">-82%</td>
                    </tr>
                    <tr className={isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">Performance</td>
                      <td className="px-6 py-4 whitespace-nowrap">88/100</td>
                      <td className="px-6 py-4 whitespace-nowrap">85/100</td>
                      <td className="px-6 py-4 whitespace-nowrap text-yellow-500">-3%</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Integration Time</td>
                      <td className="px-6 py-4 whitespace-nowrap">N/A</td>
                      <td className="px-6 py-4 whitespace-nowrap">Minutes</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-500">60-80% reduction</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Governance Metrics Over Time
                </h2>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tracking improvement as governance is applied
                </p>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <YAxis 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                        color: isDarkMode ? '#F9FAFB' : '#111827'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="trust" name="Trust Score" stroke="#8B5CF6" strokeWidth={2} />
                    <Line type="monotone" dataKey="compliance" name="Compliance Rate" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="errors" name="Error Rate" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timeSeriesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <YAxis 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                        color: isDarkMode ? '#F9FAFB' : '#111827'
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="trust" name="Trust Score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="compliance" name="Compliance Rate" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'playground' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Interactive Governance Playground
                </h2>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Adjust parameters to see how they affect agent performance
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <label className="block text-sm font-medium mb-2">Trust Threshold</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={trustThreshold}
                    onChange={(e) => setTrustThreshold(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs">Low</span>
                    <span className="text-xs">High</span>
                  </div>
                </div>
                
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <label className="block text-sm font-medium mb-2">Compliance Strictness</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={complianceStrictness}
                    onChange={(e) => setComplianceStrictness(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs">Flexible</span>
                    <span className="text-xs">Strict</span>
                  </div>
                </div>
                
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <label className="block text-sm font-medium mb-2">Error Tolerance</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={errorTolerance}
                    onChange={(e) => setErrorTolerance(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs">Low</span>
                    <span className="text-xs">High</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={applyParameters}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Apply Parameters
                </button>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={benchmarkData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <YAxis 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                        color: isDarkMode ? '#F9FAFB' : '#111827'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="ungoverned" name="Ungoverned Agent" fill="#9CA3AF" />
                    <Bar dataKey="governed" name="Promethios Governed" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Governance Analysis
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  With current parameters, your agent would achieve a {governanceAnalysis.trustScore}% trust score and {governanceAnalysis.complianceRate}% compliance rate with only a {governanceAnalysis.performanceImpact}% performance impact. This configuration is optimal for most production environments.
                </p>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <a
            href="/signup"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Start Governing Your Agents
          </a>
        </div>
      </div>
    </div>
  );
};

export default CMUBenchmarkDashboard;
